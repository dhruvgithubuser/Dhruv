import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import world from '../world.json';
import { C, MONO, SANS, ease, lin } from '../theme';

// ------------------------------------------------------------------ typography
export const ChapterCard: React.FC<{ num: string; title: string; at?: number; out?: number }> = ({ num, title, at = 0, out = 75 }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 12) * (1 - lin(f, out - 12, out));
  if (o <= 0) return null;
  const track = 18 + 10 * ease(f, at, out);
  return (
    <AbsoluteFill style={{ background: `rgba(0,0,0,${0.55 * o})`, justifyContent: 'center', alignItems: 'center', opacity: o }}>
      <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 10, color: C.accent }}>{num}</div>
      <div style={{ width: 80 * o, height: 2, background: C.accent, margin: '22px 0' }} />
      <div style={{ fontFamily: SANS, fontWeight: 300, fontSize: 64, letterSpacing: track, color: C.ink, textTransform: 'uppercase' }}>{title}</div>
    </AbsoluteFill>
  );
};

export const Super: React.FC<{ lines: string[]; at: number; out: number; x?: number; y?: number; align?: 'left' | 'right' }> = ({ lines, at, out, x = 120, y = 760, align = 'left' }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 15) * (1 - lin(f, out - 15, out));
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: align === 'left' ? x : undefined, right: align === 'right' ? x : undefined, top: y, opacity: o, textAlign: align }}>
      {lines.map((l, i) => (
        <div key={i} style={{
          fontFamily: i === 0 ? SANS : MONO, fontWeight: i === 0 ? 600 : 500, fontSize: i === 0 ? 46 : 26, letterSpacing: i === 0 ? 6 : 3,
          color: i === 0 ? C.ink : C.amber, textTransform: 'uppercase', marginTop: i ? 10 : 0, textShadow: '0 2px 16px rgba(0,0,0,0.8)',
          transform: `translateY(${(1 - ease(f, at + i * 5, at + i * 5 + 18)) * 14}px)`, opacity: lin(f, at + i * 5, at + i * 5 + 15),
        }}>{l}</div>
      ))}
    </div>
  );
};

/** A stack of facts typed in, panel style (right or left side). */
export const DataCard: React.FC<{ title: string; rows: [string, string][]; at: number; out: number; side?: 'left' | 'right'; top?: number; width?: number }> = ({ title, rows, at, out, side = 'right', top = 260, width = 620 }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 12) * (1 - lin(f, out - 12, out));
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', [side]: 110, top, width, opacity: o, background: C.panel, borderLeft: `3px solid ${C.accent}`, padding: '28px 34px', backdropFilter: 'blur(6px)' }}>
      <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: C.accent, marginBottom: 18 }}>{title}</div>
      {rows.map(([k, v], i) => {
        const ro = lin(f, at + 10 + i * 8, at + 22 + i * 8);
        return (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: i ? '1px solid rgba(255,255,255,0.1)' : 'none', opacity: ro, transform: `translateX(${(1 - ro) * 16}px)` }}>
            <span style={{ fontFamily: SANS, fontSize: 26, color: C.dim, letterSpacing: 1 }}>{k}</span>
            <span style={{ fontFamily: MONO, fontSize: 28, color: C.ink }}>{v}</span>
          </div>
        );
      })}
    </div>
  );
};

export const BigNumber: React.FC<{ value: number; label: string; at: number; x: number; y: number; color?: string; dur?: number }> = ({ value, label, at, x, y, color = C.ink, dur = 30 }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 10);
  if (o <= 0) return null;
  const v = Math.round(value * ease(f, at, at + dur));
  return (
    <div style={{ position: 'absolute', left: x, top: y, opacity: o, textAlign: 'center', width: 360 }}>
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 132, color, lineHeight: 1, letterSpacing: -2 }}>{v}</div>
      <div style={{ fontFamily: MONO, fontSize: 24, color: C.dim, letterSpacing: 3, marginTop: 14, textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
};

// ------------------------------------------------------------------ the 32 seconds
export type Ev = { t: number; label: string; at: number; color?: string };
/** T+ timeline across the frame, events lit as the narration reaches them; clock top-right. */
export const Timeline32: React.FC<{ events: Ev[]; clockAt: number[]; t0Label?: string }> = ({ events, clockAt }) => {
  const f = useCurrentFrame();
  const X0 = 90, X1 = 990, Y = 1080;
  const px = (t: number) => X0 + ((X1 - X0) * t) / 32;
  // clockAt: [frame where T is 0, frame where T reaches 32] (the clock runs in narration time)
  const T = Math.max(0, Math.min(32, ((f - clockAt[0]) / (clockAt[1] - clockAt[0])) * 32));
  const secs = 39 + Math.floor(T), mm = 38 + Math.floor(secs / 60), ss = secs % 60;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', right: 90, top: 260, textAlign: 'right' }}>
        <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: C.dim }}>IST · 12 JUNE 2025</div>
        <div style={{ fontFamily: MONO, fontSize: 84, color: C.ink, letterSpacing: 2 }}>13:{String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}</div>
        <div style={{ fontFamily: MONO, fontSize: 30, color: C.accent, letterSpacing: 4 }}>T+{String(Math.floor(T)).padStart(2, '0')} s</div>
      </div>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <line x1={X0} y1={Y} x2={X1} y2={Y} stroke="rgba(255,255,255,0.25)" strokeWidth={3} />
        <line x1={X0} y1={Y} x2={px(T)} y2={Y} stroke={C.accent} strokeWidth={5} />
        {Array.from({ length: 33 }, (_, i) => <line key={i} x1={px(i)} x2={px(i)} y1={Y - (i % 4 ? 8 : 16)} y2={Y + (i % 4 ? 8 : 16)} stroke="rgba(255,255,255,0.4)" strokeWidth={2} />)}
        {[0, 8, 16, 24, 32].map((i) => <text key={i} x={px(i)} y={Y + 52} textAnchor="middle" fontFamily={MONO} fontSize={26} fill={C.dim}>T+{i}</text>)}
        {events.map((e, i) => {
          const o = lin(f, e.at, e.at + 10);
          if (o <= 0) return null;
          const up = -(1 + (i % 4) * 0.75);
          return (
            <g key={i} opacity={o}>
              <line x1={px(e.t)} y1={Y} x2={px(e.t)} y2={Y + up * 70} stroke={e.color ?? C.amber} strokeWidth={2} />
              <circle cx={px(e.t)} cy={Y} r={9} fill={e.color ?? C.amber} />
              <text x={Math.min(px(e.t) + 10, 700)} y={Y + up * 70 - 8} fontFamily={SANS} fontWeight={600} fontSize={28} fill="#fff" letterSpacing={1}>{e.label}</text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** The two fuel control switches (as on the 787 throttle quadrant): RUN up, CUTOFF down. */
export const FuelSwitches: React.FC<{ cut: [number, number]; back: [number, number]; at: number }> = ({ cut, back, at }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const o = lin(f, at, at + 15);
  if (o <= 0) return null;
  const pos = (c: number, b: number) => {
    const down = spring({ frame: f - c, fps, config: { damping: 14, stiffness: 260 } });
    const up = spring({ frame: f - b, fps, config: { damping: 14, stiffness: 260 } });
    return Math.max(0, Math.min(1, down - up)); // 0 = RUN, 1 = CUTOFF
  };
  const sw = [pos(cut[0], back[0]), pos(cut[1], back[1])];
  return (
    <div style={{ position: 'absolute', left: 260, top: 470, opacity: o }}>
      <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: C.dim, marginBottom: 16 }}>ENGINE FUEL CONTROL SWITCHES</div>
      <svg width={560} height={420}>
        <defs>
          <linearGradient id="metal" x1="0" x2="1"><stop offset="0" stopColor="#3a3f45" /><stop offset="0.5" stopColor="#c9ced4" /><stop offset="1" stopColor="#4a5056" /></linearGradient>
          <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#24282d" /><stop offset="1" stopColor="#141619" /></linearGradient>
        </defs>
        <rect x={0} y={0} width={560} height={420} rx={14} fill="url(#panel)" stroke="#3a3f45" strokeWidth={3} />
        {[0, 1].map((i) => {
          const cx = 160 + i * 240, s = sw[i];
          const tipY = 150 + s * 120;
          return (
            <g key={i}>
              <text x={cx} y={62} textAnchor="middle" fontFamily={SANS} fontWeight={600} fontSize={26} fill="#e9edf2">ENG {i + 1}</text>
              <text x={cx - 70} y={135} textAnchor="end" fontFamily={MONO} fontSize={22} fill={s < 0.5 ? '#9fe0a0' : '#666'}>RUN</text>
              <text x={cx - 70} y={300} textAnchor="end" fontFamily={MONO} fontSize={22} fill={s >= 0.5 ? C.accent : '#666'}>CUTOFF</text>
              <rect x={cx - 52} y={95} width={18} height={230} rx={4} fill="#2c3035" />
              <rect x={cx + 34} y={95} width={18} height={230} rx={4} fill="#2c3035" />
              <rect x={cx - 10} y={150} width={20} height={130} rx={10} fill="#0d0f11" />
              <line x1={cx} y1={215} x2={cx} y2={tipY} stroke="url(#metal)" strokeWidth={22} strokeLinecap="round" />
              <ellipse cx={cx} cy={tipY} rx={26} ry={20} fill="url(#metal)" stroke="#1a1d20" strokeWidth={3} />
              {s >= 0.5 && <circle cx={cx} cy={tipY} r={48} fill="none" stroke={C.accent} strokeWidth={3} opacity={0.6 + 0.4 * Math.sin(f / 4)} />}
            </g>
          );
        })}
      </svg>
      <div style={{ fontFamily: MONO, fontSize: 18, color: C.dim, marginTop: 10, letterSpacing: 2 }}>SCHEMATIC · SOURCE: AAIB PRELIMINARY REPORT</div>
    </div>
  );
};

/** Quoted / reported speech card (no dramatized voice). */
export const ReportedSpeech: React.FC<{ lines: string[]; source: string; at: number; out: number }> = ({ lines, source, at, out }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 15) * (1 - lin(f, out - 15, out));
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 80, right: 80, top: 560, opacity: o, textAlign: 'center' }}>
      {lines.map((l, i) => (
        <div key={i} style={{ fontFamily: SANS, fontWeight: 600, fontSize: 60, lineHeight: 1.3, color: i ? C.ink : C.amber, opacity: lin(f, at + i * 40, at + i * 40 + 18) }}>{l}</div>
      ))}
      <div style={{ fontFamily: MONO, fontSize: 22, color: C.dim, letterSpacing: 3, marginTop: 30 }}>{source}</div>
    </div>
  );
};

// ------------------------------------------------------------------ route globe
const D = Math.PI / 180;
const ortho = (cx: number, cy: number, R: number, lon0: number, lat0: number) => (lon: number, lat: number) => {
  const la = lat * D, lo = (lon - lon0) * D, l0 = lat0 * D;
  let x = R * Math.cos(la) * Math.sin(lo), y = R * (Math.cos(l0) * Math.sin(la) - Math.sin(l0) * Math.cos(la) * Math.cos(lo));
  const c = Math.sin(l0) * Math.sin(la) + Math.cos(l0) * Math.cos(la) * Math.cos(lo);
  if (c < 0) { const n = Math.hypot(x, y) || 1; x = (x / n) * R; y = (y / n) * R; }
  return [cx + x, cy - y, c];
};
function gc(a: number[], b: number[], n = 80) {
  const v = ([lo, la]: number[]) => [Math.cos(la * D) * Math.cos(lo * D), Math.cos(la * D) * Math.sin(lo * D), Math.sin(la * D)];
  const A = v(a), B = v(b), om = Math.acos(A[0] * B[0] + A[1] * B[1] + A[2] * B[2]);
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, k1 = Math.sin((1 - t) * om) / Math.sin(om), k2 = Math.sin(t * om) / Math.sin(om);
    const p = [k1 * A[0] + k2 * B[0], k1 * A[1] + k2 * B[1], k1 * A[2] + k2 * B[2]];
    return [Math.atan2(p[1], p[0]) / D, Math.asin(p[2]) / D];
  });
}
export const RouteGlobe: React.FC<{ from: number[]; to: number[]; draw: number; lon0: number; lat0: number }> = ({ from, to, draw, lon0, lat0 }) => {
  const R = 430, cx = 540, cy = 760;
  const P = ortho(cx, cy, R, lon0, lat0);
  const land = (world as number[][][]).map((r) => r.map(([lo, la], i) => { const p = P(lo, la); return `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`; }).join('') + 'Z').join('');
  const route = gc([from[1], from[0]], [to[1], to[0]]);
  const n = Math.max(2, Math.round(draw * route.length));
  const rp = route.slice(0, n).map(([lo, la]) => P(lo, la));
  const a = P(from[1], from[0]), b = P(to[1], to[0]);
  return (
    <svg width={1080} height={1920}>
      <defs>
        <radialGradient id="atm" cx="0.5" cy="0.5" r="0.5"><stop offset="0.9" stopColor="#5fb4ff" stopOpacity="0" /><stop offset="0.96" stopColor="#5fb4ff" stopOpacity="0.35" /><stop offset="1" stopColor="#5fb4ff" stopOpacity="0" /></radialGradient>
        <radialGradient id="sea" cx="0.4" cy="0.3" r="0.8"><stop offset="0" stopColor="#0f2233" /><stop offset="1" stopColor="#04080d" /></radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={R * 1.07} fill="url(#atm)" />
      <circle cx={cx} cy={cy} r={R} fill="url(#sea)" />
      <path d={land} fill="#1b2a35" stroke="#4d6a80" strokeWidth={1.2} />
      <path d={rp.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join('')} fill="none" stroke={C.amber} strokeWidth={4} strokeDasharray="10 8" />
      {[[a, 'AHMEDABAD · AMD'], [b, 'LONDON GATWICK · LGW']].map(([p, l], i) => (
        <g key={i}>
          <circle cx={(p as number[])[0]} cy={(p as number[])[1]} r={9} fill={i ? C.cyan : C.accent} stroke="#fff" strokeWidth={3} />
          <text x={(p as number[])[0] + (i ? -18 : 18)} y={(p as number[])[1] - 18} textAnchor={i ? 'end' : 'start'} fontFamily={SANS} fontWeight={600} fontSize={26} letterSpacing={3} fill="#fff" style={{ paintOrder: 'stroke', stroke: '#000', strokeWidth: 5 }}>{l as string}</text>
        </g>
      ))}
    </svg>
  );
};

/** 787-8 forward cabin sketch with seat 11A next to the emergency exit. */
export const SeatMap: React.FC<{ at: number; out: number }> = ({ at, out }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 15) * (1 - lin(f, out - 15, out));
  if (o <= 0) return null;
  const rows = Array.from({ length: 10 }, (_, i) => 3 + i);
  return (
    <div style={{ position: 'absolute', left: 170, top: 880, opacity: o, background: C.panel, padding: 30, borderLeft: `3px solid ${C.accent}` }}>
      <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: C.dim, marginBottom: 18 }}>SEAT 11A · BESIDE AN EMERGENCY EXIT</div>
      <svg width={620} height={300}>
        <rect x={10} y={20} width={600} height={260} rx={120} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={3} />
        {rows.map((r, i) => ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J'].map((s, j) => {
          const x = 60 + i * 52, y = 50 + j * 24 + (j > 2 ? 14 : 0) + (j > 5 ? 14 : 0);
          const hot = r === 11 && s === 'A';
          return <rect key={`${r}${s}`} x={x} y={y} width={36} height={18} rx={4} fill={hot ? C.accent : 'rgba(255,255,255,0.18)'} stroke={hot ? '#fff' : 'none'} strokeWidth={2} />;
        }))}
        <rect x={60 + 8 * 52 - 10} y={22} width={14} height={18} fill={C.amber} />
        <text x={60 + 8 * 52 + 8} y={36} fontFamily={MONO} fontSize={16} fill={C.amber}>EXIT</text>
      </svg>
      <div style={{ fontFamily: MONO, fontSize: 18, color: C.dim, marginTop: 8, letterSpacing: 2 }}>ILLUSTRATIVE LAYOUT</div>
    </div>
  );
};
