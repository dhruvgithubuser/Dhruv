import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import meta from '../../public/sat/meta.json';
import { C, H, MONO, SANS, W, noise1 } from '../theme';

// Sentinel-2 cloudless mosaics (EOX, 2016, CC BY 4.0), one per zoom level, Web-Mercator world pixels.
const LEVELS = [4, 6, 8, 10, 12, 14];
const M = meta as Record<string, { x0: number; y0: number; w: number; h: number }>;
export const wp = (lat: number, lon: number, z: number) => {
  const s = 256 * 2 ** z;
  const x = ((lon + 180) / 360) * s;
  const y = ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * s;
  return [x, y];
};

export type MapCam = { f: number; lat: number; lon: number; z: number; rot?: number };
export function useMapCam(keys: MapCam[]) {
  const f = useCurrentFrame();
  let i = 0;
  while (i < keys.length - 2 && f > keys[i + 1].f) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  const p = a === b ? 0 : interpolate(f, [a.f, b.f], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  // drone-like drift so even "static" holds breathe
  const drift = 0.00004 * 2 ** (14 - (a.z + (b.z - a.z) * p));
  return {
    lat: a.lat + (b.lat - a.lat) * p + noise1(f * 0.01, 3) * drift,
    lon: a.lon + (b.lon - a.lon) * p + noise1(f * 0.01, 7) * drift,
    z: a.z + (b.z - a.z) * p,
    rot: (a.rot ?? 0) + ((b.rot ?? a.rot ?? 0) - (a.rot ?? 0)) * p,
  };
}

/** Project lat/lon to screen px for the current camera. */
export const project = (cam: { lat: number; lon: number; z: number }, lat: number, lon: number) => {
  const [cx, cy] = wp(cam.lat, cam.lon, cam.z);
  const [x, y] = wp(lat, lon, cam.z);
  return [W / 2 + (x - cx), H / 2 + (y - cy)];
};

const Layer: React.FC<{ L: number; cam: { lat: number; lon: number; z: number }; opacity: number }> = ({ L, cam, opacity }) => {
  if (opacity <= 0) return null;
  const m = M[String(L)];
  const s = 2 ** (cam.z - L);
  const [cx, cy] = wp(cam.lat, cam.lon, L);
  const left = W / 2 - (cx - m.x0) * s, top = H / 2 - (cy - m.y0) * s;
  return <Img src={staticFile(`sat/z${L}.jpg`)} style={{ position: 'absolute', left, top, width: m.w * s, height: m.h * s, opacity, imageRendering: 'auto' }} />;
};

/** Satellite view with crossfaded zoom levels; children get the camera for overlays. */
export const SatMap: React.FC<{ keys: MapCam[]; grade?: string; children?: (cam: { lat: number; lon: number; z: number }) => React.ReactNode }> = ({ keys, grade, children }) => {
  const cam = useMapCam(keys);
  const lo = [...LEVELS].reverse().find((L) => L <= cam.z) ?? 4;
  const hi = LEVELS[LEVELS.indexOf(lo) + 1];
  const t = hi ? Math.max(0, Math.min(1, (cam.z - (hi - 0.7)) / 0.5)) : 0;
  return (
    <AbsoluteFill style={{ background: '#0a0d10', overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `rotate(${cam.rot}deg) scale(${cam.rot ? 1.15 : 1})`, filter: grade ?? 'contrast(1.18) saturate(1.05) brightness(0.88) sepia(0.12)' }}>
        <Layer L={lo} cam={cam} opacity={1} />
        {hi && <Layer L={hi} cam={cam} opacity={t} />}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,10,20,0.55) 100%)' }} />
      <AbsoluteFill style={{ transform: `rotate(${cam.rot}deg) scale(${cam.rot ? 1.15 : 1})` }}>
        <svg width={W} height={H} style={{ overflow: 'visible' }}>{children?.(cam)}</svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Pulsing location marker with a label and leader line. */
export const Marker: React.FC<{ x: number; y: number; label?: string; sub?: string; color?: string; dx?: number; dy?: number; o?: number }> = ({ x, y, label, sub, color = C.accent, dx = 60, dy = -60, o = 1 }) => {
  const f = useCurrentFrame();
  const ph = (f % 45) / 45;
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      <circle cx={x} cy={y} r={10 + ph * 40} fill="none" stroke={color} strokeWidth={3} opacity={1 - ph} />
      <circle cx={x} cy={y} r={9} fill={color} stroke="#fff" strokeWidth={3} />
      {label && (<>
        <line x1={x} y1={y} x2={x + dx} y2={y + dy} stroke="#fff" strokeWidth={2} opacity={0.8} />
        <text x={x + dx + (dx > 0 ? 12 : -12)} y={y + dy - 6} textAnchor={dx > 0 ? 'start' : 'end'} fontFamily={SANS} fontWeight={600} fontSize={36} fill="#fff" letterSpacing={2} style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.6)', strokeWidth: 6 }}>{label}</text>
        {sub && <text x={x + dx + (dx > 0 ? 12 : -12)} y={y + dy + 28} textAnchor={dx > 0 ? 'start' : 'end'} fontFamily={MONO} fontSize={28} fill={C.amber} letterSpacing={1} style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.6)', strokeWidth: 5 }}>{sub}</text>}
      </>)}
    </g>
  );
};
