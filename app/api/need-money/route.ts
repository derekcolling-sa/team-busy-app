import { getMoneyRequests, requestMoney, clearMoneyRequest } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const requests = await getMoneyRequests();
  return Response.json({ requests });
}

export async function POST(request: Request) {
  const { name } = await request.json();
  if (!name || typeof name !== "string") {
    return Response.json({ error: "Invalid" }, { status: 400 });
  }
  await requestMoney(name);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { name } = await request.json();
  if (!name || typeof name !== "string") {
    return Response.json({ error: "Invalid" }, { status: 400 });
  }
  await clearMoneyRequest(name);
  return Response.json({ ok: true });
}
