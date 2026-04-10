import { getTimeOffRequests, requestTimeOff, clearTimeOff } from "@/lib/redis";
import { safeJson } from "@/lib/safe-json";
export const dynamic = "force-dynamic";

export async function GET() {
  const requests = await getTimeOffRequests();
  return Response.json({ requests });
}

export async function POST(request: Request) {
  const body = await safeJson(request); if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 }); const { name } = body as any;
  if (!name || typeof name !== "string") {
    return Response.json({ error: "Invalid" }, { status: 400 });
  }
  await requestTimeOff(name);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const body = await safeJson(request); if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 }); const { name } = body as any;
  if (!name || typeof name !== "string") {
    return Response.json({ error: "Invalid" }, { status: 400 });
  }
  await clearTimeOff(name);
  return Response.json({ ok: true });
}
