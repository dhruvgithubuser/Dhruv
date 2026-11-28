import React from 'react';
import { C, FONT_CAPTION } from '../theme';

/** Horizontal documentary timeline: ticks, labels, and a progress fill up to `p` (0..1). */
export const TimelineGraphic: React.FC<{ width: number; labels: string[]; p: number; color?: string; marker?: string }> = ({ width, labels, p, color = C.gold, marker }) => (
  <svg viewBox={`0 0 ${width} 160`} width={width} height={160} style={{ overflow: 'visible' }}>
    <line x1="20" y1="60" x2={width - 20} y2="60" stroke="#ffffff" strokeWidth="4" opacity="0.25" />
    <line x1="20" y1="60" x2={20 + (width - 40) * p} y2="60" stroke={color} strokeWidth="6" filter="url(#glow)" />
    {labels.map((l, i) => {
      const x = 20 + ((width - 40) * i) / (labels.length - 1);
      const on = p >= i / (labels.length - 1) - 1e-3;
      return (
        <g key={i}>
          <circle cx={x} cy="60" r={on ? 12 : 8} fill={on ? color : '#555'} />
          <text x={x} y="120" textAnchor="middle" fontFamily={FONT_CAPTION} fontWeight={700} fontSize="34" fill={on ? '#fff' : '#888'}>{l}</text>
        </g>
      );
    })}
    {marker && <text x={20 + (width - 40) * p} y="30" textAnchor="middle" fontFamily={FONT_CAPTION} fontWeight={700} fontSize="30" fill={color}>{marker}</text>}
  </svg>
);
