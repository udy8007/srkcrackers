import { ChangePasswordForm } from "./ChangePasswordForm";
import { EmailSettingsForm } from "./EmailSettingsForm";
import { BackupSettingsForm } from "./BackupSettingsForm";
import { SchedulerSettingsForm } from "./SchedulerSettingsForm";

export const metadata = {
  title: "Settings — SRK Admin",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Settings</h1>
        <p className="text-sm text-ink-muted">Manage account, email notifications, database backup, and SMTP</p>
      </div>

      <EmailSettingsForm />

      <SchedulerSettingsForm />

      <BackupSettingsForm />

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
