import { getAllStatus, getAllUpdated, getAllStatusNotes, setMemberStatus, setStatusNote, logDailySnapshot } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const [status, updated, notes] = await Promise.all([
    getAllStatus(),
    getAllUpdated(),
    getAllStatusNotes(),
  ]);
  return Response.json({ status, updated, notes });
}

export async function POST(request: Request) {
  const { name, value, note } = await request.json();
  if (typeof name !== "string") {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  if (typeof value === "number") {
    await setMemberStatus(name, value);
    logDailySnapshot().catch(() => {});
  }
  if (typeof note === "string") {
    await setStatusNote(name, note);
  }
  return Response.json({ ok: true });
}
