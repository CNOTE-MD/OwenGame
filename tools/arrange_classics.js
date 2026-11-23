// Arranges freely usable music for the game's band and writes music/classics.json.
//
// Two kinds of source, both in music/midi/ and credited in music/CLASSICS.md:
//
// 1. Public-domain keyboard scores from the Mutopia Project (mutopiaproject.org), each marked Public
//    Domain there: Grieg, Bach, Beethoven. The band plays them like this: the top of the upper staff
//    is the melody, the low notes of the lower staves are the bass line, what is left is the chords,
//    and a drum part is written on the score's own beat grid. Each piece is cut into four-bar blocks
//    and every block is given a level (0 quiet, 1 medium, 2 loud) that picks the instruments and the
//    drum pattern, so the band follows the shape of the piece. Loud blocks also play the melody in
//    octaves and add a second chord instrument.
//
// 2. Original rock and metal tracks from OpenGameArt.org whose composers dedicated them to the
//    public domain (CC0). These are already written for a band (guitars, bass, drums), so they go
//    through the same General MIDI mapping the game uses for a player's own files (midiToSong in
//    web/src/mymusic.js).
//
// Run after a build:  NODE_PATH=$(npm root -g) node tools/arrange_classics.js
// then rebuild:       python3 tools/build_web.py
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');

// instruments, as indexes into the game's band (MYM_INST in web/src/mymusic.js)
const BASS = 0, GTR = 1, LEAD = 2, PAD = 3, PLUCK = 4, BELL = 5, FLUTE = 6, PIANO = 7, CHOIR = 8;
// drum sounds (MYM_DRUM): kick, snare, rim, hat, open hat, crash, toms
const K = 0, S = 1, RIM = 2, H = 3, C = 5;

const PIECES = [
  { id: 'grieg_king', file: 'grieg_mountain_king.mid', name: 'In the Hall of the Mountain King', work: 'Peer Gynt Suite No. 1, Op. 46 No. 4', mutopia: 1888, gain: 0.8,
    stages: [[0, 0], [6, 1], [12, 2]],
    levels: [{ lead: PLUCK, chords: PLUCK, drums: 'tick' }, { lead: LEAD, chords: PIANO, drums: 'kick' }, { lead: LEAD, chords: GTR, also: PIANO, octave: true, drums: 'rock' }] },
  { id: 'grieg_trolls', file: 'grieg_troldtog.mid', name: 'March of the Trolls', work: 'Lyric Pieces, Op. 54 No. 3 (Troldtog)', mutopia: 2014, gain: 0.8, speed: 1.12, fight: true,
    stages: [[0, 1], [7, 2], [14, 1], [17, 0], [31, 1], [38, 2], [45, 1]],
    levels: [{ lead: FLUTE, chords: PAD, drums: 'none' }, { lead: PLUCK, chords: PIANO, drums: 'march1' }, { lead: LEAD, chords: GTR, also: PIANO, octave: true, drums: 'march2' }] },
  { id: 'grieg_wedding', file: 'grieg_troldhaugen.mid', name: 'Wedding Day at Troldhaugen', work: 'Lyric Pieces, Op. 65 No. 6', mutopia: 781, gain: 0.8, blocks: 14,
    stages: [[0, 1], [8, 2]],
    levels: [{ lead: FLUTE, chords: PAD, drums: 'none' }, { lead: PIANO, chords: PLUCK, drums: 'kick' }, { lead: LEAD, chords: PIANO, also: GTR, octave: true, drums: 'rock' }] },
  { id: 'grieg_mountaineer', file: 'grieg_mountaineer.mid', name: "The Mountaineer's Song", work: 'Lyric Pieces, Op. 73 No. 7 (Lualåt)', mutopia: 1628, gain: 0.9,
    stages: [[0, 0]],
    levels: [{ lead: FLUTE, chords: PAD, drums: 'none' }] },
  { id: 'grieg_aase', file: 'grieg_aases_death.mid', name: "Aase's Death", work: 'Peer Gynt Suite No. 1, Op. 46 No. 2', mutopia: 246, gain: 0.9, blocks: 6, minVel: 20,
    stages: [[0, 0]],
    levels: [{ lead: CHOIR, chords: PAD, drums: 'none' }] },
  { id: 'bach_toccata', file: 'bach_toccata_fugue.mid', name: 'Toccata and Fugue in D Minor', by: 'Johann Sebastian Bach', work: 'BWV 565 (the Toccata)', mutopia: 1780, gain: 0.9, blocks: 7,
    stages: [[0, 0]],
    levels: [{ lead: FLUTE, octave: true, chords: PAD, drums: 'none' }] },
  { id: 'beethoven_fifth', file: 'beethoven_fifth.mid', name: 'Symphony No. 5', by: 'Ludwig van Beethoven', work: 'Op. 67, first movement (the exposition)', mutopia: 497, gain: 0.8, blocks: 31, fight: true,
    dense: 34,
    levels: [{ lead: FLUTE, chords: PAD, drums: 'none' }, { lead: PIANO, chords: PLUCK, drums: 'alla1' }, { lead: LEAD, chords: GTR, also: PIANO, octave: true, drums: 'alla2' }] },
  // original tracks, dedicated to the public domain (CC0) by their composers
  { id: 'rock_endless', band: true, file: 'cc0_nene_endless_pain.mid', name: 'Endless Pain of Nightmares', by: 'nene', source: 'OpenGameArt.org, "Endless Pain of Nightmares" by nene (CC0)', gain: 0.75, blocks: 28, fight: true },
  { id: 'rock_fight', band: true, file: 'cc0_r0rque_fight_harder.mid', name: 'Fight Harder... To Obtain a Better Victory!', by: 'R0rque', source: 'OpenGameArt.org, "Double Impact MIDI Pack" (CC0)', gain: 0.75, fight: true },
  { id: 'rock_liberate', band: true, file: 'cc0_continuum_liberate_the_stars.mid', name: 'Liberate the Stars', by: 'continuum.mid', source: 'OpenGameArt.org, "Double Impact MIDI Pack" (CC0)', gain: 0.8, fight: true, pianoBass: true },
  { id: 'rock_andromeda', band: true, file: 'cc0_zemystic_andromeda.mid', name: 'Andromeda', by: 'ZeMystic', source: 'OpenGameArt.org, "Double Impact MIDI Pack" (CC0)', gain: 0.8 },
];

function arrange(parsed, st) {
  const speed = st.speed || 1, bpb = parsed.sig[0] * 4 / parsed.sig[1], blk = bpb * 4;      // quarter-note beats per bar, per block
  const beatSec = q => { const i = Math.min(parsed.beats.length - 2, Math.max(0, Math.floor(q))); return (parsed.beats[i] + (q - i) * (parsed.beats[i + 1] - parsed.beats[i])) / speed; };
  const endBeat = st.blocks ? st.blocks * blk : Math.ceil(Math.max(...parsed.notes.map(n => n.b + 0.01)) / bpb) * bpb;
  // a level per block: listed by hand (stages), or by how busy the block is when the score has no dynamics (dense)
  const busy = []; if (st.dense) for (const n of parsed.notes) { const i = Math.floor(n.b / blk); busy[i] = (busy[i] || 0) + 1; }
  const levelAt = b => {
    if (st.dense) { const i = Math.floor(b / blk); return st.levels[i === 0 || (busy[i] || 0) >= st.dense ? 2 : 1]; }
    let l = st.stages[0][1]; for (const [from, lv] of st.stages) if (b >= from * blk) l = lv; return st.levels[Math.min(l, st.levels.length - 1)];
  };
  const notes = parsed.notes.filter(n => n.b < endBeat && n.vel >= (st.minVel || 0)).sort((a, b) => a.b - b.b || a.note - b.note);
  const rh = Math.min(...notes.map(n => n.tr));
  // one entry per moment: what each hand plays there
  const at = new Map();
  for (const n of notes) { const k = Math.round(n.b * 48); let o = at.get(k); if (!o) at.set(k, o = { b: n.b, r: [], l: [] }); (n.tr === rh ? o.r : o.l).push(n); }
  const moments = [...at.values()].sort((a, b) => a.b - b.b);
  const out = [], ms = b => Math.round(beatSec(b) * 1000), dur = n => Math.round(Math.min(2.5, n.d / speed) * 1000);
  const fold = (n, lo, hi) => { while (n > hi) n -= 12; while (n < lo) n += 12; return n; };
  let lastLead = null, lastBass = null;
  for (const m of moments) {
    const lv = levelAt(m.b), t = ms(m.b), rest = [];
    // melody: the top of the right hand, kept in a range a lead can sing
    if (m.r.length) {
      const top = m.r[m.r.length - 1];
      if (lastLead && lastLead[0] + lastLead[1] > t) lastLead[1] = Math.max(40, t - lastLead[0]);
      const mel = fold(top.note, 47, 96);
      lastLead = [t, dur(top), lv.lead, mel]; if (lv.octave && mel + 12 <= 98) lastLead.push(mel + 12);   // loud blocks: the melody in octaves
      out.push(lastLead);
      rest.push(...m.r.slice(0, -1));
    }
    // bass: the bottom of the left hand when it is low enough to be a bass note
    if (m.l.length && m.l[0].note <= 55) {
      const low = m.l[0];
      if (lastBass && lastBass[0] + lastBass[1] > t) lastBass[1] = Math.max(40, t - lastBass[0]);
      lastBass = [t, Math.min(1400, dur(low)), BASS, fold(low.note, 28, 50)]; out.push(lastBass);
      rest.push(...m.l.slice(1));
    } else rest.push(...m.l);
    // chords: whatever is left, at most three notes (two for the distorted guitar)
    if (rest.length) {
      const ns = [...new Set(rest.map(n => n.note))].sort((a, b) => a - b), max = lv.chords === GTR ? 2 : 3;
      const kept = (lv.chords === GTR ? ns.slice(0, max) : ns.slice(-max)).map(n => fold(n, 40, 88));
      out.push([t, Math.max(...rest.map(dur)), lv.chords, ...new Set(kept)]);
      if (lv.also !== undefined) { const k2 = (lv.also === GTR ? ns.slice(0, 2) : ns.slice(-3)).map(n => fold(n, 40, 88)); out.push([t, Math.max(...rest.map(dur)), lv.also, ...new Set(k2)]); }   // loud blocks: a second chord instrument
    }
  }
  out.sort((a, b) => a[0] - b[0]);
  // drums, written on the score's own beats
  const d = [], hit = (q, kind, acc) => d.push([ms(q), kind, acc ? 1 : 0]);
  for (let bar = 0; bar * bpb < endBeat; bar++) {
    const q0 = bar * bpb, pat = levelAt(q0).drums, first = q0 > 0 && levelAt(q0) !== levelAt(q0 - bpb);
    if (pat === 'none') continue;
    if (pat === 'tick') { for (let q = 0; q < bpb; q++) hit(q0 + q, RIM); continue; }
    if (first && (pat === 'rock' || pat === 'march2')) hit(q0, C, true);
    if (pat === 'kick') { for (let q = 0; q < bpb; q++) { if (q % 2 === 0) hit(q0 + q, K); hit(q0 + q, H); } continue; }
    if (pat === 'rock') { for (let q = 0; q < bpb; q++) { hit(q0 + q, q % 2 ? S : K, q % 2 === 1); hit(q0 + q, H); hit(q0 + q + 0.5, H); } continue; }
    if (pat === 'alla1') { if (bar % 2 === 0) hit(q0, K); for (let q = 0; q < bpb; q++) hit(q0 + q, H); continue; }                 // one beat to the bar: kick every other bar
    if (pat === 'alla2') { if (first) hit(q0, C, true); hit(q0, bar % 2 ? S : K, bar % 2 === 1); for (let q = 0; q < bpb; q++) hit(q0 + q, H); continue; }   // kick, snare, bar by bar
    if (pat === 'march1') { hit(q0, K); for (let q = 0; q < bpb; q += 0.5) hit(q0 + q, H); continue; }
    if (pat === 'march2') { for (let q = 0; q < bpb; q++) { hit(q0 + q, q % 2 ? S : K, q % 2 === 1); hit(q0 + q, H); hit(q0 + q + 0.5, H); } }
  }
  d.sort((a, b) => a[0] - b[0]);
  return { name: st.name, bpm: Math.round(parsed.bpm * speed), len: +beatSec(endBeat).toFixed(3), gain: st.gain || 0.85, n: out, d };
}

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage();
  await pg.goto('file://' + path.join(ROOT, 'web/index.html'));
  await pg.waitForFunction(() => typeof parseMidi === 'function');
  const out = {};
  for (const st of PIECES) {
    const bytes = [...fs.readFileSync(path.join(ROOT, 'music/midi', st.file))];
    let song;
    if (st.band) {
      song = await pg.evaluate(([bytes, st]) => {
        const p = parseMidi(new Uint8Array(bytes).buffer), blk = p.sig[0] * 4 / p.sig[1] * 4;
        const cut = st.blocks ? st.blocks * blk : Infinity;
        p.notes = p.notes.filter(n => n.b < cut);
        if (st.pianoBass) for (const n of p.notes) if (n.ch !== 9 && n.prog <= 7 && n.note <= 50) n.prog = 33;   // no bass player in the file: the piano's low notes are the bass line
        const s = midiToSong(p, st.name);
        if (st.blocks) s.len = +(p.beats[Math.min(p.beats.length - 1, cut)] - Math.min(...p.notes.map(n => n.t))).toFixed(3);   // loop on a bar line
        return { ...s, gain: st.gain || 0.8 };
      }, [bytes, st]);
    } else {
      const parsed = await pg.evaluate(bytes => parseMidi(new Uint8Array(bytes).buffer), bytes);
      song = arrange(parsed, st);
    }
    out[st.id] = { ...song, by: st.by || 'Edvard Grieg', work: st.work || '', source: st.source || `Mutopia Project, piece ${st.mutopia} (Public Domain)`, fight: !!st.fight };
    console.log(st.id.padEnd(18), `${song.n.length} notes, ${song.d.length} drum hits, ${Math.round(song.len)} s, ${song.bpm} bpm`);
  }
  await b.close();
  const file = path.join(ROOT, 'music/classics.json');
  fs.writeFileSync(file, JSON.stringify(out));
  console.log(file, fs.statSync(file).size, 'bytes');
})();
