import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { hash01 } from '../theme';
import { Briefcase, CutoutDefs, Figure } from './CharacterCutout';

/**
 * The Wolf's Lair briefing hut, front view: painted wooden room behind (soft focus), the long oak map table with its two
 * massive plinth supports, officers standing behind it. Shared by scenes 3 and 4 so the room is identical.
 * caseX: briefcase x on the floor (null = not yet placed); stauffX: Stauffenberg's x (walks out to the left door).
 */
export const PLINTH_L = [200, 380], PLINTH_R = [690, 870];
export const TABLE_Y = 900, FLOOR_Y = 1240;
export const Room: React.FC<{ caseX?: number | null; caseO?: number; stauffX?: number; walk?: number; hitlerLean?: number; blur?: number; damage?: number; figuresDim?: number }> = ({
  caseX = null, caseO = 1, stauffX = 540, walk = 0, hitlerLean = -6, blur = 3, damage = 0, figuresDim = 0,
}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Img src={staticFile('assets/backgrounds/briefing_hut.jpg')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: `blur(${blur}px) sepia(0.45) brightness(${0.62 - 0.25 * damage}) contrast(1.05)` }} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(29,27,25,0.25) 0%, rgba(29,27,25,0) 40%, rgba(29,27,25,0.55) 100%)' }} />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <CutoutDefs />
        <defs>
          <linearGradient id="oak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7a5534" /><stop offset="1" stopColor="#4a311c" /></linearGradient>
          <linearGradient id="oakSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#3e2916" /><stop offset="0.5" stopColor="#5e4126" /><stop offset="1" stopColor="#3a2614" /></linearGradient>
        </defs>
        {/* exit door on the left */}
        <rect x={40} y={420} width={150} height={520} fill="#2b1d12" stroke="#120c06" strokeWidth={4} />
        <rect x={52} y={432} width={126} height={496} fill={stauffX < 160 ? 'rgba(255,236,190,0.35)' : 'rgba(0,0,0,0.25)'} />
        {/* officers behind the table */}
        <Figure who="officerCap" x={130} y={TABLE_Y + 20} s={0.92} dim={0.18 + figuresDim} />
        <Figure who="officer" x={330} y={TABLE_Y + 20} s={0.95} lean={-3} dim={0.1 + figuresDim} />
        <Figure who="hitler" x={680} y={TABLE_Y + 20} s={0.98} lean={hitlerLean} arm={0.5} dim={figuresDim} />
        <Figure who="officerCap" x={860} y={TABLE_Y + 20} s={0.95} lean={4} dim={0.12 + figuresDim} look={-1} />
        <Figure who="stauffenberg" x={stauffX} y={TABLE_Y + 20 + (walk > 0 ? 0 : 0)} s={0.97} legs={walk > 0} walk={walk} dim={figuresDim * 0.5} />
        {/* table: top with map sheets, apron, two massive plinths */}
        <rect x={20} y={TABLE_Y} width={1040} height={44} fill="url(#oak)" stroke="#1a110a" strokeWidth={4} />
        <rect x={140} y={TABLE_Y - 14} width={420} height={18} fill="#e6dcc0" transform={`rotate(-1 350 ${TABLE_Y})`} />
        <rect x={600} y={TABLE_Y - 12} width={360} height={16} fill="#ddd0b0" transform={`rotate(1.5 780 ${TABLE_Y})`} />
        <rect x={60} y={TABLE_Y + 44} width={960} height={40} fill="#3e2a18" stroke="#1a110a" strokeWidth={3} />
        {[PLINTH_L, PLINTH_R].map(([a, b], i) => (
          <g key={i}>
            <rect x={a} y={TABLE_Y + 84} width={b - a} height={FLOOR_Y - TABLE_Y - 84} fill="url(#oakSide)" stroke="#1a110a" strokeWidth={4} />
            <path d={`M${a + 20},${TABLE_Y + 120} L${a + 20},${FLOOR_Y - 30} M${b - 20},${TABLE_Y + 120} L${b - 20},${FLOOR_Y - 30}`} stroke="rgba(0,0,0,0.3)" strokeWidth={3} />
          </g>
        ))}
        <rect x={0} y={FLOOR_Y} width={1080} height={500} fill="#2a1d12" />
        <path d={`M0,${FLOOR_Y} L1080,${FLOOR_Y}`} stroke="#120c06" strokeWidth={4} />
        {caseX !== null && <Briefcase x={caseX} y={FLOOR_Y - 34} s={0.9} o={caseO} />}
        {/* damage: splintered boards + scorch */}
        {damage > 0 && (
          <g opacity={damage}>
            <rect x={0} y={0} width={1080} height={1920} fill="rgba(20,14,8,0.35)" />
            {Array.from({ length: 14 }, (_, i) => {
              const x = 80 + hash01(i, 3) * 920, y = TABLE_Y - 200 + hash01(i, 4) * 500, l = 120 + hash01(i, 5) * 200, a = -40 + hash01(i, 6) * 80;
              return <rect key={i} x={x} y={y} width={l} height={14} fill="#6b4a2c" stroke="#1a110a" strokeWidth={2} transform={`rotate(${a} ${x} ${y})`} />;
            })}
            <ellipse cx={890} cy={FLOOR_Y - 20} rx={260} ry={60} fill="rgba(0,0,0,0.6)" />
          </g>
        )}
      </svg>
          </AbsoluteFill>
  );
};

/** Illustrated blast: controlled flash, paper-cut smoke lobes, paper fragments drifting down and settling. */
export const Blast: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill style={{ background: `rgba(255,236,200,${Math.max(0, 0.9 - t / 5)})` }} />
      <svg width={1080} height={1920}>
        <g opacity={Math.max(0, 1 - t / 120)}>
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2 + hash01(i, 2);
            const d = Math.min(1, t / 26) * (160 + 220 * hash01(i, 3));
            const r = 70 + 90 * hash01(i, 4) + t * 1.5;
            const g = 70 + 50 * hash01(i, 5);
            return <circle key={i} cx={x + Math.cos(a) * d} cy={y + Math.sin(a) * d * 0.7 - t * 1.6} r={r} fill={`rgb(${g + 20},${g + 10},${g})`} stroke="rgba(20,14,8,0.6)" strokeWidth={3} opacity={0.82} />;
          })}
        </g>
        <circle cx={x} cy={y} r={60 + t * 24} fill="none" stroke="#ffd58a" strokeWidth={16} opacity={Math.max(0, 1 - t / 12)} />
        {Array.from({ length: 22 }, (_, i) => {
          const vx = (hash01(i, 11) - 0.5) * 30, vy = -12 - 16 * hash01(i, 12);
          const tt = Math.min(t, 28);
          const px = x + vx * tt, py = y + vy * tt + 0.7 * tt * tt + Math.max(0, t - 28) * (1.2 + hash01(i, 14)) + 20 * Math.sin((t + i * 7) / 9);
          const settle = Math.min(py, 1520 + 80 * hash01(i, 15));
          return <rect key={i} x={px} y={settle} width={44} height={56} fill="#efe6d2" stroke="#7a6b55" strokeWidth={2} transform={`rotate(${(t * 6 + i * 40) * (settle < py ? 0 : 1) + i * 23} ${px + 22} ${settle + 28})`} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};
