import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { ICONS, Fonts } from './kit';
import { HEAD, SERIF, TYPE } from './theme';

/* Editorial history-poster thumbnails: headline (white + gold), hero portrait blended into a painted scene,
   the key document, a stat box, a round badge and two icon captions. Warm sepia-gold, dark vignette. */
const GOLD = '#e8b84a', CREAM = '#f6ecd4', INK = '#120c07';
const grade = 'sepia(0.55) saturate(1.25) contrast(1.12) brightness(0.92)';
const Headline: React.FC<{ a: string; b: string; size: number }> = ({ a, b, size }) => (
  <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: size, lineHeight: 1.0, textTransform: 'uppercase', textShadow: '0 6px 24px rgba(0,0,0,0.95), 0 0 2px #000' }}>
    <span style={{ color: '#fff' }}>{a} </span><span style={{ color: GOLD }}>{b}</span>
  </div>
);
const IconRow: React.FC<{ icon: string; l1: string; l2: string; s: number; gold?: boolean }> = ({ icon, l1, l2, s, gold }) => {
  const I = ICONS[icon];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: s * 0.35 }}>
      <div style={{ width: s, height: s, borderRadius: s, border: `3px solid ${GOLD}`, background: 'rgba(18,12,7,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 100 100" width={s * 0.66} height={s * 0.66}><I c={GOLD} /></svg>
      </div>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: s * 0.36, lineHeight: 1.1, color: CREAM, textShadow: '0 2px 8px #000' }}>{l1}<br /><span style={{ color: gold ? GOLD : CREAM }}>{l2}</span></div>
    </div>
  );
};
const Badge: React.FC<{ s: number }> = ({ s }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: s * 0.3 }}>
    <div style={{ width: s, height: s, borderRadius: s, background: `radial-gradient(circle, ${GOLD} 0%, #b07d22 70%)`, border: '3px solid #2a1d12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: s * 0.42, color: INK }}>7</div>
    <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: s * 0.34, lineHeight: 1.05, color: CREAM, textShadow: '0 2px 8px #000' }}>7TH CAVALRY<br /><span style={{ color: GOLD }}>LITTLE BIGHORN 1876</span></div>
  </div>
);
const Note: React.FC<{ w: number; h: number; rot: number }> = ({ w, h, rot }) => (
  <div style={{ width: w, height: h, transform: `rotate(${rot}deg)`, background: '#efe2c4', padding: 10, boxShadow: '0 20px 50px rgba(0,0,0,0.85)', position: 'relative' }}>
    <Img src={staticFile('assets/archival/note_top.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.5) contrast(1.1)' }} />
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: -44, textAlign: 'center', fontFamily: TYPE, fontWeight: 700, fontSize: Math.round(w / 24), whiteSpace: 'nowrap', color: GOLD, textShadow: '0 2px 6px #000' }}>THE LAST ORDER · JUNE 25, 1876</div>
  </div>
);
const Stat: React.FC<{ s: number }> = ({ s }) => (
  <div style={{ background: 'rgba(14,9,5,0.88)', border: `3px solid ${GOLD}`, padding: `${s * 0.12}px ${s * 0.22}px`, boxShadow: '0 12px 30px rgba(0,0,0,0.7)' }}>
    <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: s, lineHeight: 1, color: '#fff' }}>210 MEN</div>
    <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: s * 0.36, color: CREAM, marginTop: 4 }}><span style={{ color: GOLD }}>NEVER</span> SEEN ALIVE AGAIN</div>
  </div>
);
const Vignette = () => <AbsoluteFill style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)' }} />;

export const PosterShort: React.FC = () => (
  <AbsoluteFill style={{ background: INK }}>
    <Fonts />
    <Img src={staticFile('assets/stills/c31_dust.png')} style={{ position: 'absolute', left: -420, top: 560, height: 1360, filter: grade }} />
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(18,12,7,0.95) 0%, rgba(18,12,7,0.35) 30%, rgba(18,12,7,0.2) 60%, rgba(18,12,7,0.9) 100%)' }} />
    <Img src={staticFile('assets/stills/c25_trumpeter.png')} style={{ position: 'absolute', right: -260, top: 1020, height: 520, filter: grade, WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 40%, transparent 75%)', maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 40%, transparent 75%)' }} />
    <Img src={staticFile('assets/archival/custer_bust.jpg')} style={{ position: 'absolute', left: -120, top: 300, width: 980, filter: 'sepia(0.6) saturate(1.3) contrast(1.15)', WebkitMaskImage: 'radial-gradient(ellipse 48% 52% at 50% 45%, #000 55%, transparent 80%)', maskImage: 'radial-gradient(ellipse 48% 52% at 50% 45%, #000 55%, transparent 80%)' }} />
    <div style={{ position: 'absolute', left: 50, right: 40, top: 60 }}><Headline a="He begged for help." b="It never came." size={128} /></div>
    <div style={{ position: 'absolute', right: 40, top: 470 }}><Badge s={100} /></div>
    <div style={{ position: 'absolute', left: 470, top: 990 }}><Note w={570} h={270} rot={4} /></div>
    <div style={{ position: 'absolute', left: 50, top: 1330 }}><Stat s={130} /></div>
    <div style={{ position: 'absolute', left: 50, top: 1610, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <IconRow icon="envelope" l1="CARRIED BY A TRUMPETER" l2="WHO BARELY SPOKE ENGLISH" s={110} />
      <IconRow icon="clock" l1="HELP STOPPED ON A HILL." l2="AND WAITED." s={110} gold />
    </div>
    <Vignette />
    <Img src={staticFile('assets/textures/grain_3.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'overlay', opacity: 0.14 }} />
  </AbsoluteFill>
);

export const PosterWide: React.FC = () => (
  <AbsoluteFill style={{ background: INK }}>
    <Fonts />
    <Img src={staticFile('assets/stills/c31_dust.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: grade }} />
    <AbsoluteFill style={{ background: 'linear-gradient(90deg, rgba(18,12,7,0.55) 0%, rgba(18,12,7,0.25) 40%, rgba(18,12,7,0.85) 75%)' }} />
    <Img src={staticFile('assets/archival/custer_bust.jpg')} style={{ position: 'absolute', left: -30, top: 40, height: 720, filter: 'sepia(0.6) saturate(1.3) contrast(1.15)', WebkitMaskImage: 'radial-gradient(ellipse 48% 50% at 50% 45%, #000 55%, transparent 80%)', maskImage: 'radial-gradient(ellipse 48% 50% at 50% 45%, #000 55%, transparent 80%)' }} />
    <div style={{ position: 'absolute', left: 560, right: 30, top: 30 }}><Headline a="He begged for help." b="It never came." size={78} /></div>
    <div style={{ position: 'absolute', left: 590, top: 215 }}><Note w={370} h={170} rot={-3} /></div>
    <div style={{ position: 'absolute', right: 30, top: 250 }}><Badge s={64} /></div>
    <div style={{ position: 'absolute', left: 590, top: 470 }}><Stat s={84} /></div>
    <div style={{ position: 'absolute', right: 30, top: 500, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <IconRow icon="clock" l1="HELP STOPPED" l2="AND WAITED." s={70} gold />
    </div>
    <Vignette />
    <Img src={staticFile('assets/textures/grain_3.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'overlay', opacity: 0.14 }} />
  </AbsoluteFill>
);
