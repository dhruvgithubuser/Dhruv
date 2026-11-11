import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import eu from '../data/europe.json';
import { ease } from '../theme';
import { GOLD, MONO, SERIF } from './Doc';

/* Documentary relief map, 16:9. Natural Earth 1:50m land, modern borders (dashed), hand-traced rivers. */
type Pt = [number, number];
export type View = { lon: number; lat: number; k: number };
export const lerpView = (a: View, b: View, t: number): View => ({ lon: a.lon + (b.lon - a.lon) * t, lat: a.lat + (b.lat - a.lat) * t, k: a.k * Math.pow(b.k / a.k, t) });
export const proj = (v: View) => { const c = Math.cos((v.lat * Math.PI) / 180); return (lon: number, lat: number): Pt => [960 + (lon - v.lon) * v.k * c, 540 - (lat - v.lat) * v.k]; };
const path = (pts: Pt[], close = false) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('') + (close ? 'Z' : '');
const len = (p: Pt[]) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0);
export const along = (p: Pt[], t: number): Pt => { const L = len(p) * Math.max(0, Math.min(1, t)); let d = 0; for (let i = 1; i < p.length; i++) { const s = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (d + s >= L) { const k = (L - d) / (s || 1); return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * k, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * k]; } d += s; } return p[p.length - 1]; };

export const PL: Record<string, Pt> = {
  paris: [2.35, 48.86], london: [-0.13, 51.5], kovno: [23.9, 54.9], vilnius: [25.28, 54.69], vitebsk: [30.17, 55.19], smolensk: [32.03, 54.78], borodino: [35.82, 55.52],
  moscow: [37.62, 55.75], maloyaroslavets: [36.47, 55.01], tarutino: [37.0, 55.15], krasnoi: [31.4, 54.56], borisov: [28.5, 54.23], studienka: [28.36, 54.35], smorgon: [26.4, 54.48],
  stpetersburg: [30.31, 59.94], leipzig: [12.37, 51.34], elba: [10.25, 42.78], waterloo: [4.4, 50.68], warsaw: [21.01, 52.23], berlin: [13.4, 52.52], vienna: [16.37, 48.21],
  hamburg: [9.99, 53.55], amsterdam: [4.9, 52.37], lisbon: [-9.14, 38.72], barcelona: [2.17, 41.39], genoa: [8.93, 44.41], naples: [14.27, 40.85], trieste: [13.77, 45.65], danzig: [18.65, 54.35], riga: [24.1, 56.95], bordeaux: [-0.58, 44.84], antwerp: [4.4, 51.22], copenhagen: [12.57, 55.68], venice: [12.33, 45.44],
};
const RIVERS: Pt[][] = [
  [[27.0, 53.6], [25.5, 53.55], [24.3, 53.6], [23.8, 53.68], [23.9, 54.3], [23.9, 54.9], [22.9, 55.05], [22.0, 55.1], [21.25, 55.3]], // Niemen
  [[28.6, 54.95], [28.55, 54.6], [28.4, 54.35], [28.5, 54.23], [28.9, 53.6], [29.3, 53.0], [29.9, 52.5], [30.3, 52.1]], // Berezina
  [[33.2, 55.2], [32.03, 54.78], [31.2, 54.6], [30.4, 54.5], [30.35, 53.9], [30.15, 53.2], [30.5, 52.0], [30.5, 50.45]], // Dnieper
  [[35.5, 55.6], [36.5, 55.65], [37.62, 55.75], [38.4, 55.5], [38.8, 55.1]], // Moskva
  [[30.2, 55.4], [29.0, 55.6], [27.5, 55.9], [26.5, 55.9], [25.0, 56.4], [24.1, 56.95]], // Daugava
];

export type Arrow = { pts: (string | Pt)[]; p: number; color?: string; width?: number; dashed?: boolean; glow?: boolean };
export type Pin = { at: string | Pt; label?: string; o: number; color?: string; side?: 'l' | 'r' | 't' | 'b'; size?: number; star?: boolean };
const pt = (x: string | Pt): Pt => (typeof x === 'string' ? PL[x] : x);

export const DocMap: React.FC<{ view: View; arrows?: Arrow[]; pins?: Pin[]; labels?: { at: Pt; text: string; o: number; size?: number; color?: string; rot?: number; spacing?: number }[]; children?: (P: (a: number, b: number) => Pt) => React.ReactNode; tint?: number; snow?: number }> = ({
  view, arrows = [], pins = [], labels = [], children, tint = 0, snow = 0,
}) => {
  const f = useCurrentFrame();
  const P = proj(view);
  const d = eu as { land: Pt[][]; borders: Pt[][] };
  const land = d.land.map((r) => path(r.map(([a, b]) => P(a, b)), true)).join('');
  const sw = Math.max(1.2, Math.min(3, view.k / 60));
  return (
    <AbsoluteFill style={{ background: '#0d1418' }}>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <radialGradient id="sea" cx="50%" cy="45%" r="75%"><stop offset="0" stopColor="#1d3442" /><stop offset="1" stopColor="#0a141b" /></radialGradient>
          <linearGradient id="landG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={snow ? '#c9ced2' : '#6b6447'} /><stop offset="1" stopColor={snow ? '#9aa3a8' : '#4b4632'} /></linearGradient>
          <filter id="relief" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency={0.006 * Math.max(0.5, Math.min(3, 60 / view.k))} numOctaves={5} seed={4} result="n" />
            <feDiffuseLighting in="n" surfaceScale={3.5} lightingColor="#ffffff" result="l"><feDistantLight azimuth={315} elevation={42} /></feDiffuseLighting>
            <feComposite in="l" in2="SourceGraphic" operator="in" result="lc" />
            <feBlend in="SourceGraphic" in2="lc" mode="multiply" />
          </filter>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <pattern id="seaLines" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M0 13 Q6.5 9 13 13 T26 13" fill="none" stroke="rgba(160,200,220,0.07)" strokeWidth="1.2" /></pattern>
        </defs>
        <rect width={1920} height={1080} fill="url(#sea)" /><rect width={1920} height={1080} fill="url(#seaLines)" />
        <path d={land} fill="url(#landG)" filter="url(#relief)" fillRule="evenodd" />
        <path d={land} fill="none" stroke="rgba(230,215,170,0.55)" strokeWidth={sw} fillRule="evenodd" />
        {d.borders.map((b, i) => <path key={i} d={path(b.map(([a, c]) => P(a, c)))} fill="none" stroke="rgba(240,230,200,0.28)" strokeWidth={1.6} strokeDasharray="7 6" />)}
        {RIVERS.map((r, i) => <path key={i} d={path(r.map(([a, b]) => P(a, b)))} fill="none" stroke="#5b9cc4" strokeWidth={Math.max(2, Math.min(6, view.k / 45))} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />)}
        {labels.map((l, i) => { if (l.o <= 0) return null; const [x, y] = P(...l.at);
          return <text key={i} x={x} y={y} textAnchor="middle" transform={l.rot ? `rotate(${l.rot} ${x} ${y})` : undefined} fontFamily={SERIF} fontWeight={900} fontSize={l.size ?? 40} letterSpacing={l.spacing ?? 10} fill={l.color ?? 'rgba(240,230,200,0.55)'} opacity={l.o}>{l.text}</text>; })}
        {arrows.map((a, i) => {
          if (a.p <= 0) return null;
          const pp = a.pts.map((x) => P(...pt(x))); const L = len(pp) * 1.02; const col = a.color ?? '#4a7fd6'; const w = a.width ?? 10; const h = along(pp, a.p);
          const h2 = along(pp, Math.max(0, a.p - 0.015)); const ang = (Math.atan2(h[1] - h2[1], h[0] - h2[0]) * 180) / Math.PI;
          return (
            <g key={i} filter={a.glow !== false ? 'url(#glow)' : undefined}>
              <path d={path(pp)} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={a.dashed ? `${w * 1.6} ${w * 1.4}` : `${L * a.p} ${L * 2}`} opacity={a.dashed ? Math.min(1, a.p * 3) : 1} />
              <path transform={`translate(${h[0]},${h[1]}) rotate(${ang})`} d={`M${-w * 1.4},${-w * 1.8} L${w * 1.6},0 L${-w * 1.4},${w * 1.8} Z`} fill={col} />
            </g>
          );
        })}
        {children && children(P)}
        {pins.map((p, i) => {
          if (p.o <= 0) return null;
          const [x, y] = P(...pt(p.at)); const col = p.color ?? GOLD; const s = p.size ?? 34;
          const [tx, ty, anchor] = p.side === 'l' ? [x - 22, y + s * 0.35, 'end'] : p.side === 't' ? [x, y - 22, 'middle'] : p.side === 'b' ? [x, y + s + 16, 'middle'] : [x + 22, y + s * 0.35, 'start'];
          return (
            <g key={i} opacity={Math.min(1, p.o * 2)}>
              <circle cx={x} cy={y} r={20 + 8 * Math.sin(f / 8 + i)} fill="none" stroke={col} strokeWidth={2} opacity={0.5} />
              {p.star ? <path transform={`translate(${x},${y}) scale(1.1)`} d="M0,-12 L3.5,-4 L12,-4 L5,1.5 L7.5,10 L0,5 L-7.5,10 L-5,1.5 L-12,-4 L-3.5,-4 Z" fill={col} stroke="#111" strokeWidth={1.5} /> : <circle cx={x} cy={y} r={9} fill={col} stroke="#111" strokeWidth={2.5} />}
              {p.label && <text x={tx} y={ty} textAnchor={anchor as 'start'} fontFamily={SERIF} fontWeight={700} fontSize={s} fill="#fff" stroke="rgba(0,0,0,0.85)" strokeWidth={6} style={{ paintOrder: 'stroke' }}>{p.label}</text>}
            </g>
          );
        })}
      </svg>
      {tint > 0 && <AbsoluteFill style={{ background: `rgba(120,150,190,${0.18 * tint})`, mixBlendMode: 'soft-light' }} />}
      <div style={{ position: 'absolute', right: 34, bottom: 24, fontFamily: MONO, fontSize: 15, letterSpacing: 2, color: 'rgba(255,255,255,0.4)' }}>MAP: NATURAL EARTH · MODERN BORDERS SHOWN FOR REFERENCE</div>
    </AbsoluteFill>
  );
};
