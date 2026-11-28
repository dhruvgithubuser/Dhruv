import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import ches from '../data/chesapeake.json';
import { C, MONO, SANS, ease } from '../theme';
import { Paper } from './VoxKit';

type Pt = [number, number];
export type View = { lon: number; lat: number; k: number };
export const lerpView = (a: View, b: View, t: number): View => ({ lon: a.lon + (b.lon - a.lon) * t, lat: a.lat + (b.lat - a.lat) * t, k: a.k * Math.pow(b.k / a.k, t) });
export const proj = (v: View, cy = 760) => { const c = Math.cos((v.lat * Math.PI) / 180); return (lon: number, lat: number): Pt => [540 + (lon - v.lon) * v.k * c, cy - (lat - v.lat) * v.k]; };
const path = (pts: Pt[], close = false) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('') + (close ? 'Z' : '');
const len = (p: Pt[]) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0);
export const along = (p: Pt[], t: number): Pt => { const L = len(p) * Math.max(0, Math.min(1, t)); let d = 0; for (let i = 1; i < p.length; i++) { const s = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (d + s >= L) { const k = (L - d) / (s || 1); return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * k, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * k]; } d += s; } return p[p.length - 1]; };

export const PL: Record<string, Pt> = {
  benedict: [-76.68, 38.51], nottingham: [-76.70, 38.71], marlboro: [-76.75, 38.815], bladensburg: [-76.934, 38.939], washington: [-77.02, 38.893],
  baltimore: [-76.61, 39.29], brookeville: [-77.06, 39.18], northpoint: [-76.45, 39.2], mchenry: [-76.58, 39.263],
  // city (1814)
  capitol: [-77.0091, 38.8899], whitehouse: [-77.0365, 38.8977], treasury: [-77.0332, 38.8981], waroffice: [-77.0400, 38.8981], navyyard: [-76.9955, 38.8745],
  greenleaf: [-77.0167, 38.8667], patent: [-77.0222, 38.8968],
};
const RIVERS: Pt[][] = [
  [[-76.69, 38.56], [-76.70, 38.63], [-76.69, 38.70], [-76.71, 38.76], [-76.72, 38.83], [-76.74, 38.90]], // upper Patuxent
  [[-77.02, 38.86], [-76.99, 38.875], [-76.965, 38.9], [-76.945, 38.93], [-76.93, 38.96]], // Eastern Branch (Anacostia)
];

export type Route = { pts: (string | Pt)[]; p: number; color?: string; width?: number; dash?: boolean };
const pt = (x: string | Pt): Pt => (typeof x === 'string' ? PL[x] : x);

const RouteLine: React.FC<{ r: Route; P: (a: number, b: number) => Pt }> = ({ r, P }) => {
  if (r.p <= 0) return null;
  const pp = r.pts.map((x) => P(...pt(x))); const L = len(pp) * 1.02; const col = r.color ?? C.red; const h = along(pp, r.p); const w = r.width ?? 12;
  const h2 = along(pp, Math.max(0, r.p - 0.02)); const ang = Math.atan2(h[1] - h2[1], h[0] - h2[0]);
  return (
    <g>
      <path d={path(pp)} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={r.dash ? `${w * 0.1} ${w * 2}` : `${L * r.p} ${L * 2}`} opacity={r.dash ? 1 : 1} style={r.dash ? { clipPath: undefined } : undefined} />
      <path transform={`translate(${h[0]},${h[1]}) rotate(${(ang * 180) / Math.PI})`} d={`M${-w * 1.6},${-w * 1.9} L${w * 1.4},0 L${-w * 1.6},${w * 1.9} Z`} fill={col} />
    </g>
  );
};

export type Pin = { at: string | Pt; label?: string; o: number; color?: string; side?: 'l' | 'r' | 't' | 'b'; size?: number; big?: boolean };
const Pins: React.FC<{ pins: Pin[]; P: (a: number, b: number) => Pt }> = ({ pins, P }) => (
  <>
    {pins.map((p, i) => {
      if (p.o <= 0) return null;
      const [x, y] = P(...pt(p.at)); const col = p.color ?? C.ink; const s = p.size ?? 38;
      const [tx, ty, anchor] = p.side === 'l' ? [x - 26, y + s * 0.35, 'end'] : p.side === 't' ? [x, y - 30, 'middle'] : p.side === 'b' ? [x, y + s + 22, 'middle'] : [x + 26, y + s * 0.35, 'start'];
      return (
        <g key={i} opacity={Math.min(1, p.o * 2)}>
          <circle cx={x} cy={y} r={(p.big ? 15 : 11) * Math.min(1, p.o * 1.5)} fill={col} stroke="#fff" strokeWidth={4} />
          {p.label && <text x={tx} y={ty} textAnchor={anchor as 'start'} fontFamily={SANS} fontWeight={800} fontSize={s} letterSpacing={-0.5} fill={C.ink} stroke={C.land} strokeWidth={9} style={{ paintOrder: 'stroke' }}>{p.label}</text>}
        </g>
      );
    })}
  </>
);

/** Flat Vox map of the Chesapeake region (Natural Earth 1:50m). */
export const RegionMap: React.FC<{ view: View; routes?: Route[]; pins?: Pin[]; children?: (P: (a: number, b: number) => Pt) => React.ReactNode; cy?: number; night?: number }> = ({ view, routes = [], pins = [], children, cy = 760, night = 0 }) => {
  const P = proj(view, cy);
  const land = (ches as Pt[][]).map((r) => path(r.map(([a, b]) => P(a, b)), true)).join('');
  const sw = Math.max(2, Math.min(4, view.k / 300));
  return (
    <AbsoluteFill>
      <Paper night={night} />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <rect width={1080} height={1920} fill={C.water} />
        <path d={land} fill={C.land} stroke={C.ink} strokeWidth={sw} strokeLinejoin="round" fillRule="evenodd" />
        {RIVERS.map((r, i) => <path key={i} d={path(r.map(([a, b]) => P(a, b)))} fill="none" stroke={C.water} strokeWidth={Math.max(5, view.k / 140)} strokeLinecap="round" />)}
        {routes.map((r, i) => <RouteLine key={i} r={r} P={P} />)}
        {children && children(P)}
        <Pins pins={pins} P={P} />
      </svg>
      {night > 0 && <AbsoluteFill style={{ background: C.night, opacity: night * 0.55, mixBlendMode: 'multiply' }} />}
      <div style={{ position: 'absolute', right: 40, top: 1735, fontFamily: MONO, fontSize: 17, letterSpacing: 2, color: 'rgba(28,27,26,0.5)' }}>MAP: NATURAL EARTH</div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- Washington City, 1814 (schematic) */
const POTOMAC: Pt[] = [[-77.068, 38.909], [-77.056, 38.901], [-77.045, 38.8925], [-77.040, 38.886], [-77.034, 38.876], [-77.026, 38.867], [-77.0185, 38.8615], [-77.015, 38.846], [-77.02, 38.83], [-77.05, 38.83], [-77.062, 38.852], [-77.072, 38.875], [-77.082, 38.895], [-77.08, 38.912]];
const ANACOSTIA: Pt[] = [[-77.016, 38.8655], [-77.005, 38.8715], [-76.995, 38.8735], [-76.985, 38.878], [-76.975, 38.886], [-76.962, 38.898], [-76.955, 38.894], [-76.972, 38.879], [-76.988, 38.868], [-77.003, 38.862], [-77.012, 38.855], [-77.0155, 38.848]];
const CANAL: Pt[] = [[-77.0405, 38.8925], [-77.025, 38.8918], [-77.0125, 38.8905], [-77.0095, 38.8835], [-77.0065, 38.874]];
const PENN: Pt[] = [[-77.0365, 38.8977], [-77.0091, 38.8899], [-76.995, 38.882], [-76.986, 38.8765]];
const MARYLAND: Pt[] = [[-77.0091, 38.8899], [-76.995, 38.896], [-76.975, 38.906], [-76.955, 38.917]];

export type Fire = { at: string | Pt; on: number; off?: number; s?: number };
const BLD: { id: string; label: string; side: 'l' | 'r' | 't' | 'b' }[] = [
  { id: 'capitol', label: 'CAPITOL', side: 'b' }, { id: 'whitehouse', label: "PRESIDENT'S HOUSE", side: 't' }, { id: 'treasury', label: 'TREASURY', side: 'r' },
  { id: 'waroffice', label: 'WAR OFFICE', side: 'l' }, { id: 'navyyard', label: 'NAVY YARD', side: 'b' }, { id: 'patent', label: 'PATENT OFFICE', side: 't' },
];

export const CityMap: React.FC<{ view: View; cy?: number; show?: Record<string, number>; route?: number; night?: number; fires?: Fire[]; children?: (P: (a: number, b: number) => Pt) => React.ReactNode; labelSize?: number; hideMinor?: boolean }> = ({
  view, cy = 760, show = {}, route = 0, night = 0, fires = [], children, labelSize = 30, hideMinor,
}) => {
  const f = useCurrentFrame();
  const P = proj(view, cy);
  const m = (pts: Pt[]) => pts.map(([a, b]) => P(a, b));
  const grid: React.ReactNode[] = [];
  for (let lo = -77.07; lo < -76.95; lo += 0.0045) grid.push(<path key={`x${lo}`} d={path(m([[lo, 38.86], [lo, 38.915]]))} stroke="rgba(28,27,26,0.09)" strokeWidth={2} />);
  for (let la = 38.86; la < 38.915; la += 0.0035) grid.push(<path key={`y${la}`} d={path(m([[-77.07, la], [-76.95, la]]))} stroke="rgba(28,27,26,0.09)" strokeWidth={2} />);
  const rw = Math.max(6, view.k / 2600);
  const pp = m(PENN.slice(0, 2)).reverse(); // Capitol → President's House
  const L = len(pp); const head = along(pp, route);
  return (
    <AbsoluteFill>
      <Paper />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <rect width={1080} height={1920} fill={C.land} />
        {grid}
        <path d={path(m(POTOMAC), true)} fill={C.water} stroke={C.ink} strokeWidth={3} />
        <path d={path(m(ANACOSTIA), true)} fill={C.water} stroke={C.ink} strokeWidth={3} />
        <path d={path(m(CANAL))} fill="none" stroke={C.water} strokeWidth={rw} strokeLinecap="round" />
        <path d={path(m(PENN))} fill="none" stroke="rgba(28,27,26,0.35)" strokeWidth={rw * 0.9} strokeLinecap="round" />
        <path d={path(m(MARYLAND))} fill="none" stroke="rgba(28,27,26,0.35)" strokeWidth={rw * 0.9} strokeLinecap="round" />
        <text {...(() => { const [x, y] = P(-77.052, 38.866); return { x, y }; })()} fontFamily={SANS} fontWeight={800} fontSize={34} fill={C.waterDk} letterSpacing={6} transform={`rotate(-52 ${P(-77.052, 38.866)[0]} ${P(-77.052, 38.866)[1]})`}>POTOMAC</text>
        {route > 0 && <g>
          <path d={path(pp)} fill="none" stroke={C.red} strokeWidth={14} strokeLinecap="round" strokeDasharray={`${L * route} ${L * 2}`} />
          <circle cx={head[0]} cy={head[1]} r={16} fill={C.red} stroke="#fff" strokeWidth={4} />
        </g>}
        {BLD.map((b) => {
          const o = show[b.id] ?? 0; if (o <= 0) return null;
          const [x, y] = P(...PL[b.id]); const s = Math.min(1, o * 1.4);
          const side = hideMinor && b.id === 'whitehouse' ? 'b' : b.side;
          const [tx, ty, anchor] = side === 'l' ? [x - 34, y + 10, 'end'] : side === 't' ? [x, y - 40, 'middle'] : side === 'b' ? [x + 40, y + 56, 'middle'] : [x + 34, y + 10, 'start'];
          return (
            <g key={b.id} opacity={Math.min(1, o * 2)}>
              <g transform={`translate(${x},${y}) scale(${s})`}>
                <rect x={-22} y={-12} width={44} height={26} fill={C.ink} />
                <path d="M-26,-12 L0,-28 L26,-12 Z" fill={C.ink} />
              </g>
              {!(hideMinor && (b.id === 'treasury' || b.id === 'waroffice')) && <text x={tx} y={ty} textAnchor={anchor as 'start'} fontFamily={SANS} fontWeight={800} fontSize={labelSize} fill={C.ink} stroke={C.land} strokeWidth={8} style={{ paintOrder: 'stroke' }}>{b.label}</text>}
            </g>
          );
        })}
        {fires.map((fi, i) => { const [x, y] = P(...pt(fi.at)); return <FlameAt key={i} x={x} y={y - 10} s={fi.s ?? 0.75} at={fi.on} out={fi.off} seed={i + 2} f={f} />; })}
        {children && children(P)}
      </svg>
      {night > 0 && <AbsoluteFill style={{ background: C.night, opacity: night * 0.6, mixBlendMode: 'multiply', pointerEvents: 'none' }} />}
      {night > 0 && <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        {fires.map((fi, i) => { const [x, y] = P(...pt(fi.at)); const g = ease(f, fi.on, fi.on + 10) * (fi.off !== undefined ? 1 - ease(f, fi.off, fi.off + 14) : 1); return g > 0 ? <circle key={i} cx={x} cy={y - 30} r={110} fill="url(#glow)" opacity={g * night} /> : null; })}
        <defs><radialGradient id="glow"><stop offset="0" stopColor="rgba(255,150,40,0.55)" /><stop offset="1" stopColor="rgba(255,150,40,0)" /></radialGradient></defs>
      </svg>}
      <div style={{ position: 'absolute', right: 40, top: 1735, fontFamily: MONO, fontSize: 17, letterSpacing: 2, color: 'rgba(28,27,26,0.5)' }}>WASHINGTON CITY, 1814 · SCHEMATIC</div>
    </AbsoluteFill>
  );
};

// local flame (same drawing as VoxKit.Flame, inlined to keep the svg tree flat)
const FlameAt: React.FC<{ x: number; y: number; s: number; at: number; out?: number; seed: number; f: number }> = ({ x, y, s, at, out, seed, f }) => {
  const g = ease(f, at, at + 10); if (g <= 0) return null;
  const dying = out !== undefined ? ease(f, out, out + 14) : 0;
  const fl = 1 + 0.12 * Math.sin(f * 0.9 + seed * 3) * Math.cos(f * 0.37 + seed);
  const sc = s * g * (1 - dying) * fl; const sw = 7 * Math.sin(f * 0.31 + seed);
  return (
    <g transform={`translate(${x},${y})`}>
      {sc > 0.02 && <g transform={`scale(${sc}) skewX(${sw})`}>
        <path d="M0,0 C-34,-6 -40,-44 -16,-76 C-12,-56 -2,-52 0,-60 C2,-84 14,-100 26,-112 C24,-84 44,-62 38,-30 C34,-8 18,0 0,0 Z" fill={C.fire} stroke={C.ink} strokeWidth={3} />
        <path d="M0,0 C-16,-4 -20,-26 -6,-44 C-2,-34 6,-34 6,-46 C16,-34 24,-20 18,-8 C14,-1 8,0 0,0 Z" fill={C.fireHi} />
      </g>}
      {dying > 0 && dying < 1 && [0, 1, 2].map((i) => (
        <circle key={i} cx={(i - 1) * 18 * s} cy={-30 * s - dying * 100 * s - i * 12} r={(14 + i * 5) * s * (0.6 + dying)} fill="rgba(240,240,240,0.85)" stroke="rgba(28,27,26,0.3)" strokeWidth={2} opacity={1 - dying} />
      ))}
    </g>
  );
};
