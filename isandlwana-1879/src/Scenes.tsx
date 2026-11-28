import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { Particles } from './kit';
import { Explosion, Shake, VfxDefs } from './vfx';
import map from './data/zulu.json';
import { C, H, HEAD, SANS, SCENES, SERIF, TYPE, W, ease, hash01, lin, wf } from './theme';

/*
 * "Isandlwana: The Zulu General Who Out-Planned the British Empire" (1879) - 16:9 cinematic documentary.
 * Every shot is an AI-generated still turned into a moving camera shot (depth parallax, scripts/parallax.py),
 * labelled DRAMATIZED RECONSTRUCTION. Real photographs (Ntshingwayo 1879, Cetshwayo 1882, the battlefield today)
 * appear as framed prints. Maps are motion graphics: Zululand from real coastline data; the battlefield is schematic.
 */

const GRADE = 'saturate(0.72) sepia(0.2) contrast(1.1) brightness(0.95)';
const CLIP_S = 14; // every parallax clip is 14 s; shots shorter than that play at real speed (no stretching)

/* ───────────── building blocks ───────────── */

const ShotInner: React.FC<{ id: string; dur: number; fadeIn: number }> = ({ id, dur, fadeIn }) => {
  const f = useCurrentFrame();
  const rate = Math.min(1, (CLIP_S * 30 - 4) / Math.max(1, dur));
  return (
    <AbsoluteFill style={{ opacity: fadeIn ? lin(f, 0, fadeIn) : 1 }}>
      <OffthreadVideo src={staticFile(`assets/clips/${id}.mp4`)} playbackRate={rate} muted style={{ width: W, height: H, objectFit: 'cover', filter: GRADE }} />
      <div style={{ position: 'absolute', right: 40, bottom: 26, fontFamily: TYPE, fontWeight: 700, fontSize: 16, letterSpacing: 3, color: 'rgba(246,236,212,0.5)' }}>DRAMATIZED RECONSTRUCTION</div>
    </AbsoluteFill>
  );
};
const Shot: React.FC<{ id: string; from: number; to: number; fadeIn?: number }> = ({ id, from, to, fadeIn = 10 }) => (
  <Sequence from={from} durationInFrames={Math.max(1, to - from)} layout="none"><ShotInner id={id} dur={to - from} fadeIn={fadeIn} /></Sequence>
);

const Dim: React.FC<{ top?: number; bottom?: number }> = ({ top = 0.5, bottom = 0.55 }) => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(0,0,0,${top}) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 62%, rgba(0,0,0,${bottom}) 100%)` }} />
);

const Slate: React.FC<{ at: number; place: string; date?: string; out?: number }> = ({ at, place, date, out }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 6) * (out ? 1 - lin(f, out - 8, out) : 1);
  if (o <= 0) return null;
  const n = Math.floor(lin(f, at, at + 18) * place.length);
  return (
    <div style={{ position: 'absolute', left: 70, top: 64, opacity: o }}>
      <div style={{ width: 70, height: 5, background: C.redHi, marginBottom: 12, transform: `scaleX(${lin(f, at, at + 10)})`, transformOrigin: 'left' }} />
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 56, letterSpacing: 2, color: '#f6ecd4', textShadow: '0 4px 16px rgba(0,0,0,0.9)' }}>{place.slice(0, n)}</div>
      {date && <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 28, letterSpacing: 4, color: C.gold, textShadow: '0 3px 10px #000', opacity: lin(f, at + 14, at + 22) }}>{date}</div>}
    </div>
  );
};

const Chapter: React.FC<{ n: string; title: string; at?: number }> = ({ n, title, at = 4 }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 12) * (1 - lin(f, at + 130, at + 150));
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', right: 70, top: 64, textAlign: 'right', opacity: o, transform: `translateX(${30 * (1 - ease(f, at, at + 16))}px)` }}>
      <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 24, letterSpacing: 8, color: C.gold, textShadow: '0 2px 12px #000' }}>PART {n}</div>
      <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 58, color: '#f4ecda', textShadow: '0 4px 20px #000' }}>{title}</div>
    </div>
  );
};

const Verdict: React.FC<{ at: number; text: string; color?: string; x?: number; y?: number; rot?: number; size?: number; out?: number }> = ({ at, text, color = C.redHi, x = 960, y = 300, rot = -6, size = 80, out }) => {
  const f = useCurrentFrame();
  if (f < at || (out !== undefined && f >= out)) return null;
  const k = ease(f, at, at + 7);
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${1.6 - 0.6 * k})`, opacity: Math.min(1, k * 1.6), border: `8px solid ${color}`, padding: '4px 30px', fontFamily: HEAD, fontWeight: 700, fontSize: size, letterSpacing: 5, color, background: 'rgba(14,10,6,0.55)', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', whiteSpace: 'nowrap' }}>{text}</div>
  );
};

const Chips: React.FC<{ items: { at: number; t: string }[]; top?: number; left?: boolean; out?: number }> = ({ items, top = 200, left, out }) => {
  const f = useCurrentFrame();
  if (out !== undefined && f >= out) return null;
  return (
    <div style={{ position: 'absolute', [left ? 'left' : 'right']: 70, top, display: 'flex', flexDirection: 'column', alignItems: left ? 'flex-start' : 'flex-end', gap: 12, opacity: out !== undefined ? 1 - lin(f, out - 6, out) : 1 }}>
      {items.map((x, i) => f < x.at ? null : (
        <div key={i} style={{ background: 'rgba(14,10,6,0.82)', border: `3px solid ${C.gold}`, padding: '6px 18px', fontFamily: HEAD, fontWeight: 700, fontSize: 38, color: '#f6ecd4', letterSpacing: 2, transform: `translateX(${(left ? -40 : 40) * (1 - lin(f, x.at, x.at + 6))}px)`, opacity: lin(f, x.at, x.at + 6) }}>{x.t}</div>
      ))}
    </div>
  );
};

const Count: React.FC<{ at: number; to: number; label: string; dur?: number; prefix?: string; suffix?: string; top?: number }> = ({ at, to, label, dur = 30, prefix = '', suffix = '', top = 180 }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const v = Math.round(to * ease(f, at, at + dur));
  return (
    <div style={{ position: 'absolute', right: 80, top, textAlign: 'right', opacity: lin(f, at, at + 6) }}>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 150, lineHeight: 1, color: '#fff', textShadow: '0 8px 24px #000' }}>{prefix}{v.toLocaleString('en-US')}{suffix}</div>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 40, color: C.gold, letterSpacing: 4, textShadow: '0 4px 12px #000' }}>{label}</div>
    </div>
  );
};

const QuoteCard: React.FC<{ at: number; text: string; by: string; y?: number; out?: number }> = ({ at, text, by, y = 220, out }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 10) * (out !== undefined ? 1 - lin(f, out - 8, out) : 1);
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 300, right: 300, top: y, opacity: o, background: '#f6f0e2', padding: '30px 44px', boxShadow: '0 16px 40px rgba(0,0,0,0.6)', borderTop: `8px solid ${C.red}`, transform: `rotate(-1deg) translateY(${20 * (1 - ease(f, at, at + 12))}px)` }}>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 46, lineHeight: 1.25, color: C.charcoal }}>“{text}”</div>
      <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 24, color: C.red, marginTop: 16 }}>— {by}</div>
    </div>
  );
};

const Title: React.FC<{ at: number; text: string; sub?: string }> = ({ at, text, sub }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 14);
  if (o <= 0) return null;
  return (
    <AbsoluteFill style={{ background: `rgba(0,0,0,${0.45 * o})`, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', opacity: o }}>
      <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 26, letterSpacing: 12, color: C.gold }}>BURIED CHRONICLES</div>
      <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 150, color: '#f4ecda', marginTop: 10, transform: `scale(${1.05 - 0.05 * ease(f, at, at + 40)})`, textShadow: '0 8px 40px #000', letterSpacing: 6 }}>{text}</div>
      {sub && <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 44, color: '#e2d6bb', marginTop: 10 }}>{sub}</div>}
    </AbsoluteFill>
  );
};

/** Real archival photograph as a framed print. */
const Print: React.FC<{ src: string; at: number; out?: number; x?: number; y?: number; w?: number; h?: number; rot?: number; label: string; pos?: string }> = ({ src, at, out, x, y = 150, w = 700, h = 560, rot = -2, label, pos = '50% 40%' }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  if (f < at || (out !== undefined && f >= out)) return null;
  const k = spring({ frame: f - at, fps, config: { damping: 14, stiffness: 160 } });
  const o = Math.min(1, k * 1.5) * (out !== undefined ? 1 - lin(f, out - 6, out) : 1);
  return (
    <div style={{ position: 'absolute', left: x ?? (W - w) / 2, top: y, width: w, opacity: o, transform: `rotate(${rot + (1 - k) * 6}deg) scale(${1.12 - 0.12 * k})`, background: '#f4eedf', padding: 16, paddingBottom: 66, boxShadow: '0 30px 60px rgba(0,0,0,0.8)' }}>
      <div style={{ width: w - 32, height: h, overflow: 'hidden', background: '#111' }}>
        <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, filter: 'sepia(0.25) contrast(1.06)', transform: `scale(${1 + 0.05 * lin(f, at, at + 200)})` }} />
      </div>
      <div style={{ position: 'absolute', left: 22, right: 18, bottom: 20, fontFamily: TYPE, fontWeight: 700, fontSize: 24, color: C.ink, textAlign: 'center' }}>{label}</div>
      <div style={{ position: 'absolute', right: -14, top: -18, background: C.red, color: '#fff', fontFamily: HEAD, fontWeight: 700, fontSize: 28, padding: '4px 16px', letterSpacing: 2, transform: 'rotate(5deg)' }}>REAL PHOTO</div>
    </div>
  );
};
/** Blurred photo backdrop for a Print. */
const PhotoBg: React.FC<{ src: string }> = ({ src }) => (
  <AbsoluteFill style={{ background: '#0b0805' }}>
    <Img src={staticFile(src)} style={{ position: 'absolute', inset: -60, width: W + 120, height: H + 120, objectFit: 'cover', filter: 'blur(28px) brightness(0.35) sepia(0.3)' }} />
  </AbsoluteFill>
);

/** Rolling rifle smoke + muzzle flashes along a line (volley fire). */
const Volley: React.FC<{ y: number; x0: number; x1: number; seed?: number; n?: number; period?: number }> = ({ y, x0, x1, seed = 2, n = 12, period = 36 }) => {
  const f = useCurrentFrame();
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      <defs><radialGradient id={`mz${seed}`}><stop offset="0" stopColor="#fff7d6" /><stop offset="0.5" stopColor="#ffb347" /><stop offset="1" stopColor="#ff7a1a" stopOpacity="0" /></radialGradient></defs>
      {Array.from({ length: n }, (_, i) => {
        const ph = (f + Math.floor(hash01(i, seed) * 6)) % period; const k = ph / period;
        const x = x0 + ((x1 - x0) * i) / (n - 1) + 30 * k; const r = 18 + 90 * k;
        return <g key={i}><circle cx={x} cy={y - 40 * k} r={r} fill="#ece7dc" opacity={0.45 * (1 - k)} />{ph < 3 && <circle cx={x} cy={y} r={26} fill={`url(#mz${seed})`} opacity={1 - ph / 3} />}</g>;
      })}
    </svg>
  );
};

const Flash: React.FC<{ at: number; color?: string; dur?: number }> = ({ at, color = '255,214,150', dur = 16 }) => {
  const f = useCurrentFrame(); const t = f - at;
  if (t < 0 || t > dur) return null;
  return <AbsoluteFill style={{ background: `rgba(${color},${0.7 * (1 - t / dur)})`, mixBlendMode: 'screen' }} />;
};

const Haze: React.FC<{ color?: string; o?: number; y?: number }> = ({ color = '220,210,190', o = 0.35, y = 600 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity: o }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: 'absolute', left: -700 + ((f * (0.9 + i * 0.4) + i * 700) % 3000), top: y - 260 + i * 160, width: 1500, height: 520, borderRadius: '50%', background: `radial-gradient(ellipse, rgba(${color},0.55), rgba(${color},0) 70%)`, filter: 'blur(24px)' }} />
      ))}
    </AbsoluteFill>
  );
};

/** The eclipse: the light drains out of the frame (and, optionally, the sun's disc is bitten by the moon). */
const Eclipse: React.FC<{ at: number; dur?: number; disc?: boolean }> = ({ at, dur = 90, disc }) => {
  const f = useCurrentFrame();
  const k = ease(f, at, at + dur);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 35%, rgba(40,30,10,${0.25 * k}) 0%, rgba(5,4,2,${0.62 * k}) 80%)` }} />
      <AbsoluteFill style={{ background: `rgba(120,80,20,${0.12 * k})`, mixBlendMode: 'color' }} />
      {disc && (
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <defs><radialGradient id="corona"><stop offset="0.55" stopColor="#ffe9b0" stopOpacity="0.9" /><stop offset="1" stopColor="#ffb347" stopOpacity="0" /></radialGradient></defs>
          <circle cx={1460} cy={250} r={150} fill="url(#corona)" opacity={0.8} />
          <circle cx={1460} cy={250} r={92} fill="#fff4cf" />
          <circle cx={1460 + 150 - 120 * k} cy={236} r={90} fill="#120d06" />
        </svg>
      )}
    </AbsoluteFill>
  );
};

/* ───────────── motion graphics: Zululand map (real coastline) ───────────── */

type LL = [number, number];
const Z = map.zulu;
const PZ = ([lon, lat]: LL): [number, number] => [((lon - Z.lon0) / (Z.lon1 - Z.lon0)) * W, ((Z.lat1 - lat) / (Z.lat1 - Z.lat0)) * H];
const PL: Record<string, LL> = {
  isandlwana: [30.652, -28.358], rorkes: [30.536, -28.348], ondini: [31.42, -28.31], ngwebeni: [30.78, -28.29], mangeni: [30.8, -28.45],
  helpmekaar: [30.37, -28.38], utrecht: [30.32, -27.66], lowerdrift: [31.4, -29.13], eshowe: [31.47, -28.89],
};
const BORDER: LL[] = [[30.15, -27.7], [30.33, -28.02], [30.536, -28.348], [30.62, -28.56], [30.76, -28.72], [31.0, -28.86], [31.24, -29.04], [31.47, -29.22]];
const plen = (p: [number, number][]) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0);
const dpath = (p: [number, number][]) => p.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join('');

const Route: React.FC<{ pts: LL[]; t: number; color: string; label?: string; lx?: number; ly?: number; w?: number }> = ({ pts, t, color, label, lx = 16, ly = -16, w = 7 }) => {
  if (t <= 0) return null;
  const p = pts.map(PZ); const L = plen(p);
  let acc = 0, end = p[p.length - 1];
  for (let i = 1; i < p.length; i++) { const s = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (acc + s >= L * t) { const k = (L * t - acc) / s; end = [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * k, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * k]; break; } acc += s; }
  return (
    <g>
      <path d={dpath(p)} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${L * t} ${L * 2}`} opacity={0.95} />
      <circle cx={end[0]} cy={end[1]} r={12} fill={color} stroke="#efe6d2" strokeWidth={3} />
      {label && <text x={end[0] + lx} y={end[1] + ly} fontFamily={HEAD} fontWeight={700} fontSize={32} fill={color} stroke="#14100a" strokeWidth={6} paintOrder="stroke">{label}</text>}
    </g>
  );
};
const Place: React.FC<{ k: string; name: string; at?: number; dx?: number; dy?: number; color?: string; big?: boolean }> = ({ k, name, at = 0, dx = 16, dy = 8, color = '#f6ecd4', big }) => {
  const f = useCurrentFrame();
  const [px, py] = PZ(PL[k]); const o = lin(f, at, at + 10);
  if (o <= 0) return null;
  const pulse = 1 + 0.25 * Math.sin(f / 6);
  return (
    <g opacity={o}>
      <circle cx={px} cy={py} r={(big ? 13 : 9) * pulse} fill="none" stroke={color} strokeWidth={3} opacity={0.6} />
      <circle cx={px} cy={py} r={big ? 9 : 6} fill={color} />
      <text x={px + dx} y={py + dy} fontFamily={TYPE} fontWeight={700} fontSize={big ? 30 : 25} fill="#f6ecd4" stroke="#14100a" strokeWidth={5} paintOrder="stroke">{name}</text>
    </g>
  );
};
/** Zululand & Natal, 1879: land from world-atlas, the border rivers drawn schematically. */
const ZuluMap: React.FC<{ dur: number; zoom?: [number, number, number]; children?: React.ReactNode; title?: string }> = ({ dur, zoom = [1, 960, 540], children, title }) => {
  const f = useCurrentFrame();
  const [z, cx, cy] = zoom; const zz = z * (1 + 0.04 * lin(f, 0, dur));
  const bp = BORDER.map(PZ);
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 70% 60%, #17324a 0%, #0b1622 75%)', opacity: lin(f, 0, 10) }}>
      <AbsoluteFill style={{ transform: `scale(${zz})`, transformOrigin: `${cx}px ${cy}px` }}>
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <path d={Z.d} fill="#b8a273" stroke="#6b5636" strokeWidth={1.5} opacity={0.95} />
          {Array.from({ length: 60 }, (_, i) => <circle key={i} cx={hash01(i, 3) * 1500 + 40} cy={hash01(i, 4) * 1000 + 40} r={2 + 3 * hash01(i, 5)} fill="#8f7a50" opacity={0.35} />)}
          <path d={dpath(bp)} fill="none" stroke="#5b8fc0" strokeWidth={6} opacity={0.9} />
          <text x={bp[2][0] - 250} y={bp[2][1] + 120} fontFamily={TYPE} fontWeight={700} fontSize={22} fill="#9cc2e6" stroke="#14100a" strokeWidth={4} paintOrder="stroke">BUFFALO & THUKELA RIVERS (BORDER)</text>
          {z === 1 && <text x={150} y={820} fontFamily={HEAD} fontWeight={700} fontSize={40} fill="rgba(30,22,10,0.55)" letterSpacing={8}>NATAL (BRITISH)</text>}
          <text x={980} y={330} fontFamily={HEAD} fontWeight={700} fontSize={50} fill="rgba(30,22,10,0.55)" letterSpacing={8}>ZULU KINGDOM</text>
          <text x={1650} y={880} fontFamily={TYPE} fontWeight={700} fontSize={24} fill="#7fa7c9" letterSpacing={4}>INDIAN OCEAN</text>
          {children}
        </svg>
      </AbsoluteFill>
      {title && <div style={{ position: 'absolute', left: 70, top: 50, fontFamily: TYPE, fontWeight: 700, fontSize: 22, letterSpacing: 4, color: 'rgba(246,236,212,0.75)' }}>{title} · BORDERS APPROXIMATE</div>}
    </AbsoluteFill>
  );
};

/* ───────────── motion graphics: the battlefield (schematic, north up) ───────────── */

type BMode = 'hidden' | 'split' | 'horns' | 'line' | 'collapse' | 'closed' | 'summary';
const MT: [number, number] = [860, 560]; // Isandlwana mountain
const Mountain = () => (
  <g>
    <path d={`M${MT[0] - 120},${MT[1] + 60} L${MT[0] - 70},${MT[1] - 50} L${MT[0] + 10},${MT[1] - 80} L${MT[0] + 90},${MT[1] - 40} L${MT[0] + 120},${MT[1] + 50} Z`} fill="#6b5a3c" stroke="#2f2516" strokeWidth={4} />
    <path d={`M${MT[0] - 60},${MT[1] - 30} L${MT[0] + 10},${MT[1] - 60} L${MT[0] + 70},${MT[1] - 25}`} fill="none" stroke="#9c8558" strokeWidth={4} />
    <text x={MT[0]} y={MT[1] + 100} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={30} fill="#f6ecd4" stroke="#14100a" strokeWidth={5} paintOrder="stroke">ISANDLWANA</text>
  </g>
);
const Tents: React.FC<{ red?: number }> = ({ red = 0 }) => (
  <g>{Array.from({ length: 24 }, (_, i) => { const x = MT[0] + 150 + (i % 6) * 26, y = MT[1] - 70 + Math.floor(i / 6) * 34; return <path key={i} d={`M${x - 9},${y + 8} L${x},${y - 10} L${x + 9},${y + 8} Z`} fill={red > 0 ? `rgba(${200 + 40 * red},${230 - 160 * red},${220 - 160 * red},1)` : '#efe9dc'} stroke="#3a3122" strokeWidth={1.5} />; })}</g>
);
/** A dense mass of warriors drawn as dots inside an ellipse, moving from a to b over t. */
const Mass: React.FC<{ a: [number, number]; b: [number, number]; t: number; rx: number; ry: number; n?: number; seed?: number; rot?: number }> = ({ a, b, t, rx, ry, n = 90, seed = 1, rot = 0 }) => {
  const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {Array.from({ length: n }, (_, i) => { const r = Math.sqrt(hash01(i, seed)); const th = hash01(i, seed + 1) * Math.PI * 2; return <circle key={i} cx={Math.cos(th) * r * rx} cy={Math.sin(th) * r * ry} r={7} fill="#120c08" stroke="#f0d9a8" strokeWidth={2} />; })}
    </g>
  );
};
const Arrow: React.FC<{ d: string; t: number; color?: string; w?: number }> = ({ d, t, color = '#e8d5a8', w = 8 }) => (
  <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray="3000" strokeDashoffset={3000 * (1 - t)} markerEnd="url(#ah)" opacity={t > 0 ? 0.95 : 0} />
);
const BattleMap: React.FC<{ mode: BMode; dur: number; p?: number }> = ({ mode, dur, p: pIn }) => {
  const f = useCurrentFrame();
  const p = pIn ?? ease(f, 12, Math.max(30, dur - 24));
  const RED = '#c0392b';
  // British firing line: an arc east/north-east of the camp
  const lineR = mode === 'collapse' || mode === 'closed' ? 330 - 170 * (mode === 'closed' ? 1 : p) : 330;
  const arc = Array.from({ length: 22 }, (_, i) => { const th = (-110 + i * 8) * Math.PI / 180; return [MT[0] + 200 + Math.cos(th) * lineR * 1.15, MT[1] + Math.sin(th) * lineR * 0.85] as [number, number]; });
  const showLine = mode === 'line' || mode === 'horns' || mode === 'collapse' || mode === 'closed';
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 50%, #5a5136 0%, #2a2618 85%)', opacity: lin(f, 0, 10) }}>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <defs><marker id="ah" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#e8d5a8" /></marker></defs>
        {Array.from({ length: 80 }, (_, i) => <path key={i} d={`M${hash01(i, 7) * 1920},${hash01(i, 8) * 1080} q10,-6 20,0`} fill="none" stroke="#7d7150" strokeWidth={2} opacity={0.35} />)}
        {/* plateau escarpment to the north */}
        <path d="M0,250 C400,300 700,180 1100,240 C1400,280 1650,200 1920,230" fill="none" stroke="#8c7b52" strokeWidth={10} strokeDasharray="20 14" opacity={0.7} />
        <text x={1160} y={210} fontFamily={TYPE} fontWeight={700} fontSize={24} fill="#d8c8a0">NQUTU PLATEAU (ESCARPMENT)</text>
        {/* road to Rorke's Drift, west */}
        <path d={`M${MT[0] - 120},${MT[1] + 40} L120,${MT[1] + 120}`} fill="none" stroke="#a8946a" strokeWidth={5} strokeDasharray="10 10" />
        <text x={110} y={MT[1] + 165} fontFamily={TYPE} fontWeight={700} fontSize={24} fill="#d8c8a0">← RORKE'S DRIFT (10 MILES)</text>
        <Mountain />
        <Tents red={mode === 'closed' ? p : 0} />
        <text x={MT[0] + 220} y={MT[1] + 110} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={28} fill="#f6ecd4" stroke="#14100a" strokeWidth={5} paintOrder="stroke">BRITISH CAMP</text>
        {showLine && <path d={dpath(arc)} fill="none" stroke={RED} strokeWidth={mode === 'line' ? 10 + 4 * Math.sin(f / 5) : 9} strokeLinecap="round" opacity={0.95} />}
        {mode === 'line' && <text x={arc[16][0] + 30} y={arc[16][1]} fontFamily={HEAD} fontWeight={700} fontSize={34} fill="#ffb4a8" stroke="#14100a" strokeWidth={6} paintOrder="stroke" opacity={lin(p, 0.2, 0.5)}>FIRING LINE: TOO LONG, TOO THIN</text>}
        {(mode === 'hidden' || mode === 'split' || mode === 'summary') && (
          <g>
            <Mass a={[1640, 150]} b={[1640, 150]} t={0} rx={170} ry={70} n={140} seed={3} />
            <text x={1640} y={260} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={34} fill="#f6ecd4" stroke="#14100a" strokeWidth={6} paintOrder="stroke">NGWEBENI VALLEY · 20,000 HIDDEN</text>
            <path d={`M${MT[0] + 260},${MT[1] - 120} L1500,200`} stroke="#f0d78a" strokeWidth={4} strokeDasharray="12 10" opacity={lin(p, 0.3, 0.6)} />
            <text x={1250} y={330} fontFamily={HEAD} fontWeight={700} fontSize={40} fill="#f0d78a" stroke="#14100a" strokeWidth={6} paintOrder="stroke" opacity={lin(p, 0.4, 0.7)}>≈ 7 MILES</text>
          </g>
        )}
        {(mode === 'split' || mode === 'summary') && (
          <g>
            <Arrow d={`M${MT[0] + 240},${MT[1] + 60} C1250,800 1500,900 1760,980`} t={mode === 'summary' ? 1 : p} color="#ff9a8a" w={12} />
            <text x={1340} y={830} fontFamily={HEAD} fontWeight={700} fontSize={34} fill="#ffb4a8" stroke="#14100a" strokeWidth={6} paintOrder="stroke" opacity={mode === 'summary' ? 1 : lin(p, 0.5, 0.8)}>CHELMSFORD TO MANGENI · 2,800 MEN</text>
            <text x={MT[0] + 220} y={MT[1] + 150} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={30} fill="#f0d78a" stroke="#14100a" strokeWidth={5} paintOrder="stroke" opacity={mode === 'summary' ? 1 : lin(p, 0.7, 0.9)}>LEFT IN CAMP: ~1,300</text>
          </g>
        )}
        {(mode === 'horns' || mode === 'collapse' || mode === 'closed') && (() => {
          const t = mode === 'horns' ? p : 1;
          const c = mode === 'closed' ? 1 : mode === 'collapse' ? p : 0;
          return (
            <g>
              {/* chest: from the north-east straight at the camp */}
              <Mass a={[1550, 230]} b={[MT[0] + 560 - 200 * c, MT[1] - 160 + 80 * c]} t={t} rx={150} ry={80} n={130} seed={5} rot={-30} />
              {/* left horn: sweeps south around the British right */}
              <Arrow d={`M1650,300 C1800,700 1500,950 ${1150 - 250 * c},${900 - 120 * c}`} t={t} w={10} />
              <Mass a={[1650, 300]} b={[1150 - 250 * c, 880 - 120 * c]} t={t} rx={90} ry={55} n={70} seed={6} />
              {/* right horn: swings north and west behind the mountain */}
              <Arrow d={`M1450,180 C1000,120 500,250 ${420 + 200 * c},${MT[1] + 60 + 40 * c}`} t={t} w={10} />
              <Mass a={[1450, 180]} b={[420 + 200 * c, MT[1] + 40 + 40 * c]} t={t} rx={90} ry={55} n={70} seed={7} />
              <text x={1520} y={140} fontFamily={HEAD} fontWeight={700} fontSize={30} fill="#f6ecd4" stroke="#14100a" strokeWidth={5} paintOrder="stroke" opacity={lin(t, 0.1, 0.3)}>CHEST</text>
              <text x={1600} y={760} fontFamily={HEAD} fontWeight={700} fontSize={30} fill="#f6ecd4" stroke="#14100a" strokeWidth={5} paintOrder="stroke" opacity={lin(t, 0.4, 0.6)}>LEFT HORN</text>
              <text x={420} y={170} fontFamily={HEAD} fontWeight={700} fontSize={30} fill="#f6ecd4" stroke="#14100a" strokeWidth={5} paintOrder="stroke" opacity={lin(t, 0.4, 0.6)}>RIGHT HORN</text>
              {mode === 'collapse' && <text x={960} y={150} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={38} fill="#ffb4a8" stroke="#14100a" strokeWidth={6} paintOrder="stroke" opacity={lin(p, 0.3, 0.6)}>THE LINE FALLS BACK · THE FLANK OPENS</text>}
              {mode === 'closed' && <text x={960} y={150} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={44} fill="#ffb4a8" stroke="#14100a" strokeWidth={6} paintOrder="stroke">THE HORNS CLOSE · CAMP SURROUNDED</text>}
            </g>
          );
        })()}
        <text x={70} y={1040} fontFamily={TYPE} fontSize={20} fill="rgba(246,236,212,0.6)">SCHEMATIC · NOT TO SCALE · NORTH UP</text>
      </svg>
    </AbsoluteFill>
  );
};

/** The 'horns and chest of the buffalo' as a diagram; `hi` highlights one part. */
const BuffaloDiagram: React.FC<{ hi?: 'chest' | 'horns' | 'loins' | 'all' }> = ({ hi = 'all' }) => {
  const f = useCurrentFrame();
  const on = (k: string) => (hi === 'all' || hi === k ? 1 : 0.28);
  const pulse = 1 + 0.04 * Math.sin(f / 8);
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 55%, #3a2f1c 0%, #140f08 85%)', opacity: lin(f, 0, 10) }}>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <rect x={860} y={170} width={200} height={70} fill="#c0392b" stroke="#f6ecd4" strokeWidth={3} />
        <text x={960} y={140} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={34} fill="#f6ecd4">THE ENEMY</text>
        <g opacity={on('horns')} transform={hi === 'horns' ? `translate(960 600) scale(${pulse}) translate(-960 -600)` : undefined}>
          <path d="M760,520 C520,470 470,300 640,210" fill="none" stroke="#e8c27a" strokeWidth={70} strokeLinecap="round" />
          <path d="M1160,520 C1400,470 1450,300 1280,210" fill="none" stroke="#e8c27a" strokeWidth={70} strokeLinecap="round" />
          <text x={420} y={360} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={40} fill="#f6ecd4">LEFT HORN</text>
          <text x={1500} y={360} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={40} fill="#f6ecd4">RIGHT HORN</text>
          <text x={960} y={1030} textAnchor="middle" fontFamily={TYPE} fontWeight={700} fontSize={28} fill="#e8c27a" opacity={hi === 'horns' ? 1 : 0}>FAST YOUNG REGIMENTS · SURROUND</text>
        </g>
        <g opacity={on('chest')}>
          <ellipse cx={960} cy={560} rx={230} ry={110} fill="#d9a441" stroke="#f6ecd4" strokeWidth={3} transform={hi === 'chest' ? `translate(960 560) scale(${pulse}) translate(-960 -560)` : undefined} />
          <text x={960} y={572} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={48} fill="#1d1410">CHEST · 7–9,000</text>
          <path d="M960,440 L960,270" stroke="#d9a441" strokeWidth={10} markerEnd="url(#ah2)" />
          <text x={960} y={1030} textAnchor="middle" fontFamily={TYPE} fontWeight={700} fontSize={28} fill="#d9a441" opacity={hi === 'chest' ? 1 : 0}>DRIVES STRAIGHT IN · PINS THE ENEMY</text>
        </g>
        <g opacity={on('loins')}>
          <ellipse cx={960} cy={830} rx={170} ry={70} fill="#8a6a30" stroke="#f6ecd4" strokeWidth={3} />
          <text x={960} y={842} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={38} fill="#f6ecd4">LOINS · 4–5,000</text>
          <text x={960} y={1030} textAnchor="middle" fontFamily={TYPE} fontWeight={700} fontSize={28} fill="#c9a86a" opacity={hi === 'loins' ? 1 : 0}>RESERVE · FINISHES THE JOB</text>
        </g>
        <defs><marker id="ah2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#d9a441" /></marker></defs>
      </svg>
      <div style={{ position: 'absolute', left: 70, top: 64, fontFamily: SERIF, fontWeight: 900, fontSize: 54, color: '#f4ecda', textShadow: '0 4px 20px #000' }}>The Horns of the Buffalo</div>
    </AbsoluteFill>
  );
};

/** The ultimatum as a document, its key demand stamped. */
const Ultimatum: React.FC<{ at: number; stamp: number }> = ({ at, stamp }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const k = ease(f, at, at + 12);
  const lines = ['1. Surrender the men accused in border incidents', '2. Pay a fine of 500 cattle', '4. Surrender Mbilini waMswati', '6. DISBAND THE ZULU ARMY', '11. Accept a British agent in Zululand'];
  return (
    <div style={{ position: 'absolute', left: 520, right: 520, top: 150, transform: `translateY(${40 * (1 - k)}px) rotate(-1.5deg)`, opacity: k, background: '#efe4c8', padding: '30px 42px', boxShadow: '0 20px 50px rgba(0,0,0,0.75)' }}>
      <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 44, color: '#2a2117', borderBottom: '3px double #2a2117', paddingBottom: 8 }}>The Ultimatum · 11 Dec 1878</div>
      {lines.map((l, i) => <div key={i} style={{ fontFamily: TYPE, fontWeight: i === 3 ? 700 : 400, fontSize: 28, color: i === 3 ? C.red : '#3a2c1c', marginTop: 12, opacity: lin(f, at + 10 + i * 8, at + 16 + i * 8) }}>{l}</div>)}
      <div style={{ fontFamily: TYPE, fontSize: 22, color: '#6a5a40', marginTop: 14, opacity: lin(f, at + 50, at + 60) }}>13 DEMANDS IN TOTAL · EXCERPT</div>
      {f >= stamp && <div style={{ position: 'absolute', right: 26, bottom: 24, transform: `rotate(-10deg) scale(${1.5 - 0.5 * ease(f, stamp, stamp + 7)})`, border: `7px solid ${C.redHi}`, color: C.redHi, fontFamily: HEAD, fontWeight: 700, fontSize: 50, padding: '0 18px', letterSpacing: 4, background: 'rgba(239,228,200,0.85)' }}>IMPOSSIBLE</div>}
    </div>
  );
};

/** Final toll. */
const Toll: React.FC<{ n: number }> = ({ n }) => {
  const f = useCurrentFrame();
  const row = (at: number, label: string, a: string, b: string) => (
    <div style={{ display: 'flex', alignItems: 'center', opacity: lin(f, at, at + 8), transform: `translateY(${16 * (1 - ease(f, at, at + 10))}px)`, borderBottom: '2px solid rgba(246,236,212,0.2)', padding: '14px 0' }}>
      <div style={{ width: 480, fontFamily: TYPE, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: '#cfc3a8' }}>{label}</div>
      <div style={{ width: 400, textAlign: 'center', fontFamily: HEAD, fontWeight: 700, fontSize: 70, color: C.redHi }}>{a}</div>
      <div style={{ width: 400, textAlign: 'center', fontFamily: HEAD, fontWeight: 700, fontSize: 70, color: '#f6ecd4' }}>{b}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: 'rgba(8,6,4,0.74)', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 1280 }}>
        <div style={{ display: 'flex', paddingBottom: 10, opacity: lin(f, 4, 14) }}>
          <div style={{ width: 480 }} />
          <div style={{ width: 400, textAlign: 'center', fontFamily: HEAD, fontWeight: 700, fontSize: 40, color: C.gold }}>BRITISH FORCE</div>
          <div style={{ width: 400, textAlign: 'center', fontFamily: HEAD, fontWeight: 700, fontSize: 40, color: C.gold }}>ZULU ARMY</div>
        </div>
        {row(wf(n, '1300'), 'KILLED', '1,300+', '1,000–3,000')}
        {row(wf(n, 'five'), 'IMPERIAL OFFICERS LEFT', '5', '—')}
      </div>
    </AbsoluteFill>
  );
};

/* ───────────── scenes ───────────── */
const fr = (n: number) => SCENES[n - 1].frames + 12;
type SC = React.FC;
const mk = (n: number, render: (F: number) => React.ReactNode): SC => { const C2: SC = () => <AbsoluteFill style={{ background: '#000' }}>{render(fr(n))}</AbsoluteFill>; return C2; };
const one = (n: number, id: string, extra?: (F: number) => React.ReactNode, fadeIn = 10) => mk(n, (F) => (<><Shot id={id} from={0} to={F} fadeIn={fadeIn} /><Dim />{extra?.(F)}</>));
const two = (n: number, a: string, b: string, cutWord: string, extra?: (F: number) => React.ReactNode, nth = 0) => mk(n, (F) => { const c = wf(n, cutWord, nth); return (<><Shot id={a} from={0} to={c + 8} /><Shot id={b} from={c} to={F} /><Dim />{extra?.(F)}</>); });
const Clock: React.FC<{ n: number; render: (f: number) => React.ReactNode }> = ({ render }) => { const f = useCurrentFrame(); return <>{render(f)}</>; };

const S: SC[] = [];
// 1 hook
S[1] = mk(1, (F) => { const a = wf(1, 'they'); const g = wf(1, 'gone'); return (<>
  <Shake hits={[wf(1, 'rockets')]} amp={8}><Shot id="i03_redcoats_line" from={0} to={a + 8} fadeIn={0} /><Volley y={640} x0={200} x1={1700} /></Shake>
  <Shot id="i29_chest_charge" from={a} to={g + 8} /><Shot id="i36_dusk_field" from={g} to={F} /><Dim />
  <Chips items={[{ at: wf(1, 'rifles'), t: 'RIFLES' }, { at: wf(1, 'cannon'), t: 'CANNON' }, { at: wf(1, 'rockets'), t: 'ROCKETS' }]} out={a} />
  <Chips items={[{ at: wf(1, 'spears'), t: 'SPEARS' }, { at: wf(1, 'shields'), t: 'SHIELDS' }]} left out={g} />
  <Verdict at={g} text="CAMP DESTROYED" y={420} />
</>); });
S[2] = one(2, 'i01_mountain_dawn', () => <Slate at={6} place="ISANDLWANA, ZULU KINGDOM" date="22 JANUARY 1879" />, 14);
S[3] = one(3, 'i09_ntshingwayo', () => <Title at={wf(3, 'story') - 4} text="ISANDLWANA" sub="The Zulu General Who Out-Planned the British Empire" />);
S[4] = one(4, 'i04_ultimatum_tree', () => (<><Chapter n="I" title="The Ultimatum" /><Slate at={wf(4, '11') - 4} place="THE ULTIMATUM TREE · THUKELA RIVER" date="11 DECEMBER 1878" /></>));
S[5] = one(5, 'i05_frere', () => (<><Slate at={6} place="SIR BARTLE FRERE" date="BRITAIN'S HIGH COMMISSIONER" /><Chips items={[{ at: wf(5, 'without'), t: "WITHOUT LONDON'S APPROVAL" }]} top={260} /></>));
S[6] = mk(6, () => (<><Shot id="i04_ultimatum_tree" from={0} to={fr(6)} /><Dim top={0.6} bottom={0.6} /><Ultimatum at={4} stamp={wf(6, 'disband')} /></>));
S[7] = one(7, 'i05_frere', () => <Chips items={[{ at: wf(7, 'three'), t: '3 BORDER INCIDENTS' }, { at: wf(7, 'flimsy'), t: '"FLIMSY GROUNDS"' }]} />);
S[8] = mk(8, (F) => <ZuluMap dur={F} title="ZULULAND · JANUARY 1879"><Place k="ondini" name="oNDINI (ROYAL CAPITAL)" big /><Place k="rorkes" name="RORKE'S DRIFT" at={wf(8, 'crossed')} dx={-250} dy={-16} />
  <Clock n={8} render={(f) => f >= wf(8, '10') ? <text x={1150} y={830} fontFamily={HEAD} fontWeight={700} fontSize={46} fill="#ffb4a8" stroke="#14100a" strokeWidth={6} paintOrder="stroke" opacity={lin(f, wf(8, '10'), wf(8, '10') + 8)}>DEADLINE: 10 JANUARY 1879</text> : null} /></ZuluMap>);
S[9] = mk(9, (F) => <ZuluMap dur={F} title="THE INVASION · 11 JANUARY 1879"><Clock n={9} render={(f) => (<>
  <Route pts={[PL.lowerdrift, PL.eshowe]} t={ease(f, wf(9, 'coast'), wf(9, 'coast') + 40)} color="#e74c3c" label="COASTAL COLUMN" lx={20} ly={10} w={6} />
  <Route pts={[PL.utrecht, [30.7, -27.85]]} t={ease(f, wf(9, 'north'), wf(9, 'north') + 40)} color="#e74c3c" label="NORTHERN COLUMN" lx={20} ly={10} w={6} />
  <Route pts={[PL.helpmekaar, PL.rorkes, PL.isandlwana]} t={ease(f, wf(9, 'centre'), wf(9, 'centre') + 50)} color="#ff6f5e" label="CENTRE COLUMN" lx={-120} ly={60} w={8} />
  <Place k="ondini" name="oNDINI" at={0} big /><Place k="rorkes" name="RORKE'S DRIFT" at={wf(9, 'rorkes')} dx={-250} dy={-16} /></>)} /></ZuluMap>);
S[10] = two(10, 'i06_crossing', 'i14_chelmsford', 'chelmsford', () => (<><Slate at={wf(10, 'chelmsford')} place="LORD CHELMSFORD" date="BRITISH COMMANDER" /><Count at={wf(10, '4700')} to={4700} label="CENTRE COLUMN" top={300} /></>));
S[11] = mk(11, (F) => (<><Shot id="i07_cetshwayo" from={0} to={F} /><Dim /><Slate at={6} place="oNDINI" date="KING CETSHWAYO kaMPANDE" /><Print src="assets/archival/cetshwayo.jpg" at={wf(11, 'cetshwayo')} out={wf(11, 'messengers')} x={1180} y={140} w={560} h={600} rot={2} label="CETSHWAYO · PHOTOGRAPHED 1882" pos="50% 25%" /><Chips items={[{ at: wf(11, 'peace'), t: 'ASKED FOR PEACE TALKS' }, { at: wf(11, 'army'), t: 'CALLED UP HIS ARMY' }]} top={260} /></>));
S[12] = one(12, 'i09_ntshingwayo', () => (<><Chapter n="II" title="The General" /><Slate at={wf(12, 'ntshingwayo') - 2} place="NTSHINGWAYO kaMAHOLE KHOZA" date="COMMANDING GENERAL" /></>));
S[13] = mk(13, (F) => (<><PhotoBg src="assets/archival/ntshingwayo.jpg" /><Print src="assets/archival/ntshingwayo.jpg" at={10} x={460} y={90} w={1000} h={800} rot={-1} label="NTSHINGWAYO (SEATED, CENTRE) AT HIS HOMESTEAD · 1879" pos="50% 50%" /><Chips items={[{ at: wf(13, '70'), t: 'AGE: ABOUT 70' }, { at: wf(13, 'councillor'), t: "KING'S COUNCILLOR" }]} left top={200} /></>));
S[14] = one(14, 'i10_army_gathers', () => (<><Count at={wf(14, '20000')} to={20000} label="WARRIORS" /><Chips items={[{ at: wf(14, 'age'), t: 'REGIMENTS BY AGE' }, { at: wf(14, 'spear'), t: 'STABBING SPEAR' }, { at: wf(14, 'shield'), t: 'COWHIDE SHIELD' }, { at: wf(14, 'firearms'), t: 'SOME OLD FIREARMS' }]} top={440} /></>));
S[15] = one(15, 'i08_council', () => <QuoteCard at={wf(15, 'march') - 4} text="March slowly, attack at dawn and eat up the red soldiers." by="KING CETSHWAYO'S ORDER, AS RECORDED" y={260} />);
S[16] = one(16, 'i11_march', () => (<><Chapter n="III" title="The Invisible Army" /><Chips items={[{ at: wf(16, 'two'), t: 'TWO COLUMNS' }, { at: wf(16, 'scouts'), t: 'SCOUTS OUT FRONT' }, { at: wf(16, 'screening'), t: 'SCREENS OF 200–400 MEN' }]} top={300} /></>));
S[17] = mk(17, (F) => <ZuluMap dur={F} zoom={[1.6, 900, 330]} title="THE MARCH · JANUARY 1879"><Clock n={17} render={(f) => (<>
  <Route pts={[PL.ondini, [31.15, -28.24], [30.95, -28.27], PL.ngwebeni]} t={ease(f, 10, wf(17, 'miles') + 20)} color="#e8c27a" label="ZULU ARMY: 50+ MILES IN 5 DAYS" lx={-60} ly={-40} w={8} />
  <Route pts={[PL.rorkes, PL.isandlwana]} t={ease(f, wf(17, 'ten'), wf(17, 'ten') + 60)} color="#ff6f5e" label="BRITISH: ~10 MILES IN 10 DAYS" lx={-120} ly={70} w={8} />
  <Place k="ondini" name="oNDINI" big /><Place k="isandlwana" name="ISANDLWANA" at={wf(17, 'ten')} dx={-60} dy={44} /></>)} /></ZuluMap>);
S[18] = one(18, 'i19_patrol', () => <Verdict at={wf(18, 'idea')} text="WHERE ARE THEY?" color={C.gold} y={420} />);
S[19] = one(19, 'i12_camp', () => (<><Chapter n="IV" title="The Camp" /><Slate at={wf(19, '20') - 4} place="ISANDLWANA" date="20 JANUARY 1879" /></>));
S[20] = one(20, 'i13_wagons', () => (<><Chips items={[{ at: wf(20, 'entrench'), t: 'ORDERS: ENTRENCH' }, { at: wf(20, 'laager'), t: 'OR CIRCLE THE WAGONS' }]} /><Verdict at={wf(20, 'neither')} text="NEITHER" y={430} /></>));
S[21] = one(21, 'i14_chelmsford', () => (<><QuoteCard at={wf(21, 'week') - 6} text="It would take a week to make." by="LORD CHELMSFORD, ON A WAGON LAAGER" y={220} out={wf(21, 'temporary')} /><Chips items={[{ at: wf(21, 'temporary'), t: 'TEMPORARY CAMP' }, { at: wf(21, 'supplies'), t: 'WAGONS FOR SUPPLIES' }, { at: wf(21, 'dare'), t: '"THEY WON\'T DARE"' }]} top={300} /></>));
S[22] = mk(22, (F) => <BattleMap mode="hidden" dur={F} />);
S[23] = one(23, 'i15_valley_hidden', () => (<><Count at={wf(23, '20000')} to={20000} label="IN TOTAL QUIET" /><Verdict at={wf(23, '23')} text="ATTACK PLANNED: 23 JANUARY" color={C.gold} y={560} size={64} /></>));
S[24] = one(24, 'i16_night_march', () => (<><Chapter n="V" title="The Split" /><Slate at={30} place="BEFORE DAWN · 22 JANUARY" date="TOWARD THE MANGENI HILLS" /><Count at={wf(24, '2800')} to={2800} label="MEN MARCH OUT" top={340} /></>));
S[25] = mk(25, (F) => <BattleMap mode="split" dur={F} />);
S[26] = one(26, 'i17_pulleine', () => (<><Slate at={wf(26, 'henry') - 6} place="LT. COL. HENRY PULLEINE" date="IN COMMAND OF THE CAMP" /><Count at={wf(26, '1300')} to={1300} label="MEN LEFT BEHIND" top={300} /><Chips items={[{ at: wf(26, 'two'), t: '2 FIELD GUNS' }, { at: wf(26, 'administrator'), t: 'NO FRONT-LINE COMMAND' }]} top={560} /></>));
S[27] = one(27, 'i12_camp', () => <Verdict at={wf(27, 'defend')} text="DEFEND THE CAMP. WAIT." color={C.gold} y={420} />);
S[28] = one(28, 'i19_patrol', () => (<><Slate at={6} place="EARLY MORNING" date="ZULUS SEEN TO THE NORTH-EAST" /><Verdict at={wf(28, 'turn')} text="CHELMSFORD DOES NOT TURN BACK" y={440} size={60} /></>));
S[29] = one(29, 'i18_durnford', () => (<><Slate at={6} place="10:30 AM" date="COL. ANTHONY DURNFORD ARRIVES" /><Chips items={[{ at: wf(29, '500'), t: '~500 AFRICAN TROOPS' }, { at: wf(29, 'rocket'), t: 'ROCKET BATTERY' }]} top={300} /></>));
S[30] = one(30, 'i18_durnford', () => <Chips items={[{ at: wf(30, 'ride'), t: 'RIDES OUT OF CAMP' }]} top={300} />);
S[31] = one(31, 'i19_patrol', () => (<><Chapter n="VI" title="Discovery" /><Slate at={wf(31, 'raw') - 4} place="AROUND 11:00 AM" date="LT. CHARLES RAW'S SCOUTS" /></>));
S[32] = mk(32, (F) => (<><Shake hits={[16]} amp={10}><Shot id="i20_discovery" from={0} to={F} fadeIn={0} /></Shake><Dim /><Flash at={10} color="255,240,210" dur={10} /></>));
S[33] = mk(33, (F) => { const c = wf(33, 'rose'); const r = wf(33, 'run'); return (<>
  <Shot id="i15_valley_hidden" from={0} to={c + 8} /><Shake hits={[c + 6]} amp={14}><Shot id="i21_warriors_rise" from={c} to={r + 8} /><Shot id="i22_horns_run" from={r} to={F} /><Particles kind="ash" n={40} o={0.4} /></Shake><Dim />
  <Verdict at={wf(33, 'early')} text="DISCOVERED A DAY EARLY" y={420} size={66} out={c} />
</>); });
S[34] = mk(34, () => <><BuffaloDiagram hi="all" /><Chapter n="VII" title="The Buffalo" at={6} /></>);
S[35] = mk(35, () => <BuffaloDiagram hi="chest" />);
S[36] = mk(36, () => <BuffaloDiagram hi="horns" />);
S[37] = mk(37, () => <BuffaloDiagram hi="loins" />);
S[38] = mk(38, (F) => <BattleMap mode="horns" dur={F} />);
S[39] = one(39, 'i23_firing_line', () => (<><Chapter n="VIII" title="The Firing Line" /><Chips items={[{ at: wf(39, 'six'), t: '6 COMPANIES · 24TH FOOT' }, { at: wf(39, 'firing'), t: 'FAR FROM THE TENTS' }]} top={300} /><Volley y={620} x0={150} x1={1750} seed={4} /></>));
S[40] = mk(40, (F) => { const c = wf(40, 'warriors'); return (<>
  <Shake hits={[wf(40, 'volley'), wf(40, 'volley', 1)]} amp={12}><Shot id="i03_redcoats_line" from={0} to={c + 8} /><Volley y={640} x0={200} x1={1700} seed={5} period={30} /></Shake>
  <Shot id="i26_warriors_ground" from={c} to={F} /><Dim /><Chips items={[{ at: wf(40, 'martinihenry'), t: 'MARTINI-HENRY RIFLE' }, { at: wf(40, 'hour'), t: 'HELD FOR AN HOUR+' }]} top={300} />
</>); });
S[41] = mk(41, (F) => { const c = wf(41, 'rocket'); return (<>
  <Shake hits={[20, 60, c + 10]} amp={16}><Shot id="i25_guns" from={0} to={c + 8} /><Shot id="i24_rocket" from={c} to={F} />
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}><VfxDefs /><Explosion at={20} x={1250} y={520} s={1.1} seed={3} /><Explosion at={60} x={700} y={560} s={0.9} seed={8} /></svg></Shake>
  <Flash at={20} /><Dim /><Chips items={[{ at: wf(41, 'three'), t: '3 ROCKETS FIRED' }, { at: wf(41, 'ten'), t: '1 IN 10 AUXILIARIES ARMED' }]} top={300} />
</>); });
S[42] = mk(42, (F) => (<><BattleMap mode="line" dur={F} /><QuoteCard at={wf(42, 'historian')} text="…too large a perimeter." by="HISTORIAN IAN KNIGHT" y={700} /></>));
S[43] = one(43, 'i27_ammo', () => (<><Slate at={6} place="THE BRITISH RIGHT" date="DURNFORD'S MEN IN A DONGA" /><Verdict at={wf(43, 'ammunition')} text="RUNNING OUT OF AMMUNITION" y={440} size={60} /></>));
S[44] = one(44, 'i28_ammo_box', () => <Verdict at={wf(44, 'screwdrivers')} text="THE SCREWDRIVER STORY" color={C.gold} y={300} />);
S[45] = two(45, 'i28_ammo_box', 'i23_firing_line', 'argue', () => (<><Verdict at={wf(45, 'sure')} text="DISPUTED" y={300} out={wf(45, 'argue')} /><Chips items={[{ at: wf(45, 'never'), t: 'MAIN LINE: PROBABLY HAD AMMUNITION' }, { at: wf(45, 'probably'), t: "FAR UNITS (DURNFORD'S): RAN OUT" }]} top={300} /></>));
S[46] = mk(46, (F) => (<><BattleMap mode="collapse" dur={F} /></>));
S[47] = mk(47, (F) => (<><Shake hits={[wf(47, 'charged'), wf(47, 'charged') + 14]} amp={20}><Shot id="i29_chest_charge" from={0} to={F} /><Particles kind="ash" n={60} o={0.5} /><Haze color="200,170,120" o={0.4} y={800} /></Shake><Dim /><Chapter n="IX" title="The Sun Turns Black" at={6} /></>));
S[48] = one(48, 'i21_warriors_rise', () => <QuoteCard at={wf(48, 'dont') - 4} text="Don't you dare run away. Your leader, Cetshwayo, never told you to run away." by="AN OLDER ZULU WARRIOR, AS REMEMBERED" y={240} />);
S[49] = mk(49, (F) => (<><Shot id="i30_eclipse" from={0} to={F} /><Dim /><Eclipse at={wf(49, 'sky')} dur={F - wf(49, 'sky')} /><Slate at={wf(49, '230') - 2} place="2:30 PM" date="22 JANUARY 1879" /></>));
S[50] = mk(50, (F) => (<><Shot id="i30_eclipse" from={0} to={F} fadeIn={0} /><Dim /><Eclipse at={-200} dur={1} disc /><QuoteCard at={wf(50, 'sun') - 6} text="The sun turned black in the middle of the battle." by="A ZULU WARRIOR" y={560} /><Slate at={6} place="SOLAR ECLIPSE" /></>));
S[51] = mk(51, (F) => (<><BattleMap mode="closed" dur={F} /><Eclipse at={-200} dur={1} /></>));
S[52] = one(52, 'i19_patrol', () => <QuoteCard at={wf(52, 'gods') - 6} text="For God's sake come back. The camp is surrounded, and things I fear are going badly." by="COMMANDANT HAMILTON-BROWNE, ABOUT 1:30 PM" y={220} />);
S[53] = mk(53, (F) => (<><Shake hits={[20, 70, 130]} amp={16}><Shot id="i31_melee_tents" from={0} to={Math.round(F * 0.6)} /><Shot id="i32_last_stand" from={Math.round(F * 0.6)} to={F} /><Particles kind="embers" n={70} o={0.7} /><Haze o={0.45} /></Shake><Eclipse at={-200} dur={1} /><Dim /></>));
S[54] = one(54, 'i36_dusk_field', () => <Verdict at={wf(54, '330')} text="3:30 PM · THE CAMP HAS FALLEN" y={420} size={66} />);
S[55] = one(55, 'i33_flight', () => <Slate at={6} place="FUGITIVES' DRIFT" date="THE BUFFALO RIVER" />);
S[56] = two(56, 'i35_colour', 'i34_river', 'river', () => (<><Chapter n="X" title="Aftermath" at={6} /><Chips items={[{ at: wf(56, 'colour'), t: "THE QUEEN'S COLOUR" }, { at: wf(56, '1907'), t: 'VICTORIA CROSS · 1907' }]} top={300} /></>));
S[57] = one(57, 'i34_river', () => <QuoteCard at={wf(57, 'dont') - 6} text="I don't like the idea of officers escaping on horseback when their men on foot are being killed." by="SIR GARNET WOLSELEY" y={240} />);
S[58] = mk(58, (F) => (<><Shot id="i36_dusk_field" from={0} to={F} /><Dim /><Toll n={58} /></>));
S[59] = one(59, 'i39_zulu_return', () => <Chips items={[{ at: wf(59, '1000'), t: '1,000–3,000 ZULU DEAD' }, { at: wf(59, 'sons'), t: "NTSHINGWAYO'S TWO SONS WOUNDED" }]} top={300} />);
S[60] = one(60, 'i37_chelmsford_return', () => (<><Slate at={6} place="SUNDOWN" date="CHELMSFORD RETURNS" /><QuoteCard at={wf(60, 'left') - 6} text="But I left over 1,000 men to guard the camp." by="LORD CHELMSFORD" y={560} /></>));
S[61] = one(61, 'i36_dusk_field', () => <Haze o={0.3} color="120,110,100" />);
S[62] = one(62, 'i38_rorkes', () => (<><Slate at={6} place="RORKE'S DRIFT" date="NIGHT OF 22–23 JANUARY" /><Count at={wf(62, '150')} to={150} label="DEFENDERS" top={300} /><Particles kind="embers" n={40} o={0.6} /></>));
S[63] = one(63, 'i40_london', () => <Verdict at={wf(63, 'worst')} text="WORST DEFEAT" y={420} />);
S[64] = one(64, 'i02_impi_ridge', () => <Verdict at={wf(64, 'greatest')} text="THE GREATEST ZULU VICTORY" color={C.gold} y={420} size={66} />);
S[65] = two(65, 'i41_ulundi', 'i42_burning', 'capital', () => (<><Slate at={6} place="ULUNDI" date="4 JULY 1879" /><Count at={wf(65, '45')} to={45} label="MINUTES" top={300} /></>));
S[66] = one(66, 'i43_captive', () => <Slate at={6} place="AUGUST 1879" date="CETSHWAYO CAPTURED · SENT TO CAPE TOWN" />);
S[67] = mk(67, () => (<><PhotoBg src="assets/archival/cetshwayo.jpg" /><Print src="assets/archival/cetshwayo.jpg" at={6} x={610} y={70} w={700} h={760} rot={-1} label="CETSHWAYO IN LONDON · 1882" pos="50% 25%" /><Chips items={[{ at: wf(67, 'restored'), t: 'BRIEFLY RESTORED' }, { at: wf(67, '1884'), t: 'DIED 1884' }]} left top={300} /></>));
S[68] = one(68, 'i44_old_general', () => <Slate at={wf(68, '1883') - 4} place="oNDINI" date="JULY 1883 · NTSHINGWAYO KILLED" />);
S[69] = mk(69, () => (<><PhotoBg src="assets/archival/ntshingwayo.jpg" /><Print src="assets/archival/ntshingwayo.jpg" at={4} x={460} y={90} w={1000} h={800} rot={1} label="NTSHINGWAYO kaMAHOLE · 1879" /></>));
S[70] = mk(70, (F) => <BattleMap mode="summary" dur={F} />);
S[71] = one(71, 'i22_horns_run', () => <Verdict at={wf(71, 'adapted')} text="ADAPTED ON THE RUN" color={C.gold} y={420} />);
S[72] = two(72, 'i03_redcoats_line', 'i09_ntshingwayo', 'ntshingwayo', () => (<>
  <Chips items={[{ at: wf(72, 'rifles'), t: 'RIFLES · CANNON · ROCKETS' }]} out={wf(72, 'ntshingwayo')} />
  <Chips items={[{ at: wf(72, 'scouts'), t: 'SCOUTS' }, { at: wf(72, 'speed'), t: 'SPEED' }, { at: wf(72, 'surprise'), t: 'SURPRISE' }]} left />
</>));
S[73] = mk(73, (F) => (<><Shot id="i45_cairns" from={0} to={F} /><Dim top={0.6} /><Clock n={73} render={(f) => { const a = wf(73, 'planning'); const b = wf(73, 'overconfidence');
  const card = (at: number, l: string, t: string, x: number, col: string) => f < at ? null : (
    <div style={{ position: 'absolute', left: x, top: 330, width: 600, transform: `scale(${0.8 + 0.2 * ease(f, at, at + 8)})`, opacity: lin(f, at, at + 6), background: 'rgba(14,10,6,0.85)', border: `4px solid ${col}`, padding: '18px 22px', textAlign: 'center' }}>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 40, color: col }}>{l}</div>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 56, color: '#fff' }}>{t}</div>
    </div>);
  return (<>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', opacity: lin(f, 4, 12), fontFamily: HEAD, fontWeight: 700, fontSize: 80, color: '#fff', textShadow: '0 8px 24px #000' }}>ISANDLWANA WAS…</div>
    {card(a, 'A', 'WON BY ZULU PLANNING', 320, C.gold)}{card(b, 'B', 'LOST BY BRITISH OVERCONFIDENCE', 1000, '#6fbf73')}
    <div style={{ position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', opacity: lin(f, wf(73, 'subscribe') - 4, wf(73, 'subscribe') + 6) }}><span style={{ background: C.red, color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 40, padding: '12px 30px', letterSpacing: 2 }}>SUBSCRIBE · BURIED CHRONICLES</span></div>
  </>); }} /></>));

export const SCENE_COMPS = Array.from({ length: 73 }, (_, i) => S[i + 1]);
