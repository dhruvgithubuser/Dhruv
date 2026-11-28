import React, { useEffect, useState } from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';

const css = `
@font-face { font-family: 'Oswald'; src: url('${staticFile('fonts/Oswald-700.woff2')}') format('woff2'); font-weight: 700; }
@font-face { font-family: 'Oswald'; src: url('${staticFile('fonts/Oswald-500.woff2')}') format('woff2'); font-weight: 500; }
@font-face { font-family: 'Oswald'; src: url('${staticFile('fonts/Oswald-cyr-700.woff2')}') format('woff2'); font-weight: 700; unicode-range: U+0400-045F; }
@font-face { font-family: 'Cinzel'; src: url('${staticFile('fonts/Cinzel-700.woff2')}') format('woff2'); font-weight: 700; }
`;

/** Injects the two typefaces (Oswald for captions/labels, Cinzel for the title) and holds the render until they load. */
export const Fonts: React.FC = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all(['700 40px Oswald', '500 40px Oswald', '700 40px Cinzel'].map((f) => document.fonts.load(f, 'AaСТАРТ')))
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);
  return <style>{css}</style>;
};
