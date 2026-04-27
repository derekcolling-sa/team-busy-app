"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── Constants ────────────────────────────────────────────────────────────────

const CELL = 58;
const COLS = 11;
const ROWS = 7;
const GW = COLS * CELL;  // 638
const GH = ROWS * CELL;  // 406

// Row layout top→bottom (row 0 = top goal, row 6 = bottom start):
// 0  goal  — safe (green)
// 1  road  — cars go LEFT ←
// 2  road  — cars go LEFT ←
// 3  median — safe (green)
// 4  road  — cars go RIGHT →
// 5  road  — cars go RIGHT →
// 6  start — safe (green)

const DIR: Record<number, number> = { 1: -1, 2: -1, 4: 1, 5: 1 };
const SAFE = new Set([0, 3, 6]);
const ROAD_ROWS = [1, 2, 4, 5];

const CAR_COLORS = ['#FFE234', '#FF9DC8', '#e74c3c', '#3D52F0', '#FF6B35', '#a855f7', '#22d3ee', '#4ade80'];

interface Car { x: number; w: number; spd: number; color: string; row: number; }

const LEVELS = [
  { spds: [1.1, 0.9, 1.0, 0.85], cnt: [2, 2, 2, 2], name: "Rush Hour Warm-Up 🚗" },
  { spds: [1.7, 1.5, 1.6, 1.4],  cnt: [3, 2, 2, 3], name: "Getting Spicy 🌶️" },
  { spds: [2.4, 2.0, 2.2, 1.9],  cnt: [3, 3, 3, 3], name: "Friday Afternoon 😤" },
  { spds: [3.1, 2.7, 2.9, 2.5],  cnt: [4, 3, 3, 4], name: "5:01 PM 🏃‍♀️" },
  { spds: [4.4, 3.7, 4.1, 3.5],  cnt: [4, 4, 4, 4], name: "Metcalf at Rush Hour 💀" },
];

function spawnCars(level: number): Car[] {
  const cfg = LEVELS[level - 1];
  const cars: Car[] = [];
  ROAD_ROWS.forEach((row, li) => {
    const dir = DIR[row];
    const count = cfg.cnt[li];
    const spread = GW + 280;
    const stride = spread / count;
    for (let i = 0; i < count; i++) {
      const w = CELL * (1.3 + Math.random() * 0.85);
      const jitter = Math.random() * 50;
      const x = dir === 1 ? -(i * stride + w + jitter) : GW + i * stride + jitter;
      cars.push({ x, w, spd: cfg.spds[li] + Math.random() * 0.35, color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)], row });
    }
  });
  return cars;
}

// ── Draw helpers ─────────────────────────────────────────────────────────────

function drawScene(ctx: CanvasRenderingContext2D) {
  // Row fills
  const rowFill = ['#1a5c2a', '#1c1c22', '#1c1c22', '#206630', '#1c1c22', '#1c1c22', '#1a5c2a'];
  for (let r = 0; r < ROWS; r++) {
    ctx.fillStyle = rowFill[r];
    ctx.fillRect(0, r * CELL, GW, CELL);
  }

  // Grass checkerboard on safe rows
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  [0, 3, 6].forEach(r => {
    for (let c = 0; c < COLS; c++) {
      if ((c + r) % 2 === 0) ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
    }
  });

  // Lane markings
  ctx.save();
  // Yellow dashes between same-direction lanes
  ctx.strokeStyle = '#FFE234';
  ctx.lineWidth = 3;
  ctx.setLineDash([18, 14]);
  [2, 5].forEach(r => {
    ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(GW, r * CELL); ctx.stroke();
  });

  // White edge lines
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2;
  ctx.setLineDash([14, 20]);
  [1, 3, 4, 6].forEach(r => {
    ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(GW, r * CELL); ctx.stroke();
  });
  ctx.restore();

  // Goal zone highlight
  ctx.fillStyle = 'rgba(255,226,52,0.18)';
  ctx.fillRect(0, 0, GW, CELL);
  ctx.fillStyle = '#FFE234';
  ctx.font = `bold ${CELL * 0.22}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🏠  MADE IT — GET ACROSS  🏠', GW / 2, CELL / 2);

  // Direction arrows on road (subtle)
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.font = `bold ${CELL * 0.32}px monospace`;
  ctx.textAlign = 'center';
  for (let c = 1; c < COLS; c += 3) {
    ctx.fillText('←', c * CELL + CELL / 2, 1.5 * CELL);
    ctx.fillText('←', c * CELL + CELL / 2, 2.5 * CELL);
    ctx.fillText('→', c * CELL + CELL / 2, 4.5 * CELL);
    ctx.fillText('→', c * CELL + CELL / 2, 5.5 * CELL);
  }
}

function drawCar(ctx: CanvasRenderingContext2D, car: Car) {
  const dir = DIR[car.row];
  const carH = CELL * 0.66;
  const carY = car.row * CELL + (CELL - carH) / 2;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(car.x + 3, carY + 4, car.w, carH, 5);
  else ctx.rect(car.x + 3, carY + 4, car.w, carH);
  ctx.fill();

  // Body
  ctx.fillStyle = car.color;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(car.x, carY, car.w, carH, 7);
  else ctx.rect(car.x, carY, car.w, carH);
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Roof
  const roofX = car.x + car.w * 0.22;
  const roofW = car.w * 0.56;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(roofX, carY + 4, roofW, carH - 8, 4);
  else ctx.rect(roofX, carY + 4, roofW, carH - 8);
  ctx.fill();

  // Headlights (front) + taillights (back)
  const frontX = dir === 1 ? car.x + car.w - 5 : car.x + 4;
  const backX  = dir === 1 ? car.x + 4 : car.x + car.w - 5;
  ctx.fillStyle = '#fffde0';
  [carY + 7, carY + carH - 7].forEach(ly => {
    ctx.beginPath(); ctx.arc(frontX, ly, 3.5, 0, Math.PI * 2); ctx.fill();
  });
  ctx.fillStyle = '#e74c3c';
  [carY + 7, carY + carH - 7].forEach(ly => {
    ctx.beginPath(); ctx.arc(backX, ly, 3, 0, Math.PI * 2); ctx.fill();
  });

  // Wheels
  const wheelY = carY + carH + 3;
  ctx.fillStyle = '#111';
  [car.x + 9, car.x + car.w - 9].forEach(wx => {
    ctx.beginPath(); ctx.arc(wx, wheelY, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5; ctx.stroke();
  });
}

function drawPlayer(ctx: CanvasRenderingContext2D, col: number, row: number, flash: number) {
  if (flash > 0 && Math.floor(flash / 5) % 2 === 0) return;
  const cx = col * CELL + CELL / 2;
  const cy = row * CELL + CELL / 2 + 2;
  ctx.font = `${CELL * 0.78}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🧍‍♀️', cx, cy);
}

// ── Component ────────────────────────────────────────────────────────────────

type Status = 'idle' | 'playing' | 'levelup' | 'win' | 'gameover';

interface GState {
  player: { col: number; row: number };
  cars: Car[];
  lives: number;
  level: number;
  score: number;
  flash: number;
  pauseTimer: number;
  status: Status;
}

function initState(level = 1, lives = 3, score = 0): GState {
  return {
    player: { col: Math.floor(COLS / 2), row: 6 },
    cars: spawnCars(level),
    lives, level, score,
    flash: 0, pauseTimer: 0,
    status: 'playing',
  };
}

export default function MetcalfGame() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef = useRef<GState>({ player: { col: 5, row: 6 }, cars: [], lives: 3, level: 1, score: 0, flash: 0, pauseTimer: 0, status: 'idle' });
  const rafRef = useRef<number>(0);
  const lastTsRef = useRef<number>(0);

  const [ui, setUi] = useState({ status: 'idle' as Status, lives: 3, level: 1, score: 0, levelName: LEVELS[0].name });

  const syncUi = useCallback(() => {
    const g = gsRef.current;
    setUi({ status: g.status, lives: g.lives, level: g.level, score: g.score, levelName: LEVELS[g.level - 1].name });
  }, []);

  const startLevel = useCallback((level: number, lives: number, score: number) => {
    gsRef.current = initState(level, lives, score);
    syncUi();
  }, [syncUi]);

  const startGame = useCallback(() => startLevel(1, 3, 0), [startLevel]);

  // Keyboard input
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { router.push('/'); return; }
      const g = gsRef.current;
      const nav = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d',' ','Enter'];
      if (!nav.includes(e.key)) return;
      e.preventDefault();

      if (g.status === 'idle' || g.status === 'gameover' || g.status === 'win') {
        startGame(); return;
      }
      if (g.status === 'levelup') {
        startLevel(g.level, g.lives, g.score); return;
      }
      if (g.status !== 'playing' || g.pauseTimer > 0) return;

      let { col, row } = g.player;
      switch (e.key) {
        case 'ArrowUp':    case 'w': row = Math.max(0, row - 1); break;
        case 'ArrowDown':  case 's': row = Math.min(6, row + 1); break;
        case 'ArrowLeft':  case 'a': col = Math.max(0, col - 1); break;
        case 'ArrowRight': case 'd': col = Math.min(COLS - 1, col + 1); break;
        default: return;
      }
      g.player = { col, row };

      if (row === 0) {
        g.score += 100 * g.level;
        if (g.level >= 5) { g.status = 'win'; }
        else { g.status = 'levelup'; g.level += 1; }
        syncUi();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [startGame, startLevel, syncUi, router]);

  // Touch button handler
  const move = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    const g = gsRef.current;
    if (g.status === 'idle' || g.status === 'gameover' || g.status === 'win') { startGame(); return; }
    if (g.status === 'levelup') { startLevel(g.level, g.lives, g.score); return; }
    if (g.status !== 'playing' || g.pauseTimer > 0) return;
    let { col, row } = g.player;
    if (dir === 'up')    row = Math.max(0, row - 1);
    if (dir === 'down')  row = Math.min(6, row + 1);
    if (dir === 'left')  col = Math.max(0, col - 1);
    if (dir === 'right') col = Math.min(COLS - 1, col + 1);
    g.player = { col, row };
    if (row === 0) {
      g.score += 100 * g.level;
      if (g.level >= 5) { g.status = 'win'; }
      else { g.status = 'levelup'; g.level += 1; }
      syncUi();
    }
  }, [startGame, startLevel, syncUi]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = GW * dpr;
    canvas.height = GH * dpr;
    canvas.style.width = GW + 'px';
    canvas.style.height = GH + 'px';
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    let alive = true;

    const loop = (ts: number) => {
      if (!alive) return;
      rafRef.current = requestAnimationFrame(loop);
      const dt = Math.min(ts - (lastTsRef.current || ts), 50);
      lastTsRef.current = ts;

      const g = gsRef.current;

      // Move cars every frame regardless of status
      if (g.status === 'playing' || g.status === 'levelup' || g.status === 'win' || g.status === 'gameover') {
        g.cars.forEach(car => {
          const dir = DIR[car.row];
          car.x += car.spd * dir * (dt / 16);
          if (dir === 1 && car.x > GW + 10) car.x = -car.w - 10;
          if (dir === -1 && car.x + car.w < -10) car.x = GW + 10;
        });
      }

      // Timers
      if (g.flash > 0) g.flash--;
      if (g.pauseTimer > 0) {
        g.pauseTimer--;
        if (g.pauseTimer === 0) g.player = { col: Math.floor(COLS / 2), row: 6 };
      }

      // Collision (only while actively playing + not paused + on road)
      if (g.status === 'playing' && g.pauseTimer === 0 && !SAFE.has(g.player.row)) {
        const PAD = 10;
        const px1 = g.player.col * CELL + PAD;
        const px2 = px1 + CELL - PAD * 2;
        const py1 = g.player.row * CELL + PAD;
        const py2 = py1 + CELL - PAD * 2;
        for (const car of g.cars) {
          if (car.row !== g.player.row) continue;
          const cy1 = car.row * CELL + PAD;
          const cy2 = cy1 + CELL - PAD * 2;
          if (px1 < car.x + car.w && px2 > car.x && py1 < cy2 && py2 > cy1) {
            g.lives -= 1;
            g.flash = 50;
            if (g.lives <= 0) { g.status = 'gameover'; syncUi(); }
            else { g.pauseTimer = 70; syncUi(); }
            break;
          }
        }
      }

      // Draw
      ctx.clearRect(0, 0, GW, GH);
      drawScene(ctx);
      g.cars.forEach(car => drawCar(ctx, car));
      if (g.status === 'playing') drawPlayer(ctx, g.player.col, g.player.row, g.flash);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(rafRef.current); };
  }, [syncUi]);

  const lives = Array.from({ length: Math.max(0, ui.lives) });

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-start pt-6 pb-16 px-4">

      {/* Header */}
      <div style={{ width: GW }} className="mb-3 flex items-start justify-between gap-4">
        <div>
          <Link href="/" className="text-[10px] font-extrabold uppercase tracking-widest text-white/30 hover:text-white transition-colors">← back to the app</Link>
          <h1 className="text-4xl sm:text-5xl font-black text-[#FFE234] mt-1 leading-none" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
            Meet Me On Metcalf
          </h1>
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">get across the road · don't get cooked</p>
        </div>
        <Link href="/" className="shrink-0 mt-1 w-10 h-10 rounded-xl border-[3px] border-white/20 bg-white/5 text-white/50 font-black text-lg flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors" title="Close (Esc)">✕</Link>
      </div>

      {/* HUD */}
      <div style={{ width: GW }} className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/30">Lives</span>
          <span className="text-xl leading-none">{lives.map((_, i) => <span key={i}>❤️</span>)}</span>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-[2px] border-[#FFE234]/60 text-[10px] font-extrabold text-[#FFE234] uppercase tracking-widest">
          Lv {ui.level} — {ui.levelName}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/30">Score</span>
          <span className="text-lg font-black text-white tabular-nums">{ui.score}</span>
        </div>
      </div>

      {/* Canvas + overlays */}
      <div className="relative rounded-xl overflow-hidden border-[3px] border-[#FFE234] shadow-[0_0_40px_rgba(255,226,52,0.15)]" style={{ width: GW, height: GH }}>
        <canvas ref={canvasRef} className="block" />

        {/* IDLE */}
        {ui.status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-5">
            <p className="text-6xl">🧍‍♀️🚗💨</p>
            <div className="text-center px-8">
              <p className="text-3xl font-black text-[#FFE234]" style={{ fontFamily: 'var(--font-display)' }}>Meet Me On Metcalf</p>
              <p className="text-sm text-white/60 font-bold mt-1">try to get hit · avoid getting to work</p>
            </div>
            <p className="text-xs text-white/40 font-bold">Arrow keys / WASD to move</p>
            <button onClick={startGame} className="px-8 py-3 rounded-xl border-[3px] border-black bg-[#FFE234] text-black font-extrabold text-sm uppercase tracking-widest shadow-[4px_4px_0_#000] cursor-pointer hover:scale-105 transition-transform active:scale-95">
              Let's Go 🏃‍♀️
            </button>
          </div>
        )}

        {/* LEVEL UP */}
        {ui.status === 'levelup' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4">
            <p className="text-5xl">😭</p>
            <p className="text-3xl font-black text-[#e74c3c]" style={{ fontFamily: 'var(--font-display)' }}>NOOOOOOOOOO</p>
            <p className="text-sm text-white/60 font-bold">she made it... unfortunately</p>
            <p className="text-sm font-extrabold text-[#FFE234] uppercase tracking-widest">Level {ui.level} — {ui.levelName}</p>
            <button onClick={() => startLevel(ui.level, ui.lives, ui.score)} className="mt-1 px-8 py-3 rounded-xl border-[3px] border-black bg-[#e74c3c] text-white font-extrabold text-sm uppercase tracking-widest shadow-[4px_4px_0_#000] cursor-pointer hover:scale-105 transition-transform active:scale-95">
              keep going 😭
            </button>
          </div>
        )}

        {/* WIN */}
        {ui.status === 'win' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 gap-4">
            <p className="text-6xl">😭😭😭</p>
            <p className="text-3xl font-black text-[#e74c3c]" style={{ fontFamily: 'var(--font-display)' }}>NOOOOOOOOOOOOO</p>
            <p className="text-sm text-white/60 font-bold">she made it all the way to work. rip bestie.</p>
            <p className="text-2xl font-black text-white">Score: {ui.score}</p>
            <button onClick={startGame} className="mt-1 px-8 py-3 rounded-xl border-[3px] border-black bg-[#e74c3c] text-white font-extrabold text-sm uppercase tracking-widest shadow-[4px_4px_0_#000] cursor-pointer hover:scale-105 transition-transform active:scale-95">
              try to get hit this time
            </button>
          </div>
        )}

        {/* GAME OVER */}
        {ui.status === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 gap-4">
            <p className="text-5xl animate-bounce">✨</p>
            <p className="text-3xl font-black text-[#39FF14]" style={{ fontFamily: 'var(--font-display)' }}>omg yasss bestie</p>
            <p className="text-xs text-white/50 font-bold uppercase tracking-widest">she understood the assignment 💅</p>
            <p className="text-2xl font-black text-white">Score: {ui.score}</p>
            <button onClick={startGame} className="mt-1 px-8 py-3 rounded-xl border-[3px] border-black bg-[#39FF14] text-black font-extrabold text-sm uppercase tracking-widest shadow-[4px_4px_0_#000] cursor-pointer hover:scale-105 transition-transform active:scale-95">
              try again 💅
            </button>
          </div>
        )}
      </div>

      {/* Mobile touch controls */}
      <div className="mt-5 flex flex-col items-center gap-2 sm:hidden">
        <button onPointerDown={() => move('up')} className="w-14 h-14 rounded-xl border-[3px] border-[#FFE234] bg-black text-[#FFE234] text-2xl font-black flex items-center justify-center active:bg-[#FFE234] active:text-black transition-colors">↑</button>
        <div className="flex gap-2">
          <button onPointerDown={() => move('left')} className="w-14 h-14 rounded-xl border-[3px] border-[#FFE234] bg-black text-[#FFE234] text-2xl font-black flex items-center justify-center active:bg-[#FFE234] active:text-black transition-colors">←</button>
          <button onPointerDown={() => move('down')} className="w-14 h-14 rounded-xl border-[3px] border-[#FFE234] bg-black text-[#FFE234] text-2xl font-black flex items-center justify-center active:bg-[#FFE234] active:text-black transition-colors">↓</button>
          <button onPointerDown={() => move('right')} className="w-14 h-14 rounded-xl border-[3px] border-[#FFE234] bg-black text-[#FFE234] text-2xl font-black flex items-center justify-center active:bg-[#FFE234] active:text-black transition-colors">→</button>
        </div>
      </div>

      <p className="mt-4 text-[10px] text-white/20 font-bold uppercase tracking-widest text-center">
        arrow keys or wasd · reach the top · 5 levels · 3 lives
      </p>
    </div>
  );
}
