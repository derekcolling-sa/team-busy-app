import {
  getAllStatus, getAllUpdated, getAllStatusNotes,
  getAllOOO, getAllOOODetails, getAllSOS,
  getMessages, getBroadcast, getChatMessages, getAllReactions,
  getGoHomeRequests, getReloadSignal, getBanner, getAllPokes,
  getTimeOffRequests, getAllMetcalf, getAllBossReactions,
  getAllNeedWork, getAllSessionTime, getAllAdhd,
} from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const [
    status, updated, notes,
    ooo, oooDetails, sos,
    messages, urgent, chat, reactions,
    goHome, reload, banner, pokes,
    timeOff, metcalf, bossReactions,
    needWork, sessionTime, adhd,
  ] = await Promise.all([
    getAllStatus(),
    getAllUpdated(),
    getAllStatusNotes(),
    getAllOOO(),
    getAllOOODetails(),
    getAllSOS(),
    getMessages(),
    getBroadcast(),
    getChatMessages(),
    getAllReactions(),
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
  ]);

  return Response.json({
    status, updated, notes,
    ooo, oooDetails, sos,
    messages, urgent, chat, reactions,
    goHome, reload, banner, pokes,
    timeOff, metcalf, bossReactions,
    needWork, sessionTime, adhd,
  });
}
