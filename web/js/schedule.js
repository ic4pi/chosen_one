/**
 * schedule.js — the Kundala Window.
 *
 * The rule, in one sentence: the fast opens one day before the Moon steps into
 * the sign your Sun occupies, and closes one day after it steps out.
 *
 * The Moon holds a sign for roughly 2.2 days, so a day on either side yields a
 * window of about 4.2 days — the four-day fast.
 */

import { nextMoonIngress, SIGNS, toJD, moonLongitude, inZodiac, signIndex } from './astro.js';

export const DAY = 86400000;

export const PHASES = [
  {
    id: 'taper',
    ordinal: 1,
    name: 'Taper',
    subtitle: 'The day before ingress',
    tagline: 'Empty the vessel before you ask it to hold light.'
  },
  {
    id: 'threshold',
    ordinal: 2,
    name: 'Threshold',
    subtitle: 'The Moon enters your Sun',
    tagline: 'The gate opens. Meet it awake.'
  },
  {
    id: 'depth',
    ordinal: 3,
    name: 'Depth',
    subtitle: 'The Moon crosses your Sun',
    tagline: 'The hardest hours and the clearest ones.'
  },
  {
    id: 'return',
    ordinal: 4,
    name: 'Return',
    subtitle: 'The day after egress',
    tagline: 'How you leave a fast decides what it was worth.'
  }
];

/**
 * Compute the fast window for a given Sun sign.
 *
 * @param {number} sunSign          0 = Aries ... 11 = Pisces
 * @param {Date}   from             search anchor
 * @param {object} opts
 * @param {'tropical'|'sidereal'} opts.zodiac
 * @param {number} opts.leadDays    days before ingress the fast opens (default 1)
 * @param {number} opts.trailDays   days after egress the fast closes (default 1)
 * @returns {object|null}
 */
export function computeWindow(sunSign, from = new Date(), opts = {}) {
  const zodiac = opts.zodiac || 'tropical';
  const leadDays = opts.leadDays ?? 1;
  const trailDays = opts.trailDays ?? 1;

  // Look back far enough to catch a window already underway.
  const anchor = new Date(from.getTime() - 6 * DAY);

  let ingress = nextMoonIngress(sunSign, anchor, zodiac);
  if (!ingress) return null;
  let egress = nextMoonIngress(sunSign + 1, ingress, zodiac);
  if (!egress) return null;

  let end = new Date(egress.getTime() + trailDays * DAY);

  // If that window has already closed, roll forward to the next lunar month.
  if (end.getTime() < from.getTime()) {
    ingress = nextMoonIngress(sunSign, new Date(egress.getTime() + DAY), zodiac);
    if (!ingress) return null;
    egress = nextMoonIngress(sunSign + 1, ingress, zodiac);
    if (!egress) return null;
    end = new Date(egress.getTime() + trailDays * DAY);
  }

  const start = new Date(ingress.getTime() - leadDays * DAY);
  const mid = new Date((ingress.getTime() + egress.getTime()) / 2);

  // A zero-day lead or trail collapses a phase to nothing — that is how a
  // three-day window is made. All four stay in the list so every view can still
  // find one by id; a collapsed phase is marked `skipped`, meaning its guidance
  // still applies, it just falls outside the window rather than inside it.
  const phases = [
    { ...PHASES[0], start, end: ingress },
    { ...PHASES[1], start: ingress, end: mid },
    { ...PHASES[2], start: mid, end: egress },
    { ...PHASES[3], start: egress, end }
  ].map((p) => ({ ...p, skipped: p.end.getTime() <= p.start.getTime() }));

  return {
    sunSign,
    sign: SIGNS[sunSign],
    zodiac,
    start,
    ingress,
    egress,
    end,
    phases,
    durationDays: (end - start) / DAY,
    /** Calendar days the window touches, in local time. */
    calendarDays: countCalendarDays(start, end)
  };
}

/** The next `count` windows, oldest first. */
export function upcomingWindows(sunSign, count = 6, from = new Date(), opts = {}) {
  const out = [];
  let cursor = from;
  for (let i = 0; i < count; i++) {
    const w = computeWindow(sunSign, cursor, opts);
    if (!w) break;
    out.push(w);
    cursor = new Date(w.egress.getTime() + 2 * DAY);
  }
  return out;
}

function countCalendarDays(start, end) {
  const a = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const b = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((b - a) / DAY) + 1;
}

/** Where `now` sits relative to a window. */
export function windowStatus(win, now = new Date()) {
  const t = now.getTime();
  if (t < win.start.getTime()) {
    return {
      state: 'upcoming',
      msUntil: win.start.getTime() - t,
      phase: null,
      progress: 0
    };
  }
  if (t > win.end.getTime()) {
    return { state: 'complete', msUntil: 0, phase: null, progress: 1 };
  }
  const live = win.phases.filter((p) => !p.skipped);
  const phase = live.find((p) => t >= p.start.getTime() && t < p.end.getTime()) || live[live.length - 1];
  const span = phase.end.getTime() - phase.start.getTime();
  return {
    state: 'active',
    msUntil: win.end.getTime() - t,
    phase,
    progress: (t - win.start.getTime()) / (win.end.getTime() - win.start.getTime()),
    phaseProgress: span > 0 ? (t - phase.start.getTime()) / span : 1
  };
}

/** Live position of the Moon relative to the user's Sun sign. */
export function moonReport(sunSign, now = new Date(), zodiac = 'tropical') {
  const jd = toJD(now);
  const lon = inZodiac(moonLongitude(jd), zodiac, jd);
  const idx = signIndex(lon);
  const degreesIntoSign = lon - idx * 30;
  const signsAway = ((sunSign - idx) % 12 + 12) % 12;
  return {
    longitude: lon,
    sign: SIGNS[idx],
    signIndex: idx,
    degreesIntoSign,
    signsAway,
    inSunSign: idx === sunSign
  };
}
