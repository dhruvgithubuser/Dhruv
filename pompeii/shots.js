// shots.js: THE SHOT LIST, as code. Every shot is anchored to a narration line in timeline.json,
// so picture, subtitles and sound share one clock. docs/E_storyboard.md is generated from this file
// (tools/export_shots.mjs), and audio/sound.py reads the exported cue sheet for SFX + ambience.
//
// A shot: { id, at, set, tag, tin: [transition, seconds], draw(ctx, lt, d, t, IMG, W, H), sfx, amb, desc, cam }
//   lt = seconds into the shot, d = shot length, t = film time.  tag = the honesty label in the corner.
import { E, kf, shake } from './lib/motion.js';
import { look, clamp, smooth, lerp, h01, css } from './lib/util.js';
import { drawStreet } from './sets/street.js';
import { drawAerial } from './sets/aerial.js';
import { drawForum } from './sets/forum.js';
import { drawAtrium } from './sets/atrium.js';
import { drawMap } from './sets/map.js';
import { cutaway, pdcSide, lavaVsPdc, strata, plan, timeline, calendar } from './sets/diagrams.js';
import { bay, slopes, archival, finds, endCard } from './sets/views.js';
import { CHAR, crowdSpec, digger } from './lib/figures.js';
import { callout, stamp, lowerThird, capsText, goldText, F, GOLD, CREAM, RED } from './lib/gfx.js';

const ease = E.inOutSine;
const K = (lt, keys) => kf(lt, keys, ease);
const REC = 'ARTISTIC RECONSTRUCTION', FIC = 'FICTIONAL FAMILY · RECONSTRUCTION', MAP = 'MAP · APPROXIMATE AD 79 COASTLINE', SCI = 'SCIENTIFIC ILLUSTRATION · SIMPLIFIED', EVI = 'ARCHAEOLOGICAL EVIDENCE · ILLUSTRATED';
const CURB = 0.32;
// the family, placed in street space
const fam = (x, z, o = {}) => [
  { spec: CHAR.marcus, x: x + 0.5, z: z + 0.2, ...o, ...(o.marcus || {}) },
  { spec: CHAR.livia, x: x - 0.1, z: z, ...o, ...(o.livia || {}) },
  { spec: CHAR.julia, x: x - 0.55, z: z - 0.25, ...o, ...(o.julia || {}) },
  { spec: CHAR.gaius, x: x + 1.2, z: z + 0.9, ...o, ...(o.gaius || {}) },
];
const toyHorse = (ctx, x, y, s) => { ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#7a4a28'; ctx.fillRect(-s * 0.5, -s * 0.55, s, s * 0.3); ctx.fillRect(-s * 0.45, -s * 0.28, s * 0.12, s * 0.28); ctx.fillRect(s * 0.33, -s * 0.28, s * 0.12, s * 0.28); ctx.beginPath(); ctx.moveTo(s * 0.4, -s * 0.5); ctx.lineTo(s * 0.62, -s * 0.95); ctx.lineTo(s * 0.8, -s * 0.85); ctx.lineTo(s * 0.55, -s * 0.45); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 2, s * 0.6, s * 0.08, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); };

export function buildShots(TL) {
  const S = {}; TL.scenes.forEach((s) => (S[s.id] = s));
  const T = (sc, line = -1, off = 0) => (line < 0 ? S[sc].start : S[sc].lines[line].start) + off;
  const sh = [];
  const add = (o) => sh.push(o);

  // ================================================================ S01 THE FINAL MORNING
  add({ id: '1A', at: 0, set: 'aerial', tag: REC, tin: ['cut', 0], amb: 'dawn', desc: 'Establishing aerial at dawn: the walled town on the plain, Vesuvius (a single green cone) beyond, mist over the vineyards. Slow descending push.',
    sfx: [[0, 'swell', 0.5]],
    draw: (ctx, lt, d, t, IMG, W, H) => drawAerial(ctx, W, H, t, { cam: { pos: K(lt, [[0, [2200, 1500, -6200]], [d, [900, 760, -2700]]]), yaw: -0.2, pitch: K(lt, [[0, -0.17], [d, -0.22]]), fov: 42 }, lk: look('dawn', 'golden', lt / d * 0.5) }) });
  add({ id: '1B', at: T('S01', 0, 5.0), set: 'street', tag: REC, tin: ['dissolve', 1.2], amb: 'street_morning', desc: 'Street level, morning: a slow dolly down a paved street as shops open; crowd, fountain, the arch and Vesuvius closing the view.',
    draw: (ctx, lt, d, t, IMG, W, H) => drawStreet(ctx, W, H, t, { cam: { pos: [K(lt, [[0, -0.6], [d, 0.2]]), 1.65, K(lt, [[0, -3], [d, 3.5]])], yaw: K(lt, [[0, -0.05], [d, 0.03]]), pitch: 0.04, fov: 54 }, lk: look('golden'), crowd: 0.55, dust: 0.4, shutters: 0 }) });
  add({ id: '1C', at: T('S01', 2), set: 'aerial', tag: REC, tin: ['dissolve', 1.0], amb: 'dawn', desc: 'Title: low golden aerial gliding over the town toward the mountain. POMPEII title card + lower third (Campania, Roman Italy, AD 79).',
    title: [0.4, 6.4], lower: [0.5, 6.6, 'CAMPANIA · ROMAN ITALY', 'AD 79 · REIGN OF TITUS'],
    sfx: [[0.2, 'swell', 0.6], [1.6, 'boom', 0.35]],
    draw: (ctx, lt, d, t, IMG, W, H) => drawAerial(ctx, W, H, t, { cam: { pos: K(lt, [[0, [500, 520, -1900]], [d, [250, 360, -1150]]]), yaw: -0.24, pitch: -0.2, fov: 44 }, lk: look('golden') }) });
  add({ id: '1D', at: T('S01', 3), set: 'street', tag: FIC, tin: ['dissolve', 0.8], amb: 'street_morning', desc: 'Marcus slides the shutters off his food counter; Livia and Julia pass with a basket; old Gaius greets them from across the street.',
    sfx: [[0.6, 'wood', 0.5], [1.6, 'wood', 0.4], [2.6, 'wood', 0.4]],
    draw: (ctx, lt, d, t, IMG, W, H) => drawStreet(ctx, W, H, t, { cam: { pos: [K(lt, [[0, -0.7], [d, -0.3]]), 1.55, K(lt, [[0, 6.4], [d, 7.6]])], yaw: K(lt, [[0, 0.18], [d, 0.12]]), pitch: 0.02, fov: 46 }, lk: look('golden'), crowd: 0.35, dust: 0.5, shutters: smooth(0.5, 3.5, lt),
      people: [{ spec: CHAR.marcus, x: 2.55, z: 13.2, y: CURB, view: '3q', face: -1, armUp: [0, 0.5 * Math.abs(Math.sin(lt * 1.6))] }, { spec: CHAR.livia, x: K(lt, [[0, -0.6], [d, 0.6]]), z: K(lt, [[0, 16], [d, 12.2]]), view: '3q', face: -1, walk: 1, phase: lt * 0.9 }, { spec: CHAR.julia, x: K(lt, [[0, -1.1], [d, 0.1]]), z: K(lt, [[0, 15.6], [d, 11.8]]), view: '3q', face: -1, walk: 1, phase: lt * 1.1 }, { spec: CHAR.gaius, x: -2.6, z: 14.5, y: CURB, view: '3q', face: 1, armUp: [0, smooth(2, 3, lt) * 0.6] }] }) });
  add({ id: '1E', at: T('S01', 4), set: 'street', tag: REC, tin: ['dissolve', 0.8], amb: 'street_morning', desc: 'Tilt up from the street to Vesuvius above the arch; music turns minor.',
    sfx: [[0.2, 'rumble', 0.25]],
    draw: (ctx, lt, d, t, IMG, W, H) => drawStreet(ctx, W, H, t, { cam: { pos: [0, 1.6, K(lt, [[0, 20], [d, 24]])], yaw: 0, pitch: K(lt, [[0, -0.02], [d, 0.16]]), fov: K(lt, [[0, 50], [d, 30]]) }, lk: look('golden', 'storm', smooth(2, d, lt) * 0.35), crowd: 0.4 }) });

  // ================================================================ S02 A CITY AT THE HEIGHT OF ROMAN LIFE
  add({ id: '2A', at: T('S02'), set: 'map', tag: MAP, tin: ['dissolve', 1.0], amb: 'map', desc: 'Map: the Mediterranean, then Italy and Campania; Rome and Pompeii labelled; sea routes from Puteoli to Ostia, Alexandria and Carthage draw on.',
    sfx: [[0.4, 'paper', 0.6], [3.2, 'tick', 0.4], [5.2, 'tick', 0.4], [6.6, 'whoosh', 0.3], [8.2, 'tick', 0.4]],
    draw: (ctx, lt, d, t, IMG, W, H) => { const z = K(lt, [[0, 95], [4.5, 140], [8.5, 260], [d, 300]]), c = [K(lt, [[0, 16], [4.5, 14.6], [8.5, 14.3], [d, 14.35]]), K(lt, [[0, 39], [4.5, 40.7], [8.5, 40.8], [d, 40.8]])];
      drawMap(ctx, W, H, t, { view: { c, z }, labels: [['Roma', smooth(1.2, 2, lt), { size: 34 }], ['Pompeii', smooth(2.2, 3, lt), { size: 40, color: '#7a2a14', sub: 'Campania' }], ['Alexandria', smooth(3, 3.6, lt) * (1 - smooth(6, 7, lt))], ['Carthago', smooth(3.2, 3.8, lt) * (1 - smooth(6, 7, lt))], ['Neapolis', smooth(8, 9, lt), { size: 26 }], ['Vesuvius', smooth(8.4, 9.4, lt), { size: 28, dx: -20, dy: -30, align: 'right', noDot: true }]],
        routes: [['Puteoli', 'Ostia', smooth(2.5, 4.5, lt)], ['Puteoli', 'Alexandria', smooth(3, 5.5, lt)], ['Puteoli', 'Carthago', smooth(3.2, 5.5, lt)], ['Puteoli', 'Massalia', smooth(3.5, 6, lt)]], scale: z > 200 ? 20 : 200 }, F); } });
  add({ id: '2B', at: T('S02', 2), set: 'street', tag: REC, tin: ['whip', 0.5], amb: 'market', desc: 'Lateral tracking shot past shopfronts; labels: TABERNA (shop), THERMOPOLIUM (hot-food counter), FOUNTAIN.',
    sfx: [[0, 'whoosh', 0.4], [1.0, 'tick', 0.35], [2.2, 'tick', 0.35], [3.4, 'tick', 0.35]],
    draw: (ctx, lt, d, t, IMG, W, H) => { const st = { cam: { pos: [-1.2, 1.7, K(lt, [[0, 6], [d, 12.5]])], yaw: 0.85, pitch: -0.02, fov: 52 }, lk: look('noon'), crowd: 0.6, crowdT: t, shutters: 1 }; drawStreet(ctx, W, H, t, st);
      callout(ctx, W * 0.36, H * 0.52, W * 0.2, H * 0.22, 'TABERNA', 'a shop open to the street', smooth(0.6, 1.8, lt) * (1 - smooth(4.6, 5.2, lt))); callout(ctx, W * 0.72, H * 0.6, W * 0.62, H * 0.2, 'THERMOPOLIUM', 'a counter selling hot food', smooth(2, 3.2, lt) * (1 - smooth(4.6, 5.2, lt))); } });
  add({ id: '2C', at: T('S02', 3), set: 'atrium', tag: REC, tin: ['dissolve', 0.9], amb: 'room', desc: 'Inside a wealthy house: the atrium with its impluvium and painted red panels; the camera glides toward the garden as the family crosses.',
    draw: (ctx, lt, d, t, IMG, W, H) => { drawAtrium(ctx, W, H, t, { cam: { pos: [K(lt, [[0, 0.8], [d, -0.4]]), 1.6, K(lt, [[0, -1.4], [d, 3.0]])], yaw: K(lt, [[0, -0.12], [d, 0.08]]), pitch: 0.1, fov: 60 }, lk: look('noon'),
      people: [{ spec: CHAR.livia, x: -2.8, z: K(lt, [[0, 11], [d, 9]]), view: '3q', face: 1, walk: 1, phase: lt * 0.8 }, { spec: CHAR.julia, x: K(lt, [[0, 2.6], [d, 1.4]]), z: 4.4, view: 'side', face: -1, crouch: 0.6, armUp: [0.3, 0.2] }] });
      callout(ctx, W * 0.5, H * 0.67, W * 0.62, H * 0.82, 'IMPLUVIUM', 'rainwater basin under the roof opening', smooth(2.6, 3.8, lt) * (1 - smooth(7.4, 8, lt))); } });
  add({ id: '2D', at: T('S02', 4), set: 'forum', tag: REC, tin: ['dissolve', 0.8], amb: 'forum', desc: 'The Forum: crowds before the Temple of Jupiter, Vesuvius rising behind it. Slow push.',
    draw: (ctx, lt, d, t, IMG, W, H) => drawForum(ctx, W, H, t, { cam: { pos: [K(lt, [[0, 3], [d, 1]]), 2.2, K(lt, [[0, -6], [d, 6]])], yaw: -0.03, pitch: 0.06, fov: 52 }, lk: look('golden'), crowd: 0.9 }) });
  add({ id: '2E', at: T('S02', 5), set: 'slopes', tag: REC, tin: ['dissolve', 1.0], amb: 'country', desc: 'The vineyards on the slopes of Vesuvius: workers among the vines, cypresses, the mountain filling the frame. A low rumble under the music.',
    sfx: [[4.8, 'rumble', 0.3]],
    draw: (ctx, lt, d, t, IMG, W, H) => slopes(ctx, W, H, t, { lk: look('golden', 'sunset', smooth(4, d, lt) * 0.6), push: lt / d, rumble: smooth(4.8, d, lt) }) });

  // ================================================================ S03 THE MOUNTAIN ABOVE THE CITY
  add({ id: '3A', at: T('S03'), set: 'aerial', tag: REC, tin: ['dissolve', 1.0], amb: 'wind', desc: 'Brooding aerial close on the cone, low cloud; the mountain as character.',
    draw: (ctx, lt, d, t, IMG, W, H) => drawAerial(ctx, W, H, t, { cam: { pos: K(lt, [[0, [-300, 600, 1200]], [d, [-500, 700, 2200]]]), yaw: -0.15, pitch: 0.02, fov: 40 }, lk: look('storm', 'golden', 0.3), smoke: 0.2 }) });
  add({ id: '3B', at: T('S03', 1), set: 'forum', tag: REC, tin: ['cut', 0], amb: 'quake', desc: 'Earthquake c. AD 62: the Forum shakes, columns tilt, dust pours from the cornices. Date stamp.',
    stamp: [0.2, 4.2, 'c. AD 62', 'A MAJOR EARTHQUAKE STRIKES CAMPANIA'], sfx: [[0, 'quake', 0.9], [0.1, 'impact', 0.6], [3.2, 'crack', 0.5], [5.5, 'crack', 0.4]],
    draw: (ctx, lt, d, t, IMG, W, H) => { ctx.save(); shake(ctx, lt, 0, 22 * (1 - smooth(4, d, lt)), 4, 3.5); drawForum(ctx, W, H, t, { cam: { pos: [2, 1.8, 18], yaw: -0.05, pitch: 0.12, fov: 56 }, lk: look('golden', 'storm', 0.4), crowd: 0.5, crowdT: 10 + lt * 2.2, dmg: smooth(0, 3, lt), dust: smooth(0.5, 2, lt) }); ctx.restore(); } });
  add({ id: '3C', at: T('S03', 2), set: 'forum', tag: REC, tin: ['dissolve', 0.7], amb: 'forum_work', desc: 'Years later: scaffolding around the temple and colonnades. Repairs were still under way in AD 79.',
    sfx: [[0.4, 'pick', 0.4], [1.1, 'pick', 0.4], [1.8, 'pick', 0.4]],
    draw: (ctx, lt, d, t, IMG, W, H) => { drawForum(ctx, W, H, t, { cam: { pos: [K(lt, [[0, -3], [d, -2]]), 3.2, 40], yaw: 0.04, pitch: 0.12, fov: 50 }, lk: look('golden'), scaffold: 1, crowd: 0.35 }); lowerThird(ctx, W, H, 'REPAIRS STILL UNDER WAY', 'EVIDENCE FROM EXCAVATED BUILDINGS', smooth(0.2, 1.2, lt), smooth(d - 0.6, d, lt)); } });
  add({ id: '3D', at: T('S03', 3), set: 'cutaway', tag: SCI, tin: ['dissolve', 0.8], amb: 'deep', desc: 'Geological cutaway: magma reservoir, conduit, rising magma; callouts.',
    sfx: [[0.3, 'rumble', 0.5]],
    draw: (ctx, lt, d, t, IMG, W, H) => cutaway(ctx, W, H, t, { lk: look('golden', 'storm', 0.3), rise: 0.35 + lt / d * 0.3, labels: smooth(0.3, d, lt) * 0.7, quake: 0.6 }) });
  add({ id: '3E', at: T('S03', 4), set: 'cutaway', tag: SCI, tin: ['cut', 0], amb: 'deep', desc: 'The cutaway pans to the town on the plain: "beneath their feet".',
    draw: (ctx, lt, d, t, IMG, W, H) => cutaway(ctx, W, H, t, { lk: look('golden', 'sunset', lt / d), rise: 0.65 + lt / d * 0.2, pan: ease(clamp(lt / (d * 0.8))), labels: 0.68 + 0.32 * smooth(1, d * 0.7, lt), quake: 0.3 }) });

  // ================================================================ S04 THE FIRST ERUPTION
  add({ id: '4A', at: T('S04'), set: 'calendar', tag: EVI, tin: ['dip', 0.8], amb: 'paper', desc: 'Dating the eruption: the manuscript tradition (24 August) presented as a page from Pliny\'s letters.',
    stamp: [0.1, 3.4, 'AD 79', null], sfx: [[0.1, 'impact', 0.6], [3.4, 'paper', 0.6]],
    draw: (ctx, lt, d, t, IMG, W, H) => calendar(ctx, W, H, t, { p: smooth(2.8, 5, lt), stage: 0 }) });
  add({ id: '4B', at: T('S04', 2), set: 'calendar', tag: EVI, tin: ['cut', 0], amb: 'paper', desc: 'The 2018 charcoal inscription ("XVI K NOV" = 17 October) slides in beside it: an autumn date is possible. Other debated clues listed.',
    sfx: [[0.2, 'paper', 0.6], [4.0, 'tick', 0.3]],
    draw: (ctx, lt, d, t, IMG, W, H) => calendar(ctx, W, H, t, { p: 1, stage: smooth(0, d * 0.75, lt) }) });
  add({ id: '4C', at: T('S04', 3), set: 'aerial', tag: REC, tin: ['cut', 0], amb: 'eruption', desc: 'THE ERUPTION: wide aerial from the south. A blast at the summit; the column climbs into the sky over the bay.',
    sfx: [[0.0, 'blast', 1.0], [0.05, 'impact', 0.8], [0.5, 'rumble', 0.8]],
    draw: (ctx, lt, d, t, IMG, W, H) => { ctx.save(); shake(ctx, lt, 0, 14, 7, 1.2); drawAerial(ctx, W, H, t, { cam: { pos: K(lt, [[0, [2600, 1300, -9500]], [d, [2400, 1350, -10500]]]), yaw: -0.23, pitch: K(lt, [[0, 0.02], [d, 0.08]]), fov: 52 }, lk: look('golden', 'storm', smooth(0.5, d, lt) * 0.6), erupt: { grow: E.outCubic(clamp(lt / (d * 0.9))), spread: smooth(d * 0.5, d, lt) * 0.6, tone: 0.25, glow: 0.8 * (1 - smooth(0, 2.5, lt)) + 0.2, H: 16 } }); ctx.restore(); } });
  add({ id: '4D', at: T('S04', 4), set: 'street', tag: REC, tin: ['cut', 0], amb: 'street_alarm', desc: 'From the street: the column towers above the arch; people stop and stare.',
    draw: (ctx, lt, d, t, IMG, W, H) => drawStreet(ctx, W, H, t, { cam: { pos: [0.4, 1.4, K(lt, [[0, 14], [d, 15]])], yaw: -0.02, pitch: 0.3, fov: 50 }, lk: look('golden', 'storm', 0.5), crowd: 0.4, crowdT: 30, vesuvius: { erupt: { grow: 1, spread: 0.6, tone: 0.35, glow: 0.2, H: 9 } } }) });
  add({ id: '4E', at: T('S04', 5), set: 'bay', tag: REC, tin: ['dissolve', 0.8], amb: 'sea', desc: 'Across the bay at Misenum: an onlooker under an umbrella pine; a gold outline traces the pine shape over the distant column (Pliny\'s comparison).',
    lower: [0.3, 5.8, 'MISENUM · ACROSS THE BAY', 'PLINY THE YOUNGER\'S VIEWPOINT · c. 30 KM'],
    sfx: [[1.6, 'shimmer', 0.4]],
    draw: (ctx, lt, d, t, IMG, W, H) => bay(ctx, W, H, t, { lk: look('golden', 'storm', 0.35), cam: { x: K(lt, [[0, 0], [d, -60]]), s: K(lt, [[0, 1.0], [d, 1.06]]) }, erupt: { grow: 1, spread: 0.9, tone: 0.3, H: 22 }, pine: smooth(1.4, 5.4, lt) }) });
  add({ id: '4F', at: T('S04', 6), set: 'street', tag: FIC, tin: ['dissolve', 0.6], amb: 'street_alarm', desc: 'The family and Gaius look toward the mountain; Gaius points.',
    draw: (ctx, lt, d, t, IMG, W, H) => drawStreet(ctx, W, H, t, { cam: { pos: [0.2, 1.5, K(lt, [[0, 6], [d, 6.6]])], yaw: 0.02, pitch: 0.12, fov: 50 }, lk: look('storm', 'ash', 0.15), crowd: 0.25, crowdT: 40, vesuvius: { erupt: { grow: 1, spread: 0.8, tone: 0.45, H: 9 } },
      people: fam(0.2, 10, { view: 'back', face: 1, gaius: { armUp: [0, 0.9 * smooth(0.5, 1.5, lt)], view: '3q', face: -1 } }) }) });
  add({ id: '4G', at: T('S04', 7), set: 'street', tag: REC, tin: ['cut', 0], amb: 'wind', desc: 'Looking up: the umbrella cloud spreads overhead and the sun dims.',
    draw: (ctx, lt, d, t, IMG, W, H) => drawStreet(ctx, W, H, t, { cam: { pos: [0, 1.4, 30], yaw: 0, pitch: 0.42, fov: 60 }, lk: look('storm', 'ash', lt / d), vesuvius: { erupt: { grow: 1, spread: 1, tone: 0.5 + 0.3 * lt / d, H: 12 } } }) });
  add({ id: '4H', at: T('S04', 8), set: 'street', tag: FIC, tin: ['cut', 0], amb: 'wind', desc: 'Close: Julia holds out her hand as fine ash drifts down.',
    draw: (ctx, lt, d, t, IMG, W, H) => drawStreet(ctx, W, H, t, { cam: { pos: [-0.3, 1.0, K(lt, [[0, 9.6], [d, 9.9]])], yaw: 0.05, pitch: 0.08, fov: 34 }, lk: look('ash'), ashFall: 0.4, vesuvius: { erupt: { grow: 1, spread: 1, tone: 0.7, H: 9 } }, people: [{ spec: CHAR.julia, x: -0.4, z: 11.6, view: '3q', face: -1, armUp: [0, 0.55], look: 0.3 }, { spec: CHAR.livia, x: 0.4, z: 12.2, view: '3q', face: -1 }] }) });
  add({ id: '4I', at: T('S04', 9), set: 'aerial', tag: REC, tin: ['dissolve', 0.8], amb: 'eruption', desc: 'Wide aerial: the umbrella cloud spreads south-east over the town; ash begins to fall.',
    sfx: [[0.5, 'rumble', 0.6]],
    draw: (ctx, lt, d, t, IMG, W, H) => drawAerial(ctx, W, H, t, { cam: { pos: K(lt, [[0, [3500, 1800, -7000]], [d, [3200, 1900, -7600]]]), yaw: -0.28, pitch: -0.02, fov: 54 }, lk: look('storm', 'ash', 0.3 + 0.3 * lt / d), erupt: { grow: 1, spread: 1, tone: 0.45, H: 16, wind: 0.8 }, ashFall: 0.3 }) });

  // ================================================================ S05 ASH FALLS OVER POMPEII
  add({ id: '5A', at: T('S05'), set: 'map', tag: MAP, tin: ['dissolve', 0.8], amb: 'map_dark', desc: 'Map of the bay: the plume drifts south-east; Pompeii and Stabiae fall inside the ash and pumice lobe.',
    sfx: [[0.3, 'paper', 0.5], [2.4, 'whoosh', 0.3]],
    draw: (ctx, lt, d, t, IMG, W, H) => drawMap(ctx, W, H, t, { view: { c: [14.36, 40.74], z: K(lt, [[0, 1500], [d, 1700]]) }, plume: smooth(0.6, 5, lt), tone: 0.15, scale: 10,
      labels: [['Vesuvius', 1, { noDot: true, dx: 0, dy: -60, align: 'center' }], ['Pompeii', smooth(1, 2, lt), { color: '#7a2a14' }], ['Stabiae', smooth(1.4, 2.4, lt)], ['Herculaneum', smooth(1.8, 2.8, lt), { align: 'right', dx: -18 }], ['Neapolis', smooth(2, 3, lt), { align: 'right', dx: -18 }], ['Misenum', smooth(2.2, 3.2, lt), { align: 'right', dx: -18 }]] }, F) });
  add({ id: '5B', at: T('S05', 1), set: 'street', tag: REC, tin: ['cut', 0], amb: 'pumice', desc: 'Pumice rains on the street, bouncing off the paving and piling up; people pull cloth over their heads.',
    lower: [0.4, 4.2, 'PUMICE FALL', 'DEPOSITS BUILT UP OVER MANY HOURS'], sfx: [[0, 'pumice_start', 0.7]],
    draw: (ctx, lt, d, t, IMG, W, H) => drawStreet(ctx, W, H, t, { cam: { pos: [0.3, 1.5, K(lt, [[0, 3], [d, 4]])], yaw: 0.02, pitch: 0.0, fov: 52 }, lk: look('ash'), ash: K(lt, [[0, 0.05], [d, 0.28]]), pumice: 0.9, ashFall: 0.5, crowd: 0.45, crowdT: t, cover: 1, ashShut: true, vesuvius: { erupt: { grow: 1, spread: 1, tone: 0.8, H: 9 } }, haze: 0.2 }) });
  add({ id: '5C', at: T('S05', 2), set: 'street', tag: REC, tin: ['dissolve', 0.6], amb: 'pumice', desc: 'Wide street: daylight fails; a lamp is lit in a doorway.',
    draw: (ctx, lt, d, t, IMG, W, H) => drawStreet(ctx, W, H, t, { cam: { pos: [-0.5, 2.2, K(lt, [[0, 1], [d, 0.4]])], yaw: 0.03, pitch: 0.02, fov: 58 }, lk: look('ash', 'dark', lt / d * 0.7), ash: 0.45, pumice: 0.8, ashFall: 0.6, ashShut: true, lamps: true, night: lt > 1.5, haze: 0.35 }) });
  add({ id: '5D', at: T('S05', 3), set: 'atrium', tag: FIC, tin: ['dissolve', 0.5], amb: 'interior_pumice', desc: 'Lamp-lit atrium: Marcus at the doorway, Livia holding Julia, Gaius urging them to leave: an impossible decision (no dialogue).',
    draw: (ctx, lt, d, t, IMG, W, H) => drawAtrium(ctx, W, H, t, { cam: { pos: [1.4, 1.5, K(lt, [[0, 0.5], [d, 1.4]])], yaw: -0.18, pitch: 0.04, fov: 52 }, lk: look('dark'), night: 1, ashFall: 0.6,
      people: [{ spec: CHAR.marcus, x: -1.6, z: 6.5, view: '3q', face: 1, look: 0.4 }, { spec: CHAR.livia, x: 0.3, z: 7.4, view: '3q', face: -1 }, { spec: CHAR.julia, x: 0.0, z: 7.2, view: '3q', face: -1 }, { spec: CHAR.gaius, x: -3.2, z: 8.5, view: '3q', face: 1, armUp: [0.4, 0.7 * Math.abs(Math.sin(lt * 1.5))] }] }) });
  add({ id: '5E', at: T('S05', 4), set: 'street', tag: REC, tin: ['cut', 0], amb: 'pumice', desc: 'Some flee: figures with cloth over their heads hurry away toward a city gate.',
    draw: (ctx, lt, d, t, IMG, W, H) => drawStreet(ctx, W, H, t, { cam: { pos: [0, 1.7, 8 + lt * 0.8], yaw: 0, pitch: 0.02, fov: 50 }, lk: look('ash', 'dark', 0.5), ash: 0.6, pumice: 1, ashFall: 0.7, crowd: 0.8, flee: true, crowdT: t, cover: 1, haze: 0.4, lamps: true, night: true }) });
  add({ id: '5F', at: T('S05', 5), set: 'atrium', tag: REC, tin: ['cut', 0], amb: 'interior_pumice', desc: 'Others shelter: a family huddles by lamplight as pumice drifts through the roof opening.',
    draw: (ctx, lt, d, t, IMG, W, H) => drawAtrium(ctx, W, H, t, { cam: { pos: [-1, 1.2, K(lt, [[0, 1], [d, 1.6]])], yaw: 0.25, pitch: 0.0, fov: 50 }, lk: look('dark'), night: 1, ashFall: 0.8,
      people: [0, 1, 2].map((i) => ({ spec: crowdSpec(80 + i, 5), x: 3.6 + i * 0.6, z: 9 - i * 0.5, view: '3q', face: -1, crouch: 0.85 })) }) });
  add({ id: '5G', at: T('S05', 6), set: 'street', tag: REC, tin: ['cut', 0], amb: 'pumice', desc: 'Roof failure: the weight of pumice brings down a roof; tiles and beams fall in a burst of dust.',
    lower: [0.3, 4.6, 'ROOFS GAVE WAY', 'UNDER THE WEIGHT OF PUMICE'], sfx: [[2.4, 'creak', 0.6], [3.0, 'collapse', 1.0]],
    draw: (ctx, lt, d, t, IMG, W, H) => { ctx.save(); shake(ctx, lt, 3.0, 10, 9, 0.8); drawStreet(ctx, W, H, t, { cam: { pos: [1.2, 1.6, 6], yaw: -0.35, pitch: 0.18, fov: 52 }, lk: look('ash', 'dark', 0.6), ash: 0.9, pumice: 1, ashFall: 0.5, haze: 0.3, collapse: { x: -3.4, y: 7.2, z: 14, t0: t - lt + 3.0 } }); ctx.restore(); } });
  add({ id: '5H', at: T('S05', 7), set: 'street', tag: FIC, tin: ['dissolve', 0.6], amb: 'pumice', desc: 'Marcus carries Julia; Livia and Gaius follow through knee-deep pumice into the dark. Their fate is left unknown.',
    draw: (ctx, lt, d, t, IMG, W, H) => drawStreet(ctx, W, H, t, { cam: { pos: [0.2, 2.0, K(lt, [[0, 4], [d, 5.5]])], yaw: 0, pitch: -0.02, fov: 48 }, lk: look('dark'), night: true, lamps: true, ash: 1.1, pumice: 0.9, ashFall: 0.7, haze: 0.45,
      people: fam(0.1, K(lt, [[0, 8], [d, 13]]), { view: 'back', face: 1, walk: 1, phase: lt * 0.8, cover: 1, marcus: { torch: true } }) }) });

  // ================================================================ S06 THE CITY DESCENDS INTO CHAOS
  add({ id: '6A', at: T('S06'), set: 'aerial', tag: REC, tin: ['dissolve', 0.8], amb: 'eruption_night', desc: 'Time passes: the aerial goes from dusk to night, lightning in the column. A timeline of the eruption phases runs below (approximate).',
    sfx: [[1.8, 'thunder', 0.6], [3.6, 'thunder', 0.5]],
    draw: (ctx, lt, d, t, IMG, W, H) => { drawAerial(ctx, W, H, t, { cam: { pos: [3200, 1700, -8000], yaw: -0.26, pitch: 0.0, fov: 54 }, lk: look('ash', 'dark', lt / d), erupt: { grow: 1, spread: 1, tone: 0.75, H: 16, glow: 0.6 }, night: lt / d, lightning: [t - lt + 1.8, t - lt + 3.6] });
      timeline(ctx, W, H, t, { p: smooth(0, 1.5, lt), cursor: 0.18 + 0.32 * lt / d, title: 'THE ERUPTION · APPROXIMATE PHASES', items: [['DAY 1, MIDDAY', 'eruption begins', 0.04], ['AFTERNOON-NIGHT', 'pumice and ash fall', 0.34], ['NIGHT', 'first currents (Herculaneum)', 0.64], ['DAY 2, MORNING', 'currents reach Pompeii', 0.94]] }); } });
  add({ id: '6B', at: T('S06', 1), set: 'street', tag: REC, tin: ['dissolve', 0.6], amb: 'night_chaos', desc: 'Night street: torches, deep pumice, people struggling over the drifts.',
    draw: (ctx, lt, d, t, IMG, W, H) => drawStreet(ctx, W, H, t, { cam: { pos: [-0.6, 2.4, K(lt, [[0, 2], [d, 4]])], yaw: 0.05, pitch: -0.04, fov: 52 }, lk: look('dark'), night: true, lamps: true, ash: 1.5, pumice: 0.6, ashFall: 0.8, crowd: 0.5, crowdT: t * 0.6, cover: 1, haze: 0.35 }) });
  add({ id: '6C', at: T('S06', 2), set: 'street', tag: REC, tin: ['cut', 0], amb: 'night_chaos', desc: 'A building front collapses across the street.',
    sfx: [[0.9, 'collapse', 1.0]],
    draw: (ctx, lt, d, t, IMG, W, H) => { ctx.save(); shake(ctx, lt, 0.9, 12, 5, 0.8); drawStreet(ctx, W, H, t, { cam: { pos: [0.6, 2.6, 9], yaw: 0.25, pitch: 0.1, fov: 50 }, lk: look('dark'), night: true, lamps: true, ash: 1.6, ashFall: 0.6, haze: 0.3, collapse: { x: 3.4, y: 6.5, z: 17, t0: t - lt + 0.9 } }); ctx.restore(); } });
  add({ id: '6D', at: T('S06', 3), set: 'street', tag: REC, tin: ['cut', 0], amb: 'night_chaos', desc: 'Families separated: torch-lit figures scatter in different directions at a junction.',
    draw: (ctx, lt, d, t, IMG, W, H) => drawStreet(ctx, W, H, t, { cam: { pos: [0, 2.2, 12], yaw: 0, pitch: -0.02, fov: 56 }, lk: look('dark'), night: true, lamps: true, ash: 1.6, ashFall: 0.8, crowd: 0.7, crowdT: t * 1.4, haze: 0.4, cover: 1 }) });
  add({ id: '6E', at: T('S06', 4), set: 'street', tag: REC, tin: ['cut', 0], amb: 'night_chaos', desc: 'Visibility collapses: ash fog swallows the street until only lamp glows remain.',
    draw: (ctx, lt, d, t, IMG, W, H) => drawStreet(ctx, W, H, t, { cam: { pos: [0, 2.2, 14 + lt], yaw: 0, pitch: 0, fov: 52 }, lk: look('dark'), night: true, lamps: true, ash: 1.7, ashFall: 1, haze: 0.4 + 0.5 * lt / d }) });
  add({ id: '6F', at: T('S06', 5), set: 'atrium', tag: REC, tin: ['dissolve', 0.5], amb: 'interior_quake', desc: 'Cross-cut inside: the lamp sways, dust sifts from the ceiling, the room trembles.',
    sfx: [[1.0, 'rumble', 0.6], [3.4, 'crack', 0.4]],
    draw: (ctx, lt, d, t, IMG, W, H) => { ctx.save(); shake(ctx, lt, 1.0, 6, 3, 2.5); drawAtrium(ctx, W, H, t, { cam: { pos: [0, 1.5, K(lt, [[0, 2], [d, 3]])], yaw: 0, pitch: 0.18, fov: 54 }, lk: look('dark'), night: 1, dust: 0.9, ashFall: 0.4 }); ctx.restore(); } });
  add({ id: '6G', at: T('S06', 6), set: 'aerial', tag: REC, tin: ['dissolve', 0.6], amb: 'eruption_night', desc: 'Night aerial: the glowing column wavers. Music drops out on "still to come".',
    sfx: [[1.0, 'thunder', 0.5], [2.6, 'sub', 0.7]],
    draw: (ctx, lt, d, t, IMG, W, H) => drawAerial(ctx, W, H, t, { cam: { pos: K(lt, [[0, [2800, 1600, -7000]], [d, [3000, 1700, -8200]]]), yaw: -0.27, pitch: 0.02, fov: 54 }, lk: look('dark'), erupt: { grow: 1, spread: 1, tone: 0.9, H: 16, glow: 0.9, collapse: smooth(1, d, lt) * 0.3 }, night: 1, lightning: [t - lt + 1.0] }) });

  // ================================================================ S07 THE PYROCLASTIC CURRENTS
  add({ id: '7A', at: T('S07'), set: 'pdc', tag: SCI, tin: ['dip', 0.8], amb: 'science', desc: 'Side-section diagram: the stable eruption column, labelled.',
    draw: (ctx, lt, d, t, IMG, W, H) => pdcSide(ctx, W, H, t, { lk: look('ash'), labels: smooth(0.4, 2.5, lt), collapse: 0, flow: 0 }) });
  add({ id: '7B', at: T('S07', 1), set: 'pdc', tag: SCI, tin: ['cut', 0], amb: 'rush', desc: 'The column collapses and feeds a pyroclastic current that races down the flank toward the town.',
    sfx: [[1.0, 'rush', 0.9], [1.0, 'riser', 0.5]],
    draw: (ctx, lt, d, t, IMG, W, H) => pdcSide(ctx, W, H, t, { lk: look('ash'), labels: 1, collapse: smooth(0, 2.5, lt), flow: smooth(1.2, d, lt) }) });
  add({ id: '7C', at: T('S07', 2), set: 'lava', tag: SCI, tin: ['wipe', 0.6], amb: 'science', desc: 'Split screen: a slow lava flow (crossed out) vs a fast pyroclastic current.',
    sfx: [[0.1, 'whoosh', 0.5], [4.9, 'thud', 0.6]],
    draw: (ctx, lt, d, t, IMG, W, H) => lavaVsPdc(ctx, W, H, t, { lk: look('ash'), p: smooth(0, d * 0.9, lt) }) });
  add({ id: '7D', at: T('S07', 4), set: 'map', tag: MAP, tin: ['dissolve', 0.7], amb: 'map_dark', desc: 'Map: currents spread from the volcano. Herculaneum struck first (overnight), Pompeii the next morning, Stabiae later (sequence per deposit studies; times approximate).',
    sfx: [[0.8, 'rush', 0.5], [5.8, 'rush', 0.5]],
    draw: (ctx, lt, d, t, IMG, W, H) => drawMap(ctx, W, H, t, { view: { c: [14.38, 40.77], z: 2000 }, tone: 0.25, scale: 5,
      pdc: { sites: [['Herculaneum', smooth(0.6, 3.4, lt), 'OVERNIGHT'], ['Oplontis', smooth(3.6, 5.6, lt), null], ['Pompeii', smooth(5.6, 7.8, lt), 'NEXT MORNING'], ['Stabiae', smooth(7.8, d, lt), 'LATER']] },
      labels: [['Vesuvius', 1, { noDot: true, dx: 0, dy: -50, align: 'center' }], ['Herculaneum', 1, { align: 'right', dx: -18 }], ['Oplontis', smooth(3.6, 4.4, lt), { align: 'right', dx: -16, dy: 22, size: 24 }], ['Pompeii', 1, { color: '#7a2a14' }], ['Stabiae', smooth(5, 6, lt)]] }, F) });
  add({ id: '7E', at: T('S07', 6), set: 'aerial', tag: REC, tin: ['dissolve', 0.6], amb: 'rush', desc: 'Grey dawn: from a distance, the current rolls across the plain toward the walls and the town disappears into it. No victims shown.',
    sfx: [[0.2, 'rush', 1.0], [3.4, 'impact', 0.5]],
    draw: (ctx, lt, d, t, IMG, W, H) => drawAerial(ctx, W, H, t, { cam: { pos: [4200, 900, -6200], yaw: -0.42, pitch: -0.02, fov: 48 }, lk: look('ash', 'grey', 0.4), erupt: { grow: 1, spread: 1, tone: 0.8, H: 14, collapse: 0.4 }, pdc: { p: smooth(0, d * 0.95, lt), thick: 1.6 }, bury: 0.3, ashFall: 0.4 }) });
  add({ id: '7F', at: T('S07', 7), set: 'street', tag: FIC, tin: ['dissolve', 0.8], amb: 'silence', desc: 'Silence. An empty street under ash; Julia\'s small wooden horse lies on the surface as the grey thickens.',
    draw: (ctx, lt, d, t, IMG, W, H) => { drawStreet(ctx, W, H, t, { cam: { pos: [0.2, 1.2, K(lt, [[0, 7], [d, 8]])], yaw: 0, pitch: -0.12, fov: 44 }, lk: look('grey', 'ash', 0.3), ash: 1.0, ashFall: 0.4, haze: 0.2 + 0.6 * smooth(2, d, lt) }); toyHorse(ctx, W * 0.46, H * 0.78, 90);
      ctx.fillStyle = `rgba(150,142,132,${0.9 * smooth(d - 2.2, d, lt)})`; ctx.fillRect(0, 0, W, H); } });

  // ================================================================ S08 THE END OF AN ANCIENT CITY
  add({ id: '8A', at: T('S08'), set: 'aerial', tag: REC, tin: ['dissolve', 1.2], amb: 'aftermath', desc: 'Aftermath: a grey, smoking landscape where the town was; weak sun.',
    draw: (ctx, lt, d, t, IMG, W, H) => drawAerial(ctx, W, H, t, { cam: { pos: K(lt, [[0, [900, 600, -2600]], [d, [1100, 700, -3200]]]), yaw: -0.2, pitch: -0.18, fov: 44 }, lk: look('grey'), bury: 0.95, smoke: 1, haze: 0.2 }) });
  add({ id: '8B', at: T('S08', 1), set: 'strata', tag: SCI, tin: ['dissolve', 0.6], amb: 'aftermath', desc: 'Cross-section: the town\'s walls with the deposits stacked over them: white pumice, grey pumice, current layers, later soils.',
    sfx: [[0.6, 'thud', 0.4], [1.8, 'thud', 0.4], [3.0, 'thud', 0.4]],
    draw: (ctx, lt, d, t, IMG, W, H) => strata(ctx, W, H, t, { lk: look('grey'), layers: smooth(0, d * 0.7, lt) * 0.76, labels: smooth(0.5, d, lt), ruler: smooth(d * 0.5, d, lt) }) });
  add({ id: '8C', at: T('S08', 2), set: 'forum', tag: REC, tin: ['dissolve', 0.8], amb: 'aftermath', desc: 'The Forum, empty and half-buried, in pale light. A quiet caption: no exact death toll is known.',
    caption: [0.4, 4.0, 'Many died. Others escaped. The exact number of victims is unknown.'],
    draw: (ctx, lt, d, t, IMG, W, H) => drawForum(ctx, W, H, t, { cam: { pos: [0, 4.5, K(lt, [[0, 10], [d, 16]])], yaw: 0, pitch: 0.04, fov: 50 }, lk: look('grey'), ash: 3.2, haze: 0.25 }) });
  add({ id: '8D', at: T('S08', 3), set: 'map', tag: MAP, tin: ['dissolve', 0.6], amb: 'map_dark', desc: 'Map pins: Herculaneum, Oplontis, Stabiae and Pompeii: the communities buried.',
    sfx: [[0.8, 'pin', 0.5], [1.8, 'pin', 0.5], [2.8, 'pin', 0.5], [3.8, 'pin', 0.5]],
    draw: (ctx, lt, d, t, IMG, W, H) => drawMap(ctx, W, H, t, { view: { c: [14.36, 40.76], z: K(lt, [[0, 1700], [d, 1800]]) }, tone: 0.2, scale: 5,
      pins: [['Herculaneum', smooth(0.8, 1.6, lt)], ['Oplontis', smooth(1.8, 2.6, lt)], ['Stabiae', smooth(2.8, 3.6, lt)], ['Pompeii', smooth(3.8, 4.6, lt)]],
      labels: [['Herculaneum', smooth(1, 1.8, lt), { align: 'right', dx: -20 }], ['Oplontis', smooth(2, 2.8, lt), { align: 'right', dx: -20, dy: 28, size: 24 }], ['Stabiae', smooth(3, 3.8, lt)], ['Pompeii', smooth(4, 4.8, lt), { color: '#7a2a14' }], ['Vesuvius', 1, { noDot: true, dx: 0, dy: -50, align: 'center' }]] }, F) });
  add({ id: '8E', at: T('S08', 4), set: 'aerial', tag: REC, tin: ['dissolve', 0.8], amb: 'aftermath', desc: 'Wide: the smoking mountain over the grey plain and the bay. Slow pull-back.',
    draw: (ctx, lt, d, t, IMG, W, H) => drawAerial(ctx, W, H, t, { cam: { pos: K(lt, [[0, [2600, 1200, -6000]], [d, [3200, 1500, -8500]]]), yaw: -0.24, pitch: -0.04, fov: 50 }, lk: look('grey', 'sunset', 0.25), bury: 1, smoke: 1 }) });

  // ================================================================ S09 LOST BENEATH THE EARTH
  add({ id: '9A', at: T('S09'), set: 'aerial', tag: REC, tin: ['dissolve', 1.0], amb: 'time', desc: 'Time-lapse: green returns over the buried plain; a year counter starts at AD 79.',
    sfx: [[0.5, 'clock', 0.4]],
    draw: (ctx, lt, d, t, IMG, W, H) => { drawAerial(ctx, W, H, t, { cam: { pos: [1200, 800, -3200], yaw: -0.2, pitch: -0.17, fov: 44 }, lk: look('grey', 'golden', smooth(0, d, lt)), bury: 1, green: smooth(1, d, lt) }); stamp(ctx, W, H, `AD ${Math.round(lerp(79, 500, smooth(1, d, lt)))}`, smooth(0, 1, lt), 0, { y: H * 0.2, size: 96 }); } });
  add({ id: '9B', at: T('S09', 2), set: 'strata', tag: SCI, tin: ['dissolve', 0.6], amb: 'time', desc: 'Not erased, preserved: the section again, the town sealed under the layers, grass on the surface.',
    draw: (ctx, lt, d, t, IMG, W, H) => { strata(ctx, W, H, t, { lk: look('golden'), layers: 1, labels: 0, green: 1 }); callout(ctx, W * 0.42, H * 0.75, W * 0.56, H * 0.3, 'PRESERVED, NOT ERASED', 'walls, paintings and objects sealed in place', smooth(0.3, 2, lt)); } });
  add({ id: '9C', at: T('S09', 4), set: 'aerial', tag: REC, tin: ['dissolve', 0.6], amb: 'time', desc: 'Centuries race by: the counter runs to the 1600s; the mountain\'s profile changes to the twin Somma-Vesuvius shape after later eruptions (e.g. 1631).',
    sfx: [[0.2, 'clock', 0.5]],
    draw: (ctx, lt, d, t, IMG, W, H) => { drawAerial(ctx, W, H, t, { cam: { pos: K(lt, [[0, [1600, 1000, -4200]], [d, [1900, 1100, -5000]]]), yaw: -0.22, pitch: -0.12, fov: 46 }, lk: look('golden', 'noon', lt / d), bury: 1, green: 1, mountainMix: smooth(1, d - 1, lt), smoke: bumpy(lt, 2.5) });
      stamp(ctx, W, H, `AD ${Math.round(lerp(500, 1700, smooth(0, d - 0.5, lt)))}`, 1, 0, { y: H * 0.2, size: 96, sub: lt > 2 ? 'VESUVIUS ERUPTS AGAIN · 472 · 1631 ·' : null }); } });
  add({ id: '9D', at: T('S09', 5), set: 'aerial', tag: REC, tin: ['cut', 0], amb: 'time', desc: 'X-ray reveal: the buried street grid glows beneath the fields.',
    sfx: [[0.6, 'shimmer', 0.6]],
    draw: (ctx, lt, d, t, IMG, W, H) => { const st = { cam: { pos: [700, 900, -1900], yaw: -0.22, pitch: -0.36, fov: 44 }, lk: look('noon'), bury: 1, green: 1, mountain: 'modern' }; drawAerial(ctx, W, H, t, st);
      const k = smooth(0.4, 2.6, lt); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = `rgba(255,205,110,${0.75 * k})`; ctx.lineWidth = 2.5; ctx.beginPath(); st._outline.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
      ctx.lineWidth = 1.2; ctx.strokeStyle = `rgba(255,205,110,${0.45 * k})`; ctx.beginPath(); st._grid.forEach(([a, b]) => { if (a && b) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } }); ctx.stroke(); ctx.restore();
      if (st._town) callout(ctx, st._town[0], st._town[1], st._town[0] + 260, st._town[1] - 200, 'POMPEII', 'buried beneath the fields', smooth(1.4, 3.2, lt)); } });

  // ================================================================ S10 THE REDISCOVERY
  add({ id: '10A', at: T('S10'), set: 'street', tag: REC, tin: ['dissolve', 1.0], amb: 'dig', desc: '1748: workmen in 18th-century dress dig into the deposits; the tops of walls appear.',
    stamp: [0.2, 4.4, '1748', 'EXCAVATIONS BEGIN AT POMPEII'], sfx: [[0.3, 'pick', 0.5], [1.1, 'pick', 0.5], [1.9, 'pick', 0.5], [2.7, 'pick', 0.5], [3.5, 'pick', 0.5], [4.3, 'pick', 0.5]],
    draw: (ctx, lt, d, t, IMG, W, H) => drawStreet(ctx, W, H, t, { cam: { pos: [0.3, 4.2, K(lt, [[0, 4], [d, 5]])], yaw: 0.05, pitch: -0.12, fov: 50 }, lk: look('golden'), ash: 2.6, ruin: 1, vesuvius: { kind: 'modern' },
      people: [0, 1, 2, 3, 4].map((i) => ({ spec: digger(i, 1748), x: -1.8 + i * 0.9, z: 9 + (i % 2) * 1.5, y: 2.6, view: i % 2 ? '3q' : 'side', face: i % 2 ? -1 : 1, phase: lt * 0.7 + i * 0.3, crouch: 0.3 })) }) });
  add({ id: '10B', at: T('S10', 1), set: 'archival', tag: 'ARCHIVAL · 19TH-CENTURY WATERCOLOUR', tin: ['dissolve', 0.8], amb: 'dig', desc: 'Archival: 19th-century watercolour of an excavation (finds lifted from the deposit). Slow Ken Burns.',
    sfx: [[0.2, 'paper', 0.4]],
    draw: (ctx, lt, d, t, IMG, W, H) => archival(ctx, W, H, t, { img: 'capaldo', from: [0.2, 0.3, 1.05], to: [0.55, 0.6, 1.25], p: lt / d, label: 'EXCAVATIONS, 19TH CENTURY', credit: 'Watercolour signed L. Capaldo (detail) · public domain' }, IMG) });
  add({ id: '10C', at: T('S10', 1, 5.4), set: 'archival', tag: 'ARCHIVAL · ENGRAVING, 1860s', tin: ['dissolve', 0.8], amb: 'dig', desc: 'Archival: engraving of recent excavations directed by inspector Giuseppe Fiorelli (1860s).',
    draw: (ctx, lt, d, t, IMG, W, H) => archival(ctx, W, H, t, { img: 'bayard', from: [0.5, 0.25, 1.06], to: [0.42, 0.45, 1.3], p: lt / d, sepia: true, label: 'GIUSEPPE FIORELLI\'S EXCAVATIONS', credit: 'Émile Bayard after Duclère, Le Tour du Monde, 1860s · public domain' }, IMG) });
  add({ id: '10D', at: T('S10', 2), set: 'finds', tag: EVI, tin: ['dissolve', 0.6], amb: 'museum', desc: 'The finds: amphora, wall painting, painted notice, oil lamp, carbonised bread (illustrated, generic examples).',
    sfx: [[0.3, 'tick', 0.4], [1.3, 'tick', 0.4], [2.3, 'tick', 0.4], [3.3, 'tick', 0.4], [4.3, 'tick', 0.4]],
    draw: (ctx, lt, d, t, IMG, W, H) => finds(ctx, W, H, t, { p: smooth(0, d * 0.85, lt) }) });
  add({ id: '10E', at: T('S10', 3), set: 'street', tag: REC, tin: ['dissolve', 0.7], amb: 'dig', desc: 'The street emerges: the deposit level drops as the paving, kerbs and stepping stones reappear.',
    draw: (ctx, lt, d, t, IMG, W, H) => drawStreet(ctx, W, H, t, { cam: { pos: [0.2, K(lt, [[0, 3.6], [d, 1.9]]), K(lt, [[0, 14], [d, 16]])], yaw: 0, pitch: K(lt, [[0, -0.18], [d, -0.06]]), fov: 52 }, lk: look('noon'), ash: K(lt, [[0, 2.2], [d, 0.0]]), ruin: 1, vesuvius: { kind: 'modern' },
      people: [0, 1, 2].map((i) => ({ spec: digger(i + 7, 1863), x: -1.5 + i * 1.4, z: 21 + i, y: 0, view: '3q', face: i % 2 ? 1 : -1, phase: lt + i })) }) });
  add({ id: '10F', at: T('S10', 4), set: 'aerial', tag: 'PRESENT DAY · ILLUSTRATION', tin: ['dissolve', 0.8], amb: 'modern_site', desc: 'Today\'s excavated city from the air, roofless streets and houses; the modern twin profile of Vesuvius. UNESCO World Heritage listing (1997).',
    lower: [0.6, 7.6, 'UNESCO WORLD HERITAGE SITE', 'INSCRIBED 1997 · WITH HERCULANEUM & TORRE ANNUNZIATA'],
    draw: (ctx, lt, d, t, IMG, W, H) => drawAerial(ctx, W, H, t, { cam: { pos: K(lt, [[0, [800, 560, -1700]], [d, [500, 420, -1200]]]), yaw: -0.24, pitch: -0.24, fov: 44 }, lk: look('modern'), ruin: 1, mountain: 'modern', green: 1, bury: 0.2 }) });

  // ================================================================ S11 A WINDOW INTO ROMAN LIFE
  add({ id: '11A', at: T('S11'), set: 'street', tag: 'RECONSTRUCTION ↔ PRESENT DAY', tin: ['dissolve', 0.8], amb: 'modern_site', desc: 'Then and now: a divider sweeps across the same street, reconstruction on one side, today\'s ruins on the other.',
    sfx: [[0.8, 'whoosh', 0.5], [4.4, 'whoosh', 0.4]],
    draw: (ctx, lt, d, t, IMG, W, H) => { const cam = { pos: [0.2, 1.7, K(lt, [[0, 2], [d, 4]])], yaw: 0.02, pitch: 0.04, fov: 54 }; drawStreet(ctx, W, H, t, { cam, lk: look('golden'), crowd: 0.4, shutters: 1 });
      const x = W * K(lt, [[0, 1.02], [1.8, 0.5], [4.2, 0.5], [5.4, 0.3], [d, 0.5]]); ctx.save(); ctx.beginPath(); ctx.rect(x, 0, W - x, H); ctx.clip(); drawStreet(ctx, W, H, t, { cam, lk: look('modern'), ruin: 1, vesuvius: { kind: 'modern' } }); ctx.restore();
      ctx.fillStyle = GOLD; ctx.fillRect(x - 2, 0, 4, H); capsText(ctx, 'AD 79', x - 40, 120, 34, CREAM, smooth(1.5, 2.2, lt), 'right', 0.2); capsText(ctx, 'TODAY', x + 40, 120, 34, CREAM, smooth(1.5, 2.2, lt), 'left', 0.2); } });
  add({ id: '11B', at: T('S11', 1), set: 'street', tag: 'PRESENT DAY · ILLUSTRATION', tin: ['cut', 0], amb: 'modern_site', desc: 'Low on the paving: cart ruts and stepping stones; animated arrows show wheels running between the stones and feet crossing over them.',
    draw: (ctx, lt, d, t, IMG, W, H) => { drawStreet(ctx, W, H, t, { cam: { pos: [0.6, 0.9, 24.4], yaw: -0.05, pitch: -0.2, fov: 50 }, lk: look('modern'), ruin: 1, vesuvius: { kind: 'modern' } });
      const k = smooth(0.2, 1.4, lt); ctx.save(); ctx.lineWidth = 6; ctx.setLineDash([18, 12]); ctx.lineDashOffset = -t * 60; ctx.strokeStyle = `rgba(155,42,26,${0.9 * k})`; for (const x of [0.36, 0.62]) { ctx.beginPath(); ctx.moveTo(W * x, H); ctx.lineTo(W * (0.5 + (x - 0.5) * 0.25), H * 0.45); ctx.stroke(); }
      ctx.strokeStyle = `rgba(232,189,85,${0.95 * smooth(1, 2, lt)})`; ctx.beginPath(); ctx.moveTo(W * 0.1, H * 0.62); ctx.bezierCurveTo(W * 0.35, H * 0.5, W * 0.65, H * 0.5, W * 0.92, H * 0.62); ctx.stroke(); ctx.restore();
      capsText(ctx, 'CART RUTS', W * 0.3, H * 0.92, 28, CREAM, k, 'center', 0.2); capsText(ctx, 'STEPPING STONES', W * 0.5, H * 0.4, 28, GOLD, smooth(1, 2, lt), 'center', 0.2); } });
  add({ id: '11C', at: T('S11', 2), set: 'plan', tag: 'PLAN · SIMPLIFIED', tin: ['dissolve', 0.4], amb: 'paper', desc: 'A Pompeian house plan draws itself: fauces, atrium, impluvium, tablinum, peristyle, cubicula.',
    sfx: [[0.1, 'paper', 0.5]],
    draw: (ctx, lt, d, t, IMG, W, H) => plan(ctx, W, H, t, { p: smooth(0, d, lt) }) });
  add({ id: '11D', at: T('S11', 3), set: 'atrium', tag: REC, tin: ['dissolve', 0.5], amb: 'room', desc: 'Close on painted walls: red panels, gold frames, a small vignette; slow lateral glide.',
    draw: (ctx, lt, d, t, IMG, W, H) => { drawAtrium(ctx, W, H, t, { cam: { pos: [2.6, 2.3, K(lt, [[0, 3], [d, 6]])], yaw: -1.2, pitch: 0.05, fov: 46 }, lk: look('noon') }); callout(ctx, W * 0.5, H * 0.45, W * 0.66, H * 0.2, 'WALL PAINTINGS', 'colour, imagery and personal taste', smooth(0.5, 2, lt)); } });
  add({ id: '11E', at: T('S11', 4), set: 'aerial', tag: 'PRESENT DAY · ILLUSTRATION', tin: ['dissolve', 0.6], amb: 'modern_site', desc: 'The excavated site from the air with key places labelled: Forum, amphitheatre. About two-thirds of the walled city has been excavated.',
    lower: [0.6, 6.0, 'ABOUT TWO-THIRDS EXCAVATED', 'PARTS OF THE CITY REMAIN UNEXPLORED'],
    draw: (ctx, lt, d, t, IMG, W, H) => { const st = { cam: { pos: K(lt, [[0, [600, 700, -1500]], [d, [300, 640, -1300]]]), yaw: -0.22, pitch: -0.38, fov: 46 }, lk: look('modern'), ruin: 1, mountain: 'modern', green: 1, bury: 0.2 }; drawAerial(ctx, W, H, t, st);
      const fo = st._p(-90 * Math.cos(0.42) - 20 * Math.sin(0.42), 10, -90 * Math.sin(0.42) + 20 * Math.cos(0.42)); if (fo) callout(ctx, fo[0], fo[1], fo[0] - 120, fo[1] - 170, 'FORUM', null, smooth(0.8, 2, lt), { align: 'right' });
      const am = st._p(540 * Math.cos(0.42) + 60 * Math.sin(0.42), 10, 540 * Math.sin(0.42) - 60 * Math.cos(0.42)); if (am) callout(ctx, am[0], am[1], am[0] + 80, am[1] - 160, 'AMPHITHEATRE', null, smooth(1.6, 2.8, lt)); } });
  add({ id: '11F', at: T('S11', 5), set: 'atrium', tag: FIC, tin: ['dissolve', 0.6], amb: 'room', desc: 'Match dissolve: a ruined, roofless atrium fills back in with colour, roof and the family: the room as it was.',
    sfx: [[2.0, 'shimmer', 0.5]],
    draw: (ctx, lt, d, t, IMG, W, H) => { const cam = { pos: [0, 1.6, K(lt, [[0, -1.5], [d, 1.0]])], yaw: 0, pitch: 0.08, fov: 58 }; const k = smooth(1.5, 4.5, lt);
      drawAtrium(ctx, W, H, t, { cam, lk: look('modern'), ruin: 1 }); if (k > 0) { ctx.save(); ctx.globalAlpha = k; drawAtrium(ctx, W, H, t, { cam, lk: look('golden'), people: [{ spec: CHAR.livia, x: -1.4, z: 8.4, view: 'front', face: 1 }, { spec: CHAR.julia, x: -0.6, z: 8, view: 'front', face: 1 }, { spec: CHAR.marcus, x: 1.2, z: 8.8, view: '3q', face: -1 }] }); ctx.restore(); } } });

  // ================================================================ S12 THE FINAL REFLECTION
  add({ id: '12A', at: T('S12'), set: 'street', tag: FIC, tin: ['dissolve', 1.0], amb: 'street_evening', desc: 'Sunset in the reconstructed street: the family walks home toward the camera with Gaius; warm light, long shadows.',
    draw: (ctx, lt, d, t, IMG, W, H) => drawStreet(ctx, W, H, t, { cam: { pos: [0.3, 1.6, K(lt, [[0, 2], [d, 0.5]])], yaw: 0.02, pitch: 0.05, fov: 50 }, lk: look('sunset'), crowd: 0.35, crowdT: t, dust: 0.8, shutters: 0.2,
      people: fam(0, K(lt, [[0, 18], [d, 7.5]]), { view: '3q', face: -1, walk: 1, phase: lt * 0.85, julia: { view: 'front' }, livia: { view: 'front' } }) }) });
  add({ id: '12B', at: T('S12', 2), set: 'aerial', tag: REC, tin: ['dissolve', 0.8], amb: 'evening', desc: 'Aerial pull-back at sunset toward the single-peaked Vesuvius.',
    draw: (ctx, lt, d, t, IMG, W, H) => drawAerial(ctx, W, H, t, { cam: { pos: K(lt, [[0, [400, 380, -1400]], [d, [1300, 900, -3600]]]), yaw: -0.22, pitch: -0.18, fov: 44 }, lk: look('sunset') }) });
  add({ id: '12C', at: T('S12', 3), set: 'aerial', tag: 'PRESENT DAY · ILLUSTRATION', tin: ['dissolve', 2.0], amb: 'evening', desc: 'The same view today: roofless ruins, the twin-peaked mountain.',
    draw: (ctx, lt, d, t, IMG, W, H) => drawAerial(ctx, W, H, t, { cam: { pos: K(lt, [[0, [1300, 900, -3600]], [d, [1000, 700, -2600]]]), yaw: -0.22, pitch: -0.2, fov: 44 }, lk: look('sunset', 'modern', 0.2), ruin: 1, mountain: 'modern', green: 1, bury: 0.2 }) });
  add({ id: '12D', at: T('S12', 4), set: 'street', tag: 'PRESENT DAY · ILLUSTRATION', tin: ['dissolve', 0.8], amb: 'evening', desc: 'Slow push into a ruined street at golden hour: "human stories waiting to be uncovered".',
    draw: (ctx, lt, d, t, IMG, W, H) => drawStreet(ctx, W, H, t, { cam: { pos: [0.2, 1.65, K(lt, [[0, 2], [d, 6]])], yaw: 0, pitch: 0.06, fov: 50 }, lk: look('sunset'), ruin: 1, vesuvius: { kind: 'modern' }, dust: 0.6 }) });
  add({ id: '12E', at: T('S12', 5), set: 'title', tag: null, tin: ['dip', 0.8], amb: 'evening', desc: '"This was Pompeii.": gold stamp over the darkened aerial.',
    sfx: [[0.1, 'boom', 0.5]],
    draw: (ctx, lt, d, t, IMG, W, H) => { drawAerial(ctx, W, H, t, { cam: { pos: [1300, 900, -3600], yaw: -0.22, pitch: -0.12, fov: 44 }, lk: look('sunset', 'dark', 0.5) }); ctx.fillStyle = 'rgba(8,5,3,0.45)'; ctx.fillRect(0, 0, W, H); stamp(ctx, W, H, 'Pompeii', smooth(0, 1, lt), 0, { size: 170, sub: 'AD 79' }); } });
  add({ id: '12F', at: T('S12', 6, -0.2), set: 'end', tag: null, tin: ['dissolve', 0.8], amb: 'end', desc: 'End card: Buried Chronicles medallion and wordmark.',
    sfx: [[0.3, 'bell', 0.5]],
    draw: (ctx, lt, d, t, IMG, W, H) => endCard(ctx, W, H, t, { k: smooth(0, 3, lt) }) });

  // timing: each shot ends where the next begins
  for (let i = 0; i < sh.length; i++) { sh[i].t0 = sh[i].at; sh[i].t1 = i + 1 < sh.length ? sh[i + 1].at : TL.duration; }
  return sh;
}
function bumpy(lt, c) { return Math.max(0, 1 - Math.abs(lt - c) / 1.5); }

// Chapter cards + main title (absolute times), read by film.js
export function overlays(TL) {
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return TL.scenes.slice(1).map((s, i) => ({ t0: s.start + 0.5, t1: s.start + 5.0, num: roman[i + 1], title: s.title }));
}
