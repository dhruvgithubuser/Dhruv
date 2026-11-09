import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { Briefcase, CutoutDefs, Figure } from './components/CharacterCutout';
import { Finish, Fonts } from './components/DocumentaryStage';
import { C, HEAD, TYPE } from './theme';

/** Shorts cover, 1080x1920: "1 TABLE LEG". Hitler behind the oak table, the massive support, the briefcase bomb behind it
 *  and the blast stopped by the wood. Text in the upper third; nothing important in the bottom 18% (Shorts UI). */
export const Thumbnail: React.FC = () => {
  const TY = 930, FY = 1480, PL = [540, 800];
  const bx = 960, by = FY - 40;
  return (
    <AbsoluteFill style={{ background: C.charcoal }}>
      <Fonts />
      <Img src={staticFile('assets/backgrounds/briefing_hut.jpg')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(7px) sepia(0.5) brightness(0.42) contrast(1.1)' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(255,226,170,0.18), rgba(0,0,0,0) 70%)' }} />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <CutoutDefs />
        <defs>
          <linearGradient id="oakT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8a6038" /><stop offset="1" stopColor="#4a311c" /></linearGradient>
          <linearGradient id="oakP" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#3e2916" /><stop offset="0.45" stopColor="#6e4b2a" /><stop offset="1" stopColor="#3a2614" /></linearGradient>
          <radialGradient id="fire" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#fff3c8" /><stop offset="0.3" stopColor="#ffb347" /><stop offset="0.65" stopColor="#d2451e" stopOpacity="0.7" /><stop offset="1" stopColor="#5a0d05" stopOpacity="0" /></radialGradient>
          <clipPath id="rightOfLeg"><rect x={PL[1]} y={0} width={400} height={1920} /></clipPath>
          <filter id="glowT"><feGaussianBlur stdDeviation="14" /></filter>
        </defs>
        {/* Hitler behind the table, leaning over the map */}
        <Figure who="hitler" x={330} y={TY + 30} s={1.12} lean={-4} arm={0.5} />
        {/* table top + apron */}
        <rect x={-20} y={TY} width={1120} height={58} fill="url(#oakT)" stroke="#120b06" strokeWidth={5} />
        <rect x={40} y={TY - 16} width={520} height={20} fill="#e6dcc0" transform={`rotate(-1 300 ${TY})`} />
        <rect x={0} y={TY + 58} width={1080} height={46} fill="#3e2a18" stroke="#120b06" strokeWidth={4} />
        {/* left support (small, background) */}
        <rect x={110} y={TY + 104} width={200} height={FY - TY - 104} fill="url(#oakP)" stroke="#120b06" strokeWidth={5} opacity={0.85} />
        <rect x={0} y={FY} width={1080} height={440} fill="#24180f" />
        {/* blast behind the leg: fire + rays, clipped so the wood stops it */}
        <g clipPath="url(#rightOfLeg)">
          <circle cx={bx} cy={by - 60} r={330} fill="url(#fire)" />
          {Array.from({ length: 14 }, (_, i) => {
            const a = -Math.PI * (0.15 + 0.85 * (i / 13));
            return <line key={i} x1={bx} y1={by - 60} x2={bx + Math.cos(a) * 560} y2={by - 60 + Math.sin(a) * 560} stroke="#ffd27a" strokeWidth={10} opacity={0.75} />;
          })}
        </g>
        <Briefcase x={bx} y={by} s={1.35} />
        {/* the massive support that saved him */}
        <rect x={PL[0]} y={TY + 104} width={PL[1] - PL[0]} height={FY - TY - 104} fill="url(#oakP)" stroke="#120b06" strokeWidth={6} />
        <path d={`M${PL[0] + 30},${TY + 140} L${PL[0] + 30},${FY - 30} M${PL[1] - 30},${TY + 140} L${PL[1] - 30},${FY - 30}`} stroke="rgba(0,0,0,0.35)" strokeWidth={4} />
        <rect x={PL[1] - 6} y={TY + 104} width={12} height={FY - TY - 104} fill="#ffcf7a" opacity={0.85} filter="url(#glowT)" />
        <rect x={PL[0] - 14} y={TY + 90} width={PL[1] - PL[0] + 28} height={FY - TY - 76} fill="none" stroke={C.redHi} strokeWidth={10} strokeDasharray="34 18" />
        {/* red arrow from the title to the leg */}
        <path d="M760,600 Q800,800 700,1000" fill="none" stroke={C.redHi} strokeWidth={14} strokeLinecap="round" />
        <path d="M662,972 L694,1018 L740,986" fill="none" stroke={C.redHi} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {/* title */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center' }}>
        <div style={{ display: 'inline-block', position: 'relative' }}>
          <span style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 196, lineHeight: 1, color: C.redHi, WebkitTextStroke: '6px #120b06', paintOrder: 'stroke fill', textShadow: '0 10px 30px rgba(0,0,0,0.85)' }}>1 </span>
          <span style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 196, lineHeight: 1, color: C.paper, WebkitTextStroke: '6px #120b06', paintOrder: 'stroke fill', textShadow: '0 10px 30px rgba(0,0,0,0.85)' }}>TABLE LEG</span>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: -18, height: 14, background: C.red }} />
        </div>
        <div style={{ marginTop: 40, display: 'inline-block', background: 'rgba(239,230,210,0.92)', padding: '8px 22px', fontFamily: TYPE, fontWeight: 700, fontSize: 34, letterSpacing: 4, color: C.ink }}>20 JULY 1944 · WOLF'S LAIR</div>
      </div>
      <Finish />
    </AbsoluteFill>
  );
};
