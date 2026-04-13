"use client";

interface Props {
  show: boolean;
  text: string;
  setText: (v: string) => void;
  sent: boolean;
  onSubmit: () => void;
  onClose: () => void;
  title: string;
  subtitle: string;
  placeholder: string;
  sentEmoji: string;
  sentText: string;
  sentSubtext?: string;
  submitLabel: string;
  submitClassName: string;
}

export default function TextSubmitModal({
  show, text, setText, sent, onSubmit, onClose,
  title, subtitle, placeholder, sentEmoji, sentText, sentSubtext,
  submitLabel, submitClassName,
}: Props) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="animate-bounce-in bg-white border-[4px] border-black rounded-[1.6rem] shadow-[7px_7px_0_#000] p-8 max-w-[420px] w-[92%]">
        {sent ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">{sentEmoji}</div>
            <p className="text-xl font-extrabold" style={{ fontFamily: "var(--font-display)" }}>{sentText}</p>
            {sentSubtext && <p className="text-sm text-[#b5b0a8] mt-1">{sentSubtext}</p>}
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-1">
              <h2 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>{title}</h2>
              <button
                onClick={() => { onClose(); setText(""); }}
                className="text-[#b5b0a8] hover:text-black transition-colors cursor-pointer text-xl leading-none mt-0.5"
              >✕</button>
            </div>
            <p className="text-sm text-[#b5b0a8] mb-5 font-medium">{subtitle}</p>
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onPaste={(e) => e.preventDefault()}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit(); }}
              placeholder={placeholder}
              maxLength={200}
              rows={4}
              className="w-full border-[3px] border-black focus:border-black rounded-2xl px-4 py-3 text-sm font-medium outline-none resize-none bg-white transition-colors mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { onClose(); setText(""); }}
                className="flex-1 py-3 rounded-2xl border-[3px] border-black text-[#b5b0a8] font-bold text-sm cursor-pointer hover:text-black transition-all"
              >nevermind</button>
              <button
                onClick={onSubmit}
                disabled={!text.trim()}
                className={submitClassName}
              >{submitLabel}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
