import React from 'react';
import { C } from '../theme';

/**
 * One warning track: a glowing path drawn to `progress` (0..1) with a pulsing head marker.
 * `pts` are screen points. `label` (e.g. "1") rides beside the launch point.
 */
export const MissileTrajectory: React.FC<{ pts: number[][]; progress: number; frame: number; color?: string; label?: string; width?: number }> = ({ pts, progress, frame, color = C.redGlow, label, width = 5 }) => {
  if (progress <= 0) return null;
  const n = Math.max(2, Math.round(progress * (pts.length - 1)) + 1);
  const shown = pts.slice(0, n);
  const d = shown.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
  const head = shown[shown.length - 1];
  const prev = shown[Math.max(0, shown.length - 2)];
  const ang = (Math.atan2(head[1] - prev[1], head[0] - prev[0]) * 180) / Math.PI;
  const pulse = 0.6 + 0.4 * Math.sin(frame * 0.4);
  return (
    <g>
      <path d={d} stroke={color} strokeWidth={width * 3} fill="none" opacity="0.25" filter="url(#glow)" strokeLinecap="round" />
      <path d={d} stroke={color} strokeWidth={width} fill="none" strokeDasharray="14 8" strokeLinecap="round" />
      <circle cx={pts[0][0]} cy={pts[0][1]} r={10} fill="none" stroke={color} strokeWidth="3" />
      {label && <text x={pts[0][0] - 30} y={pts[0][1] + 10} fontFamily="Oswald" fontWeight={700} fontSize="30" fill={color} textAnchor="end">{label}</text>}
      <g transform={`translate(${head[0]},${head[1]}) rotate(${ang})`}>
        <circle r={22 * pulse} fill={color} opacity="0.25" />
        <path d="M14,0 L-12,-8 L-8,0 L-12,8 Z" fill="#ffd9cf" />
      </g>
    </g>
  );
};
