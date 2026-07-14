# Admin WebView APK — FCM push wiring

App **data** lives in Supabase Postgres (see [supabase.md](./supabase.md)). Firebase is used **only for FCM** admin push — not Firestore or Storage.

Server side is ready in this repo. Your AI Studio / Android WebView APK must do the steps below so devices can receive order pushes.

## Firebase project (messaging)

- Project ID: `srk-cracker`
- Android package: `com.aistudio.srkcrackers.qzkrm`
- Place `google-services.json` in the Android app module (same package name). Do **not** upload that file to Admin Settings — use a **service account** private key for the server.

## Vercel / server send (FCM credentials)

1. Firebase Console → Project settings → Service accounts → **Generate new private key**.
2. Set Vercel env `FIREBASE_SERVICE_ACCOUNT_JSON` to the **entire JSON as one line** (escape newlines in `private_key` as `\n`), **or** upload the same JSON in Admin → Settings → Push notifications (stored in Postgres `FirebaseSettings`).
3. Redeploy if you only changed env vars.

Without credentials, pushes are skipped (bell + email still work). Catalog and orders do **not** depend on Firebase.

## Android: register FCM token with the website

**Important:** merely opening `/admin` in the WebView does **not** register a device.
The native APK must obtain an FCM token and inject it into JavaScript.

After the admin user is logged in (cookie session on `https://www.srkcrackers.in`), inject the FCM token into the WebView so [`AdminPushRegistrar`](../src/components/admin/AdminPushRegistrar.tsx) can `POST /api/admin/push/register`.

Any one of these works:

```kotlin
// Preferred: CustomEvent (run after page load / onPageFinished for /admin*)
val escaped = fcmToken.replace("\\", "\\\\").replace("'", "\\'")
val js = """
  window.__SRK_FCM_TOKEN__='$escaped';
  window.dispatchEvent(new CustomEvent('srk-fcm-token', {
    detail: { token: '$escaped' }
  }));
""".trimIndent()
webView.evaluateJavascript(js, null)
```

```kotlin
// Or JS bridge the web page can call
class SrkAdminBridge {
  @JavascriptInterface
  fun getFcmToken(): String = fcmTokenStore.current()
}
webView.addJavascriptInterface(SrkAdminBridge(), "SrkAdmin")
// Also works with interface names: Android, AndroidBridge, AndroidNotification
// methods: getFcmToken / getToken / readToken
```

Re-inject on every `onNewToken` refresh and after page load of `/admin*`.

In **Admin → Settings → Push notifications**, check **APK bridge on this device**:
- “No Android FCM bridge detected” → APK is not wired yet
- “Token detected” → registration should bump **Registered devices**

You can also paste a token manually there for a one-time test.

### If Settings shows `Android` / `AndroidNotification` but no token

Your APK likely only exposes **local** alerts, e.g. `AndroidNotification.showNotification(title, body, url)`.
That works only while the WebView is open — it does **not** expose an FCM token for server push when the app is closed.

Add on the Android side (AI Studio / native):

```kotlin
@JavascriptInterface
fun getFcmToken(): String = cachedFcmToken  // from FirebaseMessaging onNewToken
```

Register it on the same interface:

```kotlin
webView.addJavascriptInterface(bridge, "AndroidNotification")
// so the page can call AndroidNotification.getFcmToken()
```

Or inject after page load:

```kotlin
webView.evaluateJavascript("window.__SRK_FCM_TOKEN__='$token'; …", null)
```

Then reopen Admin → Settings → **Register this device**.

## Android: open order on notification tap

FCM data payload includes:

| Key | Example |
|-----|---------|
| `target_url` | `https://www.srkcrackers.in/admin/orders/{orderId}` |
| `type` | `NEW_ORDER` |
| `order_id` | cuid |
| `order_number` | `SRK-…` |

On notification tap, load `data.target_url` in the WebView (must stay on `www.srkcrackers.in`).

Example notification body from server:

- Title: `New Order Received!`
- Body: `Order #SRK-… from Chennai - ₹18,450`

## Smoke test

1. Install APK, open admin, log in, confirm token registers (no 401).
2. Place a test storefront order.
3. Phone should show the push; tap should open that order in admin.
