"use client";

import { useEffect, useState, useCallback } from "react";
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
const EMOJIS = ["😎", "🙂", "😐", "😰", "🔥"];
const CARD_BGS = [
  "var(--card-chillin)",
  "var(--card-lowkey)",
  "var(--card-mid)",
  "var(--card-slammed)",
  "var(--card-cooked)",
];
const TRACK_COLORS = ["#5cb85c", "#4a9eff", "#f5a623", "#e8742d", "#e74c3c"];

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

export default function AdminPage() {
  const [statuses, setStatuses] = useState<Record<string, number>>({});
  const [oooStatuses, setOooStatuses] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

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
  const avg =
    activeValues.length > 0
      ? Math.round(activeValues.reduce((a, b) => a + b, 0) / activeValues.length)
      : 0;
  const avgLevel = getLevel(avg);

  const busiestActive =
    activeMembers.length > 0
      ? activeMembers[activeValues.indexOf(Math.max(...activeValues))]
      : null;
  const freestActive =
    activeMembers.length > 0
      ? activeMembers[activeValues.indexOf(Math.min(...activeValues))]
      : null;

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
            <span className="font-extrabold">Admin Mode</span>
            <span className="inline-block ml-2 animate-bounce-in" style={{ animationDelay: "0.3s" }}>
              ⚡
            </span>
          </h1>
          <p className="text-[15px] text-[#8a857d] font-medium tracking-wide">
            {today}
          </p>
        </div>

        {loaded && (
          <>
            {/* Summary */}
            <div
              className="animate-pop-in rounded-[1.4rem] px-6 py-6 mb-6 border-[3px] border-[#2d2a26] shadow-[4px_4px_0_#2d2a26] bg-white"
            >
              <h2
                className="text-xs font-bold text-[#b5b0a8] uppercase tracking-[0.15em] mb-5"
              >
                Team Vibe Check
              </h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[11px] text-[#b5b0a8] uppercase tracking-wider mb-2 font-semibold">
                    Average
                  </p>
                  <span className="text-2xl">{EMOJIS[avgLevel]}</span>
                  <p className="text-xs font-bold mt-1">{LABELS[avgLevel]}</p>
                  <p className="text-[11px] text-[#b5b0a8] mt-0.5">{avg}%</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#b5b0a8] uppercase tracking-wider mb-2 font-semibold">
                    Most Cooked
                  </p>
                  {busiestActive ? (
                    <>
                      <Image
                        src={busiestActive.photo}
                        alt={busiestActive.name}
                        width={32}
                        height={32}
                        className="rounded-full object-cover w-8 h-8 border-2 border-[#2d2a26] mx-auto"
                      />
                      <p className="text-xs font-bold mt-1">{busiestActive.name}</p>
                      <p className="text-[11px] text-[#b5b0a8]">
                        {statuses[busiestActive.name] ?? 50}%
                      </p>
                    </>
                  ) : (
                    <span className="text-sm text-[#b5b0a8]">All ghost</span>
                  )}
                </div>
                <div>
                  <p className="text-[11px] text-[#b5b0a8] uppercase tracking-wider mb-2 font-semibold">
                    Most Chill
                  </p>
                  {freestActive ? (
                    <>
                      <Image
                        src={freestActive.photo}
                        alt={freestActive.name}
                        width={32}
                        height={32}
                        className="rounded-full object-cover w-8 h-8 border-2 border-[#2d2a26] mx-auto"
                      />
                      <p className="text-xs font-bold mt-1">{freestActive.name}</p>
                      <p className="text-[11px] text-[#b5b0a8]">
                        {statuses[freestActive.name] ?? 50}%
                      </p>
                    </>
                  ) : (
                    <span className="text-sm text-[#b5b0a8]">All ghost</span>
                  )}
                </div>
              </div>
              {oooCount > 0 && (
                <p className="text-[11px] text-[#b5b0a8] text-center mt-4 font-semibold">
                  👻 {oooCount} in ghost mode
                </p>
              )}
            </div>

            {/* Reset */}
            <button
              onClick={resetAll}
              className="hover-wiggle w-full mb-8 py-3.5 rounded-2xl bg-[#ffe0e0] border-[3px] border-[#e74c3c] text-[#c0392b] font-bold text-sm cursor-pointer transition-all hover:shadow-[3px_3px_0_#c0392b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Reset Everyone to Mid 🔄
            </button>

            {/* Members */}
            <div className="flex flex-col gap-5">
              {MEMBERS.map((member, i) => {
                const value = statuses[member.name] ?? 50;
                const level = getLevel(value);
                const isOOO = !!oooStatuses[member.name];

                return (
                  <div
                    key={member.name}
                    className="animate-pop-in"
                    style={{ animationDelay: `${(i + 2) * 60}ms` }}
                  >
                    <div
                      className={`rounded-[1.4rem] px-6 py-5 border-[3px] transition-all ${
                        isOOO
                          ? "border-[#d9d4cc] opacity-65"
                          : "border-[#2d2a26] shadow-[3px_3px_0_#2d2a26]"
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
                          <span
                            className="text-lg font-bold"
                            style={{ fontFamily: "var(--font-display)" }}
                          >
                            {member.name}
                          </span>
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
                          <button
                            onClick={() => toggleOOO(member.name)}
                            className="text-sm text-[#2d2a26] font-bold hover:underline cursor-pointer"
                          >
                            They&apos;re back fr ✌️
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={value}
                              onChange={(e) =>
                                saveStatus(member.name, Number(e.target.value))
                              }
                              style={getTrackStyle(value, level)}
                              className="flex-1"
                            />
                            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white/60 border-2 border-[#2d2a26]/10 whitespace-nowrap min-w-[80px] text-center">
                              {LABELS[level]}
                            </span>
                          </div>
                          <button
                            onClick={() => toggleOOO(member.name)}
                            className="mt-3 text-xs text-[#b5b0a8] hover:text-[#8a857d] cursor-pointer transition-colors font-semibold"
                          >
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

        {!loaded && (
          <p className="text-center text-[#b5b0a8] text-lg animate-pulse">
            loading the vibes...
          </p>
        )}
      </div>
    </div>
  );
}
