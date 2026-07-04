import { Suspense } from "react";
import Image from "next/image";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Admin Login — SRK Crackers",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary to-primary-dark px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <Image
            src="/logo.png"
            alt="SRK Crackers logo"
            width={64}
            height={64}
            priority
            className="mx-auto h-16 w-16 rounded-full ring-2 ring-primary/30 shadow-md"
          />
          <h1 className="mt-3 font-display text-2xl font-bold text-primary">SRK Crackers</h1>
          <p className="text-sm text-ink-muted">Admin Dashboard Login</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
