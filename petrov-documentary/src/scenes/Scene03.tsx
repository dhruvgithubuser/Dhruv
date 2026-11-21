// 03 — Cold War: the globe divided; USA and USSR light up; bombers, submarines, missile arcs.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { AnimatedGlobe } from '../components/AnimatedGlobe';
import { CinematicCamera } from '../components/CinematicCamera';
import { greatCircle, ortho } from '../components/geo';
import { SCENES, ease, lin } from '../theme';
import { Box } from './Box';
import { Stars } from './common';

const SIZE = 980;
export const Scene03: React.FC = () => {
  const f = useCurrentFrame();
  const D = SCENES[2].frames;
  const lon0 = -35 + f * 0.25, lat0 = 62;
  const P = ortho(SIZE / 2, SIZE / 2, SIZE / 2 - 10, lon0, lat0);
  const arcs = [
    { a: [-100, 45], b: [40, 55] },
    { a: [60, 55], b: [-90, 40] },
  ];
  const plane = (p: number[], ang: number, s = 1, key = 0) => (
    <g key={key} transform={`translate(${p[0]},${p[1]}) rotate(${ang}) scale(${s})`} opacity={p[2] > 0 ? 0.9 : 0}>
      <path d="M18,0 L-10,-3 L-14,-16 L-18,-16 L-16,-2 L-22,-1 L-24,-7 L-27,-7 L-26,0 L-27,7 L-24,7 L-22,1 L-16,2 L-18,16 L-14,16 L-10,3 Z" fill="#f2ead8" />
    </g>
  );
  return (
    <AbsoluteFill>
      <Stars />
      <CinematicCamera keys={[{ f: 0, scale: 1.12 }, { f: D + 14, scale: 1.0 }]}>
        <Box x={50} y={220} w={SIZE} h={SIZE}>
          <AnimatedGlobe size={SIZE} lon0={lon0} lat0={lat0} usa={ease(f, 4, 20)} ussr={ease(f, 10, 26)} night={0.55} />
          <svg width={SIZE} height={SIZE} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            {arcs.map((a, i) => {
              const pts = greatCircle(a.a, a.b, 40).map(([lo, la], k) => { const p = P(lo, la); const lift = Math.sin((k / 40) * Math.PI) * 90; return [p[0], p[1] - lift, p[2]]; });
              const n = Math.max(2, Math.round(lin(f, 14 + i * 6, 50 + i * 6) * 40));
              return <path key={i} d={pts.slice(0, n).map((p, k) => `${k ? 'L' : 'M'}${p[0]},${p[1]}`).join('')} stroke={i ? '#ff6a50' : '#9cc0ea'} strokeWidth="5" fill="none" strokeDasharray="12 8" filter="url(#glow)" />;
            })}
            {[0, 1, 2].map((i) => { const p = P(-40 + i * 25 + f * 0.6, 50 + i * 6); return plane(p, 20 + i * 10, 1.3, i); })}
            {[0, 1].map((i) => { const p = P(-30 + i * 160 + f * 0.25, 30 - i * 5); return p[2] > 0 ? <ellipse key={`s${i}`} cx={p[0]} cy={p[1]} rx="22" ry="6" fill="#0a0f14" stroke="#9cc0ea" strokeWidth="2" opacity="0.8" /> : null; })}
          </svg>
        </Box>
      </CinematicCamera>
      <Box x={70} y={250} w={400} h={80} style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: 54, color: '#9cc0ea', letterSpacing: 6, opacity: ease(f, 6, 18), textShadow: '0 4px 16px #000' }}>USA</Box>
      <Box x={660} y={250} w={350} h={80} style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: 54, color: '#ff7a64', letterSpacing: 6, textAlign: 'right', opacity: ease(f, 12, 24), textShadow: '0 4px 16px #000' }}>USSR</Box>
    </AbsoluteFill>
  );
};
