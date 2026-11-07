import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { Fonts } from './Fonts';

/** Painted cover (public/images/thumbnail/cover.png, from scripts/paint-thumbnail.py) + channel-style caption. */
export const ThumbnailPainted: React.FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Fonts />
    <Img src={staticFile('images/thumbnail/cover.png')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.85) 100%)' }} />
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 80% 65% at 50% 42%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)' }} />
    <div style={{ position: 'absolute', left: 30, right: 30, top: 1430, textAlign: 'center', fontFamily: 'Oswald', fontWeight: 700, fontSize: 132, lineHeight: 1.0, textTransform: 'uppercase', color: '#fff', WebkitTextStroke: '12px #000', paintOrder: 'stroke fill', textShadow: '0 8px 24px rgba(0,0,0,0.8)' }}>
      5 Missiles<br /><span style={{ color: '#ffd34d' }}>Incoming</span>
    </div>
  </AbsoluteFill>
);
