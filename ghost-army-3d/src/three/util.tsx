import React, { useEffect, useMemo, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { continueRender, delayRender, staticFile } from 'remotion';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type V3 = [number, number, number];
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const mixV = (a: V3, b: V3, t: number): V3 => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

/** Deterministic camera: sets position / look-at / fov during render (the canvas renders after this). */
export const Rig: React.FC<{ pos: V3; look: V3; fov?: number; roll?: number }> = ({ pos, look, fov = 40, roll = 0 }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  camera.position.set(...pos);
  camera.up.set(Math.sin(roll), Math.cos(roll), 0);
  camera.lookAt(...look);
  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  camera.near = 0.05; camera.far = 2000; camera.updateProjectionMatrix();
  return null;
};

/** Texture from /public with delayRender so the frame waits for it. */
export const useTex = (src: string) => {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const [h] = useState(() => delayRender(`tex ${src}`));
  useEffect(() => {
    new THREE.TextureLoader().load(staticFile(src), (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; setTex(t); continueRender(h); }, undefined, () => continueRender(h));
  }, [src, h]);
  return tex;
};

/** Waits for the web fonts before canvas textures draw text. */
let fontsReady: Promise<void> | null = null;
export const useFonts = () => {
  const [ok, setOk] = useState(false);
  const [h] = useState(() => delayRender('canvas fonts'));
  useEffect(() => {
    fontsReady ??= Promise.all(['800 64px Inter', '500 40px "Plex Mono"', '700 64px "Courier Prime"'].map((f) => document.fonts.load(f))).then(() => undefined);
    fontsReady.then(() => { setOk(true); continueRender(h); }).catch(() => { setOk(true); continueRender(h); });
  }, [h]);
  return ok;
};

/** Camera-facing text label (canvas texture on a sprite). Height in world units. */
export const Label: React.FC<{ text: string; position: V3; h?: number; color?: string; bg?: string; font?: string; opacity?: number; pad?: number }> = ({
  text, position, h = 1, color = '#ffffff', bg = 'rgba(20,20,18,0.85)', font = '800 96px Inter', opacity = 1, pad = 28,
}) => {
  const ok = useFonts();
  const { tex, aspect } = useMemo(() => {
    const c = document.createElement('canvas'); const g = c.getContext('2d')!;
    g.font = font; const w = Math.ceil(g.measureText(text).width) + pad * 2; const ht = 96 + pad * 1.4;
    c.width = w; c.height = ht; const g2 = c.getContext('2d')!;
    if (bg !== 'none') { g2.fillStyle = bg; g2.fillRect(0, 0, w, ht); }
    g2.font = font; g2.fillStyle = color; g2.textBaseline = 'middle'; g2.fillText(text, pad, ht / 2 + 4);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return { tex: t, aspect: w / ht };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, color, bg, font, ok, pad]);
  if (opacity <= 0) return null;
  return <sprite position={position} scale={[h * aspect, h, 1]} renderOrder={10}><spriteMaterial map={tex} transparent opacity={opacity} depthTest={false} /></sprite>;
};

/** A canvas-drawn texture (for stamps, documents, patches). draw() runs once fonts are ready. */
export const useCanvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, key: string) => {
  const ok = useFonts();
  return useMemo(() => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ok]);
};

/** Deterministic hash + value noise. */
export const h01 = (i: number, seed = 1) => { let a = (i * 374761393 + seed * 668265263) | 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const n2 = (x: number, z: number) => Math.sin(x * 0.11 + 1.3) * Math.cos(z * 0.13) * 0.6 + Math.sin(x * 0.031 - z * 0.027) * 1.4 + Math.sin(x * 0.27 + z * 0.21) * 0.15;

/** Room environment for reflections (gold medal etc.). */
export const Env: React.FC<{ intensity?: number }> = ({ intensity = 0.6 }) => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  }, [gl, scene]);
  (scene as unknown as { environmentIntensity: number }).environmentIntensity = intensity;
  return null;
};
