"use client";

interface Props {
  showGhostModal: boolean;
  ghostNote: string;
  setGhostNote: (v: string) => void;
  ghostBackDate: string;
  setGhostBackDate: (v: string) => void;
  confirmGhost: () => void;
  setShowGhostModal: (v: boolean) => void;
}

export default function GhostModal({ showGhostModal, ghostNote, setGhostNote, ghostBackDate, setGhostBackDate, confirmGhost, setShowGhostModal }: Props) {
  if (!showGhostModal) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="animate-bounce-in bg-white border-[4px] border-black rounded-[1.6rem] shadow-[7px_7px_0_#000] p-8 max-w-[420px] w-[92%]">
        <div className="text-4xl mb-2 text-center">👻</div>
        <h2 className="text-xl font-extrabold text-center mb-1" style={{ fontFamily: "var(--font-display)" }}>Going Ghost</h2>
        <p className="text-sm text-[#8a857d] text-center mb-5">Let the team know what&apos;s up</p>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-bold text-[#6b6560] uppercase tracking-wide mb-1 block">What&apos;s the vibe?</label>
            <input
              type="text"
              placeholder="OOO, at a conference, touching grass…"
              value={ghostNote}
              onChange={(e) => setGhostNote(e.target.value)}
              className="w-full border-2 border-black rounded-xl px-3 py-2.5 text-sm font-medium bg-white focus:outline-none"
              maxLength={200}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[#6b6560] uppercase tracking-wide mb-1 block">Back when?</label>
            <input
              type="text"
              placeholder="Monday, Jan 20, TBD…"
              value={ghostBackDate}
              onChange={(e) => setGhostBackDate(e.target.value)}
              className="w-full border-2 border-black rounded-xl px-3 py-2.5 text-sm font-medium bg-white focus:outline-none"
              maxLength={200}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setShowGhostModal(false)}
            className="flex-1 py-2.5 rounded-xl border-2 border-black text-sm font-bold text-[#8a857d] hover:text-black transition-all cursor-pointer"
          >
            nevermind
          </button>
          <button
            onClick={confirmGhost}
            className="flex-1 py-2.5 rounded-xl border-2 border-black bg-black text-sm font-bold text-white hover:bg-[#2d2a26] transition-all cursor-pointer"
          >
            go ghost 👻
          </button>
        </div>
      </div>
    </div>
  );
}
