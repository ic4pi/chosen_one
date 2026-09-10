import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeWindow, upcomingWindows, windowStatus, moonReport, PHASES } from '../web/js/schedule.js';
import { moonSignAt } from '../web/js/astro.js';

const FROM = new Date(Date.UTC(2026, 8, 10, 12));

test('every sign produces a window of about four days', () => {
  for (let sign = 0; sign < 12; sign++) {
    const w = computeWindow(sign, FROM);
    assert.ok(w, `no window for sign ${sign}`);
    assert.ok(w.durationDays > 3.9 && w.durationDays < 4.6,
      `sign ${sign} gave ${w.durationDays.toFixed(2)} days`);
  }
});

test('the window brackets the moon passing through the sun sign', () => {
  const w = computeWindow(4, FROM);
  assert.equal(moonSignAt(new Date(w.ingress.getTime() + 3600000)), 4);
  assert.equal(moonSignAt(new Date(w.egress.getTime() - 3600000)), 4);
  assert.notEqual(moonSignAt(new Date(w.start.getTime() + 3600000)), 4);
  assert.notEqual(moonSignAt(new Date(w.end.getTime() - 3600000)), 4);
});

test('opens exactly one day before ingress and closes one day after egress', () => {
  const w = computeWindow(9, FROM);
  assert.equal(w.ingress - w.start, 86400000);
  assert.equal(w.end - w.egress, 86400000);
});

test('lead and trail days are configurable', () => {
  const w = computeWindow(2, FROM, { leadDays: 2, trailDays: 0 });
  assert.equal(w.ingress - w.start, 2 * 86400000);
  assert.equal(w.end - w.egress, 0);
});

test('the four phases tile the window without gaps or overlaps', () => {
  const w = computeWindow(6, FROM);
  assert.equal(w.phases.length, 4);
  assert.equal(w.phases[0].start.getTime(), w.start.getTime());
  assert.equal(w.phases[3].end.getTime(), w.end.getTime());
  for (let i = 1; i < 4; i++) {
    assert.equal(w.phases[i].start.getTime(), w.phases[i - 1].end.getTime());
  }
  assert.deepEqual(w.phases.map((p) => p.id), PHASES.map((p) => p.id));
});

test('a window already underway is returned rather than skipped', () => {
  const w = computeWindow(1, FROM);
  const mid = new Date((w.start.getTime() + w.end.getTime()) / 2);
  const again = computeWindow(1, mid);
  assert.equal(again.start.getTime(), w.start.getTime());
  assert.equal(windowStatus(again, mid).state, 'active');
});

test('status reports the right phase at each point', () => {
  const w = computeWindow(0, FROM);
  assert.equal(windowStatus(w, new Date(w.start.getTime() - 86400000)).state, 'upcoming');
  assert.equal(windowStatus(w, new Date(w.end.getTime() + 86400000)).state, 'complete');
  for (const p of w.phases) {
    const inside = new Date((p.start.getTime() + p.end.getTime()) / 2);
    const st = windowStatus(w, inside);
    assert.equal(st.state, 'active');
    assert.equal(st.phase.id, p.id);
    assert.ok(st.progress >= 0 && st.progress <= 1);
  }
});

test('upcoming windows are ordered, non-overlapping and monthly', () => {
  const list = upcomingWindows(5, 6, FROM);
  assert.equal(list.length, 6);
  for (let i = 1; i < list.length; i++) {
    assert.ok(list[i].start > list[i - 1].end, 'windows overlap');
    const gap = (list[i].ingress - list[i - 1].ingress) / 86400000;
    assert.ok(gap > 26.8 && gap < 28.0, `gap of ${gap.toFixed(2)} days`);
  }
});

test('sidereal windows are shifted but still four days', () => {
  const t = computeWindow(4, FROM, { zodiac: 'tropical' });
  const s = computeWindow(4, FROM, { zodiac: 'sidereal' });
  assert.ok(s.durationDays > 3.9 && s.durationDays < 4.6);
  assert.notEqual(t.ingress.getTime(), s.ingress.getTime());
});

test('moon report locates the moon relative to the sun sign', () => {
  const w = computeWindow(8, FROM);
  const during = moonReport(8, new Date(w.ingress.getTime() + 3600000));
  assert.equal(during.inSunSign, true);
  assert.equal(during.signsAway, 0);
  const before = moonReport(8, new Date(w.start.getTime() - 5 * 86400000));
  assert.ok(before.signsAway > 0 && before.signsAway < 12);
});
