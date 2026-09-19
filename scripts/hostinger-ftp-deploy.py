#!/usr/bin/env python3
"""Upload the cPanel pack over Hostinger explicit FTPS (AUTH TLS, port 21)."""

from __future__ import annotations

import os
import ssl
import sys
import time
from ftplib import FTP, FTP_TLS, error_perm, error_temp
from pathlib import Path

SKIP_NAMES = {".env", ".env.local", ".env.production", ".env.development", ".DS_Store", ".ftpquota"}
# Do not recursively delete .next / node_modules — Hostinger drops FTPS on huge trees.
CLEAN_DIRS = [
    "src",
    "prisma",
    "scripts",
    "cpanel",
    "docs",
    "mobile-admin",
    ".github",
    ".git",
    ".vercel",
    "backups",
    "coverage",
    "out",
    "build",
]
CLEAN_FILES = [
    "next.config.ts",
    "next.config.js",
    "next.config.mjs",
    "tsconfig.json",
    "eslint.config.mjs",
    "postcss.config.mjs",
    "vercel.json",
    "README.md",
    "package-lock.json",
    "next.zip",
    "server.zip",
]


def env(name: str, default: str = "") -> str:
    return (os.environ.get(name) or default).strip()


class HostingerFtp:
    def __init__(self) -> None:
        self.host = env("FTP_HOST")
        self.port = int(env("FTP_PORT") or "21")
        self.user = env("FTP_USERNAME")
        self.password = env("FTP_PASSWORD")
        self.protocol = (env("FTP_PROTOCOL") or "ftps").lower()
        self.remote_root = env("FTP_SERVER_DIR") or "./"
        self.ftp: FTP | None = None
        self.ops = 0
        if not self.host or not self.user or not self.password:
            raise SystemExit("FTP_HOST, FTP_USERNAME, and FTP_PASSWORD are required")

    def connect(self) -> FTP:
        if self.ftp:
            try:
                self.ftp.close()
            except Exception:
                pass
        if self.protocol == "ftp":
            ftp: FTP = FTP()
            ftp.connect(self.host, self.port, timeout=300)
            ftp.login(self.user, self.password)
        else:
            context = ssl._create_unverified_context()
            ftp = FTP_TLS(context=context)
            ftp.connect(self.host, self.port, timeout=300)
            ftp.auth()
            ftp.login(self.user, self.password)
            ftp.prot_p()
        ftp.set_pasv(True)
        ftp.encoding = "utf-8"
        self.ftp = ftp
        self.ops = 0
        self._goto_root()
        print(f"Logged in via {self.protocol} {self.host}:{self.port} as {self.user}")
        print(f"Remote cwd {ftp.pwd()}")
        return ftp

    def client(self) -> FTP:
        if self.ftp is None:
            self.connect()
        assert self.ftp is not None
        return self.ftp

    def _goto_root(self) -> None:
        ftp = self.client()
        ftp.cwd("/")
        if self.remote_root in ("", ".", "./"):
            return
        parts = [part for part in self.remote_root.replace("\\", "/").strip("/").split("/") if part]
        for part in parts:
            try:
                ftp.mkd(part)
            except error_perm:
                pass
            ftp.cwd(part)

    def alive(self) -> None:
        try:
            self.client().voidcmd("NOOP")
            self.ops += 1
        except Exception:
            print("FTPS session dropped; reconnecting")
            self.connect()

    def retry(self, action, tries: int = 4):
        last: Exception | None = None
        for attempt in range(1, tries + 1):
            try:
                if self.ops > 80:
                    self.alive()
                return action()
            except (EOFError, OSError, TimeoutError, error_temp, ConnectionError) as exc:
                last = exc
                print(f"FTP retry {attempt}/{tries}: {type(exc).__name__}: {exc}")
                time.sleep(min(attempt * 2, 8))
                self.connect()
        assert last is not None
        raise last

    def exists_dir(self, name: str) -> bool:
        def go() -> bool:
            ftp = self.client()
            current = ftp.pwd()
            try:
                ftp.cwd(name)
                ftp.cwd(current)
                return True
            except error_perm:
                return False

        return bool(self.retry(go))

    def delete_file(self, name: str) -> None:
        def go() -> None:
            try:
                self.client().delete(name)
                print(f"removed file {name}")
            except error_perm:
                pass

        self.retry(go)

    def rm_tree(self, name: str, depth: int = 0) -> None:
        if name in (".", "..", ".ftpquota") or name.startswith(".env"):
            return
        if depth > 12:
            return

        def enter() -> str | None:
            ftp = self.client()
            current = ftp.pwd()
            try:
                ftp.cwd(name)
                return current
            except error_perm:
                try:
                    ftp.delete(name)
                except error_perm:
                    pass
                return None

        current = self.retry(enter)
        if current is None:
            return

        def listing() -> list[str]:
            names = []
            for entry in self.client().nlst():
                base = entry.replace("\\", "/").rstrip("/").split("/")[-1]
                if base not in (".", "..", name):
                    names.append(base)
            return names

        try:
            entries = self.retry(listing)
        except Exception as exc:
            print(f"skip listing {name}: {exc}")
            entries = []
        for entry in entries:
            self.rm_tree(entry, depth + 1)

        def leave_and_rmd() -> None:
            ftp = self.client()
            ftp.cwd(current)
            ftp.rmd(name)
            print(f"removed dir {name}")

        try:
            self.retry(leave_and_rmd)
        except error_perm as exc:
            print(f"skip rmd {name}: {exc}")
            try:
                self.client().cwd(current)
            except Exception:
                self.connect()

    def cleanup(self) -> None:
        for name in CLEAN_DIRS:
            if self.exists_dir(name):
                print(f"removing leftover {name}")
                self.rm_tree(name)
            else:
                self.delete_file(name)
        for name in CLEAN_FILES:
            self.delete_file(name)

    def upload_file(self, local: Path, remote_name: str) -> None:
        size = local.stat().st_size
        print(f"uploading {remote_name} ({size / (1024 * 1024):.1f} MB)")

        def go() -> None:
            sent = 0
            last_mark = 0

            def progress(chunk: bytes) -> None:
                nonlocal sent, last_mark
                sent += len(chunk)
                if size < 1024 * 1024:
                    return
                if sent - last_mark >= 5 * 1024 * 1024 or sent >= size:
                    last_mark = sent
                    pct = min(sent, size) / size * 100
                    print(f"  {remote_name} {pct:.0f}%")

            with local.open("rb") as handle:
                self.client().storbinary(
                    f"STOR {remote_name}",
                    handle,
                    blocksize=256 * 1024,
                    callback=progress,
                )

        self.retry(go)

    def ensure_dir(self, name: str) -> None:
        def go() -> None:
            try:
                self.client().mkd(name)
            except error_perm:
                pass

        self.retry(go)

    def upload_pack(self, local_dir: Path, archive: Path | None) -> None:
        self._goto_root()
        if archive is not None:
            self.upload_file(archive, "pack.tar.gz")
            self._goto_root()
        self.upload_file(local_dir / "server.js", "server.js")
        package_json = local_dir / "package.json"
        if package_json.exists():
            self.upload_file(package_json, "package.json")
        env_file = local_dir / ".env"
        if env_file.exists():
            self.upload_file(env_file, ".env")
            print("uploaded runtime .env from GitHub secrets")
        htaccess = local_dir / ".htaccess"
        if htaccess.exists():
            self.upload_file(htaccess, ".htaccess")
        self.ensure_dir("tmp")

        def into_tmp() -> None:
            self._goto_root()
            self.client().cwd("tmp")

        self.retry(into_tmp)
        restart = local_dir / "tmp" / "restart.txt"
        if restart.exists():
            self.upload_file(restart, "restart.txt")
        self._goto_root()

    def close(self) -> None:
        if not self.ftp:
            return
        try:
            self.ftp.quit()
        except Exception:
            try:
                self.ftp.close()
            except Exception:
                pass
        self.ftp = None


def main() -> int:
    local_dir = Path(env("LOCAL_DIR") or "./deploy").resolve()
    skip_archive = env("SKIP_ARCHIVE") in {"1", "true", "yes"}
    archive = Path(env("ARCHIVE_PATH") or str(local_dir.parent / "pack.tar.gz")).resolve()
    if not local_dir.is_dir():
        raise SystemExit(f"Local pack not found: {local_dir}")
    if skip_archive:
        archive_path = None
    else:
        if not archive.is_file():
            raise SystemExit(f"Archive not found: {archive}")
        archive_path = archive

    session = HostingerFtp()
    session.connect()
    try:
        session.upload_pack(local_dir, archive_path)
        if skip_archive:
            print("Uploaded startup files without pack archive")
        else:
            print(f"Uploaded pack archive {archive.name} ({archive.stat().st_size / (1024 * 1024):.1f} MB)")
    finally:
        session.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
