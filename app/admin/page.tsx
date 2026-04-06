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

const LABELS = ["Free", "Light", "Moderate", "Busy", "Swamped"];
const COLORS = [
  { bg: "#e8f5e9", text: "#2e7d32", track: "#66bb6a" },
  { bg: "#e3f2fd", text: "#1565c0", track: "#42a5f5" },
  { bg: "#fff8e1", text: "#f57f17", track: "#ffca28" },
  { bg: "#fff3e0", text: "#e65100", track: "#ffa726" },
  { bg: "#fce4ec", text: "#c62828", track: "#ef5350" },
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
    background: `linear-gradient(to right, ${c.track} ${value}%, #e0e0e0 ${value}%)`,
  };
}

export default function AdminPage() {
  const [statuses, setStatuses] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);

  const fetchStatuses = useCallback(async () => {
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      setStatuses(data);
    } catch {
      // retry next poll
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
    const interval = setInterval(fetchStatuses, 5000);
    return () => clearInterval(interval);
  }, [fetchStatuses]);

  const saveStatus = async (name: string, value: number) => {
    setStatuses((prev) => ({ ...prev, [name]: value }));
    await fetch("/api/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, value }),
    });
  };

  const resetAll = async () => {
    await fetch("/api/status/reset", { method: "POST" });
    const reset: Record<string, number> = {};
    MEMBERS.forEach((m) => (reset[m.name] = 50));
    setStatuses(reset);
  };

  // Summary stats
  const values = MEMBERS.map((m) => statuses[m.name] ?? 50);
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const avgLevel = getLevel(avg);
  const avgColor = COLORS[avgLevel];
  const busiestIdx = values.indexOf(Math.max(...values));
  const freestIdx = values.indexOf(Math.min(...values));

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen px-5 py-10">
      <div className="max-w-[600px] mx-auto">
        <h1 className="text-[28px] font-bold text-center mb-1">
          Admin Dashboard
        </h1>
        <p className="text-[15px] text-gray-400 text-center mb-8">{today}</p>

        {loaded && (
          <>
            {/* Summary Card */}
            <div className="bg-white rounded-2xl px-7 py-6 mb-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Team Summary
              </h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Team Average</p>
                  <span
                    className="inline-block text-sm font-semibold px-3 py-1 rounded-full"
                    style={{ background: avgColor.bg, color: avgColor.text }}
                  >
                    {LABELS[avgLevel]}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{avg}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Busiest</p>
                  <div className="flex items-center justify-center gap-1.5">
                    <Image
                      src={MEMBERS[busiestIdx].photo}
                      alt={MEMBERS[busiestIdx].name}
                      width={24}
                      height={24}
                      className="rounded-full object-cover w-6 h-6"
                    />
                    <span className="text-sm font-semibold">
                      {MEMBERS[busiestIdx].name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {values[busiestIdx]}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Most Free</p>
                  <div className="flex items-center justify-center gap-1.5">
                    <Image
                      src={MEMBERS[freestIdx].photo}
                      alt={MEMBERS[freestIdx].name}
                      width={24}
                      height={24}
                      className="rounded-full object-cover w-6 h-6"
                    />
                    <span className="text-sm font-semibold">
                      {MEMBERS[freestIdx].name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {values[freestIdx]}%
                  </p>
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={resetAll}
              className="w-full mb-6 py-3 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-colors cursor-pointer"
            >
              Reset All to Moderate
            </button>

            {/* All Sliders — Editable */}
            {MEMBERS.map((member) => {
              const value = statuses[member.name] ?? 50;
              const level = getLevel(value);
              const color = COLORS[level];

              return (
                <div
                  key={member.name}
                  className="bg-white rounded-2xl px-7 py-6 mb-4 shadow-sm"
                >
                  <div className="flex justify-between items-center mb-3.5">
                    <div className="flex items-center gap-3">
                      <Image
                        src={member.photo}
                        alt={member.name}
                        width={40}
                        height={40}
                        className="rounded-full object-cover w-10 h-10"
                      />
                      <span className="text-[17px] font-semibold">
                        {member.name}
                      </span>
                    </div>
                    <span
                      className="text-[13px] font-semibold px-3 py-1 rounded-full"
                      style={{ background: color.bg, color: color.text }}
                    >
                      {LABELS[level]}
                    </span>
                  </div>
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
                </div>
              );
            })}
          </>
        )}

        {!loaded && (
          <p className="text-center text-gray-400">Loading...</p>
        )}
      </div>
    </div>
  );
}
