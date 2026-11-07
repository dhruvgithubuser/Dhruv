import React from 'react';

/**
 * Lt. Col. Stanislav Petrov, 1983 (age 44) — the ONE character model used in every shot.
 * See assets/characters/petrov-character-reference.md. Same geometry, hair, uniform and palette
 * everywhere; shots only change framing, lighting, eyes (gaze/blink), brow tension and mouth.
 *
 * viewBox 0 0 600 800: head centred at x=300, eyes on y=292, chin y=460, shoulders y≈600.
 */
export type Light = 'neutral' | 'red' | 'radar' | 'warm' | 'dim';
export type PetrovProps = {
  turn?: number;          // -1..1 head turn (negative = toward viewer's left)
  gaze?: { x: number; y: number }; // -1..1 eye direction
  blink?: number;         // 0 open .. 1 closed
  brow?: number;          // 0 calm .. 1 furrowed
  mouth?: number;         // 0 closed .. 1 slightly open (speaking)
  light?: Light;
  lightAmt?: number;      // strength of the coloured key light 0..1
  silhouette?: boolean;   // black figure with a rim light (final scene)
  rim?: string;           // rim light colour
  handset?: number;       // 0..1 telephone handset raised to the ear
  id?: string;            // unique gradient prefix when several copies are on screen
};

const SKIN = { hi: '#e2b394', mid: '#c08a6a', lo: '#7d5038', deep: '#4a2c1e' };
const HAIR = { base: '#1c1714', hi: '#4a3d33', strand: '#2f2621' };
const UNI = { base: '#4b5337', hi: '#6c7552', lo: '#2b3120', deep: '#1a1e13' };

const LIGHTS: Record<Light, { key: string; fill: string; rim: string }> = {
  neutral: { key: '#fff1dc', fill: '#2a3640', rim: '#cfe0e8' },
  red: { key: '#ff4a32', fill: '#3a0a06', rim: '#ff6a4a' },
  radar: { key: '#9dffb0', fill: '#0c2614', rim: '#8ff07a' },
  warm: { key: '#ffc77a', fill: '#3a2414', rim: '#ffd59a' },
  dim: { key: '#b8c4cc', fill: '#0d1114', rim: '#7d8c96' },
};

export const Petrov: React.FC<PetrovProps> = ({
  turn = 0, gaze = { x: 0, y: 0 }, blink = 0, brow = 0.3, mouth = 0, light = 'neutral', lightAmt = 0.6,
  silhouette = false, rim, handset = 0, id = 'p',
}) => {
  const L = LIGHTS[light];
  const rimC = rim ?? L.rim;
  const tx = turn * 16;               // features slide with the turn
  const near = 1 + turn * 0.06, far = 1 - turn * 0.06;
  const g = (s: string) => `${id}-${s}`;
  const eyeOpen = Math.max(0.06, 1 - blink);
  const bf = brow * 7;                // inner brow drop

  if (silhouette) {
    return (
      <svg viewBox="0 0 600 800" width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          <filter id={g('rimblur')} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>
        <g filter={`url(#${g('rimblur')})`}>
          <path d={HEAD} fill="none" stroke={rimC} strokeWidth="22" />
          <path d={HAIR_SHAPE} fill="none" stroke={rimC} strokeWidth="22" />
          <path d={BODY} fill="none" stroke={rimC} strokeWidth="24" />
        </g>
        <path d={HAIR_SHAPE} fill="none" stroke={rimC} strokeWidth="5" opacity="0.9" />
        <path d={BODY} fill="none" stroke={rimC} strokeWidth="5" opacity="0.8" />
        <path d={BODY} fill="#050505" />
        <path d={NECK} fill="#050505" />
        <path d={HEAD} fill="#050505" />
        <path d={HAIR_SHAPE} fill="#050505" />
        <ellipse cx="196" cy="305" rx="15" ry="30" fill="#050505" />
        <ellipse cx="404" cy="305" rx="15" ry="30" fill="#050505" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 600 800" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={g('skin')} cx="0.38" cy="0.4" r="0.75">
          <stop offset="0" stopColor={SKIN.hi} />
          <stop offset="0.45" stopColor={SKIN.mid} />
          <stop offset="1" stopColor={SKIN.lo} />
        </radialGradient>
        <linearGradient id={g('shadeR')} x1="0" x2="1">
          <stop offset="0.45" stopColor={SKIN.deep} stopOpacity="0" />
          <stop offset="1" stopColor={SKIN.deep} stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id={g('uni')} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={UNI.hi} />
          <stop offset="0.5" stopColor={UNI.base} />
          <stop offset="1" stopColor={UNI.deep} />
        </linearGradient>
        <linearGradient id={g('hair')} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor={HAIR.hi} />
          <stop offset="0.35" stopColor={HAIR.base} />
          <stop offset="1" stopColor="#0e0b09" />
        </linearGradient>
        <radialGradient id={g('key')} cx="0.3" cy="0.3" r="0.8">
          <stop offset="0" stopColor={L.key} stopOpacity={0.55 * lightAmt} />
          <stop offset="1" stopColor={L.key} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={g('fill')} x1="0" x2="1">
          <stop offset="0.4" stopColor={L.fill} stopOpacity="0" />
          <stop offset="1" stopColor={L.fill} stopOpacity={0.75 * lightAmt + 0.15} />
        </linearGradient>
        <filter id={g('paint')} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={g('soft')}><feGaussianBlur stdDeviation="4" /></filter>
        <filter id={g('soft2')}><feGaussianBlur stdDeviation="9" /></filter>
        <clipPath id={g('faceclip')}><path d={HEAD} /></clipPath>
        <clipPath id={g('bodyclip')}><path d={BODY} /></clipPath>
      </defs>

      <g filter={`url(#${g('paint')})`}>
        {/* ---------- neck (under the collar) */}
        <path d={NECK} fill={SKIN.mid} />
        <path d="M244,440 C256,486 278,508 300,512 C322,508 344,486 356,440 L362,500 C346,526 322,538 300,540 C278,538 254,526 238,500 Z" fill={SKIN.deep} opacity="0.55" />
        {/* ---------- uniform */}
        <path d={BODY} fill={`url(#${g('uni')})`} />
        <g clipPath={`url(#${g('bodyclip')})`}>
          {/* shirt + tie in the V of the jacket */}
          <path d="M226,512 L300,700 L374,512 L356,500 L300,556 L244,500 Z" fill="#e9e4da" />
          <path d="M232,506 C256,530 280,546 300,552 C320,546 344,530 368,506 L374,520 C350,546 324,562 300,566 C276,562 250,546 226,520 Z" fill="#f2eee6" />
          <path d="M252,505 L300,560 L300,592 L240,522 Z" fill="#cfc8bb" />
          <path d="M348,505 L300,560 L300,592 L360,522 Z" fill="#d9d3c7" />
          <path d="M288,560 L312,560 L318,584 L300,596 L282,584 Z" fill="#1b1d22" />
          <path d="M284,594 L316,594 L326,760 L300,800 L274,760 Z" fill="#202329" />
          <path d="M300,596 L304,780" stroke="#3a3e46" strokeWidth="3" opacity="0.6" />
          {/* lapels */}
          <path d="M228,512 L300,720 L262,800 L170,800 L196,610 L160,560 Z" fill={UNI.lo} />
          <path d="M372,512 L300,720 L338,800 L430,800 L404,610 L440,560 Z" fill={UNI.base} />
          <path d="M228,512 L300,720" stroke={UNI.hi} strokeWidth="4" opacity="0.7" />
          <path d="M372,512 L300,720" stroke={UNI.deep} strokeWidth="4" opacity="0.7" />
          {/* collar tabs with PVO emblem */}
          <path d="M214,560 L246,548 L258,590 L222,604 Z" fill="#26291d" />
          <path d="M386,560 L354,548 L342,590 L378,604 Z" fill="#26291d" />
          <circle cx="236" cy="576" r="7" fill="#c9a25a" />
          <circle cx="364" cy="576" r="7" fill="#c9a25a" />
          {/* shoulder boards: lieutenant colonel, two stripes + two stars */}
          <g transform="translate(22,-14) rotate(-24 130 618) scale(0.9)">
            <rect x="74" y="600" width="120" height="34" rx="6" fill="#8a7a44" />
            <rect x="74" y="610" width="120" height="4" fill="#3b2f16" />
            <rect x="74" y="621" width="120" height="4" fill="#3b2f16" />
            <circle cx="112" cy="617" r="5" fill="#f1d27c" /><circle cx="150" cy="617" r="5" fill="#f1d27c" />
          </g>
          <g transform="translate(-22,-14) rotate(24 470 618) scale(0.9)">
            <rect x="406" y="600" width="120" height="34" rx="6" fill="#7d6e3c" />
            <rect x="406" y="610" width="120" height="4" fill="#3b2f16" />
            <rect x="406" y="621" width="120" height="4" fill="#3b2f16" />
            <circle cx="450" cy="617" r="5" fill="#f1d27c" /><circle cx="488" cy="617" r="5" fill="#f1d27c" />
          </g>
          {/* ribbon bar + buttons */}
          <g transform="translate(370,700)">
            {['#a8322a', '#2f5d8a', '#c9a25a', '#3d7a3a', '#a8322a', '#e6e0d0'].map((c, i) => (
              <rect key={i} x={(i % 3) * 26} y={Math.floor(i / 3) * 12} width="24" height="10" fill={c} opacity="0.9" />
            ))}
          </g>
          <circle cx="300" cy="740" r="8" fill="#b8954f" />
          {/* folds + light */}
          <path d="M120,700 Q160,660 200,690" stroke={UNI.deep} strokeWidth="6" fill="none" opacity="0.5" />
          <path d="M480,700 Q440,660 400,690" stroke={UNI.deep} strokeWidth="6" fill="none" opacity="0.5" />
          <rect x="0" y="480" width="600" height="320" fill={`url(#${g('key')})`} />
          <rect x="0" y="480" width="600" height="320" fill={`url(#${g('fill')})`} />
        </g>


        {/* ---------- ears */}
        <ellipse cx={196 + tx * 0.6} cy="305" rx={15 * far} ry="30" fill={SKIN.mid} />
        <ellipse cx={404 + tx * 0.6} cy="305" rx={15 * near} ry="30" fill={SKIN.lo} />
        <path d={`M${190 + tx * 0.6},292 q8,10 0,26`} stroke={SKIN.deep} strokeWidth="3" fill="none" opacity="0.6" />

        {/* ---------- head */}
        <path d={HEAD} fill={`url(#${g('skin')})`} />
        <g clipPath={`url(#${g('faceclip')})`}>
          <rect x="190" y="140" width="230" height="330" fill={`url(#${g('shadeR')})`} transform={`translate(${tx * 0.8},0)`} />
          {/* cheekbones, jaw, temple shading */}
          <path d={`M${222 + tx},330 C${240 + tx},352 ${262 + tx},360 ${276 + tx},356`} stroke={SKIN.lo} strokeWidth="10" fill="none" opacity="0.35" filter={`url(#${g('soft')})`} />
          <path d={`M${378 + tx},330 C${360 + tx},352 ${338 + tx},360 ${324 + tx},356`} stroke={SKIN.deep} strokeWidth="12" fill="none" opacity="0.45" filter={`url(#${g('soft')})`} />
          <path d="M214,392 C236,440 268,458 300,460 C332,458 364,440 386,392" stroke={SKIN.deep} strokeWidth="14" fill="none" opacity="0.35" filter={`url(#${g('soft2')})`} />
          <path d="M214,330 C222,372 238,398 262,410" stroke={SKIN.hi} strokeWidth="14" fill="none" opacity="0.22" filter={`url(#${g('soft2')})`} />
          <path d="M386,320 C380,370 364,398 340,412" stroke={SKIN.deep} strokeWidth="18" fill="none" opacity="0.4" filter={`url(#${g('soft2')})`} />
          {/* clean-shaven jaw: faint cool tint */}
          <path d="M232,400 C250,440 276,456 300,458 C324,456 350,440 368,400 C350,420 326,432 300,434 C274,432 250,420 232,400 Z" fill="#5c6a74" opacity="0.12" />
          {/* key + fill light on the face */}
          <rect x="180" y="130" width="250" height="340" fill={`url(#${g('key')})`} />
          <rect x="180" y="130" width="250" height="340" fill={`url(#${g('fill')})`} />
        </g>

        {/* ---------- eyes */}
        <g transform={`translate(${tx},0)`}>
          {/* brow ridge and sockets */}
          <path d="M218,272 Q256,256 290,270 L290,286 Q256,272 222,288 Z" fill={SKIN.deep} opacity="0.32" filter={`url(#${g('soft')})`} />
          <path d="M382,272 Q344,256 310,270 L310,286 Q344,272 378,288 Z" fill={SKIN.deep} opacity="0.42" filter={`url(#${g('soft')})`} />
          <path d="M228,250 Q256,238 288,248" stroke={SKIN.hi} strokeWidth="6" fill="none" opacity="0.35" filter={`url(#${g('soft')})`} />
          {/* sockets / under-eye (long night shift) */}
          <ellipse cx="256" cy="292" rx="34" ry="20" fill={SKIN.lo} opacity="0.45" filter={`url(#${g('soft')})`} />
          <ellipse cx="344" cy="292" rx="34" ry="20" fill={SKIN.deep} opacity="0.5" filter={`url(#${g('soft')})`} />
          <path d="M232,310 Q256,322 280,310" stroke={SKIN.deep} strokeWidth="3" fill="none" opacity="0.35" />
          <path d="M320,310 Q344,322 368,310" stroke={SKIN.deep} strokeWidth="3" fill="none" opacity="0.4" />
          {[{ cx: 256, s: far }, { cx: 344, s: near }].map(({ cx, s }, i) => (
            <g key={i} transform={`translate(${cx},292) scale(${s},${eyeOpen}) translate(${-cx},-292)`}>
              <path d={`M${cx - 23},292 Q${cx},279 ${cx + 23},292 Q${cx},302 ${cx - 23},292 Z`} fill="#e8ddd0" />
              <clipPath id={g(`eye${i}`)}><path d={`M${cx - 23},292 Q${cx},279 ${cx + 23},292 Q${cx},302 ${cx - 23},292 Z`} /></clipPath>
              <g clipPath={`url(#${g(`eye${i}`)})`}>
                <circle cx={cx + gaze.x * 8} cy={292 + gaze.y * 4} r="9" fill="#4a3324" />
                <circle cx={cx + gaze.x * 8} cy={292 + gaze.y * 4} r="4.2" fill="#0d0907" />
                <circle cx={cx + gaze.x * 8 - 3} cy={292 + gaze.y * 4 - 3} r="2" fill="#fff" opacity="0.8" />
                <rect x={cx - 25} y="276" width="50" height="9" fill="#000" opacity="0.25" />
              </g>
              <path d={`M${cx - 25},293 Q${cx},277 ${cx + 25},293`} stroke="#1a110c" strokeWidth="4.5" fill="none" strokeLinecap="round" />
              <path d={`M${cx - 20},281 Q${cx},272 ${cx + 22},283`} stroke={SKIN.deep} strokeWidth="2.5" fill="none" opacity="0.6" />
            </g>
          ))}
          {blink > 0.5 && (
            <>
              <path d="M233,292 Q256,300 279,292" stroke="#1a110c" strokeWidth="4" fill="none" />
              <path d="M321,292 Q344,300 367,292" stroke="#1a110c" strokeWidth="4" fill="none" />
            </>
          )}
          {/* brows: thick, straight, serious */}
          <path d={`M224,${266} Q250,${252} ${284},${258 + bf} L${284},${266 + bf} Q252,${262} 226,${272} Z`} fill={HAIR.base} />
          <path d={`M376,${266} Q350,${252} ${316},${258 + bf} L${316},${266 + bf} Q348,${262} 374,${272} Z`} fill={HAIR.base} />
          {brow > 0.5 && <path d="M292,268 L294,286 M308,268 L306,286" stroke={SKIN.deep} strokeWidth="2.5" opacity={(brow - 0.5) * 1.4} />}
        </g>

        {/* ---------- nose */}
        <g transform={`translate(${tx * 1.25},0)`}>
          <path d="M306,300 C312,330 318,352 322,368" stroke={SKIN.deep} strokeWidth="8" fill="none" opacity="0.35" filter={`url(#${g('soft')})`} />
          <path d="M282,362 C284,378 296,386 300,386 C306,386 318,378 320,362 C316,372 308,374 300,374 C292,374 286,372 282,362 Z" fill={SKIN.lo} opacity="0.7" />
          <ellipse cx="289" cy="378" rx="6" ry="3.5" fill="#3a2016" />
          <ellipse cx="312" cy="378" rx="6" ry="3.5" fill="#3a2016" />
          <path d="M296,292 C294,326 292,348 290,362" stroke={SKIN.hi} strokeWidth="7" fill="none" opacity="0.45" filter={`url(#${g('soft')})`} />
          <path d="M300,288 C300,300 304,316 308,330" stroke={SKIN.deep} strokeWidth="3" fill="none" opacity="0.35" />
        </g>

        {/* ---------- mouth: firm, slightly downturned */}
        <g transform={`translate(${tx * 1.1},0)`}>
          <path d="M262,374 C266,392 270,402 274,410" stroke={SKIN.deep} strokeWidth="3" fill="none" opacity="0.35" />
          <path d="M338,374 C334,392 330,402 326,410" stroke={SKIN.deep} strokeWidth="3" fill="none" opacity="0.4" />
          <path d={`M270,414 Q300,${406} 330,414 Q300,${418 + mouth * 10} 270,414 Z`} fill="#3d1d16" />
          <path d="M268,415 Q300,407 332,415" stroke="#5a2a20" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d={`M276,${420 + mouth * 8} Q300,${430 + mouth * 8} 324,${420 + mouth * 8}`} stroke={SKIN.lo} strokeWidth="6" fill="none" opacity="0.55" />
          <path d="M288,440 Q300,446 312,440" stroke={SKIN.deep} strokeWidth="5" fill="none" opacity="0.25" />
        </g>

        {/* ---------- hair: short, dark, combed back with a side part */}
        <path d={HAIR_SHAPE} fill={`url(#${g('hair')})`} />
        <clipPath id={g('hairclip')}><path d={HAIR_SHAPE} /></clipPath>
        <g clipPath={`url(#${g('hairclip')})`}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <path key={i} d={`M${214 + i * 22},${210 - (i < 3 ? 0 : 6)} C${226 + i * 22},164 ${258 + i * 18},132 ${304 + i * 12},${120 + i * 2}`} stroke={i % 2 ? HAIR.hi : HAIR.strand} strokeWidth={i % 3 ? 3 : 5} fill="none" opacity="0.5" />
        ))}
        <path d="M252,198 C256,170 268,144 290,124" stroke="#0b0907" strokeWidth="3.5" fill="none" opacity="0.85" />
        <path d="M262,196 C290,150 340,128 392,150" stroke={HAIR.hi} strokeWidth="8" fill="none" opacity="0.35" filter={`url(#${g('soft')})`} />
        </g>
        <path d="M196,262 C192,238 196,220 204,210" stroke={HAIR.base} strokeWidth="9" fill="none" />
        <path d="M404,262 C408,238 404,220 396,210" stroke={HAIR.base} strokeWidth="9" fill="none" />

        {/* ---------- rim light */}
        <g clipPath={`url(#${g('faceclip')})`} opacity={0.5 * lightAmt + 0.1}>
          <path d="M404,200 C420,260 416,350 392,410" stroke={rimC} strokeWidth="10" fill="none" filter={`url(#${g('soft')})`} />
        </g>
      </g>

      {/* ---------- telephone handset at the ear */}
      {handset > 0.01 && (
        <g transform={`translate(${lerpN(560, 420, handset)},${lerpN(820, 300, handset)}) rotate(${lerpN(40, -12, handset)})`}>
          <path d="M-30,-120 C-60,-100 -62,-40 -46,0 C-40,40 -40,90 -20,130 L20,128 C10,90 8,40 14,0 C28,-40 26,-100 -2,-122 Z" fill="#8f1a14" />
          <ellipse cx="-14" cy="-118" rx="34" ry="22" fill="#a3221a" />
          <ellipse cx="0" cy="128" rx="34" ry="22" fill="#7a1410" />
          <path d="M-36,-110 C-50,-80 -50,-30 -38,0" stroke="#d4574a" strokeWidth="5" fill="none" opacity="0.6" />
          {/* hand */}
          <path d="M-40,-10 C-70,10 -72,70 -46,96 C-20,110 30,104 40,70 C48,40 36,-10 10,-20 Z" fill={SKIN.mid} />
          <path d="M-42,20 C-20,26 10,24 34,14 M-44,46 C-20,52 12,50 38,40 M-40,72 C-16,76 14,74 36,64" stroke={SKIN.deep} strokeWidth="3" fill="none" opacity="0.5" />
          <path d="M-46,96 C-30,140 0,170 30,180 L80,200 L90,120 C60,110 40,90 40,70" fill={UNI.base} />
        </g>
      )}
    </svg>
  );
};

const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;

// Shared geometry (keep identical across every view)
const HEAD = 'M300,150 C374,150 414,200 414,280 C414,334 410,372 398,404 C382,440 346,466 300,468 C254,466 218,440 202,404 C190,372 186,334 186,280 C186,200 226,150 300,150 Z';
const NECK = 'M230,420 C232,470 230,500 220,540 L380,540 C370,500 368,470 370,420 Z';
const BODY = 'M246,500 C210,520 150,540 100,566 C56,590 34,640 24,720 L14,800 L586,800 L576,720 C566,640 544,590 500,566 C450,540 390,520 354,500 C340,530 320,548 300,552 C280,548 260,530 246,500 Z';
const HAIR_SHAPE = 'M184,268 C176,186 222,118 304,112 C384,108 426,170 416,268 C412,236 404,214 392,202 C366,188 336,190 312,196 C290,201 270,194 250,198 C226,204 206,214 196,232 C190,244 186,256 184,268 Z';
