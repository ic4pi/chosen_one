/**
 * capacitor-play-billing — JS side.
 *
 * Nothing in web/ imports this: billing.js talks to `Capacitor.Plugins.Purchases`
 * directly, and Capacitor's native bridge populates that proxy on its own once
 * the Android plugin below registers. This file exists so the package behaves
 * like a normal Capacitor plugin for anything that does want a typed handle,
 * and so non-native platforms (web/PWA) get a harmless "unavailable" stub
 * instead of a crash if something ever calls it there.
 */

import { registerPlugin } from '@capacitor/core';

export const Purchases = registerPlugin('Purchases', {
  web: () => import('./web.js').then((m) => new m.PurchasesWeb())
});
