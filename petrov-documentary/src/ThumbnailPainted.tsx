import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { Fonts } from './Fonts';

/** Painted cover (public/images/thumbnail/cover.png, from scripts/paint-thumbnail.py) + channel-style caption. */
export const ThumbnailPainted: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Fonts />
    <Img src={staticFile('images/thumbnail/cover.png')} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.22)', transformOrigin: '50% 12%' }} />
    {/* red alarm light washing in from the right, cool shadow on the left */}
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 70% 60% at 100% 35%, rgba(255,40,20,0.55) 0%, rgba(255,40,20,0) 70%)', mixBlendMode: 'screen' }} />
    <AbsoluteFill style={{ background: 'linear-gradient(90deg, rgba(10,20,30,0.45) 0%, rgba(0,0,0,0) 40%, rgba(120,10,0,0.35) 100%)', mixBlendMode: 'multiply' }} />
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.85) 100%)' }} />
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 80% 65% at 50% 42%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)' }} />
    <div style={{ position: 'absolute', left: 30, right: 30, top: 1430, textAlign: 'center', fontFamily: 'Oswald', fontWeight: 700, fontSize: 132, lineHeight: 1.0, textTransform: 'uppercase', color: '#fff', WebkitTextStroke: '12px #000', paintOrder: 'stroke fill', textShadow: '0 8px 24px rgba(0,0,0,0.8)' }}>
      5 Missiles<br /><span style={{ color: '#ffd34d' }}>Incoming</span>
    </div>
  </AbsoluteFill>
);
