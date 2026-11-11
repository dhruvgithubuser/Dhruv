import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Img, continueRender, delayRender, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, MONO, SANS, SERIF, TYPE, ease, hash01, lin, noise1 } from '../theme';

/* ------------------------------------------------------------------ fonts + stage */
const css = [300, 400, 600, 800].map((w) => `@font-face{font-family:'Inter';src:url('${staticFile(`assets/fonts/Inter-${w}.woff2`)}') format('woff2');font-weight:${w};}`).join('')
  + `@font-face{font-family:'Plex Mono';src:url('${staticFile('assets/fonts/PlexMono-500.woff2')}') format('woff2');font-weight:500;}`
  + `@font-face{font-family:'Courier Prime';src:url('${staticFile('assets/fonts/CourierPrime-700.woff2')}') format('woff2');font-weight:700;}`
  + `@font-face{font-family:'Playfair';src:url('${staticFile('assets/fonts/Playfair-900.woff2')}') format('woff2');font-weight:900;}`
  + `@font-face{font-family:'Playfair';src:url('${staticFile('assets/fonts/Playfair-700i.woff2')}') format('woff2');font-weight:700;font-style:italic;}`;
export const Fonts: React.FC = () => {
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all(['800 40px Inter', '600 40px Inter', '400 40px Inter', '500 40px "Plex Mono"', '700 40px "Courier Prime"', '900 40px Playfair', 'italic 700 40px Playfair'].map((f) => document.fonts.load(f)))
      .then(() => continueRender(h)).catch(() => continueRender(h));
  }, [h]);
  return <style>{css}</style>;
};

/** Vox off-white paper with a faint dot grid. `night` tints it toward dusk blue. */
export const Paper: React.FC<{ night?: number }> = ({ night = 0 }) => (
  <AbsoluteFill>
    <Img src={staticFile('assets/backgrounds/paper_vox.jpg')} style={{ width: '100%', height: '100%' }} />
    <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(28,27,26,0.13) 1.6px, transparent 1.8px)', backgroundSize: '36px 36px' }} />
    {night > 0 && <AbsoluteFill style={{ background: C.night, opacity: night * 0.82 }} />}
  </AbsoluteFill>
);

/** Slow purposeful camera drift + optional push. */
export const Cam: React.FC<{ push?: number; ox?: number; oy?: number; children: React.ReactNode }> = ({ push = 0, ox = 50, oy = 45, children }) => {
  const f = useCurrentFrame();
  const dx = 7 * noise1(f * 0.006, 3), dy = 6 * noise1(f * 0.006, 7);
  return <AbsoluteFill style={{ transform: `translate(${dx}px,${dy}px) scale(${1 + push})`, transformOrigin: `${ox}% ${oy}%` }}>{children}</AbsoluteFill>;
};

/** Grain + soft vignette (no sepia — Vox paper stays clean). */
export const Finish: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <Img src={staticFile(`assets/textures/grain_${Math.floor(f / 2) % 8}.png`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'overlay', opacity: 0.12 }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 95% 80% at 50% 45%, rgba(0,0,0,0) 62%, rgba(20,16,12,0.32) 100%)' }} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ motion helpers */
export const useSpring = (at: number, damping = 14, stiffness = 170) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return spring({ frame: f - at, fps, config: { damping, stiffness } });
};

/** Archival collage card (torn paper, drop shadow). Slides/drops in with a spring, slow scale drift. */
export const Card: React.FC<{ src: string; x: number; y: number; w: number; rot?: number; at: number; out?: number; from?: 'left' | 'right' | 'bottom' | 'top' | 'drop'; children?: React.ReactNode; z?: number; zoom?: number }> = ({
  src, x, y, w, rot = 0, at, out, from = 'drop', children, z = 0, zoom = 0.05,
}) => {
  const f = useCurrentFrame();
  const k = useSpring(at, 15, 150);
  const o = out !== undefined ? 1 - ease(f, out, out + 10) : 1;
  if (f < at || o <= 0) return null;
  const off = 1 - k;
  const [dx, dy] = from === 'left' ? [-1300 * off, 0] : from === 'right' ? [1300 * off, 0] : from === 'bottom' ? [0, 1400 * off] : from === 'top' ? [0, -1400 * off] : [0, 0];
  const s = (from === 'drop' ? 1.25 - 0.25 * k : 1) * (1 + zoom * lin(f, at, at + 300));
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, zIndex: z, opacity: o * (from === 'drop' ? Math.min(1, k * 2) : 1),
      transform: `translate(${dx}px,${dy}px) rotate(${rot + (from === 'drop' ? 4 * off : 0)}deg) scale(${s})`, filter: 'drop-shadow(0 18px 22px rgba(30,24,16,0.35))' }}>
      <Img src={staticFile(`assets/archival/${src}.png`)} style={{ width: '100%', display: 'block' }} />
      {children}
    </div>
  );
};

/** Yellow highlighter swipe behind inline text. */
export const Hl: React.FC<{ at: number; dur?: number; color?: string; children: React.ReactNode }> = ({ at, dur = 9, color = C.yellow, children }) => {
  const f = useCurrentFrame(); const p = ease(f, at, at + dur) * 100;
  return <span style={{ backgroundImage: `linear-gradient(100deg, ${color} ${p}%, transparent ${p}%)`, backgroundSize: '100% 78%', backgroundPosition: '0 70%', backgroundRepeat: 'no-repeat', padding: '0 8px', margin: '0 -4px', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}>{children}</span>;
};

/** Kinetic headline: each word springs up in turn. Wrap a word in *stars* to highlight it, ^caret^ to colour it red. */
export const Kinetic: React.FC<{ text: string; at: number; y: number; size?: number; x?: number; width?: number; align?: 'center' | 'left'; stagger?: number; out?: number; color?: string; font?: string; italic?: boolean; weight?: number; hlAt?: number }> = ({
  text, at, y, size = 92, x = 70, width = 940, align = 'center', stagger = 3, out, color = C.ink, font = SANS, italic, weight = 800, hlAt,
}) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const o = out !== undefined ? 1 - ease(f, out, out + 8) : 1;
  if (f < at || o <= 0) return null;
  const words = text.split(' ');
  return (
    <div style={{ position: 'absolute', left: x, top: y, width, textAlign: align, opacity: o, fontFamily: font, fontWeight: weight, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.08, letterSpacing: font === SANS ? -1.5 : 0, color }}>
      {words.map((raw, i) => {
        const k = spring({ frame: f - at - i * stagger, fps, config: { damping: 13, stiffness: 190 } });
        const hl = /^\*.*\*[,.?!]*$/.test(raw), red = /^\^.*\^[,.?!]*$/.test(raw);
        const w = raw.replace(/[*^]/g, '');
        const inner = hl ? <Hl at={hlAt ?? at + words.length * stagger + 4}>{w}</Hl> : w;
        return <span key={i} style={{ display: 'inline-block', marginRight: size * 0.24, transform: `translateY(${(1 - k) * size * 0.6}px)`, opacity: Math.min(1, k * 1.8), color: red ? C.red : undefined }}>{inner}</span>;
      })}
    </div>
  );
};

/** Black label box (Vox source/date tags). */
export const Tag: React.FC<{ text: string; at: number; x: number; y: number; out?: number; color?: string; bg?: string; size?: number; rot?: number }> = ({ text, at, x, y, out, color = '#fff', bg = C.ink, size = 30, rot = 0 }) => {
  const f = useCurrentFrame();
  const p = ease(f, at, at + 10); const o = out !== undefined ? 1 - ease(f, out, out + 8) : 1;
  if (p <= 0 || o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y, opacity: o, transform: `rotate(${rot}deg)`, clipPath: `inset(0 ${100 - p * 100}% 0 0)`, background: bg, color, fontFamily: MONO, fontWeight: 500, fontSize: size, letterSpacing: 2, padding: '8px 16px', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>{text}</div>
  );
};

/** Hand-drawn marker ellipse that draws itself on. */
export const Circle: React.FC<{ cx: number; cy: number; rx: number; ry: number; at: number; dur?: number; color?: string; width?: number; seed?: number }> = ({ cx, cy, rx, ry, at, dur = 14, color = C.red, width = 8, seed = 1 }) => {
  const f = useCurrentFrame(); const p = ease(f, at, at + dur);
  if (p <= 0) return null;
  const pts: string[] = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2.15 - 1.9; const j = 1 + 0.05 * Math.sin(i * 0.7 + seed) + 0.03 * (hash01(i, seed) - 0.5);
    pts.push(`${i ? 'L' : 'M'}${(cx + Math.cos(a) * rx * j * (1 + i * 0.0012)).toFixed(1)},${(cy + Math.sin(a) * ry * j).toFixed(1)}`);
  }
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
      <path d={pts.join('')} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 1`} opacity={0.92} />
    </svg>
  );
};

/** Hand-drawn curved arrow from a to b (bend = sideways offset of the control point). */
export const Arrow: React.FC<{ a: [number, number]; b: [number, number]; at: number; dur?: number; bend?: number; color?: string; width?: number; dash?: boolean }> = ({ a, b, at, dur = 14, bend = 60, color = C.red, width = 8, dash }) => {
  const f = useCurrentFrame(); const p = ease(f, at, at + dur);
  if (p <= 0) return null;
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; const dx = b[0] - a[0], dy = b[1] - a[1]; const L = Math.hypot(dx, dy) || 1;
  const c: [number, number] = [mx - (dy / L) * bend, my + (dx / L) * bend];
  const ang = Math.atan2(b[1] - c[1], b[0] - c[0]); const hs = 26;
  const head = `M${b[0] - hs * Math.cos(ang - 0.45)},${b[1] - hs * Math.sin(ang - 0.45)} L${b[0]},${b[1]} L${b[0] - hs * Math.cos(ang + 0.45)},${b[1] - hs * Math.sin(ang + 0.45)}`;
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
      <path d={`M${a[0]},${a[1]} Q${c[0]},${c[1]} ${b[0]},${b[1]}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" pathLength={1} strokeDasharray={dash ? undefined : `${p} 1`} style={dash ? { strokeDasharray: '0.02 0.025' } : undefined} opacity={dash ? p : 1} />
      {p > 0.92 && <path d={head} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
};

/** Rubber stamp that slams in. */
export const Stamp: React.FC<{ text: string; at: number; x: number; y: number; rot?: number; size?: number; color?: string }> = ({ text, at, x, y, rot = -10, size = 86, color = C.red }) => {
  const f = useCurrentFrame(); const k = useSpring(at, 11, 260);
  if (f < at) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${2 - k})`, opacity: Math.min(1, k * 2), fontFamily: SANS, fontWeight: 800, fontSize: size, letterSpacing: 6, color, border: `9px solid ${color}`, padding: '4px 26px', borderRadius: 10, mixBlendMode: 'multiply', whiteSpace: 'nowrap' }}>{text}</div>
  );
};

/** Big counter (commas), e.g. 0 → 3,000. */
export const Counter: React.FC<{ from: number; to: number; at: number; dur: number; x: number; y: number; size?: number; suffix?: string; color?: string; align?: 'left' | 'center'; plain?: boolean }> = ({ from, to, at, dur, x, y, size = 150, suffix = '', color = C.ink, align = 'left', plain }) => {
  const f = useCurrentFrame(); if (f < at) return null;
  const v = Math.round(from + (to - from) * ease(f, at, at + dur));
  return <div style={{ position: 'absolute', left: x, top: y, fontFamily: SANS, fontWeight: 800, fontSize: size, letterSpacing: -4, color, lineHeight: 1, transform: align === 'center' ? 'translateX(-50%)' : undefined, opacity: lin(f, at, at + 5) }}>{plain ? v : v.toLocaleString('en-US')}{suffix}</div>;
};

/** Typed quote card (white sheet, serif italic, attribution in mono). */
export const Quote: React.FC<{ text: React.ReactNode; by: string; at: number; x: number; y: number; w: number; size?: number; rot?: number; out?: number }> = ({ text, by, at, x, y, w, size = 52, rot = 0, out }) => {
  const f = useCurrentFrame(); const k = useSpring(at, 15, 170); const o = out !== undefined ? 1 - ease(f, out, out + 8) : 1;
  if (f < at || o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, opacity: o, transform: `translateY(${(1 - k) * 120}px) rotate(${rot}deg)`, background: C.sheet, padding: '34px 40px 28px', boxShadow: '0 18px 30px rgba(30,24,16,0.28)', borderTop: `10px solid ${C.ink}` }}>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: size, lineHeight: 1.2, color: C.ink }}>{text}</div>
      <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 24, letterSpacing: 2, color: C.grey, marginTop: 20, textTransform: 'uppercase' }}>{by}</div>
    </div>
  );
};

/** Flat flame icon that flickers; `out` makes it shrink to a puff of steam. */
export const Flame: React.FC<{ x: number; y: number; s?: number; at: number; out?: number; seed?: number }> = ({ x, y, s = 1, at, out, seed = 1 }) => {
  const f = useCurrentFrame();
  const g = ease(f, at, at + 10); if (g <= 0) return null;
  const dying = out !== undefined ? ease(f, out, out + 14) : 0;
  const fl = 1 + 0.12 * noise1(f * 0.35, seed) ; const sw = 6 * noise1(f * 0.25, seed + 9);
  const sc = s * g * (1 - dying) * fl;
  return (
    <g transform={`translate(${x},${y})`}>
      {sc > 0.02 && <g transform={`scale(${sc}) skewX(${sw})`}>
        <path d="M0,0 C-34,-6 -40,-44 -16,-76 C-12,-56 -2,-52 0,-60 C2,-84 14,-100 26,-112 C24,-84 44,-62 38,-30 C34,-8 18,0 0,0 Z" fill={C.fire} />
        <path d="M0,0 C-16,-4 -20,-26 -6,-44 C-2,-34 6,-34 6,-46 C16,-34 24,-20 18,-8 C14,-1 8,0 0,0 Z" fill={C.fireHi} />
      </g>}
      {dying > 0 && dying < 1 && [0, 1, 2].map((i) => (
        <circle key={i} cx={(i - 1) * 16 * s} cy={-30 * s - dying * 90 * s - i * 10} r={(10 + i * 4) * s * (0.6 + dying)} fill="rgba(235,235,235,0.75)" opacity={1 - dying} />
      ))}
    </g>
  );
};

/** Diagonal rain streaks over the frame. */
export const Rain: React.FC<{ o: number; n?: number }> = ({ o, n = 140 }) => {
  const f = useCurrentFrame(); if (o <= 0) return null;
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: o, pointerEvents: 'none' }}>
      {Array.from({ length: n }, (_, i) => {
        const x = hash01(i, 3) * 1300 - 100, sp = 50 + hash01(i, 5) * 30; const y = ((hash01(i, 7) * 1920 + f * sp) % 2100) - 120;
        return <line key={i} x1={x} y1={y} x2={x - 18} y2={y + 70} stroke="rgba(214,228,240,0.85)" strokeWidth={3} strokeLinecap="round" />;
      })}
    </svg>
  );
};

/** Flat storm cloud (overlapping circles). */
export const Cloud: React.FC<{ x: number; y: number; s?: number; color?: string }> = ({ x, y, s = 1, color = C.storm }) => (
  <g transform={`translate(${x},${y}) scale(${s})`} fill={color}>
    <circle cx={-90} cy={10} r={60} /><circle cx={-20} cy={-30} r={86} /><circle cx={70} cy={-6} r={70} /><circle cx={140} cy={22} r={48} />
    <rect x={-150} y={10} width={340} height={60} rx={30} />
  </g>
);

export const Bolt: React.FC<{ x: number; y: number; s?: number; o: number }> = ({ x, y, s = 1, o }) => (o <= 0 ? null :
  <path transform={`translate(${x},${y}) scale(${s})`} d="M0,0 L-40,110 L-6,104 L-34,220 L50,80 L12,86 L38,0 Z" fill="#ffe46b" stroke={C.ink} strokeWidth={4} opacity={o} />);

/** Small citation in the corner. */
export const Source: React.FC<{ text: string; at?: number }> = ({ text, at = 0 }) => {
  const f = useCurrentFrame();
  return <div style={{ position: 'absolute', left: 50, top: 1730, fontFamily: MONO, fontSize: 19, letterSpacing: 1.5, color: 'rgba(28,27,26,0.55)', opacity: lin(f, at, at + 10), textTransform: 'uppercase' }}>{text}</div>;
};

/** Caption text style helper for small handwritten-ish annotations. */
export const Note: React.FC<{ text: string; at: number; x: number; y: number; size?: number; color?: string; rot?: number; w?: number; align?: 'left' | 'center' }> = ({ text, at, x, y, size = 34, color = C.ink, rot = -2, w, align = 'left' }) => {
  const f = useCurrentFrame(); const o = lin(f, at, at + 8); if (o <= 0) return null;
  return <div style={{ position: 'absolute', left: x, top: y, width: w, textAlign: align, opacity: o, transform: `rotate(${rot}deg) translateY(${(1 - o) * 14}px)`, fontFamily: TYPE, fontWeight: 700, fontSize: size, lineHeight: 1.2, color }}>{text}</div>;
};
