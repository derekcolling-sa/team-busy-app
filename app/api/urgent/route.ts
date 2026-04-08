import { NextResponse } from "next/server";
import { getBroadcast, setBroadcast } from "@/lib/redis";

export async function GET() {
  const broadcast = await getBroadcast();
  return NextResponse.json(broadcast ?? { message: null, type: null });
}

export async function POST(req: Request) {
  const { message, type } = await req.json();
  await setBroadcast(message ?? "", type ?? "broadcast");
  return NextResponse.json({ ok: true });
}
