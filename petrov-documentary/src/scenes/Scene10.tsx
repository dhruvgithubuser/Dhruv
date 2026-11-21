// 10 — Five missiles: one launch, then four more; then the scale comparison with a real first strike.
import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CinematicCamera } from '../components/CinematicCamera';
import { RadarAnimation } from '../components/RadarAnimation';
import { SCENES, ease, lin, localF, phrasesOf, wordF } from '../theme';
import { Box } from './Box';

const Icon: React.FC<{ color: string; s?: number }> = ({ color, s = 1 }) => (
  <svg width={22 * s} height={60 * s} viewBox="0 0 22 60"><path d="M11,0 C17,8 18,16 18,24 L18,52 L22,60 L0,60 L4,52 L4,24 C4,16 5,8 11,0 Z" fill={color} /></svg>
);

export const Scene10: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const D = SCENES[9].frames;
  const one = wordF(10, 'one');
  const four = wordF(10, 'four');
  const cmp = localF(10, phrasesOf(10)[2].start) - 6;   // "A real American first strike..."
  const five = wordF(10, 'five');
  const tracks = [lin(f, one, one + 45), ...[0, 1, 2, 3].map((i) => lin(f, four + i * 7, four + i * 7 + 45))];
  const count = tracks.filter((t) => t > 0).length;
  const radarOut = ease(f, cmp, cmp + 18);
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 40%, #1e0a07 0%, #060303 75%)' }}>
      <AbsoluteFill style={{ opacity: 1 - radarOut, transform: `translateY(${-radarOut * 300}px)` }}>
        <CinematicCamera keys={[{ f: 0, scale: 1.0 }, { f: four, scale: 1.05 }, { f: cmp, scale: 1.35, y: 120, x: 40 }]}>
          <Box x={60} y={330} w={960} h={960}><RadarAnimation size={960} tracks={tracks} alarm={1} sweepSpeed={4} /></Box>
        </CinematicCamera>
        <Box x={0} y={140} w={1080} h={160} style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: 40, letterSpacing: 6, color: '#ffb8a8' }}>LAUNCHES DETECTED</div>
          <div style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: 120, color: '#fff', lineHeight: 1, textShadow: '0 0 30px #ff3b24', transform: `scale(${1 + 0.25 * Math.max(0, 1 - (f - (count > 1 ? four : one)) / 8)})` }}>{count}</div>
        </Box>
      </AbsoluteFill>
      {/* comparison: five detections vs. the scale of a real first strike (hypothetical) */}
      {f >= cmp && (
        <AbsoluteFill style={{ opacity: ease(f, cmp, cmp + 15) }}>
          <Box x={60} y={230} w={960} h={70} style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: 46, color: '#fff', letterSpacing: 3, textAlign: 'center' }}>WHAT THE SYSTEM SHOWED</Box>
          <Box x={60} y={320} w={960} h={180} style={{ display: 'flex', justifyContent: 'center', gap: 34 }}>
            {[0, 1, 2, 3, 4].map((i) => {
              const k = spring({ frame: f - cmp - 6 - i * 4, fps, config: { damping: 12 } });
              return <div key={i} style={{ transform: `scale(${k})`, filter: f >= five ? 'drop-shadow(0 0 18px #ff3b24)' : undefined }}><Icon color="#ff4a32" s={2.6} /></div>;
            })}
          </Box>
          <Box x={60} y={520} w={960} h={60} style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: 40, color: '#ff8a70', textAlign: 'center', letterSpacing: 4 }}>5 MISSILES</Box>
          <Box x={140} y={610} w={800} h={4} style={{ background: '#ffffff40' }} />
          <Box x={60} y={650} w={960} h={70} style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: 40, color: '#cfd8e0', letterSpacing: 3, textAlign: 'center', opacity: ease(f, cmp + 24, cmp + 36) }}>A REAL FIRST STRIKE (HYPOTHETICAL SCALE)</Box>
          <Box x={110} y={730} w={860} h={470} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', alignContent: 'flex-start' }}>
            {Array.from({ length: 300 }, (_, i) => (
              <div key={i} style={{ opacity: lin(f, cmp + 30 + i * 0.25, cmp + 34 + i * 0.25) * 0.85 }}><Icon color="#8a9aa8" s={0.42} /></div>
            ))}
          </Box>
          <Box x={60} y={1200} w={960} h={60} style={{ fontFamily: 'Oswald', fontWeight: 500, fontSize: 32, color: '#e8b865', textAlign: 'center', letterSpacing: 4, opacity: ease(f, cmp + 70, cmp + 84) }}>HUNDREDS OF MISSILES AT ONCE</Box>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
