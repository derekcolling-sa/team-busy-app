import { getMeetings, setMeeting } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const meetings = await getMeetings();
  return Response.json({ meetings });
}

export async function POST(request: Request) {
  const { name, endTs } = await request.json();
  if (typeof name !== "string" || (endTs !== null && typeof endTs !== "number")) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await setMeeting(name, endTs);
  return Response.json({ ok: true });
}
