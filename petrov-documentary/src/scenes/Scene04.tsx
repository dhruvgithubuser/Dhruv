// 04 — Introducing Petrov at his workstation: push toward his face, blinks, hands on the controls.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { LowerThird } from '../components/Captions';
import { ParallaxScene } from '../components/ParallaxScene';
import { ParticleSystem } from '../components/ParticleSystem';
import { Petrov } from '../components/Petrov';
import { RadarAnimation } from '../components/RadarAnimation';
import { BunkerWide } from '../components/Sets';
import { SCENES, wordF } from '../theme';
import { Box } from './Box';
import { ForegroundConsole, LightSweep, blinkAt } from './common';

export const Scene04: React.FC = () => {
  const f = useCurrentFrame();
  const D = SCENES[3].frames;
  const name = wordF(4, 'stanislav');
  const handY = Math.sin(f / 14) * 6;
  return (
    <AbsoluteFill style={{ background: '#070807' }}>
      <ParallaxScene
        keys={[{ f: 0, scale: 1.0, y: 0 }, { f: D + 14, scale: 1.3, y: -150 }]}
        layers={[
          { depth: 0.3, node: <BunkerWide />, blur: 5 },
          { depth: 0.85, node: <Box x={90} y={320} w={900} h={1200}><Petrov light="radar" lightAmt={0.32} gaze={{ x: 0.5, y: 0.6 }} blink={blinkAt(f, [48, 130])} brow={0.35} /></Box> },
          { depth: 1.2, node: (
            <AbsoluteFill>
              <svg width={1080} height={1920}>
                <path d="M-40,1400 L1120,1360 L1120,1920 L-40,1920 Z" fill="#14170f" />
                <path d="M-40,1400 L1120,1360" stroke="#454a3a" strokeWidth="8" />
                {/* hands working the controls */}
                <g transform={`translate(330,${1395 + handY})`}><ellipse rx="70" ry="38" fill="#b07a5c" /><path d="M-60,-10 C-40,0 40,0 60,-10" stroke="#5a3a28" strokeWidth="4" fill="none" /></g>
                <g transform={`translate(720,${1390 - handY})`}><ellipse rx="70" ry="38" fill="#a06c50" /><path d="M-60,-10 C-40,0 40,0 60,-10" stroke="#5a3a28" strokeWidth="4" fill="none" /></g>
              </svg>
              <Box x={760} y={1080} w={300} h={300} style={{ transform: 'rotate(-6deg)' }}><RadarAnimation size={300} showMap={false} labels={false} /></Box>
            </AbsoluteFill>
          ) },
          { depth: 1.5, node: <ForegroundConsole y={1640} />, blur: 4 },
        ]}
      />
      <LightSweep color="rgba(143,240,122,0.5)" period={90} opacity={0.18} />
      <ParticleSystem count={45} seed={4} opacity={0.5} />
      <LowerThird title="Stanislav Petrov" sub="Lt. Colonel · Soviet Air Defence Forces" at={name - 4} out={D} y={240} />
      <LowerThird title="Serpukhov-15" sub="Secret early-warning command centre" at={name + 45} out={D} y={420} />
    </AbsoluteFill>
  );
};
