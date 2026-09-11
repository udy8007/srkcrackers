"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function EnquiryActions(props: {
  enquiryId: string;
  enquiryNumber: string;
  status: "PENDING" | "RESOLVED";
  adminNote: string | null;
}) {
  const router = useRouter();
  const [adminNote, setAdminNote] = useState(props.adminNote ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resolve = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/enquiries/${props.enquiryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "RESOLVED",
          adminNote: adminNote.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not update enquiry.");
        return;
      }
      setSuccess("Enquiry marked as resolved. Customer will be emailed if email was provided.");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const reopen = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/enquiries/${props.enquiryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PENDING" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not update enquiry.");
        return;
      }
      setSuccess("Enquiry reopened as pending.");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-ink">Admin Actions</h2>
      <label className="mt-4 block text-xs font-semibold text-ink">
        Response note (sent to customer email when resolved)
        <textarea
          className="input mt-1 min-h-[100px] resize-y"
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          placeholder="Optional reply or resolution summary for the customer"
          disabled={props.status === "RESOLVED"}
        />
      </label>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-3 text-sm text-green-700">{success}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {props.status === "PENDING" ? (
          <button type="button" className="btn-primary" disabled={loading} onClick={resolve}>
            {loading ? "Saving…" : "Mark as Resolved"}
          </button>
        ) : (
          <button type="button" className="btn-outline" disabled={loading} onClick={reopen}>
            {loading ? "Saving…" : "Reopen as Pending"}
          </button>
        )}
      </div>
    </div>
  );
}
