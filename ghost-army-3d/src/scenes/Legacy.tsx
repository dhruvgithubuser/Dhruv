import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import { Chips, Num, RStamp, Stat, Title } from '../Overlays';
import { Field, Sherman, Soldier } from '../three/Models';
import { Stage } from '../three/Stage';
import { mixV, useCanvasTex, V3 } from '../three/util';
import { C, ease, lin, wf } from '../theme';

/* 14 · Classified for more than fifty years, until 1996. */
export const S14: React.FC = () => {
  const f = useCurrentFrame();
  const tex = useCanvasTex(1024, 1400, (g) => {
    g.fillStyle = '#d8b878'; g.fillRect(0, 0, 1024, 1400); g.fillStyle = '#2a2117'; g.font = '700 64px "Courier Prime"';
    ['23rd HQ SPECIAL TROOPS', 'AFTER-ACTION REPORTS', '', 'OPERATIONS:', 'BREST · BETTEMBOURG', 'VIERSEN', '', 'DISTRIBUTION: RESTRICTED'].forEach((t, i) => g.fillText(t, 90, 220 + i * 92));
  }, 'file2');
  const cam = { pos: mixV([0, 6.2, 2.8], [0, 4.4, 1.6], ease(f, 0, 150)), look: [0, 0, 0] as V3, fov: 40 };
  return (
    <AbsoluteFill>
      <Stage cam={cam} sky="#120f0b" fog={[8, 30]} sun={[-2.5, 6, 1.5]} sunColor="#ffd7a0" sunI={4.5} hemi={['#3a3328', '#0c0a08', 0.35]} envI={0.15} shadowR={4}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[30, 30]} /><meshStandardMaterial color="#4a2f1c" roughness={0.6} /></mesh>
        <mesh position={[0, 0.04, 0]} castShadow receiveShadow><boxGeometry args={[2.2, 0.06, 3.0]} /><meshStandardMaterial attach="material" map={tex} roughness={0.85} /></mesh>
      </Stage>
      <RStamp text="CLASSIFIED" at={wf(14, 'classified') - 4} x={540} y={760} size={110} rot={-10} />
      <Stat value={<Num plain from={1945} to={1996} at={wf(14, 'for') - 2} dur={wf(14, '1996') - wf(14, 'for')} />} label="more than 50 years of silence" at={wf(14, 'for') - 8} y={170} />
      <RStamp text="DECLASSIFIED 1996" at={wf(14, '1996')} x={540} y={1040} size={84} rot={6} color="#4a7fd0" />
    </AbsoluteFill>
  );
};

/* 15 · 2022: the Congressional Gold Medal. */
const Medal: React.FC<{ rot: number }> = ({ rot }) => {
  const star = useMemo(() => { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.28 : 0.7; const a = (i / 10) * Math.PI * 2 + Math.PI / 2; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? s.lineTo(x, y) : s.moveTo(x, y); } s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 }); return g; }, []);
  const ribbon = useCanvasTex(256, 512, (g) => { const cols = ['#b22234', '#ffffff', '#3c3b6e', '#ffffff', '#b22234']; cols.forEach((c, i) => { g.fillStyle = c; g.fillRect(i * 51.2, 0, 52, 512); }); }, 'ribbon');
  const gold = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d9a93e', metalness: 1, roughness: 0.22 }), []);
  return (
    <group rotation={[0, rot, 0]}>
      <mesh position={[0, 2.25, -0.02]}><planeGeometry args={[0.9, 2.0]} /><meshStandardMaterial map={ribbon} side={THREE.DoubleSide} roughness={0.7} /></mesh>
      <mesh material={gold} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[1.2, 1.2, 0.16, 64]} /></mesh>
      <mesh material={gold} position={[0, 0, 0.09]}><torusGeometry args={[1.05, 0.04, 12, 64]} /></mesh>
      <mesh material={gold} position={[0, 0, -0.09]}><torusGeometry args={[1.05, 0.04, 12, 64]} /></mesh>
      <mesh geometry={star} material={gold} position={[0, 0, 0.07]} />
      <mesh geometry={star} material={gold} position={[0, 0, -0.07]} rotation={[0, Math.PI, 0]} />
      <mesh material={gold} position={[0, 1.25, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.14, 0.04, 10, 24]} /></mesh>
    </group>
  );
};
export const S15: React.FC = () => {
  const f = useCurrentFrame();
  const cam = { pos: mixV([0, 0.6, 7.5], [0, 0.4, 5.6], ease(f, 0, 220)), look: [0, 0.4, 0] as V3, fov: 40 };
  return (
    <AbsoluteFill>
      <Stage cam={cam} sky="#0d0b0a" fog={[10, 40]} sun={[3, 5, 6]} sunColor="#fff2d8" sunI={3.5} hemi={['#544636', '#000000', 0.3]} envI={1.2} shadowR={6}>
        <Medal rot={-0.5 + f * 0.012} />
        <spotLight position={[-4, 6, 4]} angle={0.5} penumbra={0.6} intensity={60} color="#ffe6b0" />
      </Stage>
      <Title text="CONGRESSIONAL GOLD MEDAL" at={wf(15, 'congressional') - 6} y={200} size={84} sub="AWARDED TO THE GHOST ARMY · 2022" />
      <Chips y={1190} items={[{ t: 'Rubber', at: wf(15, 'rubber') - 4 }, { t: 'Sound', at: wf(15, 'sound') - 4 }, { t: 'Imagination', at: wf(15, 'imagination') - 2, color: 'rgba(200,53,43,0.85)' }]} size={40} />
    </AbsoluteFill>
  );
};

/* 16 · Would you have fallen for it? */
export const S16: React.FC = () => {
  const f = useCurrentFrame();
  const a = 0.4 + f * 0.004;
  const cam = { pos: [-Math.sin(a) * 17, 2.6, Math.cos(a) * 17] as V3, look: [0, 1.4, 0] as V3, fov: 44 };
  return (
    <AbsoluteFill>
      <Stage cam={cam} sky="#f0b77a" skyTop="#3f4f78" sun={[40, 10, -30]} sunColor="#ffa766" sunI={3.6} hemi={['#9fb0cc', '#2b2117', 0.55]} fog={[30, 200]}>
        <Field roadX={-12} />
        <Sherman rotation={[0, -0.55, 0]} rubber wob={0.6} t={f} />
        {[[2.4, 1.6], [-2.6, -1.4], [3.2, -2.0]].map(([x, z], i) => <Soldier key={i} position={[x, 0, z]} rotation={[0, i * 2, 0]} />)}
      </Stage>
      <Title text="Would you have fallen for it?" serif at={wf(16, 'would') - 4} y={260} size={92} color={C.yellow} />
      <Chips y={1220} items={[{ t: 'Follow for more forgotten history', at: wf(16, 'it') + 10, color: 'rgba(200,53,43,0.9)' }]} size={32} />
    </AbsoluteFill>
  );
};
