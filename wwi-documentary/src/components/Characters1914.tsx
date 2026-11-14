import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { C, hash01, noise1 } from '../theme';

/**
 * 2D motion-graphics cast for the side-view scenes: the 1914 Graf & Stift open touring car with its occupants,
 * a waving crowd, and the two assassins (the bomb thrower and Princip) as rim-lit silhouettes.
 * Everything is a pure function of the frame. Figures are stylised, not likenesses.
 */

const INK = '#120d09';
const RIM = 'rgba(255,214,160,0.55)';

// ------------------------------------------------------------------ street (tracking shot background)
/** Painted facade plate scrolled for a tracking shot; sky above, cobbles + kerb below. */
export const Street: React.FC<{ scroll: number; ground?: number; tint?: string; img?: string }> = ({ scroll, ground = 1290, tint = 'rgba(0,0,0,0)', img = 'stills/street_bg.jpg' }) => {
  const w = 1900;
  const x = -((scroll % w) + w) % w;
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #8fa6b3 0%, #d9cdb0 45%, #6b5a45 100%)' }}>
      {[0, 1].map((i) => (
        <Img key={i} src={staticFile(img)} style={{ position: 'absolute', left: x + i * w, top: ground - 1070, width: w + 2, height: 1070, objectFit: 'cover', transform: i ? 'scaleX(-1)' : undefined }} />
      ))}
      <AbsoluteFill style={{ background: tint }} />
      {/* kerb + cobbles */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: ground - 8, height: 16, background: '#b9a988', borderTop: '3px solid #6d5d45' }} />
      <svg width={1080} height={1920 - ground} style={{ position: 'absolute', left: 0, top: ground + 8 }}>
        <defs><linearGradient id="road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8c7a5e" /><stop offset="1" stopColor="#3a2e22" /></linearGradient></defs>
        <rect width={1080} height={1920} fill="url(#road)" />
        {Array.from({ length: 9 }, (_, r) => Array.from({ length: 20 }, (_, c) => {
          const h = 14 + r * 9, wd = 40 + r * 14;
          const ox = (((c * wd - scroll * (1.1 + r * 0.12)) % (20 * wd)) + 20 * wd) % (20 * wd) - wd + (r % 2) * wd * 0.5;
          return <ellipse key={`${r}-${c}`} cx={ox + wd / 2} cy={r * (h + 4) + r * r * 2 + h / 2} rx={wd / 2 - 3} ry={h / 2} fill={`rgba(255,240,210,${0.05 + 0.01 * r})`} stroke={`rgba(30,22,14,${0.18 + 0.02 * r})`} strokeWidth={2} />;
        }))}
      </svg>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(0,0,0,0) ${((ground + 120) / 1920) * 100}%, rgba(10,6,3,0.75) 100%)` }} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ people
type Pose = { wave?: number; look?: number };
const Head: React.FC<{ x: number; y: number; r?: number; skin?: string; look?: number }> = ({ x, y, r = 19, skin = '#c9a184', look = 1 }) => (
  <g>
    <ellipse cx={x} cy={y} rx={r * 0.92} ry={r} fill={skin} stroke={INK} strokeWidth={2.5} />
    <path d={`M${x + look * r * 0.75},${y - 2} q${look * 6},4 0,9`} fill="none" stroke={INK} strokeWidth={2} />
  </g>
);

/** Franz Ferdinand: light-blue tunic, plumed helmet (green feathers), large moustache, waving. */
const Archduke: React.FC<{ x: number; y: number; t: number } & Pose> = ({ x, y, t, wave = 0 }) => {
  const arm = wave * (-35 + 18 * Math.sin(t / 4.5));
  return (
    <g>
      <path d={`M${x - 26},${y} L${x - 24},${y - 70} Q${x},${y - 84} ${x + 24},${y - 70} L${x + 26},${y} Z`} fill="url(#tunicBlue)" stroke={INK} strokeWidth={2.5} />
      <path d={`M${x - 20},${y - 66} L${x + 20},${y - 66}`} stroke="#d6b45a" strokeWidth={3} />
      <circle cx={x + 6} cy={y - 50} r={3} fill="#d6b45a" /><circle cx={x + 6} cy={y - 36} r={3} fill="#d6b45a" />
      <g transform={`rotate(${arm} ${x + 22} ${y - 64})`}>
        <path d={`M${x + 20},${y - 66} L${x + 54},${y - 46}`} stroke="#8fb3d6" strokeWidth={14} strokeLinecap="round" />
        <path d={`M${x + 52},${y - 46} L${x + 58},${y - 84}`} stroke="#8fb3d6" strokeWidth={12} strokeLinecap="round" />
        <circle cx={x + 58} cy={y - 88} r={7} fill="#f2efe6" stroke={INK} strokeWidth={2} />
      </g>
      <Head x={x + 2} y={y - 98} r={21} />
      <path d={`M${x + 4},${y - 90} q12,-4 22,4 M${x + 4},${y - 90} q-10,-4 -18,4`} stroke="#3a2a1a" strokeWidth={5} strokeLinecap="round" fill="none" />
      {/* bicorne-style plumed helmet */}
      <path d={`M${x - 20},${y - 112} Q${x + 2},${y - 136} ${x + 24},${y - 112} Z`} fill="#1c2a3a" stroke={INK} strokeWidth={2.5} />
      {Array.from({ length: 7 }, (_, i) => {
        const a = -30 + i * 10 + 8 * noise1(t * 0.12 + i, 4);
        return <path key={i} d={`M${x},${y - 128} q${-10 + i * 3},-30 ${-26 + i * 4},${-36 + Math.abs(i - 3) * 4}`} transform={`rotate(${a * 0.3} ${x} ${y - 128})`} stroke={i % 2 ? '#2f7a3a' : '#4fa055'} strokeWidth={5} fill="none" strokeLinecap="round" />;
      })}
    </g>
  );
};

/** Sophie: white dress, wide white hat with feathers. */
const Duchess: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => (
  <g>
    <path d={`M${x - 24},${y} L${x - 20},${y - 66} Q${x},${y - 78} ${x + 20},${y - 66} L${x + 24},${y} Z`} fill="url(#dressWhite)" stroke={INK} strokeWidth={2.5} />
    <path d={`M${x - 12},${y - 60} q12,10 24,0`} fill="none" stroke="#c9c0ae" strokeWidth={2} />
    <Head x={x} y={y - 92} r={18} skin="#e0bfa4" />
    <path d={`M${x - 15},${y - 98} q15,-12 30,0`} fill="#4a3424" />
    <ellipse cx={x} cy={y - 108} rx={44} ry={9} fill="#fbf8f0" stroke={INK} strokeWidth={2.5} transform={`rotate(${-4 + 2 * Math.sin(t / 9)} ${x} ${y - 108})`} />
    <path d={`M${x - 18},${y - 110} Q${x},${y - 134} ${x + 18},${y - 110} Z`} fill="#fbf8f0" stroke={INK} strokeWidth={2.5} />
    <path d={`M${x + 10},${y - 126} q16,-14 30,-6`} stroke="#e8e2d2" strokeWidth={6} fill="none" strokeLinecap="round" transform={`rotate(${4 * Math.sin(t / 5)} ${x + 10} ${y - 126})`} />
  </g>
);

/** Officer / driver: dark tunic, peaked cap. */
const Officer: React.FC<{ x: number; y: number; t: number; cap?: string; tunic?: string; arm?: 'wheel' | 'point' | 'none'; look?: number; plume?: boolean }> = ({ x, y, t, cap = '#1a1410', tunic = '#2a2a2e', arm = 'none', look = 1, plume }) => (
  <g>
    <path d={`M${x - 22},${y} L${x - 20},${y - 64} Q${x},${y - 76} ${x + 20},${y - 64} L${x + 22},${y} Z`} fill={tunic} stroke={INK} strokeWidth={2.5} />
    {arm === 'wheel' && <path d={`M${x + 14},${y - 58} L${x + 44},${y - 40}`} stroke={tunic} strokeWidth={12} strokeLinecap="round" />}
    {arm === 'point' && <path d={`M${x + 14 * look},${y - 60} L${x + 62 * look},${y - 78 + 4 * Math.sin(t / 2)}`} stroke={tunic} strokeWidth={12} strokeLinecap="round" />}
    <Head x={x} y={y - 88} r={17} look={look} />
    <path d={`M${x - 18},${y - 98} L${x + 18},${y - 98} L${x + 14},${y - 112} L${x - 14},${y - 112} Z`} fill={cap} stroke={INK} strokeWidth={2} />
    <path d={`M${x + 8 * look},${y - 98} l${16 * look},3`} stroke={cap} strokeWidth={5} />
    {plume && <path d={`M${x},${y - 112} q-8,-22 -22,-24`} stroke="#3e8a46" strokeWidth={5} fill="none" />}
  </g>
);

// ------------------------------------------------------------------ the car
export type Occupants = 'royal' | 'escort' | 'royal+governor';
/** Side view, facing right. (x, ground) = rear-wheel ground contact. dist drives wheel rotation. */
export const TouringCar: React.FC<{ x: number; ground?: number; dist: number; t: number; who?: Occupants; wave?: number; pitch?: number; scale?: number; driverLook?: number; shout?: number; flag?: boolean; exhaust?: number }> = ({
  x, ground = 1290, dist, t, who = 'royal', wave = 0, pitch = 0, scale = 1.55, driverLook = 1, shout = 0, flag = true, exhaust = 0,
}) => {
  const R = 52;
  const rot = (dist / R) * (180 / Math.PI);
  const bob = 2.5 * noise1(t * 0.4, 7) * (Math.abs(dist) > 0 ? 1 : 0);
  const wheel = (cx: number) => (
    <g transform={`translate(${cx},${-R})`}>
      <circle r={R} fill="url(#tire)" />
      <circle r={R - 9} fill="#4a3a2a" stroke="#0c0906" strokeWidth={3} />
      <g transform={`rotate(${rot})`}>{Array.from({ length: 12 }, (_, i) => <line key={i} x1={0} y1={0} x2={Math.cos((i / 12) * Math.PI * 2) * (R - 10)} y2={Math.sin((i / 12) * Math.PI * 2) * (R - 10)} stroke="#d8c8a0" strokeWidth={4} />)}</g>
      <circle r={13} fill="url(#brass)" stroke={INK} strokeWidth={2} />
    </g>
  );
  return (
    <g transform={`translate(${x},${ground}) scale(${scale})`}>
      <defs>
        <linearGradient id="carBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3d5446" /><stop offset="0.35" stopColor="#24332a" /><stop offset="1" stopColor="#0e1511" /></linearGradient>
        <linearGradient id="brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f3dc9a" /><stop offset="0.5" stopColor="#b58a3a" /><stop offset="1" stopColor="#6a4a18" /></linearGradient>
        <linearGradient id="leather" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8a3a2a" /><stop offset="1" stopColor="#3a140e" /></linearGradient>
        <linearGradient id="tunicBlue" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#6f93b8" /><stop offset="0.7" stopColor="#a9c6e2" /><stop offset="1" stopColor="#d6e6f4" /></linearGradient>
        <linearGradient id="dressWhite" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#cfc8b8" /><stop offset="0.8" stopColor="#fbf8f0" /><stop offset="1" stopColor="#fff" /></linearGradient>
        <radialGradient id="tire"><stop offset="0.75" stopColor="#14100c" /><stop offset="0.92" stopColor="#3a3028" /><stop offset="1" stopColor="#0a0806" /></radialGradient>
      </defs>
      <ellipse cx={320} cy={4} rx={340} ry={16} fill="rgba(0,0,0,0.45)" />
      {exhaust > 0 && Array.from({ length: 6 }, (_, i) => {
        const k = ((t * 0.08 + i / 6) % 1);
        return <circle key={i} cx={-10 - k * 120} cy={-60 - k * 40} r={8 + k * 30} fill={`rgba(120,110,100,${(1 - k) * 0.45 * exhaust})`} />;
      })}
      {wheel(110)}{wheel(520)}
      <g transform={`translate(0,${bob}) rotate(${pitch} 320 -100)`}>
        {/* body */}
        <path d={`M30,-80 Q20,-150 70,-150 L420,-150 L420,-128 L600,-126 Q624,-124 624,-100 L624,-80 Z`} fill="url(#carBody)" stroke={INK} strokeWidth={3} />
        <path d="M40,-140 L410,-140" stroke="rgba(255,240,210,0.25)" strokeWidth={3} />
        <path d="M430,-118 L612,-116" stroke="rgba(255,240,210,0.25)" strokeWidth={3} />
        <path d="M30,-80 Q20,-150 70,-150 L420,-150" fill="none" stroke="rgba(255,226,170,0.5)" strokeWidth={3} />
        <path d="M60,-110 L400,-110" stroke="#b58a3a" strokeWidth={3} opacity={0.8} />
        {Array.from({ length: 6 }, (_, i) => <line key={i} x1={470 + i * 22} y1={-122} x2={470 + i * 22} y2={-90} stroke="#0e1410" strokeWidth={3} />)}
        <rect x={618} y={-158} width={14} height={86} rx={4} fill="url(#brass)" stroke={INK} strokeWidth={2} />
        <circle cx={636} cy={-138} r={14} fill="url(#brass)" stroke={INK} strokeWidth={3} /><circle cx={639} cy={-138} r={8} fill="#fff6d8" />
        {/* fenders + running board */}
        <path d={`M40,-70 Q110,-140 180,-70`} fill="none" stroke="#1f2a24" strokeWidth={12} />
        <path d={`M450,-70 Q520,-140 600,-78`} fill="none" stroke="#1f2a24" strokeWidth={12} />
        <rect x={170} y={-78} width={290} height={9} fill="#2a2a24" stroke={INK} strokeWidth={2} />
        {/* folded roof + windscreen + wheel */}
        <rect x={6} y={-176} width={92} height={30} rx={14} fill="#b7a27c" stroke={INK} strokeWidth={2.5} />
        <path d="M14,-162 L92,-162" stroke="#8c7a5a" strokeWidth={2} />
        <line x1={420} y1={-150} x2={436} y2={-226} stroke="#cfd8d8" strokeWidth={4} opacity={0.7} />
        <circle cx={392} cy={-176} r={16} fill="none" stroke="#2a1c10" strokeWidth={5} />
        <line x1={392} y1={-176} x2={410} y2={-148} stroke="#2a1c10" strokeWidth={5} />
        {/* seats */}
        <path d="M54,-150 L58,-200 L104,-200 L104,-150 Z" fill="url(#leather)" stroke={INK} strokeWidth={2} />
        <path d="M290,-150 L292,-188 L320,-188 L320,-150 Z" fill="url(#leather)" stroke={INK} strokeWidth={2} />
        {/* occupants */}
        {who !== 'escort' && <Duchess x={120} y={-140} t={t} />}
        {who !== 'escort' && <Archduke x={196} y={-140} t={t} wave={wave} />}
        {who === 'royal+governor' && <Officer x={270} y={-140} t={t} look={-1} tunic="#3a4a3a" plume arm={shout > 0 ? 'point' : 'none'} />}
        {who === 'escort' && <><Officer x={140} y={-140} t={t} /><Officer x={220} y={-140} t={t} tunic="#3a4a3a" plume /></>}
        <Officer x={350} y={-140} t={t} arm="wheel" look={driverLook} cap="#14100c" tunic="#1d1d22" />
        {/* pennant */}
        {flag && (
          <g transform="translate(600,-150)">
            <line x1={0} y1={0} x2={0} y2={-70} stroke="#cfc4a0" strokeWidth={4} />
            <path d={`M0,-70 Q${-26},${-66 + 6 * Math.sin(t / 3)} ${-52},${-58 + 4 * Math.sin(t / 3 + 1)} L0,-46 Z`} fill="#e9c235" stroke={INK} strokeWidth={2} />
            <path d={`M0,-62 Q${-22},${-58 + 6 * Math.sin(t / 3)} ${-40},${-55 + 4 * Math.sin(t / 3 + 1)} L0,-52 Z`} fill="#1a1410" />
          </g>
        )}
        {shout > 0 && (
          <g transform={`translate(330,-330) scale(${0.6 + 0.4 * Math.min(1, shout)})`} opacity={Math.min(1, shout * 2)}>
            <path d="M-150,-60 L150,-60 Q170,-60 170,-40 L170,30 Q170,50 150,50 L0,50 L-40,95 L-30,50 L-150,50 Q-170,50 -170,30 L-170,-40 Q-170,-60 -150,-60 Z" fill="#fff" stroke={INK} strokeWidth={5} />
            <text x={0} y={12} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={58} fill={C.accent}>WRONG WAY!</text>
          </g>
        )}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ crowd
/** Foreground crowd: heads, hats and shoulders; some wave hats or small flags. Scrolls with parallax. */
export const Crowd: React.FC<{ scroll: number; y?: number; n?: number; seed?: number; scatter?: number; dark?: number; size?: number }> = ({ scroll, y = 1560, n = 18, seed = 3, scatter = 0, dark = 0.85, size = 1.5 }) => {
  const f = useCurrentFrame();
  const span = 1700;
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      {Array.from({ length: n }, (_, i) => {
        const base = hash01(i, seed) * span;
        const x = ((base - scroll) % span + span) % span - 200;
        const s = (0.85 + 0.4 * hash01(i, seed + 1)) * size;
        const run = scatter * (hash01(i, seed + 6) > 0.5 ? 1 : -1) * (f % 400) * 0;
        const yy = y + 30 * hash01(i, seed + 2) + scatter * -10 * Math.abs(Math.sin(f / 3 + i));
        const waving = hash01(i, seed + 3) > 0.55 && scatter === 0;
        const hat = hash01(i, seed + 4);
        const fl = hash01(i, seed + 5) > 0.7;
        const PAL = ['#2b2420', '#3a2e24', '#22262c', '#4a3626', '#2e2a26', '#3d2a22', '#1f2228', '#463c30'];
        const col = PAL[Math.floor(hash01(i, seed + 9) * PAL.length)];
        const a = waving ? -30 + 30 * Math.sin(f / 4 + i) : 10;
        return (
          <g key={i} transform={`translate(${x + run},${yy}) scale(${s})`}>
            {waving && (
              <g transform={`rotate(${a} 18 -40)`}>
                <path d="M18,-40 L44,-110" stroke={col} strokeWidth={13} strokeLinecap="round" />
                {fl ? <g transform="translate(44,-112)"><line x1={0} y1={0} x2={0} y2={-40} stroke="#d8c8a0" strokeWidth={3} /><rect x={0} y={-40} width={34} height={22} fill={i % 2 ? '#e9c235' : '#c8281e'} /><rect x={0} y={-29} width={34} height={11} fill={i % 2 ? '#1a1410' : '#f3ead8'} /></g>
                  : <ellipse cx={46} cy={-116} rx={16} ry={6} fill="#1a1410" />}
              </g>
            )}
            <path d="M-34,40 Q-34,-38 0,-42 Q34,-38 34,40 Z" fill={col} />
            <circle cx={0} cy={-62} r={21} fill={col} />
            {hat < 0.35 ? <path d="M-24,-70 L24,-70 L18,-90 L-18,-90 Z" fill="#0d0a07" /> : hat < 0.6 ? <ellipse cx={0} cy={-74} rx={30} ry={8} fill="#0d0a07" /> : hat < 0.75 ? <path d="M-18,-72 L18,-72 L18,-86 Q0,-94 -18,-86 Z" fill="#7a2018" /> : null}
            <path d="M-34,40 Q-34,-38 0,-42" fill="none" stroke={RIM} strokeWidth={3} />
          </g>
        );
      })}
    </svg>
  );
};

// ------------------------------------------------------------------ assassins (side view)
/** Standing young man in a dark suit facing left. throwArm: 0..1 (overhand throw); aim: 0..1 (raise pistol); step: px forward. */
export const Assassin: React.FC<{ x: number; ground?: number; throwArm?: number; aim?: number; step?: number; scale?: number; rim?: number; cap?: boolean }> = ({
  x, ground = 1600, throwArm = 0, aim = 0, step = 0, scale = 1.6, rim = 1, cap,
}) => {
  const f = useCurrentFrame();
  const breathe = 1.5 * Math.sin(f / 14);
  const armA = throwArm > 0 ? -150 + 240 * throwArm : 18 + 82 * aim; // degrees clockwise from straight down; + swings forward (left)
  const legL = step > 0 ? -8 * Math.sin(Math.min(1, step / 40) * Math.PI) : 0;
  return (
    <g transform={`translate(${x - step},${ground}) scale(${scale})`}>
      <ellipse cx={0} cy={4} rx={60} ry={10} fill="rgba(0,0,0,0.35)" />
      <path d={`M-14,0 L-10,-150 M14,0 L8,-150`} stroke={INK} strokeWidth={22} strokeLinecap="round" transform={`rotate(${legL} 0 -150)`} />
      <path d={`M-34,-150 L-30,-${300 + breathe} Q0,-${318 + breathe} 30,-${300 + breathe} L34,-150 Z`} fill="#17120e" stroke={INK} strokeWidth={3} />
      <path d={`M30,-${300 + breathe} L34,-150`} stroke={`rgba(255,214,160,${0.5 * rim})`} strokeWidth={4} />
      <path d="M-8,-292 L0,-262 L8,-292" fill="#e9e2d0" />
      <path d="M-4,-262 L-2,-170" stroke="#2c241c" strokeWidth={3} />
      {[0, 1, 2].map((i) => <circle key={i} cx={-6} cy={-250 + i * 30} r={3.5} fill="#3a3028" />)}
      <path d="M-34,-150 L-30,-215 L30,-215 L34,-150" fill="none" stroke="#0b0806" strokeWidth={3} opacity={0.6} />
      <g transform={`rotate(${armA} -20 -${288 + breathe})`}>
        <path d={`M-20,-${288 + breathe} L-20,-${168 + breathe}`} stroke={`rgba(255,214,160,${0.55 * rim})`} strokeWidth={26} strokeLinecap="round" />
        <path d={`M-20,-${288 + breathe} L-20,-${168 + breathe}`} stroke="#1c1612" strokeWidth={20} strokeLinecap="round" />
        <circle cx={-20} cy={-(160 + breathe)} r={11} fill="#c9a184" />
        {aim > 0 && <rect x={-30} y={-(152 + breathe)} width={20} height={34} rx={3} fill="#0a0806" stroke={`rgba(255,214,160,${0.7 * rim})`} strokeWidth={2} />}
      </g>
      <ellipse cx={-2} cy={-(346 + breathe)} rx={25} ry={30} fill="#c9a184" stroke={INK} strokeWidth={3} />
      <path d={`M-28,-${356 + breathe} Q-6,-${392 + breathe} 26,-${360 + breathe} L22,-${342 + breathe} Q2,-${362 + breathe} -26,-${344 + breathe} Z`} fill="#1a120c" />
      {cap && <path d={`M-32,-${362 + breathe} L28,-${366 + breathe} Q30,-${384 + breathe} 0,-${386 + breathe} Q-30,-${382 + breathe} -32,-${362 + breathe} Z`} fill="#2a2420" />}
      <path d={`M24,-${352 + breathe} Q30,-${330 + breathe} 20,-${318 + breathe}`} fill="none" stroke={`rgba(255,214,160,${0.6 * rim})`} strokeWidth={4} />
    </g>
  );
};

/** Small black bomb in flight (with a fizzing fuse spark). */
export const Bomb: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const f = useCurrentFrame();
  return (
    <g transform={`translate(${x},${y}) rotate(${f * 25})`}>
      <circle r={15} fill="#111" stroke="#e9b04a" strokeWidth={2} />
      <line x1={0} y1={-15} x2={0} y2={-24} stroke="#5a4a3a" strokeWidth={4} />
      <circle cx={0} cy={-27} r={4 + 3 * hash01(f, 3)} fill="#ffd27a" />
    </g>
  );
};

// ------------------------------------------------------------------ marching columns
/** A column of soldier silhouettes (helmet, pack, rifle) marching right; legs scissor with the step. */
export const Marchers: React.FC<{ y: number; n?: number; spacing?: number; speed?: number; scale?: number; color?: string; o?: number; dir?: 1 | -1 }> = ({
  y, n = 12, spacing = 110, speed = 2.2, scale = 1, color = '#120d09', o = 1, dir = 1,
}) => {
  const f = useCurrentFrame();
  const span = n * spacing;
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: o }}>
      {Array.from({ length: n }, (_, i) => {
        const x0 = ((i * spacing + f * speed * scale) % span + span) % span - spacing;
        const x = dir === 1 ? x0 : 1080 - x0;
        const ph = f / 5 + i * 1.7;
        const l = 18 * Math.sin(ph);
        const b = Math.abs(Math.cos(ph)) * 4;
        return (
          <g key={i} transform={`translate(${x},${y - b * scale}) scale(${dir * scale},${scale})`} fill={color} stroke={color}>
            <path d={`M0,-60 L${l},0`} strokeWidth={11} strokeLinecap="round" />
            <path d={`M0,-60 L${-l},0`} strokeWidth={11} strokeLinecap="round" />
            <path d="M-15,-62 L-13,-122 Q0,-130 15,-122 L15,-62 Z" stroke="none" />
            <rect x={-30} y={-118} width={18} height={40} rx={5} stroke="none" />
            <circle cx={3} cy={-138} r={13} stroke="none" />
            <path d="M-17,-142 Q3,-162 23,-142 Z" stroke="none" />
            <path d="M-19,-142 L25,-142" strokeWidth={4} />
            <path d={`M10,-112 L-8,-190`} strokeWidth={5} />
            <path d={`M8,-118 L${14 + l * 0.3},-82`} strokeWidth={9} strokeLinecap="round" />
          </g>
        );
      })}
    </svg>
  );
};
