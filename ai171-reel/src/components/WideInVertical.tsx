import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { MONO, ease } from '../theme';

/** A landscape image inside the 9:16 frame: blurred fill behind, the image as a slowly pushing band. */
export const WideInVertical: React.FC<{ file: string; frames: number; credit?: string; y?: number }> = ({ file, frames, credit, y = 560 }) => {
  const f = useCurrentFrame();
  const s = 1.0 * Math.pow(1.18, ease(f, 0, frames));
  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <Img src={staticFile(`stills/${file}`)} style={{ position: 'absolute', inset: -80, width: 'calc(100% + 160px)', height: 'calc(100% + 160px)', objectFit: 'cover', filter: 'blur(28px) brightness(0.55) saturate(1.1)' }} />
      <div style={{ position: 'absolute', left: 0, top: y, width: 1080, height: 720, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
        <Img src={staticFile(`stills/${file}`)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${s})`, transformOrigin: '62% 50%' }} />
      </div>
      {credit && <div style={{ position: 'absolute', left: 40, top: y + 730, fontFamily: MONO, fontSize: 20, color: 'rgba(255,255,255,0.75)', letterSpacing: 1 }}>{credit}</div>}
    </AbsoluteFill>
  );
};
