import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { hash01, lin } from '../theme';

export type TransitionKind = 'cut' | 'fade' | 'smoke' | 'burn' | 'glitch' | 'flash' | 'zoom';

/**
 * Entry transition for a scene: wraps the scene content and reveals it over `dur` frames.
 * smoke: soft noise-edged mask grows from the centre; burn: hot film-burn bloom; glitch: radar
 * interference slices + RGB split; flash: light bloom; zoom: scale-down from a map push.
 */
export const SceneTransition: React.FC<{ kind: TransitionKind; dur?: number; children: React.ReactNode }> = ({ kind, dur = 12, children }) => {
  const f = useCurrentFrame();
  const p = lin(f, 0, dur);
  if (kind === 'cut' || p >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  if (kind === 'fade') return <AbsoluteFill style={{ opacity: p }}>{children}</AbsoluteFill>;
  if (kind === 'zoom') {
    const s = 1.35 - 0.35 * (1 - (1 - p) ** 3);
    return <AbsoluteFill style={{ opacity: Math.min(1, p * 2.2), transform: `scale(${s})` }}>{children}</AbsoluteFill>;
  }
  if (kind === 'smoke') {
    const r = 10 + p * 140;
    const blobs = Array.from({ length: 7 }, (_, i) => {
      const x = 20 + hash01(i, 3) * 60, y = 20 + hash01(i, 5) * 60;
      return `radial-gradient(circle at ${x}% ${y}%, black ${r * (0.5 + hash01(i, 7) * 0.5)}%, transparent ${r * (0.5 + hash01(i, 7) * 0.5) + 25}%)`;
    }).join(',');
    return <AbsoluteFill style={{ WebkitMaskImage: blobs, maskImage: blobs }}>{children}</AbsoluteFill>;
  }
  if (kind === 'burn') {
    const heat = Math.sin(p * Math.PI);
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{ opacity: lin(f, dur * 0.35, dur) }}>{children}</AbsoluteFill>
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 50% at ${30 + p * 40}% 60%, rgba(255,235,190,${heat}) 0%, rgba(255,120,30,${heat * 0.8}) 35%, rgba(120,20,0,${heat * 0.5}) 65%, rgba(0,0,0,0) 90%)`, mixBlendMode: 'screen' }} />
      </AbsoluteFill>
    );
  }
  if (kind === 'flash') {
    const b = Math.max(0, 1 - p * 1.6);
    return (
      <AbsoluteFill>
        {children}
        <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, rgba(255,250,235,${b}) 0%, rgba(255,240,210,${b * 0.85}) 50%, rgba(255,230,190,${b * 0.6}) 100%)` }} />
      </AbsoluteFill>
    );
  }
  // glitch
  const n = 14;
  const amt = (1 - p) ** 1.5;
  return (
    <AbsoluteFill>
      {Array.from({ length: n }, (_, i) => {
        const off = (hash01(i + f * 13, 9) - 0.5) * 140 * amt;
        const top = (i / n) * 100, h = 100 / n;
        return (
          <AbsoluteFill key={i} style={{ clipPath: `inset(${top}% 0 ${100 - top - h}% 0)`, transform: `translateX(${off}px)`, filter: hash01(i + f, 2) < 0.3 * amt ? 'hue-rotate(90deg) saturate(3)' : undefined }}>
            {children}
          </AbsoluteFill>
        );
      })}
      <AbsoluteFill style={{ background: 'repeating-linear-gradient(0deg, rgba(140,255,120,0.10) 0 2px, rgba(0,0,0,0) 2px 6px)', opacity: amt }} />
    </AbsoluteFill>
  );
};
