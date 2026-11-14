import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { hash01, noise1 } from '../theme';

/** Floating dust caught in light (seeded, deterministic). */
export const Dust: React.FC<{ n?: number; seed?: number; color?: string; o?: number }> = ({ n = 60, seed = 2, color = '255,236,200', o = 0.6 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width={1080} height={1920}>
        {Array.from({ length: n }, (_, i) => {
          const d = 0.3 + hash01(i, seed + 1) * 0.9;
          const x = (hash01(i, seed) * 1080 + f * 0.4 * d + noise1(f * 0.01 + i, seed) * 30 + 1080) % 1080;
          const y = (hash01(i, seed + 2) * 1920 - f * 0.6 * d + 1920 * 4) % 1920;
          const r = (1.5 + hash01(i, seed + 3) * 4) * d;
          return <circle key={i} cx={x} cy={y} r={r} fill={`rgba(${color},${o * d * (0.5 + 0.5 * Math.abs(Math.sin(f * 0.05 + i)))})`} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** Warm light leak drifting across the frame. */
export const LightLeak: React.FC<{ o?: number; seed?: number }> = ({ o = 0.35, seed = 1 }) => {
  const f = useCurrentFrame();
  const x = 50 + 40 * noise1(f * 0.008, seed), y = 30 + 30 * noise1(f * 0.006, seed + 4);
  return <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: o, background: `radial-gradient(ellipse 60% 40% at ${x}% ${y}%, rgba(255,170,90,0.55), rgba(255,90,40,0.15) 45%, rgba(0,0,0,0) 70%)` }} />;
};

/** Short RGB-split + slice glitch around frame `at` (for the cutoff moment). */
export const Glitch: React.FC<{ at: number; dur?: number; children: React.ReactNode }> = ({ at, dur = 10, children }) => {
  const f = useCurrentFrame();
  const k = f >= at && f < at + dur ? 1 - (f - at) / dur : 0;
  if (k <= 0) return <AbsoluteFill>{children}</AbsoluteFill>;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `translateX(${-14 * k}px)`, filter: 'url(#none) saturate(2)', mixBlendMode: 'screen', opacity: 0.8 }}>{children}</AbsoluteFill>
      {Array.from({ length: 10 }, (_, i) => {
        const off = (hash01(i + f * 7, 5) - 0.5) * 120 * k;
        const t = i * 10;
        return <AbsoluteFill key={i} style={{ clipPath: `inset(${t}% 0 ${100 - t - 10}% 0)`, transform: `translateX(${off}px)` }}>{children}</AbsoluteFill>;
      })}
      <AbsoluteFill style={{ background: `rgba(232,65,44,${0.25 * k})`, mixBlendMode: 'screen' }} />
    </AbsoluteFill>
  );
};

/** Camera shake wrapper, decaying after frame `at`. */
export const Shake: React.FC<{ at: number; amp?: number; children: React.ReactNode }> = ({ at, amp = 18, children }) => {
  const f = useCurrentFrame();
  const a = f >= at ? amp * Math.exp(-(f - at) / 9) : 0;
  return <AbsoluteFill style={{ transform: `translate(${a * noise1(f * 0.9, 3)}px, ${a * noise1(f * 0.9, 8)}px)` }}>{children}</AbsoluteFill>;
};
