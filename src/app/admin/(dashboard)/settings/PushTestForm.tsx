"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  describePushBridge,
  readBridgeToken,
  registerAdminFcmToken,
} from "@/components/admin/AdminPushRegistrar";
import { parseAndValidateServiceAccount } from "@/lib/firebase-service-account";

async function readFileText(file: File): Promise<string> {
  if (typeof file.text === "function") {
    return file.text();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
    reader.readAsText(file);
  });
}

export function PushTestForm() {
  const [deviceCount, setDeviceCount] = useState<number | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [pasteJson, setPasteJson] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [bridge, setBridge] = useState(() => ({
    hasToken: false,
    tokenPreview: null as string | null,
    bridgesFound: [] as string[],
    bridgeMethods: [] as string[],
    hint: "",
  }));

  const refreshBridge = useCallback(() => {
    setBridge(describePushBridge());
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/push/test");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load push status");
        return;
      }
      setDeviceCount(data.deviceCount ?? 0);
      setConfigured(Boolean(data.configured));
      setProjectId(typeof data.projectId === "string" ? data.projectId : null);
      setSource(typeof data.source === "string" ? data.source : null);
    } catch {
      setError("Network error while loading push status");
    } finally {
      refreshBridge();
    }
  }, [refreshBridge]);

  useEffect(() => {
    void refreshStatus();
    const id = window.setInterval(refreshBridge, 3000);
    return () => window.clearInterval(id);
  }, [refreshStatus, refreshBridge]);

  const saveServiceAccountJson = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setError("Paste or choose a Firebase service account JSON file first.");
      setMessage(null);
      return;
    }

    const localCheck = parseAndValidateServiceAccount(trimmed);
    if (!localCheck.ok) {
      setError(localCheck.error);
      setMessage(null);
      return;
    }

    setUploading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings/firebase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceAccountJson: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? `Save failed (HTTP ${res.status})`);
        setMessage(null);
        return;
      }
      setPasteJson("");
      setConfigured(true);
      setSource("database");
      if (typeof data.projectId === "string") setProjectId(data.projectId);
      setError(null);
      setMessage(data.message ?? `Saved for project ${data.projectId ?? ""}.`);
      await refreshStatus();
    } catch {
      setError("Network error while saving service account");
      setMessage(null);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await readFileText(file);
      setPasteJson(text);
      await saveServiceAccountJson(text);
    } catch {
      setError("Could not read that file. Paste the JSON below instead.");
    }
  };

  const clearServiceAccount = async () => {
    if (!confirm("Remove the uploaded Firebase service account from the database?")) return;
    setUploading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings/firebase", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not clear credentials");
        return;
      }
      setMessage(data.message ?? "Cleared.");
      setConfigured(false);
      setProjectId(null);
      setSource(null);
      await refreshStatus();
    } catch {
      setError("Network error while clearing credentials");
    } finally {
      setUploading(false);
    }
  };

  const sendTest = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const liveToken = readBridgeToken()?.trim() || manualToken.trim() || undefined;
      const res = await fetch("/api/admin/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(liveToken ? { token: liveToken } : {}),
      });
      const data = await res.json();
      if (typeof data.deviceCount === "number") setDeviceCount(data.deviceCount);
      if (typeof data.projectId === "string") setProjectId(data.projectId);
      if (!res.ok || data.ok === false) {
        setError(data.error ?? "Test push failed");
        return;
      }
      setMessage(data.message ?? `Sent to ${data.sent} device(s)`);
      await refreshStatus();
    } catch {
      setError("Network error while sending test push");
    } finally {
      setLoading(false);
    }
  };

  const registerToken = async (sourceKind: "bridge" | "manual") => {
    setRegistering(true);
    setMessage(null);
    setError(null);
    refreshBridge();

    const token =
      sourceKind === "manual"
        ? manualToken.trim()
        : readBridgeToken()?.trim() || manualToken.trim();

    if (!token) {
      setRegistering(false);
      setError(
        sourceKind === "manual"
          ? "Paste an FCM token in the box first."
          : "No FCM token on this device yet. The APK must inject it, or paste a token below.",
      );
      return;
    }

    const result = await registerAdminFcmToken(token);
    setRegistering(false);
    if (!result.ok) {
      setError(result.error ?? "Could not register token");
      return;
    }
    setMessage("Token registered. Registered devices should increase after refresh.");
    if (sourceKind === "manual") setManualToken("");
    await refreshStatus();
  };

  return (
    <section className="max-w-xl rounded-xl border border-line bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-ink">Push notifications (APK)</h2>
      <p className="mt-1 mb-4 text-sm text-ink-muted">
        Upload the Firebase <strong>service account</strong> key (Service accounts → Generate new
        private key). Not <code className="text-xs">google-services.json</code>.
      </p>

      <div className="mb-4 space-y-3 rounded-lg border border-line bg-brandbg/50 p-3">
        <div className="text-xs font-semibold text-ink">Firebase service account JSON</div>
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <strong>Wrong file = not saved.</strong> Do not use <code>google-services.json</code>{" "}
          (has <code>mobilesdk_app_id</code> / <code>package_name</code>).
          Download from Firebase → Project settings → <strong>Service accounts</strong> →{" "}
          <strong>Generate new private key</strong>. That file has <code>private_key</code> and{" "}
          <code>client_email</code>.
        </p>

        {error && (
          <p className="rounded-md border border-red/30 bg-red/5 px-3 py-2 text-sm font-medium text-red">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-md border border-green/30 bg-green/5 px-3 py-2 text-sm font-medium text-green">
            {message}
          </p>
        )}

        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json,text/json,text/plain"
          className="hidden"
          onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
          disabled={uploading}
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn-primary w-full disabled:opacity-50 sm:w-auto"
        >
          {uploading ? "Saving…" : "Choose JSON file"}
        </button>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-ink">
            Or paste service account JSON here (recommended on APK)
          </label>
          <textarea
            value={pasteJson}
            onChange={(e) => setPasteJson(e.target.value)}
            rows={5}
            placeholder='{"type":"service_account","project_id":"srk-cracker","private_key":"-----BEGIN PRIVATE KEY-----...","client_email":"...@srk-cracker.iam.gserviceaccount.com"}'
            className="input min-h-[7rem] w-full font-mono text-[0.7rem]"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => void saveServiceAccountJson(pasteJson)}
            disabled={uploading || !pasteJson.trim()}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {uploading ? "Saving…" : "Save service account"}
          </button>
        </div>

        {configured && source === "database" && (
          <button
            type="button"
            onClick={() => void clearServiceAccount()}
            disabled={uploading}
            className="rounded-lg border border-red/30 bg-red/5 px-3 py-2 text-sm font-semibold text-red disabled:opacity-50"
          >
            Remove saved key
          </button>
        )}

        <p className="text-[0.7rem] text-ink-muted">
          Saved in your database (admin-only). Project should be <strong>srk-cracker</strong>.
        </p>
      </div>

      <dl className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-lg bg-brandbg px-3 py-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Firebase server
          </dt>
          <dd className="mt-0.5 font-medium text-ink">
            {configured == null
              ? "…"
              : configured
                ? projectId
                  ? `Configured (${projectId}${source ? ` · ${source}` : ""})`
                  : "Configured"
                : "Not configured — save service account JSON above"}
          </dd>
        </div>
        <div className="rounded-lg bg-brandbg px-3 py-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Registered devices
          </dt>
          <dd className="mt-0.5 font-medium text-ink">
            {deviceCount == null ? "…" : deviceCount}
          </dd>
        </div>
        <div className="rounded-lg bg-brandbg px-3 py-2 sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            APK bridge on this device
          </dt>
          <dd className="mt-0.5 font-medium text-ink">
            {bridge.hasToken
              ? `Token detected (${bridge.tokenPreview})`
              : bridge.bridgesFound.length > 0
                ? `Bridges: ${bridge.bridgesFound.join(", ")}`
                : "No Android FCM bridge detected"}
          </dd>
          {bridge.bridgeMethods.length > 0 && (
            <dd className="mt-1 break-all font-mono text-[0.7rem] text-ink-muted">
              Methods: {bridge.bridgeMethods.join(", ")}
            </dd>
          )}
          {bridge.hint && (
            <dd className="mt-2 text-xs leading-relaxed text-ink-muted">{bridge.hint}</dd>
          )}
        </div>
      </dl>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void registerToken("bridge")}
          disabled={registering}
          className="btn-primary disabled:opacity-50"
        >
          {registering ? "Registering…" : "Register this device"}
        </button>
        <button
          type="button"
          onClick={() => void refreshStatus()}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
        >
          Refresh status
        </button>
      </div>

      <div className="mb-4 space-y-2">
        <label className="block text-xs font-semibold text-ink">
          Or paste FCM device token manually
        </label>
        <textarea
          value={manualToken}
          onChange={(e) => setManualToken(e.target.value)}
          rows={3}
          placeholder="Paste device FCM token from Android Logcat / Firebase…"
          className="input min-h-[5rem] w-full font-mono text-xs"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={() => void registerToken("manual")}
          disabled={registering}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {registering ? "Registering…" : "Register pasted token"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void sendTest()}
          disabled={loading}
          className="rounded-lg border border-primary bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send test push"}
        </button>
      </div>
    </section>
  );
}
