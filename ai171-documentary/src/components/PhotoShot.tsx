import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { MONO, ease } from '../theme';

/** A real, licensed photograph: slow push only (no depth warping), with its credit on screen. */
export const PhotoShot: React.FC<{ file: string; frames: number; credit: string; from?: number; to?: number; fx?: number; fy?: number }> = ({ file, frames, credit, from = 1.0, to = 1.12, fx = 50, fy = 50 }) => {
  const f = useCurrentFrame();
  const s = from * Math.pow(to / from, ease(f, 0, frames));
  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <Img src={staticFile(`stills/${file}`)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${s})`, transformOrigin: `${fx}% ${fy}%`, filter: 'contrast(1.06) saturate(0.95)' }} />
      <div style={{ position: 'absolute', left: 60, bottom: 150, fontFamily: MONO, fontSize: 18, letterSpacing: 2, color: 'rgba(255,255,255,0.7)', textShadow: '0 1px 6px #000' }}>{credit}</div>
    </AbsoluteFill>
  );
};
