// Times renderStill for a few frames (perf check).
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
const browserExecutable = process.env.REMOTION_BROWSER;
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const composition = await selectComposition({ serveUrl, id: 'Documentary', browserExecutable });
for (const t of process.argv[2].split(',').map(Number)) {
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, output: `/tmp/claude-0/-home-user-Dhruv/2db9d789-7e7d-57ba-8db7-a840fd04b0dc/scratchpad/t.jpeg`, frame: Math.round(t * 30), imageFormat: 'jpeg', browserExecutable, chromiumOptions: { gl: 'vulkan' } });
  console.log(t, Date.now() - t0, 'ms');
}
