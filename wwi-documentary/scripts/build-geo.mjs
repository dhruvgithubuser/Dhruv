// Europe coastline for the 1914 maps: Natural Earth 1:50m land (world-atlas, public domain), clipped to a box
// around Europe by clamping (edges outside the view run along the box border, invisible in frame).
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { feature } from 'topojson-client';
const require = createRequire(import.meta.url);
const topo = require('world-atlas/land-50m.json');
const land = feature(topo, topo.objects.land);
const [W, E, S, N] = [-26, 62, 28, 73];
const rings = [];
for (const f of land.features) for (const poly of f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates) {
  const r = poly[0];
  if (!r.some(([lo, la]) => lo > W && lo < E && la > S && la < N)) continue;
  const out = [];
  for (const [lo, la] of r) {
    const p = [Math.round(Math.min(E, Math.max(W, lo)) * 100) / 100, Math.round(Math.min(N, Math.max(S, la)) * 100) / 100];
    const q = out[out.length - 1];
    if (!q || q[0] !== p[0] || q[1] !== p[1]) out.push(p);
  }
  if (out.length > 3) rings.push(out);
}
fs.writeFileSync(new URL('../src/europe.json', import.meta.url), JSON.stringify(rings));
console.log(rings.length, 'rings', rings.reduce((a, r) => a + r.length, 0), 'points');
