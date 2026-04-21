import Anthropic from "@anthropic-ai/sdk";
import { safeJson } from "@/lib/safe-json";

export const dynamic = "force-dynamic";

const client = new Anthropic();

const STATUS_PROMPT = `You are rewriting informal personal status messages for a professional team dashboard. These are written by individual team members about themselves (e.g. "sick today", "slammed with work"). Rewrite in third person using the person's name as the subject, preserving the actual meaning. Strip slang, exclamation marks, and informal language. Return only the rewritten sentence — no quotes, no explanation, nothing else.`;

const BROADCAST_PROMPT = `You are rewriting an informal message that a manager sent to their whole team, for display on a professional dashboard. Rewrite it as a direct, professional announcement to the team — written in second person ("Please...", "All team members are asked to..."). Focus on the actual action being requested. Strip all slang, exclamation marks, and informal language. Return only the rewritten sentence — no quotes, no explanation, nothing else.`;

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
          content: `${STATUS_PROMPT}\n\nRewrite each message below. Return a JSON object mapping each name to its rewritten message. Only include names from the list.\n\n${list}`,
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

  // Single mode: { message: string, name?: string, type?: "broadcast" | "status" }
  if (!body?.message) return Response.json({ error: "Missing message" }, { status: 400 });

  const isBroadcast = body.type === "broadcast" || body.type === "urgent";
  const prompt = isBroadcast ? BROADCAST_PROMPT : STATUS_PROMPT;
  const content = isBroadcast
    ? `${prompt}\n\nOriginal: ${body.message}`
    : `${prompt}\n\nPerson's name: ${body.name ?? "this person"}\nStatus message: ${body.message}\n\nRewrite using "${body.name ?? "this person"}" as the subject.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 256,
    messages: [{ role: "user", content }],
  });

  const translated = message.content[0].type === "text" ? message.content[0].text.trim() : body.message;
  return Response.json({ translated });
}
