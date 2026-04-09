import { requestGoHome, clearGoHome, clearAllGoHome, getGoHomeRequests } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const requests = await getGoHomeRequests();
  return Response.json({ requests });
}

export async function POST(request: Request) {
  const { name, clear } = await request.json();
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
