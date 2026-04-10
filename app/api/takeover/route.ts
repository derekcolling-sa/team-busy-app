import { getTakeover, setTakeover } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const message = await getTakeover();
  return Response.json({ message });
}

export async function POST(request: Request) {
  const { message } = await request.json();
  if (typeof message !== "string") {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await setTakeover(message);
  return Response.json({ ok: true });
}
