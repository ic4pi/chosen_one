# TikTok coupon codes

The Serpent Path is free. It is gated behind a code purely so the TikTok channel has
something real to give away — not to squeeze anyone. It adds to the free version *or* to
The Keeper, and it changes no prices.

## Mint a batch

```bash
npm run codes                              # 20 Serpent Path codes
npm run codes -- --count 100               # a hundred of them
npm run codes -- --pack premium --count 5  # Keeper codes, for giveaways
npm run codes -- --verify KDL-S7K2M-4FQ9   # check one
```

Output looks like:

```
  The Serpent Path — 4 codes

  KDL-SMY57-HXED
  KDL-S14PG-K8CK
  KDL-S2YQ3-EZN8
  KDL-SQE89-B0XR
```

## How they work

Codes verify themselves. The last four characters are a checksum over the payload and the
pack marker, so the app can validate one with no server, no API and no network — which is
what lets Kundala stay completely offline.

That means: **nothing to upload, no service to keep running, and codes never expire.** Mint
a batch, paste it into a video description or a pinned comment, and it works forever.

Reading them aloud is safe. The alphabet has no I, L, O or U, and the app auto-corrects the
characters people habitually mistype (`I`→`1`, `O`→`0`), accepts lowercase, and accepts them
with or without the dashes and the `KDL-` prefix.

## The honest caveat

Because verification is offline, the checksum salt ships inside the app. Someone determined
enough to read the source could mint their own codes.

That is a deliberate trade, and it is the same trade every offline unlock makes. For a free
giveaway pack, being generous is the point — a leaked code costs nothing. For **The Keeper**,
lean on Google Play Billing (see [ANDROID.md](ANDROID.md)); Play holds the real receipt, and
premium codes are best kept for giveaways and support rather than sold.

If you ever want codes to be genuinely unforgeable, that requires a server to sign them —
which would mean the app is no longer offline. Worth it only if piracy actually shows up.

## Ideas that fit the format

- **One code per video**, in the description. Cheap, permanent, and gives people a reason to
  watch the whole thing.
- **Sign-specific batches.** Mint a hundred, hand out a slice each time you cover a sign, and
  post them when that sign's window is opening.
- **Pinned comment codes** on a video about the window that is opening this week.
- **Keeper codes** to people who show up to your lives, or to anyone who tells you the app
  helped. There is no cost to you.

## Adding a new pack later

Add a row to `web/js/packs.js` with a unique one-character `marker`, then:

```bash
npm run codes -- --pack your-new-pack --count 50
```

Codes mint immediately. Nothing else needs changing, and nothing anyone already owns is
touched.
