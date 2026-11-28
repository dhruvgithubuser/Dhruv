import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { CastDefs, Person } from './components/Cast';
import { Finish, Fonts } from './components/Stage';
import { C, HEAD } from './theme';

/** 16:9 long-form thumbnail: young Washington in the glen at dawn, musket smoke, "15 MINUTES" + a red fuse to "WORLD WAR". */
export const Thumbnail: React.FC = () => (
  <AbsoluteFill style={{ background: C.charcoal }}>
    <Fonts />
    <Img src={staticFile('assets/backgrounds/glen_dawn.jpg')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.4) brightness(0.55) contrast(1.15)' }} />
    <AbsoluteFill style={{ background: 'linear-gradient(90deg, rgba(20,14,8,0.2) 0%, rgba(20,14,8,0.1) 40%, rgba(20,14,8,0.85) 75%)' }} />
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
      <defs><filter id="tsm"><feGaussianBlur stdDeviation="16" /></filter></defs>
      <g filter="url(#tsm)">{Array.from({ length: 9 }, (_, i) => <circle key={i} cx={120 + i * 90} cy={300 + (i % 3) * 40} r={70 + i * 8} fill="rgba(235,228,210,0.35)" />)}</g>
      <CastDefs />
      <Person who="washington" x={560} y={1330} s={2.45} />
    </svg>
    <div style={{ position: 'absolute', right: 70, top: 140, width: 900, textAlign: 'right' }}>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 250, lineHeight: 0.92, color: C.paper, WebkitTextStroke: '8px #120b06', paintOrder: 'stroke fill', textShadow: '0 12px 40px rgba(0,0,0,0.85)' }}><span style={{ color: C.redHi }}>15</span> MINUTES</div>
      <div style={{ height: 14, background: C.redHi, margin: '26px 0 26px 160px' }} />
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 96, lineHeight: 1, color: C.paper, WebkitTextStroke: '5px #120b06', paintOrder: 'stroke fill' }}>→ A WORLD WAR</div>
      <div style={{ marginTop: 40, display: 'inline-block', background: C.paper, padding: '10px 28px', fontFamily: HEAD, fontWeight: 700, fontSize: 60, letterSpacing: 8, color: C.ink }}>1754</div>
    </div>
    <Finish />
  </AbsoluteFill>
);
