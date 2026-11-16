import React from 'react';
import { Composition } from 'remotion';
import { YamamotoQuote } from './Documentary';
import { PosterShort, PosterWide } from './ThumbPoster';
import { DURATION_FRAMES, FPS, H, W } from './theme';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="YamamotoQuote" component={YamamotoQuote} width={W} height={H} fps={FPS} durationInFrames={DURATION_FRAMES} />
    <Composition id="PosterShort" component={PosterShort} width={1080} height={1920} fps={30} durationInFrames={1} />
    <Composition id="PosterWide" component={PosterWide} width={1280} height={720} fps={30} durationInFrames={1} />
  </>
);
