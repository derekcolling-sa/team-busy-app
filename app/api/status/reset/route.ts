import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

const REDIS_KEY = "team-busy-status";

export async function POST() {
  await redis.del(REDIS_KEY);
  return Response.json({ ok: true });
}
