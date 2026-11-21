import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { Fonts } from './kit';
import { C, HEAD, TYPE } from './theme';

const big = (size: number, color: string): React.CSSProperties => ({ fontFamily: HEAD, fontWeight: 700, fontSize: size, lineHeight: 0.95, color, WebkitTextStroke: `${Math.round(size / 26)}px #120c08`, paintOrder: 'stroke fill', textShadow: '0 12px 40px rgba(0,0,0,0.85)' });
const tag = (size: number): React.CSSProperties => ({ fontFamily: TYPE, fontWeight: 700, fontSize: size, letterSpacing: 2, color: C.ink, background: '#efe6d2', padding: '4px 20px', borderLeft: `10px solid ${C.redHi}`, display: 'inline-block' });
const grain = <Img src={staticFile('assets/textures/grain_3.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'overlay', opacity: 0.16 }} />;
const vig = <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 80% at 50% 50%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.55) 100%)' }} />;
const VS: React.FC<{ s: number }> = ({ s }) => (
  <div style={{ width: s, height: s, borderRadius: s, background: C.redHi, border: `${s / 18}px solid #f4eedf`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
    <span style={{ fontFamily: HEAD, fontWeight: 700, fontSize: s * 0.45, color: '#fff' }}>VS</span>
  </div>
);

/** Shorts cover, 1080×1920: the shield wall above, the redcoat below. */
export const ThumbShort: React.FC<{ mode?: 'numbers' | 'stayed' }> = ({ mode = 'numbers' }) => (
  <AbsoluteFill style={{ background: '#120c08' }}>
    <Fonts />
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 960, overflow: 'hidden' }}>
      <Img src={staticFile('assets/stills/r02_charge.png')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 40%', filter: 'contrast(1.15) saturate(1.1) brightness(0.85)' }} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)' }} />
    </div>
    <div style={{ position: 'absolute', left: 0, top: 960, width: 1080, height: 960, overflow: 'hidden' }}>
      <Img src={staticFile('assets/stills/r07_redcoat.png')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '48% 50%', transform: 'scale(1.3)', transformOrigin: '48% 100%', filter: 'contrast(1.12) saturate(1.15) brightness(1.05)' }} />
      <AbsoluteFill style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 45%)' }} />
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 952, height: 16, background: C.redHi }} />
    {mode === 'numbers' ? (<>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center' }}><div style={big(330, '#fff')}>4,000</div></div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1500, textAlign: 'center' }}><div style={big(330, C.gold)}>150</div></div>
      <div style={{ position: 'absolute', left: 420, top: 840 }}><VS s={240} /></div>
    </>) : (<>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 620, textAlign: 'center' }}><div style={big(300, '#fff')}>THEY</div></div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1460, textAlign: 'center' }}><div style={big(300, C.gold)}>STAYED.</div></div>
    </>)}
    <div style={{ position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center' }}><span style={tag(48)}>RORKE'S DRIFT · 1879</span></div>
    {grain}{vig}
  </AbsoluteFill>
);

/** 1280×720 version: redcoat left, the charge right. */
export const ThumbWide: React.FC = () => (
  <AbsoluteFill style={{ background: '#120c08' }}>
    <Fonts />
    <Img src={staticFile('assets/stills/r02_charge.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '60% 40%', filter: 'contrast(1.15) saturate(1.1) brightness(0.8)' }} />
    <div style={{ position: 'absolute', left: 0, top: 0, width: 560, height: 720, overflow: 'hidden', clipPath: 'polygon(0 0, 100% 0, 82% 100%, 0 100%)' }}>
      <Img src={staticFile('assets/stills/r07_redcoat.png')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '47% 50%', transform: 'scale(1.08)', transformOrigin: '47% 100%', filter: 'contrast(1.12) saturate(1.15)' }} />
    </div>
    <svg width={1280} height={720} style={{ position: 'absolute', inset: 0 }}><line x1={560} y1={0} x2={459} y2={720} stroke={C.redHi} strokeWidth={14} /></svg>
    <AbsoluteFill style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 45%)' }} />
    <div style={{ position: 'absolute', left: 40, top: 470 }}><div style={big(230, C.gold)}>150</div></div>
    <div style={{ position: 'absolute', right: 40, top: 470 }}><div style={big(230, '#fff')}>4,000</div></div>
    <div style={{ position: 'absolute', left: 420, top: 470 }}><VS s={150} /></div>
    <div style={{ position: 'absolute', right: 40, top: 40 }}><span style={tag(38)}>RORKE'S DRIFT · 1879</span></div>
    {grain}{vig}
  </AbsoluteFill>
);
