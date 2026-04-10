import { getAllTouchGrass, sendTouchGrass, clearTouchGrass } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const touchGrass = await getAllTouchGrass();
  return Response.json({ touchGrass });
}

export async function POST(request: Request) {
  const { from, to } = await request.json();
  if (typeof from !== "string" || typeof to !== "string" || from === to) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await sendTouchGrass(from, to);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { from, to } = await request.json();
  if (typeof from !== "string" || typeof to !== "string") {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await clearTouchGrass(from, to);
  return Response.json({ ok: true });
}
