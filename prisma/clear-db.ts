import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Delete all application data (keeps table schema). Order respects foreign keys. */
async function main() {
  console.log("Clearing all SRK Crackers database data...");

  const results: Record<string, number> = {};

  async function del(label: string, fn: () => Promise<{ count: number }>) {
    try {
      const r = await fn();
      results[label] = r.count;
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === "P2021") {
        results[label] = 0;
        console.log(`↷ ${label}: table not present — skipped`);
        return;
      }
      throw e;
    }
  }

  await del("OrderStatusHistory", () => prisma.orderStatusHistory.deleteMany());
  await del("OrderItem", () => prisma.orderItem.deleteMany());
  await del("Order", () => prisma.order.deleteMany());
  await del("SiteVisit", () => prisma.siteVisit.deleteMany());
  await del("Product", () => prisma.product.deleteMany());
  await del("Category", () => prisma.category.deleteMany());
  await del("AdminUser", () => prisma.adminUser.deleteMany());

  for (const [label, count] of Object.entries(results)) {
    console.log(`✓ ${label}: ${count}`);
  }
  console.log("Database cleared.");
}

main()
  .catch((error) => {
    console.error("Clear failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
