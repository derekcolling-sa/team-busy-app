import { addFeedback, getFeedback, markFeedbackResolved, getResolvedFeedbackTs } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const [items, resolvedTs] = await Promise.all([getFeedback(), getResolvedFeedbackTs()]);
  return Response.json({ items, resolvedTs });
}

export async function POST(request: Request) {
  const { name, message } = await request.json();
  if (typeof name !== "string" || typeof message !== "string" || !message.trim()) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await addFeedback(name, message.trim());
  return Response.json({ ok: true });
}

export async function PATCH(request: Request) {
  const { ts } = await request.json();
  if (typeof ts !== "number") {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await markFeedbackResolved(ts);
  return Response.json({ ok: true });
}
