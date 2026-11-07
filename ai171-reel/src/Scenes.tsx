import React from 'react';
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { DepthShot } from './components/DepthShot';
import { BigNumber, DataCard, FuelSwitches, ReportedSpeech, RouteGlobe, SeatMap, Timeline32 } from './components/Graphics';
import { Marker, SatMap, project } from './components/SatMap';
import { Dust, Glitch, LightLeak, Shake } from './components/Vfx';
import { WideInVertical } from './components/WideInVertical';
import geo from './geo.json';
import { C, MONO, SANS, SCENES, ease, lin, pf, wf } from './theme';

const NE = geo.rwy23_threshold, SW = geo.rwy23_end, CRASH = geo.crash;
const at = (a: number[], b: number[], t: number) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const LIFTOFF = at(NE, SW, 0.82);
const PATH = Array.from({ length: 41 }, (_, i) => {
  const t = i / 40, c = at(SW, CRASH, 0.15), k = [c[0] + 0.0025, c[1] - 0.0012];
  return [(1 - t) ** 2 * LIFTOFF[0] + 2 * (1 - t) * t * k[0] + t * t * CRASH[0], (1 - t) ** 2 * LIFTOFF[1] + 2 * (1 - t) * t * k[1] + t * t * CRASH[1]];
});
const D = (n: number) => SCENES[n - 1].frames;

const Fade: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: dur ? lin(f, 0, dur) : 1 }}>{children}</AbsoluteFill>;
};
const Shots: React.FC<{ shots: [number, React.ReactNode][]; end: number }> = ({ shots, end }) => (
  <>{shots.map(([s, node], i) => (
    <Sequence key={i} from={s} durationInFrames={Math.max(1, (i < shots.length - 1 ? shots[i + 1][0] + 10 : end) - s)} layout="absolute-fill">
      <Fade dur={i ? 10 : 0}>{node}</Fade>
    </Sequence>
  ))}</>
);
const Headline: React.FC<{ lines: string[]; at: number; out: number; top?: number; color?: string }> = ({ lines, at: a, out, top = 300, color = C.ink }) => {
  const f = useCurrentFrame();
  const o = lin(f, a, a + 10) * (1 - lin(f, out - 10, out));
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top, textAlign: 'center', opacity: o }}>
      {lines.map((l, i) => (
        <div key={i} style={{ fontFamily: i ? MONO : SANS, fontWeight: i ? 500 : 800, fontSize: i ? 32 : 76, letterSpacing: i ? 5 : 3, color: i ? C.amber : color, textTransform: 'uppercase', textShadow: '0 4px 24px rgba(0,0,0,0.85)', transform: `translateY(${(1 - ease(f, a + i * 5, a + i * 5 + 15)) * 20}px)`, marginTop: i ? 14 : 0 }}>{l}</div>
      ))}
    </div>
  );
};
const TimelineT: React.FC<{ T: number; events: { t: number; label: string; at: number; color?: string }[] }> = ({ T, events }) => {
  const f = useCurrentFrame();
  return <Timeline32 events={events} clockAt={[f - T * 100, f - T * 100 + 3200]} />;
};

// 1 — hook: "32 seconds", satellite dive onto the airport
export const R01: React.FC = () => {
  const f = useCurrentFrame();
  const d = D(1);
  const n = Math.round(interpolate(f, [0, 24], [0, 32], { extrapolateRight: 'clamp' }));
  return (
    <Shake at={0} amp={14}>
      <SatMap keys={[{ f: 0, lat: 23.2, lon: 72.7, z: 9.5 }, { f: d + 10, lat: 23.074, lon: 72.632, z: 13.6, rot: -3 }]}>
        {(cam) => { const [x, y] = project(cam, geo.amd[0], geo.amd[1]); return <Marker x={x} y={y} label="AHMEDABAD AIRPORT" sub="AMD · 12 JUNE 2025" color={C.amber} o={lin(f, 60, 75)} dx={-60} dy={-120} />; }}
      </SatMap>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center' }}>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 300, lineHeight: 1, color: '#fff', textShadow: '0 0 60px rgba(232,65,44,0.6), 0 8px 30px #000' }}>{n}</div>
        <div style={{ fontFamily: SANS, fontWeight: 300, fontSize: 64, letterSpacing: 26, color: '#fff', marginTop: 4, opacity: lin(f, 12, 24), textShadow: '0 4px 20px #000' }}>SECONDS</div>
        <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: C.accent, marginTop: 24, opacity: lin(f, 28, 40) }}>AIR INDIA FLIGHT AI171</div>
      </div>
    </Shake>
  );
};

// 2 — date + place over the painted city
export const R02: React.FC = () => (
  <AbsoluteFill>
    <DepthShot name="city" frames={D(2)} from={{ x: -0.5, y: 0.3, z: 1.04 }} to={{ x: 0.5, y: -0.2, z: 1.16 }} />
    <LightLeak o={0.4} />
    <Headline lines={['12 June 2025', 'Ahmedabad · Gujarat · India']} at={8} out={D(2) + 10} top={420} />
    <Dust n={50} seed={2} />
  </AbsoluteFill>
);

// 3 — boarding, then the route to London
export const R03: React.FC = () => {
  const f = useCurrentFrame();
  const d = D(3);
  const g = wf(3, 'bound');
  return (
    <Shots end={d} shots={[
      [0, (
        <AbsoluteFill>
          <DepthShot name="boarding" frames={g + 15} from={{ x: 0, y: 0.3, z: 1.03 }} to={{ x: 0.1, y: -0.2, z: 1.2 }} />
          <DataCard title="FLIGHT AI171 · ON BOARD" rows={[['Passengers', '230'], ['Crew', '12']]} at={10} out={g + 15} side="left" top={360} width={560} />
          <Dust n={40} seed={3} />
        </AbsoluteFill>
      )],
      [g - 5, (
        <AbsoluteFill style={{ background: '#03060a' }}>
          <RouteGlobe from={geo.amd} to={geo.lgw} draw={ease(f - g, 5, d - g - 10)} lon0={45 - 10 * ease(f - g, 0, d - g)} lat0={40} />
          <Headline lines={['AMD → LGW', 'Ahmedabad to London Gatwick']} at={8} out={d - g + 10} top={1220} />
        </AbsoluteFill>
      )],
    ]} />
  );
};

// 4 — the aircraft (painted from the real VT-ANB photograph)
export const R04: React.FC = () => (
  <AbsoluteFill>
    <WideInVertical file="vtanb_painted.jpg" frames={D(4)} y={520} credit="PAINTED FROM A PHOTO OF VT-ANB BY RYANZ225 PC (ZHANGERAVIATION) · CC BY-SA 4.0" />
    <DataCard title="THE AIRCRAFT" rows={[['Type', 'Boeing 787-8'], ['Registration', 'VT-ANB'], ['With Air India since', '2014']]} at={8} out={D(4) + 10} side="left" top={1300} width={620} />
    <LightLeak o={0.3} seed={4} />
  </AbsoluteFill>
);

// 5 — runway 23, lift-off
export const R05: React.FC = () => {
  const f = useCurrentFrame();
  const d = D(5);
  const lift = wf(5, 'lifted');
  return (
    <Shots end={d} shots={[
      [0, <DepthShot name="runway" frames={60} from={{ x: 0, y: 0, z: 1.02 }} to={{ x: 0, y: -0.3, z: 1.2 }} />],
      [45, (
        <AbsoluteFill>
          <SatMap keys={[{ f: 0, lat: 23.079, lon: 72.634, z: 14.0, rot: -40 }, { f: d - 45, lat: 23.072, lon: 72.627, z: 14.6, rot: -40 }]}>
            {(cam) => {
              const a = project(cam, NE[0], NE[1]), b = project(cam, SW[0], SW[1]);
              const pos = at(NE, LIFTOFF, ease(f - 45, 0, Math.max(10, lift - 45)));
              const pp = project(cam, pos[0], pos[1]), lp = project(cam, LIFTOFF[0], LIFTOFF[1]);
              return (
                <g>
                  <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={C.cyan} strokeWidth={16} opacity={0.35} />
                  <line x1={a[0]} y1={a[1]} x2={pp[0]} y2={pp[1]} stroke={C.amber} strokeWidth={7} />
                  <circle cx={pp[0]} cy={pp[1]} r={14} fill="#fff" stroke={C.amber} strokeWidth={5} />
                  <Marker x={lp[0]} y={lp[1]} label="LIFT-OFF" sub="13:38:39 IST" color={C.amber} dx={-80} dy={-140} o={lin(f, lift, lift + 10)} />
                </g>
              );
            }}
          </SatMap>
          <Headline lines={['Runway 23', 'Full-length takeoff']} at={5} out={d} top={280} />
        </AbsoluteFill>
      )],
    ]} />
  );
};

// 6 — RUN → CUTOFF
export const R06: React.FC = () => {
  const f = useCurrentFrame();
  const d = D(6);
  const cut = wf(6, 'cutoff');
  const T = interpolate(f, [0, cut, d], [3, 3.5, 6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <Glitch at={cut} dur={12}>
      <Shake at={cut} amp={16}>
        <DepthShot name="cockpit" frames={d} from={{ x: -0.2, y: 0, z: 1.1 }} to={{ x: 0.2, y: 0.1, z: 1.25 }} grade="contrast(1.1) saturate(0.5) brightness(0.4)" tag={false} />
        <FuelSwitches cut={[cut, cut + 30]} back={[99999, 99999]} at={10} />
        <TimelineT T={T} events={[{ t: 3, label: 'FUEL SWITCHES → CUTOFF', at: cut, color: C.accent }]} />
        <AbsoluteFill style={{ background: `rgba(232,65,44,${0.18 * Math.max(0, Math.sin((f - cut) / 6)) * (f > cut ? 1 : 0)})`, mixBlendMode: 'screen' }} />
      </Shake>
    </Glitch>
  );
};

// 7 — the cockpit recording (reported speech)
export const R07: React.FC = () => {
  const d = D(7);
  return (
    <AbsoluteFill>
      <DepthShot name="cockpit" frames={d} from={{ x: 0.2, y: 0.1, z: 1.25 }} to={{ x: -0.1, y: 0, z: 1.35 }} grade="contrast(1.1) saturate(0.3) brightness(0.25) blur(3px)" tag={false} />
      <ReportedSpeech lines={['One pilot asks the other why he cut off the fuel.', 'The other replies that he did not.']} source="COCKPIT RECORDING · AS REPORTED BY THE AAIB · 12 JULY 2025" at={5} out={d + 10} />
    </AbsoluteFill>
  );
};

// 8 — back to RUN, relight, mayday
export const R08: React.FC = () => {
  const f = useCurrentFrame();
  const d = D(8);
  const may = wf(8, 'mayday');
  const T = interpolate(f, [0, wf(8, 'relight'), may, d], [13, 17, 26, 26.5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <Shake at={may} amp={20}>
      <DepthShot name="tower" frames={d} from={{ x: 0.3, y: 0, z: 1.04 }} to={{ x: -0.3, y: 0.1, z: 1.18 }} grade="contrast(1.1) saturate(0.7) brightness(0.55)" />
      <AbsoluteFill style={{ opacity: 1 - lin(f, may - 10, may) }}>
        <FuelSwitches cut={[-60, -60]} back={[10, 30]} at={-30} />
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: lin(f, may - 2, may + 4) }}>
        <div style={{ fontFamily: MONO, fontSize: 130, letterSpacing: 18, color: C.accent, textShadow: '0 0 50px rgba(232,65,44,0.7)', marginTop: -300 }}>MAYDAY</div>
        <div style={{ fontFamily: MONO, fontSize: 34, letterSpacing: 6, color: '#fff' }}>LOSS OF THRUST · T+26 s</div>
      </AbsoluteFill>
      <TimelineT T={T} events={[{ t: 3, label: 'CUTOFF', at: -50, color: C.accent }, { t: 13, label: 'ENG 1 → RUN', at: 0, color: '#9fe0a0' }, { t: 17, label: 'ENG 2 → RUN', at: 10, color: '#9fe0a0' }, { t: 26, label: 'MAYDAY', at: may, color: C.accent }]} />
    </Shake>
  );
};

// 9 — the last seconds on the map
export const R09: React.FC = () => {
  const f = useCurrentFrame();
  const d = D(9);
  const hit = wf(9, 'down');
  const prog = ease(f, 0, hit, 0.4, 1);
  return (
    <AbsoluteFill>
      <SatMap keys={[{ f: 0, lat: 23.065, lon: 72.622, z: 14.4, rot: -30 }, { f: d, lat: 23.057, lon: 72.614, z: 15.0, rot: -30 }]}>
        {(cam) => {
          const pts = PATH.map((p) => project(cam, p[0], p[1]));
          const n = Math.max(2, Math.round(prog * (pts.length - 1)) + 1);
          const e = project(cam, SW[0], SW[1]), c = project(cam, CRASH[0], CRASH[1]);
          const k = ease(f, hit + 20, hit + 60);
          return (
            <g>
              <path d={pts.slice(0, n).map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join('')} fill="none" stroke={C.accent} strokeWidth={7} strokeDasharray="16 10" />
              <circle cx={pts[n - 1][0]} cy={pts[n - 1][1]} r={14} fill="#fff" stroke={C.accent} strokeWidth={5} />
              {k > 0 && <line x1={e[0]} y1={e[1]} x2={e[0] + (c[0] - e[0]) * k} y2={e[1] + (c[1] - e[1]) * k} stroke="#fff" strokeWidth={4} strokeDasharray="10 10" />}
              {k > 0.95 && <text x={(e[0] + c[0]) / 2 + 30} y={(e[1] + c[1]) / 2} fontFamily={MONO} fontSize={44} fill={C.amber} style={{ paintOrder: 'stroke', stroke: '#000', strokeWidth: 6 }}>1.7 km</text>}
              <Marker x={c[0]} y={c[1]} label="MEDICAL COLLEGE HOSTEL" sub="MEGHANI NAGAR" o={lin(f, hit, hit + 12)} dx={-40} dy={170} />
            </g>
          );
        }}
      </SatMap>
      <Headline lines={['13:39:11 IST', 'Recordings end · T+32 s']} at={hit - 5} out={d + 10} top={280} />
      <div style={{ position: 'absolute', left: 40, top: 230, fontFamily: MONO, fontSize: 20, color: 'rgba(255,255,255,0.6)', letterSpacing: 2 }}>PATH ILLUSTRATIVE · SENTINEL-2 / EOX</div>
    </AbsoluteFill>
  );
};

// 10 — the toll and the survivor
export const R10: React.FC = () => {
  const d = D(10);
  const one = wf(10, 'one');
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 35%, #1a0b08 0%, #050505 70%)' }}>
      <BigNumber value={241} label="killed on board" at={wf(10, '241') - 6} x={360} y={330} color={C.accent} />
      <BigNumber value={19} label="killed on the ground" at={wf(10, '19') - 6} x={360} y={600} />
      <SeatMap at={one - 6} out={d + 10} />
      <Dust n={30} seed={10} color="255,200,180" o={0.4} />
    </AbsoluteFill>
  );
};

// 11 — the investigation
export const R11: React.FC = () => {
  const d = D(11);
  return (
    <AbsoluteFill>
      <DepthShot name="lab" frames={d} from={{ x: -0.3, y: 0.1, z: 1.04 }} to={{ x: 0.3, y: -0.1, z: 1.18 }} grade="contrast(1.08) saturate(0.85) brightness(0.75)" />
      <DataCard title="PRELIMINARY REPORT · 12 JULY 2025" rows={[['Fuel switches', 'RUN → CUTOFF'], ['Mechanical fault', 'none found'], ['Why they moved', 'not stated']]} at={8} out={d + 10} side="left" top={330} width={760} />
      <Dust n={40} seed={11} />
    </AbsoluteFill>
  );
};

// 12 — memorial + sign-off
export const R12: React.FC = () => {
  const f = useCurrentFrame();
  const d = D(12);
  const end = pf(12, 0, 'end');
  return (
    <AbsoluteFill>
      <DepthShot name="vigil" frames={d} from={{ x: 0, y: 0.2, z: 1.03 }} to={{ x: 0, y: -0.1, z: 1.18 }} grade="contrast(1.05) saturate(0.9) brightness(0.7)" />
      <LightLeak o={0.25} seed={12} />
      <Headline lines={['260 lives', '32 seconds']} at={8} out={d + 10} top={330} />
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1500, textAlign: 'center', opacity: lin(f, end - 20, end), fontFamily: MONO, fontSize: 20, lineHeight: 1.7, letterSpacing: 1, color: 'rgba(255,255,255,0.7)' }}>
        SOURCES: AAIB INDIA PRELIMINARY REPORT (12 JULY 2025) · WIKIPEDIA: AIR INDIA FLIGHT 171<br />
        MAPS: SENTINEL-2 CLOUDLESS 2016, EOX, CC BY 4.0 · ILLUSTRATIONS AI-GENERATED · AI NARRATION
      </div>
      <AbsoluteFill style={{ background: '#000', opacity: lin(f, d - 15, d) }} />
    </AbsoluteFill>
  );
};

export const REEL_SCENES = [R01, R02, R03, R04, R05, R06, R07, R08, R09, R10, R11, R12];
export { Img, staticFile };
