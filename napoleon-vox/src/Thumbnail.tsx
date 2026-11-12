import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { Fonts, ICONS, Particles } from './kit';
import { C, HEAD, TYPE } from './theme';

const grain = <Img src={staticFile('assets/textures/grain_3.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'overlay', opacity: 0.16 }} />;
const Polaroid: React.FC<{ x: number; y: number; w: number; h: number; rot: number; cap: string }> = ({ x, y, w, h, rot, cap }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, background: '#f4eedf', padding: 14, paddingBottom: 58, transform: `rotate(${rot}deg)`, boxShadow: '0 24px 50px rgba(0,0,0,0.65)' }}>
    <div style={{ width: w - 28, height: h, overflow: 'hidden' }}>
      <Img src={staticFile('assets/portraits/napoleon.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '42% 22%', transform: 'scale(1.18)', transformOrigin: '42% 30%', filter: 'sepia(0.15) contrast(1.12) saturate(1.05)' }} />
    </div>
    <div style={{ position: 'absolute', left: 22, bottom: 14, fontFamily: TYPE, fontWeight: 700, fontSize: 28, color: C.ink }}>{cap}</div>
  </div>
);
const Stamp: React.FC<{ text: string; x: number; y: number; size: number; rot: number; color?: string; bg?: string }> = ({ text, x, y, size, rot, color = C.redHi, bg = 'rgba(244,238,223,0.92)' }) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg)`, fontFamily: HEAD, fontWeight: 700, fontSize: size, letterSpacing: 3, color, background: bg, border: `${size / 9}px solid ${color}`, padding: `0 ${size * 0.25}px`, whiteSpace: 'nowrap', borderRadius: 6 }}>{text}</div>
);

/** A: "35 DAYS" over burning Moscow — the waiting mistake. */
export const ThumbA: React.FC = () => (
  <AbsoluteFill style={{ background: '#120c08' }}>
    <Fonts />
    <Img src={staticFile('assets/stills/s27_moscow_fire.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '40% 70%', transform: 'scale(1.12)', filter: 'contrast(1.2) saturate(1.35) brightness(1.45)' }} />
    <AbsoluteFill style={{ background: 'linear-gradient(90deg, rgba(10,6,3,0.7) 0%, rgba(10,6,3,0.35) 45%, rgba(10,6,3,0.0) 70%)' }} />
    <Particles kind="embers" n={50} />
    <Polaroid x={835} y={30} w={410} h={460} rot={4} cap="Napoleon, 1812" />
    <Stamp text="MOSCOW 1812" x={1040} y={655} size={52} rot={-6} />
    <div style={{ position: 'absolute', left: 54, top: 70, fontFamily: TYPE, fontWeight: 700, fontSize: 50, letterSpacing: 2, color: C.ink, background: '#efe6d2', padding: '4px 20px', borderLeft: `10px solid ${C.redHi}` }}>HE WAITED</div>
    <div style={{ position: 'absolute', left: 40, top: 130, display: 'flex', alignItems: 'baseline', gap: 18 }}>
      <span style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 400, lineHeight: 1, color: C.gold, WebkitTextStroke: '12px #140c06', paintOrder: 'stroke fill', textShadow: '0 12px 40px rgba(0,0,0,0.85)' }}>35</span>
      <span style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 170, lineHeight: 1, color: '#fff', WebkitTextStroke: '10px #140c06', paintOrder: 'stroke fill', textShadow: '0 12px 40px rgba(0,0,0,0.85)' }}>DAYS</span>
    </div>
    {grain}
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 80% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.5) 100%)' }} />
  </AbsoluteFill>
);

/** B: myth-buster — the winter crossed out (for Test & Compare). */
export const ThumbB: React.FC = () => {
  const Snow = ICONS.snowflake;
  return (
    <AbsoluteFill>
      <Fonts />
      <Img src={staticFile('assets/stills/s35_frozen_soldier.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 35%', filter: 'saturate(0.55) contrast(1.15) brightness(0.9)' }} />
      <AbsoluteFill style={{ background: 'linear-gradient(270deg, rgba(8,12,18,0.88) 0%, rgba(8,12,18,0.6) 45%, rgba(8,12,18,0.0) 75%)' }} />
      <Particles kind="snow" n={70} />
      <div style={{ position: 'absolute', left: 860, top: 40, width: 300, height: 300, filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.6))' }}>
        <svg viewBox="0 0 100 100" width={300} height={300}><Snow c="#dfeaf5" /><path d="M10 10 L90 90 M90 10 L10 90" stroke={C.redHi} strokeWidth="11" strokeLinecap="round" /></svg>
      </div>
      <div style={{ position: 'absolute', right: 50, top: 360, textAlign: 'right' }}>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 132, lineHeight: 0.98, color: '#fff', WebkitTextStroke: '9px #0b0f14', paintOrder: 'stroke fill', textShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>IT WASN'T</div>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 132, lineHeight: 0.98, color: C.gold, WebkitTextStroke: '9px #0b0f14', paintOrder: 'stroke fill', textShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>THE WINTER</div>
      </div>
      {grain}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 80% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.5) 100%)' }} />
    </AbsoluteFill>
  );
};
