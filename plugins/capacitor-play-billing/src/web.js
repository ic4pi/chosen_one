import { WebPlugin } from '@capacitor/core';

/** Play Billing only exists on Android. Web/PWA always reports unavailable. */
export class PurchasesWeb extends WebPlugin {
  async purchase() {
    return { success: false, reason: 'unavailable' };
  }

  async restorePurchases() {
    return { success: false, reason: 'unavailable' };
  }
}
