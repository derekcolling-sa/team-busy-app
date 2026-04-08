import { getAllOOO, setMemberOOO, getAllOOODetails, setMemberOOODetails, clearMemberOOODetails } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const [ooo, details] = await Promise.all([getAllOOO(), getAllOOODetails()]);
  return Response.json({ ooo, details });
}

export async function POST(request: Request) {
  const { name, ooo, note, backDate } = await request.json();
  if (typeof name !== "string" || typeof ooo !== "boolean") {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  await setMemberOOO(name, ooo);
  if (ooo) {
    await setMemberOOODetails(name, { note: note ?? "", backDate: backDate ?? "" });
  } else {
    await clearMemberOOODetails(name);
  }
  return Response.json({ ok: true });
}
