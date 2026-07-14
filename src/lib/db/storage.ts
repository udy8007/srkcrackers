/**
 * Image persistence without object storage.
 * Data URLs and local public paths are stored as-is on Order / Product rows.
 */

type UploadOptions = {
  /** Kept for call-site compatibility; ignored (no remote bucket). */
  isPublic?: boolean;
};

/** Pass through buffer uploads as a data URL (no Firebase Storage). */
export async function uploadBytes(
  _path: string,
  data: Buffer,
  contentType: string,
  _options: UploadOptions = {},
): Promise<string> {
  return `data:${contentType};base64,${data.toString("base64")}`;
}

/**
 * Persist a data URL or remote/local path for the database.
 * No Firebase Storage / Blaze billing required.
 */
export async function uploadDataUrl(
  _folder: string,
  dataUrl: string,
  _options: UploadOptions = {},
): Promise<string> {
  if (/^data:/i.test(dataUrl)) return dataUrl;
  if (/^https?:\/\//i.test(dataUrl)) return dataUrl;
  if (dataUrl.startsWith("/")) return dataUrl;
  throw new Error("Invalid data URL");
}

/** Prefer existing local public product image paths. */
export async function uploadLocalPublicFile(
  _productId: string,
  publicPath: string,
  _absoluteFsPath: string,
): Promise<string | null> {
  if (!publicPath?.trim()) return null;
  return publicPath.startsWith("/") ? publicPath : `/${publicPath}`;
}
