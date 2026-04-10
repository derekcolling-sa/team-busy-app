import { getBodyDouble, setBodyDouble } from "@/lib/redis";
import { safeJson } from "@/lib/safe-json";
export const dynamic = "force-dynamic";

export async function GET() {
  const names = await getBodyDouble();
  return Response.json({ names });
}

export async function POST(request: Request) {
  const body = await safeJson(request); if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 }); const { name, active } = body as any;
  if (typeof name !== "string" || typeof active !== "boolean") {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await setBodyDouble(name, active);
  return Response.json({ ok: true });
}
