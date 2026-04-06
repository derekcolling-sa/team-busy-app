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

  // Summary stats (exclude OOO)
  const activeMembers = MEMBERS.filter((m) => !oooStatuses[m.name]);
  const activeValues = activeMembers.map((m) => statuses[m.name] ?? 50);
  const oooCount = MEMBERS.filter((m) => !!oooStatuses[m.name]).length;
  const avg =
    activeValues.length > 0
      ? Math.round(activeValues.reduce((a, b) => a + b, 0) / activeValues.length)
      : 0;
  const avgLevel = getLevel(avg);
  const avgColor = COLORS[avgLevel];

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
    year: "numeric",
  });

  return (
    <div className="min-h-screen px-5 py-12">
      <div className="max-w-[600px] mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 tracking-tight">
          Admin Mode
          <span className="inline-block ml-2 text-3xl">⚡</span>
        </h1>
        <p className="text-sm text-[#555570] text-center mb-10 tracking-wide uppercase">
          {today}
        </p>

        {loaded && (
          <>
            {/* Summary Card */}
            <div className="bg-[#16161f] border border-[#2a2a3a] rounded-2xl px-6 py-6 mb-6 animate-float-in">
              <h2 className="text-[11px] font-bold text-[#555570] uppercase tracking-widest mb-5">
                Team Vibe Check
              </h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[11px] text-[#555570] mb-2 uppercase tracking-wider">Average</p>
                  <span
                    className="inline-block text-sm font-bold px-3 py-1.5 rounded-full uppercase tracking-wider text-[11px]"
                    style={{ background: avgColor.bg, color: avgColor.text }}
                  >
                    {LABELS[avgLevel]}
                  </span>
                  <p className="text-[11px] text-[#555570] mt-2">{avg}%</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#555570] mb-2 uppercase tracking-wider">Most Cooked</p>
                  {busiestActive ? (
                    <>
                      <div className="flex items-center justify-center gap-1.5">
                        <Image
                          src={busiestActive.photo}
                          alt={busiestActive.name}
                          width={24}
                          height={24}
                          className="rounded-full object-cover w-6 h-6"
                        />
                        <span className="text-sm font-bold">
                          {busiestActive.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#555570] mt-2">
                        {statuses[busiestActive.name] ?? 50}%
                      </p>
                    </>
                  ) : (
                    <span className="text-sm text-[#555570]">All ghost</span>
                  )}
                </div>
                <div>
                  <p className="text-[11px] text-[#555570] mb-2 uppercase tracking-wider">Most Chill</p>
                  {freestActive ? (
                    <>
                      <div className="flex items-center justify-center gap-1.5">
                        <Image
                          src={freestActive.photo}
                          alt={freestActive.name}
                          width={24}
                          height={24}
                          className="rounded-full object-cover w-6 h-6"
                        />
                        <span className="text-sm font-bold">
                          {freestActive.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#555570] mt-2">
                        {statuses[freestActive.name] ?? 50}%
                      </p>
                    </>
                  ) : (
                    <span className="text-sm text-[#555570]">All ghost</span>
                  )}
                </div>
              </div>
              {oooCount > 0 && (
                <p className="text-[11px] text-[#555570] text-center mt-4 uppercase tracking-wider">
                  👻 {oooCount} team member{oooCount > 1 ? "s" : ""} in ghost mode
                </p>
              )}
            </div>

            {/* Reset Button */}
            <button
              onClick={resetAll}
              className="w-full mb-6 py-3.5 rounded-2xl bg-[#ff5757]/10 border border-[#ff5757]/20 text-[#ff5757] font-bold text-sm hover:bg-[#ff5757]/20 transition-all cursor-pointer uppercase tracking-wider text-[12px]"
            >
              Reset Everyone to Mid
            </button>

            {/* All Members */}
            {MEMBERS.map((member, i) => {
              const value = statuses[member.name] ?? 50;
              const level = getLevel(value);
              const color = COLORS[level];
              const isOOO = !!oooStatuses[member.name];

              return (
                <div
                  key={member.name}
                  className={`animate-float-in rounded-2xl px-6 py-5 mb-4 border transition-all ${
                    isOOO
                      ? "border-[#2a2a3a] bg-[#12121a] opacity-60"
                      : "border-[#2a2a3a] bg-[#16161f] hover:border-[#3a3a4a]"
                  }`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <Image
                        src={member.photo}
                        alt={member.name}
                        width={44}
                        height={44}
                        className={`rounded-full object-cover w-11 h-11 ${isOOO ? "grayscale" : ""}`}
                      />
                      <span className="text-[17px] font-bold tracking-tight">
                        {member.name}
                      </span>
                    </div>
                    {isOOO ? (
                      <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-[#2a2a3a] text-[#555570] uppercase tracking-wider">
                        Ghost Mode 👻
                      </span>
                    ) : (
                      <span
                        className="text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider"
                        style={{ background: color.bg, color: color.text }}
                      >
                        {LABELS[level]}
                      </span>
                    )}
                  </div>

                  {isOOO ? (
                    <div className="w-full h-10 rounded-xl bg-[#1a1a25] flex items-center justify-center border border-[#2a2a3a]">
                      <button
                        onClick={() => toggleOOO(member.name)}
                        className="text-xs text-[#b8ff57] font-bold hover:underline cursor-pointer uppercase tracking-wide"
                      >
                        They&apos;re back fr
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={value}
                        onChange={(e) =>
                          saveStatus(member.name, Number(e.target.value))
                        }
                        style={getTrackStyle(value)}
                      />
                      <button
                        onClick={() => toggleOOO(member.name)}
                        className="mt-3 text-xs text-[#555570] hover:text-[#888] cursor-pointer transition-colors"
                      >
                        They&apos;re ghost 👻
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </>
        )}

        {!loaded && (
          <div className="text-center text-[#555570]">
            <span className="inline-block animate-pulse">loading the vibes...</span>
          </div>
        )}
      </div>
    </div>
  );
}
