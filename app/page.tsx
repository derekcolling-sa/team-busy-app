"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";

const MEMBERS = [
  { name: "Brendan", photo: "/photos/Brendan.jpg" },
  { name: "Callie", photo: "/photos/Callie.jpg" },
  { name: "Chris", photo: "/photos/Chris.jpg" },
  { name: "Erin", photo: "/photos/Erin.jpg" },
  { name: "KC", photo: "/photos/KC.jpeg" },
  { name: "Kerry", photo: "/photos/Kerry.jpg" },
  { name: "Maddie", photo: "/photos/Maddie.jpg" },
];

const LABELS = ["Chillin'", "Low-key", "Mid", "Slammed", "Cooked"];
const COLORS = [
  { bg: "rgba(184,255,87,0.15)", text: "#b8ff57", track: "#b8ff57" },
  { bg: "rgba(96,165,250,0.15)", text: "#60a5fa", track: "#60a5fa" },
  { bg: "rgba(192,132,252,0.15)", text: "#c084fc", track: "#c084fc" },
  { bg: "rgba(251,146,60,0.15)", text: "#fb923c", track: "#fb923c" },
  { bg: "rgba(255,87,87,0.15)", text: "#ff5757", track: "#ff5757" },
];

function getLevel(val: number) {
  if (val <= 20) return 0;
  if (val <= 40) return 1;
  if (val <= 60) return 2;
  if (val <= 80) return 3;
  return 4;
}

function getTrackStyle(value: number) {
  const level = getLevel(value);
  const c = COLORS[level];
  return {
    background: `linear-gradient(to right, ${c.track} ${value}%, #2a2a3a ${value}%)`,
  };
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, number>>({});
  const [oooStatuses, setOooStatuses] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("team-busy-user");
    if (saved) {
      setCurrentUser(saved);
    } else {
      setShowPicker(true);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, oooRes] = await Promise.all([
        fetch("/api/status"),
        fetch("/api/status/ooo"),
      ]);
      const [statusData, oooData] = await Promise.all([
        statusRes.json(),
        oooRes.json(),
      ]);
      setStatuses(statusData);
      setOooStatuses(oooData);
    } catch {
      // retry next poll
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const saveStatus = useCallback((name: string, value: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, value }),
      });
    }, 300);
  }, []);

  const handleSliderChange = (name: string, value: number) => {
    setStatuses((prev) => ({ ...prev, [name]: value }));
    saveStatus(name, value);
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

  const pickUser = (name: string) => {
    localStorage.setItem("team-busy-user", name);
    setCurrentUser(name);
    setShowPicker(false);
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen px-5 py-12">
      <div className="max-w-[600px] mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 tracking-tight">
          How Cooked Am I?
          <span className="inline-block ml-2 text-3xl">🔥</span>
        </h1>
        <p className="text-sm text-[#555570] text-center mb-10 tracking-wide uppercase">
          {today}
        </p>

        {currentUser && (
          <p className="text-center text-sm text-[#555570] mb-8">
            vibing as{" "}
            <button
              onClick={() => setShowPicker(true)}
              className="font-bold text-[#b8ff57] hover:underline cursor-pointer"
            >
              {currentUser}
            </button>
          </p>
        )}

        {!loaded ? (
          <div className="text-center text-[#555570]">
            <span className="inline-block animate-pulse">loading the vibes...</span>
          </div>
        ) : (
          MEMBERS.map((member, i) => {
            const value = statuses[member.name] ?? 50;
            const level = getLevel(value);
            const color = COLORS[level];
            const isMe = currentUser === member.name;
            const isOOO = !!oooStatuses[member.name];

            return (
              <div
                key={member.name}
                className={`animate-float-in rounded-2xl px-6 py-5 mb-4 border transition-all ${
                  isOOO
                    ? "border-[#2a2a3a] bg-[#12121a] opacity-60"
                    : isMe
                    ? "border-[#b8ff57]/30 bg-[#16161f] card-glow"
                    : "border-[#2a2a3a] bg-[#16161f] hover:border-[#3a3a4a]"
                }`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`relative rounded-full ${isMe && !isOOO ? "ring-2 ring-[#b8ff57]/50" : ""}`}>
                      <Image
                        src={member.photo}
                        alt={member.name}
                        width={44}
                        height={44}
                        className={`rounded-full object-cover w-11 h-11 ${isOOO ? "grayscale" : ""}`}
                      />
                    </div>
                    <div>
                      <span className="text-[17px] font-bold tracking-tight">
                        {member.name}
                      </span>
                      {isMe && (
                        <span className="text-[#b8ff57] text-xs font-medium ml-2">
                          you
                        </span>
                      )}
                    </div>
                  </div>
                  {isOOO ? (
                    <span className="text-[13px] font-bold px-3 py-1.5 rounded-full bg-[#2a2a3a] text-[#555570] uppercase tracking-wider text-[11px]">
                      Ghost Mode 👻
                    </span>
                  ) : (
                    <span
                      className="text-[13px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider text-[11px]"
                      style={{ background: color.bg, color: color.text }}
                    >
                      {LABELS[level]}
                    </span>
                  )}
                </div>

                {isOOO ? (
                  <div className="w-full h-10 rounded-xl bg-[#1a1a25] flex items-center justify-center border border-[#2a2a3a]">
                    {isMe && (
                      <button
                        onClick={() => toggleOOO(member.name)}
                        className="text-xs text-[#b8ff57] font-bold hover:underline cursor-pointer uppercase tracking-wide"
                      >
                        I&apos;m back fr
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={value}
                      disabled={!isMe}
                      onChange={(e) =>
                        handleSliderChange(member.name, Number(e.target.value))
                      }
                      style={getTrackStyle(value)}
                    />
                    {isMe && (
                      <button
                        onClick={() => toggleOOO(member.name)}
                        className="mt-3 text-xs text-[#555570] hover:text-[#888] cursor-pointer transition-colors"
                      >
                        I&apos;m ghost 👻
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Identity Picker */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#16161f] border border-[#2a2a3a] rounded-3xl p-8 max-w-[380px] w-[90%] text-center">
            <h2 className="text-2xl font-bold mb-2 tracking-tight">
              Who dis? 👀
            </h2>
            <p className="text-sm text-[#555570] mb-6">pick yourself bestie</p>
            <div className="grid grid-cols-2 gap-3">
              {MEMBERS.map((member) => (
                <button
                  key={member.name}
                  onClick={() => pickUser(member.name)}
                  className="flex items-center gap-3 px-4 py-3 border-2 border-[#2a2a3a] rounded-2xl bg-[#1a1a25] hover:border-[#b8ff57]/50 hover:bg-[#1e1e2a] transition-all cursor-pointer text-[15px] font-bold"
                >
                  <Image
                    src={member.photo}
                    alt={member.name}
                    width={36}
                    height={36}
                    className="rounded-full object-cover w-9 h-9"
                  />
                  {member.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
