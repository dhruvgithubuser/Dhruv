// 01 — The hook: a lone officer in a gigantic command bunker. Slow push-in, pulsing red, dust, globe behind.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { AnimatedGlobe } from '../components/AnimatedGlobe';
import { EmergencyLights } from '../components/EmergencyLights';
import { ParallaxScene } from '../components/ParallaxScene';
import { ParticleSystem } from '../components/ParticleSystem';
import { BunkerWide, PetrovStanding } from '../components/Sets';
import { SCENES, lin } from '../theme';
import { Box } from './Box';
import { ForegroundConsole } from './common';

export const Scene01: React.FC = () => {
  const f = useCurrentFrame();
  const D = SCENES[0].frames;
  const pulse = 0.25 + 0.2 * Math.sin(f / 9);
  return (
    <AbsoluteFill style={{ background: '#050505' }}>
      <ParallaxScene
        keys={[{ f: 0, scale: 1.0, y: 40 }, { f: D + 14, scale: 1.42, y: 170, x: 0 }]}
        layers={[
          { depth: 0.25, node: <BunkerWide officers={false} /> },
          { depth: 0.35, node: <Box x={240} y={250} w={600} h={600} style={{ opacity: 0.35 * lin(f, 0, 40), mixBlendMode: 'screen' }}><AnimatedGlobe size={600} lon0={-30 + f * 0.35} lat0={55} usa={0.6} ussr={0.6} style="map" /></Box> },
          { depth: 0.75, node: <Box x={430} y={760} w={220} h={587}><PetrovStanding light="red" lightAmt={0.5 + pulse} turn={0} blink={f > 70 && f < 75 ? 1 : 0} /></Box> },
          { depth: 0.8, node: <ParticleSystem count={80} seed={1} /> },
          { depth: 1.5, node: <ForegroundConsole y={1560} />, blur: 3 },
        ]}
      />
      <EmergencyLights level={pulse} beacons={[{ x: 120, y: 260 }, { x: 960, y: 260 }]} />
    </AbsoluteFill>
  );
};
