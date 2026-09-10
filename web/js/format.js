/** format.js — dates, durations and the dial artwork. */

import { SIGNS } from './astro.js';

const dtDay = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const dtTime = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const dtFull = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
const dtRange = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

export const day = (d) => dtDay.format(d);
export const time = (d) => dtTime.format(d);
export const fullDay = (d) => dtFull.format(d);
export const stamp = (d) => `${dtDay.format(d)}, ${dtTime.format(d)}`;
export const range = (a, b) => `${dtRange.format(a)} – ${dtRange.format(b)}`;

export function countdown(ms) {
  if (ms <= 0) return { big: '0', unit: 'now' };
  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days >= 2) return { big: String(days), unit: 'days' };
  if (hours >= 2) return { big: String(hours), unit: 'hours' };
  if (mins >= 2) return { big: String(mins), unit: 'minutes' };
  return { big: String(Math.max(1, Math.floor(ms / 1000))), unit: 'seconds' };
}

export function duration(ms) {
  const h = Math.round(ms / 3600000);
  if (h < 48) return `${h} hours`;
  return `${(ms / 86400000).toFixed(1)} days`;
}

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * The window dial: a progress ring, four phase ticks, the Moon at its true
 * illumination, and the countdown — all inside the SVG, so the text stays
 * centred at every screen size without any overlay positioning.
 *
 * Zodiac glyphs carry U+FE0E (the text presentation selector) because browsers
 * otherwise render several of them as colour emoji.
 */
export function dialSVG({ progress = 0, illumination = 0.5, waxing = true, sunSign = 0, phases = [], win = null, big = '', unit = '', label = '' }) {
  const R = 92, C = 110, circ = 2 * Math.PI * R;
  const dash = Math.max(0, Math.min(1, progress)) * circ;

  const ticks = phases
    .map((p) => {
      if (!win) return '';
      const t = (p.start - win.start) / (win.end - win.start);
      const rad = ((-90 + t * 360) * Math.PI) / 180;
      const x1 = C + Math.cos(rad) * (R - 8), y1 = C + Math.sin(rad) * (R - 8);
      const x2 = C + Math.cos(rad) * (R + 8), y2 = C + Math.sin(rad) * (R + 8);
      return `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="#2a2637" stroke-width="2" stroke-linecap="round"/>`;
    })
    .join('');

  // The Moon sits above the numerals. Its terminator is an ellipse whose
  // x-radius tracks the lit fraction, which is what a real terminator is.
  const mr = 25, MY = C - 40;
  const rx = (mr * Math.abs(1 - 2 * illumination)).toFixed(2);
  const half = waxing
    ? `M ${C} ${MY - mr} A ${mr} ${mr} 0 0 1 ${C} ${MY + mr} Z`
    : `M ${C} ${MY + mr} A ${mr} ${mr} 0 0 1 ${C} ${MY - mr} Z`;
  const sweep = illumination > 0.5 ? (waxing ? 1 : 0) : (waxing ? 0 : 1);
  const belly = `M ${C} ${MY - mr} A ${rx} ${mr} 0 0 ${sweep} ${C} ${MY + mr} Z`;

  return `<svg class="dial" viewBox="0 0 220 220" role="img"
  aria-label="${esc(label ? `${big} ${unit} ${label}` : 'Kundala window dial')}">
  <defs>
    <linearGradient id="kg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e5c356"/><stop offset="100%" stop-color="#8a6f1c"/>
    </linearGradient>
    <radialGradient id="mg" cx="38%" cy="34%">
      <stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#b9c4d8"/>
    </radialGradient>
  </defs>

  <circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="#201d2c" stroke-width="5"/>
  ${ticks}
  <circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="url(#kg)" stroke-width="5" stroke-linecap="round"
    stroke-dasharray="${dash.toFixed(2)} ${(circ - dash).toFixed(2)}" transform="rotate(-90 ${C} ${C})"/>

  <circle cx="${C}" cy="${MY}" r="${mr}" fill="#15131e" stroke="#2a2637" stroke-width="1"/>
  <path d="${half}" fill="url(#mg)" opacity="${illumination > 0.02 ? 0.95 : 0.05}"/>
  <path d="${belly}" fill="${illumination > 0.5 ? 'url(#mg)' : '#15131e'}" opacity="0.95"/>

  <text x="${C}" y="${C + 22}" text-anchor="middle" fill="#ece7dc"
    font-family="ui-serif, Georgia, 'Times New Roman', serif" font-size="42" letter-spacing="-1">${esc(big)}<tspan
    font-size="14" fill="#6b6579" dx="4">${esc(unit)}</tspan></text>
  <text x="${C}" y="${C + 44}" text-anchor="middle" fill="#c9a227"
    font-family="ui-monospace, Menlo, monospace" font-size="7.4" letter-spacing="1.7">${esc(label.toUpperCase())}</text>
  <text x="${C}" y="${C + 72}" text-anchor="middle" fill="#8a6f1c" font-size="13"
    font-family="ui-serif, Georgia, serif">${SIGNS[sunSign].glyph}\uFE0E</text>
</svg>`;
}
