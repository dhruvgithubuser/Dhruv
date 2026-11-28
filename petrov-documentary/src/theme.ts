// Shared palette, fonts, timing and deterministic noise. Every animation in the film is a pure
// function of the Remotion frame: no timers, no Math.random.
import { Easing, interpolate } from 'remotion';
import timeline from './timeline.json';

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const DURATION_S = 80;
export const DURATION_FRAMES = DURATION_S * FPS;

export const C = {
  black: '#07080a',
  charcoal: '#14161a',
  charcoal2: '#1d2024',
  steel: '#2b3036',
  olive: '#4a5236',
  oliveDark: '#2c3221',
  oliveLight: '#6b7350',
  brown: '#4a3a2a',
  brownDark: '#2a2018',
  red: '#d42a1f',
  redDeep: '#7a1410',
  redGlow: '#ff4a32',
  phosphor: '#8ff07a',
  phosphorDim: '#2f6a2a',
  amber: '#ffb347',
  gold: '#e8b865',
  warm: '#f3c27a',
  usa: '#6f8fb3',
  ussr: '#c23a2c',
  paper: '#e9dfc8',
  white: '#f4efe6',
  yellow: '#ffd34d',
};

export const FONT_CAPTION = 'Oswald';
export const FONT_TITLE = 'Cinzel';

export const sec = (s: number) => Math.round(s * FPS);

// ------------------------------------------------------------- deterministic noise
export function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const hash01 = (i: number, seed = 1) => mulberry32((i * 374761393 + seed * 668265263) | 0)();
export function noise1(x: number, seed = 1) {
  const i = Math.floor(x), f = x - i, s = f * f * (3 - 2 * f);
  return (hash01(i, seed) * (1 - s) + hash01(i + 1, seed) * s) * 2 - 1;
}

// ------------------------------------------------------------- easing helpers
export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const ease = (f: number, a: number, b: number, from = 0, to = 1, e = Easing.inOut(Easing.cubic)) =>
  b <= a ? (f >= a ? to : from) : interpolate(f, [a, b], [from, to], { ...clamp, easing: e });
export const lin = (f: number, a: number, b: number, from = 0, to = 1) => (b <= a ? (f >= a ? to : from) : interpolate(f, [a, b], [from, to], clamp));
// zoom in log space: reads as a constant-rate dolly
export const logZoom = (p: number, a: number, b: number) => a * Math.pow(b / a, p);

// ------------------------------------------------------------- scene timing from the narration
export type Phrase = { scene: number; text: string; start: number; end: number; words?: { w: string; start: number; end: number }[] };
export const PHRASES = timeline.phrases as Phrase[];

const firstStart = (n: number) => PHRASES.find((p) => p.scene === n)!.start;
// each scene cuts in a beat before its first line (scene 1 at 0, scene 15 runs to the end)
export const SCENES = Array.from({ length: 15 }, (_, i) => {
  const n = i + 1;
  const start = n === 1 ? 0 : firstStart(n) - 0.3;
  const end = n === 15 ? DURATION_S : firstStart(n + 1) - 0.3;
  return { n, start, end, from: sec(start), frames: sec(end) - sec(start) };
});
export const phrasesOf = (n: number) => PHRASES.filter((p) => p.scene === n);
// local frame (inside scene n) of an absolute time in seconds
export const localF = (n: number, s: number) => sec(s) - SCENES[n - 1].from;
// local frame where the narration says `word` in scene n (first match), for picture accents
export function wordF(n: number, word: string, nth = 0): number {
  const ws = phrasesOf(n).flatMap((p) => p.words ?? []);
  const hits = ws.filter((w) => w.w.toLowerCase().replace(/[^a-z0-9']/g, '') === word.toLowerCase());
  const h = hits[Math.min(nth, hits.length - 1)];
  return h ? localF(n, h.start) : 0;
}
