import React from 'react';
import { Img, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, HEAD, MONO, TYPE, ease, lin } from '../theme';

/** Paper card that slides in with friction (fast start, long ease-out) and settles with a tiny rotation. */
export const PaperCard: React.FC<{ at: number; x: number; y: number; w: number; rot?: number; from?: 'left' | 'right' | 'bottom'; children: React.ReactNode; tilt3d?: number; out?: number }> = ({
  at, x, y, w, rot = -2, from = 'right', children, tilt3d = 0, out,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const k = spring({ frame: f - at, fps, config: { damping: 22, stiffness: 120, mass: 1.1 } });
  const gone = out !== undefined ? ease(f, out, out + 12) : 0;
  const d = (1 - k) * 900 + gone * 1100;
  const tx = from === 'left' ? -d : from === 'right' ? d : 0, ty = from === 'bottom' ? d : 0;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, transform: `perspective(1400px) translate(${tx}px, ${ty}px) rotate(${rot * k}deg) rotateX(${tilt3d * (1 - k)}deg)`,
      background: `url(${staticFile('assets/backgrounds/paper.jpg')}) center/cover`, boxShadow: '0 22px 50px rgba(20,12,4,0.55)', border: '1px solid rgba(60,40,20,0.4)', padding: 30 }}>
      {children}
    </div>
  );
};

/** Typewriter text revealed character by character between frames a..b. */
export const Typed: React.FC<{ text: string; a: number; b: number; size?: number; color?: string; bold?: boolean }> = ({ text, a, b, size = 30, color = C.ink, bold }) => {
  const f = useCurrentFrame();
  const n = Math.round(text.length * lin(f, a, b));
  return <div style={{ fontFamily: TYPE, fontWeight: bold ? 700 : 400, fontSize: size, color, lineHeight: 1.3, whiteSpace: 'pre-wrap' }}>{text.slice(0, n)}<span style={{ opacity: 0 }}>{text.slice(n)}</span></div>;
};

/** Rubber stamp slammed at `at`. */
export const Stamp: React.FC<{ text: string; at: number; x: number; y: number; size?: number; rot?: number; color?: string }> = ({ text, at, x, y, size = 64, rot = -8, color = C.red }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const k = Math.min(1, (f - at) / 5);
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${1.7 - 0.7 * k})`, opacity: 0.2 + 0.72 * k, border: `${size * 0.08}px solid ${color}`, borderRadius: 10,
      padding: `${size * 0.06}px ${size * 0.25}px`, fontFamily: HEAD, fontWeight: 700, fontSize: size, letterSpacing: 4, color, whiteSpace: 'nowrap', textTransform: 'uppercase',
      maskImage: `url(${staticFile('assets/backgrounds/clouds.png')})`, WebkitMaskImage: `url(${staticFile('assets/backgrounds/clouds.png')})`, maskSize: '240% 240%', WebkitMaskSize: '240% 240%' }}>{text}</div>
  );
};

/** Archival photograph print: white border, settles with a soft impact (drop + scale), optional caption + credit. */
export const Photo: React.FC<{ src: string; at: number; x: number; y: number; w: number; h: number; rot?: number; caption?: string; credit?: string; pos?: string; filter?: string }> = ({
  src, at, x, y, w, h, rot = 2, caption, credit, pos = '50% 30%', filter = 'sepia(0.45) contrast(1.08)',
}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const t = f - at;
  const k = Math.min(1, t / 9);
  const bounce = t < 9 ? 1.12 - 0.12 * k : 1 + 0.012 * Math.exp(-(t - 9) / 4) * Math.sin((t - 9) / 1.5);
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, transform: `rotate(${rot}deg) scale(${bounce})`, opacity: Math.min(1, t / 4), background: '#f4eedf', padding: 16, paddingBottom: caption ? 70 : 16, boxShadow: `0 ${10 + 20 * (1 - k)}px ${30 + 30 * (1 - k)}px rgba(20,12,4,0.55)` }}>
      <Img src={staticFile(src)} style={{ width: '100%', height: h, objectFit: 'cover', objectPosition: pos, filter }} />
      {caption && <div style={{ position: 'absolute', left: 18, right: 18, bottom: 16, fontFamily: TYPE, fontSize: 24, color: C.ink }}>{caption}</div>}
      {credit && <div style={{ position: 'absolute', right: 8, bottom: -26, fontFamily: MONO, fontSize: 14, color: 'rgba(40,30,20,0.75)', letterSpacing: 1 }}>{credit}</div>}
    </div>
  );
};

/** Red strike-through drawn across a block at `at`. */
export const Strike: React.FC<{ at: number; x: number; y: number; w: number; rot?: number }> = ({ at, x, y, w, rot = -4 }) => {
  const f = useCurrentFrame();
  const p = ease(f, at, at + 10);
  if (p <= 0) return null;
  return <div style={{ position: 'absolute', left: x, top: y, width: w * p, height: 16, background: C.redHi, transform: `rotate(${rot}deg)`, transformOrigin: '0 50%', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }} />;
};
