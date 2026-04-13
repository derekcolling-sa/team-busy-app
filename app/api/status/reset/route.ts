import { clearAllStatus } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearAllStatus();
  return Response.json({ ok: true });
}
