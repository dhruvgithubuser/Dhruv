import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from 'remotion';
import { MONO, ease } from '../theme';

/**
 * "Drone" shot from a single still: WebGL depth-parallax. The depth map (Depth Anything V2, white = near)
 * displaces each pixel by its depth, so the foreground slides past the background as the virtual camera
 * dollies and trucks. Pure function of the frame: the draw happens in a layout effect keyed on the frame.
 */
export type Cam = { x: number; y: number; z: number };

const VS = `attribute vec2 p; varying vec2 uv; void main(){ uv = vec2(p.x*0.5+0.5, 0.5-p.y*0.5); gl_Position = vec4(p,0.,1.); }`;
const FS = `precision highp float;
uniform sampler2D img; uniform sampler2D dep; uniform vec2 off; uniform float zoom; uniform float focus; uniform float hasDepth;
varying vec2 uv;
void main(){
  vec2 c = (uv - 0.5) / zoom + 0.5;
  vec2 q = c;
  for (int i = 0; i < 8; i++) { float d = mix(focus, texture2D(dep, q).r, hasDepth); q = c - off * (d - focus); }
  gl_FragColor = texture2D(img, clamp(q, 0.001, 0.999));
}`;

function load(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = rej; im.src = src; });
}

export const DepthShot: React.FC<{ name: string; frames: number; from: Cam; to: Cam; focus?: number; grade?: string; tag?: boolean }> = ({
  name, frames, from, to, focus = 0.35, grade = 'contrast(1.08) saturate(0.9) brightness(0.95)', tag = true,
}) => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const gl = useRef<{ g: WebGLRenderingContext; u: Record<string, WebGLUniformLocation | null>; depth: boolean } | null>(null);
  const [handle] = useState(() => delayRender(`depthshot ${name}`));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const img = await load(staticFile(`stills/${name}.jpg`));
      let dep: HTMLImageElement | null = null;
      try { dep = await load(staticFile(`stills/${name}_depth.png`)); } catch { dep = null; }
      const cv = ref.current!;
      const g = cv.getContext('webgl', { preserveDrawingBuffer: true, antialias: false })!;
      const sh = (t: number, s: string) => { const o = g.createShader(t)!; g.shaderSource(o, s); g.compileShader(o); return o; };
      const pr = g.createProgram()!;
      g.attachShader(pr, sh(g.VERTEX_SHADER, VS)); g.attachShader(pr, sh(g.FRAGMENT_SHADER, FS)); g.linkProgram(pr); g.useProgram(pr);
      const buf = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, buf);
      g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
      const loc = g.getAttribLocation(pr, 'p'); g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
      const tex = (unit: number, im: TexImageSource) => {
        const t = g.createTexture(); g.activeTexture(g.TEXTURE0 + unit); g.bindTexture(g.TEXTURE_2D, t);
        g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, im);
        for (const [k, v] of [[g.TEXTURE_MIN_FILTER, g.LINEAR], [g.TEXTURE_MAG_FILTER, g.LINEAR], [g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE], [g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE]]) g.texParameteri(g.TEXTURE_2D, k, v);
      };
      tex(0, img);
      tex(1, dep ?? img);
      const u = Object.fromEntries(['img', 'dep', 'off', 'zoom', 'focus', 'hasDepth'].map((k) => [k, g.getUniformLocation(pr, k)]));
      g.uniform1i(u.img, 0); g.uniform1i(u.dep, 1);
      gl.current = { g, u, depth: !!dep };
      if (alive) { setReady(true); continueRender(handle); }
    })().catch((e) => { console.error(e); continueRender(handle); });
    return () => { alive = false; };
  }, [handle, name]);

  useLayoutEffect(() => {
    const s = gl.current;
    if (!ready || !s) return;
    const p = ease(f, 0, frames);
    const x = from.x + (to.x - from.x) * p, y = from.y + (to.y - from.y) * p;
    const z = from.z * Math.pow(to.z / from.z, p);
    const { g, u } = s;
    g.viewport(0, 0, 1920, 1080);
    g.uniform2f(u.off, x * 0.06, y * 0.06);
    g.uniform1f(u.zoom, z);
    g.uniform1f(u.focus, focus);
    g.uniform1f(u.hasDepth, s.depth ? 1 : 0);
    g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
  }, [f, ready, frames, from, to, focus]);

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <canvas ref={ref} width={1920} height={1080} style={{ width: '100%', height: '100%', filter: grade }} />
      {tag && <div style={{ position: 'absolute', left: 60, bottom: 150, fontFamily: MONO, fontSize: 18, letterSpacing: 3, color: 'rgba(255,255,255,0.55)' }}>DRAMATIZATION · AI-GENERATED IMAGE</div>}
    </AbsoluteFill>
  );
};
