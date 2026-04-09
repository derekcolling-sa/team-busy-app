import { getAllBossReactions, setBossReaction, type BossReaction } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const reactions = await getAllBossReactions();
  return Response.json({ reactions });
}

export async function POST(request: Request) {
  const { name, reaction } = await request.json();
  if (typeof name !== "string" || (reaction !== "heart" && reaction !== "thumbsdown" && reaction !== null)) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await setBossReaction(name, reaction as BossReaction | null);
  return Response.json({ ok: true });
}
