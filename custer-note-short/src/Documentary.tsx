import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { BigCaption, Finish, Fonts } from './kit';
import cues from './data/sfx-cues.json';
import { SCENE_COMPS } from './Scenes';
import { DURATION_FRAMES, FPS, PHRASES, SCENES, sec } from './theme';

const OVERLAP = 10;
const duckAt = (t: number) => { let d = 0; for (const p of PHRASES) d = Math.max(d, Math.max(0, Math.min(1, Math.min(t - (p.start - 0.3), p.end + 0.4 - t) / 0.3 + 1))); return d; };
const Fade: React.FC<{ first: boolean; children: React.ReactNode }> = ({ first, children }) => {
  const f = useCurrentFrame(); const o = interpolate(f, [0, first ? 20 : OVERLAP], [0, 1], { extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

const KEY = new Set(['custer', 'custers', '210', 'help', 'never', '1876', 'enormous', 'three', 'every', 'italian', 'english', 'martin', 'galloped', 'benteen', 'quick', 'packs', 'mules', 'ammunition', 'shattered', 'stopped', 'waited', 'hour', 'alive', 'again', 'note']);
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
  const k = spring({ frame: f - sec(ch.start - 0.05), fps, config: { damping: 15, stiffness: 240 } });
  return <BigCaption words={ch.words} t={t} keys={KEY} k={k} />;
};

export const CusterNote: React.FC = () => (
  <AbsoluteFill style={{ background: '#1d1b19' }}>
    <Fonts />
    {SCENE_COMPS.map((Comp, i) => {
      const S = SCENES[i];
      return (
        <Sequence key={S.n} from={S.from} durationInFrames={S.frames + (i < SCENE_COMPS.length - 1 ? OVERLAP : 0)} name={`Scene ${S.n}`}>
          <Fade first={i === 0}><Comp /></Fade>
        </Sequence>
      );
    })}
    <Finish />
    <Captions />
    <Audio src={staticFile('assets/sound/voiceover.mp3')} />
    <Audio src={staticFile('assets/music/score.mp3')} volume={(fr) => interpolate(fr, [0, 20], [0, 1], { extrapolateRight: 'clamp' }) * (0.85 - 0.5 * duckAt(fr / FPS))} />
    {(cues as { file: string; at: number; volume: number }[]).map((c, i) => (
      <Sequence key={i} from={Math.max(0, Math.round(c.at * FPS))} durationInFrames={Math.min(DURATION_FRAMES, 30 * 20)} name={`sfx ${c.file}`}>
        <Audio src={staticFile(`assets/sound/${c.file}`)} volume={(fr) => c.volume * (1 - 0.3 * duckAt(c.at + fr / FPS))} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
