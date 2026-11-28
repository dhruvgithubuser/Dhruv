import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { CastDefs, Person, Soldier, useRise } from '../components/Cast';
import { Card, Quote, Stamp, Tally, Timeline, Typed } from '../components/Docs';
import { NAMap, WorldMap, lerpView } from '../components/Maps';
import { Camera, MusketShot, Parchment, Plate, Rain } from '../components/Stage';
import { C, HEAD, MONO, SCENES, TYPE, ease, hash01, lin, wf } from '../theme';
import { D, Spotlight, VIEWS } from './Part1';

const { WIDE, OHIO } = VIEWS;

/** Fort Necessity plan: the round stockade in the low meadow, the wooded high ground within musket range (approximate). */
const FortPlan: React.FC<{ build: number; trees: number; range: number; french: number; rain?: number }> = ({ build, trees, range, french, rain = 0 }) => {
  const f = useCurrentFrame();
  const cx = 960, cy = 590, R = 120;
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
      <defs><radialGradient id="meadow"><stop offset="0" stopColor="rgba(110,125,82,0.35)" /><stop offset="1" stopColor="rgba(110,125,82,0)" /></radialGradient></defs>
      <ellipse cx={cx} cy={cy} rx={620} ry={330} fill="url(#meadow)" />
      {Array.from({ length: 160 }, (_, i) => {
        const a = (i / 160) * Math.PI * 2; const rr = 470 + 120 * hash01(i, 3);
        const x = cx + rr * Math.cos(a) * 1.3, y = cy + rr * Math.sin(a) * 0.68;
        const r = 9 + 7 * hash01(i, 4);
        return <g key={i} opacity={0.75 * trees}><path d={`M${x},${y - r * 2.2} L${x + r},${y} L${x - r},${y} Z`} fill="#4b5a3a" stroke="#2e3a22" strokeWidth={1.5} /><rect x={x - 1.5} y={y} width={3} height={6} fill="#4a3220" /></g>;
      })}
      {trees > 0 && <text x={cx + 600} y={cy - 310} fontFamily={TYPE} fontWeight={700} fontSize={26} fill="#3a4a2a" opacity={trees}>WOODED HIGH GROUND</text>}
      {Array.from({ length: 40 }, (_, i) => { const a = (i / 40) * Math.PI * 2; const o = lin(build * 40, i, i + 1); return <rect key={i} x={cx + R * Math.cos(a) - 7} y={cy + R * Math.sin(a) - 7} width={14} height={14} fill="#6b4a2a" stroke="#2a1a0e" strokeWidth={2} opacity={o} />; })}
      {build > 0.9 && <text x={cx} y={cy + 8} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={32} letterSpacing={2} fill={C.brit}>FORT NECESSITY</text>}
      {range > 0 && <circle cx={cx} cy={cy} r={R + 320 * range} fill="none" stroke={C.red} strokeWidth={4} strokeDasharray="16 10" opacity={0.9} />}
      {range > 0.8 && <text x={cx + R + 330} y={cy + 30} fontFamily={TYPE} fontWeight={700} fontSize={26} fill={C.red}>musket range</text>}
      {french > 0 && Array.from({ length: 16 }, (_, i) => { const a = Math.PI * (-0.9 + 0.8 * (i / 15)); const x = cx + 560 * Math.cos(a) * 1.15, y = cy + 300 * Math.sin(a) * 0.9 + 60;
        return <g key={i} opacity={lin(french * 16, i, i + 1)}><rect x={x - 10} y={y - 10} width={20} height={20} fill={C.fr} stroke="#efe6d2" strokeWidth={3} transform={`rotate(45 ${x} ${y})`} />{rain > 0 && hash01(i, Math.floor(f / 6)) > 0.8 && <circle cx={x} cy={y} r={18} fill="rgba(240,235,220,0.7)" />}</g>; })}
      <path d={`M${cx - 760},${cy + 300} Q${cx},${cy + 380} ${cx + 760},${cy + 300}`} stroke="#3f6d84" strokeWidth={8} fill="none" opacity={0.7} />
      <text x={1840} y={1010} textAnchor="end" fontFamily={MONO} fontSize={18} fill="rgba(40,28,16,0.6)">GREAT MEADOWS · SCHEMATIC</text>
    </svg>
  );
};

// 41 Fort Necessity goes up
export const S41: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Parchment />
      <Camera push={0.03 * ease(f, 0, D(41))}><FortPlan build={ease(f, wf(41, 'stockade') - 10, wf(41, 'necessity') + 10)} trees={0.4} range={0} french={0} /></Camera>
      <Card at={wf(41, 'necessity')} x={120} y={110} w={520} rot={-2} from="left" pad={16}>
        <Img src={staticFile('assets/backgrounds/great_meadows.jpg')} style={{ width: '100%', height: 260, objectFit: 'cover', filter: 'sepia(0.4)' }} />
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 20, marginTop: 6 }}>The Great Meadows (illustration)</div>
      </Card>
    </AbsoluteFill>
  );
};
// 42 a poor position; regulars join (~400)
export const S42: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Parchment />
      <FortPlan build={1} trees={lin(f, 4, 30)} range={ease(f, wf(42, 'range') - 10, wf(42, 'range') + 10)} french={0} />
      <Tally at={wf(42, 'regulars')} n={400} label="≈ MEN AT THE FORT" x={1400} y={760} color={C.brit} size={110} />
      <div style={{ position: 'absolute', left: 110, top: 70, fontFamily: HEAD, fontWeight: 700, fontSize: 48, letterSpacing: 4, color: C.red, opacity: lin(f, 6, 16) }}>A POOR POSITION</div>
    </AbsoluteFill>
  );
};
// 43 Louis Coulon de Villiers arrives
export const S43: React.FC = () => {
  const f = useCurrentFrame();
  const br = wf(43, 'brother');
  return (
    <AbsoluteFill>
      <NAMap view={lerpView(OHIO, { lon: -79.8, lat: 40.12, k: 700 }, ease(f, 0, 60))} rivers={1}
        routes={[{ pts: ['duquesne', [-79.87, 40.3], [-79.75, 40.1], [-79.65, 39.95], 'necessity'], p: ease(f, 4, 70), color: C.fr, width: 12, march: true, label: '≈600 soldiers + 100 warriors' }]}
        pins={[{ at: 'duquesne', label: 'Fort Duquesne', o: 1, color: C.fr, kind: 'fort' }, { at: 'necessity', label: 'Fort Necessity', o: 1, color: C.brit, kind: 'fort', side: 'r' }]} />
      {f >= br - 40 && (
        <AbsoluteFill style={{ opacity: lin(f, br - 40, br - 26) }}>
          <Spotlight n={43} who="louis" name="Louis Coulon de Villiers" lines={["JUMONVILLE'S OLDER BROTHER", '3 JULY 1754']} at={br - 36} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
// 44 rain, wet powder, one in four down
export const S44: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Plate src="assets/backgrounds/meadow_rain.jpg" dur={D(44)} from={[0, 0, 1.1]} to={[0, 0, 1.2]} grade="sepia(0.35) brightness(0.55) contrast(1.1)" />
      {[0, 1, 2, 3, 4, 5].map((i) => <MusketShot key={i} at={10 + i * 23} x={200 + ((i * 337) % 1500)} y={640 + ((i * 47) % 60)} dir={i % 2 ? 1 : -1} s={0.45} />)}
      <Rain o={0.7} n={300} angle={18} />
      <Tally at={wf(44, 'four') - 6} n={4} label="1 IN 4 KILLED OR WOUNDED" x={1380} y={220} size={0} />
      <div style={{ position: 'absolute', left: 1380, top: 210, width: 420, textAlign: 'center', fontFamily: 'Playfair', fontWeight: 900, fontSize: 150, color: C.paper, opacity: lin(f, wf(44, 'four') - 6, wf(44, 'four') + 4), textShadow: '0 6px 24px #000' }}>1 in 4</div>
      <div style={{ position: 'absolute', left: 120, top: 120, fontFamily: TYPE, fontWeight: 700, fontSize: 34, color: C.beige, opacity: lin(f, 10, 24), textShadow: '0 2px 10px #000' }}>GUNPOWDER SOAKED · TRENCHES FLOODED</div>
    </AbsoluteFill>
  );
};
// 45 the only surrender
export const S45: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Plate src="assets/backgrounds/meadow_rain.jpg" dur={D(45)} grade="sepia(0.5) brightness(0.35) blur(3px)" />
      <Rain o={0.45} n={180} />
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <line x1={960} y1={980} x2={960} y2={480 + 30 * (1 - ease(f, 4, 30))} stroke="#3a2a1a" strokeWidth={10} />
        <path d={`M965,${490} Q1080,${500 + 16 * Math.sin(f / 6)} 1190,${490} L1190,${640} Q1080,${650 + 16 * Math.sin(f / 6 + 1)} 965,${640} Z`} fill="#f4f0e6" stroke="#8a8270" strokeWidth={3} opacity={lin(f, 6, 20)} />
      </svg>
      <Stamp text="Surrender" at={wf(45, 'surrendered')} x={600} y={330} size={96} rot={-8} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 150, textAlign: 'center', fontFamily: HEAD, fontWeight: 700, fontSize: 50, letterSpacing: 4, color: C.paper, opacity: lin(f, wf(45, 'only'), wf(45, 'only') + 10), textShadow: '0 3px 14px #000' }}>THE ONLY SURRENDER OF HIS MILITARY CAREER</div>
    </AbsoluteFill>
  );
};
// 46 the terms in French; Van Braam reads them in the rain
export const S46: React.FC = () => {
  const f = useCurrentFrame();
  const r = useRise(wf(46, 'translator') - 10);
  return (
    <AbsoluteFill>
      <Plate src="assets/backgrounds/meadow_rain.jpg" dur={D(46)} grade="sepia(0.5) brightness(0.3) blur(4px)" />
      <Card at={2} x={1020} y={140} w={760} rot={2} from="right" tilt={30} pad={40}>
        <div style={{ fontFamily: 'Playfair', fontWeight: 900, fontSize: 40 }}>Capitulation</div>
        <div style={{ fontFamily: TYPE, fontSize: 20, color: C.dim, marginBottom: 10 }}>accordée par le Commandant des troupes de S.M.T.C. ... 3 juillet 1754</div>
        <Typed text={'Comme notre intention n\'a jamais été de troubler la paix et la bonne harmonie... mais seulement de venger l\'assassin qui a été fait sur un de nos officiers, porteur d\'une sommation...'} a={6} b={D(46) - 20} size={26} font="quill" />
      </Card>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}><CastDefs /><Person who="vanbraam" x={520} y={1270} s={1.9} rise={r} talk={lin(f, wf(46, 'read') - 4, wf(46, 'read'))} /></svg>
      {f >= wf(46, 'translator') - 4 && <div style={{ position: 'absolute', left: 140, top: 140, opacity: lin(f, wf(46, 'translator') - 4, wf(46, 'translator') + 8) }}>
        <div style={{ fontFamily: 'Playfair', fontWeight: 900, fontSize: 56, color: C.paper }}>Jacob Van Braam</div>
        <div style={{ height: 6, width: 220, background: C.red, margin: '10px 0' }} />
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 28, color: C.beige }}>DUTCH-BORN TRANSLATOR</div>
      </div>}
      <Rain o={0.5} n={200} />
    </AbsoluteFill>
  );
};
// 47 "assassinat"
export const S47: React.FC = () => {
  const f = useCurrentFrame();
  const w = wf(47, 'assassination');
  const z = ease(f, w - 6, w + 16);
  return (
    <AbsoluteFill style={{ background: '#1d1b19' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${1 + 0.6 * z})`, transformOrigin: '52% 50%' }}>
        <Card at={0} x={360} y={200} w={1200} rot={-1} pad={50}>
          <div style={{ fontFamily: 'Playfair', fontStyle: 'italic', fontWeight: 700, fontSize: 40, lineHeight: 1.5, color: C.ink }}>
            ...mais seulement de venger l'<span style={{ background: `rgba(192,57,43,${0.35 * z})`, color: z > 0.3 ? C.red : C.ink, outline: z > 0.5 ? `4px solid ${C.red}` : 'none', padding: '0 6px' }}>assassin</span> qui a été fait sur un de nos officiers, porteur d'une sommation, et sur son escorte...
          </div>
          <div style={{ marginTop: 26, fontFamily: 'Playfair', fontStyle: 'italic', fontWeight: 700, fontSize: 46 }}>G<sup>o</sup> Washington &nbsp;·&nbsp; James Mackay</div>
        </Card>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 150, textAlign: 'center', fontFamily: HEAD, fontWeight: 700, fontSize: 52, letterSpacing: 4, color: C.paper, opacity: lin(f, wf(47, 'signed'), wf(47, 'signed') + 10), textShadow: '0 3px 14px #000' }}>HE HAD SIGNED AN ADMISSION OF "ASSASSINATION"</div>
    </AbsoluteFill>
  );
};
// 48 July 4, 1754 ... and 22 years later
export const S48: React.FC = () => {
  const f = useCurrentFrame();
  const flip = wf(48, 'declaration');
  const yr = Math.round(1754 + 22 * ease(f, flip - 20, flip + 4));
  return (
    <AbsoluteFill>
      <Parchment dark={0.4} />
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, filter: 'brightness(0.55)' }}>
        {Array.from({ length: 8 }, (_, i) => <Soldier key={i} kind="virginian" x={-200 + i * 130 + f * 1.5} y={1000} s={1} pose="walk" phase={i} />)}
      </svg>
      <div style={{ position: 'absolute', left: 660, top: 170, width: 600, background: `url(${staticFile('assets/backgrounds/paper.jpg')}) center/cover`, boxShadow: '0 24px 60px rgba(0,0,0,0.6)', textAlign: 'center' }}>
        <div style={{ background: C.red, color: '#fff', fontFamily: MONO, fontSize: 32, letterSpacing: 10, padding: '10px 0' }}>JULY</div>
        <div style={{ fontFamily: 'Playfair', fontWeight: 900, fontSize: 250, lineHeight: 1.05, color: C.ink }}>4</div>
        <div style={{ fontFamily: MONO, fontSize: 64, letterSpacing: 12, color: yr === 1776 ? C.red : C.ink, paddingBottom: 18 }}>{yr}</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 860, textAlign: 'center', fontFamily: HEAD, fontWeight: 700, fontSize: 46, letterSpacing: 4, color: C.paper, opacity: lin(f, flip, flip + 10) }}>22 YEARS TO THE DAY · THE DECLARATION OF INDEPENDENCE</div>
    </AbsoluteFill>
  );
};
// 49 printed across Europe
export const S49: React.FC = () => {
  const f = useCurrentFrame();
  const P = (lon: number, lat: number) => [960 + (lon - 6) * 30, 540 - (lat - 49) * 30];
  const cities: [string, number, number][] = [['Paris', 2.35, 48.86], ['London', -0.13, 51.5], ['Amsterdam', 4.9, 52.37], ['Vienna', 16.37, 48.21], ['Madrid', -3.7, 40.42], ['Berlin', 13.4, 52.52], ['Rome', 12.5, 41.9]];
  const [px, py] = P(2.35, 48.86);
  return (
    <AbsoluteFill>
      <WorldMap k={30} lon={6} lat={49} lit={[]} />
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {cities.slice(1).map(([n, lo, la], i) => {
          const [x, y] = P(lo, la); const p = ease(f, 10 + i * 8, 40 + i * 8);
          const qx = px + (x - px) * p, qy = py + (y - py) * p - 80 * Math.sin(Math.PI * p);
          return <g key={n}><path d={`M${px},${py} Q${(px + x) / 2},${Math.min(py, y) - 80} ${x},${y}`} fill="none" stroke={C.red} strokeWidth={2} strokeDasharray="6 8" opacity={p} />
            <rect x={qx - 18} y={qy - 24} width={36} height={48} fill="#efe6d2" stroke={C.ink} strokeWidth={2} transform={`rotate(${10 * Math.sin(f / 5 + i)} ${qx} ${qy})`} />
            {p > 0.95 && <text x={x} y={y + 50} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={26} fill={C.ink} stroke="#efe6d2" strokeWidth={5} style={{ paintOrder: 'stroke' }}>{n}</text>}</g>;
        })}
        <circle cx={px} cy={py} r={14} fill={C.fr} stroke="#efe6d2" strokeWidth={3} />
      </svg>
      <Card at={4} x={110} y={110} w={460} rot={-2} from="left" pad={30}>
        <div style={{ fontFamily: 'Playfair', fontWeight: 900, fontSize: 52 }}>MÉMOIRE</div>
        <div style={{ fontFamily: TYPE, fontSize: 22, color: C.dim }}>contenant le précis des faits... (Paris, 1756), with Washington's captured journal</div>
      </Card>
    </AbsoluteFill>
  );
};

// 50 Braddock, 1755
export const S50: React.FC = () => {
  const f = useCurrentFrame();
  const dft = wf(50, 'defeats');
  return (
    <AbsoluteFill>
      <NAMap view={lerpView(OHIO, { lon: -79.4, lat: 40.0, k: 330 }, ease(f, 0, D(50)))} rivers={1}
        routes={[{ pts: ['willscreek', [-79.2, 39.75], 'meadows', [-79.7, 40.1], 'monongahela'], p: ease(f, 10, dft), color: C.brit, width: 12, march: true, label: 'Braddock · 1755' }]}
        pins={[{ at: 'duquesne', label: 'Fort Duquesne', o: 1, color: C.fr, kind: 'fort' }, { at: 'monongahela', label: 'Monongahela', o: lin(f, dft - 4, dft + 6), kind: 'x', side: 'l' }]} />
      <Stamp text="Disaster · 9 July 1755" at={dft} x={1380} y={250} size={56} rot={-6} />
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}><CastDefs /><Person who="braddock" x={330} y={1260} s={1.45} rise={1} /></svg>
    </AbsoluteFill>
  );
};
// 51 the Seven Years' War, worldwide
export const S51: React.FC = () => {
  const f = useCurrentFrame();
  const keys = ['america', 'europe', 'caribbean', 'india', 'africa', 'philippines'];
  const at = [wf(51, 'north'), wf(51, 'europe'), wf(51, 'caribbean'), wf(51, 'india'), wf(51, 'africa'), wf(51, 'philippines')];
  const lit = [0, 1, 2, 3, 4, 5, 6].map((i) => (i < 6 ? lin(f, at[i] - 6, at[i] + 4) : lin(f, at[5] + 8, at[5] + 16)));
  return (
    <AbsoluteFill>
      <WorldMap lit={lit} spark={1} k={5.4} lon={-10} lat={20} />
      <Card at={2} x={110} y={760} w={760} rot={-1} from="left" pad={24}>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 34, letterSpacing: 2 }}><span style={{ color: C.brit }}>BRITAIN · PRUSSIA</span> <span style={{ color: C.dim }}>vs</span> <span style={{ color: C.fr }}>FRANCE · AUSTRIA · RUSSIA</span></div>
        <div style={{ fontFamily: TYPE, fontSize: 22, color: C.dim }}>The Seven Years' War, 1756–1763 (Spain joined France in 1762)</div>
      </Card>
      {keys.length === 0 && <div />}
    </AbsoluteFill>
  );
};
// 52 Walpole
export const S52: React.FC = () => (
  <AbsoluteFill>
    <Plate src="assets/backgrounds/glen_dawn.jpg" dur={D(52)} grade="sepia(0.55) brightness(0.32) blur(4px)" />
    <Quote at={wf(52, 'the') - 6} text="The volley fired by a young Virginian in the backwoods of America set the world on fire." by="HORACE WALPOLE" dur={wf(52, 'fire') - wf(52, 'the') + 12} size={58} />
  </AbsoluteFill>
);
// 53 1763: France loses its North American empire
export const S53: React.FC = () => {
  const f = useCurrentFrame();
  const t = ease(f, wf(53, 'canada') - 10, wf(53, 'canada') + 20);
  return (
    <AbsoluteFill>
      <NAMap view={WIDE} colonies={1} newFrance={1} treaty={t} rivers={1}
        labels={[{ at: [-87.5, 44], text: t > 0.5 ? 'TO BRITAIN' : 'NEW FRANCE', o: 1, size: 52, color: t > 0.5 ? C.brit : C.fr }, { at: [-96, 34], text: 'LOUISIANA (WEST) → SPAIN', o: lin(f, wf(53, 'almost'), wf(53, 'almost') + 10), size: 32, color: '#9a7a1a' }]} />
      <Card at={2} x={1300} y={110} w={480} rot={2} from="right" pad={28}>
        <div style={{ fontFamily: 'Playfair', fontWeight: 900, fontSize: 46 }}>Treaty of Paris</div>
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 26, color: C.red }}>10 FEBRUARY 1763</div>
      </Card>
    </AbsoluteFill>
  );
};
// 54 Pontiac's War
export const S54: React.FC = () => {
  const f = useCurrentFrame();
  const pw = wf(54, 'pontiacs');
  const forts: [string, [number, number]][] = [['Detroit', [-83.05, 42.33]], ['Fort Pitt', [-80.01, 40.44]], ['Michilimackinac', [-84.73, 45.78]], ['Presque Isle', [-80.08, 42.13]], ['Venango', [-79.83, 41.4]], ['Le Boeuf', [-79.98, 41.93]]];
  return (
    <AbsoluteFill>
      <NAMap view={lerpView(WIDE, { lon: -82, lat: 42, k: 90 }, ease(f, 0, D(54)))} nations={1} rivers={1} colonies={1}
        routes={[{ pts: [[-77.5, 39.8], [-79.0, 40.1], [-80.4, 40.3]], p: ease(f, 10, 50), color: C.brit, width: 8, label: 'settlers' }]}
        pins={forts.map(([n, at], i) => ({ at, label: n, o: lin(f, pw - 10 + i * 4, pw + i * 4), kind: 'x' as const, color: C.red }))}
        labels={[{ at: [-85.5, 39.2], text: "PONTIAC'S WAR · 1763", o: lin(f, pw - 4, pw + 8), size: 50, color: C.red }]} />
    </AbsoluteFill>
  );
};
// 55 debt and taxes
export const S55: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Parchment dark={0.3} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 120, textAlign: 'center', fontFamily: HEAD, fontWeight: 700, fontSize: 64, letterSpacing: 6, color: C.ink, opacity: lin(f, 4, 14) }}>A WAR TO PAY FOR</div>
      <Card at={wf(55, 'sugar') - 6} x={300} y={330} w={560} rot={-3} from="left" tilt={30} pad={36}><div style={{ fontFamily: 'Playfair', fontWeight: 900, fontSize: 58 }}>The Sugar Act</div><div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 30, color: C.red }}>1764</div></Card>
      <Card at={wf(55, 'stamp') - 6} x={1060} y={380} w={560} rot={3} from="right" tilt={30} pad={36}><div style={{ fontFamily: 'Playfair', fontWeight: 900, fontSize: 58 }}>The Stamp Act</div><div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 30, color: C.red }}>1765</div></Card>
      <Stamp text="Taxed" at={wf(55, 'stamp') + 10} x={960} y={760} size={90} rot={-6} />
    </AbsoluteFill>
  );
};
// 56 1775: Washington commands
export const S56: React.FC = () => {
  const f = useCurrentFrame();
  const r = useRise(wf(56, 'man') - 10);
  return (
    <AbsoluteFill>
      <Parchment dark={0.15} />
      <Timeline at={2} p={ease(f, 4, wf(56, '1775') + 6) * (7 / 8)} y={110} hl={7} />
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}><CastDefs /><Person who="washington1775" x={620} y={1280} s={1.75} rise={r} /></svg>
      <div style={{ position: 'absolute', left: 1000, top: 420, opacity: lin(f, wf(56, 'george') - 6, wf(56, 'george') + 6) }}>
        <div style={{ fontFamily: 'Playfair', fontWeight: 900, fontSize: 70, color: C.ink }}>George Washington</div>
        <div style={{ height: 6, width: 300, background: C.red, margin: '14px 0' }} />
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 32, color: C.ink }}>COMMANDER IN CHIEF</div>
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 32, color: C.ink }}>CONTINENTAL ARMY · 1775</div>
      </div>
    </AbsoluteFill>
  );
};
// 57 recap
export const S57: React.FC = () => {
  const f = useCurrentFrame();
  const a = wf(57, 'ambush'), o = wf(57, 'officer'), s = wf(57, 'signature');
  return (
    <AbsoluteFill style={{ background: '#1d1b19' }}>
      {[['assets/backgrounds/glen_dawn.jpg', a, 'A 15-MINUTE AMBUSH'], ['assets/backgrounds/forest_night_rain.jpg', o, 'A DEAD FRENCH OFFICER'], ['assets/backgrounds/meadow_rain.jpg', s, 'A SIGNATURE']].map(([src, at, t], i) => (
        <div key={i} style={{ position: 'absolute', left: 80 + i * 600, top: 220, width: 560, opacity: lin(f, (at as number) - 6, (at as number) + 4), transform: `rotate(${(i - 1) * 2}deg)`, background: '#f4eedf', padding: 14, boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
          <Img src={staticFile(src as string)} style={{ width: '100%', height: 360, objectFit: 'cover', filter: 'sepia(0.5)' }} />
          <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 34, letterSpacing: 3, marginTop: 10, textAlign: 'center' }}>{t as string}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
// 58 from that moment: world war, the end of French America, independence
export const S58: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <WorldMap lit={[1, 1, 1, 1, 1, 1, 1].map((_, i) => lin(f, i * 4, i * 4 + 10))} spark={1} k={5.6 - 1.2 * ease(f, 0, D(58))} lon={-30} lat={25} dim={0.1} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 150, textAlign: 'center' }}>
        {[['A WORLD WAR', wf(58, 'world')], ['THE END OF FRENCH AMERICA', wf(58, 'end')], ['THE ROAD TO INDEPENDENCE', wf(58, 'independence')]].map(([t, at], i) => (
          <span key={i} style={{ display: 'inline-block', margin: '0 22px', fontFamily: HEAD, fontWeight: 700, fontSize: 40, letterSpacing: 3, color: C.paper, background: 'rgba(29,27,25,0.82)', padding: '8px 20px', opacity: lin(f, (at as number) - 6, (at as number) + 4) }}>{t as string}</span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
// 59 next time: Braddock
export const S59: React.FC = () => {
  const f = useCurrentFrame();
  const r = useRise(6);
  const end = SCENES[58].frames;
  return (
    <AbsoluteFill>
      <Parchment dark={0.55} />
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}><CastDefs /><Person who="washington" x={560} y={1270} s={1.85} rise={r} /></svg>
      <div style={{ position: 'absolute', left: 980, top: 250 }}>
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 32, letterSpacing: 8, color: C.beige, opacity: lin(f, 4, 14) }}>NEXT TIME</div>
        <div style={{ fontFamily: 'Playfair', fontWeight: 900, fontSize: 78, color: C.paper, lineHeight: 1.05, opacity: lin(f, 10, 24) }}>Four Bullet Holes<br />in His Coat</div>
        <div style={{ height: 8, width: 420 * ease(f, 20, 40), background: C.red, margin: '20px 0' }} />
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 40, letterSpacing: 4, color: C.beige, opacity: lin(f, 30, 44) }}>BRADDOCK'S DEFEAT · 1755</div>
        <div style={{ marginTop: 50, display: 'inline-block', background: C.red, color: '#fff', fontFamily: HEAD, fontWeight: 700, fontSize: 40, letterSpacing: 4, padding: '12px 30px', opacity: lin(f, 60, 74), transform: `scale(${0.9 + 0.1 * Math.abs(Math.sin(f / 12))})` }}>SUBSCRIBE</div>
      </div>
      <AbsoluteFill style={{ background: `rgba(0,0,0,${lin(f, end - 30, end)})` }} />
    </AbsoluteFill>
  );
};
