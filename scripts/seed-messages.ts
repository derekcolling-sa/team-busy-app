import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { redis } from "../lib/redis";

const MESSAGES_KEY = "team-busy-messages";

const messages = [
  { name: "Brendan", message: "technically that's not my job but here we are" },
  { name: "Callie", message: "back to back to back to back to back" },
  { name: "Chris", message: "on my 4th revision and we're calling it final this time" },
  { name: "Derek", message: "spinning plates and somehow none have dropped… yet" },
  { name: "Erin", message: "living in figma, send snacks" },
  { name: "KC", message: "at press check. again. obviously." },
  { name: "Kerry", message: "deep in copy edits, do not make eye contact" },
  { name: "Maddie", message: "if someone says 'can you make it pop' one more time 💀" },
];

async function seed() {
  await redis.del(MESSAGES_KEY);
  for (const msg of messages) {
    const entry = { ...msg, ts: Date.now() };
    await redis.lpush(MESSAGES_KEY, JSON.stringify(entry));
  }
  console.log("Seeded", messages.length, "messages");
  process.exit(0);
}

seed();
