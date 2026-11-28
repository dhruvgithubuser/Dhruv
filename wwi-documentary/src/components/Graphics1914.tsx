import React from 'react';
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import europe from '../europe.json';
import { C, MONO, SANS, SERIF, ease, hash01, lin, noise1 } from '../theme';

type Pt = [number, number];
const RINGS = europe as Pt[][];

// ------------------------------------------------------------------ paper + storm
export const Paper: React.FC<{ dark?: number }> = ({ dark = 0 }) => (
  <AbsoluteFill>
    <Img src={staticFile('images/paper.jpg')} style={{ width: '100%', height: '100%' }} />
    {dark > 0 && <AbsoluteFill style={{ background: `rgba(20,12,6,${dark})` }} />}
  </AbsoluteFill>
);

/** Storm clouds spreading out from a point (x, y in px); p = 0..1 coverage. */
export const Storm: React.FC<{ p: number; x?: number; y?: number; o?: number }> = ({ p, x = 540, y = 960, o = 0.95 }) => {
  const f = useCurrentFrame();
  if (p <= 0) return null;
  const r = 60 + p * 1500;
  const mask = `radial-gradient(circle ${r}px at ${x}px ${y}px, black 0%, black 55%, transparent 100%)`;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity: o, maskImage: mask, WebkitMaskImage: mask }}>
      {[0, 1].map((i) => (
        <Img key={i} src={staticFile('images/clouds.png')} style={{ position: 'absolute', left: -120, top: -120, width: 1320, height: 2160, opacity: i ? 0.7 : 1,
          transform: `translate(${(i ? -1 : 1) * f * 0.5 + 30 * noise1(f * 0.01, i + 3)}px, ${f * 0.25 * (i ? 1 : -1)}px) scale(${1 + 0.1 * i}) rotate(${i * 180}deg)` }} />
      ))}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ Europe, 1914
export type View = { lon: number; lat: number; k: number; cy?: number };
const proj = (v: View) => {
  const c = Math.cos((v.lat * Math.PI) / 180);
  return (lon: number, lat: number): Pt => [540 + (lon - v.lon) * v.k * c, (v.cy ?? 960) - (lat - v.lat) * v.k];
};
export const PLACES: Record<string, Pt> = {
  sarajevo: [18.41, 43.86], vienna: [16.37, 48.21], belgrade: [20.46, 44.79], petersburg: [30.3, 59.94], moscow: [37.6, 55.75],
  berlin: [13.4, 52.52], paris: [2.35, 48.86], london: [-0.13, 51.5], budapest: [19.04, 47.5],
};
// label anchors for the powers (no 1914 borders are drawn: coastlines + capitals only)
const NATIONS: Record<string, { at: Pt; name: string; side: 'cp' | 'en' }> = {
  austria: { at: [17.2, 47.0], name: 'AUSTRIA-HUNGARY', side: 'cp' },
  serbia: { at: [21.2, 43.6], name: 'SERBIA', side: 'en' },
  russia: { at: [36, 56.5], name: 'RUSSIA', side: 'en' },
  germany: { at: [10.5, 51.2], name: 'GERMANY', side: 'cp' },
  france: { at: [2.4, 46.6], name: 'FRANCE', side: 'en' },
  britain: { at: [-1.8, 53.0], name: 'BRITAIN', side: 'en' },
};
const SIDE = { cp: '#e2a83a', en: '#d2281c' };
export type WarArrow = { from: string; to: string; p: number; dashed?: boolean; color?: string; march?: boolean };
// Front lines, approximate (Western: North Sea to Switzerland; Eastern: Riga to Bukovina, c. 1916)
const WESTERN: Pt[] = [[2.75, 51.13], [2.88, 50.85], [2.78, 50.29], [3.0, 49.58], [3.32, 49.38], [4.03, 49.25], [5.38, 49.16], [5.54, 48.89], [6.6, 48.6], [7.0, 48.0], [7.1, 47.5]];
const EASTERN: Pt[] = [[24.1, 56.95], [26.0, 53.1], [26.1, 52.1], [25.3, 50.75], [25.6, 49.55], [25.94, 48.3]];

export const EuropeMap: React.FC<{ view: View; storm?: number; nations?: Record<string, number>; arrows?: WarArrow[]; pulse?: number; ink?: number; sarajevoLabel?: number; fronts?: number }> = ({
  view, storm = 0, nations = {}, arrows = [], pulse = 0, ink = 1, sarajevoLabel = 0, fronts = 0,
}) => {
  const f = useCurrentFrame();
  const P = proj(view);
  const d = RINGS.map((r) => r.map(([lo, la], i) => `${i ? 'L' : 'M'}${P(lo, la).map((v) => v.toFixed(1)).join(',')}`).join('') + 'Z').join('');
  const sj = P(...PLACES.sarajevo);
  const grat: string[] = [];
  for (let lo = -30; lo <= 60; lo += 10) grat.push(`M${P(lo, 25).join(',')}L${P(lo, 75).join(',')}`);
  for (let la = 30; la <= 70; la += 10) grat.push(`M${P(-30, la).join(',')}L${P(65, la).join(',')}`);
  return (
    <AbsoluteFill>
      <Paper />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id="sea" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M0 7 Q3.5 4 7 7 T14 7" fill="none" stroke="rgba(70,60,45,0.18)" strokeWidth="1" /></pattern>
          <filter id="glow14"><feGaussianBlur stdDeviation="10" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <marker id="arrowHead" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="context-stroke" /></marker>
        </defs>
        <rect width={1080} height={1920} fill="rgba(110,135,138,0.28)" /><rect width={1080} height={1920} fill="url(#sea)" />
        <path d={grat.join('')} stroke="rgba(80,60,40,0.18)" strokeWidth={1} fill="none" />
        <path d={d} fill="#e6d6b0" stroke={`rgba(52,36,22,${0.9 * ink})`} strokeWidth={2} strokeLinejoin="round" />
        {Object.entries(NATIONS).map(([k, n]) => {
          const o = nations[k] ?? 0;
          if (o <= 0) return null;
          const [x, y] = P(...n.at);
          const col = SIDE[n.side];
          return (
            <g key={k} opacity={Math.min(1, o)}>
              <circle cx={x} cy={y} r={70 + 25 * o} fill={col} opacity={0.22} filter="url(#glow14)" />
              <text x={x} y={y} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={26} letterSpacing={2} fill="#1b120a" stroke="#f3ead8" strokeWidth={6} style={{ paintOrder: 'stroke' }}>{n.name}</text>
            </g>
          );
        })}
        {arrows.map((a, i) => {
          if (a.p <= 0) return null;
          const [x0, y0] = P(...PLACES[a.from]); const [x1, y1] = P(...PLACES[a.to]);
          const mx = (x0 + x1) / 2 + (y1 - y0) * 0.18, my = (y0 + y1) / 2 - (x1 - x0) * 0.18;
          const len = Math.hypot(x1 - x0, y1 - y0) * 1.1;
          return <path key={i} d={`M${x0},${y0} Q${mx},${my} ${x1},${y1}`} fill="none" stroke={a.color ?? C.accent} strokeWidth={7} strokeLinecap="round"
            strokeDasharray={a.dashed ? '4 14' : `${len * a.p} ${len}`} opacity={a.dashed ? a.p : 1} markerEnd={a.p > 0.97 && !a.dashed ? 'url(#arrowHead)' : undefined} />;
        })}
        {arrows.filter((a) => a.march && a.p > 0.3).map((a, i) => {
          const [x0, y0] = P(...PLACES[a.from]); const [x1, y1] = P(...PLACES[a.to]);
          const mx = (x0 + x1) / 2 + (y1 - y0) * 0.18, my = (y0 + y1) / 2 - (x1 - x0) * 0.18;
          return Array.from({ length: 5 }, (_, j) => {
            const q = ((f * 0.012 + j / 5) % 1) * Math.min(1, a.p);
            const bx = (1 - q) ** 2 * x0 + 2 * (1 - q) * q * mx + q * q * x1, by = (1 - q) ** 2 * y0 + 2 * (1 - q) * q * my + q * q * y1;
            const dx = 2 * (1 - q) * (mx - x0) + 2 * q * (x1 - mx), flip = dx < 0 ? -1 : 1;
            const l = 5 * Math.sin(f / 3 + j * 2);
            return (
              <g key={`${i}-${j}`} transform={`translate(${bx},${by - 6}) scale(${flip},1)`} fill="#1b120a" stroke="#1b120a">
                <path d={`M0,-8 L${l},6 M0,-8 L${-l},6`} strokeWidth={3} strokeLinecap="round" />
                <rect x={-4} y={-22} width={8} height={15} rx={2} stroke="none" />
                <circle cx={0} cy={-27} r={5} stroke="none" />
                <path d="M3,-20 L-4,-40" strokeWidth={2} />
              </g>
            );
          });
        })}
        {fronts > 0 && [WESTERN, EASTERN].map((line, li) => {
          const pts = line.map(([lo, la]) => P(lo, la));
          const len = pts.slice(1).reduce((s2, q, i) => s2 + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0);
          const d2 = pts.map((q, i) => `${i ? 'L' : 'M'}${q[0]},${q[1]}`).join('');
          const top = pts.reduce((m2, q) => (q[1] < m2[1] ? q : m2), pts[0]);
          return (
            <g key={li}>
              <path d={d2} fill="none" stroke="rgba(210,40,28,0.35)" strokeWidth={22} strokeLinecap="round" strokeDasharray={`${len * fronts} ${len * 2}`} />
              <path d={d2} fill="none" stroke={C.accent} strokeWidth={6} strokeLinecap="round" strokeDasharray={`${len * fronts} ${len * 2}`} />
              <path d={d2} fill="none" stroke="#1b120a" strokeWidth={2} strokeDasharray="3 9" opacity={fronts} />
              {fronts > 0.8 && <text x={top[0] + (li ? 20 : -20)} y={top[1] - 22} textAnchor={li ? 'start' : 'end'} fontFamily={SANS} fontWeight={800} fontSize={24} letterSpacing={2} fill={C.accent} stroke="#f3ead8" strokeWidth={5} style={{ paintOrder: 'stroke' }} opacity={(fronts - 0.8) * 5}>{li ? 'EASTERN FRONT' : 'WESTERN FRONT'}</text>}
            </g>
          );
        })}
        {pulse > 0 && [0, 1, 2].map((i) => {
          const t = ((f + i * 20) % 60) / 60;
          return <circle key={i} cx={sj[0]} cy={sj[1]} r={10 + t * 120} fill="none" stroke={C.accent} strokeWidth={4} opacity={(1 - t) * pulse} />;
        })}
        {pulse > 0 && <circle cx={sj[0]} cy={sj[1]} r={11} fill={C.accent} stroke="#fff" strokeWidth={3} opacity={pulse} />}
        {sarajevoLabel > 0 && <text x={sj[0] + 22} y={sj[1] + 52} fontFamily={SERIF} fontWeight={900} fontSize={44} fill="#1b120a" stroke="#f3ead8" strokeWidth={7} style={{ paintOrder: 'stroke' }} opacity={sarajevoLabel}>Sarajevo</text>}
      </svg>
      <Storm p={storm} x={sj[0]} y={sj[1]} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ Sarajevo, schematic street map (not to scale)
// x grows east, y grows south. The Miljacka runs west-east; the Appel Quay runs along its north bank.
const QY = 935, RY = 1010; // quay centre line, river centre line
const LATIN = 600, CUMURIJA = 300, TOWNHALL = 930, FJ_TOP = 520;
export type MapCam = { x: number; y: number; s: number };
type CarPath = Pt[];
const MORNING: CarPath = [[-120, QY], [TOWNHALL - 40, QY]];
const RETURN: CarPath = [[TOWNHALL - 40, QY], [LATIN + 12, QY], [LATIN + 12, 820]];
const along = (path: CarPath, t: number): { p: Pt; a: number } => {
  const segs = path.slice(1).map((q, i) => ({ a: path[i], b: q, l: Math.hypot(q[0] - path[i][0], q[1] - path[i][1]) }));
  const tot = segs.reduce((s, x) => s + x.l, 0);
  let d = Math.max(0, Math.min(1, t)) * tot;
  for (const s of segs) {
    if (d <= s.l) { const k = d / s.l; return { p: [s.a[0] + (s.b[0] - s.a[0]) * k, s.a[1] + (s.b[1] - s.a[1]) * k], a: Math.atan2(s.b[1] - s.a[1], s.b[0] - s.a[0]) }; }
    d -= s.l;
  }
  const s = segs[segs.length - 1];
  return { p: s.b, a: Math.atan2(s.b[1] - s.a[1], s.b[0] - s.a[0]) };
};
const pathD = (path: CarPath, t: number) => {
  const pts: Pt[] = [];
  for (let i = 0; i <= 60; i++) pts.push(along(path, (i / 60) * t).p);
  return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join('');
};
const Car: React.FC<{ p: Pt; a: number; hero?: boolean; o?: number }> = ({ p, a, hero, o = 1 }) => (
  <g transform={`translate(${p[0]},${p[1]}) rotate(${(a * 180) / Math.PI})`} opacity={o}>
    {hero && <circle r={34} fill="rgba(233,176,74,0.35)" />}
    <rect x={-22} y={-11} width={44} height={22} rx={6} fill={hero ? C.amber : '#2a2018'} stroke="#120c06" strokeWidth={2.5} />
    <rect x={-4} y={-8} width={14} height={16} rx={3} fill={hero ? '#7a4b10' : '#5a4a3a'} />
  </g>
);

export const SarajevoMap: React.FC<{
  cam: MapCam; morning?: number; assassins?: number; bomb?: number; plan?: number; ret?: number; leaders?: number; wrong?: number; stall?: number; princip?: number; measure?: number; labels?: number;
}> = ({ cam, morning = 0, assassins = 0, bomb = 0, plan = 0, ret = 0, leaders = 0, wrong = 0, stall = 0, princip = 0, measure = 0, labels = 1 }) => {
  const f = useCurrentFrame();
  const riverD = (off: number) => Array.from({ length: 41 }, (_, i) => { const x = -400 + i * 50; return `${i ? 'L' : 'M'}${x},${RY + off + 18 * Math.sin(x / 260)}`; }).join('');
  const blocks: [number, number, number, number][] = [];
  for (let bx = -300; bx < 1400; bx += 150) for (let by = 300; by < 860; by += 140) {
    if (Math.abs(bx + 60 - LATIN) < 90) continue; // keep Franz Josef Street open
    if (bx > TOWNHALL - 120 && bx < TOWNHALL + 60 && by > 700) continue;
    blocks.push([bx + 8 * hash01(bx, by), by + 6 * hash01(by, bx), 120, 108]);
  }
  for (let bx = -300; bx < 1400; bx += 150) for (let by = 1090; by < 1500; by += 140) blocks.push([bx, by, 120, 108]);
  // Six assassins along the quay (positions approximate): Mehmedbasic, Cubrilovic, Cabrinovic, Popovic, Princip, Grabez
  const ASS: Pt[] = [[200, QY - 48], [245, QY - 48], [300, QY + 42], [430, QY - 48], [560, QY - 48], [700, QY - 48]];
  const m = along(MORNING, morning);
  const r = along(RETURN, ret);
  const lead1 = along(RETURN, Math.min(1, leaders + 0.12)), lead2 = along(RETURN, Math.min(1, leaders + 0.06));
  const label = (x: number, y: number, t: string, o = 1, rot = 0, size = 26) => (
    <text x={x} y={y} transform={rot ? `rotate(${rot} ${x} ${y})` : undefined} textAnchor="middle" fontFamily={MONO} fontSize={size} letterSpacing={3} fill="#2a1c10" opacity={o * labels}>{t}</text>
  );
  return (
    <AbsoluteFill>
      <Paper />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke="rgba(60,40,20,0.35)" strokeWidth="2" /></pattern>
        </defs>
        <g transform={`translate(540,960) scale(${cam.s}) translate(${-cam.x},${-cam.y})`}>
          {blocks.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} fill="url(#hatch)" stroke="rgba(60,40,20,0.55)" strokeWidth={2} rx={4} />)}
          {/* river */}
          <path d={riverD(0)} stroke="#8fa3a6" strokeWidth={70} fill="none" opacity={0.85} />
          <path d={riverD(-35)} stroke="#3a2a1a" strokeWidth={2.5} fill="none" />
          <path d={riverD(35)} stroke="#3a2a1a" strokeWidth={2.5} fill="none" />
          {/* quay + Franz Josef Street */}
          <rect x={-400} y={QY - 26} width={2000} height={52} fill="#efe3c6" stroke="#3a2a1a" strokeWidth={2.5} />
          <rect x={LATIN - 24} y={FJ_TOP} width={48} height={QY - FJ_TOP} fill="#efe3c6" stroke="#3a2a1a" strokeWidth={2.5} />
          <rect x={LATIN - 22} y={QY - 24} width={44} height={48} fill="#efe3c6" />
          {/* bridges */}
          {[CUMURIJA, LATIN, 820].map((x) => <rect key={x} x={x - 20} y={QY + 26} width={40} height={60} fill="#d9c9a4" stroke="#3a2a1a" strokeWidth={2.5} />)}
          {/* town hall + deli */}
          <rect x={TOWNHALL - 70} y={QY - 150} width={140} height={110} fill="rgba(210,40,28,0.12)" stroke="#3a2a1a" strokeWidth={3} />
          <rect x={LATIN + 30} y={QY - 110} width={80} height={80} fill={princip > 0 ? 'rgba(233,176,74,0.35)' : 'rgba(60,40,20,0.08)'} stroke="#3a2a1a" strokeWidth={3} />
          {label(TOWNHALL, QY - 170, 'TOWN HALL')}
          {label(LATIN, QY + 120, 'LATIN BRIDGE')}
          {label(CUMURIJA, QY + 120, 'ĆUMURIJA BRIDGE', 0.8, 0, 20)}
          {label(LATIN - 46, 700, 'FRANZ JOSEF STREET', 1, -90, 22)}
          {label(LATIN + 70, QY - 122, "SCHILLER'S DELI", princip > 0 ? 1 : 0.6, 0, 18)}
          {label(120, QY + 6, 'APPEL QUAY', 0.9, 0, 22)}
          {label(380, RY + 62, 'MILJACKA RIVER', 0.7, 0, 18)}
          {/* routes */}
          {morning > 0 && <path d={pathD(MORNING, morning)} stroke="#3a2a1a" strokeWidth={6} strokeDasharray="2 12" strokeLinecap="round" fill="none" />}
          {plan > 0 && (
            <g opacity={Math.min(1, plan * 3)}>
              <path d={`M${TOWNHALL - 40},${QY} L${TOWNHALL - 40 - (TOWNHALL + 340) * plan},${QY}`} stroke={C.green} strokeWidth={10} strokeDasharray="22 12" fill="none" />
              {plan > 0.9 && label(80, QY - 60, '← TO HOSPITAL', 1, 0, 26)}
            </g>
          )}
          {wrong > 0 && <path d={pathD(RETURN, Math.min(1, wrong))} stroke={C.accent} strokeWidth={10} strokeLinecap="round" fill="none" />}
          {/* assassins */}
          {ASS.map(([x, y], i) => {
            const o = lin(assassins * 6, i, i + 0.6);
            if (o <= 0) return null;
            const s = 0.6 + 0.4 * o;
            const isP = i === 4;
            const px = isP && princip > 0 ? x + (LATIN + 46 - x) * Math.min(1, princip) : x;
            const py = isP && princip > 0 ? y + (QY - 66 - y) * Math.min(1, princip) : y;
            return (
              <g key={i} transform={`translate(${px},${py}) scale(${s})`} opacity={i === 2 && bomb > 0.5 ? 0.35 : 1}>
                <circle r={16} fill={C.accent} stroke="#fff" strokeWidth={3} />
                <circle r={26 + 6 * Math.sin(f / 6 + i)} fill="none" stroke={C.accent} strokeWidth={2} opacity={0.6} />
              </g>
            );
          })}
          {/* bomb burst at the Cumurija bridge */}
          {bomb > 0 && (
            <g transform={`translate(${CUMURIJA + 60},${QY})`}>
              <circle r={30 + bomb * 90} fill="none" stroke="#ff8a2a" strokeWidth={8} opacity={1 - bomb} />
              <circle r={22} fill="#ff8a2a" opacity={0.9} />
              {label(0, -50, '10:10 BOMB', 1, 0, 24)}
            </g>
          )}
          {/* cars */}
          {morning > 0 && morning < 1 && <Car p={m.p} a={m.a} hero />}
          {leaders > 0 && <><Car p={lead1.p} a={lead1.a} /><Car p={lead2.p} a={lead2.a} /></>}
          {ret > 0 && <Car p={r.p} a={r.a} hero />}
          {stall > 0 && (
            <g transform={`translate(${LATIN + 12},${820 + 60})`} opacity={stall}>
              <path d="M0,-10 L0,40" stroke={C.accent} strokeWidth={6} />
              <path d="M-12,26 L0,44 L12,26" fill="none" stroke={C.accent} strokeWidth={6} />
              {label(-120, 30, 'STOP · REVERSE', 1, 0, 20)}
            </g>
          )}
          {measure > 0 && (
            <g opacity={measure}>
              <line x1={LATIN + 26} y1={826} x2={LATIN + 46} y2={QY - 66} stroke="#1b120a" strokeWidth={3} strokeDasharray="6 5" />
              <text x={LATIN + 80} y={800} fontFamily={SANS} fontWeight={800} fontSize={30} fill={C.accent} stroke="#f3ead8" strokeWidth={6} style={{ paintOrder: 'stroke' }}>≈5 FT</text>
            </g>
          )}
        </g>
      </svg>
      <div style={{ position: 'absolute', right: 40, top: 1700, fontFamily: MONO, fontSize: 18, letterSpacing: 2, color: 'rgba(40,28,16,0.7)', opacity: labels }}>SCHEMATIC · NOT TO SCALE</div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ cards, stamps, readouts
/** Dossier card with a painted portrait. */
export const IdCard: React.FC<{ img?: string; name: string; lines: string[]; at: number; x?: number; y?: number; w?: number; tilt?: number; silhouette?: boolean }> = ({
  img, name, lines, at, x = 80, y = 1360, w = 640, tilt = -2, silhouette,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = spring({ frame: f - at, fps, config: { damping: 16, stiffness: 170 } });
  if (f < at) return null;
  const ph = 190;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, transform: `translateX(${(1 - k) * -700}px) rotate(${tilt}deg)`, opacity: Math.min(1, k * 2),
      background: `url(${staticFile('images/paper.jpg')}) center/cover`, boxShadow: '0 18px 40px rgba(0,0,0,0.6)', padding: 18, display: 'flex', gap: 20, border: '2px solid #3a2a1a' }}>
      <div style={{ width: ph * 0.8, height: ph, flexShrink: 0, background: '#1a120a', border: '3px solid #3a2a1a', overflow: 'hidden', position: 'relative' }}>
        {img && <Img src={staticFile(img)} style={{ width: '100%', height: '160%', objectFit: 'cover', objectPosition: '50% 12%', filter: 'sepia(0.25) contrast(1.05)' }} />}
        {silhouette && (
          <svg width="100%" height="100%" viewBox="0 0 100 125"><rect width="100" height="125" fill="#3a2e22" />
            <path d="M28 40 Q50 22 72 40 L74 46 L26 46 Z" fill="#120c06" /><circle cx="50" cy="58" r="17" fill="#120c06" /><path d="M14 125 Q16 86 50 80 Q84 86 86 125 Z" fill="#120c06" />
            <text x="50" y="66" textAnchor="middle" fontSize="20" fill="#5a4a3a" fontFamily="Inter" fontWeight="800">?</text></svg>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 44, color: '#1b120a', lineHeight: 1.05 }}>{name}</div>
        {lines.map((l, i) => <div key={i} style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 2, color: '#3a2a1a', marginTop: 8, textTransform: 'uppercase', opacity: lin(f, at + 6 + i * 4, at + 12 + i * 4) }}>{l}</div>)}
      </div>
    </div>
  );
};

/** Rubber stamp that slams onto the frame at `at`. */
export const Stamp: React.FC<{ text: string; at: number; x?: number; y?: number; size?: number; rot?: number; color?: string }> = ({ text, at, x = 540, y = 760, size = 96, rot = -8, color = C.accent }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const k = Math.min(1, (f - at) / 5);
  const s = 1.9 - 0.9 * k;
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s})`, opacity: 0.25 + 0.7 * k,
      border: `${size * 0.09}px solid ${color}`, borderRadius: 14, padding: `${size * 0.08}px ${size * 0.28}px`, fontFamily: SANS, fontWeight: 800, fontSize: size, letterSpacing: 4,
      color, whiteSpace: 'nowrap', textTransform: 'uppercase', textShadow: '0 0 1px rgba(0,0,0,0.3)', background: 'rgba(0,0,0,0.12)',
      maskImage: `url(${staticFile('images/clouds.png')})`, WebkitMaskImage: `url(${staticFile('images/clouds.png')})`, maskSize: '220% 220%', WebkitMaskSize: '220% 220%', maskMode: 'luminance' as never }}>
      {text}
    </div>
  );
};

/** Analog clock + digital readout. */
export const Clock: React.FC<{ h: number; m: number; x?: number; y?: number; size?: number; at?: number; label?: string }> = ({ h, m, x = 540, y = 520, size = 260, at = 0, label }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 8);
  if (o <= 0) return null;
  const mm = m + Math.min(0, f - at - 20) * 0; // static once settled
  const spin = (1 - ease(f, at, at + 20)) * 360;
  const ma = (mm / 60) * 360 - spin * 2, ha = ((h % 12) / 12) * 360 + (mm / 60) * 30 - spin * 0.5;
  const r = size / 2;
  return (
    <div style={{ position: 'absolute', left: x - r, top: y - r, width: size, height: size + 80, opacity: o }}>
      <svg width={size} height={size}>
        <circle cx={r} cy={r} r={r - 6} fill="#efe3c6" stroke="#2a1c10" strokeWidth={8} />
        {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <line key={i} x1={r + Math.sin(a) * (r - 18)} y1={r - Math.cos(a) * (r - 18)} x2={r + Math.sin(a) * (r - 34)} y2={r - Math.cos(a) * (r - 34)} stroke="#2a1c10" strokeWidth={i % 3 ? 3 : 7} />; })}
        <line x1={r} y1={r} x2={r + Math.sin((ha * Math.PI) / 180) * r * 0.5} y2={r - Math.cos((ha * Math.PI) / 180) * r * 0.5} stroke="#1b120a" strokeWidth={10} strokeLinecap="round" />
        <line x1={r} y1={r} x2={r + Math.sin((ma * Math.PI) / 180) * r * 0.75} y2={r - Math.cos((ma * Math.PI) / 180) * r * 0.75} stroke="#1b120a" strokeWidth={6} strokeLinecap="round" />
        <circle cx={r} cy={r} r={9} fill={C.accent} />
      </svg>
      <div style={{ textAlign: 'center', fontFamily: MONO, fontSize: 44, letterSpacing: 6, color: '#fff', textShadow: '0 3px 12px #000', marginTop: 10 }}>{label ?? `${h}:${String(m).padStart(2, '0')} AM`}</div>
    </div>
  );
};

/** Big rolling number. */
export const Counter: React.FC<{ to: number; at: number; dur?: number; x?: number; y?: number; size?: number; prefix?: string; suffix?: string; sub?: string; color?: string }> = ({
  to, at, dur = 40, x = 540, y = 600, size = 150, prefix = '', suffix = '', sub, color = '#fff',
}) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 6);
  if (o <= 0) return null;
  const v = Math.round(to * ease(f, at, at + dur));
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', opacity: o }}>
      <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: size, color, lineHeight: 1, textShadow: '0 6px 30px rgba(0,0,0,0.9)', fontVariantNumeric: 'tabular-nums' }}>{prefix}{v.toLocaleString('en-US')}{suffix}</div>
      {sub && <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: C.amber, marginTop: 14, textShadow: '0 3px 10px #000' }}>{sub}</div>}
    </div>
  );
};

// ------------------------------------------------------------------ VFX
/** Bomb blast: white flash, fireball, smoke puffs drifting up, debris (seeded). */
export const Explosion: React.FC<{ at: number; x?: number; y?: number; scale?: number }> = ({ at, x = 540, y = 1050, scale = 1 }) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0) return null;
  const flash = Math.max(0, 1 - t / 6);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill style={{ background: `rgba(255,240,210,${0.85 * flash})` }} />
      <svg width={1080} height={1920}>
        <defs>
          <radialGradient id="fire"><stop offset="0" stopColor="#fff6d0" /><stop offset="0.35" stopColor="#ffb040" /><stop offset="0.7" stopColor="#d2401a" stopOpacity="0.6" /><stop offset="1" stopColor="#300" stopOpacity="0" /></radialGradient>
          <filter id="smokeBlur"><feGaussianBlur stdDeviation="14" /></filter>
        </defs>
        <g filter="url(#smokeBlur)">
          {Array.from({ length: 26 }, (_, i) => {
            const a = hash01(i, 11) * Math.PI * 2, sp = 2 + hash01(i, 12) * 6;
            const r = (40 + hash01(i, 13) * 90 + t * (1.5 + hash01(i, 14) * 2)) * scale;
            const px = x + Math.cos(a) * sp * t * 1.2 * scale, py = y + Math.sin(a) * sp * t * 0.6 * scale - t * 2.2 * scale;
            const g = 60 + hash01(i, 15) * 50;
            return <circle key={i} cx={px} cy={py} r={r * 0.9} fill={`rgb(${g},${g * 0.95},${g * 0.9})`} opacity={Math.min(0.72, t / 4) * Math.max(0, 1 - t / 100)} />;
          })}
        </g>
        <circle cx={x} cy={y} r={(70 + t * 22) * scale} fill="url(#fire)" opacity={Math.max(0, 1 - t / 20)} />
        {Array.from({ length: 34 }, (_, i) => {
          const a = -Math.PI * (0.1 + 0.8 * hash01(i, 21)), v = 14 + hash01(i, 22) * 24;
          const px = x + Math.cos(a) * v * t * scale, py = y + (Math.sin(a) * v * t + 0.9 * t * t) * scale;
          return <rect key={i} x={px} y={py} width={5 + hash01(i, 23) * 8} height={3 + hash01(i, 24) * 6} fill="#1a120a" opacity={Math.max(0, 1 - t / 40)} transform={`rotate(${t * 20 * hash01(i, 25)} ${px} ${py})`} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** Gunshot: two-frame white flash + starburst at (x, y). */
export const MuzzleFlash: React.FC<{ at: number; x?: number; y?: number }> = ({ at, x = 540, y = 900 }) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0 || t > 10) return null;
  const k = Math.max(0, 1 - t / 4);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill style={{ background: `rgba(255,250,235,${t < 2 ? 0.9 : 0.5 * k})` }} />
      <svg width={1080} height={1920}>
        <g transform={`translate(${x},${y})`} opacity={k}>
          {Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2 + 0.3; const l = 120 + 160 * hash01(i, at); return <line key={i} x1={0} y1={0} x2={Math.cos(a) * l} y2={Math.sin(a) * l} stroke="#fff3c0" strokeWidth={10} strokeLinecap="round" />; })}
          <circle r={70} fill="#fff8dc" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** Heartbeat: the frame edges darken and flush red in a double pulse. */
export const Heartbeat: React.FC<{ from?: number; bpm?: number; o?: number }> = ({ from = 0, bpm = 70, o = 1 }) => {
  const f = useCurrentFrame();
  if (f < from) return null;
  const per = (30 * 60) / bpm;
  const ph = ((f - from) % per) / per;
  const beat = Math.exp(-((ph - 0.05) ** 2) / 0.002) + 0.6 * Math.exp(-((ph - 0.2) ** 2) / 0.002);
  return <AbsoluteFill style={{ pointerEvents: 'none', opacity: o, background: `radial-gradient(ellipse 70% 55% at 50% 45%, rgba(0,0,0,0) 40%, rgba(${60 + 120 * beat},0,0,${0.45 + 0.3 * beat}) 100%)` }} />;
};

/** FN Model 1910 silhouette (schematic, not to scale). */
export const Pistol: React.FC<{ at: number; x?: number; y?: number; w?: number }> = ({ at, x = 540, y = 600, w = 520 }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 8);
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: x - w / 2, top: y, width: w, opacity: o, transform: `translateY(${(1 - ease(f, at, at + 14)) * 30}px)` }}>
      <svg width={w} height={w * 0.62} viewBox="0 0 300 186">
        <path d="M10 30 Q10 18 22 18 L282 18 Q292 18 292 30 L292 62 L10 62 Z" fill="#15100b" stroke="#b9a47e" strokeWidth={2} />
        <path d="M24 26 L278 26" stroke="#3a2e22" strokeWidth={3} />
        {Array.from({ length: 9 }, (_, i) => <line key={i} x1={215 + i * 7} y1={22} x2={215 + i * 7} y2={58} stroke="#3a2e22" strokeWidth={2} />)}
        <path d="M200 62 L280 62 L290 178 Q290 184 282 184 L222 184 Q214 184 212 176 Z" fill="#15100b" stroke="#b9a47e" strokeWidth={2} />
        <path d="M150 62 Q150 108 196 108 L208 108" fill="none" stroke="#b9a47e" strokeWidth={6} />
        <path d="M176 62 L172 92" stroke="#b9a47e" strokeWidth={5} />
      </svg>
      <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 4, color: "#7a1a12", textAlign: "center", marginTop: 6 }}>FN MODEL 1910 · .380 ACP</div>
    </div>
  );
};

/** Date card: SUNDAY / 28 / JUNE 1914 with page-flip numbers. */
export const DateCard: React.FC<{ at?: number; y?: number }> = ({ at = 0, y = 360 }) => {
  const f = useCurrentFrame();
  const n = Math.min(28, Math.max(1, Math.round(1 + 27 * ease(f, at, at + 22))));
  const o = lin(f, at, at + 6);
  return (
    <div style={{ position: 'absolute', left: 290, top: y, width: 500, opacity: o, transform: `rotate(-2deg) scale(${0.9 + 0.1 * ease(f, at, at + 12)})`, background: `url(${staticFile('images/paper.jpg')}) center/cover`, boxShadow: '0 24px 60px rgba(0,0,0,0.7)', border: '3px solid #2a1c10' }}>
      <div style={{ background: C.accent, color: '#fff', fontFamily: MONO, fontSize: 30, letterSpacing: 10, textAlign: 'center', padding: '10px 0' }}>SUNDAY</div>
      <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 230, color: '#1b120a', textAlign: 'center', lineHeight: 1.05 }}>{n}</div>
      <div style={{ fontFamily: MONO, fontSize: 40, letterSpacing: 12, color: '#2a1c10', textAlign: 'center', paddingBottom: 20 }}>JUNE 1914</div>
    </div>
  );
};

/** Typed quotation card. */
export const Quote: React.FC<{ text: string; by: string; at: number; dur: number; y?: number }> = ({ text, by, at, dur, y = 300 }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 8);
  if (o <= 0) return null;
  const n = Math.round(text.length * lin(f, at, at + dur));
  return (
    <div style={{ position: 'absolute', left: 70, right: 70, top: y, opacity: o, background: 'rgba(14,10,6,0.72)', borderLeft: `8px solid ${C.accent}`, padding: '34px 40px' }}>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 58, lineHeight: 1.2, color: '#fff' }}>“{text.slice(0, n)}<span style={{ opacity: 0.25 }}>{text.slice(n)}</span>”</div>
      <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 4, color: C.amber, marginTop: 22 }}>{by}</div>
    </div>
  );
};

/** Date chip used on the war map. */
export const Chip: React.FC<{ date: string; text: string; at: number; y: number; color?: string }> = ({ date, text, at, y, color = C.accent }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const k = spring({ frame: f - at, fps, config: { damping: 18, stiffness: 200 } });
  return (
    <div style={{ position: 'absolute', left: 60, top: y, display: 'flex', alignItems: 'stretch', transform: `translateX(${(1 - k) * -500}px)`, opacity: k, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <div style={{ background: color, color: '#fff', fontFamily: MONO, fontSize: 26, letterSpacing: 3, padding: '12px 18px' }}>{date}</div>
      <div style={{ background: 'rgba(14,10,6,0.88)', color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 28, letterSpacing: 1, padding: '12px 20px', textTransform: 'uppercase' }}>{text}</div>
    </div>
  );
};

/** War cemetery: rows of white crosses rising toward a misty horizon, front rows first (perspective, animated). */
export const Cemetery: React.FC<{ p: number }> = ({ p }) => {
  const f = useCurrentFrame();
  const hz = 760;
  const rows = 26;
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920}>
        <defs>
          <linearGradient id="dawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5a6470" /><stop offset="0.75" stopColor="#d9cdb4" /><stop offset="1" stopColor="#efe3c8" /></linearGradient>
          <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a7a98c" /><stop offset="0.3" stopColor="#5b6b45" /><stop offset="1" stopColor="#25301c" /></linearGradient>
          <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgba(239,227,200,0)" /><stop offset="0.5" stopColor="rgba(239,227,200,0.85)" /><stop offset="1" stopColor="rgba(239,227,200,0)" /></linearGradient>
        </defs>
        <rect width={1080} height={hz} fill="url(#dawn)" />
        <circle cx={760} cy={hz - 40} r={70} fill="rgba(255,236,200,0.8)" />
        <rect y={hz} width={1080} height={1920 - hz} fill="url(#grass)" />
        {Array.from({ length: rows }, (_, r0) => {
          const r = rows - 1 - r0; // far rows first in paint order
          const z = 1 + r * 0.55; // depth
          const y = hz + 1100 / z;
          const s = 1.6 / z;
          const show = lin(p * rows * 1.3, r, r + 1.5);
          if (show <= 0) return null;
          const gap = 150 / z;
          const n = Math.ceil(1400 / gap);
          return (
            <g key={r} opacity={show}>
              {Array.from({ length: n }, (_, i) => {
                const x = 540 + (i - n / 2) * gap + (r % 2) * gap * 0.5;
                const rise = (1 - show) * 30 * s;
                return (
                  <g key={i} transform={`translate(${x},${y + rise}) scale(${s})`}>
                    <rect x={-6} y={-120} width={12} height={120} fill="#f4f1e8" />
                    <rect x={-30} y={-96} width={60} height={11} fill="#f4f1e8" />
                    <rect x={4} y={-120} width={3} height={120} fill="rgba(0,0,0,0.12)" />
                    <ellipse cx={0} cy={2} rx={26} ry={5} fill="rgba(0,0,0,0.25)" />
                  </g>
                );
              })}
            </g>
          );
        })}
        <rect y={hz - 80} width={1080} height={260} fill="url(#mist)" opacity={0.7 + 0.1 * Math.sin(f / 30)} />
      </svg>
    </AbsoluteFill>
  );
};
