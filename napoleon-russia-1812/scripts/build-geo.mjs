// Europe + western Russia for the 1812 maps: Natural Earth 1:50m land + modern borders (world-atlas, public domain).
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { feature, mesh } from 'topojson-client';
const require = createRequire(import.meta.url);
const [W, E, S, N] = [-12, 52, 34, 66];
const clamp = (r) => { const out = []; for (const [lo, la] of r) { const p = [Math.round(Math.min(E, Math.max(W, lo)) * 100) / 100, Math.round(Math.min(N, Math.max(S, la)) * 100) / 100]; const q = out[out.length - 1]; if (!q || q[0] !== p[0] || q[1] !== p[1]) out.push(p); } return out; };
const topo = require('world-atlas/land-50m.json');
const rings = [];
for (const f of feature(topo, topo.objects.land).features) for (const poly of f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates) for (const r of poly) {
  if (!r.some(([lo, la]) => lo > W && lo < E && la > S && la < N)) continue; const c = clamp(r); if (c.length > 3) rings.push(c);
}
const ct = require('world-atlas/countries-50m.json');
const borders = mesh(ct, ct.objects.countries, (a, b) => a !== b).coordinates.map((l) => l.filter(([lo, la]) => lo > W && lo < E && la > S && la < N).map(([lo, la]) => [Math.round(lo * 100) / 100, Math.round(la * 100) / 100])).filter((l) => l.length > 1);
fs.writeFileSync(new URL('../src/data/europe.json', import.meta.url), JSON.stringify({ land: rings, borders }));
console.log('rings', rings.length, 'borders', borders.length);
