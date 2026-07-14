import { readFileSync } from "node:fs";
import { GoogleAuth } from "google-auth-library";

async function main() {
  const sa = JSON.parse(readFileSync(".firebase-service-account.json", "utf8")) as {
    client_email: string;
    private_key: string;
  };
  const auth = new GoogleAuth({
    credentials: {
      client_email: sa.client_email,
      private_key: sa.private_key.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const token = (await client.getAccessToken()).token;
  if (!token) throw new Error("No token");

  for (const svc of [
    "firebasestorage.googleapis.com",
    "storage.googleapis.com",
    "firestore.googleapis.com",
  ]) {
    const url = `https://serviceusage.googleapis.com/v1/projects/srk-cracker/services/${svc}:enable`;
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(svc, res.status, (await res.text()).slice(0, 200));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
