"use client";

import { BOSS, CO_ADMINS } from "@/app/lib/constants";

interface Props {
  takeover: string | null;
  setTakeover: (v: string | null) => void;
  showTakeoverCompose: boolean;
  setShowTakeoverCompose: (v: boolean) => void;
  takeoverDraft: string;
  setTakeoverDraft: (v: string) => void;
  currentUser: string | null;
}

export default function TakeoverModal({ takeover, setTakeover, showTakeoverCompose, setShowTakeoverCompose, takeoverDraft, setTakeoverDraft, currentUser }: Props) {
  return (
    <>
      {/* Takeover Overlay — shown to everyone except Derek and Erin */}
      {takeover && currentUser !== BOSS && !CO_ADMINS.includes(currentUser ?? "") && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "#FFE234" }}>
          <div className="max-w-2xl w-full px-8 text-center">
            <div className="text-6xl mb-6">📣</div>
            <p className="text-5xl sm:text-7xl font-extrabold text-black leading-tight" style={{ fontFamily: "var(--font-display)" }}>{takeover}</p>
            <p className="mt-8 text-sm font-bold text-black/40 uppercase tracking-widest">— Derek</p>
          </div>
        </div>
      )}

      {/* Takeover Compose Modal — Derek only */}
      {showTakeoverCompose && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white border-[4px] border-black rounded-[1.6rem] shadow-[7px_7px_0_#000] p-8 max-w-[480px] w-[92%] flex flex-col gap-4">
            <h2 className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-display)" }}>📣 Screen Takeover</h2>
            <p className="text-sm text-black/50">This message will fill everyone&apos;s screen.</p>
            <textarea
              value={takeoverDraft}
              onChange={(e) => setTakeoverDraft(e.target.value)}
              onPaste={(e) => e.preventDefault()}
              placeholder="Type your message…"
              maxLength={200}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-[3px] border-black text-lg font-bold focus:outline-none resize-none"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!takeoverDraft.trim()) return;
                  setTakeover(takeoverDraft.trim());
                  setShowTakeoverCompose(false);
                  try {
                    await fetch("/api/takeover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: takeoverDraft.trim() }) });
                  } catch { /* optimistic — UI already updated */ }
                }}
                disabled={!takeoverDraft.trim()}
                className="flex-1 py-3 rounded-xl bg-black text-white font-extrabold text-sm border-[3px] border-black shadow-[4px_4px_0_#FFE234] hover:bg-[#FFE234] hover:text-black transition-all cursor-pointer disabled:opacity-40 disabled:cursor-default"
              >send it 📣</button>
              <button
                onClick={() => setShowTakeoverCompose(false)}
                className="px-4 py-3 rounded-xl border-[3px] border-black font-bold text-sm hover:bg-black hover:text-white transition-colors cursor-pointer"
              >cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
