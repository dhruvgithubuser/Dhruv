import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C, noise1 } from '../theme';

/* Flat Vox-style vector icons. All are drawn around (0,0) = ground-centre and meant to sit inside an <svg>. */

/** Side-view M4 Sherman. `inflate` 0..1 puffs it up from a flat sheet; `wob` adds a rubbery wobble. */
export const Sherman: React.FC<{ x: number; y: number; s?: number; inflate?: number; wob?: number; color?: string; flip?: boolean; dummy?: boolean }> = ({ x, y, s = 1, inflate = 1, wob = 0, color = C.olive, flip, dummy }) => {
  const f = useCurrentFrame();
  const sy = 0.08 + 0.92 * inflate; const w = wob * 0.04 * Math.sin(f * 0.6);
  const dk = C.oliveDk;
  return (
    <g transform={`translate(${x},${y}) scale(${(flip ? -1 : 1) * s * (1 + w)},${s * sy * (1 - w)})`}>
      {/* tracks */}
      <rect x={-200} y={-62} width={400} height={62} rx={31} fill={dk} stroke={C.ink} strokeWidth={5} />
      {[-160, -100, -40, 20, 80, 140].map((cx) => <circle key={cx} cx={cx} cy={-31} r={22} fill={color} stroke={C.ink} strokeWidth={4} />)}
      {/* hull */}
      <path d="M-215,-62 L-180,-128 L165,-128 L215,-62 Z" fill={color} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
      {/* turret + gun */}
      <path d="M-95,-128 C-95,-185 -60,-198 0,-198 C60,-198 85,-180 90,-128 Z" fill={color} stroke={C.ink} strokeWidth={5} />
      <rect x={85} y={-176} width={170} height={20} rx={8} fill={color} stroke={C.ink} strokeWidth={5} />
      <circle cx={-10} cy={-205} r={14} fill={dk} stroke={C.ink} strokeWidth={4} />
      <path d="M-30,-160 L40,-160" stroke={dk} strokeWidth={6} />
      <polygon points="-140,-110 -125,-80 -155,-80" fill="#fff" opacity={0.85} transform="translate(0,0)" />
      {dummy && <g><circle cx={150} cy={-100} r={9} fill={C.yellow} stroke={C.ink} strokeWidth={3} /></g>}
    </g>
  );
};

/** Helmeted GI. pose: 'stand' | 'lift' (arms up) | 'walk'. */
export const GI: React.FC<{ x: number; y: number; s?: number; pose?: 'stand' | 'lift' | 'walk'; color?: string; phase?: number }> = ({ x, y, s = 1, pose = 'stand', color = C.olive, phase = 0 }) => {
  const f = useCurrentFrame();
  const sw = pose === 'walk' ? 14 * Math.sin(f * 0.4 + phase) : 0;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d={`M-8,-60 L${-12 + sw},0 M8,-60 L${12 - sw},0`} stroke={C.ink} strokeWidth={12} strokeLinecap="round" />
      <rect x={-20} y={-122} width={40} height={66} rx={12} fill={color} stroke={C.ink} strokeWidth={4} />
      {pose === 'lift'
        ? <path d="M-16,-112 L-26,-170 M16,-112 L26,-170" stroke={C.ink} strokeWidth={11} strokeLinecap="round" />
        : <path d={`M-18,-112 L${-28 - sw * 0.5},-62 M18,-112 L${28 + sw * 0.5},-62`} stroke={C.ink} strokeWidth={11} strokeLinecap="round" />}
      <circle cx={0} cy={-138} r={16} fill="#e8c9a6" stroke={C.ink} strokeWidth={4} />
      <path d="M-24,-140 C-24,-168 24,-168 24,-140 Z" fill={C.oliveDk} stroke={C.ink} strokeWidth={4} />
    </g>
  );
};

/** French civilian on a bicycle (beret). */
export const Cyclist: React.FC<{ x: number; y: number; s?: number; color?: string; roll?: number }> = ({ x, y, s = 1, color = C.navy, roll = 0 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    {[-52, 52].map((cx) => <g key={cx} transform={`rotate(${roll * 90} ${cx} -36)`}><circle cx={cx} cy={-36} r={36} fill="none" stroke={C.ink} strokeWidth={6} /><path d={`M${cx - 36},-36 L${cx + 36},-36 M${cx},-72 L${cx},0`} stroke={C.ink} strokeWidth={2} /></g>)}
    <path d="M-52,-36 L-10,-36 L20,-86 L-30,-86 Z M20,-86 L52,-36 M-30,-86 L-36,-100 M20,-86 L26,-104 L44,-104" fill="none" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-30,-100 L-4,-150" stroke={color} strokeWidth={26} strokeLinecap="round" />
    <path d="M-4,-140 L28,-108" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
    <path d="M-30,-100 L-14,-56 L-10,-36" stroke={C.ink} strokeWidth={10} strokeLinecap="round" fill="none" />
    <circle cx={0} cy={-170} r={17} fill="#e8c9a6" stroke={C.ink} strokeWidth={4} />
    <ellipse cx={-2} cy={-184} rx={20} ry={7} fill={C.ink} />
  </g>
);

/** Truck (side view). */
export const Truck: React.FC<{ x: number; y: number; s?: number; inflate?: number }> = ({ x, y, s = 1, inflate = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s},${s * (0.08 + 0.92 * inflate)})`}>
    <rect x={-150} y={-150} width={190} height={110} rx={6} fill={C.olive} stroke={C.ink} strokeWidth={5} />
    <path d="M40,-40 L40,-118 L100,-118 L130,-80 L130,-40 Z" fill={C.olive} stroke={C.ink} strokeWidth={5} />
    <rect x={60} y={-108} width={34} height={28} fill={C.water} stroke={C.ink} strokeWidth={3} />
    {[-110, -40, 90].map((cx) => <circle key={cx} cx={cx} cy={-26} r={26} fill={C.ink} />)}
    <polygon points="-60,-112 -45,-82 -75,-82" fill="#fff" opacity={0.85} />
  </g>
);

/** Field gun (side view). */
export const Cannon: React.FC<{ x: number; y: number; s?: number; inflate?: number }> = ({ x, y, s = 1, inflate = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s},${s * (0.08 + 0.92 * inflate)})`}>
    <path d="M-120,-10 L40,-60" stroke={C.oliveDk} strokeWidth={16} strokeLinecap="round" />
    <rect x={-20} y={-90} width={190} height={24} rx={10} fill={C.olive} stroke={C.ink} strokeWidth={5} transform="rotate(-12 0 -78)" />
    <path d="M-30,-60 L50,-90 L60,-50 L-10,-30 Z" fill={C.olive} stroke={C.ink} strokeWidth={5} />
    <circle cx={10} cy={-34} r={36} fill="none" stroke={C.ink} strokeWidth={10} />
  </g>
);

/** Half-track with a loudspeaker; `blast` 0..1 animates sound rings out to radius R. */
export const SoundTruck: React.FC<{ x: number; y: number; s?: number; blast?: number; R?: number }> = ({ x, y, s = 1, blast = 0, R = 600 }) => (
  <g transform={`translate(${x},${y})`}>
    {blast > 0 && [0, 1, 2, 3].map((i) => { const p = (blast * 2.5 + i / 4) % 1;
      return <circle key={`r${i}`} cx={150 * s} cy={-170 * s} r={40 + (R - 40) * p} fill="none" stroke={C.red} strokeWidth={8 * (1 - p) + 2} opacity={1 - p} />; })}
    <g transform={`scale(${s})`}>
      <rect x={-200} y={-60} width={210} height={56} rx={28} fill={C.oliveDk} stroke={C.ink} strokeWidth={5} />
      {[-170, -125, -80, -35].map((cx) => <circle key={cx} cx={cx} cy={-32} r={18} fill={C.olive} stroke={C.ink} strokeWidth={4} />)}
      <circle cx={70} cy={-28} r={28} fill={C.ink} />
      <path d="M-210,-60 L-210,-140 L60,-140 L110,-90 L110,-60 Z" fill={C.olive} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
      <path d="M100,-150 L150,-200 L150,-140 L100,-150 Z M60,-140 L100,-150" fill={C.yellow} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
      <path d="M-120,-140 L-120,-170 L60,-170 L100,-150" fill="none" stroke={C.ink} strokeWidth={5} />
    </g>
  </g>
);

/** Radio mast with Morse "chatter". */
export const Radio: React.FC<{ x: number; y: number; s?: number; on?: number }> = ({ x, y, s = 1, on = 0 }) => {
  const f = useCurrentFrame();
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d="M-60,0 L0,-300 L60,0 M-40,-100 L40,-100 M-26,-180 L26,-180 M-14,-250 L14,-250" fill="none" stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
      <circle cx={0} cy={-310} r={14} fill={C.red} />
      {on > 0 && [0, 1, 2].map((i) => { const p = ((f / 22) + i / 3) % 1;
        return <path key={i} d={`M${-40 - 160 * p},${-310 - 40 - 120 * p} A${50 + 160 * p} ${50 + 160 * p} 0 0 1 ${40 + 160 * p},${-310 - 40 - 120 * p}`} fill="none" stroke={C.red} strokeWidth={6} opacity={(1 - p) * on} />; })}
    </g>
  );
};

/** Gold medal. */
export const Medal: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => {
  const f = useCurrentFrame(); const r = 4 * noise1(f * 0.03, 5);
  return (
    <g transform={`translate(${x},${y}) scale(${s}) rotate(${r})`}>
      <path d="M-60,-260 L-20,-120 L20,-120 L60,-260 Z" fill={C.red} stroke={C.ink} strokeWidth={5} />
      <path d="M-20,-260 L0,-180 L20,-260 Z" fill="#fff" />
      <circle cx={0} cy={-40} r={100} fill="#e6b93a" stroke={C.ink} strokeWidth={6} />
      <circle cx={0} cy={-40} r={78} fill="none" stroke="#b8891d" strokeWidth={6} />
      <path d="M0,-100 L16,-58 L60,-58 L24,-32 L38,10 L0,-16 L-38,10 L-24,-32 L-60,-58 L-16,-58 Z" fill="#fff3c4" stroke="#b8891d" strokeWidth={4} />
    </g>
  );
};
