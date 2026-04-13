"use client";

import { useState } from "react";
import Image from "next/image";
import { MEMBERS } from "@/app/lib/constants";

interface GoHomeRequest {
  name: string;
  count: number;
  ts: number;
}

interface Props {
  goHomeRequests: GoHomeRequest[];
  photoOverrides: Record<string, string>;
}

export default function GoHomeRequests({ goHomeRequests, photoOverrides }: Props) {
  const [goHomeExpanded, setGoHomeExpanded] = useState(false);

  if (!goHomeRequests.length) return null;

  const sorted = [...goHomeRequests].sort((a, b) => b.count - a.count || a.ts - b.ts);
  const topScore = sorted[0].count;

  return (
    <div className="animate-pop-in mt-6">
      <div className="rounded-[1.4rem] border-[4px] border-black shadow-[6px_6px_0_#000] bg-[#FFE234] overflow-hidden">
        <button
          onClick={() => setGoHomeExpanded((v) => !v)}
          className="w-full px-5 pt-4 pb-3 border-b-[3px] border-black flex items-center gap-3 cursor-pointer hover:bg-[#f5d800] transition-colors"
        >
          <h2 className="text-4xl font-extrabold text-black tracking-tight flex-1 text-left">Wants to go home</h2>
          <span className="text-sm font-extrabold bg-black text-white px-3 py-1.5 rounded-full">{goHomeRequests.length}</span>
          <span className="text-xl ml-1">{goHomeExpanded ? "▲" : "▼"}</span>
        </button>
        {goHomeExpanded && (
          <div className="flex flex-wrap gap-3 px-5 py-4">
            {sorted.map((r, i) => {
              const isTop = i === 0 && topScore > 1;
              const isAngel = r.count >= 777;
              const isDevil = r.count === 666;
              return (
                <div key={r.name} className={`flex items-center gap-2.5 rounded-2xl px-4 py-2.5 border-[3px] shadow-[3px_3px_0_#000] ${isAngel ? "bg-sky-200 border-sky-400" : isDevil ? "bg-red-600 border-red-900" : isTop ? "bg-black border-black" : "bg-white border-black"}`}>
                  {isTop && !isDevil && !isAngel && <span className="text-base">🏆</span>}
                  {isAngel
                    ? <span className="text-3xl w-9 h-9 flex items-center justify-center flex-shrink-0 animate-bounce">😇</span>
                    : isDevil
                    ? <span className="text-3xl w-9 h-9 flex items-center justify-center flex-shrink-0 animate-pulse">😈</span>
                    : <Image
                        src={photoOverrides[r.name] ?? (MEMBERS.find(m => m.name === r.name)?.photo ?? "")}
                        alt={r.name} width={36} height={36}
                        className="rounded-full object-cover w-9 h-9 border-2 border-black flex-shrink-0"
                      />
                  }
                  <span className={`font-extrabold text-base ${isAngel ? "text-sky-800" : isDevil ? "text-white" : isTop ? "text-[#FFE234]" : "text-black"}`}>{r.name}</span>
                  <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${isAngel ? "bg-sky-400 text-white" : isDevil ? "bg-red-900 text-white" : isTop ? "bg-[#FFE234] text-black" : "bg-black text-[#FFE234]"}`}>x{r.count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
