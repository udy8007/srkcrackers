import "server-only";

/**
 * When true (local `.env.local`), skip real email + FCM push.
 * In-app admin bell notifications still work on whatever DB you are using.
 */
export function outboundNotificationsDisabled(): boolean {
  const value = process.env.DISABLE_OUTBOUND_NOTIFICATIONS?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}
