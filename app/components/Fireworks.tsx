"use client";

import { useEffect, useRef } from "react";

const COLORS = [
  "#FF9DC8", "#FFE234", "#39FF14", "#3D52F0",
  "#e74c3c", "#a78bfa", "#fb923c", "#60a5fa",
  "#f472b6", "#4ade80", "#fff", "#facc15",
];

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  alpha: number; decay: number;
  color: string; size: number;
}

interface Rocket {
  x: number; y: number;
  vx: number; vy: number;
  color: string;
  trail: { x: number; y: number }[];
}

export default function Fireworks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: Particle[] = [];
    const rockets: Rocket[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const launch = () => {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const x = canvas.width * 0.15 + Math.random() * canvas.width * 0.7;
      const ty = canvas.height * 0.1 + Math.random() * canvas.height * 0.35;
      const dx = x - canvas.width / 2;
      const dy = ty - canvas.height;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = 14 + Math.random() * 5;
      rockets.push({ x: canvas.width / 2 + (Math.random() - 0.5) * 200, y: canvas.height, vx: (dx / dist) * speed, vy: (dy / dist) * speed, color, trail: [] });
    };

    const explode = (x: number, y: number, color: string) => {
      const count = 90 + Math.floor(Math.random() * 40);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const speed = 1.5 + Math.random() * 5.5;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          decay: 0.013 + Math.random() * 0.012,
          color: Math.random() < 0.25 ? COLORS[Math.floor(Math.random() * COLORS.length)] : color,
          size: 1.5 + Math.random() * 2.5,
        });
      }
    };

    const interval = setInterval(launch, 750);

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.trail.push({ x: r.x, y: r.y });
        if (r.trail.length > 14) r.trail.shift();
        r.x += r.vx;
        r.y += r.vy;
        r.vy += 0.18;

        // Trail
        for (let t = 0; t < r.trail.length; t++) {
          const a = (t / r.trail.length) * 0.7;
          ctx.globalAlpha = a;
          ctx.fillStyle = r.color;
          ctx.beginPath();
          ctx.arc(r.trail[t].x, r.trail[t].y, 2.5 * (t / r.trail.length), 0, Math.PI * 2);
          ctx.fill();
        }

        // Head glow
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 10;
        ctx.shadowColor = r.color;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Explode at apex
        if (r.vy >= -0.5) {
          explode(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += 0.07;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) { particles.splice(i, 1); continue; }

        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = p.alpha > 0.6 ? 6 : 0;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(tick);
    };

    tick();
    return () => {
      cancelAnimationFrame(animId);
      clearInterval(interval);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[55] pointer-events-none" />;
}
