export const MEMBERS = [
  { name: "Brendan", photo: "/photos/Brendan.jpg" },
  { name: "Callie", photo: "/photos/Callie.jpg" },
  { name: "Chris", photo: "/photos/Chris.jpg" },
  { name: "Derek", photo: "/photos/Derek.jpeg" },
  { name: "Erin", photo: "/photos/Erin.jpg" },
  { name: "KC", photo: "/photos/KC.jpeg" },
  { name: "Kerry", photo: "/photos/Kerry.jpg" },
  { name: "Maddie", photo: "/photos/Maddie.jpg" },
];

export const WRITERS = ["Kerry", "Erin", "Maddie"];
export const VP = ["Derek"];
export const BOSS = "Derek";
export const BUDDIES_ENABLED = true;

export const SUGGESTIONS: Record<string, string[]> = {
  writer: [
    "the brief said 'fun and irreverent.' the client meant 'safe and beige.' mid.",
    "on my third rewrite. the first one slayed. they just couldn't see it.",
    "if someone says 'make it punchy' one more time I'm submitting blank copy. no chill.",
    "concept sold. now to actually write the thing. bet.",
    "in a words hole. the vibes are bad. send help.",
    "headlines: still making them up. it's giving chaos.",
    "the copy is fire. now I just have to convince everyone else of that.",
    "writing my way out of a brief with zero actual direction. it's giving improv.",
  ],
  artDirector: [
    "the font is fine. the font has always been fine. it's giving slay.",
    "making it 'more premium' for the 4th time today. the vibe keeps shifting.",
    "moving boxes around until it looks like art. mood.",
    "logo bigger. got it. 🙄 the client is extra today.",
    "yes I will make it pop. no I will not explain what that means. bet.",
    "in InDesign. the layout is fire. please do not disturb.",
    "on my 6th version. client picks the first one. we all stan this outcome.",
    "it's always the kerning. always.",
  ],
  vp: [
    "on a call I could have been an email. no cap.",
    "reviewing 12 concepts. one of them is actually fire.",
    "saying 'great question' a lot today. it's a whole vibe.",
    "the brief has changed. again. we flex and we adapt.",
    "building decks. this is fine. everything is fine. bet.",
    "managing up. it's a lifestyle and I'm slaying it.",
    "holding the vision. and everyone's calendar. GOAT behavior.",
    "my feedback on your feedback: let's discuss. it's giving layers.",
  ],
};

export const LABELS = ["Chillin'", "Sautéed", "Cooking", "Cooked"];
export const EMOJIS = ["😎", "🍳", "🔥", "💀"];
export const TRACK_COLORS = ["#5cb85c", "#4a9eff", "#f5a623", "#e8742d"];
export const ADHD_LABELS = ["locked tf in", "lowkey glazed", "brainrot szn", "absolutely feral"];
export const ADHD_EMOJIS = ["🧠", "😵‍💫", "📱", "🐿️"];
export const ADHD_COLORS = ["#a8f5c8", "#b8d4ff", "#dbb8ff", "#ffb8e0"];

export const MOODS = [
  "no thoughts 🫥",
  "main character ✨",
  "villain era 😈",
  "in my bag 💰",
  "lowkey thriving 🌱",
  "not okay bestie 😭",
  "slay mode 💅",
  "delulu 🌈",
  "down bad 😔",
  "ate no crumbs 🍽️",
  "unwell 🤕",
  "it's giving 👀",
  "that girl/guy 💪",
  "touch grass needed 🌿",
];

export function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return "literally just now 👀";
  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return "like a min ago";
  if (minutes < 5) return `${minutes} mins ago no cap`;
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "an hour ago bestie";
  if (hours < 24) return `${hours}h ago (oof)`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday… we not gonna talk about it";
  return `${days} days ago 💀`;
}

// Returns 0–1 staleness: 0 = fresh, 1 = fully stale (16h → 48h)
export function getStaleness(ts: number | undefined): number {
  if (!ts) return 0;
  const hours = (Date.now() - ts) / (1000 * 60 * 60);
  if (hours < 16) return 0;
  return Math.min((hours - 16) / 32, 1);
}

export function getLevel(val: number) {
  if (val <= 20) return 0;
  if (val <= 50) return 1;
  if (val <= 77) return 2;
  return 3;
}

export function getAdhdLevel(val: number) {
  if (val <= 25) return 0;
  if (val <= 50) return 1;
  if (val <= 75) return 2;
  return 3;
}

export function getTrackStyle(value: number, level: number) {
  return {
    background: `linear-gradient(to right, ${TRACK_COLORS[level]} ${value}%, #d9d4cc ${value}%)`,
  };
}
