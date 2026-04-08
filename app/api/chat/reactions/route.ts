import { getAllReactions, toggleReaction } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const reactions = await getAllReactions();
  return Response.json({ reactions });
}

export async function POST(request: Request) {
  const { ts, emoji, name } = await request.json();
  if (typeof ts !== "number" || typeof emoji !== "string" || typeof name !== "string") {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await toggleReaction(ts, emoji, name);
  return Response.json({ ok: true });
}
