"use client";

interface Props {
  showMeetingPicker: boolean;
  setShowMeetingPicker: (v: boolean) => void;
  setMeeting: (min: number | null) => void;
}

export default function MeetingPickerModal({ showMeetingPicker, setShowMeetingPicker, setMeeting }: Props) {
  if (!showMeetingPicker) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white border-[4px] border-black rounded-[1.6rem] shadow-[7px_7px_0_#000] p-8 max-w-[380px] w-[92%] flex flex-col gap-4">
        <h2 className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-display)" }}>📅 how long?</h2>
        <div className="grid grid-cols-2 gap-3">
          {[15, 30, 45, 60].map((min) => (
            <button
              key={min}
              onClick={() => setMeeting(min)}
              className="py-4 rounded-xl border-[3px] border-black bg-white hover:bg-[#FF9DC8] font-extrabold text-lg shadow-[3px_3px_0_#000] active:shadow-none active:translate-y-[2px] transition-all cursor-pointer"
            >{min} min</button>
          ))}
        </div>
        <button onClick={() => setShowMeetingPicker(false)} className="text-sm text-black/40 hover:text-black transition-colors cursor-pointer">cancel</button>
      </div>
    </div>
  );
}
