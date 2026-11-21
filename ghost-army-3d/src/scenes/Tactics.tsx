import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import { Chips, Loc, Num, Stat, Viewfinder } from '../Overlays';
import { Bulldozer, Field, Gun, Halftrack, Plane, Sherman, Soldier, Truck } from '../three/Models';
import { Stage } from '../three/Stage';
import { Label, h01, mixV, useCanvasTex, V3 } from '../three/util';
import { C, MONO, ease, lin, wf } from '../theme';
import { Spy } from './Unit';

/* 8 · From the air: inflatables set up overnight, bulldozer-cut fake tracks, the recon photo. */
const DUMS: { kind: 'tank' | 'truck' | 'gun'; p: V3; r: number }[] = [
  { kind: 'tank', p: [-8, 0, -4], r: 0.3 }, { kind: 'tank', p: [0, 0, -6], r: 0.25 }, { kind: 'tank', p: [8, 0, -3], r: 0.4 },
  { kind: 'truck', p: [-10, 0, 8], r: -0.2 }, { kind: 'truck', p: [-3, 0, 9], r: -0.1 },
  { kind: 'gun', p: [5, 0, 8], r: 0.1 }, { kind: 'gun', p: [11, 0, 7], r: 0.2 },
];
const TRACK_PATH: [number, number][] = [[-26, 14], [-16, 6], [-8, -4], [-2, -8], [0, -6], [4, -2], [8, -3], [14, -9], [24, -12]];
const Tracks: React.FC<{ p: number }> = ({ p }) => {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4b3d2b', roughness: 1, transparent: true, opacity: 0.85 }), []);
  const segs = useMemo(() => {
    const out: { x: number; z: number; a: number; t: number }[] = []; const c = new THREE.CatmullRomCurve3(TRACK_PATH.map(([x, z]) => new THREE.Vector3(x, 0.05, z)));
    for (let i = 0; i <= 140; i++) { const t = i / 140; const q = c.getPointAt(t); const d = c.getTangentAt(t); out.push({ x: q.x, z: q.z, a: Math.atan2(d.x, d.z), t }); }
    return out;
  }, []);
  return <group>{segs.filter((s) => s.t <= p).map((s, i) => [-1, 1].map((side) => <mesh key={`${i}${side}`} material={mat} position={[s.x + Math.cos(s.a) * side * 1.05, 0.06, s.z - Math.sin(s.a) * side * 1.05]} rotation={[-Math.PI / 2, 0, s.a]} receiveShadow><planeGeometry args={[0.55, 0.42]} /></mesh>))}</group>;
};
export const S08: React.FC = () => {
  const f = useCurrentFrame();
  const inf = { tank: wf(8, 'tanks'), truck: wf(8, 'trucks'), gun: wf(8, 'artillery') };
  const doz = wf(8, 'bulldozer'), recon = wf(8, 'reconnaissance');
  const dp = ease(f, doz - 6, recon - 6);
  const c = useMemo(() => new THREE.CatmullRomCurve3(TRACK_PATH.map(([x, z]) => new THREE.Vector3(x, 0, z))), []);
  const dpos = c.getPointAt(Math.min(0.999, dp)); const dtan = c.getTangentAt(Math.min(0.999, dp));
  const top = ease(f, recon - 30, recon);
  const cam = { pos: mixV(mixV([30, 20, 34], [22, 26, 26], lin(f, 0, 200)), [0.5, 80, 0.6], top), look: mixV([0, 0, 0], [0, 0, 0], top), fov: mixV([38, 0, 0], [30, 0, 0], top)[0] };
  const planeZ = -60 + 140 * lin(f, recon - 70, recon + 20);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: top > 0.6 ? `grayscale(${(top - 0.6) / 0.4}) contrast(${1 + 0.25 * (top - 0.6) / 0.4})` : undefined }}>
        <Stage cam={cam} sky="#d9dccf" skyTop="#88a2bb" sun={[25, 40, -30]} sunColor="#fff2dc" fog={[60, 260]} shadowR={45}>
          <Field roadX={-30} />
          {DUMS.map((d, i) => { const at = inf[d.kind] + (i % 3) * 5; const k = ease(f, at - 8, at + 24); const wob = Math.max(0, 1 - lin(f, at + 10, at + 50)) * 2;
            if (k <= 0) return <mesh key={i} position={[d.p[0], 0.05, d.p[2]]} rotation={[-Math.PI / 2, 0, d.r]}><planeGeometry args={[3, 5.5]} /><meshStandardMaterial color="#4e5233" roughness={0.6} /></mesh>;
            return d.kind === 'tank' ? <Sherman key={i} position={d.p} rotation={[0, d.r, 0]} rubber squash={1 - k} wob={wob} t={f} /> : d.kind === 'truck' ? <Truck key={i} position={d.p} rotation={[0, d.r, 0]} rubber squash={1 - k} /> : <Gun key={i} position={d.p} rotation={[0, d.r, 0]} squash={1 - k} />; })}
          {f >= doz - 6 && <><Tracks p={dp} /><Bulldozer position={[dpos.x, 0, dpos.z]} rotation={[0, Math.atan2(dtan.x, dtan.z), 0]} /></>}
          {[[-14, 2], [13, 2], [-6, 14], [3, -14]].map(([x, z], i) => <Soldier key={i} position={[x, 0, z]} rotation={[0, h01(i, 3) * 6, 0]} />)}
          <Plane position={[4, 34, planeZ]} rotation={[0, 0, 0.05]} scale={1.2} />
        </Stage>
      </AbsoluteFill>
      <Loc text="1 · FROM THE AIR" sub="603RD CAMOUFLAGE ENGINEERS" at={4} out={recon - 30} />
      <Chips y={420} items={[{ t: 'Tanks', at: inf.tank }, { t: 'Trucks', at: inf.truck }, { t: 'Artillery', at: inf.gun }, { t: 'Overnight', at: wf(8, 'overnight') - 4, color: 'rgba(200,53,43,0.85)' }]} />
      <Chips y={540} items={[{ t: 'Fake tank tracks', at: wf(8, 'tracks') - 6, color: 'rgba(200,53,43,0.85)' }]} />
      <Viewfinder o={lin(f, recon - 8, recon)} label="LUFTWAFFE RECON · 1944" />
    </AbsoluteFill>
  );
};

/* 9 · Over the radio: copied traffic of real divisions, down to each operator's Morse style. */
const Waves: React.FC<{ y: number; f: number }> = ({ y, f }) => (
  <group position={[0, y, 0]}>
    {[0, 1, 2, 3].map((i) => { const p = ((f / 40) + i / 4) % 1; return <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} scale={1 + p * 9}><ringGeometry args={[0.9, 1.0, 64]} /><meshBasicMaterial color="#ff6a4a" transparent opacity={(1 - p) * 0.8} side={THREE.DoubleSide} depthWrite={false} /></mesh>; })}
  </group>
);
export const S09: React.FC = () => {
  const f = useCurrentFrame();
  const morse = '-.-. --.- / -.. . / --... ----. - .... / .. -. ..-. / -.. .. ...- / .... --.-';
  const cam = { pos: mixV([-15, 3.0, 20], [-11, 4.0, 15], ease(f, 0, 190)), look: [0, 4.8, 0] as V3, fov: 52 };
  return (
    <AbsoluteFill>
      <Stage cam={cam} sky="#2a3346" skyTop="#0d1220" sun={[20, 12, -30]} sunColor="#ffb07a" sunI={1.6} hemi={['#5a6a8f', '#151510', 0.5]} fog={[30, 120]} shadowR={20}>
        <Field roadX={-30} tint="#8a9aa6" />
        <Truck position={[2.5, 0, 0]} rotation={[0, -0.4, 0]} />
        <mesh position={[0.4, 5, -1.6]} castShadow><cylinderGeometry args={[0.05, 0.07, 10, 8]} /><meshStandardMaterial color="#555" metalness={0.6} /></mesh>
        <Waves y={10} f={f} />
        <mesh position={[-1.4, 0.75, 1.6]} castShadow><boxGeometry args={[1.6, 0.08, 0.9]} /><meshStandardMaterial color="#5b4630" /></mesh>
        <mesh position={[-1.4, 0.98, 1.5]} castShadow><boxGeometry args={[0.7, 0.4, 0.45]} /><meshStandardMaterial color="#3a3d33" metalness={0.3} roughness={0.5} /></mesh>
        <mesh position={[-1.2, 1.0, 1.25]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#ffcc66" emissive="#ffaa33" emissiveIntensity={(Math.floor(f / 3) % 3 === 0 ? 3 : 0.3)} /></mesh>
        <pointLight position={[-1.4, 2, 2]} intensity={6} distance={8} color="#ffcf8a" />
        <Soldier position={[-1.4, 0, 2.5]} rotation={[0, Math.PI, 0]} pose="sit" />
        <Label text="FAKE: DIVISION HQ NET" position={[0.4, 11.4, -1.6]} h={0.9} bg="rgba(200,53,43,0.9)" opacity={lin(f, wf(9, 'traffic') - 6, wf(9, 'traffic'))} />
      </Stage>
      <Loc text="2 · OVER THE RADIO" sub="“SPOOF RADIO”" at={4} />
      <div style={{ position: 'absolute', left: 70, right: 70, top: 1120, fontFamily: MONO, fontSize: 48, letterSpacing: 4, color: C.yellow, textShadow: '0 2px 14px #000', wordBreak: 'break-all' }}>{morse.slice(0, Math.floor(lin(f, 10, 150) * morse.length))}</div>
      <Chips y={1270} items={[{ t: 'Copied real divisions', at: wf(9, 'traffic') - 4 }, { t: "Each operator's style", at: wf(9, 'style') - 6, color: 'rgba(200,53,43,0.85)' }]} />
    </AbsoluteFill>
  );
};

/* 10 · On the ground: sound trucks (15 miles), fake patches, loose talk in cafés. */
const SoundRings: React.FC<{ f: number; on: number }> = ({ f, on }) => (
  <group position={[0, 0.15, 0]}>
    {on > 0 && [0, 1, 2, 3, 4].map((i) => { const p = ((f / 50) + i / 5) % 1; return <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} scale={2 + p * 110}><ringGeometry args={[0.93, 1.0, 96]} /><meshBasicMaterial color="#ffd84a" transparent opacity={(1 - p) * 0.95 * on} depthWrite={false} side={THREE.DoubleSide} /></mesh>; })}
  </group>
);
const Cafe: React.FC = () => {
  const awning = useCanvasTex(512, 256, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#efe6d2' : '#a8231b'; g.fillRect(i * 64, 0, 64, 256); } }, 'awning');
  const sign = useCanvasTex(1024, 256, (g) => { g.fillStyle = '#1d1b19'; g.fillRect(0, 0, 1024, 256); g.fillStyle = '#f2e6c8'; g.font = '800 150px Inter'; g.textAlign = 'center'; g.fillText('CAFÉ DU COIN', 512, 185); }, 'sign');
  const stones = useCanvasTex(512, 512, (g) => { g.fillStyle = '#6b6258'; g.fillRect(0, 0, 512, 512); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { g.fillStyle = `hsl(30,8%,${30 + h01(x * 17 + y, 4) * 14}%)`; g.beginPath(); g.ellipse(x * 32 + 16 + (y % 2) * 16, y * 32 + 16, 14, 13, 0, 0, Math.PI * 2); g.fill(); } }, 'stones');
  useMemo(() => { stones.wrapS = stones.wrapT = THREE.RepeatWrapping; stones.repeat.set(10, 10); }, [stones]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[60, 60]} /><meshStandardMaterial map={stones} roughness={0.9} /></mesh>
      <mesh position={[0, 4, -4]} receiveShadow castShadow><boxGeometry args={[16, 8, 1]} /><meshStandardMaterial color="#cdbb98" roughness={0.95} /></mesh>
      {[-4.5, 0, 4.5].map((x) => <mesh key={x} position={[x, 2.2, -3.45]}><planeGeometry args={[3, 2.6]} /><meshStandardMaterial color="#ffd48a" emissive="#ffb85a" emissiveIntensity={0.9} /></mesh>)}
      <mesh position={[0, 4.2, -2.2]} rotation={[0.45, 0, 0]} castShadow><planeGeometry args={[15, 2.8]} /><meshStandardMaterial map={awning} side={THREE.DoubleSide} roughness={0.9} /></mesh>
      <mesh position={[0, 6.3, -3.45]}><planeGeometry args={[7, 1.75]} /><meshStandardMaterial map={sign} /></mesh>
      {[[-1.3, 1.5], [1.7, 1.8]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.75, 0]} castShadow><cylinderGeometry args={[0.55, 0.55, 0.05, 24]} /><meshStandardMaterial color="#2a2a2a" metalness={0.5} roughness={0.4} /></mesh>
          <mesh position={[0, 0.37, 0]}><cylinderGeometry args={[0.05, 0.05, 0.74, 8]} /><meshStandardMaterial color="#2a2a2a" /></mesh>
          <mesh position={[0.15, 0.85, 0.1]}><cylinderGeometry args={[0.05, 0.04, 0.14, 10]} /><meshStandardMaterial color="#f2efe6" /></mesh>
        </group>
      ))}
      <pointLight position={[0, 3, 0]} intensity={20} distance={14} color="#ffc27a" />
    </group>
  );
};
export const S10: React.FC = () => {
  const f = useCurrentFrame();
  const cafeAt = wf(10, 'soldiers') - 14;
  const inCafe = f >= cafeAt;
  const g = f - cafeAt;
  const camA = { pos: mixV([-10, 2.2, 13], [-30, 30, 42], ease(f, wf(10, 'heard') - 20, wf(10, '15') + 20)), look: mixV([0, 1.8, 0], [0, 0, -12], ease(f, wf(10, 'heard') - 20, wf(10, '15') + 20)), fov: 50 };
  const camB = { pos: mixV([0.8, 2.4, 10.5], [0.1, 2.0, 8.2], ease(g, 0, 140)), look: [0.1, 1.2, 1.2] as V3, fov: 58 };
  return (
    <AbsoluteFill>
      {!inCafe && (
        <Stage cam={camA} sky="#e6b884" skyTop="#4c5f86" sun={[-40, 14, -40]} sunColor="#ffb276" sunI={3.6} hemi={['#9fb0cc', '#3a2e22', 0.6]} fog={[50, 260]} shadowR={30}>
          <Field roadX={-30} />
          <Halftrack position={[0, 0, 0]} rotation={[0, 0.6, 0]} />
          <SoundRings f={f} on={lin(f, wf(10, 'played') - 10, wf(10, 'played'))} />
        </Stage>
      )}
      {inCafe && (
        <Stage cam={camB} sky="#2a2733" skyTop="#141219" sun={[-6, 10, 8]} sunColor="#9db0d8" sunI={0.9} hemi={['#7584a6', '#1a1510', 0.45]} fog={[14, 50]} shadowR={10}>
          <Cafe />
          <Soldier position={[-1.3, 0, 2.2]} rotation={[0, Math.PI - 0.3, 0]} pose="sit" patch />
          <Soldier position={[-1.85, 0, 1.0]} rotation={[0, 0.6, 0]} pose="sit" patch />
          <Spy position={[1.7, 0, 2.5]} rotation={[0, Math.PI + 0.7, 0]} pose="sit" />
          <Label text="FAKE PATCH" position={[-1.3, 2.1, 2.2]} h={0.32} bg="rgba(200,53,43,0.9)" opacity={lin(g, wf(10, 'patches') - cafeAt - 6, wf(10, 'patches') - cafeAt)} />
          <Label text="LISTENING?" position={[1.7, 2.05, 2.5]} h={0.32} bg="rgba(20,20,18,0.9)" opacity={lin(g, wf(10, 'spies') - cafeAt - 6, wf(10, 'spies') - cafeAt)} />
        </Stage>
      )}
      <Loc text="3 · ON THE GROUND" sub="3132ND SIGNAL SERVICE CO." at={4} out={cafeAt - 12} />
      {!inCafe && <Stat value={<Num from={0} to={15} at={wf(10, '15') - 6} dur={16} suffix=" MILES" />} label="sound of tank columns, from loudspeakers" at={wf(10, '15') - 8} y={1040} color={C.yellow} />}
      {inCafe && <Chips y={1230} items={[{ t: 'Fake unit patches', at: wf(10, 'patches') - 4 }, { t: 'Loose talk', at: wf(10, 'talked') - 4 }]} />}
    </AbsoluteFill>
  );
};
