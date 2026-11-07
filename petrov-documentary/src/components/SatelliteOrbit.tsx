import React from 'react';
import { C } from '../theme';

/** Soviet early-warning satellite (US-K / "Oko" class silhouette): body, sensor telescope, panels. */
export const Satellite: React.FC<{ size?: number; glint?: number; rot?: number }> = ({ size = 360, glint = 0, rot = 0 }) => (
  <svg viewBox="-200 -200 400 400" width={size} height={size} style={{ overflow: 'visible' }}>
    <g transform={`rotate(${rot})`}>
      {[-1, 1].map((s) => (
        <g key={s} transform={`translate(${s * 120},0)`}>
          <rect x="-80" y="-34" width="160" height="68" fill="#1d2a44" stroke="#8a9bb8" strokeWidth="3" />
          {Array.from({ length: 6 }, (_, i) => <line key={i} x1={-80 + i * 27} y1="-34" x2={-80 + i * 27} y2="34" stroke="#5a6f96" strokeWidth="2" />)}
          <line x1="-80" y1="0" x2="80" y2="0" stroke="#5a6f96" strokeWidth="2" />
          <rect x="-80" y="-34" width="160" height="30" fill="#9ab6ff" opacity="0.12" />
        </g>
      ))}
      <rect x="-44" y="-70" width="88" height="140" rx="10" fill="#b8a77a" stroke="#6b5f42" strokeWidth="3" />
      <rect x="-44" y="-30" width="88" height="12" fill="#6b5f42" />
      <rect x="-44" y="22" width="88" height="12" fill="#6b5f42" />
      <path d="M-30,70 L30,70 L40,130 L-40,130 Z" fill="#8c8c86" stroke="#4a4a44" strokeWidth="3" />
      <ellipse cx="0" cy="130" rx="40" ry="12" fill="#1a1a18" />
      <ellipse cx="0" cy="130" rx="30" ry="8" fill={glint > 0 ? '#ff5a3c' : '#242424'} opacity={0.5 + glint * 0.5} filter={glint > 0 ? 'url(#glowBig)' : undefined} />
    </g>
  </svg>
);

export const Sun: React.FC<{ size?: number; pulse?: number }> = ({ size = 300, pulse = 1 }) => (
  <svg viewBox="-150 -150 300 300" width={size} height={size} style={{ overflow: 'visible' }}>
    <defs>
      <radialGradient id="sunG"><stop offset="0" stopColor="#fffbe8" /><stop offset="0.35" stopColor="#ffe08a" /><stop offset="0.7" stopColor="#ffb347" stopOpacity="0.5" /><stop offset="1" stopColor="#ff8a20" stopOpacity="0" /></radialGradient>
    </defs>
    <circle r={150 * pulse} fill="url(#sunG)" />
    <circle r="52" fill="#fff6d8" filter="url(#glow)" />
  </svg>
);

/** Labelled educational ray: dashed beam from A to B, revealed to `p`. */
export const Ray: React.FC<{ a: number[]; b: number[]; p: number; color?: string; width?: number }> = ({ a, b, p, color = C.warm, width = 8 }) => {
  if (p <= 0) return null;
  const x = a[0] + (b[0] - a[0]) * p, y = a[1] + (b[1] - a[1]) * p;
  return (
    <g>
      <line x1={a[0]} y1={a[1]} x2={x} y2={y} stroke={color} strokeWidth={width * 3} opacity="0.25" filter="url(#glow)" />
      <line x1={a[0]} y1={a[1]} x2={x} y2={y} stroke={color} strokeWidth={width} strokeDasharray="22 12" strokeLinecap="round" />
      <circle cx={x} cy={y} r={width * 1.6} fill={color} />
    </g>
  );
};
