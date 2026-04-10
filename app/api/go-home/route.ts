import { requestGoHome, clearGoHome, clearAllGoHome, getGoHomeRequests } from "@/lib/redis";
import { safeJson } from "@/lib/safe-json";
export const dynamic = "force-dynamic";

export async function GET() {
  const requests = await getGoHomeRequests();
  return Response.json({ requests });
}

export async function POST(request: Request) {
  const body = await safeJson(request); if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 }); const { name, clear } = body as any;
  if (typeof name !== "string") return Response.json({ error: "Invalid input" }, { status: 400 });
  if (clear === "all") {
    await clearAllGoHome();
  } else if (clear) {
    await clearGoHome(name);
  } else {
    await requestGoHome(name);
  }
  return Response.json({ ok: true });
}
