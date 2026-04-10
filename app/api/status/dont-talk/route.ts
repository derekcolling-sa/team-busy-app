import { getAllDontTalkToMe, setDontTalkToMe } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const dontTalk = await getAllDontTalkToMe();
  return Response.json(dontTalk);
}

export async function POST(request: Request) {
  const { name, active } = await request.json();
  if (typeof name !== "string" || typeof active !== "boolean") {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await setDontTalkToMe(name, active);
  return Response.json({ ok: true });
}
