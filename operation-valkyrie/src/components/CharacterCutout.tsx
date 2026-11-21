import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { noise1 } from '../theme';

/**
 * Editorial paper-cutout characters, drawn in code so every appearance is identical.
 * Front view, head-and-torso (the briefing table hides the legs; standalone they have legs).
 * The white paper edge + soft drop shadow comes from the shared <CutoutDefs/> filter.
 *
 * who: 'stauffenberg' (eye patch over left eye, right sleeve without a hand, left hand missing two fingers),
 *      'hitler' (side-parted dark hair, toothbrush moustache, field-grey tunic; no insignia),
 *      'officer' / 'officerCap' (Wehrmacht field-grey, collar tabs, shoulder boards).
 */
export type Who = 'stauffenberg' | 'hitler' | 'officer' | 'officerCap';
const INK = '#1a140e';

export const CutoutDefs: React.FC = () => (
  <defs>
    <filter id="cutout" x="-20%" y="-20%" width="140%" height="140%">
      <feComponentTransfer in="SourceGraphic" result="src"><feFuncR type="linear" slope="1.0" /><feFuncG type="linear" slope="1.0" /><feFuncB type="linear" slope="1.0" /></feComponentTransfer>
      <feMorphology in="SourceAlpha" operator="dilate" radius="5" result="fat" />
      <feFlood floodColor="#f3ead8" result="white" />
      <feComposite in="white" in2="fat" operator="in" result="edge" />
      <feGaussianBlur in="fat" stdDeviation="9" result="blur" />
      <feOffset in="blur" dx="6" dy="12" result="off" />
      <feFlood floodColor="rgba(20,12,4,0.55)" />
      <feComposite in2="off" operator="in" result="shadow" />
      <feMerge><feMergeNode in="shadow" /><feMergeNode in="edge" /><feMergeNode in="src" /></feMerge>
    </filter>
    <filter id="cutoutMid" x="-20%" y="-20%" width="140%" height="140%">
      <feComponentTransfer in="SourceGraphic" result="src"><feFuncR type="linear" slope="0.55" /><feFuncG type="linear" slope="0.55" /><feFuncB type="linear" slope="0.55" /></feComponentTransfer>
      <feMorphology in="SourceAlpha" operator="dilate" radius="5" result="fat" />
      <feFlood floodColor="#cfc4ad" result="white" />
      <feComposite in="white" in2="fat" operator="in" result="edge" />
      <feGaussianBlur in="fat" stdDeviation="9" result="blur" />
      <feOffset in="blur" dx="6" dy="12" result="off" />
      <feFlood floodColor="rgba(20,12,4,0.55)" />
      <feComposite in2="off" operator="in" result="shadow" />
      <feMerge><feMergeNode in="shadow" /><feMergeNode in="edge" /><feMergeNode in="src" /></feMerge>
    </filter>
    <filter id="cutoutDark" x="-20%" y="-20%" width="140%" height="140%">
      <feComponentTransfer in="SourceGraphic" result="src"><feFuncR type="linear" slope="0.18" /><feFuncG type="linear" slope="0.18" /><feFuncB type="linear" slope="0.18" /></feComponentTransfer>
      <feMorphology in="SourceAlpha" operator="dilate" radius="5" result="fat" />
      <feFlood floodColor="#5a5248" result="white" />
      <feComposite in="white" in2="fat" operator="in" result="edge" />
      <feGaussianBlur in="fat" stdDeviation="9" result="blur" />
      <feOffset in="blur" dx="6" dy="12" result="off" />
      <feFlood floodColor="rgba(20,12,4,0.55)" />
      <feComposite in2="off" operator="in" result="shadow" />
      <feMerge><feMergeNode in="shadow" /><feMergeNode in="edge" /><feMergeNode in="src" /></feMerge>
    </filter>
    <linearGradient id="fieldgrey" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#56584b" /><stop offset="0.55" stopColor="#6f7262" /><stop offset="1" stopColor="#4c4e42" /></linearGradient>
    <linearGradient id="skin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#c09478" /><stop offset="0.6" stopColor="#dcb898" /><stop offset="1" stopColor="#b88a6c" /></linearGradient>
  </defs>
);

/** One figure at (x, y = waist line), scale s. rise: 0..1 entrance (with overshoot), lean: head/torso tilt deg, arm: 0..1 (reach down/forward). */
export const Figure: React.FC<{ who: Who; x: number; y: number; s?: number; rise?: number; lean?: number; arm?: number; legs?: boolean; walk?: number; dim?: number; look?: number }> = ({
  who, x, y, s = 1, rise = 1, lean = 0, arm = 0, legs = false, walk = 0, dim = 0, look = 0,
}) => {
  const f = useCurrentFrame();
  const breathe = 1.2 * Math.sin(f / 18 + x);
  const sway = 0.8 * noise1(f * 0.02, x);
  const up = (1 - rise) * 260;
  const isH = who === 'hitler', isS = who === 'stauffenberg', cap = who === 'officerCap';
  const step = Math.sin(walk * Math.PI * 2);
  return (
    <g transform={`translate(${x},${y + up}) scale(${s}) rotate(${lean + sway} 0 -150)`} filter={dim > 0.7 ? 'url(#cutoutDark)' : dim > 0.35 ? 'url(#cutoutMid)' : 'url(#cutout)'} opacity={rise <= 0 ? 0 : 1}>
      {legs && (
        <g>
          <path d={`M-22,0 L${-26 + 14 * step},170`} stroke="#3c3d33" strokeWidth={34} strokeLinecap="round" />
          <path d={`M22,0 L${26 - 14 * step},170`} stroke="#34352c" strokeWidth={34} strokeLinecap="round" />
          <rect x={-48 + 14 * step} y={160} width={40} height={18} rx={6} fill="#111" />
          <rect x={8 - 14 * step} y={160} width={40} height={18} rx={6} fill="#111" />
        </g>
      )}
      {/* torso: field-grey tunic */}
      <path d={`M-78,10 L-84,-${190 + breathe} Q-40,-${226 + breathe} 0,-${228 + breathe} Q40,-${226 + breathe} 84,-${190 + breathe} L78,10 Z`} fill="url(#fieldgrey)" stroke={INK} strokeWidth={3} />
      <path d="M0,-222 L0,8" stroke="#3d3f35" strokeWidth={3} />
      {[0, 1, 2, 3].map((i) => <circle key={i} cx={6} cy={-196 + i * 48} r={5} fill="#b9b39a" stroke={INK} strokeWidth={1.5} />)}
      <rect x={-78} y={-34} width={156} height={16} fill="#2a2620" />
      <rect x={-12} y={-36} width={24} height={20} rx={3} fill="#9c968a" stroke={INK} strokeWidth={1.5} />
      {/* collar + shoulder boards */}
      <path d="M-34,-226 L0,-196 L34,-226" fill="#3e4136" stroke={INK} strokeWidth={2.5} />
      {!isH && <><rect x={-30} y={-222} width={14} height={10} fill="#c8c2a8" /><rect x={16} y={-222} width={14} height={10} fill="#c8c2a8" /></>}
      <rect x={-84} y={-200} width={36} height={12} rx={4} fill={isH ? '#5a5c4e' : '#a7a28a'} stroke={INK} strokeWidth={1.5} />
      <rect x={48} y={-200} width={36} height={12} rx={4} fill={isH ? '#5a5c4e' : '#a7a28a'} stroke={INK} strokeWidth={1.5} />
      {/* arms */}
      <g transform={`rotate(${-10 - 40 * arm} -76 -186)`}>
        <path d="M-76,-186 L-92,-40" stroke="url(#fieldgrey)" strokeWidth={36} strokeLinecap="round" />
        <path d="M-76,-186 L-92,-40" stroke={INK} strokeWidth={2} opacity={0.4} />
        {isS
          ? <rect x={-106} y={-46} width={28} height={14} rx={3} fill="#4c4e42" stroke={INK} strokeWidth={2} /> /* right sleeve, no hand */
          : <ellipse cx={-92} cy={-30} rx={15} ry={17} fill="url(#skin)" stroke={INK} strokeWidth={2} />}
      </g>
      <g transform={`rotate(${10 + 25 * arm} 76 -186)`}>
        <path d="M76,-186 L92,-40" stroke="url(#fieldgrey)" strokeWidth={36} strokeLinecap="round" />
        <ellipse cx={92} cy={-30} rx={isS ? 12 : 15} ry={isS ? 14 : 17} fill="url(#skin)" stroke={INK} strokeWidth={2} />
        {isS && <path d="M86,-20 L86,-10 M92,-18 L92,-8 M98,-20 L98,-10" stroke={INK} strokeWidth={4} strokeLinecap="round" />}
      </g>
      {/* neck + head */}
      <rect x={-18} y={-246} width={36} height={26} fill="url(#skin)" />
      <g transform={`translate(${look * 6},0)`}>
        <ellipse cx={0} cy={-300} rx={isH ? 44 : 50} ry={isH ? 64 : 60} fill="url(#skin)" stroke={INK} strokeWidth={3} />
        <ellipse cx={-50} cy={-296} rx={8} ry={14} fill="#c79c7e" stroke={INK} strokeWidth={2} />
        <ellipse cx={50} cy={-296} rx={8} ry={14} fill="#c79c7e" stroke={INK} strokeWidth={2} />
        {/* eyes */}
        <ellipse cx={-19} cy={-304} rx={7} ry={5} fill="#1b1410" />
        {isS
          ? <g><ellipse cx={19} cy={-304} rx={14} ry={11} fill="#0d0a08" /><path d="M-48,-326 L50,-290" stroke="#0d0a08" strokeWidth={4} /></g>
          : <ellipse cx={19} cy={-304} rx={7} ry={5} fill="#1b1410" />}
        <path d={`M-30,-318 L-10,-316 M10,-316 L30,-318`} stroke="#2a1d14" strokeWidth={4} strokeLinecap="round" />
        <path d="M-2,-300 Q-6,-280 2,-276" fill="none" stroke="#8a6248" strokeWidth={3} />
        {isH ? <rect x={-12} y={-272} width={24} height={11} rx={2} fill="#140d08" /> : null}
        <path d={isH ? 'M-14,-256 Q0,-252 14,-256' : 'M-16,-258 Q0,-252 16,-258'} stroke="#7a4a3a" strokeWidth={3} fill="none" />
        {/* hair / cap */}
        {cap ? (
          <g>
            <path d="M-56,-338 Q0,-392 60,-338 L56,-326 L-56,-326 Z" fill="#5d6052" stroke={INK} strokeWidth={3} />
            <rect x={-58} y={-338} width={116} height={14} fill="#2b2c24" />
            <path d="M-52,-326 Q0,-308 52,-326 L48,-318 Q0,-302 -48,-318 Z" fill="#111" />
            <circle cx={0} cy={-350} r={6} fill="#b9b39a" />
          </g>
        ) : isH ? (
          <g>
            <path d="M-52,-306 Q-58,-370 0,-368 Q56,-366 52,-318 L46,-330 Q20,-352 -10,-346 Z" fill="#20160f" stroke={INK} strokeWidth={2} />
            <path d="M-14,-350 Q24,-344 44,-318 Q40,-300 30,-296 Q22,-322 -6,-334 Z" fill="#20160f" stroke={INK} strokeWidth={2} />
            <path d="M-18,-358 L-22,-340" stroke="#4a3a2a" strokeWidth={2} />
          </g>
        ) : (
          <path d="M-52,-316 Q-54,-366 0,-366 Q54,-366 52,-316 Q44,-344 0,-346 Q-40,-346 -52,-316 Z" fill={isS ? '#2b1f16' : '#4a3a2a'} stroke={INK} strokeWidth={2} />
        )}
      </g>
    </g>
  );
};

/** Rise with a slight overshoot (spring), for cutouts entering at frame `at`. */
export const useRise = (at: number) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return f < at ? 0 : spring({ frame: f - at, fps, config: { damping: 11, stiffness: 140, mass: 0.9 } });
};

/** Dark leather briefcase (front view). */
export const Briefcase: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`} opacity={o} filter="url(#cutout)">
    <path d="M-30,-70 Q-30,-92 -10,-92 L10,-92 Q30,-92 30,-70" fill="none" stroke="#2a1a10" strokeWidth={8} />
    <rect x={-78} y={-72} width={156} height={104} rx={10} fill="#4a2c1a" stroke={INK} strokeWidth={3} />
    <rect x={-78} y={-72} width={156} height={30} rx={8} fill="#5a3622" />
    <rect x={-50} y={-48} width={16} height={12} rx={2} fill="#b99a5a" /><rect x={34} y={-48} width={16} height={12} rx={2} fill="#b99a5a" />
    <path d="M-70,-20 L70,-20" stroke="#3a2214" strokeWidth={2} />
  </g>
);
