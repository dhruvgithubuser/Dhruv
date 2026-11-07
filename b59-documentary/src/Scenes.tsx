import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { DepthShot } from './components/DepthShot';
import { Cutaway, DepthCharges, Globe1962, IdCard, Ocean, Officers, Readout, RedAlert, Sonar, Timeline62 } from './components/Graphics1962';
import { LightLeak, Shake } from './components/Vfx';
import { C, MONO, SANS, SCENES, ease, lin, pf, wf } from './theme';

const D = (n: number) => SCENES[n - 1].frames;
const Headline: React.FC<{ lines: string[]; at: number; out: number; top?: number }> = ({ lines, at, out, top = 300 }) => {
  const f = useCurrentFrame();
  const o = lin(f, at, at + 10) * (1 - lin(f, out - 10, out));
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top, textAlign: 'center', opacity: o }}>
      {lines.map((l, i) => (
        <div key={i} style={{ fontFamily: i ? MONO : SANS, fontWeight: i ? 500 : 800, fontSize: i ? 32 : 84, letterSpacing: i ? 5 : 2, color: i ? C.amber : '#fff', textTransform: 'uppercase', textShadow: '0 4px 24px rgba(0,0,0,0.9)', marginTop: i ? 12 : 0, transform: `translateY(${(1 - ease(f, at + i * 5, at + i * 5 + 15)) * 20}px)` }}>{l}</div>
      ))}
    </div>
  );
};
/** Destroyer hull silhouettes at the surface, seen from below, with searchlight cones. */
const HullsAbove: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      <defs><linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgba(220,240,255,0.35)" /><stop offset="1" stopColor="rgba(220,240,255,0)" /></linearGradient></defs>
      {[0, 1].map((i) => {
        const x = -200 + ((f * (1.2 + i * 0.5) + i * 600) % 1500);
        return (
          <g key={i} opacity={0.75}>
            <path d={`M${x},${120 + i * 50} l300,0 l-30,40 l-240,0 Z`} fill="#03070c" />
            <path d={`M${x + 150},${160 + i * 50} L${x + 150 - 160 + Math.sin(f / 30 + i) * 80},1200 L${x + 150 + 160 + Math.sin(f / 30 + i) * 80},1200 Z`} fill="url(#beam)" />
          </g>
        );
      })}
    </svg>
  );
};

// 1 hook: the submarine in the dark Atlantic, hunted from above
export const B01: React.FC = () => (
  <AbsoluteFill>
    <DepthShot name="sub_underwater" frames={D(1) + 10} from={{ x: 0, y: 0.2, z: 1.0 }} to={{ x: 0.1, y: -0.1, z: 1.18 }} grade="contrast(1.12) saturate(1.0) brightness(0.8)" tag={false} />
    <HullsAbove />
    <Ocean />
    <Headline lines={['October 1962', 'The Atlantic']} at={0} out={D(1) + 5} top={300} />
  </AbsoluteFill>
);

// 2 world war III? control room in red, pulses of impact
export const B02: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Shake at={wf(2, 'war')} amp={16}>
      <DepthShot name="control_room" frames={D(2) + 10} from={{ x: -0.5, y: 0, z: 1.05 }} to={{ x: 0.5, y: 0, z: 1.12 }} tag />
      <RedAlert level={0.9} period={16} />
      <AbsoluteFill style={{ background: `rgba(255,220,180,${Math.max(0, 0.35 - (f - wf(2, 'war')) * 0.05)})`, opacity: f >= wf(2, 'war') ? 1 : 0 }} />
    </Shake>
  );
};

// 3 one officer: Arkhipov close-up (locked portrait)
export const B03: React.FC = () => (
  <AbsoluteFill>
    <DepthShot name="arkhipov" frames={D(3) + 10} from={{ x: 0, y: 0, z: 1.02 }} to={{ x: 0, y: 0.15, z: 1.22 }} grade="contrast(1.1) saturate(0.95) brightness(0.9)" />
    <RedAlert level={0.5} period={30} />
  </AbsoluteFill>
);

// 4 the date + crisis timeline
export const B04: React.FC = () => {
  const f = useCurrentFrame();
  const n = Math.min(27, Math.round(interpolate(f, [4, 18], [14, 27], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })));
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 30%, #1d2630 0%, #05070a 75%)' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 260, textAlign: 'center' }}>
        <div style={{ fontFamily: MONO, fontSize: 36, letterSpacing: 10, color: C.amber }}>OCTOBER</div>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 220, color: '#fff', lineHeight: 1 }}>{n}</div>
        <div style={{ fontFamily: MONO, fontSize: 48, letterSpacing: 16, color: '#fff' }}>1962</div>
      </div>
      <Timeline62 at={10} hl={3} />
    </AbsoluteFill>
  );
};

// 5 the crisis on the globe
export const B05: React.FC = () => {
  const f = useCurrentFrame();
  const d = D(5);
  return (
    <AbsoluteFill style={{ background: '#03060a' }}>
      <Globe1962 lon0={-60 + 15 * ease(f, 0, d)} lat0={35} usa={lin(f, 5, 20)} cuba={lin(f, 15, 30)} ussr={lin(f, wf(5, 'soviet') - 5, wf(5, 'soviet') + 10)} quarantine={ease(f, 40, 110)} />
      <Headline lines={['The Cuban Missile Crisis', 'US naval quarantine around Cuba']} at={6} out={d + 10} top={260} />
    </AbsoluteFill>
  );
};

// 6 hunted: B-59 on the map, then the sonar picture
export const B06: React.FC = () => {
  const f = useCurrentFrame();
  const d = D(6);
  const half = Math.round(d * 0.45);
  return (
    <AbsoluteFill style={{ background: '#03060a' }}>
      <AbsoluteFill style={{ opacity: 1 - lin(f, half, half + 10) }}>
        <Globe1962 lon0={-45} lat0={38} usa={1} cuba={1} ussr={1} quarantine={1} route={ease(f, 0, half)} sub={lin(f, half - 15, half)} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: lin(f, half, half + 10) }}>
        <DepthShot name="sub_underwater" frames={d} from={{ x: 0.3, y: 0, z: 1.15 }} to={{ x: -0.2, y: 0, z: 1.25 }} grade="contrast(1.1) brightness(0.45) saturate(0.8)" tag={false} />
        <div style={{ position: 'absolute', left: 130, top: 420 }}><Sonar size={820} contacts={4} /></div>
        <Ocean rays={0.4} bubbles={20} />
      </AbsoluteFill>
      <Headline lines={['Soviet submarine B-59', 'Hunted by US destroyers']} at={8} out={d + 10} top={250} />
    </AbsoluteFill>
  );
};

// 7 practice depth charges: surface above, submarine below
export const B07: React.FC = () => {
  const f = useCurrentFrame();
  const start = wf(7, 'dropping');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 760, overflow: 'hidden' }}>
        <Img src={staticFile('stills/destroyers.jpg')} style={{ width: '100%', height: 1920, objectFit: 'cover', objectPosition: '50% 30%', transform: `translateY(${-300 - f * 0.3}px) scale(1.05)` }} />
      </div>
      <div style={{ position: 'absolute', left: 0, top: 760, width: 1080, height: 1160, overflow: 'hidden' }}>
        <Img src={staticFile('stills/sub_underwater.jpg')} style={{ width: '100%', height: 1920, objectFit: 'cover', transform: `translateY(${-500 + f * 0.2}px)`, filter: 'brightness(0.75)' }} />
      </div>
      <Shake at={start + 40} amp={10}><DepthCharges drops={[start, start + 12, start + 24, start + 36]} /></Shake>
    </AbsoluteFill>
  );
};

// 8 inside, it sounds like an attack
export const B08: React.FC = () => {
  const f = useCurrentFrame();
  const hits = [6, 30, 52, 80];
  return (
    <Shake at={hits.filter((h) => f >= h).pop() ?? 999} amp={26}>
      <DepthShot name="control_room" frames={D(8) + 10} from={{ x: 0.4, y: 0.1, z: 1.12 }} to={{ x: -0.3, y: 0, z: 1.25 }} />
      <RedAlert level={1} period={10} />
      {hits.map((h, i) => <AbsoluteFill key={i} style={{ background: 'rgba(255,230,200,1)', opacity: f >= h && f < h + 4 ? 0.35 * (1 - (f - h) / 4) : 0 }} />)}
    </Shake>
  );
};

// 9 battery
export const B09: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <DepthShot name="engine_room" frames={D(9) + 10} from={{ x: -0.4, y: 0, z: 1.04 }} to={{ x: 0.4, y: 0, z: 1.14 }} grade={`contrast(1.1) brightness(${0.75 + 0.15 * Math.sin(f / 3) * (f % 37 < 4 ? 1 : 0)})`} />
      <Readout label="BATTERY" value={interpolate(f, [0, D(9)], [0.32, 0.18], { extrapolateRight: 'clamp' })} color={C.accent} at={8} top={330} text="LOW" />
    </AbsoluteFill>
  );
};

// 10 heat + no contact with Moscow
export const B10: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <DepthShot name="radio" frames={D(10) + 10} from={{ x: 0, y: 0, z: 1.03 }} to={{ x: 0.2, y: 0.1, z: 1.16 }} />
      <AbsoluteFill style={{ background: `repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 2px, rgba(0,0,0,0) 2px 5px)`, opacity: 0.5 + 0.5 * Math.abs(Math.sin(f / 5)) }} />
      <Readout label="TEMPERATURE" value={interpolate(f, [0, D(10)], [0.6, 0.92], { extrapolateRight: 'clamp' })} color={C.amber} at={4} top={330} text="RISING" />
      <Readout label="SIGNAL · MOSCOW" value={0.04 + 0.03 * Math.abs(Math.sin(f / 4))} color={C.accent} at={wf(10, 'moscow') - 6} top={500} text="NO CONTACT" />
    </AbsoluteFill>
  );
};

// 11 the fear
export const B11: React.FC = () => (
  <AbsoluteFill>
    <DepthShot name="crew_heat" frames={D(11) + 10} from={{ x: 0, y: 0, z: 1.03 }} to={{ x: 0, y: 0.2, z: 1.2 }} />
    <RedAlert level={0.6} period={30} />
  </AbsoluteFill>
);

// 12 the secret weapon: cutaway
export const B12: React.FC = () => (
  <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 50%, #0d1a26 0%, #02050a 75%)' }}>
    <Ocean rays={0.3} bubbles={20} o={0.6} />
    <Cutaway at={wf(12, 'carried') - 30} />
  </AbsoluteFill>
);

// 13 the captain
export const B13: React.FC = () => (
  <AbsoluteFill>
    <DepthShot name="savitsky" frames={D(13) + 10} from={{ x: 0, y: 0, z: 1.02 }} to={{ x: 0, y: 0.15, z: 1.2 }} />
    <RedAlert level={0.6} period={14} />
    <IdCard name="Valentin Savitsky" role="Commander · B-59" at={wf(13, 'valentin') - 5} out={D(13) + 10} />
  </AbsoluteFill>
);

// 14 the political officer agreed (officer cards)
export const B14: React.FC = () => (
  <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 35%, #2a0b08 0%, #050505 75%)' }}>
    <RedAlert level={0.4} period={20} />
    <Officers votes={['yes', 'yes', 'pending']} at={[-30, wf(14, 'agreed'), 999]} focus={1} />
    <div style={{ position: 'absolute', left: 0, right: 0, top: 920, textAlign: 'center', fontFamily: MONO, fontSize: 24, color: C.dim, letterSpacing: 3 }}>AS LATER REPORTED BY CREW ACCOUNTS</div>
  </AbsoluteFill>
);

// 15 Vasili Arkhipov
export const B15: React.FC = () => (
  <AbsoluteFill>
    <DepthShot name="arkhipov" frames={D(15) + 10} from={{ x: 0, y: 0.1, z: 1.1 }} to={{ x: 0, y: 0.2, z: 1.3 }} />
    <IdCard name="Vasili Arkhipov" role="Brigade chief of staff · aboard B-59" at={wf(15, 'vasili') - 5} out={D(15) + 10} />
  </AbsoluteFill>
);

// 16 the refusal
export const B16: React.FC = () => {
  const f = useCurrentFrame();
  const no = wf(16, 'opposed');
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 35%, #2a0b08 0%, #050505 75%)' }}>
      <Officers votes={['yes', 'yes', f >= no ? 'no' : 'pending']} at={[-60, -60, no]} focus={2} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 860, textAlign: 'center', opacity: lin(f, no, no + 8), transform: `scale(${1.6 - 0.6 * ease(f, no, no + 10)}) rotate(-6deg)` }}>
        <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 170, color: C.accent, border: `10px solid ${C.accent}`, padding: '0 40px', textShadow: '0 0 30px rgba(232,65,44,0.5)' }}>NO</span>
      </div>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1130, textAlign: 'center', opacity: lin(f, wf(16, 'surface') - 4, wf(16, 'surface') + 8), fontFamily: MONO, fontSize: 30, letterSpacing: 4, color: '#fff' }}>SURFACE · SEEK ORDERS FROM MOSCOW</div>
    </AbsoluteFill>
  );
};

// 17 surfacing
export const B17: React.FC = () => {
  const f = useCurrentFrame();
  const sf = wf(17, 'surfaced');
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: 1 - lin(f, sf - 15, sf) }}>
        <DepthShot name="sub_underwater" frames={sf} from={{ x: 0, y: 0.3, z: 1.1 }} to={{ x: 0, y: -0.4, z: 1.2 }} grade={`contrast(1.1) brightness(${0.7 + 0.5 * ease(f, 0, sf)})`} tag={false} />
        <Ocean rays={1.5} bubbles={90} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: lin(f, sf - 15, sf) }}>
        <DepthShot name="surfacing" frames={D(17) - sf + 15} from={{ x: 0, y: -0.2, z: 1.15 }} to={{ x: 0, y: 0, z: 1.02 }} />
        <LightLeak o={0.35} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: '#fff', opacity: f >= sf - 3 && f < sf + 5 ? 0.4 * (1 - Math.abs(f - sf) / 5) : 0 }} />
    </AbsoluteFill>
  );
};

// 18 the legacy + title
export const B18: React.FC = () => {
  const f = useCurrentFrame();
  const d = D(18);
  const t2 = pf(18, 1);
  const title = pf(18, 1, 'end') + 6;
  return (
    <AbsoluteFill>
      <DepthShot name="ocean_gold" frames={d} from={{ x: 0, y: 0, z: 1.15 }} to={{ x: 0, y: 0.1, z: 1.0 }} grade="contrast(1.05) saturate(1.0) brightness(0.9)" tag={false} />
      <LightLeak o={0.4} seed={18} />
      <div style={{ position: 'absolute', left: 290, top: 420, width: 500, height: 640, opacity: lin(f, t2 - 20, t2) * (1 - lin(f, title - 10, title)), border: '3px solid rgba(255,255,255,0.6)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
        <Img src={staticFile('stills/arkhipov.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 20%', filter: 'sepia(0.35) contrast(1.05)' }} />
      </div>
      <div style={{ position: 'absolute', left: 50, right: 50, top: 380, textAlign: 'center', opacity: lin(f, title, title + 18) }}>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 82, lineHeight: 1.08, color: '#fff', letterSpacing: 2, textShadow: '0 6px 30px rgba(0,0,0,0.8)' }}>THE OFFICER<br />WHO REFUSED<br />TO LAUNCH</div>
        <div style={{ height: 3, width: 300 * ease(f, title + 10, title + 30), background: C.amber, margin: '26px auto' }} />
        <div style={{ fontFamily: MONO, fontSize: 32, letterSpacing: 8, color: C.amber }}>THE CUBAN MISSILE CRISIS, 1962</div>
      </div>
      <AbsoluteFill style={{ background: '#000', opacity: lin(f, d - 12, d) }} />
    </AbsoluteFill>
  );
};

export const B59_SCENES = [B01, B02, B03, B04, B05, B06, B07, B08, B09, B10, B11, B12, B13, B14, B15, B16, B17, B18];
