import React from 'react';
import { Composition } from 'remotion';
import { ChurchillWanted } from './Documentary';
import { DURATION_FRAMES, FPS, H, W } from './theme';

export const RemotionRoot: React.FC = () => (
  <Composition id="ChurchillWanted" component={ChurchillWanted} width={W} height={H} fps={FPS} durationInFrames={DURATION_FRAMES} />
);
