/**
 * protocol.js — the free-tier fasting instructions.
 * Plain, practical, and safety-first. This is what every user gets.
 */

export const LEVELS = [
  {
    id: 'sattvic',
    name: 'Sattvic Light',
    intensity: 1,
    blurb: 'One simple meal a day: fruit, soaked nuts, khichdi, broth. The gentlest door in.',
    detail: 'Best for a first Kundala Window, for anyone under stress or heavy training load, and for anyone who has never fasted past a single day.'
  },
  {
    id: 'liquid',
    name: 'Liquid',
    intensity: 2,
    blurb: 'Water, herbal tea, clear broth, diluted juice. No solids for the middle two phases.',
    detail: 'The default. Keeps electrolytes and a trickle of glucose available while still emptying the digestive fire.',
    recommended: true
  },
  {
    id: 'water',
    name: 'Water Only',
    intensity: 3,
    blurb: 'Water and electrolytes alone across the full window.',
    detail: 'Traditional and demanding. Only for the experienced, only with medical clearance, and never alone in the house.'
  }
];

export const PROTOCOL = {
  taper: {
    heading: 'Empty the vessel',
    focus: 'Digestion winds down. You are not fasting yet — you are closing the kitchen.',
    do: [
      'Last solid food by early evening. Make it small, warm and simple: soup, rice, steamed vegetables.',
      'Cut caffeine to half a cup, taken before noon. Cutting it cold on Day 2 is where most headaches come from.',
      'No alcohol, no sugar, no fried food, no large protein loads.',
      'Drink 2-3 litres of water across the day, spread out, not in gulps.',
      'Salt your last meal properly. You are loading minerals for four days.',
      'Set your window: tell the people you live with, clear your calendar of anything that needs a sharp edge.'
    ],
    avoid: ['Heavy training', 'A last "farewell" feast — it makes the first 24 hours far worse', 'Starting a fast on the back of a bad night of sleep'],
    practice: 'Ten minutes of long, slow exhales at night. Exhale twice as long as you inhale. This starts the shift from doing to receiving.'
  },
  threshold: {
    heading: 'The gate opens',
    focus: 'The Moon steps into your Sun. Hunger arrives in waves and each wave passes in about twenty minutes.',
    do: [
      'Water on waking, warm, with a pinch of mineral salt and a squeeze of lemon.',
      'Keep moving gently — a walk, slow stretching. Motion moves lymph and blunts hunger.',
      'Electrolytes matter more than calories: sodium, potassium, magnesium. A pinch of salt in water every few hours.',
      'Herbal tea on the hour is a legitimate tool. Ginger, tulsi, peppermint, chamomile.',
      'Expect a mood dip in the late afternoon. It is blood sugar, not a message from the universe.',
      'Sleep early. Fasted sleep is lighter, so give it more hours.'
    ],
    avoid: ['Driving long distances', 'Hot saunas or hot yoga', 'Any decision you would not make rested and fed'],
    practice: 'Sit for fifteen minutes at the same hour you would normally eat lunch. Do not fill the hour — let it stay empty. That emptiness is the whole exercise.'
  },
  depth: {
    heading: 'The clear hours',
    focus: 'Hunger usually drops away here. What replaces it is a strange, wide alertness — and, often, whatever you have been avoiding.',
    do: [
      'Keep the electrolytes going even though you feel fine. Feeling fine is exactly when people stop and then crash.',
      'Reduce input: less scrolling, less noise, less talking. The signal you are listening for is quiet.',
      'Warmth. Fasting drops your body temperature — layers, blankets, warm drinks.',
      'Write. Fasted writing is unusually honest. Keep it in the app or on paper.',
      'Short cold rinse at the end of a warm shower, if you are steady on your feet. Skip it if you are not.'
    ],
    avoid: ['Intense exercise', 'Standing up fast — do it slowly, every time', 'Breaking the fast impulsively at 9pm because a craving spiked'],
    practice: 'Two rounds of alternate-nostril breathing, morning and evening. Balances the two channels the tradition calls Ida and Pingala, and settles the nervous system measurably.'
  },
  return: {
    heading: 'How you leave decides what it was worth',
    focus: 'Refeeding is the part people rush and the only part that can genuinely hurt you.',
    do: [
      'Break with liquid first: warm broth, or diluted juice. Wait a full hour.',
      'Then something small, cooked and soft: stewed fruit, soft rice, yoghurt, dal.',
      'Wait two more hours. Then a normal-sized simple meal.',
      'Salt and potassium with the first two meals. Refeeding pulls minerals out of the blood fast.',
      'Half your normal intake for the whole day. Full appetite returns tomorrow, not today.',
      'Write down what the window gave you before it fades. It fades within about two days.'
    ],
    avoid: ['Bread, sugar, dairy-heavy or fried food as the first meal', 'A large meal — this is the single most common mistake', 'Going straight back to caffeine at full strength'],
    practice: 'Before the first sip, sit for two minutes and name one thing you are ending and one thing you are beginning. The fast is a hinge; use it as one.'
  }
};

export const SAFETY = {
  headline: 'Read this before your first window.',
  hardStops: [
    'Pregnant or breastfeeding',
    'Type 1 diabetes, or type 2 on insulin or sulfonylureas',
    'A current or past eating disorder',
    'Underweight (BMI under 18.5)',
    'Under 18',
    'On lithium, diuretics, blood pressure or blood thinning medication without your doctor adjusting the dose'
  ],
  clearFirst: [
    'Any chronic condition — kidney, liver, heart, thyroid, adrenal',
    'Gout or a history of kidney stones',
    'Any prescription medication at all',
    'Recent surgery or illness'
  ],
  breakNow: [
    'Fainting, or vision that greys out when you stand',
    'Heart palpitations or an irregular beat',
    'Confusion, slurred speech, or you cannot follow a simple conversation',
    'Severe or worsening abdominal pain',
    'Vomiting, or you cannot keep water down',
    'Any symptom that frightens you'
  ],
  note: 'Kundala is a calendar and a coach, not a clinician. It does not know your bloodwork. A four-day fast is a real physiological event — treat it like one, tell someone you trust that you are doing it, and break it the moment your body asks you to. Breaking early is never a failure; the window comes back every month.'
};
