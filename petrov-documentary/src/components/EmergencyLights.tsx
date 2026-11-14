import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, noise1 } from '../theme';

/** Red alarm wash: pulsing room light + rotating beacon sweeps. `level` 0..1 fades it in/out. */
export const EmergencyLights: React.FC<{ level: number; beacons?: { x: number; y: number }[]; period?: number }> = ({ level, beacons = [], period = 26 }) => {
  const frame = useCurrentFrame();
  if (level <= 0.001) return null;
  const pulse = 0.55 + 0.45 * Math.max(0, Math.sin((frame / period) * Math.PI * 2));
  const flick = 0.92 + 0.08 * noise1(frame * 0.7, 4);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill style={{ background: C.redDeep, mixBlendMode: 'multiply', opacity: 0.55 * level }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 55% at 50% 20%, ${C.redGlow} 0%, rgba(255,40,20,0) 70%)`, mixBlendMode: 'screen', opacity: 0.45 * level * pulse * flick }} />
      {beacons.map((b, i) => {
        const ang = ((frame * 9 + i * 140) % 360);
        return (
          <AbsoluteFill key={i} style={{ mixBlendMode: 'screen', opacity: 0.55 * level }}>
            <div style={{
              position: 'absolute', left: b.x - 900, top: b.y - 900, width: 1800, height: 1800, borderRadius: '50%',
              background: `conic-gradient(from ${ang}deg, rgba(255,60,30,0.85) 0deg, rgba(255,60,30,0) 38deg, rgba(255,60,30,0) 180deg, rgba(255,60,30,0.85) 180deg, rgba(255,60,30,0) 218deg, rgba(255,60,30,0) 360deg)`,
              filter: 'blur(30px)',
            }} />
            <div style={{ position: 'absolute', left: b.x - 26, top: b.y - 26, width: 52, height: 52, borderRadius: '50%', background: '#ff5a3c', boxShadow: `0 0 ${60 * pulse}px 20px rgba(255,60,30,0.9)` }} />
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
