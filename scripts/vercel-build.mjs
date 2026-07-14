// Vercel build — Firebase-backed app (no Neon / prisma db push).
import { execSync } from "node:child_process";

function run(cmd) {
  console.log(`\n[vercel-build] $ ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: process.env });
}

if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) {
  console.warn(
    "[vercel-build] WARNING: FIREBASE_SERVICE_ACCOUNT_JSON is not set. Runtime Firestore/Storage/FCM will fail until it is configured.",
  );
}

run("npx next build");
