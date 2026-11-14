"""Jumonville 1754 narration: Kokoro-82M ONNX, deep American male (am_michael/am_onyx blend).

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
SPEED = 1.0
PAUSE_SCALE = 1.0
LEAD = 1.0  # silence before the first word

# (scene, spoken text (what the TTS reads), caption text (exact script wording), pause after in s)
PHRASES = [
    (1, 'May twenty-eighth, seventeen fifty-four. Dawn, in a rocky glen in the forests of western Pennsylvania.', 'May 28, 1754. Dawn, in a rocky glen in the forests of western Pennsylvania.', 0.55),
    (2, 'Forty Virginian soldiers and a dozen Native warriors creep into position around a French camp.', 'Forty Virginian soldiers and a dozen Native warriors creep into position around a French camp.', 0.55),
    (3, 'Their commander is twenty-two years old. His name... is George Washington.', 'Their commander is 22 years old. His name is George Washington.', 0.7),
    (4, 'The fight that follows lasts about fifteen minutes.', 'The fight that follows lasts about fifteen minutes.', 0.55),
    (5, 'But it lights the fuse of a war that will spread across five continents, redraw the map of the world, and, twenty years later, help give birth to the United States.', 'But it lights the fuse of a war that will spread across five continents, redraw the map of the world, and, twenty years later, help give birth to the United States.', 0.6),
    (6, 'This is the story of the ambush at Jumonville Glen.', 'This is the story of the ambush at Jumonville Glen.', 1.6),
    (7, 'In the seventeen-fifties, North America was split between two rival empires.', 'In the 1750s, North America was split between two rival empires.', 0.55),
    (8, "Britain's thirteen colonies hugged the Atlantic coast: crowded, growing, and hungry for land.", "Britain's thirteen colonies hugged the Atlantic coast: crowded, growing, and hungry for land.", 0.55),
    (9, 'France held a vast arc of territory, from Quebec, along the Great Lakes, down to New Orleans, linked by rivers and a thin chain of forts.', 'France held a vast arc of territory, from Quebec, along the Great Lakes, down to New Orleans, linked by rivers and a thin chain of forts.', 0.55),
    (10, 'Between them lay the Ohio Country: a rich wilderness of forests and rivers, home to the Shawnee, the Delaware, the Mingo and other nations, who traded with both sides, and trusted neither.', 'Between them lay the Ohio Country: a rich wilderness of forests and rivers, home to the Shawnee, the Delaware, the Mingo and other nations, who traded with both sides and trusted neither.', 0.55),
    (11, 'The powerful Iroquois Confederacy, the Six Nations, claimed authority over the region, and sent leaders like Tanacharison to speak for them.', 'The powerful Iroquois Confederacy, the Six Nations, claimed authority over the region, and sent leaders like Tanacharison to speak for them.', 0.55),
    (12, 'Whoever controlled its rivers controlled the heart of the continent.', 'Whoever controlled its rivers controlled the heart of the continent.', 0.55),
    (13, 'And the key to those rivers was a single point of land: the Forks of the Ohio, where the Allegheny and the Monongahela meet. Today, it is the city of Pittsburgh.', 'And the key to those rivers was a single point of land: the Forks of the Ohio, where the Allegheny and the Monongahela meet. Today, it is the city of Pittsburgh.', 1.4),
    (14, 'In seventeen fifty-three, the French began building forts south from Lake Erie, pushing into land that Virginia claimed.', 'In 1753, the French began building forts south from Lake Erie, pushing into land that Virginia claimed.', 0.55),
    (15, "Virginia's governor, Robert Dinwiddie, needed someone to carry a warning to the French commander: leave, or be removed.", "Virginia's governor, Robert Dinwiddie, needed someone to carry a warning to the French commander: leave, or be removed.", 0.55),
    (16, 'He chose a twenty-one-year-old surveyor and militia major, with no combat experience. George Washington.', 'He chose a 21-year-old surveyor and militia major with no combat experience: George Washington.', 0.55),
    (17, 'That winter, Washington traveled hundreds of miles through snow and forest to Fort Le Boeuf, near Lake Erie, and handed over the letter.', 'That winter, Washington traveled hundreds of miles through snow and forest to Fort Le Boeuf, near Lake Erie, and handed over the letter.', 0.55),
    (18, "His journal of the trip was printed in Williamsburg and in London. Almost overnight, the young major's name was known on both sides of the Atlantic.", "His journal of the trip was printed in Williamsburg and in London. Almost overnight, the young major's name was known on both sides of the Atlantic.", 0.55),
    (19, 'The French reply was polite, and absolutely clear. As to the summons you send me to retire, I do not think myself obliged to obey it.', 'The French reply was polite and absolutely clear: "As to the summons you send me to retire, I do not think myself obliged to obey it."', 1.4),
    (20, 'Dinwiddie made Washington a lieutenant colonel, and ordered a fort built at the Forks of the Ohio.', 'Dinwiddie made Washington a lieutenant colonel and ordered a fort built at the Forks of the Ohio.', 0.55),
    (21, 'In February seventeen fifty-four, a small Virginian party began the work. Two months later, about five hundred French soldiers, militia and Native allies came down the Allegheny River.', 'In February 1754, a small Virginian party began the work. Two months later, about five hundred French soldiers, militia and Native allies came down the Allegheny River.', 0.55),
    (22, 'The thirty-six Virginians had no choice. They handed over the site, and the French began building their own stronghold: Fort Duquesne.', 'The thirty-six Virginians had no choice. They handed over the site, and the French began building their own stronghold: Fort Duquesne.', 0.55),
    (23, 'Their commander, Captain Contrecoeur, was under orders not to attack unless provoked. Instead, he sent a small party to find the Virginians, and deliver a formal summons to leave.', 'Their commander, Captain Contrecœur, was under orders not to attack unless provoked. Instead, he sent a small party to find the Virginians and deliver a formal summons to leave.', 0.55),
    (24, 'By then, Washington was already marching west with fewer than a hundred and sixty men, under orders that one historian later called, an invitation to start a war.', 'By then, Washington was already marching west with fewer than 160 men, under orders that one historian later called "an invitation to start a war."', 0.55),
    (25, 'He camped at a clearing called the Great Meadows. And there, he received a message.', 'He camped at a clearing called the Great Meadows. And there, he received a message.', 1.4),
    (26, 'On May twenty-seventh, the frontiersman Christopher Gist rode in with news: a French party was moving through the area.', 'On May 27, the frontiersman Christopher Gist rode in with news: a French party was moving through the area.', 0.55),
    (27, 'It came from Tanacharison, a Mingo leader the British called the Half King. He had found a French camp, hidden in a ravine a few miles away.', 'It came from Tanacharison, a Mingo leader the British called the Half King. He had found a French camp, hidden in a ravine a few miles away.', 0.55),
    (28, 'Its commander was Ensign Joseph Coulon de Villiers de Jumonville, with about thirty-five men. He carried a written summons ordering the Virginians to leave, the same kind of message Washington had delivered months earlier.', 'Its commander was Ensign Joseph Coulon de Villiers de Jumonville, with about thirty-five men. He carried a written summons ordering the Virginians to leave, the same kind of message Washington had delivered months earlier.', 0.55),
    (29, "Through a night of pouring rain, Washington and forty men followed Tanacharison's warriors through the dark forest.", "Through a night of pouring rain, Washington and forty men followed Tanacharison's warriors through the dark forest.", 0.55),
    (30, 'At dawn on May twenty-eighth, they took positions behind the rocks above the French camp.', 'At dawn on May 28, they took positions behind the rocks above the French camp.', 0.55),
    (31, 'Someone saw them. A shot rang out. Washington gave the order to fire.', 'Someone saw them. A shot rang out. Washington gave the order to fire.', 0.55),
    (32, "The Virginians fired from the rocks. Some of the French grabbed their muskets. Others ran for the woods, straight into Tanacharison's warriors, and turned back to surrender.", "The Virginians fired from the rocks. Some of the French grabbed their muskets. Others ran for the woods, straight into Tanacharison's warriors, and turned back to surrender.", 0.55),
    (33, 'In about fifteen minutes, it was over. Jumonville and nine of his men were dead. Twenty-one were taken prisoner. Washington lost one man.', 'In about fifteen minutes, it was over. Jumonville and nine of his men were dead. Twenty-one were taken prisoner. Washington lost one man.', 0.55),
    (34, 'Afterward, he wrote to his brother: I heard the bullets whistle, and believe me, there was something charming in the sound.', 'Afterward, he wrote to his brother: "I heard the bullets whistle, and believe me, there was something charming in the sound."', 1.4),
    (35, 'But how Jumonville died became one of the most disputed moments in early American history.', 'But how Jumonville died became one of the most disputed moments in early American history.', 0.55),
    (36, 'French reports said he was shot in the head while his summons was being read aloud.', 'French reports said he was shot in the head while his summons was being read aloud.', 0.55),
    (37, 'Other accounts said Tanacharison himself stepped up to the wounded officer, and killed him with a hatchet.', 'Other accounts said Tanacharison himself stepped up to the wounded officer and killed him with a hatchet.', 0.55),
    (38, "Washington's own accounts are brief. One historian believes they were written to hide what happened after the shooting stopped.", "Washington's own accounts are brief. One historian believes they were written to hide what happened after the shooting stopped.", 0.55),
    (39, 'To the French, Jumonville was a diplomat, murdered on a peaceful mission. To the Virginians, he was a spy, whose men had been shadowing their camp.', 'To the French, Jumonville was a diplomat, murdered on a peaceful mission. To the Virginians, he was a spy, whose men had been shadowing their camp.', 0.55),
    (40, 'The truth may never be known. But the consequences arrived quickly.', 'The truth may never be known. But the consequences arrived quickly.', 1.4),
    (41, 'Washington knew the French would come. At the Great Meadows, his men threw up a small, round stockade. He called it Fort Necessity.', 'Washington knew the French would come. At the Great Meadows, his men threw up a small, round stockade. He called it Fort Necessity.', 0.55),
    (42, 'It was a poor position: a low, wet meadow, with wooded high ground inside musket range. A company of British regulars from South Carolina joined him, bringing his force to about four hundred.', 'It was a poor position: a low, wet meadow, with wooded high ground inside musket range. A company of British regulars from South Carolina joined him, bringing his force to about four hundred.', 0.55),
    (43, "On July third, about six hundred French and Canadian soldiers and a hundred Native warriors arrived. Their commander was Louis Coulon de Villiers: Jumonville's older brother.", "On July 3, about six hundred French and Canadian soldiers and a hundred Native warriors arrived. Their commander was Louis Coulon de Villiers: Jumonville's older brother.", 0.55),
    (44, "Heavy rain flooded the trenches and soaked the gunpowder. By nightfall, about one in four of Washington's men had been killed or wounded.", "Heavy rain flooded the trenches and soaked the gunpowder. By nightfall, about one in four of Washington's men had been killed or wounded.", 0.55),
    (45, 'Washington surrendered. It was the only time in his military career he ever would.', 'Washington surrendered. It was the only time in his military career he ever would.', 0.55),
    (46, 'The terms were written in French, a language he could not read. His Dutch translator, Jacob Van Braam, read them out in the pouring rain.', 'The terms were written in French, a language he could not read. His Dutch translator, Jacob Van Braam, read them out in the pouring rain.', 0.55),
    (47, 'Buried in the text was one word: the French for assassination. Washington had signed a document admitting that Jumonville had been assassinated.', 'Buried in the text was one word: the French for "assassination." Washington had signed a document admitting that Jumonville had been assassinated.', 0.55),
    (48, 'The next morning, his men marched out, carrying their wounded. The date was July fourth, seventeen fifty-four: exactly twenty-two years before the Declaration of Independence.', 'The next morning, his men marched out, carrying their wounded. The date was July 4, 1754: exactly twenty-two years before the Declaration of Independence.', 0.55),
    (49, 'The French printed it across Europe, as proof of British treachery.', 'The French printed it across Europe as proof of British treachery.', 1.4),
    (50, 'A year later, Britain sent two regiments under General Edward Braddock to take Fort Duquesne. Washington rode with him. It ended in one of the worst British defeats of the century.', 'A year later, Britain sent two regiments under General Edward Braddock to take Fort Duquesne. Washington rode with him. It ended in one of the worst British defeats of the century.', 0.55),
    (51, "In seventeen fifty-six, the fighting spread to Europe, and became the Seven Years' War. Britain and Prussia against France, Austria and Russia, with battles in Europe, North America, the Caribbean, India, West Africa, and the Philippines.", "In 1756, the fighting spread to Europe and became the Seven Years' War: Britain and Prussia against France, Austria and Russia, with battles in Europe, North America, the Caribbean, India, West Africa and the Philippines.", 0.55),
    (52, 'As the British writer Horace Walpole later put it: The volley fired by a young Virginian in the backwoods of America set the world on fire.', 'As the British writer Horace Walpole later put it: "The volley fired by a young Virginian in the backwoods of America set the world on fire."', 0.55),
    (53, 'When it ended in seventeen sixty-three, France had lost Canada, and almost all of its empire in North America.', 'When it ended in 1763, France had lost Canada and almost all of its empire in North America.', 0.55),
    (54, "For the Native nations of the Ohio Country, the British victory brought settlers and broken promises. Within months, many of them rose against the British in Pontiac's War.", "For the Native nations of the Ohio Country, the British victory brought settlers and broken promises. Within months, many of them rose against the British in Pontiac's War.", 0.55),
    (55, 'But victory left Britain deep in debt. To pay for it, Parliament began taxing its American colonies. The Sugar Act. The Stamp Act.', 'But victory left Britain deep in debt. To pay for it, Parliament began taxing its American colonies: the Sugar Act, the Stamp Act.', 0.55),
    (56, "The colonists' anger grew into a revolution. And in seventeen seventy-five, the man chosen to command the Continental Army against the British Empire was the same Virginian who had fired the first shots for it. George Washington.", "The colonists' anger grew into a revolution. And in 1775, the man chosen to command the Continental Army against the British Empire was the same Virginian who had fired the first shots for it: George Washington.", 1.4),
    (57, "A fifteen-minute ambush in a rainy glen. A dead French officer. A signature, on a document he couldn't read.", "A fifteen-minute ambush in a rainy glen. A dead French officer. A signature on a document he couldn't read.", 0.55),
    (58, 'From that small moment came a world war, the end of French America, and the road to American independence.', 'From that small moment came a world war, the end of French America, and the road to American independence.', 0.9),
    (59, 'Next time: what happened when Washington marched back into the Ohio Country with General Braddock, and walked out of the disaster with four bullet holes in his coat.', 'Next time: what happened when Washington marched back into the Ohio Country with General Braddock, and walked out of the disaster with four bullet holes in his coat.', 0.55),
]
TAIL = 4.0  # title card after the last word


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
    npz = KDIR / "voices_jumonville.npz"
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
