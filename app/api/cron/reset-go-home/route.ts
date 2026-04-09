import { clearAllGoHome, clearAllPokes } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  await Promise.all([clearAllGoHome(), clearAllPokes()]);
  return Response.json({ ok: true });
}
