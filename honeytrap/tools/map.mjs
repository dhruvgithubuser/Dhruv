// Build assets/map.json: Natural Earth 110m countries (world-atlas) projected to a 1000-wide box.
import fs from 'node:fs';
import { feature } from 'topojson-client';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
const topo = JSON.parse(fs.readFileSync(new URL('../../node_modules/world-atlas/countries-110m.json', import.meta.url)));
const fc = feature(topo, topo.objects.countries);
fc.features = fc.features.filter((f) => f.properties.name !== 'Antarctica');
const proj = geoNaturalEarth1().rotate([-30, 0]).fitWidth(1000, fc);
const path = geoPath(proj);
const [[x0, y0], [x1, y1]] = path.bounds(fc);
const out = { w: 1000, h: Math.ceil(y1 - y0), oy: y0, countries: {} };
for (const f of fc.features) out.countries[f.properties.name] = path(f);
const c = (n) => { const ff = fc.features.find((f) => f.properties.name === n); return path.centroid(ff); };
out.us = c('United States of America'); out.cn = c('China');
fs.writeFileSync(new URL('../assets/map.json', import.meta.url), JSON.stringify(out));
console.log(Object.keys(out.countries).length, 'countries', out.w, 'x', out.h, 'us', out.us, 'cn', out.cn);
