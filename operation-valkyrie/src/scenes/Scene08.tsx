import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CutoutDefs, Figure } from '../components/CharacterCutout';
import { Photo } from '../components/ArchivalDocument';
import { EuropeMap } from '../components/MapAnimation';
import { Headline, Note } from '../components/TextOverlay';
import { C, SCENES, ease, lin, sec, wf, PHRASES } from '../theme';

// 08 THE LEGACY: the portrait settles over the faded map and silhouettes, a red underline, then the final title (held >= 1 s).
export const Scene08: React.FC = () => {
  const f = useCurrentFrame();
  const fl = wf(8, 'failed'), ev = wf(8, 'everything');
  const end = sec(PHRASES[PHRASES.length - 1].end) - SCENES[7].from;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: 0.55 }}>
        <EuropeMap view={{ lon: 14, lat: 51.5, k: 40, cy: 980 }} germany={1} />
      </AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: 0.45, filter: 'brightness(0.3)' }}>
        <CutoutDefs />
        {[150, 330, 750, 930].map((x, i) => <Figure key={x} who={i % 2 ? 'officer' : 'officerCap'} x={x} y={1150} s={0.7} dim={0.75} />)}
      </svg>
      <AbsoluteFill style={{ background: `rgba(29,27,25,${0.55 * lin(f, end - 20, end)})` }} />
      <Photo src="assets/characters/stauffenberg.jpg" at={4} x={290} y={420} w={500} h={560} rot={-1.5} caption="Claus von Stauffenberg, 1907–1944" />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <path d="M290,1110 L790,1110" stroke={C.red} strokeWidth={12} strokeDasharray={`${500 * ease(f, fl, fl + 14)} 600`} />
      </svg>
      <Note text="~200 CONSPIRATORS LATER EXECUTED" at={ev - 10} x={250} y={1140} size={26} />
      <Headline text="The coup that failed" at={end - 4} y={250} size={92} dark={false} />
    </AbsoluteFill>
  );
};
