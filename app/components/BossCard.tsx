"use client";

import Image from "next/image";
import { EMOJIS, LABELS, TRACK_COLORS, getLevel } from "@/app/lib/constants";

interface Member {
  name: string;
  photo: string;
}

interface Props {
  bossMember: Member;
  currentUser: string | null;
  isGuest: boolean;
  topOnlineUser: string | null;
  statuses: Record<string, number>;
  statusNotes: Record<string, string>;
  sosStatuses: Record<string, boolean>;
  metcalfStatuses: Record<string, boolean>;
  bossReactions: Record<string, string>;
  photoOverrides: Record<string, string>;
  reactToBoss: (type: "heart" | "thumbsdown") => void;
}

export default function BossCard({ bossMember, currentUser, isGuest, topOnlineUser, statuses, statusNotes, sosStatuses, metcalfStatuses, bossReactions, photoOverrides, reactToBoss }: Props) {
  const bossLevel = getLevel(statuses[bossMember.name] ?? 50);

  return (
    <div className="animate-pop-in mt-8 rounded-[1.4rem] border-[4px] border-black shadow-[6px_6px_0_#000] bg-[#FFE234] overflow-hidden">
      <div className="flex items-center gap-5 px-6 py-5">
        <div className="relative shrink-0">
          <Image
            src={photoOverrides[bossMember.name] ?? bossMember.photo}
            alt={bossMember.name} width={72} height={72}
            className="rounded-full object-cover w-[72px] h-[72px] border-[3px] border-black"
          />
          <span className="absolute -bottom-1 -right-1 text-lg">👑</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>{bossMember.name}</span>
            <span className="text-xs font-extrabold bg-black text-[#FFE234] px-3 py-1 rounded-full uppercase tracking-widest">The Boss</span>
            {topOnlineUser === bossMember.name && (
              <span className="text-[10px] font-extrabold text-black/50 uppercase tracking-widest">🖥️ most online</span>
            )}
            {sosStatuses[bossMember.name] && <span className="text-xl animate-pulse">🚨</span>}
            {metcalfStatuses[bossMember.name] && <span className="text-xl animate-bounce">🚗</span>}
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 h-3 rounded-full bg-black/20 overflow-hidden border-[2px] border-black max-w-xs">
              <div className="h-full rounded-full transition-all" style={{ width: `${statuses[bossMember.name] ?? 50}%`, background: TRACK_COLORS[bossLevel] }} />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-widest">{LABELS[bossLevel]}</span>
          </div>
          {statusNotes[bossMember.name] && (
            <p className="text-xs font-medium text-black/70 mt-1 font-mono">{statusNotes[bossMember.name]}</p>
          )}
        </div>
        <span className="text-5xl shrink-0">{EMOJIS[bossLevel]}</span>
      </div>
      {currentUser !== bossMember.name && !isGuest && (
        <div className="flex items-center gap-4 px-6 pb-5">
          <button
            onClick={() => reactToBoss("heart")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border-[3px] border-black font-bold text-sm cursor-pointer transition-all shadow-[3px_3px_0_#000] active:shadow-none active:translate-y-[2px] ${bossReactions[currentUser ?? ""] === "heart" ? "bg-black text-white" : "bg-white hover:bg-black hover:text-white"}`}
          >
            ❤️ <span>{Object.values(bossReactions).filter(r => r === "heart").length}</span>
          </button>
          <button
            onClick={() => reactToBoss("thumbsdown")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border-[3px] border-black font-bold text-sm cursor-pointer transition-all shadow-[3px_3px_0_#000] active:shadow-none active:translate-y-[2px] ${bossReactions[currentUser ?? ""] === "thumbsdown" ? "bg-black text-white" : "bg-white hover:bg-black hover:text-white"}`}
          >
            👎 <span>{Object.values(bossReactions).filter(r => r === "thumbsdown").length}</span>
          </button>
        </div>
      )}
      <div className="flex items-center gap-3 px-6 pb-5 flex-wrap">
        <span className="text-xs font-extrabold uppercase tracking-widest text-black/50">today&apos;s vibes:</span>
        <span className="flex items-center gap-1 text-sm font-bold">❤️ {Object.values(bossReactions).filter(r => r === "heart").length}</span>
        <span className="flex items-center gap-1 text-sm font-bold">👎 {Object.values(bossReactions).filter(r => r === "thumbsdown").length}</span>
      </div>
    </div>
  );
}
