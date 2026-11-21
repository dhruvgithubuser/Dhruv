// 15 — Final message: Petrov in silhouette against a peaceful Earth; title; fade to black.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { AnimatedGlobe } from '../components/AnimatedGlobe';
import { DocTitle } from '../components/Captions';
import { CinematicCamera } from '../components/CinematicCamera';
import { Petrov } from '../components/Petrov';
import { SCENES, ease, localF, phrasesOf } from '../theme';
import { Box } from './Box';
import { Stars } from './common';

export const Scene15: React.FC = () => {
  const f = useCurrentFrame();
  const D = SCENES[14].frames;
  const titleAt = localF(15, phrasesOf(15)[2].start) + 30;
  const black = ease(f, D - 18, D);
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Stars seed={33} />
      <CinematicCamera keys={[{ f: 0, scale: 1.25, y: 120 }, { f: D, scale: 1.0, y: 0 }]}>
        <Box x={-210} y={560} w={1500} h={1500}><AnimatedGlobe size={1500} lon0={30 + f * 0.12} lat0={30} warm={1} night={0.35} /></Box>
        <AbsoluteFill style={{ background: 'radial-gradient(ellipse 60% 30% at 50% 62%, rgba(255,190,110,0.45), rgba(0,0,0,0) 70%)', mixBlendMode: 'screen' }} />
        <Box x={270} y={880} w={540} h={720}><Petrov silhouette rim="#ffd08a" id="p15" /></Box>
      </CinematicCamera>
      <Box x={40} y={250} w={1000} h={500} style={{ opacity: 1 - black }}>
        <DocTitle lines={['THE SOLDIER', 'WHO REFUSED', 'TO START', 'WORLD WAR III']} at={titleAt} size={86} />
      </Box>
      <AbsoluteFill style={{ background: '#000', opacity: black }} />
    </AbsoluteFill>
  );
};
