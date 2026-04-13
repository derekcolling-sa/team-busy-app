"use client";

import Image from "next/image";
import { MEMBERS } from "@/app/lib/constants";

interface Props {
  showPicker: boolean;
  photoOverrides: Record<string, string>;
  pickUser: (name: string) => void;
}

export default function IdentityPicker({ showPicker, photoOverrides, pickUser }: Props) {
  if (!showPicker) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="animate-bounce-in bg-white border-[4px] border-black rounded-[1.6rem] shadow-[7px_7px_0_#000] p-8 max-w-[420px] w-[92%]">
        <div className="text-center mb-7">
          <div className="text-5xl mb-3">👋</div>
          <h2 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Who dis?</h2>
          <p className="text-sm text-[#b5b0a8] mt-1 font-medium">pick yourself bestie</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {MEMBERS.map((member) => (
            <button
              key={member.name}
              onClick={() => pickUser(member.name)}
              className="hover-wiggle flex items-center gap-3 px-4 py-3.5 border-[3px] border-black rounded-2xl bg-white hover:bg-[#FFE234] hover:shadow-[3px_3px_0_#000] transition-all cursor-pointer text-[15px] font-bold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <Image
                src={photoOverrides[member.name] ?? member.photo}
                alt={member.name} width={42} height={42}
                className="rounded-full object-cover w-[42px] h-[42px] border-2 border-black"
              />
              {member.name}
            </button>
          ))}
        </div>
        <button
          onClick={() => pickUser("__guest__")}
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 border-[3px] border-dashed border-black rounded-2xl bg-white hover:bg-[#f7f7f5] transition-all cursor-pointer text-sm font-bold text-[#b5b0a8] hover:text-black"
        >
          👀 just looking (guest mode)
        </button>
      </div>
    </div>
  );
}
