"use client";

import { useRef } from "react";
import Image from "next/image";
import { ADHD_COLORS, BOSS, CO_ADMINS, BUDDIES_ENABLED, getLevel, getAdhdLevel, getTrackStyle, timeAgo, getVoice } from "@/app/lib/constants";
import BuddyBadge from "@/app/components/BuddyBadge";

interface Member {
  name: string;
  photo: string;
}

interface Poke {
  from: string;
  to: string;
}

interface Props {
  member: Member;
  statuses: Record<string, number>;
  oooStatuses: Record<string, boolean>;
  oooDetails: Record<string, { note?: string; backDate?: string }>;
  sosStatuses: Record<string, boolean>;
  metcalfStatuses: Record<string, boolean>;
  needWorkStatuses: Record<string, boolean>;
  dontTalkStatuses: Record<string, boolean>;
  medsStatuses: Record<string, boolean>;
  bodyDoubles: string[];
  photoOverrides: Record<string, string>;
  updatedAt: Record<string, number>;
  topOnlineUser: string | null;
  cardFlipped: boolean;
  setCardFlipped: (fn: (v: boolean) => boolean) => void;
  localSlider: number | null;
  setLocalSlider: (v: number | null) => void;
  isDragging: React.MutableRefObject<boolean>;
  localAdhd: number | null;
  setLocalAdhd: (v: number | null) => void;
  isAdhdDragging: React.MutableRefObject<boolean>;
  editingNote: string;
  setEditingNote: (v: string) => void;
  adhdLevels: Record<string, number>;
  moods: Record<string, string>;
  meetings: Record<string, number>;
  pokes: Poke[];
  touchGrass: Poke[];
  moneyRequestSent: boolean;
  moneyRequests: Array<{ name: string }>;
  currentUser: string | null;
  isGuest: boolean;
  takeover: string | null;
  setTakeover: (v: string | null) => void;
  takeoverDraft: string;
  setTakeoverDraft: (v: string) => void;
  setShowTakeoverCompose: (v: boolean) => void;
  newMessage: Record<string, string>;
  setNewMessage: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  uploadingPhoto: boolean;
  handlePhotoUpload: (file: File) => void;
  buddies: Record<string, { id: string }>;
  hotColdStatuses: Record<string, "hot" | "cold">;
  toggleHotCold: (name: string, temp: "hot" | "cold" | null) => void;
  toggleOOO: (name: string) => void;
  toggleMeds: (name: string) => void;
  toggleBodyDouble: (name: string) => void;
  toggleNeedWork: (name: string) => void;
  toggleDontTalk: (name: string) => void;
  toggleMetcalf: (name: string) => void;
  toggleSOS: (name: string) => void;
  handleSliderChange: (name: string, value: number) => void;
  saveNote: (name: string, note: string) => void;
  handleAdhdChange: (name: string, value: number) => void;
  handleMoneyRequest: () => void;
  sendPoke: (name: string) => void;
  sendTouchGrass: (name: string) => void;
  dismissPoke: (from: string) => void;
  dismissTouchGrass: (from: string) => void;
  postMessage: (name: string) => void;
  formatCountdown: (endTime: number) => string;
  setShowMeetingPicker: (v: boolean) => void;
  setMeeting: (min: number | null) => void;
  setMyMood: (mood: string) => void;
}

export default function MyCard({
  member, statuses, oooStatuses, oooDetails, sosStatuses, metcalfStatuses, needWorkStatuses,
  dontTalkStatuses, medsStatuses, bodyDoubles, hotColdStatuses, photoOverrides, updatedAt, topOnlineUser,
  cardFlipped, setCardFlipped, localSlider, setLocalSlider, isDragging, localAdhd,
  setLocalAdhd, isAdhdDragging, editingNote, setEditingNote, adhdLevels, moods, meetings,
  pokes, touchGrass, moneyRequestSent, moneyRequests, currentUser, isGuest, takeover,
  setTakeover, takeoverDraft, setTakeoverDraft, setShowTakeoverCompose, newMessage,
  setNewMessage, uploadingPhoto, handlePhotoUpload, buddies, toggleHotCold, toggleOOO, toggleMeds,
  toggleBodyDouble, toggleNeedWork, toggleDontTalk, toggleMetcalf, toggleSOS,
  handleSliderChange, saveNote, handleAdhdChange, handleMoneyRequest, sendPoke,
  sendTouchGrass, dismissPoke, dismissTouchGrass, postMessage, formatCountdown,
  setShowMeetingPicker, setMeeting, setMyMood,
}: Props) {
  const { LABELS, EMOJIS, ADHD_LABELS, MOODS } = getVoice(currentUser);
  const value = statuses[member.name] ?? 50;
  const level = getLevel(value);
  const isOOO = !!oooStatuses[member.name];
  const isSOS = !!sosStatuses[member.name];
  const isMetcalf = !!metcalfStatuses[member.name];
  const isNeedWork = !!needWorkStatuses[member.name];
  const isDontTalk = !!dontTalkStatuses[member.name];
  const isMeds = !!medsStatuses[member.name];
  const isBodyDouble = bodyDoubles.includes(member.name);
  const hotCold = hotColdStatuses[member.name] ?? null;

  return (
    <div
      onClick={() => setCardFlipped((f) => !f)}
      className={`rounded-[1.4rem] px-6 py-6 border-[4px] transition-all cursor-pointer select-none ${
        isOOO ? "border-black opacity-50"
        : isSOS ? "border-black shadow-[6px_6px_0_#e74c3c] hover:-translate-y-1 hover:shadow-[9px_9px_0_#e74c3c]"
        : "border-black shadow-[6px_6px_0_#000] hover:-translate-y-1 hover:shadow-[9px_9px_0_#000]"
      }`}
      style={{ background: "#ffffff", position: "relative", overflow: "hidden", transform: cardFlipped ? "rotate(180deg)" : undefined, transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}
    >
      {/* Stop clicks on interactive content from flipping the card */}
      <div onClick={(e) => e.stopPropagation()}>
        {/* Avatar + name row */}
        <div className="flex items-center gap-4 mb-5">
          <label className="relative cursor-pointer group shrink-0" title="Click to update photo">
            <Image
              src={photoOverrides[member.name] ?? member.photo}
              alt={member.name} width={72} height={72}
              className={`rounded-full object-cover border-[4px] border-black w-[72px] h-[72px] transition-opacity ${uploadingPhoto ? "opacity-40" : "group-hover:opacity-70"}`}
            />
            <span className="absolute inset-0 flex items-center justify-center text-lg opacity-0 group-hover:opacity-100 transition-opacity">
              {uploadingPhoto ? "⏳" : "📷"}
            </span>
            <input type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); e.target.value = ""; }}
            />
          </label>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>{member.name}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest bg-black text-white px-2 py-0.5 rounded-full">you</span>
            </div>
            {topOnlineUser === member.name && (
              <span className="text-[10px] font-extrabold text-black/50 uppercase tracking-widest">🖥️ most online</span>
            )}
            {updatedAt[member.name] && (
              <>
                <p className="text-[11px] text-[#7a6f64] font-semibold mt-0.5 italic">{timeAgo(updatedAt[member.name])}</p>
              </>
            )}
          </div>
          {isOOO ? (
            <span className="text-sm font-bold px-3 py-1.5 rounded-full bg-[#e5e1dc] text-[#8a857d] border-2 border-black shrink-0">👻</span>
          ) : isSOS ? (
            <span className="text-2xl animate-pulse shrink-0">🚨</span>
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

        {isOOO ? (
          <div className="w-full rounded-xl bg-[#e5e1dc] border-2 border-black px-3 py-3 flex flex-col gap-1.5">
            {oooDetails[member.name]?.note && <p className="text-xs text-[#6b6560] font-medium">💬 {oooDetails[member.name].note}</p>}
            {oooDetails[member.name]?.backDate && <p className="text-xs text-[#6b6560] font-medium">📅 Back {oooDetails[member.name].backDate}</p>}
            <button onClick={() => toggleOOO(member.name)} className="text-sm text-black font-bold hover:underline cursor-pointer text-center mt-1">
              I&apos;m back fr ✌️
            </button>
          </div>
        ) : isSOS ? (
          <div className="w-full rounded-xl bg-[#e74c3c]/10 border-2 border-[#e74c3c]/30 px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-[#c0392b] animate-pulse">🔥 Burnt af. Send halp.</p>
            <button onClick={() => toggleSOS(member.name)} className="text-xs font-bold text-[#c0392b] border-2 border-[#e74c3c]/40 rounded-lg px-3 py-1.5 hover:bg-[#e74c3c]/10 cursor-pointer transition-colors whitespace-nowrap">
              I&apos;m OK now ✌️
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-3">
              <input
                type="range" min={0} max={100} value={localSlider ?? value}
                onMouseDown={() => { isDragging.current = true; setLocalSlider(value); }}
                onTouchStart={() => { isDragging.current = true; setLocalSlider(value); }}
                onMouseUp={() => { isDragging.current = false; if (localSlider !== null) { handleSliderChange(member.name, localSlider); setLocalSlider(null); } }}
                onTouchEnd={() => { isDragging.current = false; if (localSlider !== null) { handleSliderChange(member.name, localSlider); setLocalSlider(null); } }}
                onChange={(e) => setLocalSlider(Number(e.target.value))}
                style={getTrackStyle(localSlider ?? value, getLevel(localSlider ?? value))}
                className="flex-1"
              />
              <span className="text-xs font-extrabold px-2.5 py-1.5 rounded-lg bg-black text-white whitespace-nowrap min-w-[80px] text-center uppercase tracking-wide">
                {LABELS[getLevel(localSlider ?? value)]}
              </span>
            </div>
            <input
              type="text"
              placeholder="add a note… (heads down, in the zone, free to vibe)"
              value={editingNote}
              onChange={(e) => setEditingNote(e.target.value)}
              onBlur={() => saveNote(member.name, editingNote)}
              onPaste={(e) => e.preventDefault()}
              onKeyDown={(e) => { if (e.key === "Enter") { (e.target as HTMLInputElement).blur(); } }}
              className="w-full text-xs font-medium text-black bg-white border-[3px] border-black rounded-xl px-3 py-2 focus:outline-none placeholder:text-[#b5b0a8] mb-3"
              maxLength={200}
            />
            {/* Mood picker */}
            <div className="mb-3">
              <select
                value={moods[member.name] ?? ""}
                onChange={(e) => setMyMood(e.target.value)}
                className="w-full border-[3px] border-black rounded-xl px-3 py-2 text-xs font-extrabold bg-[#FFE234] text-black uppercase tracking-widest cursor-pointer focus:outline-none appearance-none shadow-[3px_3px_0_#000]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                <option value="" disabled>current mood...</option>
                {MOODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            {/* ADHD slider */}
            <div className="rounded-xl border-[3px] border-black px-3 py-2.5 mb-3" style={{ background: ADHD_COLORS[getAdhdLevel(adhdLevels[member.name] ?? 0)] }}>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-black/60 mb-1.5">adhd check</p>
              <div className="flex items-center gap-3">
                <input
                  type="range" min={0} max={100} value={localAdhd ?? adhdLevels[member.name] ?? 0}
                  onMouseDown={() => { isAdhdDragging.current = true; setLocalAdhd(adhdLevels[member.name] ?? 0); }}
                  onTouchStart={() => { isAdhdDragging.current = true; setLocalAdhd(adhdLevels[member.name] ?? 0); }}
                  onMouseUp={() => { isAdhdDragging.current = false; if (localAdhd !== null) { handleAdhdChange(member.name, localAdhd); setLocalAdhd(null); } }}
                  onTouchEnd={() => { isAdhdDragging.current = false; if (localAdhd !== null) { handleAdhdChange(member.name, localAdhd); setLocalAdhd(null); } }}
                  onChange={(e) => setLocalAdhd(Number(e.target.value))}
                  style={{ background: `linear-gradient(to right, rgba(0,0,0,0.3) ${localAdhd ?? adhdLevels[member.name] ?? 0}%, rgba(0,0,0,0.1) ${localAdhd ?? adhdLevels[member.name] ?? 0}%)` }}
                  className="flex-1"
                />
                <span className="text-xs font-extrabold text-black whitespace-nowrap">{ADHD_LABELS[getAdhdLevel(localAdhd ?? adhdLevels[member.name] ?? 0)]}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggleOOO(member.name)} className="flex-1 py-2 rounded-xl border-[3px] border-black bg-white text-sm text-black cursor-pointer transition-all font-bold hover:bg-[#FFE234] shadow-[3px_3px_0_#000]">
                👻 ghost
              </button>
              <button
                onClick={() => toggleMetcalf(member.name)}
                className={`flex-1 py-2 rounded-xl border-[3px] border-black text-sm font-bold cursor-pointer transition-all ${isMetcalf ? "bg-black text-white shadow-none" : "bg-white text-black hover:bg-black hover:text-white shadow-[3px_3px_0_#000]"}`}
              >
                🚗 metcalf
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => toggleNeedWork(member.name)}
                className={`flex-1 py-2 rounded-xl border-[3px] border-black text-sm font-bold cursor-pointer transition-all ${isNeedWork ? "bg-[#3D52F0] text-white shadow-none" : "bg-white text-black hover:bg-[#3D52F0] hover:text-white shadow-[3px_3px_0_#000]"}`}
              >
                📋 {isNeedWork ? "need work ✓" : "need work"}
              </button>
              <button
                onClick={() => toggleDontTalk(member.name)}
                className={`flex-1 py-2 rounded-xl border-[3px] border-black text-sm font-bold cursor-pointer transition-all ${isDontTalk ? "bg-[#e74c3c] text-white shadow-none" : "bg-white text-black hover:bg-[#e74c3c] hover:text-white shadow-[3px_3px_0_#000]"}`}
              >
                🚫 {isDontTalk ? "no talk ✓" : "no talk"}
              </button>
            </div>
            <button
              onClick={handleMoneyRequest}
              disabled={moneyRequestSent || moneyRequests.some((r) => r.name === currentUser)}
              className={`w-full py-2 rounded-xl border-[3px] border-black text-sm font-bold cursor-pointer transition-all mt-2 ${moneyRequestSent || moneyRequests.some((r) => r.name === currentUser) ? "bg-[#FFE234] text-black shadow-none opacity-70 cursor-default" : "bg-white text-black hover:bg-[#FFE234] shadow-[3px_3px_0_#000]"}`}
            >
              {moneyRequestSent || moneyRequests.some((r) => r.name === currentUser) ? "sent ✓" : "i need 💰"}
            </button>
            <button
              onClick={() => toggleMeds(member.name)}
              className={`w-full py-2 rounded-xl border-[3px] border-black text-sm font-bold cursor-pointer transition-all mt-2 ${isMeds ? "bg-[#a8f5c8] text-black shadow-none" : "bg-white text-black hover:bg-[#a8f5c8] shadow-[3px_3px_0_#000]"}`}
            >
              💊 {isMeds ? "meds taken ✓" : "took my meds"}
            </button>
            <button
              onClick={() => toggleBodyDouble(member.name)}
              className={`w-full py-2 rounded-xl border-[3px] border-black text-sm font-bold cursor-pointer transition-all mt-2 ${isBodyDouble ? "bg-[#dbb8ff] text-black shadow-none" : "bg-white text-black hover:bg-[#dbb8ff] shadow-[3px_3px_0_#000]"}`}
            >
              🧠 {isBodyDouble ? "body doubling ✓" : "body doubling"}
            </button>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => toggleHotCold(member.name, hotCold === "hot" ? null : "hot")}
                className={`flex-1 py-2 rounded-xl border-[3px] border-black text-sm font-extrabold cursor-pointer transition-all ${hotCold === "hot" ? "text-white shadow-none" : "bg-white text-black hover:opacity-90 shadow-[3px_3px_0_#000]"}`}
                style={{ background: hotCold === "hot" ? "#FF4444" : undefined }}
              >🔥 {hotCold === "hot" ? "running hot ✓" : "running hot"}</button>
              <button
                onClick={() => toggleHotCold(member.name, hotCold === "cold" ? null : "cold")}
                className={`flex-1 py-2 rounded-xl border-[3px] border-black text-sm font-extrabold cursor-pointer transition-all ${hotCold === "cold" ? "shadow-none" : "bg-white text-black hover:opacity-90 shadow-[3px_3px_0_#000]"}`}
                style={{ background: hotCold === "cold" ? "#b8e0ff" : undefined }}
              >🧊 {hotCold === "cold" ? "ice cold ✓" : "ice cold"}</button>
            </div>
          </>
        )}
        {isMetcalf && member.name !== currentUser && (
          <div className="w-full rounded-xl bg-black px-4 py-2.5 flex items-center gap-2 mt-1">
            <span className="text-lg">🚗</span>
            <p className="text-sm font-bold text-white">catch me on metcalf</p>
          </div>
        )}
        {/* Incoming touch grass */}
        {touchGrass.filter((p) => p.to === member.name).length > 0 && (
          <div className="flex flex-col gap-1.5 mt-2">
            {touchGrass.filter((p) => p.to === member.name).map((tg) => (
              <div key={tg.from} className="flex items-center gap-2 bg-[#a8f5c8] border-[2px] border-black rounded-xl px-3 py-2 shadow-[2px_2px_0_#000] animate-pop-in">
                <span className="text-base">🌿</span>
                <span className="text-xs font-bold flex-1">{tg.from} says touch grass</span>
                <button
                  onClick={() => dismissTouchGrass(tg.from)}
                  className="w-5 h-5 rounded-full bg-black/10 hover:bg-black hover:text-white text-black text-[10px] font-bold flex items-center justify-center transition-colors cursor-pointer"
                >✕</button>
              </div>
            ))}
          </div>
        )}
        {/* Incoming pokes */}
        {pokes.filter((p) => p.to === member.name).length > 0 && (
          <div className="flex flex-col gap-1.5 mt-2">
            {pokes.filter((p) => p.to === member.name).map((poke) => (
              <div key={poke.from} className="flex items-center gap-2 bg-[#FFE234] border-[2px] border-black rounded-xl px-3 py-2 shadow-[2px_2px_0_#000] animate-pop-in">
                <span className="text-base">👉</span>
                <span className="text-xs font-bold flex-1">{poke.from} poked you!</span>
                <button
                  onClick={() => { sendPoke(poke.from); dismissPoke(poke.from); }}
                  className="text-[10px] font-bold bg-white border-[2px] border-black rounded-lg px-2 py-1 cursor-pointer hover:bg-black hover:text-white transition-colors"
                >poke back</button>
                <button
                  onClick={() => dismissPoke(poke.from)}
                  className="w-5 h-5 rounded-full bg-black/10 hover:bg-black hover:text-white text-black text-[10px] font-bold flex items-center justify-center transition-colors cursor-pointer"
                >✕</button>
              </div>
            ))}
          </div>
        )}
        {/* Meeting button */}
        {currentUser && !isGuest && (
          <div className="mt-2">
            <button
              onClick={() => meetings[currentUser] ? setMeeting(null) : setShowMeetingPicker(true)}
              className={`w-full py-2 rounded-xl border-[3px] border-black text-xs font-extrabold uppercase tracking-widest shadow-[3px_3px_0_#000] cursor-pointer transition-all ${meetings[currentUser] ? "bg-[#FF9DC8] hover:bg-white" : "bg-white hover:bg-[#FF9DC8]"}`}
            >{meetings[currentUser] ? `📅 ${formatCountdown(meetings[currentUser])}` : "📅 in a meeting"}</button>
          </div>
        )}
        {(currentUser === BOSS || CO_ADMINS.includes(currentUser ?? "")) && (
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => { setTakeoverDraft(takeover ?? ""); setShowTakeoverCompose(true); }}
              className="flex-1 py-2 rounded-xl border-[3px] border-black bg-black text-white text-xs font-extrabold uppercase tracking-widest shadow-[3px_3px_0_#FFE234] hover:bg-[#FFE234] hover:text-black transition-all cursor-pointer"
            >📣 screen takeover</button>
            {takeover && (
              <button
                onClick={async () => { setTakeover(null); await fetch("/api/takeover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "" }) }); }}
                className="px-3 py-2 rounded-xl border-[3px] border-black bg-white text-xs font-extrabold shadow-[3px_3px_0_#000] hover:bg-red-100 transition-colors cursor-pointer"
              >✕ end</button>
            )}
          </div>
        )}
        {!isGuest && (
          <div className="flex items-center gap-1.5 mt-2">
            <input
              type="text"
              placeholder="drop the tea… 🍵"
              value={newMessage[member.name] ?? ""}
              onChange={(e) => setNewMessage((prev) => ({ ...prev, [member.name]: e.target.value }))}
              onPaste={(e) => e.preventDefault()}
              onKeyDown={(e) => { if (e.key === "Enter") postMessage(member.name); }}
              maxLength={200}
              className="flex-1 px-3 py-1.5 rounded-xl border-[2px] border-black bg-white text-xs font-medium placeholder:text-black/30 focus:outline-none shadow-[2px_2px_0_#000] min-w-0"
            />
            <button
              onClick={() => postMessage(member.name)}
              disabled={!(newMessage[member.name] ?? "").trim()}
              className="shrink-0 px-2.5 py-1.5 rounded-xl border-[2px] border-black bg-[#FFE234] text-xs font-extrabold shadow-[2px_2px_0_#000] hover:bg-[#FF9DC8] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
            >✦</button>
          </div>
        )}
      </div>{/* end stopPropagation wrapper */}
    </div>
  );
}
