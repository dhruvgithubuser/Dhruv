import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Bar, Calendar, Cam, ICONS, Counter, Headline, Ico, Mark, Note, Notes, Parchment, Particles, Photo, Src, Stamp, Troops, Thermo, usePop } from './kit';
import { Distance, PL, VoxMap, proj, lerpView, View } from './VoxMap';
import { C, HEAD, TYPE, ease, lin, pf, wf } from './theme';

export const st = (n: string) => `assets/stills/${n}.png`;
export const por = (n: string) => `assets/portraits/${n}.jpg`;
const DR = 'dramatized reconstruction';
export const EU: View = { lon: 13, lat: 50.5, k: 34 };

/* 01 — December 1812, the frozen bridge */
export const S01: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Cam push={0.03 * ease(f, 0, 280)} ox={35}>
      <Parchment />
      <Photo src={st('s01_frozen_bridge')} at={4} x={110} y={90} w={1020} h={580} rot={-2} caption="THE NIEMEN RIVER · DECEMBER 1812" credit={DR} grade="cold" />
      <Notes lines={['DECEMBER 1812', 'THE NIEMEN RIVER', 'WESTERN EDGE OF', 'THE RUSSIAN EMPIRE']} at={wf(1, 'december') + 4} x={1230} y={170} gap={66} size={30} step={wf(1, 'niemen') > 0 ? 10 : 8} />
      <Ico name="snowflake" at={wf(1, 'frozen')} x={1520} y={560} s={150} rot={10} />
      <Particles kind="snow" n={110} />
    </Cam>
  );
};

/* 02 — 450,000 crossed the same river */
export const S02: React.FC = () => {
  const f = useCurrentFrame();
  const n = wf(2, '450000');
  return (
    <Cam push={0.02 * ease(f, 0, 270)}>
      <VoxMap view={lerpView({ lon: 24.2, lat: 54.6, k: 210 }, { lon: 24.6, lat: 54.5, k: 160 }, ease(f, 0, 270))}
        arrows={[{ pts: [[20.6, 54.35], [22.6, 54.75], 'kovno', [26.2, 54.75]], p: ease(f, wf(2, 'marched') - 6, wf(2, 'marched') + 40), width: 16 }]}
        pins={[{ at: 'kovno', label: 'KOVNO', o: lin(f, 6, 16), side: 'b' }]}
        labels={[{ at: [23.0, 55.45], text: 'NIEMEN RIVER', o: lin(f, 10, 24), size: 34, color: '#3c5f80' }]} />
      <Note text="SIX MONTHS EARLIER · JUNE 1812" at={wf(2, 'six')} x={70} y={70} size={34} />
      <div style={{ position: 'absolute', left: 70, top: 600, padding: '10px 30px 18px', background: 'rgba(239,230,210,0.88)', opacity: lin(f, n - 2, n + 6) }}>
        <Counter to={450000} at={n} dur={36} x={70} y={0} size={140} align="left" label="SOLDIERS" />
        <div style={{ height: 190, width: 600 }} />
      </div>
      <Photo src={st('s02_crossing')} at={wf(2, 'largest') - 6} x={1240} y={80} w={600} h={340} rot={3} caption="ONE OF EUROPE'S LARGEST ARMIES" credit={DR} />
    </Cam>
  );
};

/* 03 — most never came back; the winter myth */
export const S03: React.FC = () => {
  const f = useCurrentFrame();
  const nev = wf(3, 'never'), hist = wf(3, 'history'), but = wf(3, 'but'), half = wf(3, 'half'), snow = wf(3, 'snow');
  return (
    <Cam>
      <Parchment />
      {f < hist + 4 && (
        <AbsoluteFill style={{ opacity: 1 - lin(f, hist - 4, hist + 4) }}>
          <Troops n={50} cols={10} x={500} y={150} size={74} gap={18} at={0} lost={(i) => (i % 17 === 3 ? 0 : lin(f, nev + i * 0.5, nev + 6 + i * 0.5) * 0.7)} />
          <Note text="EACH FIGURE ≈ 9,000 MEN" at={6} x={500} y={80} size={24} />
          <Stamp text="NEVER CAME BACK" at={nev + 10} x={960} y={420} size={80} />
        </AbsoluteFill>
      )}
      {f >= hist - 4 && (
        <AbsoluteFill style={{ opacity: lin(f, hist - 4, hist + 4) }}>
          <Ico name="snowflake" at={hist} x={380} y={360} s={300} />
          <Note text="THE USUAL ANSWER: THE WINTER" at={hist + 6} x={150} y={560} size={30} />
          <Mark at={but} x={380} y={360} s={330} />
          <Troops n={50} cols={10} x={830} y={150} size={70} gap={16} at={hist} lost={(i) => (i % 10 < 5 ? lin(f, half + (i % 10) * 2, half + 8 + (i % 10) * 2) : 0)} />
          <Stamp text="HALF GONE" at={half + 4} x={1035} y={360} size={90} />
          <Note text="…BEFORE THE FIRST SNOW FELL" at={snow - 4} x={830} y={620} size={34} />
        </AbsoluteFill>
      )}
    </Cam>
  );
};

/* 04 — title */
export const S04: React.FC = () => {
  const f = useCurrentFrame();
  const m = wf(4, 'mistake');
  return (
    <Cam push={0.03 * ease(f, 0, 160)} ox={30}>
      <Parchment />
      <Photo src={por('napoleon')} at={2} x={140} y={100} w={520} h={600} rot={-3} pos="40% 30%" caption="Napoleon Bonaparte" credit="J.-L. David, 1812 · public domain" grade="warm" />
      <Headline text="THE MISTAKE" at={m - 4} x={760} y={200} size={130} align="left" />
      <Headline text="THAT COST NAPOLEON" at={m + 6} x={760} y={360} size={96} align="left" />
      <Headline text="HIS EMPIRE" at={wf(4, 'empire') - 4} x={760} y={500} size={130} align="left" color={C.red} />
      <Stamp text="RUSSIA · 1812" at={wf(4, 'empire') + 8} x={1500} y={760} size={60} rot={-6} />
    </Cam>
  );
};

/* 05 — master of Europe */
export const S05: React.FC = () => {
  const f = useCurrentFrame();
  const P = proj(EU);
  const aus = wf(5, 'austria'), pru = wf(5, 'prussia'), rus = wf(5, 'russia'), bro = wf(5, 'brothers');
  const crown = (at: string, i: number, label: string, side: 1 | -1) => { const [x, y] = P(...PL[at]); return (
    <React.Fragment key={at}><Ico name="crown" at={bro + i * 8} x={x} y={y - 46} s={84} /><Note text={label} at={bro + i * 8 + 4} x={side > 0 ? x + 50 : x - 330} y={y - 66} size={22} /></React.Fragment>); };
  return (
    <Cam>
      <VoxMap view={EU}
        washes={[{ r: 'france', o: ease(f, wf(5, 'powerful') - 10, wf(5, 'powerful') + 20), color: C.blue, label: "NAPOLEON'S EUROPE", at: [4.5, 45.6], size: 40 }]}
        pins={[{ at: 'paris', label: 'PARIS', o: lin(f, 4, 14), side: 'l', size: 34 }, { at: 'vienna', label: 'AUSTRIA', o: lin(f, aus - 4, aus + 4) }, { at: 'berlin', label: 'PRUSSIA', o: lin(f, pru - 4, pru + 4) }, { at: [30, 55], label: 'RUSSIA', o: lin(f, rus - 4, rus + 4) }]} />
      {[['vienna', aus], ['berlin', pru]].map(([k, t]) => { const [x, y] = P(...PL[k as string]); return <Mark key={k as string} at={(t as number) + 4} x={x} y={y} s={90} />; })}
      <Mark at={rus + 4} x={P(30, 55)[0]} y={P(30, 55)[1]} s={90} />
      {crown('madrid', 0, 'JOSEPH · KING OF SPAIN', 1)}
      {crown('amsterdam', 1, 'LOUIS · KING OF HOLLAND', -1)}
      {crown('kassel', 2, 'JÉRÔME · KING OF WESTPHALIA', 1)}
      <Photo src={por('napoleon')} at={4} x={50} y={60} w={300} h={330} rot={-3} pos="40% 30%" caption="EMPEROR, AGE 42" grade="warm" />
    </Cam>
  );
};

/* 06 — Britain */
export const S06: React.FC = () => {
  const f = useCurrentFrame();
  const P = proj(EU);
  const b = wf(6, 'britain'), nav = wf(6, 'navy');
  const ships: [number, number][] = [[-6.5, 49], [2.4, 51.9], [-9.5, 53.5], [-3, 59.6], [1.5, 55.6]];
  return (
    <Cam push={0.04 * ease(f, b, b + 60)} ox={30} oy={38}>
      <VoxMap view={EU} washes={[{ r: 'france', o: 0.55, color: C.blue }, { r: 'britain', o: ease(f, b - 6, b + 10), color: C.red, label: 'BRITAIN', at: [-2.6, 55.6], size: 40 }]} />
      {ships.map(([lo, la], i) => { const [x, y] = P(lo, la); return <Ico key={i} name="ship" at={nav + i * 4} x={x} y={y} s={78} />; })}
      <Note text="ONLY ONE ENEMY REFUSED TO BOW" at={4} x={1100} y={70} size={30} />
      <Photo src={st('s06_navy')} at={nav - 2} x={1180} y={170} w={620} h={350} rot={2} caption="THE ROYAL NAVY" credit={DR} />
      <Note text="OUT OF REACH OF HIS ARMIES" at={wf(6, 'reach') - 4} x={1190} y={650} size={28} />
    </Cam>
  );
};

/* 07 — Continental System */
export const S07: React.FC = () => {
  const f = useCurrentFrame();
  const P = proj(EU);
  const cs = wf(7, 'continental'), ports = wf(7, 'ports');
  const list = ['hamburg', 'amsterdam', 'antwerp', 'bordeaux', 'marseille', 'genoa', 'venice', 'trieste', 'naples', 'danzig', 'lubeck'];
  return (
    <Cam>
      <VoxMap view={EU} washes={[{ r: 'france', o: 0.55, color: C.blue }, { r: 'britain', o: 0.6, color: C.red }]} />
      {list.map((k, i) => { const [x, y] = P(...PL[k]); return <Ico key={k} name="lock" at={ports + i * 3} x={x} y={y} s={62} />; })}
      <Ico name="ship" at={wf(7, 'trade')} x={P(-1, 47.5)[0]} y={P(-1, 47.5)[1]} s={86} />
      <Mark at={ports + 30} x={P(-1, 47.5)[0]} y={P(-1, 47.5)[1]} s={110} />
      <Headline text="THE CONTINENTAL SYSTEM" sub="FROM 1806: EUROPE'S PORTS CLOSED TO BRITISH GOODS" at={cs - 4} x={1040} y={60} size={70} align="left" />
    </Cam>
  );
};

/* 08 — Russia breaks away */
export const S08: React.FC = () => {
  const f = useCurrentFrame();
  const last = wf(8, 'last'), broke = wf(8, 'broke');
  return (
    <Cam push={0.02 * ease(f, 0, 300)}>
      <Parchment />
      <Photo src={por('alexander')} at={2} x={110} y={100} w={500} h={560} rot={-3} pos="50% 25%" caption="Tsar Alexander I" credit="G. Dawe, 1826 · public domain" grade="warm" />
      <Notes lines={['TSAR OF RUSSIA SINCE 1801', '1807: JOINS THE BLOCKADE', 'RUSSIAN TRADE CRIPPLED']} at={wf(8, 'joined') - 6} x={700} y={140} gap={74} size={30} step={Math.max(8, (wf(8, 'crippling') - wf(8, 'joined')) / 2)} />
      <Ico name="lock" at={wf(8, 'joined')} x={1580} y={190} s={130} />
      <Calendar at={last - 4} x={760} y={420} month="DECEMBER" day="31" year="1810" s={1} />
      <Stamp text="BREAKS AWAY" at={broke} x={1420} y={560} size={84} rot={-7} />
    </Cam>
  );
};

/* 09 — betrayal */
export const S09: React.FC = () => {
  const f = useCurrentFrame();
  const bet = wf(9, 'betrayal'), oth = wf(9, 'others'), les = wf(9, 'lesson');
  const p = ease(f, les - 10, les + 14);
  return (
    <Cam>
      <Parchment />
      <Photo src={por('napoleon')} at={2} x={120} y={110} w={430} h={500} rot={-3} pos="40% 30%" caption="Napoleon" grade="warm" />
      <Photo src={por('alexander')} at={8} x={1370} y={110} w={430} h={500} rot={3} pos="50% 25%" caption="Alexander I" grade="warm" />
      <Stamp text="BETRAYAL" at={bet} x={960} y={250} size={100} rot={-5} />
      {['PRUSSIA?', 'AUSTRIA?', 'SWEDEN?'].map((t, i) => <Note key={t} text={`NEXT TO DEFY HIM: ${t}`} at={oth + i * 7} x={640} y={420 + i * 70} size={26} />)}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {p > 0 && <path d={`M560 700 Q960 ${860} ${560 + 800 * p} ${700 - 20 * p}`} fill="none" stroke={C.red} strokeWidth={14} strokeLinecap="round" />}
      </svg>
      <Note text="“TEACH THE TSAR A LESSON”" at={les} x={760} y={770} size={30} />
    </Cam>
  );
};

/* 10 — the plan */
const PlanCard: React.FC<{ at: number; x: number; n: string; title: string; icon: string }> = ({ at, x, n, title, icon }) => {
  const k = usePop(at, 13);
  if (k <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: 280, width: 500, height: 420, background: '#f6f0e2', boxShadow: '0 16px 36px rgba(20,12,4,0.45)', opacity: Math.min(1, k * 2), transform: `translateY(${(1 - k) * 60}px) rotate(${(+n % 2 ? -1.5 : 1.5)}deg)`, borderTop: `10px solid ${C.red}` }}>
      <div style={{ position: 'absolute', left: 30, top: 18, fontFamily: HEAD, fontWeight: 700, fontSize: 90, color: C.red }}>{n}</div>
      <div style={{ position: 'absolute', left: 30, right: 30, bottom: 34, fontFamily: HEAD, fontWeight: 700, fontSize: 50, lineHeight: 1.05, color: C.charcoal, textTransform: 'uppercase' }}>{title}</div>
      <div style={{ position: 'absolute', right: 30, top: 34 }}><svg viewBox="0 0 100 100" width={150} height={150}>{React.createElement(ICONS[icon])}</svg></div>
    </div>
  );
};
export const S10: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Cam>
      <Parchment />
      <Headline text="THE PLAN" at={wf(10, 'plan') - 4} y={80} size={100} />
      <PlanCard at={wf(10, 'march')} x={150} n="1" title="March into Russia" icon="soldier" />
      <PlanCard at={wf(10, 'destroy')} x={710} n="2" title="One decisive battle" icon="cannon" />
      <PlanCard at={wf(10, 'force')} x={1270} n="3" title="Force the Tsar back into line" icon="crown" />
      <Stamp text="WITHIN WEEKS" at={wf(10, 'weeks')} x={960} y={770} size={70} rot={-3} />
    </Cam>
  );
};

/* 11 — the Grande Armée by numbers */
export const S11: React.FC = () => {
  const cols: [string, string, number, string][] = [['soldier', '450000', 450000, 'MEN'], ['horse', '150000', 150000, 'HORSES'], ['wagon', '25000', 25000, 'WAGONS'], ['cannon', '1400', 1400, 'CANNON']];
  return (
    <Cam>
      <Parchment />
      <Headline text="THE GRANDE ARMÉE" sub="JUNE 1812 · APPROXIMATE FIGURES" at={wf(11, 'assembled') - 4} y={70} size={96} />
      {cols.map(([ic, w, v, l], i) => {
        const at = wf(11, w);
        const x = 270 + i * 460;
        return (
          <React.Fragment key={w}>
            <Ico name={ic} at={at - 6} x={x} y={400} s={190} />
            <Counter to={v} at={at} dur={24} x={x} y={530} size={92} label={l} />
          </React.Fragment>
        );
      })}
    </Cam>
  );
};

/* 12 — a multinational army */
const NAT: [string, string, number][] = [['french', C.blue, 25], ['poles', '#b5443a', 8], ['germans', '#5d5d58', 9], ['italians', '#3d7a4a', 4], ['austrians', '#e9e2d2', 3], ['swiss', '#a8771c', 1]];
export const S12: React.FC = () => {
  const f = useCurrentFrame();
  const starts = NAT.reduce<number[]>((a, [, , n], i) => [...a, i ? a[i - 1] + NAT[i - 1][2] : 0], []);
  const colorOf = (i: number) => { const j = starts.findIndex((s, k) => i >= s && i < s + NAT[k][2]); const t = wf(12, NAT[j][0]); return f >= t ? NAT[j][1] : '#9d9482'; };
  return (
    <Cam>
      <Parchment />
      <Troops n={50} cols={10} x={150} y={170} size={74} gap={14} at={0} colorOf={colorOf} />
      <Note text="EACH FIGURE ≈ 9,000 MEN · SHARES APPROXIMATE" at={4} x={150} y={90} size={22} />
      {NAT.map(([k, c], i) => { const t = wf(12, k); return (
        <div key={k} style={{ position: 'absolute', left: 1120, top: 170 + i * 92, opacity: lin(f, t - 2, t + 6), display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ width: 54, height: 54, background: c, border: `3px solid ${C.charcoal}` }} />
          <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 50, color: C.charcoal, textTransform: 'uppercase' }}>{k === 'french' ? 'French ≈ half' : k}</div>
        </div>); })}
      <Ico name="eagle" at={wf(12, 'eagle') - 4} x={1640} y={300} s={190} />
    </Cam>
  );
};

/* 13 — the crossing, 24 June 1812 */
export const S13: React.FC = () => {
  const f = useCurrentFrame();
  const cr = wf(13, 'crossed');
  return (
    <Cam push={0.04 * ease(f, cr, cr + 90)} ox={58}>
      <VoxMap view={{ lon: 24.2, lat: 54.75, k: 230 }}
        arrows={[{ pts: [[20.9, 54.5], [22.8, 54.8], 'kovno', [25.6, 54.9]], p: ease(f, cr - 4, cr + 50), width: 22 }]}
        pins={[{ at: 'kovno', label: 'KOVNO', o: lin(f, 4, 14), side: 'b' }]}
        labels={[{ at: [23.0, 55.5], text: 'NIEMEN RIVER', o: lin(f, 6, 18), size: 36, color: '#3c5f80' }, { at: [26.4, 55.5], text: 'RUSSIAN EMPIRE', o: lin(f, cr, cr + 20), size: 44, color: C.green }]} />
      <Calendar at={wf(13, 'june') - 4} x={110} y={110} month="JUNE" day="24" year="1812" />
      <Stamp text="INVASION" at={wf(13, 'russia')} x={1450} y={760} size={90} />
    </Cam>
  );
};

/* 14 — the Russians retreat and burn */
export const S14: React.FC = () => {
  const f = useCurrentFrame();
  const V: View = { lon: 29.4, lat: 55, k: 96 };
  const P = proj(V);
  const ret = wf(14, 'retreated'), burn = wf(14, 'burning');
  const fires: [number, number][] = [[26.6, 55.0], [28.3, 55.35], [29.6, 54.9], [31.2, 55.1], [32.6, 54.7], [33.6, 55.1]];
  return (
    <Cam>
      <VoxMap view={V}
        arrows={[{ pts: ['kovno', 'vilnius', [27.8, 55.1], 'vitebsk'], p: ease(f, 0, burn + 60), width: 18 },
          { pts: [[26.2, 55.5], [29.0, 55.7], [32.4, 55.3]], p: ease(f, ret - 4, ret + 50), color: C.green, width: 13 },
          { pts: [[26.0, 54.2], [29.2, 54.15], [32.6, 54.5]], p: ease(f, ret + 6, ret + 56), color: C.green, width: 13 }]}
        pins={[{ at: 'vilnius', label: 'VILNIUS', o: lin(f, 10, 20), side: 'b', size: 34 }, { at: 'vitebsk', label: 'VITEBSK', o: lin(f, burn + 40, burn + 50), side: 'b', size: 34 }]} />
      {fires.map(([lo, la], i) => <Ico key={i} name="flame" at={burn + i * 6} x={P(lo, la)[0]} y={P(lo, la)[1]} s={76} />)}
      <Note text="EXPECTED: A BATTLE" at={wf(14, 'expected')} x={70} y={70} size={30} />
      <Note text="GOT: AN ENDLESS RETREAT" at={wf(14, 'did') + 2} x={70} y={136} size={30} />
      <Photo src={st('s14_burning_village')} at={burn - 4} x={1270} y={90} w={580} h={330} rot={2} caption="SCORCHED EARTH" credit={DR} />
    </Cam>
  );
};

/* 15 — empty land, supply gap */
export const S15: React.FC = () => {
  const f = useCurrentFrame();
  const V: View = { lon: 28.2, lat: 55, k: 105 };
  const P = proj(V);
  const sup = wf(15, 'supply');
  const wp = 0.12 + 0.18 * ease(f, sup, sup + 90);
  const wx = PL.kovno[0] + (PL.vitebsk[0] - PL.kovno[0]) * wp, wy = PL.kovno[1] + (PL.vitebsk[1] - PL.kovno[1]) * wp;
  const [ax, ay] = P(...PL.vitebsk), [bx, by] = P(wx, wy);
  return (
    <Cam>
      <VoxMap view={V} arrows={[{ pts: ['kovno', 'vilnius', [27.8, 55.1], 'vitebsk'], p: 1, width: 18 }]}>
        {(PP) => <Distance a={[wx, wy + 0.5]} b={[PL.vitebsk[0], PL.vitebsk[1] + 0.5]} P={PP} label="SUPPLY GAP" o={lin(f, sup + 20, sup + 40)} />}
      </VoxMap>
      <Ico name="soldier" at={4} x={ax + 40} y={ay - 90} s={120} />
      <Ico name="wagon" at={sup - 6} x={bx} y={by - 70} s={120} />
      <Headline text="AN EMPTY LAND" at={wf(15, 'empty') - 6} x={70} y={70} size={84} align="left" />
      <Note text="NO FOOD TO TAKE · NO FORAGE FOR HORSES" at={wf(15, 'empty') + 10} x={70} y={200} size={28} />
    </Cam>
  );
};

/* 16 — summer heat and disease */
export const S16: React.FC = () => (
  <Cam>
    <Parchment />
    <Photo src={st('s16_heat')} at={2} x={100} y={90} w={900} h={520} rot={-2} caption="SUMMER 1812" credit={DR} />
    <Thermo at={wf(16, 'brutal') - 6} x={1080} y={90} fromC={18} toC={33} dur={40} s={0.95} />
    <Stamp text="DYSENTERY" at={wf(16, 'dysentery')} x={1280} y={710} size={66} rot={-6} />
    <Stamp text="TYPHUS" at={wf(16, 'typhus')} x={1660} y={770} size={66} rot={5} />
  </Cam>
);

/* 17 — the horses */
export const S17: React.FC = () => {
  const f = useCurrentFrame();
  const d = wf(17, 'died'), n = wf(17, '5000');
  return (
    <Cam>
      <Parchment />
      <Troops n={40} cols={8} x={120} y={110} size={92} gap={14} at={0} icon="horse" lost={(i) => lin(f, d + i * 1.2, d + 8 + i * 1.2)} />
      <Counter to={5000} at={n} dur={30} x={1440} y={250} size={170} suffix="+" label="DEAD HORSES" />
      <Note text="…BEFORE THE ARMY EVEN REACHED VILNIUS" at={wf(17, 'vilnius') - 4} x={1040} y={520} size={28} />
    </Cam>
  );
};

/* 18 — a third gone in eight weeks */
export const S18: React.FC = () => {
  const f = useCurrentFrame();
  const th = wf(18, 'third');
  return (
    <Cam>
      <Parchment />
      <Headline text="THE FIRST 8 WEEKS" at={wf(18, 'eight') - 6} y={80} size={100} />
      <Bar at={10} x={240} y={330} w={1240} h={90} p={1 - ease(f, th, th + 24) / 3} label="MAIN ARMY STRENGTH" value={f > th ? '−⅓' : '100%'} color={C.blue} />
      <Stamp text="BEFORE A SINGLE MAJOR BATTLE" at={wf(18, 'before')} x={960} y={640} size={66} rot={-3} />
    </Cam>
  );
};

/* 19 — Smolensk */
export const S19: React.FC = () => {
  const f = useCurrentFrame();
  const V: View = { lon: 31.6, lat: 54.95, k: 190 };
  const P = proj(V);
  const sl = wf(19, 'slipped'), fl = wf(19, 'flames');
  return (
    <Cam push={0.03 * ease(f, 0, 180)} ox={45}>
      <VoxMap view={V}
        arrows={[{ pts: ['vitebsk', [30.9, 54.9], [31.8, 54.8]], p: ease(f, 0, 40), width: 18 }, { pts: [[32.3, 54.85], [33.2, 55.05], [34.0, 55.15]], p: ease(f, sl - 4, sl + 40), color: C.green, width: 14 }]}
        pins={[{ at: 'smolensk', label: 'SMOLENSK', o: lin(f, 4, 14), side: 'b' }]} />
      {[[-30, -20], [30, -40], [0, 30], [50, 10]].map(([dx, dy], i) => <Ico key={i} name="flame" at={fl - 6 + i * 4} x={P(...PL.smolensk)[0] + dx} y={P(...PL.smolensk)[1] + dy - 40} s={80} />)}
      <Note text="AUGUST 1812" at={wf(19, 'august') - 4} x={70} y={70} size={34} />
      <Photo src={st('s19_smolensk')} at={fl - 10} x={1290} y={80} w={560} h={320} rot={2} caption="SMOLENSK IN FLAMES" credit={DR} />
    </Cam>
  );
};

/* 20 — Kutuzov */
export const S20: React.FC = () => {
  const k = wf(20, 'kutuzov');
  return (
    <Cam>
      <Parchment />
      <Photo src={por('kutuzov')} at={wf(20, 'old') - 8} x={150} y={100} w={500} h={560} rot={-3} pos="50% 30%" caption="Mikhail Kutuzov" credit="portrait by R. Volkov · public domain" grade="warm" />
      <Notes lines={['GENERAL · AGE 67', 'SHOT IN THE HEAD — TWICE', '(1774 AND 1788)', 'SURVIVED BOTH']} at={wf(20, 'battlescarred') || wf(20, 'old')} x={740} y={170} gap={66} size={30} step={8} />
      <Stamp text="COMMANDER-IN-CHIEF" at={k + 4} x={1150} y={620} size={66} rot={-4} />
    </Cam>
  );
};

/* 21 — Borodino, 75 miles from Moscow */
export const S21: React.FC = () => {
  const f = useCurrentFrame();
  const bor = wf(21, 'borodino'), mi = wf(21, '75');
  return (
    <Cam>
      <VoxMap view={{ lon: 36.4, lat: 55.55, k: 330 }}
        arrows={[{ pts: [[34.2, 55.3], [35.0, 55.45], [35.6, 55.5]], p: ease(f, 0, 50), width: 18 }]}
        pins={[{ at: 'borodino', label: 'BORODINO', o: lin(f, bor - 4, bor + 6), side: 'l' }, { at: 'moscow', label: 'MOSCOW', o: lin(f, mi - 6, mi + 4), side: 'r' }]}>
        {(P) => (<>
          <Distance a={PL.borodino} b={PL.moscow} P={P} label="~75 MILES (120 KM)" o={lin(f, mi, mi + 20)} />
          {f > wf(21, 'ground') - 4 && <path d={`M${P(35.95, 55.62).join(',')} L${P(36.0, 55.42).join(',')}`} stroke={C.green} strokeWidth={22} strokeLinecap="round" opacity={lin(f, wf(21, 'ground') - 4, wf(21, 'ground') + 6)} />}
        </>)}
      </VoxMap>
      <Calendar at={wf(21, 'september') - 4} x={100} y={110} month="SEPTEMBER" day="7" year="1812" />
      <Note text="KUTUZOV FINALLY STANDS AND FIGHTS" at={wf(21, 'ground') - 4} x={1150} y={760} size={28} />
    </Cam>
  );
};

/* 22 — the bloodiest day */
export const S22: React.FC = () => (
  <Cam>
    <Parchment />
    <Photo src={st('s22_borodino')} at={2} x={90} y={80} w={1020} h={580} rot={-2} caption="BORODINO · 7 SEPTEMBER 1812" credit={DR} />
    <Counter to={250000} at={wf(22, 'quarter')} dur={30} x={1500} y={150} size={112} label="SOLDIERS · ONE DAY" />
    <Note text="THE BLOODIEST DAY OF THE NAPOLEONIC WARS" at={wf(22, 'bloodiest') - 4} x={1190} y={470} size={32} w={640} />
  </Cam>
);

/* 23 — 70,000 casualties */
export const S23: React.FC = () => {
  const f = useCurrentFrame();
  const n = wf(23, '70000');
  return (
    <Cam>
      <Parchment />
      <Troops n={50} cols={10} x={120} y={150} size={76} gap={14} at={0} colorOf={(i) => (i % 2 ? C.blue : C.green)} lost={(i) => (i < 14 ? lin(f, n + i * 1.5, n + 8 + i * 1.5) : 0)} />
      <Note text="EACH FIGURE ≈ 5,000 MEN (BOTH ARMIES)" at={4} x={120} y={80} size={22} />
      <Counter to={70000} at={n} dur={30} x={1460} y={260} size={150} suffix="+" label="KILLED OR WOUNDED" color={C.red} />
      <Note text="BY NIGHTFALL" at={wf(23, 'nightfall') - 4} x={1280} y={530} size={30} />
    </Cam>
  );
};

/* 24 — the Guard held back */
export const S24: React.FC = () => (
  <Cam>
    <Parchment />
    <Photo src={st('s24_guard')} at={2} x={100} y={90} w={880} h={520} rot={-2} caption="THE IMPERIAL GUARD" credit={DR} />
    <Note text="NAPOLEON HELD THE FIELD" at={wf(24, 'held') - 4} x={1080} y={150} size={32} />
    <Notes lines={['THE IMPERIAL GUARD', "HIS ELITE RESERVE", 'NEVER SENT IN']} at={wf(24, 'elite') - 6} x={1080} y={260} gap={66} size={28} step={10} />
    <Stamp text="REFUSED" at={wf(24, 'refused')} x={1450} y={620} size={110} rot={-8} />
  </Cam>
);

/* 25 — the Russian army escapes */
export const S25: React.FC = () => {
  const f = useCurrentFrame();
  const pb = wf(25, 'pulled'), sl = wf(25, 'slipped');
  return (
    <Cam>
      <VoxMap view={{ lon: 36.6, lat: 55.4, k: 300 }}
        arrows={[{ pts: [[36.0, 55.52], [36.9, 55.7], [37.5, 55.65], [37.6, 55.35], 'tarutino'], p: ease(f, pb - 4, pb + 60), color: C.green, width: 16 }]}
        pins={[{ at: 'borodino', label: 'BORODINO', o: 1, side: 't', size: 34 }, { at: 'moscow', label: 'MOSCOW', o: 1, side: 'r', size: 34 }]} />
      <Note text="BLOODIED — BUT STILL AN ARMY" at={wf(25, 'bloodied') - 2} x={70} y={70} size={32} />
      <Stamp text="NO DECISIVE VICTORY" at={sl} x={760} y={770} size={80} rot={-4} />
    </Cam>
  );
};

export const SCENES_A = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19, S20, S21, S22, S23, S24, S25];
export { pf };
