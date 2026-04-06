import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const REDIS_KEY = "team-busy-status";

export type TeamStatus = Record<string, number>;

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
