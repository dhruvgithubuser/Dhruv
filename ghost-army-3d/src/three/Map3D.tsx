import React, { useMemo } from 'react';
import * as THREE from 'three';
import eu from '../data/europe.json';
import { Label, V3 } from './util';

/* Sand-table map of Western Europe: Natural Earth 1:50m land extruded on a sea plane, borders, the Rhine. */
type Pt = [number, number];
const K = 4; // world units per degree of latitude
export const geo = (lon: number, lat: number, y = 0.3): V3 => [(lon - 3) * K * Math.cos((50 * Math.PI) / 180), y, -(lat - 50) * K];
export const RHINE: Pt[] = [[7.59, 47.56], [7.65, 48.1], [7.8, 48.6], [8.2, 49.0], [8.45, 49.5], [8.35, 49.85], [8.27, 50.0], [7.9, 50.05], [7.6, 50.36], [7.35, 50.55], [7.1, 50.73], [6.96, 50.94], [6.85, 51.1], [6.77, 51.23], [6.73, 51.35], [6.75, 51.43], [6.66, 51.55], [6.62, 51.66], [6.45, 51.75], [6.25, 51.83], [5.9, 51.95], [5.4, 51.95], [4.9, 51.9], [4.4, 51.9], [4.1, 51.98]];
export const PLACES: Record<string, Pt> = { normandy: [-0.8, 49.33], brest: [-4.49, 48.39], paris: [2.35, 48.86], luxembourg: [6.13, 49.61], viersen: [6.39, 51.25], rheinberg: [6.6, 51.55], dusseldorf: [6.77, 51.23], wesel: [6.62, 51.66] };

export const MapTable: React.FC<{ land?: string; sea?: string }> = ({ land = '#d8cdb0', sea = '#6f93a6' }) => {
  const { landGeo, borderGeo, rhineGeo } = useMemo(() => {
    const d = eu as { land: Pt[][]; borders: Pt[][] };
    const shapes = d.land.map((r) => { const s = new THREE.Shape(); r.forEach(([lo, la], i) => { const [x, , z] = geo(lo, la); i ? s.lineTo(x, -z) : s.moveTo(x, -z); }); return s; });
    const lg = new THREE.ExtrudeGeometry(shapes, { depth: 0.28, bevelEnabled: false }); lg.rotateX(-Math.PI / 2);
    const pts: number[] = [];
    d.borders.forEach((b) => { for (let i = 1; i < b.length; i++) { const a = geo(b[i - 1][0], b[i - 1][1], 0.3), c = geo(b[i][0], b[i][1], 0.3); pts.push(...a, ...c); } });
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const curve = new THREE.CatmullRomCurve3(RHINE.map(([lo, la]) => new THREE.Vector3(...geo(lo, la, 0.3))));
    const rg = new THREE.TubeGeometry(curve, 300, 0.07, 6, false);
    return { landGeo: lg, borderGeo: bg, rhineGeo: rg };
  }, []);
  const border = useMemo(() => new THREE.LineSegments(borderGeo, new THREE.LineBasicMaterial({ color: '#6d6450', transparent: true, opacity: 0.6 })), [borderGeo]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[400, 400]} /><meshStandardMaterial color={sea} roughness={0.55} metalness={0.1} /></mesh>
      <mesh geometry={landGeo} castShadow receiveShadow><meshStandardMaterial color={land} roughness={0.95} /></mesh>
      <primitive object={border} />
      <mesh geometry={rhineGeo}><meshStandardMaterial color="#3b7fae" roughness={0.4} emissive="#1c4a6a" emissiveIntensity={0.4} /></mesh>
    </group>
  );
};

/** A route drawn as a raised tube that grows with p (0..1), with a cone at its head. */
export const MapArrow: React.FC<{ pts: Pt[]; p: number; color?: string; r?: number; y?: number }> = ({ pts, p, color = '#2d4f86', r = 0.12, y = 0.5 }) => {
  const { tube, curve } = useMemo(() => {
    const c = new THREE.CatmullRomCurve3(pts.map(([lo, la]) => new THREE.Vector3(...geo(lo, la, y))), false, 'centripetal');
    return { tube: new THREE.TubeGeometry(c, 200, r, 8, false), curve: c };
  }, [pts, r, y]);
  if (p <= 0) return null;
  const count = Math.floor((tube.index!.count * Math.min(1, p)) / 6) * 6;
  const head = curve.getPointAt(Math.min(0.999, p)); const tan = curve.getTangentAt(Math.min(0.999, p));
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
  return (
    <group>
      <mesh geometry={tube} castShadow><meshStandardMaterial color={color} roughness={0.5} /></mesh>
      <mesh position={head} quaternion={q} castShadow><coneGeometry args={[r * 3, r * 7, 12]} /><meshStandardMaterial color={color} roughness={0.5} /></mesh>
      {/* draw range trick: re-render tube partially */}
      <DrawRange geo={tube} count={count} />
    </group>
  );
};
const DrawRange: React.FC<{ geo: THREE.BufferGeometry; count: number }> = ({ geo: g, count }) => { g.setDrawRange(0, count); return null; };

/** Map pin: a post with a label. */
export const Pin: React.FC<{ at: Pt; label?: string; o?: number; color?: string; h?: number; lh?: number; r?: number }> = ({ at, label, o = 1, color = '#c8352b', h = 1.2, lh = 0.9, r = 0.22 }) => {
  if (o <= 0) return null;
  const [x, , z] = geo(at[0], at[1]);
  return (
    <group position={[x, 0.3, z]} scale={[1, Math.min(1, o * 1.4), 1]}>
      <mesh position={[0, h / 2, 0]} castShadow><cylinderGeometry args={[r * 0.22, r * 0.22, h, 8]} /><meshStandardMaterial color="#222" /></mesh>
      <mesh position={[0, h, 0]} castShadow><sphereGeometry args={[r, 16, 12]} /><meshStandardMaterial color={color} roughness={0.4} /></mesh>
      {label && <Label text={label} position={[0, h + r + lh * 0.9, 0]} h={lh} opacity={Math.min(1, o * 2)} />}
    </group>
  );
};
