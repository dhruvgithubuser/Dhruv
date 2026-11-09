import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { PaperCard, Stamp, Typed } from '../components/ArchivalDocument';
import { BerlinMap, EuropeMap } from '../components/MapAnimation';
import { Timeline } from '../components/TextOverlay';
import { C, ease, lin, wf } from '../theme';

// 05 OPERATION VALKYRIE: the flight back to Berlin, the Bendlerblock, the Valkyrie file (emergency plan -> coup blueprint), timeline advancing.
export const Scene05: React.FC = () => {
  const f = useCurrentFrame();
  const ru = wf(5, 'rushed'), va = wf(5, 'valkyrie'), it = wf(5, 'it'), se = wf(5, 'secretly'), co = wf(5, 'coup');
  const toBerlin = lin(f, it - 8, it + 4);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: 1 - toBerlin }}>
        <EuropeMap view={{ lon: 17.5, lat: 53.3, k: 98, cy: 1020 }} routes={[{ from: 'wolfslair', to: 'berlin', p: ease(f, ru - 4, va + 6), label: 'flight back' }]}
          pins={[{ at: 'berlin', label: 'BERLIN', o: 1 }, { at: 'wolfslair', label: "WOLF'S LAIR", o: 1 }]} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: toBerlin }}>
        <BerlinMap routes={0} tilt={30} pins={1} />
      </AbsoluteFill>
      {f >= va - 10 && (
        <div style={{ position: 'absolute', left: 90, top: 250, width: 420, opacity: lin(f, va - 10, va), transform: `rotate(-2deg) scale(${1.06 - 0.06 * lin(f, va - 10, va + 4)})`, background: '#f4eedf', padding: 12, paddingBottom: 46, boxShadow: '0 16px 36px rgba(20,12,4,0.55)' }}>
          <svg width="100%" height={300} viewBox="0 0 396 300" style={{ display: 'block', background: '#cbbd9c' }}>
            <rect x={0} y={0} width={396} height={300} fill="#bfb08e" />
            <rect x={14} y={70} width={368} height={190} fill="#8f8a7c" stroke="#2a2117" strokeWidth={3} />
            <rect x={14} y={58} width={368} height={14} fill="#6e6a5e" />
            {Array.from({ length: 4 }, (_, r) => Array.from({ length: 12 }, (_, c) => <rect key={`${r}-${c}`} x={26 + c * 30} y={84 + r * 42} width={16} height={26} fill="#3a3530" />))}
            <path d="M178,260 L178,222 Q198,200 218,222 L218,260 Z" fill="#2a2117" />
            <rect x={0} y={260} width={396} height={40} fill="#6b5a45" />
            {[40, 120, 300].map((x) => <g key={x}><rect x={x} y={244} width={52} height={20} rx={4} fill="#3a3a30" /><circle cx={x + 12} cy={266} r={6} fill="#111" /><circle cx={x + 40} cy={266} r={6} fill="#111" /></g>)}
          </svg>
          <div style={{ position: 'absolute', left: 14, bottom: 10, fontFamily: 'Courier Prime', fontWeight: 700, fontSize: 21 }}>BENDLERBLOCK · ARMY HQ (DIAGRAM)</div>
        </div>
      )}
      <PaperCard at={va - 4} x={520} y={300} w={480} rot={3} from="right" tilt3d={45}>
        <div style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: 52, letterSpacing: 4, color: C.charcoal }}>OPERATION WALKÜRE</div>
        <div style={{ fontFamily: 'Plex Mono', fontSize: 18, letterSpacing: 2, color: C.dim, marginBottom: 12 }}>(VALKYRIE)</div>
        <Typed text={'Emergency plan: the Replacement Army keeps order if unrest breaks out.'} a={it} b={it + 50} size={26} />
      </PaperCard>
      <Stamp text="Rewritten: coup" at={se + 6} x={760} y={680} size={60} rot={-9} />
      <Timeline at={it - 4} p={0.33 * ease(f, it, co + 10)} y={1462} hl={1} />
    </AbsoluteFill>
  );
};
