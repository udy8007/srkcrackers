import { ChangePasswordForm } from "./ChangePasswordForm";

export const metadata = {
  title: "Settings — SRK Admin",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Settings</h1>
        <p className="text-sm text-ink-muted">Manage your admin account</p>
      </div>

      <section className="max-w-xl rounded-xl border border-line bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-ink">Change Password</h2>
        <p className="mt-1 mb-5 text-sm text-ink-muted">
          Update your login password. You will stay signed in after changing it.
        </p>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
