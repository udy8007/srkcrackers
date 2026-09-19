/** Partial string match (MySQL collation is typically case-insensitive). */
export function sqliteContains(value: string) {
  return { contains: value };
}
