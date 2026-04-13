import { getAllMeds, setMemberMeds } from "@/lib/redis";
import { safeJson } from "@/lib/safe-json";
export const dynamic = "force-dynamic";

export async function GET() {
  const meds = await getAllMeds();
  return Response.json(meds);
}

export async function POST(request: Request) {
  const body = await safeJson(request);
  if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });
  const { name, active } = body as { name?: string; active?: boolean };
  if (typeof name !== "string" || typeof active !== "boolean") {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await setMemberMeds(name, active);
  return Response.json({ ok: true });
}
