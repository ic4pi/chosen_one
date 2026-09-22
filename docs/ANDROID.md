# Shipping Kundala to Google Play

Kundala has no build step. Capacitor wraps `web/` directly, so the APK/AAB contains the
same files the web version serves.

## 1. Generate the Android project

```bash
npm install
npm run icons             # renders web/icons/android/ (needed once, before android:add)
npm run android:add       # creates android/ — gitignored, regenerate any time
npm run android:sync      # copies web/ into the project
npm run android:open      # opens Android Studio
```

`android:add` and `android:sync` both run `tools/android-postsync.mjs` afterward, which
copies the notification icons into their density buckets and strips the `INTERNET`
permission (see below) automatically — this repo's `android/` is gitignored and
regenerated from scratch each time, so those two fixes are scripted instead of manual
so they can't be forgotten.

`android/` is deliberately not committed. It is generated output; `capacitor.config.json`
is the source of truth.

Verified end-to-end against this repo: `npm install && npm run android:add` completes
with no errors and the postsync script's output confirms `5/5` icon densities copied and
the `INTERNET` permission removed. Building the signed bundle (`android:build`) still
needs the Android SDK from Android Studio — that step wasn't reachable from this
environment's sandboxed network, but nothing in the generation step is a blocker.

## 2. The notification icon

Android status-bar icons must be a white silhouette on transparency — the system tints
them. `npm run icons` renders them into `web/icons/android/`; `android-postsync.mjs`
copies each into `android/app/src/main/res/drawable-<density>/ic_stat_kundala.png`
automatically on `android:add`/`android:sync`. The name must match
`plugins.LocalNotifications.smallIcon` in `capacitor.config.json`.

Without this, Capacitor falls back to the launcher icon and Android renders it as a white
square.

For the launcher icon, use `web/icons/maskable-512.png` in Android Studio's
**Image Asset** tool (Adaptive icon → Foreground layer), with `#08070c` as the background.
This one step has no CLI equivalent — Android Studio only.

## 3. Permissions

Confirmed by inspecting the plugins' own manifests in `node_modules/@capacitor/*` — the
local-notifications plugin merges these into `android/app/src/main/AndroidManifest.xml`
automatically, no action needed:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
<uses-permission android:name="android.permission.WAKE_LOCK"/>
```

`POST_NOTIFICATIONS` is requested at runtime on Android 13+; the app already does this the
first time notifications are switched on.

`RECEIVE_BOOT_COMPLETED` matters more than it looks: a countdown can be armed fourteen days
out, and without it every scheduled alarm is lost when the phone reboots.

`SCHEDULE_EXACT_ALARM` is what lets a notification fire at the actual ingress instant
rather than whenever Doze next wakes. `USE_EXACT_ALARM` is *not* added by any plugin; add
it by hand in `android/app/src/main/AndroidManifest.xml` only if `SCHEDULE_EXACT_ALARM`
alone proves insufficient during testing. If Play pushes back on either for a
non-alarm-clock app, drop them and accept the drift — the schedule still works, it just
becomes approximate.

**Kundala requests no `INTERNET` permission and needs none.** The stock Capacitor Android
template adds it unconditionally; `android-postsync.mjs` deletes that line from
`AndroidManifest.xml` on every `android:add`/`android:sync` (confirmed: none of the
installed plugins' own manifests declare `INTERNET`, so a plain delete is sufficient — no
`tools:node="remove"` override needed).

## 4. In-app purchase (The Keeper)

`web/js/billing.js` is an adapter, deliberately unwired. Kundala ships no backend, so Play
itself is the source of truth and purchases restore from the user's Play account.

1. Install a Capacitor billing plugin that exposes `purchase()` and `restorePurchases()`.
2. In Play Console → **Monetise → In-app products**, create a one-time product with ID
   `kundala.keeper.lifetime` (this ID is in `PRODUCT_IDS` in `billing.js`).
3. Make sure the plugin registers as `Capacitor.Plugins.InAppPurchases` or
   `Capacitor.Plugins.Purchases` — those are the two names the adapter looks for.

Until a plugin is present, `billing.available()` is `false` and the UI says so plainly
rather than showing a button that does nothing. The code path still works everywhere.

## 5. Build and sign

```bash
npm run android:sync
cd android && ./gradlew bundleRelease
```

The bundle lands at `android/app/build/outputs/bundle/release/app-release.aab`.

Sign it with an upload key you keep safe — **if you lose it you cannot update the app**.
Enrol in Play App Signing so Google holds the release key:

```bash
keytool -genkey -v -keystore kundala-upload.jks -keyalg RSA \
        -keysize 2048 -validity 10000 -alias kundala
```

Keep `kundala-upload.jks` and its passwords out of the repo. `.gitignore` already excludes
`android/`, but double-check before any commit.

## 6. Play Console checklist

- **Data safety** — "No data collected" and "No data shared". This is true: there is no
  network code in the app at all. Expect to justify it; the answer is that the ephemeris
  runs locally and there is no server to send anything to.
- **Privacy policy** — required even so. Host `docs/PRIVACY.md` at a public URL.
- **Health disclaimer** — the listing must not read as medical advice. The copy in
  `PLAY_LISTING.md` is written for this.
- **Target API level** — Play enforces a recent one. `npm run android:sync` after a
  Capacitor upgrade picks it up.
- **Content rating** — the questionnaire will ask about health content. Answer honestly;
  the app screens for contraindications and tells users to consult a doctor.

## Also worth knowing

- **iOS** — `npx cap add ios` works from the same `web/` directory. The notification code
  already routes through Capacitor, so it needs no changes.
- **Updating the web app updates the Android app's content** only after `npm run
  android:sync` and a new release. There is no over-the-air update path, by design.
