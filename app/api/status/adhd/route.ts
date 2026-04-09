import { getAllAdhd, setMemberAdhd } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const adhd = await getAllAdhd();
  return Response.json(adhd);
}

export async function POST(request: Request) {
  const { name, value } = await request.json();
  if (typeof name !== "string" || typeof value !== "number" || value < 0 || value > 100) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await setMemberAdhd(name, value);
  return Response.json({ ok: true });
}
