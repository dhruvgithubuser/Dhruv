// gfx.js: Buried Chronicles motion-graphics kit. Two faces: Display (Playfair Display italic, gold
// titles) and Caps (Cinzel: kickers, labels, map names). One accent: antique gold; one signal red
// (#9b2a1a) reserved for danger/data. Every element enters with direction and leaves cleanly.
import { clamp, smooth, lerp, h01 } from './util.js';
import { E } from './motion.js';

export const GOLD = '#e8bd55', GOLD_D = '#9a6a1e', CREAM = '#f3e8cf', INKC = '#2b1d12', RED = '#9b2a1a';
const f = (size, w, fam, it = false) => `${it ? 'italic ' : ''}${w} ${Math.round(size)}px ${fam}`;

function spaced(ctx, str, x, y, track, align = 'left') {
  ctx.letterSpacing = `${track}px`; const w = ctx.measureText(str).width;
  ctx.textAlign = 'left'; ctx.fillText(str, align === 'center' ? x - w / 2 + track / 2 : align === 'right' ? x - w : x, y); ctx.letterSpacing = '0px'; return w;
}
// Gold display type with a dark bevel + soft drop shadow (the channel's title treatment).
export function goldText(ctx, str, x, y, size, a = 1, align = 'center', it = true) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.font = f(size, 800, 'Display', it); ctx.textAlign = align;
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = size * 0.18; ctx.shadowOffsetY = size * 0.04;
  ctx.lineWidth = size * 0.07; ctx.strokeStyle = 'rgba(48,26,8,0.9)'; ctx.lineJoin = 'round'; ctx.strokeText(str, x, y);
  ctx.shadowColor = 'transparent';
  const g = ctx.createLinearGradient(0, y - size * 0.8, 0, y + size * 0.1);
  g.addColorStop(0, '#fbe7a6'); g.addColorStop(0.45, GOLD); g.addColorStop(1, GOLD_D);
  ctx.fillStyle = g; ctx.fillText(str, x, y); ctx.restore();
}
export function capsText(ctx, str, x, y, size, color = CREAM, a = 1, align = 'left', track = 0.18, w = 700) {
  if (a <= 0) return 0;
  ctx.save(); ctx.globalAlpha = a; ctx.font = f(size, w, 'Caps'); ctx.fillStyle = color;
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = size * 0.35;
  const width = spaced(ctx, str, x, y, size * track, align); ctx.restore(); return width;
}
// A word-by-word reveal mask: each word rises in from below a baseline clip.
export function riseText(ctx, str, x, y, size, p, draw) {
  const words = str.split(' '); ctx.save(); ctx.font = f(size, 800, 'Display', true);
  let cx = x; const sp = size * 0.28; const widths = words.map((w) => ctx.measureText(w).width); const total = widths.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
  cx = x - total / 2;
  ctx.beginPath(); ctx.rect(0, y - size * 1.2, 4000, size * 1.45); ctx.clip();
  words.forEach((w, i) => { const k = E.outCubic(clamp(p * (words.length + 1.5) - i)); draw(w, cx + widths[i] / 2, y + (1 - k) * size * 1.2, k); cx += widths[i] + sp; });
  ctx.restore();
}

// Main title (cold-open end): kicker / big gold line / subtitle, with a rule that draws on.
export function titleCard(ctx, W, H, k, out) {
  const a = 1 - smooth(0, 1, out);
  if (k <= 0 || a <= 0) return;
  const cy = H * 0.44;
  ctx.save(); ctx.globalAlpha = a;
  const sh = ctx.createRadialGradient(W / 2, cy, 50, W / 2, cy, W * 0.55); sh.addColorStop(0, 'rgba(10,6,3,0.55)'); sh.addColorStop(1, 'rgba(10,6,3,0)');
  ctx.fillStyle = sh; ctx.fillRect(0, 0, W, H);
  capsText(ctx, 'BURIED CHRONICLES PRESENTS', W / 2, cy - 150, 26, CREAM, smooth(0, 0.25, k), 'center', 0.4);
  riseText(ctx, 'Pompeii', W / 2, cy + 20, 200, clamp(k * 1.6 - 0.15), (w, x, y) => goldText(ctx, w, x, y, 200));
  const rw = 520 * E.outCubic(clamp(k * 2 - 0.7));
  ctx.fillStyle = GOLD; ctx.fillRect(W / 2 - rw / 2, cy + 62, rw, 3);
  capsText(ctx, 'THE CITY THAT DISAPPEARED IN ONE DAY', W / 2, cy + 122, 40, CREAM, smooth(0.55, 0.8, k), 'center', 0.12);
  ctx.save(); ctx.globalAlpha = a * smooth(0.7, 0.95, k); ctx.font = f(34, 400, 'Display', true); ctx.fillStyle = CREAM; ctx.textAlign = 'center'; ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 12;
  ctx.fillText('The Final Hours of an Ancient Roman City', W / 2, cy + 178); ctx.restore();
  ctx.restore();
}

// Chapter card, lower-left: roman numeral kicker + gold italic title, a rule wiping in from the left.
export function chapterCard(ctx, W, H, num, title, k, out) {
  const a = 1 - smooth(0, 1, out); if (k <= 0 || a <= 0) return;
  const x = 110, y = H - 190;
  ctx.save(); ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(0, y - 120, 0, H); g.addColorStop(0, 'rgba(8,5,3,0)'); g.addColorStop(1, 'rgba(8,5,3,0.55)');
  ctx.fillStyle = g; ctx.fillRect(0, y - 120, W * 0.7, H - y + 120);
  const rw = 90 * E.outCubic(clamp(k * 3));
  ctx.fillStyle = GOLD; ctx.fillRect(x, y - 52, rw, 2.5);
  capsText(ctx, `CHAPTER ${num}`, x + (1 - E.outCubic(clamp(k * 3 - 0.2))) * -30, y - 66, 24, GOLD, smooth(0.05, 0.3, k), 'left', 0.32);
  ctx.save(); ctx.beginPath(); ctx.rect(x - 10, y - 50, W, 100); ctx.clip();
  const yy = y + 34 + (1 - E.outCubic(clamp(k * 2.2 - 0.25))) * 90;
  ctx.font = f(64, 800, 'Display', true); ctx.textAlign = 'left'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(40,22,8,0.85)'; ctx.strokeText(title, x, yy);
  const gg = ctx.createLinearGradient(0, yy - 50, 0, yy + 6); gg.addColorStop(0, '#fbe7a6'); gg.addColorStop(0.5, GOLD); gg.addColorStop(1, GOLD_D); ctx.fillStyle = gg; ctx.fillText(title, x, yy);
  ctx.restore(); ctx.restore();
}

// Lower third: a place/date line.
export function lowerThird(ctx, W, H, top, bottom, k, out) {
  const a = 1 - smooth(0, 1, out); if (k <= 0 || a <= 0) return;
  const x = 110, y = H - 150, e = E.outCubic(clamp(k * 2));
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(12,8,5,0.55)'; ctx.fillRect(x - 24, y - 54, (640) * e, 104);
  ctx.fillStyle = GOLD; ctx.fillRect(x - 24, y - 54, 5, 104 * e);
  capsText(ctx, top, x, y - 12, 34, CREAM, smooth(0.2, 0.5, k), 'left', 0.14);
  capsText(ctx, bottom, x, y + 28, 20, GOLD, smooth(0.35, 0.65, k), 'left', 0.3);
  ctx.restore();
}

// Evidence / reconstruction label (editorial honesty): small, bottom-right, consistent all film.
export function sourceTag(ctx, W, H, str, a) {
  if (a <= 0 || !str) return;
  ctx.save(); ctx.globalAlpha = a * 0.9; ctx.font = f(15, 700, 'Caps'); ctx.letterSpacing = '3px';
  const w = ctx.measureText(str).width + 26;
  ctx.fillStyle = 'rgba(12,8,5,0.5)'; ctx.fillRect(W - 60 - w, H - 74, w, 30);
  ctx.fillStyle = 'rgba(243,232,207,0.92)'; ctx.textAlign = 'left'; ctx.fillText(str, W - 60 - w + 13, H - 53);
  ctx.letterSpacing = '0px'; ctx.restore();
}

// Callout with a leader line from (ax, ay) to a label box at (lx, ly). p animates it on.
export function callout(ctx, ax, ay, lx, ly, title, sub, p, { color = CREAM, accent = GOLD, align = 'left', dark = true } = {}) {
  if (p <= 0) return;
  const e = E.outCubic(clamp(p * 2));
  ctx.save();
  ctx.strokeStyle = accent; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + (lx - ax) * e, ay + (ly - ay) * e); ctx.stroke();
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(ax, ay, 5 + 3 * Math.sin(p * 6) * (1 - e), 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = accent; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(ax, ay, 11, 0, Math.PI * 2 * e); ctx.stroke();
  const k = smooth(0.35, 0.8, p);
  if (k > 0) {
    ctx.font = f(28, 700, 'Caps'); ctx.letterSpacing = '3px'; const tw = ctx.measureText(title).width; ctx.letterSpacing = '0px';
    ctx.font = f(22, 400, 'Display', true); const sw = sub ? ctx.measureText(sub).width : 0;
    const bw = Math.max(tw, sw) + 36, bh = sub ? 86 : 52, bx = align === 'left' ? lx : lx - bw, by = ly - bh / 2;
    ctx.globalAlpha = k; if (dark) { ctx.fillStyle = 'rgba(14,9,6,0.62)'; ctx.fillRect(bx, by, bw, bh); }
    ctx.fillStyle = accent; ctx.fillRect(align === 'left' ? bx : bx + bw - 4, by, 4, bh);
    capsText(ctx, title, bx + 18, by + 36, 28, color, 1, 'left', 0.1);
    if (sub) { ctx.font = f(22, 400, 'Display', true); ctx.fillStyle = 'rgba(243,232,207,0.9)'; ctx.textAlign = 'left'; ctx.fillText(sub, bx + 18, by + 70); }
  }
  ctx.restore();
}

// Map label: dot + Caps name (+ optional Latin/modern sub-line).
export function place(ctx, x, y, name, a, o = {}) {
  ctx.save(); ctx.globalAlpha = a;
  const e = E.outBack(clamp(a * 1.2), 2);
  if (!o.noDot) { ctx.fillStyle = o.color || INKC; ctx.beginPath(); ctx.arc(x, y, 6 * e, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = o.color || INKC; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 11 * e, 0, Math.PI * 2); ctx.stroke(); }
  const dx = o.dx ?? 18, dy = o.dy ?? -12, size = o.size || 30;
  ctx.font = f(size, o.weight || 700, 'Caps'); ctx.letterSpacing = `${size * 0.12}px`; ctx.textAlign = o.align || 'left';
  ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(240,228,200,0.85)'; ctx.lineJoin = 'round';
  ctx.strokeText(name, x + dx, y + dy + (1 - a) * 10); ctx.fillStyle = o.color || INKC; ctx.fillText(name, x + dx, y + dy + (1 - a) * 10);
  if (o.sub) { ctx.font = f(size * 0.62, 400, 'Display', true); ctx.letterSpacing = '0px'; ctx.strokeText(o.sub, x + dx, y + dy + size * 0.85); ctx.fillStyle = 'rgba(60,40,24,0.95)'; ctx.fillText(o.sub, x + dx, y + dy + size * 0.85); }
  ctx.letterSpacing = '0px'; ctx.restore();
}
export function tag(ctx, x, y, str, a, color = INKC) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.font = f(24, 700, 'Caps'); ctx.letterSpacing = '2px'; ctx.textAlign = 'center';
  const w = ctx.measureText(str).width + 24; ctx.fillStyle = 'rgba(244,234,210,0.9)'; ctx.fillRect(x - w / 2, y - 22, w, 34); ctx.fillStyle = color; ctx.fillText(str, x, y + 4); ctx.letterSpacing = '0px'; ctx.restore();
}
export function pin(ctx, x, y, p, color = RED) {
  const e = E.outBack(clamp(p * 1.5), 2.2); const yy = y - (1 - clamp(p * 1.5)) * 40;
  ctx.save(); ctx.fillStyle = color; ctx.strokeStyle = 'rgba(20,10,5,0.8)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, yy - 30 * e, 13 * e, Math.PI, 0); ctx.lineTo(x, yy); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = CREAM; ctx.beginPath(); ctx.arc(x, yy - 30 * e, 5 * e, 0, Math.PI * 2); ctx.fill();
  if (p > 0.66) { ctx.strokeStyle = color; ctx.globalAlpha = 1 - smooth(0.66, 1, p); ctx.beginPath(); ctx.arc(x, y, 10 + 50 * smooth(0.66, 1, p), 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
}
export function compass(ctx, x, y, r, a, t) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha = a * 0.85; ctx.translate(x, y); ctx.rotate(0.03 * Math.sin(t * 0.4));
  ctx.strokeStyle = INKC; ctx.fillStyle = INKC; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 8; i++) { const ang = (i / 8) * Math.PI * 2, L = i % 2 ? r * 0.55 : r * 0.95; ctx.beginPath(); ctx.moveTo(Math.cos(ang - 0.18) * r * 0.12, Math.sin(ang - 0.18) * r * 0.12); ctx.lineTo(Math.cos(ang) * L, Math.sin(ang) * L); ctx.lineTo(Math.cos(ang + 0.18) * r * 0.12, Math.sin(ang + 0.18) * r * 0.12); ctx.closePath(); i % 4 === 2 || i === 6 ? ctx.stroke() : ctx.fill(); }
  ctx.font = f(r * 0.38, 700, 'Caps'); ctx.textAlign = 'center'; ctx.fillText('N', 0, -r * 1.12); ctx.restore();
}
export function scale(ctx, x, y, px, label) {
  ctx.save(); ctx.strokeStyle = INKC; ctx.fillStyle = INKC; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + px, y); ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 8); ctx.moveTo(x + px, y - 8); ctx.lineTo(x + px, y + 8); ctx.stroke();
  ctx.fillRect(x, y - 4, px / 2, 4);
  ctx.font = f(20, 700, 'Caps'); ctx.letterSpacing = '2px'; ctx.fillText(label, x, y - 16); ctx.letterSpacing = '0px'; ctx.restore();
}
// A large year / date stamp (counters, "c. AD 62").
export function stamp(ctx, W, H, str, k, out, { x = W / 2, y = H * 0.5, size = 150, sub = null } = {}) {
  const a = (1 - smooth(0, 1, out)) * smooth(0, 0.25, k); if (a <= 0) return;
  const s = 1 + 0.25 * (1 - E.outCubic(clamp(k * 2)));
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); goldText(ctx, str, 0, 0, size, a, 'center', false);
  if (sub) capsText(ctx, sub, 0, size * 0.5, size * 0.2, CREAM, a, 'center', 0.25);
  ctx.restore();
}
export const F = { tag, place, pin, compass, scale };
