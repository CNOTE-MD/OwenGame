// MY MUSIC: bring-your-own MIDI files. Reading the file, arranging it for the game's band, the
// "My music" tab, the Jukebox, "play everywhere", and that it all stays on the device.
// Run: NODE_PATH=$(npm root -g) node tests/mymusic_test.js
const { chromium } = require('playwright');
const path = require('path');

// ---- a small MIDI file, built by hand: 5 tracks, a tempo change, running status, note-on-with-zero-velocity ----
const vlq = n => { const out = [n & 0x7f]; while ((n >>= 7)) out.unshift((n & 0x7f) | 0x80); return out; };
const track = bytes => [0x4d, 0x54, 0x72, 0x6b, (bytes.length >>> 24) & 255, (bytes.length >>> 16) & 255, (bytes.length >>> 8) & 255, bytes.length & 255, ...bytes];
const END = [0x00, 0xff, 0x2f, 0x00];
function fixture() {
  const div = 480;
  const tempo = [0x00, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20, ...vlq(1920), 0xff, 0x51, 0x03, 0x03, 0xd0, 0x90, ...END];          // 120 bpm, then 240 bpm after four beats
  const bass = [0x00, 0xc0, 33, 0x00, 0x90, 40, 100, ...vlq(480), 40, 0, 0x00, 40, 100, ...vlq(480), 40, 0, ...END];              // running status; velocity 0 ends a note
  const chord = [40, 47, 52, 56, 59, 64];
  const gtr = [0x00, 0xc1, 30, ...chord.flatMap(n => [0x00, 0x91, n, 90]), ...chord.flatMap((n, i) => [...vlq(i ? 0 : 960), 0x81, n, 0]), ...END];
  const lead = [0x00, 0xc2, 80, ...vlq(1920), 0x92, 76, 100, ...vlq(480), 0x82, 76, 0, ...END];                                  // starts after the tempo change
  const drums = [0x00, 0x99, 36, 100, 0x00, 75, 100, ...vlq(240), 42, 80, ...vlq(240), 38, 120, ...vlq(10), 0x89, 36, 0, 0x00, 75, 0, 0x00, 42, 0, 0x00, 38, 0, ...END];
  const tracks = [tempo, bass, gtr, lead, drums];
  return Buffer.from([0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 1, 0, tracks.length, div >> 8, div & 255, ...tracks.flatMap(track)]);
}

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 900, height: 1400 } });
  const errs = []; let fails = 0;
  pg.on('pageerror', e => errs.push('pageerror ' + e.message));
  pg.on('console', m => { if (m.type() === 'error' && !/fonts|net::|ERR_/.test(m.text())) errs.push(m.text()); });
  const ev = (f, a) => pg.evaluate(f, a);
  const wait = ms => pg.waitForTimeout(ms);
  const SHOTS = process.env.SHOTS || '/tmp';
  const check = async (name, ok, extra) => { console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) { fails++; console.log('   ', JSON.stringify(extra !== undefined ? extra : await ev(() => ({ st: G.state, songs: MYM.songs.map(s => s.name), keep: MYM.keep, status: MYM.status, music: Music.name })))); } };
  const midi = fixture();
  const start = () => ev(() => { TOASTS.length = 0; G.mode = 'story'; G.save = newSave(); applyJonPerks(); G.save.trophies = Object.fromEntries(TROPHIES.map(t => [t.id, true])); G.player = makePlayer(); G.jon = makeJon(); for (const f of ['met_astrid', 'hint:move', 'hint:look', 'hint:chop', 'hint:gear', 'chapter_card:1', 'jonarea:overworld']) setFlag(f); G.state = 'play'; G.talk = null; loadMap('overworld', 20 * 16 + 8, 34 * 16 + 8); G.ents = G.ents.filter(e => !e.enemy); G.talk = null; G.state = 'play'; });

  await pg.goto('file://' + path.resolve(__dirname, '../web/index.html'));
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await pg.reload(); await pg.waitForFunction(() => typeof G !== 'undefined' && G.state === 'title');

  // ---- reading the file ----
  const parsed = await ev(bytes => { const p = parseMidi(new Uint8Array(bytes).buffer); return { n: p.notes.length, bpm: p.bpm, lead: p.notes.find(x => x.ch === 2), bass: p.notes.filter(x => x.ch === 0).map(x => [x.t, x.d, x.prog]), drums: p.notes.filter(x => x.ch === 9).length }; }, [...midi]);
  await check('a MIDI file is read: every note, across tracks, running status and velocity-0 note-offs', parsed.n === 13 && parsed.drums === 4 && JSON.stringify(parsed.bass) === JSON.stringify([[0, 0.5, 33], [0.5, 0.5, 33]]), parsed);
  await check('tempo changes are followed: a note after the change starts at 2.0 s and lasts a quarter second', parsed.bpm === 120 && Math.abs(parsed.lead.t - 2) < 1e-6 && Math.abs(parsed.lead.d - 0.25) < 1e-6, parsed);
  await check('a RIFF-wrapped (.rmi) file reads the same', await ev(bytes => { const smf = new Uint8Array(bytes), head = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x52, 0x4d, 0x49, 0x44, 0x64, 0x61, 0x74, 0x61, 0, 0, 0, 0]; const all = new Uint8Array(head.length + smf.length); all.set(head); all.set(smf, head.length); return parseMidi(all.buffer).notes.length === 13; }, [...midi]));
  await check('something that is not MIDI is refused', await ev(() => { try { parseMidi(new TextEncoder().encode('this is not a midi file, it is a note').buffer); return false; } catch (e) { return /not a MIDI file/.test(e.message); } }));

  // ---- arranging it for the band ----
  const song = await ev(bytes => { const s = midiToSong(parseMidi(new Uint8Array(bytes).buffer), 'x'); return { n: s.n, d: s.d, len: s.len, bpm: s.bpm }; }, [...midi]);
  const inst = i => song.n.filter(e => e[2] === i);
  await check('bass program -> the bass; distortion guitar -> power chords; synth lead -> the lead', inst(0).length === 2 && inst(1).length === 1 && inst(2).length === 1 && song.n.length === 4, song);
  await check('a six-note chord is thinned to four (lowest and the top three), so a phone can play it', JSON.stringify(inst(1)[0].slice(3)) === JSON.stringify([40, 56, 59, 64]), inst(1));
  await check('drums map to the kit (kick, hat, accented snare); unknown percussion is dropped', JSON.stringify(song.d) === JSON.stringify([[0, 0, 0], [250, 3, 0], [500, 1, 1]]), song.d);
  await check('the loop ends on a beat', Math.abs(song.len - 3) < 1e-6, song.len);

  // a very dense file: ten-note chords, long and overlapping, eight times a second for a minute
  const dense = await ev(() => {
    const notes = []; for (let i = 0; i < 480; i++) for (let k = 0; k < 10; k++) notes.push({ t: i / 8, d: 3, ch: k % 4, note: 40 + k * 3 + (i % 5), vel: 90, prog: [0, 48, 24, 33][k % 4] });
    for (let i = 0; i < 480; i++) notes.push({ t: i / 8, d: 0.2, ch: 5, note: 72 + (i % 7), vel: 100, prog: 80 });
    const s = midiToSong({ notes, bpm: 120 }, 'dense');
    const edges = []; for (const c of s.n) { edges.push([c[0], c.length - 3]); edges.push([c[0] + c[1], -(c.length - 3)]); }
    edges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    let live = 0, peak = 0; for (const e of edges) { live += e[1]; peak = Math.max(peak, live); }
    return { peak, events: s.n.length + s.d.length, lead: s.n.filter(c => c[2] === 2).length, bass: s.n.filter(c => c[2] === 0).length };
  });
  await check('a dense file is thinned so a phone can play it: at most 20 notes at once (plus a bass or lead note)', dense.peak <= 22 && dense.events <= 9000, dense);
  await check('...and the melody and the bass line are never the notes that get dropped', dense.lead === 480 && dense.bass === 480, dense);

  // ---- the My music tab ----
  await start();
  await pg.click('#scriptbtn'); await wait(100); await pg.click('#tab-music'); await wait(100);
  await check('OWEN\'S SCRIPT has a My music tab that says the files stay on this device', await ev(() => /stay on this device/.test(document.getElementById('st-body').textContent) && !!document.getElementById('mym-file')));
  await pg.setInputFiles('#mym-file', { name: 'Tom_Sawyer_(test).mid', mimeType: 'audio/midi', buffer: midi });
  await pg.waitForFunction(() => MYM.songs.length === 1, null, { timeout: 5000 }).catch(() => {});
  await check('picking a file adds the song, with a tidy name', await ev(() => MYM.songs.length === 1 && MYM.songs[0].name === 'Tom Sawyer (test)' && document.querySelectorAll('.mym-rm').length === 1 && /Added/.test(MYM.status)));
  await pg.screenshot({ path: SHOTS + '/mymusic_tab.png' });
  await check('it is kept in this browser only (localStorage), and nothing is sent anywhere', await ev(() => { const s = JSON.parse(localStorage.getItem('jontuka-mymusic')); return s.songs.length === 1 && s.songs[0].n.length === 4; }));
  await pg.setInputFiles('#mym-file', { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('this is not a midi file, it is a note') });
  await pg.waitForFunction(() => /Could not use/.test(MYM.status), null, { timeout: 5000 }).catch(() => {});
  await check('a wrong file gets a plain message and changes nothing', await ev(() => /Could not use "notes.txt": not a MIDI file/.test(MYM.status) && MYM.songs.length === 1 && /Could not use/.test(document.querySelector('#st-body .st-status').textContent)));
  const id = await ev(() => MYM.songs[0].id);
  await pg.click('.mym-play'); await wait(900);
  await check('Listen plays it through the game\'s band, right there', await ev(id => MYM.preview === id && musicFor() === id && Music.name === id && !!Music.bus, id));
  await pg.click('#st-close'); await wait(200);
  await check('closing the panel stops the preview and hands music back to the game', await ev(() => { const m = musicFor(); return MYM.preview === null && m === 'overworld'; }));

  // ---- the Jukebox ----
  await ev(() => { cv.focus(); G.state = 'menu'; G.menuPage = 3; G.jukeSel = 0; G.jukebox = null; }); await wait(100);
  await check('your songs are at the top of the Jukebox, then the game\'s', await ev(id => jukeList()[0] === id && jukeList().length === JUKE_ORDER.length + 1, id));
  await pg.keyboard.press('KeyZ'); await wait(700);
  await check('Z plays it', await ev(id => G.jukebox === id && musicFor() === id && Music.name === id, id));
  await pg.screenshot({ path: SHOTS + '/mymusic_jukebox.png' });
  await pg.keyboard.press('KeyC'); await wait(100);
  await check('C sets it to play everywhere, and that is remembered', await ev(id => MYM.keep === id && JSON.parse(localStorage.getItem('jontuka-mymusic')).keep === id, id));
  await pg.screenshot({ path: SHOTS + '/mymusic_jukebox2.png' });
  await pg.keyboard.press('Enter'); await wait(300);
  await check('back in the game it keeps playing: outdoors, indoors, in a dungeon', await ev(id => { const out = [musicFor()]; loadMap('astrid_house', 5 * 16 + 8, 6 * 16 + 8); G.talk = null; G.state = 'play'; out.push(musicFor()); loadMap('cavern', 24 * 16 + 8, 52 * 16 + 8); G.talk = null; G.state = 'play'; out.push(musicFor()); return out.every(m => m === id); }, id));
  await check('bosses keep their own music', await ev(id => { G.ents.push({ boss: true, alive: true, type: 'knight', x: 0, y: 0 }); const m = musicFor(); G.ents.pop(); return m === 'boss' && musicFor() === id; }, id));
  await check('so do the title screen and the arena', await ev(id => { const st = G.state; G.state = 'title'; const t = musicFor(); G.state = st; G.mode = 'arena'; const a = musicFor(); G.mode = 'story'; return t === 'title' && a !== id; }, id));
  await wait(1500);
  await check('the band plays it without a single error', errs.length === 0 && await ev(id => Music.name === id && Music.idx >= 0, id), errs);

  // ---- it survives closing the game ----
  await pg.reload(); await pg.waitForFunction(() => typeof G !== 'undefined' && G.state === 'title');
  await check('after reopening the game the song and "play everywhere" are still there', await ev(id => MYM.songs.length === 1 && MYM.keep === id && !!Music.cache[id] && SCORE[id].name === 'Tom Sawyer (test)', id));

  // ---- limits, and removing ----
  await ev(bytes => { for (let i = 0; i < 7; i++) mymAdd(new Uint8Array(bytes).buffer, 'Song ' + i + '.mid'); }, [...midi]);
  await check('there is room for eight songs; a ninth is refused with a reason', await ev(bytes => { try { mymAdd(new Uint8Array(bytes).buffer, 'nine.mid'); return false; } catch (e) { return MYM.songs.length === 8 && /room for 8/.test(e.message); } }, [...midi]));
  await start(); await ev(() => { cv.focus(); G.state = 'menu'; G.menuPage = 3; G.jukeSel = jukeList().length - 1; }); await wait(150);
  await pg.screenshot({ path: SHOTS + '/mymusic_jukebox_scroll.png' });
  await check('the Jukebox scrolls to fit them all', await ev(() => jukeList().length === JUKE_ORDER.length + 8));
  await ev(() => { G.state = 'play'; });
  await pg.click('#scriptbtn'); await wait(100); await pg.click('#tab-music'); await wait(100);
  await pg.click('.mym-rm'); await wait(100);
  await check('Remove takes a song away for good, and "play everywhere" goes with it', await ev(id => MYM.songs.length === 7 && !MYM.songs.some(s => s.id === id) && MYM.keep === null && !Music.cache[id] && !SCORE[id] && JSON.parse(localStorage.getItem('jontuka-mymusic')).songs.length === 7 && musicFor() !== id, id));
  await check('the game\'s own songs and their order are untouched', await ev(() => JSON.stringify(jukeList().slice(7)) === JSON.stringify(JUKE_ORDER.filter(i => SCORE[i]))));

  console.log('errors:', errs);
  console.log('FAILS:', fails);
  await b.close();
  process.exit(fails || errs.length ? 1 : 0);
})();
