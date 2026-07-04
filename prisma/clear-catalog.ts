import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Remove all products and categories (orders/admin/visits are kept). */
async function main() {
  console.log("Clearing product catalog...");

  const products = await prisma.product.deleteMany();
  const categories = await prisma.category.deleteMany();

  console.log(`✓ Deleted ${products.count} products, ${categories.count} categories`);
}

main()
  .catch((error) => {
    console.error("Catalog clear failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
