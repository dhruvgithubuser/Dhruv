import React from 'react';
import { useCurrentFrame } from 'remotion';
import geo from '../geo.json';
import { C, H, W, hash01, noise1 } from '../theme';
import { Petrov, PetrovProps } from './Petrov';

type Ring = number[][];
const G = geo as { land: Ring[]; usa: Ring[]; ussr: Ring[] };

// ------------------------------------------------------------------ painterly defs used by sets
export const PaintDefs: React.FC = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }}>
    <defs>
      <filter id="brush" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="3" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="8" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="glowBig" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="22" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="blur6"><feGaussianBlur stdDeviation="6" /></filter>
      <filter id="blur18"><feGaussianBlur stdDeviation="18" /></filter>
      <filter id="blur40"><feGaussianBlur stdDeviation="40" /></filter>
    </defs>
  </svg>
);

// equirectangular world for wall displays
const eq = (lon: number, lat: number, x0: number, y0: number, w: number, h: number) => [x0 + ((lon + 180) / 360) * w, y0 + ((90 - lat) / 180) * h];
const ringPath = (rings: Ring[], f: (lon: number, lat: number) => number[]) =>
  rings.map((r) => r.map(([lo, la], i) => `${i ? 'L' : 'M'}${f(lo, la).map((v) => v.toFixed(1)).join(',')}`).join('') + 'Z').join('');

export const WallMap: React.FC<{ x: number; y: number; w: number; h: number; alarm: number; glow?: number }> = ({ x, y, w, h, alarm, glow = 1 }) => {
  const f = (lo: number, la: number) => eq(lo, la, x, y - h * 0.12, w, h * 1.45);
  return (
    <g>
      <rect x={x - 20} y={y - 20} width={w + 40} height={h + 40} fill="#0b0e0c" stroke="#33382f" strokeWidth="6" />
      <rect x={x} y={y} width={w} height={h} fill="#0d1a12" />
      <clipPath id="wallmapclip"><rect x={x} y={y} width={w} height={h} /></clipPath>
      <g clipPath="url(#wallmapclip)">
        {Array.from({ length: 13 }, (_, i) => <line key={`v${i}`} x1={x + (i * w) / 12} y1={y} x2={x + (i * w) / 12} y2={y + h} stroke={C.phosphorDim} strokeWidth="1.2" opacity="0.5" />)}
        {Array.from({ length: 7 }, (_, i) => <line key={`h${i}`} x1={x} y1={y + (i * h) / 6} x2={x + w} y2={y + (i * h) / 6} stroke={C.phosphorDim} strokeWidth="1.2" opacity="0.5" />)}
        <path d={ringPath(G.land, f)} fill="#173a20" stroke={C.phosphor} strokeWidth="1.6" opacity={0.75 * glow} />
        <path d={ringPath(G.ussr, f)} fill={alarm > 0 ? '#3a1410' : '#1d4a26'} stroke={alarm > 0 ? C.redGlow : C.phosphor} strokeWidth="2" opacity={glow} />
        <path d={ringPath(G.usa, f)} fill={`rgba(255,60,40,${0.55 * alarm})`} stroke={alarm > 0 ? C.redGlow : C.phosphor} strokeWidth="2.2" opacity={glow} filter={alarm > 0 ? 'url(#glow)' : undefined} />
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ the bunker (wide)
const VP = { x: 540, y: 760 };
export const BunkerWide: React.FC<{ alarm?: number; startSign?: number; mapAlarm?: number; officers?: boolean; turn?: number }> = ({ alarm = 0, startSign = 0, mapAlarm = 0, officers = true, turn = 0 }) => {
  const frame = useCurrentFrame();
  const flick = 0.85 + 0.15 * noise1(frame * 0.4, 2);
  const screen = alarm > 0.5 ? C.redGlow : C.phosphor;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id="bkWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c0e10" /><stop offset="0.45" stopColor="#1e2420" /><stop offset="1" stopColor="#0e100e" />
        </linearGradient>
        <linearGradient id="bkFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a1c18" /><stop offset="1" stopColor="#060605" />
        </linearGradient>
        <radialGradient id="lampCone" cx="0.5" cy="0" r="1">
          <stop offset="0" stopColor="#fff2d0" stopOpacity="0.55" /><stop offset="1" stopColor="#fff2d0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#bkWall)" />
      {/* ceiling beams converging */}
      {Array.from({ length: 9 }, (_, i) => {
        const x = -400 + i * 235;
        return <path key={i} d={`M${x},0 L${VP.x + (x - VP.x) * 0.18},${VP.y * 0.32} L${VP.x + (x - VP.x) * 0.18 + 14},${VP.y * 0.32} L${x + 70},0 Z`} fill="#0a0b0a" opacity="0.85" />;
      })}
      <path d={`M0,0 L${W},0 L${W},170 L0,170 Z`} fill="#070807" />
      {/* side walls with pipes */}
      <path d={`M0,170 L250,360 L250,1130 L0,1500 Z`} fill="#121512" />
      <path d={`M${W},170 L830,360 L830,1130 L${W},1500 Z`} fill="#101310" />
      {[0, 1, 2].map((i) => <path key={i} d={`M0,${300 + i * 60} L250,${430 + i * 30}`} stroke="#2a2f28" strokeWidth={14 - i * 3} />)}
      {[0, 1, 2].map((i) => <path key={i} d={`M${W},${300 + i * 60} L830,${430 + i * 30}`} stroke="#272b25" strokeWidth={14 - i * 3} />)}
      {/* the big wall display + launch sign */}
      <WallMap x={300} y={430} w={480} h={290} alarm={mapAlarm} glow={flick} />
      <g>
        <rect x="430" y="330" width="220" height="70" fill="#1a0c0a" stroke="#3a2a24" strokeWidth="4" />
        <text x="540" y="383" textAnchor="middle" fontFamily="Oswald" fontWeight={700} fontSize="52" letterSpacing="6"
          fill={startSign > 0 ? '#ff3b24' : '#3a1a14'} opacity={startSign > 0 ? 0.6 + 0.4 * startSign : 1} filter={startSign > 0 ? 'url(#glowBig)' : undefined}>СТАРТ</text>
      </g>
      {/* indicator lamp strip */}
      {Array.from({ length: 16 }, (_, i) => {
        const on = alarm > 0.5 ? (Math.floor(frame / 6 + i) % 3 === 0) : hash01(i + Math.floor(frame / 20), 4) > 0.6;
        return <circle key={i} cx={310 + i * 31} cy={760} r="7" fill={on ? (alarm > 0.5 ? '#ff4a32' : '#ffcf6a') : '#2a2a22'} filter={on ? 'url(#glow)' : undefined} />;
      })}
      {/* floor */}
      <path d={`M0,1500 L250,1130 L830,1130 L${W},1500 L${W},${H} L0,${H} Z`} fill="url(#bkFloor)" />
      {Array.from({ length: 9 }, (_, i) => {
        const x = -600 + i * 285;
        return <line key={i} x1={x} y1={H} x2={VP.x + (x - VP.x) * 0.25} y2={1130} stroke="#24261f" strokeWidth="3" />;
      })}
      {/* hanging lamps + light cones */}
      {[300, 540, 780].map((x, i) => (
        <g key={i} opacity={(1 - alarm * 0.7) * flick}>
          <path d={`M${x - 30},230 L${x + 30},230 L${x + 260},1200 L${x - 260},1200 Z`} fill="url(#lampCone)" opacity="0.35" />
          <rect x={x - 32} y={214} width="64" height="18" rx="6" fill="#d8cfae" filter="url(#glow)" />
          <line x1={x} y1={170} x2={x} y2={214} stroke="#111" strokeWidth="4" />
        </g>
      ))}
      {/* far console row */}
      <ConsoleRow y={1010} x0={290} x1={790} h={90} screen={screen} frame={frame} seed={1} />
      {/* near console row */}
      <ConsoleRow y={1200} x0={150} x1={930} h={140} screen={screen} frame={frame} seed={2} />
      {officers && (
        <>
          <Officer x={300} y={1120} s={0.5} turn={turn * 0.8} light={screen} seed={1} />
          <Officer x={500} y={1110} s={0.46} turn={turn * 0.6} light={screen} seed={2} />
          <Officer x={760} y={1118} s={0.5} turn={turn} light={screen} seed={3} />
          <Officer x={230} y={1350} s={0.75} turn={turn} light={screen} seed={4} />
          <Officer x={850} y={1345} s={0.78} turn={turn * 0.9} light={screen} seed={5} />
        </>
      )}
    </svg>
  );
};

export const ConsoleRow: React.FC<{ y: number; x0: number; x1: number; h: number; screen: string; frame: number; seed: number }> = ({ y, x0, x1, h, screen, frame, seed }) => {
  const n = Math.round((x1 - x0) / (h * 1.1));
  const w = (x1 - x0) / n;
  return (
    <g>
      <path d={`M${x0 - 20},${y + h} L${x0 + 10},${y} L${x1 - 10},${y} L${x1 + 20},${y + h} Z`} fill="#20251c" />
      <rect x={x0 - 30} y={y + h} width={x1 - x0 + 60} height={h * 0.9} fill="#14170f" />
      {Array.from({ length: n }, (_, i) => {
        const fl = 0.7 + 0.3 * noise1(frame * 0.3 + i * 7, seed);
        const sx = x0 + i * w + w * 0.15, sw = w * 0.7, sh = h * 0.55;
        return (
          <g key={i}>
            <rect x={sx} y={y + h * 0.15} width={sw} height={sh} rx={6} fill="#061008" stroke="#3a3f34" strokeWidth="3" />
            <rect x={sx + 4} y={y + h * 0.15 + 4} width={sw - 8} height={sh - 8} rx={4} fill={screen} opacity={0.32 * fl} filter="url(#glow)" />
            {Array.from({ length: 4 }, (_, k) => <line key={k} x1={sx + 10} x2={sx + 10 + (sw - 20) * hash01(i * 4 + k + Math.floor(frame / 15), seed)} y1={y + h * 0.25 + k * sh * 0.18} y2={y + h * 0.25 + k * sh * 0.18} stroke={screen} strokeWidth="2.5" opacity={0.8 * fl} />)}
          </g>
        );
      })}
    </g>
  );
};

/** Background duty officer, seen from behind; `turn` rotates the head toward camera (0..1). */
export const Officer: React.FC<{ x: number; y: number; s: number; turn?: number; light?: string; seed?: number }> = ({ x, y, s, turn = 0, light = C.phosphor, seed = 1 }) => {
  const hair = ['#1a1512', '#2a211a', '#141110', '#3a2e24', '#1e1814'][seed % 5];
  const hx = turn * 22;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d="M-150,40 C-140,-40 -90,-70 -60,-80 L60,-80 C90,-70 140,-40 150,40 L160,260 L-160,260 Z" fill="#2c3221" />
      <path d="M-150,40 C-140,-40 -90,-70 -60,-80 L60,-80 C90,-70 140,-40 150,40" stroke={light} strokeWidth="6" fill="none" opacity="0.35" />
      <rect x="-30" y="-120" width="60" height="50" fill="#9a6c52" />
      <g transform={`translate(${hx},0)`}>
        <ellipse cx="0" cy="-170" rx="62" ry="72" fill="#a8775a" />
        {turn > 0.2 && <path d={`M${20 + turn * 20},-180 l${10 * turn},20 l-8,6`} stroke="#5a3a28" strokeWidth="4" fill="none" />}
        <path d={`M-64,-160 C-70,-230 -30,-252 0,-252 C40,-252 70,-230 64,-160 C${40 + turn * 20},-${200 - turn * 10} ${-40 + turn * 30},-205 -64,-160 Z`} fill={hair} />
        <ellipse cx={-60 + turn * 10} cy="-168" rx="10" ry="20" fill="#8a5c44" />
        <path d="M-60,-220 C-40,-250 40,-250 60,-220" stroke={light} strokeWidth="5" fill="none" opacity="0.4" />
      </g>
    </g>
  );
};

/** Petrov full figure (same head + uniform as the bust) for wide shots. */
export const PetrovStanding: React.FC<PetrovProps & { walk?: number }> = ({ walk = 0, ...p }) => {
  const sw = Math.sin(walk) * 26;
  const dark = p.silhouette ? '#050505' : '#2b3120';
  const trou = p.silhouette ? '#050505' : '#262b1c';
  return (
    <svg viewBox="0 0 600 1600" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <path d={`M150,760 L450,760 L470,1000 L130,1000 Z`} fill={dark} />
      <path d="M140,980 L460,980 L455,1010 L145,1010 Z" fill={p.silhouette ? '#050505' : '#1a1d13'} />
      <path d={`M170,1000 L290,1000 L${280 + sw},1540 L${200 + sw},1540 Z`} fill={trou} />
      <path d={`M310,1000 L430,1000 L${400 - sw},1540 L${320 - sw},1540 Z`} fill={trou} />
      <path d={`M${190 + sw},1530 L${290 + sw},1530 L${300 + sw},1590 L${170 + sw},1590 Z`} fill="#0a0a0a" />
      <path d={`M${312 - sw},1530 L${410 - sw},1530 L${430 - sw},1590 L${300 - sw},1590 Z`} fill="#0a0a0a" />
      <path d="M60,700 L20,1080 L90,1090 L140,760 Z" fill={dark} />
      <path d="M540,700 L580,1080 L510,1090 L460,760 Z" fill={dark} />
      <ellipse cx="55" cy="1095" rx="34" ry="40" fill={p.silhouette ? '#050505' : '#a8775a'} />
      <ellipse cx="545" cy="1095" rx="34" ry="40" fill={p.silhouette ? '#050505' : '#9a6c52'} />
      <svg x="0" y="0" width="600" height="800" viewBox="0 0 600 800" style={{ overflow: 'visible' }}><Petrov {...p} /></svg>
    </svg>
  );
};

// ------------------------------------------------------------------ props
export const RedPhone: React.FC<{ glow?: number; lifted?: number }> = ({ glow = 0.5, lifted = 0 }) => (
  <svg viewBox="0 0 400 320" width="100%" height="100%" style={{ overflow: 'visible' }}>
    <defs>
      <linearGradient id="phoneBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d2382a" /><stop offset="0.6" stopColor="#8f1a14" /><stop offset="1" stopColor="#4a0c08" />
      </linearGradient>
    </defs>
    <ellipse cx="200" cy="300" rx="190" ry="22" fill="#000" opacity="0.5" filter="url(#blur6)" />
    <path d="M40,300 L80,150 L320,150 L360,300 Z" fill="url(#phoneBody)" />
    <path d="M80,150 L320,150 L300,128 L100,128 Z" fill="#b52a1f" />
    <circle cx="200" cy="230" r="44" fill="#6a120d" stroke="#e0b45a" strokeWidth="5" />
    <path d="M200,200 l8,18 20,2 -15,13 5,20 -18,-11 -18,11 5,-20 -15,-13 20,-2 Z" fill="#e0b45a" />
    <g transform={`translate(0,${-lifted * 120}) rotate(${lifted * -10} 200 110)`}>
      <path d="M40,120 C40,80 70,70 110,78 L290,78 C330,70 360,80 360,120 L330,128 C320,108 300,104 280,108 L120,108 C100,104 80,108 70,128 Z" fill="url(#phoneBody)" />
      <path d="M60,96 C90,84 300,84 340,96" stroke="#ff8a70" strokeWidth="5" fill="none" opacity={0.4 + glow * 0.4} />
    </g>
    <path d="M60,170 L340,170" stroke="#ff9a80" strokeWidth="3" opacity={glow * 0.6} />
  </svg>
);

export const WallClock: React.FC<{ minutes: number; size?: number }> = ({ minutes, size = 300 }) => {
  const h = ((minutes / 60) % 12) * 30, m = (minutes % 60) * 6;
  return (
    <svg viewBox="-160 -160 320 320" width={size} height={size} style={{ overflow: 'visible' }}>
      <circle r="150" fill="#1a1a17" />
      <circle r="138" fill="#e7e0cf" />
      <circle r="138" fill="none" stroke="#000" strokeWidth="6" opacity="0.25" />
      {Array.from({ length: 60 }, (_, i) => (
        <line key={i} x1="0" y1={-126} x2="0" y2={i % 5 ? -118 : -104} stroke="#1a1712" strokeWidth={i % 5 ? 2 : 6} transform={`rotate(${i * 6})`} />
      ))}
      <line x1="0" y1="14" x2="0" y2="-70" stroke="#14110d" strokeWidth="11" strokeLinecap="round" transform={`rotate(${h})`} />
      <line x1="0" y1="18" x2="0" y2="-108" stroke="#14110d" strokeWidth="7" strokeLinecap="round" transform={`rotate(${m})`} />
      <line x1="0" y1="24" x2="0" y2="-118" stroke="#b3261e" strokeWidth="3" transform={`rotate(${(minutes * 360) % 360})`} />
      <circle r="9" fill="#14110d" />
      <ellipse cx="-40" cy="-60" rx="70" ry="40" fill="#fff" opacity="0.12" transform="rotate(-30)" />
    </svg>
  );
};

/** Soviet tear-off desk calendar for Monday 26 September 1983. */
export const TearCalendar: React.FC<{ peel?: number }> = ({ peel = 0 }) => (
  <svg viewBox="0 0 520 680" width="100%" height="100%" style={{ overflow: 'visible' }}>
    <rect x="10" y="20" width="500" height="650" rx="8" fill="#000" opacity="0.4" filter="url(#blur18)" />
    <rect x="0" y="0" width="500" height="650" rx="6" fill="#3a2a20" />
    <rect x="20" y="60" width="460" height="570" fill="#e9dfc8" />
    {/* previous page tearing away */}
    {peel > 0 && peel < 1 && (
      <path d={`M20,60 L480,60 L480,${60 + 570 * (1 - peel)} Q${250},${60 + 570 * (1 - peel) + 80} 20,${60 + 570 * (1 - peel) + 30} Z`} fill="#ddd2b8" opacity={1 - peel * 0.3} transform={`translate(0,${-peel * 300}) rotate(${-peel * 25} 250 60)`} />
    )}
    <text x="250" y="130" textAnchor="middle" fontFamily="Oswald" fontWeight={700} fontSize="56" fill="#b3261e" letterSpacing="8">1983</text>
    <line x1="60" y1="152" x2="440" y2="152" stroke="#b3261e" strokeWidth="3" />
    <text x="250" y="210" textAnchor="middle" fontFamily="Oswald" fontWeight={700} fontSize="48" fill="#2a2018" letterSpacing="6">СЕНТЯБРЬ</text>
    <text x="250" y="470" textAnchor="middle" fontFamily="Oswald" fontWeight={700} fontSize="300" fill="#1c1712">26</text>
    <text x="250" y="560" textAnchor="middle" fontFamily="Oswald" fontWeight={700} fontSize="44" fill="#2a2018" letterSpacing="5">ПОНЕДЕЛЬНИК</text>
    {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={95 + i * 66} cy="32" r="9" fill="#120c08" />)}
  </svg>
);

// ------------------------------------------------------------------ corridor
export const Corridor: React.FC<{ warm: number; frame: number }> = ({ warm, frame }) => {
  const lamp = warm > 0.5 ? '#ffd59a' : '#ff5a3c';
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <radialGradient id="corrEnd" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={warm > 0.5 ? '#ffe2b0' : '#ff7a5a'} stopOpacity="0.9" /><stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="#0b0c0b" />
      <path d={`M0,0 L${W},0 L640,780 L440,780 Z`} fill="#121411" />
      <path d={`M0,${H} L${W},${H} L640,1060 L440,1060 Z`} fill="#161714" />
      <path d={`M0,0 L440,780 L440,1060 L0,${H} Z`} fill="#1a1d18" />
      <path d={`M${W},0 L640,780 L640,1060 L${W},${H} Z`} fill="#171a15" />
      <rect x="440" y="780" width="200" height="280" fill="url(#corrEnd)" />
      {Array.from({ length: 8 }, (_, i) => {
        const z = ((i + (frame * 0.012) % 1) / 8);
        const k = Math.pow(1 - z, 2.2);
        const y = 780 - k * 780, half = 100 + k * 440;
        return (
          <g key={i} opacity={0.4 + 0.6 * (1 - z)}>
            <rect x={540 - half * 0.35} y={y + 8} width={half * 0.7} height={6 + k * 22} fill={lamp} filter="url(#glow)" />
            <line x1={540 - half} y1={1060 + k * 860} x2={540 + half} y2={1060 + k * 860} stroke="#24261f" strokeWidth={2 + k * 4} />
          </g>
        );
      })}
      {[0, 1].map((side) => Array.from({ length: 3 }, (_, k) => (
        <path key={`${side}${k}`} d={side ? `M${W},${200 + k * 90} L640,${800 + k * 30}` : `M0,${200 + k * 90} L440,${800 + k * 30}`} stroke="#2a2d26" strokeWidth={12 - k * 3} />
      )))}
    </svg>
  );
};
