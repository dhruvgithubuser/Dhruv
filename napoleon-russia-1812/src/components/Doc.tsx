import React from 'react';
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ease, hash01, lin, noise1 } from '../theme';

/* Cinematic documentary kit for 16:9 (1920x1080). */
export const SERIF = 'Playfair', SANS = 'Inter', MONO = 'Plex Mono';
export const GOLD = '#d9b56a', RED = '#c8423a', BLUE = '#4a7fd6', ICE = '#cfe3ff';

export type Move = { s0?: number; s1?: number; x0?: number; x1?: number; y0?: number; y1?: number; r?: number };
/** Full-frame photoreal still with a slow Ken Burns move, grade and optional "dramatization" tag. */
export const Still: React.FC<{ src: string; dur: number; move?: Move; grade?: 'cold' | 'warm' | 'fire' | 'night' | 'neutral'; dark?: number; tag?: boolean; blur?: number }> = ({
  src, dur, move = {}, grade = 'neutral', dark = 0, tag = true, blur = 0,
}) => {
  const f = useCurrentFrame();
  const t = ease(f, 0, Math.max(1, dur));
  const { s0 = 1.06, s1 = 1.16, x0 = 0, x1 = 0, y0 = 0, y1 = 0, r = 0 } = move;
  const s = s0 + (s1 - s0) * t, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
  const filt = { cold: 'saturate(0.75) contrast(1.08) brightness(0.95) hue-rotate(-6deg)', warm: 'saturate(0.95) contrast(1.06) sepia(0.12)', fire: 'saturate(1.1) contrast(1.1)', night: 'saturate(0.7) contrast(1.1) brightness(0.85)', neutral: 'saturate(0.88) contrast(1.06)' }[grade];
  const flick = grade === 'fire' ? 0.08 * (noise1(f * 0.4, 5) + 1) : 0;
  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: '#000' }}>
      <Img src={staticFile(`assets/stills/${src}.png`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `translate(${x}%, ${y}%) scale(${s}) rotate(${r * t}deg)`, filter: `${filt}${blur ? ` blur(${blur}px)` : ''} brightness(${1 + flick})` }} />
      {grade === 'cold' && <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(40,70,110,0.25), rgba(10,20,40,0.25))', mixBlendMode: 'soft-light' }} />}
      {grade === 'warm' && <AbsoluteFill style={{ background: 'rgba(255,170,80,0.10)', mixBlendMode: 'soft-light' }} />}
      {grade === 'fire' && <AbsoluteFill style={{ background: `rgba(255,110,30,${0.10 + flick})`, mixBlendMode: 'soft-light' }} />}
      {dark > 0 && <AbsoluteFill style={{ background: `rgba(0,0,0,${dark})` }} />}
      {tag && <div style={{ position: 'absolute', right: 34, top: 28, fontFamily: MONO, fontSize: 16, letterSpacing: 3, color: 'rgba(255,255,255,0.45)' }}>DRAMATIZED RECONSTRUCTION</div>}
    </AbsoluteFill>
  );
};

/** Weather / atmosphere particles. */
export const Particles: React.FC<{ kind: 'snow' | 'embers' | 'dust' | 'smoke'; n?: number; wind?: number; o?: number }> = ({ kind, n = 160, wind = 1, o = 1 }) => {
  const f = useCurrentFrame();
  if (o <= 0) return null;
  if (kind === 'smoke') {
    return (
      <AbsoluteFill style={{ opacity: o, pointerEvents: 'none' }}>
        <svg width={1920} height={1080}><defs><filter id="smk"><feGaussianBlur stdDeviation="40" /></filter></defs>
          {Array.from({ length: 9 }, (_, i) => { const x = ((hash01(i, 3) * 2400 + f * (0.6 + hash01(i, 4)) * wind) % 2600) - 340; const y = 600 + hash01(i, 5) * 500 - (f * 0.15) % 200;
            return <ellipse key={i} cx={x} cy={y} rx={420} ry={150} fill="rgba(200,195,185,0.22)" filter="url(#smk)" />; })}
        </svg>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ opacity: o, pointerEvents: 'none' }}>
      <svg width={1920} height={1080}>
        {Array.from({ length: n }, (_, i) => {
          const z = 0.4 + hash01(i, 7) * 0.9;
          if (kind === 'snow') {
            const sp = (1.6 + hash01(i, 2) * 2.2) * z; const x = ((hash01(i, 1) * 2200 + f * sp * 1.4 * wind + 40 * Math.sin(f * 0.03 + i)) % 2200) - 140; const y = ((hash01(i, 5) * 1200 + f * sp * 2.6) % 1200) - 60;
            return <circle key={i} cx={x} cy={y} r={1.4 + z * 2.6} fill="#fff" opacity={0.35 + 0.5 * z} />;
          }
          if (kind === 'embers') {
            const sp = (1 + hash01(i, 2) * 2) * z; const x = ((hash01(i, 1) * 2000 + 30 * Math.sin(f * 0.05 + i) + f * 0.5 * wind) % 2000) - 40; const y = 1100 - ((hash01(i, 5) * 1200 + f * sp * 2.2) % 1200);
            return <circle key={i} cx={x} cy={y} r={1 + z * 2.2} fill={hash01(i, 9) > 0.5 ? '#ffb347' : '#ff6a2a'} opacity={(0.4 + 0.6 * z) * (0.6 + 0.4 * Math.sin(f * 0.3 + i))} />;
          }
          const x = ((hash01(i, 1) * 2000 + f * 0.4 * wind * z) % 2000) - 40; const y = (hash01(i, 5) * 1080 + 20 * Math.sin(f * 0.02 + i)) % 1080;
          return <circle key={i} cx={x} cy={y} r={1 + z * 1.6} fill="#f6dfb0" opacity={0.15 + 0.25 * z} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** Lower third: name + role, gold rule. */
export const LowerThird: React.FC<{ name: string; role: string; at: number; out?: number }> = ({ name, role, at, out }) => {
  const f = useCurrentFrame(); const p = ease(f, at, at + 16); const o = out !== undefined ? 1 - ease(f, out, out + 12) : 1;
  if (p <= 0 || o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 90, bottom: 210, opacity: o, transform: `translateX(${(1 - p) * -40}px)` }}>
      <div style={{ width: 140 * p, height: 4, background: GOLD, marginBottom: 14 }} />
      <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 54, color: '#fff', letterSpacing: 1, textShadow: '0 4px 20px rgba(0,0,0,0.85)', opacity: p }}>{name}</div>
      <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 4, color: GOLD, marginTop: 6, textTransform: 'uppercase', textShadow: '0 2px 10px #000', opacity: lin(f, at + 8, at + 18) }}>{role}</div>
    </div>
  );
};

/** Date / location tag, top left. */
export const DateTag: React.FC<{ text: string; at?: number; out?: number }> = ({ text, at = 6, out }) => {
  const f = useCurrentFrame(); const p = ease(f, at, at + 14); const o = out !== undefined ? 1 - ease(f, out, out + 12) : 1;
  if (p <= 0 || o <= 0) return null;
  const n = Math.floor(lin(f, at, at + 26) * text.length);
  return <div style={{ position: 'absolute', left: 90, top: 70, opacity: o, fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: '#fff', textShadow: '0 2px 12px #000', borderLeft: `5px solid ${GOLD}`, paddingLeft: 18 }}>{text.slice(0, n)}</div>;
};

/** Chapter card: number + title over a dimmed frame. */
export const Chapter: React.FC<{ num: string; title: string; at?: number; dur?: number }> = ({ num, title, at = 0, dur = 80 }) => {
  const f = useCurrentFrame(); const o = lin(f, at, at + 12) * (1 - lin(f, at + dur - 14, at + dur));
  if (o <= 0) return null;
  const k = ease(f, at, at + 30);
  return (
    <AbsoluteFill style={{ background: `rgba(0,0,0,${0.55 * o})`, alignItems: 'center', justifyContent: 'center', opacity: o }}>
      <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 14, color: GOLD }}>CHAPTER {num}</div>
      <div style={{ width: 420 * k, height: 2, background: GOLD, margin: '22px 0' }} />
      <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 110, color: '#fff', letterSpacing: 2, textShadow: '0 6px 40px rgba(0,0,0,0.8)', transform: `scale(${1.06 - 0.06 * k})` }}>{title}</div>
    </AbsoluteFill>
  );
};

/** Stat card (number + label) bottom-left. */
export const Stat: React.FC<{ value: React.ReactNode; label: string; at: number; out?: number; x?: number; y?: number; color?: string; size?: number }> = ({ value, label, at, out, x = 90, y = 640, color = '#fff', size = 120 }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const k = spring({ frame: f - at, fps, config: { damping: 16, stiffness: 140 } }); const o = out !== undefined ? 1 - ease(f, out, out + 10) : 1;
  if (f < at || o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y, opacity: o * Math.min(1, k * 1.5), transform: `translateY(${(1 - k) * 40}px)` }}>
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: size, lineHeight: 1, color, letterSpacing: -2, textShadow: '0 6px 30px rgba(0,0,0,0.85)' }}>{value}</div>
      <div style={{ fontFamily: MONO, fontSize: 28, letterSpacing: 4, color: '#fff', marginTop: 10, textTransform: 'uppercase', textShadow: '0 2px 10px #000' }}>{label}</div>
    </div>
  );
};
export const Num: React.FC<{ from: number; to: number; at: number; dur: number; suffix?: string; prefix?: string; plain?: boolean }> = ({ from, to, at, dur, suffix = '', prefix = '', plain }) => {
  const f = useCurrentFrame(); const v = Math.round(from + (to - from) * ease(f, at, at + dur));
  return <>{prefix}{plain ? v : v.toLocaleString('en-US')}{suffix}</>;
};

/** Stack of stat rows that build one by one (right side). */
export const StatStack: React.FC<{ rows: { v: number; label: string; at: number }[]; x?: number; y?: number }> = ({ rows, x = 1080, y = 220 }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 760 }}>
      {rows.map((r, i) => { const p = ease(f, r.at, r.at + 14); if (p <= 0) return null;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 24, padding: '16px 28px', marginBottom: 14, background: 'rgba(8,10,14,0.62)', borderLeft: `6px solid ${GOLD}`, opacity: p, transform: `translateX(${(1 - p) * 60}px)` }}>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 72, color: '#fff', minWidth: 330, textAlign: 'right' }}><Num from={0} to={r.v} at={r.at} dur={20} /></div>
            <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 4, color: GOLD, textTransform: 'uppercase' }}>{r.label}</div>
          </div>
        ); })}
    </div>
  );
};

/** Chips row. */
export const Chips: React.FC<{ items: { t: string; at: number; color?: string }[]; y: number; x?: number }> = ({ items, y, x = 90 }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <div style={{ position: 'absolute', left: x, right: 90, top: y, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      {items.map((it, i) => { if (f < it.at) return null; const k = spring({ frame: f - it.at, fps, config: { damping: 14, stiffness: 200 } });
        return <div key={i} style={{ transform: `scale(${k})`, background: it.color ?? 'rgba(10,12,16,0.72)', border: `2px solid ${GOLD}`, color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 36, padding: '10px 28px', borderRadius: 999, letterSpacing: 1, textTransform: 'uppercase' }}>{it.t}</div>; })}
    </div>
  );
};

/** Big centred statement (serif). */
export const Statement: React.FC<{ text: string; at: number; out?: number; size?: number; y?: number; color?: string }> = ({ text, at, out, size = 96, y = 420, color = '#fff' }) => {
  const f = useCurrentFrame(); const p = ease(f, at, at + 18); const o = out !== undefined ? 1 - ease(f, out, out + 12) : 1;
  if (p <= 0 || o <= 0) return null;
  return <div style={{ position: 'absolute', left: 120, right: 120, top: y, textAlign: 'center', opacity: p * o, fontFamily: SERIF, fontWeight: 900, fontSize: size, lineHeight: 1.1, color, textShadow: '0 6px 40px rgba(0,0,0,0.9)', transform: `translateY(${(1 - p) * 20}px)` }}>{text}</div>;
};

/** Thermometer graphic (°C). */
export const Thermo: React.FC<{ t: number; at: number; x?: number; y?: number }> = ({ t, at, x = 1560, y = 200 }) => {
  const f = useCurrentFrame(); const p = ease(f, at, at + 12); if (p <= 0) return null;
  const v = 20 + (t - 20) * ease(f, at, at + 60); const h = 520; const fill = ((v + 40) / 70) * h;
  return (
    <div style={{ position: 'absolute', left: x, top: y, opacity: p }}>
      <svg width={220} height={640}>
        <rect x={80} y={20} width={50} height={h} rx={25} fill="rgba(255,255,255,0.12)" stroke="#fff" strokeWidth={4} />
        <rect x={90} y={20 + h - fill} width={30} height={fill} rx={15} fill={v < 0 ? '#6fb2ff' : '#ff6a3a'} />
        <circle cx={105} cy={h + 50} r={46} fill={v < 0 ? '#6fb2ff' : '#ff6a3a'} stroke="#fff" strokeWidth={4} />
        {[20, 0, -20, -40].map((d) => <g key={d}><line x1={135} x2={160} y1={20 + h - ((d + 40) / 70) * h} y2={20 + h - ((d + 40) / 70) * h} stroke="#fff" strokeWidth={3} /><text x={166} y={28 + h - ((d + 40) / 70) * h} fontFamily={MONO} fontSize={22} fill="#fff">{d}°</text></g>)}
      </svg>
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 64, color: '#cfe3ff', textAlign: 'center', width: 220, textShadow: '0 4px 20px #000' }}>{Math.round(v)}°C</div>
    </div>
  );
};

/** Grain, vignette, letterbox fade (persistent finish). */
export const Finish: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <Img src={staticFile(`assets/textures/grain_${Math.floor(f / 2) % 8}.png`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'overlay', opacity: 0.18 }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 75% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)' }} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.6) 100%)' }} />
    </AbsoluteFill>
  );
};
