import { getBanner } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const banner = await getBanner();
  return Response.json({ banner });
}
