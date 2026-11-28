// North America for the 1754 maps: Natural Earth 1:50m land (world-atlas, public domain) clipped by clamping,
// Great Lakes and wide rivers from OpenStreetMap via @geo-maps (ODbL, "© OpenStreetMap contributors"),
// and the world (1:110m) for the Seven Years' War map.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { feature } from 'topojson-client';
const require = createRequire(import.meta.url);
const clipLand = (topo, [W, E, S, N], step = 1) => {
  const land = feature(topo, topo.objects.land); const rings = [];
  for (const f of land.features) for (const poly of f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates) {
    const r = poly[0];
    if (!r.some(([lo, la]) => lo > W && lo < E && la > S && la < N)) continue;
    const out = [];
    r.forEach(([lo, la], i) => { if (i % step) return; const p = [Math.round(Math.min(E, Math.max(W, lo)) * 100) / 100, Math.round(Math.min(N, Math.max(S, la)) * 100) / 100]; const q = out[out.length - 1]; if (!q || q[0] !== p[0] || q[1] !== p[1]) out.push(p); });
    if (out.length > 3) rings.push(out);
  }
  return rings;
};
const na = clipLand(require('world-atlas/land-50m.json'), [-104, -50, 22, 58]);
const world = clipLand(require('world-atlas/land-110m.json'), [-180, 180, -60, 84]);
const water = JSON.parse(fs.readFileSync(new URL('../src/data/water.json', import.meta.url)));
fs.writeFileSync(new URL('../src/data/na.json', import.meta.url), JSON.stringify({ land: na, lakes: water.lakes }));
fs.writeFileSync(new URL('../src/data/world.json', import.meta.url), JSON.stringify(world));
console.log('na rings', na.length, 'world rings', world.length, 'lakes', water.lakes.length);
