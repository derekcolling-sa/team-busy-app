import { getAllMetcalf, setMemberMetcalf } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const metcalf = await getAllMetcalf();
  return Response.json(metcalf);
}

export async function POST(request: Request) {
  const { name, active } = await request.json();
  if (typeof name !== "string" || typeof active !== "boolean") {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await setMemberMetcalf(name, active);
  return Response.json({ ok: true });
}
