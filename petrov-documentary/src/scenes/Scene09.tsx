// 09 — Doubt: extreme close-up on Petrov's eyes; radar light crosses his face; the room falls away.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CinematicCamera } from '../components/CinematicCamera';
import { Petrov } from '../components/Petrov';
import { SCENES, ease } from '../theme';
import { Box } from './Box';
import { LightSweep, blinkAt } from './common';

export const Scene09: React.FC = () => {
  const f = useCurrentFrame();
  const D = SCENES[8].frames;
  return (
    <AbsoluteFill style={{ background: '#030303' }}>
      <CinematicCamera keys={[{ f: 0, scale: 1.0 }, { f: D + 14, scale: 1.18, y: -30 }]}>
        <Box x={-930} y={-760} w={2940} h={3920}>
          <Petrov light="radar" lightAmt={0.75} brow={ease(f, 0, D, 0.5, 1)} gaze={{ x: 0.25 - ease(f, 20, 40) * 0.5, y: 0.2 }} blink={blinkAt(f, [D * 0.62])} id="p9" />
        </Box>
      </CinematicCamera>
      <LightSweep color="rgba(143,240,122,0.9)" period={40} opacity={0.4} angle={-10} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 38%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.9) 100%)', opacity: 0.6 + 0.4 * ease(f, 0, D) }} />
    </AbsoluteFill>
  );
};
