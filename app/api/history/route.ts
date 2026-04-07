import { getHistory, logDailySnapshot } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const history = await getHistory(14);
  return Response.json(history);
}

// Called to manually trigger a snapshot (also triggered on status updates)
export async function POST() {
  await logDailySnapshot();
  return Response.json({ ok: true });
}
