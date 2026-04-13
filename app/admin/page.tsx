"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { getBuddyById, getBuddyImagePath, RARITY_STYLES, BUDDIES } from "@/lib/buddies";

const BUDDIES_ENABLED = true;

const ADMIN_PASSWORD = "2588";

const MEMBERS = [
  { name: "Brendan", photo: "/photos/Brendan.jpg" },
  { name: "Callie", photo: "/photos/Callie.jpg" },
  { name: "Chris", photo: "/photos/Chris.jpg" },
  { name: "Derek", photo: "/photos/Derek.jpeg" },
  { name: "Erin", photo: "/photos/Erin.jpg" },
  { name: "KC", photo: "/photos/KC.jpeg" },
  { name: "Kerry", photo: "/photos/Kerry.jpg" },
  { name: "Maddie", photo: "/photos/Maddie.jpg" },
];

const LABELS = ["Chillin'", "Sautéed", "Cooking", "Cooked"];
const EMOJIS = ["😎", "🍳", "🔥", "💀"];
const LEVEL_COLORS = ["#5cb85c", "#4a9eff", "#f5a623", "#e8742d"];
const ADHD_LABELS = ["locked tf in", "lowkey glazed", "brainrot szn", "absolutely feral"];
const ADHD_COLORS = ["#a8f5c8", "#b8d4ff", "#dbb8ff", "#ffb8e0"];
const ADHD_EMOJIS = ["🧠", "😵‍💫", "📱", "🐿️"];
function getAdhdLevel(val: number) {
  if (val <= 25) return 0;
  if (val <= 50) return 1;
  if (val <= 75) return 2;
  return 3;
}
const MEMBER_COLORS = [
  "#f472b6", "#60a5fa", "#34d399", "#fb923c", "#a78bfa", "#facc15", "#f87171", "#4ade80",
];

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getLevel(val: number) {
  if (val <= 20) return 0;
  if (val <= 50) return 1;
  if (val <= 77) return 2;
  return 3;
}

function formatDate(dateStr: string) {
  const [, month, day] = dateStr.split("-");
  return `${parseInt(month)}/${parseInt(day)}`;
}

type DaySnapshot = Record<string, number>;
type HistoryEntry = { date: string; snapshot: DaySnapshot };

function TeamHistoryChart({ history }: { history: HistoryEntry[] }) {
  const W = 900;
  const H = 420;
  const PAD_L = 40;
  const PAD_R = 12;
  const PAD_T = 12;
  const PAD_B = 28;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const xScale = (i: number) => PAD_L + (i / Math.max(history.length - 1, 1)) * chartW;
  const yScale = (v: number) => PAD_T + chartH - (v / 100) * chartH;

  const yTicks = [0, 25, 50, 75, 100];
  const levelBands = [
    { from: 0, to: 20, label: "Chillin'", color: "#5cb85c" },
    { from: 21, to: 50, label: "Sautéed", color: "#4a9eff" },
    { from: 51, to: 77, label: "Cooking", color: "#f5a623" },
    { from: 78, to: 100, label: "Cooked", color: "#e8742d" },
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "auto", maxHeight: "480px" }}>
      {/* Level band backgrounds */}
      {levelBands.map((band) => (
        <rect
          key={band.label}
          x={PAD_L}
          y={yScale(band.to)}
          width={chartW}
          height={yScale(band.from) - yScale(band.to)}
          fill={band.color}
          opacity="0.04"
        />
      ))}

      {/* Horizontal gridlines + Y labels */}
      {yTicks.map((pct) => (
        <g key={pct}>
          <line
            x1={PAD_L} y1={yScale(pct)}
            x2={PAD_L + chartW} y2={yScale(pct)}
            stroke="#e0dbd4" strokeWidth="1"
            strokeDasharray={pct === 0 || pct === 100 ? "none" : "4,3"}
          />
          <text x={PAD_L - 6} y={yScale(pct) + 4} textAnchor="end" fontSize="10" fill="#b5b0a8" fontWeight="600">
            {pct}
          </text>
        </g>
      ))}

      {/* Vertical day lines + X labels */}
      {history.map((d, i) => {
        const x = xScale(i);
        const showLabel = i === 0 || i === history.length - 1 || i % 2 === 0;
        return (
          <g key={d.date}>
            <line x1={x} y1={PAD_T} x2={x} y2={PAD_T + chartH} stroke="#f0ece6" strokeWidth="1" />
            {showLabel && (
              <text x={x} y={H - 6} textAnchor="middle" fontSize="9" fill="#b5b0a8" fontWeight="600">
                {formatDate(d.date)}
              </text>
            )}
          </g>
        );
      })}

      {/* Member lines */}
      {MEMBERS.map((member, mi) => {
        const color = MEMBER_COLORS[mi];
        const pts = history
          .map((d, i) => d.snapshot[member.name] != null
            ? { x: xScale(i), y: yScale(d.snapshot[member.name]) }
            : null
          )
          .filter(Boolean) as { x: number; y: number }[];

        if (pts.length < 2) return null;
        const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
        const lastPt = pts[pts.length - 1];

        return (
          <g key={member.name}>
            <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
            {/* End dot */}
            <circle cx={lastPt.x} cy={lastPt.y} r="3.5" fill={color} />
            {/* Name label at end */}
            <text x={lastPt.x + 6} y={lastPt.y + 4} fontSize="9" fill={color} fontWeight="700">{member.name}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const [statuses, setStatuses] = useState<Record<string, number>>({});
  const [oooStatuses, setOooStatuses] = useState<Record<string, boolean>>({});
  const [oooDetails, setOooDetails] = useState<Record<string, { note?: string; backDate?: string }>>({});
  const [sosStatuses, setSosStatuses] = useState<Record<string, boolean>>({});
  const [updatedAt, setUpdatedAt] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [feedback, setFeedback] = useState<{ name: string; message: string; ts: number }[]>([]);
  const [resolvedTs, setResolvedTs] = useState<Set<number>>(new Set());
  const [resolvedFromServer, setResolvedFromServer] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState<string | null>(null);
  const [inlineOOOEdit, setInlineOOOEdit] = useState<string | null>(null);
  const [ghostNote, setGhostNote] = useState("");
  const [ghostBackDate, setGhostBackDate] = useState("");
  const [photoOverrides, setPhotoOverrides] = useState<Record<string, string>>({});
  const sortTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [sortedMembers, setSortedMembers] = useState(MEMBERS);
  const [broadcast, setBroadcast] = useState<{ message: string; type: "urgent" | "broadcast" } | null>(null);
  const [urgentInput, setUrgentInput] = useState("");
  const [buddies, setBuddies] = useState<Record<string, { id: string }>>({});
  const [goHomeRequests, setGoHomeRequests] = useState<{ name: string; ts: number }[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<{ name: string; ts: number }[]>([]);
  const [moneyRequests, setMoneyRequests] = useState<{ name: string; ts: number }[]>([]);
  const [dontTalkStatuses, setDontTalkStatuses] = useState<Record<string, boolean>>({});
  const [needWorkStatuses, setNeedWorkStatuses] = useState<Record<string, boolean>>({});
  const [metcalfStatuses, setMetcalfStatuses] = useState<Record<string, boolean>>({});
  const [adhdLevels, setAdhdLevels] = useState<Record<string, number>>({});
  const [meetings, setMeetings] = useState<Record<string, number>>({});
  const [sessionTimes, setSessionTimes] = useState<Record<string, number>>({});
  const [touchGrass, setTouchGrass] = useState<{ from: string; to: string; ts: number }[]>([]);
  const [pokes, setPokes] = useState<{ from: string; to: string; ts: number }[]>([]);
  const [lastSeen, setLastSeen] = useState<Record<string, number>>({});
  const [statusNotes, setStatusNotes] = useState<Record<string, string>>({});
  const [shippedFeatures, setShippedFeatures] = useState<{ name: string; message: string; ts: number; shippedAt: number }[]>([]);
  const [tattles, setTattles] = useState<{ message: string; ts: number }[]>([]);
  const [bans, setBans] = useState<Record<string, string>>({});
  const [banDisputes, setBanDisputes] = useState<{ name: string; message: string; ts: number }[]>([]);
  const [banReasonInput, setBanReasonInput] = useState<Record<string, string>>({});
  const [banningTarget, setBanningTarget] = useState<string | null>(null);
  const [vibeVideoId, setVibeVideoId] = useState("vTfD20dbxho");
  const [brainRotVideoId, setBrainRotVideoId] = useState("xxfeav5MlmI");
  const [vibeVideoInput, setVibeVideoInput] = useState("");
  const [brainRotVideoInput, setBrainRotVideoInput] = useState("");
  const [videoSaved, setVideoSaved] = useState<"vibe" | "brainrot" | null>(null);

  useEffect(() => {
    const user = localStorage.getItem("team-busy-user");
    // Redirect Erin to her own mod page
    if (user === "Erin") { window.location.href = "/mod"; return; }
    if (sessionStorage.getItem("admin-authed") === "true") setAuthed(true);
    // Auto-auth if logged in as Derek on the main app
    if (user === "Derek") {
      sessionStorage.setItem("admin-authed", "true");
      setAuthed(true);
    }
  }, []);

  const handleLogin = () => {
    if (pin === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin-authed", "true");
      setAuthed(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPin("");
    }
  };

  // Live poll — only real-time data, runs every 60s
  const fetchPoll = useCallback(async () => {
    try {
      const poll = await fetch("/api/poll").then(r => r.json());
      setStatuses(poll.status ?? {});
      setUpdatedAt(poll.updated ?? {});
      setStatusNotes(poll.notes ?? {});
      setOooStatuses(poll.ooo ?? {});
      setOooDetails(poll.oooDetails ?? {});
      setSosStatuses(poll.sos ?? {});
      setBroadcast(poll.urgent?.message ? { message: poll.urgent.message, type: poll.urgent.type ?? "broadcast" } : null);
      setGoHomeRequests(poll.goHome ?? []);
      setTimeOffRequests(poll.timeOff ?? []);
      setMoneyRequests(poll.moneyRequests ?? []);
      setMetcalfStatuses(poll.metcalf ?? {});
      setNeedWorkStatuses(poll.needWork ?? {});
      setDontTalkStatuses(poll.dontTalk ?? {});
      setAdhdLevels(poll.adhd ?? {});
      setSessionTimes(poll.sessionTime ?? {});
      setPokes(poll.pokes ?? []);
      setTouchGrass(poll.touchGrass ?? []);
      setMeetings(poll.meetings ?? {});
      setLastSeen(poll.lastSeen ?? {});
      setShippedFeatures(poll.shippedFeatures ?? []);
      setBans(poll.bans ?? {});
      if (poll.videos?.vibeVideoId) setVibeVideoId(poll.videos.vibeVideoId);
      if (poll.videos?.brainRotVideoId) setBrainRotVideoId(poll.videos.brainRotVideoId);
    } catch {
      // retry next poll
    }
  }, []);

  // Inbox poll — feedback, tattles, ban disputes — slower cadence (every 3 min)
  const fetchInbox = useCallback(async () => {
    try {
      const [feedbackRes, tattleRes, banRes] = await Promise.all([
        fetch("/api/feedback"),
        fetch("/api/tattle"),
        fetch("/api/ban"),
      ]);
      const [feedbackData, tattleData, banData] = await Promise.all([
        feedbackRes.json(),
        tattleRes.json(),
        banRes.json(),
      ]);
      setFeedback(feedbackData.items ?? feedbackData);
      setResolvedFromServer(feedbackData.resolvedTs ?? []);
      setTattles(tattleData.tattles ?? []);
      setBanDisputes(banData.disputes ?? []);
    } catch {
      // retry next poll
    }
  }, []);

  // Static data — history, photos, buddies — fetch once on mount
  const fetchStatic = useCallback(async () => {
    try {
      const [historyRes, photosRes, buddiesRes] = await Promise.all([
        fetch("/api/history"),
        fetch("/api/photos"),
        fetch("/api/buddies"),
      ]);
      const [historyData, photosData, buddiesData] = await Promise.all([
        historyRes.json(),
        photosRes.json(),
        buddiesRes.json(),
      ]);
      setHistory(historyData);
      setPhotoOverrides(photosData.photos ?? {});
      setBuddies(buddiesData.buddies ?? {});
    } catch {
      // non-critical, will show stale/empty
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    // Initial load: fetch everything in parallel, then mark loaded
    Promise.all([fetchPoll(), fetchInbox(), fetchStatic()]).finally(() => setLoaded(true));
    // Live poll every 60s
    const pollInterval = setInterval(fetchPoll, 60000);
    // Inbox every 3 minutes
    const inboxInterval = setInterval(fetchInbox, 180000);
    return () => {
      clearInterval(pollInterval);
      clearInterval(inboxInterval);
    };
  }, [fetchPoll, fetchInbox, fetchStatic, authed]);

  useEffect(() => {
    if (sortTimerRef.current) clearTimeout(sortTimerRef.current);
    sortTimerRef.current = setTimeout(() => {
      setSortedMembers(
        [...MEMBERS].sort((a, b) => {
          const aOOO = !!oooStatuses[a.name];
          const bOOO = !!oooStatuses[b.name];
          if (aOOO !== bOOO) return aOOO ? 1 : -1;
          return (statuses[b.name] ?? 50) - (statuses[a.name] ?? 50);
        })
      );
    }, 3000);
    return () => { if (sortTimerRef.current) clearTimeout(sortTimerRef.current); };
  }, [statuses, oooStatuses]);

  const dismissGoHome = async (name: string) => {
    setGoHomeRequests((prev) => prev.filter((r) => r.name !== name));
    await fetch("/api/go-home", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, clear: true }),
    });
  };

  const dismissMoneyRequest = async (name: string) => {
    setMoneyRequests((prev) => prev.filter((r) => r.name !== name));
    await fetch("/api/request/money", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
  };

  const approveTimeOff = async (name: string) => {
    setTimeOffRequests((prev) => prev.filter((r) => r.name !== name));
    await fetch("/api/request/time-off", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
  };

  const saveStatus = async (name: string, value: number) => {
    setStatuses((prev) => ({ ...prev, [name]: value }));
    await fetch("/api/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, value }),
    });
  };

  const toggleOOO = async (name: string, forceOoo?: boolean, note?: string, backDate?: string) => {
    const newVal = forceOoo ?? !oooStatuses[name];
    setOooStatuses((prev) => ({ ...prev, [name]: newVal }));
    if (!newVal) {
      setOooDetails((prev) => { const n = { ...prev }; delete n[name]; return n; });
    } else if (note !== undefined || backDate !== undefined) {
      setOooDetails((prev) => ({ ...prev, [name]: { note, backDate } }));
    }
    setInlineOOOEdit(null);
    await fetch("/api/status/ooo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, ooo: newVal, note, backDate }),
    });
  };

  const toggleSOS = async (name: string) => {
    const newVal = !sosStatuses[name];
    setSosStatuses((prev) => ({ ...prev, [name]: newVal }));
    await fetch("/api/status/toggle/sos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, sos: newVal }),
    });
  };

  const markDone = async (name: string, message: string, ts: number) => {
    setShippedFeatures((prev) => [{ name, message, ts: Date.now(), shippedAt: Date.now(), status: "done" as const }, ...prev.filter(f => f.message !== message)].slice(0, 10));
    setResolvedTs((prev) => new Set([...prev, ts]));
    await Promise.all([
      fetch("/api/shipped", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message, status: "done" }),
      }),
      fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ts }),
      }),
    ]);
  };

  const markDumb = async (name: string, message: string, ts: number) => {
    setShippedFeatures((prev) => [{ name, message, ts: Date.now(), shippedAt: Date.now(), status: "dumb" as const }, ...prev.filter(f => f.message !== message)].slice(0, 10));
    setResolvedTs((prev) => new Set([...prev, ts]));
    await Promise.all([
      fetch("/api/shipped", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message, status: "dumb" }),
      }),
      fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ts }),
      }),
    ]);
  };

  const markSoon = async (name: string, message: string, ts: number) => {
    setShippedFeatures((prev) => [{ name, message, ts: Date.now(), shippedAt: Date.now(), status: "soon" as const }, ...prev.filter(f => f.message !== message)].slice(0, 10));
    setResolvedTs((prev) => new Set([...prev, ts]));
    await Promise.all([
      fetch("/api/shipped", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message, status: "soon" }),
      }),
      fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ts }),
      }),
    ]);
  };

  const shipFeature = async (name: string, message: string, ts: number) => {
    setShippedFeatures((prev) => [{ name, message, ts: Date.now(), shippedAt: Date.now(), status: "shipped" as const }, ...prev.filter(f => f.message !== message)].slice(0, 10));
    setResolvedTs((prev) => new Set([...prev, ts]));
    await Promise.all([
      fetch("/api/shipped", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message, status: "shipped" }),
      }),
      fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ts }),
      }),
    ]);
  };

  const extractYouTubeId = (input: string): string => {
    const match = input.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : input.trim();
  };

  const saveVideo = async (type: "vibe" | "brainrot") => {
    const raw = type === "vibe" ? vibeVideoInput : brainRotVideoInput;
    const id = extractYouTubeId(raw);
    if (!id) return;
    const key = type === "vibe" ? "vibeVideoId" : "brainRotVideoId";
    await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: id }),
    });
    if (type === "vibe") { setVibeVideoId(id); setVibeVideoInput(""); }
    else { setBrainRotVideoId(id); setBrainRotVideoInput(""); }
    setVideoSaved(type);
    setTimeout(() => setVideoSaved(null), 2000);
  };

  const banMember = async (name: string) => {
    const reason = banReasonInput[name] ?? "";
    setBans((prev) => ({ ...prev, [name]: reason }));
    setBanningTarget(null);
    await fetch("/api/ban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ban", name, reason }),
    });
  };

  const unbanMember = async (name: string) => {
    setBans((prev) => { const n = { ...prev }; delete n[name]; return n; });
    await fetch("/api/ban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unban", name }),
    });
  };

  const clearDispute = async (ts: number) => {
    setBanDisputes((prev) => prev.filter(d => d.ts !== ts));
    await fetch("/api/ban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear-dispute", ts }),
    });
  };

  const unshipFeature = async (ts: number) => {
    setShippedFeatures((prev) => prev.filter(f => f.ts !== ts));
    await fetch("/api/shipped", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ts }),
    });
  };

  const sendBroadcast = async (type: "urgent" | "broadcast") => {
    if (!urgentInput.trim()) return;
    await fetch("/api/urgent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: urgentInput.trim(), type }),
    });
    setBroadcast({ message: urgentInput.trim(), type });
    setUrgentInput("");
  };

  const clearUrgent = async () => {
    await fetch("/api/urgent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "" }),
    });
    setBroadcast(null);
  };

  // Derived
  const allResolved = new Set([...resolvedTs, ...resolvedFromServer]);
  const unresolvedFeedback = feedback.filter((f) => !allResolved.has(f.ts));
  const resolvedFeedback = feedback.filter((f) => allResolved.has(f.ts));

  const activeMembers = MEMBERS.filter((m) => !oooStatuses[m.name]);
  const activeValues = activeMembers.map((m) => statuses[m.name] ?? 50);
  const oooCount = MEMBERS.filter((m) => !!oooStatuses[m.name]).length;
  const sosCount = MEMBERS.filter((m) => !!sosStatuses[m.name]).length;
  const avg = activeValues.length > 0
    ? Math.round(activeValues.reduce((a, b) => a + b, 0) / activeValues.length) : 0;
  const avgLevel = getLevel(avg);
  const busiestActive = activeMembers.length > 0
    ? activeMembers[activeValues.indexOf(Math.max(...activeValues))] : null;
  const freestActive = activeMembers.length > 0
    ? activeMembers[activeValues.indexOf(Math.min(...activeValues))] : null;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="animate-pop-in bg-white border-[4px] border-black rounded-[1.6rem] shadow-[6px_6px_0_#000] p-10 max-w-[340px] w-full text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-2xl font-extrabold tracking-tight mb-1" style={{ fontFamily: "var(--font-display)" }}>
            Admin only
          </h2>
          <p className="text-sm text-[#b5b0a8] mb-6">enter the pin bestie</p>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setPinError(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="••••"
            className={`w-full text-center text-2xl font-bold tracking-[0.4em] border-[3px] rounded-2xl px-4 py-3 outline-none mb-4 bg-white transition-colors ${
              pinError ? "border-[#e74c3c]" : "border-black"
            }`}
          />
          {pinError && <p className="text-sm text-[#e74c3c] font-semibold mb-3">nope, try again 👀</p>}
          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-2xl bg-black text-white font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity"
          >
            Let me in ⚡
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-8 sm:py-10">
      {/* Header — full width */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-none text-white" style={{ fontFamily: "var(--font-display)" }}>
            Admin ⚡
          </h1>
          <p className="text-sm text-white/70 font-semibold mt-1">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              await fetch("/api/reload", { method: "POST" });
            }}
            className="flex items-center gap-1.5 text-black bg-[#FFE234] border-[3px] border-black px-3 py-1.5 rounded-xl shadow-[3px_3px_0_#000] uppercase tracking-widest text-[11px] font-bold cursor-pointer hover:opacity-80 transition-opacity"
            title="Force all clients to refresh"
          >
            🔄 Refresh all
          </button>
          <span className="flex items-center gap-1.5 text-black bg-white border-[3px] border-black px-3 py-1.5 rounded-xl shadow-[3px_3px_0_#000] uppercase tracking-widest text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#5cb85c] animate-pulse inline-block" />
            live
          </span>
        </div>
      </div>

      {!loaded && <p className="text-center text-white/60 text-lg animate-pulse">loading the vibes...</p>}

      {loaded && (
        <>
          {/* SOS Alert — full width */}
          {sosCount > 0 && (
            <div className="animate-pop-in mb-6 rounded-[1.2rem] px-5 py-4 border-[3px] border-[#e74c3c] bg-[#fce4ec] shadow-[6px_6px_0_#000] flex items-center gap-3">
              <span className="text-2xl animate-pulse">🚨</span>
              <div>
                <p className="text-sm font-extrabold text-[#c0392b]">{sosCount} person{sosCount > 1 ? "s are" : " is"} over capacity</p>
                <p className="text-xs text-[#e74c3c] font-medium">
                  {MEMBERS.filter((m) => sosStatuses[m.name]).map((m) => m.name).join(", ")}
                </p>
              </div>
            </div>
          )}

          {/* Broadcast */}
          <div className={`mb-6 rounded-[1.2rem] border-[4px] shadow-[6px_6px_0_#000] overflow-hidden ${broadcast?.type === "urgent" ? "border-[#e74c3c] bg-[#fce4ec]" : broadcast?.type === "broadcast" ? "border-black bg-[#FF9DC8]/20" : "border-black bg-white"}`}>
            <div className="px-5 pt-4 pb-3 border-b-[3px] border-black/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">📢</span>
                <h2 className="text-sm font-extrabold text-black tracking-tight uppercase">Broadcast</h2>
              </div>
              {broadcast && (
                <span className={`text-[11px] font-bold text-white px-2 py-0.5 rounded-full animate-pulse ${broadcast.type === "urgent" ? "bg-[#e74c3c]" : "bg-black"}`}>LIVE</span>
              )}
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              {broadcast && (
                <div className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 ${broadcast.type === "urgent" ? "bg-[#e74c3c]/10 border-[#e74c3c]/30" : "bg-[#FF9DC8]/30 border-black/20"}`}>
                  <p className="flex-1 text-sm font-bold text-black">{broadcast.message}</p>
                  <button
                    onClick={clearUrgent}
                    className="text-xs font-bold text-black bg-white border-2 border-black px-3 py-1.5 rounded-lg cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap shadow-[2px_2px_0_#000]"
                  >
                    Clear ✕
                  </button>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="type a message to broadcast…"
                  value={urgentInput}
                  onChange={(e) => setUrgentInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") sendBroadcast("broadcast"); }}
                  maxLength={200}
                  className="w-full text-sm font-medium border-[3px] border-black rounded-xl px-3 py-2.5 bg-white focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => sendBroadcast("broadcast")}
                    disabled={!urgentInput.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-[#FF9DC8] border-[3px] border-black text-black text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-default whitespace-nowrap shadow-[3px_3px_0_#000]"
                  >
                    📢 Broadcast
                  </button>
                  <button
                    onClick={() => sendBroadcast("urgent")}
                    disabled={!urgentInput.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-[#e74c3c] border-[3px] border-black text-white text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-default whitespace-nowrap shadow-[3px_3px_0_#000]"
                  >
                    🚨 Urgent
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Money Requests */}
          {moneyRequests.length > 0 && (
            <div className="animate-pop-in mb-6 rounded-[1.4rem] border-[4px] border-black shadow-[6px_6px_0_#000] bg-[#FFE234] overflow-hidden">
              <div className="px-5 pt-4 pb-3 border-b-[3px] border-black flex items-center gap-3">
                <span className="text-4xl">💸</span>
                <h2 className="text-2xl font-extrabold text-black tracking-tight flex-1">I Need $</h2>
                <span className="text-sm font-extrabold bg-black text-white px-3 py-1.5 rounded-full">{moneyRequests.length}</span>
              </div>
              <div className="flex flex-wrap gap-3 px-5 py-4">
                {moneyRequests.map((r) => (
                  <div key={r.name} className="flex items-center gap-2.5 bg-white border-[3px] border-black rounded-2xl px-4 py-2.5 shadow-[3px_3px_0_#000]">
                    <Image
                      src={photoOverrides[r.name] ?? (MEMBERS.find(m => m.name === r.name)?.photo ?? "")}
                      alt={r.name} width={36} height={36}
                      className="rounded-full object-cover w-9 h-9 border-2 border-black flex-shrink-0"
                    />
                    <span className="font-extrabold text-base">{r.name}</span>
                    <span className="text-xs text-[#8a857d] font-semibold">{timeAgo(r.ts)}</span>
                    <button
                      onClick={() => dismissMoneyRequest(r.name)}
                      className="ml-1 px-2.5 py-1 rounded-xl bg-black text-white text-[11px] font-extrabold cursor-pointer hover:bg-[#333] transition-colors"
                    >handled ✓</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time Off Requests */}
          {timeOffRequests.length > 0 && (
            <div className="animate-pop-in mb-6 rounded-[1.4rem] border-[4px] border-black shadow-[6px_6px_0_#000] bg-[#b5f0c8] overflow-hidden">
              <div className="px-5 pt-4 pb-3 border-b-[3px] border-black flex items-center gap-3">
                <span className="text-4xl">🏖️</span>
                <h2 className="text-2xl font-extrabold text-black tracking-tight flex-1">Time Off Requests</h2>
                <span className="text-sm font-extrabold bg-black text-white px-3 py-1.5 rounded-full">{timeOffRequests.length}</span>
              </div>
              <div className="flex flex-wrap gap-3 px-5 py-4">
                {timeOffRequests.map((r) => (
                  <div key={r.name} className="flex items-center gap-2.5 bg-white border-[3px] border-black rounded-2xl px-4 py-2.5 shadow-[3px_3px_0_#000]">
                    <Image
                      src={photoOverrides[r.name] ?? (MEMBERS.find(m => m.name === r.name)?.photo ?? "")}
                      alt={r.name} width={36} height={36}
                      className="rounded-full object-cover w-9 h-9 border-2 border-black flex-shrink-0"
                    />
                    <span className="font-extrabold text-base">{r.name}</span>
                    <span className="text-xs text-[#8a857d] font-semibold">{timeAgo(r.ts)}</span>
                    <button
                      onClick={() => approveTimeOff(r.name)}
                      className="ml-1 px-2.5 py-1 rounded-xl bg-black text-white text-[11px] font-extrabold cursor-pointer hover:bg-[#333] transition-colors"
                    >approved ✓</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Derek's Card */}
          {(() => {
            const derek = MEMBERS.find((m) => m.name === "Derek")!;
            const value = statuses["Derek"] ?? 50;
            const level = getLevel(value);
            const isOOO = !!oooStatuses["Derek"];
            const isSOS = !!sosStatuses["Derek"];
            return (
              <div className="mb-6">
                <div
                  className={`rounded-[1.4rem] px-6 py-6 border-[4px] border-black bg-white ${
                    isSOS ? "shadow-[6px_6px_0_#e74c3c]" : "shadow-[6px_6px_0_#000]"
                  }`}
                >
                  <div className="flex items-center gap-4 mb-5">
                    <Image
                      src={photoOverrides["Derek"] ?? derek.photo}
                      alt="Derek" width={64} height={64}
                      className="rounded-full object-cover border-[4px] border-black w-[64px] h-[64px] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-2xl font-extrabold leading-tight" style={{ fontFamily: "var(--font-display)" }}>Derek</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-black text-white px-2 py-0.5 rounded-full">you</span>
                        {isSOS && <span className="text-[10px] font-bold bg-[#e74c3c] text-white px-2 py-0.5 rounded-full animate-pulse">SOS</span>}
                        {isOOO && <span className="text-[10px] font-bold bg-[#e5e1dc] text-[#8a857d] px-2 py-0.5 rounded-full">👻 ghost</span>}
                      </div>
                      {updatedAt["Derek"] && (
                        <p className="text-[11px] text-[#7a6f64] font-semibold mt-0.5 italic">{timeAgo(updatedAt["Derek"])}</p>
                      )}
                    </div>
                    {BUDDIES_ENABLED && buddies["Derek"] ? (() => {
                      const buddy = getBuddyById(buddies["Derek"].id);
                      const styles = buddy ? RARITY_STYLES[buddy.rarity] : null;
                      return buddy ? (
                        <div className="shrink-0 flex items-center gap-2">
                          <div className="flex flex-col items-center" title={`${buddy.name} — ${buddy.tagline}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={getBuddyImagePath(buddy)} alt={buddy.name} className="w-10 h-10 object-contain" />
                            <span className="text-[9px] font-black uppercase tracking-widest mt-0.5" style={{ color: styles?.text === "#ffffff" ? "#3D52F0" : "#1a1a1a" }}>{buddy.name}</span>
                          </div>
                          <span className="text-4xl">{EMOJIS[level]}</span>
                        </div>
                      ) : <span className="text-4xl shrink-0">{EMOJIS[level]}</span>;
                    })() : <span className="text-4xl shrink-0">{EMOJIS[level]}</span>}
                  </div>

                  {isOOO ? (
                    <div className="w-full rounded-xl bg-[#e5e1dc] border-2 border-black px-3 py-3 flex flex-col gap-1.5">
                      {oooDetails["Derek"]?.note && <p className="text-xs text-[#6b6560] font-medium">💬 {oooDetails["Derek"].note}</p>}
                      {oooDetails["Derek"]?.backDate && <p className="text-xs text-[#6b6560] font-medium">📅 Back {oooDetails["Derek"].backDate}</p>}
                      <button onClick={() => toggleOOO("Derek")} className="text-sm text-black font-bold hover:underline cursor-pointer text-center mt-1">
                        I&apos;m back fr ✌️
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-3">
                        <input
                          type="range" min={0} max={100} value={value}
                          onChange={(e) => saveStatus("Derek", Number(e.target.value))}
                          style={{ background: `linear-gradient(to right, ${LEVEL_COLORS[level]} ${value}%, #d9d4cc ${value}%)` }}
                          className="flex-1"
                        />
                        <span className="text-xs font-extrabold px-2.5 py-1.5 rounded-lg bg-black text-white whitespace-nowrap min-w-[80px] text-center uppercase tracking-wide">
                          {LABELS[level]}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleOOO("Derek")}
                        className="w-full py-2 rounded-xl border-[3px] border-black bg-white text-sm text-black cursor-pointer transition-all font-bold hover:bg-[#FFE234] shadow-[3px_3px_0_#000]"
                      >
                        👻 Going ghost
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Go Home Requests */}
          {goHomeRequests.length > 0 && (
            <div className="mb-6 rounded-[1.4rem] border-[4px] border-black shadow-[6px_6px_0_#000] bg-[#FFE234] overflow-hidden">
              <div className="px-5 pt-4 pb-3 border-b-[3px] border-black flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/home.png" alt="home" className="w-10 h-10 rounded-full" />
                <h2 className="text-lg font-extrabold text-black tracking-tight flex-1">Wants to go home</h2>
                <span className="text-[11px] font-bold bg-black text-white px-2.5 py-1 rounded-full">{goHomeRequests.length}</span>
              </div>
              <div className="flex flex-wrap gap-3 px-5 py-4">
                {goHomeRequests.map((r) => (
                  <div key={r.name} className="flex items-center gap-2 bg-white border-[3px] border-black rounded-2xl px-3 py-2 shadow-[3px_3px_0_#000]">
                    <Image
                      src={photoOverrides[r.name] ?? (MEMBERS.find(m => m.name === r.name)?.photo ?? "")}
                      alt={r.name} width={28} height={28}
                      className="rounded-full object-cover w-7 h-7 border-2 border-black flex-shrink-0"
                    />
                    <span className="font-extrabold text-sm">{r.name}</span>
                    <span className="text-[10px] text-[#8a857d]">{timeAgo(r.ts)}</span>
                    <button
                      onClick={() => dismissGoHome(r.name)}
                      className="ml-1 w-5 h-5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center hover:bg-[#e74c3c] transition-colors cursor-pointer"
                      title="Dismiss"
                    >✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr_320px] gap-6 items-start">

            {/* LEFT COLUMN — Roster + Buddies */}
            <div className="flex flex-col gap-5">

              {/* Team Roster */}
              <div className="rounded-[1.4rem] border-[4px] border-black shadow-[6px_6px_0_#000] bg-white overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b-[3px] border-black/10 flex items-center justify-between">
                  <h2 className="text-lg font-extrabold text-black tracking-tight">Team Status</h2>
                  <span className="text-[11px] text-[#b5b0a8] font-medium">{activeMembers.length} active · {oooCount} ghost</span>
                </div>
                <div className="divide-y-[2px] divide-black/10">
                  {sortedMembers.map((member) => {
                    const value = statuses[member.name] ?? 50;
                    const level = getLevel(value);
                    const isOOO = !!oooStatuses[member.name];
                    const isSOS = !!sosStatuses[member.name];
                    const isDontTalk = !!dontTalkStatuses[member.name];
                    const isNeedWork = !!needWorkStatuses[member.name];
                    const isMetcalf = !!metcalfStatuses[member.name];
                    const adhdVal = adhdLevels[member.name] ?? 0;
                    const adhdLvl = getAdhdLevel(adhdVal);
                    const inMeeting = meetings[member.name] && meetings[member.name] > Date.now();
                    const memberPokes = pokes.filter(p => p.to === member.name);
                    const memberGrass = touchGrass.filter(p => p.to === member.name);
                    const seenRecently = lastSeen[member.name] && lastSeen[member.name] > Date.now() - 120000;
                    const sessionMins = Math.floor((sessionTimes[member.name] ?? 0) / 60);
                    const isOverride = overrideTarget === member.name;
                    const isEditingOOO = inlineOOOEdit === member.name;
                    const details = oooDetails[member.name];
                    const note = statusNotes[member.name];

                    return (
                      <div key={member.name} className={`px-4 py-3 ${isOOO ? "opacity-60" : ""} ${isDontTalk ? "bg-[#ffe5e5]" : ""}`}>
                        <div className="flex items-start gap-3">
                          <div className="relative shrink-0 mt-0.5">
                            <Image
                              src={photoOverrides[member.name] ?? member.photo}
                              alt={member.name} width={34} height={34}
                              className={`rounded-full object-cover w-[34px] h-[34px] border-2 border-black ${isOOO ? "grayscale" : ""}`}
                            />
                            {seenRecently && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#3CB55A] border border-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className="text-sm font-bold leading-none">{member.name}</span>
                              {isSOS && <span className="text-[9px] font-bold bg-[#e74c3c] text-white px-1.5 py-0.5 rounded-full animate-pulse">SOS</span>}
                              {isOOO && <span className="text-[9px] font-bold bg-[#e5e1dc] text-[#8a857d] px-1.5 py-0.5 rounded-full">ghost</span>}
                              {isDontTalk && <span className="text-[9px] font-bold bg-[#e74c3c] text-white px-1.5 py-0.5 rounded-full">🚫 no talk</span>}
                              {isNeedWork && <span className="text-[9px] font-bold bg-[#3D52F0] text-white px-1.5 py-0.5 rounded-full">📋 need work</span>}
                              {isMetcalf && <span className="text-[9px] font-bold bg-black text-white px-1.5 py-0.5 rounded-full">🚗 metcalf</span>}
                              {inMeeting && <span className="text-[9px] font-bold bg-[#FF9DC8] text-black px-1.5 py-0.5 rounded-full">📅 meeting</span>}
                              {memberPokes.length > 0 && <span className="text-[9px] font-bold bg-[#FFE234] text-black px-1.5 py-0.5 rounded-full">👉 {memberPokes.length}</span>}
                              {memberGrass.length > 0 && <span className="text-[9px] font-bold bg-[#a8f5c8] text-black px-1.5 py-0.5 rounded-full">🌿 {memberGrass.length}</span>}
                              {bans[member.name] && <span className="text-[9px] font-bold bg-[#e74c3c] text-white px-1.5 py-0.5 rounded-full animate-pulse">🔨 banned</span>}
                            </div>
                            {isOOO ? (
                              <div className="flex flex-col gap-0.5 mt-0.5">
                                {details?.note
                                  ? <p className="text-[11px] text-[#8a857d]">👻 {details.note}</p>
                                  : <p className="text-[11px] text-[#c5bfb8] italic">no note left</p>
                                }
                                {details?.backDate && (
                                  <p className="text-[11px] text-[#8a857d]">📅 Back: {details.backDate}</p>
                                )}
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 rounded-full bg-[#e8e4de] overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-300"
                                      style={{ width: `${value}%`, background: isSOS ? "#e74c3c" : LEVEL_COLORS[level] }}
                                    />
                                  </div>
                                  <span className="text-[11px] font-bold text-[#8a857d] whitespace-nowrap w-[68px] text-right">
                                    {isSOS ? "🔥 Burnt af" : LABELS[level]}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  {updatedAt[member.name] && (
                                    <span className="text-[10px] text-[#c5bfb8]">{timeAgo(updatedAt[member.name])}</span>
                                  )}
                                  {sessionMins > 0 && (
                                    <span className="text-[10px] text-[#c5bfb8]">· {sessionMins}m online</span>
                                  )}
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: ADHD_COLORS[adhdLvl] }}>
                                    {ADHD_EMOJIS[adhdLvl]} {ADHD_LABELS[adhdLvl]}
                                  </span>
                                </div>
                                {note && (
                                  <p className="text-[10px] text-[#8a857d] mt-0.5 italic">💬 {note}</p>
                                )}
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                          {member.name !== "Derek" && (bans[member.name] ? (
                            <button
                              onClick={() => unbanMember(member.name)}
                              className="text-[10px] text-white font-bold bg-[#e74c3c] border-[2px] border-black rounded-lg px-2 py-1 cursor-pointer hover:bg-black transition-colors"
                            >🔓 unban</button>
                          ) : (
                            <button
                              onClick={() => setBanningTarget(banningTarget === member.name ? null : member.name)}
                              className="text-[10px] text-[#e74c3c] font-bold border-[2px] border-[#e74c3c]/40 hover:border-[#e74c3c] rounded-lg px-2 py-1 cursor-pointer transition-colors"
                            >🔨 ban</button>
                          ))}
                          <button
                            onClick={() => {
                              if (isOOO) {
                                if (isEditingOOO) { setInlineOOOEdit(null); }
                                else { setGhostNote(details?.note ?? ""); setGhostBackDate(details?.backDate ?? ""); setInlineOOOEdit(member.name); setOverrideTarget(null); }
                              } else {
                                setOverrideTarget(isOverride ? null : member.name);
                                setInlineOOOEdit(null);
                              }
                            }}
                            className="text-[10px] text-[#c5bfb8] hover:text-black font-bold border-[2px] border-black/20 hover:border-black rounded-lg px-2 py-1 transition-colors cursor-pointer"
                          >
                            {(isOverride || isEditingOOO) ? "done" : "edit"}
                          </button>
                          </div>{/* end ban+edit button group */}
                        </div>

                        {banningTarget === member.name && !bans[member.name] && (
                          <div className="mt-2 pt-2 border-t border-[#f0ece6] flex gap-2 items-center">
                            <input
                              type="text"
                              placeholder="ban reason (optional)"
                              value={banReasonInput[member.name] ?? ""}
                              onChange={(e) => setBanReasonInput((prev) => ({ ...prev, [member.name]: e.target.value }))}
                                                            onKeyDown={(e) => { if (e.key === "Enter") banMember(member.name); if (e.key === "Escape") setBanningTarget(null); }}
                              autoFocus
                              className="flex-1 border-2 border-[#e74c3c] rounded-xl px-3 py-1.5 text-xs font-medium bg-white focus:outline-none"
                              maxLength={200}
                            />
                            <button
                              onClick={() => banMember(member.name)}
                              className="px-3 py-1.5 rounded-xl bg-[#e74c3c] border-2 border-black text-white text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity whitespace-nowrap shadow-[2px_2px_0_#000]"
                            >🔨 confirm ban</button>
                          </div>
                        )}

                        {isOverride && !isOOO && (
                          <div className="mt-2.5 pt-2.5 border-t border-[#f0ece6] flex flex-col gap-2">
                            <input
                              type="range" min={0} max={100} value={value}
                              onChange={(e) => saveStatus(member.name, Number(e.target.value))}
                              style={{ background: `linear-gradient(to right, ${LEVEL_COLORS[level]} ${value}%, #d9d4cc ${value}%)` }}
                              className="w-full"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => toggleSOS(member.name)}
                                className={`flex-1 py-1.5 rounded-lg border-2 text-xs font-bold cursor-pointer transition-all ${isSOS ? "border-[#e74c3c] bg-[#e74c3c] text-white" : "border-[#e74c3c]/40 text-[#e74c3c] hover:bg-[#e74c3c]/10"}`}
                              >
                                {isSOS ? "✓ SOS Active" : "🚨 Flag SOS"}
                              </button>
                              <button
                                onClick={() => { setGhostNote(""); setGhostBackDate(""); setInlineOOOEdit(member.name); setOverrideTarget(null); }}
                                className="flex-1 py-1.5 rounded-lg border-2 border-black/20 text-[#8a857d] text-xs font-bold hover:border-black hover:text-black cursor-pointer transition-all"
                              >
                                👻 Set Ghost
                              </button>
                            </div>
                          </div>
                        )}

                        {isEditingOOO && (
                          <div className="mt-2.5 pt-2.5 border-t border-[#f0ece6] flex flex-col gap-2">
                            <input type="text" placeholder="What's the vibe? (OOO, conference…)" value={ghostNote}
                              onChange={(e) => setGhostNote(e.target.value)}
                                                            className="w-full border-2 border-black rounded-xl px-3 py-2 text-xs font-medium bg-white focus:outline-none"
                              maxLength={200}
                            />
                            <input type="text" placeholder="Back when? (Monday, TBD…)" value={ghostBackDate}
                              onChange={(e) => setGhostBackDate(e.target.value)}
                                                            className="w-full border-2 border-black rounded-xl px-3 py-2 text-xs font-medium bg-white focus:outline-none"
                              maxLength={200}
                            />
                            <div className="flex gap-2">
                              <button onClick={() => toggleOOO(member.name, true, ghostNote, ghostBackDate)}
                                className="flex-1 py-1.5 rounded-lg border-2 border-black bg-black text-white text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity"
                              >
                                {isOOO ? "Save details" : "Go ghost 👻"}
                              </button>
                              {isOOO && (
                                <button onClick={() => toggleOOO(member.name, false)}
                                  className="flex-1 py-1.5 rounded-lg border-2 border-[#d9d4cc] text-[#8a857d] text-xs font-bold cursor-pointer hover:border-[#e74c3c] hover:text-[#e74c3c] transition-colors"
                                >
                                  Clear ghost
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Buddy Roster */}
              {BUDDIES_ENABLED && <>
              <div className="rounded-[1.4rem] border-[4px] border-black shadow-[6px_6px_0_#000] bg-white overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b-[3px] border-black/10 flex items-center justify-between">
                  <h2 className="text-lg font-extrabold text-black tracking-tight">🥚 Buddies</h2>
                  <span className="text-[11px] text-[#b5b0a8] font-medium">
                    {Object.keys(buddies).length}/{MEMBERS.length} hatched
                  </span>
                </div>
                <div className="divide-y-[2px] divide-black/10">
                  {MEMBERS.map((member) => {
                    const assignment = buddies[member.name];
                    const buddy = assignment ? getBuddyById(assignment.id) : null;
                    const styles = buddy ? RARITY_STYLES[buddy.rarity] : null;
                    return (
                      <div key={member.name} className="px-4 py-2.5 flex items-center gap-3">
                        <Image
                          src={photoOverrides[member.name] ?? member.photo}
                          alt={member.name} width={28} height={28}
                          className="rounded-full object-cover w-[28px] h-[28px] border-2 border-black flex-shrink-0"
                        />
                        <span className="text-sm font-bold flex-1">{member.name}</span>
                        {buddy && styles ? (
                          <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={getBuddyImagePath(buddy)} alt={buddy.name} className="w-8 h-8 object-contain" />
                            <div className="flex flex-col items-end">
                              <span className="text-xs font-black">{buddy.name}</span>
                              <span
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: styles.bg, color: styles.text, border: "1.5px solid #000" }}
                              >
                                {styles.label}
                              </span>
                            </div>
                            <button
                              onClick={async () => {
                                setBuddies((prev) => { const n = { ...prev }; delete n[member.name]; return n; });
                                await fetch("/api/buddies", {
                                  method: "DELETE",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ name: member.name }),
                                });
                              }}
                              className="w-5 h-5 rounded-full bg-black/10 hover:bg-[#e74c3c] hover:text-white text-black text-[10px] font-bold flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                              title={`Reset ${member.name}'s buddy`}
                            >↺</button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#c5bfb8] italic">not hatched</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Buddy Gallery */}
              <div className="rounded-[1.4rem] border-[4px] border-black shadow-[6px_6px_0_#000] bg-white overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b-[3px] border-black/10">
                  <h2 className="text-lg font-extrabold text-black tracking-tight">🎴 All Buddies</h2>
                </div>
                {(["common", "uncommon", "rare"] as const).map((rarity) => {
                  const group = BUDDIES.filter((b) => b.rarity === rarity);
                  const styles = RARITY_STYLES[rarity];
                  return (
                    <div key={rarity} className="px-4 pt-3 pb-4 border-b-[2px] border-black/10 last:border-0">
                      <span
                        className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border-[2px] border-black mb-3 inline-block"
                        style={{ background: styles.bg, color: styles.text }}
                      >
                        {styles.label}
                      </span>
                      <div className="grid grid-cols-3 gap-3">
                        {group.map((buddy) => (
                          <div key={buddy.id} className="flex flex-col items-center gap-1 p-2 rounded-xl border-[2px] border-black/10 hover:border-black transition-colors">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={getBuddyImagePath(buddy)} alt={buddy.name} className="w-16 h-16 object-contain" />
                            <span className="text-[11px] font-extrabold text-center leading-tight">{buddy.name}</span>
                            <span className="text-[9px] text-[#8a857d] text-center leading-tight italic">&ldquo;{buddy.tagline}&rdquo;</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              </>}

            </div>

            {/* CENTER COLUMN — Inbox + Actions */}
            <div className="flex flex-col gap-5">

              {/* Shipped Features */}
              <div className="rounded-[1.4rem] border-[4px] border-black shadow-[6px_6px_0_#000] bg-[#39FF14] overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b-[3px] border-black/20 flex items-center justify-between">
                  <h2 className="text-lg font-extrabold text-black tracking-tight">🚀 Shipped Features</h2>
                  {shippedFeatures.length > 0 && (
                    <span className="text-[10px] font-bold bg-black text-white px-2.5 py-1 rounded-full">
                      {shippedFeatures.length} live in ticker
                    </span>
                  )}
                </div>
                {shippedFeatures.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-black/60 italic">None shipped yet. Mark feedback as 🚀 ship to show it here.</p>
                ) : (
                  <div className="divide-y-[2px] divide-black/10">
                    {shippedFeatures.map((f) => (
                      <div key={f.ts} className="px-4 py-3 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-bold">{f.name}</span>
                            <span className="text-[10px] text-black/50">{timeAgo(f.shippedAt)}</span>
                          </div>
                          <p className="text-sm text-black font-medium">{f.message}</p>
                        </div>
                        <button
                          onClick={() => unshipFeature(f.ts)}
                          className="shrink-0 w-7 h-7 rounded-full border-2 border-black bg-white hover:bg-[#e74c3c] hover:text-white flex items-center justify-center transition-colors cursor-pointer mt-0.5 text-sm font-bold"
                          title="Remove from ticker"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Feedback Inbox */}
              <div className="rounded-[1.4rem] border-[4px] border-black shadow-[6px_6px_0_#000] bg-white overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b-[3px] border-black/10 flex items-center justify-between">
                  <h2 className="text-lg font-extrabold text-black tracking-tight">💬 Feedback</h2>
                  {unresolvedFeedback.length > 0 && (
                    <span className="text-[10px] font-bold bg-black text-white px-2.5 py-1 rounded-full">
                      {unresolvedFeedback.length} new
                    </span>
                  )}
                </div>
                {unresolvedFeedback.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-[#b5b0a8] italic">All caught up 🎉</p>
                ) : (
                  <div className="divide-y-[2px] divide-black/10">
                    {unresolvedFeedback.map((f) => (
                      <div key={f.ts} className="px-4 py-3 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-bold">{f.name}</span>
                            <span className="text-[10px] text-[#b5b0a8]">{timeAgo(f.ts)}</span>
                          </div>
                          <p className="text-sm text-[#4a4540]">{f.message}</p>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0 mt-0.5">
                          <button
                            onClick={() => shipFeature(f.name, f.message, f.ts)}
                            className="px-2 py-1 rounded-md bg-[#39FF14] border-2 border-black text-[10px] font-extrabold cursor-pointer hover:opacity-90 transition-opacity whitespace-nowrap"
                            title="Mark as shipped — announces in yellow ticker"
                          >🚀 ship</button>
                          <button
                            onClick={() => markDone(f.name, f.message, f.ts)}
                            className="w-full px-2 py-1 rounded-md border-2 border-black/20 hover:border-black text-[10px] text-[#b5b0a8] hover:text-[#5cb85c] transition-colors cursor-pointer font-bold"
                            title="Mark done"
                          >✓ done</button>
                          <button
                            onClick={() => markSoon(f.name, f.message, f.ts)}
                            className="w-full px-2 py-1 rounded-md border-2 border-black/20 hover:border-yellow-400 text-[10px] text-[#b5b0a8] hover:text-yellow-600 transition-colors cursor-pointer font-bold"
                            title="Coming soon"
                          >⏳ soon</button>
                          <button
                            onClick={() => markDumb(f.name, f.message, f.ts)}
                            className="w-full px-2 py-1 rounded-md border-2 border-black/20 hover:border-red-400 text-[10px] text-[#b5b0a8] hover:text-red-500 transition-colors cursor-pointer font-bold"
                            title="Reject suggestion"
                          >🙅 dumb</button>
                          <button
                            onClick={async () => {
                              setFeedback((prev) => prev.filter((x) => x.ts !== f.ts));
                              await fetch("/api/feedback", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ts: f.ts }) });
                            }}
                            className="w-full px-2 py-1 rounded-md border-2 border-black/20 hover:border-black hover:bg-black hover:text-white text-[10px] text-[#b5b0a8] transition-colors cursor-pointer font-bold"
                            title="Delete permanently"
                          >🗑️ delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {resolvedFeedback.length > 0 && (
                  <details className="border-t-2 border-[#f0ece6]">
                    <summary className="px-5 py-3 text-lg font-extrabold text-black tracking-tight cursor-pointer hover:text-[#8a857d] transition-colors list-none flex items-center justify-between">
                      <span>{resolvedFeedback.length} resolved</span><span>▾</span>
                    </summary>
                    <div className="divide-y divide-[#f0ece6]">
                      {resolvedFeedback.map((f) => (
                        <div key={f.ts} className="px-4 py-3 opacity-40">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-bold line-through">{f.name}</span>
                            <span className="text-[10px] text-[#b5b0a8]">{timeAgo(f.ts)}</span>
                          </div>
                          <p className="text-sm text-[#4a4540] line-through">{f.message}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>

              {/* Tattle Box */}
              <div className="rounded-[1.4rem] border-[4px] border-black shadow-[6px_6px_0_#000] bg-white overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b-[3px] border-black/10 flex items-center justify-between bg-[#ff4d4d]">
                  <h2 className="text-lg font-extrabold text-white tracking-tight">🫢 Tattle Box</h2>
                  {tattles.length > 0 && (
                    <span className="text-[10px] font-bold bg-white text-[#ff4d4d] px-2.5 py-1 rounded-full">
                      {tattles.length} anonymous
                    </span>
                  )}
                </div>
                {tattles.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-[#b5b0a8] italic">Nothing to report. All good out there.</p>
                ) : (
                  <div className="divide-y-[2px] divide-black/10">
                    {tattles.map((t) => (
                      <div key={t.ts} className="px-4 py-3 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#4a4540]">{t.message}</p>
                          <span className="text-[10px] text-[#b5b0a8] mt-1 block">{timeAgo(t.ts)}</span>
                        </div>
                        <button
                          onClick={async () => {
                            setTattles((prev) => prev.filter(x => x.ts !== t.ts));
                            await fetch("/api/tattle", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ts: t.ts }) });
                          }}
                          className="shrink-0 text-[#b5b0a8] hover:text-black transition-colors cursor-pointer text-lg leading-none mt-0.5"
                          title="Dismiss"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ban Disputes */}
              {banDisputes.length > 0 && (
                <div className="rounded-[1.4rem] border-[4px] border-[#e74c3c] shadow-[6px_6px_0_#000] bg-[#fff0f0] overflow-hidden">
                  <div className="px-5 pt-4 pb-3 border-b-[3px] border-[#e74c3c] flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-[#e74c3c] tracking-tight flex-1">✋ Ban Disputes</h2>
                    <span className="text-[11px] font-bold bg-[#e74c3c] text-white px-2.5 py-1 rounded-full">{banDisputes.length}</span>
                  </div>
                  <div className="flex flex-col divide-y-[2px] divide-[#e74c3c]/20">
                    {banDisputes.map((d) => (
                      <div key={d.ts} className="px-5 py-3 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Image
                            src={photoOverrides[d.name] ?? (MEMBERS.find(m => m.name === d.name)?.photo ?? "")}
                            alt={d.name} width={28} height={28}
                            className="rounded-full object-cover w-7 h-7 border-2 border-[#e74c3c] flex-shrink-0"
                          />
                          <span className="font-extrabold text-sm">{d.name}</span>
                          <span className="text-[10px] text-[#b5b0a8] ml-auto">{new Date(d.ts).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-[#c0392b] font-medium italic px-1">&ldquo;{d.message}&rdquo;</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { unbanMember(d.name); clearDispute(d.ts); }}
                            className="flex-1 py-1.5 rounded-xl bg-[#3CB55A] border-2 border-black text-white text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity shadow-[2px_2px_0_#000]"
                          >✓ unban them</button>
                          <button
                            onClick={() => clearDispute(d.ts)}
                            className="flex-1 py-1.5 rounded-xl bg-white border-2 border-black text-[#8a857d] text-xs font-bold cursor-pointer hover:border-[#e74c3c] hover:text-[#e74c3c] transition-colors"
                          >✕ dismiss</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN — Stats + Videos */}
            <div className="flex flex-col gap-5">

              {/* Team Health Summary */}
              <div className="rounded-[1.4rem] px-6 py-5 border-[4px] border-black shadow-[6px_6px_0_#000] bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-extrabold text-black tracking-tight">Team Vibe Check</h2>
                  {oooCount > 0 && (
                    <span className="text-[10px] font-bold bg-[#e5e1dc] text-[#8a857d] px-2.5 py-1 rounded-full">
                      👻 {oooCount} ghost{oooCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                  <div>
                    <p className="text-[11px] text-[#b5b0a8] uppercase tracking-wider mb-3 font-semibold">Team Avg</p>
                    <span className="text-6xl">{EMOJIS[avgLevel]}</span>
                    <p className="text-sm font-bold mt-2">{LABELS[avgLevel]}</p>
                    <p className="text-xs text-[#b5b0a8] mt-0.5">{avg}%</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#b5b0a8] uppercase tracking-wider mb-3 font-semibold">Most Slammed</p>
                    {busiestActive ? (
                      <>
                        <Image src={photoOverrides[busiestActive.name] ?? busiestActive.photo} alt={busiestActive.name} width={64} height={64} className="rounded-full object-cover w-16 h-16 border-[3px] border-black mx-auto" />
                        <p className="text-sm font-bold mt-2">{busiestActive.name}</p>
                        <p className="text-xs text-[#b5b0a8]">{statuses[busiestActive.name] ?? 50}%</p>
                      </>
                    ) : <span className="text-sm text-[#b5b0a8]">—</span>}
                  </div>
                  <div>
                    <p className="text-[11px] text-[#b5b0a8] uppercase tracking-wider mb-3 font-semibold">Most Chill</p>
                    {freestActive ? (
                      <>
                        <Image src={photoOverrides[freestActive.name] ?? freestActive.photo} alt={freestActive.name} width={64} height={64} className="rounded-full object-cover w-16 h-16 border-[3px] border-black mx-auto" />
                        <p className="text-sm font-bold mt-2">{freestActive.name}</p>
                        <p className="text-xs text-[#b5b0a8]">{statuses[freestActive.name] ?? 50}%</p>
                      </>
                    ) : <span className="text-sm text-[#b5b0a8]">—</span>}
                  </div>
                </div>
              </div>

              {/* 14-Day History */}
              {history.some((d) => Object.keys(d.snapshot).length > 0) && (
                <div className="rounded-[1.4rem] px-6 py-5 border-[4px] border-black shadow-[6px_6px_0_#000] bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-extrabold text-black tracking-tight">14-Day History</h2>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 justify-end">
                      {MEMBERS.map((member, mi) => (
                        <span key={member.name} className="flex items-center gap-1 text-[10px] font-bold" style={{ color: MEMBER_COLORS[mi] }}>
                          <span className="w-2 h-2 rounded-full inline-block" style={{ background: MEMBER_COLORS[mi] }} />
                          {member.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <TeamHistoryChart history={history} />
                </div>
              )}

              {/* Video Management */}
              <div className="rounded-[1.4rem] border-[4px] border-black shadow-[6px_6px_0_#000] bg-white overflow-hidden">
                <div className="px-5 py-3 border-b-[3px] border-black/10 bg-black flex items-center gap-3">
                  <h2 className="text-lg font-extrabold text-white tracking-tight flex-1">🎬 Videos</h2>
                </div>
                <div className="px-5 py-4 flex flex-col gap-5">
                  {/* Vibe video */}
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-widest text-[#b5b0a8] mb-1">Vibe Video (bottom of page)</p>
                    <p className="text-[11px] text-[#b5b0a8] mb-2">Current ID: <span className="font-mono font-bold text-black">{vibeVideoId}</span></p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={vibeVideoInput}
                        onChange={(e) => setVibeVideoInput(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === "Enter") saveVideo("vibe"); }}
                        placeholder="YouTube URL or video ID"
                        className="flex-1 border-[2px] border-black rounded-xl px-3 py-2 text-sm font-medium outline-none"
                      />
                      <button
                        onClick={() => saveVideo("vibe")}
                        disabled={!vibeVideoInput.trim()}
                        className="px-4 py-2 rounded-xl bg-black text-white text-xs font-extrabold cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-30 disabled:cursor-default"
                      >{videoSaved === "vibe" ? "✓ saved!" : "save"}</button>
                    </div>
                  </div>
                  {/* Brain rot video */}
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-widest text-[#b5b0a8] mb-1">Brain Rot Video (overlay)</p>
                    <p className="text-[11px] text-[#b5b0a8] mb-2">Current ID: <span className="font-mono font-bold text-black">{brainRotVideoId}</span></p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={brainRotVideoInput}
                        onChange={(e) => setBrainRotVideoInput(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === "Enter") saveVideo("brainrot"); }}
                        placeholder="YouTube URL or video ID"
                        className="flex-1 border-[2px] border-black rounded-xl px-3 py-2 text-sm font-medium outline-none"
                      />
                      <button
                        onClick={() => saveVideo("brainrot")}
                        disabled={!brainRotVideoInput.trim()}
                        className="px-4 py-2 rounded-xl bg-black text-white text-xs font-extrabold cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-30 disabled:cursor-default"
                      >{videoSaved === "brainrot" ? "✓ saved!" : "save"}</button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
