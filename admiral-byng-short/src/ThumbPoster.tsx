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
    <div style={{ width: s, height: s, borderRadius: s, background: `radial-gradient(circle, ${GOLD} 0%, #b07d22 75%)`, border: '3px solid #2a1d12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: s * 0.5, color: INK }}>⚓</div>
    <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: s * 0.34, lineHeight: 1.05, color: CREAM, textShadow: '0 2px 8px #000' }}>HMS MONARCH<br /><span style={{ color: GOLD }}>14 MARCH 1757</span></div>
  </div>
);
const Litho: React.FC<{ w: number; h: number; rot: number }> = ({ w, h, rot }) => (
  <div style={{ width: w, height: h, transform: `rotate(${rot}deg)`, background: '#efe2c4', padding: 10, boxShadow: '0 20px 50px rgba(0,0,0,0.85)', position: 'relative' }}>
    <Img src={staticFile('assets/archival/inset.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 60%', filter: 'sepia(0.4) contrast(1.15)' }} />
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: -44, textAlign: 'center', fontFamily: TYPE, fontWeight: 700, fontSize: Math.round(w / 13), whiteSpace: 'nowrap', color: GOLD, textShadow: '0 2px 6px #000' }}>THE CUSHION · 1757</div>
  </div>
);
const Stat: React.FC<{ s: number }> = ({ s }) => (
  <div style={{ background: 'rgba(14,10,6,0.9)', border: `3px solid ${GOLD}`, padding: `${s * 0.12}px ${s * 0.22}px`, boxShadow: '0 12px 30px rgba(0,0,0,0.7)' }}>
    <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: s, lineHeight: 1, color: '#fff' }}>1 BATTLE LOST</div>
    <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: s * 0.34, color: CREAM, marginTop: 4 }}>SHOT BY <span style={{ color: GOLD }}>HIS OWN NAVY</span></div>
  </div>
);
const Bg: React.FC = () => (
  <AbsoluteFill style={{ background: 'radial-gradient(ellipse 90% 70% at 40% 40%, #4a3320 0%, #1c130b 60%, #070503 100%)' }}>
    <Img src={staticFile('assets/backgrounds/paper.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.12, mixBlendMode: 'overlay' }} />
  </AbsoluteFill>
);
const Bust: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <Img src={staticFile('assets/archival/portrait.jpg')} style={{ position: 'absolute', objectFit: 'cover', objectPosition: '0% 0%', filter: 'saturate(0.85) contrast(1.12) brightness(1.04)', WebkitMaskImage: 'radial-gradient(ellipse 40% 32% at 48% 36%, #000 62%, transparent 100%)', maskImage: 'radial-gradient(ellipse 40% 32% at 48% 36%, #000 62%, transparent 100%)', ...style }} />
);
const Grain = () => <Img src={staticFile('assets/textures/grain_3.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'overlay', opacity: 0.14 }} />;

export const PosterShort: React.FC = () => (
  <AbsoluteFill style={{ background: INK }}>
    <Fonts /><Bg />
    <Bust style={{ left: -330, top: 214, width: 1700, height: 2133 }} />
    <div style={{ position: 'absolute', left: 50, right: 40, top: 60 }}><Headline a="To encourage" b="the others." size={140} /></div>
    <div style={{ position: 'absolute', right: 40, top: 480 }}><Badge s={96} /></div>
    <div style={{ position: 'absolute', left: 720, top: 1020 }}><Litho w={300} h={380} rot={4} /></div>
    <div style={{ position: 'absolute', left: 40, top: 1490 }}><Stat s={80} /></div>
    <div style={{ position: 'absolute', left: 560, top: 1490, display: 'flex', flexDirection: 'column', gap: 22 }}>
      <IconRow icon="crown" l1="JUDGES ASKED" l2="FOR MERCY" s={90} />
      <IconRow icon="crown" l1="THE KING" l2="SAID NO" s={90} />
    </div>
    <Grain />
  </AbsoluteFill>
);

export const PosterWide: React.FC = () => (
  <AbsoluteFill style={{ background: INK }}>
    <Fonts /><Bg />
    <Bust style={{ left: -177, top: 30, width: 1000, height: 1255 }} />
    <div style={{ position: 'absolute', left: 560, right: 30, top: 24 }}><Headline a="To encourage" b="the others." size={96} /></div>
    <div style={{ position: 'absolute', left: 580, top: 250 }}><Litho w={190} h={240} rot={-3} /></div>
    <div style={{ position: 'absolute', right: 30, top: 300 }}><Badge s={56} /></div>
    <div style={{ position: 'absolute', left: 580, top: 545 }}><Stat s={70} /></div>
    <div style={{ position: 'absolute', right: 30, top: 560 }}><IconRow icon="crown" l1="THE KING" l2="SAID NO" s={64} /></div>
    <Grain />
  </AbsoluteFill>
);
