import geo from '../geo.json';

export type Ring = number[][];
export const GEO = geo as { land: Ring[]; usa: Ring[]; ussr: Ring[] };
const D = Math.PI / 180;

/** North-polar azimuthal equidistant: the USA at the bottom, the USSR at the top (the 1983 radar view). */
export const polar = (cx: number, cy: number, R: number, L = -95, edgeLat = 8) => (lon: number, lat: number) => {
  const a = (lon - L) * D;
  const r = ((90 - lat) / (90 - edgeLat)) * R;
  return [cx + r * Math.sin(a), cy + r * Math.cos(a)];
};

/** Orthographic globe; points behind the limb are pulled onto it so fills stay closed. */
export const ortho = (cx: number, cy: number, R: number, lon0: number, lat0: number) => (lon: number, lat: number) => {
  const la = lat * D, lo = (lon - lon0) * D, l0 = lat0 * D;
  let x = R * Math.cos(la) * Math.sin(lo);
  let y = R * (Math.cos(l0) * Math.sin(la) - Math.sin(l0) * Math.cos(la) * Math.cos(lo));
  const c = Math.sin(l0) * Math.sin(la) + Math.cos(l0) * Math.cos(la) * Math.cos(lo);
  if (c < 0) { const n = Math.hypot(x, y) || 1; x = (x / n) * R; y = (y / n) * R; }
  return [cx + x, cy - y, c];
};

export const pathOf = (rings: Ring[], f: (lon: number, lat: number) => number[]) =>
  rings.map((r) => r.map(([lo, la], i) => { const p = f(lo, la); return `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`; }).join('') + 'Z').join('');

/** Great-circle points from A to B ([lon, lat]). */
export function greatCircle(a: number[], b: number[], n = 48): number[][] {
  const v = ([lo, la]: number[]) => [Math.cos(la * D) * Math.cos(lo * D), Math.cos(la * D) * Math.sin(lo * D), Math.sin(la * D)];
  const A = v(a), B = v(b);
  const om = Math.acos(Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2]));
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, s = Math.sin(om);
    const k1 = Math.sin((1 - t) * om) / s, k2 = Math.sin(t * om) / s;
    const p = [k1 * A[0] + k2 * B[0], k1 * A[1] + k2 * B[1], k1 * A[2] + k2 * B[2]];
    return [Math.atan2(p[1], p[0]) / D, Math.asin(p[2]) / D];
  });
}
