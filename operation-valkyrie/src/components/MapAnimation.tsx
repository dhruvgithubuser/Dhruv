import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import europe from '../data/europe.json';
import { C, HEAD, MONO, TYPE, lin } from '../theme';
import { Parchment } from './DocumentaryStage';

type Pt = [number, number];
const RINGS = europe as Pt[][];
export type View = { lon: number; lat: number; k: number; cy?: number };
const proj = (v: View) => {
  const c = Math.cos((v.lat * Math.PI) / 180);
  return (lon: number, lat: number): Pt => [540 + (lon - v.lon) * v.k * c, (v.cy ?? 960) - (lat - v.lat) * v.k];
};
export const PLACES: Record<string, Pt> = {
  berlin: [13.4, 52.52], wolfslair: [21.49, 54.08], rangsdorf: [13.43, 52.29], paris: [2.35, 48.86], london: [-0.13, 51.5],
  rome: [12.5, 41.9], moscow: [37.6, 55.75], vienna: [16.37, 48.21], warsaw: [21.0, 52.23],
};

/**
 * Archival map of Europe (coastlines only; no 1944 borders are drawn). Optional 3D tilt so it reads as a map lying on the
 * planning table. Germany is marked by a muted red wash around Berlin; routes draw progressively.
 */
export const EuropeMap: React.FC<{ view: View; tilt?: number; germany?: number; routes?: { from: string; to: string; p: number; dashed?: boolean; label?: string }[]; pins?: { at: string; label: string; o: number }[] }> = ({
  view, tilt = 0, germany = 0, routes = [], pins = [],
}) => {
  const f = useCurrentFrame();
  const P = proj(view);
  const d = RINGS.map((r) => r.map(([lo, la], i) => `${i ? 'L' : 'M'}${P(lo, la).map((v) => v.toFixed(1)).join(',')}`).join('') + 'Z').join('');
  const [bx, by] = P(...PLACES.berlin);
  const grat: string[] = [];
  for (let lo = -30; lo <= 60; lo += 5) grat.push(`M${P(lo, 25).join(',')}L${P(lo, 75).join(',')}`);
  for (let la = 30; la <= 70; la += 5) grat.push(`M${P(-30, la).join(',')}L${P(65, la).join(',')}`);
  return (
    <AbsoluteFill style={{ perspective: 1600 }}>
      <AbsoluteFill style={{ transform: `rotateX(${tilt}deg)`, transformOrigin: '50% 70%' }}>
        <Parchment />
        <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <radialGradient id="ger"><stop offset="0" stopColor={C.red} stopOpacity="0.55" /><stop offset="1" stopColor={C.red} stopOpacity="0" /></radialGradient>
            <marker id="ah" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={C.red} /></marker>
          </defs>
          <rect width={1080} height={1920} fill="rgba(90,105,100,0.22)" />
          <path d={grat.join('')} stroke="rgba(70,50,30,0.18)" strokeWidth={1} fill="none" />
          <path d={d} fill="#e2d4b0" stroke="rgba(52,36,22,0.85)" strokeWidth={2} strokeLinejoin="round" />
          {germany > 0 && <ellipse cx={bx + 0.02 * view.k} cy={by + 1.6 * view.k} rx={6.5 * view.k * 0.65 * Math.min(1, germany * 1.2)} ry={4.2 * view.k * Math.min(1, germany * 1.2)} fill="url(#ger)" opacity={germany} />}
          {germany > 0.5 && <text x={bx - 10} y={by + 2.2 * view.k} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={40} letterSpacing={8} fill={C.red} opacity={(germany - 0.5) * 2}>GERMANY</text>}
          {routes.map((r, i) => {
            if (r.p <= 0) return null;
            const [x0, y0] = P(...PLACES[r.from]), [x1, y1] = P(...PLACES[r.to]);
            const mx = (x0 + x1) / 2 + (y1 - y0) * 0.2, my = (y0 + y1) / 2 - (x1 - x0) * 0.2;
            const len = Math.hypot(x1 - x0, y1 - y0) * 1.15;
            const q = Math.min(1, r.p);
            const tx = (1 - q) ** 2 * x0 + 2 * (1 - q) * q * mx + q * q * x1, ty = (1 - q) ** 2 * y0 + 2 * (1 - q) * q * my + q * q * y1;
            return (
              <g key={i}>
                <path d={`M${x0},${y0} Q${mx},${my} ${x1},${y1}`} fill="none" stroke={C.red} strokeWidth={8} strokeLinecap="round" strokeDasharray={r.dashed ? '2 16' : `${len * q} ${len * 2}`} opacity={r.dashed ? q : 1} markerEnd={q > 0.98 && !r.dashed ? 'url(#ah)' : undefined} />
                {q < 1 && <circle cx={tx} cy={ty} r={12} fill={C.red} stroke="#f3ead8" strokeWidth={4} />}
                {r.label && q > 0.5 && <text x={(x0 + x1) / 2 + 20} y={my - 20} fontFamily={TYPE} fontWeight={700} fontSize={28} fill={C.ink} opacity={(q - 0.5) * 2}>{r.label}</text>}
              </g>
            );
          })}
          {pins.map((p, i) => {
            if (p.o <= 0) return null;
            const [x, y] = P(...PLACES[p.at]);
            const drop = (1 - Math.min(1, p.o)) * -40;
            return (
              <g key={i} transform={`translate(${x},${y + drop})`} opacity={Math.min(1, p.o * 2)}>
                <circle r={13} fill={C.red} stroke="#f3ead8" strokeWidth={4} />
                <circle r={22 + 6 * Math.sin(f / 8 + i)} fill="none" stroke={C.red} strokeWidth={2} opacity={0.6} />
                <text x={22} y={-18} fontFamily={HEAD} fontWeight={700} fontSize={36} letterSpacing={2} fill={C.ink} stroke="#efe6d2" strokeWidth={6} style={{ paintOrder: 'stroke' }}>{p.label}</text>
              </g>
            );
          })}
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ Berlin, 20 July 1944 (schematic, not to scale)
/** Schematic of central Berlin: the Bendlerblock (plot HQ) and the targets in the government quarter. */
const B: Record<string, { x: number; y: number; label: string; sub?: string }> = {
  bendler: { x: 300, y: 1090, label: 'BENDLERBLOCK', sub: 'plot headquarters' },
  wilhelm: { x: 790, y: 980, label: 'WILHELMSTRASSE', sub: 'government quarter' },
  chancellery: { x: 800, y: 1170, label: 'REICH CHANCELLERY' },
  propaganda: { x: 860, y: 860, label: 'PROPAGANDA MINISTRY' },
  radio: { x: 140, y: 720, label: 'RADIO HOUSE' },
};
export const BERLIN_TARGETS = ['wilhelm', 'chancellery', 'propaganda', 'radio'];
export const BerlinMap: React.FC<{ routes?: number; stop?: number; tilt?: number; pins?: number }> = ({ routes = 0, stop = 0, tilt = 0, pins = 1 }) => {
  const f = useCurrentFrame();
  const o = B.bendler;
  return (
    <AbsoluteFill style={{ perspective: 1600 }}>
      <AbsoluteFill style={{ transform: `rotateX(${tilt}deg)`, transformOrigin: '50% 70%' }}>
        <Parchment />
        <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
          <defs><pattern id="blk" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke="rgba(60,40,20,0.3)" strokeWidth="2" /></pattern></defs>
          {/* Tiergarten park + the Spree */}
          <path d="M120,880 Q300,820 560,860 L600,1010 Q380,1040 140,1000 Z" fill="rgba(75,90,58,0.35)" stroke="rgba(60,70,40,0.6)" strokeWidth={2} />
          <text x={340} y={950} textAnchor="middle" fontFamily={TYPE} fontSize={26} fill="#3a4a2a" letterSpacing={4}>TIERGARTEN</text>
          <path d="M-20,760 Q300,700 560,780 T1100,700" stroke="#8fa3a6" strokeWidth={34} fill="none" opacity={0.8} />
          <text x={980} y={680} textAnchor="end" fontFamily={TYPE} fontSize={22} fill="#3a4a5a">SPREE</text>
          {/* street grid */}
          {Array.from({ length: 6 }, (_, i) => <rect key={`a${i}`} x={640 + (i % 2) * 120} y={820 + Math.floor(i / 2) * 140} width={100} height={110} fill="url(#blk)" stroke="rgba(60,40,20,0.5)" strokeWidth={2} />)}
          {Array.from({ length: 4 }, (_, i) => <rect key={`b${i}`} x={180 + (i % 2) * 130} y={1060 + Math.floor(i / 2) * 140} width={110} height={110} fill="url(#blk)" stroke="rgba(60,40,20,0.5)" strokeWidth={2} />)}
          <path d="M760,800 L760,1300" stroke="#efe6d2" strokeWidth={22} />
          <path d="M760,800 L760,1300" stroke="rgba(60,40,20,0.5)" strokeWidth={2} strokeDasharray="10 8" />
          {/* routes from the Bendlerblock to targets */}
          {BERLIN_TARGETS.map((k, i) => {
            const t = B[k];
            const p = Math.max(0, Math.min(1, routes * 1.4 - i * 0.12));
            const pe = stop > 0 ? Math.min(p, 0.45 + 0.5 * (1 - stop) * p) : p;
            if (pe <= 0) return null;
            const mx = (o.x + t.x) / 2, my = Math.min(o.y, t.y) - 120;
            const L = Math.hypot(t.x - o.x, t.y - o.y) * 1.3;
            return <path key={k} d={`M${o.x},${o.y} Q${mx},${my} ${t.x},${t.y}`} fill="none" stroke={stop > 0 ? `rgba(142,27,22,${1 - 0.6 * stop})` : C.red} strokeWidth={9} strokeLinecap="round" strokeDasharray={`${L * pe} ${L * 2}`} />;
          })}
          {Object.entries(B).map(([k, b]) => {
            const isO = k === 'bendler';
            const op = isO ? pins : Math.min(1, routes * 2) * pins;
            if (op <= 0) return null;
            return (
              <g key={k} opacity={op}>
                <rect x={b.x - 26} y={b.y - 26} width={52} height={52} fill={isO ? C.green : '#efe6d2'} stroke={isO ? '#1d1b19' : C.red} strokeWidth={5} transform={`rotate(45 ${b.x} ${b.y})`} />
                {!isO && stop > 0.5 && <path d={`M${b.x - 20},${b.y - 20} L${b.x + 20},${b.y + 20} M${b.x + 20},${b.y - 20} L${b.x - 20},${b.y + 20}`} stroke={C.charcoal} strokeWidth={6} />}
                <text x={b.x} y={b.y + 62} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={30} letterSpacing={2} fill={C.ink} stroke="#efe6d2" strokeWidth={6} style={{ paintOrder: 'stroke' }}>{b.label}</text>
                {b.sub && <text x={b.x} y={b.y + 94} textAnchor="middle" fontFamily={TYPE} fontSize={22} fill={C.dim}>{b.sub}</text>}
                {isO && <circle cx={b.x} cy={b.y} r={40 + 8 * Math.sin(f / 7)} fill="none" stroke={C.green} strokeWidth={3} opacity={0.6} />}
              </g>
            );
          })}
        </svg>
        <div style={{ position: 'absolute', right: 70, top: 1470, fontFamily: MONO, fontSize: 18, letterSpacing: 2, color: 'rgba(40,28,16,0.7)' }}>BERLIN · SCHEMATIC · NOT TO SCALE</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
