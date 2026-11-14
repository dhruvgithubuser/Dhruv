import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Chapter, PaperWipe, Subtitles } from './components/Docs';
import { Finish, Fonts } from './components/Stage';
import cues from './data/sfx-cues.json';
import * as P1 from './scenes/Part1';
import * as P2 from './scenes/Part2';
import * as P3 from './scenes/Part3';
import { DURATION_FRAMES, FPS, PHRASES, SCENES } from './theme';

const ALL: Record<string, React.FC> = { ...P1, ...P2, ...P3 } as unknown as Record<string, React.FC>;
const COMPS = Array.from({ length: 59 }, (_, i) => ALL[`S${String(i + 1).padStart(2, '0')}`]);
// Chapters (also the YouTube chapter list): scene number -> numeral + title
export const CHAPTERS: Record<number, [string, string]> = { 7: ['I', 'Two Empires'], 14: ['II', 'The Messenger'], 20: ['III', 'The Race for the Forks'], 25: ['IV', 'The Glen'], 35: ['V', 'Envoy or Spy?'], 41: ['VI', 'Fort Necessity'], 50: ['VII', 'A World on Fire'], 57: ['', 'Epilogue'] };
const OVERLAP = 12;
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

export const Jumonville: React.FC = () => (
  <AbsoluteFill style={{ background: '#1d1b19' }}>
    <Fonts />
    {SCENES.map((s, i) => {
      const Comp = COMPS[i];
      const ch = CHAPTERS[s.n];
      return (
        <Sequence key={s.n} from={s.from} durationInFrames={s.frames + (i < SCENES.length - 1 ? OVERLAP : 0)} name={`S${s.n}`}>
          <Dissolve first={i === 0}><Comp /></Dissolve>
          {ch && <Chapter n={ch[0]} title={ch[1]} />}
          {!ch && i > 0 && i % 4 === 0 && <PaperWipe dur={18} />}
        </Sequence>
      );
    })}
    <Finish />
    <Subtitles />
    <Audio src={staticFile('assets/sound/voiceover.mp3')} />
    <Audio src={staticFile('assets/music/score.mp3')} volume={(f) => interpolate(f, [0, 20], [0, 1], { extrapolateRight: 'clamp' }) * (0.7 - 0.42 * duckAt(f / FPS))} />
    {(cues as { file: string; at: number; volume: number }[]).map((c, i) => (
      <Sequence key={i} from={Math.max(0, Math.round(c.at * FPS))} durationInFrames={Math.min(DURATION_FRAMES, 30 * 20)} name={`sfx ${c.file}`}>
        <Audio src={staticFile(`assets/sound/${c.file}`)} volume={(f) => c.volume * (1 - 0.35 * duckAt(c.at + f / FPS))} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
