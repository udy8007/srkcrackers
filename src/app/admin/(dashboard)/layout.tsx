import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminShell } from "./AdminShell";

export const metadata = {
  title: "Admin — SRK Crackers",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  return (
    <AdminShell name={session.user.name ?? "Admin"} email={session.user.email ?? ""}>
      {children}
    </AdminShell>
  );
}
