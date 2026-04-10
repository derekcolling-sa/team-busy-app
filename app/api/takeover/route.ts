import { getTakeover, setTakeover } from "@/lib/redis";
import { safeJson } from "@/lib/safe-json";
export const dynamic = "force-dynamic";

export async function GET() {
  const message = await getTakeover();
  return Response.json({ message });
}

export async function POST(request: Request) {
  const body = await safeJson(request); if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 }); const { message } = body as any;
  if (typeof message !== "string") {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await setTakeover(message);
  return Response.json({ ok: true });
}
