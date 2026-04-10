import { getAllBans, banMember, unbanMember, addBanDispute, getBanDisputes, clearBanDispute } from "@/lib/redis";
import { safeJson } from "@/lib/safe-json";

export const dynamic = "force-dynamic";

export async function GET() {
  const [bans, disputes] = await Promise.all([getAllBans(), getBanDisputes()]);
  return Response.json({ bans, disputes });
}

export async function POST(request: Request) {
  const body = await safeJson(request);
  if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });
  const { action, name, reason, message, ts } = body as { action?: string; name?: string; reason?: string; message?: string; ts?: number };

  if (action === "ban") {
    if (typeof name !== "string") return Response.json({ error: "Invalid input" }, { status: 400 });
    await banMember(name, reason ?? "");
    return Response.json({ ok: true });
  }
  if (action === "unban") {
    if (typeof name !== "string") return Response.json({ error: "Invalid input" }, { status: 400 });
    await unbanMember(name);
    return Response.json({ ok: true });
  }
  if (action === "dispute") {
    if (typeof name !== "string" || typeof message !== "string" || !message.trim()) return Response.json({ error: "Invalid input" }, { status: 400 });
    await addBanDispute(name, message.trim());
    return Response.json({ ok: true });
  }
  if (action === "clear-dispute") {
    if (typeof ts !== "number") return Response.json({ error: "Invalid input" }, { status: 400 });
    await clearBanDispute(ts);
    return Response.json({ ok: true });
  }
  return Response.json({ error: "Unknown action" }, { status: 400 });
}
