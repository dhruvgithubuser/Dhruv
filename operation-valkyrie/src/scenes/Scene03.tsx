import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Room, FLOOR_Y } from '../components/Room';
import { Note } from '../components/TextOverlay';
import { Camera } from '../components/DocumentaryStage';
import { ease, lin, wf } from '../theme';

// 03 THE BOMB: slow horizontal drift through the briefing; he sets the briefcase by the right-hand table support, excuses himself, walks out.
export const Scene03: React.FC = () => {
  const f = useCurrentFrame();
  const pl = wf(3, 'placed'), ex = wf(3, 'excused'), wo = wf(3, 'walked');
  const drop = ease(f, pl, pl + 14);
  const stX = 480 - 560 * ease(f, ex, wo + 24);
  const walk = f >= ex ? (f - ex) / 16 : 0;
  return (
    <AbsoluteFill style={{ background: '#1d1b19' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${-30 + 50 * ease(f, 0, 200)}px)` }}>
        <Camera drift={0.6}>
          <Room caseX={f >= pl ? 640 : null} caseO={drop} stauffX={stX} walk={walk} hitlerLean={-7} blur={4} />
        </Camera>
      </div>
      <Note text="WOLF'S LAIR · BRIEFING HUT · ~12:30" at={4} x={150} y={260} dark />
      {f >= pl + 4 && (
        <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: lin(f, pl + 4, pl + 12) * (1 - lin(f, ex + 30, ex + 40)) }}>
          <circle cx={640} cy={FLOOR_Y - 60} r={95} fill="none" stroke="#c0392b" strokeWidth={6} strokeDasharray="14 10" />
        </svg>
      )}
      <Note text="BOMB SET · ~10 MIN FUSE" at={pl + 6} x={470} y={1010} dark />
    </AbsoluteFill>
  );
};
