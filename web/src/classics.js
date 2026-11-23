// Five pieces by Edvard Grieg (1843-1907), Norway's own composer, played by the game's band.
// The notes are Grieg's and long out of copyright; the scores are public-domain MIDI files from the
// Mutopia Project (music/midi/grieg_*.mid, credits in music/CLASSICS.md); the band arrangement is
// made by tools/arrange_classics.js into music/classics.json. They sit beside the game's own music
// and only play where a place was borrowing a tune from somewhere else:
//   the Hidden Cave ............ In the Hall of the Mountain King
//   mini-bosses ................ March of the Trolls (the Penguin Knight, the Draugr Captain)
//   Baron Blubber's Sauna ...... Wedding Day at Troldhaugen
//   the bell crypt ............. The Mountaineer's Song
//   GAME OVER .................. Aase's Death
// Owen's bands keep every place they already had.
const CLASSIC_IDS = Object.keys(CLASSICS);
for (const id of CLASSIC_IDS) {
  const c = CLASSICS[id];
  mymRegister({ ...c, id });
  Music.cache[id].gain = c.gain;
  SCORE[id] = { name: c.name, bpm: c.bpm, by: c.by, work: c.work, fight: c.fight };
  if (!JUKE_ORDER.includes(id)) JUKE_ORDER.push(id);
}
const MINI_BOSSES = new Set(['knight', 'captain']);
function classicFor(base) {
  if (G.state === 'over') return 'grieg_aase';
  if (!base || G.mode === 'arena' || !G.map || G.state === 'title' || G.state === 'credits' || G.state === 'cutscene' || (G.state === 'menu' && G.jukebox)) return base;
  if (base === 'boss') return G.ents.some(e => e.boss && e.alive && !MINI_BOSSES.has(e.type)) ? base : G.ents.some(e => e.alive && MINI_BOSSES.has(e.type)) ? 'grieg_trolls' : base;
  if (G.mapId === 'secret_cave') return 'grieg_king';
  if (G.mapId === 'sauna') return 'grieg_wedding';
  if (typeof inBellCrypt === 'function' && inBellCrypt()) return 'grieg_mountaineer';
  return base;
}
