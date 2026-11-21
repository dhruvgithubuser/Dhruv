// 05 — Alarms erupt: red lights on, the СТАРТ (launch) sign lights, officers turn, fast push + shake.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EmergencyLights } from '../components/EmergencyLights';
import { ParallaxScene } from '../components/ParallaxScene';
import { ParticleSystem } from '../components/ParticleSystem';
import { BunkerWide } from '../components/Sets';
import { SCENES, ease, wordF } from '../theme';
import { ForegroundConsole } from './common';

export const Scene05: React.FC = () => {
  const f = useCurrentFrame();
  const D = SCENES[4].frames;
  const at = wordF(5, 'alarms');
  const on = f >= at ? 1 : 0;
  const turn = ease(f, at + 4, at + 20);
  return (
    <AbsoluteFill style={{ background: '#050505' }}>
      <ParallaxScene
        keys={[{ f: 0, scale: 1.05 }, { f: at, scale: 1.08 }, { f: at + 16, scale: 1.32, y: -40 }, { f: D + 14, scale: 1.4, y: -60 }]}
        shake={[{ at, amp: 16, decay: 9 }]}
        layers={[
          { depth: 0.6, node: <BunkerWide alarm={on} startSign={on ? 0.6 + 0.4 * Math.sin(f / 3) : 0} mapAlarm={on} turn={turn} /> },
          { depth: 0.9, node: <ParticleSystem count={60} seed={5} color="#ffb8a0" /> },
          { depth: 1.5, node: <ForegroundConsole y={1560} alarm={on} />, blur: 3 },
        ]}
      />
      <EmergencyLights level={on} beacons={[{ x: 110, y: 240 }, { x: 970, y: 240 }]} period={16} />
    </AbsoluteFill>
  );
};
