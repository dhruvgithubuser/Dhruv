import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { noise1 } from '../theme';

/**
 * Paper-cutout cast for 1753–1775, drawn in code so each person looks the same in every scene.
 * Front view, waist up. Designs are illustrative (no likenesses), period dress per role.
 */
export type Who = 'washington' | 'washington1775' | 'dinwiddie' | 'jumonville' | 'louis' | 'contrecoeur' | 'vanbraam' | 'braddock' | 'gist' | 'tanacharison' | 'saintpierre';
const INK = '#1a140e';
type Look = { coat: string; facing: string; vest: string; hat: 'tricorn' | 'tricornLace' | 'round' | 'none'; hair: string; wig?: boolean; age: number; gorget?: boolean; epaulettes?: boolean; blanket?: string; skin?: string; heavy?: number };
const LOOKS: Record<Who, Look> = {
  washington: { coat: '#2f4a6e', facing: '#9b2d20', vest: '#d8b77a', hat: 'tricorn', hair: '#b7a68f', age: 0, gorget: true },
  washington1775: { coat: '#2b4163', facing: '#d8b77a', vest: '#d8b77a', hat: 'tricornLace', hair: '#cfc8bb', age: 0.5, epaulettes: true },
  dinwiddie: { coat: '#5a3a22', facing: '#3d2614', vest: '#7a5a3a', hat: 'none', hair: '#eeeae0', wig: true, age: 1, heavy: 1 },
  jumonville: { coat: '#d9d5c8', facing: '#2e4f86', vest: '#2e4f86', hat: 'tricornLace', hair: '#e2dccc', age: 0.1 },
  louis: { coat: '#d4cfc0', facing: '#2e4f86', vest: '#2e4f86', hat: 'tricornLace', hair: '#e2dccc', age: 0.45, gorget: true },
  contrecoeur: { coat: '#d4cfc0', facing: '#2e4f86', vest: '#9b2d20', hat: 'tricornLace', hair: '#e8e3d6', wig: true, age: 0.7 },
  saintpierre: { coat: '#d0cbbc', facing: '#2e4f86', vest: '#2e4f86', hat: 'tricorn', hair: '#e8e3d6', wig: true, age: 0.8 },
  vanbraam: { coat: '#6b4a2e', facing: '#4a3220', vest: '#8a6a44', hat: 'tricorn', hair: '#d9d0bd', wig: true, age: 0.4 },
  braddock: { coat: '#a23324', facing: '#1f2e5a', vest: '#c9a24a', hat: 'tricornLace', hair: '#f0ece2', wig: true, age: 0.9, gorget: true, heavy: 0.7 },
  gist: { coat: '#7a5c3a', facing: '#7a5c3a', vest: '#5a4028', hat: 'round', hair: '#5a4630', age: 0.6 },
  tanacharison: { coat: '#eae2cf', facing: '#eae2cf', vest: '#eae2cf', hat: 'none', hair: '#1c1612', age: 0.7, gorget: true, blanket: '#9b2d20', skin: '#b5835f' },
};

export const CastDefs: React.FC = () => (
  <defs>
    <filter id="cut" x="-20%" y="-20%" width="140%" height="140%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="5" result="fat" />
      <feFlood floodColor="#f3ead8" result="white" /><feComposite in="white" in2="fat" operator="in" result="edge" />
      <feGaussianBlur in="fat" stdDeviation="9" result="blur" /><feOffset in="blur" dx="7" dy="12" result="off" />
      <feFlood floodColor="rgba(20,12,4,0.5)" /><feComposite in2="off" operator="in" result="shadow" />
      <feMerge><feMergeNode in="shadow" /><feMergeNode in="edge" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>
);

export const useRise = (at: number) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return f < at ? 0 : spring({ frame: f - at, fps, config: { damping: 12, stiffness: 130, mass: 0.9 } });
};

/** Waist-up character at (x, y = waist), scale s; rise 0..1 entrance; talk 0..1 animates the mouth; gesture 0..1 raises the right arm. */
export const Person: React.FC<{ who: Who; x: number; y: number; s?: number; rise?: number; talk?: number; gesture?: number; look?: number; flip?: boolean }> = ({
  who, x, y, s = 1, rise = 1, talk = 0, gesture = 0, look = 0, flip,
}) => {
  const f = useCurrentFrame();
  const L = LOOKS[who];
  const sk = L.skin ?? '#d9b394';
  const br = 1.2 * Math.sin(f / 20 + x);
  const sway = 0.6 * noise1(f * 0.015, x);
  const up = (1 - rise) * 300;
  const mouth = talk > 0 ? 3 + 5 * Math.abs(Math.sin(f / 3.2)) * talk : 2;
  const wide = 1 + 0.12 * (L.heavy ?? 0);
  return (
    <g transform={`translate(${x},${y + up}) scale(${(flip ? -1 : 1) * s},${s}) rotate(${sway} 0 -150)`} filter="url(#cut)" opacity={rise <= 0 ? 0 : 1}>
      {/* coat body with skirts */}
      <path d={`M${-86 * wide},20 L${-92 * wide},-${190 + br} Q-44,-${228 + br} 0,-${230 + br} Q44,-${228 + br} ${92 * wide},-${190 + br} L${86 * wide},20 Z`} fill={L.coat} stroke={INK} strokeWidth={3} />
      {!L.blanket && <>
        <path d={`M-34,-${222 + br} L-48,20 L-20,20 L-8,-${180}`} fill={L.facing} stroke={INK} strokeWidth={2} />
        <path d={`M34,-${222 + br} L48,20 L20,20 L8,-${180}`} fill={L.facing} stroke={INK} strokeWidth={2} />
        <path d="M-20,-200 L-22,20 L22,20 L20,-200 Z" fill={L.vest} stroke={INK} strokeWidth={2} />
        {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={0} cy={-180 + i * 36} r={4} fill="#c9a24a" stroke={INK} strokeWidth={1} />)}
        <path d="M-14,-226 Q0,-206 14,-226 L10,-196 Q0,-188 -10,-196 Z" fill="#f4f0e6" stroke={INK} strokeWidth={1.5} />
      </>}
      {L.blanket && <path d={`M-92,-180 Q-20,-120 92,-${190 + br} L86,20 L-30,20 Q-70,-60 -92,-180 Z`} fill={L.blanket} stroke={INK} strokeWidth={3} />}
      {L.blanket && <path d="M-84,-150 L60,-70 M-80,-120 L70,-30" stroke="#2a1a10" strokeWidth={4} opacity={0.5} />}
      {L.gorget && <path d="M-26,-206 Q0,-178 26,-206 Q0,-192 -26,-206 Z" fill="#d6d6d0" stroke={INK} strokeWidth={2} />}
      {L.epaulettes && <><ellipse cx={-80} cy={-196} rx={26} ry={10} fill="#d9b44a" stroke={INK} strokeWidth={2} /><ellipse cx={80} cy={-196} rx={26} ry={10} fill="#d9b44a" stroke={INK} strokeWidth={2} /></>}
      {/* arms */}
      <g transform="rotate(-8 -80 -186)">
        <path d="M-80,-186 L-96,-30" stroke={L.coat} strokeWidth={38} strokeLinecap="round" />
        <rect x={-114} y={-48} width={36} height={22} rx={5} fill={L.facing} stroke={INK} strokeWidth={2} />
        <ellipse cx={-96} cy={-16} rx={15} ry={17} fill={sk} stroke={INK} strokeWidth={2} />
      </g>
      <g transform={`rotate(${8 - 120 * gesture} 80 -186)`}>
        <path d="M80,-186 L96,-30" stroke={L.coat} strokeWidth={38} strokeLinecap="round" />
        <rect x={78} y={-48} width={36} height={22} rx={5} fill={L.facing} stroke={INK} strokeWidth={2} />
        <ellipse cx={96} cy={-16} rx={15} ry={17} fill={sk} stroke={INK} strokeWidth={2} />
      </g>
      {/* head */}
      <rect x={-17} y={-250} width={34} height={28} fill={sk} />
      <g transform={`translate(${look * 6},0)`}>
        <ellipse cx={0} cy={-304} rx={48} ry={60} fill={sk} stroke={INK} strokeWidth={3} />
        <ellipse cx={-48} cy={-300} rx={8} ry={14} fill={sk} stroke={INK} strokeWidth={2} /><ellipse cx={48} cy={-300} rx={8} ry={14} fill={sk} stroke={INK} strokeWidth={2} />
        <ellipse cx={-18} cy={-308} rx={6} ry={5} fill="#1b1410" /><ellipse cx={18} cy={-308} rx={6} ry={5} fill="#1b1410" />
        <path d="M-30,-322 L-8,-320 M8,-320 L30,-322" stroke="#3a2a1a" strokeWidth={4} strokeLinecap="round" />
        <path d="M-2,-304 Q-7,-282 3,-279" fill="none" stroke="#8a6248" strokeWidth={3} />
        <ellipse cx={0} cy={-262} rx={12} ry={mouth} fill="#5a2a22" />
        {L.age > 0.5 && <path d="M-30,-290 Q-24,-284 -30,-276 M30,-290 Q24,-284 30,-276" stroke="#a8826a" strokeWidth={2} fill="none" />}
        {/* hair / wig */}
        {L.wig ? (
          <g>
            <path d="M-50,-320 Q-52,-372 0,-372 Q52,-372 50,-320 Q40,-350 0,-352 Q-40,-350 -50,-320 Z" fill={L.hair} stroke={INK} strokeWidth={2} />
            {[-1, 1].map((sd) => [0, 1].map((r) => <ellipse key={`${sd}${r}`} cx={sd * 54} cy={-318 + r * 22} rx={14} ry={10} fill={L.hair} stroke={INK} strokeWidth={1.5} />))}
          </g>
        ) : who === 'tanacharison' ? (
          <path d="M-50,-320 Q-46,-372 0,-372 Q46,-372 50,-320 Q30,-346 0,-348 Q-30,-346 -50,-320 Z M44,-330 Q70,-300 58,-250" fill={L.hair} stroke={INK} strokeWidth={2} />
        ) : (
          <g>
            <path d="M-50,-318 Q-52,-372 0,-372 Q52,-372 50,-318 Q42,-348 0,-350 Q-42,-348 -50,-318 Z" fill={L.hair} stroke={INK} strokeWidth={2} />
            <path d="M-52,-312 Q-60,-296 -50,-288 M52,-312 Q60,-296 50,-288" stroke={L.hair} strokeWidth={10} fill="none" />
          </g>
        )}
        {(L.hat === 'tricorn' || L.hat === 'tricornLace') && (
          <g>
            <path d="M-84,-344 Q0,-322 84,-344 Q60,-400 0,-404 Q-60,-400 -84,-344 Z" fill="#14100c" stroke={INK} strokeWidth={2} />
            {L.hat === 'tricornLace' && <path d="M-84,-344 Q0,-322 84,-344" fill="none" stroke="#d9b44a" strokeWidth={6} />}
            <circle cx={40} cy={-352} r={8} fill={who === 'jumonville' || who === 'louis' || who === 'contrecoeur' || who === 'saintpierre' ? '#f4f0e6' : '#14100c'} stroke={INK} strokeWidth={1} />
          </g>
        )}
        {L.hat === 'round' && <g><ellipse cx={0} cy={-350} rx={80} ry={14} fill="#3a2a1a" stroke={INK} strokeWidth={2} /><path d="M-46,-350 Q-44,-396 0,-398 Q44,-396 46,-350 Z" fill="#3a2a1a" stroke={INK} strokeWidth={2} /></g>}
        {who === 'tanacharison' && <g><circle cx={-50} cy={-284} r={6} fill="#d6d6d0" stroke={INK} strokeWidth={1.5} /><circle cx={50} cy={-284} r={6} fill="#d6d6d0" stroke={INK} strokeWidth={1.5} /></g>}
      </g>
    </g>
  );
};

/** Side-view figure (facing right): 'virginian' | 'french' | 'warrior' | 'redcoat'. pose: walk / kneelAim / standAim / stand. */
export type Kind = 'virginian' | 'french' | 'warrior' | 'redcoat';
const SIDE: Record<Kind, { coat: string; hat: 'tricorn' | 'none'; legs: string }> = {
  virginian: { coat: '#3a4f6e', hat: 'tricorn', legs: '#6b5a42' },
  french: { coat: '#d4cfc0', hat: 'tricorn', legs: '#d4cfc0' },
  warrior: { coat: '#6a4a30', hat: 'none', legs: '#5a3a24' },
  redcoat: { coat: '#a23324', hat: 'tricorn', legs: '#e8e0cc' },
};
export const Soldier: React.FC<{ kind: Kind; x: number; y: number; s?: number; pose?: 'walk' | 'kneelAim' | 'standAim' | 'stand' | 'hands'; phase?: number; flip?: boolean; dark?: number }> = ({
  kind, x, y, s = 1, pose = 'walk', phase = 0, flip, dark = 0,
}) => {
  const f = useCurrentFrame();
  const K = SIDE[kind];
  const w = pose === 'walk' ? Math.sin(f / 5 + phase) : 0;
  const bob = pose === 'walk' ? Math.abs(Math.cos(f / 5 + phase)) * 4 : 0;
  const kneel = pose === 'kneelAim';
  const aim = pose === 'kneelAim' || pose === 'standAim';
  const col = (c: string) => (dark > 0 ? `color-mix(in srgb, ${c} ${100 - dark * 100}%, #0b0806)` : c);
  return (
    <g transform={`translate(${x},${y - bob}) scale(${(flip ? -1 : 1) * s},${s})`}>
      {/* legs */}
      {kneel ? (<><path d="M0,-70 L40,-40 L40,0" stroke={col(K.legs)} strokeWidth={16} fill="none" strokeLinecap="round" /><path d="M0,-70 L-30,-10 L-60,-6" stroke={col(K.legs)} strokeWidth={16} fill="none" strokeLinecap="round" /></>)
        : (<><path d={`M0,-80 L${18 * w},0`} stroke={col(K.legs)} strokeWidth={16} strokeLinecap="round" /><path d={`M0,-80 L${-18 * w},0`} stroke={col(K.legs)} strokeWidth={16} strokeLinecap="round" /></>)}
      <g transform={kneel ? 'translate(0,30)' : undefined}>
        {/* coat */}
        <path d="M-20,-160 Q0,-170 20,-160 L26,-70 L-30,-60 Z" fill={col(K.coat)} stroke="#120c08" strokeWidth={2.5} />
        {kind === 'warrior' && <path d="M-22,-150 L24,-110" stroke={col('#9b2d20')} strokeWidth={10} />}
        {/* head */}
        <circle cx={4} cy={-182} r={17} fill={col(kind === 'warrior' ? '#b5835f' : '#d9b394')} stroke="#120c08" strokeWidth={2} />
        {K.hat === 'tricorn' ? <path d="M-24,-192 Q4,-186 32,-192 Q22,-214 4,-214 Q-14,-214 -24,-192 Z" fill={col('#14100c')} />
          : <path d="M-12,-196 Q4,-204 18,-196 L20,-186 Q4,-194 -12,-186 Z" fill={col('#1c1612')} />}
        {/* arms + musket */}
        {aim ? (
          <g><path d="M0,-150 L34,-150" stroke={col(K.coat)} strokeWidth={13} strokeLinecap="round" /><path d="M-30,-148 L92,-158" stroke={col('#3a2414')} strokeWidth={6} /><path d="M40,-157 L92,-158" stroke={col('#555')} strokeWidth={3} /></g>
        ) : pose === 'hands' ? (
          <g><path d="M0,-150 L-6,-210" stroke={col(K.coat)} strokeWidth={12} strokeLinecap="round" /><path d="M8,-150 L16,-210" stroke={col(K.coat)} strokeWidth={12} strokeLinecap="round" /></g>
        ) : (
          <g><path d="M4,-150 L18,-110" stroke={col(K.coat)} strokeWidth={12} strokeLinecap="round" /><path d="M14,-100 L-4,-232" stroke={col('#3a2414')} strokeWidth={6} /></g>
        )}
      </g>
    </g>
  );
};
