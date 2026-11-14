import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { MONO, ease } from '../theme';

/**
 * "Drone" shot from a single still: 2.5-D parallax. The still is split (scripts/make-layers.py) into
 * far (full frame), mid and near layers from its depth map; the virtual camera dollies (z) and trucks
 * (x, y) and each layer follows with its own depth factor, so the foreground slides past the background.
 * Plain image layers: deterministic, fast, and identical in preview and render.
 */
export type Cam = { x: number; y: number; z: number };

const LAYERS: [string, number][] = [['', 0.35], ['_mid', 0.7], ['_near', 1.1]];

export const DepthShot: React.FC<{ name: string; frames: number; from: Cam; to: Cam; focus?: number; grade?: string; tag?: boolean }> = ({
  name, frames, from, to, grade = 'contrast(1.08) saturate(0.9) brightness(0.95)', tag = true,
}) => {
  const f = useCurrentFrame();
  const p = ease(f, 0, frames);
  const x = from.x + (to.x - from.x) * p, y = from.y + (to.y - from.y) * p;
  const z = from.z * Math.pow(to.z / from.z, p);
  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <AbsoluteFill style={{ filter: grade }}>
        {LAYERS.map(([suf, k]) => {
          // nearer layers: more travel and a slightly stronger dolly
          const s = 1.06 * (1 + (z - 1) * (0.6 + 0.6 * k));
          const tx = -x * 60 * k, ty = -y * 40 * k;
          return (
            <Img key={suf} src={staticFile(`stills/${name}${suf}.${suf ? 'png' : 'jpg'}`)}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `translate(${tx}px, ${ty}px) scale(${s})`, transformOrigin: '50% 50%' }} />
          );
        })}
      </AbsoluteFill>
      {tag && <div style={{ position: 'absolute', left: 60, bottom: 150, fontFamily: MONO, fontSize: 18, letterSpacing: 3, color: 'rgba(255,255,255,0.55)' }}>DRAMATIZATION · AI-GENERATED IMAGE</div>}
    </AbsoluteFill>
  );
};
