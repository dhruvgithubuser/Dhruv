import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { Particles, Quote } from './kit';
import { Explosion, Shake, VfxDefs } from './vfx';
import { C, H, HEAD, SANS, SCENES, SERIF, TYPE, W, ease, hash01, lin, pf, wf } from './theme';

/*
 * "Nelson Came Home in a Barrel of Brandy" (1805) - cinematic documentary Short.
 * Every shot is a still turned into a moving camera shot (depth parallax, scripts/parallax.py):
 * a* are real period paintings and prints, g* are dramatized reconstructions (labelled on screen).
 */

// length (s) of each parallax clip, as rendered by scripts/parallax.py
const CLIP_S: Record<string, number> = {
  a01_portrait: 8, a02_turner: 10, g03_marksman: 5, a03_fall: 4, a04_maclise: 4, g05_surgeon: 6, g05_cask: 4, g06_gibraltar: 5,
  g07_sailors: 9, g08_coffin: 7, g09_thames: 5, a09_funeral: 4, g09_crypt: 4, a10_portrait: 5, g02_victory: 10,
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

/** Cannon smoke puffs that bloom along a ship line. */
const Broadsides: React.FC<{ y: number; x0: number; x1: number; seed?: number }> = ({ y, x0, x1, seed = 2 }) => {
  const f = useCurrentFrame();
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      {Array.from({ length: 9 }, (_, i) => {
        const ph = (f + Math.floor(hash01(i, seed) * 40)) % 40; const k = ph / 40;
        const x = x0 + ((x1 - x0) * i) / 8 + 30 * k; const r = 20 + 90 * k;
        return <g key={i}><circle cx={x} cy={y - 40 * k} r={r} fill="#e9e4da" opacity={0.55 * (1 - k)} />{ph < 3 && <circle cx={x} cy={y} r={30} fill="url(#muzzle2)" opacity={1 - ph / 3} />}</g>;
      })}
      <defs><radialGradient id="muzzle2"><stop offset="0" stopColor="#fff7d6" /><stop offset="0.5" stopColor="#ffb347" /><stop offset="1" stopColor="#ff7a1a" stopOpacity="0" /></radialGradient></defs>
    </svg>
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

/** A wide period painting shown as a museum shot: blurred backdrop, framed canvas, slow pan across it. */
const PaintingPan: React.FC<{ src: string; caption: string }> = ({ src, caption }) => {
  const f = useCurrentFrame();
  const h = 560, w = Math.round(h * 960 / 249);
  const x = -((w - (W - 80)) * ease(f, 0, 150));
  return (
    <AbsoluteFill style={{ background: '#0b0805', opacity: lin(f, 0, 8) }}>
      <Img src={staticFile(src)} style={{ position: 'absolute', inset: -60, width: W + 120, height: H + 120, objectFit: 'cover', filter: 'blur(28px) brightness(0.45) saturate(0.8)' }} />
      <div style={{ position: 'absolute', left: 40, top: 560, width: W - 80, height: h, overflow: 'hidden', border: '10px solid #6b4f2a', boxShadow: '0 30px 60px rgba(0,0,0,0.8), inset 0 0 0 3px #c9a45c' }}>
        <Img src={staticFile(src)} style={{ position: 'absolute', left: x, top: 0, width: w, height: h, transform: `scale(${1 + 0.06 * lin(f, 0, 150)})`, transformOrigin: 'left center' }} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1150, textAlign: 'center', fontFamily: TYPE, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: C.gold, opacity: lin(f, 10, 20) }}>{caption}</div>
      <div style={{ position: 'absolute', left: 40, bottom: 330, fontFamily: TYPE, fontWeight: 700, fontSize: 20, letterSpacing: 3, color: 'rgba(246,236,212,0.55)' }}>PERIOD PAINTING</div>
    </AbsoluteFill>
  );
};

// S01 hook: Nelson's portrait (Lemuel Francis Abbott).
const S01: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="a01_portrait" from={0} to={end(1)} fadeIn={0} />
    <Particles kind="ash" n={30} o={0.4} />
    <Dim />
    <Verdict at={wf(1, 'brandy')} text="A BARREL OF BRANDY" color={C.gold} y={1080} rot={-5} />
  </AbsoluteFill>
);

// S02 Trafalgar: the battle (Turner), Nelson on Victory's deck.
const S02: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shake hits={[40, 130]} amp={10}>
      <Shot name={A2} from={0} to={end(2)} />
      <Broadsides y={1150} x0={100} x1={980} seed={5} />
      <Haze color="230,225,215" o={0.35} y={1000} />
    </Shake>
    <Dim />
    <Slate at={4} place="TRAFALGAR" date="21 OCTOBER 1805" />
    <Chips top={480} items={[{ at: wf(2, 'victory'), t: 'HMS VICTORY' }, { at: wf(2, 'medals'), t: 'IN FULL DECORATIONS' }]} />
  </AbsoluteFill>
);

// S03 the marksman and the shot.
const S03: React.FC = () => {
  const ai = wf(3, 'aim'); const ba = wf(3, 'ball');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shake hits={[ai + 20]} amp={18}>
        <Shot name="g03_marksman" from={0} to={ba + 6} />
        <Haze color="225,220,210" o={0.35} y={1300} />
      </Shake>
      <Sequence from={ba} layout="none"><PaintingPan src="assets/archival/maclise.jpg" caption="DANIEL MACLISE · THE DEATH OF NELSON (1859–64)" /></Sequence>
      <Flash at={ai + 20} color="255,230,190" />
      <Dim />
      <Slate at={4} place="REDOUTABLE'S RIGGING" date="RANGE: 50 FEET" out={ba} />
      <Chips top={480} items={[{ at: wf(3, 'shoulder'), t: 'SHOULDER' }, { at: wf(3, 'lung'), t: 'LUNG' }, { at: wf(3, 'spine'), t: 'SPINE' }]} />
    </AbsoluteFill>
  );
};

// S04 the death below deck (Maclise).
const S04: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name={A4} from={0} to={end(4)} />
    <Dim />
    <Slate at={4} place="4:30 PM" date="NELSON DIES · AGED 47" />
    <Verdict at={wf(4, 'won')} text="VICTORY" color={C.gold} y={1080} />
  </AbsoluteFill>
);

// S05 the surgeon and the cask.
const S05: React.FC = () => {
  const la = wf(5, 'lashed');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="g05_surgeon" from={0} to={la + 6} />
      <Shot name="g05_cask" from={la} to={end(5)} />
      <AbsoluteFill style={{ background: `rgba(255,170,80,${0.05 + 0.04 * hash01(useCurrentFrame(), 3)})`, mixBlendMode: 'screen' }} />
      <Dim />
      <Slate at={4} place="WEEKS FROM HOME" date="SURGEON WILLIAM BEATTY" out={la} />
      <Chips top={480} items={[{ at: wf(5, 'brandy'), t: 'BRANDY' }, { at: wf(5, 'camphor'), t: '+ CAMPHOR' }, { at: wf(5, 'myrrh'), t: '+ MYRRH' }, { at: wf(5, 'guard'), t: 'ARMED GUARD' }]} />
    </AbsoluteFill>
  );
};

// S06 Gibraltar.
const S06: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="g06_gibraltar" from={0} to={end(6)} />
    <Dim />
    <Slate at={4} place="GIBRALTAR" date="OCTOBER 1805" />
    <Chips top={480} items={[{ at: wf(6, 'lead'), t: 'LEAD COFFIN' }, { at: wf(6, 'wine'), t: 'SPIRITS OF WINE' }]} />
  </AbsoluteFill>
);

// S07 the legend: tapping the admiral.
const S07: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="g07_sailors" from={0} to={end(7)} />
    <AbsoluteFill style={{ background: `rgba(255,170,80,${0.05 + 0.05 * hash01(useCurrentFrame(), 9)})`, mixBlendMode: 'screen' }} />
    <Dim />
    <Verdict at={wf(7, 'legend')} text="THE LEGEND" color={C.gold} y={330} rot={-6} />
    <Chips top={520} items={[{ at: wf(7, 'tapping'), t: '"TAPPING THE ADMIRAL"' }, { at: wf(7, 'blood'), t: '"NELSON\'S BLOOD"' }]} />
    <Verdict at={wf(7, 'proof')} text="NO PROOF" y={860} />
    <Verdict at={wf(7, 'rum', 1)} text="IT WAS BRANDY" color={C.gold} y={1060} rot={4} />
  </AbsoluteFill>
);

// S08 the coffin from L'Orient's mast.
const S08: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="g08_coffin" from={0} to={end(8)} />
    <Dim />
    <Doc at={wf(8, 'mast')} title="L'Orient's mainmast" lines={['FRENCH FLAGSHIP · BLOWN UP AT THE NILE, 1798', 'TURNED INTO A COFFIN', 'GIFT FROM CAPT. BENJAMIN HALLOWELL']} y={300} />
  </AbsoluteFill>
);

// S09 the funeral (print) and the crypt.
const S09: React.FC = () => {
  const sp = wf(9, 'escort'); const ca = wf(9, 'tomb');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="g09_thames" from={0} to={ca + 6} />
      <Shot name="g09_crypt" from={ca} to={end(9)} />
      <Dim />
      <Slate at={4} place="LONDON" date="9 JANUARY 1806" out={sp} />
      <Chips top={480} items={[{ at: wf(9, '32'), t: '32 ADMIRALS' }, { at: wf(9, '100'), t: '100+ CAPTAINS' }, { at: wf(9, '10000'), t: '10,000 SOLDIERS' }]} />
      <Slate at={ca + 4} place="ST PAUL'S CRYPT" date="CARDINAL WOLSEY'S SARCOPHAGUS" />
    </AbsoluteFill>
  );
};

// S10 the question over his portrait.
const S10: React.FC = () => {
  const f = useCurrentFrame();
  const a = wf(10, 'drunk'); const b = wf(10, 'barrel');
  const card = (at: number, l: string, t: string, x: number, col: string) => f < at ? null : (
    <div style={{ position: 'absolute', left: x, top: 1000, width: 440, transform: `scale(${0.8 + 0.2 * ease(f, at, at + 8)})`, opacity: lin(f, at, at + 6), background: 'rgba(14,10,6,0.85)', border: `4px solid ${col}`, padding: '18px 22px', textAlign: 'center' }}>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 40, color: col }}>{l}</div>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 60, color: '#fff' }}>{t}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="a10_portrait" from={0} to={end(10)} />
      <Dim />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 180, textAlign: 'center', opacity: lin(f, 4, 12), fontFamily: HEAD, fontWeight: 700, fontSize: 76, color: '#fff', textShadow: '0 8px 24px #000' }}>WOULD YOU DRINK IT?</div>
      {card(a, 'A', 'ONE SIP', 70, C.gold)}
      {card(b, 'B', 'NEVER', 570, '#6fbf73')}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1600, textAlign: 'center', opacity: lin(f, pf(10, 0) + 50, pf(10, 0) + 60) }}>
        <span style={{ background: C.red, color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 40, padding: '12px 30px', letterSpacing: 2 }}>FOLLOW · BURIED CHRONICLES</span>
      </div>
    </AbsoluteFill>
  );
};

// archive paintings, or reconstruction fallbacks if a painting could not be fetched
const A2 = 'g02_victory', A4 = 'g04_death';

export const SCENE_COMPS = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10];
