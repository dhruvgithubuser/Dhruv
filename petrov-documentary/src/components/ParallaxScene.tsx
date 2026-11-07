import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CamKey, useCamera } from './CinematicCamera';

export type Layer = { depth: number; node: React.ReactNode; blur?: number };

/**
 * 2.5-D parallax: every layer follows the same virtual camera, scaled by its depth
 * (0 = far backdrop, barely moves; 1 = subject plane; >1 = foreground, moves more than the subject).
 */
export const ParallaxScene: React.FC<{ layers: Layer[]; keys: CamKey[]; shake?: { at: number; amp: number; decay?: number }[] }> = ({ layers, keys, shake }) => {
  const cam = useCamera(keys, shake);
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {layers.map((l, i) => {
        const s = 1 + (cam.scale - 1) * l.depth;
        return (
          <AbsoluteFill
            key={i}
            style={{
              transform: `scale(${s}) translate(${-cam.x * l.depth}px, ${-cam.y * l.depth}px) rotate(${cam.rot * l.depth}deg)`,
              transformOrigin: '50% 50%',
              filter: l.blur ? `blur(${l.blur}px)` : undefined,
            }}
          >
            {l.node}
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
