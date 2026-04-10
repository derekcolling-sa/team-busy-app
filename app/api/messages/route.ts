import { addMessage, getMessages } from "@/lib/redis";
import { safeJson } from "@/lib/safe-json";
export const dynamic = "force-dynamic";

export async function GET() {
  const messages = await getMessages();
  return Response.json({ messages });
}

export async function POST(request: Request) {
  const body = await safeJson(request); if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 }); const { name, message } = body as any;
  if (typeof name !== "string" || typeof message !== "string" || !message.trim()) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await addMessage(name, message.trim());
  return Response.json({ ok: true });
}
