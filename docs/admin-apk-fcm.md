# Admin WebView APK — FCM push wiring

Server side is ready in this repo. Your AI Studio / Android WebView APK must do the steps below so devices can receive order pushes.

## Firebase project

- Project ID: `srk-cracker`
- Android package: `com.aistudio.srkcrackers.qzkrm`
- Place `google-services.json` in the Android app module (same package name).

## Vercel (server send)

1. Firebase Console → Project settings → Service accounts → **Generate new private key**.
2. Set Vercel env `FIREBASE_SERVICE_ACCOUNT_JSON` to the **entire JSON as one line** (escape newlines in `private_key` as `\n`).
3. Redeploy.

Without this env var, pushes are skipped (bell + email still work).

## Android: register FCM token with the website

After the admin user is logged in (cookie session on `https://www.srkcrackers.in`), inject the FCM token into the WebView so [`AdminPushRegistrar`](../src/components/admin/AdminPushRegistrar.tsx) can `POST /api/admin/push/register`.

Any one of these works:

```kotlin
// Preferred: CustomEvent
val js = """
  window.dispatchEvent(new CustomEvent('srk-fcm-token', {
    detail: { token: '${fcmToken}' }
  }));
""".trimIndent()
webView.evaluateJavascript(js, null)
```

```kotlin
// Or set a global
webView.evaluateJavascript("window.__SRK_FCM_TOKEN__='${fcmToken}';", null)
```

Re-inject on every `onNewToken` refresh and after page load of `/admin*`.

Also create notification channel id **`admin_orders`** (Android 8+) to match server payload.

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
