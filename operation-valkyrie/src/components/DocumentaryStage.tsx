import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Img, continueRender, delayRender, staticFile, useCurrentFrame } from 'remotion';
import { noise1 } from '../theme';

/** Fonts: Oswald (condensed headlines), Courier Prime (typewriter documents), Plex Mono (annotations), Inter (captions). */
const css = [300, 400, 600, 800].map((w) => `@font-face{font-family:'Inter';src:url('${staticFile(`assets/fonts/Inter-${w}.woff2`)}') format('woff2');font-weight:${w};}`).join('')
  + `@font-face{font-family:'Plex Mono';src:url('${staticFile('assets/fonts/PlexMono-500.woff2')}') format('woff2');font-weight:500;}`
  + `@font-face{font-family:'Oswald';src:url('${staticFile('assets/fonts/Oswald-500.woff2')}') format('woff2');font-weight:500;}`
  + `@font-face{font-family:'Oswald';src:url('${staticFile('assets/fonts/Oswald-700.woff2')}') format('woff2');font-weight:700;}`
  + `@font-face{font-family:'Courier Prime';src:url('${staticFile('assets/fonts/CourierPrime-400.woff2')}') format('woff2');font-weight:400;}`
  + `@font-face{font-family:'Courier Prime';src:url('${staticFile('assets/fonts/CourierPrime-700.woff2')}') format('woff2');font-weight:700;}`;

export const Fonts: React.FC = () => {
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all(['800 40px Inter', '500 40px "Plex Mono"', '700 40px Oswald', '500 40px Oswald', '400 40px "Courier Prime"', '700 40px "Courier Prime"'].map((f) => document.fonts.load(f)))
      .then(() => continueRender(h)).catch(() => continueRender(h));
  }, [h]);
  return <style>{css}</style>;
};

/** Persistent parchment stage: aged paper, a faint printed map grid, sepia light, vignette. */
export const Parchment: React.FC<{ dark?: number }> = ({ dark = 0 }) => (
  <AbsoluteFill>
    <Img src={staticFile('assets/backgrounds/paper.jpg')} style={{ width: '100%', height: '100%' }} />
    <AbsoluteFill style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(60,45,30,0.06) 0 1px, transparent 1px 64px), repeating-linear-gradient(90deg, rgba(60,45,30,0.06) 0 1px, transparent 1px 64px)' }} />
    {dark > 0 && <AbsoluteFill style={{ background: `rgba(29,27,25,${dark})` }} />}
  </AbsoluteFill>
);

/** Camera: a slow ~2% drift + optional push-in toward a point (purposeful, never random). */
export const Camera: React.FC<{ push?: number; ox?: number; oy?: number; drift?: number; children: React.ReactNode }> = ({ push = 0, ox = 50, oy = 50, drift = 1, children }) => {
  const f = useCurrentFrame();
  const dx = drift * 10 * noise1(f * 0.004, 2), dy = drift * 8 * noise1(f * 0.004, 9);
  return <AbsoluteFill style={{ transform: `translate(${dx}px, ${dy}px) scale(${1.02 + push})`, transformOrigin: `${ox}% ${oy}%` }}>{children}</AbsoluteFill>;
};

/** Film finish: grain, sepia vignette. */
export const Finish: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <Img src={staticFile(`assets/textures/grain_${Math.floor(f / 2) % 8}.png`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'overlay', opacity: 0.14 }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 75% at 50% 48%, rgba(0,0,0,0) 55%, rgba(30,20,10,0.6) 100%)' }} />
    </AbsoluteFill>
  );
};
