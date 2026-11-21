import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CutoutDefs, Figure, useRise } from '../components/CharacterCutout';
import { PaperCard, Typed } from '../components/ArchivalDocument';
import { EuropeMap } from '../components/MapAnimation';
import { Headline } from '../components/TextOverlay';
import { C, ease, lin, wf } from '../theme';

// 01 THE SECRET PLOT: the map lies on a planning table (3D tilt); conspirators rise behind it in shadow; a secret file slides in.
export const Scene01: React.FC = () => {
  const f = useCurrentFrame();
  const g = wf(1, 'group');
  const r = [useRise(g - 6), useRise(g), useRise(g + 6), useRise(g + 12)];
  return (
    <AbsoluteFill style={{ background: C.charcoal }}>
      <AbsoluteFill style={{ top: 760, clipPath: 'inset(0 0 0 0)' }}>
        <div style={{ position: 'absolute', left: -120, right: -120, top: -200, height: 1700 }}>
          <EuropeMap view={{ lon: 14 + 2 * ease(f, 0, 240), lat: 50.5, k: 26 + 8 * ease(f, 0, 260), cy: 900 }} tilt={52} germany={lin(f, wf(1, 'nazi') - 4, wf(1, 'nazi') + 20)} />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 60% 30% at 50% 0%, rgba(255,226,170,0.35), rgba(0,0,0,0) 70%)' }} />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, filter: 'brightness(0.42) contrast(1.1)' }}>
        <CutoutDefs />
        <Figure who="officerCap" x={180} y={800} s={0.62} rise={r[0]} dim={0.62} />
        <Figure who="officer" x={420} y={800} s={0.66} rise={r[1]} dim={0.58} />
        <Figure who="officerCap" x={660} y={800} s={0.64} rise={r[2]} dim={0.6} />
        <Figure who="officer" x={900} y={800} s={0.6} rise={r[3]} dim={0.64} />
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 752, height: 16, background: '#3e2a18', boxShadow: '0 6px 20px rgba(0,0,0,0.6)' }} />
      <Headline text="Operation Valkyrie" sub="THE REAL STORY BEHIND" at={0} y={250} size={104} dark={false} underline={wf(1, 'july') + 10} />
      <PaperCard at={wf(1, 'officers') - 4} x={560} y={930} w={420} rot={4} from="right" tilt3d={40}>
        <div style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: 44, color: C.red, letterSpacing: 6, borderBottom: `3px solid ${C.red}`, marginBottom: 12 }}>GEHEIM · SECRET</div>
        <Typed text={'20 JULY 1944\nTARGET: A. HITLER\nPLAN: VALKYRIE'} a={wf(1, 'officers')} b={wf(1, 'unthinkable') + 6} size={30} bold />
      </PaperCard>
    </AbsoluteFill>
  );
};
