import { getHistory, logDailySnapshot } from "@/lib/redis";

export async function GET() {
  const history = await getHistory(14);
  return Response.json(history, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
  });
}

// Called to manually trigger a snapshot (also triggered on status updates)
export async function POST() {
  await logDailySnapshot();
  return Response.json({ ok: true });
}
