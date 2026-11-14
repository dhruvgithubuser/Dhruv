"""Ghost Army narration: Kokoro-82M ONNX, deep American male (am_michael/am_onyx blend).

    python scripts/voiceover_kokoro.py <kokoro_dir> [--whisper]

<kokoro_dir> holds model.onnx and am_michael.bin / am_onyx.bin from
huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX. Synthesizes the script phrase by phrase with
deliberate dramatic pauses, then (with --whisper) gets word timestamps from faster-whisper so the
on-screen captions follow the voice word by word.

Writes public/audio/voiceover.wav + voiceover.mp3 and src/timeline.json
(phrases with start/end seconds, scene ids, and word timings).
"""
import difflib
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro
from scipy.signal import resample_poly, butter, sosfilt

ROOT = Path(__file__).resolve().parent.parent
KDIR = Path(sys.argv[1])
SR = 48000
SPEED = 1.06
PAUSE_SCALE = 1.0
LEAD = 0.35  # silence before the first word

# (scene, spoken text (what the TTS reads), caption text (exact script wording), pause after in s)
PHRASES = [
    (1, 'December, eighteen twelve. A handful of frozen, starving men stumble across a bridge over the Niemen River, at the western edge of the Russian Empire.', 'December 1812. A handful of frozen, starving men stumble across a bridge over the Niemen River, at the western edge of the Russian Empire.', 0.6),
    (2, 'Six months earlier, more than four hundred and fifty thousand soldiers had marched across this same river. One of the largest armies Europe had ever seen.', 'Six months earlier, more than 450,000 soldiers had marched across this same river. One of the largest armies Europe had ever seen.', 0.6),
    (3, 'Most of them never came back.', 'Most of them never came back.', 0.8),
    (3, 'History blames the Russian winter. But the army was already half gone... before the first snow fell.', 'History blames the Russian winter. But the army was already half gone before the first snow fell.', 0.7),
    (4, 'This is the story of the mistake that cost Napoleon Bonaparte his empire.', 'This is the story of the mistake that cost Napoleon Bonaparte his empire.', 1.2),
    (5, 'By eighteen twelve, Napoleon was the most powerful man in Europe. In a decade of war, he had crushed Austria, Prussia and Russia, and placed his own brothers on thrones across the continent.', 'By 1812, Napoleon was the most powerful man in Europe. In a decade of war, he had crushed Austria, Prussia and Russia, and placed his own brothers on thrones across the continent.', 0.6),
    (6, 'Only one enemy refused to bow: Britain. Protected by the Royal Navy, it was beyond the reach of his armies.', 'Only one enemy refused to bow: Britain. Protected by the Royal Navy, it was beyond the reach of his armies.', 0.5),
    (7, 'So Napoleon tried to strangle Britain with trade. Under his Continental System, the ports of Europe were closed to British goods.', 'So Napoleon tried to strangle Britain with trade. Under his Continental System, the ports of Europe were closed to British goods.', 0.5),
    (8, 'Russia had joined the blockade in eighteen oh seven. But it was crippling the Russian economy. And on the last day of eighteen ten, Tsar Alexander the First broke away.', 'Russia had joined the blockade in 1807. But it was crippling the Russian economy. And on the last day of 1810, Tsar Alexander I broke away.', 0.6),
    (9, 'To Napoleon, it was betrayal. If Russia could defy him, others would follow. He decided to teach the Tsar a lesson.', 'To Napoleon, it was betrayal. If Russia could defy him, others would follow. He decided to teach the Tsar a lesson.', 0.7),
    (10, 'His plan was simple: march into Russia, destroy the Russian army in one decisive battle within weeks, and force Alexander back into line.', 'His plan was simple: march into Russia, destroy the Russian army in one decisive battle within weeks, and force Alexander back into line.', 0.5),
    (11, 'He assembled a force unlike anything seen before. More than four hundred and fifty thousand men. One hundred and fifty thousand horses. Twenty-five thousand wagons. And nearly fourteen hundred cannon.', 'He assembled a force unlike anything seen before. More than 450,000 men. 150,000 horses. 25,000 wagons. And nearly 1,400 cannon.', 0.5),
    (12, 'Only about half of them were French. Poles, Germans, Italians, Austrians and Swiss marched under the same eagle.', 'Only about half of them were French. Poles, Germans, Italians, Austrians and Swiss marched under the same eagle.', 0.5),
    (13, 'On June twenty-fourth, eighteen twelve, the Grande Armée crossed the Niemen River into Russia.', 'On June 24, 1812, the Grande Armée crossed the Niemen River into Russia.', 1.0),
    (14, 'Napoleon expected the Russians to stand and fight. They did not. The Russian armies retreated, deeper and deeper into their vast country, burning crops, villages and supplies as they went.', 'Napoleon expected the Russians to stand and fight. They did not. The Russian armies retreated, deeper and deeper into their vast country, burning crops, villages and supplies as they went.', 0.5),
    (15, 'The Grande Armée marched into an empty land, and its supply wagons could not keep up.', 'The Grande Armée marched into an empty land, and its supply wagons could not keep up.', 0.5),
    (16, 'The summer was brutal. Men collapsed from heat and thirst. Dysentery and typhus spread through the ranks.', 'The summer was brutal. Men collapsed from heat and thirst. Dysentery and typhus spread through the ranks.', 0.5),
    (17, 'Horses died by the thousands. By the time Napoleon reached Vilnius, more than five thousand dead horses lay behind him.', 'Horses died by the thousands. By the time Napoleon reached Vilnius, more than 5,000 dead horses lay behind him.', 0.5),
    (18, 'In just the first eight weeks, the main army lost a third of its strength, before a single major battle had been fought.', 'In just the first eight weeks, the main army lost a third of its strength, before a single major battle had been fought.', 0.6),
    (19, 'In August, the Russians fought at Smolensk, then slipped away again, leaving the city in flames.', 'In August, the Russians fought at Smolensk, then slipped away again, leaving the city in flames.', 0.5),
    (20, 'The Tsar now gave command to an old, battle-scarred general: Mikhail Kutuzov.', 'The Tsar now gave command to an old, battle-scarred general: Mikhail Kutuzov.', 1.0),
    (21, 'On September seventh, near the village of Borodino, about seventy-five miles from Moscow, Kutuzov finally stood his ground.', 'On September 7, near the village of Borodino, about 75 miles from Moscow, Kutuzov finally stood his ground.', 0.5),
    (22, 'About a quarter of a million soldiers clashed in a single day. It became the bloodiest day of the Napoleonic Wars.', 'About a quarter of a million soldiers clashed in a single day. It became the bloodiest day of the Napoleonic Wars.', 0.5),
    (23, 'By nightfall, more than seventy thousand men had been killed or wounded.', 'By nightfall, more than 70,000 men had been killed or wounded.', 0.6),
    (24, 'Napoleon held the field. But at the decisive moment, he refused to send in his elite Imperial Guard.', 'Napoleon held the field. But at the decisive moment, he refused to send in his elite Imperial Guard.', 0.5),
    (25, 'The Russian army pulled back, bloodied, but alive. The decisive victory he needed had slipped away.', 'The Russian army pulled back, bloodied but alive. The decisive victory he needed had slipped away.', 1.0),
    (26, 'A week later, on September fourteenth, Napoleon rode into Moscow with roughly one hundred thousand men. He expected nobles to greet him with the keys of the city. No one came. Moscow was almost empty.', 'A week later, on September 14, Napoleon rode into Moscow with roughly 100,000 men. He expected nobles to greet him with the keys of the city. No one came. Moscow was almost empty.', 0.6),
    (27, "That night, fires broke out across the city. Within days, three-quarters of Moscow had burned. The city's governor, Count Rostopchin, is widely believed to have organized the destruction.", "That night, fires broke out across the city. Within days, three-quarters of Moscow had burned. The city's governor, Count Rostopchin, is widely believed to have organized the destruction.", 1.0),
    (28, 'And here, Napoleon made the decision that sealed his fate. He waited.', 'And here, Napoleon made the decision that sealed his fate. He waited.', 0.8),
    (28, 'Convinced the Tsar would now ask for peace, he stayed in the ruins of Moscow for five weeks, sending letters to Alexander.', 'Convinced the Tsar would now ask for peace, he stayed in the ruins of Moscow for five weeks, sending letters to Alexander.', 0.5),
    (29, 'Alexander refused to answer.', 'Alexander refused to answer.', 0.7),
    (30, "Every day Napoleon waited, Kutuzov's army grew stronger, and the Russian winter came closer.", "Every day Napoleon waited, Kutuzov's army grew stronger, and the Russian winter came closer.", 0.6),
    (31, 'This was the mistake. Napoleon believed that capturing a capital would end the war, as it always had before. But Russia was not Austria. And Alexander was not going to surrender.', 'This was the mistake. Napoleon believed that capturing a capital would end the war, as it always had before. But Russia was not Austria. And Alexander was not going to surrender.', 0.6),
    (32, 'On October nineteenth, Napoleon finally left Moscow. He had waited thirty-five days.', 'On October 19, Napoleon finally left Moscow. He had waited 35 days.', 1.0),
    (33, 'He tried to take a southern road through untouched country. But at Maloyaroslavets, the Russians blocked the way. The army was forced back onto the same road it had come by... a road it had already stripped bare.', 'He tried to take a southern road through untouched country. But at Maloyaroslavets, the Russians blocked the way. The army was forced back onto the same road it had come by, a road it had already stripped bare.', 0.6),
    (34, 'Then, on November sixth, the winter arrived.', 'Then, on November 6, the winter arrived.', 0.6),
    (35, 'The soldiers were still wearing summer uniforms. The horses had no winter shoes. They slipped on the icy roads, and died.', 'The soldiers were still wearing summer uniforms. The horses had no winter shoes. They slipped on the icy roads, and died.', 0.5),
    (36, 'Without horses, the cannon and supply wagons were abandoned. Men fought over horse meat, and froze where they slept.', 'Without horses, the cannon and supply wagons were abandoned. Men fought over horse meat, and froze where they slept.', 0.5),
    (37, 'Cossacks and Russian peasants struck the stragglers, day and night.', 'Cossacks and Russian peasants struck the stragglers, day and night.', 0.5),
    (38, 'At night, temperatures plunged far below zero, at times to minus thirty degrees and colder.', 'At night, temperatures plunged far below zero, at times to minus thirty degrees and colder.', 1.0),
    (39, 'In late November, the army reached the Berezina River, with Russian armies closing in from three sides. The bridges were gone.', 'In late November, the army reached the Berezina River, with Russian armies closing in from three sides. The bridges were gone.', 0.5),
    (40, "Napoleon's engineers waded into the freezing water to build two new ones. Their commander, General Eblé, had disobeyed orders to destroy his bridging tools. That disobedience saved what was left of the army.", "Napoleon's engineers waded into the freezing water to build two new ones. Their commander, General Eblé, had disobeyed orders to destroy his bridging tools. That disobedience saved what was left of the army.", 0.5),
    (41, 'For three days, the army crossed under Russian fire. Tens of thousands never made it to the other side.', 'For three days, the army crossed under Russian fire. Tens of thousands never made it to the other side.', 0.7),
    (42, 'On December fifth, Napoleon left his army behind, and raced back to Paris by sleigh.', 'On December 5, Napoleon left his army behind and raced back to Paris by sleigh.', 0.5),
    (43, 'Marshal Michel Ney commanded the rear guard. He is said to have been the last French soldier to leave Russian soil.', 'Marshal Michel Ney commanded the rear guard. He is said to have been the last French soldier to leave Russian soil.', 1.1),
    (44, 'Of the four hundred and fifty thousand men who had entered Russia with the main army, only a small fraction came back. Estimates of the French and allied dead run to three hundred thousand or more.', 'Of the 450,000 men who had entered Russia with the main army, only a small fraction came back. Estimates of the French and allied dead run to 300,000 or more.', 0.5),
    (44, 'Decades later, a French engineer named Charles Joseph Minard drew the disaster as a single graphic. The army shrinks from four hundred and twenty-two thousand men... to ten thousand.', 'Decades later, a French engineer named Charles Joseph Minard drew the disaster as a single graphic. The army shrinks from 422,000 men to 10,000.', 0.5),
    (44, 'It has been called the best statistical graphic ever drawn.', 'It has been called the best statistical graphic ever drawn.', 0.8),
    (45, "Napoleon's aura of invincibility was gone. Prussia and Austria turned against him, and in eighteen thirteen, the armies of Europe crushed him at Leipzig.", "Napoleon's aura of invincibility was gone. Prussia and Austria turned against him, and in 1813, the armies of Europe crushed him at Leipzig.", 0.5),
    (46, 'In April eighteen fourteen, Napoleon gave up his throne and was exiled to the island of Elba.', 'In April 1814, Napoleon gave up his throne and was exiled to the island of Elba.', 0.5),
    (47, 'He would return one last time... for a hundred days, and meet his final defeat at Waterloo.', 'He would return one last time, for a hundred days, and meet his final defeat at Waterloo.', 1.0),
    (48, 'So what really destroyed the Grande Armée? Not one battle. Not even the winter.', 'So what really destroyed the Grande Armée? Not one battle. Not even the winter.', 0.6),
    (48, 'It was a gamble: that one battle, or one captured city, would force an empire to surrender. And thirty-five days of waiting in a burning city, while the winter marched toward him.', 'It was a gamble: that one battle, or one captured city, would force an empire to surrender. And 35 days of waiting in a burning city, while the winter marched toward him.', 0.8),
    (49, "Was it Napoleon's greatest mistake, or was Russia simply unconquerable? Tell us in the comments, and subscribe to Buried Chronicles for more of history's turning points.", "Was it Napoleon's greatest mistake, or was Russia simply unconquerable? Tell us in the comments, and subscribe to Buried Chronicles for more of history's turning points.", 0.0),
]
TAIL = 3.0  # title card after the last word


def voice_style():
    m = np.fromfile(KDIR / "am_michael.bin", dtype=np.float32).reshape(-1, 1, 256)
    o = np.fromfile(KDIR / "am_onyx.bin", dtype=np.float32).reshape(-1, 1, 256)
    return (0.6 * m + 0.4 * o).astype(np.float32)  # deep American documentary male


def warm(x):
    """Gentle broadcast EQ: low-shelf-ish lift + a little air cut, then normalise."""
    lows = sosfilt(butter(2, 180, "lowpass", fs=SR, output="sos"), x)
    x = x + 0.25 * lows
    x = sosfilt(butter(2, 9500, "lowpass", fs=SR, output="sos"), x)
    return x


def main():
    npz = KDIR / "voices_napoleon.npz"
    np.savez(npz, narrator=voice_style())
    tts = Kokoro(str(KDIR / "model.onnx"), str(npz))
    parts, phrases, t = [np.zeros(int(LEAD * SR))], [], LEAD
    for scene, spoken, caption, pause in PHRASES:
        audio, sr = tts.create(spoken, voice="narrator", speed=SPEED, lang="en-us")
        a = resample_poly(audio.astype(np.float64), SR, sr)
        env = np.abs(a)
        idx = np.where(env > env.max() * 10 ** (-42 / 20))[0]
        a = a[max(0, idx[0] - int(0.03 * SR)): idx[-1] + int(0.06 * SR)]
        start, end = t, t + len(a) / SR
        phrases.append({"scene": scene, "text": caption, "start": round(start, 3), "end": round(end, 3)})
        pause *= PAUSE_SCALE
        parts += [a, np.zeros(int(pause * SR))]
        t = end + pause
        print(f"S{scene:02d} {start:6.2f}-{end:6.2f}  {caption[:70]}")
    parts.append(np.zeros(int(TAIL * SR)))
    vo = warm(np.concatenate(parts))
    vo *= 10 ** (-1.5 / 20) / (np.abs(vo).max() + 1e-9)
    duration = len(vo) / SR
    out = ROOT / "public" / "assets" / "sound"
    sf.write(out / "voiceover.wav", vo.astype(np.float32), SR, subtype="PCM_24")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(out / "voiceover.wav"), "-c:a", "libmp3lame",
                    "-b:a", "192k", str(out / "voiceover.mp3")], check=True)

    if "--whisper" in sys.argv:
        add_words(vo, phrases)
    timeline = {"fps": 30, "duration": round(duration, 3), "voice": "kokoro am_michael/am_onyx blend (en-us)",
                "phrases": phrases}
    (ROOT / "src" / "data" / "timeline.json").write_text(json.dumps(timeline, indent=1))
    print(f"duration {duration:.2f}s -> public/audio/voiceover.mp3, src/timeline.json")


def norm(w):
    return re.sub(r"[^a-z0-9']", "", w.lower().replace("’", "'"))


def add_words(vo, phrases):
    """Word times from faster-whisper, mapped onto the exact script words of each phrase."""
    from faster_whisper import WhisperModel
    a16 = resample_poly(vo, 1, 3).astype(np.float32)
    model = WhisperModel("base.en", device="cpu", compute_type="int8")
    for p in phrases:
        seg = a16[int((p["start"] - 0.1) * 16000): int((p["end"] + 0.15) * 16000)]
        segs, _ = model.transcribe(seg, word_timestamps=True, language="en")
        heard = [(w.word.strip(), w.start + p["start"] - 0.1, w.end + p["start"] - 0.1) for s in segs for w in s.words]
        script = p["text"].split()
        sm = difflib.SequenceMatcher(a=[norm(w) for w in script], b=[norm(h[0]) for h in heard], autojunk=False)
        times = [None] * len(script)
        for blk in sm.get_matching_blocks():
            for k in range(blk.size):
                times[blk.a + k] = heard[blk.b + k][1:]
        # fill gaps (numbers spoken as words, etc.) by interpolating inside the phrase
        known = [(i, tm) for i, tm in enumerate(times) if tm]
        anchors = [(-1, (p["start"], p["start"]))] + known + [(len(script), (p["end"], p["end"]))]
        for (i0, t0), (i1, t1) in zip(anchors, anchors[1:]):
            n = i1 - i0
            for k in range(1, n):
                s = t0[1] + (t1[0] - t0[1]) * (k - 1) / max(1, n - 1)
                e = t0[1] + (t1[0] - t0[1]) * k / max(1, n - 1)
                times[i0 + k] = (s, max(e, s + 0.12))
        p["words"] = [{"w": w, "start": round(tm[0], 3), "end": round(tm[1], 3)} for w, tm in zip(script, times)]
        print(f"  words S{p['scene']:02d}: {sum(1 for x in sm.get_matching_blocks() for _ in range(x.size))}/{len(script)} matched")


if __name__ == "__main__":
    main()
