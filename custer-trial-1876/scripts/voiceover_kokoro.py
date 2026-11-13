"""The Trial After Little Bighorn narration: Kokoro-82M ONNX, deep American male (am_michael/am_onyx blend).

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
SPEED = 1.04
PAUSE_SCALE = 1.0
LEAD = 0.35  # silence before the first word

# (scene, spoken text (what the TTS reads), caption text (exact script wording), pause after in s)
PHRASES = [
    (1, 'Chicago. January thirteenth, eighteen seventy-nine.', "Chicago. January 13, 1879.", 0.5),
    (2, 'Inside a hotel called the Palmer House, a United States Army court opens its doors.', "Inside a hotel called the Palmer House, a United States Army court opens its doors.", 0.4),
    (3, 'And the man on trial... asked to be here. Major Marcus Reno.', "And the man on trial asked to be here. Major Marcus Reno.", 0.6),
    (4, 'For two and a half years, America has called him a coward. A drunk. The officer who let George Armstrong Custer die.', "For two and a half years, America has called him a coward. A drunk. The officer who let George Armstrong Custer die.", 0.5),
    (5, 'Today, Reno wants a verdict. But to judge him, this court must answer a bigger question. Who really lost the Battle of the Little Bighorn?', "Today, Reno wants a verdict. But to judge him, this court must answer a bigger question. Who really lost the Battle of the Little Bighorn?", 0.6),
    (6, "You've heard the legend. Now hear the evidence. And this time... you are the jury.", "You've heard the legend. Now hear the evidence. And this time, you are the jury.", 1.0),
    (7, 'The dead man at the center of this case is famous. George Armstrong Custer graduated last in his class at West Point. Two years later, at just twenty-three, he was a general.', "The dead man at the center of this case is famous. George Armstrong Custer graduated last in his class at West Point. Two years later, at just 23, he was a general.", 0.4),
    (8, 'Brave, reckless, and loved by the newspapers, he became the boy general of the Union cavalry.', "Brave, reckless, and loved by the newspapers, he became the boy general of the Union cavalry.", 0.5),
    (9, "Marcus Reno was his opposite. A quiet career officer, injured in the Civil War. In June, eighteen seventy-six, he was Custer's second in command in the Seventh Cavalry.", "Marcus Reno was his opposite. A quiet career officer, injured in the Civil War. In June 1876, he was Custer's second in command in the 7th Cavalry.", 0.6),
    (10, 'To understand how they got to that river, go back two years. In eighteen seventy-four, Custer led an expedition into the Black Hills, land promised to the Lakota by treaty. And he reported gold.', "To understand how they got to that river, go back two years. In 1874, Custer led an expedition into the Black Hills, land promised to the Lakota by treaty. And he reported gold.", 0.4),
    (11, 'Miners poured in. When the Lakota and their allies refused to sell, the army was sent to force them onto reservations.', "Miners poured in. When the Lakota and their allies refused to sell, the army was sent to force them onto reservations.", 0.5),
    (12, 'In the summer of eighteen seventy-six, three army columns closed in. The fastest was the Seventh Cavalry. About six hundred soldiers, plus scouts and civilians, under Custer.', "In the summer of 1876, three army columns closed in. The fastest was the 7th Cavalry. About 600 soldiers, plus scouts and civilians, under Custer.", 0.7),
    (13, 'Exhibit A. General Alfred Terry offered Custer a battery of Gatling guns, and an extra battalion of cavalry. Custer turned both down.', "Exhibit A. General Alfred Terry offered Custer a battery of Gatling guns and an extra battalion of cavalry. Custer turned both down.", 0.5),
    (14, 'The prosecution says he threw away firepower. The defense says the guns were heavy, jammed often, and would have slowed a march of nearly thirty miles a day. Custer chose speed.', "The prosecution says he threw away firepower. The defense says the guns were heavy, jammed often, and would have slowed a march of nearly 30 miles a day. Custer chose speed.", 0.6),
    (15, 'Exhibit B. The army expected to face no more than eight hundred warriors, a number taken from reservation agents.', "Exhibit B. The army expected to face no more than 800 warriors, a number taken from reservation agents.", 0.4),
    (16, 'In reality, the village on the Little Bighorn was one of the largest ever gathered on the northern plains. Thousands of people. Between eleven hundred and twenty-five hundred warriors.', "In reality, the village on the Little Bighorn was one of the largest ever gathered on the northern plains. Thousands of people. Between 1,100 and 2,500 warriors.", 0.7),
    (17, "Exhibit C. Dawn, June twenty-fifth. From a hilltop called the Crow's Nest, Custer's scouts spotted a massive pony herd, fourteen miles away.", "Exhibit C. Dawn, June 25. From a hilltop called the Crow's Nest, Custer's scouts spotted a massive pony herd, 14 miles away.", 0.4),
    (18, 'Custer wanted a day to scout before attacking. Then he learned his column had already been seen. Afraid the village would scatter, he decided to attack at once.', "Custer wanted a day to scout before attacking. Then he learned his column had already been seen. Afraid the village would scatter, he decided to attack at once.", 0.6),
    (19, 'Exhibit D. Custer split the regiment. Captain Frederick Benteen took three companies to scout the hills to the left. Reno took three companies, about a hundred and forty men, to charge the village from the south. Custer kept five companies, about two hundred and ten men, and rode north.', "Exhibit D. Custer split the regiment. Captain Frederick Benteen took three companies to scout the hills to the left. Reno took three companies, about 140 men, to charge the village from the south. Custer kept five companies, about 210 men, and rode north.", 0.7),
    (20, 'Reno crossed the river and charged. Then the warriors came out to meet him.', "Reno crossed the river and charged. Then the warriors came out to meet him.", 0.4),
    (21, 'He dismounted his men into a skirmish line. Outflanked, they fell back into the trees along the river.', "He dismounted his men into a skirmish line. Outflanked, they fell back into the trees along the river.", 0.4),
    (22, 'Beside Reno, his scout Bloody Knife was shot in the head. Reno ordered his men to mount, dismount, and mount again. Then he led a retreat that became a rout, back across the river and up the bluffs.', "Beside Reno, his scout Bloody Knife was shot in the head. Reno ordered his men to mount, dismount, and mount again. Then he led a retreat that became a rout, back across the river and up the bluffs.", 0.6),
    (23, 'That retreat is the heart of the case against him. Did Reno panic? Or did he save his men from being wiped out?', "That retreat is the heart of the case against him. Did Reno panic? Or did he save his men from being wiped out?", 0.7),
    (24, 'Exhibit E. As Custer neared the village, he finally saw how big it was. His adjutant scrawled a note, and trumpeter John Martin galloped off with it.', "Exhibit E. As Custer neared the village, he finally saw how big it was. His adjutant scrawled a note, and trumpeter John Martin galloped off with it.", 0.4),
    (25, 'Benteen. Come on. Big village. Be quick. Bring packs.', "\u201cBenteen. Come on. Big village. Be quick. Bring packs.\u201d", 0.5),
    (26, 'It was the last message anyone ever received from Custer. Benteen did come. But he joined Reno on the hill.', "It was the last message anyone ever received from Custer. Benteen did come. But he joined Reno on the hill.", 0.7),
    (27, 'Now, the witnesses this court never called. The Lakota, Cheyenne and Arapaho who were in that village.', "Now, the witnesses this court never called. The Lakota, Cheyenne and Arapaho who were in that village.", 0.4),
    (28, 'Weeks earlier, at a Sun Dance, the Lakota leader Sitting Bull had seen a vision: soldiers falling into their camp.', "Weeks earlier, at a Sun Dance, the Lakota leader Sitting Bull had seen a vision: soldiers falling into their camp.", 0.4),
    (29, 'On June twenty-fifth, war leaders like Gall and Crazy Horse led the defense. No confirmed photograph of Crazy Horse exists.', "On June 25, war leaders like Gall and Crazy Horse led the defense. No confirmed photograph of Crazy Horse exists.", 0.4),
    (30, "To them, this wasn't a last stand. It was the defense of their families.", "To them, this wasn't a last stand. It was the defense of their families.", 0.6),
    (31, "Lakota and Cheyenne accounts describe Custer's battalion breaking apart on the ridges, and a fight that was over fast.", "Lakota and Cheyenne accounts describe Custer's battalion breaking apart on the ridges, and a fight that was over fast.", 0.4),
    (32, 'Every one of the roughly two hundred and ten men with Custer was killed. In all, two hundred and sixty-eight men of his command died.', "Every one of the roughly 210 men with Custer was killed. In all, 268 men of his command died.", 0.8),
    (33, "On Reno's hill, officers heard firing to the north. Captain Thomas Weir rode toward it without orders. From a high point, they saw dust and smoke, and warriors turning toward them.", "On Reno's hill, officers heard firing to the north. Captain Thomas Weir rode toward it without orders. From a high point, they saw dust and smoke, and warriors turning toward them.", 0.4),
    (34, 'They fell back, dug in, and held on through another day, until relief arrived on June twenty-seventh.', "They fell back, dug in, and held on through another day, until relief arrived on June 27.", 0.8),
    (35, "The verdict. After twenty-six days of testimony, the court found that Reno's conduct did not deserve its censure.", "The verdict. After 26 days of testimony, the court found that Reno's conduct did not deserve its censure.", 0.4),
    (36, "The Army's top legal officer wrote that the accusation that Custer died because of Reno's cowardice was, quote, set to rest.", "The Army's top legal officer wrote that the accusation that Custer died because of Reno's cowardice was, quote, \u201cset to rest.\u201d", 0.7),
    (37, "It wasn't. Years later, enlisted men said they had been pressured to protect Reno. One officer admitted there was a private understanding to save him.", "It wasn't. Years later, enlisted men said they had been pressured to protect Reno. One officer admitted there was a private understanding to save him.", 0.5),
    (38, 'Soon after, Reno was court-martialed for unrelated misconduct, and thrown out of the army. He died in eighteen eighty-nine, still in disgrace.', "Soon after, Reno was court-martialed for unrelated misconduct and thrown out of the army. He died in 1889, still in disgrace.", 0.6),
    (39, 'Then, in nineteen sixty-seven, a military review board reversed his dismissal. Marcus Reno was reburied with honors, on the battlefield, in the cemetery named after Custer.', "Then, in 1967, a military review board reversed his dismissal. Marcus Reno was reburied with honors, on the battlefield, in the cemetery named after Custer.", 0.8),
    (40, 'So... who lost the Little Bighorn?', "So who lost the Little Bighorn?", 0.5),
    (41, "Custer, who split his command against an enemy he never counted? Reno, who retreated? Benteen, who didn't come quick? Or the men who sent soldiers into land promised by treaty?", "Custer, who split his command against an enemy he never counted? Reno, who retreated? Benteen, who didn't come quick? Or the men who sent soldiers into land promised by treaty?", 0.6),
    (42, 'Or maybe no one lost it at all. Maybe the Lakota and Cheyenne simply won. Within a year, the army returned in force, and the Black Hills were taken anyway.', "Or maybe no one lost it at all. Maybe the Lakota and Cheyenne simply won. Within a year, the army returned in force, and the Black Hills were taken anyway.", 0.7),
    (43, "You've heard the evidence. You are the jury. Who's guilty? Tell us in the comments, and subscribe to Buried Chronicles for more of history's hidden turning points.", "You've heard the evidence. You are the jury. Who's guilty? Tell us in the comments, and subscribe to Buried Chronicles for more of history's hidden turning points.", 0.3),
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
