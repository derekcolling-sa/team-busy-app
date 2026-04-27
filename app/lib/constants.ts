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
export const CO_ADMINS = ["Callie", "Erin"];
export const BUDDIES_ENABLED = true;

export const GENX_USERS = ["Brendan", "Kerry", "Derek"];

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

const SUGGESTIONS_GENX: Record<string, string[]> = {
  writer: [
    "the brief said 'fun and irreverent.' client meant 'safe and beige.' of course.",
    "on my third rewrite. the first one was right. just so you know.",
    "if someone says 'make it pop' one more time, I'm submitting lorem ipsum.",
    "concept sold. now comes the actual work.",
    "in a words hole. send coffee or leave me alone.",
    "headlines: still making them up. sending in 20.",
    "the copy is solid. now to convince everyone else of that.",
    "writing my way out of a brief with no direction. improv is a skill, apparently.",
  ],
  artDirector: [
    "the font is fine. it's always been fine.",
    "making it 'more premium' for the 4th time today. the goalposts are gone.",
    "moving boxes around until it looks like art. it's a process.",
    "logo bigger. sure. client's having a day.",
    "yes, I'll make it pop. no, I won't explain what that means.",
    "in InDesign. do not disturb.",
    "on my 6th version. they'll pick the first one. they always do.",
    "it's always the kerning.",
  ],
  vp: [
    "on a call that should have been an email.",
    "reviewing 12 concepts. one of them is actually good.",
    "saying 'great question' a lot today. it buys time.",
    "the brief changed. again. we adapt.",
    "building decks. it's fine. everything is fine.",
    "managing up. it's a whole thing.",
    "holding the vision. and everyone's calendar. you're welcome.",
    "my feedback on your feedback: let's talk. it has layers.",
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

const LABELS_GENX = ["Mellow", "Getting There", "Buried", "Send Help"];
const EMOJIS_GENX = ["😎", "☕", "🔥", "💀"];
const ADHD_LABELS_GENX = ["actually focused", "zoning out", "completely checked out", "full chaos mode"];
const MOODS_GENX = [
  "running on fumes 🫠",
  "owning it today 💪",
  "do not test me 😤",
  "actually productive 📋",
  "somehow fine 🤷",
  "not great, Bob 😬",
  "crushing it 💻",
  "overly optimistic 😅",
  "having a moment 😶",
  "delivered and moved on 👍",
  "a little rough today 🤕",
  "something's off here 🤔",
  "got my act together 🎯",
  "need a walk, badly 🚶",
];

export function getVoice(user: string | null) {
  if (user && GENX_USERS.includes(user)) {
    return { LABELS: LABELS_GENX, EMOJIS: EMOJIS_GENX, ADHD_LABELS: ADHD_LABELS_GENX, MOODS: MOODS_GENX, SUGGESTIONS: SUGGESTIONS_GENX };
  }
  return { LABELS, EMOJIS, ADHD_LABELS, MOODS, SUGGESTIONS };
}

export function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return "a minute ago";
  if (minutes < 5) return `${minutes} mins ago`;
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "an hour ago";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday (moving on)";
  return `${days} days ago`;
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
