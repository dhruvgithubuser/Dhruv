import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, PHRASES, SANS, sec } from '../theme';

// Reel captions: 2-3 words at a time, the spoken word lit, key words in the accent colour.
const KEY = new Set(['deadliest', 'wars', 'wrong', 'turn,', 'turn.', 'stalled', 'gunshots', '1914.', 'six', 'assassins', 'bomb.', 'explodes', 'twenty', 'unharmed.', 'failed.', 'bombs!"', 'hospital,', 'driver.', 'latin', 'right,', '"wrong', 'way!"', 'stalls.', 'five', 'feet', '19-year-old', 'princip.', 'front', 'twice.', 'archduke.', 'sophie.', 'dead.', 'war', 'serbia.', 'russia,', 'germany,', 'france', 'britain.', '20', 'million', 'die']);
type Wd = { w: string; start: number; end: number };
const CHUNKS = (() => {
  const out: { words: Wd[]; start: number; end: number }[] = [];
  for (const p of PHRASES) {
    let cur: Wd[] = [];
    (p.words ?? []).forEach((w, i, all) => {
      cur.push(w);
      if (cur.length >= 3 || /[,.?!]$/.test(w.w) || i === all.length - 1) { out.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end }); cur = []; }
    });
  }
  return out.map((c, i) => ({ ...c, end: Math.min(out[i + 1]?.start ?? c.end + 0.6, c.end + 0.45) }));
})();

export const Captions: React.FC<{ top?: number }> = ({ top = 1270 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const ch = CHUNKS.find((c) => t >= c.start - 0.05 && t < c.end);
  if (!ch) return null;
  const k = spring({ frame: f - sec(ch.start - 0.05), fps, config: { damping: 15, stiffness: 240 } });
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: 50, right: 50, top, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 20px', transform: `scale(${0.88 + 0.12 * k})`, opacity: Math.min(1, k * 1.6) }}>
        {ch.words.map((w, i) => {
          const on = t >= w.start - 0.03;
          const key = KEY.has(w.w.toLowerCase());
          return <span key={i} style={{ fontFamily: SANS, fontWeight: 800, fontSize: key ? 92 : 80, lineHeight: 1.1, textTransform: 'uppercase', color: on ? (key ? C.amber : '#fff') : 'rgba(255,255,255,0.5)', WebkitTextStroke: '9px #000', paintOrder: 'stroke fill', textShadow: '0 6px 18px rgba(0,0,0,0.8)' }}>{w.w}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};
