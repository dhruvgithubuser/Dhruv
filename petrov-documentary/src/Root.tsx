import React from 'react';
import { Composition, Still } from 'remotion';
import { Documentary } from './Documentary';
import { DURATION_FRAMES, FPS, H, W } from './theme';
import { Thumbnail } from './Thumbnail';
import { ThumbnailPainted } from './ThumbnailPainted';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Documentary" component={Documentary} width={W} height={H} fps={FPS} durationInFrames={DURATION_FRAMES} />
    <Still id="Thumbnail" component={Thumbnail} width={W} height={H} />
    <Still id="ThumbnailPainted" component={ThumbnailPainted} width={W} height={H} />
  </>
);
