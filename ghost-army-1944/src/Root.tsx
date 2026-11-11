import React from 'react';
import { Composition } from 'remotion';
import { GhostArmy } from './Documentary';
import { DURATION_FRAMES, FPS, H, W } from './theme';

export const RemotionRoot: React.FC = () => (
  <Composition id="GhostArmy" component={GhostArmy} width={W} height={H} fps={FPS} durationInFrames={DURATION_FRAMES} />
);
