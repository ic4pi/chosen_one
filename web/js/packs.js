/**
 * packs.js — the add-on registry.
 *
 * Every feature Kundala sells or gives away is a row in this table. Adding a
 * future add-on means adding a row here and a code marker; nothing else in the
 * app needs to know it exists.
 */

export const PACKS = [
  {
    id: 'core',
    marker: 'C',
    name: 'The Window',
    tagline: 'Free, forever',
    price: null,
    unlock: 'always',
    summary: 'Your four-day Kundala Window, calculated from the real position of the Moon against your Sun, plus the full fasting protocol and safety guidance.',
    features: [
      'Personal window calculator, twelve months ahead',
      'Four-phase protocol with three intensity levels',
      'Complete preparation and refeeding instructions',
      'Safety screening and stop-signs',
      'Works fully offline'
    ]
  },
  {
    id: 'premium',
    marker: 'P',
    name: 'The Keeper',
    tagline: 'One-time purchase',
    price: '$1.99',
    unlock: 'purchase',
    summary: 'Kundala reaches out to you. A countdown ladder of device notifications before the window opens, and live phase alerts inside it that open straight to the practice you need.',
    features: [
      'Preparation countdown — choose from 14 days out to 2 hours out',
      'Live phase notifications the moment the Moon crosses your Sun',
      'Morning and evening practice prompts during the fast',
      'Refeeding alert at the close — the step people get wrong',
      'Window journal with history across cycles',
      'All notifications generated on your device. Nothing leaves it.'
    ]
  },
  {
    id: 'serpent-path',
    marker: 'S',
    name: 'The Serpent Path',
    tagline: 'Free — code from the TikTok channel',
    price: 'Free with code',
    unlock: 'code',
    summary: 'The practice pack. Pranayama, kriyas, bandhas and asana drawn from the hatha and tantric traditions, matched to each phase of your window, plus a plain-language study of what kundalini actually claims.',
    features: [
      'Nadi Shodhana, Kapalabhati, Bhramari, Mula Bandha — full instruction',
      'Six asanas chosen to be safe on an empty stomach',
      'Practices auto-matched to the phase you are in',
      'Five study pieces on the nadis, the centres, and the lunar timing',
      'Adds to Free or to The Keeper. It changes no prices and locks nothing.'
    ],
    codeHint: 'Codes are posted on the TikTok channel. One code, one device.'
  },
  {
    id: 'deep-current',
    marker: 'D',
    name: 'The Deep Current',
    tagline: 'Coming',
    price: 'Announced later',
    unlock: 'purchase',
    coming: true,
    summary: 'Extended and consecutive windows, partner and group fasts on a shared window, guided audio for each phase, and biometric logging.',
    features: ['Extended windows', 'Shared group windows', 'Guided phase audio', 'Weight, sleep and mood logging']
  }
];

export const PACK_BY_ID = Object.fromEntries(PACKS.map((p) => [p.id, p]));
export const PACK_BY_MARKER = Object.fromEntries(PACKS.map((p) => [p.marker, p]));
