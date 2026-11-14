// 12 — The silence: alarms die away, radar steadies, the clock runs on. Slow pull back.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EmergencyLights } from '../components/EmergencyLights';
import { ParallaxScene } from '../components/ParallaxScene';
import { BunkerWide, WallClock } from '../components/Sets';
import { TimelineGraphic } from '../components/TimelineGraphic';
import { SCENES, ease, lin } from '../theme';
import { Box } from './Box';
import { ForegroundConsole } from './common';

export const Scene12: React.FC = () => {
  const f = useCurrentFrame();
  const D = SCENES[11].frames;
  const fade = 1 - ease(f, 0, D * 0.7);
  return (
    <AbsoluteFill style={{ background: '#050505' }}>
      <ParallaxScene
        keys={[{ f: 0, scale: 1.3, y: -40 }, { f: D + 14, scale: 1.0, y: 0 }]}
        layers={[
          { depth: 0.6, node: <AbsoluteFill style={{ filter: `brightness(${0.6 + 0.2 * (1 - fade)})` }}><BunkerWide alarm={fade > 0.5 ? 1 : 0} mapAlarm={fade} startSign={fade * 0.5} turn={1} /></AbsoluteFill> },
          { depth: 1.4, node: <ForegroundConsole y={1580} alarm={fade > 0.5 ? 1 : 0} />, blur: 3 },
        ]}
      />
      <EmergencyLights level={fade * 0.8} period={22} />
      <AbsoluteFill style={{ background: 'rgba(0,0,0,0.35)' }} />
      <Box x={390} y={260} w={300} h={300}><WallClock minutes={14 + lin(f, 0, D) * 16} size={300} /></Box>
      <Box x={90} y={640} w={900} h={160}>
        <TimelineGraphic width={900} labels={['ALERT', '+5 MIN', '+10 MIN', '+15 MIN', '+20 MIN']} p={lin(f, 4, D - 6)} marker={f > D * 0.55 ? 'NO IMPACT' : undefined} />
      </Box>
    </AbsoluteFill>
  );
};
