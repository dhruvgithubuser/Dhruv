import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { noise1 } from '../theme';

export type CamKey = { f: number; x?: number; y?: number; scale?: number; rot?: number };

/**
 * Keyframed virtual camera. Scale interpolates in log space (constant-rate dolly), position and
 * rotation with an in-out cubic. Optional controlled shake that decays after `shake.at`.
 * x/y are offsets in px of the camera target from frame centre (positive x = look right).
 */
export const useCamera = (keys: CamKey[], shake?: { at: number; amp: number; decay?: number }[]) => {
  const frame = useCurrentFrame();
  const k = keys.length ? keys : [{ f: 0 }];
  let i = 0;
  while (i < k.length - 2 && frame > k[i + 1].f) i++;
  const a = k[i], b = k[Math.min(i + 1, k.length - 1)];
  const p = a === b ? 0 : interpolate(frame, [a.f, b.f], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  const s0 = a.scale ?? 1, s1 = b.scale ?? s0;
  const scale = s0 * Math.pow(s1 / s0, p);
  const x = (a.x ?? 0) + ((b.x ?? a.x ?? 0) - (a.x ?? 0)) * p;
  const y = (a.y ?? 0) + ((b.y ?? a.y ?? 0) - (a.y ?? 0)) * p;
  const rot = (a.rot ?? 0) + ((b.rot ?? a.rot ?? 0) - (a.rot ?? 0)) * p;
  let sx = 0, sy = 0;
  for (const s of shake ?? []) {
    if (frame < s.at) continue;
    const amp = s.amp * Math.exp(-(frame - s.at) / (s.decay ?? 10));
    sx += amp * noise1(frame * 0.9, 11 + s.at);
    sy += amp * noise1(frame * 0.9, 29 + s.at);
  }
  return { scale, x: x + sx, y: y + sy, rot };
};

export const CinematicCamera: React.FC<{ keys: CamKey[]; shake?: { at: number; amp: number; decay?: number }[]; children: React.ReactNode }> = ({ keys, shake, children }) => {
  const cam = useCamera(keys, shake);
  return (
    <AbsoluteFill style={{ transform: `scale(${cam.scale}) translate(${-cam.x}px, ${-cam.y}px) rotate(${cam.rot}deg)`, transformOrigin: '50% 50%' }}>
      {children}
    </AbsoluteFill>
  );
};
