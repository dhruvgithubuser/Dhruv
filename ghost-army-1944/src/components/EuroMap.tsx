import React from 'react';
import { AbsoluteFill } from 'remotion';
import eu from '../data/europe.json';
import { C, MONO, SANS } from '../theme';
import { Paper } from './VoxKit';

type Pt = [number, number];
export type View = { lon: number; lat: number; k: number };
export const lerpView = (a: View, b: View, t: number): View => ({ lon: a.lon + (b.lon - a.lon) * t, lat: a.lat + (b.lat - a.lat) * t, k: a.k * Math.pow(b.k / a.k, t) });
export const proj = (v: View, cy = 700) => { const c = Math.cos((v.lat * Math.PI) / 180); return (lon: number, lat: number): Pt => [540 + (lon - v.lon) * v.k * c, cy - (lat - v.lat) * v.k]; };
const path = (pts: Pt[], close = false) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('') + (close ? 'Z' : '');
const len = (p: Pt[]) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0);
export const along = (p: Pt[], t: number): Pt => { const L = len(p) * Math.max(0, Math.min(1, t)); let d = 0; for (let i = 1; i < p.length; i++) { const s = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (d + s >= L) { const k = (L - d) / (s || 1); return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * k, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * k]; } d += s; } return p[p.length - 1]; };

export const PL: Record<string, Pt> = {
  normandy: [-0.8, 49.33], brest: [-4.49, 48.39], paris: [2.35, 48.86], luxembourg: [6.13, 49.61], bettembourg: [6.10, 49.52], metz: [6.18, 49.12],
  viersen: [6.39, 51.25], rheinberg: [6.60, 51.55], wesel: [6.62, 51.66], dusseldorf: [6.77, 51.23], cologne: [6.96, 50.94], ruhr: [7.2, 51.45], berlin: [13.4, 52.52], london: [-0.13, 51.5],
};
export const RHINE: Pt[] = [[7.59, 47.56], [7.65, 48.1], [7.8, 48.6], [8.2, 49.0], [8.45, 49.5], [8.35, 49.85], [8.27, 50.0], [7.9, 50.05], [7.6, 50.36], [7.35, 50.55], [7.1, 50.73], [6.96, 50.94], [6.85, 51.1], [6.77, 51.23], [6.73, 51.35], [6.75, 51.43], [6.66, 51.55], [6.62, 51.66], [6.45, 51.75], [6.25, 51.83], [5.9, 51.95], [5.4, 51.95], [4.9, 51.9], [4.4, 51.9], [4.1, 51.98]];

export type Route = { pts: (string | Pt)[]; p: number; color?: string; width?: number };
export type Pin = { at: string | Pt; label?: string; o: number; color?: string; side?: 'l' | 'r' | 't' | 'b'; size?: number; big?: boolean };
const pt = (x: string | Pt): Pt => (typeof x === 'string' ? PL[x] : x);

/** Flat Vox map of Western Europe (Natural Earth 1:50m land + modern borders), with the Rhine. */
export const EuroMap: React.FC<{ view: View; cy?: number; routes?: Route[]; pins?: Pin[]; rhine?: number; children?: (P: (a: number, b: number) => Pt) => React.ReactNode; labels?: { at: Pt; text: string; o: number; size?: number; color?: string; rot?: number }[] }> = ({
  view, cy = 700, routes = [], pins = [], rhine = 1, children, labels = [],
}) => {
  const P = proj(view, cy);
  const d = eu as { land: Pt[][]; borders: Pt[][] };
  const land = d.land.map((r) => path(r.map(([a, b]) => P(a, b)), true)).join('');
  const rp = RHINE.map(([a, b]) => P(a, b)); const RL = len(rp);
  return (
    <AbsoluteFill>
      <Paper />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <rect width={1080} height={1920} fill={C.water} />
        <path d={land} fill={C.land} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" fillRule="evenodd" />
        {d.borders.map((b, i) => <path key={i} d={path(b.map(([a, c]) => P(a, c)))} fill="none" stroke="rgba(28,27,26,0.35)" strokeWidth={2.5} strokeDasharray="10 7" />)}
        {rhine > 0 && <path d={path(rp)} fill="none" stroke="#4f8fb3" strokeWidth={Math.max(6, Math.min(26, view.k / 160))} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${RL * rhine} ${RL * 2}`} />}
        {labels.map((l, i) => { if (l.o <= 0) return null; const [x, y] = P(...l.at);
          return <text key={i} x={x} y={y} textAnchor="middle" transform={l.rot ? `rotate(${l.rot} ${x} ${y})` : undefined} fontFamily={SANS} fontWeight={800} fontSize={l.size ?? 40} letterSpacing={6} fill={l.color ?? 'rgba(28,27,26,0.28)'} opacity={l.o}>{l.text}</text>; })}
        {routes.map((r, i) => {
          if (r.p <= 0) return null;
          const pp = r.pts.map((x) => P(...pt(x))); const L = len(pp) * 1.02; const col = r.color ?? C.navy; const w = r.width ?? 14; const h = along(pp, r.p);
          const h2 = along(pp, Math.max(0, r.p - 0.02)); const ang = (Math.atan2(h[1] - h2[1], h[0] - h2[0]) * 180) / Math.PI;
          return (
            <g key={i}>
              <path d={path(pp)} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${L * r.p} ${L * 2}`} />
              <path transform={`translate(${h[0]},${h[1]}) rotate(${ang})`} d={`M${-w * 1.6},${-w * 1.9} L${w * 1.4},0 L${-w * 1.6},${w * 1.9} Z`} fill={col} />
            </g>
          );
        })}
        {children && children(P)}
        {pins.map((p, i) => {
          if (p.o <= 0) return null;
          const [x, y] = P(...pt(p.at)); const col = p.color ?? C.ink; const s = p.size ?? 36;
          const [tx, ty, anchor] = p.side === 'l' ? [x - 24, y + s * 0.35, 'end'] : p.side === 't' ? [x, y - 26, 'middle'] : p.side === 'b' ? [x, y + s + 18, 'middle'] : [x + 24, y + s * 0.35, 'start'];
          return (
            <g key={i} opacity={Math.min(1, p.o * 2)}>
              <circle cx={x} cy={y} r={(p.big ? 15 : 11) * Math.min(1, p.o * 1.5)} fill={col} stroke="#fff" strokeWidth={4} />
              {p.label && <text x={tx} y={ty} textAnchor={anchor as 'start'} fontFamily={SANS} fontWeight={800} fontSize={s} fill={C.ink} stroke={C.land} strokeWidth={9} style={{ paintOrder: 'stroke' }}>{p.label}</text>}
            </g>
          );
        })}
      </svg>
      <div style={{ position: 'absolute', right: 40, top: 1735, fontFamily: MONO, fontSize: 17, letterSpacing: 2, color: 'rgba(28,27,26,0.5)' }}>MAP: NATURAL EARTH · MODERN BORDERS</div>
    </AbsoluteFill>
  );
};
