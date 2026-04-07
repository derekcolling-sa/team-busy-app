import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const REDIS_KEY = "team-busy-status";
const OOO_KEY = "team-busy-ooo";
const UPDATED_KEY = "team-busy-updated";

export type TeamStatus = Record<string, number>;
export type OOOStatus = Record<string, boolean>;

export async function getAllStatus(): Promise<TeamStatus> {
  const data = await redis.hgetall(REDIS_KEY);
  if (!data) return {};
  const result: TeamStatus = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = Number(value);
  }
  return result;
}

export async function setMemberStatus(
  name: string,
  value: number
): Promise<void> {
  await Promise.all([
    redis.hset(REDIS_KEY, { [name]: value }),
    redis.hset(UPDATED_KEY, { [name]: Date.now() }),
  ]);
}

export type UpdatedTimestamps = Record<string, number>;

export async function getAllUpdated(): Promise<UpdatedTimestamps> {
  const data = await redis.hgetall(UPDATED_KEY);
  if (!data) return {};
  const result: UpdatedTimestamps = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = Number(value);
  }
  return result;
}

export async function getAllOOO(): Promise<OOOStatus> {
  const data = await redis.hgetall(OOO_KEY);
  if (!data) return {};
  const result: OOOStatus = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = value === "true" || value === true;
  }
  return result;
}

export async function setMemberOOO(
  name: string,
  ooo: boolean
): Promise<void> {
  await redis.hset(OOO_KEY, { [name]: String(ooo) });
}

// Daily history — key format: team-busy-history:YYYY-MM-DD
// Stores a hash of { memberName: averageValue } for each day

function todayKey(): string {
  return `team-busy-history:${new Date().toISOString().slice(0, 10)}`;
}

export type DaySnapshot = Record<string, number>;
export type HistoryData = { date: string; snapshot: DaySnapshot }[];

export async function logDailySnapshot(): Promise<void> {
  const [statuses, ooo] = await Promise.all([getAllStatus(), getAllOOO()]);
  const key = todayKey();
  const updates: Record<string, string> = {};
  for (const [name, value] of Object.entries(statuses)) {
    if (!ooo[name]) {
      updates[name] = String(value);
    }
  }
  if (Object.keys(updates).length > 0) {
    await redis.hset(key, updates);
    await redis.expire(key, 60 * 60 * 24 * 90); // keep 90 days
  }
}

export async function getHistory(days = 14): Promise<HistoryData> {
  const result: HistoryData = [];
  const today = new Date();
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    keys.push(`team-busy-history:${d.toISOString().slice(0, 10)}`);
  }
  await Promise.all(
    keys.map(async (key) => {
      const data = await redis.hgetall(key);
      const date = key.replace("team-busy-history:", "");
      const snapshot: DaySnapshot = {};
      if (data) {
        for (const [name, value] of Object.entries(data)) {
          snapshot[name] = Number(value);
        }
      }
      result.push({ date, snapshot });
    })
  );
  result.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}
