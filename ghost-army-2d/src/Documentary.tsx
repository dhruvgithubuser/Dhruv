import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Fonts } from './components/VoxKit';
import cues from './data/sfx-cues.json';
import { Grade } from './Overlays';
import { SCENE_COMPS } from './scenes/All';
import { C, DURATION_FRAMES, FPS, PHRASES, SANS, SCENES, sec } from './theme';

const OVERLAP = 10;
const duckAt = (t: number) => { let d = 0; for (const p of PHRASES) d = Math.max(d, Math.max(0, Math.min(1, Math.min(t - (p.start - 0.3), p.end + 0.4 - t) / 0.3 + 1))); return d; };
const Fade: React.FC<{ first: boolean; children: React.ReactNode }> = ({ first, children }) => {
  const f = useCurrentFrame(); const o = first ? 1 : interpolate(f, [0, OVERLAP], [0, 1], { extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

/** Documentary captions: white heavy sans with a dark outline; key words in yellow; 3–4 words at a time. */
const KEY = new Set(['1944', 'sherman', 'tank', '33', 'tons', 'steel', 'strong', 'rubber', '93', 'pounds', 'secret', 'ghost', 'army', '1100', 'artists', '30000', 'three', 'air', 'radio', 'spies', 'faked', 'inflatable', 'bulldozer', 'fake', 'morse', 'speakers', '15', 'miles', 'patches', 'cafés', 'twenty', '1945', 'rhine', 'two', 'divisions', '600', 'bait', 'north', 'little', 'resistance', 'classified', '1996', '2022', 'gold', 'medal', 'imagination', 'fallen']);
const CHUNKS = (() => {
  const out: { words: { w: string; start: number; end: number }[]; start: number; end: number }[] = [];
  for (const p of PHRASES) {
    let cur: { w: string; start: number; end: number }[] = [];
    (p.words ?? []).forEach((w, i, all) => {
      cur.push(w);
      if (cur.length >= 4 || (cur.length >= 2 && /[,.?!:]["”]?$/.test(w.w)) || i === all.length - 1) { out.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end }); cur = []; }
    });
  }
  return out.map((c, i) => ({ ...c, end: Math.min(out[i + 1]?.start ?? c.end + 0.6, c.end + 0.45) }));
})();
const Captions: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const ch = CHUNKS.find((c) => t >= c.start - 0.05 && t < c.end);
  if (!ch) return null;
  const k = spring({ frame: f - sec(ch.start - 0.05), fps, config: { damping: 16, stiffness: 260 } });
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1400, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 20px', transform: `translateY(${(1 - k) * 20}px) scale(${0.94 + 0.06 * k})`, opacity: Math.min(1, k * 1.8) }}>
        {ch.words.map((w, i) => {
          const on = t >= w.start - 0.03;
          const key = KEY.has(w.w.toLowerCase().replace(/[^a-z0-9é]/g, ''));
          return <span key={i} style={{ fontFamily: SANS, fontWeight: 800, fontSize: 76, lineHeight: 1.12, letterSpacing: -1, textTransform: 'uppercase', color: on ? (key ? C.yellow : '#fff') : 'rgba(255,255,255,0.45)', WebkitTextStroke: '10px #111', paintOrder: 'stroke fill', textShadow: '0 8px 22px rgba(0,0,0,0.6)' }}>{w.w}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};

export const GhostArmy2D: React.FC = () => (
  <AbsoluteFill style={{ background: '#111' }}>
    <Fonts />
    {SCENE_COMPS.map((Comp, i) => {
      const S = SCENES[i];
      return (
        <Sequence key={S.n} from={S.from} durationInFrames={S.frames + (i < SCENE_COMPS.length - 1 ? OVERLAP : 0)} name={`Scene ${S.n}`}>
          <Fade first={i === 0}><Comp /></Fade>
        </Sequence>
      );
    })}
    <Grade />
    <Captions />
    <Audio src={staticFile('assets/sound/voiceover.mp3')} />
    <Audio src={staticFile('assets/music/score.mp3')} volume={(fr) => interpolate(fr, [0, 8], [0, 1], { extrapolateRight: 'clamp' }) * (0.8 - 0.45 * duckAt(fr / FPS))} />
    {(cues as { file: string; at: number; volume: number }[]).map((c, i) => (
      <Sequence key={i} from={Math.max(0, Math.round(c.at * FPS))} durationInFrames={DURATION_FRAMES} name={`sfx ${c.file}`}>
        <Audio src={staticFile(`assets/sound/${c.file}`)} volume={(fr) => c.volume * (1 - 0.3 * duckAt(c.at + fr / FPS))} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
