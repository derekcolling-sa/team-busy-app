import {
  clearAllGoHome, clearAllPokes, clearBanner, clearAllBossReactions,
  clearAllTouchGrass, clearAllDontTalk, clearAllNeedWork, clearAllMetcalf,
  clearAllSessionTime, clearAllLastSeen, clearAllMoneyRequests,
  clearTakeover, clearAllSOS, clearAllAdhd, clearAllMessages,
  setMemberStatus,
} from "@/lib/redis";
import { MEMBERS } from "@/app/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Reset all member statuses to 50 (Chillin')
  await Promise.all(MEMBERS.map((m) => setMemberStatus(m.name, 50)));

  await Promise.all([
    clearAllGoHome(),
    clearAllPokes(),
    clearBanner(),
    clearAllBossReactions(),
    clearAllTouchGrass(),
    clearAllDontTalk(),
    clearAllNeedWork(),
    clearAllMetcalf(),
    clearAllSessionTime(),
    clearAllLastSeen(),
    clearAllMoneyRequests(),
    clearTakeover(),
    clearAllSOS(),
    clearAllAdhd(),
    clearAllMessages(),
  ]);
  return Response.json({ ok: true });
}
