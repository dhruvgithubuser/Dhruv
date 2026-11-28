import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { ICONS, Fonts } from './kit';
import { HEAD, SERIF, TYPE } from './theme';

/* Editorial poster thumbnails (channel standard): 3-word headline, hero portrait, the key document, stat box, badge, icon captions. */
const GOLD = '#e8b84a', CREAM = '#f6ecd4', INK = '#0e0a06';
const Headline: React.FC<{ a: string; b: string; size: number }> = ({ a, b, size }) => (
  <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: size, lineHeight: 1.0, textTransform: 'uppercase', textShadow: '0 6px 24px rgba(0,0,0,0.95)' }}>
    <span style={{ color: '#fff' }}>{a} </span><span style={{ color: GOLD }}>{b}</span>
  </div>
);
const IconRow: React.FC<{ icon: string; l1: string; l2: string; s: number }> = ({ icon, l1, l2, s }) => {
  const I = ICONS[icon];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: s * 0.35 }}>
      <div style={{ width: s, height: s, borderRadius: s, border: `3px solid ${GOLD}`, background: 'rgba(14,10,6,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 100 100" width={s * 0.66} height={s * 0.66}><I c={GOLD} /></svg>
      </div>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: s * 0.36, lineHeight: 1.1, color: CREAM, textShadow: '0 2px 8px #000' }}>{l1}<br /><span style={{ color: GOLD }}>{l2}</span></div>
    </div>
  );
};
const Badge: React.FC<{ s: number }> = ({ s }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: s * 0.3 }}>
    <div style={{ width: s, height: s, borderRadius: s, background: `radial-gradient(circle, ${GOLD} 0%, #b07d22 75%)`, border: '3px solid #2a1d12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: s * 0.42, color: INK }}>VC</div>
    <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: s * 0.34, lineHeight: 1.05, color: CREAM, textShadow: '0 2px 8px #000' }}>BOER WAR · WWI<br /><span style={{ color: GOLD }}>WWII · 1899–1945</span></div>
  </div>
);
const Litho: React.FC<{ w: number; h: number; rot: number }> = ({ w, h, rot }) => (
  <div style={{ width: w, height: h, transform: `rotate(${rot}deg)`, background: '#efe2c4', padding: 10, boxShadow: '0 20px 50px rgba(0,0,0,0.85)', position: 'relative' }}>
    <Img src={staticFile('assets/archival/ltcol.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '60% 30%', filter: 'sepia(0.4) contrast(1.15)' }} />
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: -44, textAlign: 'center', fontFamily: TYPE, fontWeight: 700, fontSize: Math.round(w / 13), whiteSpace: 'nowrap', color: GOLD, textShadow: '0 2px 6px #000' }}>BEFORE · 1900s</div>
  </div>
);
const Stat: React.FC<{ s: number }> = ({ s }) => (
  <div style={{ background: 'rgba(14,10,6,0.9)', border: `3px solid ${GOLD}`, padding: `${s * 0.12}px ${s * 0.22}px`, boxShadow: '0 12px 30px rgba(0,0,0,0.7)' }}>
    <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: s, lineHeight: 1, color: '#fff' }}>9 WOUNDS</div>
    <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: s * 0.34, color: CREAM, marginTop: 4 }}>FACE · SKULL · <span style={{ color: GOLD }}>HAND</span></div>
  </div>
);
const Bg: React.FC = () => (
  <AbsoluteFill style={{ background: 'radial-gradient(ellipse 90% 70% at 40% 40%, #4a3320 0%, #1c130b 60%, #070503 100%)' }}>
    <Img src={staticFile('assets/backgrounds/paper.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.12, mixBlendMode: 'overlay' }} />
  </AbsoluteFill>
);
const Bust: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <Img src={staticFile('assets/archival/cairo.jpg')} style={{ position: 'absolute', objectFit: 'cover', objectPosition: '0% 0%', filter: 'sepia(0.45) contrast(1.2) brightness(1.06)', WebkitMaskImage: 'radial-gradient(ellipse 34% 26% at 36% 30%, #000 60%, transparent 100%)', maskImage: 'radial-gradient(ellipse 34% 26% at 36% 30%, #000 60%, transparent 100%)', ...style }} />
);
const Grain = () => <Img src={staticFile('assets/textures/grain_3.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'overlay', opacity: 0.14 }} />;

export const PosterShort: React.FC = () => (
  <AbsoluteFill style={{ background: INK }}>
    <Fonts /><Bg />
    <Bust style={{ left: -230, top: 160, width: 1700, height: 2218 }} />
    <div style={{ position: 'absolute', left: 50, right: 40, top: 60 }}><Headline a="Still not" b="dead." size={170} /></div>
    <div style={{ position: 'absolute', right: 40, top: 480 }}><Badge s={96} /></div>
    <div style={{ position: 'absolute', left: 720, top: 980 }}><Litho w={300} h={380} rot={4} /></div>
    <div style={{ position: 'absolute', left: 40, top: 1490 }}><Stat s={104} /></div>
    <div style={{ position: 'absolute', left: 560, top: 1490, display: 'flex', flexDirection: 'column', gap: 22 }}>
      <IconRow icon="skull" l1="SHOT IN" l2="THE SKULL" s={90} />
      <IconRow icon="vc" l1="VICTORIA" l2="CROSS 1916" s={90} />
    </div>
    <Grain />
  </AbsoluteFill>
);

export const PosterWide: React.FC = () => (
  <AbsoluteFill style={{ background: INK }}>
    <Fonts /><Bg />
    <Bust style={{ left: -170, top: -150, width: 1100, height: 1435 }} />
    <div style={{ position: 'absolute', left: 560, right: 30, top: 24 }}><Headline a="Still not" b="dead." size={96} /></div>
    <div style={{ position: 'absolute', left: 580, top: 250 }}><Litho w={190} h={240} rot={-3} /></div>
    <div style={{ position: 'absolute', right: 30, top: 300 }}><Badge s={56} /></div>
    <div style={{ position: 'absolute', left: 580, top: 545 }}><Stat s={70} /></div>
    <div style={{ position: 'absolute', right: 30, top: 560 }}><IconRow icon="vc" l1="VICTORIA" l2="CROSS 1916" s={64} /></div>
    <Grain />
  </AbsoluteFill>
);
