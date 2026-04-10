import { getAllSOS, setMemberSOS } from "@/lib/redis";
import { safeJson } from "@/lib/safe-json";
export const dynamic = "force-dynamic";

export async function GET() {
  const sos = await getAllSOS();
  return Response.json(sos);
}

export async function POST(request: Request) {
  const body = await safeJson(request); if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 }); const { name, sos } = body as any;
  if (typeof name !== "string" || typeof sos !== "boolean") {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await setMemberSOS(name, sos);
  return Response.json({ ok: true });
}
