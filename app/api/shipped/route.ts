import { getShippedFeatures, addShippedFeature, removeShippedFeature } from "@/lib/redis";
import { safeJson } from "@/lib/safe-json";

export const dynamic = "force-dynamic";

export async function GET() {
  const features = await getShippedFeatures();
  return Response.json({ features });
}

export async function POST(request: Request) {
  const body = await safeJson(request);
  if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });
  const { name, message } = body as { name?: string; message?: string };
  if (typeof name !== "string" || typeof message !== "string" || !message.trim()) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await addShippedFeature(name, message.trim());
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const body = await safeJson(request);
  if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });
  const { ts } = body as { ts?: number };
  if (typeof ts !== "number") {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await removeShippedFeature(ts);
  return Response.json({ ok: true });
}
