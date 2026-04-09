import { getAllSessionTime, addSessionTime } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const times = await getAllSessionTime();
  return Response.json(times);
}

export async function POST(request: Request) {
  const { name, seconds } = await request.json();
  if (typeof name !== "string" || typeof seconds !== "number" || seconds <= 0) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await addSessionTime(name, Math.min(seconds, 300)); // cap at 5 min per flush
  return Response.json({ ok: true });
}
