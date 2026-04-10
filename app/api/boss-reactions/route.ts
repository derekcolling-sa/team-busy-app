import { getAllBossReactions, setBossReaction, type BossReaction } from "@/lib/redis";
import { safeJson } from "@/lib/safe-json";
export const dynamic = "force-dynamic";

export async function GET() {
  const reactions = await getAllBossReactions();
  return Response.json({ reactions });
}

export async function POST(request: Request) {
  const body = await safeJson(request); if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 }); const { name, reaction } = body as any;
  if (typeof name !== "string" || (reaction !== "heart" && reaction !== "thumbsdown" && reaction !== null)) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await setBossReaction(name, reaction as BossReaction | null);
  return Response.json({ ok: true });
}
