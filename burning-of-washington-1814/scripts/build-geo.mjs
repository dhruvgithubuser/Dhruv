// Chesapeake region for the 1814 maps: Natural Earth 1:50m land (world-atlas, public domain), clipped by clamping.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { feature } from 'topojson-client';
const require = createRequire(import.meta.url);
const [W, E, S, N] = [-80, -74, 36, 41.5];
const land = feature(require('world-atlas/land-50m.json'), require('world-atlas/land-50m.json').objects.land);
const rings = [];
for (const f of land.features) for (const poly of f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates) for (const r of poly) {
  if (!r.some(([lo, la]) => lo > W && lo < E && la > S && la < N)) continue;
  const out = [];
  for (const [lo, la] of r) { const p = [Math.round(Math.min(E, Math.max(W, lo)) * 1000) / 1000, Math.round(Math.min(N, Math.max(S, la)) * 1000) / 1000]; const q = out[out.length - 1]; if (!q || q[0] !== p[0] || q[1] !== p[1]) out.push(p); }
  if (out.length > 3) rings.push(out);
}
fs.writeFileSync(new URL('../src/data/chesapeake.json', import.meta.url), JSON.stringify(rings));
console.log('rings', rings.length, rings.reduce((s, r) => s + r.length, 0));
