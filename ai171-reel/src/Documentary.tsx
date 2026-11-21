import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Captions } from './components/Captions';
import { Grade } from './components/Grade';
import { Fonts } from './Fonts';
import { REEL_SCENES } from './Scenes';
import cues from './sfx-cues.json';
import { DURATION_FRAMES, FPS, PHRASES, SCENES } from './theme';

const OVERLAP = 10;
const duckAt = (t: number) => {
  let d = 0;
  for (const p of PHRASES) d = Math.max(d, Math.max(0, Math.min(1, Math.min(t - (p.start - 0.3), p.end + 0.4 - t) / 0.3 + 1)));
  return d;
};
const In: React.FC<{ first: boolean; children: React.ReactNode }> = ({ first, children }) => {
  const f = useCurrentFrame();
  // quick push-in dissolve between scenes
  const p = first ? 1 : interpolate(f, [0, OVERLAP], [0, 1], { extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ opacity: p, transform: `scale(${1.04 - 0.04 * p})` }}>{children}</AbsoluteFill>;
};

export const Reel: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Fonts />
    {SCENES.map((s, i) => {
      const Comp = REEL_SCENES[i];
      return (
        <Sequence key={s.n} from={s.from} durationInFrames={s.frames + (i < SCENES.length - 1 ? OVERLAP : 0)} name={`Scene ${s.n}`}>
          <In first={i === 0}><Comp /></In>
        </Sequence>
      );
    })}
    <Grade />
    <Captions />
    <Audio src={staticFile('audio/voiceover.mp3')} />
    <Audio src={staticFile('audio/score.mp3')} volume={(f) => interpolate(f, [0, 10], [0, 1], { extrapolateRight: 'clamp' }) * (0.8 - 0.45 * duckAt(f / FPS))} />
    {(cues as { file: string; at: number; volume: number }[]).map((c, i) => (
      <Sequence key={i} from={Math.max(0, Math.round(c.at * FPS))} durationInFrames={DURATION_FRAMES} name={`sfx ${c.file}`}>
        <Audio src={staticFile(`audio/sfx/${c.file}`)} volume={(f) => c.volume * (1 - 0.4 * duckAt(c.at + f / FPS))} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
