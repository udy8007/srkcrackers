import { createPrismaClient } from "../src/lib/create-prisma-client";

const prisma = createPrismaClient();

/** Delete all orders and related rows (keeps products, categories, admin, visits). */
async function main() {
  console.log("Clearing all orders...");

  const history = await prisma.orderStatusHistory.deleteMany();
  const items = await prisma.orderItem.deleteMany();
  const orders = await prisma.order.deleteMany();

  console.log(`✓ OrderStatusHistory: ${history.count}`);
  console.log(`✓ OrderItem: ${items.count}`);
  console.log(`✓ Order: ${orders.count}`);
  console.log("All orders cleared.");
}

main()
  .catch((error) => {
    console.error("Clear orders failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
