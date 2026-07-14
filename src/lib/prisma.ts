/**
 * Firestore-backed data client (replaces Prisma / Neon).
 * Existing callers keep `import { prisma } from "@/lib/prisma"`.
 */
import { firestoreDb } from "@/lib/db/client";

export const prisma = firestoreDb;

export * from "@/lib/db/types";
