import Anthropic from "@anthropic-ai/sdk";
import { safeJson } from "@/lib/safe-json";

export const dynamic = "force-dynamic";

const client = new Anthropic();

const PROMPT = `You are rewriting informal workplace status messages for display on a professional team dashboard. These are first-person status updates written by individual team members about themselves (e.g. "I'm sick today", "slammed with work"). Rewrite each in third person referring to the person by their implied situation, preserving the actual meaning. Strip slang, exclamation marks, and informal language. Return only the rewritten sentence — no quotes, no explanation, nothing else. Never say "the sender".`;

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

  // Single mode: { message: string, name?: string }
  if (!body?.message) return Response.json({ error: "Missing message" }, { status: 400 });

  const content = body.name
    ? `${PROMPT}\n\nPerson's name: ${body.name}\nStatus message: ${body.message}\n\nRewrite this status message in third person using "${body.name}" as the subject. Start the sentence with "${body.name}".`
    : `${PROMPT}\n\nOriginal: ${body.message}`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [{ role: "user", content }],
  });

  const translated = message.content[0].type === "text" ? message.content[0].text.trim() : body.message;
  return Response.json({ translated });
}
