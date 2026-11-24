import React from 'react';
import { Composition } from 'remotion';
import { MontyDouble } from './Documentary';
import { DURATION_FRAMES, FPS, H, W } from './theme';

export const RemotionRoot: React.FC = () => (
  <Composition id="MontyDouble" component={MontyDouble} width={W} height={H} fps={FPS} durationInFrames={DURATION_FRAMES} />
);
