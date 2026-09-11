"use client";

import { useState } from "react";
import { BUSINESS } from "@/lib/constants";
import { isValidPhone } from "@/lib/utils";
import { useToast } from "@/store/toast";
import { SectionHead } from "./SectionHead";
import { SectionDecor } from "./FestiveDecor";

export function EnquiryForm() {
  const showToast = useToast((s) => s.show);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<{ enquiryNumber: string } | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      showToast("Please enter your name");
      return;
    }
    if (!isValidPhone(phone)) {
      showToast("Please enter a valid 10-digit mobile number");
      return;
    }
    if (message.trim().length < 10) {
      showToast("Please enter your enquiry (at least 10 characters)");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          message: message.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.error ?? "Could not submit enquiry");
        return;
      }
      setSubmitted({ enquiryNumber: data.enquiryNumber });
      setName("");
      setPhone("");
      setEmail("");
      setMessage("");
      showToast("Enquiry submitted successfully!");
    } catch {
      showToast("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="enquiry" className="relative isolate overflow-hidden bg-white px-4 py-14">
      <SectionDecor variant="sparklers" />
      <div className="mx-auto max-w-2xl">
        <SectionHead
          title="Send an Enquiry"
          subtitle="Have a question about products, bulk orders, or delivery? We respond within 2 hours."
        />

        {submitted ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center shadow-sm">
            <p className="text-lg font-semibold text-green-800">Thank you! Your enquiry has been received.</p>
            <p className="mt-2 text-sm text-green-700">
              Reference ID: <strong className="font-mono">{submitted.enquiryNumber}</strong>
            </p>
            <p className="mt-3 text-sm text-green-700">
              Our team will contact you within 2 hours on {BUSINESS.phoneDisplay}.
            </p>
            <button
              type="button"
              className="btn-primary mt-5"
              onClick={() => setSubmitted(null)}
            >
              Submit Another Enquiry
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-line bg-brandbg/40 p-6 shadow-sm"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold text-ink">
                  Your Name <span className="text-red">*</span>
                </span>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  autoComplete="name"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-ink">
                  Mobile Number <span className="text-red">*</span>
                </span>
                <input
                  className="input"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="10-digit mobile"
                  autoComplete="tel"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-ink">Email (optional)</span>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="For resolution update by email"
                  autoComplete="email"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold text-ink">
                  Your Enquiry <span className="text-red">*</span>
                </span>
                <textarea
                  className="input min-h-[120px] resize-y"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about products, quantity, delivery area, or any questions..."
                  maxLength={2000}
                  required
                />
                <span className="mt-1 block text-right text-[11px] text-ink-muted">
                  {message.length}/2000
                </span>
              </label>
            </div>
            <button type="submit" className="btn-primary mt-4 w-full" disabled={loading}>
              {loading ? "Submitting…" : "Submit Enquiry"}
            </button>
            <p className="mt-3 text-center text-xs text-ink-muted">
              You can also call us at{" "}
              <a href={`tel:${BUSINESS.phone}`} className="font-semibold text-primary">
                {BUSINESS.phoneDisplay}
              </a>{" "}
              or WhatsApp anytime.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
