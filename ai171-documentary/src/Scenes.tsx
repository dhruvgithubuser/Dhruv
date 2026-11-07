import React from 'react';
import { AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame } from 'remotion';
import { DepthShot } from './components/DepthShot';
import { BigNumber, ChapterCard, DataCard, FuelSwitches, ReportedSpeech, RouteGlobe, SeatMap, Super, Timeline32 } from './components/Graphics';
import { Marker, SatMap, project } from './components/SatMap';
import geo from './geo.json';
import { C, MONO, SANS, SCENES, ease, lin, pf, sec, wf } from './theme';

const NE = geo.rwy23_threshold, SW = geo.rwy23_end, CRASH = geo.crash;
const at = (a: number[], b: number[], t: number) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const LIFTOFF = at(NE, SW, 0.82); // illustrative: late in a full-length roll
// illustrative flight path: over the remaining runway, then a shallow left-hand descent to the impact site
const PATH = Array.from({ length: 41 }, (_, i) => {
  const t = i / 40;
  const c = at(SW, CRASH, 0.15);
  const ctrl = [c[0] + 0.0025, c[1] - 0.0012];
  const a = LIFTOFF, b = CRASH;
  return [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * ctrl[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * ctrl[1] + t * t * b[1]];
});
const D = (n: number) => SCENES[n - 1].frames;

/** Shots inside a scene with short dissolves: [startFrame, node][] */
const Shots: React.FC<{ shots: [number, React.ReactNode][]; end: number; xf?: number }> = ({ shots, end, xf = 12 }) => (
  <>
    {shots.map(([s, node], i) => {
      const e = i < shots.length - 1 ? shots[i + 1][0] + xf : end;
      return (
        <Sequence key={i} from={s} durationInFrames={Math.max(1, e - s)} layout="absolute-fill">
          <Fade dur={i ? xf : 0}>{node}</Fade>
        </Sequence>
      );
    })}
  </>
);
const Fade: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: dur ? lin(f, 0, dur) : 1 }}>{children}</AbsoluteFill>;
};

// ---------------------------------------------------------------- 1 cold open: from orbit to Ahmedabad
export const S01: React.FC = () => {
  const d = D(1);
  return (
    <AbsoluteFill>
      <SatMap keys={[{ f: 0, lat: 21.5, lon: 78.5, z: 4.3 }, { f: Math.round(d * 0.45), lat: 23.0, lon: 72.9, z: 8.2 }, { f: d + 15, lat: 23.068, lon: 72.628, z: 12.6 }]}>
        {(cam) => {
          const [x, y] = project(cam, geo.amd[0], geo.amd[1]);
          return <Marker x={x} y={y} label="AHMEDABAD AIRPORT · AMD" color={C.amber} o={lin(cam.z, 7.5, 8.5)} dx={70} dy={-70} />;
        }}
      </SatMap>
      <Super lines={['12 June 2025', 'Ahmedabad · Gujarat · India']} at={pf(1, 0) - 10} out={pf(1, 1) + 20} />
      <DataCard title="CONDITIONS · 13:38 IST" rows={[['Visibility', '6 km'], ['Surface wind', '6 kt'], ['Cloud', 'none significant']]} at={pf(1, 1)} out={d + 10} side="right" top={600} width={520} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 2 the airport, the flight
export const S02: React.FC = () => {
  const d = D(2);
  const p2 = pf(2, 1);
  return (
    <Shots end={d} shots={[
      [0, <DepthShot name="city_aerial" frames={170} from={{ x: -0.6, y: 0.2, z: 1.05 }} to={{ x: 0.6, y: -0.1, z: 1.12 }} />],
      [150, <DepthShot name="terminal" frames={200} from={{ x: 0.5, y: 0, z: 1.02 }} to={{ x: -0.4, y: 0.1, z: 1.14 }} />],
      [330, <DepthShot name="gate" frames={Math.max(60, p2 - 330)} from={{ x: -0.3, y: 0, z: 1.03 }} to={{ x: 0.3, y: 0, z: 1.1 }} />],
      [p2 - 15, <DepthShot name="jet_runway" frames={d - p2 + 15} from={{ x: 0, y: 0.1, z: 1.0 }} to={{ x: -0.2, y: -0.1, z: 1.18 }} />],
    ]} />
  );
};

// ---------------------------------------------------------------- 3 title
export const S03: React.FC = () => {
  const f = useCurrentFrame();
  const d = D(3);
  const o = lin(f, 6, 30) * (1 - lin(f, d - 8, d));
  return (
    <AbsoluteFill style={{ background: '#000', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ opacity: o, textAlign: 'center' }}>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 210, letterSpacing: 40 + 30 * ease(f, 0, d), color: C.ink, marginRight: -40 }}>AI171</div>
        <div style={{ height: 2, width: 700 * ease(f, 10, 50), background: C.accent, margin: '10px auto 26px' }} />
        <div style={{ fontFamily: SANS, fontWeight: 300, fontSize: 44, letterSpacing: 26, color: C.ink, opacity: lin(f, 30, 55) }}>THIRTY-TWO SECONDS</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 4 the flight: route + aircraft
export const S04: React.FC = () => {
  const f = useCurrentFrame();
  const d = D(4);
  return (
    <AbsoluteFill style={{ background: '#03060a' }}>
      <RouteGlobe from={geo.amd} to={geo.lgw} draw={ease(f, 50, d - 40)} lon0={40 - 8 * ease(f, 0, d)} lat0={42} />
      <DataCard title="FLIGHT AI171 · 12 JUNE 2025" rows={[['Route', 'AMD → LGW'], ['Aircraft', 'Boeing 787-8'], ['Registration', 'VT-ANB'], ['With Air India since', '2014'], ['Passengers', '230'], ['Crew', '12']]} at={pf(4, 0)} out={d + 10} side="right" top={170} width={600} />
      <ChapterCard num="I" title="The Flight" at={0} out={70} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 5 the crew
export const S05: React.FC = () => {
  const d = D(5);
  return (
    <AbsoluteFill>
      <DepthShot name="cockpit" frames={d} from={{ x: 0.4, y: 0, z: 1.02 }} to={{ x: -0.3, y: 0.1, z: 1.15 }} />
      <DataCard title="FLIGHT CREW · AAIB" rows={[['Captain · total hours', '≈ 15,600'], ['   of which on the 787', '≈ 8,600'], ['First officer · total', '≈ 3,400'], ['   of which on the 787', '≈ 1,100'], ['Pilot flying', 'First officer']]} at={wf(5, 'captain') - 10} out={d + 10} side="left" top={200} width={640} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 6 runway 23, the takeoff roll
const Runway: React.FC<{ cam: { lat: number; lon: number; z: number }; roll: number; showLift: number }> = ({ cam, roll, showLift }) => {
  const a = project(cam, NE[0], NE[1]), b = project(cam, SW[0], SW[1]);
  const pos = at(NE, LIFTOFF, roll);
  const pp = project(cam, pos[0], pos[1]);
  const lp = project(cam, LIFTOFF[0], LIFTOFF[1]);
  return (
    <g>
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={C.cyan} strokeWidth={14} opacity={0.35} />
      <line x1={a[0]} y1={a[1]} x2={pp[0]} y2={pp[1]} stroke={C.amber} strokeWidth={6} />
      <text x={a[0] + 24} y={a[1] - 10} fontFamily={MONO} fontSize={26} fill="#fff" style={{ paintOrder: 'stroke', stroke: '#000', strokeWidth: 5 }}>RWY 23 ▸</text>
      <circle cx={pp[0]} cy={pp[1]} r={12} fill="#fff" stroke={C.amber} strokeWidth={4} />
      {showLift > 0 && <Marker x={lp[0]} y={lp[1]} label="LIFT-OFF" sub="13:38:39 IST" color={C.amber} dx={-90} dy={-80} o={showLift} />}
    </g>
  );
};
export const S06: React.FC = () => {
  const f = useCurrentFrame();
  const d = D(6);
  const p2 = pf(6, 1);
  const lift = wf(6, 'left');
  return (
    <Shots end={d} shots={[
      [0, <DepthShot name="runway_low" frames={p2 + 15} from={{ x: 0, y: 0, z: 1.0 }} to={{ x: 0.1, y: -0.2, z: 1.25 }} />],
      [p2, (
        <AbsoluteFill>
          <SatMap keys={[{ f: 0, lat: 23.0785, lon: 72.634, z: 13.4, rot: -2 }, { f: d - p2, lat: 23.072, lon: 72.628, z: 14.3, rot: 2 }]}>
            {(cam) => <Runway cam={cam} roll={ease(f - p2, 30, lift - p2, 0, 1)} showLift={lin(f, lift - 4, lift + 8)} />}
          </SatMap>
          <Super lines={['Runway 23', 'Full-length takeoff · 62-second roll']} at={10} out={d - p2} x={120} y={780} />
        </AbsoluteFill>
      )],
    ]} />
  );
};

// ---------------------------------------------------------------- 7 the thirty-two seconds
export const S07: React.FC = () => {
  const f = useCurrentFrame();
  const d = D(7);
  const cut = wf(7, 'cutoff');
  const run1 = wf(7, 'run', 1), run2 = wf(7, 'second', 1);
  const cvr = pf(7, 3), cvrEnd = pf(7, 3, 'end');
  const T = interpolate(f, [pf(7, 0), cut, pf(7, 2), pf(7, 4), d], [3, 3.5, 8, 13, 17], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const switchesOut = f > cvr - 10 && f < cvrEnd + 10 ? 0 : 1;
  return (
    <AbsoluteFill>
      <DepthShot name="cockpit" frames={d} from={{ x: -0.2, y: 0.1, z: 1.15 }} to={{ x: 0.2, y: 0, z: 1.3 }} grade="contrast(1.15) saturate(0.4) brightness(0.35) blur(2px)" tag={false} />
      <AbsoluteFill style={{ opacity: switchesOut, transition: 'none' }}>
        <FuelSwitches cut={[cut, cut + 30]} back={[run1, run2]} at={cut - 40} />
      </AbsoluteFill>
      <ReportedSpeech lines={['One pilot asks the other why he cut off the fuel.', 'The other replies that he did not.']} source="COCKPIT VOICE RECORDING · AS REPORTED BY THE AAIB · 12 JULY 2025" at={cvr - 5} out={cvrEnd + 10} />
      <TimelineT T={T} events={[
        { t: 3, label: 'FUEL SWITCHES → CUTOFF', at: cut, color: C.accent },
        { t: 8, label: 'RAM AIR TURBINE DEPLOYS', at: wf(7, 'ram') },
        { t: 13, label: 'ENG 1 → RUN', at: run1, color: '#9fe0a0' },
        { t: 17, label: 'ENG 2 → RUN', at: run2, color: '#9fe0a0' },
      ]} />
      <ChapterCard num="II" title="Thirty-Two Seconds" at={0} out={70} />
    </AbsoluteFill>
  );
};
const TimelineT: React.FC<{ T: number; events: { t: number; label: string; at: number; color?: string }[] }> = ({ T, events }) => {
  // Timeline32 drives its clock from frame anchors; feed it a synthetic pair so T is exact
  const f = useCurrentFrame();
  return <Timeline32 events={events} clockAt={[f - T * 100, f - T * 100 + 3200]} />;
};

// ---------------------------------------------------------------- 8 mayday
export const S08: React.FC = () => {
  const f = useCurrentFrame();
  const d = D(8);
  const m = wf(8, 'mayday');
  const T = interpolate(f, [0, m, d], [17, 26, 26.5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <DepthShot name="tower" frames={d} from={{ x: 0.3, y: 0, z: 1.04 }} to={{ x: -0.3, y: 0.05, z: 1.16 }} grade="contrast(1.1) saturate(0.8) brightness(0.7)" />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: lin(f, m - 3, m + 6) * (1 - lin(f, wf(8, 'controller') - 5, wf(8, 'controller') + 10)) }}>
        <div style={{ fontFamily: MONO, fontSize: 110, letterSpacing: 30, color: C.accent, textShadow: '0 0 40px rgba(232,65,44,0.6)' }}>MAYDAY</div>
        <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 8, color: C.ink, marginTop: 10 }}>LOSS OF THRUST · T+26 s</div>
      </AbsoluteFill>
      <Super lines={['No reply', 'ATC requested the call sign']} at={wf(8, 'no') - 5} out={d + 5} x={120} y={760} />
      <TimelineT T={T} events={[{ t: 3, label: 'CUTOFF', at: -100, color: C.accent }, { t: 17, label: 'BOTH → RUN', at: -100, color: '#9fe0a0' }, { t: 26, label: 'MAYDAY', at: m, color: C.accent }]} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 9 the last seconds on the map
export const S09: React.FC = () => {
  const f = useCurrentFrame();
  const d = D(9);
  const stop = wf(9, 'stopped');
  const prog = ease(f, 0, stop - 10, 0.55, 1);
  const black = lin(f, stop + 4, stop + 10);
  return (
    <AbsoluteFill>
      <SatMap keys={[{ f: 0, lat: 23.067, lon: 72.624, z: 14.1, rot: 2 }, { f: stop, lat: 23.060, lon: 72.617, z: 14.6, rot: 4 }]}>
        {(cam) => {
          const pts = PATH.map((p) => project(cam, p[0], p[1]));
          const n = Math.max(2, Math.round(prog * (pts.length - 1)) + 1);
          const head = pts[n - 1];
          return (
            <g>
              <path d={pts.slice(0, n).map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join('')} fill="none" stroke={C.accent} strokeWidth={5} strokeDasharray="14 9" />
              <circle cx={head[0]} cy={head[1]} r={11} fill="#fff" stroke={C.accent} strokeWidth={4} />
            </g>
          );
        }}
      </SatMap>
      <div style={{ position: 'absolute', left: 120, bottom: 170, fontFamily: MONO, fontSize: 18, letterSpacing: 2, color: 'rgba(255,255,255,0.5)' }}>FLIGHT PATH ILLUSTRATIVE · SATELLITE: SENTINEL-2 CLOUDLESS 2016 (EOX)</div>
      <AbsoluteFill style={{ background: '#000', opacity: black, justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ opacity: lin(f, stop + 12, stop + 30), textAlign: 'center' }}>
          <div style={{ fontFamily: MONO, fontSize: 96, color: C.ink, letterSpacing: 6 }}>13:39:11</div>
          <div style={{ fontFamily: MONO, fontSize: 30, color: C.accent, letterSpacing: 10, marginTop: 12 }}>RECORDINGS END · T+32 s</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 10 Meghani Nagar
export const S10: React.FC = () => {
  const f = useCurrentFrame();
  const d = D(10);
  const [p1, p2, p3] = [pf(10, 1), pf(10, 2), pf(10, 3)];
  return (
    <Shots end={d} shots={[
      [0, (
        <AbsoluteFill>
          <SatMap keys={[{ f: 0, lat: 23.064, lon: 72.621, z: 14.0 }, { f: p1 + 40, lat: 23.058, lon: 72.615, z: 14.7 }]}>
            {(cam) => {
              const e = project(cam, SW[0], SW[1]), c = project(cam, CRASH[0], CRASH[1]);
              const k = ease(f, 70, 140);
              return (
                <g>
                  <line x1={e[0]} y1={e[1]} x2={e[0] + (c[0] - e[0]) * k} y2={e[1] + (c[1] - e[1]) * k} stroke="#fff" strokeWidth={3} strokeDasharray="8 8" />
                  {k > 0.95 && <text x={(e[0] + c[0]) / 2 + 22} y={(e[1] + c[1]) / 2} fontFamily={MONO} fontSize={30} fill={C.amber} style={{ paintOrder: 'stroke', stroke: '#000', strokeWidth: 5 }}>1.7 km</text>}
                  <Marker x={c[0]} y={c[1]} label="B.J. MEDICAL COLLEGE HOSTELS" sub="MEGHANI NAGAR, AHMEDABAD" o={lin(f, 100, 115)} dx={-90} dy={-110} />
                </g>
              );
            }}
          </SatMap>
          <ChapterCard num="III" title="Meghani Nagar" at={0} out={70} />
        </AbsoluteFill>
      )],
      [p1 - 10, (
        <AbsoluteFill style={{ background: '#05070a' }}>
          <BigNumber value={241} label="killed on board" at={wf(10, '241') - p1 + 10} x={240} y={360} color={C.accent} />
          <BigNumber value={19} label="killed on the ground" at={wf(10, 'nineteen') - p1 + 10} x={780} y={360} />
          <BigNumber value={67} label="seriously injured" at={wf(10, '67') - p1 + 10} x={1320} y={360} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 690, textAlign: 'center', fontFamily: MONO, fontSize: 24, color: C.dim, letterSpacing: 4 }}>242 ON BOARD · 260 LIVES LOST IN TOTAL</div>
        </AbsoluteFill>
      )],
      [p2 - 10, (
        <AbsoluteFill>
          <DepthShot name="hospital" frames={p3 - p2 + 20} from={{ x: 0, y: 0, z: 1.02 }} to={{ x: 0, y: 0.1, z: 1.16 }} grade="contrast(1.05) saturate(0.7) brightness(0.8)" />
          <SeatMap at={20} out={p3 - p2 + 20} />
        </AbsoluteFill>
      )],
      [p3 - 10, <DepthShot name="fire_trucks" frames={d - p3 + 10} from={{ x: -0.4, y: 0, z: 1.05 }} to={{ x: 0.3, y: -0.05, z: 1.15 }} />],
    ]} />
  );
};

// ---------------------------------------------------------------- 11 the investigation
export const S11: React.FC = () => {
  const d = D(11);
  const [p1, p2, p3, p4] = [pf(11, 1), pf(11, 2), pf(11, 3), pf(11, 4)];
  return (
    <Shots end={d} shots={[
      [0, (
        <AbsoluteFill>
          <DepthShot name="lab" frames={p2 + 10} from={{ x: 0.3, y: 0, z: 1.03 }} to={{ x: -0.3, y: 0.05, z: 1.18 }} />
          <DataCard title="INVESTIGATION" rows={[['Lead', 'AAIB India'], ['Assisting', 'UK AAIB · US NTSB'], ['Flight recorders', '2 recovered'], ['Preliminary report', '12 July 2025']]} at={pf(11, 0) + 20} out={p1 + 140} side="right" top={200} width={600} />
          <ChapterCard num="IV" title="The Investigation" at={0} out={70} />
        </AbsoluteFill>
      )],
      [p2 - 10, (
        <AbsoluteFill>
          <DepthShot name="documents" frames={d - p2 + 10} from={{ x: -0.2, y: 0.1, z: 1.04 }} to={{ x: 0.2, y: -0.05, z: 1.2 }} grade="contrast(1.1) saturate(0.7) brightness(0.7)" />
          <DataCard title="PRELIMINARY REPORT · FINDINGS" rows={[['Fuel switches', 'RUN → CUTOFF, 1 s apart'], ['Mechanical fault', 'none identified'], ['Recommendations to Boeing / GE', 'none']]} at={10} out={p3 - p2 + 10} side="left" top={220} width={820} />
          <DataCard title="FAA SAIB NM-18-33 · 2018" rows={[['Advice', 'inspect switch locking feature'], ['Status', 'advisory, not mandatory'], ['Air India', 'inspection not performed'], ['Fleet checks, July 2025', 'no problems found']]} at={p3 - p2} out={p4 - p2 + 5} side="left" top={220} width={820} />
          <Super lines={['Final report', 'Not public at the time of this film']} at={p4 - p2} out={d - p2 + 10} x={120} y={700} />
        </AbsoluteFill>
      )],
    ]} />
  );
};

// ---------------------------------------------------------------- 12 epilogue, memorial, credits
export const S12: React.FC = () => {
  const f = useCurrentFrame();
  const d = D(12);
  const endVO = pf(12, 1, 'end');
  const mem = endVO + 20, cred = mem + 170;
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shots end={d} shots={[
        [0, <DepthShot name="vigil" frames={mem + 20} from={{ x: 0, y: 0.05, z: 1.02 }} to={{ x: 0.1, y: -0.05, z: 1.15 }} tag />],
        [mem, (
          <AbsoluteFill>
            <DepthShot name="river_sunset" frames={cred - mem + 20} from={{ x: -0.3, y: 0, z: 1.03 }} to={{ x: 0.3, y: 0, z: 1.1 }} grade="contrast(1.05) saturate(0.85) brightness(0.55)" tag={false} />
            <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: lin(f - mem, 15, 40) * (1 - lin(f - mem, cred - mem - 15, cred - mem)) }}>
              <div style={{ fontFamily: SANS, fontWeight: 300, fontSize: 48, letterSpacing: 6, color: C.ink, textAlign: 'center', lineHeight: 1.5 }}>
                In memory of the 260 people<br />who lost their lives on 12 June 2025
              </div>
            </AbsoluteFill>
          </AbsoluteFill>
        )],
        [cred, (
          <AbsoluteFill>
            <DepthShot name="runway_night" frames={d - cred} from={{ x: 0, y: 0, z: 1.0 }} to={{ x: 0, y: -0.1, z: 1.12 }} grade="contrast(1.05) brightness(0.35)" tag={false} />
            <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: lin(f - cred, 10, 30) }}>
              <div style={{ fontFamily: MONO, fontSize: 22, color: C.dim, letterSpacing: 2, lineHeight: 1.9, textAlign: 'center', maxWidth: 1500 }}>
                <div style={{ color: C.ink, letterSpacing: 8, marginBottom: 18 }}>SOURCES</div>
                AAIB India, Preliminary Report VT-ANB (12 July 2025) and interim statement (12 June 2026)<br />
                Wikipedia: Air India Flight 171 · reporting by BBC, NPR, Reuters, The Hindu<br />
                FAA Special Airworthiness Information Bulletin NM-18-33 (2018)<br /><br />
                <div style={{ color: C.ink, letterSpacing: 8, marginBottom: 18 }}>IMAGERY</div>
                Satellite: Sentinel-2 cloudless 2016 by EOX IT Services GmbH (contains modified Copernicus Sentinel data), CC BY 4.0<br />
                Dramatizations: AI-generated images (Realistic Vision V5.1). No footage of the accident is shown.<br />
                Narration: AI voice · Flight path and seat layout illustrative
              </div>
            </AbsoluteFill>
          </AbsoluteFill>
        )],
      ]} />
      <AbsoluteFill style={{ background: '#000', opacity: lin(f, d - 20, d) }} />
    </AbsoluteFill>
  );
};

export const SCENE_COMPONENTS = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12];
export { sec, Easing };
