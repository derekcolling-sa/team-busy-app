import { NextRequest, NextResponse } from "next/server";
import { safeJson } from "@/lib/safe-json";

const AUTH_COOKIE = "team-busy-auth";
const PASSWORD = "drygoods";

export async function POST(request: NextRequest) {
  const body = await safeJson(request);
  if (!body) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const { password } = body as { password?: string };
  if (password !== PASSWORD) {
    return NextResponse.json({ error: "wrong password bestie" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, PASSWORD, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return response;
}
