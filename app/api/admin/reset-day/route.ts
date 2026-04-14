import {
  clearAllGoHome, clearAllPokes, clearBanner, clearAllBossReactions,
  clearAllTouchGrass, clearAllDontTalk, clearAllNeedWork, clearAllMetcalf,
  clearAllSessionTime, clearAllLastSeen, clearAllMoneyRequests,
  clearTakeover, clearAllSOS, clearAllMessages,
  clearAllStatusNotes, clearAllMoods, clearAllBodyDouble, clearAllMeds,
  clearDailyVibe, setMemberStatus, setMemberAdhd,
} from "@/lib/redis";
import { MEMBERS } from "@/app/lib/constants";

export const dynamic = "force-dynamic";

export async function POST() {
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
    clearDailyVibe(),
  ]);

  return Response.json({ ok: true });
}
