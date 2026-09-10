/**
 * app.js — state, routing and every event in the app.
 */

import { sunSignAt, moonPhase, SIGNS } from './astro.js';
import { computeWindow, upcomingWindows, windowStatus, moonReport } from './schedule.js';
import * as store from './store.js';
import * as ent from './entitlements.js';
import * as billing from './billing.js';
import * as notify from './notifications.js';
import { viewOnboard, viewWindow, viewProtocol, viewPractice, viewUnlock, viewSettings, tabbar } from './views.js';

export const VERSION = '1.0.0';

const root = document.getElementById('app');
const bar = document.getElementById('tabbar');
const toastEl = document.getElementById('toast');

let route = 'window';
let activePhase = null;
let codeDraft = '';
let obStep = 0;
let draft = { ...store.DEFAULT_PROFILE };
let ticker = null;

/* ----------------------------- state ----------------------------- */

function buildState() {
  const profile = store.loadProfile();
  const owns = Object.fromEntries([...ent.owned()].map((p) => [p, true]));

  if (!profile.onboarded) {
    return { onboarding: true, obStep, draft, profile, owns, version: VERSION };
  }

  const opts = { zodiac: profile.zodiac, leadDays: profile.leadDays, trailDays: profile.trailDays };
  const now = new Date();
  const upcoming = upcomingWindows(profile.sunSign, 7, now, opts);
  const win = upcoming[0] || computeWindow(profile.sunSign, now, opts);

  return {
    onboarding: false,
    profile,
    owns,
    win,
    upcoming,
    status: windowStatus(win, now),
    moon: moonReport(profile.sunSign, now, profile.zodiac),
    phase: moonPhase(now),
    activePhase,
    catalogue: ent.catalogue(),
    redeemed: ent.redeemedCodes(),
    journal: store.loadJournal(),
    codeDraft,
    billingAvailable: billing.available(),
    notifyStatus: notifyStatusLine(profile),
    pendingCount: notify.pending().length,
    version: VERSION
  };
}

function notifyStatusLine(profile) {
  const ch = notify.channel();
  if (!profile.notifications.enabled) return 'Off. Turn on to arm your countdown.';
  if (ch === 'native') return 'On — scheduled with the Android alarm manager. Fires whether or not the app is open.';
  if (ch === 'triggers') return 'On — scheduled by your browser. Fires whether or not Kundala is open.';
  if (ch === 'timers') return 'On — this browser can only fire notifications while Kundala is open in a tab. Install the app for full coverage; anything missed is replayed when you open it.';
  return 'This browser does not support notifications.';
}

/* ----------------------------- render ----------------------------- */

export function render() {
  const s = buildState();

  if (s.onboarding) {
    root.innerHTML = viewOnboard(s);
    bar.hidden = true;
    return;
  }

  bar.hidden = false;
  bar.innerHTML = tabbar(route);
  root.innerHTML = {
    window: viewWindow,
    protocol: viewProtocol,
    practice: viewPractice,
    unlock: viewUnlock,
    settings: viewSettings
  }[route](s);

  root.scrollTop = 0;
  window.scrollTo({ top: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
}

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toastEl.classList.remove('show'), 2800);
}

function go(next) {
  route = next;
  render();
}

/* ----------------------------- actions ----------------------------- */

const actions = {
  /* onboarding */
  'ob:next'() {
    if (obStep === 1 && draft.sunSign === null) return;
    obStep = Math.min(3, obStep + 1);
    render();
  },
  'ob:back'() { obStep = Math.max(0, obStep - 1); render(); },
  'ob:sign'(el) {
    draft.sunSign = Number(el.dataset.sign);
    draft.signSource = 'manual';
    render();
  },
  'ob:zodiac'(el) {
    draft.zodiac = el.dataset.zodiac;
    if (draft.signSource === 'birthdate' && draft.birthdate) applyBirthdate(draft, draft.birthdate);
    render();
  },
  'ob:level'(el) { draft.level = el.dataset.level; render(); },
  'ob:ack'() { draft.acknowledgedSafety = !draft.acknowledgedSafety; render(); },
  'ob:finish'() {
    if (!draft.acknowledgedSafety || draft.sunSign === null) return;
    store.saveProfile({ ...draft, onboarded: true });
    obStep = 0;
    go('window');
    toast('Your window is set.');
  },

  /* navigation */
  go(el) { go(el.dataset.route); },
  'go:phase'(el) { activePhase = el.dataset.phase; go('protocol'); },
  'go:unlock'() { go('unlock'); },
  'go:practice'() { go('practice'); },

  /* unlock */
  'focus:code'() {
    const input = document.getElementById('code-input');
    input?.focus();
    input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  },
  redeem() {
    const input = document.getElementById('code-input');
    const result = ent.redeem(input?.value || '');
    toast(result.message);
    if (result.ok) {
      codeDraft = '';
      if (result.packId === 'premium') resyncNotifications();
      render();
    } else {
      codeDraft = input?.value || '';
    }
  },
  async buy(el) {
    const packId = el.dataset.pack;
    const result = await billing.purchase(packId);
    if (result.ok) {
      toast('Unlocked. Thank you.');
      if (packId === 'premium') resyncNotifications();
      render();
    } else if (result.reason === 'unavailable') {
      toast('Purchases run through Google Play in the Play Store build. On the web, use a code.');
    } else if (result.reason === 'cancelled') {
      toast('Purchase cancelled.');
    } else {
      toast(`Could not complete: ${result.reason}`);
    }
  },
  async restore() {
    const result = await billing.restore();
    if (result.ok && result.restored?.length) { toast('Purchases restored.'); render(); }
    else if (result.ok) toast('Nothing to restore on this account.');
    else toast('Restore is available in the Play Store build.');
  },

  /* settings */
  'set:sign'(el) {
    const p = store.loadProfile();
    p.sunSign = Number(el.dataset.sign);
    p.signSource = 'manual';
    store.saveProfile(p);
    resyncNotifications();
    render();
  },
  'set:zodiac'(el) {
    const p = store.loadProfile();
    p.zodiac = el.dataset.zodiac;
    if (p.signSource === 'birthdate' && p.birthdate) applyBirthdate(p, p.birthdate);
    store.saveProfile(p);
    resyncNotifications();
    render();
    toast(`Recalculated on the ${p.zodiac} zodiac.`);
  },
  'set:level'(el) {
    const p = store.loadProfile();
    p.level = el.dataset.level;
    store.saveProfile(p);
    render();
  },
  'set:lead'(el) { shiftWindow('leadDays', Number(el.dataset.delta)); },
  'set:trail'(el) { shiftWindow('trailDays', Number(el.dataset.delta)); },

  async 'set:notify'() {
    const p = store.loadProfile();
    if (!p.notifications.enabled) {
      const granted = await notify.requestPermission();
      if (!granted) { toast('Notifications were not allowed. Enable them in your device settings.'); return; }
      await notify.ensureChannel();
      p.notifications.enabled = true;
    } else {
      p.notifications.enabled = false;
      await notify.cancelAll();
    }
    store.saveProfile(p);
    await resyncNotifications();
    render();
  },
  'set:step'(el) {
    const p = store.loadProfile();
    const id = el.dataset.step;
    const steps = new Set(p.notifications.steps);
    steps.has(id) ? steps.delete(id) : steps.add(id);
    p.notifications.steps = [...steps];
    store.saveProfile(p);
    resyncNotifications().then(render);
  },
  'set:live'() { toggleNotifyFlag('live'); },
  'set:daily'() { toggleNotifyFlag('daily'); },

  'journal:add'() {
    const el = document.getElementById('journal-input');
    const text = (el?.value || '').trim();
    if (!text) { toast('Nothing to save yet.'); return; }
    store.addJournalEntry({ text, route });
    toast('Saved.');
    render();
  },

  wipe() {
    if (!confirm('Erase your profile, unlocks and journal from this device? This cannot be undone.')) return;
    notify.cancelAll();
    for (const k of ['profile', 'journal', 'entitlements', 'pendingNotifications', 'lastOpen']) store.remove(k);
    draft = { ...store.DEFAULT_PROFILE };
    obStep = 0;
    route = 'window';
    render();
    toast('Erased.');
  }
};

function toggleNotifyFlag(flag) {
  const p = store.loadProfile();
  p.notifications[flag] = !p.notifications[flag];
  store.saveProfile(p);
  resyncNotifications().then(render);
}

function shiftWindow(key, delta) {
  const p = store.loadProfile();
  p[key] = Math.max(0, Math.min(3, p[key] + delta));
  store.saveProfile(p);
  resyncNotifications();
  render();
}

function applyBirthdate(target, value) {
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return;
  // Noon local: keeps the sign stable regardless of the user's timezone.
  const date = new Date(y, m - 1, d, 12, 0, 0);
  target.birthdate = value;
  target.sunSign = sunSignAt(date, target.zodiac);
  target.signSource = 'birthdate';
}

/* -------------------------- notifications -------------------------- */

async function resyncNotifications() {
  const p = store.loadProfile();
  if (!p.onboarded || !ent.has('premium') || !p.notifications.enabled) {
    await notify.cancelAll();
    return;
  }
  const win = computeWindow(p.sunSign, new Date(), {
    zodiac: p.zodiac, leadDays: p.leadDays, trailDays: p.trailDays
  });
  if (!win) return;
  await notify.schedule(notify.planFor(win, p.notifications));
}

/** Anything that came due while the app was shut. */
function replayMissed() {
  const last = store.load('lastOpen', { at: Date.now() - 86400000 }).at;
  store.save('lastOpen', { at: Date.now() });
  const missed = notify.missed(last);
  if (missed.length && ent.has('premium')) {
    toast(missed[missed.length - 1].title);
  }
}

/* ----------------------------- bootstrap ----------------------------- */

function bindEvents() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const fn = actions[el.dataset.action];
    if (!fn) return;
    e.preventDefault();
    fn(el);
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'ob-birth') {
      applyBirthdate(draft, e.target.value);
      render();
    }
    if (e.target.id === 'set-birth') {
      const p = store.loadProfile();
      applyBirthdate(p, e.target.value);
      store.saveProfile(p);
      resyncNotifications();
      render();
      toast(`Your Sun is in ${SIGNS[p.sunSign].name}.`);
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'code-input') codeDraft = e.target.value;
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { replayMissed(); render(); }
  });

  window.addEventListener('pageshow', () => render());
}

function startTicker() {
  clearInterval(ticker);
  // The dial counts down; a minute is fine and costs almost nothing.
  ticker = setInterval(() => {
    if (document.visibilityState === 'visible' && route === 'window' && store.loadProfile().onboarded) render();
  }, 60000);
}

function handleLaunchIntent() {
  const params = new URLSearchParams(location.search);
  if (params.get('from') === 'notification') {
    const tag = params.get('tag') || '';
    route = tag.startsWith('phase:') || tag.startsWith('daily:') ? 'protocol' : 'window';
    if (tag.startsWith('phase:')) activePhase = tag.split(':')[1];
    history.replaceState(null, '', location.pathname);
  }
}

export function boot() {
  draft = { ...store.DEFAULT_PROFILE, ...store.loadProfile() };
  handleLaunchIntent();
  bindEvents();
  replayMissed();
  render();
  startTicker();
  resyncNotifications();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* offline-first is a bonus, not a requirement */ });
  }
}
