import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Finish, SANS } from './components/Doc';
import { Fonts } from './components/VoxKit';
import cues from './data/sfx-cues.json';
import { SCENE_COMPS } from './Scenes';
import { DURATION_FRAMES, FPS, PHRASES, SCENES } from './theme';

const OVERLAP = 12;
const duckAt = (t: number) => { let d = 0; for (const p of PHRASES) d = Math.max(d, Math.max(0, Math.min(1, Math.min(t - (p.start - 0.3), p.end + 0.4 - t) / 0.3 + 1))); return d; };
const Fade: React.FC<{ first: boolean; children: React.ReactNode }> = ({ first, children }) => {
  const f = useCurrentFrame(); const o = first ? interpolate(f, [0, 20], [0, 1], { extrapolateRight: 'clamp' }) : interpolate(f, [0, OVERLAP], [0, 1], { extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

/** Documentary subtitles: up to ~9 words per line-pair, bottom centre. */
const CHUNKS = (() => {
  const out: { text: string; start: number; end: number }[] = [];
  for (const p of PHRASES) {
    let cur: { w: string; start: number; end: number }[] = [];
    (p.words ?? []).forEach((w, i, all) => {
      cur.push(w);
      if (cur.length >= 9 || (cur.length >= 4 && /[,.?!:]["”]?$/.test(w.w)) || i === all.length - 1) { out.push({ text: cur.map((x) => x.w).join(' '), start: cur[0].start, end: cur[cur.length - 1].end }); cur = []; }
    });
  }
  return out.map((c, i) => ({ ...c, end: Math.min(out[i + 1]?.start ?? c.end + 0.8, c.end + 0.6) }));
})();
const Subtitles: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const ch = CHUNKS.find((c) => t >= c.start - 0.05 && t < c.end);
  if (!ch) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 72, textAlign: 'center' }}>
      <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 44, lineHeight: 1.35, color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '6px 22px', borderRadius: 6, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone', textShadow: '0 2px 6px #000' }}>{ch.text}</span>
    </div>
  );
};

export const Napoleon1812: React.FC = () => (
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
    <Finish />
    <Subtitles />
    <Audio src={staticFile('assets/sound/voiceover.mp3')} />
    <Audio src={staticFile('assets/music/score.mp3')} volume={(fr) => interpolate(fr, [0, 20], [0, 1], { extrapolateRight: 'clamp' }) * (0.85 - 0.5 * duckAt(fr / FPS))} />
    {(cues as { file: string; at: number; volume: number }[]).map((c, i) => (
      <Sequence key={i} from={Math.max(0, Math.round(c.at * FPS))} durationInFrames={Math.min(DURATION_FRAMES, 30 * 20)} name={`sfx ${c.file}`}>
        <Audio src={staticFile(`assets/sound/${c.file}`)} volume={(fr) => c.volume * (1 - 0.3 * duckAt(c.at + fr / FPS))} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
