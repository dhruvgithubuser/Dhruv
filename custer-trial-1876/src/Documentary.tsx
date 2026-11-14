import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Sub } from './Doc';
import { Fonts } from './kit';
import cues from './data/sfx-cues.json';
import { SCENE_COMPS } from './Scenes';
import { DURATION_FRAMES, FPS, PHRASES, SCENES } from './theme';
import { Img } from 'remotion';

const OVERLAP = 10;
const duckAt = (t: number) => { let d = 0; for (const p of PHRASES) d = Math.max(d, Math.max(0, Math.min(1, Math.min(t - (p.start - 0.3), p.end + 0.4 - t) / 0.3 + 1))); return d; };
const Fade: React.FC<{ first: boolean; children: React.ReactNode }> = ({ first, children }) => {
  const f = useCurrentFrame(); const o = interpolate(f, [0, first ? 24 : OVERLAP], [0, 1], { extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

// subtitles: short phrase chunks (<= 8 words), plain white, like the reference
const CHUNKS = (() => {
  const out: { text: string; start: number; end: number }[] = [];
  for (const p of PHRASES) {
    let cur: { w: string; start: number; end: number }[] = [];
    (p.words ?? []).forEach((w, i, all) => {
      cur.push(w);
      if (cur.length >= 8 || (cur.length >= 3 && /[,.?!:;]["”]?$/.test(w.w)) || i === all.length - 1) { out.push({ text: cur.map((x) => x.w).join(' '), start: cur[0].start, end: cur[cur.length - 1].end }); cur = []; }
    });
  }
  return out.map((c, i) => ({ ...c, end: Math.min(out[i + 1]?.start ?? c.end + 0.7, c.end + 0.5) }));
})();
const Subtitles: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const ch = CHUNKS.find((c) => t >= c.start - 0.05 && t < c.end);
  return ch ? <Sub text={ch.text} /> : null;
};
const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <Img src={staticFile(`assets/textures/grain_${Math.floor(f / 2) % 8}.png`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'overlay', opacity: 0.12 }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 80% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.5) 100%)' }} />
    </AbsoluteFill>
  );
};

export const CusterTrial: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Fonts />
    {SCENE_COMPS.map((Comp, i) => {
      const S = SCENES[i];
      return (
        <Sequence key={S.n} from={S.from} durationInFrames={S.frames + (i < SCENE_COMPS.length - 1 ? OVERLAP : 0)} name={`Scene ${S.n}`}>
          <Fade first={i === 0}><Comp /></Fade>
        </Sequence>
      );
    })}
    <Grain />
    <Subtitles />
    <Audio src={staticFile('assets/sound/voiceover.mp3')} />
    <Audio src={staticFile('assets/music/score.mp3')} volume={(fr) => interpolate(fr, [0, 20], [0, 1], { extrapolateRight: 'clamp' }) * (0.8 - 0.48 * duckAt(fr / FPS))} />
    {(cues as { file: string; at: number; volume: number }[]).map((c, i) => (
      <Sequence key={i} from={Math.max(0, Math.round(c.at * FPS))} durationInFrames={Math.min(DURATION_FRAMES, 30 * 15)} name={`sfx ${c.file}`}>
        <Audio src={staticFile(`assets/sound/${c.file}`)} volume={(fr) => c.volume * (1 - 0.3 * duckAt(c.at + fr / FPS))} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
