import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Calendar, Cam, Counter, Headline, Ico, Note, Notes, Parchment, Particles, Photo, Stamp } from './kit';
import { AfricaMap, HOSP, PL, PostPlan, lerpView, proj } from './Maps';
import { C, HEAD, SANS, TYPE, W, ease, hash01, lin, wf } from './theme';

const st = (n: string) => `assets/stills/${n}.png`;
const por = (n: string) => `assets/portraits/${n}.jpg`;
const DR = 'dramatized reconstruction';

/* 01 — 22 January 1879, Rorke's Drift */
export const S01: React.FC = () => {
  const f = useCurrentFrame();
  const z = ease(f, 20, 150);
  const v = lerpView({ lon: 26, lat: -29.5, k: 62 }, { lon: 30.4, lat: -28.6, k: 520 }, z);
  const n150 = wf(1, '150');
  return (
    <Cam>
      <AfricaMap view={v} regions={lin(f, 40, 70)} rivers={lin(f, 90, 120)}
        pins={[{ at: 'rorkes', label: "RORKE'S DRIFT", o: lin(f, wf(1, 'rorkes') - 10, wf(1, 'rorkes')), side: 'l' }]}>
        {(P) => (<g opacity={lin(f, 40, 70) * (1 - lin(f, 150, 170))}>
          <text x={P(29.6, -29.3)[0]} y={P(29.6, -29.3)[1]} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={44} fill={C.red} letterSpacing={6}>BRITISH NATAL</text>
          <text x={P(32.0, -28.0)[0]} y={P(32.0, -28.0)[1]} textAnchor="middle" fontFamily={HEAD} fontWeight={700} fontSize={44} fill={C.green} letterSpacing={6}>ZULU KINGDOM</text>
        </g>)}
      </AfricaMap>
      <Calendar at={2} x={70} y={110} month="JANUARY" day="22" year="1879" s={0.95} rot={-4} />
      <Photo src={st('r01_outpost')} at={wf(1, 'outpost') - 4} x={110} y={850} w={860} h={420} rot={2} caption="A SMALL MISSION STATION" credit={DR} />
      <div style={{ position: 'absolute', left: 560, top: 130, padding: '6px 26px', background: 'rgba(239,230,210,0.9)', opacity: lin(f, n150 - 2, n150 + 6), borderLeft: `8px solid ${C.red}` }}>
        <Counter to={150} at={n150} dur={18} x={0} y={0} size={150} align="left" label="SOLDIERS" color={C.red} />
        <div style={{ height: 210, width: 330 }} />
      </div>
    </Cam>
  );
};

/* 02 — Isandlwana */
export const S02: React.FC = () => {
  const f = useCurrentFrame();
  const V = { lon: 30.6, lat: -28.36, k: 2600 };
  const P = proj(V);
  const wi = wf(2, 'wiped'), dead = wf(2, '1300');
  const [x0, y0] = P(...PL.rorkes), [x1, y1] = P(...PL.isandlwana);
  return (
    <Cam>
      <AfricaMap view={V} rivers={1} pins={[{ at: 'rorkes', label: "RORKE'S DRIFT", o: 1, side: 'b', size: 44 }, { at: 'isandlwana', label: 'ISANDLWANA', o: lin(f, wf(2, 'isandlwana') - 10, wf(2, 'isandlwana')), side: 't', size: 48 }]}>
        {() => (<g opacity={lin(f, 4, 24)}>
          <line x1={x0} y1={y0} x2={x0 + (x1 - x0) * ease(f, 4, 30)} y2={y0 + (y1 - y0) * ease(f, 4, 30)} stroke={C.charcoal} strokeWidth={4} strokeDasharray="12 10" />
          <text x={(x0 + x1) / 2 + 40} y={(y0 + y1) / 2 + 150} textAnchor="middle" fontFamily={TYPE} fontWeight={700} fontSize={46} fill={C.ink} stroke="rgba(239,230,210,0.95)" strokeWidth={7} style={{ paintOrder: 'stroke' }}>~6 MILES</text>
        </g>)}
      </AfricaMap>
      <Note text="THE SAME DAY · ISANDLWANA" at={wf(2, 'just')} x={70} y={130} size={36} />
      <Stamp text="WIPED OUT" at={wi} x={Math.min(x1, 760)} y={y1 - 330} size={92} rot={-8} />
      <div style={{ position: 'absolute', left: 70, top: 860, padding: '6px 26px', background: 'rgba(239,230,210,0.9)', opacity: lin(f, dead - 2, dead + 6), borderLeft: `8px solid ${C.red}` }}>
        <Counter to={1300} at={dead} dur={22} x={0} y={0} size={140} align="left" suffix="+" label="BRITISH & ALLIED DEAD" color={C.red} />
        <div style={{ height: 200, width: 560 }} />
      </div>
    </Cam>
  );
};

/* 03 — 150 vs 4,000, one dot per man */
const Dots: React.FC<{ n: number; cols: number; x: number; y: number; gap: number; r: number; color: string; at: number; dur: number; from?: 'right' | 'fade' }> = ({ n, cols, x, y, gap, r, color, at, dur, from = 'fade' }) => {
  const f = useCurrentFrame();
  return (
    <svg width={W} height={1920} style={{ position: 'absolute', inset: 0 }}>
      {Array.from({ length: n }, (_, i) => {
        const cx = x + (i % cols) * gap, cy = y + Math.floor(i / cols) * gap;
        const t0 = at + (from === 'right' ? (1 - (i % cols) / cols) * dur * 0.7 + hash01(i, 5) * dur * 0.3 : (i / n) * dur);
        const p = ease(f, t0, t0 + 8);
        if (p <= 0) return null;
        return <circle key={i} cx={cx + (from === 'right' ? (1 - p) * 300 : 0)} cy={cy} r={r} fill={color} opacity={p} />;
      })}
    </svg>
  );
};
export const S03: React.FC = () => {
  const f = useCurrentFrame();
  const n4 = wf(3, '4000');
  return (
    <Cam>
      <Parchment />
      <Note text="EACH DOT = ONE MAN" at={0} x={70} y={100} size={34} />
      <Dots n={150} cols={25} x={110} y={230} gap={20} r={7.5} color={C.redHi} at={2} dur={10} />
      <div style={{ position: 'absolute', left: 640, top: 225, fontFamily: HEAD, fontWeight: 700, fontSize: 92, color: C.red, lineHeight: 1 }}>150<div style={{ fontFamily: TYPE, fontSize: 28, color: C.ink }}>DEFENDERS</div></div>
      <Dots n={4000} cols={60} x={92} y={430} gap={15.3} r={5.6} color="#2d241b" at={n4 - 16} dur={44} from="right" />
      <Stamp text="UP TO 4,000 WARRIORS" at={n4 + 4} x={540} y={850} size={74} rot={-6} color="#8e1b16" />
    </Cam>
  );
};

/* 04 — the officers; they stayed */
export const S04: React.FC = () => {
  const sick = wf(4, 'sick'), stay = wf(4, 'stayed');
  return (
    <Cam>
      <Parchment />
      <Photo src={por('chard')} at={0} x={70} y={110} w={440} h={500} rot={-3} pos="50% 20%" caption="Lt. John Chard" credit="photograph · public domain" grade="sepia" />
      <Notes lines={['ROYAL ENGINEERS', 'AGE 31 · IN COMMAND']} at={6} x={560} y={150} gap={60} size={28} step={8} />
      <Photo src={por('bromhead')} at={10} x={560} y={370} w={440} h={420} rot={3} pos="50% 30%" caption="Lt. Gonville Bromhead" credit="engraving · public domain" grade="sepia" />
      <Notes lines={['24TH FOOT · AGE 33', 'PARTLY DEAF']} at={16} x={70} y={770} gap={60} size={30} step={8} />
      <Note text="DOZENS SICK IN THE HOSPITAL" at={sick - 4} x={70} y={930} size={34} />
      <Stamp text="THEY STAYED" at={stay} x={540} y={1130} size={110} rot={-6} />
    </Cam>
  );
};

/* 05 — walls of maize sacks and biscuit boxes */
export const S05: React.FC = () => {
  const f = useCurrentFrame();
  const hr = wf(5, 'hour'), ma = wf(5, 'maize'), bi = wf(5, 'biscuit');
  return (
    <Cam>
      <PostPlan wall={ease(f, ma - 20, ma + 40)} cross={ease(f, bi - 4, bi + 26)} />
      <Ico name="clock" at={hr - 6} x={170} y={190} s={150} />
      <Note text="≈ 1 HOUR TO BUILD" at={hr} x={270} y={160} size={36} />
      <Ico name="sack" at={ma - 2} x={800} y={215} s={130} rot={-6} />
      <Ico name="box" at={bi - 2} x={950} y={215} s={120} rot={6} />
      <Note text="MAIZE SACKS ≈ 200 LB EACH" at={ma + 6} x={70} y={1180} size={30} />
    </Cam>
  );
};

/* 06 — the attack begins */
export const S06: React.FC = () => (
  <Cam push={0.06 * ease(useCurrentFrame(), 0, 60)}>
    <Parchment dark={0.15} />
    <Photo src={st('r02_charge')} at={0} x={40} y={260} w={1000} h={700} rot={-1} caption="THE ATTACK" credit={DR} grade="warm" />
    <Stamp text="4:30 PM" at={wf(6, 'attack') - 4} x={760} y={230} size={90} rot={6} />
  </Cam>
);

/* 07 — waves; the burning hospital; patients dragged out */
export const S07: React.FC = () => {
  const f = useCurrentFrame();
  const wa = wf(7, 'wave'), fi = wf(7, 'fire'), ha = wf(7, 'hacked'), dr = wf(7, 'dragged');
  return (
    <Cam>
      <PostPlan wall={1} cross={1} attack={lin(f, wa - 6, wa + 6) * (1 - lin(f, fi + 6, fi + 20) * 0.6)} burn={ease(f, fi - 4, fi + 20)} evac={ease(f, ha, dr + 50)} />
      {[0, 1, 2, 3].map((k) => <Ico key={k} name="flame" at={fi + k * 4} x={HOSP.x + 40 + k * 70} y={HOSP.y - 60 + (k % 2) * 20} s={110} />)}
      <Headline text="WAVE AFTER WAVE" at={wa - 4} y={110} size={90} out={fi} />
      <Photo src={st('r04_hospital_fire')} at={fi - 2} x={60} y={60} w={600} h={330} rot={-2} caption="THE HOSPITAL BURNS" credit={DR} />
      <Photo src={por('hook')} at={ha + 4} x={690} y={70} w={330} h={330} rot={3} pos="50% 25%" caption="Pte. Henry Hook" grade="sepia" />
      <Note text="HOLES HACKED THROUGH THE WALLS · PATIENTS PULLED OUT ROOM BY ROOM" at={dr - 4} x={70} y={1170} size={26} w={940} />
    </Cam>
  );
};

/* 08 — through the night; ammunition */
export const S08: React.FC = () => {
  const f = useCurrentFrame();
  const r20 = wf(8, '20000'), r9 = wf(8, '900');
  return (
    <Cam>
      <Parchment dark={0.55} />
      <Photo src={st('r05_night')} at={0} x={50} y={110} w={980} h={560} rot={-1.5} caption="FIGHTING BY FIRELIGHT" credit={DR} grade="warm" />
      <Note text="THROUGH THE NIGHT" at={wf(8, 'night') - 4} x={70} y={790} size={34} dark />
      <div style={{ position: 'absolute', left: 70, top: 880, opacity: lin(f, r20 - 2, r20 + 6) }}>
        <Counter to={f < r9 ? 20000 : 900} from={f < r9 ? 0 : 20000} at={f < r9 ? r20 : r9} dur={f < r9 ? 14 : 24} x={0} y={0} size={170} align="left" label={f < r9 + 10 ? 'ROUNDS OF AMMUNITION' : 'ROUNDS LEFT'} light color={f >= r9 ? C.gold : C.paper} />
      </div>
      <Particles kind="embers" n={70} />
    </Cam>
  );
};

/* 09 — dawn */
export const S09: React.FC = () => (
  <Cam>
    <Parchment dark={0.2} />
    <Photo src={st('r06_dawn')} at={0} x={60} y={200} w={960} h={560} rot={1.5} caption="23 JANUARY · DAWN" credit={DR} grade="cold" />
    <Stamp text="WITHDREW" at={wf(9, 'withdrew') - 2} x={540} y={980} size={110} rot={-5} color={C.green} />
  </Cam>
);

/* 10 — the cost on both sides */
export const S10: React.FC = () => {
  const d17 = wf(10, '17'), z = wf(10, '350');
  return (
    <Cam>
      <Parchment />
      <Counter to={17} at={d17} dur={14} x={300} y={140} size={200} label="DEFENDERS KILLED" color={C.red} />
      <Counter to={350} at={z} dur={22} x={790} y={140} size={200} label="ZULU DEAD COUNTED" color={C.charcoal} />
      <Note text="SOME ESTIMATES: 500–600" at={z + 20} x={560} y={460} size={26} />
      <Photo src={por('dabulamanzi')} at={z - 6} x={110} y={560} w={420} h={480} rot={-3} pos="50% 20%" caption="Prince Dabulamanzi" credit="Zulu commander · illustration, public domain" grade="sepia" />
      <Photo src={por('zulu_warriors')} at={z + 4} x={560} y={680} w={470} h={210} rot={3} caption="ZULU WARRIORS, 1880s" grade="bw" />
    </Cam>
  );
};

/* 11 — eleven Victoria Crosses */
export const S11: React.FC = () => {
  const f = useCurrentFrame();
  const el = wf(11, 'eleven'), mo = wf(11, 'most');
  return (
    <Cam>
      <Parchment />
      <Ico name="vc" at={el - 6} x={540} y={330} s={360} />
      <Counter to={11} at={el} dur={16} x={540} y={540} size={200} label="VICTORIA CROSSES" color={C.red} />
      <Stamp text="MOST EVER FOR ONE BATTLE" at={mo} x={540} y={900} size={64} rot={-4} />
      {(['chard', 'bromhead', 'hook'] as const).map((k, i) => <Photo key={k} src={por(k)} at={el + 8 + i * 4} x={90 + i * 310} y={920} w={280} h={200} rot={[-4, 2, -2][i]} pos="50% 20%" grade="sepia" />)}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1185, textAlign: 'center', fontFamily: TYPE, fontWeight: 700, fontSize: 24, color: C.ink, opacity: lin(f, el + 20, el + 30) }}>CHARD · BROMHEAD · HOOK — ALL THREE RECEIVED IT</div>
    </Cam>
  );
};

/* 12 — the question */
export const S12: React.FC = () => {
  const f = useCurrentFrame();
  const fo = wf(12, 'follow');
  return (
    <Cam>
      <Parchment dark={0.1} />
      <Photo src={st('r03_barricade')} at={0} x={90} y={120} w={900} h={560} rot={-2} caption="THE WALL OF SACKS" credit={DR} grade="warm" />
      <Headline text="WOULD YOU HAVE STAYED?" at={2} y={840} size={84} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1000, display: 'flex', justifyContent: 'center', gap: 40, opacity: lin(f, 14, 22) }}>
        {['STAY', 'RUN'].map((t, i) => <div key={t} style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 64, padding: '8px 40px', background: '#f6f0e2', borderTop: `10px solid ${i ? C.charcoal : C.red}`, boxShadow: '0 12px 30px rgba(20,12,4,0.45)' }}>{t}</div>)}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1620, textAlign: 'center', opacity: lin(f, fo - 4, fo + 4) }}>
        <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 52, color: C.paper, background: C.red, padding: '14px 34px' }}>FOLLOW · BURIED CHRONICLES</span>
      </div>
    </Cam>
  );
};

export const SCENE_COMPS = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12];
