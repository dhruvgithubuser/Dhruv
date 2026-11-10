import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import laLakes from '../data/la_lakes.json';
import na from '../data/na.json';
import world from '../data/world.json';
import { C, HEAD, MONO, TYPE } from '../theme';
import { Parchment } from './DocumentaryStage';

type Pt = [number, number];
const NA = na as { land: Pt[][]; lakes: Pt[][] };
const WORLD = world as Pt[][];
const LA = laLakes as Pt[][];
export type View = { lon: number; lat: number; k: number };
export const lerpView = (a: View, b: View, t: number): View => ({ lon: a.lon + (b.lon - a.lon) * t, lat: a.lat + (b.lat - a.lat) * t, k: a.k * Math.pow(b.k / a.k, t) });
const proj = (v: View) => { const c = Math.cos((v.lat * Math.PI) / 180); return (lon: number, lat: number): Pt => [540 + (lon - v.lon) * v.k * c, 960 - (lat - v.lat) * v.k]; };
const path = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
export const PL: Record<string, Pt> = {
  neworleans: [-90.07, 29.95], chalmette: [-89.99, 29.94], landing: [-89.86, 29.92], borgne: [-89.6, 30.05], ghent: [3.72, 51.05], london: [-0.13, 51.5],
  washington: [-77.04, 38.9], newyork: [-74.0, 40.7],
};
const MISS: Pt[] = [[-91.2, 31.5], [-91.5, 31.0], [-91.3, 30.45], [-91.0, 30.2], [-90.6, 30.05], [-90.35, 30.0], [-90.13, 29.95], [-90.07, 29.95], [-90.02, 29.96], [-89.97, 29.93], [-89.9, 29.86], [-89.75, 29.62], [-89.5, 29.4], [-89.3, 29.2], [-89.15, 29.0]];

export type Route = { pts: (string | Pt)[]; p: number; color?: string; width?: number; label?: string; march?: boolean };
const pt = (x: string | Pt): Pt => (typeof x === 'string' ? PL[x] : x);
const len = (p: Pt[]) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0);
const along = (p: Pt[], t: number): Pt => { const L = len(p) * Math.max(0, Math.min(1, t)); let d = 0; for (let i = 1; i < p.length; i++) { const s = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (d + s >= L) { const k = (L - d) / (s || 1); return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * k, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * k]; } d += s; } return p[p.length - 1]; };

/** Parchment map (vertical): North America 1:50m + world 1:110m land, Louisiana lakes, the Mississippi; routes, pins, labels. */
export const Map: React.FC<{ view: View; world?: boolean; routes?: Route[]; pins?: { at: string | Pt; label?: string; o: number; color?: string; side?: 'l' | 'r' }[]; labels?: { at: Pt; text: string; o: number; size?: number; color?: string; italic?: boolean }[]; children?: (P: (a: number, b: number) => Pt) => React.ReactNode }> = ({
  view, world: useWorld, routes = [], pins = [], labels = [], children,
}) => {
  const f = useCurrentFrame();
  const P = proj(view);
  const land = (useWorld ? WORLD : NA.land).map((r) => path(r.map(([a, b]) => P(a, b)))).join('Z') + 'Z';
  const lakes = [...NA.lakes, ...LA].map((r) => path(r.map(([a, b]) => P(a, b)))).join('Z') + 'Z';
  const sw = Math.max(1.2, Math.min(3, view.k / 50));
  return (
    <AbsoluteFill>
      <Parchment />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <defs><pattern id="waves" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M0 9 Q4.5 5 9 9 T18 9" fill="none" stroke="rgba(60,70,80,0.16)" strokeWidth="1" /></pattern>
          <marker id="ahR" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={C.brit} /></marker></defs>
        <rect width={1080} height={1920} fill="rgba(95,115,120,0.22)" /><rect width={1080} height={1920} fill="url(#waves)" />
        <path d={land} fill="#e4d6b2" stroke="rgba(52,36,22,0.85)" strokeWidth={sw} strokeLinejoin="round" />
        {!useWorld && <path d={lakes} fill="rgba(120,140,145,0.55)" stroke="rgba(52,36,22,0.6)" strokeWidth={sw * 0.8} />}
        {!useWorld && <path d={path(MISS.map(([a, b]) => P(a, b)))} fill="none" stroke="#3f6d84" strokeWidth={Math.max(3, Math.min(10, view.k / 60))} strokeLinecap="round" />}
        {routes.map((r, i) => {
          if (r.p <= 0) return null;
          const pp = r.pts.map((x) => { const [a, b] = pt(x); return P(a, b); }); const L = len(pp) * 1.1; const col = r.color ?? C.brit; const h = along(pp, r.p);
          return (
            <g key={i}>
              <path d={path(pp)} fill="none" stroke={col} strokeWidth={r.width ?? 8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${L * r.p} ${L * 2}`} markerEnd={r.p > 0.98 ? 'url(#ahR)' : undefined} />
              {r.p < 0.98 && <circle cx={h[0]} cy={h[1]} r={12} fill={col} stroke="#efe6d2" strokeWidth={3} />}
              {r.march && r.p > 0.05 && [0, 1, 2, 3].map((j) => { const q = along(pp, Math.max(0, r.p - 0.04 - j * 0.04)); const l = 5 * Math.sin(f / 3 + j * 2);
                return <g key={j} transform={`translate(${q[0]},${q[1] - 8})`} fill={col} stroke={col}><path d={`M0,-6 L${l},8 M0,-6 L${-l},8`} strokeWidth={3} /><rect x={-4} y={-20} width={8} height={15} rx={2} stroke="none" /><circle cx={0} cy={-25} r={5} stroke="none" /></g>; })}
              {r.label && r.p > 0.4 && <text x={h[0] + 18} y={h[1] - 20} fontFamily={TYPE} fontWeight={700} fontSize={32} fill={col} stroke="#efe6d2" strokeWidth={6} style={{ paintOrder: 'stroke' }} opacity={Math.min(1, (r.p - 0.4) * 3)}>{r.label}</text>}
            </g>
          );
        })}
        {children && children(P)}
        {pins.map((p, i) => {
          if (p.o <= 0) return null;
          const [x, y] = P(...pt(p.at)); const col = p.color ?? C.red; const l = p.side === 'l';
          return (
            <g key={i} opacity={Math.min(1, p.o * 2)} transform={`translate(0,${(1 - Math.min(1, p.o)) * -30})`}>
              <circle cx={x} cy={y} r={13} fill={col} stroke="#efe6d2" strokeWidth={4} />
              <circle cx={x} cy={y} r={24 + 6 * Math.sin(f / 8 + i)} fill="none" stroke={col} strokeWidth={2} opacity={0.5} />
              {p.label && <text x={l ? x - 26 : x + 26} y={y + 12} textAnchor={l ? 'end' : 'start'} fontFamily={HEAD} fontWeight={700} fontSize={40} letterSpacing={2} fill={C.ink} stroke="#efe6d2" strokeWidth={7} style={{ paintOrder: 'stroke' }}>{p.label}</text>}
            </g>
          );
        })}
        {labels.map((l, i) => { if (l.o <= 0) return null; const [x, y] = P(...l.at);
          return <text key={i} x={x} y={y} textAnchor="middle" fontFamily={l.italic ? TYPE : HEAD} fontStyle={l.italic ? 'italic' : 'normal'} fontWeight={700} fontSize={l.size ?? 48} letterSpacing={l.italic ? 1 : 5} fill={l.color ?? C.ink} stroke="#efe6d2" strokeWidth={7} style={{ paintOrder: 'stroke' }} opacity={l.o}>{l.text}</text>; })}
      </svg>
      <div style={{ position: 'absolute', right: 40, top: 1700, fontFamily: MONO, fontSize: 15, letterSpacing: 2, color: 'rgba(40,28,16,0.55)' }}>NATURAL EARTH · LAKES © OPENSTREETMAP CONTRIBUTORS</div>
    </AbsoluteFill>
  );
};
