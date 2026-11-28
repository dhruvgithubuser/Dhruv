import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { Particles } from './kit';
import { Shake } from './vfx';
import { C, H, HEAD, SANS, SCENES, SERIF, TYPE, W, ease, hash01, lin, pf, wf } from './theme';

/*
 * "Teddy Roosevelt Was Shot, Then Spoke for 50 Minutes" (Milwaukee, 14 October 1912) - cinematic documentary Short.
 * t* shots are dramatized reconstructions (labelled on screen); real photos (Roosevelt in Milwaukee that day, the
 * bullet-pierced speech, his glasses case, his shirt, the X-ray) are shown as framed prints.
 */

// length (s) of each parallax clip, as rendered by scripts/parallax.py
const CLIP_S: Record<string, number> = {
  t01_hero: 9, t02_street: 9, t03_shot: 6, t04_cough: 7, t05_stage: 8, t06_speech: 9, t07_hospital: 8,
};
const GRADE = 'saturate(0.55) sepia(0.28) contrast(1.1) brightness(0.95)';

/** One moving shot, from scene-local frame `from` to `to`; stretched to fit, with a short dissolve in. */
const Shot: React.FC<{ name: string; from: number; to: number; fadeIn?: number }> = ({ name, from, to, fadeIn = 8 }) => {
  const dur = Math.max(1, to - from);
  const rate = Math.min(1.6, Math.max(0.45, ((CLIP_S[name] ?? 5) * 30) / dur));
  return (
    <Sequence from={from} durationInFrames={dur} layout="none">
      <ShotInner name={name} rate={rate} fadeIn={fadeIn} />
    </Sequence>
  );
};
const ShotInner: React.FC<{ name: string; rate: number; fadeIn: number }> = ({ name, rate, fadeIn }) => {
  const f = useCurrentFrame();
  const arch = name.startsWith('a');
  return (
    <AbsoluteFill style={{ opacity: fadeIn ? lin(f, 0, fadeIn) : 1 }}>
      <OffthreadVideo src={staticFile(`assets/clips/${name}.mp4`)} playbackRate={rate} muted style={{ width: W, height: H, objectFit: 'cover', filter: arch ? 'contrast(1.08)' : GRADE }} />
      <Label text={arch ? 'PERIOD IMAGE' : 'DRAMATIZED RECONSTRUCTION'} />
    </AbsoluteFill>
  );
};
const Label: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: 'absolute', left: 40, bottom: 330, fontFamily: TYPE, fontWeight: 700, fontSize: 20, letterSpacing: 3, color: 'rgba(246,236,212,0.55)' }}>{text}</div>
);

/** Location / date slate, typed on, top-left. */
const Slate: React.FC<{ at: number; place: string; date: string; out?: number }> = ({ at, place, date, out }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 6) * (out ? 1 - lin(f, out - 8, out) : 1);
  if (o <= 0) return null;
  const n = Math.floor(lin(f, at, at + 18) * place.length);
  return (
    <div style={{ position: 'absolute', left: 56, top: 190, opacity: o }}>
      <div style={{ width: 70, height: 6, background: C.redHi, marginBottom: 14, transform: `scaleX(${lin(f, at, at + 10)})`, transformOrigin: 'left' }} />
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 64, letterSpacing: 2, color: '#f6ecd4', textShadow: '0 4px 16px rgba(0,0,0,0.9)' }}>{place.slice(0, n)}</div>
      <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 34, letterSpacing: 4, color: C.gold, textShadow: '0 3px 10px #000', opacity: lin(f, at + 14, at + 22) }}>{date}</div>
    </div>
  );
};

/** Bright muzzle flashes / distant gunfire twinkles at fixed points. */
const Flashes: React.FC<{ pts: [number, number][]; seed?: number; every?: number }> = ({ pts, seed = 3, every = 23 }) => {
  const f = useCurrentFrame();
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen' }}>
      {pts.map(([x, y], i) => {
        const ph = (f + Math.floor(hash01(i, seed) * every)) % every;
        const o = ph < 3 ? 1 - ph / 3 : 0;
        return <circle key={i} cx={x} cy={y} r={26 + 20 * hash01(i, seed + 1)} fill="url(#muzzle)" opacity={o} />;
      })}
      <defs><radialGradient id="muzzle"><stop offset="0" stopColor="#fff7d6" /><stop offset="0.4" stopColor="#ffc35a" /><stop offset="1" stopColor="#ff7a1a" stopOpacity="0" /></radialGradient></defs>
    </svg>
  );
};

/** Drifting smoke / dust haze. */
const Haze: React.FC<{ color?: string; o?: number; y?: number }> = ({ color = '200,190,170', o = 0.35, y = 1100 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity: o }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: 'absolute', left: -400 + ((f * (0.8 + i * 0.4) + i * 500) % 1900), top: y - 300 + i * 220, width: 1100, height: 520, borderRadius: '50%', background: `radial-gradient(ellipse, rgba(${color},0.55), rgba(${color},0) 70%)`, filter: 'blur(20px)' }} />
      ))}
    </AbsoluteFill>
  );
};

/** Full-frame flash (shell burst). */
const Flash: React.FC<{ at: number; color?: string }> = ({ at, color = '255,214,150' }) => {
  const f = useCurrentFrame(); const t = f - at;
  if (t < 0 || t > 16) return null;
  return <AbsoluteFill style={{ background: `rgba(${color},${0.75 * (1 - t / 16)})`, mixBlendMode: 'screen' }} />;
};

const Dim: React.FC<{ top?: number; bottom?: number }> = ({ top = 0.55, bottom = 0.65 }) => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(0,0,0,${top}) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 55%, rgba(0,0,0,${bottom}) 100%)` }} />
);

const end = (n: number) => SCENES[n - 1].frames + 12;

/** Rubber stamp verdict (LEGEND / DISPUTED / TRUE). */
const Verdict: React.FC<{ at: number; text: string; color?: string; x?: number; y?: number; rot?: number; out?: number }> = ({ at, text, color = C.redHi, x = 540, y = 330, rot = -8, out }) => {
  const f = useCurrentFrame();
  if (f < at || (out !== undefined && f >= out)) return null;
  const k = ease(f, at, at + 7);
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${1.6 - 0.6 * k})`, opacity: Math.min(1, k * 1.6), border: `9px solid ${color}`, padding: '6px 34px', fontFamily: HEAD, fontWeight: 700, fontSize: 92, letterSpacing: 6, color, background: 'rgba(14,10,6,0.55)', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', whiteSpace: 'nowrap' }}>{text}</div>
  );
};

/** Kit list chips that slide in on spoken words, right side. */
const Chips: React.FC<{ items: { at: number; t: string }[]; top?: number; out?: number }> = ({ items, top = 190, out }) => {
  const f = useCurrentFrame();
  if (out !== undefined && f >= out) return null;
  return (
    <div style={{ position: 'absolute', right: 50, top, opacity: out !== undefined ? 1 - lin(f, out - 6, out) : 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14 }}>
      {items.map((x, i) => f < x.at ? null : (
        <div key={i} style={{ background: 'rgba(14,10,6,0.82)', border: `3px solid ${C.gold}`, padding: '6px 18px', fontFamily: HEAD, fontWeight: 700, fontSize: 44, color: '#f6ecd4', letterSpacing: 2, transform: `translateX(${40 * (1 - lin(f, x.at, x.at + 6))}px)`, opacity: lin(f, x.at, x.at + 6) }}>{x.t}</div>
      ))}
    </div>
  );
};

/** Big number that counts up. */
const Count: React.FC<{ at: number; to: number; label: string; dur?: number; suffix?: string }> = ({ at, to, label, dur = 40, suffix = '' }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const v = Math.round(to * ease(f, at, at + dur));
  return (
    <div style={{ position: 'absolute', right: 50, top: 190, textAlign: 'right', opacity: lin(f, at, at + 6) }}>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 170, lineHeight: 1, color: '#fff', textShadow: '0 8px 24px #000' }}>{v.toLocaleString('en-US')}{suffix}</div>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 50, color: C.gold, letterSpacing: 4, textShadow: '0 4px 12px #000' }}>{label}</div>
    </div>
  );
};

/** A small typed document card (newspaper / warrant). */
const Doc: React.FC<{ at: number; title: string; lines: string[]; stamp?: { at: number; t: string }; y?: number }> = ({ at, title, lines, stamp, y = 230 }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const k = ease(f, at, at + 10);
  return (
    <div style={{ position: 'absolute', left: 90, right: 90, top: y, transform: `translateY(${40 * (1 - k)}px) rotate(-2deg)`, opacity: k, background: '#efe4c8', padding: '26px 34px', boxShadow: '0 18px 40px rgba(0,0,0,0.7)' }}>
      <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 46, color: '#2a2117', borderBottom: '3px double #2a2117', paddingBottom: 8 }}>{title}</div>
      {lines.map((l, i) => <div key={i} style={{ fontFamily: TYPE, fontSize: 28, color: '#3a2c1c', marginTop: 10, lineHeight: 1.35, opacity: lin(f, at + 8 + i * 6, at + 14 + i * 6) }}>{l}</div>)}
      {stamp && f >= stamp.at && <div style={{ position: 'absolute', right: 26, bottom: 18, transform: `rotate(-10deg) scale(${1.5 - 0.5 * ease(f, stamp.at, stamp.at + 7)})`, border: `7px solid ${C.redHi}`, color: C.redHi, fontFamily: HEAD, fontWeight: 700, fontSize: 56, padding: '0 18px', letterSpacing: 4 }}>{stamp.t}</div>}
    </div>
  );
};

/* ───────────── scenes ───────────── */

/** A real archival photograph as a framed print. */
const Print: React.FC<{ src: string; at: number; out?: number; y?: number; w?: number; h?: number; rot?: number; label: string; pos?: string }> = ({ src, at, out, y = 520, w = 560, h = 660, rot = -3, label, pos = '50% 30%' }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  if (f < at || (out !== undefined && f >= out)) return null;
  const k = spring({ frame: f - at, fps, config: { damping: 14, stiffness: 160 } });
  const o = Math.min(1, k * 1.5) * (out !== undefined ? 1 - lin(f, out - 6, out) : 1);
  return (
    <div style={{ position: 'absolute', left: (W - w) / 2, top: y, width: w, opacity: o, transform: `rotate(${rot + (1 - k) * 8}deg) scale(${1.15 - 0.15 * k})`, background: '#f4eedf', padding: 16, paddingBottom: 70, boxShadow: '0 30px 60px rgba(0,0,0,0.8)' }}>
      <div style={{ width: w - 32, height: h, overflow: 'hidden', background: '#111' }}>
        <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, filter: 'grayscale(1) sepia(0.2) contrast(1.08)', transform: `scale(${1 + 0.05 * lin(f, at, at + 150)})` }} />
      </div>
      <div style={{ position: 'absolute', left: 22, right: 18, bottom: 20, fontFamily: TYPE, fontWeight: 700, fontSize: 28, color: C.ink, textAlign: 'center' }}>{label}</div>
      <div style={{ position: 'absolute', right: -14, top: -18, background: C.red, color: '#fff', fontFamily: HEAD, fontWeight: 700, fontSize: 30, padding: '4px 16px', letterSpacing: 2, transform: 'rotate(6deg)' }}>REAL PHOTO</div>
    </div>
  );
};

/** The hook as a headline, fully visible on frame 0 (matches the YouTube title). */
const HookTitle: React.FC<{ out: number }> = ({ out }) => {
  const f = useCurrentFrame();
  if (f >= out) return null;
  const o = 1 - lin(f, out - 8, out);
  return (
    <div style={{ position: 'absolute', left: 40, right: 40, top: 170, opacity: o, textAlign: 'center' }}>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 84, lineHeight: 1.02, color: '#fff', textShadow: '0 6px 0 #000, 0 10px 30px rgba(0,0,0,0.9)', whiteSpace: 'nowrap' }}>TEDDY ROOSEVELT WAS SHOT</div>
      <div style={{ display: 'inline-block', marginTop: 14, background: 'rgba(60,8,8,0.88)', border: `5px solid ${C.redHi}`, padding: '4px 24px', fontFamily: HEAD, fontWeight: 700, fontSize: 80, color: '#fff', whiteSpace: 'nowrap' }}>THEN SPOKE FOR 50 MINUTES</div>
      <div style={{ marginTop: 16, fontFamily: TYPE, fontWeight: 700, fontSize: 32, letterSpacing: 4, color: C.gold, textShadow: '0 3px 10px #000' }}>MILWAUKEE · 14 OCTOBER 1912</div>
    </div>
  );
};

/** A spoken quotation as a card. */
const QuoteCard: React.FC<{ at: number; lines: string[]; who: string }> = ({ at, lines, who }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const k = ease(f, at, at + 10);
  return (
    <div style={{ position: 'absolute', left: 70, right: 70, top: 330, opacity: k, transform: `translateY(${30 * (1 - k)}px)`, background: 'rgba(12,9,6,0.86)', borderLeft: `10px solid ${C.gold}`, padding: '30px 36px', boxShadow: '0 20px 50px rgba(0,0,0,0.7)' }}>
      {lines.map((l, i) => <div key={i} style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 52, lineHeight: 1.2, color: i === lines.length - 1 ? C.gold : '#f6ecd4', marginTop: i ? 14 : 0, opacity: lin(f, at + i * 40, at + i * 40 + 10) }}>{l}</div>)}
      <div style={{ marginTop: 22, fontFamily: TYPE, fontWeight: 700, fontSize: 26, letterSpacing: 3, color: 'rgba(246,236,212,0.7)' }}>{who}</div>
    </div>
  );
};

const Blur: React.FC<{ src: string }> = ({ src }) => (
  <Img src={staticFile(src)} style={{ position: 'absolute', inset: -60, width: W + 120, height: H + 120, objectFit: 'cover', filter: 'blur(26px) brightness(0.35) grayscale(1)' }} />
);

// S01 hook: Roosevelt at the podium, hand on his chest; the headline from frame 0.
const S01: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="t01_hero" from={0} to={end(1)} fadeIn={0} />
    <Dim />
    <HookTitle out={wf(1, 'so')} />
    <Verdict at={wf(1, 'so')} text="WHY NOT DEAD?" y={1080} rot={-6} />
  </AbsoluteFill>
);

// S02 Milwaukee, the campaign; the real photo from that day.
const S02: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="t02_street" from={0} to={end(2)} />
    <Dim />
    <Slate at={4} place="MILWAUKEE" date="14 OCTOBER 1912" out={wf(2, 'former')} />
    <Print src="assets/archival/car.png" at={wf(2, 'former')} y={480} w={600} h={680} rot={-3} label="ROOSEVELT IN MILWAUKEE THAT DAY" pos="40% 30%" />
    <Chips top={190} items={[{ at: wf(2, 'former'), t: 'FORMER PRESIDENT' }, { at: wf(2, 'campaigning'), t: 'RUNNING AGAIN · 1912' }]} />
  </AbsoluteFill>
);

// S03 the shot outside the hotel.
const S03: React.FC = () => {
  const fi = wf(3, 'fires');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shake hits={[fi, fi + 10]} amp={20}>
        <Shot name="t03_shot" from={0} to={end(3)} />
      </Shake>
      <Flash at={fi} />
      <Dim />
      <Chips top={190} items={[{ at: wf(3, 'john'), t: 'SHOOTER: JOHN SCHRANK' }]} />
      <Verdict at={wf(3, 'shot')} text="ONE SHOT" y={1080} rot={-6} />
    </AbsoluteFill>
  );
};

// S04 what the bullet hit first: the glasses case, the 50-page speech.
const S04: React.FC = () => {
  const sp = wf(4, 'speech');
  return (
    <AbsoluteFill style={{ background: '#0b0805' }}>
      <Blur src="assets/archival/speech.jpg" />
      <Print src="assets/archival/glasses.jpg" at={wf(4, 'steel') - 4} out={sp} y={560} w={900} h={460} rot={-2} label="HIS STEEL GLASSES CASE · BULLET HOLE" pos="50% 50%" />
      <Print src="assets/archival/speech.jpg" at={sp} y={440} w={640} h={760} rot={2} label="THE BULLET-PIERCED SPEECH" pos="50% 40%" />
      <Count at={wf(4, '50')} to={50} label="PAGES THICK" dur={20} />
    </AbsoluteFill>
  );
};

// S05 he coughs: no blood.
const S05: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="t04_cough" from={0} to={end(5)} />
    <Dim />
    <Verdict at={wf(5, 'blood')} text="NO BLOOD" color={C.gold} y={1080} rot={-6} />
  </AbsoluteFill>
);

// S06 on stage: "it takes more than that to kill a Bull Moose".
const S06: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="t05_stage" from={0} to={end(6)} />
    <Dim top={0.6} bottom={0.7} />
    <QuoteCard at={wf(6, 'i') - 4} lines={['"I don’t know whether you fully understand that I have just been shot.', 'But it takes more than that to kill a Bull Moose."']} who="THEODORE ROOSEVELT · 14 OCT 1912" />
  </AbsoluteFill>
);

// S07 fifty minutes, blood seeping into the shirt.
const S07: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="t06_speech" from={0} to={end(7)} />
    <Dim />
    <Chips top={190} items={[{ at: wf(7, 'speaks'), t: 'SPOKE FOR 50 MINUTES' }]} />
    <Print src="assets/archival/shirt.jpg" at={wf(7, 'blood')} y={440} w={560} h={700} rot={-3} label="HIS SHIRT · 1912" pos="50% 30%" />
  </AbsoluteFill>
);

// S08 the X-ray; the bullet stayed; the question.
const S08: React.FC = () => {
  const f = useCurrentFrame();
  const q = wf(8, 'would'); const b = wf(8, 'below');
  const card = (at: number, l: string, t: string, x: number, col: string) => f < at ? null : (
    <div style={{ position: 'absolute', left: x, top: 1000, width: 440, transform: `scale(${0.8 + 0.2 * ease(f, at, at + 8)})`, opacity: lin(f, at, at + 6), background: 'rgba(14,10,6,0.88)', border: `4px solid ${col}`, padding: '18px 22px', textAlign: 'center' }}>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 40, color: col }}>{l}</div>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 52, color: '#fff' }}>{t}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="t07_hospital" from={0} to={end(8) + 40} />
      <Dim top={0.6} bottom={0.75} />
      <Print src="assets/archival/xray.jpg" at={4} out={q} y={430} w={900} h={660} rot={-2} label="X-RAY: THE BULLET IN HIS CHEST" pos="50% 50%" />
      <Verdict at={wf(8, 'carried')} out={q} text="NEVER REMOVED" y={330} rot={-6} />
      {f >= q && <div style={{ position: 'absolute', left: 40, right: 40, top: 300, textAlign: 'center', opacity: lin(f, q, q + 8), fontFamily: HEAD, fontWeight: 700, fontSize: 70, color: '#fff', textShadow: '0 8px 24px #000' }}>WOULD YOU HAVE WALKED ON STAGE?</div>}
      {card(q, 'A', 'WALK ON STAGE', 70, C.redHi)}
      {card(q + 10, 'B', 'GO TO HOSPITAL', 570, '#6fbf73')}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1600, textAlign: 'center', opacity: lin(f, b + 10, b + 20) }}>
        <span style={{ background: C.red, color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 40, padding: '12px 30px', letterSpacing: 2 }}>FOLLOW · BURIED CHRONICLES</span>
      </div>
    </AbsoluteFill>
  );
};

export const SCENE_COMPS = [S01, S02, S03, S04, S05, S06, S07, S08];
