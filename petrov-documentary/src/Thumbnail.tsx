import React from 'react';
import { AbsoluteFill } from 'remotion';
import { FilmGrain } from './components/FilmGrain';
import { Petrov } from './components/Petrov';
import { RadarAnimation } from './components/RadarAnimation';
import { PaintDefs } from './components/Sets';
import { EmergencyLights } from './components/EmergencyLights';
import { Fonts } from './Fonts';
import { Box } from './scenes/Box';

/** Shorts cover in the channel's style: painted portrait, red alarm light, bold outlined caption at the bottom. */
export const Thumbnail: React.FC = () => (
  <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 35%, #3a0d08 0%, #0a0303 75%)' }}>
    <Fonts />
    <PaintDefs />
    <Box x={140} y={160} w={800} h={800} style={{ opacity: 0.55 }}><RadarAnimation size={800} tracks={[1, 1, 1, 1, 1]} alarm={1} labels={false} /></Box>
    <Box x={40} y={520} w={1000} h={1333}><Petrov light="red" lightAmt={0.9} brow={0.85} gaze={{ x: 0.5, y: 0.1 }} id="thumb" /></Box>
    <EmergencyLights level={0.5} />
    <FilmGrain strength={0.8} />
    <Box x={30} y={1460} w={1020} h={360} style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: 128, lineHeight: 1.0, color: '#fff', WebkitTextStroke: '12px #000', paintOrder: 'stroke fill', textTransform: 'uppercase' }}>
        5 Missiles<br /><span style={{ color: '#ffd34d' }}>Incoming</span>
      </div>
    </Box>
  </AbsoluteFill>
);
