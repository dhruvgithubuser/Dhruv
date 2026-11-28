import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Loc, Num, Photo, RStamp, Stat } from '../Overlays';
import { MapArrow, MapTable, PLACES, Pin, geo } from '../three/Map3D';
import { Sherman } from '../three/Models';
import { Stage } from '../three/Stage';
import { Label, h01, mixV, V3 } from '../three/util';
import { C, ease, lin, wf } from '../theme';

const mix2 = (a: number, b: number, t: number) => a + (b - a) * t;
const ROOM = { sky: '#1a1d22', skyTop: '#0a0c0f', sun: [-20, 40, 25] as V3, sunColor: '#fff3e0', sunI: 3.4, hemi: ['#a9b6c8', '#1a1814', 0.55] as [string, string, number], fog: [60, 160] as [number, number] };
const OPS: [number, number][] = [[-1.2, 49.3], [-4.3, 48.4], [-3.8, 48.6], [1.0, 48.9], [5.9, 49.6], [6.1, 49.52], [6.3, 49.8], [6.5, 49.4], [6.2, 50.6], [6.4, 50.75], [6.0, 50.9], [6.3, 51.0]];
const ROUTE: [number, number][] = [[-0.8, 49.33], [-2.5, 48.8], [-4.49, 48.39], [-2.0, 48.3], [0.5, 48.6], [2.35, 48.86], [4.5, 49.3], [6.13, 49.61], [6.3, 50.5], [6.39, 51.25]];
const DUMMIES: [number, number][] = Array.from({ length: 34 }, (_, i) => [6.28 + h01(i, 21) * 0.4, 51.08 + h01(i, 22) * 0.3]);

const MiniTanks: React.FC<{ f: number; at: number }> = ({ f, at }) => (
  <group>{DUMMIES.map(([lo, la], i) => { const k = ease(f, at + i * 1.2, at + i * 1.2 + 10); if (k <= 0) return null; const [x, , z] = geo(lo, la, 0.28);
    return <Sherman key={i} position={[x, 0.28, z]} rotation={[0, 1.2 + h01(i, 5) * 0.6, 0]} scale={0.032} rubber squash={1 - k} />; })}</group>
);
const Flag: React.FC<{ at: [number, number]; text: string; o: number }> = ({ at, text, o }) => {
  if (o <= 0) return null; const [x, , z] = geo(at[0], at[1], 0.28);
  return (
    <group position={[x, 0.28, z]} scale={[1, Math.min(1, o * 1.5), 1]}>
      <mesh position={[0, 0.6, 0]} castShadow><cylinderGeometry args={[0.015, 0.015, 1.2, 6]} /><meshStandardMaterial color="#222" /></mesh>
      <mesh position={[0.14, 1.08, 0]} castShadow><boxGeometry args={[0.26, 0.16, 0.01]} /><meshStandardMaterial color="#5b5f3a" /></mesh>
      <Label text={text} position={[0, 1.42, 0]} h={0.15} bg="rgba(20,20,18,0.88)" opacity={Math.min(1, o * 2)} />
      <Label text="FAKE" position={[0, 1.62, 0]} h={0.13} bg="rgba(200,53,43,0.92)" opacity={Math.min(1, o * 2)} />
    </group>
  );
};

/* 11 · Normandy → the Rhine: more than twenty deceptions. */
export const S11: React.FC = () => {
  const f = useCurrentFrame();
  const c = geo(2.2, 49.6, 0);
  const cam = { pos: mixV([c[0] - 2, 34, c[2] + 28], [c[0] + 3, 28, c[2] + 22], lin(f, 0, 110)), look: [c[0] + 0.6, 0, c[2] - 1] as V3, fov: 50 };
  return (
    <AbsoluteFill>
      <Stage cam={cam} sky={ROOM.sky} skyTop={ROOM.skyTop} sun={ROOM.sun} sunColor={ROOM.sunColor} sunI={ROOM.sunI} hemi={ROOM.hemi} fog={ROOM.fog} shadowR={40}>
        <MapTable />
        <MapArrow pts={ROUTE} p={ease(f, 4, 90)} color="#e2b93b" r={0.16} />
        {OPS.map((o, i) => { const k = lin(f, 12 + i * 6, 20 + i * 6); if (k <= 0) return null; const [x, , z] = geo(o[0], o[1], 0.3);
          return <mesh key={i} position={[x, 0.3 + 0.25 * k, z]} scale={k}><cylinderGeometry args={[0.32, 0.32, 0.5, 20]} /><meshStandardMaterial color="#e9eef5" emissive="#8fb2e8" emissiveIntensity={0.5} transparent opacity={0.85} /></mesh>; })}
        <Pin at={PLACES.normandy} label="NORMANDY" o={lin(f, 2, 12)} lh={1.1} />
        <Pin at={PLACES.brest} label="BREST" o={lin(f, 20, 30)} lh={0.9} />
        <Pin at={PLACES.luxembourg} label="LUXEMBOURG" o={lin(f, 50, 60)} lh={1.0} />
        <Pin at={PLACES.viersen} label="THE RHINE" o={lin(f, 80, 90)} lh={1.2} color="#3b7fae" />
      </Stage>
      <Loc text="JUNE 1944 → MARCH 1945" sub="WESTERN FRONT" at={2} />
      <Stat value={<Num from={0} to={20} at={wf(11, 'twenty') - 10} dur={14} suffix="+" />} label="deception operations" at={wf(11, 'twenty') - 16} y={1060} w={560} />
    </AbsoluteFill>
  );
};

/* 12 · Operation Viersen, March 1945: two fake divisions, 600+ dummies, covering the Ninth Army's crossing. */
export const S12: React.FC = () => {
  const f = useCurrentFrame();
  const fly = ease(f, 0, 90);
  const r = geo(6.55, 51.33, 0);
  const far = geo(2.2, 49.6, 0);
  const cam = { pos: mixV([far[0] + 3, 28, far[2] + 22], [r[0] - 1.6, 7.6, r[2] + 4.6], fly), look: mixV([far[0] + 0.6, 0, far[2] - 1], [r[0] + 0.1, 0.2, r[2] - 0.4], fly), fov: mix2(50, 46, fly) };
  const cover = wf(12, 'cover'), faked = wf(12, 'faked'), n600 = wf(12, '600');
  return (
    <AbsoluteFill>
      <Stage cam={cam} sky={ROOM.sky} skyTop={ROOM.skyTop} sun={ROOM.sun} sunColor={ROOM.sunColor} sunI={ROOM.sunI} hemi={ROOM.hemi} fog={[30, 140]} shadowR={12}>
        <MapTable />
                <Pin at={PLACES.rheinberg} label="REAL CROSSING SITE" o={lin(f, cover + 10, cover + 20)} h={0.5} lh={0.16} r={0.08} color="#2d4f86" />
        <MiniTanks f={f} at={faked - 6} />
        <Flag at={[6.24, 51.2]} text="30TH INFANTRY DIV." o={lin(f, wf(12, 'two') - 4, wf(12, 'two') + 6)} />
        <Flag at={[6.66, 51.1]} text="79TH INFANTRY DIV." o={lin(f, wf(12, 'divisions') - 6, wf(12, 'divisions') + 4)} />
      </Stage>
      <Loc text="OPERATION VIERSEN" sub="MARCH 18–24, 1945" at={wf(12, 'march') - 6} />
      <Stat value={<Num from={0} to={600} at={n600 - 10} dur={22} suffix="+" />} label="inflatable dummies · 2 fake divisions" at={n600 - 16} y={1060} w={700} color={C.yellow} />
    </AbsoluteFill>
  );
};

/* 13 · The Germans took the bait; the real crossing to the north met little resistance. */
export const S13: React.FC = () => {
  const f = useCurrentFrame();
  const r = geo(6.55, 51.36, 0);
  const cam = { pos: mixV([r[0] - 1.6, 7.6, r[2] + 4.6], [r[0] - 0.6, 8.2, r[2] + 4.2], lin(f, 0, 130)), look: [r[0] + 0.2, 0.2, r[2] - 0.5] as V3, fov: 46 };
  const bait = wf(13, 'bait'), real = wf(13, 'real'), res = wf(13, 'resistance');
  const ger = useMemo(() => [[[7.3, 51.45], [7.0, 51.38], [6.72, 51.3]], [[7.35, 51.2], [7.0, 51.22], [6.74, 51.24]]] as [number, number][][], []);
  return (
    <AbsoluteFill>
      <Stage cam={cam} sky={ROOM.sky} skyTop={ROOM.skyTop} sun={ROOM.sun} sunColor={ROOM.sunColor} sunI={ROOM.sunI} hemi={ROOM.hemi} fog={[30, 140]} shadowR={12}>
        <MapTable />
        <MiniTanks f={f} at={-400} />
        {ger.map((g, i) => <MapArrow key={i} pts={g} p={ease(f, bait - 20 + i * 6, bait + 10 + i * 6)} color="#6b6f75" r={0.06} y={0.45} />)}
        <MapArrow pts={[[6.25, 51.62], [6.5, 51.58], [6.75, 51.57], [6.98, 51.6]]} p={ease(f, real - 6, real + 40)} color="#2d4f86" r={0.08} y={0.45} />
        <Pin at={PLACES.rheinberg} label="REAL CROSSING · MARCH 23" o={1} h={0.5} lh={0.16} r={0.08} color="#2d4f86" />
        <Label text="GERMAN RESERVES" position={[...geo(7.25, 51.47, 0.9)] as V3} h={0.15} opacity={lin(f, bait - 20, bait - 10)} />
      </Stage>
      <Photo src="simpson" at={real + 10} x={720} y={250} w={300} rot={3} caption="LT. GEN. WILLIAM SIMPSON, NINTH ARMY" />
      <Photo src="rhine" at={res - 18} x={60} y={790} w={680} rot={-2} caption="U.S. TROOPS CROSSING THE RHINE, MARCH 1945" />
      <RStamp text="LITTLE RESISTANCE" at={res + 2} x={420} y={1200} size={64} rot={-6} color="#4a7fd0" />
    </AbsoluteFill>
  );
};
