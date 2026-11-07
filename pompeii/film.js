// POMPEII: THE CITY THAT DISAPPEARED IN ONE DAY · Buried Chronicles
// A pure function of time: window.seek(t) paints frame t (lib/motion.js). The narration's
// timeline.json is the clock; shots.js is the shot list; sets/ paint the worlds; lib/gfx.js the graphics.
import * as M from './lib/motion.js';
import { buildArt, finish } from './lib/paint.js';
import { canvas, clamp, smooth } from './lib/util.js';
import { setLand } from './sets/map.js';
import { buildShots, overlays } from './shots.js';
import { titleCard, chapterCard, lowerThird, sourceTag, stamp, CREAM } from './lib/gfx.js';

const { W, H } = M;
let SHOTS = [], CARDS = [], buf = null;

function drawShot(ctx, s, t, IMG) {
  const lt = t - s.t0, d = s.t1 - s.t0;
  ctx.save(); s.draw(ctx, lt, d, t, IMG, W, H); ctx.restore();
}
function shotOverlays(ctx, s, t) {
  const lt = t - s.t0, d = s.t1 - s.t0;
  if (s.title) titleCard(ctx, W, H, smooth(s.title[0], s.title[0] + 2.4, lt), smooth(s.title[1] - 0.8, s.title[1], lt));
  if (s.lower) lowerThird(ctx, W, H, s.lower[2], s.lower[3], smooth(s.lower[0], s.lower[0] + 0.9, lt), smooth(s.lower[1] - 0.5, s.lower[1], lt));
  if (s.stamp) stamp(ctx, W, H, s.stamp[2], smooth(s.stamp[0], s.stamp[0] + 1.2, lt), smooth(s.stamp[1] - 0.5, s.stamp[1], lt), { sub: s.stamp[3], y: H * 0.46, size: 160 });
  if (s.caption) { const a = smooth(s.caption[0], s.caption[0] + 0.8, lt) * (1 - smooth(s.caption[1] - 0.6, s.caption[1], lt)); if (a > 0) { ctx.save(); ctx.globalAlpha = a; ctx.font = 'italic 400 44px Display'; ctx.textAlign = 'center'; ctx.fillStyle = CREAM; ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 18; ctx.fillText(s.caption[2], W / 2, H * 0.84); ctx.restore(); } }
  if (s.tag) sourceTag(ctx, W, H, s.tag, smooth(0.3, 1.0, lt) * (1 - smooth(d - 0.4, d, lt)));
}

M.film({
  samples: (t) => 1,
  images: { bayard: 'assets/archival/bayard_fiorelli_excavations_1860s.jpg', capaldo: 'assets/archival/capaldo_excavation_watercolour_19c.jpg' },
  async init() {
    buildArt();
    const [tl, land] = await Promise.all([fetch('timeline.json').then((r) => r.json()), fetch('assets/map_land_10m_med.json').then((r) => r.json())]);
    setLand(land);
    SHOTS = buildShots(tl); CARDS = overlays(tl);
    window.SHOTS = SHOTS.map((s) => ({ id: s.id, t0: s.t0, t1: s.t1, set: s.set }));
    buf = canvas(W, H);
  },
  draw(ctx, u, t, IMG) {
    let i = SHOTS.findIndex((s) => t >= s.t0 && t < s.t1); if (i < 0) i = t < 0 ? 0 : SHOTS.length - 1;
    const s = SHOTS[i], lt = t - s.t0;
    const [kind, dur] = s.tin || ['cut', 0];
    if (i > 0 && kind !== 'cut' && lt < dur) {
      const p = SHOTS[i - 1], k = M.E.inOutSine(clamp(lt / dur));
      const b = buf.getContext('2d');
      if (kind === 'dissolve') { drawShot(ctx, p, t, IMG); b.save(); drawShot(b, s, t, IMG); b.restore(); ctx.globalAlpha = k; ctx.drawImage(buf, 0, 0); ctx.globalAlpha = 1; }
      else if (kind === 'dip') { if (k < 0.5) { drawShot(ctx, p, t, IMG); ctx.fillStyle = `rgba(6,4,2,${k * 2})`; } else { drawShot(ctx, s, t, IMG); ctx.fillStyle = `rgba(6,4,2,${(1 - k) * 2})`; } ctx.fillRect(0, 0, W, H); }
      else if (kind === 'whip') { const x = (1 - k) * W; ctx.save(); ctx.translate(x - W, 0); drawShot(ctx, p, t, IMG); ctx.restore(); drawShot(b, s, t, IMG); ctx.drawImage(buf, x, 0); }
      else if (kind === 'wipe') { drawShot(ctx, p, t, IMG); drawShot(b, s, t, IMG); const x = (1 - k) * W; ctx.drawImage(buf, x, 0, W - x, H, x, 0, W - x, H); ctx.fillStyle = '#e8bd55'; ctx.fillRect(x - 2, 0, 4, H); }
      else drawShot(ctx, s, t, IMG);
    } else drawShot(ctx, s, t, IMG);
    shotOverlays(ctx, s, t);
    for (const c of CARDS) if (t > c.t0 - 0.1 && t < c.t1 + 0.1) chapterCard(ctx, W, H, c.num, c.title, smooth(c.t0, c.t0 + 1.6, t), smooth(c.t1 - 0.7, c.t1, t));
  },
  post(ctx, u, t) {
    finish(ctx, W, H, t);
    // fade in from black at the head, out at the tail
    const a = Math.max(1 - smooth(0, 1.2, t), smooth(window.DURATION - 1.2, window.DURATION, t));
    if (a > 0) { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.fillRect(0, 0, W, H); }
  },
});
