import {
  clearAllGoHome, clearAllPokes, clearBanner, clearAllBossReactions,
  clearAllTouchGrass, clearAllDontTalk, clearAllNeedWork, clearAllMetcalf,
  clearAllSessionTime, clearAllLastSeen, clearAllMoneyRequests,
  clearTakeover, clearAllSOS, clearAllMessages,
  clearAllStatusNotes, clearAllMoods, clearAllBodyDouble, clearAllMeds,
  clearDailyVibe, setMemberStatus, setMemberAdhd, setBroadcast,
} from "@/lib/redis";
import { MEMBERS } from "@/app/lib/constants";
import { buildWelcomeMessage } from "@/lib/welcome";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [welcome] = await Promise.all([
    buildWelcomeMessage(),
    Promise.all(MEMBERS.flatMap((m) => [
      setMemberStatus(m.name, 50),
      setMemberAdhd(m.name, 0),
    ])),
  ]);

  await Promise.all([
    setBroadcast(welcome, "broadcast"),
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
    clearDailyVibe(),
  ]);

  return Response.json({ ok: true, welcome });
}
