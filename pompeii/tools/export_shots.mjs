// Export the shot list (shots.js) as data: pompeii/cues.json (for audio/sound.py) and the storyboard table.
globalThis.location ??= { search: '' };
//   node pompeii/tools/export_shots.mjs
import fs from 'node:fs';
const { buildShots, overlays } = await import('../shots.js');
const TL = JSON.parse(fs.readFileSync('pompeii/timeline.json', 'utf8'));
const shots = buildShots(TL);
const cues = shots.map((s) => ({ id: s.id, t0: +s.t0.toFixed(3), t1: +s.t1.toFixed(3), set: s.set, amb: s.amb, tin: s.tin, tag: s.tag, desc: s.desc,
  sfx: (s.sfx || []).map(([o, n, g]) => [+(s.t0 + o).toFixed(3), n, g]), title: !!s.title, lower: s.lower ? [s.lower[2], s.lower[3]] : null, stamp: s.stamp ? s.stamp[2] : null, caption: s.caption ? s.caption[2] : null }));
fs.writeFileSync('pompeii/cues.json', JSON.stringify({ duration: TL.duration, shots: cues, chapters: overlays(TL) }, null, 1));
console.log(cues.length, 'shots ->', 'pompeii/cues.json');
