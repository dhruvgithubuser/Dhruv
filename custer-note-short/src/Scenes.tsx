import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { COAT, CutoutDefs, Horse, Person, Tipi } from './Characters';
import { Cam, Counter, Ico, Note, Particles, Photo, Stamp } from './kit';
import { C, HEAD, SERIF, TYPE, ease, hash01, lin, wf } from './theme';

/* "Frontier 1876" variant of the Vox stage: dusty prairie parchment, brass + cavalry blue, wanted-poster type. */
const BRASS = '#b8863b', BLUE = '#2f4f7a', DUST = '#d9c39a';
export const Frontier: React.FC<{ dark?: number }> = ({ dark = 0 }) => (
  <AbsoluteFill>
    <Img src={staticFile('assets/backgrounds/paper.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.55) saturate(1.2) brightness(0.97)' }} />
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(185,140,80,0.18), rgba(120,80,40,0.22))', mixBlendMode: 'multiply' }} />
    <AbsoluteFill style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(60,40,20,0.05) 0 1px, transparent 1px 72px), repeating-linear-gradient(90deg, rgba(60,40,20,0.05) 0 1px, transparent 1px 72px)' }} />
    {dark > 0 && <AbsoluteFill style={{ background: `rgba(29,22,14,${dark})` }} />}
  </AbsoluteFill>
);
/** Wanted-poster style header band. */
const Poster: React.FC<{ at: number; top: string; big: string; y?: number }> = ({ at, top, big, y = 110 }) => {
  const f = useCurrentFrame(); const o = lin(f, at, at + 8);
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', opacity: o, transform: `translateY(${(1 - ease(f, at, at + 12)) * 20}px)` }}>
      <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 30, letterSpacing: 10, color: '#5a3d24' }}>{top}</div>
      <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 92, lineHeight: 1, color: '#2a1d12', borderTop: `5px double #5a3d24`, borderBottom: `5px double #5a3d24`, display: 'inline-block', padding: '10px 30px', marginTop: 10 }}>{big}</div>
    </div>
  );
};
const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}><CutoutDefs />{children}</svg>
);

/* ---------------- schematic valley map (vertical, not to scale) ---------------- */
type Pt = [number, number];
const RIVER: Pt[] = [[560, 150], [520, 300], [575, 450], [510, 600], [560, 750], [505, 900], [545, 1050], [500, 1200]];
const R_CUSTER: Pt[] = [[960, 1080], [780, 930], [720, 760], [700, 560], [650, 360]];
const R_RENO: Pt[] = [[960, 1080], [700, 1110], [520, 1090], [420, 1010]];
const R_BENT: Pt[] = [[960, 1080], [990, 1150], [930, 1190]];
const pathD = (p: Pt[]) => p.map((q, i) => `${i ? 'L' : 'M'}${q[0]},${q[1]}`).join('');
const plen = (p: Pt[]) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0);
const at = (p: Pt[], t: number): Pt => { const L = plen(p) * Math.max(0, Math.min(1, t)); let d = 0; for (let i = 1; i < p.length; i++) { const s = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (d + s >= L) { const k = (L - d) / s; return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * k, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * k]; } d += s; } return p[p.length - 1]; };
const Route: React.FC<{ p: Pt[]; t: number; col: string; label?: string; lx?: number; ly?: number }> = ({ p, t, col, label, lx = 20, ly = 0 }) => {
  if (t <= 0) return null; const L = plen(p); const e = at(p, t);
  return (<g><path d={pathD(p)} fill="none" stroke="#f3ead8" strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${L * t} ${L * 2}`} />
    <path d={pathD(p)} fill="none" stroke={col} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${L * t} ${L * 2}`} />
    <circle cx={e[0]} cy={e[1]} r={16} fill={col} stroke="#f3ead8" strokeWidth={4} />
    {label && t > 0.5 && <text x={e[0] + lx} y={e[1] + ly} fontFamily={HEAD} fontWeight={700} fontSize={40} fill={col} stroke="#f3ead8" strokeWidth={7} style={{ paintOrder: 'stroke' }}>{label}</text>}</g>);
};
const Valley: React.FC<{ village?: number; children?: React.ReactNode }> = ({ village = 1, children }) => {
  const tipis = Array.from({ length: 34 }, (_, i) => [200 + hash01(i, 3) * 260, 480 + hash01(i, 5) * 560] as Pt).sort((a, b) => a[1] - b[1]);
  return (
    <Svg>
      {Array.from({ length: 14 }, (_, i) => <path key={i} d={`M${700 + (i % 4) * 90},${220 + Math.floor(i / 4) * 230} q40,-34 80,0`} fill="none" stroke="#6b5235" strokeWidth={3} opacity={0.4} />)}
      <path d={pathD(RIVER)} fill="none" stroke="#4f7a96" strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
      <text x={600} y={200} fontFamily={SERIF} fontStyle="italic" fontWeight={700} fontSize={34} fill="#3f5a6e">Little Bighorn River</text>
      {village > 0 && tipis.map(([x, y], i) => <g key={i} opacity={Math.min(1, village * 3 - (i / tipis.length) * 2)}><Tipi x={x} y={y} s={0.75} /></g>)}
      {village > 0.5 && <text x={330} y={1130} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={46} fill="#5a3d24" letterSpacing={4} opacity={(village - 0.5) * 2}>THE VILLAGE</text>}
      {children}
    </Svg>
  );
};

/* ---------------- scenes ---------------- */
export const S01: React.FC = () => {
  const f = useCurrentFrame(); const n = wf(1, '210'), nev = wf(1, 'never');
  return (
    <Cam push={0.04 * ease(f, 0, 200)}>
      <Frontier />
      <Photo src="assets/archival/note.jpg" at={0} x={170} y={150} w={740} h={880} rot={-2} pos="50% 30%" caption="Custer's last order · June 25, 1876" credit="public domain" grade="sepia" zoom={0.05} />
      <div style={{ position: 'absolute', left: 620, top: 820, padding: '4px 22px', background: 'rgba(243,234,216,0.92)', opacity: lin(f, n - 2, n + 6), borderLeft: `8px solid ${C.red}` }}>
        <Counter to={210} at={n} dur={16} x={0} y={0} size={120} align="left" label="LIVES" color={C.red} /><div style={{ height: 170, width: 260 }} />
      </div>
      <Stamp text="HELP NEVER CAME" at={nev} x={540} y={1170} size={74} rot={-6} />
    </Cam>
  );
};

export const S02: React.FC = () => {
  const f = useCurrentFrame(); const vil = wf(2, 'village'), enorm = wf(2, 'enormous'), hills = wf(2, 'hills');
  return (
    <Cam push={0.03 * ease(f, 0, 240)} oy={40}>
      <Frontier />
      <Valley village={ease(f, vil - 6, vil + 30)}>
        <Person x={860} y={980 + 6 * Math.sin(f / 20)} s={1.0} coat="buckskin" head="assets/archival/head_custer.png" armR={lin(f, vil, vil + 12, 8, 78)} armL={10} nod={lin(f, vil, vil + 12, 0, 8)} breathe={f / 9} flip />
      </Valley>
      <Note text="JUNE 25, 1876 · NOON" at={4} x={60} y={150} size={34} />
      <Note text="LT. COL. GEORGE A. CUSTER" at={hills} x={600} y={260} size={26} />
      <Stamp text="ENORMOUS" at={enorm} x={330} y={1210} size={84} rot={-5} />
    </Cam>
  );
};

export const S03: React.FC = () => {
  const f = useCurrentFrame(); const sp = wf(3, 'split'), ev = wf(3, 'every');
  return (
    <Cam>
      <Frontier />
      <Valley village={1}>
        <Route p={R_RENO} t={ease(f, sp, sp + 30)} col={BLUE} label="RENO" lx={-150} ly={-30} />
        <Route p={R_BENT} t={ease(f, sp + 8, sp + 34)} col="#6b5a2e" label="BENTEEN" lx={-250} ly={-30} />
        <Route p={R_CUSTER} t={ease(f, sp + 14, sp + 50)} col={C.red} label="CUSTER" lx={30} ly={-10} />
      </Valley>
      <Note text="1 REGIMENT · SPLIT IN 3" at={sp} x={60} y={150} size={34} />
      <Stamp text="EVERY MAN NEEDED" at={ev} x={760} y={1230} size={56} rot={-4} />
    </Cam>
  );
};

export const S04: React.FC = () => {
  const f = useCurrentFrame(); const tr = wf(4, 'trumpeter'), it = wf(4, 'italian'), wr = wf(4, 'wrote');
  return (
    <Cam>
      <Frontier />
      <Poster at={0} top="THE MESSENGER" big="JOHN MARTIN" y={120} />
      <Svg>
        <Person x={330} y={1150} s={1.1} coat="blue" hat="kepi" prop="trumpet" armR={lin(f, tr, tr + 10, 8, 70)} breathe={f / 8} nod={2 * Math.sin(f / 15)} />
        <Person x={760} y={1150} s={1.1} coat="blue" hat="slouch" prop={f > wr - 10 ? 'paper' : 'pen'} armR={50 + 10 * Math.sin(f / 4) * lin(f, wr - 4, wr + 4)} armL={30} flip nod={6 + 3 * Math.sin(f / 6)} breathe={f / 9} />
      </Svg>
      <Note text="BORN GIOVANNI MARTINO · ITALY" at={it - 4} x={60} y={380} size={28} />
      <Note text="SPOKE LITTLE ENGLISH" at={it + 8} x={60} y={440} size={28} />
      <Note text="THE ADJUTANT, LT. W. W. COOKE" at={wr - 12} x={520} y={520} size={24} />
    </Cam>
  );
};

export const S05: React.FC = () => {
  const f = useCurrentFrame();
  const hills = (k: number, y: number, col: string, amp: number, speed: number) => {
    const off = (f * speed) % 600;
    const d = Array.from({ length: 6 }, (_, i) => `q150,${-amp} 300,0`).join(' ');
    return <path transform={`translate(${-off},0)`} d={`M-300,${y} ${d} ${d} L3300,2000 L-300,2000 Z`} fill={col} opacity={k} />;
  };
  return (
    <AbsoluteFill>
      <Frontier />
      <Svg>
        {hills(0.5, 820, '#c7a874', 70, 4)}
        {hills(0.75, 1000, '#b08f5b', 90, 9)}
        {hills(1, 1180, '#8f6f42', 60, 18)}
        <Horse x={480} y={1150} s={1.15} phase={f * 0.07} rider="trooper" coat="#5a3a22" />
        {Array.from({ length: 14 }, (_, i) => { const t = ((f * 3 + i * 23) % 60) / 60; return <circle key={i} cx={330 - t * 260} cy={1140 - t * 40 - (i % 3) * 14} r={14 + t * 30} fill={DUST} opacity={0.5 * (1 - t)} />; })}
      </Svg>
      <Note text="BACK ALONG THE TRAIL · FULL GALLOP" at={4} x={60} y={160} size={30} />
      <Ico name="envelope" at={6} x={860} y={420} s={150} rot={-8} />
    </AbsoluteFill>
  );
};

export const S06: React.FC = () => {
  const f = useCurrentFrame();
  const lines: [string, string][] = [['Benteen.', 'benteen'], ['Come on.', 'come'], ['Big village.', 'big'], ['Be quick.', 'quick'], ['Bring packs.', 'bring']];
  return (
    <Cam push={0.05 * ease(f, 0, 100)}>
      <Frontier dark={0.12} />
      <Photo src="assets/archival/note.jpg" at={0} x={110} y={140} w={520} h={720} rot={-3} pos="50% 25%" grade="sepia" />
      <div style={{ position: 'absolute', left: 660, top: 260, width: 420 }}>
        {lines.map(([t, w], i) => { const a = wf(6, w); return <div key={t} style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 58, lineHeight: 1.35, color: i === 4 ? C.red : '#2a1d12', opacity: lin(f, a - 3, a + 3), transform: `translateX(${(1 - ease(f, a - 3, a + 6)) * 30}px)` }}>{t}</div>; })}
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 40, color: C.red, marginTop: 20, opacity: lin(f, wf(6, 'bring') + 12, wf(6, 'bring') + 20) }}>P.S. Bring packs.</div>
      </div>
    </Cam>
  );
};

export const S07: React.FC = () => {
  const f = useCurrentFrame(); const mu = wf(7, 'mules'), am = wf(7, 'ammunition');
  const X = (base: number) => base - 1.6 * f;
  return (
    <AbsoluteFill>
      <Frontier />
      <Svg>
        <path d="M0,1180 L1080,1180" stroke="#8f6f42" strokeWidth={8} opacity={0.5} />
        <Person x={X(520)} y={1180} s={0.9} coat="blue" hat="slouch" walk={f / 22} armR={40} breathe={f / 9} flip />
        {[0, 1, 2].map((i) => <Horse key={i} x={X(820 + i * 330)} y={1180} s={0.8} phase={f * 0.035 + i * 0.3} mule packs coat="#7a6048" flip />)}
      </Svg>
      <Note text="THE PACK TRAIN" at={mu - 6} x={60} y={170} size={36} />
      <Stamp text="PACKS = AMMUNITION" at={am} x={540} y={520} size={72} rot={-5} />
    </AbsoluteFill>
  );
};

export const S08: React.FC = () => {
  const f = useCurrentFrame(); const got = wf(8, 'got'), sh = wf(8, 'shattered'), st = wf(8, 'stopped'), wa = wf(8, 'waited');
  const arrive = ease(f, got - 6, got + 40);
  return (
    <Cam>
      <Frontier />
      <Svg>
        <path d="M-40,1210 Q300,880 640,940 Q900,980 1120,1210 Z" fill="#a98a57" opacity={0.6} />
        {[0, 1, 2].map((i) => <Person key={i} x={600 + i * 130} y={1000 + i * 30} s={0.6} coat="blue" hat="slouch" armL={60} armR={70} nod={18} breathe={f / 7 + i} />)}
        <Person x={330} y={1130} s={1.15} coat="blue" head="assets/archival/head_reno.png" nod={lin(f, sh, sh + 15, 0, 12)} armL={20} armR={30} breathe={f / 8} />
        <Person x={1200 - 420 * arrive} y={1180} s={1.2} coat="blue" head="assets/archival/head_benteen.png" walk={arrive < 1 ? f / 18 : 0} armR={f > got ? 40 : 8} prop="paper" flip breathe={f / 9} />
      </Svg>
      <Note text="CAPT. FREDERICK BENTEEN" at={got} x={540} y={300} size={28} />
      <Note text="MAJ. MARCUS RENO" at={sh - 4} x={60} y={360} size={28} />
      <Stamp text="HE STOPPED" at={st} x={540} y={600} size={96} rot={-7} />
      <Ico name="clock" at={wa - 4} x={860} y={720} s={150} />
    </Cam>
  );
};

export const S09: React.FC = () => {
  const f = useCurrentFrame(); const hr = wf(9, 'hour'), nev = wf(9, 'never');
  return (
    <Cam push={0.04 * ease(f, 0, 160)} ox={60} oy={25}>
      <Frontier dark={0.08} />
      <Valley village={1}>
        <Route p={R_CUSTER} t={1} col={C.red} />
        <g transform="translate(650,360)" opacity={lin(f, nev - 6, nev + 6)}>
          {Array.from({ length: 210 }, (_, i) => <circle key={i} cx={(i % 15) * 16 - 112} cy={Math.floor(i / 15) * 16 - 240} r={5.5} fill={C.red} opacity={1 - 0.75 * lin(f, nev + i * 0.15, nev + 8 + i * 0.15)} />)}
        </g>
      </Valley>
      <div style={{ position: 'absolute', left: 60, top: 150, padding: '4px 20px', background: 'rgba(243,234,216,0.92)', opacity: lin(f, hr - 6, hr + 4), borderLeft: `8px solid ${C.red}` }}>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 100, color: '#2a1d12', lineHeight: 1 }}>1 HOUR+</div>
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 28, color: C.red }}>WAITING FOR THE MULES</div>
      </div>
      <Stamp text="NEVER SEEN ALIVE AGAIN" at={nev + 6} x={540} y={1230} size={60} rot={-4} />
    </Cam>
  );
};

export const S10: React.FC = () => {
  const f = useCurrentFrame(); const sh = wf(10, 'should'), re = wf(10, 'read');
  return (
    <Cam>
      <Frontier />
      <Svg>
        <Person x={250} y={1180} s={0.9} coat="blue" hat="kepi" prop="trumpet" armR={20} breathe={f / 8} nod={-4 + 3 * Math.sin(f / 12)} />
      </Svg>
      <Note text="ONE OF THE LAST TO SEE CUSTER ALIVE" at={4} x={60} y={170} size={28} />
      {[['RIDE ON TO CUSTER', C.red], ['STAY WITH RENO', BLUE]].map(([t, c], i) => (
        <div key={t} style={{ position: 'absolute', left: 470, top: 420 + i * 190, width: 560, padding: '22px 26px', background: '#f6eedb', borderLeft: `12px solid ${c}`, boxShadow: '0 14px 30px rgba(20,12,4,0.45)', fontFamily: HEAD, fontWeight: 700, fontSize: 52, color: '#2a1d12', opacity: lin(f, sh + i * 8, sh + 8 + i * 8), transform: `translateX(${(1 - ease(f, sh + i * 8, sh + 14 + i * 8)) * 80}px)` }}>{i ? 'B · ' : 'A · '}{t}</div>
      ))}
      <Photo src="assets/archival/note.jpg" at={re - 4} x={600} y={830} w={330} h={300} rot={4} pos="50% 20%" grade="sepia" />
      <div style={{ position: 'absolute', left: 60, right: 0, top: 120, opacity: lin(f, re, re + 6) }} />
    </Cam>
  );
};

export const SCENE_COMPS = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10];
export { COAT, Particles };
