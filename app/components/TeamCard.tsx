"use client";

import Image from "next/image";
import { EMOJIS, LABELS, ADHD_LABELS, ADHD_COLORS, TRACK_COLORS, BUDDIES_ENABLED, getLevel, getAdhdLevel, timeAgo } from "@/app/lib/constants";
import BuddyBadge from "@/app/components/BuddyBadge";

interface Member {
  name: string;
  photo: string;
}

interface Poke {
  from: string;
  to: string;
}

interface FloatingReaction {
  id: string;
  name: string;
  emoji: string;
}

interface Props {
  member: Member;
  i: number;
  statuses: Record<string, number>;
  oooStatuses: Record<string, boolean>;
  sosStatuses: Record<string, boolean>;
  metcalfStatuses: Record<string, boolean>;
  needWorkStatuses: Record<string, boolean>;
  dontTalkStatuses: Record<string, boolean>;
  medsStatuses: Record<string, boolean>;
  bodyDoubles: string[];
  photoOverrides: Record<string, string>;
  updatedAt: Record<string, number>;
  currentUser: string | null;
  isGuest: boolean;
  moods: Record<string, string>;
  adhdLevels: Record<string, number>;
  meetings: Record<string, number>;
  pokes: Poke[];
  touchGrass: Poke[];
  bans: Record<string, string>;
  floatingReactions: FloatingReaction[];
  hotColdStatuses: Record<string, "hot" | "cold">;
  buddies: Record<string, { id: string }>;
  statusNotes: Record<string, string>;
  sendReaction: (name: string, emoji: string) => void;
  sendPoke: (name: string) => void;
  sendTouchGrass: (name: string) => void;
  setShowDisputeModal: (v: boolean) => void;
  setDisputeSent: (v: boolean) => void;
  setDisputeText: (v: string) => void;
  formatCountdown: (endTime: number) => string;
}

export default function TeamCard({
  member, i, statuses, oooStatuses, sosStatuses, metcalfStatuses, needWorkStatuses,
  dontTalkStatuses, medsStatuses, bodyDoubles, photoOverrides, updatedAt, currentUser,
  isGuest, moods, adhdLevels, meetings, pokes, touchGrass, bans, floatingReactions,
  hotColdStatuses, buddies, statusNotes, sendReaction, sendPoke, sendTouchGrass, setShowDisputeModal,
  setDisputeSent, setDisputeText, formatCountdown,
}: Props) {
  const value = statuses[member.name] ?? 50;
  const level = getLevel(value);
  const isOOO = !!oooStatuses[member.name];
  const isSOS = !!sosStatuses[member.name];
  const isMetcalf = !!metcalfStatuses[member.name];
  const isNeedWork = !!needWorkStatuses[member.name];
  const isDontTalk = !!dontTalkStatuses[member.name];
  const isMeds = !!medsStatuses[member.name];
  const isBodyDouble = bodyDoubles.includes(member.name);
  const isBanned = !!bans[member.name];
  const hotCold = hotColdStatuses[member.name] ?? null;

  if (isBanned) {
    return (
      <div
        className="animate-pop-in rounded-2xl border-[4px] border-[#e74c3c] shadow-[5px_5px_0_#e74c3c] overflow-hidden relative"
        style={{ animationDelay: `${i * 50}ms`, background: "#fff0f0", minHeight: "160px" }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center z-10">
          <div className="text-5xl font-black tracking-tighter text-[#e74c3c] uppercase leading-none" style={{ fontFamily: "var(--font-display)", textShadow: "3px 3px 0 #000", WebkitTextStroke: "2px #000" }}>
            BANNED
          </div>
          <p className="text-sm font-bold text-[#c0392b]">{member.name} has been removed</p>
          {bans[member.name] && <p className="text-xs text-black/50 font-medium italic">&ldquo;{bans[member.name]}&rdquo;</p>}
          {currentUser === member.name && (
            <button
              onClick={() => { setShowDisputeModal(true); setDisputeSent(false); setDisputeText(""); }}
              className="mt-1 px-4 py-2 rounded-xl border-[3px] border-black bg-[#e74c3c] text-white text-xs font-extrabold uppercase tracking-widest shadow-[3px_3px_0_#000] cursor-pointer hover:bg-black transition-colors"
            >
              ✋ dispute this ban
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`animate-pop-in rounded-2xl px-4 py-4 border-[4px] transition-all flex flex-col gap-2 relative group cursor-default ${
        isDontTalk ? "border-[#e74c3c] shadow-[5px_5px_0_#e74c3c] hover:-translate-y-1 hover:shadow-[8px_8px_0_#e74c3c]"
        : isOOO ? "border-black hover:-translate-y-1"
        : isSOS ? "border-black shadow-[5px_5px_0_#e74c3c] hover:-translate-y-1 hover:shadow-[8px_8px_0_#e74c3c]"
        : "border-black shadow-[5px_5px_0_#000] hover:-translate-y-1 hover:shadow-[8px_8px_0_#000]"
      }`}
      style={{
        animationDelay: `${i * 50}ms`,
        background: isDontTalk ? "#ffe5e5" : "#ffffff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Floating reactions */}
      {floatingReactions.filter((r) => r.name === member.name).map((r) => (
        <div key={r.id} className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
          <span className="float-reaction text-5xl">{r.emoji}</span>
        </div>
      ))}
      {isOOO && (
        <>
          <div className="absolute inset-0 flex items-start justify-center pointer-events-none z-10" style={{ paddingTop: "18px" }}>
            <Image
              src="/spirit.png"
              alt="ghost mode"
              width={537}
              height={74}
              className="w-[115%] h-auto opacity-90"
              style={{ transform: "rotate(-8deg)" }}
            />
          </div>
          <div className="absolute bottom-3 right-3 z-20">
            <span className="text-[13px] font-extrabold text-black" style={{ fontFamily: "var(--font-display)" }}>
              {member.name}
            </span>
          </div>
        </>
      )}
      <div className={`flex flex-col gap-2 ${isOOO ? "opacity-30 grayscale" : ""}`}>
        <div className="flex items-center gap-3">
          {isDontTalk ? (
            <span className="text-[44px] w-[44px] h-[44px] shrink-0 flex items-center justify-center leading-none">😤</span>
          ) : (
            <Image
              src={photoOverrides[member.name] ?? member.photo}
              alt={member.name} width={44} height={44}
              className="rounded-full object-cover border-[3px] border-black w-[44px] h-[44px] shrink-0 transition-transform group-hover:scale-110"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>{member.name}</p>
            {updatedAt[member.name] && (
              <>
                <p className="text-[12px] text-black font-mono mt-0.5">{timeAgo(updatedAt[member.name])}</p>
              </>
            )}
          </div>
          {isDontTalk ? (
            <span className="text-4xl shrink-0">🚫</span>
          ) : isSOS ? (
            <span className="text-xl animate-pulse shrink-0">🚨</span>
          ) : isMetcalf ? (
            <span className="text-2xl animate-bounce shrink-0">🚗</span>
          ) : BUDDIES_ENABLED && buddies[member.name] ? (
            <div className="shrink-0 flex items-center gap-2">
              {<BuddyBadge buddyId={buddies[member.name].id} />}
              <span className="text-4xl emoji-hover cursor-default">{EMOJIS[level]}</span>
            </div>
          ) : (
            <span className="text-4xl emoji-hover cursor-default shrink-0">{EMOJIS[level]}</span>
          )}
        </div>

        {isDontTalk && (
          <div className="w-full rounded-xl bg-[#e74c3c] px-4 py-2.5 flex items-center gap-2">
            <span className="text-lg">🚫</span>
            <p className="text-sm font-bold text-white">don&apos;t talk to me</p>
          </div>
        )}
        {!isDontTalk && !isSOS && (
          <div className="flex flex-col gap-1.5">
            <div className="h-3 rounded-full bg-black/10 overflow-hidden border-[2px] border-black">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${value}%`, background: TRACK_COLORS[level] }}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-extrabold text-black uppercase tracking-widest" style={{ fontFamily: "var(--font-display)" }}>{LABELS[level]}</p>
              {moods[member.name] && (
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#FFE234] border-[2px] border-black text-black lowercase tracking-wide shadow-[2px_2px_0_#000]">
                  {moods[member.name]}
                </span>
              )}
            </div>
            {statusNotes[member.name] && (
              <p className="text-[12px] text-black font-medium font-mono leading-snug">
                {statusNotes[member.name]}
              </p>
            )}
            {(() => {
              const adhdVal = adhdLevels[member.name] ?? 0;
              const adhdLvl = getAdhdLevel(adhdVal);
              return (
                <div className="flex items-center gap-2 rounded-xl px-3 py-2 border-[2px] border-black shadow-[2px_2px_0_#000]" style={{ background: ADHD_COLORS[adhdLvl] }}>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#FFE234] border-[2px] border-black shrink-0">adhd</span>
                  <span className="text-sm font-extrabold text-black flex-1">{ADHD_LABELS[adhdLvl]}</span>
                  <span className="text-base">{["🧠", "😵‍💫", "📱", "🐿️"][adhdLvl]}</span>
                </div>
              );
            })()}
          </div>
        )}
        {!isDontTalk && meetings[member.name] && meetings[member.name] > Date.now() && (
          <div className="w-full rounded-xl bg-[#FF9DC8] border-[2px] border-black px-4 py-2.5 flex items-center gap-2 shadow-[2px_2px_0_#000]">
            <span className="text-lg">📅</span>
            <p className="text-sm font-bold flex-1">in a meeting</p>
            <span className="text-sm font-extrabold tabular-nums">{formatCountdown(meetings[member.name])}</span>
          </div>
        )}
        {!isDontTalk && isMetcalf && (
          <div className="w-full rounded-xl bg-black px-4 py-2.5 flex items-center gap-2">
            <span className="text-lg">🚗</span>
            <p className="text-sm font-bold text-white">catch me on metcalf</p>
          </div>
        )}
        {!isDontTalk && isNeedWork && (
          <div className="w-full rounded-xl bg-[#3D52F0] px-4 py-2.5 flex items-center gap-2">
            <span className="text-lg">📋</span>
            <p className="text-sm font-bold text-white">I need work</p>
          </div>
        )}
        {isMeds && (
          <div className="w-full rounded-xl bg-[#a8f5c8] border-[2px] border-black px-4 py-2 flex items-center gap-2 shadow-[2px_2px_0_#000]">
            <span className="text-base">💊</span>
            <p className="text-xs font-bold text-black">meds taken</p>
          </div>
        )}
        {isBodyDouble && (
          <div className="w-full rounded-xl bg-[#dbb8ff] border-[2px] border-black px-4 py-2 flex items-center gap-2 shadow-[2px_2px_0_#000]">
            <span className="text-base">🧠</span>
            <p className="text-xs font-bold text-black">body doubling</p>
          </div>
        )}
        {hotCold && (
          <div
            className="w-full rounded-xl border-[2px] border-black px-4 py-2 flex items-center gap-2 shadow-[2px_2px_0_#000]"
            style={{ background: hotCold === "hot" ? "#FF4444" : "#b8e0ff" }}
          >
            <span className="text-base">{hotCold === "hot" ? "🔥" : "🧊"}</span>
            <p className="text-xs font-extrabold text-black uppercase tracking-widest">{hotCold === "hot" ? "running hot" : "ice cold"}</p>
          </div>
        )}
        {!isDontTalk && currentUser && currentUser !== member.name && !isGuest && (
          <div className="flex items-center justify-between mt-1 px-1">
            {["😬", "💀", "🔥", "😭", "🫡", "💅"].map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendReaction(member.name, emoji)}
                className="text-xl hover:scale-150 transition-transform cursor-pointer active:scale-90"
              >{emoji}</button>
            ))}
          </div>
        )}
        {!isDontTalk && currentUser && currentUser !== member.name && (
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => sendPoke(member.name)}
              disabled={pokes.some((p) => p.from === currentUser && p.to === member.name)}
              className={`flex-1 py-1.5 rounded-xl border-[2px] border-black text-xs font-bold transition-all cursor-pointer
                ${pokes.some((p) => p.from === currentUser && p.to === member.name)
                  ? "bg-[#FFE234] opacity-60 cursor-default"
                  : "bg-white hover:bg-[#FFE234] active:scale-95 shadow-[2px_2px_0_#000]"
                }`}
            >
              {pokes.some((p) => p.from === currentUser && p.to === member.name) ? "👉 poked!" : "👉 poke"}
            </button>
            <button
              onClick={() => sendTouchGrass(member.name)}
              disabled={touchGrass.some((p) => p.from === currentUser && p.to === member.name)}
              className={`flex-1 py-1.5 rounded-xl border-[2px] border-black text-xs font-bold transition-all cursor-pointer
                ${touchGrass.some((p) => p.from === currentUser && p.to === member.name)
                  ? "bg-[#a8f5c8] opacity-60 cursor-default"
                  : "bg-white hover:bg-[#a8f5c8] active:scale-95 shadow-[2px_2px_0_#000]"
                }`}
            >
              {touchGrass.some((p) => p.from === currentUser && p.to === member.name) ? "🌿 sent!" : "🌿 touch grass"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
