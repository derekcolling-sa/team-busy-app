import { getAllSOS, setMemberSOS } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const sos = await getAllSOS();
  return Response.json(sos);
}

export async function POST(request: Request) {
  const { name, sos } = await request.json();
  if (typeof name !== "string" || typeof sos !== "boolean") {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await setMemberSOS(name, sos);
  return Response.json({ ok: true });
}
