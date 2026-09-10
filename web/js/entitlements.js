/**
 * entitlements.js — who owns what, stored on the device.
 */

import { PACKS, PACK_BY_ID } from './packs.js';
import { verify } from './codes.js';
import { load, save } from './store.js';

const KEY = 'entitlements';

function read() {
  return load(KEY, { packs: ['core'], codes: [], purchasedAt: {} });
}

export function owned() {
  const state = read();
  return new Set(['core', ...state.packs]);
}

export function has(packId) {
  return owned().has(packId);
}

export function grant(packId, source = 'code') {
  const state = read();
  if (!state.packs.includes(packId)) state.packs.push(packId);
  state.purchasedAt[packId] = { at: Date.now(), source };
  save(KEY, state);
  return state;
}

export function revoke(packId) {
  const state = read();
  state.packs = state.packs.filter((p) => p !== packId && p !== 'core');
  delete state.purchasedAt[packId];
  save(KEY, state);
  return state;
}

/**
 * Redeem a coupon code.
 * @returns {{ok: boolean, message: string, packId?: string}}
 */
export function redeem(input) {
  const result = verify(input);
  if (!result.ok) return { ok: false, message: result.reason };

  const state = read();
  if (state.codes.includes(result.code)) {
    return { ok: false, message: 'This code is already redeemed on this device.' };
  }
  if (state.packs.includes(result.packId)) {
    return { ok: false, message: `You already have ${PACK_BY_ID[result.packId].name}.` };
  }

  state.codes.push(result.code);
  save(KEY, state);
  grant(result.packId, 'code');

  return {
    ok: true,
    packId: result.packId,
    message: `${PACK_BY_ID[result.packId].name} unlocked.`
  };
}

export function redeemedCodes() {
  return read().codes;
}

export function catalogue() {
  const set = owned();
  return PACKS.map((p) => ({ ...p, owned: set.has(p.id) }));
}
