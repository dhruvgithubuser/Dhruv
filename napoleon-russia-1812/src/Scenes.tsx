import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { Chapter, Chips, DateTag, GOLD, ICE, LowerThird, MONO, Num, Particles, RED, SANS, SERIF, Stat, StatStack, Statement, Still, Thermo, type Move } from './components/Doc';
import { DocMap, PL, lerpView, type View } from './components/DocMap';
import { SCENES, ease, lin, wf } from './theme';

const dur = (n: number) => SCENES[n - 1].frames + 10;
type Atmo = 'snow' | 'embers' | 'dust' | 'smoke' | 'blizzard' | undefined;
const S: React.FC<{ n: number; src: string; move?: Move; grade?: 'cold' | 'warm' | 'fire' | 'night' | 'neutral'; atmo?: Atmo; dark?: number; children?: React.ReactNode }> = ({ n, src, move, grade, atmo, dark, children }) => (
  <AbsoluteFill>
    <Still src={src} dur={dur(n)} move={move} grade={grade} dark={dark} />
    {atmo === 'snow' && <Particles kind="snow" n={150} />}
    {atmo === 'blizzard' && <><Particles kind="snow" n={420} wind={3} /><AbsoluteFill style={{ background: 'rgba(230,240,255,0.12)' }} /></>}
    {atmo === 'embers' && <><Particles kind="embers" n={120} /><Particles kind="smoke" o={0.7} /></>}
    {atmo === 'dust' && <Particles kind="dust" n={110} />}
    {atmo === 'smoke' && <Particles kind="smoke" />}
    {children}
  </AbsoluteFill>
);

const EUROPE: View = { lon: 16, lat: 51, k: 34 };
const CAMPAIGN: View = { lon: 30, lat: 55.2, k: 95 };
const ADVANCE: (string | [number, number])[] = ['kovno', 'vilnius', 'vitebsk', 'smolensk', 'borodino', 'moscow'];
const RETREAT: (string | [number, number])[] = ['moscow', [37.1, 55.3], 'maloyaroslavets', [36.0, 55.3], 'borodino', 'smolensk', 'krasnoi', 'borisov', 'studienka', 'smorgon', 'vilnius', 'kovno'];

/* Minard-style band: widths from the figures on Minard's 1869 chart (main column). */
const MIN_ADV: [number, number, number][] = [[23.9, 54.9, 422000], [25.3, 54.7, 400000], [28.0, 54.9, 280000], [30.2, 55.2, 175000], [32.0, 54.8, 145000], [34.4, 55.5, 127100], [35.8, 55.5, 100000], [37.6, 55.75, 100000]];
const MIN_RET: [number, number, number][] = [[37.6, 55.7, 100000], [36.5, 55.0, 96000], [35.4, 55.3, 87000], [34.3, 55.2, 55000], [33.3, 54.8, 37000], [32.0, 54.6, 24000], [30.4, 54.4, 20000], [28.5, 54.25, 28000], [27.5, 54.5, 20000], [26.4, 54.4, 12000], [25.0, 54.4, 8000], [23.9, 54.85, 10000]];
const Band: React.FC<{ P: (a: number, b: number) => [number, number]; pts: [number, number, number][]; p: number; color: string; scale: number }> = ({ P, pts, p, color, scale }) => {
  if (p <= 0) return null;
  const n = Math.max(2, Math.ceil(pts.length * p));
  const seg = pts.slice(0, n);
  const L: [number, number][] = [], R: [number, number][] = [];
  seg.forEach(([lo, la, w], i) => {
    const [x, y] = P(lo, la); const nx = seg[Math.min(i + 1, seg.length - 1)], px = seg[Math.max(i - 1, 0)];
    const [ax, ay] = P(nx[0], nx[1]); const [bx, by] = P(px[0], px[1]); const dx = ax - bx, dy = ay - by; const l = Math.hypot(dx, dy) || 1;
    const hw = (w / 422000) * scale / 2; L.push([x - (dy / l) * hw, y + (dx / l) * hw]); R.push([x + (dy / l) * hw, y - (dx / l) * hw]);
  });
  const d = [...L, ...R.reverse()].map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join('') + 'Z';
  return <path d={d} fill={color} opacity={0.9} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />;
};

const S01: React.FC = () => <S n={1} src="s01_frozen_bridge" grade="cold" atmo="snow" move={{ s0: 1.18, s1: 1.04, y0: -2, y1: 1 }}><DateTag text="DECEMBER 1812 · THE NIEMEN RIVER" /></S>;
const S02: React.FC = () => { const f = useCurrentFrame(); return <S n={2} src="s02_crossing" grade="warm" atmo="dust" move={{ s0: 1.04, s1: 1.16, x0: 2, x1: -2 }}><DateTag text="JUNE 1812" /><Stat value={<Num from={0} to={450000} at={wf(2, '450000') - 4} dur={40} suffix="+" />} label="soldiers crossed into Russia" at={wf(2, '450000') - 10} y={700} />{f < 0 && null}</S>; };
const S03: React.FC = () => { const f = useCurrentFrame(); return <S n={3} src="s03_cannon_snow" grade="cold" atmo="snow" move={{ s0: 1.1, s1: 1.2 }}><Statement text="Half gone before the first snow" at={wf(3, 'already') - 6} y={430} size={86} color={ICE} />{f < 0 && null}</S>; };
const S04: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <S n={4} src="s04_napoleon_horse" grade="cold" atmo="snow" move={{ s0: 1.02, s1: 1.12, x0: -1, x1: 1 }} dark={0.25}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: lin(f, 30, 50) }}>
        <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 14, color: GOLD, marginBottom: 20 }}>RUSSIA · 1812</div>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 104, color: '#fff', textAlign: 'center', lineHeight: 1.05, textShadow: '0 8px 40px rgba(0,0,0,0.9)', maxWidth: 1500 }}>The Mistake That Cost<br />Napoleon His Empire</div>
      </AbsoluteFill>
    </S>
  );
};
const S05: React.FC = () => <S n={5} src="s05_napoleon_map" grade="warm" move={{ s0: 1.05, s1: 1.18, x0: 1, x1: -1 }}><Chapter num="I" title="Master of Europe" dur={78} /><LowerThird name="Napoleon Bonaparte" role="Emperor of the French" at={wf(5, 'napoleon')} out={wf(5, 'crushed') - 10} /><Chips y={760} items={[{ t: 'Austria ✕', at: wf(5, 'austria') - 2 }, { t: 'Prussia ✕', at: wf(5, 'prussia') - 2 }, { t: 'Russia ✕', at: wf(5, 'russia') - 2 }]} /></S>;
const S06: React.FC = () => <S n={6} src="s06_navy" grade="cold" move={{ s0: 1.06, s1: 1.16, x0: -2, x1: 2 }}><LowerThird name="Great Britain" role="Protected by the Royal Navy" at={wf(6, 'britain') - 4} /></S>;
const PORTS = ['hamburg', 'amsterdam', 'antwerp', 'bordeaux', 'lisbon', 'barcelona', 'genoa', 'venice', 'naples', 'trieste', 'danzig', 'copenhagen', 'riga'];
const S07: React.FC = () => {
  const f = useCurrentFrame(); const cl = wf(7, 'closed');
  return (
    <AbsoluteFill>
      <DocMap view={lerpView(EUROPE, { lon: 10, lat: 50, k: 40 }, ease(f, 0, 240))}
        pins={[{ at: 'london', label: 'BRITAIN', o: 1, color: RED, side: 'l', size: 40, star: true }, { at: 'paris', label: 'PARIS', o: lin(f, 10, 20), side: 'b', size: 32 }]}
        labels={[{ at: [8, 46.5], text: 'FRENCH EMPIRE & ALLIES', o: lin(f, 20, 40), size: 40 }]}>
        {(P) => <g>{PORTS.map((k, i) => { const o = lin(f, cl - 30 + i * 4, cl - 20 + i * 4); if (o <= 0) return null; const [x, y] = P(...PL[k]);
          return <g key={k} opacity={o} transform={`translate(${x},${y}) scale(${o})`}><rect x={-13} y={-6} width={26} height={20} rx={3} fill={RED} stroke="#111" strokeWidth={2} /><path d="M-8,-6 L-8,-14 A8,8 0 0 1 8,-14 L8,-6" fill="none" stroke={RED} strokeWidth={4} /></g>; })}</g>}
      </DocMap>
      <DateTag text="THE CONTINENTAL SYSTEM · 1806" at={4} />
      <Stat value="CLOSED" label="European ports to British trade" at={cl - 6} y={760} color={RED} size={96} />
    </AbsoluteFill>
  );
};
const S08: React.FC = () => <S n={8} src="s08_tsar" grade="neutral" move={{ s0: 1.04, s1: 1.14, y0: 1, y1: -1 }}><LowerThird name="Alexander I" role="Tsar of Russia" at={wf(8, 'russia') - 2} out={wf(8, 'last') - 10} /><DateTag text="31 DECEMBER 1810" at={wf(8, 'last') - 6} /></S>;
const S09: React.FC = () => <S n={9} src="s09_napoleon_window" grade="night" move={{ s0: 1.15, s1: 1.03 }}><Statement text="“Betrayal.”" at={wf(9, 'betrayal') - 4} out={wf(9, 'he') - 10} y={430} size={120} /></S>;
const S10: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <DocMap view={lerpView(EUROPE, CAMPAIGN, ease(f, 0, 70))}
        arrows={[{ pts: ADVANCE, p: ease(f, wf(10, 'march') - 6, wf(10, 'destroy') + 30), color: '#4a7fd6', width: 14, dashed: true }]}
        pins={[{ at: 'kovno', label: 'Niemen', o: lin(f, 60, 70), side: 'l', size: 32 }, { at: 'moscow', label: 'Moscow', o: lin(f, 70, 80), side: 'r', size: 40, color: RED, star: true }, { at: 'stpetersburg', label: 'St Petersburg', o: lin(f, 70, 80), side: 'r', size: 30 }]}
        labels={[{ at: [33, 57.4], text: 'RUSSIAN EMPIRE', o: lin(f, 50, 70), size: 46 }]} />
      <Chapter num="II" title="The Gamble" dur={72} />
      <Chips y={820} items={[{ t: 'One decisive battle', at: wf(10, 'decisive') - 4 }, { t: 'Within weeks', at: wf(10, 'within') - 4, color: 'rgba(200,66,58,0.85)' }]} />
    </AbsoluteFill>
  );
};
const S11: React.FC = () => <S n={11} src="s11_camp" grade="warm" atmo="dust" move={{ s0: 1.04, s1: 1.18, x0: -3, x1: 0 }} dark={0.15}><StatStack rows={[{ v: 450000, label: 'men', at: wf(11, '450000') - 6 }, { v: 150000, label: 'horses', at: wf(11, '150000') - 6 }, { v: 25000, label: 'wagons', at: wf(11, '25000') - 6 }, { v: 1400, label: 'cannon', at: wf(11, '1400') - 6 }]} /></S>;
const S12: React.FC = () => <S n={12} src="s12_nations" grade="warm" atmo="dust" move={{ s0: 1.12, s1: 1.02, x0: 2, x1: -2 }}><Chips y={780} items={[{ t: '🇫🇷 French ~½', at: wf(12, 'french') - 4 }, { t: 'Poles', at: wf(12, 'poles') - 2 }, { t: 'Germans', at: wf(12, 'germans') - 2 }, { t: 'Italians', at: wf(12, 'italians') - 2 }, { t: 'Austrians', at: wf(12, 'austrians') - 2 }, { t: 'Swiss', at: wf(12, 'swiss') - 2 }]} /></S>;
const S13: React.FC = () => <S n={13} src="s13_ford" grade="warm" atmo="dust" move={{ s0: 1.04, s1: 1.16, x0: -2, x1: 2 }}><DateTag text="24 JUNE 1812 · THE INVASION BEGINS" at={wf(13, 'june') - 6} /></S>;
const S14: React.FC = () => <S n={14} src="s14_burning_village" grade="fire" atmo="embers" move={{ s0: 1.04, s1: 1.18, x0: 2, x1: -1 }}><Chapter num="III" title="The Empty Land" dur={78} /><Chips y={820} items={[{ t: 'Scorched earth', at: wf(14, 'burning') - 4, color: 'rgba(200,66,58,0.85)' }]} /></S>;
const S15: React.FC = () => <S n={15} src="s15_wagons" grade="warm" atmo="dust" move={{ s0: 1.14, s1: 1.04, y0: 1, y1: -1 }} />;
const S16: React.FC = () => <S n={16} src="s16_heat" grade="warm" atmo="dust" move={{ s0: 1.04, s1: 1.15 }}><Chips y={820} items={[{ t: 'Heat', at: wf(16, 'heat') - 2 }, { t: 'Thirst', at: wf(16, 'thirst') - 2 }, { t: 'Dysentery', at: wf(16, 'dysentery') - 2, color: 'rgba(200,66,58,0.85)' }, { t: 'Typhus', at: wf(16, 'typhus') - 2, color: 'rgba(200,66,58,0.85)' }]} /></S>;
const S17: React.FC = () => <S n={17} src="s17_horses" grade="warm" atmo="dust" move={{ s0: 1.08, s1: 1.18, x0: -1, x1: 2 }}><Stat value={<Num from={0} to={5000} at={wf(17, '5000') - 6} dur={24} suffix="+" />} label="dead horses before Vilnius" at={wf(17, '5000') - 10} y={700} /></S>;
const S18: React.FC = () => {
  const f = useCurrentFrame(); const third = wf(18, 'third');
  return (
    <AbsoluteFill>
      <DocMap view={CAMPAIGN} arrows={[{ pts: ['kovno', 'vilnius', 'vitebsk', 'smolensk'], p: ease(f, 4, 160), color: '#4a7fd6', width: 14 }]}
        pins={[{ at: 'kovno', label: 'Kovno', o: 1, side: 'l', size: 30 }, { at: 'vilnius', label: 'Vilnius', o: lin(f, 30, 40), side: 'b', size: 30 }, { at: 'vitebsk', label: 'Vitebsk', o: lin(f, 90, 100), side: 't', size: 30 }]} />
      <div style={{ position: 'absolute', left: 90, top: 690, width: 900 }}>
        <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 4, color: GOLD, marginBottom: 12 }}>MAIN ARMY · FIRST 8 WEEKS</div>
        <div style={{ height: 54, background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.4)' }}>
          <div style={{ height: '100%', width: `${100 - 33 * ease(f, third - 30, third + 10)}%`, background: '#4a7fd6' }} />
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 64, color: '#fff', marginTop: 14, opacity: lin(f, third - 4, third + 6) }}>−⅓ <span style={{ fontSize: 34, fontFamily: MONO, letterSpacing: 3, color: '#ddd' }}>BEFORE ANY MAJOR BATTLE</span></div>
      </div>
    </AbsoluteFill>
  );
};
const S19: React.FC = () => <S n={19} src="s19_smolensk" grade="fire" atmo="embers" move={{ s0: 1.04, s1: 1.16 }}><DateTag text="AUGUST 1812 · SMOLENSK" /></S>;
const S20: React.FC = () => <S n={20} src="s20_kutuzov" grade="warm" move={{ s0: 1.04, s1: 1.16, y0: 1, y1: -1 }}><LowerThird name="Mikhail Kutuzov" role="Commander-in-chief of the Russian armies" at={wf(20, 'mikhail') - 6} /></S>;
const S21: React.FC = () => {
  const f = useCurrentFrame(); const mi = wf(21, '75');
  return (
    <AbsoluteFill>
      <DocMap view={lerpView(CAMPAIGN, { lon: 36.6, lat: 55.6, k: 330 }, ease(f, 0, 90))} arrows={[{ pts: ['smolensk', 'borodino'], p: ease(f, 20, 120), color: '#4a7fd6', width: 14 }]}
        pins={[{ at: 'borodino', label: 'Borodino', o: lin(f, wf(21, 'borodino') - 6, wf(21, 'borodino')), side: 'b', size: 40, color: RED, star: true }, { at: 'moscow', label: 'Moscow', o: lin(f, 40, 50), side: 'r', size: 40 }]}>
        {(P) => { const a = P(...PL.borodino), b = P(...PL.moscow); const o = lin(f, mi - 6, mi + 4); return o > 0 ? <g opacity={o}><path d={`M${a[0]},${a[1] - 40} L${b[0]},${b[1] - 40}`} stroke="#fff" strokeWidth={3} strokeDasharray="10 8" /><text x={(a[0] + b[0]) / 2} y={(a[1] + b[1]) / 2 - 56} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={44} fill="#fff" stroke="#000" strokeWidth={6} style={{ paintOrder: 'stroke' }}>≈ 75 miles</text></g> : null; }}
      </DocMap>
      <Chapter num="IV" title="Borodino" dur={72} />
      <DateTag text="7 SEPTEMBER 1812" at={80} />
    </AbsoluteFill>
  );
};
const S22: React.FC = () => <S n={22} src="s22_borodino" grade="neutral" atmo="smoke" move={{ s0: 1.04, s1: 1.2, x0: 2, x1: -2 }}><Stat value="≈ 250,000" label="soldiers in a single day" at={wf(22, 'quarter') - 4} y={700} size={100} /></S>;
const S23: React.FC = () => <S n={23} src="s23_aftermath" grade="night" atmo="smoke" move={{ s0: 1.14, s1: 1.04 }}><Stat value={<Num from={0} to={70000} at={wf(23, '70000') - 6} dur={26} suffix="+" />} label="killed or wounded" at={wf(23, '70000') - 10} y={700} color={RED} /></S>;
const S24: React.FC = () => <S n={24} src="s24_guard" grade="neutral" atmo="smoke" move={{ s0: 1.04, s1: 1.14, x0: -2, x1: 1 }}><LowerThird name="The Imperial Guard" role="Napoleon's elite · held back" at={wf(24, 'imperial') - 10} /></S>;
const S25: React.FC = () => <S n={25} src="s25_russian_army" grade="neutral" move={{ s0: 1.04, s1: 1.14, x0: 1, x1: -2 }} />;
const S26: React.FC = () => <S n={26} src="s26_moscow_view" grade="warm" move={{ s0: 1.04, s1: 1.2, x0: 0, x1: -3 }}><Chapter num="V" title="Moscow" dur={74} /><DateTag text="14 SEPTEMBER 1812" at={80} /><Stat value="≈ 100,000" label="men reached Moscow" at={wf(26, '100000') - 6} out={wf(26, 'he') - 6} y={700} size={100} /></S>;
const S27: React.FC = () => <S n={27} src="s27_moscow_fire" grade="fire" atmo="embers" move={{ s0: 1.04, s1: 1.18 }}><Stat value="¾" label="of Moscow burned" at={wf(27, 'threequarters') - 6} y={680} color="#ffb347" size={150} /><LowerThird name="Count Fyodor Rostopchin" role="Governor of Moscow" at={wf(27, 'count') - 6} /></S>;
const S28: React.FC = () => <S n={28} src="s28_kremlin_desk" grade="fire" move={{ s0: 1.16, s1: 1.04 }}><Chapter num="VI" title="The Mistake" dur={80} /><Statement text="He waited." at={wf(28, 'waited') - 2} out={wf(28, 'convinced') + 10} y={760} size={110} color={GOLD} /></S>;
const S29: React.FC = () => <S n={29} src="s29_letter" grade="night" move={{ s0: 1.06, s1: 1.14 }}><Statement text="No reply." at={wf(29, 'refused') - 4} y={760} size={110} /></S>;
const S30: React.FC = () => {
  const f = useCurrentFrame(); const day = Math.min(35, Math.floor(lin(f, 4, 170) * 35) + 1);
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 40%, #1d2228, #07090b)' }}>
      <div style={{ position: 'absolute', left: 120, top: 180 }}>
        <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: GOLD }}>NAPOLEON IN MOSCOW</div>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 220, color: '#fff', lineHeight: 1 }}>Day {day}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 52px)', gap: 8, marginTop: 24 }}>
          {Array.from({ length: 35 }, (_, i) => <div key={i} style={{ width: 52, height: 40, background: i < day ? 'rgba(200,66,58,0.85)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)' }} />)}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 820, top: 300, width: 520 }}>
        <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 4, color: '#9bd17b', marginBottom: 10 }}>KUTUZOV'S ARMY</div>
        <div style={{ height: 46, background: 'rgba(255,255,255,0.1)' }}><div style={{ height: '100%', width: `${45 + 50 * ease(f, wf(30, 'kutuzovs') - 10, 180)}%`, background: '#5b8f43' }} /></div>
        <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 4, color: ICE, margin: '40px 0 10px' }}>WINTER</div>
        <div style={{ height: 46, background: 'rgba(255,255,255,0.1)' }}><div style={{ height: '100%', width: `${20 + 70 * ease(f, wf(30, 'winter') - 10, 190)}%`, background: '#6fb2ff' }} /></div>
      </div>
      <Thermo t={-2} at={wf(30, 'winter') - 20} x={1500} y={170} />
    </AbsoluteFill>
  );
};
const S31: React.FC = () => <S n={31} src="s31_napoleon_close" grade="night" move={{ s0: 1.04, s1: 1.2 }}><Statement text="Russia was not Austria." at={wf(31, 'russia') - 4} out={wf(31, 'and', 2) - 4} y={800} size={84} color={GOLD} /></S>;
const S32: React.FC = () => <S n={32} src="s32_leaving" grade="cold" atmo="smoke" move={{ s0: 1.04, s1: 1.16, x0: 2, x1: -2 }}><DateTag text="19 OCTOBER 1812" /><Stat value="35 DAYS" label="wasted in Moscow" at={wf(32, '35') - 6} y={700} color={GOLD} size={120} /></S>;
const S33: React.FC = () => {
  const f = useCurrentFrame(); const blk = wf(33, 'blocked'); const forced = wf(33, 'forced');
  return (
    <AbsoluteFill>
      <DocMap view={lerpView({ lon: 35.5, lat: 55.3, k: 230 }, CAMPAIGN, ease(f, forced - 20, forced + 60))}
        arrows={[{ pts: ['moscow', [37.1, 55.3], 'maloyaroslavets'], p: ease(f, 10, blk), color: '#4a7fd6', width: 14 }, { pts: ['maloyaroslavets', [36.0, 55.3], 'borodino', 'smolensk', 'krasnoi', 'borisov'], p: ease(f, forced, forced + 160), color: '#4a7fd6', width: 14 }]}
        pins={[{ at: 'moscow', label: 'Moscow', o: 1, side: 'r', size: 36 }, { at: 'maloyaroslavets', label: 'Maloyaroslavets', o: lin(f, blk - 20, blk - 10), side: 'b', size: 34, color: RED, star: true }, { at: 'smolensk', label: 'Smolensk', o: lin(f, forced + 60, forced + 70), side: 't', size: 32 }]}>
        {(P) => { const [x, y] = P(...PL.maloyaroslavets); const k = ease(f, blk, blk + 10); return k > 0 ? <g stroke={RED} strokeWidth={14} strokeLinecap="round"><path d={`M${x - 40 * k},${y - 40 * k} L${x + 40 * k},${y + 40 * k}`} /><path d={`M${x + 40 * k},${y - 40 * k} L${x - 40 * k},${y + 40 * k}`} /></g> : null; }}
      </DocMap>
      <Chapter num="VII" title="The Retreat" dur={74} />
      <Chips y={850} items={[{ t: 'Back on the road it had stripped bare', at: wf(33, 'stripped') - 8, color: 'rgba(200,66,58,0.85)' }]} />
    </AbsoluteFill>
  );
};
const S34: React.FC = () => <S n={34} src="s34_blizzard" grade="cold" atmo="blizzard" move={{ s0: 1.04, s1: 1.16 }}><DateTag text="6 NOVEMBER 1812 · THE FIRST BLIZZARD" /></S>;
const S35: React.FC = () => <S n={35} src="s35_frozen_soldier" grade="cold" atmo="snow" move={{ s0: 1.18, s1: 1.04 }}><Chips y={820} items={[{ t: 'Summer uniforms', at: wf(35, 'summer') - 4 }, { t: 'No winter horseshoes', at: wf(35, 'horses') - 4, color: 'rgba(200,66,58,0.85)' }]} /></S>;
const S36: React.FC = () => <S n={36} src="s36_abandoned" grade="cold" atmo="snow" move={{ s0: 1.04, s1: 1.16, x0: 2, x1: -2 }} />;
const S37: React.FC = () => <S n={37} src="s37_cossacks" grade="cold" atmo="snow" move={{ s0: 1.04, s1: 1.2, x0: -2, x1: 2 }}><LowerThird name="Cossacks" role="Light cavalry of the Russian frontier" at={wf(37, 'cossacks') - 6} /></S>;
const S38: React.FC = () => <S n={38} src="s38_campfire" grade="night" atmo="snow" move={{ s0: 1.04, s1: 1.14 }}><Thermo t={-30} at={wf(38, 'temperatures') - 10} x={1560} y={160} /></S>;
const S39: React.FC = () => {
  const f = useCurrentFrame(); const three = wf(39, 'three');
  return (
    <AbsoluteFill>
      <DocMap view={lerpView(CAMPAIGN, { lon: 28.5, lat: 54.3, k: 520 }, ease(f, 0, 90))} snow={1}
        arrows={[{ pts: ['krasnoi', [30.0, 54.4], 'borisov'], p: ease(f, 20, 90), color: '#4a7fd6', width: 14 }, { pts: [[29.0, 55.1], [28.6, 54.7], [28.42, 54.42]], p: ease(f, three - 10, three + 30), color: RED, width: 12 }, { pts: [[28.9, 53.5], [28.6, 53.9], [28.48, 54.17]], p: ease(f, three - 4, three + 36), color: RED, width: 12 }, { pts: [[29.8, 54.35], [29.2, 54.33], [28.65, 54.27]], p: ease(f, three + 2, three + 42), color: RED, width: 12 }]}
        pins={[{ at: 'borisov', label: 'Borisov', o: 1, side: 'b', size: 34 }, { at: 'studienka', label: 'Studienka crossing', o: lin(f, 120, 130), side: 'l', size: 34, color: GOLD, star: true }]}
        labels={[{ at: [28.32, 54.62], text: 'BEREZINA', o: lin(f, 60, 80), size: 34, color: '#9fd0ef', rot: -80, spacing: 6 }]} />
      <Chapter num="VIII" title="The Berezina" dur={74} />
      <DateTag text="26–29 NOVEMBER 1812" at={84} />
    </AbsoluteFill>
  );
};
const S40: React.FC = () => <S n={40} src="s40_pontonniers" grade="cold" atmo="snow" move={{ s0: 1.04, s1: 1.18, x0: 2, x1: -1 }}><LowerThird name="Gen. Jean-Baptiste Eblé" role="Commander of the bridging engineers" at={wf(40, 'general') - 6} /></S>;
const S41: React.FC = () => <S n={41} src="s41_bridge_chaos" grade="cold" atmo="snow" move={{ s0: 1.16, s1: 1.04 }}><Particles kind="smoke" o={0.6} /></S>;
const S42: React.FC = () => <S n={42} src="s42_sleigh" grade="night" atmo="snow" move={{ s0: 1.04, s1: 1.16, x0: -2, x1: 2 }}><DateTag text="5 DECEMBER 1812 · SMORGON" /></S>;
const S43: React.FC = () => <S n={43} src="s43_rearguard" grade="cold" atmo="snow" move={{ s0: 1.04, s1: 1.16 }}><LowerThird name="Marshal Michel Ney" role="“The bravest of the brave”" at={wf(43, 'michel') - 6} /></S>;
const S44: React.FC = () => {
  const f = useCurrentFrame(); const mi = wf(44, 'decades'); const best = wf(44, 'best');
  const showReal = f >= best - 30;
  return (
    <AbsoluteFill>
      {!showReal && (
        <DocMap view={{ lon: 30.8, lat: 55.2, k: 135 }} snow={0.5}
          pins={[{ at: 'kovno', label: 'Niemen', o: 1, side: 'l', size: 30 }, { at: 'moscow', label: 'Moscow', o: 1, side: 'r', size: 34 }]}>
          {(P) => <g><Band P={P} pts={MIN_ADV} p={ease(f, mi - 10, mi + 120)} color="#c9a46a" scale={170} /><Band P={P} pts={MIN_RET} p={ease(f, mi + 120, mi + 260)} color="#1b1b1b" scale={170} />
            {[[MIN_ADV[0], '422,000', mi + 20], [MIN_ADV[7], '100,000', mi + 120], [MIN_RET[MIN_RET.length - 1], '10,000', mi + 270]].map(([q, t, at], i) => { const [x, y] = P((q as number[])[0], (q as number[])[1]); const o = lin(f, at as number, (at as number) + 10); return o > 0 ? <text key={i} x={x} y={y + (i === 2 ? 80 : -100)} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={54} fill="#fff" stroke="#000" strokeWidth={8} style={{ paintOrder: 'stroke' }} opacity={o}>{t as string}</text> : null; })}</g>}
        </DocMap>
      )}
      {showReal && <AbsoluteFill style={{ background: '#e9e1cf', alignItems: 'center', justifyContent: 'center' }}><Img src={staticFile('assets/archival/minard.png')} style={{ width: '94%', transform: `scale(${1 + 0.06 * lin(f, best - 30, best + 120)})`, filter: 'sepia(0.15)' }} /></AbsoluteFill>}
      <Chapter num="IX" title="The Price" dur={74} />
      {!showReal && <Stat value="300,000+" label="French and allied dead (estimates)" at={wf(44, '300000') - 8} out={mi - 10} y={760} color={RED} size={100} />}
      {showReal && <div style={{ position: 'absolute', left: 90, bottom: 210, fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 52, color: '#2a2117' }}>“Perhaps the best statistical graphic ever drawn.” <span style={{ fontFamily: MONO, fontStyle: 'normal', fontSize: 24, color: '#6d5a3b' }}>— EDWARD TUFTE · CHART: C. J. MINARD, 1869</span></div>}
    </AbsoluteFill>
  );
};
const S45: React.FC = () => <S n={45} src="s45_leipzig" grade="neutral" atmo="smoke" move={{ s0: 1.04, s1: 1.16 }}><DateTag text="OCTOBER 1813 · LEIPZIG" at={wf(45, '1813') - 10} /></S>;
const S46: React.FC = () => <S n={46} src="s46_elba" grade="warm" move={{ s0: 1.04, s1: 1.14, x0: -2, x1: 1 }}><DateTag text="APRIL 1814 · EXILE TO ELBA" /></S>;
const S47: React.FC = () => <S n={47} src="s47_waterloo" grade="night" move={{ s0: 1.04, s1: 1.18 }}><DateTag text="JUNE 1815 · WATERLOO" at={wf(47, 'waterloo') - 20} /></S>;
const S48: React.FC = () => <S n={48} src="s48_eagle" grade="cold" atmo="snow" move={{ s0: 1.04, s1: 1.2 }}><Chips y={760} items={[{ t: 'One battle', at: wf(48, 'gamble') + 10 }, { t: 'One captured city', at: wf(48, 'captured') - 4 }, { t: '35 days of waiting', at: wf(48, '35') - 4, color: 'rgba(200,66,58,0.85)' }]} /></S>;
const S49: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <S n={49} src="s03_cannon_snow" grade="cold" atmo="snow" move={{ s0: 1.2, s1: 1.08 }} dark={0.45}>
      <Statement text="Napoleon's greatest mistake — or was Russia unconquerable?" at={6} y={330} size={78} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', opacity: lin(f, wf(49, 'subscribe') - 10, wf(49, 'subscribe')) }}>
        <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 44, color: '#fff', background: RED, padding: '14px 40px', borderRadius: 8, letterSpacing: 2 }}>SUBSCRIBE · BURIED CHRONICLES</span>
      </div>
    </S>
  );
};

export const SCENE_COMPS: React.FC[] = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19, S20, S21, S22, S23, S24, S25, S26, S27, S28, S29, S30, S31, S32, S33, S34, S35, S36, S37, S38, S39, S40, S41, S42, S43, S44, S45, S46, S47, S48, S49];
