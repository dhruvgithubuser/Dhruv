import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { ArtDefs, DUSK, GI, Landscape, Sherman } from './components/Art';
import { Fonts } from './components/VoxKit';

const Y = '#ffd84a', RED = '#d8342a', INK = '#111';
const big: React.CSSProperties = { fontFamily: 'Inter', fontWeight: 800, color: Y, WebkitTextStroke: `16px ${INK}`, paintOrder: 'stroke fill', letterSpacing: -6, lineHeight: 0.9, textShadow: '0 14px 40px rgba(0,0,0,0.7)' };
const Stamp: React.FC<{ size: number; style: React.CSSProperties }> = ({ size, style }) => (
  <div style={{ position: 'absolute', fontFamily: 'Inter', fontWeight: 800, fontSize: size, letterSpacing: 4, color: '#fff', background: RED, border: `${size * 0.09}px solid #fff`, padding: `${size * 0.08}px ${size * 0.35}px`, boxShadow: '0 12px 30px rgba(0,0,0,0.55)', whiteSpace: 'nowrap', ...style }}>IT'S RUBBER</div>
);
const Lift: React.FC<{ s: number; x: number; y: number }> = ({ s, x, y }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <Sherman x={0} y={-446} s={1.05} rubber />
    <GI x={-170} y={0} s={1.5} pose="overhead" />
    <GI x={170} y={0} s={1.5} pose="overhead" flip />
  </g>
);

export const ThumbShort: React.FC = () => (
  <AbsoluteFill style={{ background: '#222' }}>
    <Fonts />
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      <ArtDefs />
      <Landscape pal={{ ...DUSK, sunX: 760, sunY: 1050 }} camX={60} horizon={1330} />
      <circle cx={540} cy={1080} r={480} fill="#ffd79a" opacity={0.18} filter="url(#soft2)" />
      <Lift s={1.05} x={540} y={1700} />
    </svg>
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 90% 70% at 50% 55%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)' }} />
    <div style={{ position: 'absolute', left: 0, right: 0, top: 120, textAlign: 'center' }}>
      <div style={{ ...big, fontSize: 330 }}>93 LB</div>
      <div style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 92, color: '#fff', WebkitTextStroke: `10px ${INK}`, paintOrder: 'stroke fill', letterSpacing: 2, marginTop: 10, textShadow: '0 8px 24px rgba(0,0,0,0.7)' }}>SHERMAN TANK?!</div>
    </div>
    <Stamp size={80} style={{ left: 430, top: 930, transform: 'rotate(-8deg)' }} />
    <Img src={staticFile('assets/archival/dummy.png')} style={{ position: 'absolute', left: 40, top: 640, width: 360, transform: 'rotate(-7deg)', filter: 'drop-shadow(0 16px 24px rgba(0,0,0,0.6))' }} />
    <div style={{ position: 'absolute', left: 52, top: 905, fontFamily: 'Plex Mono', fontSize: 24, letterSpacing: 2, color: '#fff', textShadow: '0 2px 8px #000', transform: 'rotate(-7deg)' }}>REAL U.S. ARMY PHOTO</div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 1780, textAlign: 'center', fontFamily: 'Plex Mono', fontWeight: 500, fontSize: 40, letterSpacing: 8, color: '#fff', textShadow: '0 2px 10px #000' }}>WWII · THE GHOST ARMY</div>
  </AbsoluteFill>
);

export const ThumbWide: React.FC = () => (
  <AbsoluteFill style={{ background: '#222' }}>
    <Fonts />
    <svg width={1280} height={720} viewBox="0 0 1280 720" style={{ position: 'absolute', inset: 0 }}>
      <ArtDefs />
      <g transform="scale(1.1852) translate(0,-1080)"><Landscape pal={{ ...DUSK, sunX: 300, sunY: 1250 }} camX={40} horizon={1500} /></g>
      <circle cx={340} cy={420} r={300} fill="#ffd79a" opacity={0.2} filter="url(#soft2)" />
      <Lift s={0.62} x={340} y={700} />
    </svg>
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 90% 80% at 40% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)' }} />
    <div style={{ position: 'absolute', left: 620, top: 90, width: 660, textAlign: 'center' }}>
      <div style={{ ...big, fontSize: 200, WebkitTextStroke: `12px ${INK}`, whiteSpace: 'nowrap' }}>93 LB</div>
      <div style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 62, color: '#fff', WebkitTextStroke: `8px ${INK}`, paintOrder: 'stroke fill', marginTop: 8 }}>SHERMAN TANK?!</div>
    </div>
    <Stamp size={62} style={{ left: 720, top: 470, transform: 'rotate(-6deg)' }} />
  </AbsoluteFill>
);
