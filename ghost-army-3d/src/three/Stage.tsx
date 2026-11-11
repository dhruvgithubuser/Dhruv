import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ThreeCanvas } from '@remotion/three';
import { Env, Rig, V3 } from './util';

/** Gradient sky dome (ignores fog). */
const SkyDome: React.FC<{ top: string; bottom: string }> = ({ top, bottom }) => {
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(900, 32, 16); const p = g.attributes.position as THREE.BufferAttribute; const col = new Float32Array(p.count * 3);
    const a = new THREE.Color(bottom), b = new THREE.Color(top), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) { const t = Math.max(0, Math.min(1, p.getY(i) / 500 + 0.08)); c.copy(a).lerp(b, Math.pow(t, 0.7)); col.set([c.r, c.g, c.b], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
  }, [top, bottom]);
  return <mesh geometry={geo}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>;
};

/** One 3D shot: background/fog colour, hemisphere fill, a shadow-casting sun, an optional reflection environment, and the camera. */
export const Stage: React.FC<{
  cam: { pos: V3; look: V3; fov?: number; roll?: number };
  sky?: string; skyTop?: string; fog?: [number, number]; envI?: number; sun?: V3; sunColor?: string; sunI?: number; hemi?: [string, string, number]; env?: boolean; shadowR?: number; children: React.ReactNode; exposure?: number;
}> = ({ cam, sky = '#c9cfc8', skyTop, fog = [60, 260], sun = [-40, 50, 30], sunColor = '#fff1d6', sunI = 4.2, hemi = ['#cfd9e6', '#4a4330', 0.55], env = true, envI = 0.3, shadowR = 40, children, exposure = 1.0 }) => (
  <ThreeCanvas width={1080} height={1920} shadows style={{ position: 'absolute', inset: 0 }} gl={{ antialias: true, toneMappingExposure: exposure }}>
    <color attach="background" args={[sky]} />
    <fog attach="fog" args={[sky, fog[0], fog[1]]} />
    <hemisphereLight args={[hemi[0], hemi[1], hemi[2]]} />
    <directionalLight position={sun} intensity={sunI} color={sunColor} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.03}
      shadow-camera-left={-shadowR} shadow-camera-right={shadowR} shadow-camera-top={shadowR} shadow-camera-bottom={-shadowR} shadow-camera-near={1} shadow-camera-far={400} />
    {skyTop && <SkyDome top={skyTop} bottom={sky} />}
    {env && <Env intensity={envI} />}
    <Rig pos={cam.pos} look={cam.look} fov={cam.fov} roll={cam.roll} />
    {children}
  </ThreeCanvas>
);
