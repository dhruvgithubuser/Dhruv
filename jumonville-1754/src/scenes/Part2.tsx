import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CastDefs, Person, Soldier, useRise } from '../components/Cast';
import { Card, Quote, Stamp, Stopwatch, Tally, Typed } from '../components/Docs';
import { NAMap, lerpView } from '../components/Maps';
import { Camera, Mist, MusketShot, Parchment, Plate, Rain } from '../components/Stage';
import { C, HEAD, MONO, TYPE, ease, hash01, lin, wf } from '../theme';
import { D, Spotlight, VIEWS } from './Part1';

const { FORKS, OHIO } = VIEWS;
const MEADOWS = { lon: -79.75, lat: 40.12, k: 700 };

// 20 lieutenant colonel; a fort at the Forks
export const S20: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <NAMap view={lerpView(OHIO, FORKS, ease(f, 0, D(20)))} rivers={1} riverLabels={lin(f, 20, 34)} pins={[{ at: 'forks', label: 'planned Virginian fort', o: lin(f, wf(20, 'fort') - 4, wf(20, 'fort') + 8), color: C.brit, kind: 'fort' }]} />
      <Card at={4} x={110} y={110} w={640} rot={-2} from="left" tilt={30}>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: C.red }}>COMMISSION · 1754</div>
        <Typed text={'George Washington, Esq.\nto be LIEUTENANT COLONEL\nof the Virginia Regiment.'} a={8} b={wf(20, 'colonel') + 10} size={34} font="quill" />
      </Card>
    </AbsoluteFill>
  );
};
// 21 Feb: Virginians start the fort; April: ~500 French come down the Allegheny
export const S21: React.FC = () => {
  const f = useCurrentFrame();
  const fr = wf(21, 'french');
  return (
    <AbsoluteFill>
      <NAMap view={lerpView(FORKS, { lon: -79.85, lat: 40.75, k: 360 }, ease(f, 0, D(21)))} rivers={1} riverLabels={1}
        routes={[{ pts: ['venango', [-79.65, 41.0], [-79.52, 40.82], [-79.55, 40.68], [-79.86, 40.53], 'forks'], p: ease(f, fr - 6, fr + 70), color: C.fr, width: 10, march: true, label: '≈500 French, militia & allies' }]}
        pins={[{ at: 'forks', label: 'Virginian stockade · Feb 1754', o: lin(f, 6, 16), color: C.brit, kind: 'fort', side: 'l' }, { at: 'venango', label: 'Venango', o: 1, color: C.fr, kind: 'fort' }]} />
      <div style={{ position: 'absolute', right: 120, top: 120, fontFamily: HEAD, fontWeight: 700, fontSize: 60, letterSpacing: 6, color: C.fr, opacity: lin(f, fr, fr + 10) }}>APRIL 1754</div>
    </AbsoluteFill>
  );
};
// 22 36 Virginians leave; Fort Duquesne rises
export const S22: React.FC = () => {
  const f = useCurrentFrame();
  const dq = wf(22, 'duquesne');
  return (
    <AbsoluteFill>
      <NAMap view={{ lon: -80.0, lat: 40.43, k: 2600 + 1200 * ease(f, 0, D(22)) }} rivers={1} riverLabels={0}
        routes={[{ pts: [[-80.0, 40.44], [-79.97, 40.40], [-79.93, 40.36]], p: ease(f, 6, 50), color: C.brit, width: 8, label: '36 Virginians leave' }]}>
        {(P) => {
          const [x, y] = P(-80.012, 40.441); const s = 1 + 0.4 * ease(f, 0, D(22)); const p = ease(f, dq - 10, dq + 30);
          const pts = Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2 - Math.PI / 8; const r = i % 2 ? 46 : 80; return [x + r * s * Math.cos(a), y + r * s * Math.sin(a)]; });
          const d = pts.map((q, i) => `${i ? 'L' : 'M'}${q[0]},${q[1]}`).join('') + 'Z';
          return <g><path d={d} fill={C.fr} fillOpacity={0.25 * p} stroke={C.fr} strokeWidth={6} strokeDasharray={`${900 * p} 1000`} />{p > 0.8 && <text x={x} y={y - 120 * s} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={48} letterSpacing={4} fill={C.fr} stroke="#efe6d2" strokeWidth={7} style={{ paintOrder: 'stroke' }}>FORT DUQUESNE</text>}</g>;
        }}
      </NAMap>
      <Stamp text="Surrendered" at={wf(22, 'handed')} x={460} y={240} size={64} rot={-8} />
    </AbsoluteFill>
  );
};
// 23 Contrecoeur's orders and the summons
export const S23: React.FC = () => (
  <Spotlight n={23} who="contrecoeur" name="Captain Contrecœur" lines={['COMMANDER AT FORT DUQUESNE']} at={2}>
    <Card at={wf(23, 'orders') - 4} x={1060} y={560} w={720} rot={2} from="bottom" tilt={30}>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 28, letterSpacing: 4, color: C.fr }}>ORDERS</div>
      <Typed text={'Do not attack unless provoked.\nFind the English. Deliver a summons to withdraw.'} a={wf(23, 'orders')} b={wf(23, 'summons') + 10} size={30} />
    </Card>
  </Spotlight>
);
// 24 Washington marches west; "an invitation to start a war"
export const S24: React.FC = () => {
  const f = useCurrentFrame();
  const inv = wf(24, 'invitation');
  return (
    <AbsoluteFill>
      <Plate src="assets/backgrounds/great_meadows.jpg" dur={D(24)} from={[40, 0, 1.12]} to={[-40, 0, 1.12]} grade="sepia(0.45) brightness(0.55)" />
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {Array.from({ length: 9 }, (_, i) => <Soldier key={i} kind="virginian" x={-300 + i * 120 + f * 2.6} y={930} s={1.15} pose="walk" phase={i * 0.9} />)}
      </svg>
      <div style={{ position: 'absolute', left: 120, top: 110, fontFamily: HEAD, fontWeight: 700, fontSize: 54, letterSpacing: 4, color: C.paper, opacity: lin(f, 10, 22), textShadow: '0 3px 14px #000' }}>FEWER THAN 160 MEN</div>
      <Card at={inv - 10} x={980} y={150} w={780} rot={1.5} from="right" pad={36}>
        <Typed text={'Dinwiddie\'s orders were "an invitation to start a war."'} a={inv - 6} b={inv + 30} size={38} font="quill" />
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 24, color: C.red, marginTop: 12 }}>HISTORIAN FRED ANDERSON</div>
      </Card>
    </AbsoluteFill>
  );
};
// 25 the Great Meadows
export const S25: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <NAMap view={lerpView(FORKS, MEADOWS, ease(f, 0, D(25)))} rivers={1} riverLabels={1}
        pins={[{ at: 'meadows', label: 'Great Meadows', o: lin(f, 8, 18), color: C.brit, side: 'r' }, { at: 'duquesne', label: 'Fort Duquesne', o: 1, color: C.fr, kind: 'fort' }]}
        routes={[{ pts: ['willscreek', [-79.2, 39.75], 'meadows'], p: ease(f, 0, 50), color: C.brit, march: true }]} />
      <Card at={wf(25, 'message') - 6} x={1360} y={640} w={420} rot={-4} from="bottom" pad={26}><div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 40, letterSpacing: 4 }}>A MESSAGE...</div></Card>
    </AbsoluteFill>
  );
};
// 26 Christopher Gist rides in
export const S26: React.FC = () => (
  <Spotlight n={26} who="gist" name="Christopher Gist" lines={['FRONTIERSMAN & GUIDE', '27 MAY 1754']} plate="assets/backgrounds/great_meadows.jpg" at={2} talk />
);
// 27 Tanacharison
export const S27: React.FC = () => (
  <Spotlight n={27} who="tanacharison" name="Tanacharison" lines={['"THE HALF KING"', 'MINGO LEADER · SPOKE FOR THE SIX NATIONS']} plate="assets/backgrounds/forest_night_rain.jpg" at={2} />
);
// 28 Jumonville and the summons
export const S28: React.FC = () => (
  <Spotlight n={28} who="jumonville" name="Joseph Coulon de Jumonville" lines={['ENSIGN, FRENCH COLONIAL TROOPS', '≈35 MEN', 'CARRYING A SUMMONS']} plate="assets/backgrounds/glen_dawn.jpg" at={2}>
    <Card at={wf(28, 'summons') - 4} x={1080} y={660} w={640} rot={-2} from="bottom" tilt={30} pad={26}>
      <div style={{ fontFamily: 'Playfair', fontWeight: 900, fontSize: 40 }}>SOMMATION</div>
      <Typed text={'...to withdraw from the lands of the King of France.'} a={wf(28, 'summons')} b={wf(28, 'leave') + 20} size={28} font="quill" />
    </Card>
  </Spotlight>
);
// 29 the night march in the rain
export const S29: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Plate src="assets/backgrounds/forest_night_rain.jpg" dur={D(29)} from={[0, 0, 1.08]} to={[-60, 0, 1.16]} grade="sepia(0.3) brightness(0.55) contrast(1.1)" />
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, filter: 'brightness(0.12)' }}>
        {Array.from({ length: 10 }, (_, i) => <Soldier key={i} kind={i < 3 ? 'warrior' : 'virginian'} x={-200 + i * 120 + f * 2} y={960 + (i % 2) * 10} s={1.2} pose="walk" phase={i * 1.1} />)}
      </svg>
      <Rain o={0.55} n={220} />
      <div style={{ position: 'absolute', left: 120, top: 110, fontFamily: TYPE, fontWeight: 700, fontSize: 34, color: C.beige, opacity: lin(f, 10, 24), textShadow: '0 2px 10px #000' }}>NIGHT OF 27–28 MAY 1754</div>
    </AbsoluteFill>
  );
};

/** Top-down tactical diagram of the glen (positions approximate). phase: 0 positions, 1 fire, 2 flight & surrender. */
const GlenDiagram: React.FC<{ pos: number; fire: number; flee: number }> = ({ pos, fire, flee }) => {
  const f = useCurrentFrame();
  const cx = 960, cy = 600;
  const virg = Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (1.05 + 0.5 * (i / 8)); return [cx + 330 * Math.cos(a), cy + 230 * Math.sin(a)]; });
  const war = Array.from({ length: 6 }, (_, i) => { const a = Math.PI * (-0.35 + 0.55 * (i / 5)); return [cx + 360 * Math.cos(a), cy + 250 * Math.sin(a)]; });
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
      <defs><pattern id="rock" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="2.4" fill="rgba(60,45,30,0.35)" /><circle cx="12" cy="11" r="1.6" fill="rgba(60,45,30,0.3)" /></pattern>
        <marker id="aw" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={C.fr} /></marker></defs>
      <path d={`M${cx - 520},${cy - 70} Q${cx - 420},${cy - 330} ${cx},${cy - 340} Q${cx + 420},${cy - 330} ${cx + 520},${cy - 80}`} fill="none" stroke="url(#rock)" strokeWidth={90} />
      <path d={`M${cx - 520},${cy - 70} Q${cx - 420},${cy - 330} ${cx},${cy - 340} Q${cx + 420},${cy - 330} ${cx + 520},${cy - 80}`} fill="none" stroke="#5a4630" strokeWidth={3} strokeDasharray="14 10" />
      <text x={cx} y={cy - 420} textAnchor="middle" fontFamily={TYPE} fontWeight={700} fontSize={26} fill={C.ink}>ROCK LEDGES (HIGH GROUND)</text>
      <ellipse cx={cx} cy={cy} rx={170} ry={90} fill="rgba(46,79,134,0.12)" stroke={C.fr} strokeWidth={3} strokeDasharray="8 8" />
      {Array.from({ length: 5 }, (_, i) => <path key={i} d={`M${cx - 120 + i * 60},${cy + 20} l26,-44 l26,44 Z`} fill="#c9bfa6" stroke={C.ink} strokeWidth={2} />)}
      <path d={`M${cx - 6},${cy - 10} q6,-30 12,0 q4,-20 8,0`} stroke="#8a5a2a" strokeWidth={3} fill="none" opacity={0.8} />
      <text x={cx} y={cy + 130} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={34} letterSpacing={3} fill={C.fr}>FRENCH CAMP · ≈35 MEN</text>
      {virg.map(([x, y], i) => { const o = lin(pos * 9, i, i + 1); return <g key={i} opacity={o}><circle cx={x} cy={y} r={14} fill={C.brit} stroke="#efe6d2" strokeWidth={3} />{fire > 0 && <line x1={x} y1={y} x2={x + (cx - x) * 0.55 * fire} y2={y + (cy - y) * 0.55 * fire} stroke={C.brit} strokeWidth={2} strokeDasharray="4 6" opacity={1 - fire * 0.5} />}</g>; })}
      {war.map(([x, y], i) => { const o = lin(pos * 6, i, i + 1); return <rect key={i} x={x - 12} y={y - 12} width={24} height={24} fill="#6a3a20" stroke="#efe6d2" strokeWidth={3} transform={`rotate(45 ${x} ${y})`} opacity={o} />; })}
      <text x={cx - 430} y={cy - 250} fontFamily={HEAD} fontWeight={700} fontSize={30} fill={C.brit} opacity={pos}>WASHINGTON · 40</text>
      <text x={cx + 300} y={cy + 230} fontFamily={HEAD} fontWeight={700} fontSize={30} fill="#6a3a20" opacity={pos}>WARRIORS · 12</text>
      {flee > 0 && [0, 1, 2].map((i) => { const a = -0.3 + i * 0.25; const out = Math.min(1, flee * 1.6); const back = Math.max(0, flee * 1.6 - 1); const x1 = cx + 120 + 230 * out * Math.cos(a) - 180 * back * Math.cos(a), y1 = cy + 230 * out * Math.sin(a) - 180 * back * Math.sin(a);
        return <path key={i} d={`M${cx + 80},${cy} L${x1},${y1}`} stroke={C.fr} strokeWidth={6} markerEnd="url(#aw)" />; })}
      <text x={1840} y={1010} textAnchor="end" fontFamily={MONO} fontSize={18} fill="rgba(40,28,16,0.6)">POSITIONS APPROXIMATE</text>
      {fire > 0 && fire < 1 && Array.from({ length: 6 }, (_, i) => { const [x, y] = virg[(i * 3) % 9]; return <circle key={i} cx={x} cy={y} r={20 + 30 * hash01(i, Math.floor(f / 3))} fill="rgba(240,235,220,0.6)" />; })}
    </svg>
  );
};
// 30 dawn: positions behind the rocks
export const S30: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Parchment />
      <Camera push={0.03 * ease(f, 0, D(30))}><GlenDiagram pos={ease(f, 6, D(30) - 20)} fire={0} flee={0} /></Camera>
      <div style={{ position: 'absolute', left: 110, top: 70, fontFamily: HEAD, fontWeight: 700, fontSize: 46, letterSpacing: 4, color: C.ink, opacity: lin(f, 4, 14) }}>DAWN · 28 MAY 1754</div>
    </AbsoluteFill>
  );
};
// 31 a shot, then "fire!"
export const S31: React.FC = () => {
  const f = useCurrentFrame();
  const shot = wf(31, 'shot'), fire = wf(31, 'fire');
  return (
    <AbsoluteFill style={{ transform: f >= fire ? `translate(${5 * Math.sin(f * 2) * Math.exp(-(f - fire) / 8)}px,0)` : undefined }}>
      <Plate src="assets/backgrounds/glen_dawn.jpg" dur={D(31)} from={[0, 0, 1.2]} to={[0, 0, 1.28]} grade="sepia(0.35) brightness(0.6)" />
      <Mist o={0.4} y={72} />
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, filter: 'brightness(0.15)' }}>
        <path d="M0,1080 L0,760 Q400,700 760,760 Q1100,820 1400,770 Q1700,730 1920,760 L1920,1080 Z" fill="#2a2016" />
        {[0, 1, 2, 3, 4].map((i) => <Soldier key={i} kind="virginian" x={180 + i * 200} y={790 + (i % 2) * 18} s={1.35} pose={f >= fire ? 'kneelAim' : 'stand'} />)}
        <Soldier kind="warrior" x={1500} y={780} s={1.3} pose="stand" flip />
        <Soldier kind="warrior" x={1680} y={800} s={1.3} pose="stand" flip />
      </svg>
      <MusketShot at={shot} x={1100} y={900} dir={-1} s={0.7} />
      {[0, 1, 2, 3, 4].map((i) => <MusketShot key={i} at={fire + 4 + i * 2} x={180 + i * 200 + 110} y={790 + (i % 2) * 18 - 150} />)}
      <Stamp text="FIRE!" at={fire} x={960} y={300} size={120} rot={-6} />
    </AbsoluteFill>
  );
};
// 32 the fight in diagram: volleys, flight, surrender
export const S32: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Parchment />
      <GlenDiagram pos={1} fire={lin(f, 4, 40)} flee={ease(f, wf(32, 'ran'), wf(32, 'surrender') + 10)} />
      <Stamp text="Surrender" at={wf(32, 'surrender')} x={1420} y={760} size={58} rot={6} color={C.fr} />
    </AbsoluteFill>
  );
};
// 33 fifteen minutes; the toll
export const S33: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Plate src="assets/backgrounds/glen_dawn.jpg" dur={D(33)} grade="sepia(0.55) brightness(0.32) blur(4px)" />
      <Stopwatch at={0} to={15 * 60} dur={20} x={380} y={470} size={300} label="≈ 15 MINUTES" />
      <Tally at={wf(33, 'dead') - 8} n={10} label="FRENCH KILLED" x={760} y={330} />
      <Tally at={wf(33, 'prisoner') - 8} n={21} label="TAKEN PRISONER" x={1180} y={330} />
      <Tally at={wf(33, 'lost') - 4} n={1} label="VIRGINIAN KILLED" x={970} y={620} color={C.beige} size={110} />
      <div style={{ position: 'absolute', left: 760, top: 860, fontFamily: TYPE, fontSize: 22, color: C.beige, opacity: lin(f, 40, 50) }}>Figures from Washington's diary; other accounts give 13–14 dead.</div>
    </AbsoluteFill>
  );
};
// 34 "something charming in the sound"
export const S34: React.FC = () => (
  <AbsoluteFill>
    <Plate src="assets/backgrounds/great_meadows.jpg" dur={D(34)} grade="sepia(0.5) brightness(0.4) blur(3px)" />
    <Quote at={wf(34, 'i') - 6} text="I heard the bullets whistle, and believe me, there was something charming in the sound." by="GEORGE WASHINGTON, LETTER TO HIS BROTHER, 1754" dur={wf(34, 'sound') - wf(34, 'i') + 12} />
  </AbsoluteFill>
);

// 35 how did he die? two accounts appear
export const S35: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Parchment dark={0.5} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 260, textAlign: 'center', fontFamily: 'Playfair', fontWeight: 900, fontSize: 300, color: C.red, opacity: lin(f, 6, 20), transform: `scale(${0.9 + 0.1 * ease(f, 6, 30)})` }}>?</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', fontFamily: HEAD, fontWeight: 700, fontSize: 60, letterSpacing: 6, color: C.paper, opacity: lin(f, 20, 34) }}>HOW DID JUMONVILLE DIE?</div>
    </AbsoluteFill>
  );
};
// 36 the French account
export const S36: React.FC = () => (
  <AbsoluteFill>
    <Parchment dark={0.5} />
    <Card at={2} x={180} y={170} w={740} rot={-2} from="left" tilt={30} pad={40}>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 32, letterSpacing: 4, color: C.fr }}>ACCOUNT 1 · FRENCH REPORT (CONTRECŒUR)</div>
      <div style={{ height: 3, background: C.fr, margin: '12px 0 18px' }} />
      <Typed text={'Jumonville was shot in the head while his summons was being read aloud.'} a={6} b={wf(36, 'aloud') + 6} size={40} font="quill" />
    </Card>
  </AbsoluteFill>
);
// 37 the other accounts
export const S37: React.FC = () => (
  <AbsoluteFill>
    <Parchment dark={0.5} />
    <Card at={0} x={180} y={170} w={740} rot={-2} pad={40}>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 32, letterSpacing: 4, color: C.fr }}>ACCOUNT 1 · FRENCH REPORT (CONTRECŒUR)</div>
      <div style={{ height: 3, background: C.fr, margin: '12px 0 18px' }} />
      <div style={{ fontFamily: 'Playfair', fontStyle: 'italic', fontWeight: 700, fontSize: 40, lineHeight: 1.32 }}>Jumonville was shot in the head while his summons was being read aloud.</div>
    </Card>
    <Card at={2} x={1000} y={300} w={740} rot={2} from="right" tilt={30} pad={40}>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 32, letterSpacing: 4, color: C.brit }}>ACCOUNT 2 · PRIVATE JOHN SHAW & A DESERTER</div>
      <div style={{ height: 3, background: C.brit, margin: '12px 0 18px' }} />
      <Typed text={'Tanacharison stepped up to the wounded officer and killed him with a hatchet.'} a={6} b={wf(37, 'hatchet') + 6} size={40} font="quill" />
    </Card>
  </AbsoluteFill>
);
// 38 Washington's brief accounts
export const S38: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Parchment dark={0.5} />
      <Card at={2} x={420} y={140} w={1080} rot={-1} from="bottom" tilt={30} pad={46}>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: C.dim }}>WASHINGTON'S DIARY · MAY 1754</div>
        <Typed text={'"...the Action, which only lasted a Quarter of an Hour, before the Enemy was routed. We killed Mr. de Jumonville, the commander..."'} a={8} b={wf(38, 'brief') + 30} size={36} font="quill" />
      </Card>
      <Card at={wf(38, 'historian') - 6} x={980} y={640} w={640} rot={2.5} from="right" pad={28}>
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 28 }}>Historian Fred Anderson: the accounts were compressed to obscure what happened after the shooting.</div>
      </Card>
      {f < 0 && <div />}
    </AbsoluteFill>
  );
};
// 39 diplomat or spy
export const S39: React.FC = () => {
  const f = useCurrentFrame();
  const r = useRise(2);
  const sp = wf(39, 'spy'), di = wf(39, 'diplomat');
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(90deg, rgba(46,79,134,${0.75 * lin(f, di - 6, di + 6)}) 0 50%, rgba(162,51,36,${0.75 * lin(f, sp - 6, sp + 6)}) 50% 100%)` }} />
      <Parchment dark={0.35} />
      <AbsoluteFill style={{ background: `linear-gradient(90deg, rgba(46,79,134,${0.45 * lin(f, di - 6, di + 6)}) 0 50%, rgba(162,51,36,${0.45 * lin(f, sp - 6, sp + 6)}) 50% 100%)`, mixBlendMode: 'multiply' }} />
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}><CastDefs /><Person who="jumonville" x={960} y={1260} s={1.95} rise={r} /></svg>
      <div style={{ position: 'absolute', left: 120, top: 300, width: 520, textAlign: 'center', opacity: lin(f, di - 4, di + 8) }}>
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 30, color: C.beige }}>TO THE FRENCH</div>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 110, color: C.paper, letterSpacing: 6 }}>DIPLOMAT</div>
        <div style={{ fontFamily: TYPE, fontSize: 28, color: C.beige }}>murdered on a peaceful mission</div>
      </div>
      <div style={{ position: 'absolute', right: 120, top: 300, width: 520, textAlign: 'center', opacity: lin(f, sp - 4, sp + 8) }}>
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 30, color: C.beige }}>TO THE VIRGINIANS</div>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 110, color: C.paper, letterSpacing: 6 }}>SPY</div>
        <div style={{ fontFamily: TYPE, fontSize: 28, color: C.beige }}>shadowing their camp</div>
      </div>
    </AbsoluteFill>
  );
};
// 40 the truth may never be known
export const S40: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Plate src="assets/backgrounds/glen_dawn.jpg" dur={D(40)} from={[0, 0, 1.06]} to={[0, 0, 1.0]} grade={`sepia(0.4) brightness(${0.6 - 0.25 * ease(f, 0, D(40))})`} />
      <Mist o={0.6} y={55} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 420, textAlign: 'center', fontFamily: 'Playfair', fontStyle: 'italic', fontWeight: 700, fontSize: 76, color: C.paper, opacity: lin(f, 10, 26) * (1 - lin(f, D(40) - 30, D(40) - 14)), textShadow: '0 4px 20px #000' }}>The truth may never be known.</div>
    </AbsoluteFill>
  );
};
