// Eight connected scenes. Timing is derived from the narration (each scene starts 0.3 s before its first line), so
// re-recording the voice re-times the film automatically. Edit titles/assets here; edit animation in src/scenes/.
import { SCENES } from '../theme';
export const STORYBOARD = [
  { n: 1, title: 'The Secret Plot', transition: 'none' },
  { n: 2, title: 'The Man Behind the Plot', transition: 'paper' },
  { n: 3, title: 'The Bomb', transition: 'red' },
  { n: 4, title: 'The Explosion', transition: 'none' },
  { n: 5, title: 'Operation Valkyrie', transition: 'paper' },
  { n: 6, title: 'The Failure', transition: 'red' },
  { n: 7, title: 'The Executions', transition: 'paper' },
  { n: 8, title: 'The Legacy', transition: 'red' },
].map((s) => ({ ...s, ...SCENES[s.n - 1] }));
export const ASSETS = {
  stauffenbergPortrait: 'assets/characters/stauffenberg.jpg', // public domain, c. 1934
  roomAfterBlast: 'assets/documents/room_after.jpg', // Bundesarchiv Bild 146-1972-025-10, CC BY-SA 3.0 DE
  briefingHut: 'assets/backgrounds/briefing_hut.jpg', wolfsLair: 'assets/backgrounds/wolfslair_forest.jpg',
  courtyard: 'assets/backgrounds/courtyard_night.jpg',
};
