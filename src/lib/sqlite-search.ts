/** Partial string match for Turso/SQLite (Prisma `contains`; LIKE is case-insensitive for ASCII). */
export function sqliteContains(value: string) {
  return { contains: value };
}
