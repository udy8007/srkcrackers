import { ReportsClient } from "./ReportsClient";
import { ReportEmailSettingsForm } from "./ReportEmailSettingsForm";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <ReportsClient />
      <ReportEmailSettingsForm />
    </div>
  );
}
