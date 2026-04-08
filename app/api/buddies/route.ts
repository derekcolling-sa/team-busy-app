import { getAllBuddies, setMemberBuddy, clearMemberBuddy } from "@/lib/redis";

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

export async function DELETE(request: Request) {
  const { name } = await request.json();
  if (typeof name !== "string") {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await clearMemberBuddy(name);
  return Response.json({ ok: true });
}
