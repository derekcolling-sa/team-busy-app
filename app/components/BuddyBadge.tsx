"use client";

import { getBuddyById, getBuddyImagePath, RARITY_STYLES } from "@/lib/buddies";

export default function BuddyBadge({ buddyId }: { buddyId: string }) {
  const buddy = getBuddyById(buddyId);
  if (!buddy) return null;
  const styles = RARITY_STYLES[buddy.rarity];
  return (
    <div className="flex flex-col items-center" title={`${buddy.name} — ${buddy.tagline}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={getBuddyImagePath(buddy)} alt={buddy.name} className="w-10 h-10 object-contain" />
      <span className="text-[9px] font-black uppercase tracking-widest mt-0.5" style={{ color: styles.text === "#ffffff" ? "#3D52F0" : "#1a1a1a" }}>{buddy.name}</span>
    </div>
  );
}
