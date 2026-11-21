import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { CutoutDefs, Horse, Person } from './Characters';
import { Note, Particles, Photo, Stamp } from './kit';
import { C, HEAD, SERIF, TYPE, ease, lin, wf } from './theme';
import { Billboard, Box, Coffin, EARTH, Floor, G, LEAD, MAHOGANY, STONE, Stage, TIN, WOOD } from './three3d';
import { Explosion, Fire, Shake, VfxDefs } from './vfx';

/* "St Helena 1840" variant: 3D paper diorama on a dark parchment night, torchlight gold. */
const GOLD = '#e8b84a', CREAM = '#f6ecd4';
const Night: React.FC<{ warm?: number }> = ({ warm = 0.5 }) => (
  <AbsoluteFill style={{ background: 'linear-gradient(180deg, #0b1420 0%, #1a2230 45%, #3a2a1a 100%)' }}>
    <Img src={staticFile('assets/backgrounds/paper.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.16, mixBlendMode: 'overlay' }} />
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 45% at 50% 62%, rgba(255,170,80,${0.28 * warm}), transparent 70%)` }} />
  </AbsoluteFill>
);
const Day: React.FC = () => (
  <AbsoluteFill style={{ background: 'linear-gradient(180deg, #e9dcc0 0%, #d8c59c 55%, #b39a6a 100%)' }}>
    <Img src={staticFile('assets/backgrounds/paper.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, mixBlendMode: 'multiply' }} />
  </AbsoluteFill>
);
const Vig = () => <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 70% at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)', pointerEvents: 'none' }} />;
/** A paper-cutout character standing in the 3D scene. */
const Cut: React.FC<{ x: number; z: number; yaw: number; s?: number; y?: number; children: (w: number, h: number) => React.ReactNode }> = ({ x, z, yaw, s = 1, y = 0, children }) => (
  <Billboard x={x} y={y} z={z} yaw={yaw} w={420 * s} h={640 * s}>
    <svg width={420 * s} height={640 * s} style={{ overflow: 'visible' }}><CutoutDefs /><VfxDefs />{children(420 * s, 640 * s)}</svg>
  </Billboard>
);
const Torch: React.FC<{ x: number; z: number; yaw: number }> = ({ x, z, yaw }) => (
  <Cut x={x} z={z} yaw={yaw} s={0.6}>{(w, h) => (<g><rect x={w / 2 - 6} y={h - 260} width={12} height={260} fill="#3a2614" stroke="#000" strokeWidth={2} /><Fire x={w / 2} y={h - 250} s={0.7} /></g>)}</Cut>
);
const SLAB = (open: number, i: number) => ({ y: -40 - 300 * open - i * 30 * open, rx: 20 * open * (i % 2 ? 1 : -1) });
const Labels: React.FC<{ at: number; items: [string, string][]; x: number; y: number }> = ({ at, items, x, y }) => (
  <>{items.map(([t, c], i) => <Note key={t} text={t} at={at + i * 8} x={x} y={y + i * 62} size={30} color={c} />)}</>
);

/* 01: the coffin in the torchlit pit, camera descends */
export const S01: React.FC = () => {
  const f = useCurrentFrame(); const yaw = -20 + 14 * ease(f, 0, 190);
  return (
    <AbsoluteFill>
      <Night warm={1} />
      <Stage yaw={yaw} pitch={-38 + 14 * ease(f, 0, 190)} dist={720 - 260 * ease(f, 0, 190)}>
        <Floor w={2400} d={2400} y={60} bg={EARTH} />
        <Floor w={700} d={420} y={58} bg="#1b140d" />
        <Coffin w={520} h={130} d={240} y={-8} skin={MAHOGANY} open={0.08 * Math.sin(f / 9) ** 2} />
        <Torch x={-430} z={-200} yaw={yaw} /><Torch x={430} z={-160} yaw={yaw} /><Torch x={-380} z={260} yaw={yaw} />
      </Stage>
      <Note text="ST HELENA · 15 OCTOBER 1840" at={6} x={60} y={150} size={32} />
      <Stamp text="19 YEARS LATER" at={wf(1, '19')} x={540} y={1150} size={84} rot={-6} />
      <Particles kind="embers" n={50} o={0.8} /><Vig />
    </AbsoluteFill>
  );
};

/* 02: Napoleon in exile on his island, camera orbits */
export const S02: React.FC = () => {
  const f = useCurrentFrame(); const yaw = -40 + 60 * ease(f, 0, 270); const ex = wf(2, 'exile');
  return (
    <AbsoluteFill>
      <Day />
      <Stage yaw={yaw} pitch={-24} dist={760} cy={1100}>
        <Floor w={3000} d={3000} y={80} bg="repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0 2px, transparent 2px 40px), linear-gradient(#3f6f8e,#2b5470)" />
        <Box w={620} h={160} d={460} y={0} skin="linear-gradient(#8a7a55,#6b5a3a)" />
        <Box w={300} h={120} d={240} y={-140} x={-60} skin="linear-gradient(#9a8a62,#7a6a46)" />
      </Stage>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}><CutoutDefs /><Person x={600} y={1010} s={0.95} coat="blue" head="assets/archival/head_napoleon.png" armL={10} armR={lin(f, ex, ex + 12, 8, 30)} breathe={f / 9} nod={3 * Math.sin(f / 15)} /></svg>
      <Photo src="assets/archival/napoleon.jpg" at={4} x={60} y={130} w={330} h={380} rot={-3} pos="45% 25%" caption="Napoleon, 1812" credit="J.-L. David · public domain" grade="warm" />
      <Labels at={wf(2, 'may')} items={[['DIED 5 MAY 1821', '#2a2117'], ['EXILE: SAINT HELENA', '#2a2117'], ['SOUTH ATLANTIC', '#2a2117']]} x={440} y={170} />
      <Vig />
    </AbsoluteFill>
  );
};

/* 03: four coffins, one inside another (exploded 3D view) */
const NEST: [string, string, number, number, number][] = [['TIN', TIN, 420, 90, 190], ['MAHOGANY', MAHOGANY, 470, 104, 220], ['LEAD', LEAD, 520, 118, 250], ['MAHOGANY', WOOD, 570, 132, 280]];
export const S03: React.FC = () => {
  const f = useCurrentFrame(); const fo = wf(3, 'four'), an = wf(3, 'another'), sl = an + 8; const yaw = -30 + 20 * ease(f, 0, 170);
  return (
    <AbsoluteFill>
      <Night warm={0.6} />
      <Stage yaw={yaw} pitch={-28} dist={1100}>
        <Floor w={2400} d={2400} y={150} bg={EARTH} />
        {NEST.map(([lab, skin, w, h, d], i) => { const t = ease(f, fo - 6 + i * 9, fo + 14 + i * 9); const nest = ease(f, an - 2, an + 18); const gx = (i % 2 ? 330 : -330) * (1 - nest), gz = (i < 2 ? -230 : 230) * (1 - nest); const sc = 0.62 + 0.38 * nest;
          return t > 0 ? <G key={i} x={gx} z={gz} y={-500 * (1 - t) + 70} s={sc}><Box w={w} h={h} d={d} skin={skin} label={nest < 0.5 ? lab : undefined} /></G> : null; })}
        {[0, 1, 2].map((i) => { const t = ease(f, sl - 4 + i * 4, sl + 10 + i * 4); return t > 0 ? <Box key={`s${i}`} w={700} h={40} d={110} y={-600 + 560 * t} z={-120 + i * 120} skin={STONE} /> : null; })}
      </Stage>
      <Note text="4 COFFINS, ONE INSIDE ANOTHER" at={fo - 2} x={60} y={150} size={34} />
      <Note text="TIN · MAHOGANY · LEAD · MAHOGANY" at={fo + 10} x={60} y={212} size={26} />
      <Note text="SEALED UNDER STONE SLABS" at={sl} x={60} y={1150} size={30} />
      <Note text="1 · TIN   2 · MAHOGANY   3 · LEAD   4 · MAHOGANY" at={fo + 30} x={60} y={274} size={22} />
      <Vig />
    </AbsoluteFill>
  );
};

/* 04: the dig at midnight */
export const S04: React.FC = () => {
  const f = useCurrentFrame(); const dg = wf(4, 'dig'), tor = wf(4, 'torchlight'); const yaw = 20 - 25 * ease(f, 0, 260); const lift = ease(f, dg, dg + 60);
  return (
    <AbsoluteFill>
      <Night warm={1} />
      <Stage yaw={yaw} pitch={-30} dist={860}>
        <Floor w={2400} d={2400} y={60} bg={EARTH} />
        {[0, 1, 2].map((i) => { const s = SLAB(lift, i); return <G key={i} y={s.y} rx={s.rx} z={-110 + i * 110}><Box w={640} h={36} d={100} skin={STONE} /></G>; })}
        {[[-380, 40], [380, -40], [-200, 300], [260, 300]].map(([x, z], i) => (
          <Cut key={i} x={x} z={z} yaw={yaw} s={0.75}>{(w, h) => <Person x={w / 2} y={h} s={0.8} coat="#b3261e" hat="kepi" armR={60 + 50 * Math.sin(f / 5 + i)} armL={60 + 50 * Math.sin(f / 5 + i)} nod={14} breathe={f / 6 + i} flip={i % 2 === 1} />}</Cut>
        ))}
        <Torch x={-520} z={-200} yaw={yaw} /><Torch x={520} z={-120} yaw={yaw} /><Torch x={0} z={-380} yaw={yaw} />
      </Stage>
      <Note text="MIDNIGHT · 14–15 OCTOBER 1840" at={tor - 6} x={60} y={150} size={30} />
      <Note text="BRITISH SOLDIERS DIG · FRENCH WITNESSES WATCH" at={dg - 4} x={60} y={210} size={24} />
      <Particles kind="embers" n={60} /><Particles kind="ash" n={40} o={lin(f, dg, dg + 20)} /><Vig />
    </AbsoluteFill>
  );
};

/* 05: coffin after coffin, the white shape */
export const S05: React.FC = () => {
  const f = useCurrentFrame(); const co = wf(5, 'coffin'), last = wf(5, 'last'), wh = wf(5, 'white'), fe = wf(5, 'fear');
  const opens = [co, co + 22, co + 44, last];
  const yaw = 12 - 18 * ease(f, 0, 300);
  return (
    <Shake hits={opens} amp={10}>
      <AbsoluteFill>
        <Night warm={1} />
        <Stage yaw={yaw} pitch={-50} dist={760} cy={1000}>
          <Floor w={2400} d={2400} y={80} bg={EARTH} />
          {NEST.slice().reverse().map(([lab, skin, w, h, d], k) => { const i = 3 - k; return <Coffin key={i} w={w} h={h} d={d} y={80 - h / 2} skin={skin} open={ease(f, opens[k], opens[k] + 14)} inner={i === 0 ? <AbsoluteFill style={{ background: '#f4f1ea', opacity: lin(f, last, last + 10), boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4)' }} /> : undefined} />; })}
          {[[-420, 220], [420, 220], [-200, -320], [240, -320]].map(([x, z], i) => (
            <Cut key={i} x={x} z={z} yaw={yaw} s={0.7}>{(w, h) => <Person x={w / 2} y={h} s={0.8} coat={i < 2 ? '#1f2a44' : '#2b3a5c'} hat={i % 2 ? 'none' : 'kepi'} armR={lin(f, wh, wh + 10, 10, 40)} nod={lin(f, wh, wh + 10, 0, 18)} breathe={f / 7 + i} flip={x > 0} />}</Cut>
          ))}
        </Stage>
        <Note text="COFFIN AFTER COFFIN" at={co - 4} x={60} y={150} size={34} />
        <Stamp text="THEY FEARED THE WORST" at={fe} x={540} y={1140} size={66} rot={-5} />
        <Vig />
      </AbsoluteFill>
    </Shake>
  );
};

/* 06 + 07: the satin rolls back; the body (the real 1840 lithograph) inside the coffin, top-down */
const Body: React.FC<{ satin: number }> = ({ satin }) => (
  <AbsoluteFill>
    <Img src={staticFile('assets/archival/body_1840.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.35) contrast(1.15)' }} />
    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, right: `${100 * satin}%`, background: 'repeating-linear-gradient(90deg, #fbf9f3 0 18px, #ece8de 18px 30px)', boxShadow: '8px 0 20px rgba(0,0,0,0.4)' }} />
  </AbsoluteFill>
);
export const S06: React.FC = () => {
  const f = useCurrentFrame(); const ro = wf(6, 'rolls'); const sat = ease(f, ro, ro + 70);
  return (
    <AbsoluteFill>
      <Night warm={1.2} />
      <Stage yaw={0} pitch={-70 + 10 * ease(f, 0, 160)} dist={330 - 110 * ease(f, 0, 160)} cy={980}>
        <Floor w={2400} d={2400} y={80} bg={EARTH} />
        <Box w={600} h={60} d={330} y={50} skin={WOOD} omit={['top']} inner={<Body satin={sat} />} />
        <Cut x={360} z={-60} yaw={0} s={0.75}>{(w, h) => <Person x={w / 2} y={h} s={0.85} coat="#1f2a44" hat="none" armR={50 + 25 * Math.sin(f / 8)} armL={20} nod={22} breathe={f / 7} flip />}</Cut>
      </Stage>
      <Note text="DR. GUILLARD · THE SHIP'S SURGEON" at={wf(6, 'surgeon') - 4} x={60} y={150} size={28} />
      <Note text="THE SATIN HAD FALLEN FROM THE LID" at={wf(6, 'fallen') - 4} x={60} y={212} size={26} />
      <Vig />
    </AbsoluteFill>
  );
};
export const S07: React.FC = () => {
  const f = useCurrentFrame(); const z = ease(f, 0, 330);
  const call: [string, string, number, number][] = [['FACE INSTANTLY RECOGNIZABLE', 'recognizable', 120, 330], ['EYES CLOSED · EYELASHES INTACT', 'eyelashes', 120, 400], ['GREEN UNIFORM, ALMOST PERFECT', 'uniform', 120, 470], ['RED RIBBON · LEGION OF HONOR', 'ribbon', 120, 540]];
  return (
    <AbsoluteFill>
      <Night warm={1.2} />
      <Stage yaw={-8 * z} pitch={-80 + 8 * z} dist={420 - 120 * z} cy={1000}>
        <Box w={600} h={60} d={330} y={50} skin={WOOD} omit={['top']} inner={<Body satin={1} />} />
      </Stage>
      {call.map(([t, w, x, y]) => <Note key={t} text={t} at={wf(7, w) - 4} x={60} y={y - 140} size={28} />)}
      <Photo src="assets/archival/body_1840.jpg" at={wf(7, 'ribbon') + 6} x={560} y={1240 - 520} w={460} h={260} rot={3} pos="50% 50%" caption="Drawn at the opening, 15 Oct 1840" credit="J. Rigo · BnF · public domain" grade="sepia" />
      <Vig />
    </AbsoluteFill>
  );
};

/* 08: alive vs 19 years after death */
export const S08: React.FC = () => {
  const f = useCurrentFrame(); const as = wf(8, 'asleep');
  return (
    <AbsoluteFill>
      <Night warm={0.6} />
      <Photo src="assets/archival/napoleon.jpg" at={0} x={50} y={170} w={470} h={560} rot={-4} pos="45% 25%" caption="ALIVE · 1812" grade="warm" />
      <Photo src="assets/archival/body_1840.jpg" at={8} x={540} y={300} w={500} h={420} rot={4} pos="22% 50%" caption="19 YEARS DEAD · 1840" grade="sepia" zoom={0.12} />
      <Stamp text="LIKE HE WAS ASLEEP" at={as - 4} x={540} y={1060} size={80} rot={-6} />
      <Vig />
    </AbsoluteFill>
  );
};

/* 09: Paris, December 1840: the procession to Les Invalides */
export const S09: React.FC = () => {
  const f = useCurrentFrame(); const yaw = -14 + 10 * ease(f, 0, 200); const move = ease(f, 0, 200);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, #8d97a3 0%, #c9c4b8 60%, #a49a86 100%)' }} />
      <Stage yaw={yaw} pitch={-14} dist={900} cy={1060}>
        <Floor w={600} d={4000} y={60} z={-1200} bg="linear-gradient(#d9d5cc,#bdb6a8)" />
        <Floor w={3000} d={4000} y={62} z={-1200} bg="#b9b3a6" />
        <Billboard x={0} y={60} z={-2600} yaw={yaw} w={1400} h={1300}><svg width={1400} height={1300}><path d='M100,1300 L100,900 L1300,900 L1300,1300 Z' fill='#cfc6b4' stroke='#6b6150' strokeWidth={6} />{[0,1,2,3,4,5,6].map((i) => <rect key={i} x={170 + i * 160} y={960} width={60} height={300} fill='#a9a08e' />)}<path d='M380,900 L380,700 L1020,700 L1020,900 Z' fill='#cfc6b4' stroke='#6b6150' strokeWidth={6} /><path d='M420,700 Q700,280 980,700 Z' fill='#d8b35a' stroke='#7a5a1a' strokeWidth={6} />{[0,1,2,3,4,5].map((i) => <path key={i} d={`M${470 + i * 92},700 Q700,${320 + Math.abs(i - 2.5) * 30} ${700},${330}`} stroke='#a8862e' strokeWidth={4} fill='none' />)}<rect x={680} y={200} width={40} height={120} fill='#e2c05a' stroke='#7a5a1a' strokeWidth={4} /><path d='M700,120 L686,200 L714,200 Z' fill='#e2c05a' /></svg></Billboard>
        <G z={-300 - 900 * move}><Box w={180} h={150} d={340} y={-15} skin="linear-gradient(#3a2a1a,#1a120a)" /><Box w={200} h={30} d={360} y={-105} skin="linear-gradient(#e2c05a,#a8862e)" /></G>
        {Array.from({ length: 8 }, (_, i) => <Cut key={i} x={(i % 2 ? 1 : -1) * (360 + (i % 3) * 60)} z={-200 - i * 260} yaw={yaw} s={0.55}>{(w, h) => <Person x={w / 2} y={h} s={0.8} coat={i % 3 ? '#2b3a5c' : '#3a3a3a'} hat={i % 2 ? 'kepi' : 'slouch'} breathe={f / 7 + i} nod={6} />}</Cut>)}
        <Cut x={-120} z={-500 - 900 * move} yaw={yaw} s={0.7}>{(w, h) => <Horse x={w / 2} y={h} s={0.55} phase={f * 0.02} coat="#2a1d12" flip />}</Cut>
      </Stage>
      <Note text="PARIS · 15 DECEMBER 1840" at={4} x={60} y={150} size={32} />
      <Note text="LES INVALIDES · WHERE HE LIES TODAY" at={wf(9, 'invalides') - 4} x={60} y={212} size={28} />
      <Particles kind="snow" n={110} /><Vig />
    </AbsoluteFill>
  );
};

/* 10: arsenic or sealed coffins? */
export const S10: React.FC = () => {
  const f = useCurrentFrame(); const ar = wf(10, 'arsenic'), se = wf(10, 'sealed'), fo = wf(10, 'follow');
  const card = (at: number, x: number, k: string, t: string, col: string) => (
    <div style={{ position: 'absolute', left: x, top: 240, width: 470, padding: '24px 26px', background: CREAM, borderTop: `12px solid ${col}`, boxShadow: '0 16px 40px rgba(0,0,0,0.6)', opacity: lin(f, at - 6, at + 4), transform: `translateY(${(1 - ease(f, at - 6, at + 10)) * 40}px)` }}>
      <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 28, color: '#5a4a3a' }}>{k}</div>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 72, color: col, lineHeight: 1 }}>{t}</div>
    </div>
  );
  return (
    <AbsoluteFill>
      <Night warm={0.8} />
      {card(ar, 50, 'A', 'ARSENIC?', C.redHi)}
      {card(se, 560, 'B', '4 SEALED COFFINS?', GOLD)}
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}><CutoutDefs /><Person x={540} y={1150} s={1.05} coat="blue" head="assets/archival/head_napoleon.png" armL={12} armR={lin(f, ar, ar + 10, 8, 30)} breathe={f / 8} nod={3 * Math.sin(f / 12)} /></svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center', opacity: lin(f, fo - 6, fo + 4) }}>
        <span style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 54, color: '#fff', background: C.redHi, padding: '10px 26px' }}>FOLLOW · BURIED CHRONICLES</span>
      </div>
      <Vig />
    </AbsoluteFill>
  );
};

export const SCENE_COMPS = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10];
export { Explosion, SERIF };
