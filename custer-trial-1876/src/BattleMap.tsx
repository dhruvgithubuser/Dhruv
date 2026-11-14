import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { SERIF, TYPE, ease, lin } from './theme';

/* An 1876-style survey sketch of the Little Bighorn valley (schematic, not to scale): ink on aged paper. */
type Pt = [number, number];
const RIVER: Pt[] = [[1000, 40], [960, 140], [1010, 240], [950, 330], [990, 430], [930, 520], [960, 610], [900, 700], [930, 790], [880, 880], [910, 970], [880, 1060]];
const RENO: Pt[] = [[1560, 930], [1300, 940], [1050, 935], [910, 900], [840, 830], [800, 780]];
const RENO_BACK: Pt[] = [[820, 790], [890, 770], [960, 720], [1080, 690]];
const BENTEEN: Pt[] = [[1560, 930], [1530, 990], [1450, 1040]];
const CUSTER: Pt[] = [[1560, 930], [1400, 880], [1210, 760], [1150, 600], [1130, 430], [1080, 290]];
const d = (p: Pt[]) => p.map((q, i) => `${i ? 'L' : 'M'}${q[0]},${q[1]}`).join('');
const len = (p: Pt[]) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0);

const Route: React.FC<{ p: Pt[]; t: number; color: string; dash?: boolean; label?: string; lx?: number; ly?: number }> = ({ p, t, color, dash, label, lx = 0, ly = 0 }) => {
  if (t <= 0) return null;
  const L = len(p);
  const end = (() => { let acc = 0; const target = L * t; for (let i = 1; i < p.length; i++) { const s = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (acc + s >= target) { const k = (target - acc) / s; return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * k, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * k]; } acc += s; } return p[p.length - 1]; })();
  return (
    <g>
      <path d={d(p)} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash ? undefined : `${L * t} ${L * 2}`} opacity={0.9} />
      <circle cx={end[0]} cy={end[1]} r={13} fill={color} stroke="#efe6d2" strokeWidth={3} />
      {label && <text x={end[0] + lx} y={end[1] + ly} fontFamily={TYPE} fontWeight={700} fontSize={34} fill={color} opacity={lin(t, 0.4, 0.8)}>{label}</text>}
    </g>
  );
};

export const BattleMap: React.FC<{ benteen: number; reno: number; custer: number; dur: number }> = ({ benteen, reno, custer, dur }) => {
  const f = useCurrentFrame();
  const ink = '#3a2a1a';
  const tipis = Array.from({ length: 46 }, (_, i) => [760 + ((i * 37) % 150) - 40 * Math.sin(i), 440 + (i * 9.1) % 420] as Pt);
  return (
    <AbsoluteFill style={{ background: '#1a140d' }}>
      <AbsoluteFill style={{ transform: `scale(${1.02 + 0.05 * lin(f, 0, dur)})`, transformOrigin: '55% 55%' }}>
        <Img src={staticFile('assets/backgrounds/paper.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.4) brightness(0.92)' }} />
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          {/* hills hatching */}
          {Array.from({ length: 26 }, (_, i) => <path key={i} d={`M${1120 + (i % 6) * 70},${120 + Math.floor(i / 6) * 160} q30,-26 60,0`} fill="none" stroke={ink} strokeWidth={2} opacity={0.35} />)}
          <path d={d(RIVER)} fill="none" stroke="#4f6f86" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
          <text x={1000} y={160} transform="rotate(-70 1000 160)" fontFamily={SERIF} fontStyle="italic" fontWeight={700} fontSize={34} fill="#3f5a6e">Little Bighorn River</text>
          <g opacity={lin(f, 10, 30)}>
            {tipis.map(([x, y], i) => <path key={i} d={`M${x},${y} l9,-22 l9,22 z`} fill="#efe6d2" stroke={ink} strokeWidth={2} />)}
            <text x={600} y={660} fontFamily={SERIF} fontWeight={900} fontSize={40} fill={ink} letterSpacing={6}>THE VILLAGE</text>
            <text x={590} y={700} fontFamily={TYPE} fontWeight={700} fontSize={24} fill={ink}>Lakota · Cheyenne · Arapaho</text>
          </g>
          <Route p={BENTEEN} t={benteen} color="#5a4a2a" label="BENTEEN · 3 companies" lx={-460} ly={50} />
          <Route p={RENO} t={reno} color="#2c4a6e" label="RENO · ~140" lx={-250} ly={60} />
          <Route p={RENO_BACK} t={lin(reno, 0.999, 1) * lin(f, dur * 0.85, dur)} color="#2c4a6e" />
          <Route p={CUSTER} t={custer} color="#8e1b16" label="CUSTER · ~210" lx={30} ly={-10} />
          <text x={1600} y={950} fontFamily={TYPE} fontWeight={700} fontSize={24} fill={ink} opacity={lin(f, 0, 20)}>THE DIVIDE · NOON, JUNE 25</text>
          <g transform="translate(1760,180)" opacity={0.85}><path d="M0,-60 L14,10 L0,0 L-14,10 Z" fill={ink} /><text x={-10} y={46} fontFamily={SERIF} fontWeight={900} fontSize={34} fill={ink}>N</text></g>
          <text x={70} y={1040} fontFamily={TYPE} fontSize={20} fill={ink} opacity={0.7}>SCHEMATIC SKETCH · NOT TO SCALE</text>
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 80% 75% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)' }} />
    </AbsoluteFill>
  );
};
export { ease };
