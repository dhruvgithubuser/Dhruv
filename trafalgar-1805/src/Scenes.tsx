import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { Particles } from './kit';
import { Explosion, Shake, VfxDefs } from './vfx';
import map from './data/atlantic.json';
import { C, H, HEAD, SANS, SCENES, SERIF, TYPE, W, ease, hash01, lin, wf } from './theme';

/*
 * "Trafalgar 1805: What Happened and Why" - 16:9 realistic documentary in the channel's Shorts language.
 * Every shot is an AI-generated still turned into a moving camera shot (depth parallax, scripts/parallax.py),
 * labelled DRAMATIZED RECONSTRUCTION. No paintings. Maps are motion graphics drawn from real coastline data.
 */

const GRADE = 'saturate(0.7) sepia(0.18) contrast(1.1) brightness(0.96)';
const CLIP_S = 10; // every parallax clip is 10 s

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
/** One moving shot between scene-local frames `from` and `to`. */
const Shot: React.FC<{ id: string; from: number; to: number; fadeIn?: number }> = ({ id, from, to, fadeIn = 10 }) => (
  <Sequence from={from} durationInFrames={Math.max(1, to - from)} layout="none"><ShotInner id={id} dur={to - from} fadeIn={fadeIn} /></Sequence>
);

const Dim: React.FC<{ top?: number; bottom?: number }> = ({ top = 0.5, bottom = 0.55 }) => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(0,0,0,${top}) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 62%, rgba(0,0,0,${bottom}) 100%)` }} />
);

/** Location / date slate, typed on, top-left. */
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

/** Chapter card, top-right (PART n / title). */
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

/** Rubber-stamp verdict. */
const Verdict: React.FC<{ at: number; text: string; color?: string; x?: number; y?: number; rot?: number; size?: number; out?: number }> = ({ at, text, color = C.redHi, x = 960, y = 300, rot = -6, size = 84, out }) => {
  const f = useCurrentFrame();
  if (f < at || (out !== undefined && f >= out)) return null;
  const k = ease(f, at, at + 7);
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${1.6 - 0.6 * k})`, opacity: Math.min(1, k * 1.6), border: `8px solid ${color}`, padding: '4px 30px', fontFamily: HEAD, fontWeight: 700, fontSize: size, letterSpacing: 5, color, background: 'rgba(14,10,6,0.55)', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', whiteSpace: 'nowrap' }}>{text}</div>
  );
};

/** Fact chips that slide in on spoken words, right side. */
const Chips: React.FC<{ items: { at: number; t: string }[]; top?: number; left?: boolean }> = ({ items, top = 200, left }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', [left ? 'left' : 'right']: 70, top, display: 'flex', flexDirection: 'column', alignItems: left ? 'flex-start' : 'flex-end', gap: 12 }}>
      {items.map((x, i) => f < x.at ? null : (
        <div key={i} style={{ background: 'rgba(14,10,6,0.82)', border: `3px solid ${C.gold}`, padding: '6px 18px', fontFamily: HEAD, fontWeight: 700, fontSize: 38, color: '#f6ecd4', letterSpacing: 2, transform: `translateX(${(left ? -40 : 40) * (1 - lin(f, x.at, x.at + 6))}px)`, opacity: lin(f, x.at, x.at + 6) }}>{x.t}</div>
      ))}
    </div>
  );
};

/** Big number that counts up, right side. */
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

/** Quote card (serif italic). */
const QuoteCard: React.FC<{ at: number; text: string; by: string; y?: number; out?: number }> = ({ at, text, by, y = 220, out }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 10) * (out !== undefined ? 1 - lin(f, out - 8, out) : 1);
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 300, right: 300, top: y, opacity: o, background: '#f6f0e2', padding: '30px 44px', boxShadow: '0 16px 40px rgba(0,0,0,0.6)', borderTop: `8px solid ${C.red}`, transform: `rotate(-1deg) translateY(${20 * (1 - ease(f, at, at + 12))}px)` }}>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 50, lineHeight: 1.25, color: C.charcoal }}>“{text}”</div>
      <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 24, color: C.red, marginTop: 16 }}>— {by}</div>
    </div>
  );
};

/** Full-screen title. */
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

/** Rolling cannon smoke + muzzle flashes along a line. */
const Broadsides: React.FC<{ y: number; x0: number; x1: number; seed?: number; n?: number }> = ({ y, x0, x1, seed = 2, n = 10 }) => {
  const f = useCurrentFrame();
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      <defs><radialGradient id={`mz${seed}`}><stop offset="0" stopColor="#fff7d6" /><stop offset="0.5" stopColor="#ffb347" /><stop offset="1" stopColor="#ff7a1a" stopOpacity="0" /></radialGradient></defs>
      {Array.from({ length: n }, (_, i) => {
        const ph = (f + Math.floor(hash01(i, seed) * 44)) % 44; const k = ph / 44;
        const x = x0 + ((x1 - x0) * i) / (n - 1) + 40 * k; const r = 26 + 120 * k;
        return <g key={i}><circle cx={x} cy={y - 50 * k} r={r} fill="#e9e4da" opacity={0.5 * (1 - k)} />{ph < 3 && <circle cx={x} cy={y} r={38} fill={`url(#mz${seed})`} opacity={1 - ph / 3} />}</g>;
      })}
    </svg>
  );
};

const Flash: React.FC<{ at: number; color?: string; dur?: number }> = ({ at, color = '255,214,150', dur = 16 }) => {
  const f = useCurrentFrame(); const t = f - at;
  if (t < 0 || t > dur) return null;
  return <AbsoluteFill style={{ background: `rgba(${color},${0.7 * (1 - t / dur)})`, mixBlendMode: 'screen' }} />;
};

const Haze: React.FC<{ color?: string; o?: number; y?: number }> = ({ color = '220,215,205', o = 0.35, y = 600 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity: o }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: 'absolute', left: -700 + ((f * (0.9 + i * 0.4) + i * 700) % 3000), top: y - 260 + i * 160, width: 1500, height: 520, borderRadius: '50%', background: `radial-gradient(ellipse, rgba(${color},0.55), rgba(${color},0) 70%)`, filter: 'blur(24px)' }} />
      ))}
    </AbsoluteFill>
  );
};

/** Rain streaks for the storm. */
const Rain: React.FC<{ o?: number }> = ({ o = 0.6 }) => {
  const f = useCurrentFrame();
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: o }}>
      {Array.from({ length: 140 }, (_, i) => {
        const x = (hash01(i, 5) * (W + 300) + f * 9) % (W + 300) - 150; const y = (hash01(i, 6) * H + f * 46) % (H + 100) - 50;
        return <line key={i} x1={x} y1={y} x2={x - 14} y2={y + 40} stroke="#cfd8e0" strokeWidth={2} opacity={0.5} />;
      })}
    </svg>
  );
};

/* ───────────── motion graphics: maps ───────────── */

type LL = [number, number];
const A = map.atlantic;
const PA = ([lon, lat]: LL): [number, number] => [((lon - A.lon0) / (A.lon1 - A.lon0)) * W, ((A.lat1 - lat) / (A.lat1 - A.lat0)) * H];
const PLACES: Record<string, LL> = { toulon: [5.93, 43.12], brest: [-4.49, 48.39], boulogne: [1.61, 50.73], cadiz: [-6.29, 36.53], ferrol: [-8.23, 43.48], martinique: [-61.02, 14.64], gib: [-5.6, 35.95], channel: [-1.5, 50.0], london: [-0.13, 51.5], finisterre: [-10.5, 43.2] };
const route = (pts: LL[]) => pts.map(PA);
const plen = (p: [number, number][]) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0);
const dpath = (p: [number, number][]) => p.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join('');

const Route: React.FC<{ pts: LL[]; t: number; color: string; dashed?: boolean; label?: string; lx?: number; ly?: number; w?: number }> = ({ pts, t, color, dashed, label, lx = 14, ly = -14, w = 7 }) => {
  if (t <= 0) return null;
  const p = route(pts); const L = plen(p);
  let acc = 0, end = p[p.length - 1];
  for (let i = 1; i < p.length; i++) { const s = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (acc + s >= L * t) { const k = (L * t - acc) / s; end = [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * k, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * k]; break; } acc += s; }
  return (
    <g>
      <path d={dpath(p)} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dashed ? `18 14` : `${L * t} ${L * 2}`} style={dashed ? { clipPath: undefined } : undefined} opacity={dashed ? 0.9 * Math.min(1, t * 3) : 0.95} />
      {dashed && <path d={dpath(p)} fill="none" stroke="#0b1622" strokeWidth={w + 4} strokeDasharray={`0 ${L * t} ${L * 2}`} />}
      <circle cx={end[0]} cy={end[1]} r={12} fill={color} stroke="#efe6d2" strokeWidth={3} />
      {label && <text x={end[0] + lx} y={end[1] + ly} fontFamily={HEAD} fontWeight={700} fontSize={32} fill={color} stroke="#0b1622" strokeWidth={6} paintOrder="stroke">{label}</text>}
    </g>
  );
};
const Port: React.FC<{ k: string; name: string; at?: number; dx?: number; dy?: number; color?: string; x?: boolean }> = ({ k, name, at = 0, dx = 16, dy = 8, color = '#f6ecd4', x }) => {
  const f = useCurrentFrame();
  const [px, py] = PA(PLACES[k]); const o = lin(f, at, at + 10);
  if (o <= 0) return null;
  const pulse = 1 + 0.25 * Math.sin(f / 6);
  return (
    <g opacity={o}>
      <circle cx={px} cy={py} r={9 * pulse} fill="none" stroke={color} strokeWidth={3} opacity={0.6} />
      <circle cx={px} cy={py} r={6} fill={color} />
      <text x={px + dx} y={py + dy} fontFamily={TYPE} fontWeight={700} fontSize={26} fill="#f6ecd4" stroke="#0b1622" strokeWidth={5} paintOrder="stroke">{name}</text>
      {x && <g stroke={C.redHi} strokeWidth={7} strokeLinecap="round"><line x1={px - 22} y1={py - 22} x2={px + 22} y2={py + 22} /><line x1={px + 22} y1={py - 22} x2={px - 22} y2={py + 22} /></g>}
    </g>
  );
};
/** Atlantic map: real coastline (world-atlas 50m), dark chart style; children draw routes and ports. */
const AtlanticMap: React.FC<{ dur: number; zoom?: [number, number, number]; children?: React.ReactNode; title?: string }> = ({ dur, zoom = [1, 960, 540], children, title }) => {
  const f = useCurrentFrame();
  const [z, cx, cy] = zoom; const zz = z * (1 + 0.04 * lin(f, 0, dur));
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 40% 50%, #17324a 0%, #0b1622 75%)', opacity: lin(f, 0, 10) }}>
      <AbsoluteFill style={{ transform: `scale(${zz})`, transformOrigin: `${cx}px ${cy}px` }}>
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} x1={(i + 1) * 192} y1={0} x2={(i + 1) * 192} y2={H} stroke="#2a4a66" strokeWidth={1} opacity={0.35} />)}
          {Array.from({ length: 5 }, (_, i) => <line key={`h${i}`} x1={0} y1={(i + 1) * 180} x2={W} y2={(i + 1) * 180} stroke="#2a4a66" strokeWidth={1} opacity={0.35} />)}
          <path d={A.d} fill="#c9b48a" stroke="#6b5636" strokeWidth={1.5} opacity={0.92} />
          {children}
        </svg>
      </AbsoluteFill>
      {title && <div style={{ position: 'absolute', left: 70, bottom: 60, fontFamily: TYPE, fontWeight: 700, fontSize: 22, letterSpacing: 4, color: 'rgba(246,236,212,0.7)' }}>{title}</div>}
    </AbsoluteFill>
  );
};

/** Tactical map off Cape Trafalgar (schematic). Allied line N-S near the cape, British columns from the west. */
const T = map.trafalgar;
const PT = ([lon, lat]: LL): [number, number] => [((lon - T.lon0) / (T.lon1 - T.lon0)) * W, ((T.lat1 - lat) / (T.lat1 - T.lat0)) * H];
const Ship: React.FC<{ x: number; y: number; dir: number; color: string; s?: number; sunk?: number }> = ({ x, y, dir, color, s = 1, sunk = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${dir}) scale(${s})`} opacity={1 - 0.6 * sunk}>
    <path d="M-16,-7 L10,-7 L20,0 L10,7 L-16,7 Z" fill={color} stroke="#0b1622" strokeWidth={2} />
  </g>
);
const allied = (i: number, n: number, curve: number): [number, number] => {
  const t = i / (n - 1); const y = 230 + t * 740; const x = 960 + curve * 140 * Math.sin(Math.PI * t);
  return [x, y];
};
const TacticsMap: React.FC<{ mode: 'parallel' | 'plan' | 'turn' | 'columns' | 'melee'; dur: number; p?: number }> = ({ mode, dur, p: pIn }) => {
  const f = useCurrentFrame();
  const p = pIn ?? ease(f, 15, dur - 20);
  const coast = T.d; const cape = PT([-6.03, 36.18]);
  const BLUE = '#3f6fb0', YEL = '#d8b13a', RED = '#c0392b';
  const nA = 33; const curve = mode === 'turn' ? p : mode === 'parallel' ? 0 : 1;
  const alliedPos = Array.from({ length: nA }, (_, i) => allied(i, nA, curve));
  const isSpanish = (i: number) => [2, 5, 8, 12, 15, 19, 22, 25, 28, 31].includes(i);
  // British columns
  const weather = 12, lee = 15;
  const colPos = (k: number, i: number, prog: number): [number, number] => {
    const target = k === 0 ? allied(14, nA, curve) : allied(24, nA, curve);
    const startX = 180, y0 = target[1] + (k === 0 ? -40 : 30);
    const headX = startX + (target[0] - startX) * prog;
    return [headX - i * 62, y0 + (k === 0 ? -0.0 : 0)];
  };
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 50%, #1b3a55 0%, #0b1622 80%)', opacity: lin(f, 0, 10) }}>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {Array.from({ length: 30 }, (_, i) => <path key={i} d={`M${(i * 137) % 1900},${(i * 251) % 1060} q14,-8 28,0 t28,0`} fill="none" stroke="#3b6488" strokeWidth={2} opacity={0.35} />)}
        <path d={coast} fill="#c9b48a" stroke="#6b5636" strokeWidth={2} />
        <circle cx={cape[0]} cy={cape[1]} r={8} fill="#f6ecd4" />
        <text x={cape[0] + 16} y={cape[1] + 8} fontFamily={TYPE} fontWeight={700} fontSize={26} fill="#f6ecd4" stroke="#0b1622" strokeWidth={5} paintOrder="stroke">CAPE TRAFALGAR</text>
        <text x={PT([-6.4, 36.62])[0]} y={PT([-6.4, 36.62])[1]} fontFamily={TYPE} fontWeight={700} fontSize={26} fill="#f6ecd4" stroke="#0b1622" strokeWidth={5} paintOrder="stroke">CÁDIZ</text>
        {/* wind arrow */}
        <g transform="translate(120,110)" opacity={0.85}><line x1={0} y1={0} x2={110} y2={0} stroke="#cfe0ee" strokeWidth={5} /><path d="M110,-12 L134,0 L110,12 Z" fill="#cfe0ee" /><text x={0} y={-16} fontFamily={TYPE} fontWeight={700} fontSize={22} fill="#cfe0ee">LIGHT WIND FROM THE WEST</text></g>
        {mode === 'parallel' ? (
          <>
            {Array.from({ length: 12 }, (_, i) => <Ship key={`pa${i}`} x={420 + i * 95 + 40 * p} y={440} dir={0} color={RED} />)}
            {Array.from({ length: 12 }, (_, i) => <Ship key={`pb${i}`} x={420 + i * 95 + 40 * p} y={620} dir={0} color={BLUE} />)}
            {Array.from({ length: 12 }, (_, i) => { const ph = (f + i * 7) % 40; return ph < 3 ? <line key={`sh${i}`} x1={430 + i * 95} y1={452} x2={430 + i * 95} y2={608} stroke="#ffd36a" strokeWidth={3} opacity={1 - ph / 3} /> : null; })}
            <text x={960} y={330} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={46} fill="#f6ecd4">THE OLD WAY: LINE AGAINST LINE</text>
          </>
        ) : (
          <>
            {alliedPos.map(([x, y], i) => {
              const cut = mode === 'melee' && i >= 12 && i < 33; const away = mode === 'melee' && i < 10;
              return <Ship key={`a${i}`} x={x + (away ? -60 * p : 0)} y={y - (away ? 180 * p : 0)} dir={away ? -100 : 90} color={isSpanish(i) ? YEL : BLUE} sunk={cut ? 0.5 * p : 0} />;
            })}
            {mode !== 'turn' && [0, 1].map((k) => {
              const n = k === 0 ? weather : lee;
              const prog = mode === 'plan' ? p : mode === 'columns' ? 0.55 * p : 1;
              return Array.from({ length: n }, (_, i) => { const [x, y] = colPos(k, i, prog); return x > 0 ? <Ship key={`b${k}${i}`} x={x} y={y} dir={0} color={RED} s={i === 0 ? 1.3 : 1} /> : null; });
            })}
            {(mode === 'columns' || mode === 'plan') && (
              <>
                <text x={colPos(0, 0, mode === 'plan' ? p : 0.55 * p)[0] - 20} y={colPos(0, 0, 0)[1] - 30} textAnchor="end" fontFamily={HEAD} fontWeight={700} fontSize={34} fill="#f6ecd4" stroke="#0b1622" strokeWidth={6} paintOrder="stroke">NELSON · VICTORY</text>
                <text x={colPos(1, 0, mode === 'plan' ? p : 0.55 * p)[0] - 20} y={colPos(1, 0, 0)[1] + 50} textAnchor="end" fontFamily={HEAD} fontWeight={700} fontSize={34} fill="#f6ecd4" stroke="#0b1622" strokeWidth={6} paintOrder="stroke">COLLINGWOOD · ROYAL SOVEREIGN</text>
              </>
            )}
            {mode === 'plan' && p > 0.92 && (
              <g opacity={lin(p, 0.92, 1)}>
                {[[200, 460], [460, 770], [770, 990]].map(([a, b], i) => <rect key={i} x={850} y={a} width={260} height={b - a} fill="none" stroke={['#9fb6cf', C.gold, C.gold][i]} strokeWidth={4} strokeDasharray="14 10" />)}
                <text x={1130} y={330} fontFamily={HEAD} fontWeight={700} fontSize={32} fill="#9fb6cf">VAN · CUT OFF</text>
                <text x={1130} y={620} fontFamily={HEAD} fontWeight={700} fontSize={32} fill={C.gold}>CENTRE · CRUSHED</text>
                <text x={1130} y={890} fontFamily={HEAD} fontWeight={700} fontSize={32} fill={C.gold}>REAR · CRUSHED</text>
              </g>
            )}
            {mode === 'melee' && <text x={760} y={110} fontFamily={HEAD} fontWeight={700} fontSize={34} fill="#9fb6cf" opacity={lin(p, 0.3, 0.6)}>THE VAN SAILS AWAY ↑</text>}
          </>
        )}
        <g transform="translate(70,1010)">
          <Ship x={10} y={0} dir={0} color={RED} /><text x={40} y={9} fontFamily={TYPE} fontWeight={700} fontSize={22} fill="#f6ecd4">BRITISH (27)</text>
          <Ship x={270} y={0} dir={0} color={BLUE} /><text x={300} y={9} fontFamily={TYPE} fontWeight={700} fontSize={22} fill="#f6ecd4">FRENCH</text>
          <Ship x={460} y={0} dir={0} color={YEL} /><text x={490} y={9} fontFamily={TYPE} fontWeight={700} fontSize={22} fill="#f6ecd4">SPANISH (33 ALLIED)</text>
          <text x={900} y={9} fontFamily={TYPE} fontSize={20} fill="rgba(246,236,212,0.6)">SCHEMATIC · NOT TO SCALE</text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** Final count: Britain vs France & Spain. */
const Scoreboard: React.FC<{ n: number }> = ({ n }) => {
  const f = useCurrentFrame();
  const row = (at: number, label: string, a: string, b: string) => (
    <div style={{ display: 'flex', alignItems: 'center', opacity: lin(f, at, at + 8), transform: `translateY(${16 * (1 - ease(f, at, at + 10))}px)`, borderBottom: '2px solid rgba(246,236,212,0.2)', padding: '14px 0' }}>
      <div style={{ width: 520, fontFamily: TYPE, fontWeight: 700, fontSize: 32, letterSpacing: 3, color: '#cfc3a8' }}>{label}</div>
      <div style={{ width: 380, textAlign: 'center', fontFamily: HEAD, fontWeight: 700, fontSize: 74, color: '#f6ecd4' }}>{a}</div>
      <div style={{ width: 380, textAlign: 'center', fontFamily: HEAD, fontWeight: 700, fontSize: 74, color: C.redHi }}>{b}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: 'rgba(8,6,4,0.72)', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 1280 }}>
        <div style={{ display: 'flex', paddingBottom: 10, opacity: lin(f, 4, 14) }}>
          <div style={{ width: 520 }} />
          <div style={{ width: 380, textAlign: 'center', fontFamily: HEAD, fontWeight: 700, fontSize: 40, color: C.gold }}>BRITAIN</div>
          <div style={{ width: 380, textAlign: 'center', fontFamily: HEAD, fontWeight: 700, fontSize: 40, color: C.gold }}>FRANCE & SPAIN</div>
        </div>
        {row(wf(n, 'single'), 'SHIPS LOST', '0', '18')}
        {row(wf(n, '450'), 'KILLED (APPROX.)', '~450', '~4,400')}
        {row(wf(n, '11'), 'BACK IN CÁDIZ', '—', '11')}
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

const S: SC[] = [];
// 1 hook
S[1] = mk(1, (F) => { const c = wf(1, 'sunset'); return (<>
  <Shake hits={[20, 70]} amp={10}><Shot id="t22_breakthrough" from={0} to={c + 8} fadeIn={0} /><Broadsides y={720} x0={150} x1={1750} /></Shake>
  <Shot id="t42_fleet_glory" from={c} to={F} /><Dim />
  <Chips items={[{ at: wf(1, '27'), t: '27 BRITISH' }, { at: wf(1, '33'), t: '33 FRENCH & SPANISH' }]} />
  <Verdict at={wf(1, 'none')} text="BRITISH SHIPS LOST: 0" color={C.gold} y={420} />
</>); });
S[2] = one(2, 't02_headland', () => <Slate at={6} place="CAPE TRAFALGAR, SPAIN" date="21 OCTOBER 1805" />);
S[3] = one(3, 't01_fleet_dawn', () => <Title at={wf(3, 'battle') - 4} text="TRAFALGAR" sub="What happened, and why it happened at all" />);
S[4] = one(4, 't03_napoleon', () => (<><Chapter n="I" title="The Invasion Plan" /><Slate at={40} place="EUROPE · 1803" date="NAPOLEON BONAPARTE" /></>));
S[5] = one(5, 't04_boulogne', () => (<><Slate at={6} place="BOULOGNE" date="THE ARMY OF ENGLAND" /><Chips items={[{ at: wf(5, 'barges'), t: 'INVASION BARGES' }, { at: wf(5, 'channel'), t: 'NEEDS: THE CHANNEL' }]} /></>));
S[6] = mk(6, (F) => { const c = Math.round(F * 0.45); return (<><Shot id="t05_blockade" from={0} to={c + 8} /><Dim />
  <Sequence from={c} layout="none"><AtlanticMap dur={F - c} zoom={[1.9, 1500, 400]} title="THE BLOCKADE · 1805">
    <Port k="toulon" name="TOULON" at={wf(6, 'toulon') - c} x /><Port k="brest" name="BREST" at={wf(6, 'brest') - c} x /><Port k="boulogne" name="BOULOGNE" at={0} dy={-14} />
  </AtlanticMap></Sequence></>); });
S[7] = mk(7, (F) => { const f0 = 0; return (<AtlanticMap dur={F} title="NAPOLEON'S PLAN · 1805">
  <PlanRoutes n={7} /><Port k="toulon" name="TOULON" at={f0} /><Port k="martinique" name="CARIBBEAN" at={wf(7, 'caribbean')} dx={18} dy={40} /><Port k="boulogne" name="CHANNEL" at={wf(7, 'channel')} dy={-14} />
</AtlanticMap>); });
S[8] = one(8, 't07_villeneuve', () => (<><Slate at={6} place="VICE-ADMIRAL VILLENEUVE" date="COMMANDER, COMBINED FLEET" /><Chips items={[{ at: wf(8, 'nile'), t: 'SURVIVED THE NILE · 1798' }]} /></>));
S[9] = mk(9, (F) => { const c = wf(9, 'nelson'); return (<><Shot id="t08_atlantic" from={0} to={c + 8} /><Dim />
  <Sequence from={c} layout="none"><AtlanticMap dur={F - c} title="THE CHASE · SPRING–SUMMER 1805"><ChaseRoutes /></AtlanticMap></Sequence>
  <Chapter n="II" title="The Chase" /></>); });
S[10] = one(10, 't16_line_battle', () => (<><Slate at={6} place="CAPE FINISTERRE" date="22 JULY 1805" /><Verdict at={wf(10, 'inconclusive')} text="INCONCLUSIVE" color={C.gold} y={430} /><Haze o={0.3} /></>));
S[11] = mk(11, (F) => (<AtlanticMap dur={F} zoom={[2.6, 1500, 420]} title="AUGUST 1805">
  <Route pts={[PLACES.ferrol, [-10.5, 42], [-9.8, 38], PLACES.cadiz]} t={ease(useCurrentFrame(), wf(11, 'south'), wf(11, 'south') + 60)} color="#4f86c6" label="VILLENEUVE → CÁDIZ" lx={-330} ly={44} w={5} />
  <Port k="ferrol" name="FERROL" at={0} dx={-120} /><Port k="brest" name="BREST" at={wf(11, 'brest')} x={useCurrentFrame() > wf(11, 'instead')} /><Port k="cadiz" name="CÁDIZ" at={wf(11, 'cdiz')} dx={-110} />
</AtlanticMap>));
S[12] = one(12, 't11_army_march', () => (<><Slate at={6} place="BOULOGNE → AUSTRIA" date="25 AUGUST 1805" /><Verdict at={wf(12, 'off')} text="INVASION CANCELLED" y={430} /></>));
S[13] = one(13, 't04_boulogne', () => (<><Verdict at={wf(13, 'stop')} text="MYTH" y={360} out={wf(13, 'cancelled')} /><Verdict at={wf(13, 'cancelled')} text="ALREADY CANCELLED" color={C.gold} y={360} /></>));
S[14] = one(14, 't12_frigate', () => (<><Chapter n="III" title="The Trap at Cádiz" /><Chips items={[{ at: wf(14, '50'), t: '50 MILES OFFSHORE' }, { at: wf(14, 'frigates'), t: 'FRIGATES WATCHING' }]} top={260} /></>));
S[15] = one(15, 't13_gun_deck_crew', () => <Chips items={[{ at: wf(15, 'supplies'), t: 'SUPPLIES SHORT' }, { at: wf(15, '2000'), t: '2,000+ MEN SHORT' }, { at: wf(15, 'sailors'), t: 'RAW CREWS' }]} />);
S[16] = one(16, 't14_letter', () => (<><Slate at={wf(16, '18') - 4} place="18 OCTOBER 1805" date="A REPLACEMENT IS COMING" /><Chips items={[{ at: wf(16, 'naples'), t: 'ORDERS: SAIL FOR NAPLES' }]} /></>));
S[17] = one(17, 't15_leave_harbour', () => (<><Count at={wf(17, '33')} to={33} label="SHIPS OF THE LINE" /><Chips items={[{ at: wf(17, 'voted'), t: 'CAPTAINS VOTED TO STAY' }]} top={460} /></>));
S[18] = mk(18, (F) => { const c = Math.round(F * 0.3); return (<><Shot id="t16_line_battle" from={0} to={c + 8} /><Dim />
  <Sequence from={c} layout="none"><TacticsMap mode="parallel" dur={F - c} /></Sequence><Chapter n="IV" title="The Nelson Touch" /></>); });
S[19] = one(19, 't17_dinner', () => <Slate at={6} place="ABOARD HMS VICTORY" date="OCTOBER 1805" />);
S[20] = mk(20, (F) => <TacticsMap mode="plan" dur={F} />);
S[21] = one(21, 't18_bow_on', () => (<><Chips items={[{ at: wf(21, 'fire'), t: "CAN'T FIRE BACK" }, { at: wf(21, 'targets'), t: 'JUST TARGETS' }]} /><Broadsides y={600} x0={300} x1={1600} seed={7} n={8} /></>));
S[22] = one(22, 't07_villeneuve', () => <Verdict at={wf(22, 'single')} text="KEEPS THE SINGLE LINE" color={C.gold} y={420} />);
S[23] = one(23, 't19_lookout', () => (<><Chapter n="V" title="The Morning" /><Slate at={40} place="DAWN · 21 OCTOBER" date="WIND: LIGHT" /></>));
S[24] = mk(24, (F) => <TacticsMap mode="turn" dur={F} />);
S[25] = mk(25, (F) => { const c = wf(25, 'nelson', 1); return (<><Shot id="t42_fleet_glory" from={0} to={c + 8} /><Dim />
  <Sequence from={c} layout="none"><TacticsMap mode="columns" dur={F - c} /></Sequence>
  <Sequence from={c} layout="none"><Chips items={[{ at: wf(25, '27') - c, t: '27 SHIPS' }, { at: wf(25, '2000') - c, t: '2,000+ CANNON' }, { at: wf(25, '17000') - c, t: '17,000 MEN' }]} top={140} /></Sequence></>); });
S[26] = one(26, 't20_signal_flags', () => (<><Slate at={6} place="11:45 AM" date="NELSON'S SIGNAL" /><SignalText n={26} /></>));
S[27] = one(27, 't21_gun_crew', () => (<><QuoteCard at={6} text="England expects that every man will do his duty." by="HMS VICTORY, 11:45 AM" out={wf(27, 'then') + 4} /><Chips items={[{ at: wf(27, 'engage'), t: '"ENGAGE THE ENEMY MORE CLOSELY"' }]} top={300} /></>));
S[28] = one(28, 't22_breakthrough', () => (<><Chapter n="VI" title="Breaking the Line" /><Slate at={30} place="NOON" date="FIRST SHOT" /><QuoteCard at={wf(28, 'now')} text="Now, gentlemen, let us do something today which the world may talk of hereafter." by="VICE-ADMIRAL COLLINGWOOD" y={600} /></>));
S[29] = mk(29, (F) => (<><Shake hits={[wf(29, 'smashes'), wf(29, 'broadside')]} amp={18}><Shot id="t25_raking" from={0} to={F} /><Broadsides y={640} x0={200} x1={1700} seed={3} /></Shake><Flash at={wf(29, 'broadside')} /><Dim /><Slate at={6} place="ROYAL SOVEREIGN" date="ALONE INTO THE LINE" /></>));
S[30] = one(30, 't23_dismasted', () => (<><Slate at={6} place="HMS BELLEISLE" date="DISMASTED" /><Count at={wf(30, '45')} to={45} label="MINUTES · FLAG STILL FLYING" /><Haze o={0.35} /></>));
S[31] = two(31, 't18_bow_on', 't24_wheel', 'wheel', () => (<><Slate at={6} place="HMS VICTORY" date="UNDER FIRE FROM 4 SHIPS" /><Count at={wf(31, '40')} to={40} label="MINUTES · CAN'T FIRE BACK" /></>));
S[32] = mk(32, (F) => (<><Shake hits={[wf(32, 'broadside')]} amp={22}><Shot id="t25_raking" from={0} to={F} /><svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}><VfxDefs /><Explosion at={wf(32, 'broadside')} x={1100} y={560} s={1.3} seed={4} /></svg></Shake><Flash at={wf(32, 'broadside')} /><Dim /><Slate at={6} place="BUCENTAURE" date="RAKED STERN TO BOW" /></>));
S[33] = one(33, 't26_locked', () => (<><Slate at={6} place="VICTORY vs REDOUTABLE" date="LOCKED TOGETHER" /><Haze o={0.35} /></>));
S[34] = two(34, 't27_marksman', 't28_admiral_falls', 'musket', () => (<><Chapter n="VII" title="The Fall of Nelson" /><Flash at={wf(34, 'musket') + 6} color="255,230,190" /><Chips items={[{ at: wf(34, 'shoulder'), t: 'SHOULDER' }, { at: wf(34, 'lung'), t: 'LUNG' }, { at: wf(34, 'spine'), t: 'SPINE' }]} top={300} /><Slate at={wf(34, 'quarter') - 4} place="ABOUT 1:15 PM" /></>));
S[35] = two(35, 't28_admiral_falls', 't29_cockpit', 'carried', () => <QuoteCard at={6} text="They have done it at last, Hardy. My backbone is shot through." by="NELSON" y={160} out={wf(35, 'carried') + 4} />);
S[36] = mk(36, (F) => (<><Shake hits={[wf(36, 'fires')]} amp={22}><Shot id="t30_boarders" from={0} to={F} /></Shake><Flash at={wf(36, 'fires')} /><Dim /><Chips items={[{ at: wf(36, 'temeraire'), t: 'HMS TEMERAIRE' }]} /></>));
S[37] = one(37, 't31_surrender', () => (<><Slate at={6} place="1:55 PM" date="REDOUTABLE SURRENDERS" /><Count at={wf(37, '99')} to={99} label={'OF 643 STILL FIT'} /></>));
S[38] = mk(38, (F) => { const c = Math.round(F * 0.55); return (<><TacticsMap mode="melee" dur={c + 10} /><Shot id="t31_surrender" from={c} to={F} /><Sequence from={c} layout="none"><Dim /></Sequence><Verdict at={wf(38, 'prisoner')} text="VILLENEUVE CAPTURED" y={420} /></>); });
S[39] = one(39, 't32_giant_ship', () => (<><Slate at={6} place="SANTÍSIMA TRINIDAD" date="THE MOST HEAVILY ARMED SHIP AFLOAT" /><Count at={wf(39, '130')} to={130} label="GUNS" /><Broadsides y={660} x0={300} x1={1600} seed={9} /></>));
S[40] = two(40, 't26_locked', 't33_sail_away', 'front', () => <Chips items={[{ at: wf(40, 'churruca'), t: 'CHURRUCA · KILLED' }, { at: wf(40, 'galiano'), t: 'ALCALÁ GALIANO · KILLED' }]} />);
S[41] = mk(41, (F) => (<><Shake hits={[wf(41, 'explodes')]} amp={30}><Shot id="t34_explosion" from={0} to={F} /><svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}><VfxDefs /><Explosion at={wf(41, 'explodes')} x={960} y={560} s={2} seed={6} /></svg><Particles kind="embers" n={80} o={0.8} /></Shake><Flash at={wf(41, 'explodes')} dur={24} /><Dim /><Slate at={6} place="ACHILLE" date="LATE AFTERNOON" /></>));
S[42] = one(42, 't29_cockpit', () => (<><QuoteCard at={wf(42, 'thank')} text="Thank God I have done my duty." by="NELSON" y={160} out={wf(42, 'half') - 2} /><Slate at={wf(42, 'half')} place="4:30 PM" date="NELSON DIES · AGED 47" /></>));
S[43] = mk(43, (F) => (<><Shot id="t35_storm" from={0} to={F} /><Rain o={0.55} /><Flash at={wf(43, 'hit')} color="210,225,255" /><Dim /><Chapter n="VIII" title="The Storm" /></>));
S[44] = mk(44, (F) => { const c = wf(44, 'retaken'); return (<><Shot id="t36_wreck" from={0} to={F} /><Rain o={0.45} /><Dim /><Chips items={[{ at: wf(44, 'sank'), t: 'PRIZES SINK' }, { at: wf(44, 'rocks'), t: 'DRIVEN ONTO ROCKS' }, { at: c, t: 'RETAKEN BY PRISONERS' }, { at: wf(44, 'burned'), t: 'SANTÍSIMA TRINIDAD SCUTTLED' }]} /></>); });
S[45] = one(45, 't37_after_storm', () => <QuoteCard at={wf(45, 'collingwood') + 4} text="…would rather fight another battle than pass through such a week as followed it." by="COLLINGWOOD, NOVEMBER 1805" y={300} />);
S[46] = mk(46, (F) => (<><Shot id="t42_fleet_glory" from={0} to={F} /><Dim /><Scoreboard n={46} /><Chapter n="IX" title="Why It Mattered" /></>));
S[47] = one(47, 't38_ulm', () => (<><Slate at={6} place="ULM" date="20 OCTOBER 1805" /><Chips items={[{ at: wf(47, 'secret'), t: 'TRAFALGAR KEPT SECRET' }, { at: wf(47, 'victory', 1), t: 'PARIS: "A FRENCH VICTORY"' }]} /></>));
S[48] = one(48, 't39_inn', () => (<><Slate at={6} place="RENNES, FRANCE" date="APRIL 1806" /><Verdict at={wf(48, 'suicide')} text="OFFICIAL VERDICT: SUICIDE" y={430} size={66} /></>));
S[49] = one(49, 't40_austerlitz', () => <Slate at={6} place="AUSTERLITZ" date="2 DECEMBER 1805" />);
S[50] = one(50, 't42_fleet_glory', () => <Verdict at={wf(50, 'sea')} text="RULER OF THE SEA" color={C.gold} y={420} />);
S[51] = one(51, 't41_ship_home', () => <Slate at={6} place="ST PAUL'S CATHEDRAL" date="9 JANUARY 1806" />);
S[52] = mk(52, (F) => { const f = useCurrentFrame(); const a = wf(52, 'genius'); const b = wf(52, 'fear');
  const card = (at: number, l: string, t: string, x: number, col: string) => f < at ? null : (
    <div style={{ position: 'absolute', left: x, top: 330, width: 560, transform: `scale(${0.8 + 0.2 * ease(f, at, at + 8)})`, opacity: lin(f, at, at + 6), background: 'rgba(14,10,6,0.85)', border: `4px solid ${col}`, padding: '18px 22px', textAlign: 'center' }}>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 40, color: col }}>{l}</div>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 60, color: '#fff' }}>{t}</div>
    </div>);
  return (<><Shot id="t01_fleet_dawn" from={0} to={F} /><Dim top={0.6} />
    <div style={{ position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', opacity: lin(f, 4, 12), fontFamily: HEAD, fontWeight: 700, fontSize: 84, color: '#fff', textShadow: '0 8px 24px #000' }}>TRAFALGAR WAS WON BY…</div>
    {card(a, 'A', "NELSON'S GENIUS", 340, C.gold)}{card(b, 'B', "VILLENEUVE'S FEAR", 1020, '#6fbf73')}
    <div style={{ position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', opacity: lin(f, wf(52, 'subscribe') - 4, wf(52, 'subscribe') + 6) }}><span style={{ background: C.red, color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 40, padding: '12px 30px', letterSpacing: 2 }}>SUBSCRIBE · BURIED CHRONICLES</span></div>
  </>); });

/* scene-specific helpers that read the clock */
function PlanRoutes({ n }: { n: number }) {
  const f = useCurrentFrame();
  const a = wf(n, 'slip'), b = wf(n, 'lure'), c = wf(n, 'race');
  return (<>
    <Route pts={[PLACES.toulon, [3, 38.5], PLACES.gib, [-20, 30], [-45, 20], PLACES.martinique]} t={ease(f, a, b + 20)} color="#4f86c6" w={6} />
    <Route pts={[PLACES.martinique, [-45, 33], [-20, 45], PLACES.brest, PLACES.channel]} t={ease(f, c, c + 70)} color={C.gold} dashed label="SWEEP THE CHANNEL" lx={-420} ly={-30} w={6} />
  </>);
}
function ChaseRoutes() {
  const f = useCurrentFrame();
  return (<>
    <Route pts={[PLACES.toulon, [3, 38.5], PLACES.gib, [-20, 30], [-45, 20], PLACES.martinique, [-45, 33], [-20, 42], PLACES.finisterre, PLACES.ferrol]} t={ease(f, 0, 120)} color="#4f86c6" label="VILLENEUVE" lx={-200} ly={60} w={6} />
    <Route pts={[[4, 40.5], [-4, 36.6], [-20, 28], [-45, 16], [-59.6, 13.1], [-45, 30], [-20, 38], [-6, 36.3]]} t={ease(f, 40, 170)} color={C.redHi} label="NELSON" lx={20} ly={50} w={5} />
    <Port k="toulon" name="TOULON" at={0} /><Port k="martinique" name="WEST INDIES" at={30} dx={18} dy={40} />
  </>);
}
function SignalText({ n }: { n: number }) {
  const f = useCurrentFrame();
  const a = wf(n, 'confides'), b = wf(n, 'expects');
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center', opacity: lin(f, a - 4, a + 6) }}>
      <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 58, color: '#f6ecd4', textShadow: '0 4px 20px #000' }}>England </span>
      <span style={{ position: 'relative', fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 58, color: f >= b ? C.gold : '#f6ecd4', textShadow: '0 4px 20px #000' }}>
        {f >= b ? 'expects' : 'confides'}
        {f >= b - 2 && f < b + 12 && <span style={{ position: 'absolute', left: -10, right: -10, top: '50%', height: 6, background: C.redHi, transform: `scaleX(${lin(f, b - 2, b + 4)})`, transformOrigin: 'left' }} />}
      </span>
      <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 58, color: '#f6ecd4', textShadow: '0 4px 20px #000' }}> that every man will do his duty</span>
    </div>
  );
}

export const SCENE_COMPS = Array.from({ length: 52 }, (_, i) => S[i + 1]);
export { spring, useVideoConfig, Img };
