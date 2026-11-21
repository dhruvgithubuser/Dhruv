import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import eu from './data/europe.json';
import { Parchment } from './kit';
import { C, HEAD, MONO, TYPE } from './theme';

/* Parchment map of Europe, 16:9: coastlines only (no modern borders), regional washes clipped to land, red/green campaign arrows. */
type Pt = [number, number];
export type View = { lon: number; lat: number; k: number };
export const lerpView = (a: View, b: View, t: number): View => ({ lon: a.lon + (b.lon - a.lon) * t, lat: a.lat + (b.lat - a.lat) * t, k: a.k * Math.pow(b.k / a.k, t) });
export const proj = (v: View) => { const c = Math.cos((v.lat * Math.PI) / 180); return (lon: number, lat: number): Pt => [960 + (lon - v.lon) * v.k * c, 520 - (lat - v.lat) * v.k]; };
const path = (pts: Pt[], close = false) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('') + (close ? 'Z' : '');
const len = (p: Pt[]) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0);
export const along = (p: Pt[], t: number): Pt => { const L = len(p) * Math.max(0, Math.min(1, t)); let d = 0; for (let i = 1; i < p.length; i++) { const s = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (d + s >= L) { const k = (L - d) / (s || 1); return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * k, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * k]; } d += s; } return p[p.length - 1]; };

export const PL: Record<string, Pt> = {
  paris: [2.35, 48.86], london: [-0.13, 51.5], kovno: [23.9, 54.9], vilnius: [25.28, 54.69], vitebsk: [30.17, 55.19], smolensk: [32.03, 54.78], borodino: [35.82, 55.52],
  moscow: [37.62, 55.75], maloyaroslavets: [36.47, 55.01], tarutino: [37.0, 55.15], krasnoi: [31.4, 54.56], borisov: [28.5, 54.23], studienka: [28.36, 54.35], smorgon: [26.4, 54.48], orsha: [30.4, 54.5], vyazma: [34.3, 55.21],
  stpetersburg: [30.31, 59.94], leipzig: [12.37, 51.34], elba: [10.25, 42.78], waterloo: [4.4, 50.68], warsaw: [21.01, 52.23], berlin: [13.4, 52.52], vienna: [16.37, 48.21],
  hamburg: [9.99, 53.55], amsterdam: [4.9, 52.37], madrid: [-3.7, 40.42], kassel: [9.48, 51.31], naples: [14.27, 40.85], trieste: [13.77, 45.65], danzig: [18.65, 54.35], bordeaux: [-0.58, 44.84], antwerp: [4.4, 51.22], genoa: [8.93, 44.41], venice: [12.33, 45.44], marseille: [5.37, 43.3], lubeck: [10.69, 53.87], cannes: [7.0, 43.55],
};
// Coarse, approximate 1812 regions (drawn as soft washes, clipped to the coastline).
export const REGION: Record<string, Pt[]> = {
  france: [[-5, 48.5], [-1.5, 50], [2.5, 51.2], [4, 52.8], [7, 53.8], [10.5, 54.4], [14, 54.3], [18.6, 55], [21.5, 55.3], [23.5, 54.2], [24, 52.5], [23.6, 50.6], [22.6, 49.6], [19.5, 49.6], [16.5, 50.3], [14.5, 50.9], [12.2, 50.3], [13.8, 48.8], [13, 47.5], [13.6, 46.6], [15.6, 46.4], [16.2, 45.2], [17.6, 43.3], [19, 42.2], [18.6, 39.6], [15.5, 36.5], [11, 36], [6, 38.5], [3.6, 41.8], [0.5, 39], [-1, 36.5], [-6, 36], [-7.3, 37.2], [-7, 39.6], [-6.8, 42], [-9.8, 43.6], [-5, 44.2], [-1.6, 44.2], [-5, 48.5]],
  russia: [[20.6, 57.2], [22.5, 55.2], [23.9, 54.9], [23.6, 53.8], [23.9, 52.6], [24.2, 51], [26.3, 48.3], [28.2, 46.4], [30.2, 45.4], [36, 44], [42, 41.2], [52, 40], [62, 45], [62, 72], [28, 72], [21, 69], [24, 65.8], [21.5, 63], [21.4, 60], [20.6, 57.2]],
  britain: [[-11, 49.8], [2.2, 50.6], [2.2, 53], [-0.5, 61], [-11, 59], [-11, 49.8]],
  austria: [[12.2, 50.3], [14.5, 50.9], [16.5, 50.3], [19.5, 49.6], [22.6, 49.6], [26.3, 48.3], [24, 46], [22, 44.6], [19, 45], [16.2, 45.2], [15.6, 46.4], [13.6, 46.6], [13, 47.5], [13.8, 48.8], [12.2, 50.3]],
  prussia: [[10.5, 54.4], [14, 54.3], [18.6, 55], [21.5, 55.3], [20.4, 54], [18.5, 53.6], [16, 53], [14.5, 51.8], [16.5, 50.3], [14.5, 50.9], [12.2, 50.3], [11.6, 52.6], [10.5, 54.4]],
};

export type Arrow = { pts: (string | Pt)[]; p: number; color?: string; width?: number; dashed?: boolean };
export type Pin = { at: string | Pt; label?: string; o: number; color?: string; side?: 'l' | 'r' | 't' | 'b'; size?: number };
export type Wash = { r: keyof typeof REGION | Pt[]; o: number; color: string; label?: string; at?: Pt; size?: number };
const pt = (x: string | Pt): Pt => (typeof x === 'string' ? PL[x] : x);

export const VoxMap: React.FC<{ view: View; arrows?: Arrow[]; pins?: Pin[]; washes?: Wash[]; snow?: number; children?: (P: (a: number, b: number) => Pt) => React.ReactNode; labels?: { at: Pt; text: string; o: number; size?: number; color?: string; spacing?: number }[] }> = ({
  view, arrows = [], pins = [], washes = [], snow = 0, children, labels = [],
}) => {
  const f = useCurrentFrame();
  const P = proj(view);
  const d = eu as unknown as { land: Pt[][] };
  const land = d.land.map((r) => path(r.map(([a, b]) => P(a, b)), true)).join('');
  const grat: string[] = [];
  for (let lo = -30; lo <= 70; lo += 5) grat.push(path([P(lo, 30), P(lo, 72)]));
  for (let la = 30; la <= 72; la += 5) grat.push(path([P(-30, la), P(70, la)]));
  const sw = Math.max(1.6, Math.min(3, view.k / 40));
  return (
    <AbsoluteFill>
      <Parchment />
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <clipPath id="landClip"><path d={land} fillRule="evenodd" /></clipPath>
          <pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="14" fill="rgba(0,0,0,0)" /><line x1="0" y1="0" x2="0" y2="14" stroke="rgba(42,33,23,0.18)" strokeWidth="3" /></pattern>
        </defs>
        <rect width={1920} height={1080} fill="rgba(90,105,100,0.22)" />
        <path d={grat.join('')} stroke="rgba(70,50,30,0.16)" strokeWidth={1} fill="none" />
        <path d={land} fill={snow ? '#ece9e2' : C.land} fillRule="evenodd" />
        <g clipPath="url(#landClip)">
          {washes.map((w, i) => w.o > 0 && <path key={i} d={path((typeof w.r === 'string' ? REGION[w.r] : w.r).map(([a, b]) => P(a, b)), true)} fill={w.color} opacity={0.42 * w.o} />)}
          {washes.map((w, i) => w.o > 0 && <path key={`h${i}`} d={path((typeof w.r === 'string' ? REGION[w.r] : w.r).map(([a, b]) => P(a, b)), true)} fill="url(#hatch)" opacity={w.o} />)}
        </g>
        <path d={land} fill="none" stroke="rgba(52,36,22,0.85)" strokeWidth={sw} strokeLinejoin="round" fillRule="evenodd" />
        {washes.map((w, i) => { if (!w.label || w.o < 0.3 || !w.at) return null; const [x, y] = P(...w.at);
          return <text key={`l${i}`} x={x} y={y} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={w.size ?? 44} letterSpacing={8} fill={w.color} opacity={Math.min(1, (w.o - 0.3) * 2)} stroke="rgba(239,230,210,0.85)" strokeWidth={6} style={{ paintOrder: 'stroke' }}>{w.label}</text>; })}
        {labels.map((l, i) => { if (l.o <= 0) return null; const [x, y] = P(...l.at);
          return <text key={`t${i}`} x={x} y={y} textAnchor="middle" fontFamily={HEAD} fontWeight={500} fontSize={l.size ?? 34} letterSpacing={l.spacing ?? 8} fill={l.color ?? 'rgba(42,33,23,0.55)'} opacity={l.o}>{l.text}</text>; })}
        {arrows.map((a, i) => {
          if (a.p <= 0) return null;
          const pp = a.pts.map((x) => P(...pt(x))); const L = len(pp) * 1.02; const col = a.color ?? C.red; const w = a.width ?? 12;
          const h = along(pp, a.p); const h2 = along(pp, Math.max(0, a.p - 0.02)); const ang = (Math.atan2(h[1] - h2[1], h[0] - h2[0]) * 180) / Math.PI;
          return (
            <g key={i}>
              <path d={path(pp)} fill="none" stroke="rgba(239,230,210,0.9)" strokeWidth={w + 8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={a.dashed ? `${w * 1.4} ${w * 1.6}` : `${L * a.p} ${L * 2}`} opacity={a.dashed ? 0 : 1} />
              <path d={path(pp)} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={a.dashed ? `${w * 1.2} ${w * 1.6}` : `${L * a.p} ${L * 2}`} opacity={a.dashed ? Math.min(1, a.p * 3) : 1} />
              {!a.dashed && <path transform={`translate(${h[0]},${h[1]}) rotate(${ang})`} d={`M${-w * 1.3},${-w * 1.7} L${w * 1.7},0 L${-w * 1.3},${w * 1.7} Z`} fill={col} stroke="rgba(239,230,210,0.9)" strokeWidth={3} />}
            </g>
          );
        })}
        {children && children(P)}
        {pins.map((p, i) => {
          if (p.o <= 0) return null;
          const [x, y] = P(...pt(p.at)); const col = p.color ?? C.red; const s = p.size ?? 40;
          const [tx, ty, anchor] = p.side === 'l' ? [x - 26, y + s * 0.35, 'end'] : p.side === 't' ? [x, y - 26, 'middle'] : p.side === 'b' ? [x, y + s + 18, 'middle'] : [x + 26, y + s * 0.35, 'start'];
          return (
            <g key={`p${i}`} opacity={Math.min(1, p.o * 2)}>
              <circle cx={x} cy={y} r={18 + 5 * Math.sin(f / 8 + i)} fill="rgba(239,230,210,0.6)" stroke={col} strokeWidth={3} />
              <circle cx={x} cy={y} r={9} fill={col} stroke={C.charcoal} strokeWidth={2} />
              {p.label && <text x={tx} y={ty} textAnchor={anchor as 'start'} fontFamily={HEAD} fontWeight={700} fontSize={s} letterSpacing={1.5} fill={C.charcoal} stroke="rgba(239,230,210,0.95)" strokeWidth={7} style={{ paintOrder: 'stroke' }}>{p.label}</text>}
            </g>
          );
        })}
      </svg>
      <div style={{ position: 'absolute', right: 30, top: 24, fontFamily: MONO, fontSize: 15, letterSpacing: 2, color: 'rgba(42,33,23,0.5)' }}>MAP: NATURAL EARTH COASTLINES · 1812 REGIONS APPROXIMATE</div>
    </AbsoluteFill>
  );
};
export const Distance: React.FC<{ a: Pt; b: Pt; P: (a: number, b: number) => Pt; label: string; o: number }> = ({ a, b, P, label, o }) => {
  if (o <= 0) return null;
  const [x0, y0] = P(...a), [x1, y1] = P(...b);
  return (
    <g opacity={o}>
      <line x1={x0} y1={y0} x2={x0 + (x1 - x0) * Math.min(1, o)} y2={y0 + (y1 - y0) * Math.min(1, o)} stroke={C.charcoal} strokeWidth={3} strokeDasharray="10 8" />
      <text x={(x0 + x1) / 2} y={(y0 + y1) / 2 + 56} textAnchor="middle" fontFamily={TYPE} fontWeight={700} fontSize={34} fill={C.ink} stroke="rgba(239,230,210,0.95)" strokeWidth={6} style={{ paintOrder: 'stroke' }}>{label}</text>
    </g>
  );
};
