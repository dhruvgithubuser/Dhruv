import React from 'react';
import { useCurrentFrame } from 'remotion';
import { hash01, noise1 } from '../theme';

/* Cinematic 2D illustration kit (SVG). Shaded flat shapes, soft light, parallax-ready. All drawn inside a 1080x1920 <svg>. */

export const OD = '#5d6238', OD_HI = '#7c8250', OD_DK = '#3a3d22', INK = '#16150f', TRACK = '#2a2823', SKIN = '#d0a07c', SKIN_DK = '#a87a5a';

/** Shared gradients — include once per <svg>. */
export const ArtDefs: React.FC = () => (
  <defs>
    <linearGradient id="odBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={OD_HI} /><stop offset="0.55" stopColor={OD} /><stop offset="1" stopColor={OD_DK} /></linearGradient>
    <linearGradient id="odRubber" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9aa066" /><stop offset="0.35" stopColor={OD} /><stop offset="1" stopColor={OD_DK} /></linearGradient>
    <linearGradient id="trackG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#44413a" /><stop offset="1" stopColor="#1c1b17" /></linearGradient>
    <radialGradient id="wheelG"><stop offset="0" stopColor="#6d7148" /><stop offset="0.7" stopColor={OD} /><stop offset="1" stopColor={OD_DK} /></radialGradient>
    <linearGradient id="uniG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#80784f" /><stop offset="1" stopColor="#5d5638" /></linearGradient>
    <linearGradient id="helmG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6f7448" /><stop offset="1" stopColor="#3d4027" /></linearGradient>
    <linearGradient id="goldG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff0b0" /><stop offset="0.35" stopColor="#e2b44a" /><stop offset="0.7" stopColor="#a8761e" /><stop offset="1" stopColor="#f3d27a" /></linearGradient>
    <radialGradient id="shadowG"><stop offset="0" stopColor="rgba(0,0,0,0.45)" /><stop offset="1" stopColor="rgba(0,0,0,0)" /></radialGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6" /></filter>
    <filter id="soft2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22" /></filter>
  </defs>
);

/* ---------------------------------------------------------------- landscape */
export type Pal = { skyTop: string; skyBot: string; sun?: string; sunX?: number; sunY?: number; far: string; mid: string; near: string; ground: string; groundDk: string };
export const DUSK: Pal = { skyTop: '#3f4d6e', skyBot: '#f2b77a', sun: '#ffd79a', sunX: 300, sunY: 860, far: '#8c7f86', mid: '#5f5a4a', near: '#3c3d2a', ground: '#6b6a3f', groundDk: '#3d3c25' };
export const DAY: Pal = { skyTop: '#6f93b8', skyBot: '#e6e2cf', sun: '#fff6dc', sunX: 820, sunY: 420, far: '#a7b0a7', mid: '#7d8a62', near: '#566240', ground: '#82844f', groundDk: '#55562f' };
export const NIGHT: Pal = { skyTop: '#0b1020', skyBot: '#2a3550', sun: '#dfe8ff', sunX: 820, sunY: 360, far: '#2c3448', mid: '#1f2534', near: '#151a24', ground: '#1f2430', groundDk: '#121620' };

const ridge = (seed: number, y: number, amp: number, camX: number, depth: number) => {
  const pts: string[] = [];
  for (let x = -60; x <= 1140; x += 30) { const u = (x + camX * depth) / 240; pts.push(`${x},${(y + amp * noise1(u, seed) + amp * 0.4 * noise1(u * 3.1, seed + 7)).toFixed(1)}`); }
  return `M-60,1920 L${pts.join(' L')} L1140,1920 Z`;
};
const Trees: React.FC<{ seed: number; y: number; camX: number; depth: number; color: string; n: number; s: number }> = ({ seed, y, camX, depth, color, n, s }) => (
  <g fill={color}>
    {Array.from({ length: n }, (_, i) => {
      const x = ((hash01(i, seed) * 1500 - camX * depth) % 1500 + 1500) % 1500 - 200; const h = (70 + hash01(i, seed + 1) * 90) * s; const w = h * (0.35 + hash01(i, seed + 2) * 0.35);
      const ty = y + 18 * noise1((x + camX * depth) / 240, seed);
      return <g key={i}><rect x={x - 3 * s} y={ty - h * 0.35} width={6 * s} height={h * 0.4} /><ellipse cx={x} cy={ty - h * 0.6} rx={w} ry={h * 0.45} /></g>;
    })}
  </g>
);
/** Sky + sun + clouds + three ridges with trees + ground. `camX` pans (parallax). horizon = y of the near ground line. */
export const Landscape: React.FC<{ pal: Pal; camX?: number; horizon?: number; stars?: boolean; road?: boolean }> = ({ pal, camX = 0, horizon = 1000, stars, road }) => {
  const f = useCurrentFrame();
  return (
    <g>
      <defs>
        <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={pal.skyTop} /><stop offset="1" stopColor={pal.skyBot} /></linearGradient>
        <linearGradient id="groundG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={pal.ground} /><stop offset="1" stopColor={pal.groundDk} /></linearGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#skyG)" />
      {stars && Array.from({ length: 90 }, (_, i) => <circle key={i} cx={hash01(i, 4) * 1080} cy={hash01(i, 5) * 800} r={1 + hash01(i, 6) * 1.6} fill="#fff" opacity={0.3 + 0.5 * hash01(i, 7)} />)}
      {pal.sun && <><circle cx={pal.sunX} cy={pal.sunY} r={260} fill={pal.sun} opacity={0.35} filter="url(#soft2)" /><circle cx={pal.sunX} cy={pal.sunY} r={70} fill={pal.sun} opacity={0.95} /></>}
      {[0, 1, 2, 3].map((i) => <ellipse key={i} cx={((hash01(i, 9) * 1400 + f * (0.3 + i * 0.1) - camX * 0.05) % 1500) - 200} cy={200 + i * 120} rx={220 + i * 40} ry={36} fill="#ffffff" opacity={0.12} filter="url(#soft)" />)}
      <path d={ridge(3, horizon - 170, 60, camX, 0.15)} fill={pal.far} />
      <Trees seed={11} y={horizon - 160} camX={camX} depth={0.15} color={pal.far} n={18} s={0.6} />
      <path d={ridge(5, horizon - 80, 45, camX, 0.35)} fill={pal.mid} />
      <Trees seed={21} y={horizon - 75} camX={camX} depth={0.35} color={pal.mid} n={14} s={0.9} />
      <path d={ridge(8, horizon, 22, camX, 0.7)} fill={pal.near} />
      <rect x={-60} y={horizon + 18} width={1200} height={1920} fill="url(#groundG)" />
      {Array.from({ length: 14 }, (_, i) => <path key={i} d={`M${540 + (i - 7) * 30 - camX * 0.7},${horizon + 20} L${540 + (i - 7) * 260 - camX * 1.4},1920`} stroke="rgba(0,0,0,0.08)" strokeWidth={4} />)}
      {road && <path d={`M${520 - camX * 0.7},${horizon + 20} L${590 - camX * 0.7},${horizon + 20} L${1100 - camX * 1.3},1920 L${-80 - camX * 1.3},1920 Z`} fill="#9a8a68" opacity={0.75} />}
    </g>
  );
};

/* ---------------------------------------------------------------- vehicles (side views, facing right, (0,0) = ground centre) */
export const Sherman: React.FC<{ x: number; y: number; s?: number; rubber?: boolean; wob?: number; roll?: number; lift?: number }> = ({ x, y, s = 1, rubber, wob = 0, roll = 0, lift = 0 }) => {
  const f = useCurrentFrame();
  const w = wob * Math.sin(f * 0.55) * 0.045;
  const body = rubber ? 'url(#odRubber)' : 'url(#odBody)';
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx={0} cy={4} rx={300 * s} ry={26 * s} fill="url(#shadowG)" />
      <g transform={`translate(0,${-lift * s}) scale(${s * (1 + w)},${s * (1 - w)})`}>
        {/* tracks */}
        <rect x={-270} y={-120} width={540} height={110} rx={55} fill="url(#trackG)" stroke={INK} strokeWidth={5} />
        {Array.from({ length: 27 }, (_, i) => <rect key={i} x={-250 + i * 19} y={-124} width={8} height={8} fill="#55524a" />)}
        {[-190, -125, -60, 5, 70, 135, 200].map((cx, i) => (
          <g key={i} transform={`translate(${cx},-58) rotate(${roll * 60})`}>
            <circle r={36} fill="url(#wheelG)" stroke={INK} strokeWidth={4} /><circle r={12} fill={OD_DK} />
            {[0, 1, 2, 3, 4, 5].map((k) => <rect key={k} x={-2.5} y={-30} width={5} height={14} fill={OD_DK} transform={`rotate(${k * 60})`} />)}
          </g>
        ))}
        {/* hull */}
        <path d="M-282,-118 L-282,-205 L-230,-230 L150,-230 L262,-170 L290,-120 Z" fill={body} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M-282,-200 L262,-170" stroke="rgba(255,255,255,0.12)" strokeWidth={6} />
        <rect x={-282} y={-132} width={572} height={14} fill={OD_DK} stroke={INK} strokeWidth={3} />
        {/* turret + gun */}
        <path d="M-130,-230 C-130,-310 -80,-332 10,-332 C90,-332 125,-300 130,-230 Z" fill={body} stroke={INK} strokeWidth={6} />
        <rect x={115} y={-300} width={46} height={42} rx={8} fill={OD} stroke={INK} strokeWidth={5} />
        <rect x={155} y={-290} width={250} height={22} rx={8} fill={body} stroke={INK} strokeWidth={5} />
        <rect x={395} y={-294} width={18} height={30} rx={4} fill={OD_DK} stroke={INK} strokeWidth={4} />
        <path d="M-60,-332 L-60,-352 L10,-352 L10,-332" fill={OD_DK} stroke={INK} strokeWidth={5} />
        <rect x={-100} y={-262} width={10} height={24} fill={INK} opacity={0.5} />
        {/* star */}
        <circle cx={-70} cy={-178} r={34} fill="none" stroke="#efe9d6" strokeWidth={6} />
        <polygon points="-70,-208 -62,-186 -40,-186 -58,-172 -51,-150 -70,-163 -89,-150 -82,-172 -100,-186 -78,-186" fill="#efe9d6" />
        {rubber && <>
          <path d="M-220,-222 C-120,-232 40,-232 140,-224" stroke="rgba(255,255,255,0.45)" strokeWidth={10} fill="none" strokeLinecap="round" />
          <path d="M-100,-322 C-60,-330 20,-332 60,-326" stroke="rgba(255,255,255,0.45)" strokeWidth={8} fill="none" strokeLinecap="round" />
          <circle cx={240} cy={-150} r={9} fill="#d9c27a" stroke={INK} strokeWidth={3} />
        </>}
      </g>
    </g>
  );
};

export const Truck: React.FC<{ x: number; y: number; s?: number; squash?: number; roll?: number; night?: boolean }> = ({ x, y, s = 1, squash = 0, roll = 0, night }) => (
  <g transform={`translate(${x},${y}) scale(${s},${s * (1 - 0.85 * squash)})`}>
    <ellipse cx={0} cy={4} rx={290} ry={22} fill="url(#shadowG)" />
    <path d="M-280,-110 L-280,-300 C-280,-320 -260,-330 -230,-330 L60,-330 L60,-110 Z" fill="#6b6b47" stroke={INK} strokeWidth={6} />
    {[-220, -150, -80, -10].map((xx) => <path key={xx} d={`M${xx},-330 L${xx},-110`} stroke="rgba(0,0,0,0.15)" strokeWidth={4} />)}
    <path d="M60,-110 L60,-250 L170,-250 L230,-180 L280,-170 L280,-110 Z" fill="url(#odBody)" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M80,-235 L160,-235 L205,-185 L80,-185 Z" fill={night ? '#ffcf7a' : '#9fb5c4'} stroke={INK} strokeWidth={4} />
    <rect x={-290} y={-125} width={580} height={22} fill={OD_DK} stroke={INK} strokeWidth={4} />
    {[-200, -110, 190].map((cx) => <g key={cx} transform={`translate(${cx},-55) rotate(${roll * 60})`}><circle r={52} fill="#22211c" stroke={INK} strokeWidth={4} /><circle r={22} fill={OD} /><rect x={-3} y={-20} width={6} height={40} fill={OD_DK} /></g>)}
    <polygon points="-160,-250 -150,-224 -122,-224 -145,-208 -136,-182 -160,-198 -184,-182 -175,-208 -198,-224 -170,-224" fill="#efe9d6" />
  </g>
);

export const Halftrack: React.FC<{ x: number; y: number; s?: number; blast?: number }> = ({ x, y, s = 1, blast = 0 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse cx={0} cy={4} rx={280} ry={22} fill="url(#shadowG)" />
    <rect x={-270} y={-100} width={300} height={95} rx={46} fill="url(#trackG)" stroke={INK} strokeWidth={5} />
    {[-220, -160, -100, -40].map((cx) => <circle key={cx} cx={cx} cy={-52} r={30} fill="url(#wheelG)" stroke={INK} strokeWidth={4} />)}
    <circle cx={190} cy={-50} r={50} fill="#22211c" stroke={INK} strokeWidth={4} /><circle cx={190} cy={-50} r={20} fill={OD} />
    <path d="M-280,-100 L-280,-230 L80,-230 L120,-180 L250,-170 L270,-100 Z" fill="url(#odBody)" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M90,-225 L120,-182" stroke={INK} strokeWidth={5} />
    {/* loudspeaker */}
    <rect x={-170} y={-300} width={80} height={70} fill="#2d2c27" stroke={INK} strokeWidth={5} />
    <path d="M-90,-300 L20,-360 L20,-170 L-90,-230 Z" fill="#3a3933" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <ellipse cx={20} cy={-265} rx={16} ry={95} fill="#1d1c18" stroke={INK} strokeWidth={5} />
    {blast > 0 && <ellipse cx={20} cy={-265} rx={16} ry={95} fill="#ffd84a" opacity={0.25 * blast} />}
  </g>
);

export const Bulldozer: React.FC<{ x: number; y: number; s?: number; rot?: number }> = ({ x, y, s = 1, rot = 0 }) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-60} y={-80} width={120} height={160} rx={14} fill="#2a2823" stroke={INK} strokeWidth={4} />
    <rect x={-46} y={-60} width={92} height={110} fill="#8a7d3c" stroke={INK} strokeWidth={4} />
    <rect x={-30} y={-36} width={60} height={50} fill="#6b6030" stroke={INK} strokeWidth={3} />
    <rect x={-78} y={86} width={156} height={20} rx={4} fill="#3a3832" stroke={INK} strokeWidth={4} />
  </g>
);

/* ---------------------------------------------------------------- top-down (aerial) */
export const TankTop: React.FC<{ x: number; y: number; s?: number; rot?: number; inflate?: number; rubber?: boolean }> = ({ x, y, s = 1, rot = 0, inflate = 1, rubber }) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <ellipse cx={14} cy={14} rx={70} ry={120} fill="rgba(0,0,0,0.28)" opacity={inflate} filter="url(#soft)" />
    <g transform={`scale(${0.9 + 0.1 * inflate},${0.9 + 0.1 * inflate})`} opacity={0.5 + 0.5 * inflate}>
      <rect x={-62} y={-110} width={26} height={220} rx={10} fill={TRACK} />
      <rect x={36} y={-110} width={26} height={220} rx={10} fill={TRACK} />
      <rect x={-42} y={-104} width={84} height={208} rx={14} fill={inflate < 0.5 ? '#4e5233' : rubber ? 'url(#odRubber)' : 'url(#odBody)'} stroke={INK} strokeWidth={4} />
      {inflate > 0.3 && <><circle cx={0} cy={6} r={36 * inflate} fill={OD} stroke={INK} strokeWidth={4} /><rect x={-6} y={-130 * inflate} width={12} height={110 * inflate} rx={4} fill={OD_DK} stroke={INK} strokeWidth={3} />
        <polygon points="0,52 6,66 21,66 9,75 13,90 0,81 -13,90 -9,75 -21,66 -6,66" fill="#efe9d6" /></>}
    </g>
  </g>
);
export const TruckTop: React.FC<{ x: number; y: number; s?: number; rot?: number; inflate?: number }> = ({ x, y, s = 1, rot = 0, inflate = 1 }) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={0.5 + 0.5 * inflate}>
    <ellipse cx={14} cy={14} rx={56} ry={130} fill="rgba(0,0,0,0.28)" opacity={inflate} filter="url(#soft)" />
    <rect x={-46} y={-120} width={92} height={170} rx={10} fill={inflate < 0.5 ? '#4e5233' : '#6b6b47'} stroke={INK} strokeWidth={4} />
    <rect x={-40} y={56} width={80} height={70} rx={10} fill={OD} stroke={INK} strokeWidth={4} />
  </g>
);
export const GunTop: React.FC<{ x: number; y: number; s?: number; rot?: number; inflate?: number }> = ({ x, y, s = 1, rot = 0, inflate = 1 }) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={0.5 + 0.5 * inflate}>
    <path d="M-50,60 L0,-10 L50,60" stroke={OD_DK} strokeWidth={14} fill="none" strokeLinecap="round" />
    <rect x={-34} y={-30} width={68} height={50} rx={8} fill={OD} stroke={INK} strokeWidth={4} />
    <rect x={-7} y={-150 * inflate} width={14} height={130 * inflate} rx={5} fill={OD_DK} stroke={INK} strokeWidth={3} />
    {[-44, 44].map((cx) => <rect key={cx} x={cx - 8} y={-20} width={16} height={44} rx={6} fill={TRACK} />)}
  </g>
);
export const PlaneTop: React.FC<{ x: number; y: number; s?: number; rot?: number; o?: number }> = ({ x, y, s = 1, rot = 0, o = 1 }) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={o}>
    <g fill="#5d655a" stroke={INK} strokeWidth={4} strokeLinejoin="round">
      <path d="M-260,-10 L260,-10 L250,22 L-250,22 Z" />
      {[-70, 70].map((bx) => <path key={bx} d={`M${bx - 14},-60 L${bx + 14},-60 L${bx + 10},170 L${bx - 10},170 Z`} />)}
      <path d="M-90,160 L90,160 L84,184 L-84,184 Z" />
      <ellipse cx={0} cy={0} rx={26} ry={70} />
    </g>
    <circle cx={-140} cy={5} r={18} fill="#fff" stroke={INK} strokeWidth={3} /><path d="M-150,5 L-130,5 M-140,-5 L-140,15" stroke={INK} strokeWidth={6} />
    <circle cx={140} cy={5} r={18} fill="#fff" stroke={INK} strokeWidth={3} /><path d="M130,5 L150,5 M140,-5 L140,15" stroke={INK} strokeWidth={6} />
  </g>
);

/* ---------------------------------------------------------------- people */
/** GI (3/4 view facing right). pose: stand | walk | lift | sit | salute. */
export const GI: React.FC<{ x: number; y: number; s?: number; pose?: 'stand' | 'walk' | 'lift' | 'sit' | 'overhead'; phase?: number; flip?: boolean; ghost?: boolean; patch?: boolean; dark?: number }> = ({ x, y, s = 1, pose = 'stand', phase = 0, flip, ghost, patch, dark = 0 }) => {
  const f = useCurrentFrame();
  const sw = pose === 'walk' ? Math.sin(f * 0.3 + phase) * 16 : 0;
  const sit = pose === 'sit';
  const uni = ghost ? 'rgba(220,235,255,0.25)' : 'url(#uniG)', st = ghost ? 'rgba(220,235,255,0.6)' : INK;
  const lift = pose === 'lift';
  return (
    <g transform={`translate(${x},${y}) scale(${(flip ? -1 : 1) * s},${s})`} style={{ filter: dark ? `brightness(${1 - dark})` : undefined }} strokeDasharray={ghost ? '8 6' : undefined}>
      {!ghost && <ellipse cx={0} cy={4} rx={48} ry={9} fill="url(#shadowG)" />}
      {/* legs */}
      {sit ? <path d="M-14,-96 L44,-96 L46,-4 M10,-96 L66,-96 L68,-4" stroke={ghost ? st : '#4e4a30'} strokeWidth={22} strokeLinecap="round" fill="none" />
        : <path d={`M-6,-110 L${-10 - sw},-8 M10,-110 L${14 + sw},-8`} stroke={ghost ? st : '#4e4a30'} strokeWidth={22} strokeLinecap="round" />}
      {!ghost && !sit && <path d={`M${-24 - sw},-4 L${4 - sw},-4 M${2 + sw},-4 L${30 + sw},-4`} stroke="#2a2118" strokeWidth={14} strokeLinecap="round" />}
      {/* torso */}
      <path d={`M-30,${sit ? -100 : -110} L-34,${sit ? -190 : -200} C-34,${sit ? -214 : -224} 34,${sit ? -214 : -224} 34,${sit ? -190 : -200} L30,${sit ? -100 : -110} Z`} fill={uni} stroke={st} strokeWidth={5} />
      <rect x={-31} y={sit ? -112 : -122} width={62} height={10} fill={ghost ? 'none' : '#4a4128'} />
      {patch && <circle cx={-26} cy={sit ? -184 : -194} r={9} fill="#c8352b" stroke={INK} strokeWidth={2} />}
      {/* arms */}
      {pose === 'overhead' ? <path d="M-24,-200 L-34,-300 M24,-200 L34,-300" stroke={ghost ? st : '#6d6643'} strokeWidth={17} strokeLinecap="round" />
        : lift ? <path d="M-24,-200 L20,-262 M24,-200 L52,-256" stroke={ghost ? st : '#6d6643'} strokeWidth={17} strokeLinecap="round" />
        : <path d={`M-26,${sit ? -186 : -196} L${-32 + sw * 0.6},${sit ? -130 : -130} M26,${sit ? -186 : -196} L${30 - sw * 0.6},${sit ? -120 : -128}`} stroke={ghost ? st : '#6d6643'} strokeWidth={17} strokeLinecap="round" />}
      {!ghost && <>{pose === 'overhead' ? <><circle cx={-34} cy={-304} r={10} fill={SKIN} /><circle cx={34} cy={-304} r={10} fill={SKIN} /></> : lift ? <><circle cx={22} cy={-266} r={10} fill={SKIN} /><circle cx={54} cy={-260} r={10} fill={SKIN} /></> : null}</>}
      {/* head */}
      <circle cx={4} cy={sit ? -232 : -242} r={22} fill={ghost ? 'none' : SKIN} stroke={st} strokeWidth={4} />
      {!ghost && <path d={`M18,${sit ? -236 : -246} l8,8 l-8,2`} fill={SKIN_DK} />}
      <path d={`M-28,${sit ? -236 : -246} C-28,${sit ? -276 : -286} 36,${sit ? -276 : -286} 36,${sit ? -236 : -246} L42,${sit ? -232 : -242} L-34,${sit ? -232 : -242} Z`} fill={ghost ? 'none' : 'url(#helmG)'} stroke={st} strokeWidth={4} />
    </g>
  );
};

export const Cyclist: React.FC<{ x: number; y: number; s?: number; coat?: string; ped?: number }> = ({ x, y, s = 1, coat = '#33507a', ped = 0 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse cx={0} cy={4} rx={90} ry={10} fill="url(#shadowG)" />
    {[-62, 62].map((cx) => <g key={cx} transform={`translate(${cx},-44) rotate(${ped * 57})`}><circle r={44} fill="none" stroke="#1c1b17" strokeWidth={7} />{[0, 1, 2, 3].map((k) => <rect key={k} x={-1} y={-42} width={2} height={84} fill="#555" transform={`rotate(${k * 45})`} />)}</g>)}
    <path d="M-62,-44 L-12,-44 L24,-104 L-36,-104 Z M24,-104 L62,-44 M-36,-104 L-44,-122 M24,-104 L30,-128 L52,-128" fill="none" stroke="#2a2a2a" strokeWidth={7} strokeLinejoin="round" />
    <path d={`M-30,-120 L${-12 + 14 * Math.sin(ped)},-70 L${-10 + 16 * Math.sin(ped)},-44`} stroke="#3e3428" strokeWidth={15} strokeLinecap="round" fill="none" />
    <path d="M-34,-124 L-6,-186" stroke={coat} strokeWidth={34} strokeLinecap="round" />
    <path d="M-6,-176 L32,-130" stroke={coat} strokeWidth={13} strokeLinecap="round" />
    <circle cx={2} cy={-212} r={20} fill={SKIN} stroke={INK} strokeWidth={3} />
    <ellipse cx={-2} cy={-228} rx={24} ry={8} fill="#1d1b19" />
  </g>
);

/** Trench-coat & fedora silhouette (the spy). */
export const Spy: React.FC<{ x: number; y: number; s?: number; sit?: boolean; paper?: boolean }> = ({ x, y, s = 1, sit, paper }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse cx={0} cy={4} rx={48} ry={9} fill="url(#shadowG)" />
    {sit ? <path d="M-10,-96 L-60,-96 L-62,-4 M10,-96 L-40,-96 L-42,-4" stroke="#2a2826" strokeWidth={22} strokeLinecap="round" fill="none" /> : <path d="M-8,-110 L-12,-8 M10,-110 L14,-8" stroke="#2a2826" strokeWidth={22} strokeLinecap="round" />}
    <path d={`M-38,${sit ? -90 : -60} L-36,${sit ? -200 : -210} C-36,${sit ? -226 : -236} 36,${sit ? -226 : -236} 36,${sit ? -200 : -210} L40,${sit ? -90 : -60} Z`} fill="#4a4540" stroke={INK} strokeWidth={5} />
    <path d={`M0,${sit ? -220 : -230} L-14,${sit ? -150 : -160} L0,${sit ? -100 : -110}`} stroke="#2a2826" strokeWidth={5} fill="none" />
    <circle cx={-2} cy={sit ? -244 : -254} r={21} fill={SKIN_DK} stroke={INK} strokeWidth={3} />
    <rect x={-30} y={sit ? -276 : -286} width={56} height={22} rx={6} fill="#1e1c1a" /><ellipse cx={-2} cy={sit ? -256 : -266} rx={44} ry={9} fill="#1e1c1a" />
    {paper && <rect x={-90} y={sit ? -230 : -240} width={70} height={90} fill="#e8e2d0" stroke={INK} strokeWidth={3} transform="rotate(-8)" />}
  </g>
);

/* ---------------------------------------------------------------- misc */
export const Mast: React.FC<{ x: number; y: number; h?: number; on?: number }> = ({ x, y, h = 620, on = 0 }) => {
  const f = useCurrentFrame();
  return (
    <g transform={`translate(${x},${y})`}>
      <path d={`M-40,0 L0,${-h} L40,0`} stroke="#3a3a3a" strokeWidth={8} fill="none" />
      {Array.from({ length: Math.floor(h / 70) }, (_, i) => <path key={i} d={`M${-36 + i * 2.5},${-i * 70 - 30} L${36 - i * 2.5},${-i * 70 - 30}`} stroke="#4a4a4a" strokeWidth={5} />)}
      <circle cx={0} cy={-h - 10} r={12} fill="#ff4a3a" opacity={0.6 + 0.4 * Math.sin(f * 0.4)} />
      {on > 0 && [0, 1, 2, 3].map((i) => { const p = ((f / 30) + i / 4) % 1; return <circle key={i} cx={0} cy={-h - 10} r={30 + p * 360} fill="none" stroke="#ff7a5a" strokeWidth={6 * (1 - p) + 1} opacity={(1 - p) * on} />; })}
    </g>
  );
};
export const Medal: React.FC<{ x: number; y: number; s?: number; shine?: number }> = ({ x, y, s = 1, shine = 0 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <defs><clipPath id="medalClip"><circle r={190} /></clipPath></defs>
    <path d="M-90,-560 L-40,-180 L40,-180 L90,-560 Z" fill="#b22234" />
    <path d="M-50,-560 L-18,-180 L18,-180 L50,-560 Z" fill="#fff" /><path d="M-20,-560 L-6,-180 L6,-180 L20,-560 Z" fill="#3c3b6e" />
    <circle cx={0} cy={-190} r={26} fill="none" stroke="url(#goldG)" strokeWidth={12} />
    <circle r={200} fill="url(#goldG)" stroke="#7a5512" strokeWidth={6} />
    <circle r={168} fill="none" stroke="#a8761e" strokeWidth={8} />
    <polygon points="0,-120 28,-38 116,-38 46,14 72,98 0,48 -72,98 -46,14 -116,-38 -28,-38" fill="url(#goldG)" stroke="#8a6416" strokeWidth={6} />
    <g clipPath="url(#medalClip)"><rect x={-400 + shine * 800} y={-260} width={70} height={520} fill="rgba(255,255,255,0.55)" transform="rotate(20)" /></g>
  </g>
);
