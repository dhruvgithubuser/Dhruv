import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C, hash01 } from '../theme';
import { GEO, greatCircle, pathOf, polar } from './geo';
import { MissileTrajectory } from './MissileTrajectory';

// Warning tracks: launch area in Montana (where the 1983 system placed the launches) toward Soviet territory.
export const LAUNCHES = [
  { from: [-111.2, 47.5], to: [37.6, 55.8] },
  { from: [-110.4, 47.9], to: [30.3, 59.9] },
  { from: [-111.9, 47.1], to: [49.1, 55.8] },
  { from: [-110.9, 48.3], to: [60.6, 56.8] },
  { from: [-112.3, 47.7], to: [44.5, 48.7] },
];

/**
 * Circular early-warning CRT: polar map (USA bottom, USSR top), range rings, rotating sweep with a
 * phosphor trail, and up to five warning tracks. `tracks[i]` = draw progress of track i (0..1).
 */
export const RadarAnimation: React.FC<{ size?: number; tracks?: number[]; alarm?: number; showMap?: boolean; sweepSpeed?: number; labels?: boolean }> = ({
  size = 900, tracks = [], alarm = 0, showMap = true, sweepSpeed = 3, labels = true,
}) => {
  const frame = useCurrentFrame();
  const R = size / 2 - 20, cx = size / 2, cy = size / 2;
  const P = polar(cx, cy, R);
  const ang = (frame * sweepSpeed) % 360;
  const ink = alarm > 0.5 ? '#ff6a50' : C.phosphor;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="crt" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={alarm > 0.5 ? '#2a0a06' : '#0c2412'} />
          <stop offset="0.85" stopColor="#030805" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <clipPath id="crtclip"><circle cx={cx} cy={cy} r={R} /></clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={R + 18} fill="#1b1d18" stroke="#3a3d34" strokeWidth="8" />
      <circle cx={cx} cy={cy} r={R} fill="url(#crt)" />
      <g clipPath="url(#crtclip)">
        {showMap && (
          <>
            <path d={pathOf(GEO.land, P)} fill="rgba(80,200,90,0.10)" stroke={ink} strokeWidth="1.6" opacity="0.6" />
            <path d={pathOf(GEO.usa, P)} fill={alarm > 0.5 ? 'rgba(255,70,40,0.18)' : 'rgba(111,143,179,0.2)'} stroke={alarm > 0.5 ? '#ff6a50' : C.usa} strokeWidth="2.4" />
            <path d={pathOf(GEO.ussr, P)} fill="rgba(194,58,44,0.16)" stroke={C.ussr} strokeWidth="2.4" />
          </>
        )}
        {[0.25, 0.5, 0.75, 1].map((k) => <circle key={k} cx={cx} cy={cy} r={R * k} fill="none" stroke={ink} strokeWidth="1.5" opacity="0.35" />)}
        <line x1={cx - R} y1={cy} x2={cx + R} y2={cy} stroke={ink} strokeWidth="1.2" opacity="0.3" />
        <line x1={cx} y1={cy - R} x2={cx} y2={cy + R} stroke={ink} strokeWidth="1.2" opacity="0.3" />
        {/* sweep with phosphor trail */}
        {Array.from({ length: 28 }, (_, i) => {
          const a0 = ((ang - i * 2.2) * Math.PI) / 180, a1 = ((ang - (i + 1) * 2.2) * Math.PI) / 180;
          return <path key={i} d={`M${cx},${cy} L${cx + R * Math.cos(a0)},${cy + R * Math.sin(a0)} L${cx + R * Math.cos(a1)},${cy + R * Math.sin(a1)} Z`} fill={ink} opacity={0.32 * (1 - i / 28) ** 2} />;
        })}
        <line x1={cx} y1={cy} x2={cx + R * Math.cos((ang * Math.PI) / 180)} y2={cy + R * Math.sin((ang * Math.PI) / 180)} stroke={ink} strokeWidth="3" filter="url(#glow)" />
        {/* random returns that light up as the sweep passes */}
        {Array.from({ length: 14 }, (_, i) => {
          const a = hash01(i, 5) * 360, r = (0.2 + hash01(i, 6) * 0.75) * R;
          const since = ((ang - a + 360) % 360) / 360;
          return <circle key={i} cx={cx + r * Math.cos((a * Math.PI) / 180)} cy={cy + r * Math.sin((a * Math.PI) / 180)} r="4" fill={ink} opacity={Math.max(0, 0.9 - since * 1.6)} />;
        })}
        {LAUNCHES.map((l, i) => (
          <MissileTrajectory key={i} pts={greatCircle(l.from, l.to, 40).map(([lo, la]) => P(lo, la))} progress={tracks[i] ?? 0} frame={frame + i * 7} label={labels ? String(i + 1) : undefined} />
        ))}
      </g>
      {/* CRT glass */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#000" strokeWidth="30" opacity="0.4" filter="url(#blur18)" />
      <ellipse cx={cx - R * 0.35} cy={cy - R * 0.45} rx={R * 0.45} ry={R * 0.18} fill="#fff" opacity="0.06" transform={`rotate(-30 ${cx} ${cy})`} />
      {Array.from({ length: 60 }, (_, i) => <line key={i} x1={cx - R} x2={cx + R} y1={cy - R + i * (2 * R / 60)} y2={cy - R + i * (2 * R / 60)} stroke="#000" strokeWidth="1.5" opacity="0.18" />)}
    </svg>
  );
};
