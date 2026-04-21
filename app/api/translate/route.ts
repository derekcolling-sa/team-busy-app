import Anthropic from "@anthropic-ai/sdk";
import { safeJson } from "@/lib/safe-json";

export const dynamic = "force-dynamic";

const client = new Anthropic();

const PROMPT = `You are rewriting informal workplace messages for display on a professional dashboard. Rewrite each as a single polished, professional sentence. Strip all informal language, slang, exclamation marks, and excessive punctuation. Return only the rewritten sentence — no quotes, no explanation, nothing else.`;

export async function POST(req: Request) {
  const body = await safeJson(req);

  // Batch mode: { notes: Record<string, string> }
  if (body?.notes && typeof body.notes === "object") {
    const entries = Object.entries(body.notes as Record<string, string>).filter(([, v]) => v?.trim());
    if (entries.length === 0) return Response.json({ notes: {} });

    const list = entries.map(([name, msg], i) => `${i + 1}. [${name}]: ${msg}`).join("\n");
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `${PROMPT}\n\nRewrite each message below. Return a JSON object mapping each name to its rewritten message. Only include names from the list.\n\n${list}`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "{}";
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      const translated = match ? JSON.parse(match[0]) : {};
      return Response.json({ notes: translated });
    } catch {
      return Response.json({ notes: {} });
    }
  }

  // Single mode: { message: string }
  if (!body?.message) return Response.json({ error: "Missing message" }, { status: 400 });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `${PROMPT}\n\nOriginal: ${body.message}`,
      },
    ],
  });

  const translated = message.content[0].type === "text" ? message.content[0].text.trim() : body.message;
  return Response.json({ translated });
}
