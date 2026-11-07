import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';

/** Painted-canvas texture, cycling film grain, vignette and a faint gate weave. */
export const FilmGrain: React.FC<{ strength?: number; vignette?: number }> = ({ strength = 1, vignette = 0.75 }) => {
  const frame = useCurrentFrame();
  const g = Math.floor(frame / 2) % 8;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <Img src={staticFile('images/textures/canvas.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'overlay', opacity: 0.32 * strength }} />
      <Img
        src={staticFile(`images/textures/grain_${g}.png`)}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'overlay', opacity: 0.22 * strength, imageRendering: 'pixelated' }}
      />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 60% at 50% 46%, rgba(0,0,0,0) 45%, rgba(0,0,0,${vignette}) 100%)` }} />
    </AbsoluteFill>
  );
};
