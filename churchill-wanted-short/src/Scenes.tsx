import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { Particles } from './kit';
import { Shake } from './vfx';
import { C, H, HEAD, SANS, SCENES, SERIF, TYPE, W, ease, hash01, lin, pf, wf } from './theme';

/*
 * "Churchill's Wanted Poster: £25, Dead or Alive" (Boer War, 1899) - cinematic documentary Short.
 * Every shot is a still turned into a moving camera shot (depth parallax, scripts/parallax.py):
 * g* are dramatized reconstructions (labelled on screen); real photos of Churchill (1900, and as Prime Minister) are shown as framed prints; the reward notice is a stylised reconstruction.
 */

// length (s) of each parallax clip, as rendered by scripts/parallax.py
const CLIP_S: Record<string, number> = {
  g01_hero: 10, g02_train: 11, g03_reporter: 5, g03_capture: 2, g04_prison: 6, g05_wall: 6, g06_post: 5, g07_train: 3, g08_mine: 5, g09_shaft: 3, g10_wool: 9, g11_crowd: 7,
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

/** Escape route: Pretoria → Witbank → Lourenço Marques, drawn on as he travels. */
const Route: React.FC<{ at: number; dur?: number }> = ({ at, dur = 90 }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const k = ease(f, at, at + dur);
  const pts: [number, number][] = [[200, 1080], [470, 1010], [880, 900]];
  const L = (a: [number, number], b: [number, number]) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const tot = L(pts[0], pts[1]) + L(pts[1], pts[2]);
  const names = [['PRETORIA', 'ESCAPE'], ['WITBANK', 'COAL MINE'], ['LOURENÇO MARQUES', 'FREE']];
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: lin(f, at, at + 8) }}>
      <rect x={120} y={800} width={840} height={380} rx={10} fill="rgba(14,10,6,0.78)" stroke={C.gold} strokeWidth={3} />
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="rgba(246,236,212,0.25)" strokeWidth={6} strokeDasharray="14 12" />
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={C.redHi} strokeWidth={8} strokeDasharray={`${tot * k} ${tot}`} strokeLinecap="round" />
      {pts.map((p, i) => {
        const on = k * tot >= (i === 0 ? 0 : i === 1 ? L(pts[0], pts[1]) : tot) - 1;
        return (
          <g key={i} opacity={on ? 1 : 0.35}>
            <circle cx={p[0]} cy={p[1]} r={14} fill={i === 2 ? C.gold : C.redHi} stroke="#fff" strokeWidth={3} />
            <text x={p[0]} y={p[1] + (i === 2 ? -36 : 52)} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={34} fill="#f6ecd4">{names[i][0]}</text>
            <text x={p[0]} y={p[1] + (i === 2 ? -72 : 86)} textAnchor="middle" fontFamily={TYPE} fontWeight={700} fontSize={24} fill={C.gold}>{names[i][1]}</text>
          </g>
        );
      })}
      <text x={540} y={1150} textAnchor="middle" fontFamily={TYPE} fontWeight={700} fontSize={28} fill="#f6ecd4" opacity={lin(f, at + dur - 10, at + dur)}>ALMOST 300 MILES</text>
    </svg>
  );
};

// S01 hook: young Churchill in hiding, the reward on screen from frame 0.
const S01: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="g01_hero" from={0} to={end(1)} fadeIn={0} />
    <AbsoluteFill style={{ background: `rgba(255,170,80,${0.04 + 0.04 * hash01(useCurrentFrame(), 7)})`, mixBlendMode: 'screen' }} />
    <Dim />
    <Slate at={-20} place="WANTED · £25 REWARD" date="SOUTH AFRICA · DECEMBER 1899" />
    <Verdict at={wf(1, 'dead')} text="DEAD OR ALIVE" y={1080} rot={-6} />
  </AbsoluteFill>
);

// S02 the armoured train, 15 Nov 1899.
const S02: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="g02_train" from={0} to={end(2)} />
    <Haze color="225,215,195" o={0.3} y={1000} />
    <Dim />
    <Slate at={4} place="NATAL, SOUTH AFRICA" date="15 NOVEMBER 1899" out={wf(2, 'winston')} />
    <Print src="assets/archival/churchill1900.jpg" at={wf(2, 'winston')} out={wf(2, 'riding')} y={300} w={520} h={600} rot={-3} label="WINSTON CHURCHILL · 1900" pos="50% 20%" />
    <Chips top={300} items={[{ at: wf(2, 'riding'), t: 'WAR CORRESPONDENT' }, { at: wf(2, 'riding') + 6, t: 'THE MORNING POST' }, { at: wf(2, 'armoured'), t: 'ARMOURED TRAIN' }]} />
  </AbsoluteFill>
);

// S03 derailed, under fire, captured.
const S03: React.FC = () => {
  const de = wf(3, 'derail'); const su = wf(3, 'surrounded');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shake hits={[de, de + 12]} amp={16}>
        <Shot name="g03_reporter" from={0} to={su + 6} />
        <Shot name="g03_capture" from={su} to={end(3)} />
        <Haze color="220,215,205" o={0.3} y={1200} />
      </Shake>
      <Flash at={de} />
      <Dim />
      <Chips top={300} items={[{ at: wf(3, 'line'), t: 'CLEARS THE LINE' }, { at: wf(3, 'fire'), t: 'UNDER FIRE' }]} out={su} />
      <Verdict at={wf(3, 'prisoner')} text="PRISONER OF WAR" y={330} rot={-5} />
    </AbsoluteFill>
  );
};

// S04 the school-prison in Pretoria.
const S04: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="g04_prison" from={0} to={end(4)} />
    <Dim />
    <Slate at={4} place="PRETORIA" date="THE STATE MODEL SCHOOL" />
    <Chips top={480} items={[{ at: wf(4, 'prison'), t: 'PRISON FOR BRITISH OFFICERS' }]} />
  </AbsoluteFill>
);

// S05 over the wall.
const S05: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="g05_wall" from={0} to={end(5)} />
    <AbsoluteFill style={{ background: 'rgba(40,70,120,0.18)', mixBlendMode: 'multiply' }} />
    <Dim />
    <Slate at={4} place="12 DECEMBER 1899" date="NIGHT" />
    <Chips top={480} items={[{ at: wf(5, 'wall'), t: 'OVER THE LATRINE WALL' }, { at: wf(5, 'town'), t: 'STRAIGHT THROUGH TOWN' }]} />
  </AbsoluteFill>
);

// S06 the price on his head: the reward notice as a document card.
const S06: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="g06_post" from={0} to={end(6)} />
    <Dim />
    <Doc at={wf(6, 'price')} title="£25 REWARD" lines={['THE ESCAPED PRISONER OF WAR', 'CHURCHILL', 'DEAD OR ALIVE']} stamp={{ at: wf(6, 'dead'), t: 'WANTED' }} y={330} />
  </AbsoluteFill>
);

// S07 goods train, coal mine, John Howard.
const S07: React.FC = () => {
  const co = wf(7, 'coal'); const hi = wf(7, 'hides');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="g07_train" from={0} to={co + 6} />
      <Shot name="g08_mine" from={co} to={hi + 6} />
      <Shot name="g09_shaft" from={hi} to={end(7)} />
      <AbsoluteFill style={{ background: `rgba(255,170,80,${0.04 + 0.04 * hash01(useCurrentFrame(), 5)})`, mixBlendMode: 'screen' }} />
      <Dim />
      <Slate at={co + 4} place="WITBANK COLLIERY" date="THE MANAGER IS ENGLISH" out={hi} />
      <Chips top={480} items={[{ at: wf(7, 'howard'), t: 'MANAGER: JOHN HOWARD' }, { at: wf(7, 'bottom'), t: 'HIDDEN UNDERGROUND' }]} />
    </AbsoluteFill>
  );
};

// S08 wool bales, the route, free.
const S08: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="g10_wool" from={0} to={end(8)} />
    <Dim />
    <Chips top={300} items={[{ at: wf(8, 'wool'), t: 'UNDER BALES OF WOOL' }]} />
    <Route at={wf(8, 'almost') - 10} dur={wf(8, 'free') - wf(8, 'almost') + 10} />
    <Verdict at={wf(8, 'free')} text="FREE" color={C.gold} y={620} rot={-6} />
  </AbsoluteFill>
);

// S09 Black Week, a hero, Parliament.
const S09: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="g11_crowd" from={0} to={end(9)} />
    <Dim />
    <Chips top={300} items={[{ at: wf(9, 'three'), t: '"BLACK WEEK": 3 DEFEATS' }, { at: wf(9, 'hero'), t: 'A NATIONAL HERO' }, { at: wf(9, 'parliament'), t: 'MP FOR OLDHAM · 1900' }]} />
  </AbsoluteFill>
);

// S10 Prime Minister, and the question.
const S10: React.FC = () => {
  const f = useCurrentFrame();
  const q = wf(10, 'turned'); const b = wf(10, 'below');
  const card = (at: number, l: string, t: string, x: number, col: string) => f < at ? null : (
    <div style={{ position: 'absolute', left: x, top: 1000, width: 440, transform: `scale(${0.8 + 0.2 * ease(f, at, at + 8)})`, opacity: lin(f, at, at + 6), background: 'rgba(14,10,6,0.88)', border: `4px solid ${col}`, padding: '18px 22px', textAlign: 'center' }}>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 40, color: col }}>{l}</div>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 58, color: '#fff' }}>{t}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: '#0b0805' }}>
      <Img src={staticFile('assets/archival/pm.jpg')} style={{ position: 'absolute', inset: -60, width: W + 120, height: H + 120, objectFit: 'cover', filter: 'blur(26px) brightness(0.35) grayscale(1)' }} />
      <Print src="assets/archival/pm.jpg" at={0} out={q} y={430} w={900} h={640} rot={-2} label="PRIME MINISTER · 1940s" pos="70% 30%" />
      {f >= q && <div style={{ position: 'absolute', left: 0, right: 0, top: 180, textAlign: 'center', opacity: lin(f, q, q + 8), fontFamily: HEAD, fontWeight: 700, fontSize: 72, color: '#fff', textShadow: '0 8px 24px #000' }}>£25. WOULD YOU TURN HIM IN?</div>}
      {card(q, 'A', 'TURN HIM IN', 70, C.redHi)}
      {card(q + 10, 'B', 'HIDE HIM', 570, '#6fbf73')}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1600, textAlign: 'center', opacity: lin(f, b + 20, b + 30) }}>
        <span style={{ background: C.red, color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 40, padding: '12px 30px', letterSpacing: 2 }}>FOLLOW · BURIED CHRONICLES</span>
      </div>
    </AbsoluteFill>
  );
};

export const SCENE_COMPS = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10];
