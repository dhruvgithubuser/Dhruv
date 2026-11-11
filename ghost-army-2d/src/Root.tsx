import React from 'react';
import { Composition } from 'remotion';
import { GhostArmy2D } from './Documentary';
import { DURATION_FRAMES, FPS, H, W } from './theme';

export const RemotionRoot: React.FC = () => (
  <Composition id="GhostArmy2D" component={GhostArmy2D} width={W} height={H} fps={FPS} durationInFrames={DURATION_FRAMES} />
);
