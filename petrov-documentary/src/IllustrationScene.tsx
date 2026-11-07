import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { ParticleSystem } from './components/ParticleSystem';
import { logZoom } from './theme';

/** When a hand-painted illustration exists for a scene (asset-manifest.json), it plays as a slow push with dust. */
export const IllustrationScene: React.FC<{ src: string; frames: number }> = ({ src, frames }) => {
  const f = useCurrentFrame();
  const s = logZoom(Math.min(1, f / frames), 1.0, 1.14);
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${s})` }} />
      <ParticleSystem count={50} seed={7} />
    </AbsoluteFill>
  );
};
