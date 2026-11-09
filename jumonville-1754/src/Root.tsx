import React from 'react';
import { Composition } from 'remotion';
import { Jumonville } from './Documentary';
import { Thumbnail } from './Thumbnail';
import { DURATION_FRAMES, FPS, H, W } from './theme';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Jumonville" component={Jumonville} width={W} height={H} fps={FPS} durationInFrames={DURATION_FRAMES} />
    <Composition id="Thumbnail" component={Thumbnail} width={W} height={H} fps={FPS} durationInFrames={1} />
  </>
);
