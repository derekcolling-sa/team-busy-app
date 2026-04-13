"use client";

import { BUDDIES_ENABLED } from "@/app/lib/constants";
import { getBuddyImagePath, RARITY_STYLES, type Buddy } from "@/lib/buddies";

interface Props {
  showHatchModal: boolean;
  setShowHatchModal: (v: boolean) => void;
  hatchPhase: "egg" | "cracking" | "reveal";
  hatchedBuddy: Buddy | null;
  crackEgg: () => void;
  confirmHatch: () => void;
}

export default function HatchModal({ showHatchModal, setShowHatchModal, hatchPhase, hatchedBuddy, crackEgg, confirmHatch }: Props) {
  if (!BUDDIES_ENABLED || !showHatchModal) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="animate-bounce-in bg-white border-[4px] border-black rounded-[1.6rem] shadow-[7px_7px_0_#000] p-8 max-w-[400px] w-[92%] flex flex-col items-center gap-4">
        {hatchPhase === "egg" && (
          <>
            <div className="text-7xl select-none">🥚</div>
            <h2 className="text-2xl font-extrabold text-center" style={{ fontFamily: "var(--font-display)" }}>your buddy is waiting</h2>
            <p className="text-sm text-[#8a857d] text-center">one-time hatch. you get what you get. no trades.</p>
            <button
              onClick={crackEgg}
              className="mt-2 w-full py-3 rounded-2xl bg-[#FFE234] border-[3px] border-black font-extrabold text-base shadow-[4px_4px_0_#000] hover:bg-[#FF9DC8] transition-all cursor-pointer active:translate-y-[2px] active:shadow-none"
            >
              crack it open 🥚
            </button>
            <button onClick={() => setShowHatchModal(false)} className="text-sm text-[#b5b0a8] hover:text-black transition-colors cursor-pointer">
              not yet
            </button>
          </>
        )}

        {hatchPhase === "cracking" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="text-7xl animate-egg-crack select-none">🥚</div>
            <p className="text-base font-bold text-[#8a857d] animate-pulse">hatching…</p>
          </div>
        )}

        {hatchPhase === "reveal" && hatchedBuddy && (() => {
          const styles = RARITY_STYLES[hatchedBuddy.rarity];
          return (
            <>
              <div
                className="w-full rounded-2xl border-[3px] border-black p-5 flex flex-col items-center gap-2 animate-buddy-flash shadow-[4px_4px_0_#000]"
                style={{ background: styles.bg }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getBuddyImagePath(hatchedBuddy)} alt={hatchedBuddy.name} className="w-28 h-28 object-contain" />
                <span className="text-2xl font-extrabold mt-1" style={{ color: styles.text, fontFamily: "var(--font-display)" }}>{hatchedBuddy.name}</span>
                <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border-[2px] border-black" style={{ color: styles.text }}>{styles.label}</span>
                <span className="text-sm font-medium italic text-center" style={{ color: styles.text }}>&ldquo;{hatchedBuddy.tagline}&rdquo;</span>
              </div>
              <button
                onClick={confirmHatch}
                className="w-full py-3 rounded-2xl bg-black text-white border-[3px] border-black font-extrabold text-base shadow-[4px_4px_0_#555] hover:opacity-90 transition-all cursor-pointer active:translate-y-[2px] active:shadow-none"
              >
                let&apos;s goooo 🔥
              </button>
            </>
          );
        })()}
      </div>
    </div>
  );
}
