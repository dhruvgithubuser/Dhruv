import React from 'react';
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import geo from '../geo1962.json';
import { C, MONO, SANS, ease, hash01, lin, noise1 } from '../theme';

type Ring = number[][];
const G = geo as { land: Ring[]; usa: Ring[]; cuba: Ring[]; ussr: Ring[] };
const D = Math.PI / 180;

// ------------------------------------------------------------------ underwater atmosphere
/** Rising bubbles, drifting particles and moving light shafts (seeded, frame-driven). */
export const Ocean: React.FC<{ rays?: number; bubbles?: number; o?: number }> = ({ rays = 1, bubbles = 40, o = 1 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity: o }}>
      <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: 0.35 * rays, background: `repeating-linear-gradient(${100 + 6 * Math.sin(f / 60)}deg, rgba(120,200,255,0) 0px, rgba(120,200,255,0.18) ${40 + 10 * Math.sin(f / 40)}px, rgba(120,200,255,0) 120px)`, maskImage: 'linear-gradient(180deg, black 0%, transparent 70%)', WebkitMaskImage: 'linear-gradient(180deg, black 0%, transparent 70%)' }} />
      <svg width={1080} height={1920}>
        {Array.from({ length: bubbles }, (_, i) => {
          const sp = 1.2 + hash01(i, 3) * 2.5;
          const x = hash01(i, 1) * 1080 + Math.sin(f / 12 + i) * 8;
          const y = (hash01(i, 2) * 2400 - f * sp * 2) % 2100;
          const yy = y < -100 ? y + 2100 : y;
          const r = 2 + hash01(i, 4) * 7;
          return <circle key={i} cx={x} cy={yy} r={r} fill="none" stroke="rgba(190,230,255,0.5)" strokeWidth={1.5} />;
        })}
        {Array.from({ length: 70 }, (_, i) => (
          <circle key={`p${i}`} cx={(hash01(i, 7) * 1080 + f * 0.3 + noise1(f * 0.01 + i, 2) * 30 + 1080) % 1080} cy={(hash01(i, 8) * 1920 + f * 0.15) % 1920} r={1 + hash01(i, 9) * 2.2} fill="rgba(170,210,230,0.35)" />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

/** Pulsing red emergency light with flicker. */
export const RedAlert: React.FC<{ level?: number; period?: number }> = ({ level = 1, period = 24 }) => {
  const f = useCurrentFrame();
  const p = 0.5 + 0.5 * Math.max(0, Math.sin((f / period) * Math.PI * 2));
  const flick = hash01(Math.floor(f / 3), 5) > 0.92 ? 0.4 : 1;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill style={{ background: '#5a0a05', mixBlendMode: 'multiply', opacity: 0.45 * level }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 80% 45% at 50% 15%, rgba(255,60,30,0.7), rgba(0,0,0,0) 70%)', mixBlendMode: 'screen', opacity: 0.6 * level * p * flick }} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 1962 globe + quarantine line
const ortho = (cx: number, cy: number, R: number, lon0: number, lat0: number) => (lon: number, lat: number) => {
  const la = lat * D, lo = (lon - lon0) * D, l0 = lat0 * D;
  let x = R * Math.cos(la) * Math.sin(lo), y = R * (Math.cos(l0) * Math.sin(la) - Math.sin(l0) * Math.cos(la) * Math.cos(lo));
  const c = Math.sin(l0) * Math.sin(la) + Math.cos(l0) * Math.cos(la) * Math.cos(lo);
  if (c < 0) { const n = Math.hypot(x, y) || 1; x = (x / n) * R; y = (y / n) * R; }
  return [cx + x, cy - y];
};
const pathOf = (rings: Ring[], P: (a: number, b: number) => number[]) => rings.map((r) => r.map(([lo, la], i) => `${i ? 'L' : 'M'}${P(lo, la).map((v) => v.toFixed(1)).join(',')}`).join('') + 'Z').join('');
const destPt = (lat: number, lon: number, km: number, brg: number) => {
  const d = km / 6371, b = brg * D, la = lat * D, lo = lon * D;
  const la2 = Math.asin(Math.sin(la) * Math.cos(d) + Math.cos(la) * Math.sin(d) * Math.cos(b));
  return [(lo + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(la), Math.cos(d) - Math.sin(la) * Math.sin(la2))) / D, la2 / D];
};

/** Globe of the Atlantic theatre: USA, Cuba (missile sites), USSR, the US naval quarantine line and B-59's approach. */
export const Globe1962: React.FC<{ lon0: number; lat0: number; R?: number; cy?: number; usa?: number; cuba?: number; ussr?: number; quarantine?: number; route?: number; sub?: number }> = ({
  lon0, lat0, R = 470, cy = 860, usa = 0, cuba = 0, ussr = 0, quarantine = 0, route = 0, sub = 0,
}) => {
  const f = useCurrentFrame();
  const P = ortho(540, cy, R, lon0, lat0);
  // quarantine: an arc ~500 nautical miles (926 km) around Cuba (illustrative)
  const q = Array.from({ length: 61 }, (_, i) => P(...(destPt(21.5, -79, 926, -10 + (i / 60) * 200) as [number, number])));
  const qn = Math.max(2, Math.round(quarantine * q.length));
  // illustrative approach from the Kola Peninsula toward the Caribbean
  const routePts = [[33, 69], [5, 63], [-25, 50], [-45, 38], [-60, 30], [-68, 25]].map(([lo, la]) => P(lo, la));
  const rn = Math.max(2, Math.round(route * (routePts.length - 1)) + 1);
  const subP = P(-68, 25);
  const label = (lon: number, lat: number, t: string, col: string, o: number) => { const [x, y] = P(lon, lat); return o > 0 ? <text x={x} y={y} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={34} letterSpacing={4} fill={col} opacity={o} style={{ paintOrder: 'stroke', stroke: '#000', strokeWidth: 6 }}>{t}</text> : null; };
  return (
    <svg width={1080} height={1920}>
      <defs>
        <radialGradient id="g62sea" cx="0.4" cy="0.3" r="0.8"><stop offset="0" stopColor="#13324a" /><stop offset="1" stopColor="#040a12" /></radialGradient>
        <radialGradient id="g62atm" cx="0.5" cy="0.5" r="0.5"><stop offset="0.9" stopColor="#7ec8ff" stopOpacity="0" /><stop offset="0.96" stopColor="#7ec8ff" stopOpacity="0.35" /><stop offset="1" stopColor="#7ec8ff" stopOpacity="0" /></radialGradient>
        <filter id="g62glow"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <circle cx={540} cy={cy} r={R * 1.07} fill="url(#g62atm)" />
      <circle cx={540} cy={cy} r={R} fill="url(#g62sea)" />
      <path d={pathOf(G.land, P)} fill="#2a3a2e" stroke="#7d9a7a" strokeWidth={1.2} />
      {usa > 0 && <path d={pathOf(G.usa, P)} fill="#3d6ea8" opacity={0.85 * usa} stroke="#bcd8ff" strokeWidth={2} />}
      {ussr > 0 && <path d={pathOf(G.ussr, P)} fill="#a8322a" opacity={0.85 * ussr} stroke="#ffb0a0" strokeWidth={2} />}
      {cuba > 0 && <path d={pathOf(G.cuba, P)} fill={C.amber} opacity={cuba} stroke="#fff" strokeWidth={2} filter="url(#g62glow)" />}
      {quarantine > 0 && <path d={q.slice(0, qn).map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join('')} fill="none" stroke="#ffffff" strokeWidth={4} strokeDasharray="12 8" />}
      {route > 0 && <path d={routePts.slice(0, rn).map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join('')} fill="none" stroke={C.accent} strokeWidth={5} strokeDasharray="14 9" />}
      {sub > 0 && <g opacity={sub}><circle cx={subP[0]} cy={subP[1]} r={10 + ((f % 40) / 40) * 40} fill="none" stroke={C.accent} strokeWidth={3} opacity={1 - (f % 40) / 40} /><circle cx={subP[0]} cy={subP[1]} r={9} fill={C.accent} stroke="#fff" strokeWidth={3} /></g>}
      {label(-98, 40, 'USA', '#cfe3ff', usa)}
      {label(-77, 19.2, 'CUBA', C.amber, cuba)}
      {label(55, 60, 'USSR', '#ffc0b0', ussr)}
      {sub > 0 && label(-64, 21.5, 'B-59', '#fff', sub)}
    </svg>
  );
};

// ------------------------------------------------------------------ sonar
export const Sonar: React.FC<{ size?: number; contacts?: number }> = ({ size = 820, contacts = 4 }) => {
  const f = useCurrentFrame();
  const R = size / 2 - 16, c = size / 2;
  const ang = (f * 4) % 360;
  return (
    <svg width={size} height={size}>
      <defs><radialGradient id="sonarbg"><stop offset="0" stopColor="#0c2a20" /><stop offset="1" stopColor="#020806" /></radialGradient></defs>
      <circle cx={c} cy={c} r={R + 12} fill="#141a16" stroke="#3b463e" strokeWidth={6} />
      <circle cx={c} cy={c} r={R} fill="url(#sonarbg)" />
      {[0.25, 0.5, 0.75, 1].map((k) => <circle key={k} cx={c} cy={c} r={R * k} fill="none" stroke="#5fe08a" strokeWidth={1.5} opacity={0.35} />)}
      <line x1={c - R} y1={c} x2={c + R} y2={c} stroke="#5fe08a" opacity={0.25} /><line x1={c} y1={c - R} x2={c} y2={c + R} stroke="#5fe08a" opacity={0.25} />
      {Array.from({ length: 24 }, (_, i) => {
        const a0 = ((ang - i * 2.5) * D), a1 = ((ang - (i + 1) * 2.5) * D);
        return <path key={i} d={`M${c},${c} L${c + R * Math.cos(a0)},${c + R * Math.sin(a0)} L${c + R * Math.cos(a1)},${c + R * Math.sin(a1)} Z`} fill="#5fe08a" opacity={0.3 * (1 - i / 24) ** 2} />;
      })}
      {Array.from({ length: contacts }, (_, i) => {
        const a = 200 + i * 38 + noise1(f * 0.01, i) * 6, r = R * (0.55 + 0.1 * i % 0.4);
        const since = ((ang - a + 720) % 360) / 360;
        const x = c + r * Math.cos(a * D), y = c + r * Math.sin(a * D);
        return <g key={i} opacity={Math.max(0.15, 1 - since * 1.4)}><rect x={x - 14} y={y - 6} width={28} height={12} fill="#ff6a4a" /><text x={x + 20} y={y + 6} fontFamily={MONO} fontSize={20} fill="#ffb0a0">DD-{i + 1}</text></g>;
      })}
      <circle cx={c} cy={c} r={10} fill="#fff" /><text x={c + 16} y={c + 30} fontFamily={MONO} fontSize={22} fill="#fff">B-59</text>
    </svg>
  );
};

// ------------------------------------------------------------------ depth charges: surface above, submarine below
export const DepthCharges: React.FC<{ drops: number[] }> = ({ drops }) => {
  const f = useCurrentFrame();
  const WL = 760; // waterline
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      <line x1={0} y1={WL} x2={1080} y2={WL} stroke="rgba(255,255,255,0.5)" strokeWidth={3} />
      {drops.map((d, i) => {
        const t = f - d;
        if (t < 0) return null;
        const x = 260 + i * 210 + (i % 2) * 40;
        const y = WL - 60 + Math.min(t, 40) * 18;
        const boom = t - 40;
        return (
          <g key={i}>
            {boom < 0 && <g transform={`translate(${x},${y}) rotate(${t * 9})`}><rect x={-14} y={-20} width={28} height={40} rx={6} fill="#4a4f55" stroke="#9aa" strokeWidth={2} /></g>}
            {boom >= 0 && boom < 45 && [0, 1, 2].map((k) => {
              const r = (boom - k * 6) * 14;
              return r > 0 ? <circle key={k} cx={x} cy={WL + 660} r={r} fill="none" stroke={`rgba(200,235,255,${Math.max(0, 0.8 - boom / 45)})`} strokeWidth={6 - k * 1.5} /> : null;
            })}
            {boom >= 0 && boom < 8 && <circle cx={x} cy={WL + 660} r={60} fill="rgba(255,240,200,0.8)" />}
          </g>
        );
      })}
      <text x={60} y={WL - 24} fontFamily={MONO} fontSize={24} fill="#fff" letterSpacing={3}>SURFACE · US DESTROYERS</text>
      <text x={60} y={WL + 44} fontFamily={MONO} fontSize={24} fill="#9fd4ff" letterSpacing={3}>PRACTICE DEPTH CHARGES (SIGNALS)</text>
    </svg>
  );
};

// ------------------------------------------------------------------ submarine cutaway with the nuclear torpedo
export const Cutaway: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const draw = ease(f, at, at + 40);
  const glow = lin(f, at + 40, at + 55);
  const L = 980, y = 980;
  return (
    <svg width={1080} height={1920}>
      <defs>
        <linearGradient id="hull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3b4650" /><stop offset="1" stopColor="#141a20" /></linearGradient>
        <filter id="tglow"><feGaussianBlur stdDeviation="8" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <g transform={`translate(${50},${y})`} opacity={draw}>
        {/* hull */}
        <path d={`M0,40 C30,-30 120,-55 220,-58 L${L - 160},-58 C${L - 80},-56 ${L - 10},-20 ${L},10 C${L - 20},50 ${L - 90},70 ${L - 160},72 L220,72 C120,70 30,62 0,40 Z`} fill="url(#hull)" stroke="#8aa0b0" strokeWidth={3} />
        <path d={`M${L * 0.42},-58 L${L * 0.45},-150 L${L * 0.6},-150 L${L * 0.63},-58 Z`} fill="url(#hull)" stroke="#8aa0b0" strokeWidth={3} />
        {/* compartments */}
        {[0.16, 0.3, 0.44, 0.58, 0.72, 0.86].map((k, i) => <line key={i} x1={L * k} y1={-52} x2={L * k} y2={66} stroke="#8aa0b0" strokeWidth={2} strokeDasharray="6 6" opacity={draw} />)}
        {['TORPEDO ROOM', 'BATTERY', 'CONTROL', 'BATTERY', 'ENGINES', 'AFT TORPEDOES'].map((t, i) => (
          <text key={t + i} x={L * (0.08 + i * 0.14)} y={100} textAnchor="middle" fontFamily={MONO} fontSize={18} fill="#9ab" opacity={draw}>{t}</text>
        ))}
        {/* torpedo tubes + the nuclear torpedo */}
        {[-20, 0, 20, 40].map((ty, i) => <rect key={i} x={30} y={ty - 6} width={140} height={12} rx={6} fill="#20282f" stroke="#5a6872" />)}
        <g filter={glow > 0 ? 'url(#tglow)' : undefined} opacity={0.4 + 0.6 * glow}>
          <rect x={30} y={-8} width={150} height={16} rx={8} fill={glow > 0 ? C.accent : '#556'} />
        </g>
      </g>
      {glow > 0 && (
        <g opacity={glow}>
          <line x1={150} y1={y - 10} x2={300} y2={y - 330} stroke="#fff" strokeWidth={2} />
          <text x={310} y={y - 360} fontFamily={SANS} fontWeight={800} fontSize={46} fill="#fff" letterSpacing={2}>NUCLEAR-ARMED</text>
          <text x={310} y={y - 310} fontFamily={SANS} fontWeight={800} fontSize={46} fill={C.accent} letterSpacing={2}>TORPEDO</text>
          <text x={310} y={y - 268} fontFamily={MONO} fontSize={22} fill={C.dim}>FORWARD TORPEDO ROOM · B-59</text>
        </g>
      )}
      <text x={540} y={y + 220} textAnchor="middle" fontFamily={MONO} fontSize={22} fill="rgba(255,255,255,0.6)" opacity={draw}>FOXTROT-CLASS SUBMARINE · SCHEMATIC, NOT TO SCALE</text>
    </svg>
  );
};

// ------------------------------------------------------------------ the three officers
export type Vote = 'yes' | 'no' | 'pending';
const Badge: React.FC<{ v: Vote; k: number }> = ({ v, k }) => v === 'pending' ? null : (
  <div style={{ position: 'absolute', right: -14, top: -14, width: 70, height: 70, borderRadius: 35, background: v === 'yes' ? '#2f9e4f' : C.accent, border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${k})`, fontFamily: SANS, fontWeight: 800, fontSize: 40, color: '#fff' }}>{v === 'yes' ? '✓' : '✕'}</div>
);
export const Officers: React.FC<{ votes: [Vote, Vote, Vote]; at: [number, number, number]; focus?: number; top?: number }> = ({ votes, at, focus = -1, top = 360 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const people = [['savitsky', 'CAPTAIN', 'Valentin Savitsky'], ['political', 'POLITICAL OFFICER', ''], ['arkhipov', 'SENIOR OFFICER', 'Vasili Arkhipov']];
  return (
    <div style={{ position: 'absolute', left: 40, right: 40, top, display: 'flex', justifyContent: 'space-between' }}>
      {people.map(([img, role, name], i) => {
        const k = spring({ frame: f - at[i], fps, config: { damping: 12 } });
        const hl = focus === i;
        return (
          <div key={i} style={{ width: 316, textAlign: 'center', opacity: focus >= 0 && !hl ? 0.55 : 1, transform: `scale(${hl ? 1.06 : 1})` }}>
            <div style={{ position: 'relative', width: 316, height: 400, border: `4px solid ${hl ? C.amber : 'rgba(255,255,255,0.4)'}`, boxShadow: hl ? `0 0 40px rgba(242,169,59,0.5)` : 'none' }}>
              <Img src={staticFile(`stills/${img}.jpg`)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 20%' }} />
              <Badge v={votes[i]} k={k} />
            </div>
            <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 2, color: C.amber, marginTop: 12 }}>{role}</div>
            {name && <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 24, color: '#fff', marginTop: 4 }}>{name}</div>}
          </div>
        );
      })}
    </div>
  );
};

/** Character identification lower-third. */
export const IdCard: React.FC<{ name: string; role: string; at: number; out: number; top?: number }> = ({ name, role, at, out, top = 1060 }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 10) * (1 - lin(f, out - 10, out));
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 60, top, opacity: o, transform: `translateX(${(1 - ease(f, at, at + 14)) * -60}px)` }}>
      <div style={{ width: 8, height: 96, background: C.accent, position: 'absolute', left: -22, top: 4 }} />
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 52, color: '#fff', letterSpacing: 2, textTransform: 'uppercase', textShadow: '0 4px 16px #000' }}>{name}</div>
      <div style={{ fontFamily: MONO, fontSize: 26, color: C.amber, letterSpacing: 3, textTransform: 'uppercase', textShadow: '0 4px 16px #000' }}>{role}</div>
    </div>
  );
};

/** Vertical crisis timeline, October 1962. */
export const Timeline62: React.FC<{ at: number; hl?: number }> = ({ at, hl = 3 }) => {
  const f = useCurrentFrame();
  const ev = [['14 OCT', 'Missile sites photographed in Cuba'], ['22 OCT', 'Kennedy announces naval quarantine'], ['24 OCT', 'Quarantine takes effect'], ['27 OCT', 'B-59 forced to surface · "Black Saturday"'], ['28 OCT', 'Khrushchev agrees to remove missiles']];
  return (
    <div style={{ position: 'absolute', left: 90, top: 640, width: 900 }}>
      {ev.map(([d, t], i) => {
        const o = lin(f, at + i * 6, at + i * 6 + 12);
        const on = i === hl;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 28, margin: '0 0 34px', opacity: o, transform: `translateX(${(1 - o) * 30}px)` }}>
            <div style={{ width: 22, height: 22, borderRadius: 11, background: on ? C.accent : 'rgba(255,255,255,0.4)', boxShadow: on ? '0 0 24px rgba(232,65,44,0.8)' : 'none' }} />
            <div style={{ fontFamily: MONO, fontSize: on ? 40 : 30, color: on ? '#fff' : C.dim, width: 190 }}>{d}</div>
            <div style={{ fontFamily: SANS, fontWeight: on ? 800 : 400, fontSize: on ? 34 : 28, color: on ? '#fff' : C.dim, flex: 1 }}>{t}</div>
          </div>
        );
      })}
    </div>
  );
};

/** Analogue gauge + bar readout (battery, temperature, signal). */
export const Readout: React.FC<{ label: string; value: number; color?: string; at: number; top: number; text?: string }> = ({ label, value, color = C.amber, at, top, text }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 10);
  if (o <= 0) return null;
  const blink = Math.floor(f / 10) % 2 === 0;
  return (
    <div style={{ position: 'absolute', left: 90, right: 90, top, opacity: o, background: 'rgba(5,8,10,0.72)', border: `2px solid ${color}`, padding: '20px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 28, letterSpacing: 3, color: '#fff' }}><span>{label}</span><span style={{ color, opacity: blink ? 1 : 0.4 }}>{text ?? `${Math.round(value * 100)}%`}</span></div>
      <div style={{ height: 22, marginTop: 14, background: 'rgba(255,255,255,0.12)' }}><div style={{ height: '100%', width: `${value * 100}%`, background: color }} /></div>
    </div>
  );
};
