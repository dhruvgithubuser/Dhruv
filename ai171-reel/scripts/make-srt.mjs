// Subtitles (SRT) from the narration timeline: one cue per sentence-sized phrase, max ~42 chars per line.
import fs from 'node:fs';
const tl = JSON.parse(fs.readFileSync(new URL('../src/timeline.json', import.meta.url)));
const ts = (s) => { const ms = Math.round(s * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
const cues = [];
for (const p of tl.phrases) {
  const words = p.words ?? [];
  let cur = [];
  const flush = () => { if (cur.length) cues.push({ start: cur[0].start, end: cur[cur.length - 1].end + 0.15, text: cur.map((w) => w.w).join(' ') }); cur = []; };
  for (const w of words) { cur.push(w); if (cur.map((x) => x.w).join(' ').length > 38 || /[,.?!]$/.test(w.w) && cur.length > 3) flush(); }
  flush();
}
cues.forEach((c, i) => console.log(`${i + 1}\n${ts(c.start)} --> ${ts(Math.min(c.end, cues[i + 1]?.start ?? c.end))}\n${c.text}\n`));
