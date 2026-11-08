import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { DepthShot } from './components/DepthShot';
import { Cemetery, Chip, Clock, Counter, DateCard, EuropeMap, Explosion, Heartbeat, IdCard, MuzzleFlash, Pistol, Quote, SarajevoMap, Stamp, Storm } from './components/Graphics1914';
import { Dust, LightLeak, Shake } from './components/Vfx';
import { Assassin, Bomb, Crowd, Marchers, Street, TouringCar } from './components/Characters1914';
import { C, MONO, SANS, SCENES, SERIF, ease, lin, wf } from './theme';

const D = (n: number) => SCENES[n - 1].frames;
const SEPIA = 'sepia(0.35) contrast(1.1) saturate(0.85) brightness(0.92)';

const Headline: React.FC<{ lines: string[]; at: number; out: number; top?: number; dark?: boolean }> = ({ lines, at, out, top = 230, dark }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 10) * (1 - lin(f, out - 10, out));
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top, textAlign: 'center', opacity: o }}>
      {lines.map((l, i) => (
        <div key={i} style={{ fontFamily: i ? MONO : SERIF, fontWeight: i ? 500 : 900, fontSize: i ? 30 : 78, letterSpacing: i ? 6 : 1, lineHeight: 1.05,
          color: i ? (dark ? C.accent : C.amber) : dark ? '#1b120a' : '#fff', textShadow: dark ? 'none' : '0 4px 24px rgba(0,0,0,0.9)', marginTop: i ? 14 : 0,
          transform: `translateY(${(1 - ease(f, at + i * 5, at + i * 5 + 15)) * 20}px)`, textTransform: i ? 'uppercase' : 'none' }}>{l}</div>
      ))}
    </div>
  );
};
/** Icon chip that slams in on a spoken word (hook montage). */
const Beat: React.FC<{ at: number; label: string; icon: React.ReactNode; y: number }> = ({ at, label, icon, y }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const k = Math.min(1, (f - at) / 5);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', transform: `scale(${1.5 - 0.5 * k})`, opacity: k }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, background: 'rgba(14,10,6,0.85)', border: `3px solid ${C.accent}`, padding: '14px 30px' }}>
        <svg width={64} height={64} viewBox="0 0 64 64">{icon}</svg>
        <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 52, color: '#fff', letterSpacing: 3 }}>{label}</span>
      </div>
    </div>
  );
};
const TURN = <path d="M14 58 L14 30 Q14 16 28 16 L46 16 M38 6 L50 16 L38 26" fill="none" stroke={C.accent} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />;
const ENGINE = <g fill="none" stroke={C.accent} strokeWidth={6}><circle cx={32} cy={32} r={14} /><path d="M32 6 L32 14 M32 50 L32 58 M6 32 L14 32 M50 32 L58 32 M13 13 L19 19 M45 45 L51 51 M13 51 L19 45 M45 19 L51 13" /><path d="M8 56 L56 8" stroke="#fff" /></g>;
const SHOTS = <g fill={C.accent}><circle cx={20} cy={32} r={9} /><circle cx={44} cy={32} r={9} /><path d="M20 12 L20 4 M44 12 L44 4 M8 20 L2 14 M56 20 L62 14" stroke={C.accent} strokeWidth={4} /></g>;

// 1 hook: Europe, 1914, darkening from Sarajevo outward
export const W01: React.FC = () => {
  const f = useCurrentFrame();
  const d = D(1) + 10;
  const k = 30 + 22 * ease(f, 0, d);
  return (
    <AbsoluteFill>
      <EuropeMap view={{ lon: 15 + 3 * ease(f, 0, d), lat: 49 - 4.5 * ease(f, 0, d), k, cy: 960 }} storm={ease(f, 30, d + 40) * 0.75} pulse={lin(f, 4, 14)} sarajevoLabel={lin(f, 10, 20)} />
      <Marchers y={1240} n={11} scale={0.9} o={0.3 * lin(f, 20, 50)} color="#0b0705" />
      <Headline lines={['Europe, 1914', 'The calm before the storm']} at={0} out={d} top={220} dark={false} />
    </AbsoluteFill>
  );
};

// 2 the three beats: wrong turn / stalled engine / two gunshots
export const W02: React.FC = () => {
  const f = useCurrentFrame();
  const g = wf(2, 'gunshots');
  return (
    <Shake at={g} amp={20}>
      <DepthShot name="latin_bridge" frames={D(2) + 10} from={{ x: -0.3, y: 0, z: 1.04 }} to={{ x: 0.3, y: 0.1, z: 1.16 }} grade={SEPIA} />
      <AbsoluteFill style={{ background: 'rgba(10,6,2,0.35)' }} />
      <Beat at={wf(2, 'wrong')} label="A WRONG TURN" icon={TURN} y={330} />
      <Beat at={wf(2, 'stalled')} label="A STALLED ENGINE" icon={ENGINE} y={480} />
      <Beat at={g} label="TWO GUNSHOTS" icon={SHOTS} y={630} />
      <MuzzleFlash at={g} x={760} y={1000} />
      <MuzzleFlash at={g + 9} x={790} y={980} />
      <Storm p={lin(f, wf(2, 'changed'), D(2) + 10) * 0.8} x={540} y={300} o={0.85} />
    </Shake>
  );
};

// 3 the date
export const W03: React.FC = () => (
  <AbsoluteFill>
    <DepthShot name="sarajevo_storm" frames={D(3) + 10} from={{ x: 0, y: 0.2, z: 1.0 }} to={{ x: 0.1, y: -0.1, z: 1.14 }} grade={SEPIA} />
    <LightLeak o={0.3} />
    <DateCard at={2} y={330} />
    <div style={{ position: 'absolute', left: 0, right: 0, top: 1000, textAlign: 'center', fontFamily: MONO, fontSize: 30, letterSpacing: 10, color: '#fff', textShadow: '0 3px 12px #000' }}>SARAJEVO · BOSNIA</div>
  </AbsoluteFill>
);

// 4 the visit: tracking shot alongside the motorcade (animated cast) + the couple's dossier cards
export const W04: React.FC = () => {
  const f = useCurrentFrame();
  const carX = -1050 + 1080 * ease(f, 0, 130);
  return (
    <AbsoluteFill>
      <Street scroll={f * 2.2} tint="rgba(40,24,8,0.12)" />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <TouringCar x={carX} dist={f * 6 + carX} t={f} who="royal" wave={lin(f, 30, 50)} />
      </svg>
      <Crowd scroll={f * 5.5} />
      <LightLeak o={0.35} />
      <Dust n={40} o={0.4} />
      <IdCard img="stills/ff.jpg" name="Franz Ferdinand" lines={['Archduke · age 50', 'Heir to the Austro-Hungarian throne']} at={wf(4, 'franz') - 4} y={220} />
      <IdCard img="stills/sophie.jpg" name="Sophie" lines={['Duchess of Hohenberg · 46', 'His wife']} at={wf(4, 'sophie') - 6} y={500} x={300} tilt={2} w={600} />
    </AbsoluteFill>
  );
};

// 5 six assassins along the Appel Quay
export const W05: React.FC = () => {
  const f = useCurrentFrame();
  const d = D(5) + 10;
  return (
    <AbsoluteFill>
      <SarajevoMap cam={{ x: 470, y: 880, s: 0.95 + 0.1 * ease(f, 0, d) }} morning={ease(f, 0, d) * 0.55} assassins={lin(f, wf(5, 'six') - 4, wf(5, 'six') + 30)} />
      <Headline lines={['6 assassins', 'Positions along the route (approximate)']} at={wf(5, 'six')} out={d + 10} top={230} dark />
    </AbsoluteFill>
  );
};

// 6 10:10, the bomb is thrown (animated: the thrower steps out of the crowd)
const carX6 = (f: number) => -1150 + Math.min(f, 60) * 20 + Math.max(0, f - 60) * 5;
export const W06: React.FC = () => {
  const f = useCurrentFrame();
  const t = wf(6, 'throws');
  const thr = ease(f, t - 6, t + 6);
  const p = lin(f, t + 4, t + 22);
  const cx = carX6(f);
  const hx = 868, hy = 935;
  const tx = carX6(t + 22) + 90, ty = 1290 - 176 * 1.55;
  const bx = hx + (tx - hx) * p, by = hy + (ty - hy) * p - 260 * Math.sin(Math.PI * p);
  return (
    <AbsoluteFill>
      <Street scroll={f * 1.2} tint="rgba(40,24,8,0.2)" />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <TouringCar x={cx} dist={cx * 1.0} t={f} who="royal" wave={1} />
      </svg>
      <Crowd scroll={f * 1.6} seed={7} />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <Assassin x={900} throwArm={f >= t - 6 ? thr : 0} />
        {p > 0 && p < 1 && <Bomb x={bx} y={by} />}
      </svg>
      <Clock h={10} m={10} at={wf(6, 'ten') - 6} x={190} y={330} size={190} />
      <div style={{ position: 'absolute', left: 330, top: 260, fontFamily: MONO, fontSize: 24, letterSpacing: 4, color: '#fff', textShadow: '0 2px 10px #000', opacity: lin(f, t - 4, t + 6) }}>NEDELJKO ČABRINOVIĆ · 19<br />THROWS A BOMB</div>
    </AbsoluteFill>
  );
};

// 7 the bomb bounces off the folded roof; the car speeds away; it explodes under the next car
export const W07: React.FC = () => {
  const f = useCurrentFrame();
  const ex = wf(7, 'explodes');
  const car1 = carX6(SCENES[5].frames + f) + Math.max(0, f - 6) ** 1.7 * 1.4;
  const bounce = lin(f, 0, 18);
  const bx0 = carX6(SCENES[5].frames) + 90;
  const gx = bx0 - 40;
  const bombX = bx0 - 40 * bounce, bombY = 1017 + (1275 - 1017) * bounce - 180 * Math.sin(Math.PI * bounce);
  const car2 = (fr: number) => gx - 500 - (ex - Math.min(fr, ex)) * 14;
  return (
    <Shake at={ex} amp={34}>
      <Street scroll={f * 1.5} tint={`rgba(40,24,8,${0.2 + 0.25 * lin(f, ex, ex + 10)})`} />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <TouringCar x={car1} dist={car1} t={f} who="royal" wave={0} />
        <TouringCar x={car2(f)} dist={car2(f)} t={f} who="escort" flag={false} pitch={f >= ex ? -4 * Math.exp(-(f - ex) / 10) : 0} />
        {f < ex && <Bomb x={bombX} y={bombY} />}
      </svg>
      <Crowd scroll={f * 1.8} seed={7} dark={f >= ex ? 1 : 0.85} />
      <Explosion at={ex} x={car2(ex) + 470} y={1230} scale={2.0} />
      <Counter to={20} at={wf(7, 'wounding')} dur={20} prefix="≈" y={300} size={170} sub="WOUNDED (16–20)" />
    </Shake>
  );
};

// 8 unharmed: the plot has failed. All six assassins crossed out one by one.
const SIX = [['Mehmedbašić', 'did not act'], ['Čubrilović', 'did not act'], ['Čabrinović', 'bomb missed'], ['Popović', 'did not act'], ['Princip', 'no clear shot'], ['Grabež', 'did not act']];
export const W08: React.FC = () => {
  const f = useCurrentFrame();
  const fl = wf(8, 'failed');
  return (
    <AbsoluteFill>
      <DepthShot name="ff" frames={D(8) + 10} from={{ x: 0, y: 0.1, z: 1.0 }} to={{ x: 0, y: 0.2, z: 1.15 }} grade="sepia(0.2) contrast(1.08)" tag="PAINTED FROM A PERIOD PHOTOGRAPH" />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 62%, rgba(0,0,0,0) 72%)' }} />
      <Stamp text="Unharmed" at={wf(8, 'unharmed')} y={330} size={84} rot={-6} color={C.green} />
      <div style={{ position: 'absolute', left: 30, right: 30, top: 1010, display: 'flex', justifyContent: 'space-between' }}>
        {SIX.map(([n, why], i) => {
          const on = lin(f, 4 + i * 3, 10 + i * 3);
          const x = f >= fl - 12 + i * 4;
          return (
            <div key={n} style={{ width: 160, textAlign: 'center', opacity: on, transform: `translateY(${(1 - on) * 30}px)` }}>
              <svg width={110} height={120} viewBox="0 0 110 120">
                <path d="M15 120 Q15 74 55 70 Q95 74 95 120 Z" fill={i === 4 ? '#3a2a1a' : '#1e1712'} stroke="#e9dcc0" strokeWidth={2} />
                <circle cx={55} cy={44} r={26} fill={i === 4 ? '#3a2a1a' : '#1e1712'} stroke="#e9dcc0" strokeWidth={2} />
                {x && <path d="M14 14 L96 106 M96 14 L14 106" stroke={C.accent} strokeWidth={10} strokeLinecap="round" strokeDasharray="130" strokeDashoffset={130 * (1 - lin(f, fl - 12 + i * 4, fl - 6 + i * 4))} />}
              </svg>
              <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 22, color: '#fff', textShadow: '0 2px 8px #000' }}>{n}</div>
              <div style={{ fontFamily: MONO, fontSize: 16, color: C.amber, letterSpacing: 1 }}>{why}</div>
            </div>
          );
        })}
      </div>
      <Stamp text="Plot failed" at={fl + 14} y={760} size={96} rot={5} />
    </AbsoluteFill>
  );
};

// 9 town hall: "greeted with bombs", on his face in an angry red light
export const W09: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <DepthShot name="ff" frames={D(9) + 10} from={{ x: 0.2, y: 0.35, z: 1.25 }} to={{ x: -0.1, y: 0.4, z: 1.42 }} grade="sepia(0.3) contrast(1.2) brightness(0.8)" tag="PAINTED FROM A PERIOD PHOTOGRAPH" />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 60%, rgba(210,40,28,0.0), rgba(120,10,5,0.55) 100%)', mixBlendMode: 'multiply' }} />
      <AbsoluteFill style={{ background: `rgba(210,40,28,${0.12 + 0.08 * Math.sin(f / 6)})`, mixBlendMode: 'overlay' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1000, textAlign: 'center', fontFamily: MONO, fontSize: 26, letterSpacing: 6, color: '#fff', textShadow: '0 2px 10px #000', opacity: lin(f, 4, 12) }}>SARAJEVO TOWN HALL · MINUTES LATER</div>
      <Quote text="I came here on a visit, and I am greeted with bombs!" by="FRANZ FERDINAND, TO THE MAYOR" at={wf(9, 'i') - 4} dur={wf(9, 'bombs') - wf(9, 'i') + 10} y={230} />
    </AbsoluteFill>
  );
};

// 10 the hospital decision: a new, straight route along the river
export const W10: React.FC = () => {
  const f = useCurrentFrame();
  const d = D(10) + 10;
  return (
    <AbsoluteFill>
      <SarajevoMap cam={{ x: 560 - 80 * ease(f, 0, d), y: 900, s: 1.0 }} plan={ease(f, wf(10, 'straight') - 10, wf(10, 'straight') + 25)} assassins={0} />
      <Headline lines={['New plan: the hospital', 'Straight along the Appel Quay']} at={wf(10, 'hospital') - 8} out={d + 10} top={230} dark />
    </AbsoluteFill>
  );
};

// 11 nobody tells the driver: the car waits outside the town hall; spotlight + callout on the chauffeur
export const W11: React.FC = () => {
  const f = useCurrentFrame();
  const cx = -150, g = 1290, sc = 1.55;
  const hx = cx + 350 * sc, hy = g - 228 * sc;
  const sp = lin(f, 4, 14);
  return (
    <AbsoluteFill>
      <Street scroll={300} tint="rgba(20,12,4,0.25)" />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <TouringCar x={cx} dist={0} t={f} who="royal+governor" exhaust={0.5} />
      </svg>
      <AbsoluteFill style={{ background: `radial-gradient(circle 150px at ${hx}px ${hy}px, rgba(0,0,0,0) 60%, rgba(0,0,0,${0.62 * sp}) 100%)` }} />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <circle cx={hx} cy={hy} r={110} fill="none" stroke={C.amber} strokeWidth={5} strokeDasharray={`${700 * sp} 700`} />
        <path d={`M${hx + 80},${hy - 80} L${hx + 200},${hy - 260} L1040,${hy - 260}`} fill="none" stroke={C.amber} strokeWidth={4} strokeDasharray={`${600 * lin(f, 10, 22)} 600`} />
      </svg>
      <div style={{ position: 'absolute', left: hx + 210, top: hy - 340, opacity: lin(f, 18, 26), fontFamily: SANS, fontWeight: 800, fontSize: 34, color: '#fff', textShadow: '0 3px 10px #000', lineHeight: 1.1 }}>
        THE DRIVER<div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 22, color: C.amber, letterSpacing: 2, marginTop: 6 }}>LEOPOLD LOJKA · 27</div>
      </div>
      <Crowd scroll={200} seed={13} n={9} dark={1} />
      <Stamp text="Not told the new route" at={wf(11, "driver") - 2} x={540} y={420} size={56} rot={-6} />
    </AbsoluteFill>
  );
};

// 12 the Latin Bridge: the cars ahead turn right, his driver follows
export const W12: React.FC = () => {
  const f = useCurrentFrame();
  const d = D(12) + 10;
  const tr = wf(12, 'turn');
  const fo = wf(12, 'follows');
  return (
    <AbsoluteFill>
      <SarajevoMap cam={{ x: 640 - 40 * ease(f, 0, d), y: 860, s: 1.25 + 0.35 * ease(f, 0, d) }} plan={1} leaders={ease(f, 0, fo)} ret={ease(f, 6, fo + 18) * 0.97} wrong={ease(f, fo - 6, fo + 18)} />
      <Headline lines={['The wrong turn', 'Latin Bridge · about 10:50 AM']} at={tr - 6} out={d + 10} top={230} dark />
    </AbsoluteFill>
  );
};

// 13 "Wrong way!" brake, reverse, stall (animated: the governor shouts, the car pitches, rolls back, dies)
export const W13: React.FC = () => {
  const f = useCurrentFrame();
  const w = wf(13, 'wrong'), br = wf(13, 'brakes'), rv = wf(13, 'reverse'), st = wf(13, 'stalls');
  const fwd = -760 + 700 * ease(f, 0, br + 4);
  const back = lin(f, rv, st) * -70;
  const x = fwd + back;
  const pitch = f >= br ? 3.5 * Math.exp(-(f - br) / 8) * Math.cos((f - br) / 3) : 0;
  return (
    <Shake at={br} amp={8}>
      <Street scroll={x * 0.4} img="stills/street_bg.jpg" tint="rgba(30,20,10,0.35)" />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <TouringCar x={x} dist={x} t={f < st ? f : st} who="royal+governor" shout={lin(f, w - 2, w + 6) * (1 - lin(f, br + 20, br + 30))} driverLook={f >= w + 6 ? -1 : 1} exhaust={f < st ? 1 : Math.max(0, 1 - (f - st) / 10)} pitch={pitch} />
        <g opacity={0.95}><Assassin x={1050} rim={0.7} /></g>
      </svg>
      <Crowd scroll={x * 0.8} seed={11} n={9} dark={1} y={1640} />
      {f >= rv && f < st + 4 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center', fontFamily: MONO, fontSize: 60, letterSpacing: 10, color: C.amber, textShadow: '0 3px 14px #000' }}>◀◀ REVERSE</div>
      )}
      <Stamp text="Engine stalled" at={st} y={620} size={84} rot={4} />
      {f >= st && <AbsoluteFill style={{ background: `rgba(0,0,0,${0.3 * lin(f, st, st + 20)})` }} />}
    </Shake>
  );
};

// 14 five feet away: Gavrilo Princip, 19
export const W14: React.FC = () => {
  const f = useCurrentFrame();
  const d = D(14) + 10;
  return (
    <AbsoluteFill>
      <DepthShot name="princip" frames={d} from={{ x: 0, y: -1.2, z: 1.0 }} to={{ x: 0, y: -1.4, z: 1.14 }} grade="contrast(1.08) brightness(0.95)" tag="PERIOD PHOTOGRAPH · TINTED" />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 120, textAlign: 'center', opacity: lin(f, wf(14, 'five') - 4, wf(14, 'five') + 6) }}>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 150, color: '#fff', lineHeight: 1, textShadow: '0 8px 30px #000' }}>5 ft</div>
        <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 8, color: C.amber, textShadow: '0 3px 12px #000' }}>≈ 1.5 METRES AWAY</div>
      </div>
      <IdCard img="stills/princip.jpg" name="Gavrilo Princip" lines={['Age 19 · Bosnian Serb', 'Member of Young Bosnia']} at={wf(14, 'gavrilo') - 8} y={1000} x={60} />
      <Heartbeat from={0} bpm={72} o={0.7} />
    </AbsoluteFill>
  );
};

// 15 the target stops in front of him: slow push, heartbeat, the inset map
export const W15: React.FC = () => {
  const f = useCurrentFrame();
  const d = D(15) + 10;
  const now = wf(15, 'now');
  return (
    <AbsoluteFill>
      <DepthShot name="deli_corner" frames={d} from={{ x: 0, y: 0, z: 1.0 }} to={{ x: 0.1, y: 0, z: 1.28 }} grade="sepia(0.25) contrast(1.15) saturate(0.85) brightness(0.9)" />
      <div style={{ position: 'absolute', left: 60, top: 240, width: 420, height: 420, overflow: 'hidden', border: '4px solid #e9dcc0', boxShadow: '0 12px 30px rgba(0,0,0,0.6)', opacity: lin(f, now - 6, now + 4) }}>
        <div style={{ width: 1080, height: 1920, transform: 'scale(0.389) translate(-50%, -50%)', transformOrigin: '0 0', position: 'absolute', left: 210, top: 210 }}>
          <SarajevoMap cam={{ x: 640, y: 860, s: 2.6 }} plan={1} ret={1} wrong={1} stall={1} assassins={1} princip={1} measure={lin(f, now + 6, now + 16)} labels={0.9} />
        </div>
      </div>
      <Heartbeat from={0} bpm={84} />
    </AbsoluteFill>
  );
};

// 16 two shots (animated silhouettes; non-graphic)
export const W16: React.FC = () => {
  const f = useCurrentFrame();
  const s1 = wf(16, 'twice'), s2 = s1 + 12;
  const step = ease(f, wf(16, 'steps') - 4, wf(16, 'steps') + 14) * 120;
  const aim = ease(f, wf(16, 'fires') - 6, wf(16, 'fires') + 4);
  const sc = 1.6;
  const mx = 900 - step - 166 * sc, my = 1600 - 314 * sc;
  const bw = f >= s1 ? 1 : 0;
  return (
    <Shake at={s1} amp={26}><Shake at={s2} amp={22}>
      <AbsoluteFill style={{ filter: bw ? 'grayscale(1) contrast(1.3) brightness(0.8)' : 'none' }}>
        <Street scroll={-160} tint="rgba(10,14,30,0.4)" />
        <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
          <TouringCar x={230} dist={0} t={0} who="royal+governor" />
          <Assassin x={900} step={step} aim={aim} scale={sc} />
        </svg>
        <AbsoluteFill style={{ background: 'radial-gradient(ellipse 40% 30% at 70% 55%, rgba(255,220,170,0.18), rgba(0,0,0,0) 70%)', mixBlendMode: 'screen' }} />
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: 290, top: 220, width: 500, height: 360, background: 'rgba(233,220,192,0.9)', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', opacity: lin(f, wf(16, 'fires') - 10, wf(16, 'fires') - 2) }} />
      <Pistol at={wf(16, 'fires') - 10} y={250} w={420} />
      <MuzzleFlash at={s1} x={mx} y={my} />
      <MuzzleFlash at={s2} x={mx} y={my - 6} />
    </Shake></Shake>
  );
};

// 17 the two victims: 1 and 2, then both portraits fade to grey
export const W17: React.FC = () => {
  const f = useCurrentFrame();
  const a = wf(17, 'archduke'), s = wf(17, 'sophie'), dd = wf(17, 'dead');
  const half = (img: string, top: number, on: number, n: string, name: string) => (
    <div style={{ position: 'absolute', left: 0, right: 0, top, height: 960, overflow: 'hidden', opacity: 0.35 + 0.65 * lin(f, on - 10, on) }}>
      <Img src={staticFile(img)} style={{ width: '100%', height: 1920, objectFit: 'cover', marginTop: -330, filter: `sepia(0.2) grayscale(${lin(f, dd - 4, dd + 16)}) brightness(${1 - 0.3 * lin(f, dd - 4, dd + 16)})`, transform: `scale(${1.05 + 0.05 * ease(f, on, on + 60)})` }} />
      <div style={{ position: 'absolute', left: 50, top: 60, width: 120, height: 120, borderRadius: 60, background: C.accent, color: '#fff', fontFamily: SERIF, fontWeight: 900, fontSize: 80, textAlign: 'center', lineHeight: '120px', opacity: lin(f, on, on + 6) }}>{n}</div>
      <div style={{ position: 'absolute', left: 190, top: 92, fontFamily: MONO, fontSize: 30, letterSpacing: 5, color: '#fff', textShadow: '0 3px 12px #000', opacity: lin(f, on + 4, on + 10) }}>{name}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {half('stills/ff.jpg', 0, a, '1', 'FRANZ FERDINAND')}
      {half('stills/sophie.jpg', 960, s, '2', 'SOPHIE')}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 930, height: 6, background: '#000' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 860, textAlign: 'center', opacity: lin(f, dd, dd + 10) }}>
        <span style={{ background: 'rgba(0,0,0,0.85)', padding: '14px 30px', fontFamily: MONO, fontSize: 36, letterSpacing: 6, color: '#fff' }}>† 28 JUNE 1914 · BEFORE 11:30 AM</span>
      </div>
    </AbsoluteFill>
  );
};

// 18 one month later: Austria-Hungary declares war on Serbia
export const W18: React.FC = () => {
  const f = useCurrentFrame();
  const d = D(18) + 10;
  const dc = wf(18, 'declares');
  return (
    <AbsoluteFill>
      <EuropeMap view={{ lon: 19, lat: 46.6, k: 90 - 25 * ease(f, 0, d), cy: 860 }} nations={{ austria: lin(f, 4, 14), serbia: lin(f, dc - 4, dc + 6) }} arrows={[{ from: 'vienna', to: 'belgrade', p: ease(f, dc, dc + 18) }]} pulse={0.6} />
      <Chip date="JUL 28" text="Austria-Hungary declares war on Serbia" at={dc} y={240} />
      <Storm p={0.2 + 0.15 * ease(f, 0, d)} x={640} y={1060} o={0.35} />
    </AbsoluteFill>
  );
};

// 19 the alliances pull everyone in
export const W19: React.FC = () => {
  const f = useCurrentFrame();
  const r = wf(19, 'russia'), g = wf(19, 'germany'), fr = wf(19, 'france'), b = wf(19, 'britain');
  const d = D(19) + 10;
  return (
    <AbsoluteFill>
      <EuropeMap view={{ lon: 15, lat: 51, k: 36 - 4 * ease(f, 0, d), cy: 960 }}
        nations={{ austria: 1, serbia: 1, russia: lin(f, r - 4, r + 6), germany: lin(f, g - 4, g + 6), france: lin(f, fr - 4, fr + 6), britain: lin(f, b - 4, b + 6) }}
        arrows={[
          { from: 'vienna', to: 'belgrade', p: 1 },
          { from: 'petersburg', to: 'belgrade', p: lin(f, r, r + 12), dashed: true },
          { from: 'berlin', to: 'petersburg', p: ease(f, g, g + 14), color: '#b07a1a', march: true },
          { from: 'berlin', to: 'paris', p: ease(f, fr, fr + 14), color: '#b07a1a', march: true },
          { from: 'london', to: 'berlin', p: ease(f, b, b + 14), march: true },
          { from: 'vienna', to: 'belgrade', p: 1, march: true },
        ]}
        storm={0.2 + 0.35 * ease(f, 0, d)} pulse={0.5} />
      <Chip date="JUL 30" text="Russia mobilizes" at={r} y={230} />
      <Chip date="AUG 1" text="Germany → Russia" at={g} y={310} color="#b07a1a" />
      <Chip date="AUG 3" text="Germany → France" at={fr} y={390} color="#b07a1a" />
      <Chip date="AUG 4" text="Britain → Germany" at={b} y={470} />
    </AbsoluteFill>
  );
};

// 20 the cost: the fronts draw across Europe, then trenches, then the cemeteries; counter to 20 million
export const W20: React.FC = () => {
  const f = useCurrentFrame();
  const d = D(20) + 10;
  const m = wf(20, '20');
  const a = Math.round(d * 0.33), b = Math.round(d * 0.66);
  return (
    <AbsoluteFill>
      <EuropeMap view={{ lon: 14, lat: 51, k: 34 + 6 * ease(f, 0, a + 10), cy: 1000 }} nations={{ germany: 0.6, france: 0.6, russia: 0.6, austria: 0.6 }} fronts={ease(f, 0, a)} storm={0.35} />
      <AbsoluteFill style={{ opacity: lin(f, a, a + 8) }}>
        <DepthShot name="trenches" frames={d} from={{ x: -0.3, y: 0, z: 1.05 }} to={{ x: 0.2, y: 0, z: 1.18 }} grade="sepia(0.3) contrast(1.15) saturate(0.7) brightness(0.85)" tag={false} />
        <Marchers y={1500} n={9} scale={1.4} o={0.85} speed={1.6} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: lin(f, b, b + 10) }}>
        <Cemetery p={lin(f, b, d)} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0) 40%)' }} />
      <Counter to={20000000} at={m - 6} dur={36} y={240} size={124} sub="ESTIMATED DEATHS (15–22 MILLION)" />
      <Dust n={50} o={0.35} color="230,230,230" />
    </AbsoluteFill>
  );
};

// 21 end card: back to the corner
export const W21: React.FC = () => {
  const f = useCurrentFrame();
  const w = wf(21, 'wrong');
  return (
    <AbsoluteFill>
      <DepthShot name="latin_bridge" frames={D(21) + 10} from={{ x: 0.2, y: 0, z: 1.14 }} to={{ x: 0, y: 0, z: 1.02 }} grade="grayscale(0.7) contrast(1.15) brightness(0.6)" tag={false} />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <path d="M300 1150 L620 1150 Q700 1150 700 1070 L700 760" fill="none" stroke={C.accent} strokeWidth={16} strokeLinecap="round" strokeDasharray={`${1000 * ease(f, w - 8, w + 20)} 1200`} />
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', opacity: lin(f, w - 4, w + 8) }}>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 124, color: '#fff', lineHeight: 1, textShadow: '0 8px 30px #000' }}>One Wrong</div>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 124, color: C.accent, lineHeight: 1.05, textShadow: '0 8px 30px #000' }}>Turn.</div>
        <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 8, color: '#e9dcc0', marginTop: 24 }}>SARAJEVO · 28 JUNE 1914</div>
      </div>
    </AbsoluteFill>
  );
};

export const WWI_SCENES = [W01, W02, W03, W04, W05, W06, W07, W08, W09, W10, W11, W12, W13, W14, W15, W16, W17, W18, W19, W20, W21];
