import React from 'react';
import { Composition } from 'remotion';
import { Isandlwana } from './Documentary';
import { DURATION_FRAMES, FPS, H, W } from './theme';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Isandlwana" component={Isandlwana} width={W} height={H} fps={FPS} durationInFrames={DURATION_FRAMES} />
  </>
);
