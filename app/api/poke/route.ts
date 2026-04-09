import { getAllPokes, sendPoke, clearPoke } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const pokes = await getAllPokes();
  return Response.json({ pokes });
}

export async function POST(request: Request) {
  const { from, to } = await request.json();
  if (typeof from !== "string" || typeof to !== "string" || from === to) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await sendPoke(from, to);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { from, to } = await request.json();
  if (typeof from !== "string" || typeof to !== "string") {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await clearPoke(from, to);
  return Response.json({ ok: true });
}
