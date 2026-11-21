import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { CutoutDefs, Person } from './Characters';
import { Cam, Note, Particles, Photo, Stamp } from './kit';
import { Explosion, Fire, Shake, Tracers, Trail, VfxDefs } from './vfx';
import { C, HEAD, SERIF, TYPE, ease, lin, wf } from './theme';

/* "Pacific 1941" variant of the Vox stage: dark navy chart paper, chalk lines, red accents. */
const CHALK = '#eef1f4', RED = '#d23a2c', NAVY = '#13233a', GOLD = '#e8b84a';
export const Chart: React.FC<{ glow?: number }> = ({ glow = 0 }) => (
  <AbsoluteFill style={{ background: NAVY }}>
    <Img src={staticFile('assets/backgrounds/paper.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.22, mixBlendMode: 'luminosity' }} />
    <AbsoluteFill style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(238,241,244,0.07) 0 1px, transparent 1px 90px), repeating-linear-gradient(90deg, rgba(238,241,244,0.07) 0 1px, transparent 1px 90px)' }} />
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      <g transform="translate(900,1620)" opacity={0.18} stroke={CHALK} fill="none" strokeWidth={2}>
        <circle r={130} /><circle r={100} />{Array.from({ length: 16 }, (_, i) => <line key={i} x1={0} y1={0} x2={Math.cos((i * Math.PI) / 8) * 150} y2={Math.sin((i * Math.PI) / 8) * 150} />)}
      </g>
    </svg>
    {glow > 0 && <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 40% at 50% 40%, rgba(232,184,74,${0.18 * glow}), transparent 70%)` }} />}
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 75% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)' }} />
  </AbsoluteFill>
);
const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}><CutoutDefs />{children}</svg>
);
const Head: React.FC<{ at: number; top: string; big: string; y?: number; col?: string }> = ({ at, top, big, y = 110, col = CHALK }) => {
  const f = useCurrentFrame(); const o = lin(f, at, at + 8);
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', opacity: o, transform: `translateY(${(1 - ease(f, at, at + 12)) * 20}px)` }}>
      <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 30, letterSpacing: 8, color: GOLD }}>{top}</div>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 88, lineHeight: 1.05, color: col, textTransform: 'uppercase' }}>{big}</div>
    </div>
  );
};
/** Chalkboard with text that writes on word by word. */
const Board: React.FC<{ text: string; from: number; to: number; x: number; y: number; w: number; h: number; size: number }> = ({ text, from, to, x, y, w, h, size }) => {
  const f = useCurrentFrame(); const words = text.split(' '); const n = Math.ceil(words.length * lin(f, from, to));
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, background: '#1f3a2e', border: '16px solid #6b4a2e', boxShadow: '0 20px 50px rgba(0,0,0,0.7)', padding: 34, boxSizing: 'border-box' }}>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: size, lineHeight: 1.25, color: CHALK }}>
        {words.map((wd, i) => <span key={i} style={{ opacity: i < n ? 1 : 0 }}>{wd} </span>)}
      </div>
    </div>
  );
};
const Plane: React.FC<{ x: number; y: number; s?: number; rot?: number; flip?: boolean }> = ({ x, y, s = 1, rot = 0, flip }) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${flip ? -s : s},${s})`} filter="url(#cutout)">
    <path d="M-60,0 L50,0 Q66,0 66,-6 Q66,-12 50,-12 L-60,-12 Z" fill="#c9cfd6" stroke="#111" strokeWidth={3} />
    <path d="M-6,-6 L-34,-60 L-18,-60 L20,-6 Z M-6,-6 L-34,48 L-18,48 L20,-6 Z" fill="#aab3bd" stroke="#111" strokeWidth={3} />
    <path d="M-60,-6 L-74,-30 L-64,-30 L-48,-6 Z" fill="#aab3bd" stroke="#111" strokeWidth={3} />
  </g>
);
const Factory: React.FC<{ x: number; y: number; s?: number; f: number }> = ({ x, y, s = 1, f }) => (
  <g transform={`translate(${x},${y}) scale(${s})`} filter="url(#cutout)">
    <path d="M0,0 L0,-90 L40,-60 L40,-90 L80,-60 L80,-90 L120,-60 L120,0 Z" fill="#8a5a3c" stroke="#111" strokeWidth={3} />
    <rect x={92} y={-150} width={20} height={70} fill="#5a3d2c" stroke="#111" strokeWidth={3} />
    {[0, 1, 2].map((i) => <circle key={i} cx={102 + ((f * 0.6 + i * 20) % 60) * 0.4} cy={-160 - ((f * 0.6 + i * 20) % 60)} r={10 + ((f * 0.6 + i * 20) % 60) * 0.25} fill="#d5d9de" opacity={0.6 - ((f * 0.6 + i * 20) % 60) / 120} />)}
  </g>
);

/* ---------------- scenes ---------------- */
export const S01: React.FC = () => {
  const f = useCurrentFrame(); const nob = wf(1, 'nobody');
  return (
    <Cam>
      <Chart />
      <Head at={0} top="PEARL HARBOR · 1941" big="The most famous quote" />
      <Board text="“I fear all we have done is to awaken a sleeping giant…”" from={6} to={60} x={90} y={430} w={900} h={420} size={64} />
      <Svg><Person x={830} y={1210} s={0.9} coat="#5a4a3a" hat="none" armR={lin(f, 4, 14, 8, 120)} flip breathe={f / 8} nod={-3} /></Svg>
      <Stamp text="NOT BEFORE 1970" at={nob} x={430} y={1050} size={84} rot={-7} color={RED} />
    </Cam>
  );
};

export const S02: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Cam push={0.04 * ease(f, 0, 160)}>
      <Chart glow={1} />
      <div style={{ position: 'absolute', left: 80, right: 80, top: 260, fontFamily: SERIF, fontWeight: 900, fontSize: 300, color: GOLD, opacity: 0.25, lineHeight: 1 }}>“</div>
      <Board text="“I fear all we have done is to awaken a sleeping giant and fill him with a terrible resolve.”" from={0} to={140} x={60} y={420} w={960} h={620} size={70} />
      <Note text="ATTRIBUTED TO: ADMIRAL YAMAMOTO" at={20} x={60} y={1080} size={30} />
    </Cam>
  );
};

const Battleship: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`} filter="url(#cutout)">
    <path d="M-170,0 L170,0 L150,34 L-150,34 Z" fill="#5d6670" stroke="#111" strokeWidth={3} />
    <rect x={-60} y={-40} width={90} height={40} fill="#6e7781" stroke="#111" strokeWidth={3} />
    <rect x={-20} y={-90} width={14} height={50} fill="#6e7781" stroke="#111" strokeWidth={3} />
    <rect x={40} y={-80} width={10} height={40} fill="#6e7781" stroke="#111" strokeWidth={3} />
    {[-120, 90].map((tx) => <g key={tx}><rect x={tx - 22} y={-18} width={44} height={18} fill="#6e7781" stroke="#111" strokeWidth={3} /><line x1={tx} y1={-10} x2={tx + 46} y2={-14} stroke="#111" strokeWidth={6} /></g>)}
  </g>
);
export const S03: React.FC = () => {
  const f = useCurrentFrame(); const cr = wf(3, 'credited'), pl = wf(3, 'planned'), po = wf(3, 'posters'), doc = wf(3, 'documentaries'), cl = wf(3, 'classrooms');
  const booms = [pl + 2, pl + 26, pl + 52, pl + 80, pl + 110];
  const bx = [190, 470, 300, 620, 120];
  const plane = (k: number): [number, number] => { const t = ((f - pl + k * 40) % 120) / 120; return [1160 - 1300 * t, 560 + 330 * t]; };
  return (
    <Shake hits={booms}>
      <Cam>
        <Chart />
        <Svg>
          <VfxDefs />
          <rect x={0} y={1000} width={1080} height={220} fill="#1d3550" />
          {[[190, 1040, 0.85], [470, 1070, 0.95], [760, 1040, 0.8]].map(([x, y, sc], i) => <Battleship key={i} x={x} y={y} s={sc} />)}
          {f > pl && <><Fire x={190} y={1036} s={0.9} seed={3} /><Fire x={470} y={1066} s={1.1} seed={5} /></>}
          {f > pl && <><Tracers x={760} y={1000} n={5} seed={2} /><Tracers x={900} y={1010} n={4} seed={6} /></>}
          {booms.map((b, i) => <Explosion key={i} at={b} x={bx[i]} y={1020} s={0.9} seed={i + 1} />)}
          {f > pl - 10 && [0, 1, 2].map((k) => { const [x, y] = plane(k); const tr: [number, number][] = Array.from({ length: 10 }, (_, j) => { const t = ((f - j * 2 - pl + k * 40) % 120) / 120; return [1160 - 1300 * t + 40, 560 + 330 * t - 14]; });
            return <g key={k}><Trail pts={tr} /><Plane x={x} y={y} s={0.85} rot={-14} flip /></g>; })}
          <Person x={860} y={1240} s={1.0} coat="#1c2433" head="assets/archival/head_yamamoto.png" armR={lin(f, cr + 6, cr + 14, 8, 150)} armL={10} breathe={f / 8} nod={2 * Math.sin(f / 14)} flip />
        </Svg>
        <Photo src="assets/archival/yamamoto_bust.jpg" at={cr - 4} x={60} y={140} w={380} h={440} rot={-3} pos="50% 15%" caption="Isoroku Yamamoto" credit="photograph · public domain" grade="bw" />
        <Note text="ADMIRAL · COMBINED FLEET" at={cr + 4} x={500} y={160} size={28} />
        <Note text="PLANNED THE PEARL HARBOR ATTACK" at={pl - 2} x={500} y={222} size={22} />
        {[['POSTERS', po], ['DOCUMENTARIES', doc], ['CLASSROOMS', cl]].map(([t, a], i) => <Note key={t as string} text={t as string} at={(a as number) - 2} x={500} y={300 + i * 66} size={30} />)}
        <Particles kind="embers" n={40} o={lin(f, pl, pl + 20)} />
      </Cam>
    </Shake>
  );
};

export const S04: React.FC = () => {
  const f = useCurrentFrame(); const no = wf(4, 'no'), hol = wf(4, 'hollywood'), tora = wf(4, 'tora');
  const beam = lin(f, hol - 4, hol + 8) * (0.85 + 0.15 * Math.sin(f * 1.7) * Math.sin(f * 0.53));
  return (
    <Cam>
      <Chart />
      <Stamp text="NO EVIDENCE" at={no} x={540} y={250} size={110} rot={-6} color={RED} />
      <Svg>
        <polygon points={`210,1010 ${960},${560} ${960},${1000}`} fill={`rgba(255,240,200,${0.18 * beam})`} />
        <g transform="translate(150,1010)" filter="url(#cutout)">
          <rect x={-80} y={-60} width={150} height={100} rx={10} fill="#2a2a2a" stroke="#000" strokeWidth={3} />
          {[-40, 30].map((cx, i) => <g key={i} transform={`translate(${cx},-100) rotate(${f * 6})`}><circle r={46} fill="#3a3a3a" stroke="#000" strokeWidth={3} />{[0, 1, 2, 3, 4].map((k) => <circle key={k} cx={Math.cos(k * 1.256) * 26} cy={Math.sin(k * 1.256) * 26} r={9} fill="#111" />)}</g>)}
          <rect x={70} y={-30} width={30} height={30} fill="#444" stroke="#000" strokeWidth={3} />
        </g>
        <rect x={600} y={540} width={420} height={480} fill="#f4f1ea" stroke="#000" strokeWidth={4} opacity={beam} />
      </Svg>
      <div style={{ position: 'absolute', left: 600, top: 560, width: 420, height: 440, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: lin(f, tora - 4, tora + 4) }}>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 64, color: RED, textAlign: 'center', lineHeight: 1.05 }}>TORA!<br />TORA!<br />TORA!</div>
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 40, color: '#111', marginTop: 16 }}>1970</div>
      </div>
      <Note text="A HOLLYWOOD SCRIPT LINE" at={hol} x={60} y={1120} size={32} />
    </Cam>
  );
};

export const S05: React.FC = () => {
  const f = useCurrentFrame(); const hv = wf(5, 'harvard'), at = wf(5, 'naval'), fac = wf(5, 'factories');
  const walk = ease(f, hv - 10, at + 10);
  return (
    <Cam>
      <Chart />
      <Svg>
        <path d="M120,420 C380,300 700,300 960,420" stroke={CHALK} strokeWidth={4} strokeDasharray="14 12" fill="none" opacity={0.6} />
        <text x={120} y={480} fontFamily={HEAD} fontWeight={700} fontSize={40} fill={CHALK} textAnchor="middle">JAPAN</text>
        <text x={960} y={480} fontFamily={HEAD} fontWeight={700} fontSize={40} fill={CHALK} textAnchor="middle">USA</text>
        <Person x={160 + 640 * walk} y={1000} s={0.9} coat="#1c2433" head="assets/archival/head_yamamoto.png" walk={walk > 0 && walk < 1 ? f / 18 : 0} armR={walk >= 1 ? 40 : 10} breathe={f / 8} />
        {f > fac - 6 && [0, 1, 2, 3].map((i) => <Factory key={i} x={60 + i * 140} y={1180} s={0.95} f={f + i * 10} />)}
        {f > fac + 6 && [0, 1, 2].map((i) => { const px = ((f - fac) * 6 + i * 260) % 1300 - 120; return <g key={i}><Trail pts={Array.from({ length: 10 }, (_, j) => [px - 70 - j * 16, 646 + i * 70 + j * 1.7] as [number, number])} /><Plane x={px} y={640 + i * 70} s={0.9} rot={-6} /></g>; })}
      </Svg>
      <Note text="HARVARD UNIVERSITY · 1919–21" at={hv - 2} x={560} y={150} size={26} />
      <Note text="NAVAL ATTACHÉ · WASHINGTON" at={at - 2} x={560} y={210} size={26} />
      <Note text="HE SAW WHAT AMERICA COULD BUILD" at={fac} x={60} y={1230} size={28} />
    </Cam>
  );
};

const LETTER1 = '“…To make victory certain, we would have to march into Washington and dictate the terms of peace in the White House.';
const LETTER2 = 'I wonder if our politicians have confidence as to the final outcome and are prepared to make the necessary sacrifices.”';
const Letter: React.FC<{ show1: number; show2: number; tear: number; boast?: number; warn?: number }> = ({ show1, show2, tear, boast = 0, warn = 0 }) => {
  const w1 = LETTER1.split(' '), w2 = LETTER2.split(' ');
  return (
    <>
      <div style={{ position: 'absolute', left: 90, top: 260, width: 900, background: '#f2ead6', padding: '44px 50px 30px', boxShadow: '0 24px 60px rgba(0,0,0,0.7)', transform: 'rotate(-1.5deg)' }}>
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 24, color: '#7a6b55', letterSpacing: 3 }}>PRIVATE LETTER · ADMIRAL YAMAMOTO · BEFORE THE WAR</div>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 52, lineHeight: 1.3, color: '#1d1b19', marginTop: 20 }}>
          {w1.map((w, i) => <span key={i} style={{ opacity: i < Math.ceil(w1.length * show1) ? 1 : 0 }}>{w} </span>)}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 90, top: 830 + 1100 * tear * tear, width: 900, background: '#f2ead6', padding: '20px 50px 40px', boxShadow: '0 24px 60px rgba(0,0,0,0.7)', transform: `rotate(${-1.5 + 14 * tear}deg)`, opacity: 1 - tear, clipPath: 'polygon(0 6%, 8% 0, 17% 7%, 26% 1%, 37% 8%, 49% 2%, 60% 7%, 71% 0, 83% 6%, 93% 1%, 100% 5%, 100% 100%, 0 100%)' }}>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 48, lineHeight: 1.3, color: '#8e1b16' }}>
          {w2.map((w, i) => <span key={i} style={{ opacity: i < Math.ceil(w2.length * show2) ? 1 : 0 }}>{w} </span>)}
        </div>
      </div>
      {boast > 0 && <Stamp text="A BOAST?" at={boast} x={330} y={980} size={96} rot={-8} color={RED} />}
      {warn > 0 && <Stamp text="A WARNING" at={warn} x={720} y={1110} size={96} rot={6} color={GOLD} />}
    </>
  );
};
export const S06: React.FC = () => {
  const f = useCurrentFrame(); const pr = wf(6, 'private'), ma = wf(6, 'march');
  return (
    <Cam>
      <Chart />
      <Letter show1={lin(f, ma - 30, ma + 60)} show2={0} tear={0} />
      <Svg><Person x={880} y={1220} s={0.7} coat="#1c2433" head="assets/archival/head_yamamoto.png" prop="pen" armR={60 + 8 * Math.sin(f / 4)} flip breathe={f / 8} nod={8} /></Svg>
      <Note text="WRITTEN TO A NATIONALIST POLITICIAN" at={pr} x={60} y={160} size={26} />
    </Cam>
  );
};
export const S07: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Cam>
      <Chart glow={0.6} />
      <Letter show1={1} show2={lin(f, 0, 100)} tear={0} />
      <Note text="THE LINE THAT MATTERED" at={8} x={60} y={160} size={30} />
    </Cam>
  );
};
export const S08: React.FC = () => {
  const f = useCurrentFrame(); const wi = wf(8, 'without'), bo = wf(8, 'boast'), wa = wf(8, 'warning');
  return (
    <Cam>
      <Chart />
      <Shake hits={[bo, wa, wi]} amp={16}><Letter show1={1} show2={1} tear={ease(f, wi, wi + 30)} boast={bo} warn={wa} /></Shake>
      <Note text="THE LAST LINE WAS DROPPED" at={wi} x={60} y={160} size={30} />
    </Cam>
  );
};
export const S09: React.FC = () => {
  const f = useCurrentFrame(); const pr = wf(9, 'prophet'), vi = wf(9, 'villain'), le = wf(9, 'learn');
  const card = (at: number, x: number, t1: string, t2: string, col: string) => (
    <div style={{ position: 'absolute', left: x, top: 230, width: 470, padding: '26px 28px', background: '#f2ead6', borderTop: `12px solid ${col}`, boxShadow: '0 16px 40px rgba(0,0,0,0.6)', opacity: lin(f, at - 6, at + 4), transform: `translateY(${(1 - ease(f, at - 6, at + 10)) * 40}px)` }}>
      <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 26, color: '#5a4a3a' }}>{t1}</div>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 84, color: col, lineHeight: 1 }}>{t2}</div>
    </div>
  );
  return (
    <Cam>
      <Chart />
      {card(pr, 50, 'THE QUOTE HE NEVER SAID', 'PROPHET', GOLD)}
      {card(vi, 560, 'THE LETTER HE DID WRITE', 'VILLAIN', RED)}
      <Svg><Person x={540} y={1180} s={1.0} coat="#1c2433" head="assets/archival/head_yamamoto.png" armL={20} armR={20} breathe={f / 8} nod={3 * Math.sin(f / 12)} /></Svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 540, textAlign: 'center', opacity: lin(f, le - 6, le + 4) }}>
        <span style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 64, color: CHALK, background: 'rgba(210,58,44,0.9)', padding: '8px 26px' }}>WHICH VERSION DID YOU LEARN?</span>
      </div>
    </Cam>
  );
};

export const SCENE_COMPS = [S01, S02, S03, S04, S05, S06, S07, S08, S09];
export { C };
