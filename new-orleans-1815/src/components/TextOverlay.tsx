import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, HEAD, MONO, PHRASES, SANS, TYPE, ease, lin, sec } from '../theme';

/** Condensed editorial headline with a red underline that swipes in beneath it. */
export const Headline: React.FC<{ text: string; sub?: string; at: number; out?: number; y?: number; size?: number; dark?: boolean; underline?: number }> = ({
  text, sub, at, out, y = 250, size = 96, dark = true, underline,
}) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 8) * (out !== undefined ? 1 - lin(f, out - 8, out) : 1);
  if (o <= 0) return null;
  const u = ease(f, underline ?? at + 8, (underline ?? at + 8) + 14);
  return (
    <div style={{ position: 'absolute', left: 90, right: 90, top: y, textAlign: 'center', opacity: o }}>
      <div style={{ display: 'inline-block', position: 'relative' }}>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: size, lineHeight: 1.02, letterSpacing: 1, whiteSpace: 'nowrap', textTransform: 'uppercase', color: dark ? C.charcoal : C.paper,
          transform: `translateY(${(1 - ease(f, at, at + 14)) * 24}px)`, textShadow: dark ? 'none' : '0 4px 20px rgba(0,0,0,0.85)' }}>{text}</div>
        <div style={{ position: 'absolute', left: 0, bottom: -12, height: 10, width: `${100 * u}%`, background: C.red }} />
      </div>
      {sub && <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: dark ? C.red : C.beige, marginTop: 30, opacity: lin(f, at + 10, at + 18) }}>{sub}</div>}
    </div>
  );
};

/** Small archival annotation (typewriter label with a leader line). */
export const Note: React.FC<{ text: string; at: number; x: number; y: number; color?: string; dark?: boolean; size?: number }> = ({ text, at, x, y, color, dark, size = 24 }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 8);
  if (o <= 0) return null;
  return <div style={{ position: 'absolute', left: x, top: y, opacity: o, fontFamily: TYPE, fontWeight: 700, fontSize: size, letterSpacing: 1, color: color ?? (dark ? C.paper : C.ink), background: dark ? 'rgba(29,27,25,0.7)' : 'rgba(239,230,210,0.85)', padding: '6px 12px', borderLeft: `5px solid ${C.red}` }}>{text}</div>;
};

/** Word-by-word captions (2–3 words per beat), key words in archival red on beige. Sits at ~y 1270 (safe zone). */
const KEY = new Set(['biggest', 'victory', '1812', 'after', 'treaty', 'signed.', 'ghent,', 'sailing', 'ship.', 'knew.', 'eight', 'thousand', 'jackson', 'pirates.', 'canal,', 'waited.', '1815,', 'guns.', 'thirty', 'minutes,', 'two', 'pakenham,', 'dead.', 'seventy-one.', 'february.', 'nothing', 'hero.', 'president'])
const CHUNKS = (() => {
  const out: { words: { w: string; start: number; end: number }[]; start: number; end: number }[] = [];
  for (const p of PHRASES) {
    let cur: { w: string; start: number; end: number }[] = [];
    (p.words ?? []).forEach((w, i, all) => {
      cur.push(w);
      if (cur.length >= 3 || /[,.?!:]$/.test(w.w) || i === all.length - 1) { out.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end }); cur = []; }
    });
  }
  return out.map((c, i) => ({ ...c, end: Math.min(out[i + 1]?.start ?? c.end + 0.6, c.end + 0.45) }));
})();
export const Captions: React.FC<{ top?: number }> = ({ top = 1280 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const ch = CHUNKS.find((c) => t >= c.start - 0.05 && t < c.end);
  if (!ch) return null;
  const k = spring({ frame: f - sec(ch.start - 0.05), fps, config: { damping: 15, stiffness: 240 } });
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: 90, right: 90, top, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 18px', transform: `scale(${0.9 + 0.1 * k})`, opacity: Math.min(1, k * 1.6) }}>
        {ch.words.map((w, i) => {
          const on = t >= w.start - 0.03;
          const key = KEY.has(w.w.toLowerCase());
          return <span key={i} style={{ fontFamily: SANS, fontWeight: 800, fontSize: key ? 84 : 74, lineHeight: 1.1, textTransform: 'uppercase', color: on ? (key ? '#f0c96a' : '#fff') : 'rgba(255,255,255,0.45)', WebkitTextStroke: '9px #1d1b19', paintOrder: 'stroke fill', textShadow: '0 6px 18px rgba(0,0,0,0.75)' }}>{w.w}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Horizontal timeline of 20 July 1944; the playhead advances to `p` (0..1 across the marks). */
const MARKS = [['DEC 24, 1814', 'treaty signed'], ['JAN 8, 1815', 'battle'], ['FEB 17, 1815', 'treaty in effect'], ['1829', 'President Jackson']];
export const Timeline: React.FC<{ at: number; p: number; y?: number; hl?: number }> = ({ at, p, y = 1060, hl = -1 }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 10);
  if (o <= 0) return null;
  const x0 = 120, x1 = 960;
  const px = x0 + (x1 - x0) * p;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: y, height: 110, opacity: o, background: 'rgba(239,230,210,0.85)', paddingTop: 6 }}>
      <div style={{ position: 'absolute', left: x0, width: x1 - x0, top: 40, height: 6, background: 'rgba(29,27,25,0.35)' }} />
      <div style={{ position: 'absolute', left: x0, width: px - x0, top: 40, height: 6, background: C.red }} />
      {MARKS.map(([t, l], i) => {
        const x = x0 + ((x1 - x0) * i) / (MARKS.length - 1);
        const on = px >= x - 2;
        return (
          <div key={t} style={{ position: 'absolute', left: x - 80, width: 160, top: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: MONO, fontSize: 24, color: on ? C.red : C.dim, fontWeight: 500 }}>{t}</div>
            <div style={{ width: i === hl ? 26 : 18, height: i === hl ? 26 : 18, borderRadius: 13, margin: '6px auto', background: on ? C.red : '#efe6d2', border: `3px solid ${C.charcoal}` }} />
            <div style={{ fontFamily: TYPE, fontSize: 20, color: C.ink, opacity: on ? 1 : 0.5 }}>{l}</div>
          </div>
        );
      })}
    </div>
  );
};
