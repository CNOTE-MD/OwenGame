// Jon remembers who he is. Walter carved runes into Jon, and each rune is also a song. When Owen
// finds one, Jon remembers that song: the outdoor music gains a layer, a beat marker joins the HUD,
// chops on the beat hit harder, and bosses start striking on the beat.

// which song each rune brings back (titles are the game's own homages)
const SONG_OF = { fire: 'aero', frost: 'cold', thunder: 'zep', mend: 'journey', leaf: 'chop' };
const SONG_LINES = {
  fire: 'Walk This Fjord! Da na na na! I KNEW I knew that one.',
  frost: 'Cold as fjooord... I remember this! It was carved right next to the frost.',
  thunder: 'Stairway to Valhalla. All of it. Every note. Astrid was right: I remember who I am.',
  mend: 'Don\'t stop choppin\'... hold on to that feeling. That one makes me feel better. Literally.',
  leaf: 'We will, we will, CHOP you! Stomp stomp clap. The plants are stomping along.',
};
function songsKnown() { const s = G.save; return s && G.mode !== 'arena' ? Object.keys(SONG_OF).filter(id => s.items[id]).length : 5; }

// ---- the outdoor music fills back in, one layer per song ----
// 0 songs: bass and kick, Jon's humming over a quiet world. 1: the full drum kit. 2: rhythm guitar
// and piano. 3: the lead melody. 4 and up: everything, choir and bells included.
const LAYERED = new Set(['overworld', 'cold', 'journey']);
function layerOn(e) {
  if (!LAYERED.has(Music.name) || G.mode === 'arena' || !G.save || G.state === 'title') return true;
  const n = songsKnown();
  if (e.inst === 'drum') return e.kind === 'k' || n >= 1;
  if (e.inst === 'bass' || e.inst === 'pad' || e.inst === 'pluck' || e.inst === 'flute') return true;
  if (e.inst === 'gtr' || e.inst === 'piano') return n >= 2;
  if (e.inst === 'lead') return n >= 3;
  return n >= 4;
}

// ---- the beat ----
// Read from the music engine's own clock, so the marker and the bonus match what you hear.
// With sound off, a steady 120 bpm clock keeps the beat visible.
function beatInfo() {
  const ac = Sound.ac, tr = Music.name && SCORE[Music.name];
  if (ac && Music.bus && tr && Music.on && !Sound.muted) {
    const q = 60 / tr.bpm, t = ac.currentTime - Music.start;
    const ph = ((t % q) + q) % q;
    return { q, ph, d: Math.min(ph, q - ph) };
  }
  const q = 0.5, ph = ((G.t % q) + q) % q;
  return { q, ph, d: Math.min(ph, q - ph) };
}
function onBeat(w) { return beatInfo().d <= (w || (isEasy() ? 0.12 : 0.09)); }
function beatHit(e) {
  floatText(e.x, e.y - 22, 'ON BEAT!', '#ffd84a');
  G.beatFlash = 0.12;
  Sound.tone([[1320, 0.04, 'square'], [1760, 0.06, 'square']], 0.035);
  if (G.save.items.thunder) G.save.rune = Math.min(RUNE_MAX, G.save.rune + 1);
}
// the HUD's beat marker: a note that pops on every beat once Jon knows a song
function drawBeatMarker() {
  if (G.mode === 'arena' || !G.save || songsKnown() < 1) return;
  const b = beatInfo(), k = 1 - Math.min(1, b.ph / (b.q * 0.5)), on = b.d <= 0.09;
  const x = 108, y = 12;
  if (on) { R(x - 5, y - 6, 11, 11, 'rgba(255,216,74,.35)'); }
  text('♪', x - 2, y + 4 - Math.round(k * 2), on ? '#ffd84a' : '#8a8ab0', 'left', 'outline');
  for (let i = 0; i < 5; i++) R(x - 4 + i * 3, y + 9, 2, 2, i < songsKnown() ? '#ffd84a' : 'rgba(255,255,255,.18)');
  if (G.beatFlash > 0) { G.beatFlash -= 1 / 60; ctx.globalAlpha = 0.25; R(0, 0, VW, VH, '#ffd84a'); ctx.globalAlpha = 1; }
}

// ---- the moment Jon remembers ----
function rememberSong(id) {
  const song = SONG_OF[id]; if (!song || flag('song:' + id)) return;
  setFlag('song:' + id); markHeard(song);
  const n = songsKnown(), name = SCORE[song].name.replace(/ \(.*\)$/, '');
  const layer = n === 1 ? 'The drums come back to the music of Norway.' : n === 2 ? 'The guitar and piano come back.' : n === 3 ? 'The melody comes back.' : n === 4 ? 'The choir and bells come back. Norway is loud again.' : 'Every song is back.';
  const lines = [['', `JON REMEMBERS A SONG: "${name}"`], ['Jon', SONG_LINES[id]], ['', layer]];
  if (n === 1) lines.push(['Jon', 'Feel that? Chop on the beat and I hit HARDER. Watch the little note up top.']);
  lines.paper = true;
  G.banner = '♪ ' + name.toUpperCase(); G.bannerT = 3; setJonFace('excited', 3);
  say(lines, writeSave);
}
const _giveItem = giveItem;
giveItem = function (id, after) {
  if (SONG_OF[id] && !flag('song:' + id) && G.mode !== 'arena') { const a = after; after = () => { if (a) a(); rememberSong(id); }; }
  return _giveItem(id, after);
};
MEMORIES.push({ id: 'songs', ok: () => songsKnown() >= 2 && songsKnown() < 5, line: () => `I remember ${songsKnown()} songs now. There are more runes out there. I can feel the gaps.` });
MEMORIES.push({ id: 'allsongs', ok: () => songsKnown() >= 5, line: () => 'All five songs. I remember EVERYTHING. Walter, the forge, the lake... mostly the lake.' });
