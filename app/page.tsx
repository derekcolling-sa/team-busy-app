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

export default function Home() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, number>>({});
  const [oooStatuses, setOooStatuses] = useState<Record<string, boolean>>({});
  const [updatedAt, setUpdatedAt] = useState<Record<string, number>>({});
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
      setStatuses(statusData.status);
      setUpdatedAt(statusData.updated);
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
  });

  return (
    <div className="min-h-screen px-5 py-14">
      <div className="max-w-[520px] mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <h1
            className="text-[clamp(2.2rem,7vw,3.5rem)] leading-[1.1] tracking-tight mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="font-extrabold">How Cooked</span>
            <br />
            <span className="font-extrabold">Am I?</span>
            <span className="inline-block ml-2 animate-bounce-in" style={{ animationDelay: "0.3s" }}>
              🍳
            </span>
          </h1>
          <p className="text-[15px] text-[#8a857d] font-medium tracking-wide">
            {today}
          </p>
        </div>

        {/* User pill */}
        {currentUser && (
          <div className="flex justify-center mb-10">
            <button
              onClick={() => setShowPicker(true)}
              className="hover-wiggle inline-flex items-center gap-2.5 pl-1.5 pr-5 py-1.5 rounded-full border-[3px] border-[#2d2a26] bg-white font-semibold text-sm cursor-pointer transition-transform active:scale-95"
            >
              <Image
                src={MEMBERS.find((m) => m.name === currentUser)?.photo || ""}
                alt={currentUser}
                width={32}
                height={32}
                className="rounded-full object-cover w-8 h-8"
              />
              {currentUser}
              <span className="text-[#b5b0a8] text-xs">switch</span>
            </button>
          </div>
        )}

        {/* Loading */}
        {!loaded ? (
          <p className="text-center text-[#b5b0a8] text-lg animate-pulse">
            loading the vibes...
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {[...MEMBERS]
              .sort((a, b) => {
                const aOOO = !!oooStatuses[a.name];
                const bOOO = !!oooStatuses[b.name];
                if (aOOO !== bOOO) return aOOO ? 1 : -1;
                return (statuses[b.name] ?? 50) - (statuses[a.name] ?? 50);
              })
              .map((member, i) => {
              const value = statuses[member.name] ?? 50;
              const level = getLevel(value);
              const isMe = currentUser === member.name;
              const isOOO = !!oooStatuses[member.name];

              return (
                <div
                  key={member.name}
                  className="animate-pop-in"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div
                    className={`rounded-[1.4rem] px-6 py-5 border-[3px] transition-all ${
                      isOOO
                        ? "border-[#d9d4cc] opacity-65"
                        : isMe
                        ? "border-[#2d2a26] shadow-[4px_4px_0_#2d2a26]"
                        : "border-[#d9d4cc]"
                    }`}
                    style={{
                      background: isOOO ? "var(--card-ghost)" : CARD_BGS[level],
                    }}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <Image
                          src={member.photo}
                          alt={member.name}
                          width={50}
                          height={50}
                          className={`rounded-full object-cover w-[50px] h-[50px] border-[3px] border-[#2d2a26] ${
                            isOOO ? "grayscale opacity-50" : ""
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-lg font-bold"
                              style={{ fontFamily: "var(--font-display)" }}
                            >
                              {member.name}
                            </span>
                            {isMe && (
                              <span className="text-[10px] font-bold uppercase tracking-widest bg-[#2d2a26] text-white px-2 py-0.5 rounded-full">
                                you
                              </span>
                            )}
                          </div>
                          {updatedAt[member.name] && (
                            <p className="text-[11px] text-[#b5b0a8] font-medium mt-0.5">
                              updated {timeAgo(updatedAt[member.name])}
                            </p>
                          )}
                        </div>
                      </div>
                      {isOOO ? (
                        <span className="text-sm font-bold px-3 py-1.5 rounded-full bg-[#e5e1dc] text-[#8a857d] border-2 border-[#d9d4cc]">
                          👻 Ghost Mode
                        </span>
                      ) : (
                        <span className="text-2xl hover-wiggle cursor-default" title={LABELS[level]}>
                          {EMOJIS[level]}
                        </span>
                      )}
                    </div>

                    {isOOO ? (
                      <div className="w-full h-11 rounded-xl bg-[#e5e1dc] border-2 border-[#d9d4cc] flex items-center justify-center">
                        {isMe && (
                          <button
                            onClick={() => toggleOOO(member.name)}
                            className="text-sm text-[#2d2a26] font-bold hover:underline cursor-pointer"
                          >
                            I&apos;m back fr ✌️
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={value}
                            disabled={!isMe}
                            onChange={(e) =>
                              handleSliderChange(
                                member.name,
                                Number(e.target.value)
                              )
                            }
                            style={getTrackStyle(value, level)}
                            className="flex-1"
                          />
                          <span
                            className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white/60 border-2 border-[#2d2a26]/10 whitespace-nowrap min-w-[80px] text-center"
                          >
                            {LABELS[level]}
                          </span>
                        </div>
                        {isMe && (
                          <button
                            onClick={() => toggleOOO(member.name)}
                            className="mt-3 text-xs text-[#b5b0a8] hover:text-[#8a857d] cursor-pointer transition-colors font-semibold"
                          >
                            I&apos;m ghost 👻
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Identity Picker */}
      {showPicker && (
        <div className="fixed inset-0 bg-[#2d2a26]/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="animate-bounce-in bg-[#fef9f0] border-[3px] border-[#2d2a26] rounded-[1.6rem] shadow-[6px_6px_0_#2d2a26] p-8 max-w-[420px] w-[92%]">
            <div className="text-center mb-7">
              <div className="text-5xl mb-3">👋</div>
              <h2
                className="text-3xl font-extrabold tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Who dis?
              </h2>
              <p className="text-sm text-[#b5b0a8] mt-1 font-medium">
                pick yourself bestie
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {MEMBERS.map((member) => (
                <button
                  key={member.name}
                  onClick={() => pickUser(member.name)}
                  className="hover-wiggle flex items-center gap-3 px-4 py-3.5 border-[3px] border-[#d9d4cc] rounded-2xl bg-white hover:border-[#2d2a26] hover:shadow-[3px_3px_0_#2d2a26] transition-all cursor-pointer text-[15px] font-bold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  <Image
                    src={member.photo}
                    alt={member.name}
                    width={42}
                    height={42}
                    className="rounded-full object-cover w-[42px] h-[42px] border-2 border-[#2d2a26]"
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
