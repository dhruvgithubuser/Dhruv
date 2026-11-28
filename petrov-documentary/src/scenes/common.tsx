import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C, H, W, hash01, noise1 } from '../theme';

/** Dark near-camera console edge with lit buttons: the foreground parallax layer of the bunker. */
export const ForegroundConsole: React.FC<{ y?: number; alarm?: number }> = ({ y = 1500, alarm = 0 }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <path d={`M-60,${y} L${W + 60},${y - 60} L${W + 60},${H} L-60,${H} Z`} fill="#0a0b09" />
      <path d={`M-60,${y} L${W + 60},${y - 60}`} stroke="#3a3d32" strokeWidth="6" />
      {Array.from({ length: 22 }, (_, i) => {
        const x = 40 + i * 48, yy = y + 50 - i * 2.7 + (i % 2) * 40;
        const on = alarm > 0.5 ? Math.floor(frame / 5 + i) % 4 === 0 : hash01(i + Math.floor(frame / 24), 8) > 0.55;
        const col = alarm > 0.5 ? '#ff4a32' : ['#ffcf6a', '#8ff07a', '#ff7a4a'][i % 3];
        return <rect key={i} x={x} y={yy} width="26" height="18" rx="4" fill={on ? col : '#22241e'} filter={on ? 'url(#glow)' : undefined} />;
      })}
      {[180, 520, 860].map((x, i) => (
        <g key={i} transform={`translate(${x},${y + 170})`}>
          <circle r="54" fill="#15170f" stroke="#3a3d32" strokeWidth="5" />
          <line x1="0" y1="0" x2={44 * Math.cos(-2 + noise1(frame * 0.05, i) * 0.6)} y2={44 * Math.sin(-2 + noise1(frame * 0.05, i) * 0.6)} stroke="#e8d9a8" strokeWidth="4" />
        </g>
      ))}
    </svg>
  );
};

export const Stars: React.FC<{ count?: number; seed?: number }> = ({ count = 220, seed = 5 }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <rect width={W} height={H} fill="#030409" />
      {Array.from({ length: count }, (_, i) => (
        <circle key={i} cx={hash01(i, seed) * W} cy={hash01(i, seed + 1) * H} r={0.6 + hash01(i, seed + 2) * 2.2} fill="#fff"
          opacity={(0.3 + 0.7 * hash01(i, seed + 3)) * (0.75 + 0.25 * Math.sin(frame * 0.08 + i))} />
      ))}
    </svg>
  );
};

/** ICBM silhouettes in silos / on launchers, for the "consequences" montage. */
export const MissileSilhouettes: React.FC<{ rise: number; glow: number }> = ({ rise, glow }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <defs>
      <linearGradient id="msky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#120404" /><stop offset="0.45" stopColor={C.redDeep} /><stop offset="0.68" stopColor="#e2461f" /><stop offset="0.74" stopColor="#ff8a3a" /><stop offset="1" stopColor="#2a0905" />
      </linearGradient>
    </defs>
    <rect width={W} height={H} fill="url(#msky)" />
    <ellipse cx="540" cy="1150" rx="700" ry="300" fill={C.redGlow} opacity={0.25 * glow} filter="url(#blur40)" />
    {[{ x: 160, s: 0.7, d: 0 }, { x: 330, s: 0.9, d: 0.1 }, { x: 540, s: 1.1, d: 0.2 }, { x: 750, s: 0.9, d: 0.15 }, { x: 920, s: 0.7, d: 0.05 }].map((m, i) => {
      const r = Math.max(0, Math.min(1, (rise - m.d) / 0.8));
      const h = 760 * m.s;
      const y = 1420 - h * (0.25 + 0.75 * r);
      return (
        <g key={i} transform={`translate(${m.x},${y})`}>
          <path d={`M0,0 C${18 * m.s},${30 * m.s} ${30 * m.s},${80 * m.s} ${30 * m.s},${140 * m.s} L${30 * m.s},${h} L${-30 * m.s},${h} L${-30 * m.s},${140 * m.s} C${-30 * m.s},${80 * m.s} ${-18 * m.s},${30 * m.s} 0,0 Z`} fill="#070202" />
          <path d={`M${-30 * m.s},${h - 80 * m.s} L${-62 * m.s},${h} L${-30 * m.s},${h} Z M${30 * m.s},${h - 80 * m.s} L${62 * m.s},${h} L${30 * m.s},${h} Z`} fill="#070202" />
          <path d={`M${22 * m.s},${60 * m.s} L${28 * m.s},${h}`} stroke="#ff6a4a" strokeWidth="3" opacity={0.5 * glow} />
        </g>
      );
    })}
    <rect x="0" y="1400" width={W} height={H - 1400} fill="#050101" />
    {Array.from({ length: 7 }, (_, i) => <rect key={i} x={60 + i * 150} y={1395} width="110" height="26" fill="#1a0806" />)}
  </svg>
);

/** A soft band of coloured light sweeping across the frame (reflections on desks, radar on faces). */
export const LightSweep: React.FC<{ color: string; period?: number; opacity?: number; angle?: number }> = ({ color, period = 70, opacity = 0.35, angle = 20 }) => {
  const frame = useCurrentFrame();
  const p = (frame % period) / period;
  return (
    <div style={{
      position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity,
      background: `linear-gradient(${90 + angle}deg, rgba(0,0,0,0) ${p * 140 - 40}%, ${color} ${p * 140 - 20}%, rgba(0,0,0,0) ${p * 140}%)`,
    }} />
  );
};

export const fill = (color: string) => <div style={{ position: 'absolute', inset: 0, background: color }} />;
export const blinkAt = (frame: number, at: number[]) => Math.max(0, ...at.map((a) => 1 - Math.abs(frame - a) / 3));
export { noise1 };
