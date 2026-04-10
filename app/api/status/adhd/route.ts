import { getAllAdhd, setMemberAdhd } from "@/lib/redis";
import { safeJson } from "@/lib/safe-json";
export const dynamic = "force-dynamic";

export async function GET() {
  const adhd = await getAllAdhd();
  return Response.json(adhd);
}

export async function POST(request: Request) {
  const body = await safeJson(request); if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 }); const { name, value } = body as any;
  if (typeof name !== "string" || typeof value !== "number" || value < 0 || value > 100) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await setMemberAdhd(name, value);
  return Response.json({ ok: true });
}
