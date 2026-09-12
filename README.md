<div align="center">

<img src="web/icons/icon-192.png" width="96" alt="Kundala">

# Kundala

**The four-day moon fast.**

Once every lunar month the Moon crosses the sign your Sun was in when you were born.
It stays a little over two days. Kundala brackets that passage — one day before it
arrives, one day after it leaves — and walks you through the fast in between.

</div>

---

## The rule

> The fast opens the day before the Moon steps into your Sun sign, and closes the day
> after it steps out.

The Moon holds a sign for about 2.2 days. A day either side makes roughly **4.2 days** —
the four-day window. Because it is keyed to *your* Sun rather than to a shared calendar,
your window is yours: it lands on different dates than anyone else's, and it drifts about
two days earlier each month, because the sidereal month is 27.3 days and the calendar is not.

Kundala computes it from the real positions of the Sun and Moon. There is no lookup table
and no server — the ephemeris runs on your device, in about a millisecond.

## What's in the box

| | Pack | Price | How you get it |
|---|---|---|---|
| ☾ | **The Window** | Free forever | Installed |
| ✦ | **The Keeper** | One-time | Google Play, or a code |
| 𓆙 | **The Serpent Path** | Free | A code from the TikTok channel |
| ◈ | **The Deep Current** | Later | Announced |

**The Window** (free) — your window calculated twelve months ahead, the four-phase protocol
at three intensity levels, complete preparation and refeeding instructions, and the safety
screening. Fully offline.

**The Keeper** (paid, one-time) — Kundala reaches out to you. A countdown ladder of device
notifications from up to fourteen days out, each carrying the one thing worth doing at that
distance. Live alerts the moment the Moon crosses into and out of your Sun. Morning and
evening practice prompts during the fast. The refeeding alert at the close — the step people
get wrong. Every notification is generated and fired on your device; there is no push server.

**The Serpent Path** (free, code) — pranayama, kriyas, bandhas and asana from the hatha and
tantric traditions, matched to the phase you are in, plus five plain-language study pieces on
the nadis, the centres, and why the Moon in your Sun. It adds to Free *or* to The Keeper. It
changes no prices and it locks nothing that was open.

## Run it

```bash
npm start          # → http://localhost:5173
npm test           # ephemeris, window and coupon-code tests
npm run icons      # redraw the app icons from tools/make-icons.py
npm run codes      # mint TikTok coupon codes
```

There is no build step. What is in `web/` is exactly what ships — to the browser as a PWA,
and to Google Play through Capacitor, which wraps the same directory.

## Ship it

- **Web / installable** — serve `web/` over HTTPS on any static host. It installs from the
  browser as a PWA and works offline from the first launch.
- **Vercel** — the root `vercel.json` already points the deployment at `web/`, so leave the
  project's **Root Directory** as the repository root and the **Framework Preset** as *Other*.
  (If you'd rather set Root Directory to `web`, that works too — `web/vercel.json` carries the
  same settings.) Getting a 404 on a fresh deploy almost always means Vercel is serving the
  repository root, where there is no `index.html`.
- **Google Play** — `npm run android:add && npm run android:open`. Full walkthrough,
  including signing and Play Billing, in [docs/ANDROID.md](docs/ANDROID.md).
- **Store listing copy** — [docs/PLAY_LISTING.md](docs/PLAY_LISTING.md).
- **TikTok codes** — [docs/TIKTOK_CODES.md](docs/TIKTOK_CODES.md).
- **Privacy policy** — [docs/PRIVACY.md](docs/PRIVACY.md). Play requires a hosted URL.

## How it is built

No frameworks, no bundler, no CDN, no fonts fetched over the wire, and **no API calls of any
kind**. Plain ES modules, one stylesheet, and a service worker. The whole app is about 90 KB
before icons.

```
web/
  index.html            shell
  manifest.webmanifest  PWA manifest
  sw.js                 offline cache + notification click routing
  styles/app.css        the whole design system
  js/
    astro.js            Sun and Moon longitudes (Meeus ch. 25 and 47)
    schedule.js         the Kundala Window and its four phases
    notifications.js    device-side scheduling, three delivery paths
    entitlements.js     who owns what, on this device
    codes.js            self-verifying offline coupon codes
    packs.js            the add-on registry — new packs are one row
    billing.js          Google Play Billing adapter
    store.js            localStorage
    views.js            every screen
    format.js           dates, durations, the dial artwork
    app.js              state, routing, events
    content/            protocol, preparation ladder, Serpent Path
tools/
  serve.mjs             static dev server (stdlib only)
  make-icons.py         draws the app mark from maths (stdlib only)
  kundala-codes.mjs     mints coupon codes
tests/                  27 tests, node --test
```

### Accuracy

The Moon's longitude uses Meeus's abridged ELP-2000/82 series and reproduces his worked
example 47.a to six decimal places. The Sun uses the low-precision series from chapter 25,
good to about 0.01°. On a window measured in days, the ingress instants are accurate to a
couple of minutes.

Both zodiacs are supported: **tropical** (Western, measured from the equinox) and **sidereal**
(Jyotisha, Lahiri ayanamsa, measured against the fixed stars). Sidereal currently runs about
24° behind, which can put your Sun in the previous sign — Kundala recalculates the whole
schedule when you switch.

### Adding a pack later

Add a row to `web/js/packs.js` with a unique `marker` character, drop the content in
`web/js/content/`, and gate it with `ent.has('your-pack-id')`. Codes for it mint immediately:
`npm run codes -- --pack your-pack-id`. Nothing else in the app needs to change, and nothing
anyone already owns is affected.

## Safety

A four-day fast is a real physiological event. Kundala screens for the hard contraindications
during setup, names the symptoms that mean break the fast now, and puts as much care into the
refeeding phase as the fasting ones — because that is the part that can actually hurt you.

**Kundala is not medical advice and not a clinician.** It does not know your bloodwork.
See [docs/PRIVACY.md](docs/PRIVACY.md) for what it stores (everything on your device, nothing
anywhere else).

## Licence

MIT. See [LICENSE](LICENSE).
