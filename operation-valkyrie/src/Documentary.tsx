import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Fonts, Finish } from './components/DocumentaryStage';
import { Captions } from './components/TextOverlay';
import { Wipe } from './components/Transition';
import { STORYBOARD } from './data/storyboard';
import { Scene01 } from './scenes/Scene01';
import { Scene02 } from './scenes/Scene02';
import { Scene03 } from './scenes/Scene03';
import { Scene04 } from './scenes/Scene04';
import { Scene05 } from './scenes/Scene05';
import { Scene06 } from './scenes/Scene06';
import { Scene07 } from './scenes/Scene07';
import { Scene08 } from './scenes/Scene08';
import cues from './data/sfx-cues.json';
import { DURATION_FRAMES, FPS, PHRASES } from './theme';

const COMPS = [Scene01, Scene02, Scene03, Scene04, Scene05, Scene06, Scene07, Scene08];
const OVERLAP = 10;
const duckAt = (t: number) => {
  let d = 0;
  for (const p of PHRASES) d = Math.max(d, Math.max(0, Math.min(1, Math.min(t - (p.start - 0.3), p.end + 0.4 - t) / 0.3 + 1)));
  return d;
};
const Dissolve: React.FC<{ first: boolean; children: React.ReactNode }> = ({ first, children }) => {
  const f = useCurrentFrame();
  const p = first ? 1 : interpolate(f, [0, OVERLAP], [0, 1], { extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ opacity: p }}>{children}</AbsoluteFill>;
};

export const Valkyrie: React.FC = () => (
  <AbsoluteFill style={{ background: '#1d1b19' }}>
    <Fonts />
    {STORYBOARD.map((s, i) => {
      const Comp = COMPS[i];
      return (
        <Sequence key={s.n} from={s.from} durationInFrames={s.frames + (i < STORYBOARD.length - 1 ? OVERLAP : 0)} name={`Scene ${s.n} · ${s.title}`}>
          <Dissolve first={i === 0}><Comp /></Dissolve>
          {s.transition !== 'none' && <Wipe dur={18} kind={s.transition as 'paper' | 'red'} dir={i % 2 ? 1 : -1} />}
        </Sequence>
      );
    })}
    <Finish />
    <Captions />
    <Audio src={staticFile('assets/sound/voiceover.mp3')} />
    <Audio src={staticFile('assets/music/score.mp3')} volume={(f) => interpolate(f, [0, 10], [0, 1], { extrapolateRight: 'clamp' }) * (0.75 - 0.45 * duckAt(f / FPS))} />
    {(cues as { file: string; at: number; volume: number }[]).map((c, i) => (
      <Sequence key={i} from={Math.max(0, Math.round(c.at * FPS))} durationInFrames={DURATION_FRAMES} name={`sfx ${c.file}`}>
        <Audio src={staticFile(`assets/sound/${c.file}`)} volume={(f) => c.volume * (1 - 0.35 * duckAt(c.at + f / FPS))} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
