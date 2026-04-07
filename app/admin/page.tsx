"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";

const ADMIN_PASSWORD = "2588";

const MEMBERS = [
  { name: "Brendan", photo: "/photos/Brendan.jpg" },
  { name: "Callie", photo: "/photos/Callie.jpg" },
  { name: "Chris", photo: "/photos/Chris.jpg" },
  { name: "Erin", photo: "/photos/Erin.jpg" },
  { name: "KC", photo: "/photos/KC.jpeg" },
  { name: "Kerry", photo: "/photos/Kerry.jpg" },
  { name: "Maddie", photo: "/photos/Maddie.jpg" },
];

const LABELS = ["Chillin'", "Low-key", "Mid", "Cooking", "Cooked"];
const EMOJIS = ["😎", "✌️", "👀", "🍳", "🔥"];
const CARD_BGS = [
  "var(--card-chillin)",
  "var(--card-lowkey)",
  "var(--card-mid)",
  "var(--card-slammed)",
  "var(--card-cooked)",
];
const TRACK_COLORS = ["#5cb85c", "#4a9eff", "#f5a623", "#e8742d", "#e74c3c"];
const MEMBER_COLORS = [
  "#f472b6", "#60a5fa", "#34d399", "#fb923c", "#a78bfa", "#facc15", "#f87171",
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
  if (val <= 40) return 1;
  if (val <= 60) return 2;
  if (val <= 80) return 3;
  return 4;
}

function getTrackStyle(value: number, level: number) {
  return {
    background: `linear-gradient(to right, ${TRACK_COLORS[level]} ${value}%, #d9d4cc ${value}%)`,
  };
}

function formatDate(dateStr: string) {
  const [, month, day] = dateStr.split("-");
  return `${parseInt(month)}/${parseInt(day)}`;
}

type DaySnapshot = Record<string, number>;
type HistoryEntry = { date: string; snapshot: DaySnapshot };

// Simple SVG sparkline chart per member
function MemberChart({ history, memberName, color }: { history: HistoryEntry[]; memberName: string; color: string }) {
  const values = history.map((d) => d.snapshot[memberName] ?? null);
  const hasData = values.some((v) => v !== null);
  if (!hasData) return <p className="text-xs text-[#b5b0a8]">No data yet</p>;

  const W = 240;
  const H = 48;
  const pts = values
    .map((v, i) => v !== null ? { x: (i / (values.length - 1)) * W, y: H - (v / 100) * H } : null)
    .filter(Boolean) as { x: number; y: number }[];

  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${path} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-12">
      <defs>
        <linearGradient id={`grad-${memberName}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#grad-${memberName})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
      ))}
    </svg>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const [statuses, setStatuses] = useState<Record<string, number>>({});
  const [oooStatuses, setOooStatuses] = useState<Record<string, boolean>>({});
  const [updatedAt, setUpdatedAt] = useState<Record<string, number>>({});
  const [sortedMembers, setSortedMembers] = useState(MEMBERS);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const sortTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check session
  useEffect(() => {
    if (sessionStorage.getItem("admin-authed") === "true") setAuthed(true);
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

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, oooRes, historyRes] = await Promise.all([
        fetch("/api/status"),
        fetch("/api/status/ooo"),
        fetch("/api/history"),
      ]);
      const [statusData, oooData, historyData] = await Promise.all([
        statusRes.json(),
        oooRes.json(),
        historyRes.json(),
      ]);
      setStatuses(statusData.status);
      setUpdatedAt(statusData.updated);
      setOooStatuses(oooData);
      setHistory(historyData);
    } catch {
      // retry next poll
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData, authed]);

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

  const saveStatus = async (name: string, value: number) => {
    setStatuses((prev) => ({ ...prev, [name]: value }));
    await fetch("/api/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, value }),
    });
  };

  const toggleOOO = async (name: string) => {
    const newVal = !oooStatuses[name];
    setOooStatuses((prev) => ({ ...prev, [name]: newVal }));
    await fetch("/api/status/ooo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, ooo: newVal }),
    });
  };

  const resetAll = async () => {
    await fetch("/api/status/reset", { method: "POST" });
    const reset: Record<string, number> = {};
    MEMBERS.forEach((m) => (reset[m.name] = 50));
    setStatuses(reset);
  };

  // Summary
  const activeMembers = MEMBERS.filter((m) => !oooStatuses[m.name]);
  const activeValues = activeMembers.map((m) => statuses[m.name] ?? 50);
  const oooCount = MEMBERS.filter((m) => !!oooStatuses[m.name]).length;
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

  // Password gate
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="animate-pop-in bg-white border-[3px] border-[#2d2a26] rounded-[1.6rem] shadow-[6px_6px_0_#2d2a26] p-10 max-w-[340px] w-full text-center">
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
            className={`w-full text-center text-2xl font-bold tracking-[0.4em] border-[3px] rounded-2xl px-4 py-3 outline-none mb-4 bg-[#fef9f0] transition-colors ${
              pinError ? "border-[#e74c3c]" : "border-[#d9d4cc] focus:border-[#2d2a26]"
            }`}
          />
          {pinError && <p className="text-sm text-[#e74c3c] font-semibold mb-3">nope, try again 👀</p>}
          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-2xl bg-[#2d2a26] text-white font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity"
          >
            Let me in ⚡
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 py-14">
      <div className="max-w-[560px] mx-auto">
        <div className="text-center mb-14">
          <h1 className="text-[clamp(2.2rem,7vw,3.5rem)] leading-[1.1] tracking-tight mb-3 font-extrabold" style={{ fontFamily: "var(--font-display)" }}>
            Admin Mode ⚡
          </h1>
          <p className="text-[20px] text-[#8a857d] font-semibold">{today}</p>
        </div>

        {loaded && (
          <>
            {/* Summary */}
            <div className="animate-pop-in rounded-[1.4rem] px-6 py-6 mb-6 border-[3px] border-[#2d2a26] shadow-[4px_4px_0_#2d2a26] bg-white">
              <h2 className="text-[11px] font-bold text-[#b5b0a8] uppercase tracking-widest mb-5">Team Vibe Check</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[11px] text-[#b5b0a8] uppercase tracking-wider mb-2 font-semibold">Average</p>
                  <span className="text-2xl">{EMOJIS[avgLevel]}</span>
                  <p className="text-xs font-bold mt-1">{LABELS[avgLevel]}</p>
                  <p className="text-[11px] text-[#b5b0a8] mt-0.5">{avg}%</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#b5b0a8] uppercase tracking-wider mb-2 font-semibold">Most Cooked</p>
                  {busiestActive ? (
                    <>
                      <Image src={busiestActive.photo} alt={busiestActive.name} width={32} height={32} className="rounded-full object-cover w-8 h-8 border-2 border-[#2d2a26] mx-auto" />
                      <p className="text-xs font-bold mt-1">{busiestActive.name}</p>
                      <p className="text-[11px] text-[#b5b0a8]">{statuses[busiestActive.name] ?? 50}%</p>
                    </>
                  ) : <span className="text-sm text-[#b5b0a8]">All ghost</span>}
                </div>
                <div>
                  <p className="text-[11px] text-[#b5b0a8] uppercase tracking-wider mb-2 font-semibold">Most Chill</p>
                  {freestActive ? (
                    <>
                      <Image src={freestActive.photo} alt={freestActive.name} width={32} height={32} className="rounded-full object-cover w-8 h-8 border-2 border-[#2d2a26] mx-auto" />
                      <p className="text-xs font-bold mt-1">{freestActive.name}</p>
                      <p className="text-[11px] text-[#b5b0a8]">{statuses[freestActive.name] ?? 50}%</p>
                    </>
                  ) : <span className="text-sm text-[#b5b0a8]">All ghost</span>}
                </div>
              </div>
              {oooCount > 0 && <p className="text-[11px] text-[#b5b0a8] text-center mt-4 font-semibold">👻 {oooCount} in ghost mode</p>}
            </div>

            {/* Reset */}
            <button
              onClick={resetAll}
              className="hover-wiggle w-full mb-8 py-3.5 rounded-2xl bg-[#ffe0e0] border-[3px] border-[#e74c3c] text-[#c0392b] font-bold text-sm cursor-pointer transition-all hover:shadow-[3px_3px_0_#c0392b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Reset Everyone to Mid 🔄
            </button>

            {/* History Chart */}
            {history.some((d) => Object.keys(d.snapshot).length > 0) && (
              <div className="animate-pop-in rounded-[1.4rem] px-6 py-6 mb-8 border-[3px] border-[#2d2a26] shadow-[4px_4px_0_#2d2a26] bg-white">
                <h2 className="text-[11px] font-bold text-[#b5b0a8] uppercase tracking-widest mb-1">14-Day History</h2>
                <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
                  {history.map((d) => (
                    <span key={d.date} className="text-[9px] text-[#b5b0a8] font-medium whitespace-nowrap flex-1 text-center">
                      {formatDate(d.date)}
                    </span>
                  ))}
                </div>
                <div className="flex flex-col gap-4">
                  {MEMBERS.map((member, mi) => (
                    <div key={member.name}>
                      <div className="flex items-center gap-2 mb-1">
                        <Image src={member.photo} alt={member.name} width={20} height={20} className="rounded-full object-cover w-5 h-5 border border-[#2d2a26]" />
                        <span className="text-xs font-bold">{member.name}</span>
                      </div>
                      <MemberChart history={history} memberName={member.name} color={MEMBER_COLORS[mi]} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members */}
            <div className="flex flex-col gap-5">
              {sortedMembers.map((member, i) => {
                const value = statuses[member.name] ?? 50;
                const level = getLevel(value);
                const isOOO = !!oooStatuses[member.name];

                return (
                  <div key={member.name} className="animate-pop-in" style={{ animationDelay: `${(i + 2) * 60}ms` }}>
                    <div
                      className={`rounded-[1.4rem] px-6 py-5 border-[3px] transition-all ${isOOO ? "border-[#d9d4cc] opacity-65" : "border-[#2d2a26] shadow-[3px_3px_0_#2d2a26]"}`}
                      style={{ background: isOOO ? "var(--card-ghost)" : CARD_BGS[level] }}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <Image
                            src={member.photo} alt={member.name} width={50} height={50}
                            className={`rounded-full object-cover w-[50px] h-[50px] border-[3px] border-[#2d2a26] ${isOOO ? "grayscale opacity-50" : ""}`}
                          />
                          <div>
                            <span className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>{member.name}</span>
                            {updatedAt[member.name] && (
                              <p className="text-[11px] text-[#b5b0a8] font-medium mt-0.5">updated {timeAgo(updatedAt[member.name])}</p>
                            )}
                          </div>
                        </div>
                        {isOOO ? (
                          <span className="text-sm font-bold px-3 py-1.5 rounded-full bg-[#e5e1dc] text-[#8a857d] border-2 border-[#d9d4cc]">👻 Ghost Mode</span>
                        ) : (
                          <span className="text-2xl hover-wiggle cursor-default">{EMOJIS[level]}</span>
                        )}
                      </div>

                      {isOOO ? (
                        <div className="w-full h-11 rounded-xl bg-[#e5e1dc] border-2 border-[#d9d4cc] flex items-center justify-center">
                          <button onClick={() => toggleOOO(member.name)} className="text-sm text-[#2d2a26] font-bold hover:underline cursor-pointer">
                            They&apos;re back fr ✌️
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <input
                              type="range" min={0} max={100} value={value}
                              onChange={(e) => saveStatus(member.name, Number(e.target.value))}
                              style={getTrackStyle(value, level)}
                              className="flex-1"
                            />
                            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white/60 border-2 border-[#2d2a26]/10 whitespace-nowrap min-w-[80px] text-center">
                              {LABELS[level]}
                            </span>
                          </div>
                          <button onClick={() => toggleOOO(member.name)} className="mt-3 text-xs text-[#b5b0a8] hover:text-[#8a857d] cursor-pointer transition-colors font-semibold">
                            They&apos;re ghost 👻
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {!loaded && <p className="text-center text-[#b5b0a8] text-lg animate-pulse">loading the vibes...</p>}
      </div>
    </div>
  );
}
