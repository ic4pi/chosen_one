import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mint, verify, normalize, format } from '../web/js/codes.js';
import { PACKS } from '../web/js/packs.js';

test('minted codes verify and map back to their pack', () => {
  for (const pack of PACKS) {
    for (let i = 0; i < 50; i++) {
      const code = mint(pack.marker);
      const r = verify(code);
      assert.ok(r.ok, `${code} failed to verify`);
      assert.equal(r.packId, pack.id);
    }
  }
});

test('codes read the same however they are typed', () => {
  const code = mint('S');
  for (const variant of [code, code.toLowerCase(), code.replace(/-/g, ''), ` ${code} `, code.replace('KDL-', '')]) {
    assert.ok(verify(variant).ok, `failed on "${variant}"`);
  }
});

test('single character changes are rejected', () => {
  const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let tested = 0;
  const raw = normalize(mint('S'));
  for (let i = 0; i < raw.length; i++) {
    for (const c of ALPHABET) {
      if (c === raw[i]) continue;
      const broken = raw.slice(0, i) + c + raw.slice(i + 1);
      if (i === 0) continue; // position 0 is the pack marker; other markers are valid codes
      assert.equal(verify(broken).ok, false, `accepted a typo at ${i}: ${broken}`);
      tested++;
    }
  }
  assert.ok(tested > 200);
});

test('malformed input is rejected with a readable reason', () => {
  for (const bad of ['', 'hello', 'KDL-', 'KDL-SSSSS-SSSSSSS', '!!!!!!!!!']) {
    const r = verify(bad);
    assert.equal(r.ok, false);
    assert.ok(r.reason.length > 10);
  }
});

test('random guesses essentially never land', () => {
  const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let hits = 0;
  for (let i = 0; i < 20000; i++) {
    let guess = 'S';
    for (let j = 0; j < 8; j++) guess += ALPHABET[Math.floor(Math.random() * 32)];
    if (verify(guess).ok) hits++;
  }
  // One in 2^20 per guess; 20k guesses should hit zero or, very rarely, once.
  assert.ok(hits <= 2, `${hits} lucky guesses out of 20000`);
});

test('formatting is stable', () => {
  const code = mint('P');
  assert.equal(format(normalize(code).slice(0, 5)), code);
  assert.match(code, /^KDL-[0-9A-Z]{5}-[0-9A-Z]{4}$/);
});
