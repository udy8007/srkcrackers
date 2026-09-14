export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { warmMasterDataCache } = await import("@/lib/master-data-cache");
    await warmMasterDataCache();
    console.log("[master-data-cache] Catalog master data loaded on startup");
  } catch (error) {
    console.error(
      "[master-data-cache] Startup warmup failed — will load on first catalog request:",
      error,
    );
  }
}
