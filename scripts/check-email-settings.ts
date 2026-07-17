import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const s = await prisma.emailSettings.findUnique({ where: { id: "default" } });
  console.log(
    JSON.stringify(
      {
        found: Boolean(s),
        host: s?.host,
        port: s?.port,
        username: s?.username,
        hasPassword: Boolean(s?.password),
        passwordLen: s?.password?.length ?? 0,
        fromEmail: s?.fromEmail,
        enabled: s?.enabled,
      },
      null,
      2,
    ),
  );

  const logs = await prisma.emailLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { trigger: true, recipient: true, status: true, error: true, createdAt: true },
  });
  console.log("\nRecent email logs:");
  console.log(JSON.stringify(logs, null, 2));
}

main()
  .finally(() => prisma.$disconnect());
