import { getBroadcast, setBroadcast } from "@/lib/redis";
import { safeJson } from "@/lib/safe-json";

export const dynamic = "force-dynamic";

export async function GET() {
  const broadcast = await getBroadcast();
  return Response.json(broadcast ?? { message: null, type: null });
}

export async function POST(req: Request) {
  const body = await safeJson(req);
  if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });
  const { message, type } = body as { message?: string; type?: string };
  await setBroadcast(message ?? "", (type === "urgent" ? "urgent" : "broadcast"));
  return Response.json({ ok: true });
}
