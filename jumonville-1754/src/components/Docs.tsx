import React from 'react';
import { AbsoluteFill, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, HEAD, MONO, PHRASES, SANS, TYPE, ease, lin } from '../theme';

/** Paper card sliding in with friction, settling with a slight rotation; optional 3D tip-in. */
export const Card: React.FC<{ at: number; x: number; y: number; w: number; rot?: number; from?: 'left' | 'right' | 'bottom' | 'top'; tilt?: number; out?: number; pad?: number; children: React.ReactNode; dark?: boolean }> = ({
  at, x, y, w, rot = -1.5, from = 'right', tilt = 0, out, pad = 34, children, dark,
}) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  if (f < at) return null;
  const k = spring({ frame: f - at, fps, config: { damping: 22, stiffness: 120, mass: 1.1 } });
  const g = out !== undefined ? ease(f, out, out + 12) : 0;
  const d = (1 - k) * 1300 + g * 1500;
  const tx = from === 'left' ? -d : from === 'right' ? d : 0, ty = from === 'bottom' ? d : from === 'top' ? -d : 0;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, padding: pad, transform: `perspective(1600px) translate(${tx}px, ${ty}px) rotate(${rot * k}deg) rotateX(${tilt * (1 - k)}deg)`,
      background: dark ? 'rgba(20,14,8,0.86)' : `url(${staticFile('assets/backgrounds/paper.jpg')}) center/cover`, boxShadow: '0 24px 60px rgba(20,12,4,0.55)', border: dark ? '1px solid rgba(240,220,180,0.3)' : '1px solid rgba(60,40,20,0.35)' }}>
      {children}
    </div>
  );
};

export const Typed: React.FC<{ text: string; a: number; b: number; size?: number; color?: string; font?: 'type' | 'quill'; bold?: boolean; align?: 'left' | 'center' }> = ({ text, a, b, size = 34, color = C.ink, font = 'type', bold, align = 'left' }) => {
  const f = useCurrentFrame();
  const n = Math.round(text.length * lin(f, a, b));
  return (
    <div style={{ fontFamily: font === 'quill' ? 'Playfair' : TYPE, fontStyle: font === 'quill' ? 'italic' : 'normal', fontWeight: font === 'quill' ? 700 : bold ? 700 : 400, fontSize: size, color, lineHeight: 1.32, whiteSpace: 'pre-wrap', textAlign: align }}>
      {text.slice(0, n)}<span style={{ opacity: 0 }}>{text.slice(n)}</span>
    </div>
  );
};

export const Stamp: React.FC<{ text: string; at: number; x: number; y: number; size?: number; rot?: number; color?: string }> = ({ text, at, x, y, size = 70, rot = -8, color = C.red }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const k = Math.min(1, (f - at) / 5);
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${1.7 - 0.7 * k})`, opacity: 0.2 + 0.72 * k, border: `${size * 0.08}px solid ${color}`, borderRadius: 10, padding: `${size * 0.05}px ${size * 0.25}px`,
      fontFamily: HEAD, fontWeight: 700, fontSize: size, letterSpacing: 4, color, whiteSpace: 'nowrap', textTransform: 'uppercase',
      maskImage: `url(${staticFile('assets/backgrounds/clouds_wide.png')})`, WebkitMaskImage: `url(${staticFile('assets/backgrounds/clouds_wide.png')})`, maskSize: '180% 180%', WebkitMaskSize: '180% 180%' }}>{text}</div>
  );
};

/** Lower-third name card for a character. */
export const NameCard: React.FC<{ at: number; name: string; lines: string[]; x?: number; y?: number; side?: 'left' | 'right' }> = ({ at, name, lines, x = 1060, y = 330, side = 'right' }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  if (f < at) return null;
  const k = spring({ frame: f - at, fps, config: { damping: 18, stiffness: 150 } });
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translateX(${(1 - k) * (side === 'right' ? 500 : -500)}px)`, opacity: k }}>
      <div style={{ fontFamily: 'Playfair', fontWeight: 900, fontSize: 64, color: C.paper, textShadow: '0 4px 20px rgba(0,0,0,0.8)', lineHeight: 1.05 }}>{name}</div>
      <div style={{ height: 6, width: 160 * k + 80, background: C.red, margin: '14px 0 16px' }} />
      {lines.map((l, i) => <div key={i} style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 30, color: C.beige, letterSpacing: 1, opacity: lin(f, at + 8 + i * 5, at + 14 + i * 5), textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>{l}</div>)}
    </div>
  );
};

/** Chapter card (Roman numeral + title), shown over the first ~2.5 s of a chapter's first scene. */
export const Chapter: React.FC<{ n: string; title: string; dur?: number }> = ({ n, title, dur = 80 }) => {
  const f = useCurrentFrame();
  const o = lin(f, 0, 10) * (1 - lin(f, dur - 12, dur));
  if (o <= 0) return null;
  return (
    <AbsoluteFill style={{ background: `rgba(20,14,8,${0.55 * o})`, alignItems: 'center', justifyContent: 'center', opacity: o }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Playfair', fontWeight: 900, fontSize: 80, color: C.red, letterSpacing: 8 }}>{n}</div>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 104, color: C.paper, letterSpacing: 6, textTransform: 'uppercase', transform: `translateY(${(1 - ease(f, 0, 18)) * 20}px)` }}>{title}</div>
        <div style={{ height: 8, width: 520 * ease(f, 8, 26), background: C.red, margin: '18px auto 0' }} />
      </div>
    </AbsoluteFill>
  );
};

/** Quotation card: typewritten/quill quote with attribution. */
export const Quote: React.FC<{ at: number; text: string; by: string; dur: number; x?: number; y?: number; w?: number; size?: number }> = ({ at, text, by, dur, x = 360, y = 230, w = 1200, size = 54 }) => (
  <Card at={at} x={x} y={y} w={w} rot={-1} from="bottom" tilt={30} pad={48}>
    <div style={{ fontFamily: 'Playfair', fontWeight: 900, fontSize: 120, color: C.red, lineHeight: 0.6, height: 50 }}>“</div>
    <Typed text={text} a={at + 6} b={at + dur} size={size} font="quill" />
    <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 28, color: C.red, marginTop: 22, letterSpacing: 2 }}>{by}</div>
  </Card>
);

/** Subtitles for the long-form cut: one sentence-sized chunk at a time, bottom-centre. */
const CHUNKS = (() => {
  const out: { text: string; start: number; end: number }[] = [];
  for (const p of PHRASES) {
    const ws = p.words ?? [];
    let cur: typeof ws = [];
    ws.forEach((w, i) => {
      cur.push(w);
      const t = cur.map((x) => x.w).join(' ');
      if ((t.length > 52 && /[,.:;?!]$/.test(w.w)) || t.length > 66 || i === ws.length - 1 || (/[.?!:]$/.test(w.w) && cur.length > 3)) { out.push({ text: t, start: cur[0].start, end: cur[cur.length - 1].end }); cur = []; }
    });
  }
  return out.map((c, i) => ({ ...c, end: Math.min(out[i + 1]?.start ?? c.end + 0.5, c.end + 0.35) }));
})();
export const Subtitles: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const t = f / fps;
  const c = CHUNKS.find((x) => t >= x.start - 0.05 && t < x.end);
  if (!c) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 58 }}>
      <div style={{ background: 'rgba(18,12,6,0.62)', padding: '8px 22px', borderRadius: 6, fontFamily: SANS, fontWeight: 600, fontSize: 40, color: '#fff', maxWidth: 1500, textAlign: 'center', lineHeight: 1.25 }}>{c.text}</div>
    </AbsoluteFill>
  );
};

/** Stopwatch counting up to mm:ss. */
export const Stopwatch: React.FC<{ at: number; to: number; dur?: number; x?: number; y?: number; size?: number; label?: string }> = ({ at, to, dur = 50, x = 960, y = 470, size = 300, label }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 8); if (o <= 0) return null;
  const v = to * ease(f, at, at + dur); const m = Math.floor(v / 60), s = Math.floor(v % 60);
  const r = size / 2; const a = (v / 60) * 360;
  return (
    <div style={{ position: 'absolute', left: x - r, top: y - r, width: size, opacity: o, textAlign: 'center' }}>
      <svg width={size} height={size}>
        <circle cx={r} cy={r} r={r - 8} fill="#efe6d2" stroke={C.ink} strokeWidth={10} />
        <path d={`M${r},${r} L${r},16 A${r - 16},${r - 16} 0 ${a > 180 ? 1 : 0} 1 ${r + (r - 16) * Math.sin((a * Math.PI) / 180)},${r - (r - 16) * Math.cos((a * Math.PI) / 180)} Z`} fill={C.red} opacity={0.35} />
        {Array.from({ length: 12 }, (_, i) => { const q = (i / 12) * Math.PI * 2; return <line key={i} x1={r + Math.sin(q) * (r - 22)} y1={r - Math.cos(q) * (r - 22)} x2={r + Math.sin(q) * (r - 40)} y2={r - Math.cos(q) * (r - 40)} stroke={C.ink} strokeWidth={i % 3 ? 3 : 7} />; })}
        <line x1={r} y1={r} x2={r + Math.sin((a * Math.PI) / 180) * (r - 30)} y2={r - Math.cos((a * Math.PI) / 180) * (r - 30)} stroke={C.red} strokeWidth={8} strokeLinecap="round" />
        <circle cx={r} cy={r} r={10} fill={C.ink} />
      </svg>
      <div style={{ fontFamily: MONO, fontSize: 64, color: C.paper, textShadow: '0 3px 14px #000', marginTop: 8 }}>{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</div>
      {label && <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 30, color: C.beige, textShadow: '0 2px 10px #000' }}>{label}</div>}
    </div>
  );
};

/** Big tally number with label. */
export const Tally: React.FC<{ at: number; n: number; label: string; x: number; y: number; color?: string; size?: number }> = ({ at, n, label, x, y, color = C.paper, size = 150 }) => {
  const f = useCurrentFrame(); const o = lin(f, at, at + 8); if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 420, textAlign: 'center', opacity: o, transform: `scale(${0.85 + 0.15 * ease(f, at, at + 12)})` }}>
      <div style={{ fontFamily: 'Playfair', fontWeight: 900, fontSize: size, color, lineHeight: 1, textShadow: '0 6px 24px rgba(0,0,0,0.8)' }}>{Math.round(n * ease(f, at, at + 24))}</div>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 36, letterSpacing: 4, color: C.beige, textShadow: '0 2px 10px #000' }}>{label}</div>
    </div>
  );
};

/** Horizontal timeline 1753–1776 with an advancing playhead (p = 0..1 across the marks). */
const MARKS: [string, string][] = [['1753', 'Le Boeuf mission'], ['MAY 1754', 'Jumonville Glen'], ['JUL 1754', 'Fort Necessity'], ['1755', 'Braddock'], ['1756', 'world war'], ['1763', 'Treaty of Paris'], ['1765', 'Stamp Act'], ['1775', 'Washington commands'], ['1776', 'Independence']];
export const Timeline: React.FC<{ at: number; p: number; y?: number; hl?: number }> = ({ at, p, y = 760, hl = -1 }) => {
  const f = useCurrentFrame(); const o = lin(f, at, at + 10); if (o <= 0) return null;
  const x0 = 150, x1 = 1770, px = x0 + (x1 - x0) * p;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: y, height: 150, opacity: o }}>
      <div style={{ position: 'absolute', left: x0, width: x1 - x0, top: 46, height: 6, background: 'rgba(29,27,25,0.35)' }} />
      <div style={{ position: 'absolute', left: x0, width: px - x0, top: 46, height: 6, background: C.red }} />
      {MARKS.map(([t, l], i) => {
        const x = x0 + ((x1 - x0) * i) / (MARKS.length - 1); const on = px >= x - 2;
        return (
          <div key={t} style={{ position: 'absolute', left: x - 95, width: 190, top: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: MONO, fontSize: 24, color: on ? C.red : C.dim }}>{t}</div>
            <div style={{ width: i === hl ? 28 : 20, height: i === hl ? 28 : 20, borderRadius: 14, margin: '8px auto', background: on ? C.red : '#efe6d2', border: `3px solid ${C.charcoal}` }} />
            <div style={{ fontFamily: TYPE, fontSize: 21, color: C.ink, opacity: on ? 1 : 0.45 }}>{l}</div>
          </div>
        );
      })}
    </div>
  );
};

/** Archival paper wipe with a torn edge (scene transitions). */
export const PaperWipe: React.FC<{ dur?: number }> = ({ dur = 16 }) => {
  const f = useCurrentFrame(); const p = ease(f, 0, dur); if (p >= 1) return null;
  const edge = -200 + 2400 * p;
  const pts: string[] = [];
  for (let i = 0; i <= 30; i++) pts.push(`${edge + 30 * Math.sin(i * 1.7) + 18 * Math.cos(i * 3.1)},${(i / 30) * 1080}`);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width={1920} height={1080}><defs><filter id="ws"><feDropShadow dx="14" dy="0" stdDeviation="12" floodColor="rgba(20,12,4,0.5)" /></filter></defs>
        <polygon points={`${edge - 2400},0 ${pts.join(' ')} ${edge - 2400},1080`} fill={C.beige} filter="url(#ws)" opacity={p < 0.8 ? 1 : 1 - (p - 0.8) / 0.2} />
      </svg>
    </AbsoluteFill>
  );
};
