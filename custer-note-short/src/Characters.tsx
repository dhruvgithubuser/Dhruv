import React from 'react';
import { staticFile } from 'remotion';

/*
 * Paper-cutout character kit (Vox style), drawn in code so every appearance is identical.
 * Coordinates: feet / hooves on y = 0, x = 0 centre; scale with `s`. Wrap uses in <svg> with <CutoutDefs/>.
 * Motion is a pure function of the numbers passed in (walk / gallop phase, arm angles, nod), so scenes drive it per frame.
 */
const INK = '#1a140e';
export const COAT = { buckskin: '#b88a55', blue: '#2b3a5c', blueTrim: '#c9a13b', grey: '#6d6a60', skin: '#d8b393', boot: '#2a1d12', trouser: '#3a4766' };

export const CutoutDefs: React.FC = () => (
  <defs>
    <filter id="cutout" x="-30%" y="-30%" width="160%" height="160%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="5" result="fat" />
      <feFlood floodColor="#f6eedb" result="white" />
      <feComposite in="white" in2="fat" operator="in" result="edge" />
      <feGaussianBlur in="fat" stdDeviation="8" result="blur" />
      <feOffset in="blur" dx="6" dy="12" result="off" />
      <feFlood floodColor="rgba(20,12,4,0.5)" />
      <feComposite in2="off" operator="in" result="shadow" />
      <feMerge><feMergeNode in="shadow" /><feMergeNode in="edge" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>
);

type Hat = 'slouch' | 'kepi' | 'none';
const DrawnHead: React.FC<{ hat: Hat; skin?: string }> = ({ hat, skin = COAT.skin }) => (
  <g>
    <circle cx={0} cy={-40} r={36} fill={skin} stroke={INK} strokeWidth={3} />
    <path d="M-14,-30 q14,10 28,0" stroke={INK} strokeWidth={3} fill="none" />
    <circle cx={-12} cy={-46} r={3.5} fill={INK} /><circle cx={12} cy={-46} r={3.5} fill={INK} />
    {hat === 'slouch' && <path d="M-62,-60 Q0,-74 62,-60 L40,-66 Q36,-104 0,-106 Q-36,-104 -40,-66 Z" fill="#2d2418" stroke={INK} strokeWidth={3} />}
    {hat === 'kepi' && <path d="M-32,-62 L-28,-96 L30,-90 L32,-62 Z M-34,-62 L10,-62 L-6,-52 Z" fill={COAT.blue} stroke={INK} strokeWidth={3} />}
  </g>
);

/** A standing / walking person. Angles in degrees: 0 = arm hanging down, 90 = arm straight forward (toward +x). */
export const Person: React.FC<{
  x: number; y: number; s?: number; coat?: keyof typeof COAT | string; head?: string; hat?: Hat; armL?: number; armR?: number;
  walk?: number; nod?: number; flip?: boolean; breathe?: number; prop?: 'paper' | 'pen' | 'trumpet' | 'none';
}> = ({ x, y, s = 1, coat = 'blue', head, hat = 'none', armL = 8, armR = 8, walk = 0, nod = 0, flip, breathe = 0, prop = 'none' }) => {
  const col = (COAT as Record<string, string>)[coat] ?? coat;
  const sw = Math.sin(walk * Math.PI * 2) * (walk ? 24 : 0);
  const b = 1 + 0.012 * Math.sin(breathe);
  const leg = (a: number, dx: number) => (
    <g transform={`rotate(${a} ${dx} -170)`}>
      <rect x={dx - 13} y={-170} width={26} height={150} rx={10} fill={coat === 'buckskin' ? COAT.trouser : COAT.trouser} stroke={INK} strokeWidth={3} />
      <rect x={dx - 15} y={-36} width={34} height={36} rx={6} fill={COAT.boot} stroke={INK} strokeWidth={3} />
    </g>
  );
  const arm = (a: number, dx: number, hand?: React.ReactNode) => (
    <g transform={`rotate(${dx > 0 ? -a : a} ${dx} -292)`}>
      <rect x={dx - 12} y={-296} width={24} height={128} rx={11} fill={col} stroke={INK} strokeWidth={3} />
      <circle cx={dx} cy={-166} r={13} fill={COAT.skin} stroke={INK} strokeWidth={3} />
      {hand}
    </g>
  );
  return (
    <g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`} filter="url(#cutout)">
      {leg(-sw, -18)}{leg(sw, 18)}
      {arm(armL, -50)}
      <g transform={`scale(1,${b})`} style={{ transformOrigin: '0px -170px' }}>
        <path d="M-54,-300 Q0,-318 54,-300 L48,-160 L-48,-160 Z" fill={col} stroke={INK} strokeWidth={3} />
        {coat === 'buckskin' && Array.from({ length: 9 }, (_, i) => <line key={i} x1={-44 + i * 11} y1={-168} x2={-46 + i * 11} y2={-150} stroke="#7a5630" strokeWidth={3} />)}
        {coat === 'blue' && <><line x1={0} y1={-300} x2={0} y2={-162} stroke={COAT.blueTrim} strokeWidth={3} strokeDasharray="2 14" /><rect x={-50} y={-176} width={100} height={10} fill="#3a2a1a" /></>}
        <rect x={-14} y={-318} width={28} height={22} fill={COAT.skin} stroke={INK} strokeWidth={3} />
      </g>
      {arm(armR, 50, prop === 'paper' ? <rect x={36} y={-178} width={46} height={58} fill="#f2ead6" stroke={INK} strokeWidth={2} transform="rotate(-8 50 -160)" />
        : prop === 'pen' ? <line x1={50} y1={-170} x2={70} y2={-196} stroke={INK} strokeWidth={5} />
        : prop === 'trumpet' ? <path d="M44,-168 l40,-6 l14,-12 l0,30 l-14,-10 l-40,6 z" fill="#c9a13b" stroke={INK} strokeWidth={2} /> : null)}
      <g transform={`translate(0,-310) rotate(${nod})`}>
        {head ? <image href={staticFile(head)} x={-74} y={-148} width={148} height={148} preserveAspectRatio="xMidYMid meet" /> : <DrawnHead hat={hat} />}
      </g>
    </g>
  );
};

/** A horse, optionally ridden, galloping or walking. phase advances ~0.06 per frame at a gallop. */
export const Horse: React.FC<{ x: number; y: number; s?: number; phase: number; coat?: string; rider?: 'trooper' | 'warrior' | 'none'; flip?: boolean; packs?: boolean; mule?: boolean }> = ({
  x, y, s = 1, phase, coat = '#6b4a2e', rider = 'none', flip, packs, mule,
}) => {
  const p = phase * Math.PI * 2;
  const bob = 8 * Math.sin(p * 2);
  const leg = (hx: number, off: number, front: boolean) => {
    const a = (front ? 34 : 30) * Math.sin(p + off);
    return (
      <g transform={`rotate(${a} ${hx} -120)`}>
        <rect x={hx - 9} y={-122} width={18} height={66} rx={8} fill={coat} stroke={INK} strokeWidth={3} />
        <g transform={`rotate(${front ? Math.max(0, -a) * 1.2 : Math.min(0, -a) * 1.2} ${hx} -60)`}>
          <rect x={hx - 7} y={-62} width={14} height={58} rx={6} fill={coat} stroke={INK} strokeWidth={3} />
          <rect x={hx - 9} y={-8} width={18} height={10} rx={2} fill={INK} />
        </g>
      </g>
    );
  };
  const ear = mule ? 'M58,-246 l-6,-40 l16,32 z M70,-244 l4,-42 l8,38 z' : 'M62,-246 l-2,-20 l10,16 z';
  return (
    <g transform={`translate(${x},${y + bob}) scale(${flip ? -s : s},${s})`} filter="url(#cutout)">
      {leg(-78, 0.4, false)}{leg(70, 3.6, true)}
      <path d={`M-118,-190 Q-150,-${178 - 12 * Math.sin(p)} -160,-${130 - 20 * Math.sin(p)} Q-140,-170 -116,-168 Z`} fill={INK} />
      <ellipse cx={-10} cy={-160} rx={118} ry={48} fill={coat} stroke={INK} strokeWidth={3} />
      <path d="M70,-190 L118,-262 Q140,-272 150,-252 L132,-222 Q112,-208 98,-160 Z" fill={coat} stroke={INK} strokeWidth={3} />
      <path d={ear} fill={coat} stroke={INK} strokeWidth={2} transform="translate(56,-2)" />
      <circle cx={124} cy={-250} r={4} fill={INK} />
      {!mule && <path d="M74,-196 Q92,-252 118,-262" stroke={INK} strokeWidth={10} fill="none" />}
      {leg(-60, 3.2, false)}{leg(86, 0.2, true)}
      {packs && <g><rect x={-80} y={-232} width={70} height={52} rx={4} fill="#8a5f30" stroke={INK} strokeWidth={3} /><rect x={-4} y={-232} width={70} height={52} rx={4} fill="#8a5f30" stroke={INK} strokeWidth={3} />
        <text x={-45} y={-200} textAnchor="middle" fontFamily="Courier Prime" fontWeight={700} fontSize={16} fill="#f2ead6">AMMO</text><text x={31} y={-200} textAnchor="middle" fontFamily="Courier Prime" fontWeight={700} fontSize={16} fill="#f2ead6">AMMO</text></g>}
      {rider === 'trooper' && (
        <g transform={`translate(-34,-196) rotate(${12 + 4 * Math.sin(p * 2)})`}>
          <rect x={-14} y={-20} width={28} height={70} rx={10} fill={COAT.trouser} stroke={INK} strokeWidth={3} transform="rotate(-40 0 0)" />
          <path d="M-30,-120 L30,-120 L26,-6 L-26,-6 Z" fill={COAT.blue} stroke={INK} strokeWidth={3} />
          <rect x={18} y={-112} width={22} height={86} rx={10} fill={COAT.blue} stroke={INK} strokeWidth={3} transform="rotate(-60 28 -110)" />
          <g transform="translate(0,-122) scale(0.8)"><DrawnHead hat="slouch" /></g>
        </g>
      )}
      {rider === 'warrior' && (
        <g transform={`translate(-6,-196) rotate(${10 + 4 * Math.sin(p * 2)})`}>
          <rect x={-14} y={-20} width={28} height={70} rx={10} fill="#7a5a3a" stroke={INK} strokeWidth={3} transform="rotate(-40 0 0)" />
          <path d="M-28,-118 L28,-118 L24,-6 L-24,-6 Z" fill="#a8743f" stroke={INK} strokeWidth={3} />
          <line x1={-40} y1={-40} x2={70} y2={-200} stroke="#5a3d24" strokeWidth={6} />
          <g transform="translate(0,-120) scale(0.8)">
            <circle cx={0} cy={-40} r={36} fill="#9c6b45" stroke={INK} strokeWidth={3} />
            {[-50, -30, -10, 10, 30].map((a) => <path key={a} transform={`rotate(${a} 0 -60)`} d="M-6,-70 L0,-120 L6,-70 Z" fill="#f2ead6" stroke={INK} strokeWidth={2} />)}
          </g>
        </g>
      )}
    </g>
  );
};

/** Small conical lodges for the village. */
export const Tipi: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M0,-60 L-34,0 L34,0 Z" fill="#efe3c8" stroke={INK} strokeWidth={3} />
    <path d="M-6,-60 L-14,-76 M6,-60 L14,-76 M0,-60 L0,-78" stroke={INK} strokeWidth={3} />
    <path d="M-8,0 L0,-22 L8,0 Z" fill="#5a3d24" />
  </g>
);
