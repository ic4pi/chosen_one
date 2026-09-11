/**
 * notifications.js — device-side scheduling, no server, no push service.
 *
 * Three delivery paths, tried in order:
 *   1. Capacitor LocalNotifications  — the Google Play build. True OS-level
 *      alarms that survive the app being closed.
 *   2. Web Notification Triggers     — Chromium PWAs. Same guarantee, no app.
 *   3. In-page timers                 — every other browser. Fires while the tab
 *      is alive; the app also replays anything it missed on next open.
 *
 * Nothing here talks to a network. There is no FCM sender, no VAPID key, no
 * subscription endpoint — which is also why the app needs no privacy policy
 * beyond "it never leaves your phone".
 */

import { LEAD_STEPS, LIVE_STEPS } from './content/prep.js';
import { load, save } from './store.js';

const PENDING_KEY = 'pendingNotifications';

export function capacitorPlugin() {
  const cap = globalThis.Capacitor;
  return cap?.isNativePlatform?.() ? cap.Plugins?.LocalNotifications : null;
}

export function channel() {
  if (capacitorPlugin()) return 'native';
  if (typeof Notification === 'undefined') return 'none';
  if ('showTrigger' in (globalThis.Notification?.prototype || {})) return 'triggers';
  return 'timers';
}

export function permission() {
  if (capacitorPlugin()) return 'native';
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

export async function requestPermission() {
  const plugin = capacitorPlugin();
  if (plugin) {
    const res = await plugin.requestPermissions();
    return res.display === 'granted';
  }
  if (typeof Notification === 'undefined') return false;
  const res = await Notification.requestPermission();
  return res === 'granted';
}

/**
 * Build the full notification plan for a window.
 * @returns {Array<{id:number, at:number, title:string, body:string, tag:string}>}
 */
export function planFor(win, settings) {
  const now = Date.now();
  const out = [];
  let seq = 1;
  const push = (at, title, body, tag) => {
    if (at > now) out.push({ id: seq++, at, title, body, tag });
  };

  for (const step of LEAD_STEPS) {
    if (!settings.steps.includes(step.id)) continue;
    push(win.start.getTime() - step.offsetMs, step.title, step.body, `lead:${step.id}`);
  }

  if (settings.live) {
    for (const step of LIVE_STEPS.filter((s) => s.at === 'phase-start')) {
      const phase = win.phases.find((p) => p.id === step.phase);
      if (phase) push(phase.start.getTime(), step.title, step.body, step.id);
    }
    const close = LIVE_STEPS.find((s) => s.at === 'window-end');
    push(win.end.getTime(), close.title, close.body, close.id);
  }

  if (settings.daily) {
    for (const step of LIVE_STEPS.filter((s) => s.at === 'daily')) {
      for (let d = new Date(win.start); d <= win.end; d = new Date(d.getTime() + 86400000)) {
        const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), step.hour, 0, 0, 0).getTime();
        if (at >= win.start.getTime() && at <= win.end.getTime()) {
          push(at, step.title, step.body, `${step.id}:${new Date(at).toDateString()}`);
        }
      }
    }
  }

  return out.sort((a, b) => a.at - b.at).map((n, i) => ({ ...n, id: i + 1 }));
}

export async function cancelAll() {
  const plugin = capacitorPlugin();
  if (plugin) {
    const pending = await plugin.getPending();
    if (pending.notifications?.length) await plugin.cancel({ notifications: pending.notifications });
  }
  for (const t of timers) clearTimeout(t);
  timers.length = 0;
  const reg = await registration();
  if (reg) {
    for (const n of await reg.getNotifications({ includeTriggered: false })) n.close();
  }
  save(PENDING_KEY, []);
}

const timers = [];

async function registration() {
  try {
    return navigator.serviceWorker ? await navigator.serviceWorker.ready : null;
  } catch {
    return null;
  }
}

/** Schedule a plan. Returns the number of notifications actually armed. */
export async function schedule(plan) {
  await cancelAll();
  save(PENDING_KEY, plan);
  if (!plan.length) return 0;

  const plugin = capacitorPlugin();
  if (plugin) {
    await plugin.schedule({
      notifications: plan.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        schedule: { at: new Date(n.at), allowWhileIdle: true },
        smallIcon: 'ic_stat_kundala',
        channelId: 'kundala-window',
        extra: { tag: n.tag }
      }))
    });
    return plan.length;
  }

  const mode = channel();
  const reg = await registration();

  if (mode === 'triggers' && reg) {
    for (const n of plan) {
      try {
        await reg.showNotification(n.title, {
          body: n.body,
          tag: n.tag,
          icon: './icons/icon-192.png',
          badge: './icons/badge-72.png',
          /* eslint-disable-next-line no-undef */
          showTrigger: new TimestampTrigger(n.at),
          data: { url: `./?from=notification&tag=${encodeURIComponent(n.tag)}` }
        });
      } catch {
        armTimer(n, reg);
      }
    }
    return plan.length;
  }

  for (const n of plan) armTimer(n, reg);
  return plan.length;
}

function armTimer(n, reg) {
  const delay = n.at - Date.now();
  // setTimeout tops out around 24.8 days; anything beyond is replayed on open.
  if (delay <= 0 || delay > 2 ** 31 - 1) return;
  timers.push(setTimeout(() => fire(n, reg), delay));
}

async function fire(n, reg) {
  const options = {
    body: n.body,
    tag: n.tag,
    icon: './icons/icon-192.png',
    badge: './icons/badge-72.png',
    data: { url: `./?from=notification&tag=${encodeURIComponent(n.tag)}` }
  };
  try {
    if (reg) await reg.showNotification(n.title, options);
    else new Notification(n.title, options);
  } catch { /* permission revoked mid-flight */ }
}

/**
 * Anything that came due while the app was closed and the device could not
 * deliver it. Shown as an in-app banner so the user never silently misses a rung.
 */
export function missed(since) {
  const now = Date.now();
  return load(PENDING_KEY, []).filter((n) => n.at <= now && n.at > since);
}

export function pending() {
  const now = Date.now();
  return load(PENDING_KEY, []).filter((n) => n.at > now);
}

/** Android needs its channel created once before anything is scheduled. */
export async function ensureChannel() {
  const plugin = capacitorPlugin();
  if (!plugin?.createChannel) return;
  try {
    await plugin.createChannel({
      id: 'kundala-window',
      name: 'Kundala Window',
      description: 'Preparation countdown and live phase alerts for your fast.',
      importance: 4,
      visibility: 1,
      vibration: true
    });
  } catch { /* older plugin versions */ }
}
