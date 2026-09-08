/**
 * Quick SMTP test — run: npx tsx scripts/test-smtp.ts udyilangovan@gmail.com
 * Uses EmailSettings from database. Set password in admin portal first.
 */
import { createPrismaClient } from "../src/lib/create-prisma-client";
import nodemailer from "nodemailer";

const to = process.argv[2] ?? "udyilangovan@gmail.com";
const prisma = createPrismaClient();

async function main() {
  const settings = await prisma.emailSettings.findUnique({ where: { id: "default" } });
  if (!settings) {
    console.error("No email settings in database.");
    process.exit(1);
  }

  console.log("Host:", settings.host);
  console.log("Port:", settings.port);
  console.log("User:", settings.username);
  console.log("Password saved:", Boolean(settings.password));
  console.log("To:", to);

  if (!settings.host || !settings.username || !settings.password) {
    console.error("SMTP not fully configured in database.");
    process.exit(1);
  }

  const port = settings.port || 465;
  const transport = nodemailer.createTransport({
    host: settings.host,
    port,
    secure: port === 465,
    auth: { user: settings.username, pass: settings.password },
    ...(port === 587 ? { requireTLS: true } : {}),
    tls: { minVersion: "TLSv1.2" },
  });

  console.log("Verifying SMTP...");
  await transport.verify();
  console.log("SMTP verify OK");

  const info = await transport.sendMail({
    from: `"${settings.fromName}" <${settings.fromEmail || settings.username}>`,
    to,
    subject: `SRK Crackers SMTP test — ${new Date().toISOString()}`,
    html: "<p>If you received this, SMTP is working.</p>",
  });

  console.log("Sent:", info.messageId);
  console.log("Response:", info.response);
}

main()
  .catch((error) => {
    console.error("SMTP test failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
