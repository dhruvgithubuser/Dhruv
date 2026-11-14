// 06 — The warning: the satellite system reports launches; five tracks toward Soviet territory.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CinematicCamera } from '../components/CinematicCamera';
import { EmergencyLights } from '../components/EmergencyLights';
import { RadarAnimation } from '../components/RadarAnimation';
import { SCENES, ease, lin } from '../theme';
import { Box } from './Box';

export const Scene06: React.FC = () => {
  const f = useCurrentFrame();
  const D = SCENES[5].frames;
  const tracks = [0, 1, 2, 3, 4].map((i) => lin(f, 30 + i * 22, 90 + i * 22));
  const blink = Math.floor(f / 8) % 2 === 0;
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 40%, #2a0d09 0%, #090303 70%)' }}>
      <CinematicCamera keys={[{ f: 0, scale: 0.92 }, { f: D + 14, scale: 1.22, y: 20 }]}>
        <Box x={60} y={300} w={960} h={960}><RadarAnimation size={960} tracks={tracks} alarm={1} sweepSpeed={4} /></Box>
      </CinematicCamera>
      <Box x={0} y={120} w={1080} h={150} style={{ textAlign: 'center', opacity: ease(f, 6, 16) }}>
        <div style={{ display: 'inline-block', padding: '10px 34px', background: blink ? '#b3261e' : '#5a120d', border: '4px solid #ff6a50', fontFamily: 'Oswald', fontWeight: 700, fontSize: 52, color: '#fff', letterSpacing: 6 }}>MISSILE ATTACK WARNING</div>
        <div style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: 34, color: '#ff8a70', letterSpacing: 10, marginTop: 10 }}>РАКЕТНОЕ НАПАДЕНИЕ</div>
      </Box>
      <Box x={70} y={1170} w={500} h={80} style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: 34, color: '#9cc0ea', letterSpacing: 4, opacity: ease(f, 20, 30) }}>LAUNCH AREA: USA</Box>
      <Box x={600} y={240 + 60} w={420} h={60} style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: 34, color: '#ff8a70', letterSpacing: 4, textAlign: 'right', opacity: ease(f, 24, 34) }}>TARGET: USSR</Box>
      <EmergencyLights level={0.55} period={16} />
    </AbsoluteFill>
  );
};
