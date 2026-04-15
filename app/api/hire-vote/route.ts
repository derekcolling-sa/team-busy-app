import { getHireVotes, setHireVote, getHireVoteHistory } from "@/lib/redis";

export const dynamic = "force-dynamic";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// GET /api/hire-vote?date=YYYY-MM-DD  (defaults to today)
// GET /api/hire-vote?history=true       (returns 14-day history)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (searchParams.get("history") === "true") {
    const history = await getHireVoteHistory(14);
    return Response.json({ history });
  }

  const date = searchParams.get("date") ?? todayStr();
  const votes = await getHireVotes(date);

  // Aggregate counts
  let writerYes = 0, designerYes = 0;
  for (const v of Object.values(votes)) {
    if (v.writer) writerYes++;
    if (v.designer) designerYes++;
  }
  const total = Object.keys(votes).length;

  return Response.json({ date, votes, writerYes, designerYes, total });
}

// POST /api/hire-vote
// Body: { name: string, writer: boolean, designer: boolean }
export async function POST(request: Request) {
  const body = await request.json();
  const { name, writer, designer } = body as { name: string; writer: boolean; designer: boolean };

  if (!name || typeof writer !== "boolean" || typeof designer !== "boolean") {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const date = todayStr();
  await setHireVote(name, { writer, designer }, date);

  const votes = await getHireVotes(date);
  let writerYes = 0, designerYes = 0;
  for (const v of Object.values(votes)) {
    if (v.writer) writerYes++;
    if (v.designer) designerYes++;
  }

  return Response.json({ ok: true, date, votes, writerYes, designerYes, total: Object.keys(votes).length });
}
