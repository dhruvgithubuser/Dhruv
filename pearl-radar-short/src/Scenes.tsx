import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { Particles } from './kit';
import { Shake } from './vfx';
import { C, H, HEAD, SANS, SCENES, SERIF, TYPE, W, ease, hash01, lin, pf, wf } from './theme';

/*
 * "The Radar Operators Who Saw Pearl Harbor Coming" (7 December 1941) - cinematic documentary Short.
 * Every shot is a still turned into a moving camera shot (depth parallax, scripts/parallax.py):
 * r* are dramatized reconstructions (labelled on screen). Real photos (SCR-270 set, the original Opana plot,
 * Kermit Tyler, Battleship Row from a Japanese plane, USS Arizona) are shown as framed prints.
 */

// length (s) of each parallax clip, as rendered by scripts/parallax.py
const CLIP_S: Record<string, number> = {
  r01_hero: 10, r02_opana: 10, r03_van: 10, r04_scope: 9, r05_phone: 10, r06_tyler: 10, r07_b17: 8, r08_jp: 9, r09_harbor: 9, r10_dusk: 9,
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

/** SCR-270 "A-scope": a green oscilloscope trace; the echo is a spike whose position is the range. */
const AScope: React.FC<{ at: number; r0: number; r1: number; dur: number; out?: number; lost?: number; y?: number; caption?: string }> = ({ at, r0, r1, dur, out, lost, y = 560, caption }) => {
  const f = useCurrentFrame();
  if (f < at || (out !== undefined && f >= out)) return null;
  const o = lin(f, at, at + 8) * (out !== undefined ? 1 - lin(f, out - 6, out) : 1);
  const X0 = 110, X1 = 970, Y0 = 330;
  const range = r0 + (r1 - r0) * ease(f, at, at + dur);
  const sx = X0 + ((X1 - X0) * range) / 150;
  const amp = lost !== undefined ? 1 - lin(f, lost, lost + 10) : 1;
  const pts: string[] = [];
  for (let x = X0; x <= X1; x += 6) {
    const g = 10 * (hash01(x * 7 + f, 3) - 0.5) + (x < X0 + 70 ? 140 * Math.exp(-(x - X0) / 22) : 0);
    const d = x - sx; const spike = amp * 210 * Math.exp(-(d * d) / 140) * (0.85 + 0.15 * hash01(f, 9));
    pts.push(`${x},${Y0 - g - spike}`);
  }
  return (
    <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: y - 140, opacity: o }}>
      <rect x={70} y={120} width={940} height={300} rx={40} fill="rgba(4,18,8,0.92)" stroke="#2b4a30" strokeWidth={6} />
      {Array.from({ length: 16 }, (_, i) => <line key={i} x1={X0 + ((X1 - X0) * i) / 15} y1={140} x2={X0 + ((X1 - X0) * i) / 15} y2={400} stroke="rgba(120,255,150,0.12)" strokeWidth={2} />)}
      <polyline points={pts.join(' ')} fill="none" stroke="#9dffb0" strokeWidth={4} style={{ filter: 'drop-shadow(0 0 8px #5dff7a)' }} />
      {[0, 50, 100, 150].map((m) => <text key={m} x={X0 + ((X1 - X0) * m) / 150} y={448} textAnchor="middle" fontFamily={TYPE} fontWeight={700} fontSize={24} fill="#9dffb0">{m} MI</text>)}
      {amp > 0.05 && <text x={sx - 30} y={Y0 - 150} textAnchor="end" fontFamily={HEAD} fontWeight={700} fontSize={40} fill="#fff" opacity={amp}>{Math.round(range)} MILES</text>}
      {caption && <text x={540} y={100} textAnchor="middle" fontFamily={TYPE} fontWeight={700} fontSize={28} letterSpacing={3} fill="#9dffb0">{caption}</text>}
    </svg>
  );
};

/** Green phosphor glow pulsing on the operator's face. */
const Glow: React.FC<{ o?: number }> = ({ o = 0.1 }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ background: `rgba(80,255,120,${o * (0.6 + 0.4 * hash01(f, 4))})`, mixBlendMode: 'screen' }} />;
};

/** The hook as a headline, fully visible on frame 0 (matches the YouTube title). */
const HookTitle: React.FC<{ out: number }> = ({ out }) => {
  const f = useCurrentFrame();
  if (f >= out) return null;
  const o = 1 - lin(f, out - 8, out);
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top: 170, opacity: o, textAlign: 'center' }}>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 76, lineHeight: 1.02, color: '#fff', whiteSpace: 'nowrap', textShadow: '0 6px 0 #000, 0 10px 30px rgba(0,0,0,0.9)', letterSpacing: 1 }}>PEARL HARBOR WAS ON RADAR</div>
      <div style={{ display: 'inline-block', marginTop: 14, background: 'rgba(4,18,8,0.88)', border: '5px solid #7dff95', padding: '4px 26px', fontFamily: HEAD, fontWeight: 700, fontSize: 108, color: '#9dffb0', textShadow: '0 0 18px #3dff6a' }}>46 MINUTES EARLY</div>
      <div style={{ marginTop: 16, fontFamily: TYPE, fontWeight: 700, fontSize: 32, letterSpacing: 4, color: C.gold, textShadow: '0 3px 10px #000' }}>OAHU · 7 DECEMBER 1941 · 7:02 AM</div>
    </div>
  );
};

// S01 hook: the operator, the warning on screen from frame 0.
const S01: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="r01_hero" from={0} to={end(1)} fadeIn={0} />
    <Glow o={0.08} />
    <Dim />
    <HookTitle out={wf(1, 'so')} />
    <Verdict at={wf(1, 'so')} text="2,400+ DEAD" y={1080} rot={-6} />
  </AbsoluteFill>
);

// S02 Opana Point, the two privates, the SCR-270 set.
const S02: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="r02_opana" from={0} to={end(2)} />
    <Dim />
    <Slate at={4} place="OPANA POINT, OAHU" date="7 DECEMBER 1941" out={wf(2, 'two')} />
    <Chips top={190} items={[{ at: wf(2, 'joseph'), t: 'PVT. JOSEPH LOCKARD' }, { at: wf(2, 'george'), t: 'PVT. GEORGE ELLIOTT' }]} />
    <Print src="assets/archival/scr270.jpg" at={wf(2, 'mobile')} y={520} w={640} h={600} rot={-3} label="AN SCR-270 MOBILE RADAR" pos="50% 40%" />
  </AbsoluteFill>
);

// S03 four hours a day, due off at 7, the breakfast truck is late.
const S03: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="r03_van" from={0} to={end(3)} />
    <Glow o={0.05} />
    <Dim />
    <Chips top={300} items={[{ at: wf(3, 'four'), t: '4 HOURS A DAY' }, { at: wf(3, 'shut'), t: 'SHUT DOWN AT 7:00' }, { at: wf(3, 'late'), t: 'BREAKFAST TRUCK: LATE' }]} />
    <Verdict at={wf(3, 'practicing')} text="STILL ON" color="#7dff95" y={1080} rot={-6} />
  </AbsoluteFill>
);

// S04 7:02, the echo, 130 miles north.
const S04: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="r04_scope" from={0} to={end(4)} />
    <Glow o={0.06} />
    <Dim top={0.6} bottom={0.7} />
    <Slate at={2} place="7:02 AM" date="ECHO · FROM THE NORTH" />
    <AScope at={wf(4, 'huge') - 4} r0={132} r1={124} dur={end(4)} y={620} caption="SCR-270 · RANGE SCOPE (RECONSTRUCTION)" />
    <Chips top={1060} items={[{ at: wf(4, 'more'), t: 'MORE THAN THEY HAD EVER SEEN' }]} />
  </AbsoluteFill>
);

// S05 the phone call, Fort Shafter, Lt Kermit Tyler.
const S05: React.FC = () => {
  const of = wf(5, 'officer');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="r05_phone" from={0} to={of + 6} />
      <Shot name="r06_tyler" from={of} to={end(5)} />
      <Dim />
      <Slate at={wf(5, 'information')} place="FORT SHAFTER" date="INFORMATION CENTER" out={of} />
      <Print src="assets/archival/tyler.jpg" at={wf(5, 'kermit')} y={560} w={560} h={560} rot={-3} label="KERMIT TYLER · LATER PHOTO" pos="50% 25%" />
      <Chips top={190} items={[{ at: wf(5, 'week'), t: '1 WEEK ON THE JOB' }, { at: wf(5, 'training'), t: 'ALMOST NO TRAINING' }]} />
    </AbsoluteFill>
  );
};

// S06 six B-17s due from the mainland: "not to worry".
const S06: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="r07_b17" from={0} to={end(6)} />
    <Dim />
    <Chips top={300} items={[{ at: wf(6, 'six'), t: '6 × B-17 BOMBERS' }, { at: wf(6, 'mainland'), t: 'FROM THE MAINLAND' }]} />
    <Verdict at={wf(6, 'worry')} text="NOT TO WORRY" y={1080} rot={-6} />
  </AbsoluteFill>
);

// S07 they keep tracking: the real Opana plot; contact lost at 7:40.
const S07: React.FC = () => (
  <AbsoluteFill style={{ background: '#0b0805' }}>
    <Img src={staticFile('assets/archival/plot.jpg')} style={{ position: 'absolute', inset: -60, width: W + 120, height: H + 120, objectFit: 'cover', filter: 'blur(26px) brightness(0.35) grayscale(1)' }} />
    <Print src="assets/archival/plot.jpg" at={0} y={400} w={640} h={780} rot={-2} label="THE REAL OPANA PLOT · 7 DEC 1941" pos="50% 35%" />
    <Slate at={wf(7, '740') - 4} place="7:40 AM" date="OPANA · NORTH OAHU" />
    <Verdict at={wf(7, 'contact')} text="CONTACT LOST" y={860} rot={-8} />
  </AbsoluteFill>
);

// S08 7:48, the attack; 2,400+ dead.
const S08: React.FC = () => {
  const st = wf(8, 'strike'); const by = wf(8, 'by');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shake hits={[st, st + 10]} amp={18}>
        <Shot name="r08_jp" from={0} to={st + 6} />
        <Shot name="r09_harbor" from={st} to={end(8)} />
        <Haze color="60,55,50" o={0.4} y={900} />
      </Shake>
      <Flash at={st} />
      <Dim />
      <Slate at={4} place="7:48 AM" date="THE FIRST WAVE" out={st} />
      <Print src="assets/archival/jpview.jpg" at={st + 4} out={by} y={560} w={900} h={620} rot={-2} label="TAKEN FROM A JAPANESE PLANE" pos="50% 50%" />
      <Print src="assets/archival/arizona.jpg" at={by} y={560} w={900} h={620} rot={2} label="USS ARIZONA · 7 DEC 1941" pos="50% 50%" />
      <Count at={wf(8, 'over')} to={2400} suffix="+" label="AMERICANS KILLED" />
    </AbsoluteFill>
  );
};

// S09 the inquiry: cleared.
const S09: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="r06_tyler" from={0} to={end(9)} />
    <Dim top={0.6} bottom={0.7} />
    <Doc at={4} title="INQUIRY · AUGUST 1942" lines={['LT. KERMIT TYLER, INFORMATION CENTER', 'NO TRAINING', 'NO SUPERVISION', 'NO STAFF']} stamp={{ at: wf(9, 'cleared'), t: 'CLEARED' }} y={330} />
  </AbsoluteFill>
);

// S10 the warning came in time; the question.
const S10: React.FC = () => {
  const f = useCurrentFrame();
  const q = wf(10, 'would'); const b = wf(10, 'below');
  const card = (at: number, l: string, t: string, x: number, col: string) => f < at ? null : (
    <div style={{ position: 'absolute', left: x, top: 1000, width: 440, transform: `scale(${0.8 + 0.2 * ease(f, at, at + 8)})`, opacity: lin(f, at, at + 6), background: 'rgba(14,10,6,0.88)', border: `4px solid ${col}`, padding: '18px 22px', textAlign: 'center' }}>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 40, color: col }}>{l}</div>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 52, color: '#fff' }}>{t}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="r10_dusk" from={0} to={end(10) + 40} />
      <Dim top={0.6} bottom={0.75} />
      {f < q && <div style={{ position: 'absolute', left: 60, right: 60, top: 300, textAlign: 'center', opacity: lin(f, 4, 12), fontFamily: HEAD, fontWeight: 700, fontSize: 70, color: '#fff', textShadow: '0 8px 24px #000' }}>THE WARNING CAME IN TIME</div>}
      {f >= q && <div style={{ position: 'absolute', left: 40, right: 40, top: 300, textAlign: 'center', opacity: lin(f, q, q + 8), fontFamily: HEAD, fontWeight: 700, fontSize: 68, color: '#fff', textShadow: '0 8px 24px #000' }}>WOULD YOU HAVE SOUNDED THE ALARM?</div>}
      {card(q, 'A', 'SOUND IT', 70, C.redHi)}
      {card(q + 10, 'B', 'TRUST THE OFFICER', 570, '#6fbf73')}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1600, textAlign: 'center', opacity: lin(f, b + 10, b + 20) }}>
        <span style={{ background: C.red, color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 40, padding: '12px 30px', letterSpacing: 2 }}>FOLLOW · BURIED CHRONICLES</span>
      </div>
    </AbsoluteFill>
  );
};

export const SCENE_COMPS = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10];
