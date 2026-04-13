"use client";

interface Props {
  brainRot: boolean;
  brainRotVideoId: string;
  setBrainRot: (v: boolean) => void;
}

export default function BrainRotOverlay({ brainRot, brainRotVideoId, setBrainRot }: Props) {
  if (!brainRot) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
      <iframe
        src={`https://www.youtube.com/embed/${brainRotVideoId}?autoplay=1&loop=1&playlist=${brainRotVideoId}&controls=0&modestbranding=1`}
        className="w-full h-full"
        allow="autoplay; fullscreen"
        allowFullScreen
      />
      <button
        onClick={() => setBrainRot(false)}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/70 border-[2px] border-white text-white text-xl font-bold flex items-center justify-center hover:bg-black cursor-pointer"
      >✕</button>
    </div>
  );
}
