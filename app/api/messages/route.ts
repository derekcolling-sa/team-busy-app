import { addMessage, getMessages } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const messages = await getMessages();
  return Response.json({ messages });
}

export async function POST(request: Request) {
  const { name, message } = await request.json();
  if (typeof name !== "string" || typeof message !== "string" || !message.trim()) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await addMessage(name, message.trim());
  return Response.json({ ok: true });
}
