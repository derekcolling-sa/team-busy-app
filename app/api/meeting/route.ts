import { getMeetings, setMeeting } from "@/lib/redis";
import { safeJson } from "@/lib/safe-json";
export const dynamic = "force-dynamic";

export async function GET() {
  const meetings = await getMeetings();
  return Response.json({ meetings });
}

export async function POST(request: Request) {
  const body = await safeJson(request); if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 }); const { name, endTs } = body as any;
  if (typeof name !== "string" || (endTs !== null && typeof endTs !== "number")) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await setMeeting(name, endTs);
  return Response.json({ ok: true });
}
