'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number; opacity: number;
  colorIndex: number;
}

export default function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;

    const COLORS = [
      [120, 150, 255],
      [180, 140, 255],
    ];
    const COUNT = 65;

    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: 0.3 + Math.random() * 1.5,
      opacity: 0.05 + Math.random() * 0.23,
      colorIndex: Math.random() < 0.5 ? 0 : 1,
    }));

    let rafId: number;

    function draw() {
      ctx!.clearRect(0, 0, W, H);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -2) p.x = W + 2;
        else if (p.x > W + 2) p.x = -2;
        if (p.y < -2) p.y = H + 2;
        else if (p.y > H + 2) p.y = -2;
        const [r, g, b] = COLORS[p.colorIndex];
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${r},${g},${b},${p.opacity})`;
        ctx!.fill();
      }
      rafId = requestAnimationFrame(draw);
    }
    draw();

    const handleResize = () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W; canvas.height = H;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Deep gradient base */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(145deg, #0d0f14 0%, #111520 45%, #0a0e18 100%)',
      }} />

      {/* Blob A — blue, top-left */}
      <div className="absolute rounded-full" style={{
        width: 340, height: 340, top: -80, left: -80,
        background: 'radial-gradient(circle, rgba(60,90,200,0.28) 0%, transparent 70%)',
        filter: 'blur(70px)',
        animation: 'blob-a 28s ease-in-out infinite',
      }} />

      {/* Blob B — purple, bottom-right */}
      <div className="absolute rounded-full" style={{
        width: 280, height: 280, bottom: -60, right: -60,
        background: 'radial-gradient(circle, rgba(100,60,180,0.22) 0%, transparent 70%)',
        filter: 'blur(80px)',
        animation: 'blob-b 35s ease-in-out infinite',
      }} />

      {/* Blob C — cyan, center-right */}
      <div className="absolute rounded-full" style={{
        width: 200, height: 200, top: '35%', right: '15%',
        background: 'radial-gradient(circle, rgba(40,130,160,0.18) 0%, transparent 70%)',
        filter: 'blur(90px)',
        animation: 'blob-c 24s ease-in-out infinite',
      }} />

      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
