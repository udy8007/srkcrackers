import sharp from "sharp";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const logo = path.join(root, "public", "logo.png");
const appDir = path.join(root, "src", "app");

await sharp(logo).resize(32, 32, { fit: "cover" }).png().toFile(path.join(appDir, "icon.png"));
await sharp(logo).resize(180, 180, { fit: "cover" }).png().toFile(path.join(appDir, "apple-icon.png"));

// 32×32 PNG wrapped as favicon (works in modern browsers; Next also serves app/icon.png)
const faviconPng = await sharp(logo).resize(32, 32, { fit: "cover" }).png().toBuffer();
writeFileSync(path.join(appDir, "favicon.ico"), faviconPng);

console.log("Generated src/app/icon.png, apple-icon.png, favicon.ico from public/logo.png");
