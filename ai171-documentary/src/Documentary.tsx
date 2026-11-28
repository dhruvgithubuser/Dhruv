import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Grade } from './components/Grade';
import { Fonts } from './Fonts';
import { SCENE_COMPONENTS } from './Scenes';
import cues from './sfx-cues.json';
import { DURATION_FRAMES, FPS, PHRASES, SCENES } from './theme';

const OVERLAP = 15;
const duckAt = (t: number) => {
  let d = 0;
  for (const p of PHRASES) d = Math.max(d, Math.max(0, Math.min(1, Math.min(t - (p.start - 0.3), p.end + 0.4 - t) / 0.3 + 1)));
  return d;
};

const SceneIn: React.FC<{ children: React.ReactNode; first: boolean }> = ({ children, first }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: first ? 1 : interpolate(f, [0, OVERLAP], [0, 1], { extrapolateRight: 'clamp' }) }}>{children}</AbsoluteFill>;
};

export const Documentary: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Fonts />
    {SCENES.map((s, i) => {
      const Comp = SCENE_COMPONENTS[i];
      return (
        <Sequence key={s.n} from={s.from} durationInFrames={s.frames + (i < SCENES.length - 1 ? OVERLAP : 0)} name={`Scene ${s.n}`}>
          <SceneIn first={i === 0}><Comp /></SceneIn>
        </Sequence>
      );
    })}
    <Grade letterbox={1} />
    <Audio src={staticFile('audio/voiceover.mp3')} />
    <Audio src={staticFile('audio/score.mp3')} volume={(f) => interpolate(f, [0, 20], [0, 1], { extrapolateRight: 'clamp' }) * (0.8 - 0.45 * duckAt(f / FPS))} />
    {(cues as { file: string; at: number; volume: number }[]).map((c, i) => (
      <Sequence key={i} from={Math.max(0, Math.round(c.at * FPS))} durationInFrames={DURATION_FRAMES} name={`sfx ${c.file}`}>
        <Audio src={staticFile(`audio/sfx/${c.file}`)} volume={(f) => c.volume * (1 - 0.4 * duckAt(c.at + f / FPS))} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
