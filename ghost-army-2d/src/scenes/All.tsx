import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { ArtDefs, Bulldozer, Cyclist, DAY, DUSK, GI, GunTop, Halftrack, Landscape, Mast, Medal, NIGHT, PlaneTop, Sherman, Spy, TankTop, Truck, TruckTop } from '../components/Art';
import { EuroMap, PL, lerpView, type View } from '../components/ParchMap';
import { BigQuote, Chips, Loc, Num, Photo, RStamp, Stat, Title, Viewfinder } from '../Overlays';
import { C, MONO, SANS, TYPE, ease, hash01, lin, noise1, wf } from '../theme';

const Svg: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, ...style }}><ArtDefs />{children}</svg>
);
/** Camera: zoom s around (ox, oy) + slow drift. */
const Cam: React.FC<{ s?: number; ox?: number; oy?: number; children: React.ReactNode }> = ({ s = 1, ox = 540, oy = 960, children }) => {
  const f = useCurrentFrame();
  const dx = 6 * noise1(f * 0.008, 3), dy = 5 * noise1(f * 0.008, 8);
  return <AbsoluteFill style={{ transform: `translate(${dx}px,${dy}px) scale(${s})`, transformOrigin: `${ox}px ${oy}px` }}>{children}</AbsoluteFill>;
};

/* ============ 1–4 · Normandy: the cyclists, the Sherman, the rubber reveal ============ */
const TX = 700, TY = 1300;
const LiftScene: React.FC<{ lift: number; rubber?: boolean; wob?: number; camX: number; cyc?: number; gis?: number; ped?: number }> = ({ lift, rubber, wob = 0, camX, cyc = 1, gis = 1, ped = 0 }) => (
  <Svg>
    <Landscape pal={DUSK} camX={camX} horizon={1060} road />
    <GI x={TX - 150 - camX} y={TY - 16} s={0.78} pose={lift > 0.02 ? 'lift' : 'stand'} dark={0.25} />
    <GI x={TX + 140 - camX} y={TY - 16} s={0.78} pose={lift > 0.02 ? 'lift' : 'stand'} dark={0.25} flip />
    <Sherman x={TX - camX} y={TY} s={0.78} lift={lift * 40} rubber={rubber} wob={wob} />
    {gis > 0 && <>
      <GI x={TX - 205 - camX + (1 - gis) * -300} y={TY + 30} s={0.86} pose={lift > 0.02 ? 'lift' : gis < 1 ? 'walk' : 'stand'} />
      <GI x={TX + 210 - camX + (1 - gis) * 300} y={TY + 30} s={0.86} pose={lift > 0.02 ? 'lift' : gis < 1 ? 'walk' : 'stand'} flip />
    </>}
    {cyc > -1 && <>
      <Cyclist x={-260 + cyc * 560 - camX * 1.1} y={1400} s={1.0} ped={ped} />
      <Cyclist x={-470 + cyc * 560 - camX * 1.1} y={1450} s={1.05} coat="#6a3b2c" ped={ped + 1} />
    </>}
  </Svg>
);
export const S01: React.FC = () => {
  const f = useCurrentFrame();
  const stop = wf(1, 'stopped') + 12, pick = wf(1, 'picked'), four = wf(1, 'four');
  const cyc = ease(f, 10, stop);
  return (
    <AbsoluteFill>
      <Cam s={1 + 0.12 * ease(f, 0, 236)} ox={560} oy={1250}>
        <LiftScene lift={ease(f, pick - 2, pick + 22)} camX={90 * lin(f, 0, 236)} cyc={cyc} gis={ease(f, four - 30, four + 10)} ped={cyc * 30} />
      </Cam>
      <Loc text="NORMANDY, FRANCE" sub="SUMMER 1944" at={6} />
    </AbsoluteFill>
  );
};
const Callout: React.FC<{ x: number; y: number; tx: number; ty: number; text: string; at: number }> = ({ x, y, tx, ty, text, at }) => {
  const f = useCurrentFrame(); const p = ease(f, at, at + 12); if (p <= 0) return null;
  return (
    <>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}><circle cx={x} cy={y} r={10} fill={C.yellow} /><path d={`M${x},${y} L${x + (tx - x) * p},${y + (ty - y) * p}`} stroke={C.yellow} strokeWidth={4} /></svg>
      <div style={{ position: 'absolute', left: tx - 10, top: ty - 54, opacity: lin(f, at + 8, at + 14), fontFamily: SANS, fontWeight: 800, fontSize: 40, color: '#fff', textShadow: '0 3px 14px #000', whiteSpace: 'nowrap' }}>{text}</div>
    </>
  );
};
export const S02: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Cam s={1 + 0.05 * lin(f, 0, 118)} ox={540} oy={1100}>
        <Svg>
          <Landscape pal={DAY} camX={40 + f * 0.4} horizon={980} />
          <Sherman x={470} y={1300} s={1.3} roll={f * 0.02} />
        </Svg>
      </Cam>
      <Loc text="M4 SHERMAN" sub="U.S. ARMY MAIN BATTLE TANK" at={wf(2, 'sherman') - 6} />
      <Callout x={930} y={938} tx={720} ty={760} text="75 mm gun" at={wf(2, 'main') - 6} />
      <Callout x={437} y={858} tx={150} ty={640} text="5-man crew" at={wf(2, 'battle') - 4} />
      <Stat value={<Num from={0} to={33} at={wf(2, '33') - 4} dur={18} suffix=" TONS" />} label="of steel · about 66,000 lb" at={wf(2, '33') - 10} y={1090} x={64} w={700} />
    </AbsoluteFill>
  );
};
export const S03: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Cam s={1.75 + 0.08 * lin(f, 0, 113)} ox={520} oy={1180}>
        <LiftScene lift={1} camX={90} cyc={1} gis={1} />
      </Cam>
      <BigQuote text="Americans are very strong." by="— A GI, REPORTEDLY (VETERAN ARTHUR SHILSTONE'S ACCOUNT)" at={wf(3, 'americans') - 8} y={240} />
    </AbsoluteFill>
  );
};
export const S04: React.FC = () => {
  const f = useCurrentFrame();
  const rub = wf(4, 'rubber'), w93 = wf(4, '93');
  const isR = f >= rub - 4;
  return (
    <AbsoluteFill>
      <Cam s={1.25} ox={650} oy={1150}>
        <LiftScene lift={1 - ease(f, rub - 12, rub + 4)} rubber={isR} wob={isR ? Math.max(0, 1 - lin(f, rub + 8, rub + 70)) * 2.4 : 0} camX={90} cyc={1} />
      </Cam>
      <Title text="IT WAS RUBBER" at={rub - 6} out={w93 - 14} y={250} size={120} color={C.yellow} />
      <Photo src="dummy" at={w93 - 14} x={70} y={230} w={940} rot={-2} caption="INFLATABLE M4 SHERMAN DECOY · U.S. ARMY PHOTO" />
      <Stat value={<Num from={0} to={93} at={w93} dur={14} suffix=" LB" />} label="vs. about 66,000 lb for a real Sherman" at={w93 - 6} y={1000} color={C.yellow} />
    </AbsoluteFill>
  );
};

/* ============ 5, 14 · the war-room desk ============ */
const Desk: React.FC<{ lines: string[]; photos?: boolean }> = ({ lines, photos = true }) => (
  <AbsoluteFill>
    <Svg>
      <defs><radialGradient id="lamp" cx="45%" cy="40%" r="70%"><stop offset="0" stopColor="rgba(255,214,150,0.35)" /><stop offset="1" stopColor="rgba(0,0,0,0.75)" /></radialGradient>
        <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5a3820" /><stop offset="1" stopColor="#331e10" /></linearGradient></defs>
      <rect width={1080} height={1920} fill="url(#wood)" />
      {Array.from({ length: 40 }, (_, i) => <path key={i} d={`M-20,${i * 52 + 10} C300,${i * 52 + 30 * Math.sin(i)} 700,${i * 52 - 20} 1100,${i * 52 + 14}`} stroke="rgba(0,0,0,0.18)" strokeWidth={3} fill="none" />)}
    </Svg>
    {photos && <>
      <Img src={staticFile('assets/archival/rhine.png')} style={{ position: 'absolute', left: -60, top: 1240, width: 560, transform: 'rotate(-14deg)', filter: 'drop-shadow(0 20px 20px rgba(0,0,0,0.6))' }} />
      <Img src={staticFile('assets/archival/simpson.png')} style={{ position: 'absolute', left: 740, top: 180, width: 330, transform: 'rotate(9deg)', filter: 'drop-shadow(0 20px 20px rgba(0,0,0,0.6))' }} />
    </>}
    <div style={{ position: 'absolute', left: 150, top: 380, width: 780, height: 1000, background: '#d8b878', transform: 'rotate(-4deg)', boxShadow: '0 30px 50px rgba(0,0,0,0.6)', padding: '90px 70px', fontFamily: TYPE, fontWeight: 700, fontSize: 44, lineHeight: 1.7, color: '#2a2117' }}>
      <div style={{ position: 'absolute', left: 0, top: -50, width: 300, height: 60, background: '#d8b878', borderRadius: '16px 16px 0 0' }} />
      {lines.map((l, i) => <div key={i}>{l || ' '}</div>)}
    </div>
    {photos && <Img src={staticFile('assets/archival/dummy.png')} style={{ position: 'absolute', left: 560, top: 1080, width: 520, transform: 'rotate(8deg)', filter: 'drop-shadow(0 20px 20px rgba(0,0,0,0.6))' }} />}
    <Svg><rect width={1080} height={1920} fill="url(#lamp)" /></Svg>
  </AbsoluteFill>
);
export const S05: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Cam s={1.0 + 0.1 * ease(f, 0, 205)} ox={540} oy={800}>
        <Desk lines={['WAR DEPARTMENT', '', '23rd HEADQUARTERS', 'SPECIAL TROOPS', '', 'TACTICAL DECEPTION', 'EUROPEAN THEATER 1944–45', '', '██████████']} />
      </Cam>
      <RStamp text="TOP SECRET" at={wf(5, 'secret') - 4} x={560} y={1100} size={100} rot={-9} />
      <Title text="THE GHOST ARMY" at={wf(5, 'ghost') - 6} y={180} size={130} color={C.yellow} />
    </AbsoluteFill>
  );
};
export const S14: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Cam s={1.05 + 0.08 * ease(f, 0, 150)} ox={540} oy={900}>
        <Desk lines={['23rd HQ SPECIAL TROOPS', 'AFTER-ACTION REPORTS', '', 'OPERATIONS:', 'BREST · BETTEMBOURG', 'VIERSEN', '', 'DISTRIBUTION: RESTRICTED']} photos={false} />
      </Cam>
      <RStamp text="CLASSIFIED" at={wf(14, 'classified') - 4} x={540} y={820} size={110} rot={-10} />
      <Stat value={<Num plain from={1945} to={1996} at={wf(14, 'for') - 2} dur={wf(14, '1996') - wf(14, 'for')} />} label="more than 50 years of silence" at={wf(14, 'for') - 8} y={150} />
      <RStamp text="DECLASSIFIED 1996" at={wf(14, '1996')} x={540} y={1120} size={84} rot={6} color="#4a7fd0" />
    </AbsoluteFill>
  );
};

/* ============ 6 · 1,100 men → 30,000 ============ */
export const S06: React.FC = () => {
  const f = useCurrentFrame();
  const bel = wf(6, 'believe');
  const g = ease(f, bel - 24, bel + 50);
  return (
    <AbsoluteFill>
      <Cam s={1.25 - 0.25 * g} ox={540} oy={1300}>
        <Svg>
          <Landscape pal={DAY} camX={20} horizon={900} />
          {Array.from({ length: 16 }, (_, r) => {
            const rr = 16 - r; const sc = 0.6 - rr * 0.028; const y = 1190 - rr * 24; const n = 9 + rr * 2; const sp = 1000 / n;
            return Array.from({ length: n }, (_, i) => { const k = i + rr * 40; const on = lin(f, bel - 24 + rr * 3 + hash01(k, 3) * 10, bel - 16 + rr * 3 + hash01(k, 3) * 10);
              return on > 0 ? <g key={`${r}-${i}`} opacity={on}><GI x={40 + sp * (i + 0.5)} y={y} s={sc} ghost /></g> : null; });
          })}
          {Array.from({ length: 11 }, (_, i) => <GI key={i} x={70 + i * 94} y={1300} s={0.66} />)}
        </Svg>
      </Cam>
      <Stat value={<Num from={0} to={1100} at={2} dur={16} />} label="real men · 1 figure = 100" at={0} out={bel - 26} y={160} />
      <Chips y={420} items={[{ t: 'Artists', at: wf(6, 'artists') - 4 }, { t: 'Designers', at: wf(6, 'designers') - 4 }, { t: 'Ad men', at: wf(6, 'ad') - 4 }]} />
      <Chips y={510} items={[{ t: 'New York', at: wf(6, 'new') - 4, color: 'rgba(45,79,134,0.85)' }, { t: 'Philadelphia', at: wf(6, 'philadelphia') - 4, color: 'rgba(45,79,134,0.85)' }]} />
      <Stat value={<Num from={1100} to={30000} at={wf(6, 'were') - 4} dur={30} />} label="what the Germans should see" at={bel - 14} y={160} color={C.yellow} />
    </AbsoluteFill>
  );
};

/* ============ 7 · German intelligence: air, radio, spies ============ */
const Band: React.FC<{ y: number; h: number; on: number; label: string; num: string; children: React.ReactNode; faked: number }> = ({ y, h, on, label, num, children, faked }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', left: 40, top: y, width: 1000, height: h, overflow: 'hidden', borderRadius: 12, opacity: 0.6 + 0.4 * on, transform: `scale(${0.96 + 0.04 * on})`, boxShadow: on > 0.5 ? `0 0 0 6px ${C.yellow}` : 'none' }}>
      {children}
      <div style={{ position: 'absolute', left: 30, top: 24, fontFamily: SANS, fontWeight: 800, fontSize: 52, color: '#fff', textShadow: '0 3px 14px #000' }}><span style={{ color: C.yellow }}>{num}</span> {label}</div>
      {f >= faked && <RStamp text="FAKED" at={faked} x={760} y={h / 2 + 20} size={84} rot={-8} />}
    </div>
  );
};
export const S07: React.FC = () => {
  const f = useCurrentFrame();
  const air = wf(7, 'air'), radio = wf(7, 'radio'), spies = wf(7, 'spies'), faked = wf(7, 'faked');
  const on = (a: number, b: number) => (f >= faked - 6 ? 1 : lin(f, a - 6, a) * (1 - lin(f, b - 6, b)));
  return (
    <AbsoluteFill style={{ background: '#121418' }}>
      <Band y={300} h={340} on={on(air, radio)} num="1" label="AIR RECON" faked={faked}>
        <Svg><Landscape pal={DAY} horizon={300} camX={f} /><PlaneTop x={-200 + f * 7} y={150} s={0.55} rot={90} /></Svg>
      </Band>
      <Band y={680} h={340} on={on(radio, spies)} num="2" label="RADIO INTERCEPTS" faked={wf(7, 'all')}>
        <Svg><Landscape pal={NIGHT} horizon={300} stars /><Mast x={620} y={330} h={250} on={1} /></Svg>
      </Band>
      <Band y={1060} h={300} on={on(spies, faked + 999)} num="3" label="SPIES" faked={wf(7, 'three')}>
        <Svg><rect width={1080} height={400} fill="#1d1c22" /><circle cx={700} cy={40} r={200} fill="#ffd79a" opacity={0.18} filter="url(#soft2)" /><rect x={693} y={30} width={14} height={300} fill="#333" /><Spy x={520} y={320} s={0.95} /></Svg>
      </Band>
      <Loc text="GERMAN INTELLIGENCE" sub="HOW THE ENEMY WATCHED THE FRONT" at={4} y={110} />
    </AbsoluteFill>
  );
};

/* ============ 8 · from the air ============ */
const TRACK: [number, number][] = [[-100, 1500], [200, 1300], [330, 1080], [470, 930], [600, 880], [760, 960], [900, 820], [1180, 700]];
const trackPath = (p: number) => {
  const pts = TRACK; const L: number[] = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const tot = L[L.length - 1] * p; const out: [number, number][] = [pts[0]]; let head = pts[0]; let ang = 0;
  for (let i = 1; i < pts.length; i++) { if (L[i] <= tot) { out.push(pts[i]); head = pts[i]; ang = Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]); } else { const k = (tot - L[i - 1]) / (L[i] - L[i - 1]); head = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k]; ang = Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]); out.push(head); break; } }
  return { d: out.map((q, i) => `${i ? 'L' : 'M'}${q[0]},${q[1]}`).join(''), head, ang };
};
export const S08: React.FC = () => {
  const f = useCurrentFrame();
  const t = wf(8, 'tanks'), tr = wf(8, 'trucks'), ar = wf(8, 'artillery'), doz = wf(8, 'bulldozer'), rec = wf(8, 'reconnaissance');
  const inf = (a: number) => ease(f, a - 6, a + 22);
  const tp = trackPath(ease(f, doz - 6, rec - 4));
  const bw = ease(f, rec - 8, rec + 4);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: bw > 0 ? `grayscale(${bw}) contrast(${1 + 0.25 * bw})` : undefined }}>
        <Cam s={1.08 - 0.08 * ease(f, rec - 30, rec)} ox={540} oy={1000}>
          <Svg>
            <defs><pattern id="grass" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#76804c" />{[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={hash01(i, 2) * 60} cy={hash01(i, 3) * 60} r={3 + hash01(i, 4) * 4} fill="rgba(40,50,20,0.18)" />)}</pattern></defs>
            <rect width={1080} height={1920} fill="url(#grass)" />
            <path d="M-50,420 C300,380 700,460 1130,400" stroke="#3f4a24" strokeWidth={70} fill="none" opacity={0.9} />
            <path d="M-50,1690 C300,1640 700,1720 1130,1660" stroke="#3f4a24" strokeWidth={70} fill="none" opacity={0.9} />
            <path d="M120,-20 L60,1940" stroke="#a89a73" strokeWidth={46} />
            <path d={tp.d} stroke="#4b3a26" strokeWidth={70} fill="none" opacity={0.55} strokeLinejoin="round" strokeLinecap="round" />
            <path d={tp.d} stroke="#3a2c1c" strokeWidth={70} fill="none" strokeDasharray="10 14" opacity={0.6} strokeLinejoin="round" />
            <TankTop x={330} y={760} s={0.85} rot={20} inflate={inf(t)} rubber />
            <TankTop x={620} y={700} s={0.85} rot={14} inflate={inf(t + 6)} rubber />
            <TankTop x={880} y={1060} s={0.85} rot={-30} inflate={inf(t + 12)} rubber />
            <TruckTop x={300} y={1260} s={0.85} rot={-10} inflate={inf(tr)} />
            <TruckTop x={480} y={1340} s={0.85} rot={-8} inflate={inf(tr + 6)} />
            <GunTop x={720} y={1340} s={0.9} rot={-20} inflate={inf(ar)} />
            <GunTop x={880} y={1430} s={0.9} rot={-15} inflate={inf(ar + 6)} />
            {f >= doz - 6 && <Bulldozer x={tp.head[0]} y={tp.head[1]} s={0.85} rot={(tp.ang * 180) / Math.PI + 90} />}
            <g opacity={0.35}><PlaneTop x={540 + 40} y={-400 + 2600 * lin(f, rec - 70, rec + 30) + 40} s={1.2} /></g>
          </Svg>
        </Cam>
      </AbsoluteFill>
      <Loc text="1 · FROM THE AIR" sub="603RD CAMOUFLAGE ENGINEERS" at={4} out={rec - 20} />
      <Chips y={420} items={[{ t: 'Tanks', at: t - 2 }, { t: 'Trucks', at: tr - 2 }, { t: 'Artillery', at: ar - 2 }, { t: 'Overnight', at: wf(8, 'overnight') - 4, color: 'rgba(200,53,43,0.85)' }]} />
      <Chips y={510} items={[{ t: 'Fake tank tracks', at: wf(8, 'tracks') - 6, color: 'rgba(200,53,43,0.85)' }]} />
      <Viewfinder o={lin(f, rec - 6, rec)} label="LUFTWAFFE RECON · 1944" />
    </AbsoluteFill>
  );
};

/* ============ 9 · over the radio ============ */
export const S09: React.FC = () => {
  const f = useCurrentFrame();
  const morse = '-.-. --.- / -.. . / --... ----. - .... / .. -. ..-. / -.. .. ...- / .... --.-';
  return (
    <AbsoluteFill>
      <Cam s={1 + 0.08 * ease(f, 0, 190)} ox={600} oy={1200}>
        <Svg>
          <Landscape pal={NIGHT} camX={30} horizon={1080} stars />
          <Mast x={330} y={1290} h={640} on={1} />
          <Truck x={760} y={1320} s={0.75} night />
          <circle cx={520} cy={1210} r={160} fill="#ffcf7a" opacity={0.22} filter="url(#soft2)" />
          <rect x={430} y={1180} width={190} height={14} fill="#5b4630" /><rect x={470} y={1150} width={90} height={32} fill="#3a3d33" />
          <circle cx={540} cy={1160} r={6} fill="#ffcc66" opacity={Math.floor(f / 3) % 3 === 0 ? 1 : 0.3} />
          <GI x={470} y={1300} s={0.6} pose="sit" />
        </Svg>
      </Cam>
      <Loc text="2 · OVER THE RADIO" sub="“SPOOF RADIO”" at={4} />
      <div style={{ position: 'absolute', left: 70, right: 70, top: 340, fontFamily: MONO, fontSize: 46, letterSpacing: 4, color: C.yellow, textShadow: '0 2px 14px #000', wordBreak: 'break-all' }}>{morse.slice(0, Math.floor(lin(f, 10, 150) * morse.length))}</div>
      <Chips y={520} items={[{ t: 'Copied real divisions', at: wf(9, 'traffic') - 4 }, { t: "Each operator's style", at: wf(9, 'style') - 6, color: 'rgba(200,53,43,0.85)' }]} />
    </AbsoluteFill>
  );
};

/* ============ 10 · on the ground: sound trucks, patches, cafés ============ */
const Cafe: React.FC = () => (
  <Svg>
    <defs><pattern id="cob" width="56" height="40" patternUnits="userSpaceOnUse"><rect width="56" height="40" fill="#3a3530" /><ellipse cx="14" cy="10" rx="12" ry="8" fill="#4d463e" /><ellipse cx="42" cy="10" rx="12" ry="8" fill="#463f38" /><ellipse cx="28" cy="30" rx="12" ry="8" fill="#4a433b" /></pattern></defs>
    <rect width={1080} height={1920} fill="#14131a" />
    <rect x={0} y={260} width={1080} height={920} fill="#4a4036" />
    {[150, 540, 930].map((x) => <g key={x}><rect x={x - 140} y={560} width={280} height={420} fill="#ffcf86" /><rect x={x - 140} y={560} width={280} height={420} fill="url(#lampW)" /><path d={`M${x},560 L${x},980 M${x - 140},770 L${x + 140},770`} stroke="#3a2e22" strokeWidth={10} /></g>)}
    <defs><radialGradient id="lampW"><stop offset="0" stopColor="rgba(255,240,200,0.6)" /><stop offset="1" stopColor="rgba(200,120,40,0.3)" /></radialGradient></defs>
    <rect x={160} y={300} width={760} height={120} fill="#1d1b19" /><text x={540} y={385} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={86} letterSpacing={8} fill="#f2e6c8">CAFÉ DU COIN</text>
    {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${i * 90},440 L${i * 90 + 90},440 L${i * 90 + 100},530 L${i * 90 - 10},530 Z`} fill={i % 2 ? '#efe6d2' : '#a8231b'} />)}
    <rect x={0} y={1170} width={1080} height={760} fill="url(#cob)" />
    <ellipse cx={540} cy={1250} rx={700} ry={180} fill="rgba(255,190,110,0.18)" filter="url(#soft2)" />
    {[330, 800].map((x) => <g key={x}><rect x={x - 90} y={1170} width={180} height={14} rx={6} fill="#222" /><rect x={x - 6} y={1184} width={12} height={130} fill="#222" /><rect x={x - 30} y={1150} width={22} height={22} fill="#eee" /></g>)}
  </Svg>
);
export const S10: React.FC = () => {
  const f = useCurrentFrame();
  const cafeAt = wf(10, 'soldiers') - 14;
  const inCafe = f >= cafeAt;
  const on = lin(f, wf(10, 'played') - 10, wf(10, 'played'));
  return (
    <AbsoluteFill>
      {!inCafe ? (
        <Cam s={1.1 - 0.15 * ease(f, wf(10, 'heard') - 20, wf(10, '15') + 20)} ox={540} oy={1150}>
          <Svg>
            <Landscape pal={DUSK} camX={60} horizon={1000} />
            {on > 0 && [0, 1, 2, 3, 4].map((i) => { const p = ((f / 45) + i / 5) % 1; return <ellipse key={i} cx={560} cy={1140} rx={60 + p * 1300} ry={(60 + p * 1300) * 0.18} fill="none" stroke="#ffd84a" strokeWidth={10 * (1 - p) + 2} opacity={(1 - p) * on} />; })}
            <Halftrack x={540} y={1300} s={0.9} blast={on * (0.5 + 0.5 * Math.sin(f * 0.6))} />
          </Svg>
        </Cam>
      ) : (
        <Cam s={1 + 0.06 * lin(f - cafeAt, 0, 150)} ox={540} oy={1200}>
          <Cafe />
          <Svg>
            <GI x={220} y={1360} s={0.9} pose="sit" patch />
            <GI x={450} y={1360} s={0.9} pose="sit" patch flip />
            <Spy x={860} y={1360} s={0.92} sit paper />
            {f >= wf(10, 'spies') - 6 && <text x={860} y={1010} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={110} fill={C.yellow} opacity={lin(f, wf(10, 'spies') - 6, wf(10, 'spies'))}>?</text>}
          </Svg>
        </Cam>
      )}
      <Loc text="3 · ON THE GROUND" sub="3132ND SIGNAL SERVICE CO." at={4} out={cafeAt - 12} />
      {!inCafe && <Stat value={<Num from={0} to={15} at={wf(10, '15') - 6} dur={16} suffix=" MILES" />} label="recorded tank columns, from loudspeakers" at={wf(10, '15') - 8} y={1060} color={C.yellow} />}
      {inCafe && <Chips y={150} items={[{ t: 'Fake unit patches', at: wf(10, 'patches') - 4 }, { t: 'Loose talk', at: wf(10, 'talked') - 4, color: 'rgba(200,53,43,0.85)' }]} />}
    </AbsoluteFill>
  );
};

/* ============ 11–13 · parchment map: Normandy → the Rhine → Viersen ============ */
const VEU: View = { lon: 2.4, lat: 50.0, k: 112 };
const VRH: View = { lon: 6.6, lat: 51.38, k: 2100 };
const OPS: [number, number][] = [[-1.2, 49.3], [-4.3, 48.4], [-3.8, 48.6], [1.0, 48.9], [5.9, 49.6], [6.1, 49.52], [6.3, 49.8], [6.5, 49.4], [6.2, 50.6], [6.4, 50.75], [6.0, 50.9], [6.4, 51.25], [6.2, 51.0]];
const DUMS: [number, number][] = Array.from({ length: 40 }, (_, i) => [6.36 + hash01(i, 11) * 0.34, 51.17 + hash01(i, 12) * 0.17]);
const Badge: React.FC<{ x: number; y: number; text: string; at: number }> = ({ x, y, text, at }) => {
  const f = useCurrentFrame(); if (f < at) return null; const k = ease(f, at, at + 10);
  return <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${0.6 + 0.4 * k})`, opacity: k, background: '#efe3c4', border: '5px dashed #4f5730', borderRadius: 14, padding: '8px 20px', fontFamily: SANS, fontWeight: 800, fontSize: 42, color: '#4f5730', whiteSpace: 'nowrap' }}>{text} <span style={{ fontFamily: MONO, fontSize: 24, color: '#b0281f' }}>FAKE</span></div>;
};
const Tanks: React.FC<{ P: (a: number, b: number) => [number, number]; at: number; f: number }> = ({ P, at, f }) => (
  <g>{DUMS.map((d, i) => { const k = ease(f, at + i * 0.9, at + i * 0.9 + 8); if (k <= 0) return null; const [x, y] = P(...d);
    return <g key={i} transform={`translate(${x},${y}) scale(${0.3 * k}) rotate(${-20 + hash01(i, 5) * 40})`}><rect x={-60} y={-36} width={120} height={72} rx={18} fill="#5d6238" stroke="#2a2117" strokeWidth={8} /><circle r={24} fill="#4d5130" stroke="#2a2117" strokeWidth={6} /><rect x={10} y={-6} width={80} height={12} fill="#3a3d22" /></g>; })}</g>
);
export const S11: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <EuroMap view={VEU} cy={760}
        routes={[{ pts: ['normandy', 'brest', [-1.5, 48.5], 'paris', 'luxembourg', [6.3, 50.6], 'viersen'], p: ease(f, 4, 88), color: '#4f5730', width: 13 }]}
        pins={[{ at: 'normandy', label: 'Normandy', o: lin(f, 2, 10), side: 't', size: 38 }, { at: 'brest', label: 'Brest', o: lin(f, 18, 26), side: 'b', size: 34 },
          { at: 'luxembourg', label: 'Luxembourg', o: lin(f, 48, 56), side: 'l', size: 34 }, { at: 'viersen', label: 'Rhine', o: lin(f, 80, 88), side: 'r', size: 40, color: '#b0281f', big: true }]}
        labels={[{ at: [2.5, 47.4], text: 'FRANCE', o: 1, size: 54, color: 'rgba(60,40,20,0.35)' }, { at: [8.6, 50.2], text: 'GERMANY', o: 1, size: 50, color: 'rgba(60,40,20,0.35)' }]}>
        {(P) => <g>{OPS.map((o, i) => { const k = lin(f, 10 + i * 6, 16 + i * 6); const [x, y] = P(...o); return k > 0 ? <circle key={i} cx={x} cy={y} r={14 * k} fill="#efe3c4" stroke="#2a2117" strokeWidth={4} strokeDasharray="5 4" /> : null; })}</g>}
      </EuroMap>
      <Loc text="JUNE 1944 → MARCH 1945" sub="WESTERN FRONT" at={2} />
      <Stat value={<Num from={0} to={20} at={wf(11, 'twenty') - 10} dur={14} suffix="+" />} label="deception operations" at={wf(11, 'twenty') - 16} y={1080} w={560} />
    </AbsoluteFill>
  );
};
export const S12: React.FC = () => {
  const f = useCurrentFrame();
  const v = lerpView(VEU, VRH, ease(f, 0, 80));
  const cover = wf(12, 'cover'), faked = wf(12, 'faked'), n600 = wf(12, '600');
  return (
    <AbsoluteFill>
      <EuroMap view={v} cy={760}
        pins={[{ at: 'viersen', label: 'Viersen', o: lin(f, 70, 80), side: 'l', size: 36 }, { at: 'rheinberg', label: 'Real crossing site', o: lin(f, cover + 10, cover + 20), side: 'l', size: 34, color: '#2d4f86', big: true }]}
        labels={[{ at: [6.84, 51.5], text: 'RHINE', o: lin(f, 60, 72), size: 40, color: '#2f6f93', rot: -70 }]}>
        {(P) => <Tanks P={P} at={faked - 8} f={f} />}
      </EuroMap>
      <Loc text="OPERATION VIERSEN" sub="MARCH 18–24, 1945" at={wf(12, 'march') - 6} />
      <Badge x={330} y={560} text="30th Infantry Div." at={wf(12, 'two') - 4} />
      <Badge x={700} y={1240} text="79th Infantry Div." at={wf(12, 'divisions') - 6} />
      <Stat value={<Num from={0} to={600} at={n600 - 10} dur={22} suffix="+" />} label="inflatable dummies · 2 fake divisions" at={n600 - 16} y={160} w={720} color={C.yellow} />
    </AbsoluteFill>
  );
};
export const S13: React.FC = () => {
  const f = useCurrentFrame();
  const bait = wf(13, 'bait'), real = wf(13, 'real'), res = wf(13, 'resistance');
  return (
    <AbsoluteFill>
      <EuroMap view={VRH} cy={760}
        routes={[{ pts: [[7.12, 51.46], [6.92, 51.37], [6.76, 51.31]], p: ease(f, bait - 18, bait + 8), color: '#5c5f63', width: 12 }, { pts: [[7.15, 51.24], [6.94, 51.25], [6.78, 51.24]], p: ease(f, bait - 12, bait + 14), color: '#5c5f63', width: 12 },
          { pts: [[6.3, 51.62], [6.5, 51.58], [6.72, 51.57], [6.92, 51.6]], p: ease(f, real - 6, real + 40), color: '#2d4f86', width: 16 }]}
        pins={[{ at: 'viersen', label: 'Viersen', o: 1, side: 'l', size: 34 }, { at: 'rheinberg', label: 'Rheinberg', o: 1, side: 'l', size: 36, color: '#2d4f86', big: true }]}
        labels={[{ at: [6.84, 51.5], text: 'RHINE', o: 1, size: 40, color: '#2f6f93', rot: -70 }, { at: [7.0, 51.42], text: 'GERMAN RESERVES', o: lin(f, bait - 18, bait - 8), size: 26, color: '#4a4d52' }]}>
        {(P) => <Tanks P={P} at={-400} f={f} />}
      </EuroMap>
      <Loc text="NIGHT OF MARCH 23, 1945" sub="NINTH ARMY CROSSES THE RHINE" at={real - 6} />
      <Photo src="simpson" at={real + 10} x={720} y={330} w={300} rot={3} caption="LT. GEN. WILLIAM SIMPSON, NINTH ARMY" />
      <Photo src="rhine" at={res - 18} x={60} y={790} w={680} rot={-2} caption="U.S. TROOPS CROSSING THE RHINE, MARCH 1945" />
      <RStamp text="LITTLE RESISTANCE" at={res + 2} x={420} y={1200} size={64} rot={-6} color="#4a7fd0" />
    </AbsoluteFill>
  );
};

/* ============ 15 · the medal ============ */
export const S15: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 55%, #3a1d1d 0%, #120a0a 70%)' }}>
      <Cam s={0.92 + 0.08 * ease(f, 0, 220)} ox={540} oy={900}>
        <Svg><Medal x={540} y={1020} s={1.15} shine={(f % 120) / 120} /></Svg>
      </Cam>
      <Title text="CONGRESSIONAL GOLD MEDAL" at={wf(15, 'congressional') - 6} y={170} size={84} sub="AWARDED TO THE GHOST ARMY · 2022" />
      <Chips y={1270} items={[{ t: 'Rubber', at: wf(15, 'rubber') - 4 }, { t: 'Sound', at: wf(15, 'sound') - 4 }, { t: 'Imagination', at: wf(15, 'imagination') - 2, color: 'rgba(200,53,43,0.85)' }]} size={40} />
    </AbsoluteFill>
  );
};

/* ============ 16 · Would you have fallen for it? ============ */
export const S16: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Cam s={1.1 - 0.06 * lin(f, 0, 110)} ox={600} oy={1250}>
        <Svg>
          <Landscape pal={{ ...DUSK, sunX: 820, sunY: 940 }} camX={120 + f * 0.5} horizon={1060} />
          <Sherman x={600} y={1300} s={0.8} rubber wob={0.5} />
          <GI x={330} y={1330} s={0.82} />
          <GI x={880} y={1330} s={0.82} flip />
        </Svg>
      </Cam>
      <Title text="Would you have fallen for it?" serif at={wf(16, 'would') - 4} y={240} size={92} color={C.yellow} />
      <Chips y={1240} items={[{ t: 'Follow for more forgotten history', at: wf(16, 'it') + 10, color: 'rgba(200,53,43,0.9)' }]} size={32} />
    </AbsoluteFill>
  );
};

void PL; void TankTop;

export const SCENE_COMPS: React.FC[] = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13, S14, S15, S16];
