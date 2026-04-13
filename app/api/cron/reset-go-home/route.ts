import {
  clearAllGoHome, clearAllPokes, clearBanner, clearAllBossReactions,
  clearAllTouchGrass, clearAllDontTalk, clearAllNeedWork, clearAllMetcalf,
  clearAllSessionTime, clearAllLastSeen, clearAllMoneyRequests,
  clearTakeover, clearAllSOS, clearAllMessages,
  clearAllStatusNotes, clearAllMoods, clearAllBodyDouble, clearAllMeds,
  setMemberStatus, setMemberAdhd,
} from "@/lib/redis";
import { MEMBERS } from "@/app/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fresh day: reset every member to Chillin' + ADHD to "locked tf in" (0)
  await Promise.all(MEMBERS.flatMap((m) => [
    setMemberStatus(m.name, 50),
    setMemberAdhd(m.name, 0),
  ]));

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
    clearAllMessages(),
    clearAllStatusNotes(),
    clearAllMoods(),
    clearAllBodyDouble(),
    clearAllMeds(),
  ]);
  return Response.json({ ok: true });
}
