#!/usr/bin/env python3
"""Upload the cPanel pack over Hostinger explicit FTPS (AUTH TLS, port 21)."""

from __future__ import annotations

import os
import ssl
import sys
from ftplib import FTP, FTP_TLS, error_perm
from pathlib import Path

SKIP_NAMES = {".env", ".env.local", ".env.production", ".env.development", ".DS_Store"}
CLEAN_DIRS = [
    "src",
    "prisma",
    "scripts",
    "cpanel",
    "docs",
    "node_modules",
    "mobile-admin",
    ".github",
    ".next",
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


def connect() -> FTP:
    host = env("FTP_HOST")
    port = int(env("FTP_PORT") or "21")
    user = env("FTP_USERNAME")
    password = env("FTP_PASSWORD")
    protocol = (env("FTP_PROTOCOL") or "ftps").lower()
    if not host or not user or not password:
        raise SystemExit("FTP_HOST, FTP_USERNAME, and FTP_PASSWORD are required")

    if protocol == "ftp":
        ftp: FTP = FTP()
        ftp.connect(host, port, timeout=45)
        ftp.login(user, password)
    else:
        context = ssl._create_unverified_context()
        ftp = FTP_TLS(context=context)
        ftp.connect(host, port, timeout=45)
        ftp.auth()
        ftp.login(user, password)
        ftp.prot_p()

    ftp.set_pasv(True)
    ftp.encoding = "utf-8"
    print(f"Logged in via {protocol} {host}:{port} as {user}")
    print(f"Remote cwd {ftp.pwd()}")
    return ftp


def ftp_exists_dir(ftp: FTP, name: str) -> bool:
    current = ftp.pwd()
    try:
        ftp.cwd(name)
        ftp.cwd(current)
        return True
    except error_perm:
        return False


def rm_tree(ftp: FTP, name: str) -> None:
    current = ftp.pwd()
    try:
        ftp.cwd(name)
    except error_perm:
        try:
            ftp.delete(name)
        except error_perm:
            return
        return
    for entry in ftp.nlst():
        if entry in (".", ".."):
            continue
        rm_tree(ftp, entry)
    ftp.cwd(current)
    try:
        ftp.rmd(name)
        print(f"removed dir {name}")
    except error_perm as exc:
        print(f"skip rmd {name}: {exc}")


def ensure_cwd(ftp: FTP, remote: str) -> None:
    if remote in ("", ".", "./"):
        return
    parts = [part for part in remote.replace("\\", "/").strip("/").split("/") if part]
    for part in parts:
        if not ftp_exists_dir(ftp, part):
            try:
                ftp.mkd(part)
            except error_perm as exc:
                print(f"mkdir {part}: {exc}")
        ftp.cwd(part)
    print(f"Remote cwd {ftp.pwd()}")


def upload_file(ftp: FTP, local: Path, remote_name: str) -> None:
    with local.open("rb") as handle:
        ftp.storbinary(f"STOR {remote_name}", handle)


def upload_tree(ftp: FTP, local_root: Path) -> int:
    count = 0
    root_cwd = ftp.pwd()
    for dirpath, dirnames, filenames in os.walk(local_root):
        rel = Path(dirpath).relative_to(local_root)
        dirnames[:] = [name for name in dirnames if name not in SKIP_NAMES]
        ftp.cwd(root_cwd)
        if rel.parts:
            for part in rel.parts:
                try:
                    ftp.mkd(part)
                except error_perm:
                    pass
                ftp.cwd(part)
        for name in filenames:
            if name in SKIP_NAMES or name.startswith(".env"):
                continue
            upload_file(ftp, Path(dirpath) / name, name)
            count += 1
            if count % 50 == 0:
                print(f"uploaded {count} files...")
    ftp.cwd(root_cwd)
    return count


def cleanup(ftp: FTP) -> None:
    for name in CLEAN_DIRS:
        if ftp_exists_dir(ftp, name):
            rm_tree(ftp, name)
        else:
            try:
                ftp.delete(name)
            except error_perm:
                pass
    for name in CLEAN_FILES:
        try:
            ftp.delete(name)
            print(f"removed file {name}")
        except error_perm:
            pass


def main() -> int:
    local_dir = Path(env("LOCAL_DIR") or "./deploy").resolve()
    if not local_dir.is_dir():
        raise SystemExit(f"Local pack not found: {local_dir}")

    ftp = connect()
    try:
        ensure_cwd(ftp, env("FTP_SERVER_DIR") or "./")
        cleanup(ftp)
        count = upload_tree(ftp, local_dir)
        print(f"Uploaded {count} files from {local_dir}")
    finally:
        try:
            ftp.quit()
        except Exception:
            ftp.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
