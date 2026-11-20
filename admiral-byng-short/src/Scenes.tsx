import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { Particles, Quote } from './kit';
import { Explosion, Shake, VfxDefs } from './vfx';
import { C, H, HEAD, SANS, SCENES, SERIF, TYPE, W, ease, hash01, lin, pf, wf } from './theme';

/*
 * "Britain Shot Its Own Admiral (1757)" (Admiral John Byng) - cinematic documentary Short.
 * Every shot is a still turned into a moving camera shot (depth parallax, scripts/parallax.py):
 * a* are real period images (portrait, 1757 print), g* are dramatized reconstructions (labelled on screen).
 */

// length (s) of each parallax clip, as rendered by scripts/parallax.py
const CLIP_S: Record<string, number> = {
  a01_portrait: 8, g02_fleet: 10, g03_battle: 7, g03_gibraltar: 3, g04_effigy: 8, g05_court: 8, g06_king: 4, g07_deck: 6, g07_cushion: 5,
  g08_voltaire: 7, g09_tomb: 9, a10_portrait: 5,
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

// S01 hook: his real portrait (Thomas Hudson, 1749).
const S01: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="a01_portrait" from={0} to={end(1)} fadeIn={0} />
    <Particles kind="ash" n={40} o={0.45} />
    <Dim />
    <Verdict at={wf(1, 'shot')} text="SHOT · 1757" y={1080} />
    <Chips top={520} items={[{ at: wf(1, 'mercy'), t: 'JUDGES: "SPARE HIM"' }]} />
  </AbsoluteFill>
);

// S02 the fleet sails.
const S02: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="g02_fleet" from={0} to={end(2)} />
    <Haze color="215,215,210" o={0.3} y={1000} />
    <Dim />
    <Slate at={4} place="ADMIRAL JOHN BYNG" date="1704 – 1757" out={wf(2, '1756')} />
    <Slate at={wf(2, '1756') + 2} place="PORTSMOUTH" date="1756 · DESTINATION: MINORCA" />
    <Chips top={480} items={[{ at: wf(2, 'repair'), t: 'SHIPS IN POOR REPAIR' }, { at: wf(2, 'sailors'), t: 'HUNDREDS OF SAILORS SHORT' }]} />
  </AbsoluteFill>
);

// S03 the battle, then the retreat to Gibraltar.
const S03: React.FC = () => {
  const cl = wf(3, 'clash'); const gb = wf(3, 'gibraltar');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shake hits={[cl, cl + 20, wf(3, 'damage')]} amp={16}>
        <Shot name="g03_battle" from={0} to={gb + 6} />
        <Broadsides y={1020} x0={120} x1={960} />
        <Haze color="230,225,215" o={0.4} y={950} />
      </Shake>
      <Shot name="g03_gibraltar" from={gb} to={end(3)} />
      <Dim />
      <Slate at={4} place="BATTLE OF MINORCA" date="20 MAY 1756" out={gb} />
      <Verdict at={wf(3, 'falls', 1)} text="MINORCA FALLS" y={420} />
    </AbsoluteFill>
  );
};

// S04 the edited report and the burning effigies.
const S04: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="g04_effigy" from={0} to={end(4)} />
    <Particles kind="embers" n={70} o={0.8} />
    <Dim />
    <Doc at={wf(4, 'prints')} title="The London Gazette" lines={['26 JUNE 1756', "ADMIRAL BYNG'S REPORT", '(passages removed, others reworded)']} stamp={{ at: wf(4, 'edited'), t: 'EDITED' }} />
  </AbsoluteFill>
);

// S05 the court martial.
const S05: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="g05_court" from={0} to={end(5)} />
    <Dim />
    <Slate at={4} place="COURT MARTIAL" date="HMS ST GEORGE · PORTSMOUTH" out={wf(5, 'utmost')} />
    <Chips top={460} items={[{ at: wf(5, 'cowardice'), t: 'COWARDICE: NOT GUILTY' }, { at: wf(5, 'utmost'), t: '"DID NOT DO HIS UTMOST": GUILTY' }]} />
    <Verdict at={wf(5, 'death')} text="DEATH" y={330} />
  </AbsoluteFill>
);

// S06 the King refuses.
const S06: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="g06_king" from={0} to={end(6)} />
    <Dim />
    <Slate at={4} place="KING GEORGE II" date="ASKED FOR MERCY" />
    <Verdict at={wf(6, 'no')} text="REFUSED" y={560} />
  </AbsoluteFill>
);

const Blackout: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#000', opacity: lin(f, 0, 8), alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', opacity: lin(f, 10, 20), marginTop: -300 }}>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 84, color: '#f6ecd4' }}>JOHN BYNG</div>
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 38, letterSpacing: 6, color: C.gold, marginTop: 10 }}>1704 – 1757</div>
      </div>
    </AbsoluteFill>
  );
};

// S07 the execution: the deck, the cushion, the volley, then black.
const S07: React.FC = () => {
  const kn = wf(7, 'kneels'); const fi = wf(7, 'fire');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="g07_deck" from={0} to={kn + 6} />
      <Shake hits={[fi]} amp={22}>
        <Shot name="g07_cushion" from={kn} to={fi + 4} />
      </Shake>
      <Flash at={fi} color="255,245,230" />
      <Dim />
      <Slate at={4} place="HMS MONARCH" date="14 MARCH 1757 · THE SOLENT" out={kn} />
      <Sequence from={fi + 6} layout="none"><Blackout /></Sequence>
    </AbsoluteFill>
  );
};

// S08 Voltaire's line.
const S08: React.FC = () => {
  const q = pf(8, 0) + 30;
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="g08_voltaire" from={0} to={end(8)} />
      <Dim top={0.5} bottom={0.5} />
      <Quote at={q} text="In this country, it is good to kill an admiral from time to time, to encourage the others." by="VOLTAIRE, CANDIDE (1759)" x={70} y={850} w={940} />
    </AbsoluteFill>
  );
};

// S09 the pardon refused, the tomb.
const S09: React.FC = () => {
  const tb = wf(9, 'tomb');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="g09_tomb" from={0} to={end(9)} />
      <Dim />
      <Slate at={4} place="2007" date="FAMILY ASKS FOR A PARDON" out={tb} />
      <Verdict at={wf(9, 'refused')} text="PARDON REFUSED" y={560} />
      <Quote at={tb + 4} text="...fell a martyr to political persecution" by="HIS EPITAPH, SOUTHILL CHURCH" x={70} y={900} w={940} />
    </AbsoluteFill>
  );
};

// S10 the question over his portrait.
const S10: React.FC = () => {
  const f = useCurrentFrame();
  const a = wf(10, 'scapegoat'); const b = wf(10, 'justice');
  const card = (at: number, l: string, t: string, x: number, col: string) => f < at ? null : (
    <div style={{ position: 'absolute', left: x, top: 330, width: 440, transform: `scale(${0.8 + 0.2 * ease(f, at, at + 8)})`, opacity: lin(f, at, at + 6), background: 'rgba(14,10,6,0.85)', border: `4px solid ${col}`, padding: '18px 22px', textAlign: 'center' }}>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 40, color: col }}>{l}</div>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 60, color: '#fff' }}>{t}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="a10_portrait" from={0} to={end(10)} />
      <Dim />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 180, textAlign: 'center', opacity: lin(f, 4, 12), fontFamily: HEAD, fontWeight: 700, fontSize: 80, color: '#fff', textShadow: '0 8px 24px #000' }}>ADMIRAL BYNG WAS...</div>
      {card(a, 'A', 'SCAPEGOAT', 70, C.gold)}
      {card(b, 'B', 'JUSTICE', 570, '#6fbf73')}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1600, textAlign: 'center', opacity: lin(f, pf(10, 0) + 50, pf(10, 0) + 60) }}>
        <span style={{ background: C.red, color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 40, padding: '12px 30px', letterSpacing: 2 }}>FOLLOW · BURIED CHRONICLES</span>
      </div>
    </AbsoluteFill>
  );
};

export const SCENE_COMPS = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10];
