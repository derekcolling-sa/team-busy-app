"use client";

interface Props {
  showDisputeModal: boolean;
  setShowDisputeModal: (v: boolean) => void;
  disputeText: string;
  setDisputeText: (v: string) => void;
  disputeSent: boolean;
  setDisputeSent: (v: boolean) => void;
  currentUser: string | null;
  bans: Record<string, string>;
}

export default function DisputeModal({ showDisputeModal, setShowDisputeModal, disputeText, setDisputeText, disputeSent, setDisputeSent, currentUser, bans }: Props) {
  if (!showDisputeModal || !currentUser || !bans[currentUser]) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="animate-bounce-in bg-white border-[4px] border-[#e74c3c] rounded-[1.6rem] shadow-[7px_7px_0_#000] p-8 max-w-[400px] w-full">
        {disputeSent ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">✋</div>
            <p className="text-xl font-extrabold" style={{ fontFamily: "var(--font-display)" }}>Dispute filed.</p>
            <p className="text-sm text-[#b5b0a8] mt-1">Derek will review it.</p>
            <button
              onClick={() => setShowDisputeModal(false)}
              className="mt-5 px-6 py-2.5 rounded-2xl bg-black text-white font-bold text-sm cursor-pointer hover:opacity-80 transition-opacity"
            >close</button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-1">
              <h2 className="text-2xl font-extrabold tracking-tight text-[#e74c3c]" style={{ fontFamily: "var(--font-display)" }}>Dispute Ban</h2>
              <button onClick={() => setShowDisputeModal(false)} className="text-[#b5b0a8] hover:text-black transition-colors cursor-pointer text-xl leading-none mt-0.5">✕</button>
            </div>
            <p className="text-sm text-[#b5b0a8] mb-5 font-medium">Make your case. Derek will see this.</p>
            <textarea
              autoFocus
              value={disputeText}
              onChange={(e) => setDisputeText(e.target.value)}
              onPaste={(e) => e.preventDefault()}
              placeholder="why should you be unbanned?"
              maxLength={200}
              rows={4}
              className="w-full border-[3px] border-[#e74c3c] focus:border-[#e74c3c] rounded-2xl px-4 py-3 text-sm font-medium outline-none resize-none bg-white mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowDisputeModal(false)}
                className="flex-1 py-3 rounded-2xl border-[3px] border-black text-[#b5b0a8] font-bold text-sm cursor-pointer hover:text-black transition-all"
              >nevermind</button>
              <button
                onClick={async () => {
                  if (!disputeText.trim() || !currentUser) return;
                  try {
                    await fetch("/api/ban", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "dispute", name: currentUser, message: disputeText.trim() }),
                    });
                    setDisputeSent(true);
                  } catch { /* silently fail — user can retry */ }
                }}
                disabled={!disputeText.trim()}
                className="flex-1 py-3 rounded-2xl bg-[#e74c3c] border-[3px] border-black text-white font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-default shadow-[3px_3px_0_#000]"
              >send it ✋</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
