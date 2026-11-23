// MY MUSIC: bring your own MIDI files. Pick .mid files on this device (OWEN'S SCRIPT, "My music")
// and the game's own band plays them: its bass, guitars, lead, pads and drum kit. They show up at
// the top of the Jukebox and one can be set to play everywhere.
// The files never leave the device. They are kept in this browser's storage, not uploaded, and not
// part of the shared game, so the game itself ships only its own original music.

const MYM = { songs: [], keep: null, preview: null, status: '', KEY: 'jontuka-mymusic', MAX: 8, MAX_EV: 9000, MAX_SEC: 420, MAX_VOICES: 20 };
const MYM_INST = ['bass', 'gtr', 'lead', 'pad', 'pluck', 'bell', 'flute', 'piano', 'choir'];
const MYM_DRUM = ['k', 's', 'r', 'h', 'o', 'c', 'th', 'tm', 'tl'];

// ---------------- reading a Standard MIDI File ----------------
// Returns { notes: [{ t, d, ch, note, vel, prog, tr, b }] (t, d in seconds; tr = track; b = start in beats), bpm, sig, beats }.
// beats[k] is the time in seconds of quarter-note beat k, through every tempo change.
function parseMidi(buf) {
  const d = new DataView(buf); let p = 0;
  const tag = at => String.fromCharCode(d.getUint8(at), d.getUint8(at + 1), d.getUint8(at + 2), d.getUint8(at + 3));
  if (d.byteLength < 22) throw new Error('not a MIDI file');
  if (tag(0) === 'RIFF') { for (p = 12; p + 8 < d.byteLength && tag(p) !== 'MThd'; p++); }       // .rmi wraps a normal file
  if (tag(p) !== 'MThd') throw new Error('not a MIDI file');
  const hl = d.getUint32(p + 4), ntr = d.getUint16(p + 10), div = d.getUint16(p + 12); p += 8 + hl;
  if (div & 0x8000 || !div) throw new Error('this kind of MIDI timing is not supported');
  const raw = [], tempos = [{ tick: 0, us: 500000 }]; let sig = null;
  for (let tr = 0; tr < ntr && p + 8 <= d.byteLength; tr++) {
    const id = tag(p), len = d.getUint32(p + 4); p += 8;
    const end = Math.min(d.byteLength, p + len);
    if (id !== 'MTrk') { p = end; continue; }
    let tick = 0, run = 0; const on = {}, prog = new Array(16).fill(0);
    const vlq = () => { let v = 0, b; do { b = d.getUint8(p++); v = (v * 128) + (b & 0x7f); } while ((b & 0x80) && p < end); return v; };
    while (p < end) {
      tick += vlq(); if (p >= end) break;
      let st = d.getUint8(p);
      if (st & 0x80) { p++; if (st < 0xf0) run = st; } else st = run;                           // running status
      if (st === 0xff) { const type = d.getUint8(p++), l = vlq(); if (type === 0x51 && l === 3) tempos.push({ tick, us: (d.getUint8(p) << 16) | (d.getUint8(p + 1) << 8) | d.getUint8(p + 2) }); if (type === 0x58 && l >= 2 && !sig) sig = [d.getUint8(p), 1 << d.getUint8(p + 1)]; p += l; if (type === 0x2f) break; continue; }
      if (st === 0xf0 || st === 0xf7) { p += vlq(); continue; }
      if (st < 0x80) break;                                                                      // garbage: give up on this track
      const hi = st & 0xf0, ch = st & 0x0f;
      if (hi === 0xc0 || hi === 0xd0) { const v = d.getUint8(p++); if (hi === 0xc0) prog[ch] = v; continue; }
      const a = d.getUint8(p++), b = d.getUint8(p++), key = ch * 128 + a;
      if (hi === 0x90 && b > 0) (on[key] = on[key] || []).push({ tick, vel: b, prog: prog[ch] });
      else if (hi === 0x80 || hi === 0x90) { const q = on[key]; if (q && q.length) { const s = q.shift(); raw.push({ tick: s.tick, end: tick, ch, note: a, vel: s.vel, prog: s.prog, tr }); } }
    }
    for (const key in on) for (const s of on[key]) raw.push({ tick: s.tick, end: s.tick + div, ch: key >> 7, note: key & 127, vel: s.vel, prog: s.prog, tr });   // notes never switched off
    p = end;
  }
  // ticks to seconds, through every tempo change
  tempos.sort((a, b) => a.tick - b.tick);
  let sec = 0; const map = tempos.map((t, i) => { if (i) sec += (t.tick - tempos[i - 1].tick) * tempos[i - 1].us / 1e6 / div; return { tick: t.tick, sec, us: t.us }; });
  const toSec = tk => { let m = map[0]; for (const x of map) { if (x.tick <= tk) m = x; else break; } return m.sec + (tk - m.tick) * m.us / 1e6 / div; };
  const first = tempos.find(t => t.us > 0) || tempos[0];
  const last = raw.reduce((m, n) => Math.max(m, n.end), 0), beats = []; for (let k = 0; k * div <= last + div; k++) beats.push(toSec(k * div));
  return { sig: sig || [4, 4], beats, notes: raw.map(n => ({ t: toSec(n.tick), d: Math.max(0.03, toSec(n.end) - toSec(n.tick)), ch: n.ch, note: n.note, vel: n.vel, prog: n.prog, tr: n.tr, b: n.tick / div })), bpm: Math.round(6e7 / (tempos[tempos.length > 1 ? 1 : 0].us || first.us)) };
}

// ---------------- arranging it for the game's band ----------------
// General MIDI program number -> one of the band's instruments
function mymInst(prog, note) {
  if (prog >= 32 && prog <= 39) return 0;                                    // basses
  if (prog >= 29 && prog <= 31) return 1;                                    // overdrive, distortion, harmonics
  if (prog <= 7) return 7;                                                   // pianos
  if (prog <= 15) return 5;                                                  // chromatic percussion
  if (prog <= 23) return 3;                                                  // organs
  if (prog <= 28) return 4;                                                  // clean guitars
  if (prog >= 52 && prog <= 54) return 8;                                    // choirs and voices
  if (prog <= 51 || prog === 55) return 3;                                   // strings and ensembles
  if (prog <= 71) return 2;                                                  // brass and reeds
  if (prog <= 79) return 6;                                                  // flutes and pipes
  if (prog <= 87) return prog === 87 && note < 48 ? 0 : 2;                   // synth leads
  if (prog <= 95) return 3;                                                  // synth pads
  if (prog >= 112 && prog <= 119) return 5;                                  // bells and steel drums
  return 4;
}
// General MIDI drum key -> one of the kit's sounds
function mymDrum(note) {
  if (note === 35 || note === 36) return 0;
  if (note === 38 || note === 40 || note === 39) return 1;
  if (note === 37 || note === 31 || note === 32 || note === 56 || (note >= 75 && note <= 77)) return 2;   // rim, sticks, cowbell, claves, wood blocks
  if (note === 42 || note === 44 || note === 51 || note === 53 || note === 59 || note === 54 || note === 69 || note === 70 || note === 80 || note === 81 || note === 82) return 3;
  if (note === 46) return 4;
  if (note === 49 || note === 52 || note === 55 || note === 57) return 5;
  if (note === 48 || note === 50) return 6;
  if (note === 45 || note === 47) return 7;
  if (note === 41 || note === 43) return 8;
  return -1;
}
// Returns the compact song that is stored: { name, bpm, len, n: [[ms, dur ms, instrument, note...]], d: [[ms, drum, accent]] }
function midiToSong(parsed, name) {
  const notes = parsed.notes.filter(n => n.note >= 12 && n.note <= 120).sort((a, b) => a.t - b.t);
  if (!notes.length) throw new Error('no notes found in that file');
  const t0 = notes[0].t, chords = new Map(), drums = new Map();
  let end = 0;
  for (const n of notes) {
    const t = n.t - t0; if (t > MYM.MAX_SEC) break;
    const ms = Math.round(t * 1000), slot = Math.round(t * 50);              // notes within 20 ms are one chord; it keeps the first one's exact time
    if (n.ch === 9) { const k = mymDrum(n.note); if (k >= 0) { const key = slot * 16 + k, e = drums.get(key); if (!e) drums.set(key, [ms, k, n.vel >= 112 ? 1 : 0]); else if (n.vel >= 112) e[2] = 1; end = Math.max(end, t + 0.2); } continue; }
    if (n.prog >= 115) {                                                     // percussion played on a pitched channel: woodblock, taiko, toms, synth drum
      const k = n.prog === 115 ? 2 : n.prog <= 118 ? (n.note >= 60 ? 6 : n.note >= 48 ? 7 : 8) : -1;   // anything above 118 is a sound effect: left out
      if (k >= 0) { const key = slot * 16 + k, e = drums.get(key); if (!e) drums.set(key, [ms, k, n.vel >= 112 ? 1 : 0]); end = Math.max(end, t + 0.2); }
      continue;
    }
    const inst = mymInst(n.prog, n.note), key = slot * 16 + inst, dur = Math.round(Math.min(6, n.d) * 1000);
    let c = chords.get(key); if (!c) chords.set(key, c = [ms, dur, inst]);
    c[1] = Math.max(c[1], dur); if (!c.includes(n.note, 3)) c.push(n.note);
    end = Math.max(end, t + Math.min(6, n.d));
  }
  const out = [];
  for (const c of chords.values()) {
    // keep a chord playable on a phone: the bass plays one note, melody instruments two, the rest four
    const ns = c.slice(3).sort((a, b) => a - b), max = c[2] === 0 ? 1 : c[2] === 2 || c[2] === 6 ? 2 : 4;
    const kept = c[2] === 0 ? [ns[0]] : ns.length <= max ? ns : [ns[0], ...ns.slice(-(max - 1))];
    out.push([c[0], c[1], c[2], ...kept]);
  }
  out.sort((a, b) => a[0] - b[0]);
  // never more than MAX_VOICES notes sounding at once (a dense piano or orchestra file would choke a
  // phone): when it is full, chords lose their lower notes first; the bass and the lead always get one
  // the bass and the lead play one line: a new note ends the one before it
  const last = {};
  for (const c of out) { if (c[2] !== 0 && c[2] !== 2) continue; const prev = last[c[2]]; if (prev && prev[0] + prev[1] > c[0]) prev[1] = Math.max(30, c[0] - prev[0]); last[c[2]] = c; }
  const live = [], fit = [];
  for (const c of out) {
    for (let i = live.length - 1; i >= 0; i--) if (live[i] <= c[0]) live.splice(i, 1);
    const room = MYM.MAX_VOICES - live.length, solo = c[2] === 0 || c[2] === 2;
    let k = c.length - 3;
    if (k > room) { if (room <= 0 && !solo) continue; k = Math.max(1, room); c.splice(3, c.length - 3 - k); }
    for (let i = 0; i < k; i++) live.push(c[0] + c[1]);
    fit.push(c);
  }
  out.length = 0; out.push(...fit);
  const d = [...drums.values()].sort((a, b) => a[0] - b[0]);
  // a drummer riding the crash (metal does): only the first of a run is a full crash, the rest are open hats
  let crash = -1e9; for (const k of d) { if (k[1] !== 5) continue; if (k[0] - crash < 1500) k[1] = 4; else crash = k[0]; }
  if (out.length + d.length > MYM.MAX_EV) {                                  // a very busy file: keep the first part
    const cut = [...out.map(e => e[0]), ...d.map(e => e[0])].sort((a, b) => a - b)[MYM.MAX_EV];
    while (out.length && out[out.length - 1][0] >= cut) out.pop();
    while (d.length && d[d.length - 1][0] >= cut) d.pop();
    end = cut / 1000;
  }
  const q = 60 / (parsed.bpm || 120);
  return { name, bpm: parsed.bpm || 120, len: Math.ceil((end + 0.3) / q) * q, n: out, d };
}
// the stored song -> what the music engine plays
function mymRegister(song) {
  const ev = [];
  for (const c of song.n) ev.push({ t: c[0] / 1000, d: c[1] / 1000, inst: MYM_INST[c[2]], f: c.slice(3).map(n => 440 * Math.pow(2, (n - 69) / 12)) });
  for (const k of song.d) ev.push({ t: k[0] / 1000, inst: 'drum', kind: MYM_DRUM[k[1]], acc: !!k[2] });
  ev.sort((a, b) => a.t - b.t);
  Music.cache[song.id] = { ev, len: song.len, gain: 0.85 };
  SCORE[song.id] = { name: song.name, bpm: song.bpm, mine: true };
}
const mymClean = s => [...String(s).replace(/\.[A-Za-z0-9]{2,5}$/, '').replace(/[_]+/g, ' ')].filter(c => c === ' ' || PF_GLYPHS[c]).join('').replace(/\s+/g, ' ').trim().slice(0, 26) || 'My song';

// ---------------- keeping them on this device ----------------
function mymSave() {
  try { localStorage.setItem(MYM.KEY, JSON.stringify({ songs: MYM.songs, keep: MYM.keep })); return true; }
  catch (e) { MYM.status = 'There was no room to keep that one on this device. It will play until the game is closed.'; return false; }
}
function mymLoad() {
  try {
    const s = JSON.parse(localStorage.getItem(MYM.KEY) || 'null');
    if (!s || !Array.isArray(s.songs)) return;
    MYM.songs = s.songs.filter(x => x && x.id && Array.isArray(x.n) && Array.isArray(x.d) && x.len > 0).slice(0, MYM.MAX);
    MYM.songs.forEach(mymRegister);
    MYM.keep = MYM.songs.some(x => x.id === s.keep) ? s.keep : null;
  } catch (e) { MYM.songs = []; MYM.keep = null; }
}
function mymAdd(buf, fileName) {
  if (MYM.songs.length >= MYM.MAX) throw new Error(`there is room for ${MYM.MAX} songs; remove one first`);
  const song = midiToSong(parseMidi(buf), mymClean(fileName));
  song.id = 'my:' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  MYM.songs.push(song); mymRegister(song);
  MYM.status = `Added "${song.name}". It is at the top of the Jukebox.`;
  mymSave();
  return song;
}
function mymRemove(id) {
  MYM.songs = MYM.songs.filter(s => s.id !== id);
  if (MYM.keep === id) MYM.keep = null;
  if (MYM.preview === id) MYM.preview = null;
  if (G.jukebox === id) G.jukebox = null;
  delete Music.cache[id]; delete SCORE[id];
  MYM.status = 'Removed.'; mymSave();
}
function mymKeep(id) { MYM.keep = MYM.keep === id ? null : id; mymSave(); }
async function mymAddFiles(files) {
  for (const f of [...files]) {
    try {
      if (f.size > 3 * 1024 * 1024) throw new Error('that file is too big to be a MIDI song');
      const buf = f.arrayBuffer ? await f.arrayBuffer() : await new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsArrayBuffer(f); });
      mymAdd(buf, f.name);
    } catch (e) { MYM.status = `Could not use "${f.name}": ${e && e.message ? e.message : 'it could not be read'}.`; }
  }
  renderScript();
}

// ---------------- when they play ----------------
// Bosses, the giant, cutscenes, the credits and the arena keep their own music.
const _musicForM = musicFor;
musicFor = function () {
  if (MYM.preview && !SCRIPT.open) MYM.preview = null;                       // listening stops when the panel closes
  if (MYM.preview && Music.cache[MYM.preview]) return MYM.preview;
  const base = classicFor(_musicForM());
  if (!MYM.keep || !Music.cache[MYM.keep] || !base || G.mode === 'arena') return base;
  if (G.state === 'menu' && G.jukebox) return base;
  if (!['play', 'talk', 'menu', 'choice', 'jonlevel', 'hold', 'warp'].includes(G.state) || (G.state === 'talk' && G.talk && G.talk.back === 'cutscene')) return base;
  if (base === 'boss' || base === 'chop' || base === 'zep' || (SCORE[base] && SCORE[base].fight)) return base;
  return MYM.keep;
};

// ---------------- the Jukebox: your songs first, then the game's ----------------
jukeList = function () { return [...MYM.songs.map(s => s.id), ...JUKE_ORDER.filter(id => SCORE[id])]; };
const mymIs = id => typeof id === 'string' && id.startsWith('my:');
updateJukebox = function () {
  const list = jukeList();
  G.jukeSel = clamp(G.jukeSel || 0, 0, list.length - 1);
  if (just('up')) { G.jukeSel = (G.jukeSel + list.length - 1) % list.length; Sound.play('menu'); }
  if (just('down')) { G.jukeSel = (G.jukeSel + 1) % list.length; Sound.play('menu'); }
  const id = list[G.jukeSel];
  if (just('a')) { if (mymIs(id) || songFound(id)) { G.jukebox = G.jukebox === id ? null : id; Sound.play('coin'); } else Sound.play('clank'); }
  if (just('c') && mymIs(id)) { mymKeep(id); Sound.play('coin'); }
};
drawJukebox = function () {
  const list = jukeList(), mine = MYM.songs.length, sel = G.jukeSel || 0, ROWS = 14;
  R(0, 0, VW, VH, 'rgba(5,5,20,.92)'); drawPanel(8, 8, 240, 208);
  text('◀ MAP', 20, 26, '#8a8ab0', 'left', false); text('JUKEBOX', 128, 26, '#ffe64d', 'center'); text('GEAR ▶', 236, 26, '#8a8ab0', 'right', false);
  const game = list.slice(mine), heard = game.filter(id => songFound(id)).length;
  text(`${heard} of ${game.length} songs found` + (mine ? ` · ${mine} of yours` : ''), 128, 44, '#a79fc4', 'center', false);
  const top = clamp(sel - Math.floor(ROWS / 2), 0, Math.max(0, list.length - ROWS));
  list.slice(top, top + ROWS).forEach((id, k) => {
    const i = top + k, y = 57 + k * 10, on = i === sel, my = mymIs(id), got = my || songFound(id), playing = G.jukebox === id;
    const nm = my ? SCORE[id].name : got ? SCORE[id].name.replace(/ \(.*\)$/, '') : '???';
    if (on) R(18, y - 8, 220, 10, '#232860');
    text((on ? '> ' : '  ') + nm, 22, y, !got ? '#55577a' : on ? '#ffd84a' : my ? '#9be08a' : '#f3ecd2', 'left', false);
    if (playing) { const b = Math.floor(G.t * 8) % 4; text('♪'.repeat(1 + b), 230, y, '#9be08a', 'right', false); }
    else if (my && MYM.keep === id) text('EVERYWHERE', 230, y, '#7fd4ff', 'right', false);
  });
  if (top > 0) text('▲', 240, 52, '#8a8ab0', 'right', false);
  if (top + ROWS < list.length) text('▼', 240, 57 + (ROWS - 1) * 10, '#8a8ab0', 'right', false);
  const c = TOUCH ? 'RUNE' : 'C';
  const cur = SCORE[list[sel]], known = cur && cur.by && songFound(list[sel]);
  text(mymIs(list[sel]) ? `${BTN.a} plays · ${c} plays it everywhere` : known ? `by ${cur.by} · played by Jon's band` : mine ? `${BTN.a} plays` : 'Find songs in the world · Z plays', 128, 210, known ? '#c8e8ff' : '#8a8ab0', 'center', false);
};

// ---------------- the "My music" tab under the game ----------------
function renderMusicTab(body) {
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  body.innerHTML = '<p class="hint">Add MIDI files (.mid) from this device and the game\'s band plays them. They go to the top of the Jukebox, and one can play everywhere. The files stay on this device: they are not uploaded and are not part of the shared game.</p>' +
    `<div class="row wrap"><label class="ghost up" id="mym-add">Add MIDI files<input type="file" id="mym-file" accept=".mid,.midi,.kar,.rmi,audio/midi,audio/mid,audio/x-midi" multiple hidden></label><span class="hint">${MYM.songs.length} of ${MYM.MAX}</span></div>` +
    (MYM.songs.length ? '<ul class="slots">' + MYM.songs.map(s => `<li class="slot"><b>${esc(s.name)}</b><span>${fmt(s.len)} · ${s.n.length + s.d.length} notes</span>` +
      `<button class="ghost mym-play" data-id="${esc(s.id)}">${MYM.preview === s.id ? 'Stop' : 'Listen'}</button>` +
      `<button class="ghost mym-keep" data-id="${esc(s.id)}" aria-pressed="${MYM.keep === s.id}">${MYM.keep === s.id ? '✓ Playing everywhere' : 'Play everywhere'}</button>` +
      `<button class="x mym-rm" data-id="${esc(s.id)}" aria-label="Remove ${esc(s.name)}">Remove</button></li>`).join('') + '</ul>' : '<p class="empty">No songs yet.</p>') +
    `<p class="st-status" role="status">${esc(MYM.status)}</p>`;
  const f = body.querySelector('#mym-file');
  f.onchange = () => { const files = f.files; if (files && files.length) mymAddFiles(files); };
  body.querySelectorAll('.mym-play').forEach(b => b.onclick = () => { Sound.unlock(); MYM.preview = MYM.preview === b.dataset.id ? null : b.dataset.id; renderScript(); });
  body.querySelectorAll('.mym-keep').forEach(b => b.onclick = () => { mymKeep(b.dataset.id); renderScript(); });
  body.querySelectorAll('.mym-rm').forEach(b => b.onclick = () => { mymRemove(b.dataset.id); renderScript(); });
}
mymLoad();
