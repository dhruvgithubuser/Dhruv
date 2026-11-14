// 07 — Procedure: Petrov beside the secure line. Camera drifts toward the red phone and his hand.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EmergencyLights } from '../components/EmergencyLights';
import { ParallaxScene } from '../components/ParallaxScene';
import { Petrov } from '../components/Petrov';
import { BunkerWide, RedPhone } from '../components/Sets';
import { SCENES, ease } from '../theme';
import { Box } from './Box';
import { LightSweep, blinkAt } from './common';

export const Scene07: React.FC = () => {
  const f = useCurrentFrame();
  const D = SCENES[6].frames;
  const reach = ease(f, D * 0.45, D * 0.95);
  return (
    <AbsoluteFill style={{ background: '#080303' }}>
      <ParallaxScene
        keys={[{ f: 0, scale: 1.0, x: -60 }, { f: D + 14, scale: 1.35, x: 180, y: 160 }]}
        layers={[
          { depth: 0.3, node: <BunkerWide alarm={1} mapAlarm={1} turn={1} />, blur: 7 },
          { depth: 0.8, node: <Box x={-40} y={300} w={820} h={1093}><Petrov light="red" lightAmt={0.45} turn={0.35} gaze={{ x: 0.8, y: 0.5 }} brow={0.7} blink={blinkAt(f, [60])} id="p7" /></Box> },
          { depth: 1.15, node: (
            <AbsoluteFill>
              <svg width={1080} height={1920}><path d="M-40,1330 L1120,1290 L1120,1920 L-40,1920 Z" fill="#160b08" /><path d="M-40,1330 L1120,1290" stroke="#5a2a20" strokeWidth="6" /></svg>
              <Box x={560} y={1080} w={460} h={368}><RedPhone glow={0.6 + 0.4 * Math.sin(f / 6)} /></Box>
              {/* his hand moving toward the receiver */}
              <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
                <g transform={`translate(${360 + reach * 300},${1330 - reach * 120})`}>
                  <path d="M-260,120 L-40,10 L-10,60 L-230,190 Z" fill="#2b3120" />
                  <ellipse cx="0" cy="30" rx="62" ry="40" fill="#a86f52" />
                  <path d="M20,4 C44,0 66,10 70,24 M24,24 C48,22 70,32 72,44 M20,44 C42,44 62,54 64,64" stroke="#6a3e2a" strokeWidth="5" fill="none" />
                </g>
              </svg>
            </AbsoluteFill>
          ) },
        ]}
      />
      <LightSweep color="rgba(255,70,40,0.7)" period={34} opacity={0.3} />
      <EmergencyLights level={0.8} period={16} />
      <Box x={70} y={240} w={940} h={80} style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: 40, letterSpacing: 4, color: '#ffd0c4', opacity: ease(f, 10, 22) }}>PROCEDURE: REPORT TO COMMAND — IMMEDIATELY</Box>
    </AbsoluteFill>
  );
};
