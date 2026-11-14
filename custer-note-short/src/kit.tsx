import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Img, continueRender, delayRender, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, H, HEAD, MONO, SANS, SERIF, TYPE, W, ease, hash01, lin, noise1 } from './theme';

/* ───────────── fonts / stage ───────────── */
const css = [300, 400, 600, 800].map((w) => `@font-face{font-family:'Inter';src:url('${staticFile(`assets/fonts/Inter-${w}.woff2`)}') format('woff2');font-weight:${w};}`).join('')
  + `@font-face{font-family:'Plex Mono';src:url('${staticFile('assets/fonts/PlexMono-500.woff2')}') format('woff2');font-weight:500;}`
  + [500, 700].map((w) => `@font-face{font-family:'Oswald';src:url('${staticFile(`assets/fonts/Oswald-${w}.woff2`)}') format('woff2');font-weight:${w};}`).join('')
  + [400, 700].map((w) => `@font-face{font-family:'Courier Prime';src:url('${staticFile(`assets/fonts/CourierPrime-${w}.woff2`)}') format('woff2');font-weight:${w};}`).join('')
  + `@font-face{font-family:'Playfair';src:url('${staticFile('assets/fonts/Playfair-900.woff2')}') format('woff2');font-weight:900;}`
  + `@font-face{font-family:'Playfair';src:url('${staticFile('assets/fonts/Playfair-700i.woff2')}') format('woff2');font-weight:700;font-style:italic;}`;
export const Fonts: React.FC = () => {
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all(['800 40px Inter', '500 40px "Plex Mono"', '700 40px Oswald', '500 40px Oswald', '400 40px "Courier Prime"', '700 40px "Courier Prime"', '900 40px Playfair', 'italic 700 40px Playfair'].map((f) => document.fonts.load(f)))
      .then(() => continueRender(h)).catch(() => continueRender(h));
  }, [h]);
  return <style>{css}</style>;
};

export const Parchment: React.FC<{ dark?: number }> = ({ dark = 0 }) => (
  <AbsoluteFill>
    <Img src={staticFile('assets/backgrounds/paper.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    <AbsoluteFill style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(60,45,30,0.06) 0 1px, transparent 1px 64px), repeating-linear-gradient(90deg, rgba(60,45,30,0.06) 0 1px, transparent 1px 64px)' }} />
    {dark > 0 && <AbsoluteFill style={{ background: `rgba(29,27,25,${dark})` }} />}
  </AbsoluteFill>
);

/** Slow drift + optional push toward a point. */
export const Cam: React.FC<{ push?: number; ox?: number; oy?: number; children: React.ReactNode }> = ({ push = 0, ox = 50, oy = 50, children }) => {
  const f = useCurrentFrame();
  const dx = 10 * noise1(f * 0.004, 2), dy = 7 * noise1(f * 0.004, 9);
  return <AbsoluteFill style={{ transform: `translate(${dx}px, ${dy}px) scale(${1.02 + push})`, transformOrigin: `${ox}% ${oy}%` }}>{children}</AbsoluteFill>;
};

export const Finish: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <Img src={staticFile(`assets/textures/grain_${Math.floor(f / 2) % 8}.png`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'overlay', opacity: 0.14 }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 80% 75% at 50% 48%, rgba(0,0,0,0) 58%, rgba(30,20,10,0.55) 100%)' }} />
    </AbsoluteFill>
  );
};

/* ───────────── animation helpers ───────────── */
export const usePop = (at: number, damping = 13) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return f < at ? 0 : spring({ frame: f - at, fps, config: { damping, stiffness: 170 } });
};
const PAPER_EDGE = 'drop-shadow(3px 0 0 #fbf7ee) drop-shadow(-3px 0 0 #fbf7ee) drop-shadow(0 3px 0 #fbf7ee) drop-shadow(0 -3px 0 #fbf7ee) drop-shadow(0 12px 14px rgba(20,12,4,0.45))';

/** Polaroid photo card: archival portrait or dramatized still. Drops in with a settle. */
export const Photo: React.FC<{ src: string; at: number; x: number; y: number; w: number; h: number; rot?: number; caption?: string; credit?: string; pos?: string; zoom?: number; out?: number; grade?: 'sepia' | 'bw' | 'warm' | 'cold' | 'none'; z?: number }> = ({
  src, at, x, y, w, h, rot = 0, caption, credit, pos = '50% 40%', zoom = 0.06, out, grade = 'sepia', z,
}) => {
  const f = useCurrentFrame();
  const k = usePop(at, 14);
  if (k <= 0) return null;
  const o = Math.min(1, k * 1.5) * (out !== undefined ? 1 - lin(f, out - 8, out) : 1);
  if (o <= 0) return null;
  const filt = grade === 'sepia' ? 'sepia(0.45) contrast(1.05) saturate(0.85)' : grade === 'bw' ? 'grayscale(1) sepia(0.25) contrast(1.1)' : grade === 'warm' ? 'sepia(0.2) saturate(0.95) contrast(1.05)' : grade === 'cold' ? 'saturate(0.6) sepia(0.15) hue-rotate(-8deg) contrast(1.08)' : 'none';
  const kb = 1 + zoom * lin(f, at, at + 400);
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, zIndex: z, opacity: o, background: '#f4eedf', padding: 14, paddingBottom: caption ? 64 : 14,
      transform: `rotate(${rot + (1 - k) * 6}deg) scale(${1.12 - 0.12 * k})`, boxShadow: '0 22px 44px rgba(20,12,4,0.5)' }}>
      <div style={{ width: w - 28, height: h, overflow: 'hidden', background: '#222' }}>
        <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, transform: `scale(${kb})`, filter: filt }} />
      </div>
      {caption && <div style={{ position: 'absolute', left: 22, right: 18, bottom: 16, fontFamily: TYPE, fontWeight: 700, fontSize: Math.min(28, w / 15), color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden' }}>{caption}</div>}
      {credit && <div style={{ position: 'absolute', left: 30, top: '100%', marginTop: 8, fontFamily: TYPE, fontSize: 17, color: 'rgba(42,33,23,0.75)', whiteSpace: 'nowrap', transform: 'rotate(-1deg)' }}>{credit}</div>}
    </div>
  );
};

/** Typewriter tag with a red left rule (the Valkyrie "COLONEL · AGE 36" look). */
export const Note: React.FC<{ text: string; at: number; x: number; y: number; size?: number; dark?: boolean; color?: string; out?: number; w?: number }> = ({ text, at, x, y, size = 28, dark, color, out, w }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 6) * (out !== undefined ? 1 - lin(f, out - 8, out) : 1);
  if (o <= 0) return null;
  const n = Math.ceil(text.length * lin(f, at, at + Math.max(6, text.length * 0.7)));
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, opacity: o, fontFamily: TYPE, fontWeight: 700, fontSize: size, letterSpacing: 1.5, color: color ?? (dark ? C.paper : C.ink),
      background: dark ? 'rgba(29,27,25,0.78)' : 'rgba(239,230,210,0.9)', padding: '7px 14px', borderLeft: `6px solid ${C.red}`, whiteSpace: w ? 'normal' : 'nowrap' }}>
      {text.slice(0, n)}<span style={{ opacity: 0 }}>{text.slice(n)}</span>
    </div>
  );
};
export const Notes: React.FC<{ lines: string[]; at: number; x: number; y: number; gap?: number; size?: number; step?: number; dark?: boolean; out?: number }> = ({ lines, at, x, y, gap = 58, size = 28, step = 8, dark, out }) => (
  <>{lines.map((l, i) => <Note key={i} text={l} at={at + i * step} x={x} y={y + i * gap} size={i === 0 ? size + 4 : size} dark={dark} out={out} />)}</>
);

/** Condensed headline with a red underline swipe. */
export const Headline: React.FC<{ text: string; sub?: string; at: number; out?: number; x?: number; y?: number; size?: number; light?: boolean; align?: 'left' | 'center'; color?: string }> = ({
  text, sub, at, out, x, y = 120, size = 96, light, align = 'center', color,
}) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 8) * (out !== undefined ? 1 - lin(f, out - 8, out) : 1);
  if (o <= 0) return null;
  const u = ease(f, at + 6, at + 20);
  return (
    <div style={{ position: 'absolute', left: x ?? 80, right: x === undefined ? 80 : undefined, top: y, textAlign: align, opacity: o }}>
      <div style={{ display: 'inline-block', position: 'relative' }}>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: size, lineHeight: 1.02, letterSpacing: 1, whiteSpace: 'nowrap', textTransform: 'uppercase', color: color ?? (light ? C.paper : C.charcoal),
          transform: `translateY(${(1 - ease(f, at, at + 14)) * 24}px)`, textShadow: light ? '0 4px 20px rgba(0,0,0,0.85)' : 'none' }}>{text}</div>
        <div style={{ position: 'absolute', left: 0, bottom: -10, height: 9, width: `${100 * u}%`, background: C.red }} />
      </div>
      {sub && <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: light ? C.beige : C.red, marginTop: 26, opacity: lin(f, at + 10, at + 18) }}>{sub}</div>}
    </div>
  );
};

/** Red rubber stamp that slams in. */
export const Stamp: React.FC<{ text: string; at: number; x: number; y: number; size?: number; rot?: number; color?: string }> = ({ text, at, x, y, size = 64, rot = -8, color = C.red }) => {
  const k = usePop(at, 11);
  if (k <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${2.2 - 1.2 * k})`, opacity: Math.min(1, k * 2) * 0.92,
      fontFamily: HEAD, fontWeight: 700, fontSize: size, letterSpacing: 4, color, border: `${Math.max(4, size / 11)}px solid ${color}`, padding: `${size * 0.05}px ${size * 0.3}px`, whiteSpace: 'nowrap', textTransform: 'uppercase', mixBlendMode: 'multiply', borderRadius: 6 }}>{text}</div>
  );
};

/** Big number that counts up. */
export const Counter: React.FC<{ to: number; from?: number; at: number; dur?: number; x: number; y: number; size?: number; prefix?: string; suffix?: string; label?: string; color?: string; light?: boolean; align?: 'left' | 'center' }> = ({
  to, from = 0, at, dur = 30, x, y, size = 150, prefix = '', suffix = '', label, color, light, align = 'center',
}) => {
  const f = useCurrentFrame();
  const o = lin(f, at - 2, at + 6);
  if (o <= 0) return null;
  const v = Math.round(from + (to - from) * ease(f, at, at + dur));
  return (
    <div style={{ position: 'absolute', left: align === 'center' ? x - 600 : x, width: align === 'center' ? 1200 : undefined, top: y, textAlign: align, opacity: o }}>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: size, lineHeight: 1, color: color ?? (light ? C.paper : C.charcoal), textShadow: light ? '0 6px 24px rgba(0,0,0,0.8)' : 'none' }}>{prefix}{v.toLocaleString('en-US')}{suffix}</div>
      {label && <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: Math.max(26, size * 0.2), letterSpacing: 3, color: light ? C.beige : C.red, marginTop: 10, opacity: lin(f, at + 8, at + 16) }}>{label}</div>}
    </div>
  );
};

/* ───────────── paper-cut icons (100×100) ───────────── */
type IP = { c?: string };
export const ICONS: Record<string, React.FC<IP>> = {
  soldier: ({ c = C.blue }) => (<g><rect x="41" y="2" width="18" height="17" rx="2" fill={C.charcoal} /><circle cx="50" cy="26" r="9" fill="#d8b393" /><path d="M35 36 Q50 31 65 36 L63 70 L37 70 Z" fill={c} /><path d="M44 36 L50 60 L56 36" fill="#efe6d2" opacity="0.85" /><rect x="38" y="70" width="10" height="27" fill="#efe6d2" /><rect x="52" y="70" width="10" height="27" fill="#efe6d2" /><rect x="38" y="90" width="10" height="8" fill={C.charcoal} /><rect x="52" y="90" width="10" height="8" fill={C.charcoal} /><rect x="67" y="6" width="4" height="70" fill="#5a3d24" transform="rotate(8 69 40)" /></g>),
  horse: ({ c = '#6b4a2e' }) => (<g fill={c}><path d="M18 46 Q22 34 40 36 L66 36 Q70 22 80 16 L86 14 L84 22 L92 30 L88 36 L80 34 L76 44 Q76 52 72 56 L72 88 L66 88 L64 60 L36 60 L32 88 L26 88 L26 58 Q16 56 18 46 Z" /><path d="M18 46 Q8 52 10 66 Q14 56 20 52 Z" /></g>),
  wagon: ({ c = '#7a5a36' }) => (<g><path d="M14 30 Q50 8 86 30 L86 62 L14 62 Z" fill="#e8dcc0" stroke={C.charcoal} strokeWidth="3" /><rect x="10" y="58" width="80" height="10" fill={c} /><circle cx="26" cy="78" r="13" fill="none" stroke={C.charcoal} strokeWidth="5" /><circle cx="74" cy="78" r="13" fill="none" stroke={C.charcoal} strokeWidth="5" /><circle cx="26" cy="78" r="3" fill={C.charcoal} /><circle cx="74" cy="78" r="3" fill={C.charcoal} /></g>),
  cannon: ({ c = '#3b3a36' }) => (<g><rect x="16" y="36" width="70" height="17" rx="8" fill={c} transform="rotate(-14 50 45)" /><rect x="80" y="26" width="8" height="19" rx="3" fill={c} transform="rotate(-14 50 45)" /><circle cx="40" cy="70" r="19" fill="none" stroke="#6b4a2e" strokeWidth="7" /><path d="M40 51 L40 89 M21 70 L59 70 M27 57 L53 83 M53 57 L27 83" stroke="#6b4a2e" strokeWidth="3" /><path d="M48 66 L92 84" stroke="#6b4a2e" strokeWidth="8" strokeLinecap="round" /></g>),
  flame: ({ c = C.fire }) => (<g><path d="M50 4 Q72 30 70 56 Q80 46 78 34 Q94 56 86 76 Q76 98 50 98 Q22 98 14 76 Q8 56 24 40 Q24 54 32 58 Q28 30 50 4 Z" fill={c} /><path d="M50 40 Q64 58 62 74 Q60 90 50 90 Q38 90 37 76 Q36 62 50 40 Z" fill={C.gold} /></g>),
  snowflake: ({ c = '#5d7fa6' }) => (<g stroke={c} strokeWidth="7" strokeLinecap="round" fill="none">{[0, 60, 120].map((a) => <g key={a} transform={`rotate(${a} 50 50)`}><path d="M50 6 L50 94" /><path d="M38 16 L50 28 L62 16 M38 84 L50 72 L62 84" /></g>)}</g>),
  envelope: ({ c = '#f1e7cf' }) => (<g><rect x="6" y="22" width="88" height="58" rx="3" fill={c} stroke={C.charcoal} strokeWidth="3" /><path d="M6 24 L50 58 L94 24" fill="none" stroke={C.charcoal} strokeWidth="3" /><circle cx="50" cy="58" r="9" fill={C.red} /></g>),
  key: ({ c = '#b8913a' }) => (<g fill="none" stroke={c} strokeWidth="9" strokeLinecap="round"><circle cx="28" cy="50" r="17" /><path d="M45 50 L92 50 M80 50 L80 66 M68 50 L68 62" /></g>),
  crown: ({ c = '#c9a13b' }) => (<g><path d="M10 78 L16 30 L34 54 L50 20 L66 54 L84 30 L90 78 Z" fill={c} stroke={C.charcoal} strokeWidth="3" /><rect x="10" y="74" width="80" height="12" fill={c} stroke={C.charcoal} strokeWidth="3" /><circle cx="50" cy="20" r="5" fill={C.red} /></g>),
  ship: ({ c = '#2f3f5a' }) => (<g><path d="M8 66 L92 66 L80 86 L20 86 Z" fill={c} /><rect x="48" y="8" width="4" height="58" fill={C.charcoal} /><path d="M26 18 L46 18 L46 60 L22 60 Z M54 14 L76 22 L78 56 L54 60 Z" fill="#efe6d2" stroke={C.charcoal} strokeWidth="2" /><path d="M52 8 L66 12 L52 16 Z" fill={C.red} /><rect x="24" y="70" width="52" height="5" fill="#efe6d2" opacity="0.6" /></g>),
  lock: ({ c = '#3b3a36' }) => (<g><path d="M30 46 L30 32 Q30 12 50 12 Q70 12 70 32 L70 46" fill="none" stroke={c} strokeWidth="9" /><rect x="20" y="44" width="60" height="46" rx="6" fill={C.red} /><circle cx="50" cy="63" r="6" fill={C.charcoal} /><rect x="47" y="64" width="6" height="14" fill={C.charcoal} /></g>),
  horseshoe: ({ c = '#6a6a66' }) => (<g><path d="M22 90 L20 50 Q20 14 50 14 Q80 14 80 50 L78 90 L64 90 L66 52 Q66 30 50 30 Q34 30 34 52 L36 90 Z" fill={c} />{[[24, 56], [24, 74], [76, 56], [76, 74], [32, 30], [68, 30]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="#efe6d2" />)}</g>),
  sleigh: ({ c = C.red }) => (<g><path d="M18 40 L70 40 Q80 40 80 56 L80 66 L24 66 Q16 66 18 40 Z" fill={c} /><path d="M10 80 L84 80 Q96 80 94 66" fill="none" stroke={C.charcoal} strokeWidth="5" strokeLinecap="round" /><path d="M30 66 L30 80 M66 66 L66 80" stroke={C.charcoal} strokeWidth="4" /><rect x="22" y="22" width="22" height="20" rx="4" fill={C.charcoal} /></g>),
  bridge: ({ c = '#7a5a36' }) => (<g><rect x="4" y="44" width="92" height="9" fill={c} />{[12, 30, 48, 66, 84].map((x) => <rect key={x} x={x} y="52" width="6" height="30" fill={c} />)}<path d="M2 84 Q14 78 26 84 T50 84 T74 84 T98 84" fill="none" stroke="#5d7fa6" strokeWidth="5" /></g>),
  skull: ({ c = '#efe6d2' }) => (<g><path d="M50 10 Q84 10 84 44 Q84 60 72 66 L72 80 L28 80 L28 66 Q16 60 16 44 Q16 10 50 10 Z" fill={c} stroke={C.charcoal} strokeWidth="3" /><circle cx="36" cy="44" r="9" fill={C.charcoal} /><circle cx="64" cy="44" r="9" fill={C.charcoal} /><path d="M46 58 L50 50 L54 58 Z" fill={C.charcoal} /><path d="M38 80 L38 70 M50 80 L50 70 M62 80 L62 70" stroke={C.charcoal} strokeWidth="3" /></g>),
  redcoat: ({ c = '#b3261e' }) => (<g><path d="M36 20 Q36 4 50 4 Q64 4 64 20 L70 22 L30 22 Z" fill="#f2efe6" stroke={C.charcoal} strokeWidth="2" /><circle cx="50" cy="29" r="8" fill="#d8b393" /><path d="M34 38 Q50 33 66 38 L64 70 L36 70 Z" fill={c} /><rect x="36" y="58" width="28" height="4" fill="#f2efe6" /><rect x="38" y="70" width="10" height="27" fill="#1f2433" /><rect x="52" y="70" width="10" height="27" fill="#1f2433" /><rect x="68" y="4" width="4" height="74" fill="#5a3d24" transform="rotate(6 70 40)" /></g>),
  warrior: ({ c = '#3a2a1e' }) => (<g><rect x="60" y="2" width="4" height="70" fill="#6b4a2e" transform="rotate(10 62 40)" /><path d="M62 2 L58 14 L66 14 Z" fill="#9aa0a6" transform="rotate(10 62 40)" /><ellipse cx="42" cy="50" rx="24" ry="44" fill="#f2efe6" stroke={C.charcoal} strokeWidth="3" /><path d="M30 24 Q38 30 34 44 Q28 40 30 24 Z M48 56 Q58 62 52 78 Q44 70 48 56 Z M32 64 Q38 66 36 76 Q30 72 32 64 Z" fill={c} /><rect x="40" y="8" width="4" height="84" fill="#6b4a2e" /></g>),
  sack: ({ c = '#d9c48f' }) => (<g><path d="M18 30 Q14 92 50 92 Q86 92 82 30 Q66 22 50 26 Q34 22 18 30 Z" fill={c} stroke={C.charcoal} strokeWidth="3" /><path d="M30 26 Q50 8 70 26" fill="none" stroke={C.charcoal} strokeWidth="4" /><text x="50" y="68" textAnchor="middle" fontFamily="Courier Prime" fontWeight="700" fontSize="16" fill={C.charcoal}>MEALIE</text></g>),
  box: ({ c = '#a77a45' }) => (<g><rect x="12" y="26" width="76" height="58" fill={c} stroke={C.charcoal} strokeWidth="3" /><path d="M12 45 L88 45 M12 65 L88 65" stroke={C.charcoal} strokeWidth="2" /><text x="50" y="60" textAnchor="middle" fontFamily="Courier Prime" fontWeight="700" fontSize="13" fill={C.charcoal}>BISCUIT</text></g>),
  vc: ({ c = '#8a6a3a' }) => (<g><rect x="38" y="2" width="24" height="30" fill="#8c1d2c" /><rect x="34" y="30" width="32" height="6" fill={c} /><path d="M50 40 L58 46 Q66 44 72 38 Q70 52 74 60 Q70 68 72 82 Q66 76 58 74 L50 80 L42 74 Q34 76 28 82 Q30 68 26 60 Q30 52 28 38 Q34 44 42 46 Z" fill={c} stroke="#4a3518" strokeWidth="2" /><circle cx="50" cy="60" r="10" fill="#a8844a" stroke="#4a3518" strokeWidth="2" /></g>),
  clock: ({ c = '#f6f0e2' }) => (<g><circle cx="50" cy="52" r="40" fill={c} stroke={C.charcoal} strokeWidth="5" /><path d="M50 52 L50 24 M50 52 L70 60" stroke={C.charcoal} strokeWidth="6" strokeLinecap="round" /><rect x="42" y="4" width="16" height="8" fill={C.charcoal} /></g>),
  eagle: ({ c = '#c9a13b' }) => (<g fill={c} stroke={C.charcoal} strokeWidth="2"><path d="M50 30 Q42 14 30 18 Q20 22 6 14 Q12 34 28 40 Q14 42 8 52 Q26 52 36 48 L40 70 L34 88 L50 80 L66 88 L60 70 L64 48 Q74 52 92 52 Q86 42 72 40 Q88 34 94 14 Q80 22 70 18 Q58 14 50 30 Z" /><circle cx="50" cy="26" r="7" /></g>),
};
/** An icon placed on the canvas with a white paper-cut edge; pops in. */
export const Ico: React.FC<{ name: keyof typeof ICONS | string; at: number; x: number; y: number; s?: number; c?: string; rot?: number; o?: number; grey?: number; out?: number }> = ({ name, at, x, y, s = 120, c, rot = 0, o = 1, grey = 0, out }) => {
  const f = useCurrentFrame();
  const k = usePop(at, 12);
  if (k <= 0) return null;
  const I = ICONS[name];
  const oo = o * Math.min(1, k * 2) * (out !== undefined ? 1 - lin(f, out - 8, out) : 1);
  if (oo <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, opacity: oo, transform: `rotate(${rot}deg) scale(${0.4 + 0.6 * k})`, filter: `${PAPER_EDGE} grayscale(${grey})` }}>
      <svg viewBox="0 0 100 100" width={s} height={s}><I c={c} /></svg>
    </div>
  );
};

/** A grid of soldier icons; `state(i)` returns 0 (normal), 1 (lost: faded with red slash) or 2 (highlight). */
export const Troops: React.FC<{ n: number; cols: number; x: number; y: number; size?: number; gap?: number; at: number; colorOf?: (i: number) => string; lost?: (i: number) => number; icon?: string }> = ({
  n, cols, x, y, size = 46, gap = 6, at, colorOf, lost, icon = 'soldier',
}) => {
  const f = useCurrentFrame();
  const I = ICONS[icon];
  return (
    <svg style={{ position: 'absolute', left: x, top: y, overflow: 'visible' }} width={cols * (size + gap)} height={Math.ceil(n / cols) * (size + gap)}>
      {Array.from({ length: n }, (_, i) => {
        const appear = lin(f, at + (i % cols) * 0.6 + Math.floor(i / cols) * 1.2, at + (i % cols) * 0.6 + Math.floor(i / cols) * 1.2 + 6);
        if (appear <= 0) return null;
        const l = lost ? lost(i) : 0;
        const cx = (i % cols) * (size + gap), cy = Math.floor(i / cols) * (size + gap);
        return (
          <g key={i} transform={`translate(${cx},${cy + (1 - appear) * 10}) scale(${size / 100})`} opacity={appear * (1 - 0.72 * l)}>
            <I c={colorOf ? colorOf(i) : C.blue} />
            {l > 0.5 && <path d="M15 85 L85 15" stroke={C.red} strokeWidth="9" opacity={(l - 0.5) * 2} />}
          </g>
        );
      })}
    </svg>
  );
};

/** Tear-off calendar page. */
export const Calendar: React.FC<{ at: number; x: number; y: number; day: string; month: string; year?: string; s?: number; rot?: number }> = ({ at, x, y, day, month, year, s = 1, rot = -3 }) => {
  const k = usePop(at, 12);
  if (k <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 240 * s, transform: `rotate(${rot}deg) scale(${0.5 + 0.5 * k})`, opacity: Math.min(1, k * 2), boxShadow: '0 16px 30px rgba(20,12,4,0.45)', background: '#f6f0e2', textAlign: 'center' }}>
      <div style={{ background: C.red, color: C.paper, fontFamily: HEAD, fontWeight: 700, fontSize: 36 * s, letterSpacing: 4, padding: `${6 * s}px 0` }}>{month}</div>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 120 * s, lineHeight: 1.1, color: C.charcoal }}>{day}</div>
      {year && <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 30 * s, color: C.dim, paddingBottom: 10 * s }}>{year}</div>}
    </div>
  );
};

/** Thermometer with a falling/rising column and °F / °C readout. */
export const Thermo: React.FC<{ at: number; x: number; y: number; fromC: number; toC: number; dur?: number; s?: number }> = ({ at, x, y, fromC, toC, dur = 60, s = 1 }) => {
  const f = useCurrentFrame();
  const k = usePop(at, 14);
  if (k <= 0) return null;
  const t = fromC + (toC - fromC) * ease(f, at + 6, at + 6 + dur);
  const h = 420 * s, fill = Math.max(0.04, Math.min(1, (t + 40) / 80));
  const col = t < 0 ? '#3f6fb0' : t > 25 ? C.redHi : '#c98a2a';
  const F = Math.round(t * 9 / 5 + 32);
  return (
    <div style={{ position: 'absolute', left: x, top: y, opacity: Math.min(1, k * 2), transform: `scale(${0.6 + 0.4 * k})`, filter: PAPER_EDGE }}>
      <svg width={120 * s} height={h + 110 * s}>
        <rect x={35 * s} y={0} width={50 * s} height={h} rx={25 * s} fill="#f6f0e2" stroke={C.charcoal} strokeWidth={4} />
        <rect x={47 * s} y={12 * s + (h - 24 * s) * (1 - fill)} width={26 * s} height={(h - 24 * s) * fill + 20} fill={col} />
        <circle cx={60 * s} cy={h + 40 * s} r={48 * s} fill={col} stroke={C.charcoal} strokeWidth={4} />
        {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={85 * s} x2={100 * s} y1={14 * s + i * (h - 28 * s) / 4} y2={14 * s + i * (h - 28 * s) / 4} stroke={C.charcoal} strokeWidth={3} />)}
      </svg>
      <div style={{ position: 'absolute', left: 130 * s, top: h * 0.3, whiteSpace: 'nowrap' }}>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 110 * s, lineHeight: 1, color: col }}>{F > 0 ? '+' : F < 0 ? '−' : ''}{Math.abs(F)}°F</div>
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 40 * s, color: C.ink }}>{t > 0 ? '+' : t < 0 ? '−' : ''}{Math.abs(Math.round(t))}°C</div>
      </div>
    </div>
  );
};

/** Labelled horizontal bar (Vox comparison bar). */
export const Bar: React.FC<{ at: number; x: number; y: number; w: number; p: number; label: string; value?: string; color?: string; h?: number }> = ({ at, x, y, w, p, label, value, color = C.blue, h = 54 }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 8);
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y, opacity: o }}>
      <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 28, color: C.ink, marginBottom: 8 }}>{label}</div>
      <div style={{ width: w, height: h, background: 'rgba(42,33,23,0.12)', border: `3px solid ${C.charcoal}` }}>
        <div style={{ width: `${100 * Math.max(0, Math.min(1, p))}%`, height: '100%', background: color }} />
      </div>
      {value && <div style={{ position: 'absolute', left: w + 20, top: 40, fontFamily: HEAD, fontWeight: 700, fontSize: 52, color: C.charcoal, whiteSpace: 'nowrap' }}>{value}</div>}
    </div>
  );
};

/** Drawn red X / check over a point. */
export const Mark: React.FC<{ at: number; x: number; y: number; s?: number; ok?: boolean }> = ({ at, x, y, s = 120, ok }) => {
  const f = useCurrentFrame();
  const p = ease(f, at, at + 10);
  if (p <= 0) return null;
  const col = ok ? C.green : C.redHi;
  return (
    <svg style={{ position: 'absolute', left: x - s / 2, top: y - s / 2, overflow: 'visible' }} width={s} height={s} viewBox="0 0 100 100">
      {ok ? <path d="M12 54 L40 80 L90 18" fill="none" stroke={col} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 1`} />
        : <><path d="M14 14 L86 86" stroke={col} strokeWidth="14" strokeLinecap="round" pathLength={1} strokeDasharray={`${Math.min(1, p * 2)} 1`} /><path d="M86 14 L14 86" stroke={col} strokeWidth="14" strokeLinecap="round" pathLength={1} strokeDasharray={`${Math.max(0, p * 2 - 1)} 1`} /></>}
    </svg>
  );
};

/** Snowfall / embers / ash over the frame (deterministic). */
export const Particles: React.FC<{ kind: 'snow' | 'embers' | 'ash'; n?: number; o?: number }> = ({ kind, n = 90, o = 1 }) => {
  const f = useCurrentFrame();
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: o, pointerEvents: 'none' }}>
      {Array.from({ length: n }, (_, i) => {
        const sp = kind === 'embers' ? -(1.2 + hash01(i, 3) * 2) : 1 + hash01(i, 3) * 2.4;
        const x = (hash01(i, 1) * (W + 180) + f * (kind === 'snow' ? 0.9 : 0.4) + 40 * Math.sin(f / 40 + i)) % (W + 80) - 40;
        const y = ((hash01(i, 2) * (H + 120) + f * sp) % (H + 120) + H + 120) % (H + 120) - 60;
        const r = kind === 'snow' ? 2 + hash01(i, 4) * 5 : 1.5 + hash01(i, 4) * 3;
        const col = kind === 'snow' ? '#fbfaf6' : kind === 'embers' ? (i % 2 ? '#ffb347' : '#ff6a1a') : '#5a534a';
        return <circle key={i} cx={x} cy={y} r={r} fill={col} opacity={kind === 'embers' ? 0.5 + 0.5 * Math.sin(f / 5 + i) : 0.85} />;
      })}
    </svg>
  );
};

/** Bold word-chunk captions (as in the Valkyrie Short), lower third. */
export const BigCaption: React.FC<{ words: { w: string; start: number }[]; t: number; keys: Set<string>; k: number }> = ({ words, t, keys, k }) => (
  <div style={{ position: 'absolute', left: 70, right: 70, top: 1270, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 18px', transform: `scale(${0.92 + 0.08 * k})`, opacity: Math.min(1, k * 1.6) }}>
    {words.map((w, i) => {
      const on = t >= w.start - 0.03;
      const key = keys.has(w.w.toLowerCase().replace(/[^a-z0-9,]/g, '').replace(/,$/, ''));
      return <span key={i} style={{ fontFamily: SANS, fontWeight: 800, fontSize: key ? 86 : 76, lineHeight: 1.1, textTransform: 'uppercase', color: on ? (key ? C.gold : '#fff') : 'rgba(255,255,255,0.5)', WebkitTextStroke: '10px #1d1b19', paintOrder: 'stroke fill', textShadow: '0 6px 18px rgba(0,0,0,0.7)' }}>{w.w}</span>;
    })}
  </div>
);

/** Quote card (serif italic). */
export const Quote: React.FC<{ at: number; text: string; by: string; x: number; y: number; w: number; out?: number }> = ({ at, text, by, x, y, w, out }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 10) * (out !== undefined ? 1 - lin(f, out - 8, out) : 1);
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, opacity: o, background: '#f6f0e2', padding: '30px 40px', boxShadow: '0 16px 36px rgba(20,12,4,0.45)', borderTop: `8px solid ${C.red}`, transform: 'rotate(-1deg)' }}>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 52, lineHeight: 1.2, color: C.charcoal }}>“{text}”</div>
      <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 26, color: C.red, marginTop: 18 }}>— {by}</div>
    </div>
  );
};

/** Small source / disclaimer tag, bottom-left of a scene. */
export const Src: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: 'absolute', left: 36, top: 26, fontFamily: MONO, fontSize: 16, letterSpacing: 2, color: 'rgba(42,33,23,0.6)', textTransform: 'uppercase' }}>{text}</div>
);
