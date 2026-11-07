import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { H, W, hash01, noise1 } from '../theme';

/** Floating dust motes caught in the light: seeded positions, slow drift, twinkle. */
export const ParticleSystem: React.FC<{ count?: number; color?: string; seed?: number; speed?: number; size?: number; opacity?: number }> = ({
  count = 70, color = '#ffe9c8', seed = 3, speed = 1, size = 1, opacity = 0.7,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <radialGradient id={`mote-${seed}`}>
            <stop offset="0" stopColor={color} stopOpacity="1" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>
        {Array.from({ length: count }, (_, i) => {
          const depth = 0.3 + hash01(i, seed + 1) * 0.9;
          const x0 = hash01(i, seed) * W, y0 = hash01(i, seed + 2) * H;
          const t = frame * speed * depth;
          const x = (x0 + t * 0.35 + noise1(t * 0.01 + i, seed) * 40 + W) % W;
          const y = (y0 - t * 0.55 + noise1(t * 0.012 + i * 3, seed + 5) * 30 + H * 4) % H;
          const r = (2 + hash01(i, seed + 3) * 5) * depth * size;
          const tw = 0.4 + 0.6 * Math.abs(Math.sin(frame * 0.05 + i));
          return <circle key={i} cx={x} cy={y} r={r} fill={`url(#mote-${seed})`} opacity={opacity * tw * depth} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};
