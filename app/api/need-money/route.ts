import { getMoneyRequests, requestMoney, clearMoneyRequest } from "@/lib/redis";
import { safeJson } from "@/lib/safe-json";
export const dynamic = "force-dynamic";

export async function GET() {
  const requests = await getMoneyRequests();
  return Response.json({ requests });
}

export async function POST(request: Request) {
  const body = await safeJson(request); if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 }); const { name } = body as any;
  if (!name || typeof name !== "string") {
    return Response.json({ error: "Invalid" }, { status: 400 });
  }
  await requestMoney(name);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const body = await safeJson(request); if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 }); const { name } = body as any;
  if (!name || typeof name !== "string") {
    return Response.json({ error: "Invalid" }, { status: 400 });
  }
  await clearMoneyRequest(name);
  return Response.json({ ok: true });
}
