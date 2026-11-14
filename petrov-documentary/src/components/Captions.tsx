import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT_CAPTION, FONT_TITLE, PHRASES, lin, sec } from '../theme';

// Words the narration leans on: shown bigger and in the accent colour.
const EMPHASIS = new Set(['just', 'one', 'man?', 'five', 'missiles.', 'false', 'alarm', 'not', 'act.', 'alarms', 'erupted.', 'nuclear', 'catastrophe.', 'sunlight', 'clouds']);

type Word = { w: string; start: number; end: number };
type Chunk = { words: Word[]; start: number; end: number };

/** Split every phrase into short caption chunks (max 3 words, breaking after punctuation). */
const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  for (const p of PHRASES) {
    const ws = p.words ?? [];
    let cur: Word[] = [];
    ws.forEach((w, i) => {
      cur.push(w);
      const punct = /[,.?!]$/.test(w.w);
      if (cur.length >= 3 || punct || i === ws.length - 1) {
        out.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end });
        cur = [];
      }
    });
  }
  // each chunk holds until the next one starts (or 0.5 s after its last word across a pause)
  return out.map((c, i) => ({ ...c, end: Math.min(out[i + 1]?.start ?? c.end + 0.6, c.end + 0.5) }));
})();

export const Captions: React.FC<{ y?: number }> = ({ y = 1290 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const chunk = CHUNKS.find((c) => t >= c.start - 0.05 && t < c.end);
  if (!chunk) return null;
  const pop = spring({ frame: frame - sec(chunk.start - 0.05), fps, config: { damping: 14, stiffness: 220 } });
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', left: 60, right: 60, top: y, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 22px',
        transform: `scale(${0.85 + 0.15 * pop})`, opacity: Math.min(1, pop * 1.5),
      }}>
        {chunk.words.map((w, i) => {
          const active = t >= w.start - 0.03;
          const key = w.w.toLowerCase();
          const emph = EMPHASIS.has(key) || EMPHASIS.has(key.replace(/[,.?!]$/, ''));
          return (
            <span key={i} style={{
              fontFamily: FONT_CAPTION, fontWeight: 700, fontSize: emph ? 96 : 84, lineHeight: 1.1, textTransform: 'uppercase', letterSpacing: 1,
              color: active ? (emph ? C.yellow : '#ffffff') : 'rgba(255,255,255,0.55)',
              WebkitTextStroke: '10px #000', paintOrder: 'stroke fill',
              textShadow: '0 6px 18px rgba(0,0,0,0.75)',
            }}>{w.w}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Lower-third identifying a person or place (documentary style, slides in from the left). */
export const LowerThird: React.FC<{ title: string; sub: string; at: number; out: number; y?: number }> = ({ title, sub, at, out, y = 300 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = spring({ frame: frame - at, fps, config: { damping: 18, stiffness: 160 } });
  const o = 1 - lin(frame, out - 10, out);
  if (k <= 0.001 || o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 70, top: y, transform: `translateX(${(1 - k) * -700}px)`, opacity: o }}>
      <div style={{ width: 8, height: 120, background: C.red, position: 'absolute', left: -24, top: 0 }} />
      <div style={{ fontFamily: FONT_CAPTION, fontWeight: 700, fontSize: 58, color: '#fff', letterSpacing: 2, textTransform: 'uppercase', textShadow: '0 4px 14px #000' }}>{title}</div>
      <div style={{ fontFamily: FONT_CAPTION, fontWeight: 500, fontSize: 36, color: C.gold, letterSpacing: 3, textTransform: 'uppercase', textShadow: '0 4px 14px #000' }}>{sub}</div>
    </div>
  );
};

/** Typewriter text (one character per `cps` frames), with a blinking block cursor. */
export const Typewriter: React.FC<{ text: string; at: number; cpf?: number; size?: number; color?: string; font?: string; cursor?: boolean }> = ({ text, at, cpf = 0.6, size = 72, color = '#fff', font = FONT_CAPTION, cursor = true }) => {
  const frame = useCurrentFrame();
  const n = Math.max(0, Math.min(text.length, Math.floor((frame - at) * cpf)));
  const blink = Math.floor(frame / 8) % 2 === 0;
  return (
    <span style={{ fontFamily: font, fontWeight: 700, fontSize: size, color, letterSpacing: 4, textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
      {text.slice(0, n)}
      {cursor && (n < text.length || blink) && frame >= at && <span style={{ display: 'inline-block', width: size * 0.45, height: size * 0.8, background: color, marginLeft: 8, verticalAlign: 'baseline' }} />}
    </span>
  );
};

/** Big premium title (final card / thumbnail). */
export const DocTitle: React.FC<{ lines: string[]; at: number; size?: number; color?: string }> = ({ lines, at, size = 92, color = C.gold }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ textAlign: 'center' }}>
      {lines.map((l, i) => {
        const p = lin(frame, at + i * 8, at + i * 8 + 26);
        return (
          <div key={i} style={{
            fontFamily: FONT_TITLE, fontWeight: 700, fontSize: size, color, letterSpacing: 6 * p + 2, lineHeight: 1.12,
            opacity: p, filter: `blur(${(1 - p) * 10}px)`, textShadow: '0 0 30px rgba(255,190,110,0.45), 0 6px 20px #000',
          }}>{l}</div>
        );
      })}
    </div>
  );
};
