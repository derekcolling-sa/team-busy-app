import { setMood } from "@/lib/redis";
import { safeJson } from "@/lib/safe-json";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await safeJson(request);
  if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });
  const { name, mood } = body as { name?: string; mood?: string };
  if (typeof name !== "string" || typeof mood !== "string") {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await setMood(name, mood.trim());
  return Response.json({ ok: true });
}
