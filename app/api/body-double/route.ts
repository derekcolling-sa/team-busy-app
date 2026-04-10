import { getBodyDouble, setBodyDouble } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const names = await getBodyDouble();
  return Response.json({ names });
}

export async function POST(request: Request) {
  const { name, active } = await request.json();
  if (typeof name !== "string" || typeof active !== "boolean") {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await setBodyDouble(name, active);
  return Response.json({ ok: true });
}
