import { getAllOOO, setMemberOOO } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const ooo = await getAllOOO();
  return Response.json(ooo);
}

export async function POST(request: Request) {
  const { name, ooo } = await request.json();
  if (typeof name !== "string" || typeof ooo !== "boolean") {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await setMemberOOO(name, ooo);
  return Response.json({ ok: true });
}
