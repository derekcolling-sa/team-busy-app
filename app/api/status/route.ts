import { getAllStatus, getAllUpdated, getAllStatusNotes, setMemberStatus, setStatusNote, logDailySnapshot } from "@/lib/redis";
import { safeJson } from "@/lib/safe-json";
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
  const body = await safeJson(request); if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 }); const { name, value, note } = body as any;
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
