/** URL-safe slug from product name. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[″"']/g, "in")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
