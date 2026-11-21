import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setConcurrency(4);
// SwiftShader is ~8x faster than SwANGLE for this film on a CPU-only machine.
Config.setChromiumOpenGlRenderer('swiftshader');
if (process.env.REMOTION_BROWSER) Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
