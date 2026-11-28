import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { CutoutDefs, Figure } from '../components/CharacterCutout';
import { PaperCard } from '../components/ArchivalDocument';
import { Camera } from '../components/DocumentaryStage';
import { C, ease, lin, wf } from '../theme';

// 07 THE EXECUTIONS: the Bendlerblock courtyard at night, lit by truck headlights; four silhouettes fade; the date card settles. Non-graphic.
export const Scene07: React.FC = () => {
  const f = useCurrentFrame();
  const ex = wf(7, 'executed');
  const fade = lin(f, ex, ex + 30);
  return (
    <AbsoluteFill style={{ background: '#08070a' }}>
      <Camera drift={0.8} push={0.04 * ease(f, 0, 200)}>
        <Img src={staticFile('assets/backgrounds/courtyard_night.jpg')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: `sepia(0.35) brightness(${0.55 - 0.3 * fade}) contrast(1.15)` }} />
        <AbsoluteFill style={{ background: `linear-gradient(110deg, rgba(255,240,200,${0.22 * (1 - fade)}) 0%, rgba(255,240,200,0) 40%)`, mixBlendMode: 'screen' }} />
        <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: 1 - 0.85 * fade, filter: 'brightness(0.16)' }}>
          <CutoutDefs />
          {[300, 470, 640, 810].map((x, i) => <Figure key={x} who={i === 1 ? 'stauffenberg' : 'officer'} x={x} y={1120} s={0.62} legs dim={0.88} />)}
        </svg>
      </Camera>
      <PaperCard at={10} x={160} y={300} w={760} rot={-1.5} from="bottom">
        <div style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: 58, letterSpacing: 3, color: C.charcoal }}>21 JULY 1944 · 00:10</div>
        <div style={{ fontFamily: 'Courier Prime', fontWeight: 700, fontSize: 26, color: C.ink, marginTop: 8 }}>Bendlerblock courtyard, Berlin</div>
        <div style={{ fontFamily: 'Courier Prime', fontSize: 24, color: C.red, marginTop: 10 }}>Olbricht · von Stauffenberg · Mertz von Quirnheim · von Haeften</div>
      </PaperCard>
    </AbsoluteFill>
  );
};
