import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import na from '../data/na.json';
import world from '../data/world.json';
import { C, HEAD, MONO, TYPE, hash01 } from '../theme';
import { Parchment } from './Stage';

type Pt = [number, number];
const NA = na as { land: Pt[][]; lakes: Pt[][] };
const WORLD = world as Pt[][];
export type View = { lon: number; lat: number; k: number };
export const proj = (v: View) => {
  const c = Math.cos((v.lat * Math.PI) / 180);
  return (lon: number, lat: number): Pt => [960 + (lon - v.lon) * v.k * c, 540 - (lat - v.lat) * v.k];
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerpView = (a: View, b: View, t: number): View => ({ lon: lerp(a.lon, b.lon, t), lat: lerp(a.lat, b.lat, t), k: a.k * Math.pow(b.k / a.k, t) });

// ------------------------------------------------------------------ places (lon, lat)
export const PL: Record<string, Pt> = {
  forks: [-80.01, 40.44], duquesne: [-80.01, 40.44], leboeuf: [-79.98, 41.93], presqueisle: [-80.08, 42.13], venango: [-79.83, 41.4],
  necessity: [-79.587, 39.814], meadows: [-79.587, 39.814], glen: [-79.645, 39.879], gist: [-79.62, 39.96], willscreek: [-78.76, 39.65],
  williamsburg: [-76.7, 37.27], winchester: [-78.16, 39.19], logstown: [-80.24, 40.59], quebec: [-71.21, 46.81], montreal: [-73.57, 45.5],
  neworleans: [-90.07, 29.95], detroit: [-83.05, 42.33], niagara: [-79.06, 43.26], frontenac: [-76.48, 44.23], michilimackinac: [-84.73, 45.78],
  kaskaskia: [-89.9, 37.9], boston: [-71.06, 42.36], newyork: [-74.0, 40.71], philadelphia: [-75.16, 39.95], charleston: [-79.93, 32.78],
  monongahela: [-79.87, 40.41], london: [-0.13, 51.5], paris: [2.35, 48.86],
};
// Key rivers, hand-inked along their real courses (simplified)
const RIVERS: Record<string, Pt[]> = {
  ohio: [[-80.01, 40.44], [-80.25, 40.62], [-80.52, 40.64], [-80.62, 40.4], [-80.72, 40.06], [-80.86, 39.62], [-81.45, 39.42], [-81.68, 39.28], [-82.0, 39.0], [-82.18, 38.85], [-82.45, 38.42], [-82.65, 38.48], [-83.0, 38.73], [-83.65, 38.63], [-84.51, 39.1], [-84.82, 39.1], [-85.4, 38.73], [-85.76, 38.25], [-86.6, 37.85], [-87.58, 37.97], [-88.1, 37.5], [-88.5, 37.08], [-89.18, 37.0]],
  allegheny: [[-80.01, 40.44], [-79.86, 40.53], [-79.55, 40.68], [-79.52, 40.82], [-79.65, 41.0], [-79.83, 41.4], [-79.6, 41.6], [-79.27, 41.65], [-79.15, 41.84], [-78.9, 42.0]],
  frenchcreek: [[-79.83, 41.4], [-80.05, 41.62], [-80.15, 41.75], [-79.98, 41.93]],
  monongahela: [[-80.01, 40.44], [-79.9, 40.4], [-79.86, 40.35], [-79.88, 40.2], [-79.9, 40.02], [-79.95, 39.85], [-79.96, 39.63]],
  youghiogheny: [[-79.86, 40.35], [-79.75, 40.2], [-79.59, 40.02], [-79.45, 39.9], [-79.35, 39.81]],
  potomac: [[-78.76, 39.65], [-78.2, 39.5], [-77.73, 39.33], [-77.45, 39.25], [-77.05, 38.9], [-76.9, 38.4], [-76.3, 38.0]],
  mississippi: [[-91.2, 43.5], [-91.0, 42.5], [-90.6, 41.5], [-91.1, 40.3], [-90.2, 38.6], [-89.4, 37.1], [-89.6, 36.0], [-90.1, 35.0], [-91.1, 33.5], [-91.2, 32.3], [-91.6, 31.0], [-91.3, 30.4], [-90.07, 29.95], [-89.4, 29.2]],
  stlawrence: [[-76.3, 44.2], [-75.2, 44.9], [-73.57, 45.5], [-72.5, 46.3], [-71.21, 46.81], [-70.0, 47.5], [-68.5, 48.6], [-66.5, 49.2]],
};
// Approximate spheres of control in 1754 (illustrative)
const COLONIES: Pt[] = [[-67.0, 45.0], [-70, 46.6], [-73.4, 45.0], [-75.2, 44.6], [-77.0, 42.6], [-79.4, 42.0], [-79.9, 40.4], [-80.6, 38.4], [-82.0, 36.6], [-83.6, 34.6], [-84.0, 31.6], [-81.5, 30.7], [-80.5, 32.0], [-77.0, 34.4], [-75.5, 35.4], [-76.0, 37.0], [-75.0, 38.5], [-74.0, 40.1], [-72.0, 41.0], [-70.0, 41.6], [-70.2, 43.2], [-67.0, 44.6]];
const NEWFRANCE: string[] = ['quebec', 'montreal', 'frontenac', 'niagara', 'detroit', 'michilimackinac', 'kaskaskia', 'neworleans'];
const NATIONS: { at: Pt; name: string }[] = [
  { at: [-82.6, 39.6], name: 'SHAWNEE' }, { at: [-81.6, 40.6], name: 'DELAWARE (LENAPE)' }, { at: [-80.9, 41.5], name: 'MINGO' },
  { at: [-76.0, 42.8], name: 'SIX NATIONS (IROQUOIS)' }, { at: [-84.0, 41.8], name: 'WYANDOT' }, { at: [-86.5, 40.3], name: 'MIAMI' },
];
export type Route = { pts: (string | Pt)[]; p: number; color?: string; dashed?: boolean; label?: string; width?: number; march?: boolean };
export type Pin = { at: string | Pt; label?: string; o: number; color?: string; kind?: 'dot' | 'fort' | 'star' | 'x'; side?: 'r' | 'l' | 'b' | 't' };
const pt = (x: string | Pt): Pt => (typeof x === 'string' ? PL[x] : x);
const pathOf = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
const smooth = (pts: Pt[]) => {
  if (pts.length < 3) return pathOf(pts);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) { const m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]; d += ` Q${pts[i][0]},${pts[i][1]} ${m[0]},${m[1]}`; }
  const l = pts[pts.length - 1]; return d + ` L${l[0]},${l[1]}`;
};
const len = (pts: Pt[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
const along = (pts: Pt[], t: number): { p: Pt; a: number } => {
  const L = len(pts) * Math.max(0, Math.min(1, t)); let d = 0;
  for (let i = 1; i < pts.length; i++) {
    const s = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (d + s >= L) { const k = (L - d) / (s || 1); return { p: [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k], a: Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]) }; }
    d += s;
  }
  const n = pts.length; return { p: pts[n - 1], a: Math.atan2(pts[n - 1][1] - pts[n - 2][1], pts[n - 1][0] - pts[n - 2][0]) };
};

/** Tiny marching figure glyph along routes. */
const Walker: React.FC<{ p: Pt; a: number; f: number; i: number; color: string }> = ({ p, a, f, i, color }) => {
  const l = 5 * Math.sin(f / 3 + i * 2); const flip = Math.cos(a) < 0 ? -1 : 1;
  return (
    <g transform={`translate(${p[0]},${p[1] - 8}) scale(${flip},1)`} fill={color} stroke={color}>
      <path d={`M0,-6 L${l},8 M0,-6 L${-l},8`} strokeWidth={3} strokeLinecap="round" />
      <rect x={-4} y={-20} width={8} height={15} rx={2} stroke="none" /><circle cx={0} cy={-25} r={5} stroke="none" />
      <path d="M-7,-29 L7,-29" strokeWidth={3} /><path d="M3,-19 L-5,-38" strokeWidth={2} />
    </g>
  );
};

export const NAMap: React.FC<{
  view: View; tilt?: number; colonies?: number; newFrance?: number; nations?: number; rivers?: number; flow?: boolean; riverLabels?: number;
  routes?: Route[]; pins?: Pin[]; labels?: { at: string | Pt; text: string; o: number; size?: number; color?: string; italic?: boolean }[];
  treaty?: number; dim?: number; children?: (P: (lon: number, lat: number) => Pt) => React.ReactNode;
}> = ({ view, tilt = 0, colonies = 0, newFrance = 0, nations = 0, rivers = 1, flow, riverLabels = 0, routes = [], pins = [], labels = [], treaty = 0, dim = 0, children }) => {
  const f = useCurrentFrame();
  const P = proj(view);
  const land = NA.land.map((r) => pathOf(r.map(([a, b]) => P(a, b)))).join('Z') + 'Z';
  const lakes = NA.lakes.map((r) => pathOf(r.map(([a, b]) => P(a, b)))).join('Z') + 'Z';
  const grat: string[] = [];
  for (let lo = -105; lo <= -50; lo += 5) grat.push(pathOf([P(lo, 20), P(lo, 60)]));
  for (let la = 20; la <= 60; la += 5) grat.push(pathOf([P(-110, la), P(-45, la)]));
  const nf = NEWFRANCE.map((k) => P(...PL[k]));
  const nfLen = len(nf);
  const sw = Math.max(1.2, Math.min(3, view.k / 40));
  return (
    <AbsoluteFill style={{ perspective: 2000 }}>
      <AbsoluteFill style={{ transform: `rotateX(${tilt}deg)`, transformOrigin: '50% 80%' }}>
        <Parchment dark={dim} />
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <pattern id="seaWaves" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M0 9 Q4.5 5 9 9 T18 9" fill="none" stroke="rgba(60,70,80,0.16)" strokeWidth="1" /></pattern>
            <marker id="ahR" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={C.red} /></marker>
            <marker id="ahB" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={C.fr} /></marker>
            <filter id="inkBlur"><feGaussianBlur stdDeviation="0.6" /></filter>
          </defs>
          <rect width={1920} height={1080} fill="rgba(95,115,120,0.22)" />
          <rect width={1920} height={1080} fill="url(#seaWaves)" />
          <path d={grat.join('')} stroke="rgba(70,50,30,0.16)" strokeWidth={1} fill="none" />
          <path d={land} fill="#e4d6b2" stroke="rgba(52,36,22,0.85)" strokeWidth={sw} strokeLinejoin="round" filter="url(#inkBlur)" />
          <path d={lakes} fill="rgba(120,140,145,0.55)" stroke="rgba(52,36,22,0.6)" strokeWidth={sw * 0.8} />
          {colonies > 0 && (
            <g opacity={Math.min(1, colonies * 1.5)}>
              <path d={pathOf(COLONIES.map(([a, b]) => P(a, b))) + 'Z'} fill={C.brit} fillOpacity={view.k > 100 ? 0.1 : 0.22} stroke={C.brit} strokeWidth={4} strokeDasharray={`${3000 * colonies} 4000`} />
            </g>
          )}
          {newFrance > 0 && (
            <g>
              <path d={smooth(nf)} fill="none" stroke={treaty > 0.5 ? C.brit : C.fr} strokeOpacity={view.k > 100 ? 0.12 : 0.28} strokeWidth={Math.min(46, Math.max(26, view.k * 0.9))} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${nfLen * 1.2 * newFrance} ${nfLen * 3}`} />
              <path d={smooth(nf)} fill="none" stroke={treaty > 0.5 ? C.brit : C.fr} strokeWidth={4} strokeDasharray={`${nfLen * 1.2 * newFrance} ${nfLen * 3}`} />
              {nf.map((p, i) => newFrance * NEWFRANCE.length > i + 0.5 && <rect key={i} x={p[0] - 7} y={p[1] - 7} width={14} height={14} fill={treaty > 0.5 ? C.brit : C.fr} stroke="#efe6d2" strokeWidth={3} transform={`rotate(45 ${p[0]} ${p[1]})`} />)}
            </g>
          )}
          {rivers > 0 && Object.entries(RIVERS).map(([k, r]) => {
            const pp = r.map(([a, b]) => P(a, b)); const L = len(pp) * 1.1;
            return <path key={k} d={smooth(pp)} fill="none" stroke="#3f6d84" strokeWidth={Math.max(2.4, Math.min(7, view.k / 28))} strokeLinecap="round" strokeDasharray={flow ? '14 10' : `${L * rivers} ${L * 2}`} strokeDashoffset={flow ? -f * 1.2 : 0} opacity={0.9} />;
          })}
          {riverLabels > 0 && [['ALLEGHENY R.', [-79.6, 41.0], -60], ['MONONGAHELA R.', [-79.98, 40.0], -80], ['OHIO R.', [-81.0, 39.55], 30], ['YOUGHIOGHENY', [-79.5, 39.95], -40]].map(([t, at, rot]) => {
            const [x, y] = P(...(at as Pt));
            return <text key={t as string} x={x} y={y} transform={`rotate(${rot} ${x} ${y})`} textAnchor="middle" fontFamily={TYPE} fontWeight={700} fontStyle="italic" fontSize={Math.min(30, view.k / 9)} fill="#2e5568" opacity={riverLabels}>{t as string}</text>;
          })}
          {nations > 0 && NATIONS.map((n, i) => {
            const [x, y] = P(...n.at); const o = Math.max(0, Math.min(1, nations * NATIONS.length - i));
            return <text key={n.name} x={x} y={y} textAnchor="middle" fontFamily={HEAD} fontWeight={500} fontSize={Math.max(20, Math.min(34, view.k / 7))} letterSpacing={4} fill="#5a3d1e" opacity={o * 0.9}>{n.name}</text>;
          })}
          {routes.map((r, i) => {
            if (r.p <= 0) return null;
            const pp = r.pts.map((x) => { const [a, b] = pt(x); return P(a, b); });
            const L = len(pp) * 1.15; const col = r.color ?? C.red;
            const head = along(pp, r.p);
            return (
              <g key={i}>
                <path d={smooth(pp)} fill="none" stroke={col} strokeWidth={r.width ?? 7} strokeLinecap="round" strokeDasharray={r.dashed ? `${L * r.p} ${L * 2}` : `${L * r.p} ${L * 2}`} markerEnd={r.p >= 0.99 ? (col === C.fr ? 'url(#ahB)' : 'url(#ahR)') : undefined} opacity={0.95} />
                {r.dashed && <path d={smooth(pp)} fill="none" stroke="#efe6d2" strokeWidth={(r.width ?? 7) * 0.4} strokeDasharray="6 14" opacity={r.p > 0 ? 0.9 : 0} style={{ clipPath: 'none' }} />}
                {r.p < 0.99 && <circle cx={head.p[0]} cy={head.p[1]} r={10} fill={col} stroke="#efe6d2" strokeWidth={3} />}
                {r.march && r.p > 0.05 && Array.from({ length: 4 }, (_, j) => { const q = along(pp, Math.max(0, r.p - 0.03 - j * 0.035)); return <Walker key={j} p={q.p} a={q.a} f={f} i={j} color={col} />; })}
                {r.label && r.p > 0.4 && <text x={head.p[0] + 18} y={head.p[1] - 18} fontFamily={TYPE} fontWeight={700} fontSize={26} fill={col} stroke="#efe6d2" strokeWidth={5} style={{ paintOrder: 'stroke' }} opacity={Math.min(1, (r.p - 0.4) * 3)}>{r.label}</text>}
              </g>
            );
          })}
          {children && children(P)}
          {pins.map((p, i) => {
            if (p.o <= 0) return null;
            const [x, y] = P(...pt(p.at)); const drop = (1 - Math.min(1, p.o)) * -30; const col = p.color ?? C.red;
            const side = p.side ?? 'r';
            const tx = side === 'l' ? x - 20 : side === 'r' ? x + 20 : x, ty = side === 't' ? y - 26 : side === 'b' ? y + 42 : y + 10;
            return (
              <g key={i} opacity={Math.min(1, p.o * 2)} transform={`translate(0,${drop})`}>
                {p.kind === 'fort' ? <path d={`M${x},${y - 14} L${x + 14},${y} L${x},${y + 14} L${x - 14},${y} Z`} fill={col} stroke="#efe6d2" strokeWidth={3} />
                  : p.kind === 'star' ? <path d={Array.from({ length: 10 }, (_, j) => { const r = j % 2 ? 7 : 17, a = (j / 10) * Math.PI * 2 - Math.PI / 2; return `${j ? 'L' : 'M'}${x + r * Math.cos(a)},${y + r * Math.sin(a)}`; }).join('') + 'Z'} fill={col} stroke="#efe6d2" strokeWidth={2.5} />
                  : p.kind === 'x' ? <path d={`M${x - 12},${y - 12} L${x + 12},${y + 12} M${x + 12},${y - 12} L${x - 12},${y + 12}`} stroke={col} strokeWidth={6} />
                  : <circle cx={x} cy={y} r={10} fill={col} stroke="#efe6d2" strokeWidth={3} />}
                <circle cx={x} cy={y} r={20 + 5 * Math.sin(f / 8 + i)} fill="none" stroke={col} strokeWidth={2} opacity={0.5} />
                {p.label && <text x={tx} y={ty} textAnchor={side === 'l' ? 'end' : side === 'r' ? 'start' : 'middle'} fontFamily={HEAD} fontWeight={700} fontSize={30} letterSpacing={2} fill={C.ink} stroke="#efe6d2" strokeWidth={6} style={{ paintOrder: 'stroke' }}>{p.label}</text>}
              </g>
            );
          })}
          {labels.map((l, i) => {
            if (l.o <= 0) return null;
            const [x, y] = P(...pt(l.at));
            return <text key={i} x={x} y={y} textAnchor="middle" fontFamily={l.italic ? TYPE : HEAD} fontStyle={l.italic ? 'italic' : 'normal'} fontWeight={700} fontSize={l.size ?? 40} letterSpacing={l.italic ? 1 : 5} fill={l.color ?? C.ink} stroke="#efe6d2" strokeWidth={6} style={{ paintOrder: 'stroke' }} opacity={l.o}>{l.text}</text>;
          })}
        </svg>
        <div style={{ position: 'absolute', right: 40, bottom: 26, fontFamily: MONO, fontSize: 14, letterSpacing: 2, color: 'rgba(40,28,16,0.55)' }}>MAP: NATURAL EARTH · LAKES © OPENSTREETMAP CONTRIBUTORS · 1754 BOUNDARIES APPROXIMATE</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** World map for the Seven Years' War: theatres light up in sequence. */
export const THEATRES: { at: Pt; name: string }[] = [
  { at: [-79, 41], name: 'NORTH AMERICA' }, { at: [10, 50], name: 'EUROPE' }, { at: [-66, 17], name: 'CARIBBEAN' }, { at: [80, 22], name: 'INDIA' },
  { at: [-15, 14], name: 'WEST AFRICA' }, { at: [121, 14.6], name: 'PHILIPPINES' }, { at: [-57, -34], name: 'SOUTH AMERICA' },
];
export const WorldMap: React.FC<{ k?: number; lon?: number; lat?: number; lit?: number[]; spark?: number; dim?: number }> = ({ k = 5.6, lon = 10, lat = 18, lit = [], spark = 0, dim = 0 }) => {
  const f = useCurrentFrame();
  const P = (a: number, b: number): Pt => [960 + (a - lon) * k, 540 - (b - lat) * k];
  const land = WORLD.map((r) => pathOf(r.map(([a, b]) => P(a, b)))).join('Z') + 'Z';
  const o = P(-79.65, 39.88);
  return (
    <AbsoluteFill>
      <Parchment dark={dim} />
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <rect width={1920} height={1080} fill="rgba(95,115,120,0.22)" />
        <path d={land} fill="#e4d6b2" stroke="rgba(52,36,22,0.8)" strokeWidth={1.5} />
        {THEATRES.map((t, i) => {
          const o2 = lit[i] ?? 0; if (o2 <= 0) return null;
          const [x, y] = P(...t.at);
          return (
            <g key={t.name} opacity={Math.min(1, o2)}>
              {spark > 0 && i > 0 && <path d={`M${o[0]},${o[1]} Q${(o[0] + x) / 2},${Math.min(o[1], y) - 160} ${x},${y}`} fill="none" stroke={C.red} strokeWidth={3} strokeDasharray={`${1500 * Math.min(1, o2)} 3000`} opacity={0.7} />}
              <circle cx={x} cy={y} r={46 + 10 * Math.sin(f / 9 + i)} fill={C.red} opacity={0.18} />
              <circle cx={x} cy={y} r={11} fill={C.red} stroke="#efe6d2" strokeWidth={3} />
              <text x={x} y={y - 26} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={30} letterSpacing={3} fill={C.ink} stroke="#efe6d2" strokeWidth={6} style={{ paintOrder: 'stroke' }}>{t.name}</text>
            </g>
          );
        })}
        {spark > 0 && [0, 1, 2].map((i) => { const t = ((f + i * 20) % 60) / 60; return <circle key={i} cx={o[0]} cy={o[1]} r={8 + 70 * t} fill="none" stroke={C.red} strokeWidth={3} opacity={(1 - t) * spark} />; })}
        {spark > 0 && <circle cx={o[0]} cy={o[1]} r={9} fill="#ffcf6a" stroke={C.red} strokeWidth={3} opacity={spark} />}
        {Array.from({ length: 0 }, (_, i) => hash01(i)).length === 0 ? null : null}
      </svg>
    </AbsoluteFill>
  );
};
