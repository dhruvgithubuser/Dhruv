// 13 — The satellite error: Sun -> high clouds -> satellite sensor. Educational optical path.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { AnimatedGlobe } from '../components/AnimatedGlobe';
import { CinematicCamera } from '../components/CinematicCamera';
import { Ray, Satellite, Sun } from '../components/SatelliteOrbit';
import { SCENES, ease, hash01, lin } from '../theme';
import { Box } from './Box';
import { Stars } from './common';

const SUN = [170, 300], CLOUD = [430, 1010], SAT = [830, 520];
export const Scene13: React.FC = () => {
  const f = useCurrentFrame();
  const D = SCENES[12].frames;
  const r1 = lin(f, 40, 85), r2 = lin(f, 95, 135);
  const glint = f > 132 ? 0.6 + 0.4 * Math.sin(f / 3) : 0;
  const label = (t: string, x: number, y: number, at: number, color = '#fff') => (
    <div style={{ position: 'absolute', left: x, top: y, fontFamily: 'Oswald', fontWeight: 700, fontSize: 36, letterSpacing: 4, color, opacity: ease(f, at, at + 12), textShadow: '0 3px 12px #000' }}>{t}</div>
  );
  return (
    <AbsoluteFill>
      <Stars seed={9} />
      <CinematicCamera keys={[{ f: 0, scale: 1.12, x: 40 }, { f: D + 14, scale: 1.0, x: 0 }]}>
        <Box x={-560} y={980} w={2200} h={2200}><AnimatedGlobe size={2200} lon0={-100 + f * 0.05} lat0={25} usa={0.25} night={0.65} /></Box>
        {/* high-altitude cloud bank over North America */}
        <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
          {Array.from({ length: 16 }, (_, i) => (
            <ellipse key={i} cx={250 + hash01(i, 3) * 420 + f * 0.15} cy={990 + hash01(i, 4) * 60} rx={60 + hash01(i, 5) * 90} ry={18 + hash01(i, 6) * 16} fill="#f4f7ff" opacity={0.45 + 0.35 * hash01(i, 7)} filter="url(#blur6)" />
          ))}
          <Ray a={SUN} b={CLOUD} p={r1} color="#ffd36a" />
          <Ray a={CLOUD} b={SAT} p={r2} color="#ff6a4a" />
          {r1 >= 1 && <circle cx={CLOUD[0]} cy={CLOUD[1]} r={30 + 10 * Math.sin(f / 4)} fill="#fff6d8" opacity="0.7" filter="url(#glowBig)" />}
        </svg>
        <Box x={SUN[0] - 150} y={SUN[1] - 150} w={300} h={300}><Sun pulse={0.95 + 0.05 * Math.sin(f / 8)} /></Box>
        <Box x={SAT[0] - 180} y={SAT[1] - 180} w={360} h={360} style={{ transform: `translate(${Math.sin(f / 50) * 14}px, ${Math.cos(f / 50) * 10}px)` }}><Satellite rot={20 + f * 0.08} glint={glint} /></Box>
      </CinematicCamera>
      {label('SUN', 110, 470, 30, '#ffd36a')}
      {label('HIGH-ALTITUDE CLOUDS', 250, 1080, 80, '#e8f0ff')}
      {label('SATELLITE SENSOR', 640, 740, 130, '#ff8a70')}
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1190, textAlign: 'center', fontFamily: 'Oswald', fontWeight: 500, fontSize: 32, letterSpacing: 4, color: '#e8b865', opacity: ease(f, 150, 166) }}>REFLECTED SUNLIGHT READ AS ROCKET-ENGINE FLARES</div>
    </AbsoluteFill>
  );
};
