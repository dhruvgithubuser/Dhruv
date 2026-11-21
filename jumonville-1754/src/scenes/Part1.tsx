import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { CastDefs, Person, Soldier, useRise } from '../components/Cast';
import { Card, NameCard, Quote, Stamp, Stopwatch, Typed } from '../components/Docs';
import { NAMap, WorldMap, lerpView } from '../components/Maps';
import { Camera, MusketShot, Mist, Parchment, Plate } from '../components/Stage';
import { C, HEAD, SCENES, TYPE, ease, lin, wf } from '../theme';

export const D = (n: number) => SCENES[n - 1].frames + 12;
const WIDE = { lon: -80, lat: 40, k: 42 }, OHIO = { lon: -80.6, lat: 40.6, k: 150 }, FORKS = { lon: -79.95, lat: 40.3, k: 520 };
const TRIP = { lon: -78.6, lat: 39.7, k: 170 };
export const VIEWS = { WIDE, OHIO, FORKS, TRIP };

/** Character spotlight: darkened painted plate (or parchment), the cutout rising on the left, the name card on the right. */
export const Spotlight: React.FC<{ n: number; who: React.ComponentProps<typeof Person>['who']; name: string; lines: string[]; plate?: string; at?: number; talk?: boolean; children?: React.ReactNode }> = ({ n, who, name, lines, plate, at = 2, talk, children }) => {
  const f = useCurrentFrame();
  const r = useRise(at);
  return (
    <AbsoluteFill>
      {plate ? <Plate src={plate} dur={D(n)} grade="sepia(0.5) brightness(0.45) blur(3px)" /> : <Parchment dark={0.55} />}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 45% 70% at 31% 55%, rgba(255,226,170,0.22), rgba(0,0,0,0) 70%)' }} />
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <CastDefs />
        <Person who={who} x={600} y={1290} s={2.05} rise={r} talk={talk ? lin(f, at + 10, at + 12) * (1 - lin(f, D(n) - 30, D(n) - 20)) : 0} />
      </svg>
      <NameCard at={at + 8} name={name} lines={lines} />
      {children}
    </AbsoluteFill>
  );
};

// 1 dawn in the glen
export const S01: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Plate src="assets/backgrounds/glen_dawn.jpg" dur={D(1)} from={[0, 20, 1.18]} to={[0, 0, 1.06]} grade="sepia(0.3) brightness(0.8) contrast(1.05)" />
      <Mist o={0.55} y={62} />
      <div style={{ position: 'absolute', left: 120, top: 120, opacity: lin(f, 10, 24) }}>
        <div style={{ fontFamily: 'Playfair', fontWeight: 900, fontSize: 88, color: C.paper, textShadow: '0 4px 20px #000' }}>May 28, 1754</div>
        <div style={{ height: 6, width: 400 * ease(f, 20, 40), background: C.red, margin: '12px 0' }} />
        <Typed text={'Dawn · western Pennsylvania'} a={26} b={60} size={36} color={C.beige} bold />
      </div>
    </AbsoluteFill>
  );
};

// 2 they creep into position (silhouettes on the rocks, smoke from the French camp below)
export const S02: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Plate src="assets/backgrounds/glen_dawn.jpg" dur={D(2)} from={[-30, 0, 1.12]} to={[30, 0, 1.16]} grade="sepia(0.35) brightness(0.62)" />
      <Mist o={0.4} y={70} />
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, filter: 'brightness(0.18)' }}>
        <path d="M0,1080 L0,820 Q300,760 620,800 Q900,840 1200,790 Q1560,740 1920,800 L1920,1080 Z" fill="#2a2016" />
        {[0, 1, 2, 3, 4, 5].map((i) => <Soldier key={i} kind={i % 3 === 2 ? 'warrior' : 'virginian'} x={-200 + i * 170 + Math.min(f, 200) * 2.2} y={820 + (i % 2) * 14} s={1.25} pose="walk" phase={i * 1.3} />)}
      </svg>
      <div style={{ position: 'absolute', left: 120, top: 120, fontFamily: TYPE, fontWeight: 700, fontSize: 34, color: C.beige, opacity: lin(f, 20, 34), textShadow: '0 2px 10px #000' }}>40 VIRGINIANS · 12 NATIVE WARRIORS</div>
    </AbsoluteFill>
  );
};

// 3 the commander is 22
export const S03: React.FC = () => (
  <Spotlight n={3} who="washington" name="George Washington" lines={['AGE 22', 'LT. COLONEL, VIRGINIA REGIMENT']} plate="assets/backgrounds/glen_dawn.jpg" at={wf(3, 'george') - 18} />
);

// 4 fifteen minutes
export const S04: React.FC = () => (
  <AbsoluteFill>
    <Plate src="assets/backgrounds/glen_dawn.jpg" dur={D(4)} grade="sepia(0.5) brightness(0.35) blur(4px)" />
    <Stopwatch at={4} to={15 * 60} dur={wf(4, 'minutes') + 6} x={960} y={470} size={360} label="ABOUT FIFTEEN MINUTES" />
    <MusketShot at={8} x={420} y={560} />
    <MusketShot at={20} x={1500} y={620} dir={-1} />
  </AbsoluteFill>
);

// 5 the fuse: a spark at the glen runs out to five continents, then "1776"
export const S05: React.FC = () => {
  const f = useCurrentFrame();
  const c = wf(5, 'continents'), us = wf(5, 'united');
  const lit = [0, 1, 2, 3, 4, 5, 6].map((i) => lin(f, c - 20 + i * 5, c - 10 + i * 5));
  return (
    <AbsoluteFill>
      <WorldMap lit={[1, ...lit.slice(1)]} spark={1} k={5.2 + 0.8 * ease(f, 0, D(5))} lon={-20} lat={22} />
      {f >= us - 6 && <Stamp text="1776" at={us - 6} x={560} y={300} size={110} rot={-6} />}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center', fontFamily: HEAD, fontWeight: 700, fontSize: 56, letterSpacing: 8, color: C.ink, opacity: lin(f, c - 20, c) }}>THE SEVEN YEARS' WAR · 1756–1763</div>
    </AbsoluteFill>
  );
};

// 6 title card
export const S06: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Plate src="assets/backgrounds/glen_dawn.jpg" dur={D(6) + 40} from={[0, 0, 1.1]} to={[0, 0, 1.2]} grade="sepia(0.55) brightness(0.32) blur(2px)" />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 36, letterSpacing: 10, color: C.beige, opacity: lin(f, 4, 16) }}>BURIED CHRONICLES PRESENTS</div>
        <div style={{ fontFamily: 'Playfair', fontWeight: 900, fontSize: 112, color: C.paper, lineHeight: 1.05, marginTop: 24, opacity: lin(f, 10, 24), transform: `translateY(${(1 - ease(f, 10, 30)) * 30}px)` }}>The 15-Minute Ambush<br />That Started a World War</div>
        <div style={{ height: 8, width: 700 * ease(f, 24, 44), background: C.red, margin: '28px auto' }} />
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 44, letterSpacing: 10, color: C.beige, opacity: lin(f, 30, 44) }}>JUMONVILLE GLEN · 1754</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 7 two empires
export const S07: React.FC = () => {
  const f = useCurrentFrame();
  const v = lerpView({ lon: -78, lat: 40, k: 30 }, WIDE, ease(f, 0, D(7)));
  return <NAMap view={v} rivers={0.6} labels={[{ at: [-73, 47.5], text: 'TWO EMPIRES', o: lin(f, 10, 24), size: 64, color: C.ink }]} />;
};
// 8 the thirteen colonies
export const S08: React.FC = () => {
  const f = useCurrentFrame();
  return <NAMap view={lerpView(WIDE, { lon: -77, lat: 39.5, k: 50 }, ease(f, 0, D(8)))} rivers={1} colonies={ease(f, 6, 70)}
    labels={[{ at: [-77.5, 38.4], text: 'BRITAIN · 13 COLONIES', o: lin(f, 40, 56), size: 42, color: C.brit }]}
    pins={[{ at: 'boston', label: 'Boston', o: lin(f, 50, 60) }, { at: 'newyork', label: 'New York', o: lin(f, 56, 66) }, { at: 'philadelphia', label: 'Philadelphia', o: lin(f, 62, 72), side: 'l' as const }, { at: 'williamsburg', label: 'Williamsburg', o: lin(f, 68, 78) }, { at: 'charleston', label: 'Charleston', o: lin(f, 74, 84) }].map((p) => ({ ...p, color: C.brit }))} />;
};
// 9 New France: the arc and its forts
export const S09: React.FC = () => {
  const f = useCurrentFrame();
  return <NAMap view={lerpView({ lon: -77, lat: 39.5, k: 50 }, { lon: -82, lat: 39, k: 36 }, ease(f, 0, D(9)))} colonies={1} newFrance={ease(f, wf(9, 'quebec') - 6, wf(9, 'orleans') + 20)}
    labels={[{ at: [-87.5, 44], text: 'NEW FRANCE', o: lin(f, wf(9, 'quebec'), wf(9, 'quebec') + 15), size: 52, color: C.fr }, { at: [-77.5, 38.4], text: '13 COLONIES', o: 1, size: 36, color: C.brit }]}
    pins={[{ at: 'quebec', label: 'Québec', o: lin(f, wf(9, 'quebec') - 4, wf(9, 'quebec') + 6), color: C.fr, kind: 'fort' }, { at: 'neworleans', label: 'New Orleans', o: lin(f, wf(9, 'orleans') - 4, wf(9, 'orleans') + 6), color: C.fr, kind: 'fort' }]} />;
};
// 10 the Ohio Country and its nations
export const S10: React.FC = () => {
  const f = useCurrentFrame();
  return <NAMap view={lerpView({ lon: -82, lat: 39, k: 36 }, OHIO, ease(f, 0, 70))} colonies={1} newFrance={1} nations={lin(f, wf(10, 'shawnee') - 6, wf(10, 'nations') + 10)} rivers={1}
    labels={[{ at: [-81.4, 42.6], text: 'THE OHIO COUNTRY', o: lin(f, wf(10, 'ohio') - 4, wf(10, 'ohio') + 10), size: 62, color: C.ink }]} />;
};
// 11 the Six Nations claim the region
export const S11: React.FC = () => {
  const f = useCurrentFrame();
  return <NAMap view={lerpView(OHIO, { lon: -79.5, lat: 41.4, k: 120 }, ease(f, 0, D(11)))} colonies={1} newFrance={1} nations={1}
    routes={[{ pts: [[-76.0, 42.9], [-78.5, 42.2], [-80.6, 41.2]], p: ease(f, wf(11, 'claimed'), wf(11, 'claimed') + 30), color: '#5a3d1e', width: 6, label: 'claimed authority' }]}
    labels={[{ at: [-75.6, 43.6], text: 'HAUDENOSAUNEE', o: lin(f, 6, 20), size: 36, color: '#5a3d1e' }]} />;
};
// 12 the rivers are the highways
export const S12: React.FC = () => {
  const f = useCurrentFrame();
  return <NAMap view={lerpView({ lon: -79.5, lat: 41.4, k: 120 }, { lon: -82.5, lat: 39.8, k: 110 }, ease(f, 0, D(12)))} colonies={1} newFrance={1} rivers={1} flow riverLabels={lin(f, 10, 24)}
    labels={[{ at: [-84.5, 41.9], text: 'RIVERS = HIGHWAYS', o: lin(f, 20, 34), size: 44, color: '#2e5568' }]} />;
};
// 13 the Forks of the Ohio
export const S13: React.FC = () => {
  const f = useCurrentFrame();
  const fk = wf(13, 'forks'), pit = wf(13, 'pittsburgh');
  return (
    <AbsoluteFill>
      <NAMap view={lerpView({ lon: -82.5, lat: 39.8, k: 110 }, FORKS, ease(f, 0, fk + 20))} rivers={1} flow riverLabels={lin(f, fk, fk + 14)}
        pins={[{ at: 'forks', label: 'THE FORKS OF THE OHIO', o: lin(f, fk - 4, fk + 8), kind: 'star' }]}
        labels={[{ at: [-80.02, 40.33], text: 'today: Pittsburgh', o: lin(f, pit - 4, pit + 8), size: 30, italic: true, color: C.red }]} />
      <Card at={fk + 20} x={1240} y={120} w={560} rot={2} from="right" pad={14}>
        <Img src={staticFile('assets/backgrounds/forks_ohio.jpg')} style={{ width: '100%', height: 300, objectFit: 'cover', filter: 'sepia(0.4)' }} />
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 22, marginTop: 8 }}>The Forks, as they might have looked (illustration)</div>
      </Card>
    </AbsoluteFill>
  );
};

// 14 French forts south from Lake Erie
export const S14: React.FC = () => {
  const f = useCurrentFrame();
  const fo = wf(14, 'forts');
  return <NAMap view={lerpView(FORKS, { lon: -79.9, lat: 41.2, k: 300 }, ease(f, 0, D(14)))} rivers={1} riverLabels={1}
    routes={[{ pts: ['presqueisle', 'leboeuf', [-80.15, 41.75], [-80.05, 41.62], 'venango'], p: ease(f, fo, fo + 50), color: C.fr, width: 8 }]}
    pins={[{ at: 'presqueisle', label: 'Fort Presque Isle', o: lin(f, fo - 6, fo + 4), color: C.fr, kind: 'fort' }, { at: 'leboeuf', label: 'Fort Le Boeuf', o: lin(f, fo + 10, fo + 20), color: C.fr, kind: 'fort' }, { at: 'venango', label: 'Venango', o: lin(f, fo + 30, fo + 40), color: C.fr, kind: 'fort', side: 'l' }, { at: 'forks', label: 'Forks', o: 1, kind: 'star' }]}
    labels={[{ at: [-79.3, 42.55], text: 'LAKE ERIE', o: 1, size: 34, color: '#2e5568', italic: true }]} />;
};
// 15 Dinwiddie and the warning
export const S15: React.FC = () => (
  <Spotlight n={15} who="dinwiddie" name="Robert Dinwiddie" lines={['LIEUTENANT GOVERNOR OF VIRGINIA']} at={2}>
    <Card at={wf(15, 'warning') - 4} x={1060} y={600} w={700} rot={2} from="bottom" tilt={30}>
      <Typed text={'To the Commander of the French forces on the Ohio:\nLEAVE, OR BE REMOVED.'} a={wf(15, 'warning')} b={wf(15, 'removed') + 8} size={32} />
    </Card>
  </Spotlight>
);
// 16 a 21-year-old surveyor
export const S16: React.FC = () => (
  <Spotlight n={16} who="washington" name="George Washington" lines={['AGE 21', 'SURVEYOR · MILITIA MAJOR', 'NO COMBAT EXPERIENCE']} plate="assets/backgrounds/fort_snow.jpg" at={2} />
);
// 17 the winter journey to Fort Le Boeuf
export const S17: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <NAMap view={lerpView({ lon: -77.6, lat: 38.6, k: 150 }, TRIP, ease(f, 0, D(17)))} rivers={1} colonies={1}
        routes={[{ pts: ['williamsburg', [-77.5, 38.3], 'winchester', 'willscreek', 'forks', 'logstown', 'venango', 'leboeuf'], p: ease(f, 6, D(17) - 30), march: true, label: 'Nov–Dec 1753' }]}
        pins={[{ at: 'williamsburg', label: 'Williamsburg', o: 1 }, { at: 'leboeuf', label: 'Fort Le Boeuf', o: lin(f, D(17) - 40, D(17) - 30), color: C.fr, kind: 'fort' }]} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(230,240,250,0.18), rgba(0,0,0,0))' }} />
      <Card at={wf(17, 'snow')} x={1300} y={560} w={500} rot={-2} pad={12}>
        <Img src={staticFile('assets/backgrounds/fort_snow.jpg')} style={{ width: '100%', height: 260, objectFit: 'cover', filter: 'sepia(0.35)' }} />
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 20, marginTop: 6 }}>Winter on the frontier (illustration)</div>
      </Card>
    </AbsoluteFill>
  );
};
// 18 the journal is printed
export const S18: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Parchment dark={0.35} />
      <Card at={2} x={560} y={110} w={800} rot={-1.5} from="bottom" tilt={40} pad={50}>
        <div style={{ textAlign: 'center', fontFamily: 'Playfair', fontWeight: 900, fontSize: 30, letterSpacing: 4 }}>THE</div>
        <div style={{ textAlign: 'center', fontFamily: 'Playfair', fontWeight: 900, fontSize: 70, lineHeight: 1.05 }}>JOURNAL</div>
        <div style={{ textAlign: 'center', fontFamily: 'Playfair', fontStyle: 'italic', fontWeight: 700, fontSize: 34 }}>of Major George Washington,</div>
        <div style={{ textAlign: 'center', fontFamily: TYPE, fontSize: 24, margin: '20px 0', color: C.dim }}>sent by the Hon. Robert Dinwiddie, Esq; to the Commandant of the French Forces on Ohio</div>
        <div style={{ height: 3, background: C.ink, margin: '10px 80px' }} />
        <div style={{ textAlign: 'center', fontFamily: TYPE, fontWeight: 700, fontSize: 26, marginTop: 14 }}>WILLIAMSBURG · 1754</div>
      </Card>
      <Stamp text="Williamsburg" at={wf(18, 'williamsburg')} x={360} y={360} size={56} rot={-10} />
      <Stamp text="London" at={wf(18, 'london')} x={1560} y={720} size={64} rot={7} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 150, textAlign: 'center', fontFamily: HEAD, fontWeight: 700, fontSize: 48, letterSpacing: 6, color: C.paper, opacity: lin(f, wf(18, 'overnight'), wf(18, 'overnight') + 10), textShadow: '0 3px 14px #000' }}>A NAME KNOWN ON BOTH SIDES OF THE ATLANTIC</div>
    </AbsoluteFill>
  );
};
// 19 the French reply
export const S19: React.FC = () => (
  <AbsoluteFill>
    <Plate src="assets/backgrounds/fort_snow.jpg" dur={D(19)} grade="sepia(0.5) brightness(0.4) blur(3px)" />
    <Quote at={wf(19, 'as') - 8} text="As to the summons you send me to retire, I do not think myself obliged to obey it." by="JACQUES LEGARDEUR DE SAINT-PIERRE · FORT LE BOEUF, DECEMBER 1753" dur={wf(19, 'obey') - wf(19, 'as') + 14} />
  </AbsoluteFill>
);
