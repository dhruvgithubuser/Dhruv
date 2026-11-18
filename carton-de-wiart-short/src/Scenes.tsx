import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { Particles, Quote } from './kit';
import { Explosion, Shake, VfxDefs } from './vfx';
import { C, H, HEAD, SANS, SCENES, TYPE, W, ease, hash01, lin, pf, wf } from './theme';

/*
 * "The British General Who Couldn't Be Killed" - cinematic documentary Short.
 * Every shot is a still turned into a moving camera shot (depth parallax, scripts/parallax.py):
 * a01/a02/a04/a13 are real archive photographs, g* are dramatized reconstructions (labelled on screen).
 */

// length (s) of each parallax clip, as rendered by scripts/parallax.py
const CLIP_S: Record<string, number> = {
  a01_cairo: 8, a02_young: 6, g02_boer: 6, g03_fort: 8, a04_beaton: 5, g05_trench: 8, g06_hospital: 4, g07_somme: 6,
  g09_crash: 5, g09_beach: 5, g10_castle: 4, g10_tunnel: 5, g11_peasant: 9, g12_book: 7, a13_cairo: 6,
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

/** The Victoria Cross: bronze cross pattee on its crimson ribbon, slow push and a light sweep. */
const VCMedal: React.FC = () => {
  const f = useCurrentFrame();
  const arm = 'M-46 -60 Q-70 -170 -150 -250 L150 -250 Q70 -170 46 -60 Z';
  const sweep = -400 + 16 * f;
  return (
    <AbsoluteFill style={{ opacity: lin(f, 0, 8), background: 'radial-gradient(ellipse 80% 60% at 50% 55%, #3a0f12 0%, #14040a 60%, #050102 100%)' }}>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, transform: `scale(${1 + 0.08 * lin(f, 0, 150)}) rotate(${-2 + 2 * lin(f, 0, 150)}deg)`, transformOrigin: '50% 60%' }}>
        <defs>
          <linearGradient id="ribbon" x1="0" x2="1"><stop offset="0" stopColor="#4a0c12" /><stop offset="0.25" stopColor="#9b1b26" /><stop offset="0.5" stopColor="#7d1520" /><stop offset="0.8" stopColor="#a52330" /><stop offset="1" stopColor="#4a0c12" /></linearGradient>
          <linearGradient id="bronze" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c99a62" /><stop offset="0.45" stopColor="#8a5f34" /><stop offset="0.7" stopColor="#a8784a" /><stop offset="1" stopColor="#4d3219" /></linearGradient>
          <linearGradient id="shine" x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="0.5" stopColor="#ffe9c0" stopOpacity="0.55" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
          <clipPath id="vcclip"><g transform="translate(540 1180)">{[0, 90, 180, 270].map((r) => <path key={r} d={arm} transform={`rotate(${r})`} />)}<circle r={92} /></g></clipPath>
        </defs>
        <rect x={400} y={-20} width={280} height={880} fill="url(#ribbon)" />
        {Array.from({ length: 40 }, (_, i) => <line key={i} x1={400} x2={680} y1={i * 22} y2={i * 22 + 4} stroke="rgba(0,0,0,0.12)" strokeWidth={2} />)}
        <rect x={390} y={850} width={300} height={46} rx={10} fill="url(#bronze)" stroke="#3a2412" strokeWidth={4} />
        <path d="M505 896 L540 935 L575 896 Z" fill="url(#bronze)" stroke="#3a2412" strokeWidth={4} />
        <circle cx={540} cy={938} r={16} fill="none" stroke="#7a542c" strokeWidth={10} />
        <g transform="translate(540 1180)" style={{ filter: 'drop-shadow(0 18px 30px rgba(0,0,0,0.8))' }}>
          {[0, 90, 180, 270].map((r) => <path key={r} d={arm} transform={`rotate(${r})`} fill="url(#bronze)" stroke="#3a2412" strokeWidth={6} />)}
          <circle r={96} fill="url(#bronze)" stroke="#3a2412" strokeWidth={6} />
          <path d="M-62 -18 L-62 -62 L-34 -40 L0 -74 L34 -40 L62 -62 L62 -18 Z" fill="#6e4a26" stroke="#3a2412" strokeWidth={4} />
          <path d="M-60 6 Q-20 -14 20 4 Q46 14 62 0 L62 30 Q20 44 -60 34 Z" fill="#7b5430" stroke="#3a2412" strokeWidth={3} />
          <rect x={-150} y={110} width={300} height={56} rx={8} fill="#6e4a26" stroke="#3a2412" strokeWidth={4} />
          <text x={0} y={150} textAnchor="middle" fontFamily="Playfair" fontWeight={900} fontSize={38} fill="#d9b27a" letterSpacing={3}>FOR VALOUR</text>
        </g>
        <rect x={sweep} y={850} width={260} height={700} fill="url(#shine)" clipPath="url(#vcclip)" transform="skewX(-20)" />
      </svg>
    </AbsoluteFill>
  );
};

/* ───────────── scenes ───────────── */

// S01 hook: the real man, eye patch and pipe. Camera pushes in to his face.
const S01: React.FC = () => {
  const f = useCurrentFrame();
  const nine = wf(1, '9');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="a01_cairo" from={0} to={end(1)} fadeIn={0} />
      <Dim />
      <Particles kind="ash" n={40} o={0.5} />
      {f >= nine && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 200, textAlign: 'center', transform: `scale(${1.25 - 0.25 * ease(f, nine, nine + 8)})`, opacity: lin(f, nine, nine + 5) }}>
          <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 210, lineHeight: 1, color: '#fff', textShadow: '0 10px 30px #000' }}>9</div>
          <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 64, letterSpacing: 8, color: C.redHi, textShadow: '0 4px 14px #000' }}>WOUNDS</div>
        </div>
      )}
      <Flash at={nine} color="255,90,60" />
    </AbsoluteFill>
  );
};

// S02 the young officer (real photo, before any wound), then the Boer War veld.
const S02: React.FC = () => {
  const sw = wf(2, 'sails');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="a02_young" from={0} to={sw + 8} />
      <Shot name="g02_boer" from={sw} to={end(2)} />
      <Haze color="214,190,150" o={0.3} />
      <Dim />
      <Slate at={6} place="CARTON DE WIART" date="BORN BRUSSELS · 1880" out={sw} />
      <Slate at={sw + 4} place="SOUTH AFRICA" date="BOER WAR · 1901" />
      <Wound at={wf(2, 'bullet')} n={1} text="STOMACH" />
    </AbsoluteFill>
  );
};

// S03 Somaliland: the attack on the desert fort, rifle fire, dust.
const S03: React.FC = () => {
  const shot = wf(3, 'shot');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shake hits={[shot, shot + 6]} amp={18}>
        <Shot name="g03_fort" from={0} to={end(3)} />
        <Flashes pts={[[330, 1290], [560, 1300], [880, 1330], [700, 980], [420, 1010]]} />
        <Haze color="226,204,160" o={0.4} y={1200} />
      </Shake>
      <Dim />
      <Flash at={shot} color="255,80,60" />
      <Slate at={4} place="SOMALILAND" date="1914" />
      <Wound at={wf(3, 'face')} n={2} text="FACE · EYE · EAR" />
    </AbsoluteFill>
  );
};

// S04 the eye patch (real photo, 1940s).
const S04: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="a04_beaton" from={0} to={end(4)} />
    <Dim />
  </AbsoluteFill>
);

// S05 Western Front 1915: shellfire, the hand.
const S05: React.FC = () => {
  const sh = wf(5, 'shell');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shake hits={[sh, sh + 30]} amp={26}>
        <Shot name="g05_trench" from={0} to={end(5)} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}><VfxDefs /><Explosion at={sh} x={760} y={760} s={1.2} seed={5} /><Explosion at={sh + 30} x={260} y={820} s={0.8} seed={9} /></svg>
        <Particles kind="embers" n={50} o={0.7} />
      </Shake>
      <Flash at={sh} />
      <Dim />
      <Slate at={4} place="WESTERN FRONT" date="1915" />
      <Wound at={wf(5, 'hand')} n={3} text="LEFT HAND" />
    </AbsoluteFill>
  );
};

// S06 field hospital.
const S06: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Shot name="g06_hospital" from={0} to={end(6)} />
    <Dim />
    <Wound at={0} n={3} text="HAND AMPUTATED" />
  </AbsoluteFill>
);

// S07 the Somme, then the Victoria Cross.
const S07: React.FC = () => {
  const vc = wf(7, 'wins');
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shake hits={[20, 75, 140]} amp={14}>
        <Shot name="g07_somme" from={0} to={vc + 6} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}><VfxDefs /><Explosion at={20} x={820} y={720} s={0.9} seed={3} /><Explosion at={75} x={240} y={680} s={0.7} seed={8} /><Explosion at={140} x={600} y={640} s={0.8} seed={12} /></svg>
        <Haze o={0.35} y={900} color="170,160,150" />
      </Shake>
      <Sequence from={vc - 4} layout="none"><VCMedal /></Sequence>
      <Dim />
      <Slate at={4} place="THE SOMME" date="JULY 1916" out={vc} />
      {f >= vc && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 230, textAlign: 'center', opacity: lin(f, vc, vc + 8) }}>
          <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 96, color: C.gold, letterSpacing: 4, textShadow: '0 6px 20px #000' }}>VICTORIA CROSS</div>
          <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 32, color: '#f6ecd4', letterSpacing: 3, textShadow: '0 3px 10px #000' }}>"MOST CONSPICUOUS BRAVERY"</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// S08 the medical record: a figure on aged paper, each wound marked as it is spoken.
const S08: React.FC = () => {
  const f = useCurrentFrame();
  const marks: { w: string; x: number; y: number; label: string }[] = [
    { w: 'skull', x: 548, y: 300, label: 'SKULL' }, { w: 'ankle', x: 470, y: 1395, label: 'ANKLE' }, { w: 'hip', x: 610, y: 850, label: 'HIP' },
    { w: 'leg', x: 600, y: 1130, label: 'LEG' }, { w: 'ear', x: 478, y: 330, label: 'EAR' },
  ];
  const ev = wf(8, 'every');
  return (
    <AbsoluteFill style={{ background: '#d9c9a4' }}>
      <Img src={staticFile('assets/backgrounds/paper.jpg')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55, mixBlendMode: 'multiply' }} />
      <AbsoluteFill style={{ transform: `scale(${1 + 0.05 * lin(f, 0, 180)})` }}>
        <div style={{ position: 'absolute', left: 60, top: 150, fontFamily: TYPE, fontWeight: 700, fontSize: 30, color: C.ink, letterSpacing: 2, lineHeight: 1.5 }}>
          WAR OFFICE · MEDICAL RECORD<br />BRIG.-GEN. A. CARTON DE WIART, VC
        </div>
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <g fill="none" stroke="#3a2c1c" strokeWidth={5} strokeLinejoin="round" opacity={0.85}>
            <ellipse cx={540} cy={330} rx={62} ry={74} />
            <path d="M505 405 L500 445 Q420 460 400 520 L360 820 L395 830 L440 560 L450 860 L440 1150 L455 1420 L520 1420 L530 1150 L540 960 L550 1150 L560 1420 L625 1420 L640 1150 L630 860 L640 560 L670 700 L690 760" />
            <path d="M575 405 L580 445 Q660 460 680 520 L690 760" />
            <path d="M690 760 L700 690" strokeDasharray="10 10" />
          </g>
          <text x={720} y={740} fontFamily={TYPE} fontWeight={700} fontSize={26} fill={C.red}>NO LEFT HAND</text>
          {marks.map((m, i) => {
            const at = wf(8, m.w); const k = lin(f, at, at + 6);
            if (f < at) return null;
            const lx = m.x > 540 ? m.x + 70 : m.x - 70;
            return (
              <g key={i} opacity={k}>
                <circle cx={m.x} cy={m.y} r={34 + 30 * (1 - k)} fill="none" stroke={C.red} strokeWidth={7} />
                <line x1={m.x - 14} y1={m.y - 14} x2={m.x + 14} y2={m.y + 14} stroke={C.red} strokeWidth={7} />
                <line x1={m.x + 14} y1={m.y - 14} x2={m.x - 14} y2={m.y + 14} stroke={C.red} strokeWidth={7} />
                <text x={lx} y={m.y + 10} textAnchor={m.x > 540 ? 'start' : 'end'} fontFamily={HEAD} fontWeight={700} fontSize={44} fill={C.red}>{m.label}</text>
              </g>
            );
          })}
        </svg>
      </AbsoluteFill>
      {f >= ev && (
        <div style={{ position: 'absolute', right: 50, top: 1480, transform: `rotate(-6deg) scale(${1.3 - 0.3 * ease(f, ev, ev + 8)})`, opacity: lin(f, ev, ev + 5), border: `7px solid ${C.red}`, padding: '8px 26px', fontFamily: HEAD, fontWeight: 700, fontSize: 60, color: C.red, background: 'rgba(246,236,212,0.85)' }}>RETURNED TO DUTY</div>
      )}
    </AbsoluteFill>
  );
};

// S09 1941: the bomber in the sea, then captured on the beach.
const S09: React.FC = () => {
  const cr = wf(9, 'crashes'); const sw = wf(9, 'swims');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shake hits={[cr]} amp={24}>
        <Shot name="g09_crash" from={0} to={sw + 6} />
        <Haze color="190,200,205" o={0.35} y={1000} />
      </Shake>
      <Shot name="g09_beach" from={sw} to={end(9)} />
      <Flash at={cr} color="220,230,255" />
      <Dim />
      <Slate at={4} place="OFF LIBYA" date="APRIL 1941 · AGE 60" out={sw} />
      <Slate at={wf(9, 'captured')} place="CAPTURED" date="PRISONER OF ITALY" />
    </AbsoluteFill>
  );
};

// S10 the castle prison and the tunnel.
const S10: React.FC = () => {
  const f = useCurrentFrame();
  const dg = wf(10, 'digs');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="g10_castle" from={0} to={dg + 6} />
      <Shot name="g10_tunnel" from={dg} to={end(10)} />
      <AbsoluteFill style={{ background: `rgba(255,170,80,${f > dg ? 0.06 + 0.05 * hash01(f, 7) : 0})`, mixBlendMode: 'screen' }} />
      <Dim />
      <Slate at={4} place="CASTELLO DI VINCIGLIATA" date="ITALY · 1942" out={dg} />
      {f >= wf(10, 'seven') && (
        <div style={{ position: 'absolute', right: 50, top: 200, textAlign: 'right', opacity: lin(f, wf(10, 'seven'), wf(10, 'seven') + 6) }}>
          <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 150, lineHeight: 1, color: '#fff', textShadow: '0 8px 24px #000' }}>7</div>
          <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 46, color: C.gold, letterSpacing: 4, textShadow: '0 4px 12px #000' }}>MONTHS DIGGING</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// S11 on the run, disguised as a peasant.
const S11: React.FC = () => {
  const f = useCurrentFrame();
  const facts = [{ w: '62', t: 'AGE 62' }, { w: 'eye', t: 'ONE EYE' }, { w: 'hand', t: 'ONE HAND' }, { w: 'speak', t: 'NO ITALIAN' }];
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="g11_peasant" from={0} to={end(11)} />
      <Haze color="225,225,215" o={0.45} y={900} />
      <Dim />
      <Slate at={4} place="ON THE RUN" date="8 DAYS FREE" />
      <div style={{ position: 'absolute', right: 50, top: 190, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14 }}>
        {facts.map((x, i) => {
          const at = wf(11, x.w); if (f < at) return null;
          return <div key={i} style={{ background: 'rgba(14,10,6,0.82)', border: `3px solid ${C.gold}`, padding: '6px 18px', fontFamily: HEAD, fontWeight: 700, fontSize: 42, color: '#f6ecd4', letterSpacing: 2, transform: `translateX(${40 * (1 - lin(f, at, at + 6))}px)`, opacity: lin(f, at, at + 6) }}>{x.t}</div>;
        })}
      </div>
    </AbsoluteFill>
  );
};

// S12 the memoir.
const S12: React.FC = () => {
  const fr = wf(12, 'frankly');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="g12_book" from={0} to={end(12)} />
      <Dim top={0.5} bottom={0.5} />
      <Slate at={4} place="1880 – 1963" date="DIED AT HOME · AGE 83" out={fr} />
      <Quote at={fr} text="Frankly, I had enjoyed the war." by="CARTON DE WIART, HAPPY ODYSSEY (1950)" x={70} y={220} w={940} />
    </AbsoluteFill>
  );
};

// S13 call to action over the real man.
const S13: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot name="a13_cairo" from={0} to={end(13)} />
      <Dim />
      <Particles kind="embers" n={40} o={0.6} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 210, textAlign: 'center', opacity: lin(f, 4, 12) }}>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 104, color: '#fff', textShadow: '0 8px 24px #000' }}>WHO WAS <span style={{ color: C.gold }}>TOUGHER?</span></div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1600, textAlign: 'center', opacity: lin(f, pf(13, 0) + 40, pf(13, 0) + 50) }}>
        <span style={{ background: C.red, color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 40, padding: '12px 30px', letterSpacing: 2 }}>FOLLOW · BURIED CHRONICLES</span>
      </div>
    </AbsoluteFill>
  );
};

export const SCENE_COMPS = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13];
