import { getBanner, setBanner } from "@/lib/redis";
import { safeJson } from "@/lib/safe-json";
export const dynamic = "force-dynamic";

export async function GET() {
  const banner = await getBanner();
  return Response.json({ banner });
}

export async function POST(request: Request) {
  const body = await safeJson(request); if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 }); const { message } = body as any;
  if (typeof message !== "string" || !message.trim()) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  const date = new Date().toISOString().split("T")[0];
  await setBanner(message.trim(), date, "feature");
  return Response.json({ ok: true });
}
