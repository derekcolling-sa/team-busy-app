import {
  getAllPokes, sendPoke, clearPoke,
  getAllTouchGrass, sendTouchGrass, clearTouchGrass,
} from "@/lib/redis";
import { safeJson } from "@/lib/safe-json";

export const dynamic = "force-dynamic";

const NUDGES: Record<string, {
  getAll: () => Promise<unknown>;
  send: (from: string, to: string) => Promise<void>;
  clear: (from: string, to: string) => Promise<void>;
}> = {
  poke: { getAll: getAllPokes, send: sendPoke, clear: clearPoke },
  "touch-grass": { getAll: getAllTouchGrass, send: sendTouchGrass, clear: clearTouchGrass },
};

export async function GET(_request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const config = NUDGES[type];
  if (!config) return Response.json({ error: "Unknown type" }, { status: 404 });
  const data = await config.getAll();
  return Response.json({ [type === "touch-grass" ? "touchGrass" : type + "s"]: data });
}

export async function POST(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const config = NUDGES[type];
  if (!config) return Response.json({ error: "Unknown type" }, { status: 404 });

  const body = await safeJson(request);
  if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });
  const { from, to } = body as { from?: string; to?: string };
  if (typeof from !== "string" || typeof to !== "string" || from === to) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await config.send(from, to);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const config = NUDGES[type];
  if (!config) return Response.json({ error: "Unknown type" }, { status: 404 });

  const body = await safeJson(request);
  if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });
  const { from, to } = body as { from?: string; to?: string };
  if (typeof from !== "string" || typeof to !== "string") {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await config.clear(from, to);
  return Response.json({ ok: true });
}
