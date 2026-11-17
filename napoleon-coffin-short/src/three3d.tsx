import React from 'react';
import { AbsoluteFill } from 'remotion';

/*
 * A small CSS-3D "paper diorama" engine: real perspective, camera moves, boxes with opening lids,
 * floor planes and paper-cutout billboards. Units are px; y points DOWN (CSS), z toward the viewer.
 */
const P3: React.CSSProperties = { position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d' };

/** Camera + world. yaw/pitch in degrees, dist pushes the world away from the lens. */
export const Stage: React.FC<{ yaw?: number; pitch?: number; dist?: number; cx?: number; cy?: number; lift?: number; persp?: number; children: React.ReactNode }> = ({
  yaw = 0, pitch = -18, dist = 900, cx = 540, cy = 980, lift = 0, persp = 1300, children,
}) => (
  <AbsoluteFill style={{ perspective: persp, perspectiveOrigin: `${cx}px ${cy - 120}px`, overflow: 'hidden' }}>
    <div style={{ ...P3, left: cx, top: cy, transform: `translateZ(${-dist}px) rotateX(${pitch}deg) rotateY(${yaw}deg) translateY(${lift}px)` }}>{children}</div>
  </AbsoluteFill>
);

/** Positioned group. */
export const G: React.FC<{ x?: number; y?: number; z?: number; rx?: number; ry?: number; rz?: number; s?: number; children: React.ReactNode }> = ({ x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1, children }) => (
  <div style={{ ...P3, transform: `translate3d(${x}px,${y}px,${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale3d(${s},${s},${s})` }}>{children}</div>
);

type Face = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';
const shade: Record<Face, number> = { top: 1.12, front: 0.92, back: 0.7, left: 0.78, right: 0.84, bottom: 0.5 };

/** Box centred on (x,y,z). `skin` is a CSS background; `omit` drops faces (e.g. the top of an open coffin). */
export const Box: React.FC<{ w: number; h: number; d: number; x?: number; y?: number; z?: number; ry?: number; skin: string; edge?: string; omit?: Face[]; label?: string; labelColor?: string; inner?: React.ReactNode }> = ({
  w, h, d, x = 0, y = 0, z = 0, ry = 0, skin, edge = 'rgba(0,0,0,0.55)', omit = [], label, labelColor = '#f6ecd4', inner,
}) => {
  const face = (k: Face, fw: number, fh: number, t: string, child?: React.ReactNode) => omit.includes(k) ? null : (
    <div key={k} style={{ position: 'absolute', left: -fw / 2, top: -fh / 2, width: fw, height: fh, background: skin, filter: `brightness(${shade[k]})`, outline: `2px solid ${edge}`, outlineOffset: -2, transform: t, backfaceVisibility: 'visible', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{child}</div>
  );
  return (
    <div style={{ ...P3, transform: `translate3d(${x}px,${y}px,${z}px) rotateY(${ry}deg)` }}>
      {face('front', w, h, `translateZ(${d / 2}px)`, label ? <span style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: Math.min(h * 0.55, 46), letterSpacing: 3, color: labelColor, textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}>{label}</span> : null)}
      {face('back', w, h, `rotateY(180deg) translateZ(${d / 2}px)`)}
      {face('left', d, h, `rotateY(-90deg) translateZ(${w / 2}px)`)}
      {face('right', d, h, `rotateY(90deg) translateZ(${w / 2}px)`)}
      {face('top', w, d, `rotateX(90deg) translateZ(${h / 2}px)`)}
      {face('bottom', w, d, `rotateX(-90deg) translateZ(${h / 2}px)`)}
      {inner && <div style={{ ...P3, transform: `translateY(${h / 2 - 3}px) rotateX(90deg)` }}><div style={{ position: 'absolute', left: -w / 2 + 6, top: -d / 2 + 6, width: w - 12, height: d - 12 }}>{inner}</div></div>}
    </div>
  );
};

/** A coffin: open box + a lid hinged on its back edge (open: 0 = closed, 1 = fully open). */
export const Coffin: React.FC<{ w: number; h: number; d: number; x?: number; y?: number; z?: number; skin: string; lidSkin?: string; open: number; label?: string; inner?: React.ReactNode }> = ({ w, h, d, x = 0, y = 0, z = 0, skin, lidSkin, open, label, inner }) => (
  <div style={{ ...P3, transform: `translate3d(${x}px,${y}px,${z}px)` }}>
    <Box w={w} h={h} d={d} skin={skin} omit={['top']} label={label} inner={inner} />
    <div style={{ ...P3, transform: `translate3d(0px,${-h / 2}px,${-d / 2}px) rotateX(${105 * open}deg)` }}>
      <Box w={w + 10} h={12} d={d + 10} z={(d + 10) / 2} skin={lidSkin ?? skin} />
    </div>
  </div>
);

/** A flat plane (floor / ocean / map) lying on y, centred on (x,z). */
export const Floor: React.FC<{ w: number; d: number; x?: number; y?: number; z?: number; bg: string; children?: React.ReactNode }> = ({ w, d, x = 0, y = 0, z = 0, bg, children }) => (
  <div style={{ ...P3, transform: `translate3d(${x}px,${y}px,${z}px) rotateX(90deg)` }}>
    <div style={{ position: 'absolute', left: -w / 2, top: -d / 2, width: w, height: d, background: bg }}>{children}</div>
  </div>
);

/** An upright paper cut-out facing the camera (counter-rotated by -yaw so it always faces us). */
export const Billboard: React.FC<{ x: number; y?: number; z: number; yaw?: number; w?: number; h?: number; children: React.ReactNode }> = ({ x, y = 0, z, yaw = 0, w = 400, h = 600, children }) => (
  <div style={{ ...P3, transform: `translate3d(${x}px,${y}px,${z}px) rotateY(${-yaw}deg)` }}>
    <div style={{ position: 'absolute', left: -w / 2, top: -h, width: w, height: h }}>{children}</div>
  </div>
);

export const WOOD = 'repeating-linear-gradient(92deg, #6b3a1e 0 6px, #7a4426 6px 14px, #5f3218 14px 20px), linear-gradient(#7a4426,#5a2f17)';
export const MAHOGANY = 'repeating-linear-gradient(90deg, #5a2414 0 5px, #6e2c18 5px 12px, #4f1f10 12px 18px)';
export const TIN = 'linear-gradient(135deg, #c9cdd2, #9aa1a8 45%, #d7dbe0 60%, #8d939a)';
export const LEAD = 'linear-gradient(135deg, #7d8186, #5d6166 50%, #85898e)';
export const STONE = 'repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0 2px, transparent 2px 9px), linear-gradient(135deg, #b9b2a6, #9a9387)';
export const EARTH = 'radial-gradient(ellipse at 50% 50%, #5a4632 0%, #3c2e20 70%)';
