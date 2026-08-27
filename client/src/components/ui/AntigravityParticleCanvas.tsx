'use client';

import React, { useRef, useEffect } from 'react';

interface FreeOrb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  wanderAngle: number;
  wanderSpeed: number;
  baseRadius: number;
  radius: number;
  color: string;
  glowColor: string;
  alpha: number;
  baseAlpha: number;
}

// Pure Monochromatic Blue Spectrum
const BLUE_PALETTE = [
  { color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.75)' }, // Sky Blue
  { color: '#60a5fa', glow: 'rgba(96, 165, 250, 0.75)' }, // Blue 400
  { color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.75)' }, // Primary Blue 500
  { color: '#2563eb', glow: 'rgba(37, 99, 235, 0.75)' }, // Royal Blue 600
  { color: '#0ea5e9', glow: 'rgba(14, 165, 233, 0.75)' }, // Ocean Blue
  { color: '#93c5fd', glow: 'rgba(147, 197, 253, 0.75)' }, // Ice Light Blue
  { color: '#1d4ed8', glow: 'rgba(29, 78, 216, 0.75)' },  // Deep Azure
];

export function AntigravityParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const orbsRef = useRef<FreeOrb[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -1000,
    y: -1000,
    active: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const initOrbs = () => {
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;

      const numOrbs = Math.floor(Math.min(width, height) * 0.28) + 90; // ~180-260 particles
      const orbs: FreeOrb[] = [];

      for (let i = 0; i < numOrbs; i++) {
        const randPalette = BLUE_PALETTE[Math.floor(Math.random() * BLUE_PALETTE.length)];
        const initialAngle = Math.random() * Math.PI * 2;
        // Ultra-slow serene drift
        const wanderSpeed = 0.22 + Math.random() * 0.32;
        const baseRadius = 2.2 + Math.random() * 3.0;

        orbs.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(initialAngle) * wanderSpeed,
          vy: Math.sin(initialAngle) * wanderSpeed,
          wanderAngle: initialAngle,
          wanderSpeed,
          baseRadius,
          radius: baseRadius,
          color: randPalette.color,
          glowColor: randPalette.glow,
          alpha: 0.45 + Math.random() * 0.4,
          baseAlpha: 0.45 + Math.random() * 0.4,
        });
      }

      orbsRef.current = orbs;
    };

    initOrbs();
    window.addEventListener('resize', initOrbs);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      mouseRef.current.x = currentX;
      mouseRef.current.y = currentY;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      for (const orb of orbsRef.current) {
        const dx = orb.x - cx;
        const dy = orb.y - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < 260) {
          const force = (1 - dist / 260) * 8;
          orb.vx += (dx / (dist || 1)) * force;
          orb.vy += (dy / (dist || 1)) * force;
        }
      }
    };

    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove);
      parent.addEventListener('mouseleave', handleMouseLeave);
      parent.addEventListener('click', handleClick);
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const m = mouseRef.current;
      const orbs = orbsRef.current;
      const attractionRadius = 260;

      for (let i = 0; i < orbs.length; i++) {
        const orb = orbs[i];

        // 1. Slow, Gentle Magnetic Attraction Physics
        let targetRadius = orb.baseRadius;
        let targetAlpha = orb.baseAlpha;

        if (m.active) {
          const dx = m.x - orb.x;
          const dy = m.y - orb.y;
          const dist = Math.hypot(dx, dy);

          if (dist < attractionRadius) {
            const factor = 1 - dist / attractionRadius;
            const pullForce = factor * factor * 0.28;

            orb.vx += (dx / (dist || 1)) * pullForce;
            orb.vy += (dy / (dist || 1)) * pullForce;

            const tangentAngle = Math.atan2(dy, dx) + Math.PI / 2;
            orb.vx += Math.cos(tangentAngle) * factor * 0.14;
            orb.vy += Math.sin(tangentAngle) * factor * 0.14;

            if (dist < 38) {
              const repel = (1 - dist / 38) * 0.45;
              orb.vx -= (dx / (dist || 1)) * repel;
              orb.vy -= (dy / (dist || 1)) * repel;
            }

            orb.vx *= 0.95;
            orb.vy *= 0.95;

            targetRadius = orb.baseRadius + factor * 2.8;
            targetAlpha = Math.min(1, orb.baseAlpha + factor * 0.45);
          } else {
            orb.wanderAngle += (Math.random() - 0.5) * 0.04;
            orb.vx += Math.cos(orb.wanderAngle) * 0.025;
            orb.vy += Math.sin(orb.wanderAngle) * 0.025;

            const speed = Math.hypot(orb.vx, orb.vy);
            if (speed > orb.wanderSpeed * 1.3) {
              orb.vx *= 0.97;
              orb.vy *= 0.97;
            }
          }
        } else {
          orb.wanderAngle += (Math.random() - 0.5) * 0.04;
          orb.vx += Math.cos(orb.wanderAngle) * 0.025;
          orb.vy += Math.sin(orb.wanderAngle) * 0.025;

          const speed = Math.hypot(orb.vx, orb.vy);
          if (speed > orb.wanderSpeed * 1.2) {
            orb.vx *= 0.97;
            orb.vy *= 0.97;
          } else if (speed < orb.wanderSpeed * 0.7) {
            orb.vx *= 1.03;
            orb.vy *= 1.03;
          }
        }

        orb.x += orb.vx;
        orb.y += orb.vy;

        orb.radius += (targetRadius - orb.radius) * 0.08;
        orb.alpha += (targetAlpha - orb.alpha) * 0.08;

        // 2. Soft Boundary Bounce
        const margin = 20;
        if (orb.x < margin) {
          orb.x = margin;
          orb.vx = Math.abs(orb.vx) * 0.85;
          orb.wanderAngle = Math.random() * Math.PI - Math.PI / 2;
        } else if (orb.x > width - margin) {
          orb.x = width - margin;
          orb.vx = -Math.abs(orb.vx) * 0.85;
          orb.wanderAngle = Math.random() * Math.PI + Math.PI / 2;
        }

        if (orb.y < margin) {
          orb.y = margin;
          orb.vy = Math.abs(orb.vy) * 0.85;
          orb.wanderAngle = Math.random() * Math.PI;
        } else if (orb.y > height - margin) {
          orb.y = height - margin;
          orb.vy = -Math.abs(orb.vy) * 0.85;
          orb.wanderAngle = -Math.random() * Math.PI;
        }

        // 3. Render Glowing Round Blue Orb
        ctx.save();
        ctx.globalAlpha = orb.alpha;
        ctx.shadowBlur = orb.radius > 3.5 ? 12 : 8;
        ctx.shadowColor = orb.glowColor;
        ctx.fillStyle = orb.color;

        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();

        // White-hot center highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius * 0.38, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', initOrbs);
      if (parent) {
        parent.removeEventListener('mousemove', handleMouseMove);
        parent.removeEventListener('mouseleave', handleMouseLeave);
        parent.removeEventListener('click', handleClick);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 w-full h-full"
    />
  );
}
