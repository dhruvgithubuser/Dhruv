import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { ICONS, Fonts } from './kit';
import { HEAD, SERIF, TYPE } from './theme';

/* Editorial history-poster thumbnails (channel standard): headline white + gold, hero portrait, key document, stat box, badge, icon captions. */
const GOLD = '#e8b84a', CREAM = '#f6ecd4', INK = '#0c121c';
const Headline: React.FC<{ a: string; b: string; size: number }> = ({ a, b, size }) => (
  <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: size, lineHeight: 1.0, textTransform: 'uppercase', textShadow: '0 6px 24px rgba(0,0,0,0.95)' }}>
    <span style={{ color: '#fff' }}>{a} </span><span style={{ color: GOLD }}>{b}</span>
  </div>
);
const IconRow: React.FC<{ icon: string; l1: string; l2: string; s: number }> = ({ icon, l1, l2, s }) => {
  const I = ICONS[icon];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: s * 0.35 }}>
      <div style={{ width: s, height: s, borderRadius: s, border: `3px solid ${GOLD}`, background: 'rgba(12,18,28,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 100 100" width={s * 0.66} height={s * 0.66}><I c={GOLD} /></svg>
      </div>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: s * 0.36, lineHeight: 1.1, color: CREAM, textShadow: '0 2px 8px #000' }}>{l1}<br /><span style={{ color: GOLD }}>{l2}</span></div>
    </div>
  );
};
const Badge: React.FC<{ s: number }> = ({ s }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: s * 0.3 }}>
    <div style={{ width: s, height: s, borderRadius: s, background: `radial-gradient(circle, ${GOLD} 0%, #b07d22 75%)`, border: '3px solid #2a1d12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: s * 0.3, color: INK }}>1941</div>
    <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: s * 0.34, lineHeight: 1.05, color: CREAM, textShadow: '0 2px 8px #000' }}>PEARL HARBOR<br /><span style={{ color: GOLD }}>DECEMBER 7, 1941</span></div>
  </div>
);
const Quote: React.FC<{ w: number; size: number; rot: number }> = ({ w, size, rot }) => (
  <div style={{ width: w, transform: `rotate(${rot}deg)`, background: '#1f3a2e', border: '12px solid #6b4a2e', padding: '20px 26px', boxShadow: '0 20px 50px rgba(0,0,0,0.85)', position: 'relative' }}>
    <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: size, lineHeight: 1.2, color: '#eef1f4' }}>“I fear all we have done is to awaken a sleeping giant…”</div>
    <div style={{ position: 'absolute', right: -20, top: -30, transform: 'rotate(10deg)', fontFamily: HEAD, fontWeight: 700, fontSize: size * 0.62, color: '#d23a2c', border: `${size / 10}px solid #d23a2c`, padding: '0 14px', background: 'rgba(242,234,214,0.95)', borderRadius: 6 }}>NO EVIDENCE</div>
  </div>
);
const Stat: React.FC<{ s: number }> = ({ s }) => (
  <div style={{ background: 'rgba(12,18,28,0.9)', border: `3px solid ${GOLD}`, padding: `${s * 0.12}px ${s * 0.22}px`, boxShadow: '0 12px 30px rgba(0,0,0,0.7)' }}>
    <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: s, lineHeight: 1, color: '#fff' }}>1970</div>
    <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: s * 0.34, color: CREAM, marginTop: 4 }}>THE YEAR <span style={{ color: GOLD }}>HOLLYWOOD</span> WROTE IT</div>
  </div>
);
const Bg: React.FC = () => (
  <AbsoluteFill style={{ background: 'radial-gradient(ellipse 90% 70% at 40% 40%, #24406a 0%, #13233a 55%, #070b12 100%)' }}>
    <AbsoluteFill style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(238,241,244,0.06) 0 1px, transparent 1px 80px), repeating-linear-gradient(90deg, rgba(238,241,244,0.06) 0 1px, transparent 1px 80px)' }} />
  </AbsoluteFill>
);
const Bust: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <Img src={staticFile('assets/archival/yamamoto_bust.jpg')} style={{ position: 'absolute', filter: 'sepia(0.35) contrast(1.15)', WebkitMaskImage: 'radial-gradient(ellipse 48% 52% at 50% 42%, #000 55%, transparent 80%)', maskImage: 'radial-gradient(ellipse 48% 52% at 50% 42%, #000 55%, transparent 80%)', ...style }} />
);
const Grain = () => <Img src={staticFile('assets/textures/grain_3.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'overlay', opacity: 0.14 }} />;

export const PosterShort: React.FC = () => (
  <AbsoluteFill style={{ background: INK }}>
    <Fonts /><Bg />
    <Bust style={{ left: -140, top: 330, width: 1000 }} />
    <div style={{ position: 'absolute', left: 50, right: 40, top: 60 }}><Headline a="He never said it." b="Hollywood did." size={128} /></div>
    <div style={{ position: 'absolute', right: 40, top: 480 }}><Badge s={96} /></div>
    <div style={{ position: 'absolute', left: 430, top: 1000 }}><Quote w={600} size={50} rot={3} /></div>
    <div style={{ position: 'absolute', left: 50, top: 1360 }}><Stat s={130} /></div>
    <div style={{ position: 'absolute', left: 50, top: 1630, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <IconRow icon="key" l1="STUDIED AT HARVARD" l2="KNEW AMERICA'S POWER" s={104} />
      <IconRow icon="envelope" l1="HIS REAL LETTER" l2="WAS A WARNING" s={104} />
    </div>
    <Grain />
  </AbsoluteFill>
);

export const PosterWide: React.FC = () => (
  <AbsoluteFill style={{ background: INK }}>
    <Fonts /><Bg />
    <Bust style={{ left: -60, top: 20, height: 760 }} />
    <div style={{ position: 'absolute', left: 560, right: 30, top: 30 }}><Headline a="He never said it." b="Hollywood did." size={80} /></div>
    <div style={{ position: 'absolute', left: 580, top: 240 }}><Quote w={420} size={34} rot={-2} /></div>
    <div style={{ position: 'absolute', right: 30, top: 270 }}><Badge s={60} /></div>
    <div style={{ position: 'absolute', left: 580, top: 480 }}><Stat s={84} /></div>
    <div style={{ position: 'absolute', right: 30, top: 520 }}><IconRow icon="envelope" l1="HIS REAL LETTER" l2="WAS A WARNING" s={70} /></div>
    <Grain />
  </AbsoluteFill>
);
