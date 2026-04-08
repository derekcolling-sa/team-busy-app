import { getReloadSignal, triggerReload } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const ts = await getReloadSignal();
  return Response.json({ ts });
}

export async function POST() {
  await triggerReload();
  return Response.json({ ok: true });
}
