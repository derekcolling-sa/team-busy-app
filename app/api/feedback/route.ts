import { addFeedback, getFeedback, markFeedbackResolved, getResolvedFeedbackTs, deleteFeedback } from "@/lib/redis";
import { safeJson } from "@/lib/safe-json";
export const dynamic = "force-dynamic";

export async function GET() {
  const [items, resolvedTs] = await Promise.all([getFeedback(), getResolvedFeedbackTs()]);
  return Response.json({ items, resolvedTs });
}

export async function POST(request: Request) {
  const body = await safeJson(request); if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 }); const { name, message } = body as any;
  if (typeof name !== "string" || typeof message !== "string" || !message.trim()) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await addFeedback(name, message.trim());
  return Response.json({ ok: true });
}

export async function PATCH(request: Request) {
  const body = await safeJson(request); if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 }); const { ts } = body as any;
  if (typeof ts !== "number") {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await markFeedbackResolved(ts);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const body = await safeJson(request);
  if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });
  const { ts } = body as { ts?: number };
  if (typeof ts !== "number") return Response.json({ error: "Invalid input" }, { status: 400 });
  await deleteFeedback(ts);
  return Response.json({ ok: true });
}
