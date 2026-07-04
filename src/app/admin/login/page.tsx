import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Admin Login — SRK Crackers",
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary to-primary-dark px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow text-3xl">
            🎆
          </span>
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
