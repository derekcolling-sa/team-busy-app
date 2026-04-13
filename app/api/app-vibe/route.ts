import { getAppVibes, setAppVibe } from "@/lib/redis";
import { safeJson } from "@/lib/safe-json";
export const dynamic = "force-dynamic";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  const vibes = await getAppVibes(todayStr());
  return Response.json({ vibes });
}

export async function POST(request: Request) {
  const body = await safeJson(request);
  if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });
  const { user, vote } = body as any;
  if (!user || (vote !== "up" && vote !== "down")) {
    return Response.json({ error: "Invalid" }, { status: 400 });
  }
  await setAppVibe(user, vote, todayStr());
  return Response.json({ ok: true });
}
