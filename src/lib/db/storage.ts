import { storage as getStorage } from "@/lib/firebase-admin";
import { randomBytes } from "node:crypto";

type UploadOptions = {
  /** When false, returns a long-lived signed URL instead of public GCS URL. */
  isPublic?: boolean;
};

/** Upload a buffer to Firebase Storage; returns a download URL. */
export async function uploadBytes(
  path: string,
  data: Buffer,
  contentType: string,
  options: UploadOptions = {},
): Promise<string> {
  const isPublic = options.isPublic !== false;
  const bucket = (await getStorage()).bucket();
  const [bucketExists] = await bucket.exists();
  if (!bucketExists) {
    throw new Error(
      `Firebase Storage bucket "${bucket.name}" does not exist. Enable Storage in Firebase Console (Blaze plan required): https://console.firebase.google.com/project/srk-cracker/storage — see docs/firebase-migrate.md`,
    );
  }
  const file = bucket.file(path);
  try {
    await file.save(data, {
      metadata: { contentType },
      resumable: false,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (/bucket does not exist|billing account/i.test(msg)) {
      throw new Error(
        `Firebase Storage unavailable (${msg}). Enable Billing + Storage for project srk-cracker. See docs/firebase-migrate.md`,
      );
    }
    throw error;
  }

  if (isPublic) {
    try {
      await file.makePublic();
    } catch {
      /* uniform bucket-level access */
    }
    return `https://storage.googleapis.com/${bucket.name}/${encodeURI(path)}`;
  }

  const [url] = await file.getSignedUrl({
    action: "read",
    expires: "03-01-2500",
  });
  return url;
}

/** Upload a data-URL to Storage. */
export async function uploadDataUrl(
  folder: string,
  dataUrl: string,
  options: UploadOptions = {},
): Promise<string> {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) {
    if (/^https?:\/\//i.test(dataUrl)) return dataUrl;
    throw new Error("Invalid data URL");
  }
  const contentType = match[1] || "application/octet-stream";
  const buffer = Buffer.from(match[2], "base64");
  const ext =
    contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : contentType.includes("gif")
          ? "gif"
          : "jpg";
  const path = `${folder.replace(/\/$/, "")}/${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  return uploadBytes(path, buffer, contentType, options);
}

/** Upload a local public-relative product image when available. */
export async function uploadLocalPublicFile(
  productId: string,
  publicPath: string,
  absoluteFsPath: string,
): Promise<string | null> {
  const fs = await import("node:fs/promises");
  try {
    const data = await fs.readFile(absoluteFsPath);
    const ext = publicPath.split(".").pop() || "jpg";
    const contentType =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : ext === "svg"
            ? "image/svg+xml"
            : "image/jpeg";
    return await uploadBytes(
      `products/${productId}/${Date.now()}.${ext}`,
      data,
      contentType,
      { isPublic: true },
    );
  } catch {
    return null;
  }
}
