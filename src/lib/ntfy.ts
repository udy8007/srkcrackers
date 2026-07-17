import "server-only";
import { resolveSiteOrigin } from "@/lib/email-settings";

const DEFAULT_TOPIC = "udyilangovan";
const NTFY_BASE = "https://ntfy.sh";

export type NtfySendInput = {
  title: string;
  message: string;
  tags?: string[];
  priority?: "min" | "low" | "default" | "high" | "max";
  iconUrl?: string;
};

function resolveTopic() {
  return process.env.NTFY_TOPIC?.trim() || DEFAULT_TOPIC;
}

/** Send a push notification via ntfy.sh. Never throws. */
export async function sendNtfyNotification(
  input: NtfySendInput,
): Promise<{ ok: boolean; error?: string }> {
  const topic = resolveTopic();
  const origin = resolveSiteOrigin();
  const iconUrl = input.iconUrl ?? `${origin}/logo.png`;

  const headers: Record<string, string> = {
    Title: input.title.slice(0, 250),
    "X-Icon": iconUrl,
    "Content-Type": "text/plain; charset=utf-8",
  };

  if (input.tags?.length) {
    headers.Tags = input.tags.join(",");
  }
  if (input.priority) {
    headers.Priority = input.priority;
  }

  try {
    const res = await fetch(`${NTFY_BASE}/${topic}`, {
      method: "POST",
      headers,
      body: input.message,
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: text || `ntfy responded ${res.status}` };
    }

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "ntfy request failed";
    console.error("[ntfy] Send failed:", message);
    return { ok: false, error: message };
  }
}

export type BugReportInput = {
  reporterName: string;
  reporterEmail: string;
  area: string;
  description: string;
  steps?: string;
  severity?: string;
  pageUrl?: string;
};

export function buildBugReportNtfy(input: BugReportInput) {
  const area = input.area.trim() || "General";
  const severity = input.severity?.trim() || "Medium";
  const steps = input.steps?.trim();

  const title = `SRK Admin — Bug on ${area}`;
  const lines = [
    `${input.reporterName} (${input.reporterEmail}) reported a problem in the ${area} section.`,
    "",
    `Severity: ${severity}`,
    input.pageUrl ? `Page: ${input.pageUrl}` : null,
    "",
    "What went wrong:",
    input.description.trim(),
    steps
      ? ["", "Steps to reproduce:", steps].join("\n")
      : null,
    "",
    "Please review this report in the admin portal when you can.",
  ].filter((line): line is string => line !== null);

  return {
    title,
    message: lines.join("\n"),
    tags: ["bug", "warning"],
    priority: severity === "High" ? ("high" as const) : ("default" as const),
  };
}
