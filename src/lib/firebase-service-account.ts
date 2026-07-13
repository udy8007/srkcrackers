/** Shared Firebase service-account JSON validation (client + server). */

export type ServiceAccountJson = {
  type?: string;
  project_id?: string;
  client_email?: string;
  private_key?: string;
  [key: string]: unknown;
};

export function parseAndValidateServiceAccount(raw: string):
  | { ok: true; json: ServiceAccountJson; serialized: string }
  | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      error: "Not valid JSON. Paste the full file contents starting with { and ending with }.",
    };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "JSON must be an object." };
  }

  const obj = parsed as ServiceAccountJson;
  const hay = JSON.stringify(obj).toLowerCase();

  // google-services.json (Android client)
  if (
    obj.configuration_version != null ||
    obj.client != null ||
    obj.project_info != null ||
    hay.includes("mobilesdk_app_id") ||
    hay.includes("android_client_info") ||
    hay.includes("package_name")
  ) {
    return {
      ok: false,
      error:
        "Wrong file: that is google-services.json (for the APK only). You need the Service Account key: Firebase Console → Project settings → Service accounts → Generate new private key. It must contain private_key and client_email.",
    };
  }

  if (obj.type && obj.type !== "service_account") {
    return { ok: false, error: `Expected type "service_account", got "${String(obj.type)}".` };
  }

  if (!obj.project_id || !obj.client_email || !obj.private_key) {
    return {
      ok: false,
      error:
        'Wrong JSON. Service account must include "type":"service_account", "project_id", "client_email", and "private_key".',
    };
  }

  if (!String(obj.private_key).includes("PRIVATE KEY")) {
    return {
      ok: false,
      error: "private_key looks invalid. Use the JSON downloaded from Generate new private key.",
    };
  }

  return {
    ok: true,
    json: obj,
    serialized: JSON.stringify(obj),
  };
}
