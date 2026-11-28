import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { PaperCard, Strike, Typed } from '../components/ArchivalDocument';
import { BerlinMap } from '../components/MapAnimation';
import { Headline, Timeline } from '../components/TextOverlay';
import { C, ease, lin, wf } from '../theme';

/** Rotary desk telephone that rings (short shakes) from `at`. */
const Telephone: React.FC<{ at: number; stop: number }> = ({ at, stop }) => {
  const f = useCurrentFrame();
  const ring = f >= at && f < stop && Math.floor((f - at) / 6) % 3 !== 2;
  const r = ring ? 4 * Math.sin(f * 2.4) : 0;
  return (
    <svg width={220} height={200} viewBox="0 0 220 200" style={{ transform: `rotate(${r}deg)` }}>
      <path d="M30,170 L50,95 Q110,70 170,95 L190,170 Z" fill={C.charcoal} stroke="#000" strokeWidth={3} />
      <circle cx={110} cy={130} r={30} fill="#efe6d2" stroke="#000" strokeWidth={3} />
      {Array.from({ length: 10 }, (_, i) => <circle key={i} cx={110 + 20 * Math.cos((i / 10) * 6.28)} cy={130 + 20 * Math.sin((i / 10) * 6.28)} r={4} fill={C.charcoal} />)}
      <path d={`M20,${70 - (ring ? 6 : 0)} Q110,${20 - (ring ? 6 : 0)} 200,${70 - (ring ? 6 : 0)} L188,${86 - (ring ? 6 : 0)} Q110,${50 - (ring ? 6 : 0)} 32,${86 - (ring ? 6 : 0)} Z`} fill={C.charcoal} stroke="#000" strokeWidth={3} />
      {ring && <path d="M200,40 l14,-10 M206,58 l16,-2 M14,40 l-14,-10" stroke={C.red} strokeWidth={4} />}
    </svg>
  );
};
// 06 THE FAILURE: routes to the government quarter draw; the telephone rings; Hitler is alive; routes stop; Valkyrie is struck through.
export const Scene06: React.FC = () => {
  const f = useCurrentFrame();
  const tr = wf(6, 'troops'), tg = wf(6, 'targeted'), tk = wf(6, 'takeover'), th = wf(6, 'then'), al = wf(6, 'alive'), cl = wf(6, 'collapsed');
  return (
    <AbsoluteFill>
      <BerlinMap routes={ease(f, tr, tk + 10)} stop={lin(f, al, al + 16)} tilt={30} />
      <Headline text="The takeover begins" at={tk - 4} out={th + 4} y={250} size={84} />
      <PaperCard at={th - 2} x={110} y={240} w={860} rot={-1.5} from="left">
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Telephone at={th} stop={al + 6} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Plex Mono', fontSize: 20, letterSpacing: 2, color: C.dim }}>20 JULY 1944 · EVENING</div>
            <Typed text={'WOLF\'S LAIR → BERLIN:\nHITLER IS ALIVE.'} a={th + 6} b={al + 4} size={40} bold color={C.red} />
          </div>
        </div>
      </PaperCard>
      {f >= cl - 8 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', opacity: lin(f, cl - 8, cl) }}>
          <span style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: 110, letterSpacing: 4, color: C.charcoal, background: 'rgba(239,230,210,0.9)', padding: '0 24px' }}>VALKYRIE</span>
        </div>
      )}
      <Strike at={cl} x={210} y={700} w={660} rot={-5} />
      <Timeline at={0} p={0.33 + 0.33 * ease(f, th, al + 10)} y={1462} hl={2} />
    </AbsoluteFill>
  );
};
