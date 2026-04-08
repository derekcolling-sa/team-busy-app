export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ buildId: process.env.NEXT_BUILD_ID ?? "dev" });
}
