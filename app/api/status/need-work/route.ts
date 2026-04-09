import { getAllNeedWork, setMemberNeedWork } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const needWork = await getAllNeedWork();
  return Response.json(needWork);
}

export async function POST(request: Request) {
  const { name, active } = await request.json();
  if (typeof name !== "string" || typeof active !== "boolean") {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await setMemberNeedWork(name, active);
  return Response.json({ ok: true });
}
