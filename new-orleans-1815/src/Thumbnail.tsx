import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { Fonts } from './components/DocumentaryStage';

// Cover art: real public-domain images — Ralph E. W. Earl, Andrew Jackson (1835) and
// Jean Hyacinthe de Laclotte, The Battle of New Orleans (1815). Text: 2,037 vs 71 + the twist.
const RED = '#e3362c', BLUE = '#7fb2ff', INK = '#0d0b0a', PAPER = '#efe6d2';
const OSW = 'Oswald', MONO = 'Plex Mono', SANS = 'Inter';
const num: React.CSSProperties = { fontFamily: OSW, fontWeight: 700, lineHeight: 0.9, letterSpacing: -2, WebkitTextStroke: `10px ${INK}`, paintOrder: 'stroke fill', textShadow: '0 10px 30px rgba(0,0,0,0.7)' };

const Stamp: React.FC<{ size: number; rot?: number; style?: React.CSSProperties }> = ({ size, rot = -6, style }) => (
  <div style={{ position: 'absolute', transform: `rotate(${rot}deg)`, background: PAPER, border: `${size * 0.12}px solid ${RED}`, padding: `${size * 0.25}px ${size * 0.5}px`, boxShadow: '0 12px 30px rgba(0,0,0,0.6)', ...style }}>
    <div style={{ fontFamily: OSW, fontWeight: 700, fontSize: size, lineHeight: 1.0, color: RED, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>Peace was signed<br />2 weeks earlier</div>
  </div>
);
const Tag: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => (
  <div style={{ position: 'absolute', background: INK, color: '#fff', fontFamily: MONO, fontWeight: 500, fontSize: size, letterSpacing: 3, padding: `${size * 0.3}px ${size * 0.6}px`, ...style }}>JANUARY 8, 1815</div>
);

export const ThumbShort: React.FC = () => (
  <AbsoluteFill style={{ background: INK }}>
    <Fonts />
    <Img src={staticFile('assets/thumb/battle.jpg')} style={{ position: 'absolute', left: -60, top: 0, width: 1200 }} />
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(13,11,10,0.55) 0%, rgba(13,11,10,0.35) 30%, rgba(13,11,10,0.75) 52%, rgba(13,11,10,1) 62%)' }} />
    <Img src={staticFile('assets/thumb/jackson.jpg')} style={{ position: 'absolute', left: -60, top: 760, width: 1520, WebkitMaskImage: 'linear-gradient(180deg, transparent 0px, black 260px)', maskImage: 'linear-gradient(180deg, transparent 0px, black 260px)' }} />
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 70% 40% at 72% 70%, rgba(0,0,0,0) 40%, rgba(13,11,10,0.55) 100%)' }} />
    <Tag size={40} style={{ left: 60, top: 120 }} />
    <div style={{ position: 'absolute', left: 50, top: 250, display: 'flex', alignItems: 'flex-end', gap: 26 }}>
      <div style={{ ...num, fontSize: 330, color: RED }}>2,037</div>
    </div>
    <div style={{ position: 'absolute', left: 64, top: 548, fontFamily: SANS, fontWeight: 800, fontSize: 42, color: '#fff', letterSpacing: 2, textShadow: '0 4px 14px #000' }}>BRITISH CASUALTIES</div>
    <div style={{ position: 'absolute', left: 50, top: 620, display: 'flex', alignItems: 'baseline', gap: 30 }}>
      <div style={{ ...num, fontSize: 150, color: '#fff' }}>vs</div>
      <div style={{ ...num, fontSize: 330, color: BLUE }}>71</div>
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 42, color: '#fff', letterSpacing: 2, textShadow: '0 4px 14px #000', marginLeft: 6 }}>AMERICAN</div>
    </div>
    <Stamp size={66} rot={-5} style={{ left: 60, top: 1600 }} />
  </AbsoluteFill>
);

export const ThumbWide: React.FC = () => (
  <AbsoluteFill style={{ background: INK }}>
    <Fonts />
    <Img src={staticFile('assets/thumb/battle.jpg')} style={{ position: 'absolute', left: 300, top: -90, width: 1050 }} />
    <AbsoluteFill style={{ background: 'linear-gradient(90deg, rgba(13,11,10,1) 30%, rgba(13,11,10,0.55) 55%, rgba(13,11,10,0.45) 100%)' }} />
    <Img src={staticFile('assets/thumb/jackson.jpg')} style={{ position: 'absolute', left: -120, top: 10, width: 800, WebkitMaskImage: 'linear-gradient(90deg, black 70%, transparent 100%)', maskImage: 'linear-gradient(90deg, black 70%, transparent 100%)' }} />
    <Tag size={24} style={{ left: 620, top: 40 }} />
    <div style={{ position: 'absolute', left: 600, top: 78, ...num, fontSize: 230, color: RED, WebkitTextStroke: `8px ${INK}` }}>2,037</div>
    <div style={{ position: 'absolute', left: 612, top: 330, display: 'flex', alignItems: 'baseline', gap: 20 }}>
      <div style={{ ...num, fontSize: 110, color: '#fff', WebkitTextStroke: `7px ${INK}` }}>vs</div>
      <div style={{ ...num, fontSize: 230, color: BLUE, WebkitTextStroke: `8px ${INK}` }}>71</div>
    </div>
    <Stamp size={40} rot={-5} style={{ left: 660, top: 560 }} />
  </AbsoluteFill>
);
