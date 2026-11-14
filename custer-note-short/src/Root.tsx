import React from 'react';
import { Composition } from 'remotion';
import { CusterNote } from './Documentary';
import { ThumbShort, ThumbWide } from './Thumbnail';
import { DURATION_FRAMES, FPS, H, W } from './theme';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="CusterNote" component={CusterNote} width={W} height={H} fps={FPS} durationInFrames={DURATION_FRAMES} />
    <Composition id="ThumbWide" component={ThumbWide} width={1280} height={720} fps={30} durationInFrames={1} />
    <Composition id="ThumbShort" component={ThumbShort} width={1080} height={1920} fps={30} durationInFrames={1} />
  </>
);
