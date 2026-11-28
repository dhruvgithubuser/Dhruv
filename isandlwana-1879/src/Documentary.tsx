import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Finish, Fonts } from './kit';
import { Flicker, LightLeak } from './vfx';
import cues from './data/sfx-cues.json';
import { SCENE_COMPS } from './Scenes';
import { C, DURATION_FRAMES, FPS, PHRASES, SANS, SCENES, sec } from './theme';

const OVERLAP = 10;
const duckAt = (t: number) => { let d = 0; for (const p of PHRASES) d = Math.max(d, Math.max(0, Math.min(1, Math.min(t - (p.start - 0.3), p.end + 0.4 - t) / 0.3 + 1))); return d; };
const Fade: React.FC<{ first: boolean; children: React.ReactNode }> = ({ first, children }) => {
  const f = useCurrentFrame(); const o = first ? 1 : interpolate(f, [0, OVERLAP], [0, 1], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

const KEY = new Set(['rifles', 'cannon', 'rockets', 'spears', 'shields', '330', 'gone', '1879', 'isandlwana', 'zulu', 'ultimatum', 'frere', 'without', 'disband', 'army', 'flimsy', 'chelmsford', '4700', 'cetshwayo', 'peace', 'ntshingwayo', '70', 'photographs', '20000', 'eat', 'scouts', 'screening', '50', 'ten', 'sphinxshaped', 'neither', 'week', 'dare', 'ngwebeni', 'seven', '23', '2800', 'purpose', '1300', 'pulleine', 'wait', 'durnford', 'rocket', 'raw', 'valley', 'early', 'reverse', 'buffalo', 'chest', 'horns', 'loins', 'martinihenry', 'deadly', 'perimeter', 'ammunition', 'screwdrivers', 'disagree', 'flank', 'charged', 'run', '230', 'eclipse', 'black', 'surrounded', 'fallen', 'fugitives', 'colour', 'victoria', 'cross', 'wolseley', 'five', '1000', 'sons', 'thousand', 'rorkes', '150', 'worst', 'greatest', 'ulundi', '45', 'burned', 'captured', 'london', '1883', 'blamed', 'outplan', 'split', 'adapted', 'surprise', 'planning', 'overconfidence', 'buried', 'chronicles']);
const CHUNKS = (() => {
  const out: { words: { w: string; start: number; end: number }[]; start: number; end: number }[] = [];
  for (const p of PHRASES) {
    let cur: { w: string; start: number; end: number }[] = [];
    (p.words ?? []).forEach((w, i, all) => {
      cur.push(w);
      if (cur.length >= 6 || (cur.length >= 2 && /[,.?!:]["”]?$/.test(w.w)) || i === all.length - 1) { out.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end }); cur = []; }
    });
  }
  return out.map((c, i) => ({ ...c, end: Math.min(out[i + 1]?.start ?? c.end + 0.6, c.end + 0.45) }));
})();
const Captions: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const ch = CHUNKS.find((c) => t >= c.start - 0.05 && t < c.end);
  if (!ch) return null;
  const k = spring({ frame: f - sec(ch.start - 0.05), fps, config: { damping: 15, stiffness: 240 } });
  return (
    <div style={{ position: 'absolute', left: 160, right: 160, bottom: 70, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 16px', transform: `scale(${0.94 + 0.06 * k})`, opacity: Math.min(1, k * 1.6) }}>
      {ch.words.map((w, i) => {
        const on = t >= w.start - 0.03;
        const key = KEY.has(w.w.toLowerCase().replace(/[^a-z0-9]/g, ''));
        return <span key={i} style={{ fontFamily: SANS, fontWeight: 800, fontSize: key ? 66 : 60, lineHeight: 1.15, textTransform: 'uppercase', color: on ? (key ? C.gold : '#fff') : 'rgba(255,255,255,0.5)', WebkitTextStroke: '9px #111', paintOrder: 'stroke fill', textShadow: '0 6px 18px rgba(0,0,0,0.7)' }}>{w.w}</span>;
      })}
    </div>
  );
};

export const Isandlwana: React.FC = () => (
  <AbsoluteFill style={{ background: '#1d1b19' }}>
    <Fonts />
    {SCENE_COMPS.map((Comp, i) => {
      const S = SCENES[i];
      return (
        <Sequence key={S.n} from={S.from} durationInFrames={S.frames + (i < SCENE_COMPS.length - 1 ? OVERLAP : 0)} name={`Scene ${S.n}`}>
          <Fade first={i === 0}><Comp /><LightLeak /></Fade>
        </Sequence>
      );
    })}
    <Finish />
    <Flicker />
    <Captions />
    <Audio src={staticFile('assets/sound/voiceover.mp3')} volume={1.0} />
    <Audio src={staticFile('assets/music/score.mp3')} volume={(fr) => interpolate(fr, [0, 20], [0, 1], { extrapolateRight: 'clamp' }) * (0.55 - 0.4 * duckAt(fr / FPS))} />
    {(cues as { file: string; at: number; volume: number }[]).map((c, i) => (
      <Sequence key={i} from={Math.max(0, Math.round(c.at * FPS))} durationInFrames={Math.min(DURATION_FRAMES, 30 * 20)} name={`sfx ${c.file}`}>
        <Audio src={staticFile(`assets/sound/${c.file}`)} volume={(fr) => c.volume * (1 - 0.45 * duckAt(c.at + fr / FPS))} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
