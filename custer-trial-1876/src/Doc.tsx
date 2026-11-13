import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion';
import { C, HEAD, SANS, SERIF, TYPE, ease, lin } from './theme';

/* Realistic documentary building blocks: filmed-looking shots (2.5D depth clips), mounted archival photos, evidence tags. */
const GRADE = 'contrast(1.06) saturate(0.82) sepia(0.14) brightness(0.98)';

/** A shot from clips/<id>.mp4 (10 s of depth-parallax camera motion). Longer shots are slowed to fit. */
export const Shot: React.FC<{ id: string; dur: number; grade?: string; children?: React.ReactNode }> = ({ id, dur, grade = GRADE, children }) => {
  const rate = Math.min(1, 296 / Math.max(1, dur));
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <OffthreadVideo src={staticFile(`assets/clips/${id}.mp4`)} playbackRate={rate} muted style={{ width: '100%', height: '100%', objectFit: 'cover', filter: grade }} />
      {children}
    </AbsoluteFill>
  );
};

/** Archival photograph mounted on a dark backdrop, slow push; caption like a museum label. */
export const Card: React.FC<{ src: string; caption: string; credit: string; dur: number; side?: 'center' | 'left'; name?: string; sub?: string; wide?: boolean }> = ({ src, caption, credit, dur, side = 'center', name, sub, wide }) => {
  const f = useCurrentFrame();
  const z = 1 + 0.06 * lin(f, 0, dur);
  const o = lin(f, 0, 12);
  const h = wide ? 760 : 820;
  return (
    <AbsoluteFill style={{ background: '#0e0b08' }}>
      <Img src={staticFile('assets/backgrounds/paper.jpg')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.18, filter: 'brightness(0.5)' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 70% 70% at 50% 45%, rgba(60,45,30,0.35) 0%, rgba(0,0,0,0.85) 100%)' }} />
      <div style={{ position: 'absolute', top: 70, height: h, left: side === 'left' ? 170 : 0, right: side === 'left' ? undefined : 0, display: 'flex', justifyContent: 'center', opacity: o }}>
        <div style={{ height: '100%', transform: `scale(${z})`, transformOrigin: '50% 40%', boxShadow: '0 30px 70px rgba(0,0,0,0.8)', border: '10px solid #e9e0cc' }}>
          <Img src={staticFile(src)} style={{ height: '100%', filter: 'sepia(0.25) contrast(1.05)' }} />
        </div>
      </div>
      {name && (
        <div style={{ position: 'absolute', left: 1020, top: 330, width: 780, opacity: lin(f, 10, 24), transform: `translateY(${(1 - ease(f, 10, 28)) * 20}px)` }}>
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 64, lineHeight: 1.05, color: '#efe6d2' }}>{name}</div>
          {sub && <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 28, letterSpacing: 3, color: C.gold, marginTop: 18 }}>{sub}</div>}
          <div style={{ width: 120, height: 4, background: C.redHi, marginTop: 26 }} />
        </div>
      )}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 70 + h + 22, textAlign: side === 'left' ? 'left' : 'center', paddingLeft: side === 'left' ? 170 : 0, opacity: lin(f, 8, 20) }}>
        <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 26, color: '#d9cdb2' }}>{caption}</span>
        <span style={{ fontFamily: TYPE, fontSize: 18, color: 'rgba(217,205,178,0.6)', marginLeft: 16 }}>{credit}</span>
      </div>
    </AbsoluteFill>
  );
};

/** Evidence tag (top-left), like a manila exhibit label. */
export const Exhibit: React.FC<{ letter: string; title: string; at?: number }> = ({ letter, title, at = 6 }) => {
  const f = useCurrentFrame();
  const p = ease(f, at, at + 14);
  if (p <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 70, top: 60, transform: `translateX(${(1 - p) * -60}px) rotate(-2deg)`, opacity: p, display: 'flex', alignItems: 'stretch', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
      <div style={{ background: '#c9b37e', padding: '12px 22px', fontFamily: TYPE, fontWeight: 700, color: '#2a2117', borderRight: '2px dashed rgba(42,33,23,0.5)' }}>
        <div style={{ fontSize: 18, letterSpacing: 4 }}>EXHIBIT</div>
        <div style={{ fontFamily: HEAD, fontSize: 60, lineHeight: 1 }}>{letter}</div>
      </div>
      <div style={{ background: '#efe6d2', padding: '12px 24px', display: 'flex', alignItems: 'center', fontFamily: TYPE, fontWeight: 700, fontSize: 30, letterSpacing: 2, color: '#2a2117' }}>{title}</div>
    </div>
  );
};

/** Small lower-left documentary label (place, date, chapter). */
export const Label: React.FC<{ text: string; sub?: string; at?: number; out?: number }> = ({ text, sub, at = 8, out }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 12) * (out !== undefined ? 1 - lin(f, out - 10, out) : 1);
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 80, top: 70, opacity: o }}>
      <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: '#f2ead8', textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}>{text}</div>
      {sub && <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 26, color: C.gold, marginTop: 8, textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}>{sub}</div>}
      <div style={{ width: 90 * o, height: 3, background: C.redHi, marginTop: 12 }} />
    </div>
  );
};

/** Chapter title in the upper-right corner. */
export const Chapter: React.FC<{ n: string; title: string }> = ({ n, title }) => {
  const f = useCurrentFrame();
  const o = lin(f, 6, 18) * (1 - lin(f, 110, 125));
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', right: 80, top: 70, textAlign: 'right', opacity: o }}>
      <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 22, letterSpacing: 8, color: C.gold, textShadow: '0 2px 12px #000' }}>PART {n}</div>
      <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 52, color: '#f2ead8', textShadow: '0 4px 20px #000' }}>{title}</div>
    </div>
  );
};

/** Full-screen serif title over the picture. */
export const Title: React.FC<{ at: number; text: string; sub?: string }> = ({ at, text, sub }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 14);
  if (o <= 0) return null;
  return (
    <AbsoluteFill style={{ background: `rgba(0,0,0,${0.45 * o})`, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', opacity: o }}>
      <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 26, letterSpacing: 12, color: C.gold }}>BURIED CHRONICLES</div>
      <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 104, color: '#f4ecda', textAlign: 'center', lineHeight: 1.05, marginTop: 16, transform: `scale(${1.04 - 0.04 * ease(f, at, at + 40)})`, textShadow: '0 8px 40px #000' }}>{text}</div>
      {sub && <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 40, color: '#e2d6bb', marginTop: 20 }}>{sub}</div>}
    </AbsoluteFill>
  );
};

/** Plain-white documentary subtitles (reference style). */
export const Sub: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: 'absolute', left: 200, right: 200, bottom: 64, textAlign: 'center' }}>
    <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 42, lineHeight: 1.3, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.95), 0 0 18px rgba(0,0,0,0.75)' }}>{text}</span>
  </div>
);
