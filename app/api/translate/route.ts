import Anthropic from "@anthropic-ai/sdk";
import { safeJson } from "@/lib/safe-json";

export const dynamic = "force-dynamic";

const client = new Anthropic();

export async function POST(req: Request) {
  const body = await safeJson(req);
  if (!body?.message) return Response.json({ error: "Missing message" }, { status: 400 });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `You are rewriting an informal workplace message for display on a professional dashboard. Rewrite it as a single polished, professional sentence. Strip all informal language, slang, exclamation marks, and excessive punctuation. Return only the rewritten sentence — no quotes, no explanation, nothing else.\n\nOriginal: ${body.message}`,
      },
    ],
  });

  const translated = message.content[0].type === "text" ? message.content[0].text.trim() : body.message;
  return Response.json({ translated });
}
