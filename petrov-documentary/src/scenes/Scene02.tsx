// 02 — Date reveal: Soviet tear-off calendar turns to 26 September 1983; clock ticking; typed date.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Typewriter } from '../components/Captions';
import { CinematicCamera } from '../components/CinematicCamera';
import { ParticleSystem } from '../components/ParticleSystem';
import { TearCalendar, WallClock } from '../components/Sets';
import { SCENES, ease, noise1 } from '../theme';
import { Box } from './Box';

export const Scene02: React.FC = () => {
  const f = useCurrentFrame();
  const D = SCENES[1].frames;
  const flick = 0.85 + 0.15 * noise1(f * 0.5, 3);
  return (
    <AbsoluteFill style={{ background: '#16130f' }}>
      <CinematicCamera keys={[{ f: 0, scale: 1.0 }, { f: D + 14, scale: 1.18, y: -40 }]}>
        <AbsoluteFill style={{ background: 'radial-gradient(ellipse 70% 50% at 45% 35%, #4a3d2c 0%, #1e1912 60%, #0b0907 100%)' }} />
        {/* painted wall planks */}
        {Array.from({ length: 9 }, (_, i) => <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: i * 220, height: 4, background: '#000', opacity: 0.25 }} />)}
        <Box x={190} y={250} w={520} h={680} style={{ transform: 'rotate(-2deg)' }}><TearCalendar peel={ease(f, 2, 26)} /></Box>
        <Box x={740} y={170} w={260} h={260}><WallClock minutes={14 + f / 30 / 60 * 8} size={260} /></Box>
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 45% at 40% 35%, rgba(255,210,150,${0.25 * flick}) 0%, rgba(0,0,0,0) 70%)`, mixBlendMode: 'screen' }} />
      </CinematicCamera>
      <ParticleSystem count={50} seed={2} />
      <Box x={0} y={1030} w={1080} h={120} style={{ textAlign: 'center' }}><Typewriter text="SEPTEMBER 26, 1983" at={8} cpf={0.7} size={78} color="#f3e7cf" /></Box>
      <Box x={0} y={1140} w={1080} h={60} style={{ textAlign: 'center', fontFamily: 'Oswald', fontWeight: 500, fontSize: 34, letterSpacing: 6, color: '#e8b865', opacity: ease(f, 40, 60) }}>SOVIET UNION · JUST AFTER MIDNIGHT</Box>
    </AbsoluteFill>
  );
};
