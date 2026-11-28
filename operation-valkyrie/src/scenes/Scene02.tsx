import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { Briefcase, CutoutDefs, useRise } from '../components/CharacterCutout';
import { Photo } from '../components/ArchivalDocument';
import { EuropeMap } from '../components/MapAnimation';
import { Note } from '../components/TextOverlay';
import { Camera } from '../components/DocumentaryStage';
import { ease, lin, wf } from '../theme';

// 02 THE MAN BEHIND THE PLOT: the portrait settles, the briefcase drops in, the red route draws Berlin -> Wolf's Lair.
export const Scene02: React.FC = () => {
  const f = useCurrentFrame();
  const col = wf(2, 'colonel'), bc = wf(2, 'briefcase'), en = wf(2, 'entered'), wl = wf(2, 'wolfs');
  const caseRise = useRise(bc - 2);
  return (
    <Camera push={0.03 * ease(f, en, wl + 20)} ox={70} oy={55}>
      <EuropeMap view={{ lon: 17.5, lat: 53.3, k: 88 + 10 * ease(f, 0, 200), cy: 1020 }}
        routes={[{ from: 'berlin', to: 'wolfslair', p: ease(f, en, wl + 4), label: '~ 560 km' }]}
        pins={[{ at: 'berlin', label: 'BERLIN', o: lin(f, 6, 16) }, { at: 'wolfslair', label: "WOLF'S LAIR", o: lin(f, wl - 4, wl + 8) }]} />
      <Photo src="assets/characters/stauffenberg.jpg" at={col - 8} x={110} y={250} w={420} h={520} rot={-3} caption="Claus von Stauffenberg" credit="portrait c. 1934 · public domain" />
      <Note text="COLONEL · AGE 36" at={col + 10} x={560} y={300} />
      <Note text={'WOUNDED IN TUNISIA, 1943:'} at={col + 18} x={560} y={360} size={20} />
      <Note text={'LOST RIGHT HAND, LEFT EYE,'} at={col + 22} x={560} y={404} size={20} />
      <Note text={'TWO FINGERS OF LEFT HAND'} at={col + 26} x={560} y={448} size={20} />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <CutoutDefs />
        <g opacity={caseRise > 0 ? 1 : 0}><Briefcase x={760} y={620 + (1 - caseRise) * -200} s={1.2} /></g>
      </svg>
      {f >= wl - 6 && (
        <div style={{ position: 'absolute', left: 600, top: 680, width: 380, opacity: lin(f, wl - 6, wl + 4), transform: `rotate(2deg) scale(${1.08 - 0.08 * lin(f, wl - 6, wl + 6)})`, background: '#f4eedf', padding: 12, paddingBottom: 46, boxShadow: '0 16px 36px rgba(20,12,4,0.55)' }}>
          <Img src={staticFile('assets/backgrounds/wolfslair_forest.jpg')} style={{ width: '100%', height: 230, objectFit: 'cover', filter: 'sepia(0.4)' }} />
          <div style={{ position: 'absolute', left: 14, bottom: 10, fontFamily: 'Courier Prime', fontWeight: 700, fontSize: 18 }}>WOLF'S LAIR · EAST PRUSSIA (ILLUSTRATION)</div>
        </div>
      )}
    </Camera>
  );
};
