# Shipping Kundala to Google Play

Kundala has no build step. Capacitor wraps `web/` directly, so the APK/AAB contains the
same files the web version serves.

## 1. Generate the Android project

```bash
npm install
npm run android:add      # creates android/ — gitignored, regenerate any time
npm run android:sync     # copies web/ into the project
npm run android:open     # opens Android Studio
```

`android/` is deliberately not committed. It is generated output; `capacitor.config.json`
is the source of truth.

## 2. Drop in the notification icon

Android status-bar icons must be a white silhouette on transparency — the system tints
them. `npm run icons` renders them into `web/icons/android/`. Copy each into its density
bucket, renamed to `ic_stat_kundala.png`:

```bash
for b in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  mkdir -p android/app/src/main/res/drawable-$b
  cp web/icons/android/ic_stat_kundala-$b.png \
     android/app/src/main/res/drawable-$b/ic_stat_kundala.png
done
```

Without this, Capacitor falls back to the launcher icon and Android renders it as a white
square. The name must match `plugins.LocalNotifications.smallIcon` in `capacitor.config.json`.

For the launcher icon, use `web/icons/maskable-512.png` in Android Studio's
**Image Asset** tool (Adaptive icon → Foreground layer), with `#08070c` as the background.

## 3. Permissions

Capacitor's local-notifications plugin adds what it needs, but confirm these are in
`android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>
<uses-permission android:name="android.permission.USE_EXACT_ALARM"/>
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
```

`POST_NOTIFICATIONS` is requested at runtime on Android 13+; the app already does this the
first time notifications are switched on.

`RECEIVE_BOOT_COMPLETED` matters more than it looks: a countdown can be armed fourteen days
out, and without it every scheduled alarm is lost when the phone reboots.

The exact-alarm permissions are what let a notification fire at the actual ingress instant
rather than whenever Doze next wakes. If Play pushes back on `USE_EXACT_ALARM` for a
non-alarm-clock app, drop both and accept the drift — the schedule still works, it just
becomes approximate.

**Kundala requests no `INTERNET` permission and needs none.** If Capacitor adds it, you can
remove it with a tools:node override — the app makes no network calls.

## 4. In-app purchase (The Keeper)

`web/js/billing.js` is an adapter. On Android it talks to `plugins/capacitor-play-billing`
— a small Capacitor plugin, built for this repo, that wraps the Google Play Billing
Library directly. No third-party purchase service, no RevenueCat-style account, no
network calls beyond the ones Play's own billing client makes. Kundala ships no backend,
so Play itself is the source of truth and purchases restore from the user's Play account.

It's already wired into `package.json` as a `file:` dependency and registers itself as
`Capacitor.Plugins.Purchases`, which is exactly what `billing.js` looks for — nothing to
install. `npm run android:add` (or `android:sync`) picks it up automatically; `cap sync`
prints `capacitor-play-billing@1.0.0` in its plugin list when it has.

1. In Play Console → **Monetise → In-app products**, create a one-time (managed) product
   with ID `kundala.keeper.lifetime` (this ID is in `PRODUCT_IDS` in `billing.js`) and
   price it at $0.99. Do the same for `kundala.deepcurrent.lifetime` later, when that
   pack ships.
2. Build and install a release or internal-testing build signed with the same key you'll
   upload to Play — the Play Billing Library refuses to return real products for a debug
   build unless the app is published (at least to an internal testing track) under that
   exact `applicationId` and signed with a key Play recognises.
3. Add your own Google account as a licence tester in Play Console → **Setup → License
   testing** so you can buy the $0.99 product for real without being charged.

The plugin's source is in `plugins/capacitor-play-billing/android/src/main/java/app/kundala/
playbilling/PlayBillingPlugin.java` if you need to change product handling later (e.g. to
add consumables). It was written and reviewed here but never compiled against a real
Android SDK or exercised against a live Play Billing purchase flow — build it in Android
Studio and buy the test product once before you rely on it.

If no plugin were present, `billing.available()` would report `false` and the UI would say
so plainly rather than showing a button that does nothing — that fallback path still exists
and still runs on web/PWA, where there is no Play Billing at all.

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
