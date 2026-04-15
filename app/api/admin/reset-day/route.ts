import {
  clearAllGoHome, clearAllPokes, clearBanner, clearAllBossReactions,
  clearAllTouchGrass, clearAllDontTalk, clearAllNeedWork, clearAllMetcalf,
  clearAllSessionTime, clearAllLastSeen, clearAllMoneyRequests,
  clearTakeover, clearAllSOS, clearAllMessages,
  clearAllMoods, clearAllBodyDouble, clearAllMeds,
  clearDailyVibe, setMemberStatus, setMemberAdhd, setBroadcast,
} from "@/lib/redis";
import { MEMBERS } from "@/app/lib/constants";
import { buildWelcomeMessage } from "@/lib/welcome";

export const dynamic = "force-dynamic";

export async function POST() {
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
    clearAllMoods(),
    clearAllBodyDouble(),
    clearAllMeds(),
    clearDailyVibe(),
  ]);

  return Response.json({ ok: true, welcome });
}
