import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const REDIS_KEY = "team-busy-status";
const OOO_KEY = "team-busy-ooo";
const OOO_DETAILS_KEY = "team-busy-ooo-details";
const SOS_KEY = "team-busy-sos";
const UPDATED_KEY = "team-busy-updated";
const FEEDBACK_KEY = "team-busy-feedback";

export type TeamStatus = Record<string, number>;
export type OOOStatus = Record<string, boolean>;

export async function getAllStatus(): Promise<TeamStatus> {
  const data = await redis.hgetall(REDIS_KEY);
  if (!data) return {};
  const result: TeamStatus = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = Number(value);
  }
  return result;
}

export async function setMemberStatus(
  name: string,
  value: number
): Promise<void> {
  await Promise.all([
    redis.hset(REDIS_KEY, { [name]: value }),
    redis.hset(UPDATED_KEY, { [name]: Date.now() }),
  ]);
}

export type UpdatedTimestamps = Record<string, number>;

export async function getAllUpdated(): Promise<UpdatedTimestamps> {
  const data = await redis.hgetall(UPDATED_KEY);
  if (!data) return {};
  const result: UpdatedTimestamps = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = Number(value);
  }
  return result;
}

export async function getAllOOO(): Promise<OOOStatus> {
  const data = await redis.hgetall(OOO_KEY);
  if (!data) return {};
  const result: OOOStatus = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = value === "true" || value === true;
  }
  return result;
}

export async function setMemberOOO(
  name: string,
  ooo: boolean
): Promise<void> {
  await redis.hset(OOO_KEY, { [name]: String(ooo) });
}

export type OOODetails = { note?: string; backDate?: string };
export type OOODetailsMap = Record<string, OOODetails>;

export async function getAllOOODetails(): Promise<OOODetailsMap> {
  const data = await redis.hgetall(OOO_DETAILS_KEY);
  if (!data) return {};
  const result: OOODetailsMap = {};
  for (const [key, value] of Object.entries(data)) {
    try { result[key] = JSON.parse(value as string); } catch { result[key] = {}; }
  }
  return result;
}

export async function setMemberOOODetails(name: string, details: OOODetails): Promise<void> {
  await redis.hset(OOO_DETAILS_KEY, { [name]: JSON.stringify(details) });
}

export async function clearMemberOOODetails(name: string): Promise<void> {
  await redis.hdel(OOO_DETAILS_KEY, name);
}

export type SOSStatus = Record<string, boolean>;

export async function getAllSOS(): Promise<SOSStatus> {
  const data = await redis.hgetall(SOS_KEY);
  if (!data) return {};
  const result: SOSStatus = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = value === "true" || value === true;
  }
  return result;
}

export async function setMemberSOS(name: string, sos: boolean): Promise<void> {
  await redis.hset(SOS_KEY, { [name]: String(sos) });
}

export type FeedbackEntry = { name: string; message: string; ts: number };

export async function addFeedback(name: string, message: string): Promise<void> {
  const entry: FeedbackEntry = { name, message, ts: Date.now() };
  await redis.lpush(FEEDBACK_KEY, JSON.stringify(entry));
}

export async function getFeedback(): Promise<FeedbackEntry[]> {
  const items = await redis.lrange(FEEDBACK_KEY, 0, 49); // last 50
  return items.map((item) => (typeof item === "string" ? JSON.parse(item) : item));
}

export async function deleteFeedback(ts: number): Promise<void> {
  const items = await getFeedback();
  const toRemove = items.find((f) => f.ts === ts);
  if (toRemove) await redis.lrem(FEEDBACK_KEY, 1, JSON.stringify(toRemove));
}

const SHIPPED_KEY = "team-busy-shipped-features";
export type ShippedFeature = { name: string; message: string; ts: number; shippedAt: number; status?: "shipped" | "done" | "dumb" | "soon" };

export async function addShippedFeature(name: string, message: string, status: "shipped" | "done" | "dumb" | "soon" = "shipped"): Promise<void> {
  const existing = await getShippedFeatures();
  const entry: ShippedFeature = { name, message, ts: Date.now(), shippedAt: Date.now(), status };
  const all = [entry, ...existing.filter(f => f.message !== message)].slice(0, 10);
  await redis.set(SHIPPED_KEY, JSON.stringify(all));
}

export async function getShippedFeatures(): Promise<ShippedFeature[]> {
  try {
    const data = await redis.get(SHIPPED_KEY);
    if (!data) return [];
    if (typeof data === "string") return JSON.parse(data);
    if (Array.isArray(data)) return data as ShippedFeature[];
    return [];
  } catch {
    return [];
  }
}

export async function removeShippedFeature(ts: number): Promise<void> {
  const existing = await getShippedFeatures();
  const filtered = existing.filter(f => f.ts !== ts);
  await redis.set(SHIPPED_KEY, JSON.stringify(filtered));
}

const BAN_KEY = "team-busy-bans";
const BAN_DISPUTES_KEY = "team-busy-ban-disputes";
export type BanDispute = { name: string; message: string; ts: number };

export async function getAllBans(): Promise<Record<string, string>> {
  const data = await redis.hgetall(BAN_KEY);
  if (!data) return {};
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]));
}

export async function banMember(name: string, reason: string): Promise<void> {
  await redis.hset(BAN_KEY, { [name]: reason || "no reason given" });
}

export async function unbanMember(name: string): Promise<void> {
  await redis.hdel(BAN_KEY, name);
}

export async function addBanDispute(name: string, message: string): Promise<void> {
  const entry: BanDispute = { name, message, ts: Date.now() };
  await redis.lpush(BAN_DISPUTES_KEY, JSON.stringify(entry));
}

export async function getBanDisputes(): Promise<BanDispute[]> {
  const items = await redis.lrange(BAN_DISPUTES_KEY, 0, 49);
  return items.map((item) => (typeof item === "string" ? JSON.parse(item) : item));
}

export async function clearBanDispute(ts: number): Promise<void> {
  const existing = await getBanDisputes();
  const filtered = existing.filter(d => d.ts !== ts);
  await redis.del(BAN_DISPUTES_KEY);
  if (filtered.length > 0) await redis.rpush(BAN_DISPUTES_KEY, ...filtered.map(d => JSON.stringify(d)));
}

const MOOD_KEY = "team-busy-moods";

export async function getAllMoods(): Promise<Record<string, string>> {
  const data = await redis.hgetall(MOOD_KEY);
  if (!data) return {};
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]));
}

export async function setMood(name: string, mood: string): Promise<void> {
  await redis.hset(MOOD_KEY, { [name]: mood });
}

const VIDEOS_KEY = "team-busy-videos";
export type VideoConfig = { vibeVideoId: string; brainRotVideoId: string };
const DEFAULT_VIDEOS: VideoConfig = { vibeVideoId: "vTfD20dbxho", brainRotVideoId: "xxfeav5MlmI" };

export async function getVideos(): Promise<VideoConfig> {
  try {
    const data = await redis.get(VIDEOS_KEY);
    if (!data) return DEFAULT_VIDEOS;
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    return { ...DEFAULT_VIDEOS, ...parsed };
  } catch { return DEFAULT_VIDEOS; }
}

export async function setVideos(config: Partial<VideoConfig>): Promise<void> {
  const current = await getVideos();
  await redis.set(VIDEOS_KEY, JSON.stringify({ ...current, ...config }));
}

const TATTLE_KEY = "team-busy-tattles";
export type TattleEntry = { message: string; ts: number };

export async function addTattle(message: string): Promise<void> {
  const entry: TattleEntry = { message, ts: Date.now() };
  await redis.lpush(TATTLE_KEY, JSON.stringify(entry));
}

export async function getTattles(): Promise<TattleEntry[]> {
  const items = await redis.lrange(TATTLE_KEY, 0, 49);
  return items.map((item) => (typeof item === "string" ? JSON.parse(item) : item));
}

export async function clearTattle(ts: number): Promise<void> {
  const existing = await getTattles();
  const filtered = existing.filter(t => t.ts !== ts);
  await redis.del(TATTLE_KEY);
  if (filtered.length > 0) {
    await redis.rpush(TATTLE_KEY, ...filtered.map(t => JSON.stringify(t)));
  }
}

const STATUS_NOTES_KEY = "team-busy-status-notes";
const FEEDBACK_RESOLVED_KEY = "team-busy-feedback-resolved";

export async function getAllStatusNotes(): Promise<Record<string, string>> {
  const data = await redis.hgetall(STATUS_NOTES_KEY);
  if (!data) return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = String(value);
  }
  return result;
}

export async function setStatusNote(name: string, note: string): Promise<void> {
  if (note.trim()) {
    await redis.hset(STATUS_NOTES_KEY, { [name]: note.trim() });
  } else {
    await redis.hdel(STATUS_NOTES_KEY, name);
  }
}

export async function markFeedbackResolved(ts: number): Promise<void> {
  await redis.sadd(FEEDBACK_RESOLVED_KEY, String(ts));
}

export async function getResolvedFeedbackTs(): Promise<number[]> {
  const members = await redis.smembers(FEEDBACK_RESOLVED_KEY);
  return (members ?? []).map(Number);
}

const PHOTOS_KEY = "team-busy-photos";

export async function getAllPhotos(): Promise<Record<string, string>> {
  const data = await redis.hgetall(PHOTOS_KEY);
  if (!data) return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = String(value);
  }
  return result;
}

export async function setMemberPhoto(name: string, url: string): Promise<void> {
  await redis.hset(PHOTOS_KEY, { [name]: url });
}

const MESSAGES_KEY = "team-busy-messages";

export type MessageEntry = { name: string; message: string; ts: number };

export async function addMessage(name: string, message: string): Promise<void> {
  const existing = await getMessages();
  const filtered = existing.filter((m) => m.name !== name);
  const newEntry: MessageEntry = { name, message, ts: Date.now() };
  const all = [newEntry, ...filtered].slice(0, 20);
  await redis.set(MESSAGES_KEY, JSON.stringify(all));
}

export async function getMessages(): Promise<MessageEntry[]> {
  try {
    const data = await redis.get(MESSAGES_KEY);
    if (!data) return [];
    if (typeof data === "string") return JSON.parse(data);
    if (Array.isArray(data)) return data as MessageEntry[];
    return [];
  } catch {
    // Key might be old list format — migrate it
    try {
      const items = await redis.lrange(MESSAGES_KEY, 0, 19);
      const messages = items.map((item) => (typeof item === "string" ? JSON.parse(item) : item)) as MessageEntry[];
      // Migrate to new format
      await redis.del(MESSAGES_KEY);
      if (messages.length > 0) await redis.set(MESSAGES_KEY, JSON.stringify(messages));
      return messages;
    } catch {
      // Completely broken — nuke and start fresh
      await redis.del(MESSAGES_KEY);
      return [];
    }
  }
}

// Daily history — key format: team-busy-history:YYYY-MM-DD
// Stores a hash of { memberName: averageValue } for each day

function todayKey(): string {
  return `team-busy-history:${new Date().toISOString().slice(0, 10)}`;
}

export type DaySnapshot = Record<string, number>;
export type HistoryData = { date: string; snapshot: DaySnapshot }[];

export async function logDailySnapshot(): Promise<void> {
  const [statuses, ooo] = await Promise.all([getAllStatus(), getAllOOO()]);
  const key = todayKey();
  const updates: Record<string, string> = {};
  for (const [name, value] of Object.entries(statuses)) {
    if (!ooo[name]) {
      updates[name] = String(value);
    }
  }
  if (Object.keys(updates).length > 0) {
    await redis.hset(key, updates);
    await redis.expire(key, 60 * 60 * 24 * 90); // keep 90 days
  }
}

export async function getHistory(days = 14): Promise<HistoryData> {
  const result: HistoryData = [];
  const today = new Date();
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    keys.push(`team-busy-history:${d.toISOString().slice(0, 10)}`);
  }
  await Promise.all(
    keys.map(async (key) => {
      const data = await redis.hgetall(key);
      const date = key.replace("team-busy-history:", "");
      const snapshot: DaySnapshot = {};
      if (data) {
        for (const [name, value] of Object.entries(data)) {
          snapshot[name] = Number(value);
        }
      }
      result.push({ date, snapshot });
    })
  );
  result.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}


const GO_HOME_KEY = "team-busy-go-home";

export type GoHomeEntry = { name: string; ts: number; count: number };

export async function requestGoHome(name: string): Promise<void> {
  const raw = await redis.hget(GO_HOME_KEY, name);
  let count = 1;
  if (raw) {
    try {
      const existing = typeof raw === "string" ? JSON.parse(raw) : raw as GoHomeEntry;
      count = (existing.count ?? 1) + 1;
    } catch { count = 2; }
  }
  await redis.hset(GO_HOME_KEY, { [name]: JSON.stringify({ ts: Date.now(), count }) });
}

export async function clearGoHome(name: string): Promise<void> {
  await redis.hdel(GO_HOME_KEY, name);
}

export async function clearAllGoHome(): Promise<void> {
  await redis.del(GO_HOME_KEY);
}

export async function getGoHomeRequests(): Promise<GoHomeEntry[]> {
  const data = await redis.hgetall(GO_HOME_KEY);
  if (!data) return [];
  return Object.entries(data).map(([name, val]) => {
    try {
      const parsed = typeof val === "string" ? JSON.parse(val) : val as GoHomeEntry;
      return { name, ts: Number(parsed.ts ?? val), count: Number(parsed.count ?? 1) };
    } catch {
      return { name, ts: Number(val), count: 1 };
    }
  }).sort((a, b) => a.ts - b.ts);
}

const POKES_KEY = "team-busy-pokes";

export type PokeEntry = { from: string; to: string; ts: number };

export async function sendPoke(from: string, to: string): Promise<void> {
  await redis.hset(POKES_KEY, { [`${to}:${from}`]: Date.now() });
}

export async function clearPoke(from: string, to: string): Promise<void> {
  await redis.hdel(POKES_KEY, `${to}:${from}`);
}

export async function clearAllPokes(): Promise<void> {
  await redis.del(POKES_KEY);
}

export async function getAllPokes(): Promise<PokeEntry[]> {
  const data = await redis.hgetall(POKES_KEY);
  if (!data) return [];
  return Object.entries(data).map(([key, ts]) => {
    const [to, from] = key.split(":");
    return { to, from, ts: Number(ts) };
  });
}


const TOUCH_GRASS_KEY = "team-busy-touch-grass";

export type TouchGrassEntry = { from: string; to: string; ts: number };

export async function sendTouchGrass(from: string, to: string): Promise<void> {
  await redis.hset(TOUCH_GRASS_KEY, { [`${to}:${from}`]: Date.now() });
}

export async function clearTouchGrass(from: string, to: string): Promise<void> {
  await redis.hdel(TOUCH_GRASS_KEY, `${to}:${from}`);
}

export async function getAllTouchGrass(): Promise<TouchGrassEntry[]> {
  const data = await redis.hgetall(TOUCH_GRASS_KEY);
  if (!data) return [];
  return Object.entries(data).map(([key, ts]) => {
    const [to, from] = key.split(":");
    return { to, from, ts: Number(ts) };
  });
}

const BUDDIES_KEY = "team-busy-buddies";

export type BuddyAssignment = { id: string; hatchedAt: number };

export async function getAllBuddies(): Promise<Record<string, BuddyAssignment>> {
  const data = await redis.hgetall(BUDDIES_KEY);
  if (!data) return {};
  const result: Record<string, BuddyAssignment> = {};
  for (const [key, value] of Object.entries(data)) {
    try {
      result[key] = typeof value === 'string' ? JSON.parse(value) : value as BuddyAssignment;
    } catch { /* skip */ }
  }
  return result;
}

export async function setMemberBuddy(name: string, id: string): Promise<void> {
  const assignment: BuddyAssignment = { id, hatchedAt: Date.now() };
  await redis.hset(BUDDIES_KEY, { [name]: JSON.stringify(assignment) });
}

export async function clearMemberBuddy(name: string): Promise<void> {
  await redis.hdel(BUDDIES_KEY, name);
}

const BANNER_KEY = "team-busy-banner";

export type BannerType = "daily" | "feature";
export type BannerData = { message: string; date: string; type: BannerType };

export async function getBanner(): Promise<BannerData | null> {
  const val = await redis.get(BANNER_KEY);
  if (!val) return null;
  if (typeof val === "object") return val as BannerData;
  try { return JSON.parse(val as string); } catch { return null; }
}

export async function setBanner(message: string, date: string, type: BannerType = "daily"): Promise<void> {
  await redis.set(BANNER_KEY, JSON.stringify({ message, date, type }));
}

export async function clearBanner(): Promise<void> {
  await redis.del(BANNER_KEY);
}

const RELOAD_KEY = "team-busy-reload";

export async function getReloadSignal(): Promise<number> {
  const val = await redis.get(RELOAD_KEY);
  return typeof val === "number" ? val : 0;
}

export async function triggerReload(): Promise<void> {
  await redis.set(RELOAD_KEY, Date.now());
}

const URGENT_KEY = "team-busy-urgent";

export type BroadcastType = "urgent" | "broadcast";
export type BroadcastMessage = { message: string; type: BroadcastType } | null;

export async function getBroadcast(): Promise<BroadcastMessage> {
  const val = await redis.get(URGENT_KEY);
  if (!val) return null;
  // Upstash auto-deserializes JSON, so val may already be a parsed object
  if (typeof val === "object") {
    const obj = val as Record<string, string>;
    if (obj.message && obj.type) return { message: obj.message, type: obj.type as BroadcastType };
  }
  // Legacy plain string
  const str = String(val);
  if (!str) return null;
  return { message: str, type: "urgent" };
}

export async function setBroadcast(message: string, type: BroadcastType): Promise<void> {
  if (message.trim()) {
    await redis.set(URGENT_KEY, JSON.stringify({ message: message.trim(), type }));
  } else {
    await redis.del(URGENT_KEY);
  }
}

const BODY_DOUBLE_KEY = "team-busy-body-double";
const MEETINGS_KEY = "team-busy-meetings";

export async function getBodyDouble(): Promise<string[]> {
  const data = await redis.hgetall(BODY_DOUBLE_KEY);
  if (!data) return [];
  return Object.keys(data);
}

export async function setBodyDouble(name: string, active: boolean): Promise<void> {
  if (active) {
    await redis.hset(BODY_DOUBLE_KEY, { [name]: Date.now() });
  } else {
    await redis.hdel(BODY_DOUBLE_KEY, name);
  }
}

export async function getMeetings(): Promise<Record<string, number>> {
  const data = await redis.hgetall(MEETINGS_KEY);
  if (!data) return {};
  const now = Date.now();
  const active: Record<string, number> = {};
  for (const [name, end] of Object.entries(data)) {
    if (Number(end) > now) active[name] = Number(end);
    else await redis.hdel(MEETINGS_KEY, name);
  }
  return active;
}

export async function setMeeting(name: string, endTs: number | null): Promise<void> {
  if (endTs && endTs > Date.now()) {
    await redis.hset(MEETINGS_KEY, { [name]: endTs });
  } else {
    await redis.hdel(MEETINGS_KEY, name);
  }
}

const TAKEOVER_KEY = "team-busy-takeover";

export async function getTakeover(): Promise<string | null> {
  const val = await redis.get(TAKEOVER_KEY);
  if (!val) return null;
  return String(val);
}

export async function setTakeover(message: string): Promise<void> {
  if (message.trim()) {
    await redis.set(TAKEOVER_KEY, message.trim());
  } else {
    await redis.del(TAKEOVER_KEY);
  }
}

const BOSS_REACTIONS_KEY = "team-busy-boss-reactions";

export type BossReaction = "heart" | "thumbsdown";
export type BossReactionsMap = Record<string, BossReaction>; // name → reaction

export async function getAllBossReactions(): Promise<BossReactionsMap> {
  const data = await redis.hgetall(BOSS_REACTIONS_KEY);
  if (!data) return {};
  const result: BossReactionsMap = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = value as BossReaction;
  }
  return result;
}

export async function setBossReaction(name: string, reaction: BossReaction | null): Promise<void> {
  if (reaction === null) {
    await redis.hdel(BOSS_REACTIONS_KEY, name);
  } else {
    await redis.hset(BOSS_REACTIONS_KEY, { [name]: reaction });
  }
}

export async function clearAllBossReactions(): Promise<void> {
  await redis.del(BOSS_REACTIONS_KEY);
}

const NEED_WORK_KEY = "team-busy-need-work";

export type NeedWorkStatus = Record<string, boolean>;

export async function getAllNeedWork(): Promise<NeedWorkStatus> {
  const data = await redis.hgetall(NEED_WORK_KEY);
  if (!data) return {};
  const result: NeedWorkStatus = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = value === "true" || value === true;
  }
  return result;
}

export async function setMemberNeedWork(name: string, active: boolean): Promise<void> {
  await redis.hset(NEED_WORK_KEY, { [name]: String(active) });
}

const METCALF_KEY = "team-busy-metcalf";

export type MetcalfStatus = Record<string, boolean>;

export async function getAllMetcalf(): Promise<MetcalfStatus> {
  const data = await redis.hgetall(METCALF_KEY);
  if (!data) return {};
  const result: MetcalfStatus = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = value === "true" || value === true;
  }
  return result;
}

export async function setMemberMetcalf(name: string, active: boolean): Promise<void> {
  await redis.hset(METCALF_KEY, { [name]: String(active) });
}

const DONT_TALK_KEY = "team-busy-dont-talk";

export async function getAllDontTalkToMe(): Promise<Record<string, boolean>> {
  const data = await redis.hgetall(DONT_TALK_KEY);
  if (!data) return {};
  const result: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = value === "true" || value === true;
  }
  return result;
}

export async function setDontTalkToMe(name: string, active: boolean): Promise<void> {
  await redis.hset(DONT_TALK_KEY, { [name]: String(active) });
}

const SESSION_TIME_KEY = "team-busy-session-time";

export async function getAllSessionTime(): Promise<Record<string, number>> {
  const data = await redis.hgetall(SESSION_TIME_KEY);
  if (!data) return {};
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = Number(value);
  }
  return result;
}

export async function addSessionTime(name: string, seconds: number): Promise<void> {
  await redis.hincrbyfloat(SESSION_TIME_KEY, name, seconds);
}

const LAST_SEEN_KEY = "team-busy-last-seen";

export async function setLastSeen(name: string): Promise<void> {
  await redis.hset(LAST_SEEN_KEY, { [name]: Date.now() });
}

export async function getAllLastSeen(): Promise<Record<string, number>> {
  const data = await redis.hgetall(LAST_SEEN_KEY);
  if (!data) return {};
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = Number(value);
  }
  return result;
}

const ADHD_KEY = "team-busy-adhd";

export async function getAllAdhd(): Promise<Record<string, number>> {
  const data = await redis.hgetall(ADHD_KEY);
  if (!data) return {};
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = Number(value);
  }
  return result;
}

export async function setMemberAdhd(name: string, value: number): Promise<void> {
  await redis.hset(ADHD_KEY, { [name]: value });
}

const RATINGS_KEY = "team-busy-ratings";

// ratings stored as hash: field = "{rater}:{ratee}", value = 1-5
export type RatingsMap = Record<string, Record<string, number>>; // ratee → rater → stars

export async function getAllRatings(): Promise<RatingsMap> {
  const data = await redis.hgetall(RATINGS_KEY);
  if (!data) return {};
  const result: RatingsMap = {};
  for (const [field, value] of Object.entries(data)) {
    const colonIdx = field.indexOf(":");
    const rater = field.slice(0, colonIdx);
    const ratee = field.slice(colonIdx + 1);
    if (!result[ratee]) result[ratee] = {};
    result[ratee][rater] = Number(value);
  }
  return result;
}

export async function setRating(rater: string, ratee: string, stars: number): Promise<void> {
  await redis.hset(RATINGS_KEY, { [`${rater}:${ratee}`]: stars });
}

const TIMEOFF_KEY = "team-busy-timeoff";

export type TimeOffEntry = { name: string; ts: number };

export async function requestTimeOff(name: string): Promise<void> {
  await redis.hset(TIMEOFF_KEY, { [name]: Date.now() });
}

export async function clearTimeOff(name: string): Promise<void> {
  await redis.hdel(TIMEOFF_KEY, name);
}

export async function getTimeOffRequests(): Promise<TimeOffEntry[]> {
  const data = await redis.hgetall(TIMEOFF_KEY);
  if (!data) return [];
  return Object.entries(data)
    .map(([name, ts]) => ({ name, ts: Number(ts) }))
    .sort((a, b) => a.ts - b.ts);
}

const NEED_MONEY_KEY = "team-busy-need-money";

export async function requestMoney(name: string): Promise<void> {
  await redis.hset(NEED_MONEY_KEY, { [name]: Date.now() });
}

export async function clearMoneyRequest(name: string): Promise<void> {
  await redis.hdel(NEED_MONEY_KEY, name);
}

export async function getMoneyRequests(): Promise<TimeOffEntry[]> {
  const data = await redis.hgetall(NEED_MONEY_KEY);
  if (!data) return [];
  return Object.entries(data)
    .map(([name, ts]) => ({ name, ts: Number(ts) }))
    .sort((a, b) => a.ts - b.ts);
}

// Daily reset helpers
export async function clearAllTouchGrass(): Promise<void> { await redis.del(TOUCH_GRASS_KEY); }
export async function clearAllDontTalk(): Promise<void> { await redis.del(DONT_TALK_KEY); }
export async function clearAllNeedWork(): Promise<void> { await redis.del(NEED_WORK_KEY); }
export async function clearAllMetcalf(): Promise<void> { await redis.del(METCALF_KEY); }
export async function clearAllSessionTime(): Promise<void> { await redis.del(SESSION_TIME_KEY); }
export async function clearAllLastSeen(): Promise<void> { await redis.del(LAST_SEEN_KEY); }
export async function clearAllMoneyRequests(): Promise<void> { await redis.del(NEED_MONEY_KEY); }
export async function clearTakeover(): Promise<void> { await redis.del(TAKEOVER_KEY); }
export async function clearAllSOS(): Promise<void> { await redis.del(SOS_KEY); }
export async function clearAllAdhd(): Promise<void> { await redis.del(ADHD_KEY); }
export async function clearAllMessages(): Promise<void> { await redis.del(MESSAGES_KEY); }
