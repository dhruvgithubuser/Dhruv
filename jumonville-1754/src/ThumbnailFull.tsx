import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { CastDefs, Person, Soldier } from './components/Cast';
import { Finish, Fonts } from './components/Stage';
import world from './data/world.json';
import { C, HEAD, hash01 } from './theme';

type Pt = [number, number];
const WORLD = world as Pt[][];
const D = Math.PI / 180;
/** Orthographic globe projection. */
const ortho = (cx: number, cy: number, R: number, lon0: number, lat0: number) => (lon: number, lat: number): Pt | null => {
  const la = lat * D, lo = (lon - lon0) * D, l0 = lat0 * D;
  const c = Math.sin(l0) * Math.sin(la) + Math.cos(l0) * Math.cos(la) * Math.cos(lo);
  if (c < 0) return null;
  return [cx + R * Math.cos(la) * Math.sin(lo), cy - R * (Math.cos(l0) * Math.sin(la) - Math.sin(l0) * Math.cos(la) * Math.cos(lo))];
};

/** Full thumbnail: Washington and his men firing in the glen at dawn; the muzzle flash lights a fuse that runs to a burning
 *  parchment globe (the Seven Years' War theatres glowing). Text: "15 MINUTES" / "→ WORLD WAR" / "1754". */
export const ThumbnailFull: React.FC = () => {
  const gx = 1460, gy = 700, R = 270;
  const P = ortho(gx, gy, R, -35, 28);
  const land = WORLD.map((r) => {
    const pts = r.map(([a, b]) => P(a, b));
    let d = ''; let pen = false;
    for (const p of pts) { if (!p) { pen = false; continue; } d += `${pen ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`; pen = true; }
    return d;
  }).join('');
  const theatres: Pt[] = [[-79, 41], [10, 50], [-66, 17], [-15, 14], [-57, -34], [80, 22]];
  const muzzle: Pt = [762, 616];
  const fuse = `M${muzzle[0]},${muzzle[1]} C 860,560 980,860 1120,760 S 1230,640 ${gx - R + 30},${gy - 40}`;
  return (
    <AbsoluteFill style={{ background: '#120b06' }}>
      <Fonts />
      <Img src={staticFile('assets/backgrounds/glen_dawn.jpg')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.45) brightness(0.5) contrast(1.2)' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(circle 620px at 1460px 700px, rgba(255,120,30,0.55), rgba(255,80,20,0.12) 55%, rgba(0,0,0,0) 75%)' }} />
      <AbsoluteFill style={{ background: 'linear-gradient(90deg, rgba(10,6,3,0.35), rgba(10,6,3,0) 40%, rgba(10,6,3,0) 60%, rgba(10,6,3,0.3))' }} />
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <filter id="blur18"><feGaussianBlur stdDeviation="18" /></filter>
          <filter id="blur6"><feGaussianBlur stdDeviation="6" /></filter>
          <radialGradient id="globeSea" cx="0.38" cy="0.32" r="0.75"><stop offset="0" stopColor="#efe2c2" /><stop offset="1" stopColor="#b9a47c" /></radialGradient>
          <radialGradient id="globeShade" cx="0.35" cy="0.3" r="0.8"><stop offset="0.55" stopColor="rgba(0,0,0,0)" /><stop offset="1" stopColor="rgba(60,20,0,0.55)" /></radialGradient>
          <linearGradient id="flame" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#ffdd7a" /><stop offset="0.45" stopColor="#ff8a1e" /><stop offset="1" stopColor="#c0391b" stopOpacity="0" /></linearGradient>
          <clipPath id="globeClip"><circle cx={gx} cy={gy} r={R} /></clipPath>
        </defs>
        {/* musket smoke behind the firing line */}
        <g filter="url(#blur18)">{Array.from({ length: 14 }, (_, i) => <circle key={i} cx={560 + i * 46} cy={600 - (i % 4) * 28} r={60 + (i % 5) * 16} fill="rgba(235,226,205,0.42)" />)}</g>
        {/* flames licking up around the globe */}
        <g filter="url(#blur6)">
          {Array.from({ length: 26 }, (_, i) => {
            const a = Math.PI * (1.08 + 0.84 * (i / 25)); const x = gx + (R - 10) * Math.cos(a), y = gy + (R - 10) * Math.sin(a);
            const h = 90 + 110 * hash01(i, 4) * (1 - Math.abs(Math.cos(a)) * 0.5);
            return <path key={i} d={`M${x - 30},${y + 20} Q${x - 10},${y - h * 0.5} ${x + 8 * Math.sin(i)},${y - h} Q${x + 18},${y - h * 0.45} ${x + 30},${y + 20} Z`} fill="url(#flame)" opacity={0.9} />;
          })}
        </g>
        {/* the globe */}
        <circle cx={gx} cy={gy} r={R + 10} fill="#2a1a0e" />
        <circle cx={gx} cy={gy} r={R} fill="url(#globeSea)" />
        <g clipPath="url(#globeClip)">
          {Array.from({ length: 12 }, (_, i) => { const lo = -180 + i * 30; const pts = Array.from({ length: 37 }, (_, j) => P(lo, -90 + j * 5)).filter(Boolean) as Pt[]; return <path key={`m${i}`} d={pts.map((p, k) => `${k ? 'L' : 'M'}${p[0]},${p[1]}`).join('')} fill="none" stroke="rgba(90,60,30,0.25)" strokeWidth={1.5} />; })}
          {Array.from({ length: 5 }, (_, i) => { const la = -60 + i * 30; const pts = Array.from({ length: 73 }, (_, j) => P(-180 + j * 5, la)).filter(Boolean) as Pt[]; return <path key={`p${i}`} d={pts.map((p, k) => `${k ? 'L' : 'M'}${p[0]},${p[1]}`).join('')} fill="none" stroke="rgba(90,60,30,0.25)" strokeWidth={1.5} />; })}
          <path d={land} fill="none" stroke="#3a2614" strokeWidth={3} />
          <path d={land} fill="rgba(160,120,70,0.35)" />
          <circle cx={gx + 60} cy={gy - 330} r={260} fill="rgba(255,120,30,0.35)" filter="url(#blur18)" />
        </g>
        <circle cx={gx} cy={gy} r={R} fill="url(#globeShade)" />
        <circle cx={gx} cy={gy} r={R} fill="none" stroke="#3a2614" strokeWidth={6} />
        {theatres.map((t, i) => { const p = P(...t); if (!p) return null; return <g key={i}><circle cx={p[0]} cy={p[1]} r={34} fill="#ff7a1e" opacity={0.45} filter="url(#blur6)" /><circle cx={p[0]} cy={p[1]} r={11} fill="#c0392b" stroke="#ffe3a0" strokeWidth={3} /></g>; })}
        {/* the burning fuse from the muzzle to the globe */}
        <path d={fuse} fill="none" stroke="#2a1a0e" strokeWidth={14} strokeLinecap="round" />
        <path d={fuse} fill="none" stroke="#c0392b" strokeWidth={7} strokeLinecap="round" />
        <path d={fuse} fill="none" stroke="#ffd27a" strokeWidth={3} strokeDasharray="10 16" strokeLinecap="round" />
        {[[970, 735], [1200, 690]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r={30} fill="#ffb347" opacity={0.5} filter="url(#blur6)" />{Array.from({ length: 8 }, (_, j) => { const a = (j / 8) * Math.PI * 2; return <line key={j} x1={x} y1={y} x2={x + Math.cos(a) * 26} y2={y + Math.sin(a) * 26} stroke="#ffe3a0" strokeWidth={3} />; })}</g>)}
        {/* firing line + muzzle flash */}
        <g style={{ filter: 'brightness(0.45)' }}>
          <Soldier kind="virginian" x={610} y={830} s={1.65} pose="kneelAim" />
        </g>
        <circle cx={muzzle[0]} cy={muzzle[1]} r={60} fill="#ffe7a8" filter="url(#blur6)" />
        <circle cx={muzzle[0]} cy={muzzle[1]} r={26} fill="#fff8dc" />
        <CastDefs />
        <Person who="washington" x={360} y={1360} s={2.45} />
      </svg>
      {/* text */}
      <div style={{ position: 'absolute', left: 820, top: 40, width: 1060, textAlign: 'right' }}>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 230, lineHeight: 0.9, color: C.paper, WebkitTextStroke: '8px #120b06', paintOrder: 'stroke fill', textShadow: '0 12px 40px rgba(0,0,0,0.9)', whiteSpace: 'nowrap' }}><span style={{ color: '#e8452f' }}>15</span> MINUTES</div>
      </div>
      <div style={{ position: 'absolute', left: 860, top: 300, fontFamily: HEAD, fontWeight: 700, fontSize: 78, color: '#ffd27a', WebkitTextStroke: '5px #120b06', paintOrder: 'stroke fill', textShadow: '0 8px 24px rgba(0,0,0,0.9)', whiteSpace: 'nowrap' }}>→ A WORLD WAR</div>
      <div style={{ position: 'absolute', left: 60, top: 60, background: C.paper, padding: '8px 24px', fontFamily: HEAD, fontWeight: 700, fontSize: 58, letterSpacing: 8, color: C.ink, transform: 'rotate(-3deg)', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>1754</div>
      <Finish />
    </AbsoluteFill>
  );
};
