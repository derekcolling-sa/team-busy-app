import { getAllBuddies, setMemberBuddy } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const buddies = await getAllBuddies();
  return Response.json({ buddies });
}

export async function POST(request: Request) {
  const { name, buddyId } = await request.json();
  if (typeof name !== "string" || typeof buddyId !== "string") {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await setMemberBuddy(name, buddyId);
  return Response.json({ ok: true });
}
