import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Cam, Card, Circle, Counter, Hl, Kinetic, Note, Paper, Quote, Source, Stamp, Tag } from './components/VoxKit';
import { EuroMap, PL, lerpView, proj, type View } from './components/EuroMap';
import { Cannon, Cyclist, GI, Medal, Radio, Sherman, SoundTruck, Truck } from './components/Icons';
import { C, MONO, SANS, TYPE, ease, hash01, lin, noise1, wf } from './theme';

const VEU: View = { lon: 2.6, lat: 50.2, k: 118 };
const VRHINE: View = { lon: 6.6, lat: 51.4, k: 2200 };

const Sheet: React.FC<{ x: number; y: number; w: number; h: number; at: number; children?: React.ReactNode; rot?: number; bg?: string }> = ({ x, y, w, h, at, children, rot = 0, bg = C.sheet }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const k = spring({ frame: f - at, fps, config: { damping: 15, stiffness: 160 } });
  if (f < at) return null;
  return <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, transform: `translateY(${(1 - k) * 140}px) rotate(${rot}deg)`, background: bg, boxShadow: '0 16px 30px rgba(30,24,16,0.25)' }}>{children}</div>;
};
const Ground: React.FC<{ y: number }> = ({ y }) => (
  <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
    <rect x={0} y={y} width={1080} height={1920 - y} fill="#e3dccb" />
    <line x1={0} y1={y} x2={1080} y2={y} stroke={C.ink} strokeWidth={5} />
    {Array.from({ length: 14 }, (_, i) => <path key={i} d={`M${40 + i * 78 + hash01(i, 3) * 30},${y + 40 + hash01(i, 5) * 160} l8,-16 l8,16`} fill="none" stroke="rgba(28,27,26,0.3)" strokeWidth={3} />)}
  </svg>
);

/* ============ 1–2 · THE CYCLISTS ============ */
const LiftStage: React.FC<{ liftAt: number; held?: boolean; cycl: number; gis: number }> = ({ liftAt, held, cycl, gis }) => {
  const f = useCurrentFrame();
  const lift = held ? 1 : ease(f, liftAt, liftAt + 26);
  const bob = held ? 6 * Math.sin(f * 0.15) : 0;
  const ty = 1050 - lift * 150 + bob;
  const gx = [470, 580, 700, 810];
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      <Sherman x={650} y={ty} s={1.0} />
      {gx.map((x, i) => { const inn = held ? 1 : ease(f, gis + i * 4, gis + i * 4 + 16); return inn > 0 ? <g key={i} opacity={inn}><GI x={x + (1 - inn) * 400} y={1095} s={1.15} pose={lift > 0.05 ? 'lift' : 'walk'} phase={i} /></g> : null; })}
      {[0, 1].map((i) => { const k = held ? 1 : ease(f, cycl + i * 6, cycl + 30 + i * 6); return <Cyclist key={i} x={-260 + k * (i ? 530 : 370)} y={1110} s={0.95} roll={(1 - k) * 4} />; })}
    </svg>
  );
};
const S01: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Paper />
      <Ground y={1100} />
      <Tag text="France · 1944" at={4} x={60} y={120} size={32} />
      <LiftStage liftAt={wf(1, 'pick')} cycl={wf(1, 'two') - 10} gis={wf(1, 'four') - 6} />
      <Kinetic text="4 soldiers vs. a *33-ton* tank?" at={wf(1, 'soldiers') - 4} y={200} size={78} x={60} width={960} align="left" />
      {f > wf(1, 'tank') && <Kinetic text="?!" at={wf(1, 'tank')} y={860} size={120} x={60} width={200} align="left" color={C.red} />}
    </AbsoluteFill>
  );
};
const Bubble: React.FC<{ text: string; at: number; x: number; y: number; w: number }> = ({ text, at, x, y, w }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const k = spring({ frame: f - at, fps, config: { damping: 12, stiffness: 200 } }); if (f < at) return null;
  const n = Math.floor(lin(f, at + 4, at + 30) * text.length);
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, transform: `scale(${k})`, transformOrigin: '70% 100%' }}>
      <div style={{ background: '#fff', border: `6px solid ${C.ink}`, borderRadius: 40, padding: '28px 36px', fontFamily: SANS, fontWeight: 800, fontSize: 64, lineHeight: 1.1, color: C.ink }}>“{text.slice(0, n)}{n < text.length ? '' : '”'}</div>
      <svg width={80} height={70} style={{ position: 'absolute', right: 120, bottom: -60 }}><path d="M0,0 L60,64 L56,0 Z" fill="#fff" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" /><rect x={4} y={-6} width={52} height={8} fill="#fff" /></svg>
    </div>
  );
};
const S02: React.FC = () => (
  <AbsoluteFill>
    <Paper />
    <Ground y={1100} />
    <LiftStage liftAt={0} held cycl={0} gis={0} />
    <Tag text="Reportedly · veteran Arthur Shilstone's account" at={wf(2, 'reportedly') - 4} x={60} y={120} size={26} />
    <Bubble text="Americans are very strong." at={wf(2, 'americans') - 6} x={240} y={300} w={780} />
    <Source text="Source: Smithsonian Magazine; Beyer & Sayles, The Ghost Army of World War II (2015)" at={10} />
  </AbsoluteFill>
);

/* ============ 3 · IT WAS A BALLOON ============ */
const S03: React.FC = () => {
  const f = useCurrentFrame();
  const bal = wf(3, 'balloon'), w93 = wf(3, '93');
  const bar = ease(f, w93 - 14, w93 + 8);
  return (
    <AbsoluteFill>
      <Paper />
      <Card src="dummy" x={40} y={200} w={1000} rot={-1.5} at={0}>
        <Stamp text="INFLATABLE" at={bal} x={520} y={330} size={84} rot={-9} />
      </Card>
      <Sheet x={50} y={960} w={980} h={340} at={w93 - 20}>
        <div style={{ position: 'absolute', left: 30, top: 24, fontFamily: MONO, fontSize: 26, letterSpacing: 2, color: C.grey }}>REAL M4 SHERMAN ≈ 66,000 LB</div>
        <div style={{ position: 'absolute', left: 30, top: 66, height: 70, width: 920 * bar, background: C.oliveDk }} />
        <div style={{ position: 'absolute', left: 30, top: 170, fontFamily: MONO, fontSize: 26, letterSpacing: 2, color: C.red }}>GHOST ARMY DUMMY</div>
        <div style={{ position: 'absolute', left: 30, top: 212, height: 70, width: 6, background: C.red, opacity: lin(f, w93, w93 + 4) }} />
        <Counter from={0} to={93} at={w93} dur={12} x={70} y={200} size={86} color={C.red} suffix=" lb" />
        <div style={{ position: 'absolute', left: 380, top: 236, fontFamily: TYPE, fontWeight: 700, fontSize: 28, color: C.ink, opacity: lin(f, w93 + 10, w93 + 18) }}>← about 1/700th of a real tank</div>
      </Sheet>
      <Source text="Photo: inflatable M4 Sherman decoy, U.S. Army · Public domain" at={4} />
    </AbsoluteFill>
  );
};

/* ============ 4 · 1,100 → 30,000 ============ */
const S04: React.FC = () => {
  const f = useCurrentFrame();
  const g = wf(4, 'ghost'), men = wf(4, '1100'), look = wf(4, 'look');
  const cols = 20, rows = 15;
  return (
    <AbsoluteFill>
      <Paper />
      <Kinetic text="The *Ghost* Army" at={g - 6} y={150} size={104} x={60} width={960} align="left" />
      <Tag text="23rd Headquarters Special Troops" at={g + 4} x={64} y={290} size={28} />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        {Array.from({ length: cols * rows }, (_, i) => {
          const c = i % cols, r = Math.floor(i / cols); const x = 102 + c * 46, y = 470 + r * 46;
          if (i < 11) { const o = lin(f, men + i * 2, men + i * 2 + 6); return <circle key={i} cx={x} cy={y} r={17 * o} fill={C.olive} stroke={C.ink} strokeWidth={3} />; }
          const o = lin(f, look - 6 + (r + c) * 0.9, look + (r + c) * 0.9);
          return o > 0 ? <circle key={i} cx={x} cy={y} r={15} fill="#fff" stroke={C.grey} strokeWidth={2.5} strokeDasharray="5 4" opacity={o} /> : null;
        })}
      </svg>
      <Sheet x={60} y={1190} w={960} h={130} at={men - 4}>
        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'space-around', fontFamily: SANS, fontWeight: 800, fontSize: 44 }}>
          <div style={{ color: C.olive }}>● 1,100 real men</div>
          <div style={{ color: C.grey, opacity: lin(f, look, look + 8) }}>◌ looked like 30,000</div>
        </div>
      </Sheet>
      <Note text="1 dot = 100 men" at={men + 10} x={820} y={1330} size={22} rot={0} />
    </AbsoluteFill>
  );
};

/* ============ 5 · ARTISTS ============ */
const ARTISTS = [['Bill Blass', 'fashion designer'], ['Ellsworth Kelly', 'painter'], ['Arthur Singer', 'wildlife artist'], ['Art Kane', 'photographer']];
const S05: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Paper />
      <Kinetic text="Soldiers who were *artists*" at={wf(5, 'artists') - 6} y={150} size={92} x={60} width={960} align="left" />
      {ARTISTS.map(([n, r], i) => (
        <Sheet key={n} x={70 + (i % 2) * 480} y={420 + Math.floor(i / 2) * 330} w={450} h={290} at={14 + i * 9} rot={i % 2 ? 2 : -2}>
          <svg width={450} height={150} style={{ position: 'absolute', left: 0, top: 0 }}>
            <path d={`M40,110 C${90 + i * 10},${30 + i * 8} ${200 - i * 6},${130 - i * 9} ${300 + i * 8},50 S400,${100 + i * 4} 420,70`} fill="none" stroke={[C.red, C.navy, C.olive, C.ink][i]} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray={`${ease(f, 18 + i * 9, 40 + i * 9)} 1`} />
          </svg>
          <div style={{ position: 'absolute', left: 30, top: 150, fontFamily: SANS, fontWeight: 800, fontSize: 46, color: C.ink }}>{n}</div>
          <div style={{ position: 'absolute', left: 30, top: 214, fontFamily: MONO, fontSize: 24, letterSpacing: 2, color: C.grey, textTransform: 'uppercase' }}>later: {r}</div>
        </Sheet>
      ))}
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1110, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 56, color: C.ink }}>
        {f >= wf(5, 'art') - 4 && <Hl at={wf(5, 'art')}>art schools</Hl>}{f >= wf(5, 'ad') - 4 && <> + <Hl at={wf(5, 'ad')}>ad agencies</Hl></>}
      </div>
    </AbsoluteFill>
  );
};

/* ============ 6 · INFLATE ============ */
const S06: React.FC = () => {
  const f = useCurrentFrame();
  const t = wf(6, 'tanks'), tr = wf(6, 'trucks'), cn = wf(6, 'cannons'), hrs = wf(6, 'few');
  const inf = (a: number) => ease(f, a - 6, a + 20);
  const wob = (a: number) => Math.max(0, 1 - lin(f, a + 14, a + 40));
  const clock = lin(f, hrs - 10, hrs + 30);
  return (
    <AbsoluteFill>
      <Paper />
      <Ground y={1180} />
      <Kinetic text="Unroll. *Inflate.* Camouflage." at={4} y={150} size={80} x={60} width={960} align="left" />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <Sherman x={300} y={760} s={0.72} inflate={inf(t)} wob={wob(t)} />
        <Truck x={800} y={760} s={1.05} inflate={inf(tr)} />
        <Cannon x={560} y={1180} s={1.25} inflate={inf(cn)} />
        <g transform="translate(860,1000)" opacity={lin(f, hrs - 10, hrs)}>
          <circle r={90} fill="#fff" stroke={C.ink} strokeWidth={8} />
          <path d={`M0,0 L${50 * Math.sin(clock * Math.PI * 2 * 3)},${-50 * Math.cos(clock * Math.PI * 2 * 3)}`} stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
          <path d={`M0,0 L${36 * Math.sin(clock * Math.PI * 2 * 0.25)},${-36 * Math.cos(clock * Math.PI * 2 * 0.25)}`} stroke={C.red} strokeWidth={10} strokeLinecap="round" />
        </g>
      </svg>
      <Tag text="A few hours" at={hrs} x={770} y={1110} size={28} bg={C.red} />
      <Tag text="603rd Camouflage Engineers" at={t} x={60} y={370} size={26} />
      <Source text="Decoys built by U.S. Rubber and Goodyear · rubber tubes under rubberized canvas" at={t} />
    </AbsoluteFill>
  );
};

/* ============ 7 · SOUND + RADIO ============ */
const S07: React.FC = () => {
  const f = useCurrentFrame();
  const bl = wf(7, 'blasted'), car = wf(7, 'carried'), rad = wf(7, 'radio');
  const phaseB = ease(f, rad - 16, rad);
  const morse = '·−· ·− −·· ·· −−− / −−·− ·−· ··− ·−· ·−− ·−· ·− ·−· ···· / ···−· −−−−· ·· −· ··−· ·−·−·−';
  return (
    <AbsoluteFill>
      <Paper />
      <Ground y={1180} />
      <Kinetic text={f < rad - 10 ? 'Fake *sound*' : 'Fake *radio*'} at={f < rad - 10 ? 4 : rad - 10} y={150} size={104} x={60} width={960} align="left" />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <g transform={`translate(${-phaseB * 700},0)`}>
          <SoundTruck x={330} y={1180} s={1.1} blast={f >= bl ? (f - bl) / 90 : 0} R={760} />
        </g>
        <g transform={`translate(${(1 - phaseB) * 900},0)`}>
          <Radio x={540} y={1180} s={1.4} on={phaseB} />
        </g>
      </svg>
      {f < rad - 8 && <>
        <Tag text="3132nd Signal Service Co. · Bell Labs recordings" at={bl} x={60} y={300} size={24} />
        <div style={{ position: 'absolute', left: 560, top: 470, fontFamily: SANS, fontWeight: 800, fontSize: 40, color: C.red, opacity: lin(f, car - 6, car) }}>heard up to</div>
        <Counter from={0} to={15} at={car} dur={16} x={560} y={520} size={170} color={C.red} suffix=" mi" />
        <div style={{ position: 'absolute', left: 566, top: 700, fontFamily: MONO, fontSize: 26, color: C.grey, opacity: lin(f, car + 6, car + 12) }}>≈ 24 KM</div>
      </>}
      {f >= rad - 8 && <>
        <Tag text="“Spoof radio”" at={rad} x={60} y={300} size={30} bg={C.red} />
        <div style={{ position: 'absolute', left: 60, right: 60, top: 460, fontFamily: MONO, fontSize: 40, lineHeight: 1.5, color: C.ink, wordBreak: 'break-all' }}>{morse.slice(0, Math.floor(lin(f, rad, rad + 70) * morse.length))}</div>
        <Note text="Operators copied the style of real units' radio men" at={rad + 30} x={60} y={680} size={30} w={720} rot={0} />
      </>}
    </AbsoluteFill>
  );
};

/* ============ 8 · NORMANDY → RHINE ============ */
const OPS: [number, number][] = [[-1.2, 49.3], [-4.3, 48.4], [-3.8, 48.6], [1.0, 48.9], [5.9, 49.6], [6.1, 49.52], [6.3, 49.8], [6.5, 49.4], [6.2, 50.6], [6.4, 50.75], [6.0, 50.9], [6.4, 51.25], [6.2, 51.0]];
const S08: React.FC = () => {
  const f = useCurrentFrame();
  const tw = wf(8, 'twenty');
  const r = ease(f, 6, 90);
  return (
    <AbsoluteFill>
      <EuroMap view={VEU} cy={680}
        routes={[{ pts: ['normandy', 'brest', [-1.5, 48.5], 'paris', 'luxembourg', [6.3, 50.6], 'viersen'], p: r, color: C.olive, width: 13 }]}
        pins={[{ at: 'normandy', label: 'Normandy', o: lin(f, 4, 12), side: 't', size: 36 }, { at: 'brest', label: 'Brest', o: lin(f, 20, 28), side: 'b', size: 32 },
          { at: 'luxembourg', label: 'Luxembourg', o: lin(f, 50, 58), side: 'l', size: 32 }, { at: 'viersen', label: 'Rhine', o: lin(f, 80, 88), side: 'r', size: 40, color: C.red, big: true }]}
        labels={[{ at: [2.5, 47.4], text: 'FRANCE', o: 1, size: 54 }, { at: [8.6, 50.2], text: 'GERMANY', o: 1, size: 50 }, { at: [-2.0, 50.4], text: 'ENGLISH CHANNEL', o: 1, size: 28, color: 'rgba(28,27,26,0.35)' }]}>
        {(P) => <g>{OPS.map((o, i) => { const k = lin(f, 10 + i * 6, 16 + i * 6); const [x, y] = P(...o); return k > 0 ? <circle key={i} cx={x} cy={y} r={14 * k} fill="#fff" stroke={C.ink} strokeWidth={4} strokeDasharray="5 4" /> : null; })}</g>}
      </EuroMap>
      <Tag text="June 1944 → March 1945" at={2} x={60} y={110} size={30} />
      <Sheet x={60} y={1080} w={600} h={210} at={tw - 12}>
        <Counter from={0} to={20} at={tw - 8} dur={14} x={30} y={30} size={140} suffix="+" color={C.ink} />
        <div style={{ position: 'absolute', left: 330, top: 70, fontFamily: SANS, fontWeight: 800, fontSize: 40, lineHeight: 1.05, color: C.ink, opacity: lin(f, tw, tw + 6) }}>deception<br />operations</div>
      </Sheet>
    </AbsoluteFill>
  );
};

/* ============ 9–10 · OPERATION VIERSEN ============ */
const DUMMIES: [number, number][] = Array.from({ length: 44 }, (_, i) => [6.44 + hash01(i, 11) * 0.27, 51.22 + hash01(i, 12) * 0.14]);
const Badge: React.FC<{ x: number; y: number; text: string; at: number }> = ({ x, y, text, at }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const k = spring({ frame: f - at, fps, config: { damping: 11, stiffness: 220 } }); if (f < at) return null;
  return <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${k})`, background: '#fff', border: `5px dashed ${C.olive}`, borderRadius: 18, padding: '10px 22px', fontFamily: SANS, fontWeight: 800, fontSize: 48, color: C.olive, whiteSpace: 'nowrap' }}>{text} <span style={{ fontFamily: MONO, fontSize: 26, color: C.red }}>FAKE</span></div>;
};
const RhineLayer: React.FC<{ P: (a: number, b: number) => [number, number]; dAt: number; f: number }> = ({ P, dAt, f }) => (
  <g>
    {DUMMIES.map((d, i) => { const k = ease(f, dAt + i * 0.8, dAt + i * 0.8 + 8); const [x, y] = P(...d); return k > 0 ? <Sherman key={i} x={x} y={y} s={0.11} inflate={k} dummy /> : null; })}
  </g>
);
const S09: React.FC = () => {
  const f = useCurrentFrame();
  const v = lerpView(VEU, VRHINE, ease(f, 0, 70));
  const set = wf(9, 'set'), imp = wf(9, 'impersonated');
  return (
    <AbsoluteFill>
      <EuroMap view={v} cy={700} pins={[{ at: 'viersen', label: 'Viersen', o: lin(f, 60, 70), side: 'l', size: 38 }, { at: 'dusseldorf', label: 'Düsseldorf', o: lin(f, 60, 70), side: 'r', size: 32 }]}
        labels={[{ at: [6.86, 51.47], text: 'RHINE', o: lin(f, 60, 72), size: 40, color: '#2f6f93', rot: -70 }, { at: [6.38, 51.47], text: 'ALLIES', o: lin(f, 66, 78), size: 44, color: C.navy }, { at: [6.93, 51.3], text: 'GERMANS', o: lin(f, 66, 78), size: 44, color: C.german, rot: -70 }]}>
        {(P) => <RhineLayer P={P} dAt={set - 10} f={f} />}
      </EuroMap>
      <Tag text={`Operation Viersen · ${f < 70 ? 'March' : 'March 18–24'}, 1945`} at={wf(9, 'march') - 6} x={60} y={110} size={30} />
      <Sheet x={60} y={1140} w={470} h={160} at={set - 8}>
        <Counter from={0} to={600} at={set} dur={30} x={26} y={20} size={110} suffix="+" color={C.olive} />
        <div style={{ position: 'absolute', left: 300, top: 50, fontFamily: SANS, fontWeight: 800, fontSize: 34, lineHeight: 1.05, opacity: lin(f, set + 20, set + 26) }}>inflatable<br />dummies</div>
      </Sheet>
      <Badge x={330} y={330} text="30th Infantry Div." at={imp} />
      <Badge x={720} y={1000} text="79th Infantry Div." at={imp + 18} />
    </AbsoluteFill>
  );
};
const S10: React.FC = () => {
  const f = useCurrentFrame();
  const bait = wf(10, 'bait'), north = wf(10, 'north'), res = wf(10, 'resistance');
  return (
    <AbsoluteFill>
      <EuroMap view={VRHINE} cy={700}
        routes={[{ pts: [[7.05, 51.42], [6.86, 51.36], [6.76, 51.32]], p: ease(f, bait - 14, bait + 10), color: C.german, width: 12 }, { pts: [[7.1, 51.3], [6.86, 51.29], [6.79, 51.27]], p: ease(f, bait - 8, bait + 16), color: C.german, width: 12 },
          { pts: [[6.35, 51.6], [6.52, 51.57], [6.75, 51.56], [6.9, 51.58]], p: ease(f, north, north + 50), color: C.navy, width: 16 }]}
        pins={[{ at: 'viersen', label: 'Viersen', o: 1, side: 'l', size: 34 }, { at: 'rheinberg', label: 'Rheinberg', o: lin(f, north - 4, north + 6), side: 'l', size: 36, color: C.navy, big: true }]}
        labels={[{ at: [6.86, 51.47], text: 'RHINE', o: 1, size: 40, color: '#2f6f93', rot: -70 }, { at: [7.15, 51.36], text: 'GERMAN RESERVES', o: lin(f, bait - 10, bait), size: 24, color: C.german }]}>
        {(P) => <RhineLayer P={P} dAt={-200} f={f} />}
      </EuroMap>
      <Tag text="Night of March 23, 1945" at={north - 6} x={60} y={110} size={30} bg={C.navy} />
      <Card src="simpson" x={50} y={400} w={280} rot={-3} at={wf(10, 'ninth') - 10} from="left" />
      <Tag text="Lt. Gen. Simpson · Ninth Army" at={wf(10, 'ninth')} x={50} y={700} size={22} />
      <Card src="rhine" x={290} y={820} w={740} rot={-2} at={res - 22} from="bottom" />
      <Stamp text="LITTLE RESISTANCE" at={res + 4} x={660} y={1250} size={50} rot={-6} color={C.navy} />
      <Source text="Photo: U.S. troops crossing the Rhine, March 1945, U.S. Army · Public domain" at={res - 20} />
    </AbsoluteFill>
  );
};

/* ============ 11 · SECRET → GOLD MEDAL ============ */
const S11: React.FC = () => {
  const f = useCurrentFrame();
  const sec = wf(11, 'secret'), y96 = wf(11, '1996'), med = wf(11, '2022');
  return (
    <AbsoluteFill>
      <Paper />
      <Sheet x={110} y={200} w={860} h={560} at={0} rot={-2} bg="#e2c58c">
        <div style={{ position: 'absolute', left: 0, top: -50, width: 300, height: 60, background: '#e2c58c', borderRadius: '16px 16px 0 0' }} />
        <div style={{ position: 'absolute', left: 50, top: 50, fontFamily: TYPE, fontWeight: 700, fontSize: 38, color: C.ink, lineHeight: 1.5 }}>23RD HQ SPECIAL TROOPS<br />OPERATIONS 1944–1945<br />FILE NO. ████████</div>
        <Stamp text="TOP SECRET" at={6} x={430} y={300} size={86} rot={-8} />
        {f >= y96 && <Stamp text="DECLASSIFIED 1996" at={y96} x={430} y={455} size={64} rot={5} color={C.navy} />}
      </Sheet>
      <Counter plain from={1945} to={1996} at={sec} dur={y96 - sec + 6} x={540} y={800} size={120} align="center" color={f >= y96 ? C.navy : C.ink} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 930, textAlign: 'center', fontFamily: MONO, fontSize: 28, letterSpacing: 2, color: C.grey, opacity: lin(f, sec, sec + 8) }}>51 YEARS OF SILENCE</div>
      {f >= med - 8 && <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}><g transform={`translate(0,${(1 - ease(f, med - 8, med + 10)) * -600})`}><Medal x={270} y={1270} s={0.95} /></g></svg>}
      <Kinetic text="Congressional *Gold* Medal" at={wf(11, 'congressional') - 6} y={1010} size={60} x={440} width={600} align="left" />
      <Tag text="Signed into law Feb 1, 2022" at={med + 6} x={444} y={1170} size={24} />
      <Note text="(presented March 21, 2024)" at={med + 30} x={450} y={1240} size={24} rot={0} />
    </AbsoluteFill>
  );
};

/* ============ 12 · ENDING ============ */
const S12: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Paper />
      <Kinetic text="An army of *artists*, armed with *balloons*." at={4} y={150} size={80} x={60} width={960} align="left" />
      <Cam push={lin(f, 0, 160) * 0.04}>
        <Card src="dummy" x={40} y={470} w={1000} rot={1.5} at={0} from="drop" />
      </Cam>
      <Circle cx={540} cy={760} rx={470} ry={320} at={wf(12, 'balloons')} />
      <Kinetic text="Would you have fallen for it?" at={wf(12, 'would') - 4} y={1180} size={58} x={60} width={960} align="center" color={C.red} />
      <Tag text="Follow for more forgotten history" at={wf(12, 'it') + 6} x={230} y={1300} size={28} bg={C.red} />
    </AbsoluteFill>
  );
};

export const SCENE_COMPS = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12];
void Quote; void noise1; void proj; void PL;
