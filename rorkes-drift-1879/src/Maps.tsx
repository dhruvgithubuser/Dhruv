import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import af from './data/africa.json';
import { Parchment } from './kit';
import { C, H, HEAD, MONO, TYPE, W, ease, lin } from './theme';

/* Parchment map of southern Africa, 9:16. Natural Earth coastline; the 1879 Natal / Zulu Kingdom split and the Buffalo River are drawn approximately. */
type Pt = [number, number];
export type View = { lon: number; lat: number; k: number };
export const lerpView = (a: View, b: View, t: number): View => ({ lon: a.lon + (b.lon - a.lon) * t, lat: a.lat + (b.lat - a.lat) * t, k: a.k * Math.pow(b.k / a.k, t) });
export const proj = (v: View) => { const c = Math.cos((v.lat * Math.PI) / 180); return (lon: number, lat: number): Pt => [W / 2 + (lon - v.lon) * v.k * c, 760 - (lat - v.lat) * v.k]; };
const path = (pts: Pt[], close = false) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('') + (close ? 'Z' : '');

export const PL: Record<string, Pt> = { rorkes: [30.535, -28.348], isandlwana: [30.652, -28.358], durban: [31.03, -29.86], capetown: [18.42, -33.92], ulundi: [31.42, -28.31] };
// Buffalo River (Mzinyathi) near the drift, approximate; then on to the Tugela.
const BUFFALO: Pt[] = [[30.2, -27.75], [30.38, -28.0], [30.47, -28.2], [30.545, -28.33], [30.55, -28.4], [30.6, -28.55], [30.75, -28.75], [30.95, -28.9], [31.2, -29.0]];
const TUGELA: Pt[] = [[29.0, -28.75], [29.6, -28.85], [30.2, -28.95], [30.8, -29.0], [31.2, -29.0], [31.45, -29.25]];
// Zulu Kingdom (approximate, 1879): east of the Buffalo and north of the Tugela, to the coast.
const ZULU: Pt[] = [[30.2, -27.75], [30.38, -28.0], [30.47, -28.2], [30.545, -28.33], [30.55, -28.4], [30.6, -28.55], [30.75, -28.75], [30.95, -28.9], [31.2, -29.0], [31.45, -29.25], [33.5, -29.2], [32.9, -26.9], [31.9, -27.0], [30.9, -27.2], [30.2, -27.75]];
const NATAL: Pt[] = [[30.2, -27.75], [29.3, -27.3], [28.9, -28.6], [29.3, -29.9], [30.1, -31.1], [31.2, -30.6], [31.45, -29.25], [31.2, -29.0], [30.95, -28.9], [30.75, -28.75], [30.6, -28.55], [30.55, -28.4], [30.545, -28.33], [30.47, -28.2], [30.38, -28.0], [30.2, -27.75]];

export type Pin = { at: string | Pt; label?: string; o: number; color?: string; side?: 'l' | 'r' | 't' | 'b'; size?: number };
export type Arrow = { pts: Pt[]; p: number; color?: string; width?: number };
const pt = (x: string | Pt): Pt => (typeof x === 'string' ? PL[x] : x);
const len = (p: Pt[]) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0);
const along = (p: Pt[], t: number): Pt => { const L = len(p) * Math.max(0, Math.min(1, t)); let d = 0; for (let i = 1; i < p.length; i++) { const s = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (d + s >= L) { const k = (L - d) / (s || 1); return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * k, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * k]; } d += s; } return p[p.length - 1]; };

export const ArrowSvg: React.FC<{ a: { pts: Pt[]; p: number; color?: string; width?: number } }> = ({ a }) => {
  if (a.p <= 0) return null;
  const pp = a.pts; const L = len(pp) * 1.02; const col = a.color ?? C.red; const w = a.width ?? 14;
  const h = along(pp, a.p); const h2 = along(pp, Math.max(0, a.p - 0.03)); const ang = (Math.atan2(h[1] - h2[1], h[0] - h2[0]) * 180) / Math.PI;
  return (
    <g>
      <path d={path(pp)} fill="none" stroke="rgba(239,230,210,0.9)" strokeWidth={w + 8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${L * a.p} ${L * 2}`} />
      <path d={path(pp)} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${L * a.p} ${L * 2}`} />
      <path transform={`translate(${h[0]},${h[1]}) rotate(${ang})`} d={`M${-w * 1.3},${-w * 1.7} L${w * 1.7},0 L${-w * 1.3},${w * 1.7} Z`} fill={col} stroke="rgba(239,230,210,0.9)" strokeWidth={3} />
    </g>
  );
};
const PinSvg: React.FC<{ p: Pin; P: (a: number, b: number) => Pt; i: number }> = ({ p, P, i }) => {
  const f = useCurrentFrame();
  if (p.o <= 0) return null;
  const [x, y] = P(...pt(p.at)); const col = p.color ?? C.red; const s = p.size ?? 52;
  const [tx, ty, anchor] = p.side === 'l' ? [x - 30, y + s * 0.35, 'end'] : p.side === 't' ? [x, y - 34, 'middle'] : p.side === 'b' ? [x, y + s + 22, 'middle'] : [x + 30, y + s * 0.35, 'start'];
  return (
    <g opacity={Math.min(1, p.o * 2)}>
      <circle cx={x} cy={y} r={22 + 6 * Math.sin(f / 8 + i)} fill="rgba(239,230,210,0.6)" stroke={col} strokeWidth={4} />
      <circle cx={x} cy={y} r={11} fill={col} stroke={C.charcoal} strokeWidth={2} />
      {p.label && <text x={tx} y={ty} textAnchor={anchor as 'start'} fontFamily={HEAD} fontWeight={700} fontSize={s} letterSpacing={1.5} fill={C.charcoal} stroke="rgba(239,230,210,0.95)" strokeWidth={8} style={{ paintOrder: 'stroke' }}>{p.label}</text>}
    </g>
  );
};

export const AfricaMap: React.FC<{ view: View; pins?: Pin[]; regions?: number; rivers?: number; arrows?: Arrow[]; children?: (P: (a: number, b: number) => Pt) => React.ReactNode }> = ({ view, pins = [], regions = 0, rivers = 0, arrows = [], children }) => {
  const P = proj(view);
  const land = (af as unknown as { land: Pt[][] }).land.map((r) => path(r.map(([a, b]) => P(a, b)), true)).join('');
  const grat: string[] = [];
  for (let lo = 10; lo <= 45; lo += 1) grat.push(path([P(lo, -40), P(lo, -10)]));
  for (let la = -40; la <= -10; la += 1) grat.push(path([P(5, la), P(45, la)]));
  const sw = Math.max(2, Math.min(3.5, view.k / 40));
  return (
    <AbsoluteFill>
      <Parchment />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <defs><clipPath id="afClip"><path d={land} /></clipPath>
          <pattern id="hatchA" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="16" stroke="rgba(42,33,23,0.18)" strokeWidth="3" /></pattern></defs>
        <rect width={W} height={H} fill="rgba(90,105,100,0.22)" />
        <path d={grat.join('')} stroke="rgba(70,50,30,0.12)" strokeWidth={1} fill="none" />
        <path d={land} fill={C.land} />
        {regions > 0 && <g clipPath="url(#afClip)" opacity={regions}>
          <path d={path(NATAL.map(([a, b]) => P(a, b)), true)} fill={C.red} opacity={0.3} /><path d={path(NATAL.map(([a, b]) => P(a, b)), true)} fill="url(#hatchA)" />
          <path d={path(ZULU.map(([a, b]) => P(a, b)), true)} fill={C.green} opacity={0.35} />
        </g>}
        <path d={land} fill="none" stroke="rgba(52,36,22,0.85)" strokeWidth={sw} strokeLinejoin="round" />
        {rivers > 0 && [BUFFALO, TUGELA].map((r, i) => <path key={i} d={path(r.map(([a, b]) => P(a, b)))} fill="none" stroke="#4f86b0" strokeWidth={Math.max(4, Math.min(16, view.k / 50))} strokeLinecap="round" strokeLinejoin="round" opacity={rivers} />)}
        {arrows.map((a, i) => <ArrowSvg key={i} a={{ ...a, pts: a.pts.map((q) => P(...q)) }} />)}
        {children && children(P)}
        {pins.map((p, i) => <PinSvg key={i} p={p} P={P} i={i} />)}
      </svg>
      <div style={{ position: 'absolute', right: 30, top: 40, fontFamily: MONO, fontSize: 18, letterSpacing: 2, color: 'rgba(42,33,23,0.5)', textAlign: 'right' }}>MAP: NATURAL EARTH<br />1879 BORDERS APPROXIMATE</div>
    </AbsoluteFill>
  );
};

/* Top-down plan of the post (after the 1879 plan): storehouse, hospital, mealie-bag perimeter, biscuit-box cross wall. */
const SX = 90, SY = 380, SW = 900, SH = 760; // plan box on the canvas
const q = (x: number, y: number): Pt => [SX + x * SW, SY + y * SH];
const PERIM: Pt[] = [q(0.18, 0.18), q(0.45, 0.14), q(0.72, 0.2), q(0.9, 0.38), q(0.92, 0.6), q(0.75, 0.82), q(0.45, 0.86), q(0.2, 0.8), q(0.1, 0.55), q(0.18, 0.18)];
const CROSS: Pt[] = [q(0.4, 0.15), q(0.38, 0.5), q(0.36, 0.85)];
export const HOSP = { x: q(0.6, 0.4)[0], y: q(0.6, 0.4)[1], w: SW * 0.26, h: SH * 0.2 };
export const STORE = { x: q(0.16, 0.3)[0], y: q(0.16, 0.3)[1], w: SW * 0.18, h: SH * 0.34 };
export const PostPlan: React.FC<{ wall: number; cross: number; attack?: number; burn?: number; evac?: number; retreat?: number; dark?: number }> = ({ wall, cross, attack = 0, burn = 0, evac = 0, retreat = 0, dark = 0 }) => {
  const f = useCurrentFrame();
  const L = len(PERIM), L2 = len(CROSS);
  const waves: Pt[][] = [[q(0.5, 1.12), q(0.52, 0.92)], [q(1.12, 0.62), q(0.97, 0.6)], [q(0.62, -0.12), q(0.6, 0.1)], [q(-0.1, 0.55), q(0.04, 0.55)], [q(0.85, 1.08), q(0.78, 0.9)], [q(1.1, 0.25), q(0.95, 0.32)]];
  return (
    <AbsoluteFill>
      <Parchment dark={dark} />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <rect x={SX - 20} y={SY - 30} width={SW + 40} height={SH + 60} fill="rgba(170,160,110,0.18)" stroke="rgba(42,33,23,0.25)" strokeDasharray="10 8" strokeWidth={2} />
        <text x={SX} y={SY - 46} fontFamily={TYPE} fontWeight={700} fontSize={26} fill="rgba(42,33,23,0.7)">RORKE'S DRIFT · PLAN OF THE POST (AFTER 1879 SURVEY)</text>
        {/* buildings */}
        <rect x={STORE.x} y={STORE.y} width={STORE.w} height={STORE.h} fill="#cdbb92" stroke={C.charcoal} strokeWidth={5} />
        <text x={STORE.x + STORE.w / 2} y={STORE.y + STORE.h / 2 + 12} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={36} fill={C.charcoal}>STORE</text>
        <rect x={HOSP.x} y={HOSP.y} width={HOSP.w} height={HOSP.h} fill={burn > 0 ? `rgb(${205 + 40 * burn},${187 - 80 * burn},${146 - 100 * burn})` : '#cdbb92'} stroke={C.charcoal} strokeWidth={5} />
        {[1, 2, 3].map((k) => <line key={k} x1={HOSP.x + (HOSP.w * k) / 4} x2={HOSP.x + (HOSP.w * k) / 4} y1={HOSP.y} y2={HOSP.y + HOSP.h} stroke={C.charcoal} strokeWidth={3} />)}
        <text x={HOSP.x + HOSP.w / 2} y={HOSP.y - 16} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={36} fill={C.charcoal}>HOSPITAL</text>
        {/* walls */}
        <path d={path(PERIM)} fill="none" stroke="#b89a5a" strokeWidth={26} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={`${L * wall} ${L * 2}`} />
        <path d={path(PERIM)} fill="none" stroke={C.charcoal} strokeWidth={26} strokeLinejoin="round" strokeDasharray={`3 22`} opacity={wall >= 1 ? 0.35 : 0} />
        <path d={path(CROSS)} fill="none" stroke="#8a5f30" strokeWidth={22} strokeLinecap="round" strokeDasharray={`${L2 * cross} ${L2 * 2}`} />
        {/* evacuation through the hospital walls */}
        {evac > 0 && (() => { const pts: Pt[] = [[HOSP.x + HOSP.w * 0.88, HOSP.y + HOSP.h / 2], [HOSP.x + HOSP.w * 0.12, HOSP.y + HOSP.h / 2], [HOSP.x - 60, HOSP.y + HOSP.h + 40], [STORE.x + STORE.w + 70, STORE.y + STORE.h * 0.8]]; const LL = len(pts);
          return <path d={path(pts)} fill="none" stroke={C.gold} strokeWidth={10} strokeDasharray={`${LL * evac} ${LL * 2}`} strokeLinecap="round" />; })()}
        {evac > 0 && [1, 2, 3].map((k) => <circle key={k} cx={HOSP.x + (HOSP.w * k) / 4} cy={HOSP.y + HOSP.h / 2} r={14} fill={C.charcoal} opacity={lin(evac, (4 - k) * 0.12, (4 - k) * 0.12 + 0.1)} />)}
        {/* attack waves */}
        {waves.map((w, i) => { const t = ((f * 0.022 + i * 0.37) % 1); const p = attack * Math.min(1, t * 1.6); const r = retreat;
          const pts: Pt[] = r > 0 ? [w[1], [w[1][0] + (w[0][0] - w[1][0]) * 1.4, w[1][1] + (w[0][1] - w[1][1]) * 1.4]] : w;
          return <ArrowSvg key={i} a={{ pts, p: r > 0 ? r : p, color: '#3a2a1e', width: 16 }} />; })}
      </svg>
    </AbsoluteFill>
  );
};
export { ease };
