/**
 * views.js — every screen, rendered to an HTML string.
 *
 * No framework. Views are pure functions of state; app.js owns the state and
 * handles every click through one delegated listener on [data-action].
 */

import { SIGNS } from './astro.js';
import { PHASES } from './schedule.js';
import { PROTOCOL, SAFETY, LEVELS } from './content/protocol.js';
import { KRIYAS, ASANAS, TEACHING, practicesFor } from './content/vedic.js';
import { LEAD_STEPS } from './content/prep.js';
import { esc, day, time, stamp, range, countdown, duration, fullDay, dialSVG } from './format.js';

/* ============================ onboarding ============================ */

export function viewOnboard(s) {
  const step = s.obStep;
  const dots = [0, 1, 2, 3].map((i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('');

  const body = [obWelcome, obSign, obTuning, obSafety][step](s);

  return `<div class="view ob">
    ${body}
    <div class="dots">${dots}</div>
  </div>`;
}

function obWelcome() {
  return `<div class="center">
    <p class="eyebrow">Kundala</p>
    <h1>The Moon returns to your Sun<br>once every month.</h1>
    <p class="lede">Once each lunar cycle the Moon crosses the sign your Sun was in when you were born. It stays a little over two days.</p>
    <p>Kundala brackets that passage — one day before it arrives, one day after it leaves. Four days. It calculates the exact hours from the real positions of the Sun and Moon, for you specifically, and it works with the network off.</p>
    <button class="primary block" data-action="ob:next">Begin</button>
    <p class="muted" style="margin-top:14px">No account. No sign-up. Nothing leaves your device.</p>
  </div>`;
}

function obSign(s) {
  const grid = SIGNS.map(
    (sg, i) => `<button data-action="ob:sign" data-sign="${i}" aria-pressed="${s.draft.sunSign === i}">
      <span class="g">${sg.glyph}</span><span class="n">${sg.name}</span></button>`
  ).join('');

  return `<div>
    <p class="eyebrow">Step one</p>
    <h1>Where is your Sun?</h1>
    <p>Enter your birthdate and Kundala works it out exactly — including the edge cases, where being born on the 22nd or 23rd puts you in a different sign than the magazine says. Or just tap your sign.</p>

    <label class="field">
      <span class="lbl">Birthdate — optional</span>
      <input type="date" id="ob-birth" value="${s.draft.birthdate || ''}" max="${new Date().toISOString().slice(0, 10)}">
    </label>

    ${s.draft.signSource === 'birthdate' && s.draft.sunSign !== null
      ? `<p class="note good">Your Sun is in <b>${SIGNS[s.draft.sunSign].name} ${SIGNS[s.draft.sunSign].glyph}</b>.</p>`
      : ''}

    <hr class="rule">
    <p class="eyebrow dim">Or choose directly</p>
    <div class="sign-grid">${grid}</div>

    <button class="primary block" style="margin-top:18px" data-action="ob:next"
      ${s.draft.sunSign === null ? 'disabled' : ''}>Continue</button>
    <button class="ghost block" style="margin-top:8px" data-action="ob:back">Back</button>
  </div>`;
}

function obTuning(s) {
  const levels = LEVELS.map(
    (l) => `<button class="chip" data-action="ob:level" data-level="${l.id}" aria-pressed="${s.draft.level === l.id}">
      ${esc(l.name)}${l.recommended ? ' ·' : ''}</button>`
  ).join('');

  return `<div>
    <p class="eyebrow">Step two</p>
    <h1>How you keep time.</h1>

    <div class="card tight">
      <p class="eyebrow dim">Zodiac</p>
      <div class="chips">
        <button class="chip" data-action="ob:zodiac" data-zodiac="tropical" aria-pressed="${s.draft.zodiac === 'tropical'}">Tropical</button>
        <button class="chip" data-action="ob:zodiac" data-zodiac="sidereal" aria-pressed="${s.draft.zodiac === 'sidereal'}">Sidereal · Vedic</button>
      </div>
      <p class="muted" style="margin-top:10px">Tropical is the Western system, measured from the equinox. Sidereal is the system used in Jyotisha, measured against the fixed stars — it currently runs about 24° behind, which can move your Sun back a sign. Change it any time; your window recalculates.</p>
    </div>

    <div class="card tight">
      <p class="eyebrow dim">Your level</p>
      <div class="chips">${levels}</div>
      <p class="muted" style="margin-top:10px">${esc(LEVELS.find((l) => l.id === s.draft.level).detail)}</p>
    </div>

    <button class="primary block" data-action="ob:next">Continue</button>
    <button class="ghost block" style="margin-top:8px" data-action="ob:back">Back</button>
  </div>`;
}

function obSafety(s) {
  return `<div>
    <p class="eyebrow">Step three</p>
    <h1>${esc(SAFETY.headline)}</h1>
    <p class="lede">A four-day fast is a real physiological event. Kundala is a calendar and a coach — it is not a clinician and it does not know your bloodwork.</p>

    <div class="card">
      <p class="eyebrow">Do not fast if</p>
      <ul class="checklist avoid">${SAFETY.hardStops.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>

    <div class="card">
      <p class="eyebrow">Clear it with a doctor first if</p>
      <ul class="checklist plain">${SAFETY.clearFirst.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>

    <p class="note warn">${esc(SAFETY.note)}</p>

    <button class="primary block" data-action="ob:finish" ${s.draft.acknowledgedSafety ? '' : 'disabled'}>
      Open my window</button>
    <button class="ghost block" style="margin-top:8px" data-action="ob:ack" aria-pressed="${s.draft.acknowledgedSafety}">
      ${s.draft.acknowledgedSafety ? '✓ Understood' : 'I have read and understood this'}</button>
  </div>`;
}

/* ============================== window ============================== */

export function viewWindow(s) {
  const { win, status, moon, profile } = s;
  const sign = SIGNS[profile.sunSign];

  const cd = status.state === 'upcoming' ? countdown(status.msUntil) : countdown(status.msUntil);
  const centerLabel =
    status.state === 'upcoming' ? 'until your window opens'
      : status.state === 'active' ? 'left in your window'
        : 'window complete';

  const pips = win.phases.map((p) => {
    const state = status.state === 'active' && status.phase?.id === p.id ? 'now'
      : Date.now() > p.end.getTime() ? 'done' : 'next';
    return `<button class="phase-pip" data-state="${state}" data-action="go:phase" data-phase="${p.id}">
      <span class="n">0${p.ordinal}</span><span class="t">${esc(p.name)}</span></button>`;
  }).join('');

  const banner = status.state === 'active'
    ? `<p class="note good"><b>Phase ${status.phase.ordinal} — ${esc(status.phase.name)}.</b> ${esc(status.phase.tagline)}</p>`
    : status.state === 'upcoming' && status.msUntil < 3 * 86400000
      ? `<p class="note"><b>Your window opens ${esc(fullDay(win.start))}.</b> Start the taper: pull back sugar, alcohol and caffeine from today.</p>`
      : '';

  return `<div class="view">
    ${masthead(s)}
    ${banner}

    <div class="dial-wrap">
      ${dialSVG({
        progress: status.state === 'active' ? status.progress : 0,
        illumination: s.phase.illumination,
        waxing: s.phase.waxing,
        sunSign: profile.sunSign,
        phases: win.phases,
        win,
        big: cd.big,
        unit: cd.unit,
        label: centerLabel
      })}
    </div>

    <div class="card brass">
      <p class="eyebrow">Your Kundala window</p>
      <h2 style="margin-bottom:.5em">${esc(range(win.start, win.end))}</h2>
      <dl class="meta">
        <dt>Opens</dt><dd>${esc(stamp(win.start))}</dd>
        <dt>Ingress</dt><dd>Moon enters ${esc(sign.name)} ${sign.glyph} · ${esc(stamp(win.ingress))}</dd>
        <dt>Egress</dt><dd>Moon leaves ${esc(sign.name)} · ${esc(stamp(win.egress))}</dd>
        <dt>Closes</dt><dd>${esc(stamp(win.end))}</dd>
        <dt>Length</dt><dd>${esc(duration(win.end - win.start))}</dd>
        <dt>Level</dt><dd>${esc(LEVELS.find((l) => l.id === profile.level).name)}</dd>
      </dl>
      <div class="phases">${pips}</div>
    </div>

    <div class="card tight">
      <p class="eyebrow dim">The Moon right now</p>
      <p style="margin:0;color:var(--bone)">
        ${moon.sign.glyph} ${esc(moon.sign.name)} · ${moon.degreesIntoSign.toFixed(1)}°
        <span class="muted"> — ${moon.inSunSign
          ? 'in your Sun sign now'
          : `${moon.signsAway} sign${moon.signsAway === 1 ? '' : 's'} from yours`}</span>
      </p>
      <p class="muted" style="margin:6px 0 0">
        ${Math.round(s.phase.illumination * 100)}% lit and ${s.phase.waxing ? 'waxing' : 'waning'} ·
        ${profile.zodiac === 'sidereal' ? 'sidereal (Lahiri)' : 'tropical'} zodiac
      </p>
    </div>

    <div class="card tight">
      <p class="eyebrow dim">The next windows</p>
      ${s.upcoming.slice(1, 6).map((w) => `<div class="row between" style="padding:8px 0;border-top:1px solid var(--line-soft)">
        <span>${esc(range(w.start, w.end))}</span>
        <span class="muted mono tabnum">${w.durationDays.toFixed(1)}d</span>
      </div>`).join('')}
      <p class="muted" style="margin:10px 0 0">Your window drifts about two days earlier each month — that is the sidereal month, 27.3 days, not the calendar one.</p>
    </div>

    ${s.owns.premium ? '' : `<div class="card">
      <p class="eyebrow">The Keeper</p>
      <h3>Let Kundala reach out to you.</h3>
      <p>Preparation notifications from two weeks out, live alerts the moment the Moon crosses your Sun, and the refeeding prompt at the close — the step people get wrong.</p>
      <button class="primary block" data-action="go:unlock">See what it adds</button>
    </div>`}
  </div>`;
}

function masthead(s) {
  return `<div class="masthead">
    <p class="wordmark">Kund<span>a</span>la</p>
    <span class="badge ${s.owns.premium ? 'owned' : ''}">${s.owns.premium ? 'Keeper' : 'Free'}</span>
  </div>`;
}

/* ============================= protocol ============================= */

export function viewProtocol(s) {
  const active = s.activePhase || (s.status.phase?.id ?? 'taper');

  // A four-across grid rather than chips: the four phase names wrap onto two
  // rows on a narrow phone and read as a broken list.
  const tabs = PHASES.map(
    (p) => `<button class="phase-pip" data-action="go:phase" data-phase="${p.id}"
      data-state="${active === p.id ? 'now' : 'next'}">
      <span class="n">0${p.ordinal}</span><span class="t">${esc(p.name)}</span></button>`
  ).join('');

  const phase = s.win.phases.find((p) => p.id === active);
  const c = PROTOCOL[active];
  const level = LEVELS.find((l) => l.id === s.profile.level);

  const practice = s.owns['serpent-path'] ? practicesFor(active) : null;

  return `<div class="view">
    ${masthead(s)}
    <p class="eyebrow">The protocol</p>
    <h1>${esc(c.heading)}</h1>
    <div class="phases" style="margin-bottom:16px">${tabs}</div>

    <div class="card brass">
      <p class="eyebrow">Phase 0${phase.ordinal} · ${esc(phase.subtitle)}</p>
      <p class="lede" style="margin-bottom:.6em">${esc(c.focus)}</p>
      <dl class="meta">
        <dt>From</dt><dd>${esc(stamp(phase.start))}</dd>
        <dt>Until</dt><dd>${esc(stamp(phase.end))}</dd>
        <dt>Level</dt><dd>${esc(level.name)} — ${esc(level.blurb)}</dd>
      </dl>
    </div>

    <div class="card">
      <p class="eyebrow">Do this</p>
      <ul class="checklist">${c.do.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>

    <div class="card">
      <p class="eyebrow" style="color:var(--alert)">Avoid</p>
      <ul class="checklist avoid">${c.avoid.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>

    <div class="card flat">
      <p class="eyebrow dim">Practice</p>
      <p style="margin:0;color:var(--bone)">${esc(c.practice)}</p>
    </div>

    ${practice ? `<div class="card">
      <p class="eyebrow">Serpent Path · matched to this phase</p>
      ${[...practice.kriyas, ...practice.asanas].map((p) => `<div class="row between" style="padding:9px 0;border-top:1px solid var(--line-soft)">
        <span>${esc(p.name)} <span class="muted">· ${esc(p.english)}</span></span>
        <span class="muted mono">${p.minutes}m</span></div>`).join('')}
      <button class="ghost block" style="margin-top:12px" data-action="go:practice">Open the practice pack</button>
    </div>` : `<div class="card locked-panel">
      <div class="glyph">☾</div>
      <h3>Practices for this phase</h3>
      <p>The Serpent Path adds pranayama, kriyas and asana matched to each phase. It is free — the code is on the TikTok channel.</p>
      <button class="ghost" data-action="go:unlock">Enter a code</button>
    </div>`}

    <div class="card">
      <p class="eyebrow" style="color:var(--alert)">Break the fast now if</p>
      <ul class="checklist avoid">${SAFETY.breakNow.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <p class="muted" style="margin:4px 0 0">Breaking early is never a failure. The window comes back next month.</p>
    </div>
  </div>`;
}

/* ============================= practice ============================= */

export function viewPractice(s) {
  if (!s.owns['serpent-path']) {
    return `<div class="view">
      ${masthead(s)}
      <p class="eyebrow">The Serpent Path</p>
      <h1>Locked — and free.</h1>
      <p class="lede">This pack costs nothing. It unlocks with a code, and the codes are posted on the TikTok channel.</p>
      <div class="card">
        <p class="eyebrow">What it adds</p>
        <ul class="checklist">
          <li>Nadi Shodhana, Kapalabhati, Bhramari and Mula Bandha, taught step by step with their contraindications</li>
          <li>Six asanas chosen to be safe on an empty stomach</li>
          <li>Every practice matched to the phase of the window you are in</li>
          <li>Five study pieces: the nadis, the centres, and why the Moon in your Sun</li>
        </ul>
        <p class="note">It adds to Free or to The Keeper. It changes no prices and it locks nothing that was open.</p>
        <button class="primary block" data-action="go:unlock">Enter a code</button>
      </div>
    </div>`;
  }

  const phaseId = s.status.phase?.id;
  const matched = phaseId ? practicesFor(phaseId) : null;

  const card = (p, kind) => `<details class="acc">
    <summary><span>${esc(p.name)}<small>${esc(p.english)}${kind === 'kriya' ? ` · ${esc(p.type)}` : ''} · ${p.minutes} min</small></span></summary>
    <div class="acc-body">
      <p>${esc(kind === 'kriya' ? p.why : p.serves)}</p>
      ${kind === 'kriya'
        ? `<p class="eyebrow dim">How</p><ul class="checklist">${p.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
           <p class="note warn"><b>Caution.</b> ${esc(p.caution)}</p>`
        : `<p class="eyebrow dim">How</p><p style="color:var(--bone)">${esc(p.cue)}</p>`}
    </div>
  </details>`;

  return `<div class="view">
    ${masthead(s)}
    <p class="eyebrow">The Serpent Path</p>
    <h1>Practice</h1>

    ${matched ? `<div class="card brass">
      <p class="eyebrow">For Phase 0${s.status.phase.ordinal} — ${esc(s.status.phase.name)}, right now</p>
      ${[...matched.kriyas, ...matched.asanas].map((p) => `<div class="row between" style="padding:8px 0;border-top:1px solid var(--line-soft)">
        <span>${esc(p.name)}</span><span class="muted mono">${p.minutes}m</span></div>`).join('')}
    </div>` : `<p class="note">Your window is not open. Everything below is safe to practise between windows too — Nadi Shodhana daily is the one worth building a habit on.</p>`}

    <h2 style="margin-top:22px">Breath &amp; locks</h2>
    ${KRIYAS.map((k) => card(k, 'kriya')).join('')}

    <h2 style="margin-top:22px">Postures</h2>
    ${ASANAS.map((a) => card(a, 'asana')).join('')}

    <h2 style="margin-top:22px">Study</h2>
    ${TEACHING.map((t) => `<details class="acc">
      <summary><span>${esc(t.title)}</span></summary>
      <div class="acc-body">${t.body.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
    </details>`).join('')}
  </div>`;
}

/* ============================== unlock ============================== */

export function viewUnlock(s) {
  const cards = s.catalogue.map((p) => {
    const badge = p.owned ? '<span class="badge owned">Unlocked</span>'
      : p.coming ? '<span class="badge soon">Coming</span>'
        : `<span class="badge locked">${esc(p.price || 'Locked')}</span>`;

    let cta = '';
    if (p.owned) cta = '';
    else if (p.coming) cta = '<button class="ghost block" disabled>Not yet released</button>';
    else if (p.unlock === 'code') cta = `<button class="primary block" data-action="focus:code">Enter your code</button>`;
    else if (p.unlock === 'purchase') {
      cta = s.billingAvailable
        ? `<button class="primary block" data-action="buy" data-pack="${p.id}">Unlock — ${esc(p.price)}</button>`
        : `<button class="primary block" data-action="buy" data-pack="${p.id}">Unlock — ${esc(p.price)}</button>
           <p class="muted center" style="margin:8px 0 0">In-app purchase runs through Google Play in the Play Store build. On the web, unlock with a code.</p>`;
    }

    return `<div class="card ${p.owned ? '' : 'brass'}">
      <div class="row between" style="margin-bottom:10px">
        <div><p class="eyebrow dim" style="margin:0">${esc(p.tagline)}</p><h2 style="margin:2px 0 0">${esc(p.name)}</h2></div>
        ${badge}
      </div>
      <p>${esc(p.summary)}</p>
      <ul class="checklist">${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
      ${p.codeHint ? `<p class="muted">${esc(p.codeHint)}</p>` : ''}
      ${cta}
    </div>`;
  }).join('');

  return `<div class="view">
    ${masthead(s)}
    <p class="eyebrow">Add-ons</p>
    <h1>What you can add.</h1>
    <p>Each pack is a one-time unlock. No subscription, and nothing you already have is ever taken away or moved behind a new price.</p>

    <div class="card flat">
      <p class="eyebrow">Redeem a code</p>
      <label class="field">
        <span class="lbl">Kundala code</span>
        <input type="text" id="code-input" placeholder="KDL-S7K2M-4FQ9" autocomplete="off"
          autocapitalize="characters" spellcheck="false" value="${esc(s.codeDraft || '')}">
      </label>
      <button class="primary block" data-action="redeem">Redeem</button>
      <p class="muted" style="margin:10px 0 0">Codes for The Serpent Path are posted on the TikTok channel. They cost nothing and they take nothing away.</p>
    </div>

    ${cards}

    ${s.redeemed.length ? `<div class="card tight">
      <p class="eyebrow dim">Redeemed on this device</p>
      ${s.redeemed.map((c) => `<div class="mono muted" style="padding:3px 0">${esc(c)}</div>`).join('')}
    </div>` : ''}

    <button class="ghost block" data-action="restore">Restore purchases</button>
  </div>`;
}

/* ============================= settings ============================= */

export function viewSettings(s) {
  const p = s.profile;
  const n = p.notifications;

  const signGrid = SIGNS.map(
    (sg, i) => `<button data-action="set:sign" data-sign="${i}" aria-pressed="${p.sunSign === i}">
      <span class="g">${sg.glyph}</span><span class="n">${sg.name}</span></button>`
  ).join('');

  const leadRows = LEAD_STEPS.map((step) => `<div class="switch">
    <div class="txt"><b>${esc(step.label)} out</b><small>${esc(step.body)}</small></div>
    <button class="toggle" role="switch" aria-checked="${n.steps.includes(step.id)}"
      data-action="set:step" data-step="${step.id}" aria-label="${esc(step.label)} notification"></button>
  </div>`).join('');

  return `<div class="view">
    ${masthead(s)}
    <p class="eyebrow">Settings</p>
    <h1>Your window, tuned.</h1>

    <div class="card">
      <p class="eyebrow">Your Sun</p>
      <label class="field">
        <span class="lbl">Birthdate</span>
        <input type="date" id="set-birth" value="${p.birthdate || ''}" max="${new Date().toISOString().slice(0, 10)}">
      </label>
      <div class="sign-grid">${signGrid}</div>
    </div>

    <div class="card">
      <p class="eyebrow">Zodiac</p>
      <div class="chips">
        <button class="chip" data-action="set:zodiac" data-zodiac="tropical" aria-pressed="${p.zodiac === 'tropical'}">Tropical</button>
        <button class="chip" data-action="set:zodiac" data-zodiac="sidereal" aria-pressed="${p.zodiac === 'sidereal'}">Sidereal · Vedic</button>
      </div>
      <p class="eyebrow dim" style="margin-top:16px">Level</p>
      <div class="chips">${LEVELS.map((l) => `<button class="chip" data-action="set:level" data-level="${l.id}" aria-pressed="${p.level === l.id}">${esc(l.name)}</button>`).join('')}</div>
      <p class="muted" style="margin-top:10px">${esc(LEVELS.find((l) => l.id === p.level).detail)}</p>
    </div>

    <div class="card">
      <p class="eyebrow">Window shape</p>
      <div class="row between" style="padding:8px 0">
        <span>Open <b>${p.leadDays}</b> day${p.leadDays === 1 ? '' : 's'} before ingress</span>
        <div class="row" style="gap:6px">
          <button data-action="set:lead" data-delta="-1" aria-label="fewer lead days">−</button>
          <button data-action="set:lead" data-delta="1" aria-label="more lead days">+</button>
        </div>
      </div>
      <div class="row between" style="padding:8px 0;border-top:1px solid var(--line-soft)">
        <span>Close <b>${p.trailDays}</b> day${p.trailDays === 1 ? '' : 's'} after egress</span>
        <div class="row" style="gap:6px">
          <button data-action="set:trail" data-delta="-1" aria-label="fewer trailing days">−</button>
          <button data-action="set:trail" data-delta="1" aria-label="more trailing days">+</button>
        </div>
      </div>
      <p class="muted" style="margin:10px 0 0">One day either side is the four-day window as taught. Widening it makes a longer fast — read the safety notes again before you do.</p>
    </div>

    ${s.owns.premium ? `<div class="card">
      <p class="eyebrow">Notifications</p>
      <div class="switch">
        <div class="txt"><b>Device notifications</b><small>${esc(s.notifyStatus)}</small></div>
        <button class="toggle" role="switch" aria-checked="${n.enabled}" data-action="set:notify" aria-label="Enable notifications"></button>
      </div>
      ${n.enabled ? `
        ${leadRows}
        <div class="switch">
          <div class="txt"><b>Live phase alerts</b><small>Fires the moment the Moon crosses into and out of your Sun, plus the refeeding prompt at the close.</small></div>
          <button class="toggle" role="switch" aria-checked="${n.live}" data-action="set:live" aria-label="Live alerts"></button>
        </div>
        <div class="switch">
          <div class="txt"><b>Daily practice prompts</b><small>Morning and evening during the window.</small></div>
          <button class="toggle" role="switch" aria-checked="${n.daily}" data-action="set:daily" aria-label="Daily prompts"></button>
        </div>
        <p class="note good" style="margin-top:14px"><b>${s.pendingCount} scheduled</b> for your next window. Every one is generated and fired on this device — Kundala has no server to send them from.</p>
      ` : ''}
    </div>` : `<div class="card locked-panel">
      <div class="glyph">☾</div>
      <h3>Notifications are part of The Keeper</h3>
      <p>A countdown from up to two weeks out, live phase alerts, and the refeeding prompt.</p>
      <button class="primary" data-action="go:unlock">See The Keeper</button>
    </div>`}

    <div class="card">
      <p class="eyebrow">Journal</p>
      ${s.journal.length
        ? s.journal.slice(0, 8).map((e) => `<div style="padding:10px 0;border-top:1px solid var(--line-soft)">
            <div class="muted mono" style="font-size:.7rem">${esc(stamp(new Date(e.at)))}</div>
            <div style="color:var(--bone-dim)">${esc(e.text)}</div></div>`).join('')
        : '<p class="muted">Nothing yet. Fasted writing is unusually honest — and it fades within about two days.</p>'}
      <label class="field" style="margin-top:12px">
        <span class="lbl">New entry</span>
        <textarea id="journal-input" placeholder="What is this window asking of you?"></textarea>
      </label>
      <button class="block" data-action="journal:add">Save entry</button>
    </div>

    <div class="card">
      <p class="eyebrow" style="color:var(--alert)">Safety</p>
      <ul class="checklist avoid">${SAFETY.breakNow.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <p class="muted">${esc(SAFETY.note)}</p>
    </div>

    <div class="card">
      <p class="eyebrow dim">This device</p>
      <p class="muted">Kundala stores everything locally and has no account, no analytics and no network calls of any kind. Clearing data below removes your profile, unlocks and journal from this device permanently.</p>
      <button class="danger block" data-action="wipe">Erase everything on this device</button>
    </div>

    <p class="muted center" style="margin-top:18px">Kundala · version ${esc(s.version)}<br>Not medical advice.</p>
  </div>`;
}

/* ============================== tab bar ============================== */

export function tabbar(route) {
  const ico = {
    window: '<path d="M15.2 3.6a7.5 7.5 0 1 0 3.2 12.2A9 9 0 0 1 15.2 3.6Z"/>',
    protocol: '<path d="M10 2.5 17.5 10 10 17.5 2.5 10Z"/>',
    practice: '<path d="M4 15.5c4.5 0 8-2.2 8-5.2S9 5 6.6 6.4 5.6 11 9 11.6c3.4.6 6-1.6 6-4.4S12.6 3 10.6 3"/>',
    unlock: '<path d="M10 2.2 11.9 8 17.8 10 11.9 12 10 17.8 8.1 12 2.2 10 8.1 8Z"/>',
    settings: '<path d="M10 6.6A3.4 3.4 0 1 0 10 13.4 3.4 3.4 0 0 0 10 6.6Zm7.2 3.4a7.2 7.2 0 0 1-.1 1.1l1.7 1.3-1.7 3-2-.8a7.2 7.2 0 0 1-1.9 1.1l-.3 2.1H9.1l-.3-2.1a7.2 7.2 0 0 1-1.9-1.1l-2 .8-1.7-3 1.7-1.3a7.2 7.2 0 0 1 0-2.2L3.2 7.6l1.7-3 2 .8a7.2 7.2 0 0 1 1.9-1.1l.3-2.1h3.8l.3 2.1a7.2 7.2 0 0 1 1.9 1.1l2-.8 1.7 3-1.7 1.3c.1.4.1.7.1 1.1Z"/>'
  };
  const tabs = [
    { id: 'window', label: 'Window', fill: true },
    { id: 'protocol', label: 'Protocol', fill: true },
    { id: 'practice', label: 'Practice', fill: false },
    { id: 'unlock', label: 'Unlock', fill: true },
    { id: 'settings', label: 'You', fill: true }
  ];
  return tabs.map((t) => `<button data-action="go" data-route="${t.id}"
    ${route === t.id ? 'aria-current="page"' : ''}>
    <svg class="ico" viewBox="0 0 20 20" width="19" height="19" aria-hidden="true"
      fill="${t.fill ? 'currentColor' : 'none'}" stroke="${t.fill ? 'none' : 'currentColor'}"
      stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ico[t.id]}</svg>
    <span class="lbl">${t.label}</span></button>`).join('');
}
