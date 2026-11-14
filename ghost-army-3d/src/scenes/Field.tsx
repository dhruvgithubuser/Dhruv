import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { BigQuote, Loc, Num, Photo, Stat, Title } from '../Overlays';
import { Cyclist, Field, Sherman, Soldier } from '../three/Models';
import { Stage } from '../three/Stage';
import { mixV, V3 } from '../three/util';
import { C, ease, lin, wf } from '../theme';

const GOLD = { skyTop: '#5d7fa6', sky: '#f0cf98', sun: [35, 22, -35] as V3, sunColor: '#ffc98a', hemi: ['#f0dcc0', '#3e3a26', 0.85] as [string, string, number] };
const TANK_ROT = -0.55;
const lift4 = [[1.9, -1.45], [1.9, 1.35], [-1.9, -1.45], [-1.9, 1.35]] as const;

/** The tank, four GIs around it, optional cyclists. `lift` 0..1 raises the tank 0.32 m; `rubber`/`wob`/`squash` for the reveal. */
const LiftGroup: React.FC<{ lift: number; rubber?: boolean; wob?: number; squash?: number; f: number; soldiers?: boolean }> = ({ lift, rubber, wob = 0, squash = 0, f, soldiers = true }) => (
  <group rotation={[0, TANK_ROT, 0]}>
    <Sherman position={[0, 0.32 * lift, 0]} rubber={rubber} wob={wob} squash={squash} t={f} />
    {soldiers && lift4.map(([x, z], i) => (
      <Soldier key={i} position={[x, 0, z]} rotation={[0, x > 0 ? -Math.PI / 2 : Math.PI / 2, 0]} pose={lift > 0.02 ? 'lift' : 'stand'} />
    ))}
  </group>
);

/* 1 · Summer 1944: two Frenchmen on bicycles see four GIs pick up a Sherman. */
export const S01: React.FC = () => {
  const f = useCurrentFrame();
  const stop = wf(1, 'stopped') + 10, pick = wf(1, 'picked');
  const ride = ease(f, 0, stop);
  const z = 46 - 38 * ride;
  const lift = ease(f, pick - 4, pick + 22);
  const cam = { pos: mixV([-9.5, 1.4, 58], [-12.5, 2.3, 15], ease(f, 0, pick + 10)), look: mixV([-6, 1.4, 20], [-1.5, 1.3, 0], ease(f, 0, pick + 10)), fov: 38 };
  return (
    <AbsoluteFill>
      <Stage cam={cam} sky={GOLD.sky} skyTop={GOLD.skyTop} sun={GOLD.sun} sunColor={GOLD.sunColor} hemi={GOLD.hemi} fog={[40, 220]}>
        <Field roadX={-6} />
        <LiftGroup lift={lift} f={f} />
        <Cyclist position={[-6.6, 0, z]} rotation={[0, Math.PI, 0]} ped={ride * 40} />
        <Cyclist position={[-5.3, 0, z + 2.6]} rotation={[0, Math.PI, 0]} ped={ride * 40 + 1} coat="#5a3b2e" />
      </Stage>
      <Loc text="NORMANDY, FRANCE" sub="SUMMER 1944" at={6} />
    </AbsoluteFill>
  );
};

/* 2 · The M4 Sherman: 33 tons of steel. */
export const S02: React.FC = () => {
  const f = useCurrentFrame();
  const a = -0.9 + f * 0.006;
  const cam = { pos: [Math.sin(a) * 14, 2.2, Math.cos(a) * 14] as V3, look: [0, 1.4, 0] as V3, fov: 42 };
  return (
    <AbsoluteFill>
      <Stage cam={cam} sky="#d6dcd8" skyTop="#7d9cbb" sun={[30, 45, 25]} sunColor="#fff6e6" fog={[50, 240]}>
        <Field roadX={-12} />
        <Sherman rotation={[0, TANK_ROT, 0]} />
      </Stage>
      <Loc text="M4 SHERMAN" sub="U.S. ARMY MAIN BATTLE TANK" at={wf(2, 'sherman') - 6} />
      <Stat value={<Num from={0} to={33} at={wf(2, '33') - 4} dur={18} suffix=" TONS" />} label="of steel · ≈ 66,000 lb" at={wf(2, '33') - 10} y={1080} />
    </AbsoluteFill>
  );
};

/* 3 · "Americans are very strong." */
export const S03: React.FC = () => {
  const f = useCurrentFrame();
  const cam = { pos: mixV([-7.2, 0.9, 6.2], [-6.4, 1.0, 5.4], lin(f, 0, 110)), look: [0, 1.6, 0] as V3, fov: 44 };
  return (
    <AbsoluteFill>
      <Stage cam={cam} sky={GOLD.sky} skyTop={GOLD.skyTop} sun={GOLD.sun} sunColor={GOLD.sunColor} hemi={GOLD.hemi} fog={[40, 220]}>
        <Field roadX={-6} />
        <LiftGroup lift={1} f={f} />
      </Stage>
      <BigQuote text="Americans are very strong." by="— A GI, REPORTEDLY (VETERAN ARTHUR SHILSTONE'S ACCOUNT)" at={wf(3, 'americans') - 8} y={260} />
    </AbsoluteFill>
  );
};

/* 4 · The truth: it was rubber. 93 lb. */
export const S04: React.FC = () => {
  const f = useCurrentFrame();
  const rub = wf(4, 'rubber'), w93 = wf(4, '93');
  const isRubber = f >= rub - 4;
  const wob = isRubber ? Math.max(0, 1 - lin(f, rub + 10, rub + 60)) * 3 : 0;
  const lower = 1 - ease(f, rub - 10, rub + 6);
  const cam = { pos: mixV([-11, 2.6, 9], [-8, 2.2, 6.5], ease(f, 0, 100)), look: [0, 1.3, 0] as V3, fov: 40 };
  return (
    <AbsoluteFill>
      <Stage cam={cam} sky={GOLD.sky} skyTop={GOLD.skyTop} sun={GOLD.sun} sunColor={GOLD.sunColor} hemi={GOLD.hemi} fog={[40, 220]}>
        <Field roadX={-6} />
        <LiftGroup lift={lower} rubber={isRubber} wob={wob} squash={isRubber ? 0.08 + 0.05 * Math.sin(f * 0.5) * wob / 3 : 0} f={f} />
      </Stage>
      <Title text="IT WAS RUBBER" at={rub - 6} out={w93 - 12} y={250} size={120} color={C.yellow} />
      <Photo src="dummy" at={w93 - 14} x={70} y={230} w={940} rot={-2} caption="INFLATABLE M4 SHERMAN DECOY · U.S. ARMY PHOTO" />
      <Stat value={<Num from={0} to={93} at={w93} dur={14} suffix=" LB" />} label="vs. 66,000 lb for a real Sherman" at={w93 - 6} y={1000} color={C.yellow} />
    </AbsoluteFill>
  );
};
