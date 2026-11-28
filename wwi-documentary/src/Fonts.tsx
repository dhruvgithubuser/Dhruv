import React, { useEffect, useState } from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';

const css = [300, 400, 600, 800].map((w) => `@font-face{font-family:'Inter';src:url('${staticFile(`fonts/Inter-${w}.woff2`)}') format('woff2');font-weight:${w};}`).join('')
  + `@font-face{font-family:'Plex Mono';src:url('${staticFile('fonts/PlexMono-500.woff2')}') format('woff2');font-weight:500;}`
  + `@font-face{font-family:'Playfair';src:url('${staticFile('fonts/Playfair-900.woff2')}') format('woff2');font-weight:900;}`
  + `@font-face{font-family:'Playfair';src:url('${staticFile('fonts/Playfair-700i.woff2')}') format('woff2');font-weight:700;font-style:italic;}`;

export const Fonts: React.FC = () => {
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all(['300 40px Inter', '400 40px Inter', '600 40px Inter', '800 40px Inter', '500 40px "Plex Mono"', '900 40px Playfair', 'italic 700 40px Playfair'].map((f) => document.fonts.load(f)))
      .then(() => continueRender(h)).catch(() => continueRender(h));
  }, [h]);
  return <style>{css}</style>;
};
