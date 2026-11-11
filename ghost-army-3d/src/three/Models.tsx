import React, { useMemo } from 'react';
import * as THREE from 'three';
import { V3, h01, n2 } from './util';

/* Procedural low-poly documentary models (metres; y up; models face +z). */
export const OD = '#5b5f3a', OD_DK = '#3d4028', TRACK = '#2a2925', SKIN = '#c69a7a', STEEL = '#55583c';

const starShape = (() => {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.16 : 0.4; const a = (i / 10) * Math.PI * 2 - Math.PI / 2; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? s.lineTo(x, y) : s.moveTo(x, y); }
  s.closePath(); return s;
})();

const hullGeo = (() => {
  const s = new THREE.Shape();
  s.moveTo(-2.95, 0.85); s.lineTo(2.55, 0.85); s.lineTo(3.0, 1.15); s.lineTo(1.55, 2.0); s.lineTo(-2.55, 2.0); s.lineTo(-2.95, 1.6); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 2.3, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2 });
  g.translate(0, 0, -1.15); g.rotateY(-Math.PI / 2); return g; // length along z
})();

/** M4 Sherman. `rubber` swaps to a slightly glossy, soft material; `squash` (0..1) deflates it; `wob` adds a jelly wobble. */
export const Sherman: React.FC<{ position?: V3; rotation?: V3; scale?: number; rubber?: boolean; squash?: number; wob?: number; t?: number; color?: string }> = ({
  position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, rubber, squash = 0, wob = 0, t = 0, color = OD,
}) => {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: rubber ? 0.38 : 0.72, metalness: rubber ? 0.0 : 0.15 }), [color, rubber]);
  const trk = useMemo(() => new THREE.MeshStandardMaterial({ color: TRACK, roughness: 0.95, metalness: 0.1 }), []);
  const white = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e9e6da', roughness: 0.7 }), []);
  const w = wob * 0.06 * Math.sin(t * 0.7);
  const sy = (1 - 0.55 * squash) * (1 + w), sxz = (1 + 0.12 * squash) * (1 - w * 0.5);
  return (
    <group position={position} rotation={rotation} scale={[scale * sxz, scale * sy, scale * sxz]}>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 1.05, 0, 0]}>
          <mesh material={trk} castShadow receiveShadow position={[0, 0.5, 0]}><boxGeometry args={[0.6, 0.9, 5.2]} /></mesh>
          {[-1, 1].map((e) => <mesh key={e} material={trk} castShadow position={[0, 0.5, e * 2.6]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.45, 0.45, 0.6, 16]} /></mesh>)}
          {[-1.9, -1.15, -0.4, 0.4, 1.15, 1.9].map((z) => <mesh key={z} material={mat} castShadow position={[side * 0.32, 0.42, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.3, 0.3, 0.1, 14]} /></mesh>)}
        </group>
      ))}
      <mesh geometry={hullGeo} material={mat} castShadow receiveShadow />
      <mesh material={mat} castShadow position={[0, 2.38, -0.25]}><cylinderGeometry args={[0.95, 1.12, 0.78, 20]} /></mesh>
      <mesh material={mat} castShadow position={[0, 2.38, 0.75]}><boxGeometry args={[0.95, 0.62, 0.5]} /></mesh>
      <mesh material={mat} castShadow position={[0, 2.42, 2.4]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.085, 0.1, 3.1, 10]} /></mesh>
      <mesh material={mat} castShadow position={[0.35, 2.86, -0.45]}><cylinderGeometry args={[0.3, 0.32, 0.22, 14]} /></mesh>
      {[-1, 1].map((side) => <mesh key={side} material={white} position={[side * 1.22, 1.45, -0.6]} rotation={[0, side * Math.PI / 2, 0]}><shapeGeometry args={[starShape]} /></mesh>)}
      <mesh material={white} position={[0, 2.05, -1.4]} rotation={[-Math.PI / 2, 0, 0]}><shapeGeometry args={[starShape]} /></mesh>
    </group>
  );
};

/** GI. pose: 'stand' | 'lift' | 'walk' | 'sit'; phase drives walk swing. */
export const Soldier: React.FC<{ position?: V3; rotation?: V3; scale?: number; pose?: 'stand' | 'lift' | 'walk' | 'sit'; phase?: number; ghost?: number; uniform?: string; patch?: boolean }> = ({
  position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, pose = 'stand', phase = 0, ghost = 0, uniform = '#6a6a46', patch,
}) => {
  const m = useMemo(() => new THREE.MeshStandardMaterial({ color: uniform, roughness: 0.9, transparent: ghost > 0, opacity: ghost > 0 ? 0.28 : 1 }), [uniform, ghost]);
  const skin = useMemo(() => new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.8, transparent: ghost > 0, opacity: ghost > 0 ? 0.28 : 1 }), [ghost]);
  const helm = useMemo(() => new THREE.MeshStandardMaterial({ color: OD_DK, roughness: 0.6, transparent: ghost > 0, opacity: ghost > 0 ? 0.28 : 1 }), [ghost]);
  const red = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c8352b', roughness: 0.6 }), []);
  const sw = pose === 'walk' ? Math.sin(phase) * 0.5 : 0;
  const sit = pose === 'sit';
  const armX = pose === 'lift' ? -2.15 : sit ? -0.9 : -sw * 0.8;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.11, sit ? 0.5 : 0.88, 0]} rotation={[sit ? -Math.PI / 2 : s * sw, 0, 0]}>
          <mesh material={m} castShadow position={[0, -0.42, 0]}><cylinderGeometry args={[0.085, 0.07, 0.86, 8]} /></mesh>
          <mesh material={helm} castShadow position={[0, -0.86, 0.05]}><boxGeometry args={[0.13, 0.1, 0.26]} /></mesh>
        </group>
      ))}
      <mesh material={m} castShadow position={[0, sit ? 0.82 : 1.2, 0]}><capsuleGeometry args={[0.21, 0.42, 4, 10]} /></mesh>
      {patch && <mesh material={red} position={[0.26, sit ? 0.98 : 1.36, 0]} rotation={[0, Math.PI / 2, 0]}><circleGeometry args={[0.06, 12]} /></mesh>}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.27, sit ? 1.06 : 1.44, 0]} rotation={[armX * (pose === 'walk' ? -s : 1), 0, s * 0.12]}>
          <mesh material={m} castShadow position={[0, -0.32, 0]}><cylinderGeometry args={[0.065, 0.055, 0.64, 8]} /></mesh>
          <mesh material={skin} position={[0, -0.66, 0]}><sphereGeometry args={[0.06, 8, 8]} /></mesh>
        </group>
      ))}
      <mesh material={skin} castShadow position={[0, sit ? 1.3 : 1.68, 0]}><sphereGeometry args={[0.13, 14, 12]} /></mesh>
      <mesh material={helm} castShadow position={[0, sit ? 1.36 : 1.74, 0]}><sphereGeometry args={[0.18, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
    </group>
  );
};

/** Civilian on a bicycle. `roll` = distance travelled (spins wheels), `ped` pedal phase. */
export const Cyclist: React.FC<{ position?: V3; rotation?: V3; coat?: string; ped?: number }> = ({ position = [0, 0, 0], rotation = [0, 0, 0], coat = '#2f4a6e', ped = 0 }) => {
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: '#222', roughness: 0.5, metalness: 0.4 }), []);
  const c = useMemo(() => new THREE.MeshStandardMaterial({ color: coat, roughness: 0.9 }), [coat]);
  const skin = useMemo(() => new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.8 }), []);
  const pants = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a4136', roughness: 0.9 }), []);
  return (
    <group position={position} rotation={rotation}>
      {[-0.55, 0.55].map((z) => <mesh key={z} material={dark} castShadow position={[0, 0.36, z]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.34, 0.03, 8, 24]} /></mesh>)}
      <mesh material={dark} position={[0, 0.62, 0.05]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.025, 0.025, 0.95, 6]} /></mesh>
      <mesh material={dark} position={[0, 0.5, -0.3]} rotation={[0.6, 0, 0]}><cylinderGeometry args={[0.025, 0.025, 0.55, 6]} /></mesh>
      <mesh material={dark} position={[0, 0.55, 0.45]} rotation={[-0.3, 0, 0]}><cylinderGeometry args={[0.025, 0.025, 0.45, 6]} /></mesh>
      <mesh material={dark} position={[0, 0.82, 0.5]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.02, 0.02, 0.5, 6]} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} material={pants} castShadow position={[s * 0.1, 0.55 + 0.08 * Math.sin(ped + (s > 0 ? Math.PI : 0)), -0.1]} rotation={[0.3, 0, 0]}><cylinderGeometry args={[0.075, 0.065, 0.55, 8]} /></mesh>)}
      <mesh material={c} castShadow position={[0, 1.1, -0.05]} rotation={[0.35, 0, 0]}><capsuleGeometry args={[0.2, 0.38, 4, 10]} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} material={c} castShadow position={[s * 0.24, 1.08, 0.2]} rotation={[1.1, 0, 0]}><cylinderGeometry args={[0.055, 0.05, 0.55, 8]} /></mesh>)}
      <mesh material={skin} castShadow position={[0, 1.52, 0.1]}><sphereGeometry args={[0.13, 14, 12]} /></mesh>
      <mesh material={dark} position={[0, 1.63, 0.1]} scale={[1, 0.3, 1]}><sphereGeometry args={[0.17, 14, 8]} /></mesh>
    </group>
  );
};

export const Truck: React.FC<{ position?: V3; rotation?: V3; squash?: number; rubber?: boolean }> = ({ position = [0, 0, 0], rotation = [0, 0, 0], squash = 0, rubber }) => {
  const m = useMemo(() => new THREE.MeshStandardMaterial({ color: OD, roughness: rubber ? 0.45 : 0.85 }), [rubber]);
  const t = useMemo(() => new THREE.MeshStandardMaterial({ color: TRACK, roughness: 0.9 }), []);
  const canvas = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6b6c48', roughness: 0.95 }), []);
  return (
    <group position={position} rotation={rotation} scale={[1, 1 - 0.6 * squash, 1]}>
      {[-1.6, 0.3, 1.4].map((z) => [-0.95, 0.95].map((x) => <mesh key={`${z}${x}`} material={t} castShadow position={[x, 0.45, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.45, 0.45, 0.32, 16]} /></mesh>))}
      <mesh material={m} castShadow position={[0, 0.95, 0]}><boxGeometry args={[2.1, 0.35, 6]} /></mesh>
      <mesh material={m} castShadow position={[0, 1.6, 2.15]}><boxGeometry args={[2.0, 1.1, 1.4]} /></mesh>
      <mesh material={canvas} castShadow position={[0, 1.85, -0.8]}><boxGeometry args={[2.1, 1.5, 3.8]} /></mesh>
    </group>
  );
};

export const Gun: React.FC<{ position?: V3; rotation?: V3; squash?: number }> = ({ position = [0, 0, 0], rotation = [0, 0, 0], squash = 0 }) => {
  const m = useMemo(() => new THREE.MeshStandardMaterial({ color: OD, roughness: 0.6 }), []);
  const t = useMemo(() => new THREE.MeshStandardMaterial({ color: TRACK, roughness: 0.9 }), []);
  return (
    <group position={position} rotation={rotation} scale={[1, 1 - 0.6 * squash, 1]}>
      {[-0.8, 0.8].map((x) => <mesh key={x} material={t} castShadow position={[x, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.55, 0.55, 0.2, 18]} /></mesh>)}
      <mesh material={m} castShadow position={[0, 0.85, 0.2]}><boxGeometry args={[1.3, 0.9, 0.5]} /></mesh>
      <mesh material={m} castShadow position={[0, 1.3, 2.0]} rotation={[Math.PI / 2 - 0.25, 0, 0]}><cylinderGeometry args={[0.1, 0.14, 3.8, 10]} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} material={m} castShadow position={[s * 0.5, 0.25, -1.6]} rotation={[0.1, s * 0.25, 0]}><boxGeometry args={[0.15, 0.15, 3.2]} /></mesh>)}
    </group>
  );
};

/** M3 half-track with a loudspeaker on the bed. */
export const Halftrack: React.FC<{ position?: V3; rotation?: V3 }> = ({ position = [0, 0, 0], rotation = [0, 0, 0] }) => {
  const m = useMemo(() => new THREE.MeshStandardMaterial({ color: OD, roughness: 0.8, metalness: 0.2 }), []);
  const t = useMemo(() => new THREE.MeshStandardMaterial({ color: TRACK, roughness: 0.9 }), []);
  const horn = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2b2b28', roughness: 0.5, metalness: 0.5 }), []);
  return (
    <group position={position} rotation={rotation}>
      {[-1, 1].map((s) => <mesh key={s} material={t} castShadow position={[s * 0.95, 0.45, -1.0]}><boxGeometry args={[0.45, 0.85, 3.0]} /></mesh>)}
      {[-1, 1].map((s) => <mesh key={`w${s}`} material={t} castShadow position={[s * 0.95, 0.45, 1.9]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.45, 0.45, 0.3, 16]} /></mesh>)}
      <mesh material={m} castShadow position={[0, 1.25, -0.6]}><boxGeometry args={[2.2, 1.1, 4.0]} /></mesh>
      <mesh material={m} castShadow position={[0, 1.15, 2.1]}><boxGeometry args={[1.7, 0.8, 1.7]} /></mesh>
      <mesh material={horn} castShadow position={[0, 2.35, -1.2]} rotation={[-Math.PI / 2 + 0.2, 0, 0]}><cylinderGeometry args={[0.15, 0.85, 1.4, 20, 1, true]} /></mesh>
      <mesh material={horn} castShadow position={[0, 2.0, -0.6]}><boxGeometry args={[0.6, 0.6, 0.6]} /></mesh>
    </group>
  );
};

export const Bulldozer: React.FC<{ position?: V3; rotation?: V3 }> = ({ position = [0, 0, 0], rotation = [0, 0, 0] }) => {
  const y = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6d6a3e', roughness: 0.8 }), []);
  const t = useMemo(() => new THREE.MeshStandardMaterial({ color: TRACK, roughness: 0.9 }), []);
  return (
    <group position={position} rotation={rotation}>
      {[-1, 1].map((s) => <mesh key={s} material={t} castShadow position={[s * 0.9, 0.4, 0]}><boxGeometry args={[0.5, 0.8, 3.2]} /></mesh>)}
      <mesh material={y} castShadow position={[0, 1.1, -0.2]}><boxGeometry args={[1.5, 0.9, 2.4]} /></mesh>
      <mesh material={y} castShadow position={[0, 1.9, -0.8]}><boxGeometry args={[1.2, 0.8, 1.0]} /></mesh>
      <mesh material={t} castShadow position={[0, 0.65, 2.0]}><boxGeometry args={[2.6, 1.1, 0.18]} /></mesh>
    </group>
  );
};

/** German recon plane (Fw 189-ish silhouette, simplified). */
export const Plane: React.FC<{ position?: V3; rotation?: V3; scale?: number }> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) => {
  const m = useMemo(() => new THREE.MeshStandardMaterial({ color: '#7d8478', roughness: 0.6, metalness: 0.2 }), []);
  const k = useMemo(() => new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.6 }), []);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh material={m} castShadow><capsuleGeometry args={[0.6, 4.5, 6, 12]} /></mesh>
      <mesh material={m} castShadow position={[0, 0, 0.5]} rotation={[0, 0, 0]}><boxGeometry args={[18, 0.18, 2.2]} /></mesh>
      <mesh material={m} castShadow position={[0, 0.2, -3.8]}><boxGeometry args={[6, 0.14, 1.2]} /></mesh>
      <mesh material={m} castShadow position={[0, 1.0, -3.9]}><boxGeometry args={[0.14, 1.6, 1.0]} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} material={k} position={[s * 4.4, -0.3, 0.9]}><boxGeometry args={[0.8, 0.8, 0.6]} /></mesh>)}
      {[-1, 1].map((s) => <mesh key={`c${s}`} material={k} position={[s * 4.4, -0.3, 1.25]}><cylinderGeometry args={[1.4, 1.4, 0.02, 16]} /></mesh>)}
      {[-1, 1].map((s) => <mesh key={`b${s}`} material={k} position={[s * 1.8, 0.1, 0.3]} rotation={[0, 0, 0]}><boxGeometry args={[0.3, 0.3, 0.3]} /></mesh>)}
    </group>
  );
};

export const Tree: React.FC<{ position: V3; s?: number; seed?: number }> = ({ position, s = 1, seed = 1 }) => {
  const leaf = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.24 + h01(seed, 3) * 0.05, 0.35, 0.22 + h01(seed, 4) * 0.08), roughness: 1, flatShading: true }), [seed]);
  const bark = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a3a2a', roughness: 1 }), []);
  return (
    <group position={position} scale={s}>
      <mesh material={bark} castShadow position={[0, 1.5, 0]}><cylinderGeometry args={[0.18, 0.28, 3, 6]} /></mesh>
      <mesh material={leaf} castShadow position={[0, 4.2, 0]}><icosahedronGeometry args={[2.4, 0]} /></mesh>
      <mesh material={leaf} castShadow position={[0.9, 3.4, 0.6]}><icosahedronGeometry args={[1.5, 0]} /></mesh>
    </group>
  );
};

/** Rolling Normandy field with hedgerows, a dirt road along z at x = roadX, scattered trees. */
export const Field: React.FC<{ size?: number; roadX?: number; tint?: string }> = ({ size = 260, roadX = -6, tint }) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(size, size, 160, 160); g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute; const col = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i); const flat = Math.min(1, Math.max(0, (Math.hypot(x, z) - 22) / 30));
      pos.setY(i, n2(x, z) * flat * 1.6);
      const road = Math.abs(x - roadX) < 2.2 ? 1 : 0;
      if (road) c.set('#8f7d5c'); else c.setHSL(0.2 + 0.04 * Math.sin(x * 0.05 + z * 0.03), 0.32, 0.3 + 0.06 * Math.sin(x * 0.11) * Math.cos(z * 0.09));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
  }, [size, roadX]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, color: tint ?? '#ffffff' }), [tint]);
  const hedge = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2f3b22', roughness: 1, flatShading: true }), []);
  const trees = useMemo(() => Array.from({ length: 36 }, (_, i) => { const a = h01(i, 7) * Math.PI * 2, r = 30 + h01(i, 8) * 80; return [Math.cos(a) * r, Math.sin(a) * r] as [number, number]; }), []);
  return (
    <group>
      <mesh geometry={geo} material={mat} receiveShadow />
      {[-44].map((z) => Array.from({ length: 26 }, (_, i) => { const x = -70 + i * 5.6; return <mesh key={`${z}${i}`} material={hedge} castShadow receiveShadow position={[x, 1.1 + n2(x, z) * 0.3, z + Math.sin(i) * 0.6]} scale={[1.6, 1.0 + h01(i, z) * 0.6, 1.4]}><icosahedronGeometry args={[1.6, 0]} /></mesh>; }))}
      {trees.map(([x, z], i) => <Tree key={i} position={[x, n2(x, z) * 1.2, z]} s={0.9 + h01(i, 9) * 0.6} seed={i} />)}
    </group>
  );
};
