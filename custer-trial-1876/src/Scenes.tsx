import React from 'react';
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from 'remotion';
import { BattleMap } from './BattleMap';
import { Card, Chapter, Exhibit, Label, Shot, Title } from './Doc';
import { Particles } from './kit';
import { C, HEAD, SCENES, SERIF, TYPE, ease, lin, wf } from './theme';

type ShotDef =
  | { at: number; clip: string }
  | { at: number; card: string; caption: string; credit: string; name?: string; sub?: string; wide?: boolean }
  | { at: number; map: true };
const A = (k: string) => `assets/archival/${k}.jpg`;
const PD = 'public domain';

// Shots per scene; `at` is the fraction of the scene where the shot starts.
const SHOTS: Record<number, ShotDef[]> = {
  1: [{ at: 0, clip: 'c01_chicago' }],
  2: [{ at: 0, clip: 'c02_court' }],
  3: [{ at: 0, clip: 'c03b_reno' }, { at: 0.5, card: A('reno'), caption: 'Major Marcus A. Reno, 7th U.S. Cavalry', credit: PD, name: 'Maj. Marcus Reno', sub: 'THE DEFENDANT' }],
  4: [{ at: 0, card: A('nyt'), caption: 'The New York Times, July 6, 1876', credit: PD, wide: true }, { at: 0.55, clip: 'c04_papers' }],
  6: [{ at: 0, clip: 'c05_markers' }],
  7: [{ at: 0, clip: 'c06_jury' }],
  8: [{ at: 0, card: A('custer'), caption: 'George Armstrong Custer, 1865', credit: 'Library of Congress · ' + PD, name: 'George A. Custer', sub: 'LAST IN HIS CLASS · GENERAL AT 23' }, { at: 0.55, clip: 'c07_general' }],
  9: [{ at: 0, clip: 'c07_general' }, { at: 0.45, clip: 'c13_column' }],
  12: [{ at: 0, card: A('reno'), caption: 'Major Marcus A. Reno', credit: PD, name: 'Marcus Reno', sub: "CUSTER'S SECOND IN COMMAND" }],
  13: [{ at: 0, clip: 'c10_expedition' }, { at: 0.62, clip: 'c11_gold' }],
  14: [{ at: 0, clip: 'c12_council' }],
  15: [{ at: 0, clip: 'c13_column' }],
  17: [{ at: 0, card: A('terry'), caption: 'Brigadier General Alfred Terry', credit: PD, name: 'Gen. Alfred Terry', sub: 'OFFERED THE GATLING GUNS' }, { at: 0.42, clip: 'c14_gatling' }],
  18: [{ at: 0, clip: 'c15_ravine' }],
  19: [{ at: 0, clip: 'c16_agency' }],
  20: [{ at: 0, clip: 'c17_village' }],
  21: [{ at: 0, clip: 'c18_scouts' }],
  22: [{ at: 0, clip: 'c19_custer_back' }],
  23: [{ at: 0, map: true }],
  25: [{ at: 0, clip: 'c20_charge' }],
  26: [{ at: 0, clip: 'c21_skirmish' }],
  27: [{ at: 0, card: A('bloodyknife'), caption: 'Bloody Knife, Arikara scout, 1873', credit: 'National Archives · ' + PD }, { at: 0.3, clip: 'c22_timber' }, { at: 0.62, clip: 'c23_bluffs' }],
  29: [{ at: 0, clip: 'c24_witness' }],
  30: [{ at: 0, clip: 'c25_trumpeter' }],
  31: [{ at: 0, card: A('note'), caption: "Lt. William W. Cooke's note to Benteen, June 25, 1876", credit: PD }],
  32: [{ at: 0, card: A('benteen'), caption: 'Captain Frederick W. Benteen', credit: PD, name: 'Capt. Frederick Benteen', sub: '"COME ON. BE QUICK."' }, { at: 0.5, clip: 'c26_hill' }],
  34: [{ at: 0, clip: 'c27_riders' }, { at: 0.5, clip: 'c56_elder' }],
  35: [{ at: 0, card: A('sittingbull'), caption: 'Sitting Bull (Tatanka Iyotake), Hunkpapa Lakota, c. 1883', credit: 'photo: D. F. Barry · ' + PD, name: 'Sitting Bull', sub: 'HUNKPAPA LAKOTA LEADER' }, { at: 0.6, clip: 'c28_dawn_tipi' }],
  36: [{ at: 0, card: A('gall'), caption: 'Gall (Pizi), Hunkpapa Lakota war leader, 1880s', credit: PD, name: 'Gall', sub: 'LAKOTA WAR LEADER' }, { at: 0.55, clip: 'c29_horseman' }],
  37: [{ at: 0, card: A('redhorse1'), caption: 'Red Horse, Minneconjou Lakota: drawing of the battle, 1881', credit: 'Smithsonian · ' + PD, wide: true }],
  38: [{ at: 0, clip: 'c31_dust' }],
  40: [{ at: 0, card: A('redhorse3'), caption: "Red Horse's drawing of the fallen soldiers, 1881", credit: 'Smithsonian · ' + PD, wide: true }, { at: 0.5, clip: 'c05_markers' }],
  42: [{ at: 0, clip: 'c33_weir' }],
  43: [{ at: 0, clip: 'c34_relief' }, { at: 0.42, clip: 'c55_water' }],
  44: [{ at: 0, clip: 'c36_testimony' }],
  46: [{ at: 0, clip: 'c37_verdict' }],
  47: [{ at: 0, clip: 'c38_barracks' }],
  48: [{ at: 0, clip: 'c39_alone' }],
  50: [{ at: 0, clip: 'c40_honors' }],
  51: [{ at: 0, clip: 'c06_jury' }],
  52: [{ at: 0, card: A('custer'), caption: 'Custer', credit: '' }, { at: 0.3, card: A('reno'), caption: 'Reno', credit: '' }, { at: 0.5, card: A('benteen'), caption: 'Benteen', credit: '' }, { at: 0.72, clip: 'c10_expedition' }],
  53: [{ at: 0, clip: 'c27_riders' }, { at: 0.55, clip: 'c42_hills' }],
  55: [{ at: 0, clip: 'c02_court' }],
  5: [{ at: 0, clip: 'c45_writer' }],
  10: [{ at: 0, clip: 'c46_washita' }],
  11: [{ at: 0, card: A('benteen'), caption: 'Captain Frederick W. Benteen', credit: PD, name: 'Capt. Frederick Benteen', sub: 'HE NEVER FORGAVE CUSTER' }],
  16: [{ at: 0, clip: 'c48_rosebud' }],
  24: [{ at: 0, map: true }],
  28: [{ at: 0, clip: 'c49_packer' }],
  33: [{ at: 0, clip: 'c50_packtrain' }],
  39: [{ at: 0, clip: 'c51_archaeology' }],
  41: [{ at: 0, card: A('comanche'), caption: "Comanche, Captain Myles Keogh's horse, 1887", credit: 'photo: John C. H. Grabill · Library of Congress · ' + PD, wide: true }, { at: 0.55, clip: 'c52_comanche' }],
  45: [{ at: 0, clip: 'c02_court' }],
  49: [{ at: 0, card: A('libbie'), caption: 'Elizabeth Bacon Custer', credit: 'Brady-Handy collection · ' + PD, name: 'Elizabeth "Libbie" Custer', sub: '57 YEARS DEFENDING HIM' }, { at: 0.5, clip: 'c53_widow' }],
  54: [{ at: 0, clip: 'c54_memorial' }],
};

/* Overlays per scene (labels, exhibits, titles). */
const Overlay: React.FC<{ n: number; frames: number }> = ({ n, frames }) => {
  const f = useCurrentFrame();
  switch (n) {
    case 1: return (<><Particles kind="snow" n={110} o={0.8} /><Label text="CHICAGO · JANUARY 13, 1879" at={6} /></>);
    case 2: return <Label text="THE RENO COURT OF INQUIRY" sub="Palmer House hotel, Chicago" at={10} />;
    case 6: return <Label text="LITTLE BIGHORN, MONTANA" sub="June 25–26, 1876" at={12} />;
    case 7: return <Title at={wf(7, 'jury') - 6} text="THE TRIAL AFTER LITTLE BIGHORN" sub="Who really lost Custer's battle?" />;
    case 8: return <Chapter n="I" title="The Dead Man" />;
    case 13: return <Label text="BLACK HILLS, 1874" sub="Land promised to the Lakota by the 1868 treaty" at={8} />;
    case 17: return (<><Chapter n="II" title="The Evidence" /><Exhibit letter="A" title="THE GATLING GUNS" at={wf(17, 'exhibit')} /></>);
    case 19: return <Exhibit letter="B" title={'"NO MORE THAN 800 WARRIORS"'} at={wf(19, 'exhibit')} />;
    case 20: return <Label text="THE VILLAGE: THOUSANDS OF PEOPLE" sub="1,100–2,500 warriors (estimates)" at={wf(20, 'thousands') - 6} />;
    case 21: return <Exhibit letter="C" title="THE CROW'S NEST · DAWN, JUNE 25" at={wf(21, 'exhibit')} />;
    case 23: return <Exhibit letter="D" title="THE SPLIT" at={wf(23, 'exhibit')} />;
    case 25: return <Chapter n="III" title="The Battle" />;
    case 30: return <Exhibit letter="E" title="THE LAST MESSAGE" at={wf(30, 'exhibit')} />;
    case 31: return (
      <div style={{ position: 'absolute', right: 120, top: 360, width: 560, fontFamily: TYPE, fontWeight: 700, fontSize: 40, lineHeight: 1.5, color: '#f2ead8', opacity: lin(f, 10, 24), textShadow: '0 2px 10px #000' }}>
        Benteen.<br />Come on. Big Village.<br />Be quick. Bring packs.<br /><span style={{ color: C.gold }}>P.S. Bring packs.</span>
      </div>);
    case 34: return <Chapter n="IV" title="The Witnesses" />;
    case 36: return <Label text="CRAZY HORSE" sub="No confirmed photograph of him exists" at={wf(36, 'crazy', 1) - 4} />;
    case 42: return <Label text="WEIR POINT" sub="Afternoon, June 25" at={10} />;
    case 44: return <Chapter n="V" title="The Verdict" />;
    case 46: return (
      <div style={{ position: 'absolute', left: 260, right: 260, top: 300, textAlign: 'center', opacity: lin(f, wf(46, 'quote') - 6, wf(46, 'quote') + 6) }}>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 54, lineHeight: 1.3, color: '#f4ecda', textShadow: '0 4px 24px #000' }}>“The suspicion or accusation that Gen. Custer owed his death … to the failure of Major Reno … is considered as set to rest.”</div>
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 24, color: C.gold, marginTop: 20, textShadow: '0 2px 10px #000' }}>JUDGE ADVOCATE GENERAL W. M. DUNN · FEBRUARY 21, 1879</div>
      </div>);
    case 50: return <Label text="1967" sub="Reno reburied with honors at Custer National Cemetery" at={wf(50, 'reburied') - 6} />;
    case 55: {
      const names = ['CUSTER', 'RENO', 'BENTEEN', 'WASHINGTON'];
      const st = wf(55, 'guilty') - 10;
      return (
        <AbsoluteFill style={{ background: `rgba(0,0,0,${0.55 * lin(f, st - 10, st)})` }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 200, textAlign: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: 110, color: '#f4ecda', opacity: lin(f, st, st + 12), textShadow: '0 6px 30px #000' }}>WHO'S GUILTY?</div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 420, display: 'flex', justifyContent: 'center', gap: 34 }}>
            {names.map((t, i) => (
              <div key={t} style={{ opacity: lin(f, st + 10 + i * 6, st + 18 + i * 6), padding: '16px 34px', background: '#efe6d2', borderTop: `8px solid ${C.redHi}`, fontFamily: HEAD, fontWeight: 700, fontSize: 52, color: '#1d1b19', boxShadow: '0 12px 30px rgba(0,0,0,0.6)' }}>{t}?</div>
            ))}
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 600, textAlign: 'center', opacity: lin(f, wf(55, 'subscribe') - 6, wf(55, 'subscribe') + 6) }}>
            <span style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 36, letterSpacing: 4, color: '#fff', background: C.redHi, padding: '12px 30px' }}>SUBSCRIBE · BURIED CHRONICLES</span>
          </div>
        </AbsoluteFill>);
    }
    case 5: return <Label text="FREDERICK WHITTAKER" sub="A Complete Life of Gen. George A. Custer, 1876" at={20} />;
    case 10: return <Label text="WASHITA RIVER · NOVEMBER 1868" at={wf(10, 'washita') - 4} />;
    case 16: return <Label text="ROSEBUD CREEK · JUNE 17, 1876" at={8} />;
    case 24: return <Exhibit letter="D" title="THE SPLIT · PROSECUTION vs DEFENSE" at={0} />;
    case 28: return <Label text="TESTIMONY · CHICAGO, 1879" sub="A civilian packer: Reno had been drinking" at={10} />;
    case 33: return <Label text="THE PACK TRAIN" sub="Reserve ammunition, on mules" at={10} />;
    case 39: return <Label text="1984 · ARCHAEOLOGICAL SURVEY" sub="After the 1983 grass fire" at={wf(39, 'archaeologists') - 4} />;
    case 45: return (
      <div style={{ position: 'absolute', left: 260, right: 260, top: 330, textAlign: 'center', opacity: lin(f, 20, 34) }}>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 52, lineHeight: 1.3, color: '#f4ecda', textShadow: '0 4px 24px #000' }}>“…there was nothing in his conduct which requires animadversion from this Court.”</div>
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 24, color: C.gold, marginTop: 20, textShadow: '0 2px 10px #000' }}>FINDINGS OF THE RENO COURT OF INQUIRY · 1879</div>
      </div>);
    case 54: return <Label text="1991" sub="Little Bighorn Battlefield National Monument" at={wf(54, '1991') - 4} />;
    default: return null;
  }
};

const SceneN: React.FC<{ n: number }> = ({ n }) => {
  const frames = SCENES[n - 1].frames + 10;
  const shots = SHOTS[n];
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {shots.map((s, i) => {
        const from = Math.round(s.at * SCENES[n - 1].frames);
        const to = i < shots.length - 1 ? Math.round(shots[i + 1].at * SCENES[n - 1].frames) + 10 : frames;
        const dur = to - from;
        return (
          <Sequence key={i} from={from} durationInFrames={dur} name={`s${n}.${i}`}>
            <XFade first={i === 0}>
              {'clip' in s ? <Shot id={s.clip} dur={dur} /> : 'map' in s ? null : <Card src={s.card} caption={s.caption} credit={s.credit} dur={dur} name={s.name} sub={s.sub} wide={s.wide} side={s.name ? 'left' : 'center'} />}
            </XFade>
          </Sequence>
        );
      })}
      {n === 23 && <MapRoutes />}
      {n === 24 && <BattleMap dur={SCENES[23].frames} benteen={1} reno={1} custer={1} />}
      <Overlay n={n} frames={frames} />
    </AbsoluteFill>
  );
};
const XFade: React.FC<{ first: boolean; children: React.ReactNode }> = ({ first, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: first ? 1 : interpolate(f, [0, 10], [0, 1], { extrapolateRight: 'clamp' }) }}>{children}</AbsoluteFill>;
};
const MapRoutes: React.FC = () => {
  const f = useCurrentFrame();
  const be = wf(23, 'benteen'), re = wf(23, 'reno'), cu = wf(23, 'custer', 1);
  return <BattleMap dur={SCENES[22].frames} benteen={ease(f, be, be + 60)} reno={ease(f, re, re + 90)} custer={ease(f, cu, cu + 110)} />;
};

export const SCENE_COMPS = Array.from({ length: 55 }, (_, i) => { const C2: React.FC = () => <SceneN n={i + 1} />; return C2; });
