import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';

/** Film finish over everything: grain, vignette, a whisper of halation, optional 2.39:1 letterbox. */
export const Grade: React.FC<{ letterbox?: number }> = ({ letterbox = 0 }) => {
  const f = useCurrentFrame();
  const g = Math.floor(f / 2) % 8;
  const bar = letterbox * (1080 - 1920 / 2.39) / 2;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <Img src={staticFile(`images/textures/grain_${g}.png`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'overlay', opacity: 0.16 }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 75% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)' }} />
      {bar > 0.5 && (<>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: bar, background: '#000' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: bar, background: '#000' }} />
      </>)}
    </AbsoluteFill>
  );
};
