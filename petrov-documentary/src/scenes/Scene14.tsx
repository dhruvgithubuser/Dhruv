// 14 — Legacy: Petrov walks a dim corridor as red gives way to warm light; pull back to a calm Earth.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { AnimatedGlobe } from '../components/AnimatedGlobe';
import { CinematicCamera } from '../components/CinematicCamera';
import { ParticleSystem } from '../components/ParticleSystem';
import { Corridor, PetrovStanding } from '../components/Sets';
import { SCENES, ease } from '../theme';
import { Box } from './Box';
import { Stars } from './common';

export const Scene14: React.FC = () => {
  const f = useCurrentFrame();
  const D = SCENES[13].frames;
  const warm = ease(f, 10, 70);
  const toEarth = ease(f, D * 0.55, D * 0.8);
  const scale = 1 - 0.15 * (f / D);
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <AbsoluteFill style={{ opacity: 1 - toEarth }}>
        <CinematicCamera keys={[{ f: 0, scale: 1.15 }, { f: D, scale: 1.0 }]}>
          <Corridor warm={warm} frame={f} />
          <Box x={400} y={740 + f * 0.6} w={280} h={747} style={{ transform: `scale(${scale})`, transformOrigin: '50% 100%' }}>
            <PetrovStanding light={warm > 0.5 ? 'warm' : 'red'} lightAmt={0.8} walk={f * 0.16} rim={warm > 0.5 ? '#ffd59a' : '#ff6a4a'} />
          </Box>
          <AbsoluteFill style={{ background: warm > 0 ? `rgba(255,170,80,${0.12 * warm})` : undefined, mixBlendMode: 'screen' }} />
        </CinematicCamera>
        <ParticleSystem count={50} seed={14} color="#ffe2b0" />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: toEarth }}>
        <Stars seed={21} />
        <Box x={90} y={300} w={900} h={900} style={{ transform: `scale(${1.6 - 0.6 * ease(f, D * 0.55, D)})` }}>
          <AnimatedGlobe size={900} lon0={20 + f * 0.2} lat0={35} warm={1} night={0.45} />
        </Box>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
