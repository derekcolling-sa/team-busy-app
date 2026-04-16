"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { MEMBERS } from "@/app/lib/constants";

// Teams-inspired palette
const PURPLE = "#5B5FC7";
const PURPLE_DARK = "#4F52B2";
const BORDER = "#E1DFDD";
const TEXT = "#242424";
const SUBTLE = "#616161";
const SURFACE = "#FAFAFA";

const PRO_LABELS = ["Available", "Busy", "Do not disturb", "Overloaded"];
const PRO_DESCRIPTIONS = ["Light workload", "Moderate workload", "Heavy workload", "At capacity"];
const PRO_DOT_COLORS = ["#6BB700", "#C4314B", "#C4314B", "#8B1538"];

function getProLevel(val: number) {
  if (val <= 25) return 0;
  if (val <= 50) return 1;
  if (val <= 75) return 2;
  return 3;
}

function formatTimeAgo(ts: number | undefined): string {
  if (!ts) return "—";
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return "Just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function PresenceDot({ level, ooo, size = 12 }: { level: number; ooo?: boolean; size?: number }) {
  const color = ooo ? "#B4B4B4" : PRO_DOT_COLORS[level];
  const isDnd = level >= 2 && !ooo;
  const isOverloaded = level === 3 && !ooo;
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        border: "2px solid #fff",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.08)",
        position: "relative",
      }}
    >
      {isDnd && !isOverloaded && (
        <span
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: size * 0.5,
            height: 1.5,
            background: "#fff",
            borderRadius: 1,
          }}
        />
      )}
      {isOverloaded && (
        <span
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: size * 0.7,
            lineHeight: 1,
            color: "#fff",
            fontWeight: 900,
          }}
        >
          ×
        </span>
      )}
    </span>
  );
}

interface Props {
  onSwitchMode: () => void;
}

export default function ProfessionalView({ onSwitchMode }: Props) {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, number>>({});
  const [updatedAt, setUpdatedAt] = useState<Record<string, number>>({});
  const [statusNotes, setStatusNotes] = useState<Record<string, string>>({});
  const [oooStatuses, setOooStatuses] = useState<Record<string, boolean>>({});
  const [photoOverrides, setPhotoOverrides] = useState<Record<string, string>>({});
  const [localSlider, setLocalSlider] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState<string>("");
  const [noteSaved, setNoteSaved] = useState(false);
  const isDragging = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const noteDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("team-busy-user");
    if (saved && saved !== "__guest__") {
      setCurrentUser(saved);
    } else {
      setShowPicker(true);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, photosRes, poll] = await Promise.all([
        fetch("/api/status").then((r) => r.json()),
        fetch("/api/photos").then((r) => r.json()),
        fetch("/api/poll").then((r) => r.json()),
      ]);
      if (!isDragging.current) setStatuses(statusRes.status ?? {});
      setUpdatedAt(statusRes.updated ?? {});
      setStatusNotes(statusRes.notes ?? {});
      setPhotoOverrides(photosRes.photos ?? {});
      setOooStatuses(poll.ooo ?? {});
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (currentUser && statusNotes[currentUser] !== undefined && noteDraft === "") {
      setNoteDraft(statusNotes[currentUser]);
    }
  }, [currentUser, statusNotes, noteDraft]);

  const pickUser = (name: string) => {
    localStorage.setItem("team-busy-user", name);
    setCurrentUser(name);
    setShowPicker(false);
  };

  const saveStatus = (value: number) => {
    if (!currentUser) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: currentUser, value }),
      }).catch(() => {});
    }, 300);
  };

  const saveNote = (note: string) => {
    if (!currentUser) return;
    if (noteDebounceRef.current) clearTimeout(noteDebounceRef.current);
    noteDebounceRef.current = setTimeout(() => {
      fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: currentUser, note }),
      })
        .then(() => {
          setNoteSaved(true);
          setTimeout(() => setNoteSaved(false), 1500);
        })
        .catch(() => {});
    }, 600);
  };

  const myValue = currentUser ? (localSlider ?? statuses[currentUser] ?? 0) : 0;
  const myLevel = getProLevel(myValue);
  const myPhoto = currentUser ? (photoOverrides[currentUser] ?? MEMBERS.find((m) => m.name === currentUser)?.photo) : null;

  const fontFamily = '"Segoe UI", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

  // Sign-in / identity picker
  if (showPicker) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: `linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE_DARK} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            padding: 32,
            maxWidth: 420,
            width: "100%",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 600, color: TEXT, marginBottom: 6 }}>Choose your account</div>
          <div style={{ fontSize: 14, color: SUBTLE, marginBottom: 20 }}>
            Select your name to continue.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {MEMBERS.map((m) => (
              <button
                key={m.name}
                onClick={() => pickUser(m.name)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  border: `1px solid ${BORDER}`,
                  background: "#fff",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 14,
                  color: TEXT,
                  textAlign: "left",
                  fontFamily: "inherit",
                }}
                onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#F5F5F5")}
                onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#fff")}
              >
                <Image
                  src={photoOverrides[m.name] ?? m.photo}
                  alt={m.name}
                  width={32}
                  height={32}
                  style={{ borderRadius: "50%", objectFit: "cover", width: 32, height: 32 }}
                />
                <span style={{ fontWeight: 600 }}>{m.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const sortedTeam = [...MEMBERS]
    .filter((m) => m.name !== currentUser)
    .sort((a, b) => (statuses[b.name] ?? 0) - (statuses[a.name] ?? 0));

  return (
    <div
      style={{
        minHeight: "100vh",
        background: SURFACE,
        color: TEXT,
        fontFamily,
        fontSize: 14,
      }}
    >
      {/* Simple purple top bar */}
      <header
        style={{
          height: 52,
          background: PURPLE,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          color: "#fff",
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: 0.1 }}>Team Workload</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={onSwitchMode}
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "5px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            title="Switch to Classic mode"
          >
            Switch to Classic
          </button>
          {currentUser && myPhoto && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ position: "relative" }}>
                <Image
                  src={myPhoto}
                  alt={currentUser}
                  width={30}
                  height={30}
                  style={{ borderRadius: "50%", objectFit: "cover", width: 30, height: 30 }}
                />
                <div style={{ position: "absolute", bottom: -2, right: -2 }}>
                  <PresenceDot level={myLevel} size={11} />
                </div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{currentUser}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 24, fontWeight: 600, color: TEXT }}>Set your status</div>
          <div style={{ fontSize: 13, color: SUBTLE, marginTop: 4 }}>
            Let your team know how much you have on your plate today.
          </div>
        </div>

        {/* Status card */}
        {currentUser && (
          <div
            style={{
              background: "#fff",
              border: `1px solid ${BORDER}`,
              borderRadius: 6,
              padding: 24,
              boxShadow: "0 1.6px 3.6px rgba(0,0,0,0.04), 0 0.3px 0.9px rgba(0,0,0,0.05)",
            }}
          >
            {/* User row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
                paddingBottom: 20,
                borderBottom: `1px solid #F0F0F0`,
              }}
            >
              {myPhoto && (
                <div style={{ position: "relative" }}>
                  <Image
                    src={myPhoto}
                    alt={currentUser}
                    width={48}
                    height={48}
                    style={{ borderRadius: "50%", objectFit: "cover", width: 48, height: 48 }}
                  />
                  <div style={{ position: "absolute", bottom: -2, right: -2 }}>
                    <PresenceDot level={myLevel} size={14} />
                  </div>
                </div>
              )}
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: TEXT }}>{currentUser}</div>
                <div style={{ fontSize: 13, color: SUBTLE }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: PRO_DOT_COLORS[myLevel],
                      marginRight: 6,
                      verticalAlign: "middle",
                    }}
                  />
                  {PRO_LABELS[myLevel]} · {PRO_DESCRIPTIONS[myLevel]}
                </div>
              </div>
            </div>

            {/* Workload slider */}
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 10 }}>
              Workload
            </label>

            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 28, fontWeight: 600, color: PRO_DOT_COLORS[myLevel] }}>
                {PRO_LABELS[myLevel]}
              </span>
              <span style={{ fontSize: 13, color: SUBTLE }}>{myValue}%</span>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={myValue}
              onPointerDown={() => {
                isDragging.current = true;
              }}
              onPointerUp={() => {
                isDragging.current = false;
              }}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setLocalSlider(v);
                saveStatus(v);
              }}
              style={{
                width: "100%",
                height: 4,
                borderRadius: 2,
                appearance: "none",
                cursor: "pointer",
                background: `linear-gradient(to right, ${PRO_DOT_COLORS[myLevel]} ${myValue}%, ${BORDER} ${myValue}%)`,
              }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: SUBTLE, marginTop: 6 }}>
              {PRO_LABELS.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>

            {/* Status message */}
            <div style={{ marginTop: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 6 }}>
                Status message <span style={{ color: SUBTLE, fontWeight: 400 }}>(optional)</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={noteDraft}
                  onChange={(e) => {
                    setNoteDraft(e.target.value);
                    saveNote(e.target.value);
                  }}
                  maxLength={120}
                  placeholder="Let people know what you're up to"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: 14,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 4,
                    fontFamily: "inherit",
                    color: TEXT,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = PURPLE)}
                  onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = BORDER)}
                />
                {noteSaved && (
                  <span
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 12,
                      color: "#107C10",
                      fontWeight: 600,
                    }}
                  >
                    ✓ Saved
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Team availability */}
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: TEXT, marginBottom: 10 }}>
            Team
          </div>
          <div
            style={{
              background: "#fff",
              border: `1px solid ${BORDER}`,
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1fr 1.2fr 0.8fr",
                padding: "10px 18px",
                background: "#FAFAFA",
                borderBottom: `1px solid ${BORDER}`,
                fontSize: 11,
                fontWeight: 600,
                color: SUBTLE,
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}
            >
              <div>Name</div>
              <div>Status</div>
              <div>Message</div>
              <div style={{ textAlign: "right" }}>Updated</div>
            </div>
            {sortedTeam.map((m, i) => {
              const val = statuses[m.name] ?? 0;
              const level = getProLevel(val);
              const ooo = oooStatuses[m.name];
              const note = statusNotes[m.name];
              const photo = photoOverrides[m.name] ?? m.photo;
              return (
                <div
                  key={m.name}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.4fr 1fr 1.2fr 0.8fr",
                    padding: "12px 18px",
                    alignItems: "center",
                    borderBottom: i < sortedTeam.length - 1 ? "1px solid #F0F0F0" : "none",
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ position: "relative" }}>
                      <Image
                        src={photo}
                        alt={m.name}
                        width={30}
                        height={30}
                        style={{ borderRadius: "50%", objectFit: "cover", width: 30, height: 30 }}
                      />
                      <div style={{ position: "absolute", bottom: -2, right: -2 }}>
                        <PresenceDot level={level} ooo={ooo} size={11} />
                      </div>
                    </div>
                    <span style={{ fontWeight: 600, color: TEXT }}>{m.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: ooo ? SUBTLE : PRO_DOT_COLORS[level] }}>
                    <span
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: ooo ? "#B4B4B4" : PRO_DOT_COLORS[level],
                      }}
                    />
                    <span style={{ fontWeight: 600 }}>{ooo ? "Away" : PRO_LABELS[level]}</span>
                  </div>
                  <div
                    style={{
                      color: SUBTLE,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={note || ""}
                  >
                    {note || <span style={{ color: "#B4B4B4" }}>—</span>}
                  </div>
                  <div style={{ color: SUBTLE, fontSize: 12, textAlign: "right" }}>
                    {formatTimeAgo(updatedAt[m.name])}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 20, fontSize: 12, color: SUBTLE, textAlign: "center" }}>
          Status refreshes automatically every 30 seconds.
        </div>
      </main>
    </div>
  );
}
