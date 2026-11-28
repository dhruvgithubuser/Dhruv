// Build src/geo.json from Natural Earth 1:110m (world-atlas): land, USA and the 1983 USSR
// (the 15 republics' present-day territories) as [lon, lat] rings rounded to 0.1 deg.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const topo = require('topojson-client');
const world = require('world-atlas/countries-110m.json');
const land = require('world-atlas/land-110m.json');
const USSR = new Set(['643', '804', '112', '398', '860', '795', '417', '762', '268', '051', '031', '498', '440', '428', '233']);
const r = (v) => Math.round(v * 10) / 10;
const rings = (geom) => (geom.type === 'Polygon' ? geom.coordinates : geom.coordinates.flat()).map((ring) => ring.map(([x, y]) => [r(x), r(y)]));
const feats = topo.feature(world, world.objects.countries).features;
const pick = (pred) => feats.filter(pred).flatMap((f) => rings(f.geometry));
const out = {
  land: topo.feature(land, land.objects.land).features.flatMap((f) => rings(f.geometry)),
  usa: pick((f) => f.id === '840'),
  ussr: pick((f) => USSR.has(f.id)),
};
fs.writeFileSync(new URL('../src/geo.json', import.meta.url), JSON.stringify(out));
console.log('land', out.land.length, 'usa', out.usa.length, 'ussr', out.ussr.length);
