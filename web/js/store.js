/**
 * store.js — device-local persistence.
 *
 * Everything Kundala knows about you lives here, on your device. There is no
 * account, no sync and no server. The whole app works in airplane mode.
 */

const NS = 'kundala:v1:';

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(NS + key);
    if (raw === null) return structuredClone(fallback);
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) && !Array.isArray(fallback)
      ? { ...structuredClone(fallback), ...parsed }
      : parsed;
  } catch {
    return structuredClone(fallback);
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
    return true;
  } catch {
    return false; // private mode, quota, or storage disabled
  }
}

export function remove(key) {
  try { localStorage.removeItem(NS + key); } catch { /* ignore */ }
}

export const DEFAULT_PROFILE = {
  onboarded: false,
  birthdate: null,        // 'YYYY-MM-DD', optional
  sunSign: null,          // 0-11, required
  signSource: null,       // 'birthdate' | 'manual'
  zodiac: 'tropical',     // 'tropical' | 'sidereal'
  level: 'liquid',
  leadDays: 1,
  trailDays: 1,
  acknowledgedSafety: false,
  notifications: {
    enabled: false,
    steps: ['d7', 'd3', 'd1', 'h12', 'h2', 'open'],
    live: true,
    daily: true
  }
};

export function loadProfile() { return load('profile', DEFAULT_PROFILE); }
export function saveProfile(p) { return save('profile', p); }

export function loadJournal() { return load('journal', []); }
export function saveJournal(entries) { return save('journal', entries); }

export function addJournalEntry(entry) {
  const entries = loadJournal();
  entries.unshift({ id: Date.now(), at: new Date().toISOString(), ...entry });
  saveJournal(entries.slice(0, 500));
  return entries;
}
