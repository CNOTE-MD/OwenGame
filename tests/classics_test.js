// Five public-domain pieces by Edvard Grieg, arranged for the game's band: what is shipped, where
// each one plays, what they leave alone, the Jukebox and the credits.
// Run: NODE_PATH=$(npm root -g) node tests/classics_test.js
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage();
  const errs = []; let fails = 0;
  pg.on('pageerror', e => errs.push('pageerror ' + e.message));
  pg.on('console', m => { if (m.type() === 'error' && !/fonts|net::|ERR_/.test(m.text())) errs.push(m.text()); });
  const ev = (f, a) => pg.evaluate(f, a);
  const wait = ms => pg.waitForTimeout(ms);
  const SHOTS = process.env.SHOTS || '/tmp';
  const check = async (name, ok, extra) => { console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) { fails++; console.log('   ', JSON.stringify(extra !== undefined ? extra : await ev(() => ({ st: G.state, map: G.mapId, scr: G.scr, music: musicFor() })))); } };
  const IDS = ['grieg_king', 'grieg_trolls', 'grieg_wedding', 'grieg_mountaineer', 'grieg_aase'];

  // ---- what is in the repo ----
  const doc = fs.readFileSync(path.join(ROOT, 'music/CLASSICS.md'), 'utf8');
  const mids = fs.readdirSync(path.join(ROOT, 'music/midi')).filter(f => f.startsWith('grieg_'));
  await check('five source MIDI files, each a real MIDI file', mids.length === 5 && mids.every(f => fs.readFileSync(path.join(ROOT, 'music/midi', f)).slice(0, 4).toString() === 'MThd'), mids);
  await check('every source file is credited: piece, Mutopia page, Public Domain', mids.every(f => doc.includes('`' + f + '`')) && (doc.match(/piece-info\.cgi\?id=\d+/g) || []).length === 5 && /Public Domain/.test(doc));
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'music/classics.json'), 'utf8'));
  await check('the arranged songs carry their composer and source', JSON.stringify(Object.keys(data)) === JSON.stringify(IDS) && IDS.every(id => data[id].by === 'Edvard Grieg' && /Mutopia Project, piece \d+ \(Public Domain\)/.test(data[id].source) && data[id].n.length > 300 && data[id].len > 60));
  const voices = id => { const ed = []; for (const e of data[id].n) { ed.push([e[0], e.length - 3]); ed.push([e[0] + e[1], -(e.length - 3)]); } ed.sort((a, b) => a[0] - b[0] || a[1] - b[1]); let live = 0, peak = 0; for (const e of ed) { live += e[1]; peak = Math.max(peak, live); } return peak; };
  await check('each arrangement is light enough for a phone (never more than 16 notes at once)', IDS.every(id => voices(id) <= 16), IDS.map(voices));
  await check('the two quiet pieces have no drums; the three band pieces do, on every bar', data.grieg_mountaineer.d.length === 0 && data.grieg_aase.d.length === 0 && ['grieg_king', 'grieg_trolls', 'grieg_wedding'].every(id => data[id].d.length > 300));
  await check('the bass plays one note at a time, low', IDS.every(id => data[id].n.filter(e => e[2] === 0).every(e => e.length === 4 && e[3] >= 28 && e[3] <= 50)));

  await pg.goto('file://' + path.join(ROOT, 'web/index.html'));
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await pg.reload(); await pg.waitForFunction(() => typeof G !== 'undefined' && G.state === 'title');
  const start = () => ev(() => { TOASTS.length = 0; G.mode = 'story'; G.save = newSave(); applyJonPerks(); G.save.trophies = Object.fromEntries(TROPHIES.map(t => [t.id, true])); G.player = makePlayer(); G.jon = makeJon(); for (const f of ['met_astrid', 'hint:move', 'hint:look', 'hint:chop', 'hint:gear', 'chapter_card:1', 'chapter_card:2', 'chapter_card:3', 'jonarea:overworld', 'jonarea:cavern', 'jonarea:barrow', 'intro:cavern', 'intro:barrow', 'intro:knight', 'intro:bells', 'sauna_found', 'baron_met']) setFlag(f); G.save.items.dash = true; G.state = 'play'; G.talk = null; loadMap('overworld', 20 * 16 + 8, 34 * 16 + 8); G.ents = G.ents.filter(e => !e.enemy); G.talk = null; G.state = 'play'; });
  const at = (map, tx, ty, keep) => ev(([map, tx, ty, keep]) => { G.state = 'play'; G.talk = null; loadMap(map, tx * 16 + 8, ty * 16 + 8); if (!keep) G.ents = G.ents.filter(e => !e.enemy); G.talk = null; G.state = 'play'; G.bossCard = null; return musicFor(); }, [map, tx, ty, keep]);
  await start();

  await check('the game knows all five, after its own fifteen songs', await ev(IDS => IDS.every(id => Music.cache[id] && SCORE[id].by === 'Edvard Grieg') && JSON.stringify(JUKE_ORDER.slice(-5)) === JSON.stringify(IDS) && JUKE_ORDER.length === 20 && JUKE_ORDER[0] === 'title', IDS));

  // ---- where they play ----
  await check('the Hidden Cave: In the Hall of the Mountain King', (await at('secret_cave', 5, 8)) === 'grieg_king');
  await check('Baron Blubber\'s Sauna: Wedding Day at Troldhaugen', (await at('sauna', 7, 9)) === 'grieg_wedding');
  await check('the bell crypt: The Mountaineer\'s Song', (await at('barrow', 39, 11)) === 'grieg_mountaineer');
  await check('...the rest of the Barrow keeps its own theme', (await at('barrow', 24, 36)) === 'barrow');
  await check('a mini-boss gets March of the Trolls: the Penguin Knight', (await at('cavern', 41, 20, true)) === 'grieg_trolls' && await ev(() => G.ents.some(e => e.type === 'knight' && e.alive)));
  await check('...and the Draugr Captain', (await at('barrow', 6, 20, true)) === 'grieg_trolls' && await ev(() => G.ents.some(e => e.type === 'captain' && e.alive)));
  await check('GAME OVER: Aase\'s Death', await ev(() => { const st = G.state; G.state = 'over'; const m = musicFor(); G.state = st; return m === 'grieg_aase'; }));

  // ---- what they leave alone ----
  await check('the real bosses keep their music: the Penguin King (Owen\'s "chop") and Hank', (await at('cavern', 24, 5, true)) === 'chop' && (await at('barrow', 24, 5, true)) === 'boss');
  await check('Owen\'s bands keep every place they had', (await at('overworld', 20, 34)) === 'overworld' && (await at('overworld', 5, 20)) === 'village' && (await at('overworld', 24, 6)) === 'journey' && (await at('overworld', 40, 6)) === 'cold' && (await at('subway', 8, 5)) === 'aero' && (await at('cavern', 24, 52)) === 'palace' && (await at('astrid_house', 5, 6)) === 'village');
  await check('the title, the arena and the arena\'s game over are untouched', await ev(() => { const st = G.state, mode = G.mode; G.state = 'title'; const t = musicFor(); G.state = 'arenaover'; const a = musicFor(); G.state = 'play'; G.mode = 'arena'; const ar = musicFor(); G.state = st; G.mode = mode; return t === 'title' && a === null && !String(ar).startsWith('grieg'); }));

  // ---- with "play everywhere" from My music ----
  await ev(() => { const s = { id: 'my:test', name: 'Mine', bpm: 120, len: 4, n: [[0, 400, 2, 60]], d: [] }; MYM.songs.push(s); mymRegister(s); MYM.keep = 'my:test'; });
  await check('a player\'s own "play everywhere" song replaces the cave tune, but not a mini-boss\'s', (await at('secret_cave', 5, 8)) === 'my:test' && (await at('cavern', 41, 20, true)) === 'grieg_trolls');
  await ev(() => { MYM.songs.length = 0; MYM.keep = null; delete Music.cache['my:test']; delete SCORE['my:test']; });

  // ---- the Jukebox ----
  await start();
  await ev(() => { cv.focus(); G.state = 'menu'; G.menuPage = 3; G.jukeSel = JUKE_ORDER.indexOf('grieg_king'); G.jukebox = null; }); await wait(120);
  await pg.keyboard.press('KeyZ'); await wait(80);
  await check('a Grieg piece is locked in the Jukebox until you have heard it in the world', await ev(() => G.jukebox === null));
  await ev(() => { G.state = 'play'; }); await at('secret_cave', 5, 8); await wait(400);
  await check('...visiting the Hidden Cave finds it', await ev(() => flag('heard:grieg_king')));
  await ev(() => { Sound.unlock(); cv.focus(); G.state = 'menu'; G.menuPage = 3; G.jukeSel = JUKE_ORDER.indexOf('grieg_king'); G.jukebox = null; }); await wait(120);
  await pg.keyboard.press('KeyZ'); await wait(1500);
  await check('then Z plays it, and the band plays it without an error', errs.length === 0 && await ev(() => G.jukebox === 'grieg_king' && Music.name === 'grieg_king' && !!Music.bus), errs);
  await pg.screenshot({ path: SHOTS + '/classics_jukebox.png' });
  for (const id of IDS.slice(1)) { await ev(id => { setFlag('heard:' + id); G.jukebox = id; }, id); await wait(700); }
  await check('all five play through the engine without an error', errs.length === 0 && await ev(() => Music.name === 'grieg_aase'), errs);

  // ---- credit where it is due ----
  await ev(() => { G.jukebox = null; G.state = 'play'; startCredits(); }); await wait(200);
  await check('the credits name Edvard Grieg of Norway', await ev(() => G.credits.lines.some(l => /Edvard Grieg/.test(l.t)) && G.credits.lines.some(l => /Norway/.test(l.t))));

  console.log('errors:', errs);
  console.log('FAILS:', fails);
  await b.close();
  process.exit(fails || errs.length ? 1 : 0);
})();
