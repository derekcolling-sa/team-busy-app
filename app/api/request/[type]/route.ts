import {
  requestMoney, clearMoneyRequest, getMoneyRequests,
  requestTimeOff, clearTimeOff, getTimeOffRequests,
} from "@/lib/redis";
import { safeJson } from "@/lib/safe-json";

export const dynamic = "force-dynamic";

const REQUESTS: Record<string, {
  getAll: () => Promise<unknown>;
  request: (name: string) => Promise<void>;
  clear: (name: string) => Promise<void>;
}> = {
  money: { getAll: getMoneyRequests, request: requestMoney, clear: clearMoneyRequest },
  "time-off": { getAll: getTimeOffRequests, request: requestTimeOff, clear: clearTimeOff },
};

export async function GET(_request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const config = REQUESTS[type];
  if (!config) return Response.json({ error: "Unknown type" }, { status: 404 });
  const data = await config.getAll();
  return Response.json({ requests: data });
}

export async function POST(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const config = REQUESTS[type];
  if (!config) return Response.json({ error: "Unknown type" }, { status: 404 });

  const body = await safeJson(request);
  if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });
  const { name } = body as { name?: string };
  if (!name || typeof name !== "string") {
    return Response.json({ error: "Invalid" }, { status: 400 });
  }
  await config.request(name);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const config = REQUESTS[type];
  if (!config) return Response.json({ error: "Unknown type" }, { status: 404 });

  const body = await safeJson(request);
  if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });
  const { name } = body as { name?: string };
  if (!name || typeof name !== "string") {
    return Response.json({ error: "Invalid" }, { status: 400 });
  }
  await config.clear(name);
  return Response.json({ ok: true });
}
