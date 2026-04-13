"use client";

import { useEffect, useState, useCallback } from "react";

const CO_ADMIN = "Erin";

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

const extractYouTubeId = (input: string): string => {
  const match = input.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : input.trim();
};

export default function ModPage() {
  const [authed, setAuthed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [broadcast, setBroadcast] = useState<{ message: string; type: "urgent" | "broadcast" } | null>(null);
  const [urgentInput, setUrgentInput] = useState("");
  const [tattles, setTattles] = useState<{ message: string; ts: number }[]>([]);
  const [vibeVideoId, setVibeVideoId] = useState("vTfD20dbxho");
  const [brainRotVideoId, setBrainRotVideoId] = useState("xxfeav5MlmI");
  const [vibeVideoInput, setVibeVideoInput] = useState("");
  const [brainRotVideoInput, setBrainRotVideoInput] = useState("");
  const [videoSaved, setVideoSaved] = useState<"vibe" | "brainrot" | null>(null);

  useEffect(() => {
    const user = localStorage.getItem("team-busy-user");
    if (user === CO_ADMIN) setAuthed(true);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [poll, tattleRes] = await Promise.all([
        fetch("/api/poll").then(r => r.json()),
        fetch("/api/tattle").then(r => r.json()),
      ]);
      setBroadcast(poll.urgent?.message ? { message: poll.urgent.message, type: poll.urgent.type ?? "broadcast" } : null);
      if (poll.videos?.vibeVideoId) setVibeVideoId(poll.videos.vibeVideoId);
      if (poll.videos?.brainRotVideoId) setBrainRotVideoId(poll.videos.brainRotVideoId);
      setTattles(tattleRes.tattles ?? []);
      setLoaded(true);
    } catch {
      // retry next poll
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [authed, fetchData]);

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

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-[1.4rem] border-[4px] border-black bg-white shadow-[6px_6px_0_#000] px-8 py-8 text-center max-w-xs w-full">
          <p className="text-2xl font-extrabold mb-2">🫢</p>
          <p className="text-sm font-bold text-[#b5b0a8]">You need to be logged in as Erin to access this page.</p>
          <a href="/" className="mt-4 inline-block text-xs font-bold text-black underline">← go back</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-8 sm:py-10 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-none text-white" style={{ fontFamily: "var(--font-display)" }}>
            Mod 🫢
          </h1>
          <p className="text-sm text-white/70 font-semibold mt-1">hey Erin 👋</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-black bg-white border-[3px] border-black px-3 py-1.5 rounded-xl shadow-[3px_3px_0_#000] uppercase tracking-widest text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#5cb85c] animate-pulse inline-block" />
            live
          </span>
          <a href="/" className="flex items-center gap-1.5 text-black bg-[#FFE234] border-[3px] border-black px-3 py-1.5 rounded-xl shadow-[3px_3px_0_#000] uppercase tracking-widest text-[11px] font-bold cursor-pointer hover:opacity-80 transition-opacity">← home</a>
        </div>
      </div>

      {!loaded && <p className="text-center text-white/60 text-lg animate-pulse">loading the vibes...</p>}

      {loaded && (
        <div className="flex flex-col gap-6">

          {/* Broadcast */}
          <div className={`rounded-[1.2rem] border-[4px] shadow-[6px_6px_0_#000] overflow-hidden ${broadcast?.type === "urgent" ? "border-[#e74c3c] bg-[#fce4ec]" : broadcast?.type === "broadcast" ? "border-black bg-[#FF9DC8]/20" : "border-black bg-white"}`}>
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

          {/* Video Management */}
          <div className="rounded-[1.4rem] border-[4px] border-black shadow-[6px_6px_0_#000] bg-white overflow-hidden">
            <div className="px-5 py-3 border-b-[3px] border-black/10 bg-black flex items-center gap-3">
              <h2 className="text-lg font-extrabold text-white tracking-tight flex-1">🎬 Videos</h2>
            </div>
            <div className="px-5 py-4 flex flex-col gap-5">
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
      )}
    </div>
  );
}
