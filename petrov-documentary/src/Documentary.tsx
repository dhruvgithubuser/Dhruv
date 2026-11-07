import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from 'remotion';
import manifest from './asset-manifest.json';
import { Captions } from './components/Captions';
import { FilmGrain } from './components/FilmGrain';
import { SceneTransition, TransitionKind } from './components/SceneTransition';
import { PaintDefs } from './components/Sets';
import { Fonts } from './Fonts';
import { IllustrationScene } from './IllustrationScene';
import { Scene01 } from './scenes/Scene01';
import { Scene02 } from './scenes/Scene02';
import { Scene03 } from './scenes/Scene03';
import { Scene04 } from './scenes/Scene04';
import { Scene05 } from './scenes/Scene05';
import { Scene06 } from './scenes/Scene06';
import { Scene07 } from './scenes/Scene07';
import { Scene08 } from './scenes/Scene08';
import { Scene09 } from './scenes/Scene09';
import { Scene10 } from './scenes/Scene10';
import { Scene11 } from './scenes/Scene11';
import { Scene12 } from './scenes/Scene12';
import { Scene13 } from './scenes/Scene13';
import { Scene14 } from './scenes/Scene14';
import { Scene15 } from './scenes/Scene15';
import cues from './sfx-cues.json';
import { DURATION_FRAMES, FPS, PHRASES, SCENES } from './theme';

const SCENE_COMPONENTS = [Scene01, Scene02, Scene03, Scene04, Scene05, Scene06, Scene07, Scene08, Scene09, Scene10, Scene11, Scene12, Scene13, Scene14, Scene15];
// how each scene enters (motivated by what changes)
const ENTRY: [TransitionKind, number][] = [
  ['cut', 0], ['smoke', 16], ['zoom', 14], ['burn', 16], ['glitch', 10], ['glitch', 10], ['fade', 10], ['smoke', 14],
  ['fade', 10], ['glitch', 10], ['fade', 10], ['fade', 14], ['flash', 14], ['smoke', 18], ['fade', 18],
];
const OVERLAP = 18; // each scene keeps playing under the next one's entry transition

// Music sits under the narration: full between lines, ducked while the narrator speaks.
const musicVolume = (f: number) => {
  const t = f / FPS;
  let duck = 0;
  for (const p of PHRASES) {
    const d = Math.min(t - (p.start - 0.25), p.end + 0.35 - t);
    duck = Math.max(duck, Math.max(0, Math.min(1, d / 0.25 + 1)));
  }
  const fadeIn = interpolate(f, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  return fadeIn * (0.75 - 0.4 * duck);
};

export const Documentary: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Fonts />
    <PaintDefs />
    {SCENES.map((s, i) => {
      const Comp = SCENE_COMPONENTS[i];
      const ill = (manifest as any).scenes[i]?.illustration;
      const [kind, dur] = ENTRY[i];
      return (
        <Sequence key={s.n} from={s.from} durationInFrames={s.frames + (i < 14 ? OVERLAP : 0)} name={`Scene ${String(s.n).padStart(2, '0')}`}>
          <SceneTransition kind={kind} dur={dur}>
            {ill?.available ? <IllustrationScene src={ill.file} frames={s.frames} /> : <Comp />}
          </SceneTransition>
        </Sequence>
      );
    })}
    <FilmGrain />
    <Captions />

    <Audio src={staticFile('audio/voiceover.mp3')} volume={1} />
    <Audio src={staticFile('audio/background-music.mp3')} volume={musicVolume} />
    {(cues as { file: string; at: number; volume: number }[]).map((c, i) => (
      <Sequence key={i} from={Math.max(0, Math.round(c.at * FPS))} durationInFrames={DURATION_FRAMES} name={`sfx ${c.file}`}>
        <Audio src={staticFile(`audio/sound-effects/${c.file}`)} volume={c.volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
