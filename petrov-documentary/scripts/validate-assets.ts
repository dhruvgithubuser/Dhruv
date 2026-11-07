// Builds src/asset-manifest.json and checks every file the film needs.
//   npx tsx scripts/validate-assets.ts
// Hand-painted illustrations are optional: drop public/images/scene-NN/illustration.png (1080x1920)
// and that scene plays it instead of its code-drawn art. Missing ones are listed with the prompt to make them.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const pub = (p: string) => path.join(ROOT, 'public', p);
const tl = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/timeline.json'), 'utf8'));
const cues = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/sfx-cues.json'), 'utf8'));

const PETROV = 'Lt. Col. Stanislav Petrov, 44, Soviet Air Defence Forces officer, short dark hair neatly combed back with a side part, clean-shaven, strong square jaw, serious composed expression, olive uniform jacket, white shirt, dark tie, lieutenant-colonel shoulder boards; match the supplied 1983 reference photo exactly';
const STYLE = 'semi-realistic hand-painted digital illustration, textured brush strokes, dark cinematic lighting, muted olive/charcoal/brown palette, 1980s Soviet technology, 9:16 vertical, no text';
const SCENES: { title: string; code: string[]; prompt: string }[] = [
  { title: 'The hook', code: ['BunkerWide', 'PetrovStanding', 'AnimatedGlobe', 'ForegroundConsole', 'EmergencyLights'], prompt: `${PETROV}, standing alone in a vast underground Soviet early-warning command bunker, giant wall map display, rows of consoles, red light pulsing, dust in light shafts, ${STYLE}` },
  { title: 'Date reveal', code: ['TearCalendar', 'WallClock', 'Typewriter'], prompt: `Soviet tear-off desk calendar showing 26 СЕНТЯБРЬ 1983 ПОНЕДЕЛЬНИК on a worn bunker desk, wall clock just after midnight, ${STYLE}` },
  { title: 'Cold War background', code: ['AnimatedGlobe', 'Stars'], prompt: `Earth from space centred on the Arctic, USA lit cold blue and the Soviet Union lit red, bomber silhouettes and missile arcs, ${STYLE}` },
  { title: 'Introducing Petrov', code: ['Petrov', 'BunkerWide', 'RadarAnimation', 'ForegroundConsole'], prompt: `${PETROV}, seated at a 1980s Soviet early-warning console, green radar glow on his face, officers at consoles behind, ${STYLE}` },
  { title: 'The bunker', code: ['BunkerWide', 'EmergencyLights', 'ForegroundConsole'], prompt: `wide shot of a Soviet nuclear early-warning command centre as red emergency lights switch on, the illuminated sign "СТАРТ" above a wall map, officers turning, ${STYLE}` },
  { title: 'The warning', code: ['RadarAnimation', 'MissileTrajectory'], prompt: `close-up of a circular 1980s radar CRT showing a polar map with five red missile tracks from the USA toward the USSR, ${STYLE}` },
  { title: 'Procedure', code: ['Petrov', 'RedPhone', 'BunkerWide'], prompt: `${PETROV}, standing beside a red secure military telephone with no dial, his hand moving toward the receiver, officers watching, red light, ${STYLE}` },
  { title: 'The consequences', code: ['RedPhone', 'MissileSilhouettes'], prompt: `red military telephone in the foreground, silhouettes of ICBMs rising from silos in red smoke behind, ${STYLE}` },
  { title: 'The doubt', code: ['Petrov'], prompt: `extreme close-up of ${PETROV}'s eyes, radar light reflecting across his face, darkness around, ${STYLE}` },
  { title: 'Five missiles', code: ['RadarAnimation', 'MissileTrajectory'], prompt: `radar display with exactly five missile warning markers, comparison inset of hundreds of missile icons, ${STYLE}` },
  { title: 'The decision', code: ['Petrov', 'BunkerWide', 'EmergencyLights'], prompt: `${PETROV}, calmly speaking into a red telephone handset while red alarm lights flash and officers watch uncertainly, ${STYLE}` },
  { title: 'The silence', code: ['BunkerWide', 'WallClock', 'TimelineGraphic'], prompt: `quiet Soviet command bunker after an alarm, red lights fading, officers waiting, a wall clock, ${STYLE}` },
  { title: 'The satellite error', code: ['AnimatedGlobe', 'Satellite', 'Sun', 'Ray'], prompt: `Soviet early-warning satellite above Earth, sunlight glinting off high-altitude clouds over North America toward its sensor, ${STYLE}` },
  { title: 'The legacy', code: ['Corridor', 'PetrovStanding', 'AnimatedGlobe'], prompt: `${PETROV}, walking alone down a dim Soviet military corridor, red lights giving way to warm light, ${STYLE}` },
  { title: 'Final message', code: ['Petrov (silhouette)', 'AnimatedGlobe', 'DocTitle'], prompt: `silhouette of ${PETROV} against a peaceful Earth glowing gold, ${STYLE}` },
];

const problems: string[] = [];
const need = ['audio/voiceover.mp3', 'audio/background-music.mp3', 'fonts/Oswald-700.woff2', 'fonts/Cinzel-700.woff2', 'images/textures/canvas.png',
  ...Array.from({ length: 8 }, (_, i) => `images/textures/grain_${i}.png`), ...new Set(cues.map((c: any) => `audio/sound-effects/${c.file}`))] as string[];
for (const f of need) if (!fs.existsSync(pub(f))) problems.push(`missing ${f}`);

const scenes = SCENES.map((s, i) => {
  const n = i + 1;
  const file = `images/scene-${String(n).padStart(2, '0')}/illustration.png`;
  fs.mkdirSync(path.dirname(pub(file)), { recursive: true });
  const lines = tl.phrases.filter((p: any) => p.scene === n).map((p: any) => p.text);
  if (!lines.length) problems.push(`scene ${n} has no narration`);
  return { scene: n, title: s.title, narration: lines, codeDrawnArt: s.code, illustration: { file, available: fs.existsSync(pub(file)), prompt: s.prompt } };
});
fs.writeFileSync(path.join(ROOT, 'src/asset-manifest.json'), JSON.stringify({ note: 'available=false: the scene uses its code-drawn art; add the file to override', scenes }, null, 1));
const covered = tl.phrases.length;
console.log(`scenes: 15, narration lines: ${covered}, illustrations supplied: ${scenes.filter((s) => s.illustration.available).length}/15`);
console.log(problems.length ? `PROBLEMS:\n  ${problems.join('\n  ')}` : 'all required assets present');
if (problems.length) process.exit(1);
