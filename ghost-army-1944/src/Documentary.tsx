import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Finish, Fonts } from './components/VoxKit';
import cues from './data/sfx-cues.json';
import { SCENE_COMPS } from './Scenes';
import { C, DURATION_FRAMES, FPS, PHRASES, SANS, SCENES, sec } from './theme';

const OVERLAP = 8;
const duckAt = (t: number) => { let d = 0; for (const p of PHRASES) d = Math.max(d, Math.max(0, Math.min(1, Math.min(t - (p.start - 0.3), p.end + 0.4 - t) / 0.3 + 1))); return d; };

/** Vox cut: the incoming scene whips in from the right with a short slide. */
const Whip: React.FC<{ first: boolean; children: React.ReactNode }> = ({ first, children }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  if (first) return <AbsoluteFill>{children}</AbsoluteFill>;
  const k = spring({ frame: f, fps, config: { damping: 20, stiffness: 140 } });
  return <AbsoluteFill style={{ transform: `translateX(${(1 - k) * 1080}px)`, boxShadow: '-30px 0 40px rgba(0,0,0,0.25)' }}>{children}</AbsoluteFill>;
};

/** Captions: white sheet strips, current word in a yellow highlight, key words red. */
const KEY = new Set(['1944', 'sherman', 'tank', 'strong', 'balloon', '93', 'pounds', 'ghost', 'army', '1100', '30000', 'artists', 'art', 'ad', 'inflated', 'fake', 'sound', '15', 'miles', 'radio', 'twenty', '1945', 'rhine', '600', 'dummies', 'two', 'divisions', 'bait', 'north', 'ninth', 'little', 'resistance', 'secret', '1996', '2022', 'gold', 'medal', 'balloons']);
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
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1395, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px 0', transform: `translateY(${(1 - k) * 24}px)`, opacity: Math.min(1, k * 1.8) }}>
        {ch.words.map((w, i) => {
          const on = t >= w.start - 0.03 && t < (ch.words[i + 1]?.start ?? ch.end) - 0.02;
          const key = KEY.has(w.w.toLowerCase().replace(/[^a-z0-9]/g, ''));
          return <span key={i} style={{ fontFamily: SANS, fontWeight: 800, fontSize: 70, lineHeight: 1.12, letterSpacing: -1, padding: '2px 14px', color: key ? C.red : C.ink, background: on ? C.yellow : C.sheet, boxShadow: '0 6px 0 rgba(28,27,26,0.85)' }}>{w.w}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};

export const GhostArmy: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <Fonts />
      {SCENE_COMPS.map((Comp, i) => {
        const S = SCENES[i];
        return (
          <Sequence key={S.n} from={S.from} durationInFrames={S.frames + (i < SCENE_COMPS.length - 1 ? OVERLAP : 0)} name={`Scene ${S.n}`}>
            <Whip first={i === 0}><Comp /></Whip>
          </Sequence>
        );
      })}
      <Finish />
      <Captions />
      <Audio src={staticFile('assets/sound/voiceover.mp3')} />
      <Audio src={staticFile('assets/music/score.mp3')} volume={(fr) => interpolate(fr, [0, 8], [0, 1], { extrapolateRight: 'clamp' }) * (0.8 - 0.45 * duckAt(fr / FPS))} />
      {(cues as { file: string; at: number; volume: number }[]).map((c, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(c.at * FPS))} durationInFrames={DURATION_FRAMES} name={`sfx ${c.file}`}>
          <Audio src={staticFile(`assets/sound/${c.file}`)} volume={(fr) => c.volume * (1 - 0.3 * duckAt(c.at + fr / FPS))} />
        </Sequence>
      ))}
      {f < 0 && null}
    </AbsoluteFill>
  );
};
