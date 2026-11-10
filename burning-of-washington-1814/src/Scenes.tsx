import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Arrow, Bolt, Cam, Card, Circle, Cloud, Counter, Flame, Hl, Kinetic, Note, Paper, Quote, Rain, Source, Stamp, Tag } from './components/VoxKit';
import { CityMap, PL, RegionMap, lerpView, proj, type View } from './components/VoxMaps';
import { C, MONO, SANS, SERIF, TYPE, ease, hash01, lin, noise1, wf } from './theme';

const VREGION: View = { lon: -76.83, lat: 38.74, k: 1050 };
const VDC: View = { lon: -76.98, lat: 38.99, k: 1800 };
const VCITY: View = { lon: -77.0235, lat: 38.893, k: 34000 };
const VCITY_WIDE: View = { lon: -77.019, lat: 38.885, k: 23000 };
const VBALT: View = { lon: -76.72, lat: 39.06, k: 1150 };

/** White sheet panel (Vox "explainer card"). */
const Sheet: React.FC<{ x: number; y: number; w: number; h: number; at: number; children?: React.ReactNode; rot?: number; out?: number }> = ({ x, y, w, h, at, children, rot = 0, out }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const k = spring({ frame: f - at, fps, config: { damping: 15, stiffness: 160 } }); const o = out !== undefined ? 1 - ease(f, out, out + 8) : 1;
  if (f < at || o <= 0) return null;
  return <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, opacity: o, transform: `translateY(${(1 - k) * 140}px) rotate(${rot}deg)`, background: C.sheet, boxShadow: '0 16px 30px rgba(30,24,16,0.25)' }}>{children}</div>;
};

/* ============================== 1 · HOOK ============================== */
const S01: React.FC = () => {
  const f = useCurrentFrame();
  const sky = wf(1, 'sky'), out = wf(1, 'fire');
  const dark = ease(f, sky - 10, sky + 10) * 0.45;
  const cloudY = -900 + 900 * ease(f, sky - 14, sky + 8);
  const spots: [number, number, number][] = [[110, 150, 1.1], [300, 120, 0.8], [430, 210, 1.3], [560, 160, 0.9], [650, 260, 0.7]];
  return (
    <AbsoluteFill>
      <Paper />
      <Cam push={lin(f, 0, 160) * 0.05}>
        <Tag text="August 24, 1814" at={4} x={70} y={130} size={34} />
        <Kinetic text={f < sky - 6 ? 'Britain *burned* Washington.' : 'The sky put it ^out.^'} at={f < sky - 6 ? wf(1, 'britain') - 6 : sky - 6} y={215} size={96} x={70} width={940} align="left" />
        <Card src="burning" x={70} y={470} w={940} rot={-2} at={2}>
          <svg width={940} height={674} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
            {spots.map(([x, y, s], i) => <Flame key={i} x={x} y={y} s={s} at={wf(1, 'burned') - 6 + i * 3} out={out + i * 2} seed={i} />)}
          </svg>
          <div style={{ position: 'absolute', inset: 26, background: C.night, opacity: dark, mixBlendMode: 'multiply' }} />
        </Card>
        <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
          <g transform={`translate(0,${cloudY})`}>
            <Cloud x={250} y={560} s={1.3} /><Cloud x={760} y={540} s={1.5} color="#4c5965" /><Cloud x={500} y={500} s={1.1} color="#6c7a86" />
          </g>
        </svg>
        <Rain o={ease(f, sky, sky + 8) * 0.9} n={90} />
        <Bolt x={820} y={560} s={0.9} o={f > sky + 4 && f < sky + 10 ? 1 : 0} />
        <Circle cx={505} cy={760} rx={420} ry={300} at={wf(1, 'washington')} color={C.red} width={7} />
      </Cam>
      <Source text="Engraving: The burning of Washington, 1814 · Public domain" at={10} />
    </AbsoluteFill>
  );
};

/* ============================== 2 · BLADENSBURG ============================== */
const Person: React.FC<{ x: number; y: number; color: string; run?: number }> = ({ x, y, color, run = 0 }) => (
  <g transform={`translate(${x + run * 520},${y - Math.abs(Math.sin(run * 20)) * 8 * Math.min(1, run * 10)})`} opacity={1 - Math.max(0, run - 0.35) * 2.5}>
    <circle cx={0} cy={-34} r={11} fill={color} />
    <path d="M-13,-20 L13,-20 L15,10 L-15,10 Z" fill={color} />
    <path d={run > 0 ? 'M-8,10 L-16,28 M8,10 L18,26' : 'M-7,10 L-7,28 M7,10 L7,28'} stroke={color} strokeWidth={7} strokeLinecap="round" />
  </g>
);
const S02: React.FC = () => {
  const f = useCurrentFrame();
  const r = ease(f, 8, 150);
  const brit = wf(2, '4500'), us = wf(2, '6000'), mock = wf(2, 'mocked');
  return (
    <AbsoluteFill>
      <RegionMap view={VREGION} cy={640}
        routes={[{ pts: ['benedict', 'nottingham', 'marlboro', 'bladensburg'], p: r, color: C.red, width: 12 }]}
        pins={[{ at: 'benedict', label: 'Benedict', o: lin(f, 4, 14), side: 'r', size: 36 }, { at: 'bladensburg', label: 'Bladensburg', o: lin(f, 30, 40), side: 'r', size: 42, color: C.red, big: true },
          { at: 'washington', label: 'Washington', o: lin(f, 20, 30), side: 'l', size: 42, big: true }, { at: 'baltimore', label: 'Baltimore', o: lin(f, 20, 30), side: 'r', size: 32 }]}>
        {(P) => { const [x, y] = P(...PL.benedict); return <text x={x - 30} y={y + 70} textAnchor="end" fontFamily={MONO} fontSize={26} fill={C.redDk} opacity={lin(f, 10, 20) * (1 - lin(f, mock - 8, mock))}>BRITISH LAND · AUG 19</text>; }}
      </RegionMap>
      <Tag text="Aug 24, 1814 · Maryland" at={2} x={60} y={110} size={32} />
      <Card src="ross" x={770} y={150} w={250} rot={3} at={brit - 20} from="right" />
      <Tag text="Gen. Robert Ross" at={brit - 10} x={760} y={420} size={22} />
      <Sheet x={50} y={985} w={980} h={300} at={brit - 8}>
        <div style={{ position: 'absolute', left: 30, top: 26, fontFamily: SANS, fontWeight: 800, fontSize: 30, color: C.red }}>BRITISH</div>
        <div style={{ position: 'absolute', left: 30, top: 150, fontFamily: SANS, fontWeight: 800, fontSize: 30, color: C.navy, opacity: lin(f, us - 6, us) }}>AMERICANS</div>
        <Counter from={0} to={4500} at={brit} dur={20} x={790} y={36} size={64} color={C.red} />
        <Counter from={0} to={6000} at={us} dur={20} x={790} y={160} size={64} color={C.navy} />
        <svg width={980} height={300} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {Array.from({ length: 9 }, (_, i) => f >= brit + i * 2 && <Person key={i} x={60 + i * 50} y={118} color={C.red} />)}
          {Array.from({ length: 12 }, (_, i) => f >= us + i * 2 && <Person key={i} x={60 + i * 50} y={250} color={C.navy} run={Math.max(0, (f - mock - (11 - i) * 2) / 45)} />)}
        </svg>
        <div style={{ position: 'absolute', right: 26, top: 112, fontFamily: MONO, fontSize: 18, color: C.grey }}>1 FIGURE ≈ 500 MEN</div>
      </Sheet>
      <Kinetic text="The *“Bladensburg* *Races”*" at={mock - 4} y={830} size={78} x={50} width={980} align="center" />
      <Source text="Sources: Pitch, The Burning of Washington (1998); Battle of Bladensburg" at={10} />
    </AbsoluteFill>
  );
};

/* ============================== 3 · INTO THE CAPITAL ============================== */
const S03: React.FC = () => {
  const f = useCurrentFrame();
  const v = lerpView(VREGION, VDC, ease(f, 0, 40));
  const pres = wf(3, 'president');
  return (
    <AbsoluteFill>
      <RegionMap view={v} cy={640} night={lin(f, 10, 60) * 0.35}
        routes={[{ pts: ['benedict', 'nottingham', 'marlboro', 'bladensburg'], p: 1, color: C.red, width: 12 }, { pts: ['bladensburg', [-76.965, 38.91], 'washington'], p: ease(f, 14, 50), color: C.red, width: 14 },
          { pts: ['washington', [-77.07, 39.03], 'brookeville'], p: ease(f, pres + 10, pres + 40), color: C.navy, width: 9 }]}
        pins={[{ at: 'bladensburg', label: 'Bladensburg', o: 1, side: 'r', size: 38 }, { at: 'washington', label: 'Washington', o: 1, side: 'b', size: 46, big: true, color: C.red },
          { at: 'brookeville', label: 'Brookeville', o: lin(f, pres + 30, pres + 40), side: 'l', size: 38, color: C.navy }]} />
      <Tag text="Evening · Aug 24" at={2} x={60} y={110} size={32} />
      <Card src="madison" x={640} y={150} w={370} rot={4} at={pres - 8} from="right">
        <Stamp text="FLED" at={wf(3, 'fled') - 8} x={185} y={300} size={80} rot={-14} />
      </Card>
      <Tag text="President James Madison" at={pres} x={600} y={575} size={24} />
      <Note text="Madison spends the night in Brookeville, MD" at={pres + 38} x={60} y={1060} size={30} w={560} />
      <Source text="Portrait: John Vanderlyn, 1816 · Public domain" at={pres} />
    </AbsoluteFill>
  );
};

/* ============================== 4 · CAPITOL + LIBRARY ============================== */
const CapitolDrawing: React.FC<{ fireS: number; fireN: number }> = ({ fireS, fireN }) => {
  const wing = (x: number) => (
    <g transform={`translate(${x},0)`}>
      <rect x={0} y={60} width={300} height={170} fill={C.sheet} stroke={C.ink} strokeWidth={5} />
      <rect x={-8} y={46} width={316} height={18} fill={C.ink} />
      <rect x={-8} y={228} width={316} height={16} fill={C.ink} />
      {Array.from({ length: 9 }, (_, i) => <rect key={i} x={22 + i * 31} y={80} width={10} height={140} fill="rgba(28,27,26,0.75)" />)}
    </g>
  );
  return (
    <svg width={1080} height={420} style={{ position: 'absolute', left: 0, top: 330, overflow: 'visible' }}>
      {wing(70)}{wing(710)}
      <path d="M370,170 L710,170 M370,190 L710,190" stroke={C.grey} strokeWidth={5} strokeDasharray="14 10" />
      <Flame x={850} y={60} s={1.4} at={fireS} seed={3} /><Flame x={760} y={66} s={1.0} at={fireS + 5} seed={4} /><Flame x={940} y={70} s={1.0} at={fireS + 8} seed={5} />
      <Flame x={220} y={60} s={1.4} at={fireN} seed={6} /><Flame x={120} y={66} s={1.0} at={fireN + 4} seed={7} /><Flame x={320} y={70} s={1.1} at={fireN + 7} seed={8} />
      <text x={220} y={290} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={30} fill={C.ink}>SENATE WING</text>
      <text x={860} y={290} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={30} fill={C.ink}>HOUSE WING</text>
    </svg>
  );
};
const Books: React.FC<{ at: number; burn: number }> = ({ at, burn }) => {
  const f = useCurrentFrame(); const cols = 30, rows = 20;
  return (
    <svg width={960} height={520} style={{ position: 'absolute', left: 60, top: 870 }}>
      {Array.from({ length: cols * rows }, (_, i) => {
        const c = i % cols, r = Math.floor(i / cols);
        const ap = lin(f, at + (r + c) * 0.6, at + (r + c) * 0.6 + 6); if (ap <= 0) return null;
        const t0 = burn + (rows - r) * 1.6 + hash01(i, 4) * 14; const b = lin(f, t0, t0 + 8);
        const col = b < 0.5 ? (b > 0 ? C.fire : i % 7 === 0 ? C.red : i % 5 === 0 ? C.navy : C.ink) : 'rgba(60,50,40,0.25)';
        return <rect key={i} x={c * 32} y={r * 20 + (1 - ap) * 12} width={22} height={15} rx={2} fill={col} opacity={ap * (1 - b * 0.6)} />;
      })}
    </svg>
  );
};
const S04: React.FC = () => {
  const f = useCurrentFrame();
  const lib = wf(4, 'library'), books = wf(4, '3000'), burned = wf(4, 'books');
  return (
    <AbsoluteFill>
      <Paper />
      <Tag text="Aug 24 · ~10 PM · U.S. Capitol" at={2} x={60} y={110} size={30} />
      <Kinetic text="Target #1: the *Capitol*" at={wf(4, 'torched') - 4} y={180} size={76} x={60} width={960} align="left" />
      <CapitolDrawing fireS={wf(4, 'torched')} fireN={wf(4, 'first')} />
      <Note text="No dome yet in 1814 — just two wings and a wooden walkway" at={wf(4, 'first') + 4} x={250} y={650} size={28} w={600} align="center" rot={0} />
      <Kinetic text="Library of Congress" at={lib - 4} y={760} size={54} x={60} width={600} align="left" weight={800} />
      {f < burned ? <Counter from={0} to={3000} at={books - 4} dur={14} x={690} y={752} size={84} /> : <Counter from={3000} to={0} at={burned} dur={36} x={690} y={752} size={84} color={C.red} />}
      <Note text="BOOKS" at={books} x={920} y={800} size={26} rot={0} />
      <Books at={lib} burn={burned - 8} />
      <Note text="■ = 5 books" at={lib + 10} x={840} y={1290} size={24} rot={0} />
      <Source text="Library of Congress lost ~3,000 volumes · Capitol loss: $787,163.28 (Munroe report)" at={lib} />
    </AbsoluteFill>
  );
};

/* ============================== 5 · PRESIDENT'S HOUSE / DINNER ============================== */
const Dinner: React.FC<{ at: number; eat: number }> = ({ at, eat }) => {
  const f = useCurrentFrame(); const e = ease(f, eat, eat + 18); const g = ease(f, at, at + 12);
  if (g <= 0) return null;
  return (
    <svg width={400} height={360} style={{ position: 'absolute', left: 40, top: 900, overflow: 'visible', opacity: g }}>
      <ellipse cx={190} cy={190} rx={150} ry={150} fill="#fff" stroke={C.ink} strokeWidth={6} />
      <ellipse cx={190} cy={190} rx={102} ry={102} fill="none" stroke={C.ink} strokeWidth={3} opacity={0.4} />
      <g opacity={1 - e} transform={`translate(190,190) scale(${1 - e * 0.6})`}>
        <ellipse cx={-10} cy={6} rx={62} ry={40} fill="#b5652e" stroke={C.ink} strokeWidth={4} />
        <circle cx={40} cy={-30} r={18} fill="#6e8f3a" stroke={C.ink} strokeWidth={3} /><circle cx={-50} cy={-34} r={14} fill="#6e8f3a" stroke={C.ink} strokeWidth={3} />
      </g>
      {e > 0.4 && [0, 1, 2, 3, 4].map((i) => <circle key={i} cx={150 + hash01(i, 2) * 80} cy={170 + hash01(i, 6) * 50} r={4} fill="#b5652e" />)}
      <path d="M10,60 L10,320 M-6,60 L-6,130 M26,60 L26,130 M-6,130 Q10,150 26,130" stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d="M372,60 C392,120 392,200 372,210 L372,320" stroke={C.ink} strokeWidth={8} fill="none" strokeLinecap="round" />
    </svg>
  );
};
const S05: React.FC = () => {
  const f = useCurrentFrame();
  const din = wf(5, 'dinner'), ate = wf(5, 'ate'), burn = wf(5, 'burned');
  return (
    <AbsoluteFill>
      <CityMap view={VCITY} cy={560} route={ease(f, 6, wf(5, 'house'))}
        show={{ capitol: 1, whitehouse: lin(f, 30, 42) }}
        fires={[{ at: 'capitol', on: -30, s: 0.9 }, { at: 'whitehouse', on: burn, s: 1.2 }]}>
        {(P) => { const a = P(-77.0091, 38.8899), b = P(-77.0365, 38.8977); const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI; const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
          return <text x={m[0]} y={m[1] + 52} textAnchor="middle" transform={`rotate(${ang + 180} ${m[0]} ${m[1]})`} fontFamily={MONO} fontSize={28} fill={C.ink} opacity={lin(f, 14, 24)}>PENNSYLVANIA AVE →</text>; }}
      </CityMap>
      <Tag text="~11 PM · Aug 24" at={2} x={60} y={110} size={30} />
      <Sheet x={30} y={850} w={1020} h={450} at={din - 8}>
        <div />
      </Sheet>
      <Dinner at={din - 2} eat={ate} />
      <Quote at={din + 8} x={450} y={880} w={570} size={36} by="Paul Jennings, Madison's enslaved valet, 1865" text={<>“When the British did arrive, <Hl at={ate}>they ate up the very dinner</Hl>, and drank the wines… that I had prepared for the President's party.”</>} />
      <Stamp text="EATEN" at={ate + 8} x={230} y={1100} size={64} rot={-12} />
      <Source text="Paul Jennings, A Colored Man's Reminiscences of James Madison (1865)" at={din} />
    </AbsoluteFill>
  );
};

/* ============================== 6 · ALL NIGHT ============================== */
const LIST = [['capitol', 'Capitol'], ['whitehouse', "President's House"], ['treasury', 'Treasury'], ['waroffice', 'War Office'], ['navyyard', 'Navy Yard*']] as const;
const S06: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <CityMap view={VCITY_WIDE} cy={820} night={lin(f, 0, 20)} labelSize={26} hideMinor
        show={{ capitol: 1, whitehouse: 1, treasury: 1, waroffice: 1, navyyard: lin(f, 8, 16) }}
        fires={[{ at: 'capitol', on: -60, s: 0.9 }, { at: 'whitehouse', on: -20, s: 1 }, { at: 'treasury', on: 8, s: 0.8 }, { at: 'waroffice', on: 14, s: 0.8 }, { at: 'navyyard', on: 20, s: 0.9 }]} />
      <Sheet x={50} y={1010} w={560} h={300} at={4}>
        <div style={{ padding: '22px 30px' }}>
          <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 2, color: C.grey, marginBottom: 8 }}>BURNED BY MORNING</div>
          {LIST.map(([k, l], i) => <div key={k} style={{ fontFamily: SANS, fontWeight: 800, fontSize: 34, lineHeight: 1.32, color: C.ink, opacity: lin(f, 6 + i * 6, 12 + i * 6) }}><span style={{ color: C.red }}>✕</span> {l}</div>)}
        </div>
      </Sheet>
      <Note text="*burned by the Americans themselves" at={30} x={630} y={1250} size={22} w={420} rot={0} color="#fff" />
      <Tag text="Night · Aug 24–25" at={0} x={60} y={110} size={30} />
    </AbsoluteFill>
  );
};

/* ============================== 7 · THE STORM ============================== */
const FIRES7 = (out: number) => [{ at: 'capitol', on: -200, off: out }, { at: 'whitehouse', on: -200, off: out + 6 }, { at: 'treasury', on: -200, off: out + 10 }, { at: 'waroffice', on: -200, off: out + 14 }, { at: 'navyyard', on: -200, off: out + 3 }];
const StormSky: React.FC<{ roll: number; dark: number }> = ({ roll, dark }) => {
  const f = useCurrentFrame();
  return (
    <>
      <AbsoluteFill style={{ background: '#2a3540', opacity: dark * 0.55, mixBlendMode: 'multiply' }} />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <g transform={`translate(${(1 - roll) * -1200 + 20 * noise1(f * 0.02, 4)},0)`}>
          {[[120, 250, 1.6, '#4c5965'], [480, 180, 1.9, C.storm], [860, 260, 1.7, '#4c5965'], [300, 420, 1.3, '#6c7a86'], [720, 430, 1.4, '#5a6672'], [1000, 400, 1.2, C.storm]].map(([x, y, s, c], i) => <Cloud key={i} x={x as number} y={(y as number) - 170} s={s as number} color={c as string} />)}
        </g>
      </svg>
    </>
  );
};
const S07: React.FC = () => {
  const f = useCurrentFrame();
  const sky = wf(7, 'sky'), storm = wf(7, 'storm'), rain = wf(7, 'rain');
  const flash = (f > wf(7, 'black') && f < wf(7, 'black') + 5) || (f > storm + 2 && f < storm + 6) ? 1 : 0;
  return (
    <AbsoluteFill>
      <CityMap view={VCITY_WIDE} cy={820} night={1 - lin(f, 4, 30) * 0.6} labelSize={26} hideMinor show={{ capitol: 1, whitehouse: 1, treasury: 1, waroffice: 1, navyyard: 1 }} fires={FIRES7(rain - 6)} />
      <StormSky roll={ease(f, sky - 10, sky + 30)} dark={ease(f, sky, wf(7, 'black'))} />
      <Rain o={ease(f, storm, storm + 10)} n={170} />
      <Bolt x={700} y={260} s={1.5} o={flash} />
      {flash > 0 && <AbsoluteFill style={{ background: '#fff', opacity: 0.35 }} />}
      <Tag text="Aug 25 · Afternoon" at={0} x={60} y={110} size={30} />
      <Tag text="Severe thunderstorm — possibly a hurricane" at={storm} x={60} y={1150} size={28} bg={C.yellow} color={C.ink} />
    </AbsoluteFill>
  );
};

/* ============================== 8 · TORNADO ============================== */
const Tornado: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => {
  const f = useCurrentFrame();
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {Array.from({ length: 11 }, (_, i) => { const t = i / 10; const w = 26 + t * t * 190; const yy = -t * 420; const sx = 22 * Math.sin(f * 0.25 + t * 4) * t;
        return <ellipse key={i} cx={sx} cy={yy} rx={w} ry={10 + t * 16} fill={i % 2 ? '#56616c' : '#69747f'} stroke={C.ink} strokeWidth={3} />; })}
      {Array.from({ length: 14 }, (_, i) => { const a = f * 0.3 + i * 1.7; const r = 50 + hash01(i, 8) * 120; const hy = -20 - hash01(i, 9) * 260;
        return <rect key={i} x={Math.cos(a) * r} y={hy + Math.sin(a) * 14} width={8} height={8} fill={C.ink} transform={`rotate(${a * 50} ${Math.cos(a) * r} ${hy})`} />; })}
    </g>
  );
};
const Cannon: React.FC<{ x: number; y: number; lift: number; drop: number; dx: number; spin: number }> = ({ x, y, lift, drop, dx, spin }) => {
  const up = lift * (1 - drop) * 220 + Math.sin(lift * Math.PI) * 0; const tx = dx * drop;
  return (
    <g transform={`translate(${x + tx},${y - up}) rotate(${spin * (lift - drop) * 260})`}>
      <rect x={-48} y={-14} width={86} height={24} rx={12} fill={C.ink} />
      <circle cx={-8} cy={14} r={16} fill={C.sheet} stroke={C.ink} strokeWidth={6} />
    </g>
  );
};
const S08: React.FC = () => {
  const f = useCurrentFrame();
  const tor = wf(8, 'tornado'), lift = wf(8, 'lifting'), kill = wf(8, 'killing');
  const P = proj(VCITY_WIDE, 820);
  const a = P(-77.045, 38.8935), b = P(-77.0, 38.8915);
  const tp = ease(f, tor - 4, 170); const tx = a[0] + (b[0] - a[0]) * tp, ty = a[1] + (b[1] - a[1]) * tp;
  const c1 = P(-77.024, 38.8905), l = ease(f, lift, lift + 16), d = ease(f, lift + 26, lift + 40);
  return (
    <AbsoluteFill>
      <CityMap view={VCITY_WIDE} cy={820} night={0.4} labelSize={26} hideMinor show={{ capitol: 1, whitehouse: 1, treasury: 1, waroffice: 1, navyyard: 1 }}>
        {() => (<g>
          <path d={`M${a[0]},${a[1] + 40} L${b[0]},${b[1] + 40}`} stroke={C.yellow} strokeWidth={10} strokeDasharray="22 16" opacity={lin(f, tor, tor + 10)} />
          <text x={a[0] + 20} y={a[1] + 90} fontFamily={MONO} fontSize={24} fill={C.ink} opacity={lin(f, tor + 6, tor + 16)}>TODAY: CONSTITUTION AVE</text>
          <Cannon x={c1[0]} y={c1[1] + 10} lift={l} drop={d} dx={70} spin={1} />
          <Cannon x={c1[0] + 70} y={c1[1] + 30} lift={l} drop={d} dx={-50} spin={-1} />
          {[0, 1, 2, 3, 4, 5].map((i) => { const x = c1[0] + 150 + i * 46, y = c1[1] + 70; const fall = ease(f, kill + i * 3, kill + i * 3 + 10);
            return <g key={i} transform={`translate(${x},${y}) rotate(${fall * (i % 2 ? 90 : -90)})`} opacity={1 - fall * 0.5}><circle cx={0} cy={-34} r={10} fill={i % 2 ? C.red : C.navy} /><rect x={-11} y={-22} width={22} height={30} rx={4} fill={i % 2 ? C.red : C.navy} /></g>; })}
        </g>)}
      </CityMap>
      <StormSky roll={1} dark={0.8} />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}><Tornado x={tx} y={ty + 30} s={1.15 * ease(f, tor - 6, tor + 6)} /></svg>
      <Rain o={0.8} n={150} />
      <Tag text="Tornado · Aug 25, 1814" at={0} x={60} y={110} size={30} bg={C.yellow} color={C.ink} />
      <Sheet x={60} y={1040} w={960} h={230} at={kill - 10}>
        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'space-around', fontFamily: SANS, fontWeight: 800, fontSize: 38 }}>
          <div style={{ color: C.red, textAlign: 'center' }}>■ British soldiers<div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 22, color: C.grey, marginTop: 6 }}>KILLED</div></div>
          <div style={{ fontSize: 50, color: C.grey }}>+</div>
          <div style={{ color: C.navy, textAlign: 'center' }}>■ Civilians<div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 22, color: C.grey, marginTop: 6 }}>KILLED</div></div>
        </div>
      </Sheet>
      <Source text="Source: National Weather Service (Sterling, VA), D.C. tornado events" at={tor} />
    </AbsoluteFill>
  );
};

/* ============================== 9 · COCKBURN ============================== */
const S09: React.FC = () => {
  const f = useCurrentFrame();
  const q = wf(9, 'is'), inf = wf(9, 'infernal');
  return (
    <AbsoluteFill>
      <Paper />
      <Cam push={lin(f, 0, 180) * 0.03}>
        <Card src="cockburn" x={60} y={150} w={500} rot={-3} at={0} from="left" />
        <Tag text="Rear Adm. George Cockburn" at={wf(9, 'cockburn') - 4} x={70} y={790} size={28} />
        <Circle cx={415} cy={640} rx={110} ry={90} at={28} />
        <Arrow a={[760, 520]} b={[540, 610]} at={36} bend={-50} />
        <Note text="His official portrait: Washington burning behind him" at={30} x={600} y={330} size={32} w={430} rot={2} />
        <Quote at={q - 6} x={70} y={880} w={940} size={50} rot={-1}
          by="Cockburn to a Washington resident, Aug 25, 1814 (as reported)"
          text={<>“Is this the weather to which you are accustomed in this <Hl at={inf}>infernal country?</Hl>”</>} />
      </Cam>
      <Source text="Portrait: John James Halls, c. 1817 · National Maritime Museum · Public domain" at={4} />
    </AbsoluteFill>
  );
};

/* ============================== 10 · 26 HOURS ============================== */
const S10: React.FC = () => {
  const f = useCurrentFrame();
  const out = wf(10, 'out'), occ = wf(10, 'occupation');
  const p = ease(f, occ, wf(10, 'hours') + 4);
  const R = 120, cx = 230, cy = 1120;
  return (
    <AbsoluteFill>
      <RegionMap view={VREGION} cy={600} night={0.5}
        routes={[{ pts: ['washington', 'marlboro', 'nottingham', 'benedict'], p: ease(f, 6, out + 50), color: C.red, width: 12 }]}
        pins={[{ at: 'washington', label: 'Washington', o: 1, side: 'l', size: 40, big: true }, { at: 'benedict', label: 'Back to the ships', o: lin(f, out + 30, out + 40), side: 'r', size: 34, color: C.red }]} />
      <Tag text="Night · Aug 25" at={0} x={60} y={110} size={30} />
      <Sheet x={50} y={950} w={980} h={340} at={occ - 14}>
        <svg width={980} height={340} style={{ position: 'absolute', inset: 0 }}>
          <circle cx={cx - 50} cy={cy - 950} r={R} fill="none" stroke="rgba(28,27,26,0.12)" strokeWidth={28} />
          <circle cx={cx - 50} cy={cy - 950} r={R} fill="none" stroke={C.red} strokeWidth={28} pathLength={1} strokeDasharray={`${p} 1`} transform={`rotate(-90 ${cx - 50} ${cy - 950})`} />
        </svg>
        <div style={{ position: 'absolute', left: cx - 50 - 80, top: 120, width: 160, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 64, color: C.ink }}>{Math.round(26 * p)}h</div>
        <div style={{ position: 'absolute', left: 380, top: 60, fontFamily: SANS, fontWeight: 800, fontSize: 70, lineHeight: 1, color: C.ink, opacity: lin(f, occ, occ + 8) }}>~26 hours</div>
        <div style={{ position: 'absolute', left: 380, top: 150, width: 560, fontFamily: TYPE, fontWeight: 700, fontSize: 32, lineHeight: 1.25, color: C.grey, opacity: lin(f, occ + 8, occ + 16) }}>The whole British occupation of the U.S. capital</div>
      </Sheet>
    </AbsoluteFill>
  );
};

/* ============================== 11 · DID THE STORM SAVE IT? ============================== */
const S11: React.FC = () => {
  const f = useCurrentFrame();
  const hist = wf(11, 'historians'), no = wf(11, 'no'), brit = wf(11, 'british');
  const strike = ease(f, no, no + 10);
  return (
    <AbsoluteFill>
      <Paper />
      <Kinetic text="Did the storm *save* Washington?" at={4} y={170} size={98} x={60} width={960} align="left" hlAt={wf(11, 'save')} />
      <Sheet x={60} y={640} w={460} h={560} at={hist - 10} rot={-2}>
        <div style={{ padding: 34 }}>
          <div style={{ fontFamily: MONO, fontSize: 28, letterSpacing: 3, color: C.grey }}>THE LEGEND</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 52, lineHeight: 1.1, color: C.ink, marginTop: 20, position: 'relative' }}>
            The storm drove the British out
            <div style={{ position: 'absolute', left: -10, top: '48%', height: 10, width: `${strike * 104}%`, background: C.red, transform: 'rotate(-6deg)' }} />
          </div>
        </div>
        <Stamp text="MYTH" at={no + 4} x={230} y={440} size={70} rot={-10} />
      </Sheet>
      <Sheet x={560} y={640} w={460} h={560} at={brit - 10} rot={2}>
        <div style={{ padding: 34 }}>
          <div style={{ fontFamily: MONO, fontSize: 28, letterSpacing: 3, color: C.grey }}>WHAT HISTORIANS SAY</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 52, lineHeight: 1.1, color: C.ink, marginTop: 20 }}>A raid: <Hl at={wf(11, 'burn')}>burn</Hl> the public buildings, then leave</div>
          <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 26, color: C.grey, marginTop: 26 }}>Ross never planned to hold the city.</div>
        </div>
      </Sheet>
      <Source text="See: Pitch (1998); NWS; Burning of Washington historiography" at={hist} />
    </AbsoluteFill>
  );
};

/* ============================== 12 · BALTIMORE → ANTHEM ============================== */
const Flag: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => {
  const f = useCurrentFrame();
  const W = 300, H = 200, n = 24;
  const wave = (u: number) => 8 * Math.sin(u * 7 - f * 0.25) * u;
  return (
    <svg width={W * s + 40} height={H * s + 80} style={{ position: 'absolute', left: x, top: y, overflow: 'visible' }}>
      <rect x={0} y={0} width={8} height={H * s + 70} fill={C.ink} />
      <g transform={`translate(8,6) scale(${s})`}>
        {Array.from({ length: 15 }, (_, i) => Array.from({ length: n }, (_, j) => { const u0 = j / n, u1 = (j + 1) / n; const y0 = (i * H) / 15;
          return <path key={`${i}-${j}`} d={`M${u0 * W},${y0 + wave(u0)} L${u1 * W},${y0 + wave(u1)} L${u1 * W},${y0 + H / 15 + wave(u1)} L${u0 * W},${y0 + H / 15 + wave(u0)} Z`} fill={i % 2 ? '#f6f3ec' : C.red} />; }))}
        <rect x={0} y={wave(0)} width={W * 0.4} height={(H * 8) / 15} fill={C.navy} transform={`skewY(${3 * Math.sin(-f * 0.25)})`} />
        {Array.from({ length: 15 }, (_, i) => <circle key={i} cx={14 + (i % 5) * 22} cy={14 + Math.floor(i / 5) * 30} r={5} fill="#fff" />)}
      </g>
    </svg>
  );
};
const S12: React.FC = () => {
  const f = useCurrentFrame();
  const later = wf(12, 'later'), failed = wf(12, 'failed'), insp = wf(12, 'inspiring'), star = wf(12, 'starspangled');
  return (
    <AbsoluteFill>
      <RegionMap view={VBALT} cy={600}
        routes={[{ pts: [[-76.40, 38.62], [-76.36, 38.95], [-76.40, 39.13], 'northpoint', 'baltimore'], p: ease(f, later - 6, failed), color: C.red, width: 12 }]}
        pins={[{ at: 'washington', label: 'Washington', o: 1, side: 'l', size: 36 }, { at: 'baltimore', label: 'Baltimore', o: 1, side: 'l', size: 46, big: true }]}>
        {(P) => { const [x, y] = P(...PL.baltimore); const k = ease(f, failed, failed + 8);
          return k > 0 ? <g stroke={C.red} strokeWidth={16} strokeLinecap="round"><path d={`M${x - 60 * k},${y - 60 * k} L${x + 60 * k},${y + 60 * k}`} /><path d={`M${x + 60 * k},${y - 60 * k} L${x - 60 * k},${y + 60 * k}`} /></g> : null; }}
      </RegionMap>
      <Tag text="Sept 12–14, 1814 · Baltimore" at={2} x={60} y={110} size={30} />
      <Stamp text="FAILED" at={failed + 4} x={300} y={470} size={70} rot={-8} />
      <Note text="Gen. Ross killed at North Point" at={failed + 14} x={70} y={560} size={28} w={460} rot={0} />
      <Card src="mchenry" x={150} y={790} w={780} rot={-1.5} at={insp - 8} from="bottom" />
      <Flag x={800} y={590} s={0.75} />
      <Sheet x={40} y={160} w={1000} h={104} at={star - 8}><div /></Sheet>
      <Kinetic text="→ *“The* *Star-Spangled* *Banner”*" at={star - 6} y={180} size={52} x={60} width={980} align="left" stagger={2} />
      <Source text="Engraving: John Bower, Bombardment of Fort McHenry, 1816 · Public domain" at={insp} />
    </AbsoluteFill>
  );
};

/* ============================== 13 · THE WHITE HOUSE MYTH ============================== */
const TL = [['1798', 'First coat of whitewash'], ['1814', 'Burned by the British'], ['1901', "“White House” made the official name"]] as const;
const S13: React.FC = () => {
  const f = useCurrentFrame();
  const marks = wf(13, 'marks'), it = wf(13, 'it'), since = wf(13, '1798');
  return (
    <AbsoluteFill>
      <Paper />
      <Kinetic text="Painted white to hide the *scorch* *marks?*" at={wf(13, 'painted') - 6} y={150} size={70} x={60} width={960} align="left" />
      <Card src="whitehouse" x={40} y={400} w={1000} rot={-1.5} at={0}>
        <Stamp text="MYTH" at={marks + 4} x={500} y={240} size={110} rot={-10} />
      </Card>
      <svg width={1080} height={300} style={{ position: 'absolute', left: 0, top: 960 }}>
        <line x1={150} y1={80} x2={930} y2={80} stroke="rgba(28,27,26,0.2)" strokeWidth={8} />
        <line x1={150} y1={80} x2={150 + 780 * ease(f, it - 6, it + 60)} y2={80} stroke={C.ink} strokeWidth={8} />
        {TL.map(([y, l], i) => { const x = 150 + i * 390; const on = lin(f, it - 6 + i * 18, it + 4 + i * 18); const key = i === 0;
          return (
            <g key={y} opacity={on}>
              <circle cx={x} cy={80} r={key ? 24 : 18} fill={key ? C.yellow : C.sheet} stroke={C.ink} strokeWidth={6} />
              <text x={x} y={40} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={key ? 54 : 44} fill={key && f >= since ? C.red : C.ink}>{y}</text>
              <foreignObject x={x - 150} y={118} width={300} height={140}><div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 26, lineHeight: 1.2, textAlign: 'center', color: C.ink }}>{l}</div></foreignObject>
            </g>
          );
        })}
      </svg>
      <Tag text="Follow for more forgotten history" at={since + 30} x={230} y={1290} size={30} bg={C.red} />
      <Source text="Painting: George Munger, The President's House, 1814–15 · White House Historical Association" at={4} />
    </AbsoluteFill>
  );
};

export const SCENE_COMPS = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13];
// keep SERIF import referenced for consistent typography in future edits
void SERIF;
