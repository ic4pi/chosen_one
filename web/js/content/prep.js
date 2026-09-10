/**
 * prep.js — Premium: the countdown ladder.
 *
 * Each rung is a local notification fired a fixed distance before the window
 * opens, carrying the one thing worth doing at that distance. Users pick which
 * rungs they want in Settings.
 */

export const LEAD_STEPS = [
  {
    id: 'd14',
    offsetMs: 14 * 86400000,
    label: '14 days',
    title: 'Your Kundala Window opens in two weeks',
    body: 'Block the four days now, while the calendar is still empty. This is the only step that gets harder the longer you leave it.',
    guidance: [
      'Put all four days in your calendar as busy.',
      'Check nothing important lands on Phase 3 — that is the day you will be least sharp.',
      'If you take medication, this is the week to ask your doctor about fasting with it.'
    ],
    defaultOn: false
  },
  {
    id: 'd7',
    offsetMs: 7 * 86400000,
    label: '7 days',
    title: 'One week to your window',
    body: 'Start the taper before the taper: pull back sugar and alcohol now and Phase 2 will cost you half as much.',
    guidance: [
      'Cut alcohol from here to the end of the window.',
      'Halve added sugar. The Day 2 crash is mostly a sugar withdrawal.',
      'Buy what you need: mineral salt, electrolytes, herbal tea, broth, lemons.',
      'Bank sleep. Going in tired is the single best predictor of quitting on Day 2.'
    ],
    defaultOn: true
  },
  {
    id: 'd3',
    offsetMs: 3 * 86400000,
    label: '3 days',
    title: 'Three days out',
    body: 'Caffeine down to one cup, before noon. Meals smaller and simpler from here.',
    guidance: [
      'One coffee, morning only. Tomorrow, half.',
      'Meals get simpler: rice, vegetables, soup, fruit.',
      'Tell one person you trust that you are fasting and when.',
      'Last heavy training session is today.'
    ],
    defaultOn: true
  },
  {
    id: 'd1',
    offsetMs: 86400000,
    label: '1 day',
    title: 'Your window opens tomorrow',
    body: 'Last solid food is tomorrow evening. Tonight: hydrate, sleep long, and decide your level before you are hungry.',
    guidance: [
      'Pick your level tonight — Sattvic, Liquid, or Water — not in the middle of Phase 2.',
      'Fill bottles, brew tea, put the salt somewhere visible.',
      'Clear tomorrow evening. Do not open a window on the back of a late night.'
    ],
    defaultOn: true
  },
  {
    id: 'h12',
    offsetMs: 12 * 3600000,
    label: '12 hours',
    title: 'Twelve hours',
    body: 'Make your last meal warm, small and well salted. You are loading minerals, not calories.',
    guidance: [
      'Soup, rice, steamed vegetables. Salt it properly.',
      'Two litres of water between now and the window, spread out.',
      'Set your phone to Do Not Disturb for the four days — Kundala will still reach you.'
    ],
    defaultOn: true
  },
  {
    id: 'h2',
    offsetMs: 2 * 3600000,
    label: '2 hours',
    title: 'Two hours to your window',
    body: 'Kitchen closes. Water from here.',
    guidance: ['Last food now if you have not eaten.', 'Glass of water with a pinch of salt.', 'Sit for five minutes before it opens.'],
    defaultOn: true
  },
  {
    id: 'open',
    offsetMs: 0,
    label: 'At the opening',
    title: 'Your Kundala Window is open',
    body: 'Phase 1, Taper. The Moon reaches your Sun in twenty-four hours.',
    guidance: ['Open the app for tonight’s practice.'],
    defaultOn: true
  }
];

/** Notifications fired inside the window itself. Premium. */
export const LIVE_STEPS = [
  {
    id: 'phase:threshold',
    at: 'phase-start',
    phase: 'threshold',
    title: 'The Moon has entered your Sun',
    body: 'Phase 2 begins. Warm water with salt and lemon, then move gently for ten minutes.'
  },
  {
    id: 'phase:depth',
    at: 'phase-start',
    phase: 'depth',
    title: 'Phase 3 — the clear hours',
    body: 'Hunger usually drops away from here. Keep the electrolytes going anyway.'
  },
  {
    id: 'phase:return',
    at: 'phase-start',
    phase: 'return',
    title: 'The Moon has left your Sun',
    body: 'Phase 4. Do not break the fast yet — read the refeeding steps first. This is the part that matters.'
  },
  {
    id: 'window:close',
    at: 'window-end',
    title: 'Your window is complete',
    body: 'Break with liquid, wait an hour, then something small and soft. Half your normal intake today.'
  },
  {
    id: 'daily:morning',
    at: 'daily',
    hour: 7,
    title: 'Morning of the fast',
    body: 'Warm salted water, ten minutes of movement, then sit. Tap for today’s phase.'
  },
  {
    id: 'daily:evening',
    at: 'daily',
    hour: 20,
    title: 'Evening practice',
    body: 'Long exhales, twice the length of the inhale. Then sleep early — fasted sleep needs more hours.'
  }
];
