import { getAllHotCold, setMemberHotCold } from "@/lib/redis";
import { safeJson } from "@/lib/safe-json";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getAllHotCold();
  return Response.json({ hotCold: data });
}

export async function POST(request: Request) {
  const body = await safeJson(request);
  if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });
  const { name, temp } = body as { name?: string; temp?: unknown };
  if (typeof name !== "string" || (temp !== "hot" && temp !== "cold" && temp !== null)) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await setMemberHotCold(name, temp);
  return Response.json({ ok: true });
}
