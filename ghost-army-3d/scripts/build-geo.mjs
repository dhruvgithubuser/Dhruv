// Western Europe for the 1944–45 maps: Natural Earth 1:50m land (world-atlas, public domain), clipped by clamping.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { feature, mesh } from 'topojson-client';
const require = createRequire(import.meta.url);
const [W, E, S, N] = [-8, 16, 42, 57];
const topo = require('world-atlas/land-50m.json');
const land = feature(topo, topo.objects.land);
const rings = [];
for (const f of land.features) for (const poly of f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates) for (const r of poly) {
  if (!r.some(([lo, la]) => lo > W && lo < E && la > S && la < N)) continue;
  const out = [];
  for (const [lo, la] of r) { const p = [Math.round(Math.min(E, Math.max(W, lo)) * 1000) / 1000, Math.round(Math.min(N, Math.max(S, la)) * 1000) / 1000]; const q = out[out.length - 1]; if (!q || q[0] !== p[0] || q[1] !== p[1]) out.push(p); }
  if (out.length > 3) rings.push(out);
}
const ct = require('world-atlas/countries-50m.json');
const bm = mesh(ct, ct.objects.countries, (a, b) => a !== b);
const borders = [];
for (const line of bm.coordinates) {
  const seg = line.filter(([lo, la]) => lo > W && lo < E && la > S && la < N).map(([lo, la]) => [Math.round(lo * 1000) / 1000, Math.round(la * 1000) / 1000]);
  if (seg.length > 1) borders.push(seg);
}
fs.writeFileSync(new URL('../src/data/europe.json', import.meta.url), JSON.stringify({ land: rings, borders }));
console.log('rings', rings.length);
