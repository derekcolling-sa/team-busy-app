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

  // Summary stats (exclude OOO members)
  const activeMemberValues = MEMBERS.filter(
    (m) => !oooStatuses[m.name]
  ).map((m) => statuses[m.name] ?? 50);
  const oooCount = MEMBERS.filter((m) => !!oooStatuses[m.name]).length;
  const avg =
    activeMemberValues.length > 0
      ? Math.round(
          activeMemberValues.reduce((a, b) => a + b, 0) /
            activeMemberValues.length
        )
      : 0;
  const avgLevel = getLevel(avg);
  const avgColor = COLORS[avgLevel];

  const activeMembers = MEMBERS.filter((m) => !oooStatuses[m.name]);
  const activeValues = activeMembers.map((m) => statuses[m.name] ?? 50);
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
                        <span className="text-sm font-semibold">
                          {busiestActive.name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {statuses[busiestActive.name] ?? 50}%
                      </p>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">All OOO</span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Most Free</p>
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
                        <span className="text-sm font-semibold">
                          {freestActive.name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {statuses[freestActive.name] ?? 50}%
                      </p>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">All OOO</span>
                  )}
                </div>
              </div>
              {oooCount > 0 && (
                <p className="text-xs text-gray-400 text-center mt-3">
                  {oooCount} team member{oooCount > 1 ? "s" : ""} out of office
                </p>
              )}
            </div>

            {/* Reset Button */}
            <button
              onClick={resetAll}
              className="w-full mb-6 py-3 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-colors cursor-pointer"
            >
              Reset All to Moderate
            </button>

            {/* All Members */}
            {MEMBERS.map((member) => {
              const value = statuses[member.name] ?? 50;
              const level = getLevel(value);
              const color = COLORS[level];
              const isOOO = !!oooStatuses[member.name];

              return (
                <div
                  key={member.name}
                  className={`bg-white rounded-2xl px-7 py-6 mb-4 shadow-sm ${isOOO ? "opacity-75" : ""}`}
                >
                  <div className="flex justify-between items-center mb-3.5">
                    <div className="flex items-center gap-3">
                      <Image
                        src={member.photo}
                        alt={member.name}
                        width={40}
                        height={40}
                        className={`rounded-full object-cover w-10 h-10 ${isOOO ? "grayscale" : ""}`}
                      />
                      <span className="text-[17px] font-semibold">
                        {member.name}
                      </span>
                    </div>
                    {isOOO ? (
                      <span className="text-[13px] font-semibold px-3 py-1 rounded-full bg-gray-200 text-gray-500">
                        Out of Office
                      </span>
                    ) : (
                      <span
                        className="text-[13px] font-semibold px-3 py-1 rounded-full"
                        style={{ background: color.bg, color: color.text }}
                      >
                        {LABELS[level]}
                      </span>
                    )}
                  </div>

                  {isOOO ? (
                    <div className="w-full h-8 rounded bg-gray-100 flex items-center justify-center">
                      <button
                        onClick={() => toggleOOO(member.name)}
                        className="text-xs text-blue-500 font-semibold hover:underline cursor-pointer"
                      >
                        Mark as back
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
                        className="mt-3 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        Set as Out of Office
                      </button>
                    </>
                  )}
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
