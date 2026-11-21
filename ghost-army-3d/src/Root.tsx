import React from 'react';
import { Composition } from 'remotion';
import { GhostArmy3D } from './Documentary';
import { DURATION_FRAMES, FPS, H, W } from './theme';

export const RemotionRoot: React.FC = () => (
  <Composition id="GhostArmy3D" component={GhostArmy3D} width={W} height={H} fps={FPS} durationInFrames={DURATION_FRAMES} />
);
