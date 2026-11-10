import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { CastDefs, Person, Soldier, useRise } from './components/Cast';
import { PaperCard, Stamp, Typed } from './components/ArchivalDocument';
import { Camera, Parchment } from './components/DocumentaryStage';
import { Map, lerpView } from './components/Maps';
import { Headline, Note, Timeline } from './components/TextOverlay';
import { C, HEAD, MONO, PHRASES, SCENES, TYPE, ease, hash01, lin, sec, wf } from './theme';

const D = (n: number) => SCENES[n - 1].frames + 10;

/** Painted plate with a slow camera move. */
const Plate: React.FC<{ src: string; n: number; from?: number; to?: number; y0?: number; y1?: number; grade?: string }> = ({ src, n, from = 1.05, to = 1.14, y0 = 0, y1 = 0, grade = 'sepia(0.35) brightness(0.8) contrast(1.08)' }) => {
  const f = useCurrentFrame(); const e = ease(f, 0, D(n));
  return <AbsoluteFill style={{ overflow: 'hidden' }}><Img src={staticFile(`assets/backgrounds/${src}.jpg`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `translateY(${y0 + (y1 - y0) * e}px) scale(${from + (to - from) * e})`, filter: grade }} /></AbsoluteFill>;
};
/** Soft musket smoke + flash. */
const Smoke: React.FC<{ at: number; x: number; y: number; dir?: 1 | -1; s?: number }> = ({ at, x, y, dir = -1, s = 1 }) => {
  const f = useCurrentFrame(); const t = f - at; if (t < 0 || t > 100) return null;
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs><filter id={`sm${at}${x}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={8 * s + 3} /></filter></defs>
      {t < 4 && <circle cx={x} cy={y} r={26 * s} fill="#fff4cc" opacity={1 - t / 4} />}
      <g filter={`url(#sm${at}${x})`}>{Array.from({ length: 6 }, (_, i) => <circle key={i} cx={x + dir * (16 + i * 18 * Math.min(1, t / 30) + t * 0.5) * s} cy={y - i * 5 - t * 0.3} r={(12 + i * 5 + t * 0.45) * s} fill="rgba(228,222,208,0.55)" opacity={Math.max(0, 0.9 - t / 100)} />)}</g>
    </svg>
  );
};
/** Calendar page with a flipping day. */
const Calendar: React.FC<{ month: string; day: number; year: string; x: number; y: number; w?: number; color?: string; o?: number }> = ({ month, day, year, x, y, w = 360, color = C.red, o = 1 }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, opacity: o, background: `url(${staticFile('assets/backgrounds/paper.jpg')}) center/cover`, boxShadow: '0 20px 50px rgba(0,0,0,0.55)', border: '3px solid #2a1c10', textAlign: 'center' }}>
    <div style={{ background: color, color: '#fff', fontFamily: MONO, fontSize: w * 0.085, letterSpacing: 8, padding: '8px 0' }}>{month}</div>
    <div style={{ fontFamily: 'Playfair', fontWeight: 900, fontSize: w * 0.5, lineHeight: 1.05, color: C.ink }}>{day}</div>
    <div style={{ fontFamily: MONO, fontSize: w * 0.12, letterSpacing: 8, color: C.ink, paddingBottom: 12 }}>{year}</div>
  </div>
);
const Big: React.FC<{ at: number; n: number; label: string; x: number; y: number; color?: string; size?: number; w?: number }> = ({ at, n, label, x, y, color = C.paper, size = 170, w = 480 }) => {
  const f = useCurrentFrame(); const o = lin(f, at, at + 8); if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, textAlign: 'center', opacity: o, transform: `scale(${0.85 + 0.15 * ease(f, at, at + 12)})` }}>
      <div style={{ fontFamily: 'Playfair', fontWeight: 900, fontSize: size, color, lineHeight: 1, textShadow: '0 6px 24px rgba(0,0,0,0.85)' }}>{Math.round(n * ease(f, at, at + 26)).toLocaleString('en-US')}</div>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 36, letterSpacing: 4, color: C.beige, textShadow: '0 2px 10px #000' }}>{label}</div>
    </div>
  );
};

// 1 hook: the dates that don't add up
export const N01: React.FC = () => {
  const f = useCurrentFrame();
  const af = wf(1, 'after'), tr = wf(1, 'treaty');
  return (
    <AbsoluteFill>
      <Plate src="field_dawn" n={1} grade="sepia(0.4) brightness(0.5) contrast(1.1)" />
      <Headline text="Battle of New Orleans" sub="THE WAR OF 1812" at={2} y={230} size={92} dark={false} />
      <div style={{ opacity: lin(f, tr - 8, tr) }}><Calendar month="DECEMBER" day={24} year="1814" x={110} y={620} w={380} color={C.us} /></div>
      <div style={{ position: 'absolute', left: 110, top: 1150, width: 380, textAlign: 'center', fontFamily: HEAD, fontWeight: 700, fontSize: 40, letterSpacing: 4, color: C.paper, opacity: lin(f, tr - 4, tr + 4) }}>PEACE SIGNED</div>
      <div style={{ opacity: lin(f, af - 6, af + 2) }}><Calendar month="JANUARY" day={8} year="1815" x={590} y={620} w={380} color={C.brit} /></div>
      <div style={{ position: 'absolute', left: 590, top: 1150, width: 380, textAlign: 'center', fontFamily: HEAD, fontWeight: 700, fontSize: 40, letterSpacing: 4, color: C.paper, opacity: lin(f, af, af + 8) }}>THE BATTLE</div>
    </AbsoluteFill>
  );
};
// 2 the Treaty of Ghent
export const N02: React.FC = () => {
  const f = useCurrentFrame();
  const g = wf(2, 'ghent'), si = wf(2, 'signed');
  return (
    <AbsoluteFill>
      <Map view={lerpView({ lon: -30, lat: 42, k: 16 }, { lon: -12, lat: 46, k: 20 }, ease(f, 0, D(2)))} world pins={[{ at: 'ghent', label: 'Ghent', o: lin(f, g - 6, g + 4) }, { at: 'washington', label: 'Washington', o: lin(f, 10, 20), color: C.us, side: 'l' }]} />
      <PaperCard at={si - 14} x={140} y={300} w={800} rot={-1.5} from="bottom" tilt3d={35}>
        <div style={{ fontFamily: 'Playfair', fontWeight: 900, fontSize: 46, color: C.ink }}>Treaty of Peace and Amity</div>
        <div style={{ fontFamily: TYPE, fontSize: 24, color: C.dim, margin: '6px 0 14px' }}>between His Britannic Majesty and the United States of America</div>
        <Typed text={'Done in triplicate at Ghent,\nthe twenty-fourth day of December, 1814.'} a={si - 8} b={si + 26} size={32} />
      </PaperCard>
      <Stamp text="Signed" at={si + 4} x={760} y={720} size={70} rot={-8} />
    </AbsoluteFill>
  );
};
// 3 the news is at sea: ship crossing while the calendar runs on
export const N03: React.FC = () => {
  const f = useCurrentFrame();
  const t = ease(f, 6, D(3));
  const day = Math.round(24 + 15 * t); const mo = day > 31 ? 'JANUARY' : 'DECEMBER'; const dd = day > 31 ? day - 31 : day;
  return (
    <AbsoluteFill>
      <Map view={{ lon: -36, lat: 44, k: 18 }} world>
        {(P) => {
          const a = P(3.72, 51.05), b = P(-74, 40.7); const q = 0.42 * t; const x = a[0] + (b[0] - a[0]) * q, y = a[1] + (b[1] - a[1]) * q - 120 * Math.sin(Math.PI * q);
          return (
            <g>
              <path d={`M${a[0]},${a[1]} Q${(a[0] + b[0]) / 2},${Math.min(a[1], b[1]) - 240} ${b[0]},${b[1]}`} fill="none" stroke={C.ink} strokeWidth={3} strokeDasharray="8 10" opacity={0.6} />
              <g transform={`translate(${x},${y + 4 * Math.sin(f / 6)}) scale(-1.4,1.4)`}><path d="M-30,0 L30,0 L20,14 L-22,14 Z" fill="#3a2614" /><path d="M-4,0 L-4,-48 M10,0 L10,-40" stroke="#3a2614" strokeWidth={3} /><path d="M-4,-46 L-24,-10 L-4,-10 Z M10,-38 L26,-8 L10,-8 Z" fill="#efe6d2" stroke="#3a2614" strokeWidth={2} /></g>
              <text x={x} y={y + 70} textAnchor="middle" fontFamily={TYPE} fontWeight={700} fontSize={30} fill={C.ink} stroke="#efe6d2" strokeWidth={6} style={{ paintOrder: 'stroke' }}>news of peace: still at sea</text>
            </g>
          );
        }}
      </Map>
      <Calendar month={mo} day={dd} year={day > 31 ? '1815' : '1814'} x={360} y={220} w={360} color={day >= 39 ? C.brit : C.us} />
      <PaperCard at={wf(3, 'america') - 6} x={190} y={1080} w={700} rot={2} from="bottom">
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 48, letterSpacing: 3, color: C.ink, textAlign: 'center' }}>IN AMERICA, NO ONE KNEW</div>
      </PaperCard>
    </AbsoluteFill>
  );
};
// 4 the British land near New Orleans
export const N04: React.FC = () => {
  const f = useCurrentFrame();
  const v = lerpView({ lon: -89.6, lat: 29.6, k: 210 }, { lon: -89.85, lat: 29.95, k: 420 }, ease(f, 0, D(4)));
  return (
    <AbsoluteFill>
      <Map view={v} routes={[{ pts: [[-88.9, 29.6], [-89.25, 29.95], 'borgne', [-89.75, 30.0], 'landing'], p: ease(f, 4, D(4) - 20), color: C.brit, width: 10, march: true, label: '≈8,000 British' }]}
        pins={[{ at: 'neworleans', label: 'New Orleans', o: 1, color: C.us, side: 'l' }]}
        labels={[{ at: [-89.65, 30.25], text: 'LAKE BORGNE', o: 0.8, size: 34, color: '#2e5568', italic: true }, { at: [-90.25, 29.7], text: 'MISSISSIPPI R.', o: 0.8, size: 30, color: '#2e5568', italic: true }]} />
      <Note text="VETERANS OF THE WARS AGAINST NAPOLEON" at={wf(4, 'veterans') - 4} x={110} y={260} size={26} />
    </AbsoluteFill>
  );
};
// 5 Andrew Jackson and his army of everyone
const GROUPS: [string, string][] = [['regulars', 'U.S. REGULARS'], ['militia', 'TENNESSEE & KENTUCKY MILITIA'], ['black', 'FREE MEN OF COLOR'], ['choctaw', 'CHOCTAW WARRIORS'], ['lafittes', "JEAN LAFITTE'S PIRATES"]];
export const N05: React.FC = () => {
  const f = useCurrentFrame();
  const r = useRise(2);
  return (
    <AbsoluteFill>
      <Plate src="swamp_fog" n={5} grade="sepia(0.45) brightness(0.42) blur(3px)" />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}><CastDefs /><Person who="jackson" x={540} y={1440} s={1.75} rise={r} /></svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 210, textAlign: 'center', opacity: lin(f, 8, 18) }}>
        <div style={{ fontFamily: 'Playfair', fontWeight: 900, fontSize: 84, color: C.paper, textShadow: '0 4px 20px #000' }}>Andrew Jackson</div>
        <div style={{ height: 6, width: 320, background: C.red, margin: '12px auto' }} />
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 30, color: C.beige }}>MAJOR GENERAL · ≈5,700 MEN</div>
      </div>
      {GROUPS.map(([w, t], i) => { const at = wf(5, w) - 4; const o = lin(f, at, at + 6); if (o <= 0) return null;
        return <div key={w} style={{ position: 'absolute', left: i % 2 ? 560 : 80, top: 440 + Math.floor(i / 2) * 84, width: 440, opacity: o, transform: `translateX(${(1 - o) * (i % 2 ? 60 : -60)}px)`, background: 'rgba(239,230,210,0.94)', borderLeft: `8px solid ${C.us}`, padding: '10px 16px', fontFamily: HEAD, fontWeight: 700, fontSize: 30, letterSpacing: 2, color: C.ink, boxShadow: '0 8px 20px rgba(0,0,0,0.4)' }}>{t}</div>; })}
    </AbsoluteFill>
  );
};

/** Top-down schematic of the Chalmette field: the Mississippi on the left, Line Jackson (canal + mud rampart) across, swamp on the right. */
const Field: React.FC<{ build: number; adv: number; fire: number; fall: number; showCity?: number }> = ({ build, adv, fire, fall, showCity = 0 }) => {
  const f = useCurrentFrame();
  const LY = 700, X0 = 230, X1 = 900;
  const cols = [300, 470, 640, 790];
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      <defs><pattern id="swamp" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M6 18 l6 -12 l6 12 Z" fill="rgba(60,80,40,0.45)" /></pattern></defs>
      <rect x={0} y={0} width={190} height={1920} fill="rgba(80,110,125,0.55)" />
      <text x={95} y={1100} transform="rotate(-90 95 1100)" textAnchor="middle" fontFamily={TYPE} fontStyle="italic" fontWeight={700} fontSize={34} fill="#2e5568">MISSISSIPPI RIVER</text>
      <rect x={X1 + 20} y={0} width={1080 - X1 - 20} height={1920} fill="url(#swamp)" />
      <text x={1000} y={1100} transform="rotate(90 1000 1100)" textAnchor="middle" fontFamily={TYPE} fontWeight={700} fontSize={30} fill="#3a4a2a">CYPRESS SWAMP</text>
      <rect x={X0 - 40} y={LY + 18} width={(X1 - X0 + 60) * build} height={18} fill="rgba(80,110,125,0.7)" />
      <rect x={X0 - 40} y={LY - 26} width={(X1 - X0 + 60) * build} height={40} fill="#6b4a2a" stroke="#2a1a0e" strokeWidth={3} />
      {build > 0.95 && Array.from({ length: 8 }, (_, i) => <rect key={i} x={X0 + i * 90} y={LY - 46} width={22} height={22} fill={C.ink} />)}
      {build > 0.9 && <text x={565} y={LY - 70} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={40} letterSpacing={3} fill={C.us} stroke="#efe6d2" strokeWidth={6} style={{ paintOrder: 'stroke' }}>LINE JACKSON</text>}
      {build > 0.9 && <text x={565} y={LY + 76} textAnchor="middle" fontFamily={TYPE} fontWeight={700} fontSize={26} fill={C.ink}>canal + mud rampart</text>}
      {showCity > 0 && <g opacity={showCity}><text x={565} y={250} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={44} fill={C.ink}>↑ NEW ORLEANS</text><text x={565} y={300} textAnchor="middle" fontFamily={TYPE} fontWeight={700} fontSize={30} fill={C.dim}>5 miles</text></g>}
      {cols.map((cx, i) => {
        const y0 = 1700, y = y0 - (y0 - (LY + 160)) * adv;
        return Array.from({ length: 12 }, (_, j) => {
          const row = Math.floor(j / 3), colk = j % 3; const hit = fall > 0 && hash01(i * 12 + j, 3) < fall * 0.8;
          return <rect key={`${i}-${j}`} x={cx - 30 + colk * 22} y={y + row * 24} width={16} height={16} fill={C.brit} opacity={hit ? 0.18 : 1} transform={hit ? `rotate(45 ${cx - 22 + colk * 22} ${y + row * 24 + 8})` : undefined} />;
        });
      })}
      {fire > 0 && fire < 1 && Array.from({ length: 10 }, (_, i) => { const x = X0 + i * 70; const flick = hash01(i, Math.floor(f / 3)) > 0.5; return flick ? <circle key={i} cx={x} cy={LY + 4} r={18} fill="rgba(255,240,200,0.85)" /> : null; })}
      {fire > 0 && <rect x={X0 - 40} y={LY + 30} width={X1 - X0 + 60} height={120 * Math.min(1, fire * 2)} fill="rgba(230,224,210,0.35)" />}
      <text x={1030} y={1880} textAnchor="end" fontFamily={MONO} fontSize={18} fill="rgba(40,28,16,0.6)">SCHEMATIC · POSITIONS APPROXIMATE</text>
    </svg>
  );
};
// 6 they dig in
export const N06: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Parchment />
      <Camera push={0.03 * ease(f, 0, D(6))}><Field build={ease(f, 6, wf(6, 'waited'))} adv={0} fire={0} fall={0} showCity={lin(f, wf(6, 'five') - 6, wf(6, 'five') + 4)} /></Camera>
    </AbsoluteFill>
  );
};
// 7 dawn: redcoats march out of the fog toward the rampart (side view)
export const N07: React.FC = () => {
  const f = useCurrentFrame();
  const gu = wf(7, 'guns');
  return (
    <AbsoluteFill>
      <Plate src="field_dawn" n={7} from={1.1} to={1.2} grade="sepia(0.35) brightness(0.62) contrast(1.1)" />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <g style={{ filter: 'brightness(0.85)' }}>{Array.from({ length: 9 }, (_, i) => <Soldier key={i} kind="redcoat" x={-260 + (i % 5) * 150 + f * 2.1 - Math.floor(i / 5) * 90} y={1230 + Math.floor(i / 5) * 60} s={1.25 + Math.floor(i / 5) * 0.15} pose="walk" phase={i} />)}</g>
        <path d="M760,1260 Q880,1180 1080,1190 L1080,1300 L760,1300 Z" fill="#4a3220" stroke="#1a0e06" strokeWidth={3} />
        <g style={{ filter: 'brightness(0.5)' }}>{[0, 1, 2].map((i) => <Soldier key={i} kind="virginian" x={840 + i * 80} y={1215} s={1.0} pose="kneelAim" flip />)}</g>
      </svg>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(220,215,200,0.25), rgba(0,0,0,0) 50%)' }} />
      {[0, 1, 2].map((i) => <Smoke key={i} at={gu - 2 + i * 3} x={840 + i * 80 - 92} y={1072} />)}
      <div style={{ position: 'absolute', left: 90, top: 220 }}>
        <div style={{ fontFamily: 'Playfair', fontWeight: 900, fontSize: 80, color: C.paper, textShadow: '0 4px 20px #000' }}>January 8, 1815</div>
        <div style={{ height: 6, width: 300 * ease(f, 8, 26), background: C.red, margin: '10px 0' }} />
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 32, color: C.beige }}>DAWN · CHALMETTE, LOUISIANA</div>
      </div>
    </AbsoluteFill>
  );
};
// 8 thirty minutes; 2,000+ British casualties; Pakenham killed
export const N08: React.FC = () => {
  const f = useCurrentFrame();
  const pk = wf(8, 'pakenham');
  const r = useRise(pk - 10);
  return (
    <AbsoluteFill>
      <Parchment />
      <Field build={1} adv={ease(f, 0, 70)} fire={lin(f, 20, D(8) - 10)} fall={ease(f, 30, wf(8, 'captured') + 10)} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 90, textAlign: 'center', fontFamily: MONO, fontSize: 64, color: C.ink }}>{`00:${String(Math.min(30, Math.round(30 * ease(f, 0, wf(8, 'minutes'))))).padStart(2, '0')}`}<span style={{ fontSize: 28, marginLeft: 12 }}>MIN</span></div>
      <Big at={wf(8, 'two') - 6} n={2037} label="BRITISH KILLED, WOUNDED OR CAPTURED" x={70} y={1000} color={C.brit} w={940} size={190} />
      {f >= pk - 10 && (
        <AbsoluteFill style={{ background: `rgba(20,14,8,${0.75 * lin(f, pk - 10, pk)})` }}>
          <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, filter: 'grayscale(0.7)' }}><CastDefs /><Person who="pakenham" x={540} y={1340} s={2.0} rise={r} /></svg>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 260, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Playfair', fontWeight: 900, fontSize: 76, color: C.paper }}>Sir Edward Pakenham</div>
            <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 30, color: C.beige, marginTop: 10 }}>BRITISH COMMANDER</div>
          </div>
          <Stamp text="Killed" at={wf(8, 'dead') - 2} x={540} y={620} size={110} rot={-8} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
// 9 American casualties: 71
export const N09: React.FC = () => {
  const f = useCurrentFrame();
  const s = wf(9, 'seventyone');
  return (
    <AbsoluteFill>
      <Parchment dark={0.55} />
      <div style={{ position: 'absolute', left: 120, right: 120, top: 520 }}>
        {[['BRITISH', 2037, C.brit], ['AMERICAN', 71, C.us]].map(([l, n, c], i) => (
          <div key={l as string} style={{ marginBottom: 70 }}>
            <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 44, letterSpacing: 4, color: C.paper }}>{l as string} <span style={{ color: C.beige }}>{i === 0 || f >= s - 4 ? (n as number).toLocaleString('en-US') : ''}</span></div>
            <div style={{ height: 70, width: `${100 * ((n as number) / 2037) * (i === 0 ? 1 : ease(f, s - 4, s + 10))}%`, minWidth: i === 1 && f >= s - 4 ? 14 : 0, background: c as string, boxShadow: '0 6px 16px rgba(0,0,0,0.5)' }} />
          </div>
        ))}
        <div style={{ fontFamily: TYPE, fontSize: 26, color: C.beige }}>Casualties on 8 January 1815 (killed, wounded, missing). Americans killed: 13.</div>
      </div>
    </AbsoluteFill>
  );
};
// 10 the treaty took effect in February
export const N10: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Parchment />
      <Timeline at={0} p={ease(f, 4, wf(10, 'february') + 8) * (2 / 3)} y={760} hl={2} />
      <Stamp text="In effect: Feb 17, 1815" at={wf(10, 'february')} x={540} y={520} size={64} rot={-6} />
    </AbsoluteFill>
  );
};
// 11 the hero and the president
export const N11: React.FC = () => {
  const f = useCurrentFrame();
  const r = useRise(2);
  const he = wf(11, 'hero'), pr = wf(11, 'president');
  const end = sec(PHRASES[PHRASES.length - 1].end) - SCENES[10].from;
  return (
    <AbsoluteFill>
      <Plate src="river_city" n={11} grade="sepia(0.45) brightness(0.45)" />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}><CastDefs /><Person who="jackson" x={540} y={1360} s={2.15} rise={r} gesture={lin(f, he - 6, he + 6) * 0.45} /></svg>
      <PaperCard at={he - 6} x={140} y={240} w={800} rot={-2} from="bottom">
        <div style={{ fontFamily: 'Playfair', fontWeight: 900, fontSize: 64, textAlign: 'center' }}>"The Hero of New Orleans"</div>
      </PaperCard>
      <Stamp text="7th President · 1829" at={pr} x={540} y={1150} size={72} rot={-5} color={C.us} />
      <AbsoluteFill style={{ background: `rgba(10,6,3,${0.8 * lin(f, end, end + 14)})` }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 820, textAlign: 'center', opacity: lin(f, end + 2, end + 14) }}>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 92, color: C.paper, letterSpacing: 3, lineHeight: 1.05 }}>THE BATTLE<br />AFTER THE PEACE</div>
        <div style={{ height: 8, width: 420, background: C.red, margin: '20px auto' }} />
      </div>
    </AbsoluteFill>
  );
};

export const SCENE_COMPS = [N01, N02, N03, N04, N05, N06, N07, N08, N09, N10, N11];
