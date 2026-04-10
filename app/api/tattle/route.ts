import { addTattle, getTattles, clearTattle } from "@/lib/redis";
import { safeJson } from "@/lib/safe-json";

export const dynamic = "force-dynamic";

export async function GET() {
  const tattles = await getTattles();
  return Response.json({ tattles });
}

export async function POST(request: Request) {
  const body = await safeJson(request);
  if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });
  const { message } = body as { message?: string };
  if (typeof message !== "string" || !message.trim()) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await addTattle(message.trim());
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const body = await safeJson(request);
  if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });
  const { ts } = body as { ts?: number };
  if (typeof ts !== "number") {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await clearTattle(ts);
  return Response.json({ ok: true });
}
