import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { hash01, lin } from './theme';

/* VFX kit (SVG/CSS, deterministic): explosions, smoke, trails, tracers, fire, screen shake, light flash. */

/** Explosion at (x,y) triggered at frame `at`: flash, fireball, smoke columns, debris. Use inside an <svg>. */
export const Explosion: React.FC<{ at: number; x: number; y: number; s?: number; seed?: number }> = ({ at, x, y, s = 1, seed = 1 }) => {
  const f = useCurrentFrame(); const t = f - at;
  if (t < 0 || t > 150) return null;
  const fl = Math.max(0, 1 - t / 6);
  const fb = lin(t, 0, 10) * (1 - lin(t, 18, 40));
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2 + hash01(i, seed) * 0.6; const k = lin(t, 4 + i, 120);
        return <circle key={`sm${i}`} cx={Math.cos(a) * 50 * k + (hash01(i, seed + 3) - 0.5) * 40} cy={-60 - 220 * k + Math.sin(a) * 30 * k} r={40 + 110 * k} fill={i % 2 ? '#3d3833' : '#57504a'} opacity={0.75 * lin(t, 3 + i, 12 + i) * (1 - k * 0.85)} />;
      })}
      <circle r={70 + 120 * lin(t, 0, 16)} fill="url(#fireball)" opacity={fb} />
      <circle r={60 + 260 * lin(t, 0, 6)} fill="#fff6d0" opacity={fl * 0.9} />
      {Array.from({ length: 14 }, (_, i) => {
        const a = -Math.PI * (0.1 + 0.8 * hash01(i, seed + 7)); const v = 9 + 9 * hash01(i, seed + 9);
        const px = Math.cos(a) * v * t, py = Math.sin(a) * v * t + 0.35 * t * t;
        return t < 40 ? <rect key={`d${i}`} x={px} y={py} width={8} height={8} fill="#2a2018" transform={`rotate(${t * 20 + i * 30} ${px} ${py})`} /> : null;
      })}
    </g>
  );
};
export const VfxDefs: React.FC = () => (
  <defs>
    <radialGradient id="fireball"><stop offset="0" stopColor="#fff3b0" /><stop offset="0.35" stopColor="#ffb13b" /><stop offset="0.7" stopColor="#e2541c" /><stop offset="1" stopColor="#7a2a10" stopOpacity="0" /></radialGradient>
    <radialGradient id="flame"><stop offset="0" stopColor="#fff1a8" /><stop offset="0.5" stopColor="#ff9a2e" /><stop offset="1" stopColor="#c8401a" stopOpacity="0" /></radialGradient>
  </defs>
);

/** Flickering fire on a burning target. */
export const Fire: React.FC<{ x: number; y: number; s?: number; seed?: number }> = ({ x, y, s = 1, seed = 2 }) => {
  const f = useCurrentFrame();
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {Array.from({ length: 6 }, (_, i) => { const k = ((f * 1.4 + i * 17) % 50) / 50; return <circle key={`fs${i}`} cx={(hash01(i, seed) - 0.5) * 40 + k * 30} cy={-40 - k * 260} r={30 + k * 70} fill="#4a433d" opacity={0.6 * (1 - k)} />; })}
      {Array.from({ length: 5 }, (_, i) => <ellipse key={i} cx={(i - 2) * 16} cy={-20 - 10 * Math.abs(Math.sin(f / 3 + i))} rx={22} ry={40 + 18 * Math.sin(f / 2.5 + i * 1.7)} fill="url(#flame)" />)}
    </g>
  );
};

/** Smoke trail behind a moving point (pass the head position for frames t-k). */
export const Trail: React.FC<{ pts: [number, number][] }> = ({ pts }) => (
  <g>{pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={6 + i * 1.6} fill="#e4e6e8" opacity={0.5 * (1 - i / pts.length)} />)}</g>
);

/** Anti-aircraft tracer streaks rising from (x,y). */
export const Tracers: React.FC<{ x: number; y: number; n?: number; seed?: number }> = ({ x, y, n = 6, seed = 4 }) => {
  const f = useCurrentFrame();
  return (
    <g>{Array.from({ length: n }, (_, i) => {
      const k = ((f * 2 + i * 13) % 40) / 40; const a = -Math.PI / 2 + (hash01(i, seed) - 0.5) * 0.9;
      const d = 900 * k; const x1 = x + Math.cos(a) * d, y1 = y + Math.sin(a) * d;
      return <line key={i} x1={x1} y1={y1} x2={x1 - Math.cos(a) * 60} y2={y1 - Math.sin(a) * 60} stroke="#ffd36a" strokeWidth={5} strokeLinecap="round" opacity={1 - k} />;
    })}</g>
  );
};

/** Camera shake: wrap content; impulses at given frames decay over ~12 frames. */
export const Shake: React.FC<{ hits: number[]; amp?: number; children: React.ReactNode }> = ({ hits, amp = 22, children }) => {
  const f = useCurrentFrame();
  let e = 0; for (const h of hits) { const t = f - h; if (t >= 0 && t < 14) e = Math.max(e, 1 - t / 14); }
  const dx = e * amp * Math.sin(f * 2.1), dy = e * amp * Math.cos(f * 2.7);
  return <AbsoluteFill style={{ transform: `translate(${dx}px, ${dy}px)` }}>{children}</AbsoluteFill>;
};

/** Warm light-leak flash for scene changes (first ~12 frames). */
export const LightLeak: React.FC = () => {
  const f = useCurrentFrame(); const o = 1 - lin(f, 0, 12);
  if (o <= 0) return null;
  return <AbsoluteFill style={{ background: 'radial-gradient(ellipse 70% 60% at 85% 20%, rgba(255,190,110,0.55), rgba(255,120,40,0) 70%)', opacity: o, mixBlendMode: 'screen', pointerEvents: 'none' }} />;
};

/** Film flicker over the whole frame. */
export const Flicker: React.FC = () => {
  const f = useCurrentFrame(); const v = 0.035 * hash01(f, 11);
  return <AbsoluteFill style={{ background: `rgba(255,240,210,${v})`, mixBlendMode: 'screen', pointerEvents: 'none' }} />;
};
