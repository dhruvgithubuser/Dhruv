import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { Particles, Quote } from './kit';
import { Explosion, Shake, VfxDefs } from './vfx';
import { C, H, HEAD, SANS, SCENES, TYPE, W, ease, hash01, lin, pf, wf } from './theme';

/*
 * "The Only Soldier to Kill With a Longbow in WWII?" (Mad Jack Churchill) - cinematic documentary Short.
 * Every shot is a still turned into a moving camera shot (depth parallax, scripts/parallax.py):
 * a* are real archive photographs (IWM), g* are dramatized reconstructions (labelled on screen).
 */

// length (s) of each parallax clip, as rendered by scripts/parallax.py
const CLIP_S: Record<string, number> = {
  a01_gun: 7, g02_archery: 7, g03_france: 10, g04_truck: 6, a05_charge: 3, g06_landing: 5, a06_gun: 4, g07_sicily: 8, g08_prisoners: 7,
  g09_sword: 4, g10_brac: 5, g10_piper: 7, g11_room: 4, g12_thames: 5, a12_sword: 6,
};
const GRADE = 'saturate(0.62) sepia(0.22) contrast(1.1) brightness(0.95)';

/** One moving shot, from scene-local frame `from` to `to`; stretched to fit, with a short dissolve in. */
const Shot: React.FC<{ name: string; from: number; to: number; fadeIn?: number }> = ({ name, from, to, fadeIn = 8 }) => {
  const dur = Math.max(1, to - from);
  const rate = Math.min(1.6, Math.max(0.45, (CLIP_S[name] * 30) / dur));
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
      <Label text={arch ? 'ARCHIVE PHOTO' : 'DRAMATIZED RECONSTRUCTION'} />
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

/** Running wound counter, top-right: a red tag that ticks up and names the wound. */
const Wound: React.FC<{ at: number; n: number; text: string; out?: number }> = ({ at, n, text, out }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  if (f < at || (out && f > out)) return null;
  const k = spring({ frame: f - at, fps, config: { damping: 11, stiffness: 200 } });
  return (
    <div style={{ position: 'absolute', right: 44, top: 190, transform: `scale(${0.6 + 0.4 * k}) rotate(${3 - 3 * k}deg)`, transformOrigin: 'right top', opacity: Math.min(1, k * 1.5) * (out ? 1 - lin(f, out - 6, out) : 1), textAlign: 'right' }}>
      <div style={{ display: 'inline-block', background: C.red, color: '#fff', fontFamily: HEAD, fontWeight: 700, fontSize: 46, padding: '6px 22px', letterSpacing: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>WOUND {n}</div>
      <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 30, color: '#f6ecd4', marginTop: 10, textShadow: '0 3px 10px #000' }}>{text}</div>
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

/** Arrow in flight: a streak from (x0,y0) to (x1,y1) between frames at..at+dur, with a motion trail. */
const Arrow: React.FC<{ at: number; dur?: number; x0: number; y0: number; x1: number; y1: number }> = ({ at, dur = 10, x0, y0, x1, y1 }) => {
  const f = useCurrentFrame(); const t = (f - at) / dur;
  if (t < 0 || t > 1.6) return null;
  const k = Math.min(1, t); const x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k - 60 * Math.sin(Math.PI * k);
  const ang = Math.atan2(y1 - y0 - 60 * Math.PI * Math.cos(Math.PI * k), x1 - x0) * 180 / Math.PI;
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      {t < 1 && Array.from({ length: 6 }, (_, i) => { const kk = Math.max(0, k - i * 0.04); return <circle key={i} cx={x0 + (x1 - x0) * kk} cy={y0 + (y1 - y0) * kk - 60 * Math.sin(Math.PI * kk)} r={5 - i * 0.6} fill="#f6ecd4" opacity={0.45 - i * 0.07} />; })}
      <g transform={`translate(${x} ${y}) rotate(${ang})`}>
        <line x1={-150} y1={0} x2={0} y2={0} stroke="#d8c39a" strokeWidth={6} />
        <path d="M0 -9 L26 0 L0 9 Z" fill="#cfd3d6" />
        <path d="M-150 0 L-176 -14 L-140 0 L-176 14 Z" fill="#8e1b16" />
      </g>
    </svg>
  );
};

/** Rubber stamp verdict (LEGEND / DISPUTED / TRUE). */
const Verdict: React.FC<{ at: number; text: string; color?: string; x?: number; y?: number; rot?: number }> = ({ at, text, color = C.redHi, x = 540, y = 330, rot = -8 }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const k = ease(f, at, at + 7);
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${1.6 - 0.6 * k})`, opacity: Math.min(1, k * 1.6), border: `9px solid ${color}`, padding: '6px 34px', fontFamily: HEAD, fontWeight: 700, fontSize: 92, letterSpacing: 6, color, background: 'rgba(14,10,6,0.55)', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', whiteSpace: 'nowrap' }}>{text}</div>
  );
};

/** Kit list chips that slide in on spoken words, right side. */
const Chips: React.FC<{ items: { at: number; t: string }[]; top?: number }> = ({ items, top = 190 }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', right: 50, top, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14 }}>
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

// S01 hook: the real man, sword at his hip, Norway 1941 (IWM, Vågsøy 1941).
const S01: React.FC = () => {
  const ar = wf(1, 'arrow');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="a01_gun" from={0} to={end(1)} fadeIn={0} />
      <Haze color="230,230,225" o={0.3} y={1000} />
      <Dim />
      <Arrow at={ar - 6} x0={-200} y0={700} x1={1250} y1={560} dur={12} />
      <Verdict at={wf(1, 'happen')} text="LEGEND?" color={C.gold} y={360} />
    </AbsoluteFill>
  );
};

// S02 the archer before the war.
const S02: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="g02_archery" from={0} to={end(2)} />
    <Dim />
    <Slate at={4} place="JACK CHURCHILL" date="1906 – 1996" out={wf(2, 'world') } />
    <Slate at={wf(2, 'world') + 2} place="OSLO · 1939" date="WORLD ARCHERY CHAMPIONSHIPS" />
    <Arrow at={wf(2, 'archer')} x0={300} y0={900} x1={1250} y1={760} dur={10} />
  </AbsoluteFill>
);

// S03 the legend: France 1940, one arrow.
const S03: React.FC = () => {
  const dr = wf(3, 'draws'); const ar = wf(3, 'single');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shake hits={[ar + 10]} amp={10}>
        <Shot name="g03_france" from={0} to={end(3)} />
        <Haze color="200,190,170" o={0.35} y={1100} />
      </Shake>
      <Dim />
      <Arrow at={ar - 2} x0={420} y0={980} x1={1300} y1={820} dur={9} />
      <Slate at={4} place="FRANCE" date="MAY 1940" />
      <div style={{ position: 'absolute', right: 50, top: 200, fontFamily: TYPE, fontWeight: 700, fontSize: 34, letterSpacing: 3, color: C.gold, textShadow: '0 3px 10px #000', opacity: lin(useCurrentFrame(), dr, dr + 8) }}>"THE STORY GOES..."</div>
      <Verdict at={wf(3, 'only')} text="THE LEGEND" color={C.gold} y={560} rot={-6} />
    </AbsoluteFill>
  );
};

// S04 the twist: his own words.
const S04: React.FC = () => {
  const f = useCurrentFrame();
  const cr = wf(4, 'crushed');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="g04_truck" from={0} to={end(4)} />
      <Dim />
      <Flash at={cr} color="255,240,220" />
      <div style={{ position: 'absolute', left: 60, right: 60, top: 200, opacity: lin(f, 6, 14) }}>
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: C.gold, textShadow: '0 3px 10px #000' }}>HIS OWN ACCOUNT</div>
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 44, lineHeight: 1.3, color: '#f6ecd4', textShadow: '0 3px 12px #000', marginTop: 10 }}>HIS BOWS WERE CRUSHED<br />BY A LORRY, EARLIER<br />IN THE CAMPAIGN.</div>
      </div>
      <Verdict at={cr + 12} text="DISPUTED" y={760} />
    </AbsoluteFill>
  );
};

// S05 the rest is true (real photo, the training charge).
const S05: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="a05_charge" from={0} to={end(5)} />
    <Dim />
    <Verdict at={wf(5, 'true')} text="TRUE" color="#6fbf73" y={420} rot={-5} />
  </AbsoluteFill>
);

// S06 Norway 1941: bagpipes ashore, then the real photo with the captured gun.
const S06: React.FC = () => {
  const ga = wf(6, 'garrison');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shake hits={[wf(6, 'drop'), wf(6, 'leaps')]} amp={14}>
        <Shot name="g06_landing" from={0} to={ga + 6} />
        <Particles kind="snow" n={70} o={0.8} />
        <Flashes pts={[[260, 980], [820, 900], [600, 1060]]} every={19} />
      </Shake>
      <Shot name="a06_gun" from={ga} to={end(6)} />
      <Particles kind="snow" n={50} o={0.6} />
      <Dim />
      <Slate at={4} place="VÅGSØY, NORWAY" date="27 DECEMBER 1941" out={ga} />
      <Count at={wf(6, 'ten')} to={10} label="MINUTES" dur={14} />
    </AbsoluteFill>
  );
};

// S07 Sicily 1943: the kit.
const S07: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="g07_sicily" from={0} to={end(7)} />
    <Haze color="226,204,160" o={0.3} y={1150} />
    <Dim />
    <Slate at={4} place="SICILY" date="JULY 1943" />
    <Chips top={420} items={[{ at: wf(7, 'broadsword'), t: 'BROADSWORD' }, { at: wf(7, 'longbow'), t: 'LONGBOW' }, { at: wf(7, 'bagpipes'), t: 'BAGPIPES' }]} />
  </AbsoluteFill>
);

// S08 Salerno: 42 prisoners.
const S08: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="g08_prisoners" from={0} to={end(8)} />
    <Dim />
    <Slate at={4} place="SALERNO, ITALY" date="SEPTEMBER 1943" out={wf(8, '42')} />
    <Chips top={420} items={[{ at: wf(8, 'corporal'), t: '+ 1 CORPORAL' }]} />
    <Count at={wf(8, '42')} to={42} label="PRISONERS" dur={24} />
  </AbsoluteFill>
);

// S09 back for the sword.
const S09: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="g09_sword" from={0} to={end(9)} />
    <Haze color="210,200,180" o={0.3} y={1200} />
    <Dim />
  </AbsoluteFill>
);

// S10 Brač 1944: mortar fire, the lone piper, grenades.
const S10: React.FC = () => {
  const mo = wf(10, 'mortar'); const pl = wf(10, 'plays'); const gr = wf(10, 'grenades');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shake hits={[mo, mo + 24]} amp={24}>
        <Shot name="g10_brac" from={0} to={pl + 6} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}><VfxDefs /><Explosion at={mo} x={620} y={820} s={1.2} seed={4} /><Explosion at={mo + 24} x={260} y={900} s={0.8} seed={11} /></svg>
      </Shake>
      <Shake hits={[gr]} amp={30}>
        <Shot name="g10_piper" from={pl} to={end(10)} />
        <Particles kind="embers" n={50} o={0.7} />
        <Haze color="160,150,140" o={0.35} y={1000} />
      </Shake>
      <Flash at={gr} color="255,250,240" />
      <AbsoluteFill style={{ background: '#fff', opacity: lin(useCurrentFrame(), gr, gr + 3) * (1 - lin(useCurrentFrame(), gr + 6, gr + 30)) }} />
      <Dim />
      <Slate at={4} place="BRAČ, YUGOSLAVIA" date="JUNE 1944" out={pl} />
      <Chips top={190} items={[{ at: pl + 4, t: '"WILL YE NO COME BACK AGAIN?"' }]} />
    </AbsoluteFill>
  );
};

// S11 captured, Berlin, and an old age on the Thames.
const S11: React.FC = () => {
  const sv = wf(11, 'survived');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="g11_room" from={0} to={sv + 6} />
      <Shot name="g12_thames" from={sv} to={end(11)} />
      <Dim />
      <Slate at={4} place="BERLIN" date="PRISONER · 1944" out={wf(11, 'wasnt')} />
      <Verdict at={wf(11, 'wasnt')} text="NO RELATION" y={560} rot={-5} />
      <Slate at={sv + 4} place="1906 – 1996" date="DIED AGED 89" />
    </AbsoluteFill>
  );
};

// S12 the question, over the real man.
const S12: React.FC = () => {
  const f = useCurrentFrame();
  const lg = wf(12, 'legend'); const tr = wf(12, 'truth');
  const card = (at: number, l: string, t: string, x: number, col: string) => f < at ? null : (
    <div style={{ position: 'absolute', left: x, top: 330, width: 440, transform: `scale(${0.8 + 0.2 * ease(f, at, at + 8)})`, opacity: lin(f, at, at + 6), background: 'rgba(14,10,6,0.85)', border: `4px solid ${col}`, padding: '18px 22px', textAlign: 'center' }}>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 40, color: col }}>{l}</div>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 64, color: '#fff' }}>{t}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="a12_sword" from={0} to={end(12)} />
      <Dim />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 180, textAlign: 'center', opacity: lin(f, 4, 12), fontFamily: HEAD, fontWeight: 700, fontSize: 84, color: '#fff', textShadow: '0 8px 24px #000' }}>THE LONGBOW KILL</div>
      {card(lg, 'A', 'LEGEND', 70, C.gold)}
      {card(tr, 'B', 'TRUTH', 570, '#6fbf73')}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1600, textAlign: 'center', opacity: lin(f, pf(12, 0) + 60, pf(12, 0) + 70) }}>
        <span style={{ background: C.red, color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 40, padding: '12px 30px', letterSpacing: 2 }}>FOLLOW · BURIED CHRONICLES</span>
      </div>
    </AbsoluteFill>
  );
};

export const SCENE_COMPS = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12];
