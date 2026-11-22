// Builds src/data/atlantic.json: land outline (world-atlas 50m) projected equirectangularly to 1920x1080,
// lon -66..16, lat 8..56 (Caribbean to the English Channel). Also a zoomed Cadiz/Trafalgar coast path.
import fs from 'node:fs';
import { feature } from 'topojson-client';
const topo = JSON.parse(fs.readFileSync(new URL('../node_modules/world-atlas/land-50m.json', import.meta.url)));
const land = feature(topo, topo.objects.land);
const mk = (lon0, lon1, lat0, lat1, W = 1920, H = 1080) => {
  const px = (lon) => ((lon - lon0) / (lon1 - lon0)) * W, py = (lat) => ((lat1 - lat) / (lat1 - lat0)) * H;
  let d = '';
  const geoms = land.features ? land.features.map((f) => f.geometry) : [land.geometry];
  const polys = geoms.flatMap((g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates));
  for (const poly of polys) for (const ring of poly) {
    const pts = ring.filter(([lo, la]) => lo > lon0 - 8 && lo < lon1 + 8 && la > lat0 - 8 && la < lat1 + 8);
    if (pts.length < 3) continue;
    d += 'M' + pts.map(([lo, la]) => `${px(lo).toFixed(1)},${py(la).toFixed(1)}`).join('L') + 'Z';
  }
  return d;
};
fs.writeFileSync(new URL('../src/data/atlantic.json', import.meta.url), JSON.stringify({
  atlantic: { lon0: -66, lon1: 16, lat0: 8, lat1: 56, d: mk(-66, 16, 8, 56) },
  trafalgar: { lon0: -9.2, lon1: -4.8, lat0: 35.0, lat1: 37.475, d: mk(-9.2, -4.8, 35.0, 37.475) },
}));
console.log('map written');
