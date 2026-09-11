#!/usr/bin/env node
/**
 * kundala-codes.mjs — mint coupon codes for the TikTok channel.
 *
 *   npm run codes                     20 Serpent Path codes
 *   npm run codes -- --pack premium --count 5
 *   npm run codes -- --verify KDL-S7K2M-4FQ9
 *
 * Codes verify offline inside the app, so there is nothing to upload and no
 * service to keep running. Mint a batch, paste it into a video description or
 * a pinned comment, and it works forever.
 */

import { mint, verify } from '../web/js/codes.js';
import { PACKS, PACK_BY_ID } from '../web/js/packs.js';
import { randomInt } from 'node:crypto';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};

const toVerify = flag('verify', null);
if (toVerify) {
  const r = verify(toVerify);
  console.log(r.ok ? `VALID   ${r.code}   unlocks: ${PACK_BY_ID[r.packId].name}` : `INVALID  ${r.reason}`);
  process.exit(r.ok ? 0 : 1);
}

const packId = flag('pack', 'serpent-path');
const count = Number(flag('count', 20));
const pack = PACK_BY_ID[packId];

if (!pack) {
  console.error(`Unknown pack "${packId}". Options: ${PACKS.map((p) => p.id).join(', ')}`);
  process.exit(1);
}

// crypto.randomInt, not Math.random: these are giveaway codes, not dice.
const rng = () => randomInt(0, 2 ** 30) / 2 ** 30;

const seen = new Set();
while (seen.size < count) seen.add(mint(pack.marker, rng));

console.log(`\n  ${pack.name} — ${count} codes\n`);
for (const code of seen) console.log(`  ${code}`);
console.log(`\n  Each unlocks: ${pack.name}`);
console.log('  One code per device. They never expire.\n');
