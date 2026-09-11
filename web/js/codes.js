/**
 * codes.js — offline coupon codes.
 *
 * Codes are self-verifying: the last four characters are a checksum over the
 * payload and the pack marker, so the app can validate a code with no server,
 * no API and no network. Format:
 *
 *     KDL-Sx7k2-9F3M
 *          ^^^^^  ^^^^
 *          |      checksum (4 chars)
 *          payload; first character is the pack marker
 *
 * Honest limitation: the salt ships inside the app, so a determined person can
 * mint their own codes. That is an accepted trade for a fully offline app, and
 * it is the same trade every offline unlock makes. The paid tier should lean on
 * store billing; codes are for the TikTok giveaway, where being generous is the
 * point anyway.
 */

import { PACK_BY_MARKER } from './packs.js';

// Crockford-style base32: no I, L, O or U, so codes cannot be misread aloud.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const SALT = 'kundala/v1/serpent';
const PAYLOAD_LEN = 5;
const CHECK_LEN = 4;

function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function encode(value, length) {
  let out = '';
  let v = value >>> 0;
  for (let i = 0; i < length; i++) {
    out = ALPHABET[v % 32] + out;
    v = Math.floor(v / 32);
  }
  return out;
}

function checksum(payload) {
  // Two passes so that a single-character change moves every checksum char.
  const a = fnv1a(SALT + '|' + payload);
  const b = fnv1a(payload + '|' + SALT + '|' + a);
  return encode((a ^ b) >>> 0, CHECK_LEN);
}

/** Strip formatting and fix the characters people habitually mistype. */
export function normalize(input) {
  return String(input || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/^KDL/, '')
    .replace(/I/g, '1')
    .replace(/L/g, '1')
    .replace(/O/g, '0')
    .replace(/U/g, 'V');
}

export function format(payload) {
  return `KDL-${payload}-${checksum(payload)}`;
}

/**
 * @returns {{ok: true, packId: string, code: string} | {ok: false, reason: string}}
 */
export function verify(input) {
  const raw = normalize(input);
  if (raw.length !== PAYLOAD_LEN + CHECK_LEN) {
    return { ok: false, reason: 'A Kundala code is nine characters, like KDL-S7K2M-4FQ9.' };
  }
  const payload = raw.slice(0, PAYLOAD_LEN);
  const given = raw.slice(PAYLOAD_LEN);
  if ([...raw].some((c) => !ALPHABET.includes(c))) {
    return { ok: false, reason: 'That code contains a character Kundala never uses.' };
  }
  if (checksum(payload) !== given) {
    return { ok: false, reason: 'That code is not valid. Check it character by character.' };
  }
  const pack = PACK_BY_MARKER[payload[0]];
  if (!pack) {
    return { ok: false, reason: 'That code is for a pack this version of Kundala does not have yet. Update the app.' };
  }
  return { ok: true, packId: pack.id, code: format(payload) };
}

/** Mint a code for a pack. Used by tools/kundala-codes.mjs and by tests. */
export function mint(marker, rng = Math.random) {
  let payload = marker;
  for (let i = 1; i < PAYLOAD_LEN; i++) {
    payload += ALPHABET[Math.floor(rng() * 32)];
  }
  return format(payload);
}
