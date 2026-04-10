import {
  getAllStatus, getAllUpdated, getAllStatusNotes,
  getAllOOO, getAllOOODetails, getAllSOS,
  getMessages, getBroadcast,
  getGoHomeRequests, getReloadSignal, getBanner, getAllPokes,
  getTimeOffRequests, getAllMetcalf, getAllBossReactions,
  getAllNeedWork, getAllSessionTime, getAllAdhd, getAllTouchGrass, getTakeover,
  getBodyDouble, getMeetings,
} from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const [
    status, updated, notes,
    ooo, oooDetails, sos,
    messages, urgent,
    goHome, reload, banner, pokes,
    timeOff, metcalf, bossReactions,
    needWork, sessionTime, adhd, touchGrass, takeover, bodyDouble, meetings,
  ] = await Promise.all([
    getAllStatus(),
    getAllUpdated(),
    getAllStatusNotes(),
    getAllOOO(),
    getAllOOODetails(),
    getAllSOS(),
    getMessages(),
    getBroadcast(),
    getGoHomeRequests(),
    getReloadSignal(),
    getBanner(),
    getAllPokes(),
    getTimeOffRequests(),
    getAllMetcalf(),
    getAllBossReactions(),
    getAllNeedWork(),
    getAllSessionTime(),
    getAllAdhd(),
    getAllTouchGrass(),
    getTakeover(),
    getBodyDouble(),
    getMeetings(),
  ]);

  return Response.json({
    status, updated, notes,
    ooo, oooDetails, sos,
    messages, urgent,
    goHome, reload, banner, pokes,
    timeOff, metcalf, bossReactions,
    needWork, sessionTime, adhd, touchGrass, takeover, bodyDouble, meetings,
  });
}
