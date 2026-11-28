// Builds src/data/zulu.json: land outline (world-atlas 50m) projected equirectangularly to 1920x1080.
// zulu: Zululand and Natal, 1879 (lon 29.4..33.04, lat -29.4..-27.6): the coast of the Indian Ocean on the right.
// Whole coastline rings are kept (the SVG viewport clips them); rings that wrap the antimeridian are unwrapped.
import fs from 'node:fs';
import { feature } from 'topojson-client';

const topo = JSON.parse(fs.readFileSync(new URL('../node_modules/world-atlas/land-50m.json', import.meta.url)));
const land = feature(topo, topo.objects.land);
const geoms = land.features ? land.features.map((f) => f.geometry) : [land.geometry];
const polys = geoms.flatMap((g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates));

const mk = (lon0, lon1, lat0, lat1, W = 1920, H = 1080) => {
  const px = (lon) => ((lon - lon0) / (lon1 - lon0)) * W, py = (lat) => ((lat1 - lat) / (lat1 - lat0)) * H;
  let d = '';
  for (const poly of polys) for (const ring of poly) {
    if (ring.length < 3) continue;
    // unwrap longitudes so rings that cross the antimeridian stay continuous (the far side falls outside the view)
    const un = []; let prev = null;
    for (const [lo0, la] of ring) { let lo = lo0; if (prev !== null) { while (lo - prev > 180) lo -= 360; while (lo - prev < -180) lo += 360; } un.push([lo, la]); prev = lo; }
    for (const off of [-360, 0, 360]) {
      const hit = un.some(([lo, la]) => lo + off > lon0 - 3 && lo + off < lon1 + 3 && la > lat0 - 3 && la < lat1 + 3);
      if (!hit) continue;
      d += 'M' + un.map(([lo, la]) => `${px(lo + off).toFixed(1)},${py(la).toFixed(1)}`).join('L') + 'Z';
    }
  }
  return d;
};

fs.writeFileSync(new URL('../src/data/zulu.json', import.meta.url), JSON.stringify({
  zulu: { lon0: 29.4, lon1: 33.04, lat0: -29.4, lat1: -27.6, d: mk(29.4, 33.04, -29.4, -27.6) },
}));
console.log('map written');
