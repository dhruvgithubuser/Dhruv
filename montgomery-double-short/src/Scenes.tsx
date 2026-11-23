import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { Particles } from './kit';
import { Shake } from './vfx';
import { C, H, HEAD, SANS, SCENES, SERIF, TYPE, W, ease, hash01, lin, pf, wf } from './theme';

/*
 * "Montgomery's Body Double" (Operation Copperhead, May 1944) - cinematic documentary Short.
 * Every shot is a still turned into a moving camera shot (depth parallax, scripts/parallax.py):
 * g* are dramatized reconstructions (labelled on screen); the real 1944 photo of Clifton James is shown as a framed print.
 */

// length (s) of each parallax clip, as rendered by scripts/parallax.py
const CLIP_S: Record<string, number> = {
  g01_land: 7, g02_map: 6, g03_clerk: 6, g04_drink: 8, g05_study: 6, g06_plane: 8, g07_breakfast: 5, g01_spy: 4, g07_phone: 4,
  g08_algiers: 5, g08_cairo: 4, g09_generals: 9, g10_desk: 5,
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
const Count: React.FC<{ at: number; to: number; label: string; dur?: number }> = ({ at, to, label, dur = 40 }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const v = Math.round(to * ease(f, at, at + dur));
  return (
    <div style={{ position: 'absolute', right: 50, top: 190, textAlign: 'right', opacity: lin(f, at, at + 6) }}>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 170, lineHeight: 1, color: '#fff', textShadow: '0 8px 24px #000' }}>{v}</div>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 50, color: C.gold, letterSpacing: 4, textShadow: '0 4px 12px #000' }}>{label}</div>
    </div>
  );
};

/* ───────────── scenes ───────────── */

/** The real 1944 photograph of Clifton James dressed as Montgomery, as a framed print. */
const RealPhoto: React.FC<{ at: number; out?: number; y?: number; rot?: number; label?: string }> = ({ at, out, y = 560, rot = -3, label = 'LT. CLIFTON JAMES · 1944' }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  if (f < at || (out !== undefined && f >= out)) return null;
  const k = spring({ frame: f - at, fps, config: { damping: 14, stiffness: 160 } });
  const o = Math.min(1, k * 1.5) * (out !== undefined ? 1 - lin(f, out - 6, out) : 1);
  const w = 560, h = 738;
  return (
    <div style={{ position: 'absolute', left: (W - w) / 2, top: y, width: w, opacity: o, transform: `rotate(${rot + (1 - k) * 8}deg) scale(${1.15 - 0.15 * k})`, background: '#f4eedf', padding: 16, paddingBottom: 70, boxShadow: '0 30px 60px rgba(0,0,0,0.8)' }}>
      <div style={{ width: w - 32, height: h - 86, overflow: 'hidden', background: '#111' }}>
        <Img src={staticFile('assets/archival/james.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 30%', filter: 'grayscale(1) sepia(0.2) contrast(1.08)', transform: `scale(${1 + 0.05 * lin(f, at, at + 150)})` }} />
      </div>
      <div style={{ position: 'absolute', left: 22, right: 18, bottom: 20, fontFamily: TYPE, fontWeight: 700, fontSize: 28, color: C.ink, textAlign: 'center' }}>{label}</div>
      <div style={{ position: 'absolute', right: -14, top: -18, background: C.red, color: '#fff', fontFamily: HEAD, fontWeight: 700, fontSize: 30, padding: '4px 16px', letterSpacing: 2, transform: 'rotate(6deg)' }}>REAL PHOTO</div>
    </div>
  );
};

// S01 hook: "Montgomery" lands... it's a pay clerk.
const S01: React.FC = () => {
  const pc = wf(1, 'pay');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="g01_land" from={0} to={end(1)} fadeIn={0} />
      <Particles kind="ash" n={24} o={0.3} />
      <Dim />
      <Slate at={4} place="GENERAL MONTGOMERY?" date="MAY 1944 · DAYS BEFORE D-DAY" out={pc} />
      <Verdict at={pc} text="A PAY CLERK" y={330} rot={-6} />
      <RealPhoto at={pc + 8} y={640} />
    </AbsoluteFill>
  );
};

// S02 the decoy plan.
const S02: React.FC = () => {
  const f = useCurrentFrame();
  const a = wf(2, 'mediterranean'); const n = wf(2, 'normandy'); const fc = wf(2, 'face');
  const tag = (at: number, t: string, col: string, y: number, strike?: number) => f < at ? null : (
    <div style={{ position: 'absolute', left: 60, top: y, opacity: lin(f, at, at + 6), transform: `translateX(${-40 * (1 - lin(f, at, at + 6))}px)` }}>
      <span style={{ position: 'relative', background: 'rgba(14,10,6,0.85)', border: `4px solid ${col}`, padding: '8px 22px', fontFamily: HEAD, fontWeight: 700, fontSize: 52, color: '#f6ecd4', letterSpacing: 2 }}>
        {t}
        {strike !== undefined && f >= strike && <span style={{ position: 'absolute', left: 10, right: 10, top: '50%', height: 7, background: C.redHi, transform: `scaleX(${lin(f, strike, strike + 6)})`, transformOrigin: 'left' }} />}
      </span>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="g02_map" from={0} to={end(2)} />
      <Dim />
      <Slate at={4} place="LONDON" date="OPERATION COPPERHEAD" />
      {tag(a, 'LOOK HERE: MEDITERRANEAN', C.gold, 480)}
      {tag(n, 'NOT HERE: NORMANDY', C.redHi, 580)}
      <Verdict at={fc} text="FIND A DOUBLE" color={C.gold} y={1060} rot={-4} />
    </AbsoluteFill>
  );
};

// S03 the actor in the Pay Corps, and the newspaper photo.
const S03: React.FC = () => {
  const ph = wf(3, 'newspaper');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="g03_clerk" from={0} to={end(3)} />
      <Dim />
      <Slate at={4} place="ARMY PAY CORPS" date="LT. M. E. CLIFTON JAMES · ACTOR" out={ph} />
      <RealPhoto at={ph} y={420} rot={3} label="SPOTTED IN A NEWSPAPER PHOTO" />
      <Verdict at={wf(3, 'twin')} text="MONTY'S TWIN" color={C.gold} y={1290} rot={-5} />
    </AbsoluteFill>
  );
};

// S04 the problems: drink, smoke, a missing finger.
const S04: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="g04_drink" from={0} to={end(4)} />
    <AbsoluteFill style={{ background: `rgba(255,170,80,${0.04 + 0.04 * hash01(useCurrentFrame(), 3)})`, mixBlendMode: 'screen' }} />
    <Dim />
    <Verdict at={wf(4, 'problems')} text="PROBLEMS" y={330} rot={-6} out={wf(4, 'drank')} />
    <Chips top={300} items={[{ at: wf(4, 'drank'), t: 'MONTY: NEVER DRANK' }, { at: wf(4, 'smoked'), t: 'NEVER SMOKED' }, { at: wf(4, 'both'), t: 'JAMES: BOTH' }, { at: wf(4, 'finger'), t: 'LOST A FINGER (WWI)' }, { at: wf(4, 'fake'), t: '→ A FAKE FINGER' }]} />
  </AbsoluteFill>
);

// S05 studying the real Monty.
const S05: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="g05_study" from={0} to={end(5)} />
    <Dim />
    <Chips top={300} items={[{ at: wf(5, 'reporter'), t: 'COVER: A REPORTER' }, { at: wf(5, 'walk'), t: 'THE WALK' }, { at: wf(5, 'voice'), t: 'THE VOICE' }]} />
  </AbsoluteFill>
);

// S06 the flight (and the gin).
const S06: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shake hits={[wf(6, 'flew')]} amp={6}>
      <Shot name="g06_plane" from={0} to={end(6)} />
    </Shake>
    <Haze color="200,205,215" o={0.25} y={1200} />
    <Dim />
    <Slate at={4} place="RAF NORTHOLT → GIBRALTAR" date="LATE MAY 1944" out={wf(6, 'reportedly')} />
    <Chips top={300} items={[{ at: wf(6, 'churchills'), t: "CHURCHILL'S OWN PLANE" }]} />
    <Verdict at={wf(6, 'reportedly')} text="REPORTEDLY" color={C.gold} y={720} rot={-4} />
    <Chips top={860} items={[{ at: wf(6, 'circled'), t: 'CIRCLED FOR 1 HOUR' }, { at: wf(6, 'gin'), t: 'SMUGGLED GIN' }]} />
  </AbsoluteFill>
);

// S07 Gibraltar: breakfast, the spy, the phone call.
const S07: React.FC = () => {
  const sp = wf(7, 'spy'); const cr = wf(7, 'crossed');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="g07_breakfast" from={0} to={sp + 6} />
      <Shot name="g01_spy" from={sp} to={cr + 6} />
      <Shot name="g07_phone" from={cr} to={end(7)} />
      <Dim />
      <Slate at={4} place="GIBRALTAR" date="GOVERNMENT HOUSE" out={sp} />
      <Chips top={300} items={[{ at: wf(7, 'secret'), t: '"SECRET PLANS"' }]} />
      <Verdict at={sp} text="GERMAN AGENT" y={760} rot={-5} out={cr} />
      <Verdict at={wf(7, 'handler')} text="MESSAGE SENT" color={C.gold} y={760} rot={4} />
    </AbsoluteFill>
  );
};

// S08 Algiers, then hidden in Cairo.
const S08: React.FC = () => {
  const va = wf(8, 'vanished');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="g08_algiers" from={0} to={va + 6} />
      <Shot name="g08_cairo" from={va} to={end(8)} />
      <Dim />
      <Slate at={4} place="ALGIERS" date="CROWDS · CAMERAS" out={va} />
      <Chips top={480} items={[{ at: wf(8, 'wilson'), t: 'GEN. MAITLAND WILSON' }]} out={va} />
      <Slate at={va + 4} place="CAIRO" date="HIDDEN UNTIL D-DAY" />
    </AbsoluteFill>
  );
};

// S09 did it work?
const S09: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="g09_generals" from={0} to={end(9)} />
    <Dim />
    <Verdict at={wf(9, 'work')} text="DID IT WORK?" color={C.gold} y={330} rot={-4} out={wf(9, 'believed')} />
    <Chips top={300} items={[{ at: wf(9, 'believed'), t: '"IT WAS MONTY"' }, { at: wf(9, 'trick'), t: '"…BUT A TRICK"' }]} />
    <Verdict at={wf(9, 'sign')} text="NO REAL EFFECT" y={1050} rot={-5} />
  </AbsoluteFill>
);

// S10 the pay, the desk, the question.
const S10: React.FC = () => {
  const f = useCurrentFrame();
  const q = wf(10, 'genius'); const b = wf(10, 'waste');
  const card = (at: number, l: string, t: string, x: number, col: string) => f < at ? null : (
    <div style={{ position: 'absolute', left: x, top: 1000, width: 440, transform: `scale(${0.8 + 0.2 * ease(f, at, at + 8)})`, opacity: lin(f, at, at + 6), background: 'rgba(14,10,6,0.85)', border: `4px solid ${col}`, padding: '18px 22px', textAlign: 'center' }}>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 40, color: col }}>{l}</div>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 60, color: '#fff' }}>{t}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="g10_desk" from={0} to={end(10)} />
      <Dim />
      <Chips top={300} items={[{ at: wf(10, '10'), t: '£10 A DAY' }, { at: wf(10, 'desk'), t: 'BACK TO THE PAY CORPS' }]} out={q} />
      {f >= q && <div style={{ position: 'absolute', left: 0, right: 0, top: 180, textAlign: 'center', opacity: lin(f, q, q + 8), fontFamily: HEAD, fontWeight: 700, fontSize: 76, color: '#fff', textShadow: '0 8px 24px #000' }}>WAS IT WORTH IT?</div>}
      {card(q, 'A', 'GENIUS', 70, C.gold)}
      {card(b, 'B', 'A WASTE', 570, '#6fbf73')}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1600, textAlign: 'center', opacity: lin(f, b + 30, b + 40) }}>
        <span style={{ background: C.red, color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 40, padding: '12px 30px', letterSpacing: 2 }}>FOLLOW · BURIED CHRONICLES</span>
      </div>
    </AbsoluteFill>
  );
};

export const SCENE_COMPS = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10];
