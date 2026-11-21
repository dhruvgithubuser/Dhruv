import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Img, continueRender, delayRender, staticFile, useCurrentFrame } from 'remotion';
import { hash01, noise1 } from '../theme';

const F = (f: string) => staticFile(`assets/fonts/${f}`);
const css = [300, 400, 600, 800].map((w) => `@font-face{font-family:'Inter';src:url('${F(`Inter-${w}.woff2`)}') format('woff2');font-weight:${w};}`).join('')
  + `@font-face{font-family:'Plex Mono';src:url('${F('PlexMono-500.woff2')}') format('woff2');font-weight:500;}`
  + `@font-face{font-family:'Oswald';src:url('${F('Oswald-500.woff2')}') format('woff2');font-weight:500;}`
  + `@font-face{font-family:'Oswald';src:url('${F('Oswald-700.woff2')}') format('woff2');font-weight:700;}`
  + `@font-face{font-family:'Courier Prime';src:url('${F('CourierPrime-400.woff2')}') format('woff2');font-weight:400;}`
  + `@font-face{font-family:'Courier Prime';src:url('${F('CourierPrime-700.woff2')}') format('woff2');font-weight:700;}`
  + `@font-face{font-family:'Playfair';src:url('${F('Playfair-900.woff2')}') format('woff2');font-weight:900;}`
  + `@font-face{font-family:'Playfair';src:url('${F('Playfair-700i.woff2')}') format('woff2');font-weight:700;font-style:italic;}`;
export const Fonts: React.FC = () => {
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all(['800 40px Inter', '500 40px "Plex Mono"', '700 40px Oswald', '500 40px Oswald', '400 40px "Courier Prime"', '700 40px "Courier Prime"', '900 40px Playfair', 'italic 700 40px Playfair'].map((f) => document.fonts.load(f)))
      .then(() => continueRender(h)).catch(() => continueRender(h));
  }, [h]);
  return <style>{css}</style>;
};

/** Aged parchment with a faint printed grid. */
export const Parchment: React.FC<{ dark?: number }> = ({ dark = 0 }) => (
  <AbsoluteFill>
    <Img src={staticFile('assets/backgrounds/paper_wide.jpg')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    <AbsoluteFill style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(60,45,30,0.05) 0 1px, transparent 1px 72px), repeating-linear-gradient(90deg, rgba(60,45,30,0.05) 0 1px, transparent 1px 72px)' }} />
    {dark > 0 && <AbsoluteFill style={{ background: `rgba(29,27,25,${dark})` }} />}
  </AbsoluteFill>
);

/** Slow purposeful drift (~2%) and optional push-in toward (ox, oy)%. */
export const Camera: React.FC<{ push?: number; ox?: number; oy?: number; drift?: number; children: React.ReactNode }> = ({ push = 0, ox = 50, oy = 50, drift = 1, children }) => {
  const f = useCurrentFrame();
  const dx = drift * 14 * noise1(f * 0.004, 2), dy = drift * 9 * noise1(f * 0.004, 9);
  return <AbsoluteFill style={{ transform: `translate(${dx}px, ${dy}px) scale(${1.02 + push})`, transformOrigin: `${ox}% ${oy}%` }}>{children}</AbsoluteFill>;
};

/** Painted plate with a slow Ken Burns move and sepia grade. */
export const Plate: React.FC<{ src: string; from?: [number, number, number]; to?: [number, number, number]; dur: number; grade?: string }> = ({ src, from = [0, 0, 1.04], to = [0, 0, 1.12], dur, grade = 'sepia(0.35) contrast(1.06) brightness(0.9)' }) => {
  const f = useCurrentFrame();
  const p = Math.min(1, Math.max(0, f / dur));
  const e = p * p * (3 - 2 * p);
  const x = from[0] + (to[0] - from[0]) * e, y = from[1] + (to[1] - from[1]) * e, s = from[2] + (to[2] - from[2]) * e;
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Img src={staticFile(src)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `translate(${x}px, ${y}px) scale(${s})`, filter: grade }} />
    </AbsoluteFill>
  );
};

/** Rain streaks (seeded). */
export const Rain: React.FC<{ o?: number; n?: number; angle?: number }> = ({ o = 0.5, n = 160, angle = 12 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity: o }}>
      <svg width={1920} height={1080}>
        {Array.from({ length: n }, (_, i) => {
          const sp = 38 + hash01(i, 2) * 26;
          const x = (hash01(i, 1) * 2200 + f * sp * Math.tan((angle * Math.PI) / 180)) % 2200 - 140;
          const y = (hash01(i, 3) * 1300 + f * sp) % 1300 - 120;
          const l = 30 + hash01(i, 4) * 50;
          return <line key={i} x1={x} y1={y} x2={x - l * Math.sin((angle * Math.PI) / 180)} y2={y - l} stroke="rgba(220,230,240,0.55)" strokeWidth={1.6} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** Drifting ground mist. */
export const Mist: React.FC<{ o?: number; y?: number }> = ({ o = 0.5, y = 60 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity: o }}>
      {[0, 1].map((i) => <Img key={i} src={staticFile('assets/backgrounds/clouds.png')} style={{ position: 'absolute', left: -400 + ((f * (0.6 + i * 0.4)) % 400), top: `${y - 20 + i * 12}%`, width: 2800, height: 700, opacity: 0.55, filter: 'invert(1) brightness(1.4) blur(6px)', mixBlendMode: 'screen' }} />)}
    </AbsoluteFill>
  );
};

/** Musket smoke puff + flash at (x, y) from frame `at`. */
export const MusketShot: React.FC<{ at: number; x: number; y: number; dir?: 1 | -1; s?: number }> = ({ at, x, y, dir = 1, s = 1 }) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0 || t > 110) return null;
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs><filter id={`smk${at}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={10 * s + 4} /></filter></defs>
      {t < 4 && <circle cx={x} cy={y} r={34 * s} fill="#fff4cc" opacity={1 - t / 4} />}
      <g filter={`url(#smk${at})`}>
      {Array.from({ length: 7 }, (_, i) => {
        const k = Math.min(1, t / 40);
        return <circle key={i} cx={x + dir * (20 + i * 22 * k + t * 0.6) * s} cy={y - i * 6 * k - t * 0.35} r={(14 + i * 6 + t * 0.5) * s} fill="rgba(225,220,205,0.55)" opacity={Math.max(0, 0.9 - t / 110)} />;
      })}
      </g>
    </svg>
  );
};

/** Film finish. */
export const Finish: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <Img src={staticFile(`assets/textures/grain_${Math.floor(f / 2) % 8}.png`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'overlay', opacity: 0.12 }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0,0,0,0) 60%, rgba(30,20,10,0.55) 100%)' }} />
    </AbsoluteFill>
  );
};
