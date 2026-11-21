import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { Bar, Calendar, Cam, Counter, Headline, ICONS, Ico, Mark, Note, Notes, Parchment, Particles, Photo, Quote, Stamp, Troops, Thermo, usePop } from './kit';
import { Distance, PL, VoxMap, along, proj, lerpView, View } from './VoxMap';
import { C, HEAD, TYPE, ease, lin, wf } from './theme';
import { EU, por, st } from './ScenesA';

const DR = 'dramatized reconstruction';
const MOS: View = { lon: 36.6, lat: 55.4, k: 300 };

/* 26 — into an empty Moscow */
export const S26: React.FC = () => {
  const f = useCurrentFrame();
  const rode = wf(26, 'rode'), keys = wf(26, 'keys'), no = wf(26, 'no'), em = wf(26, 'empty');
  return (
    <Cam>
      <VoxMap view={MOS} arrows={[{ pts: ['borodino', [36.6, 55.62], 'moscow'], p: ease(f, rode - 6, rode + 40), width: 18 }]}
        pins={[{ at: 'borodino', label: 'BORODINO', o: 1, side: 't', size: 34 }, { at: 'moscow', label: 'MOSCOW', o: 1, side: 'b' }]} />
      <Calendar at={wf(26, 'september') - 4} x={90} y={90} month="SEPTEMBER" day="14" year="1812" s={0.9} />
      <div style={{ position: 'absolute', left: 70, top: 520, padding: '6px 24px', background: 'rgba(239,230,210,0.88)', opacity: lin(f, wf(26, '100000') - 2, wf(26, '100000') + 6) }}>
        <Counter to={100000} at={wf(26, '100000')} dur={24} x={0} y={0} size={100} align="left" label="MEN LEFT TO ENTER MOSCOW" />
        <div style={{ height: 150, width: 560 }} />
      </div>
      <Photo src={st('s26_moscow_view')} at={wf(26, 'expected') - 6} x={1260} y={70} w={580} h={330} rot={2} caption="MOSCOW, 14 SEPTEMBER" credit={DR} />
      <Ico name="key" at={keys - 4} x={1360} y={620} s={150} />
      <Note text="THE KEYS OF THE CITY?" at={keys} x={1450} y={590} size={28} />
      <Mark at={no} x={1360} y={620} s={170} />
      <Stamp text="EMPTY" at={em} x={1520} y={770} size={100} rot={-6} />
    </Cam>
  );
};

/* 27 — Moscow burns */
const Pie: React.FC<{ at: number; x: number; y: number; r: number; p: number; out?: number }> = ({ at, x, y, r, p, out }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 8) * (out !== undefined ? 1 - lin(f, out - 8, out) : 1);
  if (o <= 0) return null;
  const a = Math.min(0.9999, p) * Math.PI * 2;
  const ex = x + r * Math.sin(a), ey = y - r * Math.cos(a);
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: o }}>
      <circle cx={x} cy={y} r={r} fill="#e9dfc6" stroke={C.charcoal} strokeWidth={5} />
      {p > 0 && <path d={`M${x},${y} L${x},${y - r} A${r},${r} 0 ${a > Math.PI ? 1 : 0} 1 ${ex},${ey} Z`} fill={C.fire} stroke={C.charcoal} strokeWidth={4} />}
      <text x={x} y={y + r + 70} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={56} fill={C.charcoal}>{Math.round(p * 4) >= 3 ? '¾ OF MOSCOW BURNED' : 'MOSCOW'}</text>
    </svg>
  );
};
export const S27: React.FC = () => {
  const f = useCurrentFrame();
  const fi = wf(27, 'fires'), tq = wf(27, 'threequarters'), gov = wf(27, 'governor');
  return (
    <Cam>
      <Parchment />
      <Photo src={st('s27_moscow_fire')} at={2} x={90} y={80} w={880} h={520} rot={-2} caption="MOSCOW BURNS" credit={DR} />
      <Pie at={fi} x={1380} y={360} r={210} p={0.75 * ease(f, tq - 10, tq + 30)} out={gov} />
      <Photo src={por('rostopchin')} at={gov - 4} x={1110} y={90} w={360} h={380} rot={3} pos="50% 30%" caption="Count Rostopchin" grade="warm" />
      <Notes lines={['GOVERNOR OF MOSCOW', 'WIDELY BELIEVED', 'TO HAVE ORGANIZED IT']} at={gov + 8} x={1520} y={140} gap={62} size={24} step={12} />
      <Particles kind="embers" n={70} />
    </Cam>
  );
};

/* 28 — he waited */
export const S28: React.FC = () => {
  const f = useCurrentFrame();
  const wa = wf(28, 'waited'), conv = wf(28, 'convinced'), let_ = wf(28, 'letters');
  return (
    <Cam>
      <Parchment dark={0.08 * lin(f, wf(28, 'decision'), wa)} />
      {f < conv + 6 && (
        <AbsoluteFill style={{ opacity: 1 - lin(f, conv - 2, conv + 6) }}>
          <Note text="THE DECISION THAT SEALED HIS FATE" at={wf(28, 'decision') - 4} x={560} y={260} size={36} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center', fontFamily: HEAD, fontWeight: 700, fontSize: 220, color: C.red, opacity: lin(f, wa - 2, wa + 6), transform: `scale(${1.15 - 0.15 * ease(f, wa - 2, wa + 10)})` }}>HE WAITED.</div>
        </AbsoluteFill>
      )}
      {f >= conv - 2 && (
        <AbsoluteFill style={{ opacity: lin(f, conv - 2, conv + 6) }}>
          <Photo src={st('s28_kremlin_desk')} at={conv} x={100} y={90} w={860} h={500} rot={-2} caption="THE KREMLIN · OCTOBER 1812" credit={DR} />
          <Note text="WAITING FOR THE TSAR TO ASK FOR PEACE" at={conv + 10} x={1040} y={130} size={28} />
          {[0, 1, 2, 3].map((i) => { const t = lin(f, let_ + i * 12, let_ + 40 + i * 12); return t > 0 && t < 1 ? <Ico key={i} name="envelope" at={let_ + i * 12} x={1000 + 760 * t} y={600 - 300 * t + 40 * Math.sin(t * 6)} s={110} rot={-10 + 20 * t} /> : null; })}
          <Note text="→ ST. PETERSBURG" at={let_ + 10} x={1460} y={250} size={30} />
          <Stamp text="5 WEEKS" at={wf(28, 'five')} x={1320} y={700} size={90} rot={-5} />
        </AbsoluteFill>
      )}
    </Cam>
  );
};

/* 29 — no answer */
export const S29: React.FC = () => (
  <Cam>
    <Parchment />
    {[[380, 260, -12], [1500, 300, 14], [420, 640, 8], [1480, 680, -9]].map(([x, y, r], i) => <Ico key={i} name="envelope" at={i * 2} x={x} y={y} s={150} rot={r} />)}
    <Photo src={por('alexander')} at={0} x={700} y={90} w={520} h={560} rot={0} pos="50% 25%" caption="Alexander I" grade="warm" />
    <Stamp text="NO REPLY" at={wf(29, 'refused')} x={960} y={420} size={120} rot={-10} />
  </Cam>
);

/* 30 — every day, Kutuzov stronger, winter closer */
export const S30: React.FC = () => {
  const f = useCurrentFrame();
  const str = wf(30, 'stronger'), win = wf(30, 'winter');
  const day = 1 + Math.floor(34 * lin(f, 0, 190));
  return (
    <Cam>
      <Parchment />
      <Headline text={`DAY ${day} IN MOSCOW`} at={0} y={70} size={84} />
      <Photo src={por('kutuzov')} at={wf(30, 'kutuzovs') - 6} x={110} y={260} w={300} h={330} rot={-3} pos="50% 30%" caption="Kutuzov" grade="warm" />
      <Bar at={wf(30, 'kutuzovs')} x={460} y={330} w={620} h={70} p={0.45 + 0.45 * ease(f, str - 10, str + 60)} label="RUSSIAN ARMY: REINFORCED, RESTED" color={C.green} />
      <Thermo at={win - 10} x={1250} y={230} fromC={8} toC={-4} dur={90} s={0.8} />
      <Ico name="snowflake" at={win} x={1700 - 80 * ease(f, win, win + 90)} y={280} s={140} />
    </Cam>
  );
};

/* 31 — the mistake */
const Case: React.FC<{ at: number; x: number; city: string; year: string; result: string; ok: boolean; markAt: number }> = ({ at, x, city, year, result, ok, markAt }) => {
  const k = usePop(at, 13);
  if (k <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: 330, width: 480, height: 400, background: '#f6f0e2', boxShadow: '0 16px 36px rgba(20,12,4,0.45)', opacity: Math.min(1, k * 2), transform: `translateY(${(1 - k) * 60}px)`, borderTop: `10px solid ${ok ? C.green : C.red}`, textAlign: 'center' }}>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 80, color: C.charcoal, marginTop: 30 }}>{city}</div>
      <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 36, color: C.dim }}>CAPITAL TAKEN · {year}</div>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 64, color: ok ? C.green : C.red, marginTop: 50 }}>{result}</div>
      <Mark at={markAt} x={400} y={95} s={110} ok={ok} />
    </div>
  );
};
export const S31: React.FC = () => {
  const cap = wf(31, 'capturing'), al = wf(31, 'always'), aus = wf(31, 'austria'), sur = wf(31, 'surrender');
  return (
    <Cam>
      <Parchment />
      <Headline text="THIS WAS THE MISTAKE" at={wf(31, 'mistake') - 6} y={70} size={110} color={C.red} />
      <Case at={cap} x={170} city="VIENNA" year="1805" result="PEACE" ok markAt={al} />
      <Case at={cap + 8} x={720} city="BERLIN" year="1806" result="PEACE" ok markAt={al + 4} />
      <Case at={aus - 10} x={1270} city="MOSCOW" year="1812" result="NO PEACE" ok={false} markAt={sur - 6} />
      <Stamp text="NO SURRENDER" at={sur} x={1510} y={300} size={60} rot={8} />
    </Cam>
  );
};

/* 32 — 35 days */
export const S32: React.FC = () => {
  const f = useCurrentFrame();
  const n = wf(32, '35');
  return (
    <Cam push={0.04 * ease(f, n, n + 60)}>
      <Parchment />
      <Calendar at={wf(32, 'october') - 4} x={150} y={170} month="OCTOBER" day="19" year="1812" s={1.2} />
      <Note text="NAPOLEON FINALLY LEAVES MOSCOW" at={wf(32, 'left')} x={140} y={680} size={30} />
      <Counter to={35} at={n} dur={26} x={1230} y={240} size={330} label="DAYS OF WAITING" color={C.red} />
    </Cam>
  );
};

/* 33 — Maloyaroslavets: forced back onto the dead road */
export const S33: React.FC = () => {
  const f = useCurrentFrame();
  const V: View = { lon: 35.0, lat: 55.2, k: 210 };
  const P = proj(V);
  const so = wf(33, 'southern'), bl = wf(33, 'blocked'), fo = wf(33, 'forced'), sb = wf(33, 'stripped');
  return (
    <Cam>
      <VoxMap view={V}
        arrows={[{ pts: ['smolensk', 'vyazma', 'borodino', 'moscow'], p: 1, color: 'rgba(110,95,70,0.7)', width: 10, dashed: true },
          { pts: ['moscow', [37.2, 55.3], 'maloyaroslavets'], p: ease(f, so - 4, so + 40), width: 16 },
          { pts: ['maloyaroslavets', [35.6, 55.25], 'vyazma', [33.0, 54.95]], p: ease(f, fo - 2, fo + 70), width: 16 }]}
        pins={[{ at: 'moscow', label: 'MOSCOW', o: 1, side: 'r', size: 34 }, { at: 'maloyaroslavets', label: 'MALOYAROSLAVETS', o: lin(f, so + 20, so + 30), side: 'r', size: 34 }, { at: 'vyazma', label: 'VYAZMA', o: lin(f, fo + 30, fo + 40), side: 't', size: 30 }]}
        labels={[{ at: [36.6, 54.45], text: 'UNTOUCHED COUNTRY', o: lin(f, so + 10, so + 24), size: 32, color: C.green }]} />
      <Mark at={bl} x={P(...PL.maloyaroslavets)[0]} y={P(...PL.maloyaroslavets)[1]} s={130} />
      <Note text="ROUTE BLOCKED · 24 OCTOBER" at={bl + 4} x={1220} y={790} size={28} />
      <Note text="THE OLD ROAD: ALREADY STRIPPED BARE" at={sb - 6} x={70} y={70} size={32} />
    </Cam>
  );
};

/* 34 — winter arrives */
export const S34: React.FC = () => (
  <Cam>
    <Parchment />
    <AbsoluteFill style={{ background: 'rgba(200,215,230,0.25)' }} />
    <Calendar at={wf(34, 'november') - 6} x={220} y={200} month="NOVEMBER" day="6" year="1812" s={1.2} />
    <Ico name="snowflake" at={wf(34, 'winter') - 4} x={1250} y={400} s={380} />
    <Headline text="THE WINTER ARRIVES" at={wf(34, 'winter')} x={760} y={720} size={90} align="left" />
    <Particles kind="snow" n={160} />
  </Cam>
);

/* 35 — summer uniforms, smooth horseshoes */
export const S35: React.FC = () => {
  const sh = wf(35, 'shoes');
  return (
    <Cam>
      <Parchment />
      <Photo src={st('s35_frozen_soldier')} at={2} x={90} y={80} w={860} h={520} rot={-2} caption="THE RETREAT · NOVEMBER 1812" credit={DR} grade="cold" />
      <Note text="STILL IN SUMMER UNIFORMS" at={wf(35, 'summer') - 4} x={1060} y={130} size={32} />
      <Ico name="horseshoe" at={wf(35, 'horses') - 4} x={1250} y={400} s={190} />
      <Mark at={sh} x={1250} y={400} s={220} />
      <Notes lines={['NO WINTER SHOES', 'NO GRIP ON ICE']} at={sh + 4} x={1400} y={350} gap={62} size={28} />
      <Stamp text="SLIPPED · FELL · DIED" at={wf(35, 'died')} x={1400} y={680} size={56} rot={-4} />
      <Particles kind="snow" n={60} />
    </Cam>
  );
};

/* 36 — abandoned guns, horse meat */
export const S36: React.FC = () => {
  const ab = wf(36, 'abandoned');
  return (
    <Cam>
      <Parchment />
      <Photo src={st('s36_abandoned')} at={2} x={90} y={80} w={860} h={520} rot={-2} caption="ABANDONED ON THE ROAD" credit={DR} grade="cold" />
      <Ico name="cannon" at={wf(36, 'cannon') - 4} x={1170} y={240} s={180} grey={1} />
      <Ico name="wagon" at={wf(36, 'wagons') - 4} x={1520} y={240} s={180} grey={1} />
      <Stamp text="ABANDONED" at={ab} x={1350} y={250} size={84} rot={-6} />
      <Notes lines={['MEN FOUGHT OVER HORSE MEAT', 'AND FROZE WHERE THEY SLEPT']} at={wf(36, 'fought') - 4} x={1040} y={480} gap={66} size={28} step={Math.max(10, wf(36, 'froze') - wf(36, 'fought'))} />
      <Particles kind="snow" n={60} />
    </Cam>
  );
};

/* 37 — Cossacks and peasants */
export const S37: React.FC = () => {
  const f = useCurrentFrame();
  const V: View = { lon: 33.6, lat: 54.95, k: 130 };
  const P = proj(V);
  const co = wf(37, 'cossacks'), pe = wf(37, 'peasants');
  const route: [number, number][] = [PL.moscow, PL.vyazma, [33.0, 54.95], PL.smolensk, PL.krasnoi, PL.orsha];
  const hits: [number, number, number][] = [[35.5, 55.8, 0], [34.6, 54.6, 1], [33.4, 55.5, 2], [32.6, 54.4, 3], [31.6, 55.2, 4], [30.9, 54.1, 5]];
  return (
    <Cam>
      <VoxMap view={V} snow={1} arrows={[{ pts: route, p: 1, width: 12, dashed: true }]}
        pins={[{ at: 'smolensk', label: 'SMOLENSK', o: 1, side: 't', size: 30 }, { at: 'moscow', label: 'MOSCOW', o: 1, side: 'b', size: 30 }]}>
        {(PP) => hits.map(([lo, la, i]) => { const t = ease(f, (i % 2 ? pe : co) + i * 5, (i % 2 ? pe : co) + i * 5 + 16); if (t <= 0) return null;
          const tgt = route.reduce((b, r) => (Math.hypot(r[0] - lo, r[1] - la) < Math.hypot(b[0] - lo, b[1] - la) ? r : b));
          const [x0, y0] = PP(lo, la), [x1, y1] = PP((lo + tgt[0]) / 2, (la + tgt[1]) / 2);
          return <g key={i}><line x1={x0} y1={y0} x2={x0 + (x1 - x0) * t} y2={y0 + (y1 - y0) * t} stroke={C.green} strokeWidth={10} strokeLinecap="round" /><circle cx={x0 + (x1 - x0) * t} cy={y0 + (y1 - y0) * t} r={12} fill={C.green} /></g>; })}
      </VoxMap>
      <Photo src={st('s37_cossacks')} at={co - 6} x={1260} y={560} w={560} h={300} rot={2} caption="COSSACK RAIDS" credit={DR} />
      <Note text="STRAGGLERS ATTACKED DAY AND NIGHT" at={wf(37, 'day') - 6} x={70} y={70} size={32} />
      <Particles kind="snow" n={50} />
    </Cam>
  );
};

/* 38 — minus thirty */
export const S38: React.FC = () => (
  <Cam>
    <Parchment />
    <AbsoluteFill style={{ background: 'rgba(160,185,210,0.18)' }} />
    <Thermo at={wf(38, 'temperatures') - 8} x={140} y={120} fromC={-5} toC={-30} dur={80} s={1} />
    <Photo src={st('s38_campfire')} at={wf(38, 'night')} x={900} y={90} w={900} h={520} rot={2} caption="A NIGHT ON THE RETREAT" credit={DR} grade="cold" />
    <Note text="AT TIMES −30 °C (−22 °F) AND COLDER" at={wf(38, 'thirty') - 4} x={920} y={720} size={30} />
    <Particles kind="snow" n={120} />
  </Cam>
);

/* 39 — the Berezina trap */
export const S39: React.FC = () => {
  const f = useCurrentFrame();
  const V: View = { lon: 28.9, lat: 54.3, k: 330 };
  const P = proj(V);
  const re = wf(39, 'reached'), th = wf(39, 'three'), go = wf(39, 'gone');
  const river: [number, number][] = [[28.6, 54.95], [28.55, 54.6], [28.4, 54.35], [28.5, 54.23], [28.9, 53.6]];
  return (
    <Cam>
      <VoxMap view={V} snow={1}
        arrows={[{ pts: [[30.6, 54.45], [29.6, 54.3], [28.75, 54.25]], p: ease(f, re - 4, re + 40), width: 16 },
          { pts: [[30.7, 54.0], [30.1, 54.05], [29.6, 54.12]], p: ease(f, th, th + 26), color: C.green, width: 14 },
          { pts: [[27.7, 53.75], [28.1, 53.95], [28.4, 54.12]], p: ease(f, th + 8, th + 34), color: C.green, width: 14 },
          { pts: [[28.9, 55.1], [28.85, 54.8], [28.75, 54.55]], p: ease(f, th + 16, th + 42), color: C.green, width: 14 }]}
        pins={[{ at: 'borisov', label: 'BORISOV', o: lin(f, re, re + 10), side: 'l', size: 34 }]}>
        {(PP) => <path d={river.map((p, i) => `${i ? 'L' : 'M'}${PP(...p).join(',')}`).join('')} fill="none" stroke="#4f86b0" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />}
      </VoxMap>
      <Note text="BEREZINA RIVER · LATE NOVEMBER" at={re - 4} x={70} y={70} size={32} />
      <Note text="RUSSIAN ARMIES CLOSING FROM 3 SIDES" at={th} x={70} y={136} size={28} />
      <Ico name="bridge" at={go - 6} x={P(...PL.borisov)[0] + 70} y={P(...PL.borisov)[1] - 10} s={120} />
      <Mark at={go} x={P(...PL.borisov)[0] + 70} y={P(...PL.borisov)[1] - 10} s={140} />
      <Particles kind="snow" n={50} />
    </Cam>
  );
};

/* 40 — the pontonniers and General Eblé */
export const S40: React.FC = () => {
  const f = useCurrentFrame();
  const two = wf(40, 'two'), com = wf(40, 'commander'), dis = wf(40, 'disobeyed'), sav = wf(40, 'saved');
  return (
    <Cam>
      <Parchment />
      <Photo src={st('s40_pontonniers')} at={2} x={90} y={80} w={860} h={500} rot={-2} caption="THE PONTONNIERS, IN ICY WATER" credit={DR} grade="cold" />
      <Ico name="bridge" at={two} x={1180} y={200} s={170} />
      <Ico name="bridge" at={two + 6} x={1400} y={200} s={170} />
      <Note text="2 BRIDGES · BUILT IN THE RIVER" at={two + 8} x={1530} y={170} size={24} w={300} />
      <div style={{ position: 'absolute', left: 1050, top: 340, width: 780, padding: '26px 34px', background: '#f6f0e2', boxShadow: '0 16px 36px rgba(20,12,4,0.45)', opacity: lin(f, com - 4, com + 6), transform: 'rotate(1deg)', fontFamily: TYPE, fontWeight: 700, color: C.ink }}>
        <div style={{ fontSize: 22, color: C.dim, letterSpacing: 3 }}>FILE · GRANDE ARMÉE ENGINEERS</div>
        <div style={{ fontFamily: HEAD, fontSize: 52, marginTop: 6 }}>GEN. JEAN-BAPTISTE ÉBLÉ</div>
        <div style={{ fontSize: 26, marginTop: 14 }}>ORDERS: DESTROY THE BRIDGING TRAIN</div>
        <div style={{ fontSize: 26, marginTop: 8, opacity: lin(f, dis, dis + 8) }}>KEPT: TOOLS, IRONWORK, FIELD FORGES</div>
      </div>
      <Stamp text="DISOBEYED ORDERS" at={dis + 6} x={1450} y={700} size={64} rot={-6} />
      <Note text="→ SAVED WHAT WAS LEFT OF THE ARMY" at={sav - 4} x={1050} y={790} size={26} />
    </Cam>
  );
};

/* 41 — three days under fire */
export const S41: React.FC = () => (
  <Cam>
    <Parchment />
    <Photo src={st('s41_bridge_chaos')} at={2} x={90} y={80} w={900} h={520} rot={-2} caption="THE BEREZINA CROSSING" credit={DR} grade="cold" />
    <Counter to={3} at={wf(41, 'three')} dur={10} x={1430} y={110} size={240} suffix=" DAYS" label="UNDER RUSSIAN FIRE" />
    <Notes lines={['TENS OF THOUSANDS', 'NEVER REACHED', 'THE OTHER SIDE']} at={wf(41, 'tens') - 4} x={1130} y={470} gap={66} size={32} step={10} />
    <Particles kind="snow" n={50} />
  </Cam>
);

/* 42 — Napoleon leaves by sleigh */
export const S42: React.FC = () => {
  const f = useCurrentFrame();
  const V: View = { lon: 14.5, lat: 51.5, k: 40 };
  const P = proj(V);
  const ra = wf(42, 'raced');
  const p = ease(f, ra - 6, ra + 110);
  const pts = ['smorgon', 'vilnius', 'warsaw', 'berlin', [8, 50.5] as [number, number], 'paris'].map((x) => (typeof x === 'string' ? PL[x] : x));
  const [sx, sy] = along(pts.map((q) => P(...q)), p);
  return (
    <Cam>
      <VoxMap view={V} arrows={[{ pts, p, width: 10 }]}
        pins={[{ at: 'smorgon', label: 'SMORGON', o: lin(f, 4, 14), side: 'b', size: 32 }, { at: 'paris', label: 'PARIS', o: lin(f, ra + 60, ra + 74), side: 'l' }]} />
      <Ico name="sleigh" at={ra - 8} x={sx} y={sy - 60} s={130} />
      <Calendar at={wf(42, 'december') - 4} x={80} y={90} month="DECEMBER" day="5" year="1812" s={0.9} />
      <Note text="HE REACHES PARIS ON 18 DECEMBER" at={ra + 70} x={80} y={500} size={28} />
      <Photo src={st('s42_sleigh')} at={wf(42, 'left') - 4} x={1290} y={560} w={540} h={300} rot={2} caption="LEAVING THE ARMY BEHIND" credit={DR} />
    </Cam>
  );
};

/* 43 — Ney, the last man out */
export const S43: React.FC = () => (
  <Cam>
    <Parchment />
    <Photo src={por('ney')} at={2} x={150} y={100} w={480} h={540} rot={-3} pos="50% 30%" caption="Marshal Michel Ney" credit="portrait by F. Gérard · public domain" grade="warm" />
    <Notes lines={['MARSHAL OF FRANCE', '“THE BRAVEST OF THE BRAVE”', 'COMMANDED THE REAR GUARD']} at={wf(43, 'marshal')} x={720} y={150} gap={66} size={28} step={10} />
    <Photo src={st('s43_rearguard')} at={wf(43, 'last') - 10} x={1180} y={420} w={640} h={340} rot={2} caption="THE REAR GUARD" credit={DR} grade="cold" />
    <Stamp text="LAST TO LEAVE RUSSIA" at={wf(43, 'last')} x={890} y={500} size={56} rot={-5} />
  </Cam>
);

/* 44 — the cost, and Minard's chart */
export const S44: React.FC = () => {
  const f = useCurrentFrame();
  const fr = wf(44, 'fraction'), dead = wf(44, '300000'), dec = wf(44, 'decades'), n1 = wf(44, '422000'), n2 = wf(44, '10000'), best = wf(44, 'best');
  return (
    <Cam>
      <Parchment />
      {f < dec + 6 && (
        <AbsoluteFill style={{ opacity: 1 - lin(f, dec - 4, dec + 6) }}>
          <Troops n={50} cols={10} x={120} y={150} size={76} gap={14} at={0} lost={(i) => ([7, 33].includes(i) ? 0 : lin(f, fr + (i % 10) * 2, fr + 10 + (i % 10) * 2))} />
          <Note text="EACH FIGURE ≈ 9,000 MEN" at={4} x={120} y={80} size={22} />
          <Counter to={300000} at={dead} dur={34} x={1460} y={250} size={130} suffix="+" label="FRENCH & ALLIED DEAD (EST.)" color={C.red} />
        </AbsoluteFill>
      )}
      {f >= dec - 4 && (
        <AbsoluteFill style={{ opacity: lin(f, dec - 4, dec + 6) }}>
          <Photo src="assets/archival/minard.png" at={dec} x={80} y={80} w={1180} h={548} rot={-1} pos="50% 50%" grade="none" zoom={0.04} caption="Charles Joseph Minard, 1869" credit="public domain" />
          <Counter to={422000} at={n1} dur={20} x={1590} y={130} size={96} label="MEN SET OUT" />
          <Counter to={10000} from={422000} at={n2} dur={30} x={1590} y={380} size={96} label="CAME BACK" color={C.red} />
          <Quote at={best - 4} text="The best statistical graphic ever drawn." by="Edward Tufte" x={980} y={620} w={860} />
        </AbsoluteFill>
      )}
    </Cam>
  );
};

/* 45 — Europe turns: Leipzig */
export const S45: React.FC = () => {
  const f = useCurrentFrame();
  const P = proj(EU);
  const pr = wf(45, 'prussia'), le = wf(45, 'leipzig');
  return (
    <Cam>
      <VoxMap view={EU}
        washes={[{ r: 'france', o: 0.5, color: C.blue }, { r: 'prussia', o: ease(f, pr - 4, pr + 10), color: C.green, label: 'PRUSSIA', at: [16.5, 53.6], size: 34 }, { r: 'austria', o: ease(f, pr + 6, pr + 20), color: C.green, label: 'AUSTRIA', at: [18, 48.3], size: 34 }, { r: 'russia', o: 0.5, color: C.green }]}
        arrows={[{ pts: ['berlin', [12.8, 51.9]], p: ease(f, le - 30, le), color: C.green, width: 12 }, { pts: ['vienna', [14, 50], [12.8, 51.0]], p: ease(f, le - 26, le + 4), color: C.green, width: 12 }, { pts: ['warsaw', [16, 51.6], [13.0, 51.4]], p: ease(f, le - 22, le + 8), color: C.green, width: 12 }]}
        pins={[{ at: 'leipzig', label: 'LEIPZIG · OCT 1813', o: lin(f, le - 6, le + 4), side: 'l' }]} />
      <Mark at={le + 10} x={P(...PL.leipzig)[0]} y={P(...PL.leipzig)[1]} s={100} />
      <Note text="THE AURA OF INVINCIBILITY: GONE" at={wf(45, 'aura') - 4} x={1090} y={70} size={30} />
      <Photo src={st('s45_leipzig')} at={le - 4} x={1290} y={560} w={540} h={300} rot={2} caption="THE BATTLE OF THE NATIONS" credit={DR} />
    </Cam>
  );
};

/* 46 — abdication, Elba */
const VF: View = { lon: 6.5, lat: 46.5, k: 78 };
export const S46: React.FC = () => {
  const f = useCurrentFrame();
  const th = wf(46, 'throne'), ex = wf(46, 'exiled');
  return (
    <Cam>
      <VoxMap view={VF} arrows={[{ pts: ['paris', [5.2, 45.6], [8.5, 43.8], 'elba'], p: ease(f, ex - 4, ex + 50), width: 12, dashed: false }]}
        pins={[{ at: 'paris', label: 'PARIS', o: 1, side: 'l' }, { at: 'elba', label: 'ELBA', o: lin(f, ex + 30, ex + 40), side: 'r' }]} />
      <Note text="APRIL 1814" at={wf(46, 'april') - 4} x={70} y={70} size={36} />
      <Ico name="crown" at={th - 6} x={1360} y={300 + 220 * ease(f, th + 10, th + 40)} s={190} rot={50 * ease(f, th + 10, th + 40)} />
      <Stamp text="ABDICATED" at={th + 6} x={1400} y={300} size={90} rot={-8} />
    </Cam>
  );
};

/* 47 — Hundred Days, Waterloo */
export const S47: React.FC = () => {
  const f = useCurrentFrame();
  const P = proj(VF);
  const ret = wf(47, 'return'), hu = wf(47, 'hundred'), wa = wf(47, 'waterloo');
  return (
    <Cam>
      <VoxMap view={VF} arrows={[{ pts: ['elba', 'cannes', [5.7, 45.2], 'paris'], p: ease(f, ret - 4, ret + 40), width: 12 }, { pts: ['paris', [3.5, 49.8], 'waterloo'], p: ease(f, wa - 14, wa + 10), width: 12 }]}
        pins={[{ at: 'paris', label: 'PARIS', o: 1, side: 'l' }, { at: 'elba', label: 'ELBA', o: 1, side: 'r' }, { at: 'waterloo', label: 'WATERLOO · 1815', o: lin(f, wa, wa + 8), side: 'r' }]} />
      <Mark at={wa + 10} x={P(...PL.waterloo)[0]} y={P(...PL.waterloo)[1]} s={110} />
      <div style={{ position: 'absolute', left: 1280, top: 520, padding: '6px 24px', background: 'rgba(239,230,210,0.88)', opacity: lin(f, hu - 2, hu + 6) }}>
        <Counter to={100} at={hu} dur={20} x={0} y={0} size={130} suffix=" DAYS" align="left" label="ONE LAST RETURN" />
        <div style={{ height: 180, width: 480 }} />
      </div>
    </Cam>
  );
};

/* 48 — what really destroyed the Grande Armée */
const Myth: React.FC<{ at: number; x: number; icon: string; text: string; markAt: number; out: number }> = ({ at, x, icon, text, markAt, out }) => {
  const f = useCurrentFrame();
  const k = usePop(at, 13);
  const o = Math.min(1, k * 2) * (1 - lin(f, out - 8, out));
  if (k <= 0 || o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: 280, width: 560, height: 440, opacity: o, background: '#f6f0e2', boxShadow: '0 16px 36px rgba(20,12,4,0.45)', textAlign: 'center' }}>
      <svg viewBox="0 0 100 100" width={220} height={220} style={{ marginTop: 40 }}>{React.createElement(ICONS[icon])}</svg>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 70, color: C.charcoal }}>{text}</div>
      <Mark at={markAt} x={280} y={170} s={260} />
    </div>
  );
};
export const S48: React.FC = () => {
  const f = useCurrentFrame();
  const ob = wf(48, 'battle'), wi = wf(48, 'winter'), ga = wf(48, 'gamble'), d35 = wf(48, '35');
  return (
    <Cam>
      <Parchment />
      <Headline text="SO WHAT REALLY DESTROYED IT?" at={0} y={70} size={84} out={ga - 6} />
      <Myth at={ob - 10} x={280} icon="cannon" text="ONE BATTLE" markAt={ob + 4} out={ga - 4} />
      <Myth at={wi - 10} x={1080} icon="snowflake" text="THE WINTER" markAt={wi + 6} out={ga - 4} />
      {f >= ga - 6 && (
        <AbsoluteFill style={{ opacity: lin(f, ga - 6, ga + 4) }}>
          <Headline text="A GAMBLE" at={ga - 4} x={110} y={90} size={150} align="left" color={C.red} />
          <Notes lines={['ONE BATTLE WOULD END IT', 'ONE CAPTURED CITY WOULD END IT']} at={wf(48, 'one', 1) - 4} x={120} y={320} gap={70} size={32} step={Math.max(10, wf(48, 'city') - wf(48, 'one', 1))} />
          <Counter to={35} at={d35} dur={20} x={120} y={500} size={170} suffix=" DAYS" align="left" label="WAITING IN A BURNING CITY" color={C.red} />
          <Photo src={st('s31_napoleon_close')} at={ga + 4} x={1150} y={100} w={640} h={600} rot={2} caption="NAPOLEON, 1812" credit={DR} />
        </AbsoluteFill>
      )}
    </Cam>
  );
};

/* 49 — the question + subscribe */
export const S49: React.FC = () => {
  const f = useCurrentFrame();
  const mi = wf(49, 'mistake'), un = wf(49, 'unconquerable'), sub = wf(49, 'subscribe');
  const card = (at: number, x: number, t1: string, t2: string, c: string) => (
    <div style={{ position: 'absolute', left: x, top: 330, width: 560, padding: '30px 36px', background: '#f6f0e2', borderTop: `10px solid ${c}`, boxShadow: '0 16px 36px rgba(20,12,4,0.45)', opacity: lin(f, at - 4, at + 6), transform: `translateY(${(1 - ease(f, at - 4, at + 10)) * 40}px)` }}>
      <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 28, color: C.dim }}>{t1}</div>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 64, lineHeight: 1.05, color: c }}>{t2}</div>
    </div>
  );
  return (
    <Cam>
      <Parchment />
      <Photo src={por('napoleon')} at={0} x={110} y={150} w={440} h={500} rot={-3} pos="40% 30%" caption="Napoleon" grade="warm" />
      <Headline text="YOUR VERDICT?" at={2} x={660} y={90} size={110} align="left" />
      {card(mi, 640, 'A', "NAPOLEON'S GREATEST MISTAKE", C.red)}
      {card(un, 1250, 'B', 'RUSSIA WAS UNCONQUERABLE', C.green)}
      <Note text="TELL US IN THE COMMENTS ↓" at={wf(49, 'comments') - 4} x={660} y={640} size={34} />
      <div style={{ position: 'absolute', left: 660, top: 730, padding: '14px 34px', background: C.red, color: C.paper, fontFamily: HEAD, fontWeight: 700, fontSize: 52, letterSpacing: 3, opacity: lin(f, sub - 4, sub + 4), transform: `scale(${0.9 + 0.1 * ease(f, sub - 4, sub + 10)})`, transformOrigin: 'left center' }}>SUBSCRIBE · BURIED CHRONICLES</div>
    </Cam>
  );
};

export const SCENES_B = [S26, S27, S28, S29, S30, S31, S32, S33, S34, S35, S36, S37, S38, S39, S40, S41, S42, S43, S44, S45, S46, S47, S48, S49];
