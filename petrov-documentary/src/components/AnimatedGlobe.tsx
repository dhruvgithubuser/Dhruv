import React from 'react';
import { C } from '../theme';
import { GEO, ortho, pathOf } from './geo';

/**
 * Orthographic Earth. lon0/lat0 = the point facing camera. usa/ussr = highlight strength 0..1.
 * `night` darkens the far side with a terminator; `warm` tints the atmosphere gold for the ending.
 */
export const AnimatedGlobe: React.FC<{ size: number; lon0: number; lat0?: number; usa?: number; ussr?: number; night?: number; warm?: number; style?: 'map' | 'space' }> = ({
  size, lon0, lat0 = 30, usa = 0, ussr = 0, night = 0.4, warm = 0, style = 'space',
}) => {
  const R = size / 2 - 10, c = size / 2;
  const P = ortho(c, c, R, lon0, lat0);
  const grat: string[] = [];
  for (let lo = -180; lo < 180; lo += 30) {
    const pts = [] as string[];
    for (let la = -80; la <= 80; la += 5) { const p = P(lo, la); if (p[2] > 0) pts.push(`${pts.length ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`); }
    grat.push(pts.join(''));
  }
  for (let la = -60; la <= 60; la += 30) {
    const pts = [] as string[];
    for (let lo = -180; lo <= 180; lo += 5) { const p = P(lo, la); if (p[2] > 0) pts.push(`${pts.length ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`); else if (pts.length) pts.push(''); }
    grat.push(pts.filter(Boolean).join(''));
  }
  const ocean = style === 'map' ? '#0f1a1c' : '#0d2238';
  const landC = style === 'map' ? '#33402c' : '#3b4a2e';
  const atm = warm > 0 ? `rgba(255,190,110,${0.35 + 0.4 * warm})` : 'rgba(110,170,255,0.45)';
  const id = `g${Math.round(size)}`;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={`${id}atm`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.86" stopColor={atm} stopOpacity="0" /><stop offset="0.93" stopColor={atm} /><stop offset="1" stopColor={atm} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}shade`} cx="0.32" cy="0.3" r="0.85">
          <stop offset="0" stopColor="#fff" stopOpacity={0.14 + warm * 0.12} /><stop offset="0.55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity={night} />
        </radialGradient>
        <clipPath id={`${id}clip`}><circle cx={c} cy={c} r={R} /></clipPath>
      </defs>
      <circle cx={c} cy={c} r={R * 1.08} fill={`url(#${id}atm)`} />
      <circle cx={c} cy={c} r={R} fill={ocean} />
      <g clipPath={`url(#${id}clip)`}>
        <path d={grat.join('')} stroke="#7fa0b8" strokeWidth="1" fill="none" opacity="0.18" />
        <path d={pathOf(GEO.land, P)} fill={landC} stroke="#7d8c62" strokeWidth="1.2" />
        {usa > 0 && <path d={pathOf(GEO.usa, P)} fill={C.usa} opacity={0.85 * usa} stroke="#cfe0f5" strokeWidth="2" filter="url(#glow)" />}
        {ussr > 0 && <path d={pathOf(GEO.ussr, P)} fill={C.ussr} opacity={0.85 * ussr} stroke="#ffb0a0" strokeWidth="2" filter="url(#glow)" />}
        {warm > 0 && <circle cx={c} cy={c} r={R} fill="#ffb060" opacity={0.12 * warm} />}
      </g>
      <circle cx={c} cy={c} r={R} fill={`url(#${id}shade)`} />
    </svg>
  );
};
