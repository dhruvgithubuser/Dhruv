import React from 'react';
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, MONO, SANS, SERIF, ease, lin } from './theme';

/* Cinematic documentary overlays (on top of the 3D). */

/** Chapter / location tag: thin rule + mono caps, slides in. */
export const Loc: React.FC<{ text: string; sub?: string; at: number; out?: number; y?: number }> = ({ text, sub, at, out, y = 150 }) => {
  const f = useCurrentFrame(); const p = ease(f, at, at + 14); const o = out !== undefined ? 1 - ease(f, out, out + 10) : 1;
  if (p <= 0 || o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 64, top: y, opacity: o * p }}>
      <div style={{ width: 120 * p, height: 5, background: C.yellow, marginBottom: 16 }} />
      <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 44, letterSpacing: 6, color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.85)', transform: `translateX(${(1 - p) * -30}px)` }}>{text}</div>
      {sub && <div style={{ fontFamily: MONO, fontSize: 32, letterSpacing: 4, color: C.yellow, marginTop: 10, textShadow: '0 2px 10px rgba(0,0,0,0.85)' }}>{sub}</div>}
    </div>
  );
};

/** Big centred documentary title (white, tracked caps) with optional highlight colour. */
export const Title: React.FC<{ text: string; at: number; out?: number; y?: number; size?: number; color?: string; sub?: string; serif?: boolean }> = ({ text, at, out, y = 300, size = 110, color = '#fff', sub, serif }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const k = spring({ frame: f - at, fps, config: { damping: 18, stiffness: 120 } }); const o = out !== undefined ? 1 - ease(f, out, out + 10) : 1;
  if (f < at || o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 40, right: 40, top: y, textAlign: 'center', opacity: Math.min(1, k * 1.5) * o, transform: `scale(${1.08 - 0.08 * k})` }}>
      <div style={{ fontFamily: serif ? SERIF : SANS, fontWeight: serif ? 900 : 800, fontSize: size, lineHeight: 1.0, letterSpacing: serif ? 1 : 2, color, textTransform: serif ? 'none' : 'uppercase', textShadow: '0 6px 30px rgba(0,0,0,0.75)' }}>{text}</div>
      {sub && <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 5, color: 'rgba(255,255,255,0.85)', marginTop: 18, textShadow: '0 2px 12px rgba(0,0,0,0.9)', textTransform: 'uppercase' }}>{sub}</div>}
    </div>
  );
};

/** Glass info panel (stat + label). */
export const Stat: React.FC<{ value: React.ReactNode; label: string; at: number; out?: number; x?: number; y: number; w?: number; color?: string }> = ({ value, label, at, out, x = 64, y, w = 952, color = '#fff' }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const k = spring({ frame: f - at, fps, config: { damping: 16, stiffness: 150 } }); const o = out !== undefined ? 1 - ease(f, out, out + 10) : 1;
  if (f < at || o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, opacity: o * Math.min(1, k * 1.5), transform: `translateY(${(1 - k) * 60}px)`, background: 'rgba(14,16,14,0.55)', backdropFilter: 'blur(8px)', borderLeft: `8px solid ${C.yellow}`, padding: '22px 32px' }}>
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 96, lineHeight: 1, color, letterSpacing: -2 }}>{value}</div>
      <div style={{ fontFamily: MONO, fontSize: 28, letterSpacing: 3, color: 'rgba(255,255,255,0.85)', marginTop: 10, textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
};

/** Animated number. */
export const Num: React.FC<{ from: number; to: number; at: number; dur: number; plain?: boolean; suffix?: string }> = ({ from, to, at, dur, plain, suffix = '' }) => {
  const f = useCurrentFrame(); const v = Math.round(from + (to - from) * ease(f, at, at + dur));
  return <>{plain ? v : v.toLocaleString('en-US')}{suffix}</>;
};

/** Small pill chips. */
export const Chips: React.FC<{ items: { t: string; at: number; color?: string }[]; y: number; center?: boolean; size?: number }> = ({ items, y, center = true, size = 34 }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top: y, display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: center ? 'center' : 'flex-start' }}>
      {items.map((it, i) => { const k = spring({ frame: f - it.at, fps, config: { damping: 13, stiffness: 200 } }); if (f < it.at) return null;
        return <div key={i} style={{ transform: `scale(${k})`, background: it.color ?? 'rgba(14,16,14,0.7)', border: '2px solid rgba(255,255,255,0.35)', color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: size, padding: '10px 26px', borderRadius: 999, letterSpacing: 1, textTransform: 'uppercase' }}>{it.t}</div>; })}
    </div>
  );
};

/** Archival photo inset: white border, slight tilt, slides up. */
export const Photo: React.FC<{ src: string; at: number; out?: number; x: number; y: number; w: number; rot?: number; caption?: string }> = ({ src, at, out, x, y, w, rot = -2, caption }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const k = spring({ frame: f - at, fps, config: { damping: 15, stiffness: 140 } }); const o = out !== undefined ? 1 - ease(f, out, out + 10) : 1;
  if (f < at || o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, opacity: o, transform: `translateY(${(1 - k) * 500}px) rotate(${rot}deg) scale(${1 + 0.03 * lin(f, at, at + 200)})`, filter: 'drop-shadow(0 24px 30px rgba(0,0,0,0.6))' }}>
      <Img src={staticFile(`assets/archival/${src}.png`)} style={{ width: '100%', display: 'block' }} />
      {caption && <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 2, color: 'rgba(255,255,255,0.85)', marginTop: 10, textShadow: '0 2px 8px #000' }}>{caption}</div>}
    </div>
  );
};

/** Typed quote, cinematic. */
export const BigQuote: React.FC<{ text: string; by: string; at: number; y?: number; out?: number }> = ({ text, by, at, y = 330, out }) => {
  const f = useCurrentFrame(); const n = Math.floor(lin(f, at, at + 28) * text.length); const o = out !== undefined ? 1 - ease(f, out, out + 10) : 1;
  if (f < at || o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 70, right: 70, top: y, opacity: o }}>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 92, lineHeight: 1.08, color: '#fff', textShadow: '0 6px 30px rgba(0,0,0,0.85)' }}>“{text.slice(0, n)}{n >= text.length ? '”' : ''}</div>
      <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 3, color: C.yellow, marginTop: 22, opacity: lin(f, at + 20, at + 30), textShadow: '0 2px 10px #000' }}>{by}</div>
    </div>
  );
};

/** Red rubber stamp. */
export const RStamp: React.FC<{ text: string; at: number; x: number; y: number; rot?: number; size?: number; color?: string }> = ({ text, at, x, y, rot = -8, size = 90, color = '#d8342a' }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const k = spring({ frame: f - at, fps, config: { damping: 11, stiffness: 260 } });
  if (f < at) return null;
  return <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${2 - k})`, opacity: Math.min(1, k * 2), fontFamily: SANS, fontWeight: 800, fontSize: size, letterSpacing: 6, color, border: `10px solid ${color}`, padding: '4px 28px', borderRadius: 10, whiteSpace: 'nowrap', textShadow: '0 0 1px rgba(0,0,0,0.3)', background: 'rgba(255,255,255,0.06)' }}>{text}</div>;
};

/** Camera viewfinder (recon photo look). */
export const Viewfinder: React.FC<{ o: number; label: string }> = ({ o, label }) => (o <= 0 ? null : (
  <AbsoluteFill style={{ opacity: o, pointerEvents: 'none' }}>
    {[[60, 260, 1, 1], [1020, 260, -1, 1], [60, 1500, 1, -1], [1020, 1500, -1, -1]].map(([x, y, sx, sy], i) => <div key={i} style={{ position: 'absolute', left: Math.min(x, x + sx * 90), top: Math.min(y, y + sy * 90), width: 90, height: 90, borderLeft: sx > 0 ? '6px solid #fff' : undefined, borderRight: sx < 0 ? '6px solid #fff' : undefined, borderTop: sy > 0 ? '6px solid #fff' : undefined, borderBottom: sy < 0 ? '6px solid #fff' : undefined }} />)}
    <div style={{ position: 'absolute', left: 520, top: 860, width: 40, height: 4, background: '#fff' }} /><div style={{ position: 'absolute', left: 538, top: 842, width: 4, height: 40, background: '#fff' }} />
    <div style={{ position: 'absolute', left: 80, top: 200, fontFamily: MONO, fontSize: 28, letterSpacing: 4, color: '#fff' }}>{label}</div>
  </AbsoluteFill>
));

/** Grain, vignette, slight teal/orange grade. */
export const Grade: React.FC<{ warm?: number }> = ({ warm = 0 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {warm !== 0 && <AbsoluteFill style={{ background: warm > 0 ? 'rgba(255,170,90,1)' : 'rgba(60,110,160,1)', opacity: Math.abs(warm) * 0.12, mixBlendMode: 'soft-light' }} />}
      <Img src={staticFile(`assets/textures/grain_${Math.floor(f / 2) % 8}.png`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'overlay', opacity: 0.16 }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 90% 75% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)' }} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 14%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.55) 100%)' }} />
    </AbsoluteFill>
  );
};
