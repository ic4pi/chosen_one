/**
 * vedic.js — "The Serpent Path" add-on pack.
 *
 * Unlocked with a free code given out on the TikTok channel. It adds practice
 * and study; it changes no prices and gates nothing that was free.
 */

export const KRIYAS = [
  {
    id: 'nadi-shodhana',
    name: 'Nadi Shodhana',
    english: 'Alternate-nostril breathing',
    type: 'Pranayama',
    minutes: 10,
    bestIn: ['taper', 'threshold', 'depth', 'return'],
    why: 'The tradition calls it the cleaning of the channels — balancing Ida and Pingala so that energy can rise the central channel rather than leaking sideways. In plainer terms: it reliably settles the nervous system and evens out the mood swings of a fast.',
    steps: [
      'Sit with the spine stacked, shoulders soft, chin very slightly down.',
      'Right thumb closes the right nostril. Inhale left, four counts.',
      'Ring finger closes the left. Hold, four counts — release the hold if it strains.',
      'Open the right, exhale right, six to eight counts.',
      'Inhale right, close, exhale left. That is one round.',
      'Nine rounds to begin. Build toward eighteen. Finish on an exhale through the left.'
    ],
    caution: 'Skip the retention entirely if you are pregnant, hypertensive, or lightheaded. The breath should never feel like fighting.'
  },
  {
    id: 'kapalabhati',
    name: 'Kapalabhati',
    english: 'Skull-shining breath',
    type: 'Kriya',
    minutes: 5,
    bestIn: ['taper', 'threshold'],
    why: 'Sharp passive-inhale, active-exhale pumping that wakes the solar plexus and clears the fog of the first fasted morning.',
    steps: [
      'Sit tall, hands on the knees, belly unclenched.',
      'Inhale halfway and let it sit there.',
      'Snap the lower belly in to push a short exhale out through the nose. The inhale returns on its own.',
      'Thirty strokes at about one per second. Stop. Breathe normally for a minute.',
      'Three rounds. No more on an empty stomach.'
    ],
    caution: 'Not during Phase 3 or 4 — too stimulating on low blood sugar. Never with high blood pressure, glaucoma, epilepsy, hernia, or during pregnancy or menstruation.'
  },
  {
    id: 'bhramari',
    name: 'Bhramari',
    english: 'Humming-bee breath',
    type: 'Pranayama',
    minutes: 6,
    bestIn: ['depth', 'return'],
    why: 'The hum vibrates the skull and lengthens the exhale without effort. It is the most forgiving practice in the pack and the one that works best when you are depleted.',
    steps: [
      'Close the ears lightly with the thumbs, fingers resting over the eyes.',
      'Inhale through the nose, unhurried.',
      'Exhale on a low, steady hum with the mouth closed. Let it last as long as it lasts.',
      'Seven rounds. Then sit in the silence afterward — that silence is the point.'
    ],
    caution: 'None to speak of. Safe on any day of the window.'
  },
  {
    id: 'mula-bandha',
    name: 'Mula Bandha',
    english: 'Root lock',
    type: 'Bandha',
    minutes: 5,
    bestIn: ['threshold', 'depth'],
    why: 'The seal at the base of the spine. In the classical account it is what stops energy from draining downward, so that what is gathered can rise instead.',
    steps: [
      'Sit. Exhale fully.',
      'Draw the pelvic floor gently up and in — the muscle you would use to stop the flow of urine, at about a third of full strength.',
      'Hold for five breaths, keeping the face, jaw and belly soft.',
      'Release completely. Rest five breaths. Five cycles.'
    ],
    caution: 'Gentle is correct. Gripping hard achieves the opposite and gives you a sore pelvic floor.'
  }
];

export const ASANAS = [
  {
    id: 'sukhasana',
    name: 'Sukhasana',
    english: 'Easy seat',
    minutes: 10,
    bestIn: ['taper', 'threshold', 'depth', 'return'],
    cue: 'Sit cross-legged on the front edge of a cushion so the hips sit above the knees and the lower back keeps its curve. If the knees float, raise the cushion, do not force the knees.',
    serves: 'The seat every other practice happens in. Most people can hold nothing longer than four minutes because their hips are below their knees.'
  },
  {
    id: 'bhujangasana',
    name: 'Bhujangasana',
    english: 'Cobra',
    minutes: 4,
    bestIn: ['taper', 'threshold'],
    cue: 'Face down, hands under the shoulders, elbows in. Press the tops of the feet down and lift the chest with the back muscles more than the arms. Shoulders away from the ears. Five slow breaths, three rounds.',
    serves: 'The serpent posture — it opens the front of the body along the whole line of the spine, and it is a kind one to do on an empty stomach.'
  },
  {
    id: 'setu-bandha',
    name: 'Setu Bandhasana',
    english: 'Bridge',
    minutes: 5,
    bestIn: ['threshold', 'depth'],
    cue: 'On your back, feet hip-width and close to the hips. Press the feet down, lift the hips, let the chest come toward the chin rather than the chin toward the chest. Eight breaths, three rounds.',
    serves: 'Opens the chest and the front of the hips without any load on the belly. Very safe when energy is low.'
  },
  {
    id: 'viparita-karani',
    name: 'Viparita Karani',
    english: 'Legs up the wall',
    minutes: 12,
    bestIn: ['depth', 'return'],
    cue: 'Hips near a wall, legs resting up it, a folded blanket under the hips. Arms wide. Stay ten to fifteen minutes and let the breath do whatever it wants.',
    serves: 'The single most useful posture in a deep fast: restorative, drains the legs, drops the heart rate, and asks nothing of you.'
  },
  {
    id: 'balasana',
    name: 'Balasana',
    english: 'Child’s pose',
    minutes: 5,
    bestIn: ['depth', 'return'],
    cue: 'Knees wide, big toes together, hips back toward the heels, forehead down on the floor or a block. Breathe into the back of the ribs.',
    serves: 'Where to go when a wave of hunger or emotion arrives. Both pass faster here than standing in the kitchen.'
  },
  {
    id: 'savasana',
    name: 'Savasana',
    english: 'Corpse pose',
    minutes: 15,
    bestIn: ['taper', 'threshold', 'depth', 'return'],
    cue: 'Flat on the back, blanket over you — you will get cold. Palms up, feet falling open. Do not sleep; stay at the edge of it.',
    serves: 'Closes every session. Fasting plus stillness is where most of the reported effects actually come from.'
  }
];

export const TEACHING = [
  {
    id: 'what',
    title: 'What kundalini actually names',
    body: [
      'Kundalini is described in the tantric and hatha texts as a coiled potential resting at the base of the spine — kundalini, from kundala, the coiled ring. The image is a serpent asleep in three and a half turns at the muladhara, the root.',
      'The practice is not about generating something new. In the classical account the energy is already present and already yours; what practice does is remove the obstructions in the central channel, the sushumna, so that what is coiled can uncoil and rise.',
      'Fasting enters here for a simple reason: digestion is expensive. The tradition treats a body busy converting food as a body with less available for anything else. Empty the system and the same energy becomes free.'
    ]
  },
  {
    id: 'nadis',
    title: 'Ida, Pingala, Sushumna',
    body: [
      'Three channels carry the story. Ida runs on the left — lunar, cooling, receptive, tied to the left nostril and the right hemisphere. Pingala runs on the right — solar, heating, active. Sushumna is the central channel between them.',
      'The texts say sushumna only opens when the other two are balanced, which is why so much of the practice is breath work that evens out the nostrils. This is not merely poetic: nasal dominance genuinely alternates in cycles of roughly ninety minutes to two hours, and it does shift with the practices in this pack.',
      'This is the mechanical argument for Nadi Shodhana being the first practice you learn and the last one you drop.'
    ]
  },
  {
    id: 'chakras',
    title: 'The seven centres',
    body: [
      'Muladhara at the base — ground, safety, survival. Svadhisthana at the sacrum — appetite, creativity, water. Manipura at the navel — the fire that digests food and experience alike; the centre a fast works on most directly.',
      'Anahata at the heart — the hinge between the lower three and the upper three. Vishuddha at the throat — expression and truthfulness. Ajna between the brows — witnessing. Sahasrara at the crown — where the ascent completes.',
      'Read them as a map of attention rather than anatomy. Their value is that they give you somewhere specific to put your awareness, and specific beats vague every time.'
    ]
  },
  {
    id: 'moon',
    title: 'Why the Moon in your Sun',
    body: [
      'The Sun in a natal chart marks the sign the Sun occupied at your birth — in this tradition, the seat of your own solar principle. The Moon returns to that sign once every sidereal month, roughly every 27.3 days, and stays about two and a quarter days.',
      'The Kundala Window brackets that passage: one day before the Moon arrives, the passage itself, one day after it leaves. Four days. Lunar meeting solar, in the place your solar sits.',
      'Kundala computes this from the actual positions of the Sun and Moon rather than from a fixed calendar, which is why your window drifts about two days earlier each month, and why it belongs to you specifically and not to everyone at once.'
    ]
  },
  {
    id: 'signs',
    title: 'Honest limits',
    body: [
      'What is well established: multi-day fasting produces measurable metabolic change — ketosis, autophagy signalling, insulin sensitivity — and that is a genuine physiological event with genuine risks.',
      'What is traditional rather than tested: the chakra map, the nadi model, and the astrological timing. They are a symbolic and contemplative framework with a long history, not a clinical one.',
      'Kundala keeps those two categories apart on purpose. Take the safety guidance as medicine-adjacent and the rest as a practice you are choosing. Both can be worth doing; only one of them should be arguing with your doctor.'
    ]
  }
];

/** Practice list appropriate to a given phase id. */
export function practicesFor(phaseId) {
  return {
    kriyas: KRIYAS.filter((k) => k.bestIn.includes(phaseId)),
    asanas: ASANAS.filter((a) => a.bestIn.includes(phaseId))
  };
}
