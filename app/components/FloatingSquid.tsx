"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

export default function FloatingSquid() {
  const squidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = squidRef.current;
    if (!el) return;

    const SIZE = 80;
    let x = window.innerWidth * 0.4;
    let y = window.innerHeight * 0.3;
    let vx = 0.7 + Math.random() * 0.4;
    let vy = 0.5 + Math.random() * 0.3;
    if (Math.random() < 0.5) vx *= -1;
    if (Math.random() < 0.5) vy *= -1;
    let rotation = 0;
    let rotationV = (Math.random() - 0.5) * 0.04;
    let driftTimer = 0;
    let raf: number;

    // Drag state
    let dragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    // Track last few positions for throw velocity
    const history: { x: number; y: number; t: number }[] = [];

    const tick = () => {
      if (!dragging) {
        driftTimer++;

        if (driftTimer % 240 === 0) {
          vx += (Math.random() - 0.5) * 0.2;
          vy += (Math.random() - 0.5) * 0.2;
        }

        vy -= 0.002;

        const minSpeed = 0.5;
        const maxSpeed = 14;
        const speed = Math.sqrt(vx * vx + vy * vy);
        if (speed < minSpeed) { vx = (vx / speed) * minSpeed; vy = (vy / speed) * minSpeed; }
        if (speed > maxSpeed) { vx = (vx / speed) * maxSpeed; vy = (vy / speed) * maxSpeed; }

        // Slow back down to float speed after a throw
        if (speed > 1.1) { vx *= 0.97; vy *= 0.97; }

        x += vx;
        y += vy;

        if (x <= 0) { x = 0; vx = Math.abs(vx); }
        if (x >= window.innerWidth - SIZE) { x = window.innerWidth - SIZE; vx = -Math.abs(vx); }
        if (y <= 0) { y = 0; vy = Math.abs(vy); }
        if (y >= window.innerHeight - SIZE) { y = window.innerHeight - SIZE; vy = -Math.abs(vy); }

        rotationV += (Math.random() - 0.5) * 0.001;
        rotationV *= 0.98;
        rotationV = Math.max(-0.06, Math.min(0.06, rotationV));
        rotation += rotationV;
      }

      el.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}rad)`;
      raf = requestAnimationFrame(tick);
    };

    const onMouseDown = (e: MouseEvent) => {
      dragging = true;
      dragOffsetX = e.clientX - x;
      dragOffsetY = e.clientY - y;
      history.length = 0;
      history.push({ x: e.clientX, y: e.clientY, t: Date.now() });
      el.style.cursor = "grabbing";
      e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      x = e.clientX - dragOffsetX;
      y = e.clientY - dragOffsetY;
      const now = Date.now();
      history.push({ x: e.clientX, y: e.clientY, t: now });
      if (history.length > 8) history.shift();
      // Spin while dragging
      rotationV = (e.movementX + e.movementY) * 0.005;
    };

    const onMouseUp = () => {
      if (!dragging) return;
      dragging = false;
      el.style.cursor = "grab";
      // Calculate throw velocity from recent history
      if (history.length >= 2) {
        const recent = history.slice(-4);
        const dt = (recent[recent.length - 1].t - recent[0].t) || 16;
        vx = ((recent[recent.length - 1].x - recent[0].x) / dt) * 16;
        vy = ((recent[recent.length - 1].y - recent[0].y) / dt) * 16;
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      dragging = true;
      const t = e.touches[0];
      dragOffsetX = t.clientX - x;
      dragOffsetY = t.clientY - y;
      history.length = 0;
      history.push({ x: t.clientX, y: t.clientY, t: Date.now() });
      e.preventDefault();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!dragging) return;
      const t = e.touches[0];
      const prevX = x;
      x = t.clientX - dragOffsetX;
      y = t.clientY - dragOffsetY;
      history.push({ x: t.clientX, y: t.clientY, t: Date.now() });
      if (history.length > 8) history.shift();
      rotationV = (x - prevX) * 0.005;
      e.preventDefault();
    };

    const onTouchEnd = () => {
      if (!dragging) return;
      dragging = false;
      if (history.length >= 2) {
        const recent = history.slice(-4);
        const dt = (recent[recent.length - 1].t - recent[0].t) || 16;
        vx = ((recent[recent.length - 1].x - recent[0].x) / dt) * 16;
        vy = ((recent[recent.length - 1].y - recent[0].y) / dt) * 16;
      }
    };

    el.style.cursor = "grab";
    el.style.pointerEvents = "auto";

    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);

    el.style.transform = `translate(${x}px, ${y}px)`;
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <div
      ref={squidRef}
      className="fixed top-0 left-0 z-[5]"
      style={{ width: 80, height: 80, willChange: "transform" }}
    >
      <Image src="/squid.png" alt="" width={80} height={80} className="object-contain select-none" draggable={false} />
    </div>
  );
}
