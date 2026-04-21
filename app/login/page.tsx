"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const submit = async () => {
    if (!password.trim()) return;
    setLoading(true);
    setError(false);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: password.trim() }),
    });
    if (res.ok) {
      router.push("/");
    } else {
      setError(true);
      setLoading(false);
      setPassword("");
      inputRef.current?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#3a35d6" }}>
      <div className="w-full max-w-sm">
        <div className="rounded-[1.6rem] border-[4px] border-black bg-white shadow-[8px_8px_0_#000] overflow-hidden">
          <div className="px-6 py-5 bg-black border-b-[4px] border-black text-center">
            <p className="text-3xl font-extrabold text-[#FFE234] tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              someone cooked here
            </p>
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest mt-1">team busy app</p>
          </div>
          <div className="px-6 py-6 flex flex-col gap-4">
            <div>
              <label className="text-xs font-extrabold uppercase tracking-widest text-black/40 block mb-1.5">Password</label>
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="enter password..."
                autoFocus
                className={`w-full px-4 py-3 rounded-xl border-[3px] font-bold text-base focus:outline-none transition-colors ${error ? "border-[#e74c3c] bg-[#fff0f0]" : "border-black bg-white"}`}
              />
              {error && (
                <p className="text-xs font-bold text-[#e74c3c] mt-1.5">wrong password bestie 💀</p>
              )}
            </div>
            <button
              onClick={submit}
              disabled={loading || !password.trim()}
              className="w-full py-3 rounded-xl border-[3px] border-black bg-[#FFE234] text-black font-extrabold text-sm uppercase tracking-widest shadow-[4px_4px_0_#000] cursor-pointer hover:bg-black hover:text-[#FFE234] transition-colors disabled:opacity-40 disabled:cursor-default"
            >
              {loading ? "checking..." : "let me in 🚪"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
