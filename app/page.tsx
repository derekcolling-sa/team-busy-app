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

export default function Home() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, number>>({});
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

  const fetchStatuses = useCallback(async () => {
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      setStatuses(data);
    } catch {
      // silently retry next poll
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
    const interval = setInterval(fetchStatuses, 5000);
    return () => clearInterval(interval);
  }, [fetchStatuses]);

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
    <div className="min-h-screen px-5 py-10">
      <div className="max-w-[600px] mx-auto">
        <h1 className="text-[28px] font-bold text-center mb-1">
          How Busy Am I?
        </h1>
        <p className="text-[15px] text-gray-400 text-center mb-8">{today}</p>

        {currentUser && (
          <p className="text-center text-sm text-gray-500 mb-6">
            Signed in as{" "}
            <button
              onClick={() => setShowPicker(true)}
              className="font-semibold text-blue-500 hover:underline cursor-pointer"
            >
              {currentUser}
            </button>
          </p>
        )}

        {!loaded ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : (
          MEMBERS.map((member) => {
            const value = statuses[member.name] ?? 50;
            const level = getLevel(value);
            const color = COLORS[level];
            const isMe = currentUser === member.name;

            return (
              <div
                key={member.name}
                className={`bg-white rounded-2xl px-7 py-6 mb-4 shadow-sm ${
                  isMe ? "ring-2 ring-blue-400 shadow-blue-100" : ""
                }`}
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
                      {isMe && (
                        <span className="text-gray-400 font-normal">
                          {" "}
                          (you)
                        </span>
                      )}
                    </span>
                  </div>
                  <span
                    className="text-[13px] font-semibold px-3 py-1 rounded-full"
                    style={{
                      background: color.bg,
                      color: color.text,
                    }}
                  >
                    {LABELS[level]}
                  </span>
                </div>
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
              </div>
            );
          })
        )}
      </div>

      {showPicker && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-[360px] w-[90%] text-center">
            <h2 className="text-xl font-bold mb-5">Who are you?</h2>
            <div className="grid grid-cols-2 gap-3">
              {MEMBERS.map((member) => (
                <button
                  key={member.name}
                  onClick={() => pickUser(member.name)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer text-[15px] font-semibold"
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
