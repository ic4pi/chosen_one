/**
 * billing.js — one-time purchase adapter.
 *
 * Kundala ships no backend, so there is no receipt server to talk to. On
 * Android the app hands off to Google Play Billing through
 * plugins/capacitor-play-billing — a small in-repo Capacitor plugin that
 * talks straight to the Play Billing Library, nothing else. Play itself is
 * the source of truth and the purchase restores from the user's Play
 * account. Everywhere else (web/PWA) the paid tier is unlocked with a code.
 *
 * The plugin only exists once `npm run android:add` generates the Android
 * project (documented in docs/ANDROID.md). Until then this adapter reports
 * `unavailable` and the UI offers the code path, which keeps the web build
 * honest rather than showing a button that lies.
 */

import { grant } from './entitlements.js';

const PRODUCT_IDS = {
  premium: 'kundala.keeper.lifetime',
  'deep-current': 'kundala.deepcurrent.lifetime'
};

function plugin() {
  const cap = globalThis.Capacitor;
  if (!cap?.isNativePlatform?.()) return null;
  return cap.Plugins?.InAppPurchases || cap.Plugins?.Purchases || null;
}

export function available() {
  return Boolean(plugin());
}

export function productIdFor(packId) {
  return PRODUCT_IDS[packId] || null;
}

/**
 * @returns {Promise<{ok: boolean, reason?: string}>}
 */
export async function purchase(packId) {
  const p = plugin();
  const productId = productIdFor(packId);
  if (!p || !productId) {
    return { ok: false, reason: 'unavailable' };
  }
  try {
    const result = await p.purchase({ productIdentifier: productId, productId });
    const state = result?.transaction?.state ?? result?.state ?? 'purchased';
    if (state === 'purchased' || state === 'restored' || result?.success) {
      grant(packId, 'purchase');
      return { ok: true };
    }
    return { ok: false, reason: 'cancelled' };
  } catch (err) {
    return { ok: false, reason: err?.message || 'failed' };
  }
}

/** Re-grant anything the store says this account already owns. */
export async function restore() {
  const p = plugin();
  if (!p?.restorePurchases) return { ok: false, reason: 'unavailable' };
  try {
    const result = await p.restorePurchases();
    const ids = (result?.transactions || result?.purchases || []).map(
      (t) => t.productIdentifier || t.productId
    );
    const restored = [];
    for (const [packId, productId] of Object.entries(PRODUCT_IDS)) {
      if (ids.includes(productId)) {
        grant(packId, 'restore');
        restored.push(packId);
      }
    }
    return { ok: true, restored };
  } catch (err) {
    return { ok: false, reason: err?.message || 'failed' };
  }
}
