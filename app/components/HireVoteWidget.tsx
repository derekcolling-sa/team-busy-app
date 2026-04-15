"use client";

import { useState, useCallback } from "react";

interface HireVoteData {
  votes: Record<string, { writer: boolean; designer: boolean }>;
  writerYes: number;
  designerYes: number;
  total: number;
  date: string;
}

interface Props {
  currentUser: string | null;
  hireVote: HireVoteData | null;
  onVoteUpdate?: (updated: HireVoteData) => void;
  className?: string;
}

const TOTAL_MEMBERS = 7;

export default function HireVoteWidget({ currentUser, hireVote, onVoteUpdate, className = "" }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const myVote = currentUser && hireVote?.votes[currentUser]
    ? hireVote.votes[currentUser]
    : null;

  const handleVote = useCallback(async (writer: boolean, designer: boolean) => {
    if (!currentUser || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/hire-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: currentUser, writer, designer }),
      });
      if (res.ok) {
        const updated = await res.json();
        onVoteUpdate?.(updated);
      }
    } finally {
      setSubmitting(false);
    }
  }, [currentUser, submitting, onVoteUpdate]);

  const writerYes = hireVote?.writerYes ?? 0;
  const designerYes = hireVote?.designerYes ?? 0;
  const hasVoted = myVote !== null;

  const statusLine = !currentUser
    ? "pick your name first bestie"
    : !hasVoted
    ? "tap to vote · changes daily"
    : myVote?.writer && myVote?.designer
    ? "voted both. we are STRUGGLING. 💀"
    : myVote?.writer
    ? "copy is cooked fr. noted. ✍️"
    : myVote?.designer
    ? "art direction said rip. noted. 🎨"
    : "voted neither. ur built different. 😤";

  return (
    <div className={`flex-1 min-w-0 rounded-[1.4rem] border-[4px] border-black shadow-[6px_6px_0_#000] overflow-hidden bg-white ${className}`}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b-[4px] border-black bg-[#FF6B6B] flex items-center gap-3">
        <h2 className="text-2xl font-black tracking-tight flex-1 leading-none" style={{ fontFamily: "var(--font-display)" }}>
          SEND REINFORCEMENTS?
        </h2>
        {hasVoted && (
          <span className="text-[11px] font-black bg-black text-[#FF6B6B] px-2.5 py-1 rounded-full uppercase tracking-widest flex-shrink-0">voted</span>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex flex-col gap-3">
        {hasVoted && (
          <p className="text-[11px] font-black text-black/40 uppercase tracking-widest">{statusLine}</p>
        )}

        {/* Writer button */}
        <button
          onClick={() => !hasVoted && handleVote(true, myVote?.designer ?? false)}
          disabled={!currentUser || submitting || hasVoted}
          className={`w-full rounded-xl border-[3px] border-black px-4 py-3 flex items-center gap-3 text-left transition-all shadow-[3px_3px_0_#000] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed cursor-pointer ${
            myVote?.writer ? "bg-[#39FF14]" : hasVoted ? "bg-[#f5f0e8] opacity-40" : "bg-[#f5f0e8] hover:bg-[#ebe5db]"
          }`}
        >
          <span className="text-2xl leading-none">✍️</span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-black tracking-tight leading-none" style={{ fontFamily: "var(--font-display)" }}>HIRE A WRITER</span>
            <span className="block text-[11px] font-black text-black/50 mt-1">
              {writerYes === 0 ? "no votes yet · be first" : `${writerYes} of ${TOTAL_MEMBERS} say we need one`}
            </span>
          </span>
          <span className={`font-black border-[3px] border-black rounded-lg w-10 h-10 flex items-center justify-center text-lg flex-shrink-0 shadow-[2px_2px_0_#000] ${myVote?.writer ? "bg-black text-[#39FF14]" : "bg-white text-black"}`}>
            {myVote?.writer ? "✓" : "+"}
          </span>
        </button>

        {/* Designer button */}
        <button
          onClick={() => !hasVoted && handleVote(myVote?.writer ?? false, true)}
          disabled={!currentUser || submitting || hasVoted}
          className={`w-full rounded-xl border-[3px] border-black px-4 py-3 flex items-center gap-3 text-left transition-all shadow-[3px_3px_0_#000] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed cursor-pointer ${
            myVote?.designer ? "bg-[#4a9eff]" : hasVoted ? "bg-[#f5f0e8] opacity-40" : "bg-[#f5f0e8] hover:bg-[#ebe5db]"
          }`}
        >
          <span className="text-2xl leading-none">🎨</span>
          <span className="flex-1 min-w-0">
            <span className={`block text-sm font-black tracking-tight leading-none ${myVote?.designer ? "text-white" : "text-black"}`} style={{ fontFamily: "var(--font-display)" }}>HIRE A DESIGNER</span>
            <span className={`block text-[11px] font-black mt-1 ${myVote?.designer ? "text-white/60" : "text-black/50"}`}>
              {designerYes === 0 ? "no votes yet · be first" : `${designerYes} of ${TOTAL_MEMBERS} say we need one`}
            </span>
          </span>
          <span className={`font-black border-[3px] border-black rounded-lg w-10 h-10 flex items-center justify-center text-lg flex-shrink-0 shadow-[2px_2px_0_#000] ${myVote?.designer ? "bg-black text-[#4a9eff]" : "bg-white text-black"}`}>
            {myVote?.designer ? "✓" : "+"}
          </span>
        </button>
      </div>
    </div>
  );
}
