import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import { Chips, Loc, Num, RStamp, Stat, Title } from '../Overlays';
import { Plane, Soldier } from '../three/Models';
import { Stage } from '../three/Stage';
import { Label, h01, mixV, useCanvasTex, useTex, V3 } from '../three/util';
import { C, ease, lin, wf } from '../theme';

/* ---------- war-room desk: folder + archival photos under a lamp ---------- */
const Folder: React.FC<{ open?: number }> = ({ open = 0 }) => {
  const tex = useCanvasTex(1024, 1400, (g) => {
    g.fillStyle = '#d8b878'; g.fillRect(0, 0, 1024, 1400);
    for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(90,60,20,${0.03 + h01(i, 2) * 0.05})`; g.fillRect(h01(i, 3) * 1024, h01(i, 4) * 1400, 2 + h01(i, 5) * 6, 2); }
    g.fillStyle = '#2a2117'; g.font = '700 64px "Courier Prime"';
    ['WAR DEPARTMENT', '', '23rd HEADQUARTERS', 'SPECIAL TROOPS', '', 'TACTICAL DECEPTION', 'EUROPEAN THEATER 1944–45'].forEach((t, i) => g.fillText(t, 90, 240 + i * 92));
    g.fillStyle = '#111'; g.fillRect(90, 960, 520, 54);
    g.strokeStyle = '#2a2117'; g.lineWidth = 6; g.strokeRect(60, 60, 904, 1280);
  }, 'folder');
  const mat = useMemo(() => [new THREE.MeshStandardMaterial({ color: '#c9a868', roughness: 0.9 }), new THREE.MeshStandardMaterial({ color: '#c9a868', roughness: 0.9 }), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }), new THREE.MeshStandardMaterial({ color: '#b8965a' }), new THREE.MeshStandardMaterial({ color: '#c9a868' }), new THREE.MeshStandardMaterial({ color: '#c9a868' })], [tex]);
  return <mesh material={mat} castShadow receiveShadow position={[0, 0.05 + open * 0, 0]}><boxGeometry args={[2.2, 0.06, 3.0]} /></mesh>;
};
const DeskPhoto: React.FC<{ src: string; position: V3; rot: number; w: number; aspect: number }> = ({ src, position, rot, w, aspect }) => {
  const tex = useTex(`assets/archival/${src}.png`);
  if (!tex) return null;
  return <mesh position={position} rotation={[-Math.PI / 2, 0, rot]} receiveShadow castShadow><planeGeometry args={[w, w / aspect]} /><meshStandardMaterial map={tex} transparent roughness={0.7} /></mesh>;
};
const Desk: React.FC<{ cam: { pos: V3; look: V3; fov?: number } }> = ({ cam }) => (
  <Stage cam={cam} sky="#120f0b" fog={[8, 30]} sun={[-2.5, 6, 1.5]} sunColor="#ffd7a0" sunI={4.5} hemi={['#3a3328', '#0c0a08', 0.35]} envI={0.15} shadowR={4}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[30, 30]} /><meshStandardMaterial color="#4a2f1c" roughness={0.6} /></mesh>
    <Folder />
    <DeskPhoto src="dummy" position={[1.9, 0.02, -0.9]} rot={0.25} w={2.0} aspect={1052 / 699} />
    <DeskPhoto src="rhine" position={[-1.9, 0.02, 0.9]} rot={-0.2} w={1.8} aspect={952 / 667} />
    <DeskPhoto src="simpson" position={[1.7, 0.03, 1.4]} rot={-0.1} w={1.1} aspect={652 / 643} />
    <mesh position={[-1.6, 0.25, -1.6]} castShadow><cylinderGeometry args={[0.32, 0.36, 0.5, 20]} /><meshStandardMaterial color="#d9d4c5" roughness={0.3} /></mesh>
  </Stage>
);

/* 5 · One of the most secret units of WWII: the 23rd HQ Special Troops, the Ghost Army. */
export const S05: React.FC = () => {
  const f = useCurrentFrame();
  const a = 0.3 + f * 0.0015;
  const r = 6.2 - 2.2 * ease(f, 0, 200);
  const cam = { pos: [Math.sin(a) * 1.2, r, Math.cos(a) * 1.2 + 0.8] as V3, look: [0, 0, 0.1] as V3, fov: 42 };
  return (
    <AbsoluteFill>
      <Desk cam={cam} />
      <RStamp text="TOP SECRET" at={wf(5, 'secret') - 4} x={540} y={980} size={100} rot={-9} />
      <Title text="THE GHOST ARMY" at={wf(5, 'ghost') - 6} y={960} size={130} color={C.yellow} />
    </AbsoluteFill>
  );
};

/* 6 · 1,100 men (artists, designers, ad men) — to look like 30,000. */
const GhostCrowd: React.FC<{ n: number }> = ({ n }) => {
  const { body, head, mat } = useMemo(() => {
    const b = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.21, 0.9, 3, 8), undefined as unknown as THREE.Material, 300);
    const h = new THREE.InstancedMesh(new THREE.SphereGeometry(0.17, 10, 8), undefined as unknown as THREE.Material, 300);
    const m = new THREE.MeshStandardMaterial({ color: '#cfe3ff', transparent: true, opacity: 0.32, emissive: '#6f8fbf', emissiveIntensity: 0.6, depthWrite: false });
    b.material = m; h.material = m;
    const o = new THREE.Object3D();
    for (let i = 0; i < 300; i++) {
      const c = i % 20, r = Math.floor(i / 20); const x = (c - 9.5) * 1.5 + (h01(i, 2) - 0.5) * 0.3, z = -4 - r * 1.7;
      o.position.set(x, 0.9, z); o.updateMatrix(); b.setMatrixAt(i, o.matrix);
      o.position.set(x, 1.68, z); o.updateMatrix(); h.setMatrixAt(i, o.matrix);
    }
    return { body: b, head: h, mat: m };
  }, []);
  body.count = n; head.count = n; void mat;
  return <group><primitive object={body} /><primitive object={head} /></group>;
};
export const S06: React.FC = () => {
  const f = useCurrentFrame();
  const bel = wf(6, 'believe');
  const n = Math.round(300 * ease(f, bel - 20, bel + 40));
  const cam = { pos: mixV([0, 2.4, 16], [0, 24, 22], ease(f, bel - 30, bel + 40)), look: mixV([0, 1.2, 0], [0, 0, -12], ease(f, bel - 30, bel + 40)), fov: 52 };
  return (
    <AbsoluteFill>
      <Stage cam={cam} sky="#bfc6c7" skyTop="#6f8aa6" sun={[20, 30, 25]} sunColor="#fff0da" fog={[30, 160]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[400, 400]} /><meshStandardMaterial color="#6f7552" roughness={1} /></mesh>
        {Array.from({ length: 11 }, (_, i) => <Soldier key={i} position={[(i - 5) * 1.25, 0, 0]} pose="stand" />)}
        <GhostCrowd n={n} />
      </Stage>
      <Stat value={<Num from={0} to={1100} at={2} dur={16} />} label="men · 1 figure = 100" at={0} out={bel - 24} y={170} />
      <Chips y={420} items={[{ t: 'Artists', at: wf(6, 'artists') - 4 }, { t: 'Designers', at: wf(6, 'designers') - 4 }, { t: 'Ad men', at: wf(6, 'ad') - 4 }]} />
      <Chips y={510} items={[{ t: 'New York', at: wf(6, 'new') - 4, color: 'rgba(45,79,134,0.85)' }, { t: 'Philadelphia', at: wf(6, 'philadelphia') - 4, color: 'rgba(45,79,134,0.85)' }]} />
      <Stat value={<Num from={1100} to={30000} at={wf(6, 'were') - 4} dur={30} />} label="what the Germans should see" at={bel - 14} y={170} color={C.yellow} />
    </AbsoluteFill>
  );
};

/* 7 · German intelligence: air recon, radio intercepts, spies. The Ghost Army faked all three. */
const Mast: React.FC<{ position: V3; h?: number; glow?: number }> = ({ position, h = 6, glow = 0 }) => (
  <group position={position}>
    {[[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]].map(([x, z], i) => <mesh key={i} castShadow position={[x * 0.5, h / 2, z * 0.5]} rotation={[z * 0.06, 0, -x * 0.06]}><cylinderGeometry args={[0.04, 0.06, h, 6]} /><meshStandardMaterial color="#555" metalness={0.6} roughness={0.4} /></mesh>)}
    {Array.from({ length: Math.floor(h / 0.9) }, (_, i) => <mesh key={`x${i}`} position={[0, 0.6 + i * 0.9, 0]}><boxGeometry args={[0.42 - i * 0.02, 0.04, 0.42 - i * 0.02]} /><meshStandardMaterial color="#666" /></mesh>)}
    <mesh position={[0, h + 0.2, 0]}><sphereGeometry args={[0.16, 12, 10]} /><meshStandardMaterial color="#ff4a3a" emissive="#ff2a1a" emissiveIntensity={0.5 + glow * 2} /></mesh>
  </group>
);
export const Spy: React.FC<{ position: V3; rotation?: V3; pose?: 'stand' | 'sit' }> = ({ position, rotation = [0, 0, 0], pose = 'stand' }) => (
  <group position={position} rotation={rotation}>
    <Soldier pose={pose} uniform="#3d3a36" />
    <mesh position={[0, pose === 'sit' ? 1.42 : 1.8, 0]} castShadow><cylinderGeometry args={[0.15, 0.16, 0.16, 16]} /><meshStandardMaterial color="#1d1b19" /></mesh>
    <mesh position={[0, pose === 'sit' ? 1.36 : 1.74, 0]} castShadow><cylinderGeometry args={[0.3, 0.3, 0.02, 20]} /><meshStandardMaterial color="#1d1b19" /></mesh>
  </group>
);
const Pedestal: React.FC<{ x: number; on: number }> = ({ x, on }) => (
  <group position={[x, 0, 0]}>
    <mesh receiveShadow castShadow position={[0, 0.4, 0]}><cylinderGeometry args={[2.0, 2.2, 0.8, 32]} /><meshStandardMaterial color="#2c2f33" roughness={0.6} metalness={0.2} /></mesh>
    <mesh position={[0, 0.81, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.85, 2.0, 48]} /><meshStandardMaterial color={C.yellow} emissive={C.yellow} emissiveIntensity={on} /></mesh>
  </group>
);
export const S07: React.FC = () => {
  const f = useCurrentFrame();
  const air = wf(7, 'air'), radio = wf(7, 'radio'), spies = wf(7, 'spies'), faked = wf(7, 'faked');
  const pull = ease(f, faked - 14, faked + 10);
  const tx = -7 * ease(f, air - 12, air + 6) + 7 * ease(f, radio - 12, radio + 6) + 7 * ease(f, spies - 12, spies + 6) - 7 * pull;
  const cam = { pos: mixV([tx * 0.9, 6.5, 19], [0, 13, 36], pull), look: mixV([tx, 2.6, 0], [0, 2.4, 0], pull), fov: 44 };
  return (
    <AbsoluteFill>
      <Stage cam={cam} sky="#22272d" skyTop="#0e1115" sun={[6, 14, 10]} sunColor="#e8eef8" sunI={3.2} hemi={['#7f8ea3', '#141414', 0.5]} fog={[25, 70]} shadowR={16}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[200, 200]} /><meshStandardMaterial color="#1b1d20" roughness={0.9} /></mesh>
        <Pedestal x={-7} on={lin(f, air - 6, air) * (1 - pull * 0.5)} />
        <Pedestal x={0} on={lin(f, radio - 6, radio) * (1 - pull * 0.5)} />
        <Pedestal x={7} on={lin(f, spies - 6, spies) * (1 - pull * 0.5)} />
        <Plane position={[-7, 3.4, 0]} rotation={[1.15, 0, 0.15 * Math.sin(f * 0.05)]} scale={0.3} />
        <Mast position={[0, 0.8, 0]} h={5.2} glow={(Math.sin(f * 0.3) + 1) / 2} />
        <Spy position={[7, 0.8, 0]} rotation={[0, -0.5, 0]} />
        <Label text="1 · AIR RECON" position={[-7, 5.2, 0]} h={0.8} opacity={lin(f, air - 6, air)} />
        <Label text="2 · RADIO" position={[0, 7.2, 0]} h={0.8} opacity={lin(f, radio - 6, radio)} />
        <Label text="3 · SPIES" position={[7, 3.9, 0]} h={0.8} opacity={lin(f, spies - 6, spies)} />
        {[-7, 0, 7].map((x, i) => <Label key={x} text="FAKED" position={[x, x === 0 ? 8.4 : x < 0 ? 6.4 : 5.1, 0]} h={1.0} bg="#c8352b" opacity={lin(f, faked + i * 6, faked + i * 6 + 6)} />)}
      </Stage>
      <Loc text="GERMAN INTELLIGENCE" sub="HOW THE ENEMY WATCHED THE FRONT" at={4} />
    </AbsoluteFill>
  );
};
