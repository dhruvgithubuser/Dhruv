// Narration: ElevenLabs when ELEVENLABS_API_KEY is set, otherwise the local Kokoro voice.
//   npx tsx scripts/generate-voiceover.ts
// Either way it writes public/audio/voiceover.mp3 and src/timeline.json (scene + word timings that
// drive the scene cuts and captions). Keys are read from the environment only.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const key = process.env.ELEVENLABS_API_KEY;
const voice = process.env.ELEVENLABS_VOICE_ID;
const py = process.env.PYTHON ?? 'python3';

async function eleven() {
  // Synthesize phrase by phrase with the same text and pauses as the local script, so timing logic is shared.
  const src = fs.readFileSync(path.join(ROOT, 'scripts/voiceover_kokoro.py'), 'utf8');
  const phrases = [...src.matchAll(/\((\d+), "([^"]+)",\s*\n?\s*"([^"]+)", ([\d.]+)\)/g)].map((m) => ({ scene: +m[1], spoken: m[2], caption: m[3], pause: +m[4] }));
  const dir = path.join(ROOT, 'public/audio/eleven');
  fs.mkdirSync(dir, { recursive: true });
  for (const [i, p] of phrases.entries()) {
    const out = path.join(dir, `${String(i).padStart(2, '0')}.mp3`);
    if (fs.existsSync(out)) continue;
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: 'POST',
      headers: { 'xi-api-key': key!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: p.spoken, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.55, similarity_boost: 0.8, style: 0.25 } }),
    });
    if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${await r.text()}`);
    fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
    console.log('take', i, p.caption);
  }
  console.log(`ElevenLabs takes in ${dir}. Run voiceover_kokoro.py with --takes ${dir} to assemble and time them.`);
}

if (key && voice) {
  await eleven();
} else {
  const kdir = process.env.KOKORO_DIR;
  if (!kdir) {
    console.error('No ELEVENLABS_API_KEY/ELEVENLABS_VOICE_ID and no KOKORO_DIR. See README "Voiceover".');
    process.exit(1);
  }
  execFileSync(py, [path.join(ROOT, 'scripts/voiceover_kokoro.py'), kdir, '--whisper'], { stdio: 'inherit' });
}
