export type Rarity = "common" | "uncommon" | "rare";

export type Buddy = {
  id: string;
  name: string;
  rarity: Rarity;
  tagline: string;
  ext?: string;
};

export function getBuddyImagePath(buddy: Buddy): string {
  return `/buddies/${buddy.id}.${buddy.ext ?? "png"}`;
}

export const BUDDIES: Buddy[] = [
  // --- Common ---
  { id: "crumbs",  name: "Crumbs",  rarity: "common",   tagline: "ate and left no crumbs" },
  { id: "glitch",  name: "Glitch",  rarity: "common",   tagline: "currently experiencing a vibe error" },
  { id: "beige",   name: "Beige",   rarity: "common",   tagline: "painfully mid but make it chic" },
  { id: "yikes",   name: "Yikes",   rarity: "common",   tagline: "sent it before proofreading again" },
  { id: "nope",    name: "Nope",    rarity: "common",   tagline: "respectfully, no" },
  { id: "vibes",   name: "Vibes",   rarity: "common",   tagline: "checking in. not doing much else.", ext: "gif" },
  // --- Uncommon ---
  { id: "delulu",  name: "Delulu",  rarity: "uncommon", tagline: "the solulu is the delulu" },
  { id: "rizz",    name: "Rizz",    rarity: "uncommon", tagline: "effortless. always." },
  { id: "slay",    name: "Slay",    rarity: "uncommon", tagline: "ate. left crumbs intentionally." },
  { id: "lowkey",  name: "Lowkey",  rarity: "uncommon", tagline: "unbothered. moisturized. in my lane." },
  { id: "era",     name: "Era",     rarity: "uncommon", tagline: "currently in my main character era" },
  // --- Rare ---
  { id: "bussin",  name: "Bussin",  rarity: "rare",     tagline: "no notes. bussin bussin." },
  { id: "ghost",   name: "Ghost",   rarity: "rare",     tagline: "left the chat. thriving." },
  { id: "cooked",  name: "Cooked",  rarity: "rare",     tagline: "fully cooked. and yet — icon." },
  { id: "goat",    name: "GOAT",    rarity: "rare",     tagline: "greatest of all time. no debate." },
];

// Weight map: common=20, uncommon=12, rare=5
// Pool size = (6×20)+(5×12)+(4×5) = 120+60+20 = 200
// → Common 60%, Uncommon 30%, Rare 10%
const WEIGHT_MAP: Record<Rarity, number> = {
  common: 20,
  uncommon: 12,
  rare: 5,
};

export function rollBuddy(): Buddy {
  const pool: Buddy[] = [];
  for (const buddy of BUDDIES) {
    const weight = WEIGHT_MAP[buddy.rarity];
    for (let i = 0; i < weight; i++) {
      pool.push(buddy);
    }
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getBuddyById(id: string): Buddy | undefined {
  return BUDDIES.find((b) => b.id === id);
}

export const RARITY_STYLES: Record<Rarity, { bg: string; text: string; label: string }> = {
  common:   { bg: "#ffffff", text: "#000000", label: "Common" },
  uncommon: { bg: "#3D52F0", text: "#ffffff", label: "Uncommon" },
  rare:     { bg: "#FFE234", text: "#000000", label: "✦ Rare ✦" },
};
