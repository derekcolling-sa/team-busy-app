import { getAllSessionTime, addSessionTime, setLastSeen } from "@/lib/redis";
import { safeJson } from "@/lib/safe-json";
export const dynamic = "force-dynamic";

export async function GET() {
  const times = await getAllSessionTime();
  return Response.json(times);
}

export async function POST(request: Request) {
  const body = await safeJson(request); if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 }); const { name, seconds } = body as any;
  if (typeof name !== "string" || typeof seconds !== "number" || seconds <= 0) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await Promise.all([
    addSessionTime(name, Math.min(seconds, 300)),
    setLastSeen(name),
  ]);
  return Response.json({ ok: true });
}
