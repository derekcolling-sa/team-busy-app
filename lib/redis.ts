import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const REDIS_KEY = "team-busy-status";
const OOO_KEY = "team-busy-ooo";

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
  await redis.hset(REDIS_KEY, { [name]: value });
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
