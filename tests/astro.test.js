import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  moonLongitude, sunLongitude, toJD, fromJD, norm360, angleDiff,
  nextMoonIngress, sunSignAt, moonSignAt, ayanamsa, SIGNS
} from '../web/js/astro.js';

test('moon longitude matches Meeus example 47.a', () => {
  // 1992 April 12, 0h TD. Meeus gives lambda = 133.162655 degrees.
  assert.ok(Math.abs(moonLongitude(2448724.5) - 133.162655) < 0.0005);
});

test('sun and moon coincide at a known new moon', () => {
  // New Moon: 2000 January 6, 18:14 UT.
  const jd = toJD(new Date(Date.UTC(2000, 0, 6, 18, 14)));
  assert.ok(Math.abs(angleDiff(moonLongitude(jd), sunLongitude(jd))) < 0.1);
});

test('sun longitude matches Meeus example 25.a', () => {
  // 1992 October 13, 0h TD. Meeus gives apparent lambda ~ 199.90598 degrees;
  // the low-precision series is quoted to about 0.01 degrees.
  assert.ok(Math.abs(sunLongitude(2448908.5) - 199.90598) < 0.01);
});

test('julian day round-trips', () => {
  const d = new Date(Date.UTC(2026, 8, 10, 4, 30, 0));
  assert.equal(fromJD(toJD(d)).toISOString(), d.toISOString());
});

test('angle helpers stay in range', () => {
  assert.equal(norm360(-10), 350);
  assert.equal(norm360(370), 10);
  assert.equal(angleDiff(1, 359), 2);
  assert.equal(angleDiff(359, 1), -2);
});

test('sun sign matches the calendar at the middle of each sign', () => {
  // Mid-sign dates, safely away from the cusps.
  const samples = [
    ['2000-04-05', 'Aries'], ['2000-07-05', 'Cancer'],
    ['2000-08-05', 'Leo'], ['2000-11-05', 'Scorpio'],
    ['2000-01-05', 'Capricorn'], ['2000-03-05', 'Pisces']
  ];
  for (const [iso, name] of samples) {
    const [y, m, d] = iso.split('-').map(Number);
    assert.equal(SIGNS[sunSignAt(new Date(Date.UTC(y, m - 1, d, 12)))].name, name, iso);
  }
});

test('sidereal longitudes trail tropical by the ayanamsa', () => {
  const jd = toJD(new Date(Date.UTC(2026, 0, 1)));
  const a = ayanamsa(jd);
  assert.ok(a > 24.2 && a < 24.5, `ayanamsa ${a}`);
});

test('sidereal can move the sun back a sign near a cusp', () => {
  // Early-Aries tropical Sun still sits in Pisces sidereally: the ayanamsa was
  // about 23.85 degrees in 2000, so the first ~24 degrees of each tropical sign
  // belongs to the sign before it.
  const d = new Date(Date.UTC(2000, 3, 10, 12));
  assert.equal(SIGNS[sunSignAt(d, 'tropical')].name, 'Aries');
  assert.equal(SIGNS[sunSignAt(d, 'sidereal')].name, 'Pisces');
});

test('moon ingress lands exactly on the sign boundary', () => {
  for (let sign = 0; sign < 12; sign++) {
    const t = nextMoonIngress(sign, new Date(Date.UTC(2026, 5, 1)));
    assert.ok(t, `no ingress found for sign ${sign}`);
    assert.equal(moonSignAt(new Date(t.getTime() + 60000)), sign);
    assert.equal(moonSignAt(new Date(t.getTime() - 60000)), (sign + 11) % 12);
  }
});

test('the moon holds a sign for roughly 2.2 days', () => {
  const a = nextMoonIngress(3, new Date(Date.UTC(2026, 2, 1)));
  const b = nextMoonIngress(4, a);
  const days = (b - a) / 86400000;
  assert.ok(days > 1.9 && days < 2.6, `moon held the sign for ${days.toFixed(2)} days`);
});

test('successive ingresses of the same sign are one sidereal month apart', () => {
  const a = nextMoonIngress(7, new Date(Date.UTC(2026, 0, 1)));
  const b = nextMoonIngress(7, new Date(a.getTime() + 86400000));
  const days = (b - a) / 86400000;
  assert.ok(days > 26.8 && days < 28.0, `${days.toFixed(2)} days between ingresses`);
});
