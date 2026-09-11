import Link from "next/link";
import { notFound } from "next/navigation";
import { ENQUIRY_STATUS_LABEL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { EnquiryActions } from "./EnquiryActions";

export const dynamic = "force-dynamic";

export default async function AdminEnquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const enquiry = await prisma.enquiry.findUnique({ where: { id } });
  if (!enquiry) notFound();

  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin/enquiries" className="text-sm font-semibold text-primary hover:underline">
          ← Back to Enquiries
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold text-primary">Enquiry Details</h1>
        <p className="mt-1 break-all font-mono text-sm text-ink-muted">{enquiry.enquiryNumber}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-ink">Customer</h2>
              <span
                className={
                  enquiry.status === "PENDING"
                    ? "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800"
                    : "rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800"
                }
              >
                {ENQUIRY_STATUS_LABEL[enquiry.status]}
              </span>
            </div>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase text-ink-muted">Name</dt>
                <dd>{enquiry.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-ink-muted">Phone</dt>
                <dd>
                  <a href={`tel:${enquiry.phone}`} className="text-primary hover:underline">
                    {enquiry.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-ink-muted">Email</dt>
                <dd>{enquiry.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-ink-muted">Submitted</dt>
                <dd>{formatDateTime(enquiry.createdAt.toISOString())}</dd>
              </div>
              {enquiry.resolvedAt && (
                <div>
                  <dt className="text-xs font-semibold uppercase text-ink-muted">Resolved</dt>
                  <dd>{formatDateTime(enquiry.resolvedAt.toISOString())}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-ink">Message</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
              {enquiry.message}
            </p>
          </div>

          {enquiry.adminNote && (
            <div className="rounded-xl border border-line bg-brandbg/40 p-5 shadow-sm">
              <h2 className="font-semibold text-ink">Admin Response</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
                {enquiry.adminNote}
              </p>
            </div>
          )}
        </div>

        <EnquiryActions
          enquiryId={enquiry.id}
          enquiryNumber={enquiry.enquiryNumber}
          status={enquiry.status}
          adminNote={enquiry.adminNote}
        />
      </div>
    </div>
  );
}
