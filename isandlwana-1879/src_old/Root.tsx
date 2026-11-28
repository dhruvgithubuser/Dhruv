import React from 'react';
import { Composition } from 'remotion';
import { CusterTrial } from './Documentary';
import { ThumbA, ThumbB } from './Thumbnail';
import { DURATION_FRAMES, FPS, H, W } from './theme';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="CusterTrial" component={CusterTrial} width={W} height={H} fps={FPS} durationInFrames={DURATION_FRAMES} />
    <Composition id="ThumbA" component={ThumbA} width={1280} height={720} fps={30} durationInFrames={1} />
    <Composition id="ThumbB" component={ThumbB} width={1280} height={720} fps={30} durationInFrames={1} />
  </>
);
