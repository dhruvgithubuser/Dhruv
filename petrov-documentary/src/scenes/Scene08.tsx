// 08 — Consequences: the red telephone in front of missile silhouettes rising through smoke.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { ParallaxScene } from '../components/ParallaxScene';
import { ParticleSystem } from '../components/ParticleSystem';
import { RedPhone } from '../components/Sets';
import { SCENES, ease, hash01, lin, noise1, wordF } from '../theme';
import { Box } from './Box';
import { MissileSilhouettes } from './common';

const Smoke: React.FC<{ f: number; seed: number; opacity: number }> = ({ f, seed, opacity }) => (
  <svg width={1080} height={1920}>
    {Array.from({ length: 14 }, (_, i) => {
      const x = hash01(i, seed) * 1300 - 110 + f * (0.6 + hash01(i, seed + 1));
      const y = 900 + hash01(i, seed + 2) * 700 + noise1(f * 0.02 + i, seed) * 40;
      const r = 160 + hash01(i, seed + 3) * 220;
      return <circle key={i} cx={x % 1300 - 110} cy={y} r={r} fill="#2a1410" opacity={opacity * (0.4 + hash01(i, seed + 4) * 0.5)} filter="url(#blur40)" />;
    })}
  </svg>
);

export const Scene08: React.FC = () => {
  const f = useCurrentFrame();
  const D = SCENES[7].frames;
  const hit = wordF(8, 'catastrophe.');
  const glow = ease(f, 0, D) * 0.8 + 0.2 + (f >= hit ? 0.4 * Math.exp(-(f - hit) / 8) : 0);
  return (
    <AbsoluteFill style={{ background: '#070202' }}>
      <ParallaxScene
        keys={[{ f: 0, scale: 1.05, x: -90, rot: -1.2 }, { f: D + 14, scale: 1.22, x: 90, rot: 1.2 }]}
        shake={[{ at: hit, amp: 14, decay: 8 }]}
        layers={[
          { depth: 0.35, node: <MissileSilhouettes rise={lin(f, 0, D * 0.8)} glow={glow} /> },
          { depth: 0.6, node: <Smoke f={f} seed={3} opacity={0.35} /> },
          { depth: 0.9, node: <ParticleSystem count={60} seed={8} color="#ff9a7a" speed={1.5} /> },
          { depth: 1.3, node: <Box x={200} y={1040} w={680} h={544}><RedPhone glow={glow} /></Box> },
          { depth: 1.6, node: <Smoke f={f * 1.4} seed={9} opacity={0.5} />, blur: 6 },
        ]}
      />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 70%, rgba(255,60,30,0.35), rgba(0,0,0,0) 60%)', mixBlendMode: 'screen', opacity: glow }} />
      {f >= hit && <AbsoluteFill style={{ background: '#ffddc8', opacity: Math.max(0, 0.55 - (f - hit) * 0.08) }} />}
    </AbsoluteFill>
  );
};
