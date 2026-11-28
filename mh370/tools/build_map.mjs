// Build mh370/assets/map.json from Natural Earth 1:50m (world-atlas): land rings + country borders,
// clipped to the Indian Ocean / SE Asia window, coordinates as [lon, lat] rounded to 0.02 deg.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const topo = require('topojson-client');
const land = require('world-atlas/land-50m.json');
const countries = require('world-atlas/countries-50m.json');
const BOX = [10, -55, 140, 60]; // lon0 lat0 lon1 lat1
const r = (v) => Math.round(v * 50) / 50;
const inBox = (pts) => pts.some(([x, y]) => x >= BOX[0] && x <= BOX[2] && y >= BOX[1] && y <= BOX[3]);
const thin = (pts) => { const o = []; for (const p of pts) { const q = [r(p[0]), r(p[1])]; const l = o[o.length - 1]; if (!l || l[0] !== q[0] || l[1] !== q[1]) o.push(q); } return o; };
const L = topo.feature(land, land.objects.land);
const rings = [];
for (const f of L.features) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys) for (const ring of poly) if (inBox(ring)) { const t = thin(ring); if (t.length > 3) rings.push(t); }
}
const mesh = topo.mesh(countries, countries.objects.countries, (a, b) => a !== b);
const borders = mesh.coordinates.filter(inBox).map(thin).filter((l) => l.length > 1);
fs.writeFileSync(new URL('../assets/map.json', import.meta.url), JSON.stringify({ rings, borders }));
console.log('rings', rings.length, 'pts', rings.reduce((a, b) => a + b.length, 0), 'borders', borders.length);
