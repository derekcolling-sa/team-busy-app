"use client";

import { useRef, useState } from "react";

interface Props {
  vibeVideoId: string;
}

export default function VibeMusic({ vibeVideoId }: Props) {
  const vibeIframeRef = useRef<HTMLIFrameElement>(null);
  const [vibeMuted, setVibeMuted] = useState(true);

  return (
    <div className="mt-8 border-[3px] border-black rounded-[1.4rem] shadow-[5px_5px_0_#000] overflow-hidden bg-black">
      <div className="relative w-full" style={{ height: "min(85vh, 560px)" }}>
        <iframe
          ref={vibeIframeRef}
          src={`https://www.youtube.com/embed/${vibeVideoId}?autoplay=1&mute=1&loop=1&playlist=${vibeVideoId}&controls=0&modestbranding=1&rel=0&enablejsapi=1&start=4`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "max(100%, calc(min(85vh, 560px) * 16 / 9))",
            height: "max(100%, calc(100% * 9 / 16))",
            border: "none",
          }}
        />
        <button
          onClick={() => {
            const cmd = vibeMuted ? "unMute" : "mute";
            vibeIframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: cmd, args: [] }), "https://www.youtube.com");
            setVibeMuted(!vibeMuted);
          }}
          style={{
            position: "absolute",
            bottom: "16px",
            right: "16px",
            zIndex: 10,
            background: "rgba(0,0,0,0.6)",
            border: "2px solid rgba(255,255,255,0.4)",
            borderRadius: "999px",
            padding: "8px 16px",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 800,
            cursor: "pointer",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {vibeMuted ? "🔇 unmute" : "🔊 mute"}
        </button>
      </div>
    </div>
  );
}
