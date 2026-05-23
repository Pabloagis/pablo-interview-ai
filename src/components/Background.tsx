'use client';
import { useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';

interface Particle { x:number; y:number; vx:number; vy:number; r:number; opacity:number; colorIndex:number; }

export default function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isDayMode } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;

    const COLORS = isDayMode
      ? [[80,110,200],[120,90,180]] as [number,number,number][]
      : [[120,150,255],[180,140,255]] as [number,number,number][];
    const COUNT = 65;
    const opMin = isDayMode ? 0.02 : 0.05;
    const opRange = isDayMode ? 0.16 : 0.23;

    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-0.5)*0.28, vy: (Math.random()-0.5)*0.28,
      r: 0.3+Math.random()*1.5,
      opacity: opMin+Math.random()*opRange,
      colorIndex: Math.random()<0.5 ? 0 : 1,
    }));

    let rafId: number;
    function draw() {
      ctx!.clearRect(0,0,W,H);
      for (const p of particles) {
        p.x+=p.vx; p.y+=p.vy;
        if (p.x<-2) p.x=W+2; else if (p.x>W+2) p.x=-2;
        if (p.y<-2) p.y=H+2; else if (p.y>H+2) p.y=-2;
        const [r,g,b]=COLORS[p.colorIndex];
        ctx!.beginPath(); ctx!.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx!.fillStyle=`rgba(${r},${g},${b},${p.opacity})`; ctx!.fill();
      }
      rafId = requestAnimationFrame(draw);
    }
    draw();

    const handleResize = () => { W=window.innerWidth; H=window.innerHeight; canvas.width=W; canvas.height=H; };
    window.addEventListener('resize', handleResize);
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', handleResize); };
  }, [isDayMode]);

  const blobA = isDayMode
    ? 'radial-gradient(circle, rgba(58,85,192,0.10) 0%, transparent 70%)'
    : 'radial-gradient(circle, rgba(60,90,200,0.28) 0%, transparent 70%)';
  const blobB = isDayMode
    ? 'radial-gradient(circle, rgba(96,48,184,0.08) 0%, transparent 70%)'
    : 'radial-gradient(circle, rgba(100,60,180,0.22) 0%, transparent 70%)';
  const blobC = isDayMode
    ? 'radial-gradient(circle, rgba(26,122,150,0.07) 0%, transparent 70%)'
    : 'radial-gradient(circle, rgba(40,130,160,0.18) 0%, transparent 70%)';
  const baseGrad = isDayMode
    ? 'linear-gradient(145deg, #f0eeea 0%, #ebe9e4 45%, #edeae6 100%)'
    : 'linear-gradient(145deg, #0d0f14 0%, #111520 45%, #0a0e18 100%)';

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0" style={{ background: baseGrad }} />
      <div className="absolute rounded-full" style={{ width:340, height:340, top:-80, left:-80, background:blobA, filter:'blur(70px)', animation:'blob-a 28s ease-in-out infinite' }} />
      <div className="absolute rounded-full" style={{ width:280, height:280, bottom:-60, right:-60, background:blobB, filter:'blur(80px)', animation:'blob-b 35s ease-in-out infinite' }} />
      <div className="absolute rounded-full" style={{ width:200, height:200, top:'35%', right:'15%', background:blobC, filter:'blur(90px)', animation:'blob-c 24s ease-in-out infinite' }} />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
