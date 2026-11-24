import React from 'react';
import { Composition } from 'remotion';
import { Trafalgar } from './Documentary';
import { DURATION_FRAMES, FPS, H, W } from './theme';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Trafalgar" component={Trafalgar} width={W} height={H} fps={FPS} durationInFrames={DURATION_FRAMES} />
  </>
);
