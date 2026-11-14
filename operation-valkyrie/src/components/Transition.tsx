import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { C, ease, hash01 } from '../theme';

/**
 * Archival paper wipe: a sheet of aged paper with a torn leading edge slides across and reveals the next scene.
 * Used at scene boundaries by <Documentary/>; `kind` picks paper wipe or a red-line wipe.
 */
export const Wipe: React.FC<{ dur: number; kind?: 'paper' | 'red'; dir?: 1 | -1 }> = ({ dur, kind = 'paper', dir = 1 }) => {
  const f = useCurrentFrame();
  const p = ease(f, 0, dur);
  if (p >= 1) return null;
  if (kind === 'red') {
    const x = -200 + 1480 * p;
    return (
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: dir === 1 ? x : 1080 - x, width: 14, background: C.red, boxShadow: '0 0 30px rgba(142,27,22,0.8)' }} />
      </AbsoluteFill>
    );
  }
  // torn edge as an SVG polygon, the sheet covers [edge-1300, edge]
  const edge = -100 + 1400 * p;
  const pts: string[] = [];
  for (let i = 0; i <= 48; i++) { const y = (i / 48) * 1920; pts.push(`${edge + 26 * (hash01(i, 7) - 0.5) + 14 * Math.sin(i * 1.3)},${y}`); }
  const poly = `${edge - 1400},0 ${pts.join(' ')} ${edge - 1400},1920`;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', transform: dir === -1 ? 'scaleX(-1)' : undefined, opacity: p < 0.85 ? 1 : 1 - (p - 0.85) / 0.15 }}>
      <svg width={1080} height={1920}>
        <defs><clipPath id="tear"><polygon points={poly} /></clipPath><filter id="tearShadow"><feDropShadow dx="12" dy="0" stdDeviation="10" floodColor="rgba(20,12,4,0.5)" /></filter></defs>
        <g filter="url(#tearShadow)"><polygon points={poly} fill={C.beige} /></g>
        <foreignObject x={0} y={0} width={1080} height={1920} clipPath="url(#tear)">
          <Img src={staticFile('assets/backgrounds/paper.jpg')} style={{ width: 1080, height: 1920 }} />
        </foreignObject>
      </svg>
    </AbsoluteFill>
  );
};
