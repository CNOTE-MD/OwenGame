// Music that is free to use, played by the game's band beside the game's own songs. Nothing here is
// a copyrighted song: the sources, licenses and credits are in music/CLASSICS.md, the files are in
// music/midi/, and tools/arrange_classics.js arranges them into music/classics.json.
//
// Public-domain classics (scores from the Mutopia Project):
//   the Hidden Cave ................ Grieg, In the Hall of the Mountain King
//   mini-bosses .................... Grieg, March of the Trolls (the Penguin Knight, the Draugr Captain)
//   Baron Blubber's Sauna .......... Grieg, Wedding Day at Troldhaugen
//   the bell crypt ................. Grieg, The Mountaineer's Song
//   GAME OVER ...................... Grieg, Aase's Death
//   the palace lobby, once "dead Chilly" is lying in it ... Bach, Toccata and Fugue in D minor
//   Valhalla Arena, waves 9 to 12 .. Beethoven, Symphony No. 5
// Original rock and metal, dedicated to the public domain (CC0) by their composers on OpenGameArt:
//   Valhalla Arena, waves 5 to 8 ... nene, Endless Pain of Nightmares
//   Valhalla Arena, waves 13 to 16 . R0rque, Fight Harder... To Obtain a Better Victory!
//   Valhalla Arena, waves 17 to 20 . continuum.mid, Liberate the Stars
//   the Arena's shop ............... ZeMystic, Andromeda
// Owen's bands keep every place they already had in the story, and the bosses keep their music.
const CLASSIC_IDS = Object.keys(CLASSICS);
for (const id of CLASSIC_IDS) {
  const c = CLASSICS[id];
  mymRegister({ ...c, id });
  Music.cache[id].gain = c.gain;
  SCORE[id] = { name: c.name, bpm: c.bpm, by: c.by, work: c.work, fight: c.fight };
  if (!JUKE_ORDER.includes(id)) JUKE_ORDER.push(id);
}
// The Jukebox finds a song when it is heard. The Arena has no story save to remember that in, so
// songs heard there are remembered on their own.
const FOUND = { key: 'jontuka-found-songs', set: new Set() };
try { for (const id of JSON.parse(localStorage.getItem(FOUND.key) || '[]')) FOUND.set.add(id); } catch (e) {}
function songFound(id) { return flag('heard:' + id) || FOUND.set.has(id); }
function findSong(id) { if (FOUND.set.has(id)) return id; FOUND.set.add(id); try { localStorage.setItem(FOUND.key, JSON.stringify([...FOUND.set])); } catch (e) {} return id; }

const MINI_BOSSES = new Set(['knight', 'captain']);
const ARENA_SETS = ['arena', 'rock_endless', 'beethoven_fifth', 'rock_fight', 'rock_liberate'];   // four waves each
function classicFor(base) {
  if (G.state === 'over') return 'grieg_aase';
  if (!base || G.state === 'title' || G.state === 'credits' || G.state === 'cutscene' || (G.state === 'menu' && G.jukebox)) return base;
  if (G.mode === 'arena') {
    if (base === 'village') return findSong('rock_andromeda');                                       // the shop between waves
    if (base !== 'arena') return base;                                                             // boss waves keep the boss theme
    const id = ARENA_SETS[clamp(Math.floor((A.wave - 1) / 4), 0, ARENA_SETS.length - 1)];
    return id === 'arena' ? id : findSong(id);
  }
  if (!G.map) return base;
  if (base === 'boss') return G.ents.some(e => e.boss && e.alive && !MINI_BOSSES.has(e.type)) ? base : G.ents.some(e => e.alive && MINI_BOSSES.has(e.type)) ? 'grieg_trolls' : base;
  if (G.mapId === 'secret_cave') return 'grieg_king';
  if (G.mapId === 'sauna') return 'grieg_wedding';
  if (typeof inBellCrypt === 'function' && inBellCrypt()) return 'grieg_mountaineer';
  if (base === 'palace' && G.scr && G.scr.x === 1 && G.scr.y === 3 && flag('page10')) return 'bach_toccata';   // Chilly is part vampire. He gets the organ.
  return base;
}
