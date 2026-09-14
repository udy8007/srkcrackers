import { prisma } from "@/lib/prisma";
import type { Category, Product } from "@/lib/db/types";

/** In-memory snapshot of active catalog master data (categories + products). */
export interface MasterDataSnapshot {
  categories: Category[];
  products: Product[];
  categoryById: Map<string, Category>;
  categoryByKey: Map<string, Category>;
  loadedAt: number;
}

const globalForCache = globalThis as unknown as {
  masterDataSnapshot?: MasterDataSnapshot | null;
  masterDataLoadPromise?: Promise<MasterDataSnapshot> | null;
};

async function fetchMasterDataFromDb(): Promise<MasterDataSnapshot> {
  const [categories, products] = (await Promise.all([
    prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
  ])) as [Category[], Product[]];

  return {
    categories,
    products,
    categoryById: new Map(categories.map((category) => [category.id, category])),
    categoryByKey: new Map(categories.map((category) => [category.key, category])),
    loadedAt: Date.now(),
  };
}

/** Load or return the cached master-data snapshot (lazy on first use). */
export async function getMasterDataSnapshot(): Promise<MasterDataSnapshot> {
  if (globalForCache.masterDataSnapshot) {
    return globalForCache.masterDataSnapshot;
  }

  if (!globalForCache.masterDataLoadPromise) {
    globalForCache.masterDataLoadPromise = fetchMasterDataFromDb()
      .then((snapshot) => {
        globalForCache.masterDataSnapshot = snapshot;
        return snapshot;
      })
      .finally(() => {
        globalForCache.masterDataLoadPromise = null;
      });
  }

  return globalForCache.masterDataLoadPromise;
}

/** Reload master data from the database and replace the in-memory snapshot. */
export async function syncMasterDataCache(): Promise<MasterDataSnapshot> {
  const snapshot = await fetchMasterDataFromDb();
  globalForCache.masterDataSnapshot = snapshot;
  return snapshot;
}

/** Warm the cache at application startup. */
export async function warmMasterDataCache(): Promise<MasterDataSnapshot> {
  return syncMasterDataCache();
}
