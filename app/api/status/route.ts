import { getAllStatus, getAllUpdated, setMemberStatus } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const [status, updated] = await Promise.all([
    getAllStatus(),
    getAllUpdated(),
  ]);
  return Response.json({ status, updated });
}

export async function POST(request: Request) {
  const { name, value } = await request.json();
  if (typeof name !== "string" || typeof value !== "number") {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await setMemberStatus(name, value);
  return Response.json({ ok: true });
}
