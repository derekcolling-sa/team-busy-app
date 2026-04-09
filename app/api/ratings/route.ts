import { getAllRatings, setRating } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const ratings = await getAllRatings();
  return Response.json({ ratings });
}

export async function POST(request: Request) {
  const { rater, ratee, stars } = await request.json();
  if (!rater || !ratee || typeof stars !== "number" || stars < 1 || stars > 5 || rater === ratee) {
    return Response.json({ error: "Invalid" }, { status: 400 });
  }
  await setRating(rater, ratee, stars);
  return Response.json({ ok: true });
}
