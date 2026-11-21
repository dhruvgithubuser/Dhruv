import React from 'react';
import { Composition } from 'remotion';
import { Reel } from './Documentary';
import { DURATION_FRAMES, FPS, H, W } from './theme';

export const RemotionRoot: React.FC = () => (
  <Composition id="AI171Reel" component={Reel} width={W} height={H} fps={FPS} durationInFrames={DURATION_FRAMES} />
);
