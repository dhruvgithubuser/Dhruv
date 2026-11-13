import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { Fonts } from './kit';
import { C, HEAD, SERIF, TYPE } from './theme';

const grain = <Img src={staticFile('assets/textures/grain_3.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'overlay', opacity: 0.16 }} />;
const vig = <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 80% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)' }} />;
const Stamp: React.FC<{ text: string; x: number; y: number; size: number; rot: number }> = ({ text, x, y, size, rot }) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg)`, fontFamily: HEAD, fontWeight: 700, fontSize: size, letterSpacing: 4, color: '#d8261c', border: `${size / 10}px solid #d8261c`, padding: `0 ${size * 0.2}px`, background: 'rgba(244,236,218,0.9)', borderRadius: 8, boxShadow: '0 12px 40px rgba(0,0,0,0.6)', whiteSpace: 'nowrap' }}>{text}</div>
);
const Photo: React.FC<{ k: string; x: number; y: number; h: number; rot: number; pos?: string; w?: number }> = ({ k, x, y, h, rot, pos = '50% 25%', w }) => (
  <div style={{ position: 'absolute', left: x, top: y, height: h, width: w, transform: `rotate(${rot}deg)`, border: '12px solid #ece3cf', boxShadow: '0 24px 60px rgba(0,0,0,0.75)', overflow: 'hidden' }}>
    <Img src={staticFile(`assets/archival/${k}.jpg`)} style={{ height: '100%', width: w ? '100%' : undefined, objectFit: 'cover', objectPosition: pos, filter: 'sepia(0.3) contrast(1.15) brightness(1.05)' }} />
  </div>
);

/** A: Custer's real photo over the battlefield, stamped GUILTY? */
export const ThumbA: React.FC = () => (
  <AbsoluteFill style={{ background: '#120c08' }}>
    <Fonts />
    <Img src={staticFile('assets/stills/c31_dust.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.35) contrast(1.15) brightness(0.75)' }} />
    <AbsoluteFill style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0.5) 100%)' }} />
    <Photo k="custer" x={60} y={40} h={640} w={500} rot={-3} pos="50% 18%" />
    <Stamp text="GUILTY?" x={880} y={380} size={170} rot={-9} />
    <div style={{ position: 'absolute', left: 640, top: 560, fontFamily: TYPE, fontWeight: 700, fontSize: 40, letterSpacing: 4, color: '#f4ecda', background: 'rgba(0,0,0,0.6)', padding: '6px 18px', borderLeft: `8px solid ${C.redHi}` }}>LITTLE BIGHORN · 1876</div>
    {grain}{vig}
  </AbsoluteFill>
);

/** B: the man the country blamed, Reno, in the courtroom. */
export const ThumbB: React.FC = () => (
  <AbsoluteFill style={{ background: '#120c08' }}>
    <Fonts />
    <Img src={staticFile('assets/stills/c02_court.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.3) contrast(1.1) brightness(0.6)' }} />
    <AbsoluteFill style={{ background: 'linear-gradient(270deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%)' }} />
    <Photo k="reno" x={70} y={50} h={620} w={480} rot={3} pos="50% 20%" />
    <div style={{ position: 'absolute', right: 40, top: 160, textAlign: 'right' }}>
      <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 96, lineHeight: 0.98, color: '#f4ecda', textShadow: '0 8px 30px #000' }}>THEY BLAMED</div>
      <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 150, lineHeight: 0.98, color: '#f0c96a', textShadow: '0 8px 30px #000' }}>HIM</div>
    </div>
    <Stamp text="ON TRIAL · 1879" x={930} y={560} size={60} rot={-5} />
    {grain}{vig}
  </AbsoluteFill>
);
