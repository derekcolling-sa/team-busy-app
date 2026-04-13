"use client";

import { useState } from "react";
import { timeAgo } from "@/app/lib/constants";

interface Feature {
  ts: number;
  message: string;
  status?: string;
  name?: string;
  shippedAt: number;
}

interface Props {
  shippedFeatures: Feature[];
}

export default function FeatureUpdates({ shippedFeatures }: Props) {
  const [featureUpdatesOpen, setFeatureUpdatesOpen] = useState(false);
  const [featureUpdatesPage, setFeatureUpdatesPage] = useState(0);

  if (!shippedFeatures.length) return null;

  const PAGE_SIZE = 5;
  const totalPages = Math.ceil(shippedFeatures.length / PAGE_SIZE);
  const page = Math.min(featureUpdatesPage, totalPages - 1);
  const visible = shippedFeatures.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="mb-6 rounded-[1.4rem] border-[4px] border-black shadow-[6px_6px_0_#000] bg-white overflow-hidden">
      <button
        onClick={() => setFeatureUpdatesOpen((v) => !v)}
        className="w-full px-5 py-2.5 border-b-[3px] border-black bg-[#39FF14] flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
      >
        <span className="text-base">📋</span>
        <h2 className="text-sm font-extrabold tracking-tight flex-1 text-left" style={{ fontFamily: "var(--font-display)" }}>feature updates</h2>
        <span className="text-[10px] font-bold bg-black text-[#39FF14] px-2 py-0.5 rounded-full">{shippedFeatures.length}</span>
        <span className="text-lg font-bold text-black/60 ml-1">{featureUpdatesOpen ? "▴" : "▾"}</span>
      </button>
      {featureUpdatesOpen && (
        <>
          <div className="divide-y-[2px] divide-black/10">
            {visible.map((f) => (
              <div key={f.ts} className="px-4 py-2.5 flex items-center gap-3">
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-extrabold border-2 border-black ${f.status === "done" ? "bg-[#4a9eff] text-white" : f.status === "dumb" ? "bg-[#ff4d4d] text-white" : f.status === "soon" ? "bg-[#FFE234] text-black" : "bg-[#39FF14] text-black"}`}>
                  {f.status === "done" ? "✓ done" : f.status === "dumb" ? "🙅 dumb" : f.status === "soon" ? "⏳ soon" : "🚀 shipped"}
                </span>
                <p className="flex-1 text-sm font-medium text-black min-w-0 truncate">{f.message}</p>
                {f.name && <span className="text-[10px] text-black/40 font-bold shrink-0">{f.name}</span>}
                <span className="text-[10px] text-black/30 shrink-0">{timeAgo(f.shippedAt)}</span>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="px-4 py-2 border-t-[2px] border-black/10 flex items-center justify-between">
              <button
                onClick={() => setFeatureUpdatesPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="text-[11px] font-bold text-black/40 hover:text-black disabled:opacity-30 cursor-pointer transition-colors"
              >← prev</button>
              <span className="text-[10px] text-black/30 font-bold">{page + 1} / {totalPages}</span>
              <button
                onClick={() => setFeatureUpdatesPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="text-[11px] font-bold text-black/40 hover:text-black disabled:opacity-30 cursor-pointer transition-colors"
              >next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
