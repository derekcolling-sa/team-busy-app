import { getVideos, setVideos } from "@/lib/redis";
import { safeJson } from "@/lib/safe-json";

export const dynamic = "force-dynamic";

export async function GET() {
  const videos = await getVideos();
  return Response.json(videos);
}

export async function POST(request: Request) {
  const body = await safeJson(request);
  if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });
  const { vibeVideoId, brainRotVideoId } = body as { vibeVideoId?: string; brainRotVideoId?: string };
  const update: Record<string, string> = {};
  if (typeof vibeVideoId === "string" && vibeVideoId.trim()) update.vibeVideoId = vibeVideoId.trim();
  if (typeof brainRotVideoId === "string" && brainRotVideoId.trim()) update.brainRotVideoId = brainRotVideoId.trim();
  if (Object.keys(update).length === 0) return Response.json({ error: "No valid fields" }, { status: 400 });
  await setVideos(update);
  return Response.json({ ok: true });
}
