import React from 'react';
import { Composition } from 'remotion';
import { Washington1814 } from './Documentary';
import { DURATION_FRAMES, FPS, H, W } from './theme';

export const RemotionRoot: React.FC = () => (
  <Composition id="Washington1814" component={Washington1814} width={W} height={H} fps={FPS} durationInFrames={DURATION_FRAMES} />
);
