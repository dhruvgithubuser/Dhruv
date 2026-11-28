// The narration as recorded (src/data/timeline.json is generated from scripts/voiceover_kokoro.py and holds word timings).
import timeline from './timeline.json';
export type Line = { scene: number; text: string; start: number; end: number };
export const NARRATION: Line[] = (timeline.phrases as Line[]).map(({ scene, text, start, end }) => ({ scene, text, start, end }));
export const VOICE = timeline.voice;
