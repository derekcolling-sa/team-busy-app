import { redis, getHireVotes } from "@/lib/redis";

export const dynamic = "force-dynamic";

// ── Server-side cache (collapses concurrent clients into one read) ───────────
let cached: { data: Record<string, unknown>; ts: number } | null = null;
const CACHE_TTL_MS = 3000;

// ── Hash keys to fetch via pipeline ─────────────────────────────────────────
const HASH_KEYS = [
  { key: "team-busy-status",          field: "status" },
  { key: "team-busy-updated",         field: "updated" },
  { key: "team-busy-status-notes",    field: "notes" },
  { key: "team-busy-ooo",             field: "ooo" },
  { key: "team-busy-ooo-details",     field: "oooDetails" },
  { key: "team-busy-sos",             field: "sos" },
  { key: "team-busy-go-home",         field: "goHome" },
  { key: "team-busy-pokes",           field: "pokes" },
  { key: "team-busy-timeoff",         field: "timeOff" },
  { key: "team-busy-metcalf",         field: "metcalf" },
  { key: "team-busy-boss-reactions",  field: "bossReactions" },
  { key: "team-busy-need-work",       field: "needWork" },
  { key: "team-busy-session-time",    field: "sessionTime" },
  { key: "team-busy-adhd",            field: "adhd" },
  { key: "team-busy-touch-grass",     field: "touchGrass" },
  { key: "team-busy-body-double",     field: "bodyDouble" },
  { key: "team-busy-meetings",        field: "meetings" },
  { key: "team-busy-last-seen",       field: "lastSeen" },
  { key: "team-busy-dont-talk",       field: "dontTalk" },
  { key: "team-busy-need-money",      field: "moneyRequests" },
  { key: "team-busy-moods",           field: "moods" },
  { key: "team-busy-bans",            field: "bans" },
  { key: "team-busy-meds",            field: "meds" },
  { key: "team-busy-hot-cold",        field: "hotCold" },
] as const;

// ── String keys to fetch via mget ───────────────────────────────────────────
const STRING_KEYS = [
  { key: "team-busy-messages",         field: "messages" },
  { key: "team-busy-urgent",           field: "urgent" },
  { key: "team-busy-reload",           field: "reload" },
  { key: "team-busy-banner",           field: "banner" },
  { key: "team-busy-takeover",         field: "takeover" },
  { key: "team-busy-shipped-features", field: "shippedFeatures" },
  { key: "team-busy-videos",           field: "videos" },
  { key: "team-busy-daily-vibe",       field: "dailyVibe" },
] as const;

const DEFAULT_VIDEOS = { vibeVideoId: "vTfD20dbxho", brainRotVideoId: "xxfeav5MlmI" };

export async function GET() {
  // Return cached data if fresh
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return Response.json(cached.data);
  }

  // Build a single pipeline: all hgetall + mget in one HTTP request
  const pipe = redis.pipeline();
  for (const h of HASH_KEYS) pipe.hgetall(h.key);
  pipe.mget<(string | null)[]>(...STRING_KEYS.map(s => s.key));

  const results = await pipe.exec();

  // Unpack hash results
  const data: Record<string, unknown> = {};
  HASH_KEYS.forEach((h, i) => {
    data[h.field] = results[i] ?? {};
  });

  // Unpack mget result (last item in pipeline)
  const stringValues = results[HASH_KEYS.length] as (string | null)[];
  STRING_KEYS.forEach((s, i) => {
    data[s.field] = stringValues?.[i] ?? null;
  });

  // ── Post-process to match existing API shape ──────────────────────────────

  // Numeric hashes: status, updated, sessionTime, adhd, lastSeen
  for (const f of ["status", "updated", "sessionTime", "adhd", "lastSeen"] as const) {
    const raw = data[f] as Record<string, unknown> | null;
    if (raw) {
      const out: Record<string, number> = {};
      for (const [k, v] of Object.entries(raw)) out[k] = Number(v);
      data[f] = out;
    }
  }

  // Boolean hashes: ooo, sos, needWork, metcalf, dontTalk, meds
  for (const f of ["ooo", "sos", "needWork", "metcalf", "dontTalk", "meds"] as const) {
    const raw = data[f] as Record<string, unknown> | null;
    if (raw) {
      const out: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(raw)) out[k] = v === "true" || v === true;
      data[f] = out;
    }
  }

  // String hashes: notes, bossReactions, moods, bans — already correct shape

  // oooDetails — values are JSON strings
  {
    const raw = data.oooDetails as Record<string, unknown> | null;
    if (raw) {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(raw)) {
        try { out[k] = typeof v === "string" ? JSON.parse(v) : v; } catch { out[k] = {}; }
      }
      data.oooDetails = out;
    }
  }

  // goHome — values are JSON strings with {ts, count}
  {
    const raw = data.goHome as Record<string, unknown> | null;
    if (raw) {
      data.goHome = Object.entries(raw).map(([name, val]) => {
        try {
          const parsed = typeof val === "string" ? JSON.parse(val) : val as { ts: number; count: number; type?: string };
          return { name, ts: Number(parsed.ts ?? val), count: Number(parsed.count ?? 1), type: parsed.type ?? "wants" };
        } catch { return { name, ts: Number(val), count: 1, type: "wants" }; }
      }).sort((a: { ts: number }, b: { ts: number }) => a.ts - b.ts);
    } else {
      data.goHome = [];
    }
  }

  // pokes — hash field "to:from" → array of {from, to, ts}
  {
    const raw = data.pokes as Record<string, unknown> | null;
    if (raw) {
      data.pokes = Object.entries(raw).map(([key, ts]) => {
        const [to, from] = key.split(":");
        return { to, from, ts: Number(ts) };
      });
    } else {
      data.pokes = [];
    }
  }

  // touchGrass — same shape as pokes
  {
    const raw = data.touchGrass as Record<string, unknown> | null;
    if (raw) {
      data.touchGrass = Object.entries(raw).map(([key, ts]) => {
        const [to, from] = key.split(":");
        return { to, from, ts: Number(ts) };
      });
    } else {
      data.touchGrass = [];
    }
  }

  // timeOff, moneyRequests — hash {name: ts} → array of {name, ts}
  for (const f of ["timeOff", "moneyRequests"] as const) {
    const raw = data[f] as Record<string, unknown> | null;
    if (raw) {
      data[f] = Object.entries(raw)
        .map(([name, ts]) => ({ name, ts: Number(ts) }))
        .sort((a: { ts: number }, b: { ts: number }) => a.ts - b.ts);
    } else {
      data[f] = [];
    }
  }

  // bodyDouble — hash → array of active member names
  {
    const raw = data.bodyDouble as Record<string, unknown> | null;
    data.bodyDouble = raw ? Object.keys(raw) : [];
  }

  // meetings — filter expired, return active only
  {
    const raw = data.meetings as Record<string, unknown> | null;
    if (raw) {
      const now = Date.now();
      const active: Record<string, number> = {};
      for (const [name, end] of Object.entries(raw)) {
        if (Number(end) > now) active[name] = Number(end);
      }
      data.meetings = active;
    }
  }

  // ── String values post-processing ─────────────────────────────────────────

  // messages — JSON string → array
  {
    const raw = data.messages;
    if (raw) {
      try {
        data.messages = typeof raw === "string" ? JSON.parse(raw) : Array.isArray(raw) ? raw : [];
      } catch { data.messages = []; }
    } else {
      data.messages = [];
    }
  }

  // urgent/broadcast — JSON string → object
  {
    const raw = data.urgent;
    if (raw) {
      try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (typeof parsed === "object" && parsed.message && parsed.type) {
          data.urgent = parsed;
        } else {
          data.urgent = { message: String(raw), type: "urgent" };
        }
      } catch {
        data.urgent = raw ? { message: String(raw), type: "urgent" } : null;
      }
    } else {
      data.urgent = null;
    }
  }

  // reload — number
  data.reload = typeof data.reload === "number" ? data.reload : Number(data.reload) || 0;

  // banner — JSON string → object
  {
    const raw = data.banner;
    if (raw) {
      try { data.banner = typeof raw === "string" ? JSON.parse(raw) : raw; } catch { data.banner = null; }
    } else {
      data.banner = null;
    }
  }

  // takeover — string or null
  data.takeover = data.takeover ? String(data.takeover) : null;

  // dailyVibe — string or null
  data.dailyVibe = data.dailyVibe ? String(data.dailyVibe) : null;

  // shippedFeatures — JSON string → array
  {
    const raw = data.shippedFeatures;
    if (raw) {
      try {
        data.shippedFeatures = typeof raw === "string" ? JSON.parse(raw) : Array.isArray(raw) ? raw : [];
      } catch { data.shippedFeatures = []; }
    } else {
      data.shippedFeatures = [];
    }
  }

  // videos — JSON string → object with defaults
  {
    const raw = data.videos;
    if (raw) {
      try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        data.videos = { ...DEFAULT_VIDEOS, ...(typeof parsed === "object" ? parsed : {}) };
      } catch { data.videos = DEFAULT_VIDEOS; }
    } else {
      data.videos = DEFAULT_VIDEOS;
    }
  }

  // Hire vote — fetched outside pipeline (date-keyed)
  const todayStr = new Date().toISOString().slice(0, 10);
  const hireVoteMap = await getHireVotes(todayStr);
  let writerYes = 0, designerYes = 0;
  for (const v of Object.values(hireVoteMap)) {
    if (v.writer) writerYes++;
    if (v.designer) designerYes++;
  }
  data.hireVote = { votes: hireVoteMap, writerYes, designerYes, total: Object.keys(hireVoteMap).length, date: todayStr };

  // Cache the result
  cached = { data, ts: Date.now() };

  return Response.json(data);
}
