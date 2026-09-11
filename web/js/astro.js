/**
 * astro.js — Kundala's ephemeris.
 *
 * Everything here is pure math. No network, no API, no data files.
 * Sun longitude: Meeus, "Astronomical Algorithms" ch. 25 (low precision, ~0.01deg).
 * Moon longitude: Meeus ch. 47, abridged ELP-2000/82 series (~0.02deg, ~2 min of time).
 *
 * That precision is far tighter than this app needs: the Moon travels roughly
 * 13.2 degrees a day, so 0.02deg is under three minutes of clock time on a
 * four-day window.
 */

const DEG = Math.PI / 180;
const J2000 = 2451545.0;

// Glyphs carry U+FE0E so browsers render them as text, never as colour emoji.
export const SIGNS = [
  { name: 'Aries',       glyph: '♈\uFE0E', element: 'Fire',  dates: 'Mar 21 - Apr 19' },
  { name: 'Taurus',      glyph: '♉\uFE0E', element: 'Earth', dates: 'Apr 20 - May 20' },
  { name: 'Gemini',      glyph: '♊\uFE0E', element: 'Air',   dates: 'May 21 - Jun 20' },
  { name: 'Cancer',      glyph: '♋\uFE0E', element: 'Water', dates: 'Jun 21 - Jul 22' },
  { name: 'Leo',         glyph: '♌\uFE0E', element: 'Fire',  dates: 'Jul 23 - Aug 22' },
  { name: 'Virgo',       glyph: '♍\uFE0E', element: 'Earth', dates: 'Aug 23 - Sep 22' },
  { name: 'Libra',       glyph: '♎\uFE0E', element: 'Air',   dates: 'Sep 23 - Oct 22' },
  { name: 'Scorpio',     glyph: '♏\uFE0E', element: 'Water', dates: 'Oct 23 - Nov 21' },
  { name: 'Sagittarius', glyph: '♐\uFE0E', element: 'Fire',  dates: 'Nov 22 - Dec 21' },
  { name: 'Capricorn',   glyph: '♑\uFE0E', element: 'Earth', dates: 'Dec 22 - Jan 19' },
  { name: 'Aquarius',    glyph: '♒\uFE0E', element: 'Air',   dates: 'Jan 20 - Feb 18' },
  { name: 'Pisces',      glyph: '♓\uFE0E', element: 'Water', dates: 'Feb 19 - Mar 20' }
];

/* ---------- time ---------- */

export function toJD(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

export function fromJD(jd) {
  return new Date(Math.round((jd - 2440587.5) * 86400000));
}

function centuries(jd) {
  return (jd - J2000) / 36525;
}

/* ---------- angles ---------- */

export function norm360(x) {
  const r = x % 360;
  return r < 0 ? r + 360 : r;
}

/** Signed shortest distance from b to a, in (-180, 180]. */
export function angleDiff(a, b) {
  let d = norm360(a - b);
  if (d > 180) d -= 360;
  return d;
}

/* ---------- ayanamsa (sidereal / Vedic offset) ---------- */

/**
 * Lahiri (Chitrapaksha) ayanamsa, the standard in Jyotisha.
 * Linear model anchored at J2000 = 23.85300deg with general precession of
 * 50.29"/yr. Accurate to about 0.002deg across 1900-2100.
 */
export function ayanamsa(jd) {
  return 23.85300 + 0.0139714 * ((jd - J2000) / 365.25);
}

/* ---------- Sun ---------- */

/** Apparent geocentric longitude of the Sun, degrees, mean equinox of date. */
export function sunLongitude(jd) {
  const T = centuries(jd);
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * DEG;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * M) +
    0.000289 * Math.sin(3 * M);
  return norm360(L0 + C);
}

/* ---------- Moon ---------- */

// Meeus table 47.A, argument multipliers [D, M, M', F] and the sine coefficient
// of the longitude series, in units of 1e-6 degrees.
const MOON_TERMS = [
  [0, 0, 1, 0, 6288774], [2, 0, -1, 0, 1274027], [2, 0, 0, 0, 658314],
  [0, 0, 2, 0, 213618], [0, 1, 0, 0, -185116], [0, 0, 0, 2, -114332],
  [2, 0, -2, 0, 58793], [2, -1, -1, 0, 57066], [2, 0, 1, 0, 53322],
  [2, -1, 0, 0, 45758], [0, 1, -1, 0, -40923], [1, 0, 0, 0, -34720],
  [0, 1, 1, 0, -30383], [2, 0, 0, -2, 15327], [0, 0, 1, 2, -12528],
  [0, 0, 1, -2, 10980], [4, 0, -1, 0, 10675], [0, 0, 3, 0, 10034],
  [4, 0, -2, 0, 8548], [2, 1, -1, 0, -7888], [2, 1, 0, 0, -6766],
  [1, 0, -1, 0, -5163], [1, 1, 0, 0, 4987], [2, -1, 1, 0, 4036],
  [2, 0, 2, 0, 3994], [4, 0, 0, 0, 3861], [2, 0, -3, 0, 3665],
  [0, 1, -2, 0, -2689], [2, 0, -1, 2, -2602], [2, -1, -2, 0, 2390],
  [1, 0, 1, 0, -2348], [2, -2, 0, 0, 2236], [0, 1, 2, 0, -2120],
  [0, 2, 0, 0, -2069], [2, -2, -1, 0, 2048], [2, 0, 1, -2, -1773],
  [2, 0, 0, 2, -1595], [4, -1, -1, 0, 1215], [0, 0, 2, 2, -1110],
  [3, 0, -1, 0, -892], [2, 1, 1, 0, -810], [4, -1, -2, 0, 759],
  [0, 2, -1, 0, -713], [2, 2, -1, 0, -700], [2, 1, -2, 0, 691],
  [2, -1, 0, -2, 596], [4, 0, 1, 0, 549], [0, 0, 4, 0, 537],
  [4, -1, 0, 0, 520], [1, 0, -2, 0, -487], [2, 1, 0, -2, -399],
  [0, 0, 2, -2, -381], [1, 1, 1, 0, 351], [3, 0, -2, 0, -340],
  [4, 0, -3, 0, 330], [2, -1, 2, 0, 327], [0, 2, 1, 0, -323],
  [1, 1, -1, 0, 299], [2, 0, 3, 0, 294]
];

/** Apparent geocentric longitude of the Moon, degrees, mean equinox of date. */
export function moonLongitude(jd) {
  const T = centuries(jd);
  const T2 = T * T, T3 = T2 * T, T4 = T3 * T;

  const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000;
  const D  = 297.8501921 + 445267.1114034 * T - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000;
  const M  = 357.5291092 + 35999.0502909 * T - 0.0001536 * T2 + T3 / 24490000;
  const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T2 + T3 / 69699 - T4 / 14712000;
  const F  =  93.2720950 + 483202.0175233 * T - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000;

  // Eccentricity correction for terms involving the Sun's mean anomaly.
  const E = 1 - 0.002516 * T - 0.0000074 * T2;

  // Additive corrections from Venus, Jupiter and the flattening of the Earth.
  const A1 = 119.75 + 131.849 * T;
  const A2 =  53.09 + 479264.290 * T;

  let sum = 0;
  for (const [d, m, mp, f, coeff] of MOON_TERMS) {
    const arg = (d * D + m * M + mp * Mp + f * F) * DEG;
    let c = coeff;
    if (m === 1 || m === -1) c *= E;
    else if (m === 2 || m === -2) c *= E * E;
    sum += c * Math.sin(arg);
  }
  sum += 3958 * Math.sin(A1 * DEG);
  sum += 1962 * Math.sin((Lp - F) * DEG);
  sum +=  318 * Math.sin(A2 * DEG);

  return norm360(Lp + sum / 1000000);
}

/* ---------- zodiac ---------- */

/**
 * @param {number} lon tropical longitude in degrees
 * @param {'tropical'|'sidereal'} zodiac
 * @returns {number} longitude in the requested zodiac
 */
export function inZodiac(lon, zodiac, jd) {
  return zodiac === 'sidereal' ? norm360(lon - ayanamsa(jd)) : norm360(lon);
}

export function signIndex(lon) {
  return Math.floor(norm360(lon) / 30) % 12;
}

export function sunSignAt(date, zodiac = 'tropical') {
  const jd = toJD(date);
  return signIndex(inZodiac(sunLongitude(jd), zodiac, jd));
}

export function moonSignAt(date, zodiac = 'tropical') {
  const jd = toJD(date);
  return signIndex(inZodiac(moonLongitude(jd), zodiac, jd));
}

/** Illuminated fraction of the Moon's disk, 0..1. Used for the dial artwork. */
export function moonPhase(date) {
  const jd = toJD(date);
  const elong = norm360(moonLongitude(jd) - sunLongitude(jd));
  return {
    angle: elong,
    illumination: (1 - Math.cos(elong * DEG)) / 2,
    waxing: elong < 180
  };
}

/* ---------- ingress solver ---------- */

/**
 * Instant the Moon next crosses `targetLon` at or after `fromDate`.
 * The Moon never retrogrades in longitude, so a coarse forward scan followed
 * by bisection is both safe and exact to the second.
 */
export function nextMoonCrossing(targetLon, fromDate, zodiac = 'tropical') {
  const start = toJD(fromDate);
  const f = (jd) => angleDiff(inZodiac(moonLongitude(jd), zodiac, jd), targetLon);

  const STEP = 0.05;        // ~72 minutes; the Moon moves ~0.66deg per step
  const LIMIT = 32;         // days; one sidereal month plus slack
  let lo = start, flo = f(lo);

  for (let t = start + STEP; t <= start + LIMIT; t += STEP) {
    const ft = f(t);
    if (flo < 0 && ft >= 0) {
      let a = lo, b = t;
      for (let i = 0; i < 60; i++) {
        const mid = (a + b) / 2;
        if (f(mid) < 0) a = mid; else b = mid;
      }
      return fromJD((a + b) / 2);
    }
    lo = t; flo = ft;
  }
  return null;
}

/** Instant the Moon next enters the given sign (0 = Aries). */
export function nextMoonIngress(sign, fromDate, zodiac = 'tropical') {
  return nextMoonCrossing(((sign % 12) + 12) % 12 * 30, fromDate, zodiac);
}
