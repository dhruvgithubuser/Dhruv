import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { Fonts } from './kit';
import { HEAD } from './theme';

/* Clear thumbnails: dark background, 3 elements only (Custer's face, the readable note, 3 big words). */
const BG: React.FC = () => (
  <AbsoluteFill style={{ background: 'radial-gradient(ellipse 90% 70% at 50% 40%, #4a3320 0%, #1a110a 70%, #0d0805 100%)' }}>
    <Img src={staticFile('assets/textures/grain_3.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'overlay', opacity: 0.18 }} />
  </AbsoluteFill>
);
const Card: React.FC<{ src: string; style: React.CSSProperties; pos?: string }> = ({ src, style, pos = '50% 30%' }) => (
  <div style={{ position: 'absolute', background: '#f4eedf', padding: 12, boxShadow: '0 30px 70px rgba(0,0,0,0.85)', ...style }}>
    <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos }} />
  </div>
);
const Words: React.FC<{ size: number; lines: [string, string][] }> = ({ size, lines }) => (
  <>{lines.map(([t, c]) => <div key={t} style={{ fontFamily: HEAD, fontWeight: 700, fontSize: size, lineHeight: 0.95, color: c, WebkitTextStroke: `${Math.round(size / 18)}px #0d0805`, paintOrder: 'stroke fill', textShadow: '0 10px 30px rgba(0,0,0,0.9)', whiteSpace: 'nowrap' }}>{t}</div>)}</>
);

export const ClearShort: React.FC = () => (
  <AbsoluteFill>
    <Fonts />
    <BG />
    <Card src="assets/archival/note_top.jpg" style={{ left: 60, top: 150, width: 960, height: 420, transform: 'rotate(-3deg)' }} pos="50% 50%" />
    <Card src="assets/archival/custer_bust.jpg" style={{ left: 170, top: 640, width: 740, height: 760, transform: 'rotate(2deg)' }} pos="50% 20%" />
    <div style={{ position: 'absolute', left: 0, right: 0, top: 1410, textAlign: 'center' }}>
      <Words size={190} lines={[['HELP NEVER', '#ffffff'], ['CAME', '#f2c94c']]} />
    </div>
  </AbsoluteFill>
);

export const ClearWide: React.FC = () => (
  <AbsoluteFill>
    <Fonts />
    <BG />
    <Card src="assets/archival/custer_bust.jpg" style={{ left: 40, top: 40, width: 470, height: 640, transform: 'rotate(-2deg)' }} pos="50% 18%" />
    <Card src="assets/archival/note_top.jpg" style={{ left: 560, top: 50, width: 680, height: 290, transform: 'rotate(2deg)' }} pos="50% 50%" />
    <div style={{ position: 'absolute', left: 560, top: 380 }}>
      <Words size={150} lines={[['HELP NEVER', '#ffffff'], ['CAME', '#f2c94c']]} />
    </div>
  </AbsoluteFill>
);
