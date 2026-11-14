import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { CutoutDefs, Horse, Person } from './Characters';
import { Fonts } from './kit';
import { Frontier } from './Scenes';
import { C, HEAD, TYPE } from './theme';

/** Shorts cover: the real note, Custer's cut-out pointing, the trumpeter at full gallop, "HELP NEVER CAME". */
export const ThumbShort: React.FC = () => (
  <AbsoluteFill>
    <Fonts />
    <Frontier />
    <div style={{ position: 'absolute', left: 120, top: 330, width: 620, height: 820, transform: 'rotate(-4deg)', background: '#f4eedf', padding: 16, boxShadow: '0 30px 60px rgba(20,12,4,0.6)' }}>
      <Img src={staticFile('assets/archival/note.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 25%', filter: 'sepia(0.4) contrast(1.15)' }} />
    </div>
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      <CutoutDefs />
      <Person x={850} y={1160} s={0.95} coat="buckskin" head="assets/archival/head_custer.png" armR={80} flip nod={6} />
      <Horse x={560} y={1500} s={1.15} phase={0.35} rider="trooper" coat="#5a3a22" />
    </svg>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center' }}>
      <span style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 46, letterSpacing: 6, color: '#2a1d12', background: 'rgba(243,234,216,0.92)', padding: '6px 24px', borderLeft: `10px solid ${C.red}` }}>CUSTER'S LAST ORDER</span>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 1580, textAlign: 'center', transform: 'rotate(-4deg)', whiteSpace: 'nowrap' }}>
      <span style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 118, letterSpacing: 3, color: '#d8261c', border: '12px solid #d8261c', padding: '0 28px', background: 'rgba(244,236,218,0.94)', borderRadius: 10 }}>HELP NEVER CAME</span>
    </div>
    <Img src={staticFile('assets/textures/grain_3.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'overlay', opacity: 0.14 }} />
  </AbsoluteFill>
);

/** 16:9 version (1280×720): note left, Custer pointing, trumpeter galloping, stamp right. */
export const ThumbWide: React.FC = () => (
  <AbsoluteFill>
    <Fonts />
    <Frontier />
    <div style={{ position: 'absolute', left: 50, top: 70, width: 420, height: 560, transform: 'rotate(-4deg)', background: '#f4eedf', padding: 12, boxShadow: '0 24px 50px rgba(20,12,4,0.6)' }}>
      <Img src={staticFile('assets/archival/note.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 18%', filter: 'sepia(0.4) contrast(1.2)' }} />
    </div>
    <svg width={1280} height={720} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      <CutoutDefs />
      <Person x={600} y={640} s={0.95} coat="buckskin" head="assets/archival/head_custer.png" armR={84} nod={4} />
      <Horse x={1040} y={700} s={0.75} phase={0.35} rider="trooper" coat="#5a3a22" />
    </svg>
    <div style={{ position: 'absolute', right: 40, top: 60, width: 560, textAlign: 'right' }}>
      <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: '#2a1d12' }}>CUSTER'S LAST ORDER</div>
      <div style={{ display: 'inline-block', marginTop: 14, transform: 'rotate(-5deg)', fontFamily: HEAD, fontWeight: 700, fontSize: 96, lineHeight: 1, color: '#d8261c', border: '10px solid #d8261c', padding: '6px 22px', background: 'rgba(244,236,218,0.94)', borderRadius: 8, whiteSpace: 'nowrap' }}>HELP NEVER<br />CAME</div>
    </div>
    <Img src={staticFile('assets/textures/grain_3.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'overlay', opacity: 0.14 }} />
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 80% at 50% 50%, rgba(0,0,0,0) 60%, rgba(40,25,10,0.45) 100%)' }} />
  </AbsoluteFill>
);
