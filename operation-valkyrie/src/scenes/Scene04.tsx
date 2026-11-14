import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Blast, Room, FLOOR_Y } from '../components/Room';
import { PaperCard, Photo } from '../components/ArchivalDocument';
import { Note } from '../components/TextOverlay';
import { C, ease, lin, wf } from '../theme';

// 04 THE EXPLOSION: 12:42, controlled flash + illustrated smoke; the real photo of the wrecked hut; a plan diagram shows why he lived.
const Plan: React.FC<{ p: number; t: number }> = ({ p, t }) => {
  const mv = ease(t, 0, 30);
  return (
    <svg width={760} height={520} viewBox="0 0 760 520">
      <rect x={40} y={170} width={680} height={180} fill="#d9c79f" stroke={C.ink} strokeWidth={5} />
      <text x={380} y={150} textAnchor="middle" fontFamily="Courier Prime" fontWeight={700} fontSize={26} fill={C.ink}>OAK MAP TABLE (PLAN VIEW)</text>
      <rect x={130} y={190} width={110} height={140} fill="#5e4126" /><rect x={480} y={190} width={110} height={140} fill="#5e4126" />
      <text x={535} y={268} textAnchor="middle" fontFamily="Oswald" fontWeight={700} fontSize={22} fill="#efe6d2">SUPPORT</text>
      <circle cx={420} cy={400} r={30} fill={C.charcoal} /><text x={420} y={409} textAnchor="middle" fontFamily="Oswald" fontWeight={700} fontSize={26} fill="#efe6d2">H</text>
      <text x={420} y={470} textAnchor="middle" fontFamily="Courier Prime" fontSize={22} fill={C.ink}>Hitler</text>
      <rect x={398 + 222 * mv} y={270} width={44} height={30} fill="#4a2c1a" stroke={C.ink} strokeWidth={2} opacity={1} />
      <g opacity={1 - mv * 0.6}><circle cx={420} cy={285} r={34} fill="none" stroke={C.redHi} strokeWidth={4} strokeDasharray="8 6" /></g>
      {mv > 0.2 && <path d="M440,250 Q520,215 620,250" fill="none" stroke={C.redHi} strokeWidth={5} markerEnd="url(#pa)" opacity={mv} />}
      <defs><marker id="pa" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={C.redHi} /></marker></defs>
      {p > 0 && [0, 1, 2].map((i) => <path key={i} d={`M ${642 + 40 * i + 40 * p} 200 A ${60 + 50 * i + 60 * p} ${60 + 50 * i + 60 * p} 0 0 1 ${642 + 40 * i + 40 * p} 370`} fill="none" stroke="#e08a2a" strokeWidth={5} opacity={0.8 - 0.2 * i} />)}
      {p > 0.5 && <text x={380} y={505} textAnchor="middle" fontFamily="Courier Prime" fontWeight={700} fontSize={22} fill={C.red}>BLAST SHIELDED BY THE SUPPORT</text>}
    </svg>
  );
};
export const Scene04: React.FC = () => {
  const f = useCurrentFrame();
  const ex = wf(4, 'explosion'), sv = wf(4, 'survived'), mv = wf(4, 'moved'), sp = wf(4, 'support');
  return (
    <AbsoluteFill style={{ background: '#1d1b19' }}>
      <AbsoluteFill style={{ transform: f >= ex ? `translate(${6 * Math.sin(f * 2.1) * Math.exp(-(f - ex) / 8)}px, ${4 * Math.cos(f * 1.7) * Math.exp(-(f - ex) / 8)}px)` : undefined }}>
        <Room caseX={f < ex ? 900 : null} stauffX={-400} hitlerLean={-7} blur={4} damage={lin(f, ex, ex + 10)} figuresDim={lin(f, ex, ex + 6) * 0.5} />
        <Blast at={ex} x={900} y={FLOOR_Y - 60} />
      </AbsoluteFill>
      <Note text="12:42 · THE BOMB EXPLODES" at={ex} x={150} y={260} dark />
      {f < mv - 4 && <Photo src="assets/documents/room_after.jpg" at={sv - 4} x={90} y={330} w={900} h={560} rot={-2} caption="The briefing hut after the blast, July 1944" credit="Bundesarchiv, Bild 146-1972-025-10 / CC BY-SA 3.0 DE" pos="50% 50%" />}
      <PaperCard at={mv - 6} x={140} y={360} w={800} rot={1.5} from="bottom" tilt3d={30}>
        <Plan p={lin(f, sp, sp + 20)} t={f - mv} />
      </PaperCard>
      <Note text="MOVED, APPARENTLY BY COL. HEINZ BRANDT" at={mv + 10} x={170} y={300} size={22} />
    </AbsoluteFill>
  );
};
