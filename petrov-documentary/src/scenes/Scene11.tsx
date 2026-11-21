// 11 — The decision: Petrov reports a false alarm, calm, while the lights still flash.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Typewriter } from '../components/Captions';
import { EmergencyLights } from '../components/EmergencyLights';
import { ParallaxScene } from '../components/ParallaxScene';
import { Petrov } from '../components/Petrov';
import { BunkerWide } from '../components/Sets';
import { SCENES, ease, wordF } from '../theme';
import { Box } from './Box';
import { blinkAt } from './common';

export const Scene11: React.FC = () => {
  const f = useCurrentFrame();
  const D = SCENES[10].frames;
  const fa = wordF(11, 'false');
  const handset = ease(f, 0, 16) * (1 - ease(f, D - 34, D - 6));
  const speak = f > 10 && f < D - 34 ? 0.35 + 0.35 * Math.abs(Math.sin(f / 3.2)) : 0;
  return (
    <AbsoluteFill style={{ background: '#080303' }}>
      <ParallaxScene
        keys={[{ f: 0, scale: 1.05, y: 0 }, { f: D + 14, scale: 1.28, y: -110, x: 30 }]}
        layers={[
          { depth: 0.3, node: <BunkerWide alarm={1} mapAlarm={1} turn={1} startSign={0.7} />, blur: 6 },
          { depth: 0.85, node: <Box x={90} y={330} w={900} h={1200}><Petrov light="red" lightAmt={0.35} handset={handset} mouth={speak} brow={0.45} gaze={{ x: -0.2, y: 0 }} blink={blinkAt(f, [D - 50])} id="p11" /></Box> },
        ]}
      />
      <EmergencyLights level={0.6} period={18} />
      <Box x={70} y={250} w={940} h={110} style={{ opacity: ease(f, fa - 6, fa + 4) }}>
        <div style={{ display: 'inline-block', padding: '8px 22px', border: '4px solid #e8b865', background: 'rgba(10,8,6,0.75)' }}>
          <Typewriter text="REPORT: FALSE ALARM" at={fa} cpf={0.9} size={58} color="#ffe2a8" />
        </div>
      </Box>
    </AbsoluteFill>
  );
};
