// The Drowned Barrow pass: Fluffy the guide, the bell crypt (a Voodoo Dash puzzle) and the Spirit Bell charm.
// Run: NODE_PATH=$(npm root -g) node tests/barrow_test.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage();
  const errs = []; let fails = 0;
  pg.on('pageerror', e => errs.push('pageerror ' + e.message));
  pg.on('console', m => { if (m.type() === 'error' && !/fonts|net::|ERR_/.test(m.text())) errs.push(m.text()); });
  const ev = (f, a) => pg.evaluate(f, a);
  const wait = ms => pg.waitForTimeout(ms);
  const SHOTS = process.env.SHOTS || '/tmp';
  const check = async (name, ok) => { console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) { fails++; console.log('   ', JSON.stringify(await ev(() => ({ st: G.state, map: G.mapId, scr: G.scr, x: G.player.x / 16, y: G.player.y / 16, hp: G.player.hp, talk: G.talk && G.talk.cur, seq: BELL.seq, lit: G.ents.filter(e => e.kind === 'bell').map(e => [e.def.size, e.lit]) })))); } };
  async function talkThrough(max = 80) { for (let i = 0; i < max; i++) { const st = await ev(() => G.state); if (st !== 'talk' && st !== 'hold' && st !== 'warp' && st !== 'jonlevel') return; await pg.keyboard.press('KeyZ'); await wait(40); } }
  const fresh = flags => ev(flags => { try { localStorage.clear(); } catch (e) {} TOASTS.length = 0; G.mode = 'story'; G.save = newSave(); applyJonPerks(); G.player = makePlayer(); G.jon = makeJon(); for (const f of ['met_astrid', 'jonarea:overworld', 'jonarea:barrow', 'intro:barrow', 'chapter_card:1', 'chapter_card:2', 'chapter_card:3', 'hint:move', 'hint:look', 'hint:chop', 'hint:gear', 'tip:pit', ...flags]) setFlag(f); G.save.trophies = Object.fromEntries(TROPHIES.filter(t => t.id !== 'bells').map(t => [t.id, true])); G.save.maxHp = 12; G.player.hp = 12; G.save.clock = 12; }, flags);
  // the crypt is the Barrow's room (2,0): local tile (cx, cy) is global (32 + cx, cy)
  const crypt = async (cx, cy) => { await ev(([cx, cy]) => { G.state = 'play'; G.talk = null; loadMap('barrow', (32 + cx) * 16 + 8, cy * 16 + 8); }, [cx, cy]); await wait(80); };
  // stand on a tile, face a way, and press the real dash key
  const dash = async (cx, cy, fx, fy) => {
    await ev(([cx, cy, fx, fy]) => { const p = G.player; p.x = (32 + cx) * 16 + 8; p.y = cy * 16 + 8; p.vx = p.vy = 0; p.fx = fx; p.fy = fy; p.dashCd = 0; p.cd = 0; p.falling = 0; }, [cx, cy, fx, fy]);
    await wait(40); await pg.keyboard.down('KeyF');
    await pg.waitForFunction(() => G.player.dashing > 0, null, { timeout: 2000 }).catch(() => {});
    await pg.keyboard.up('KeyF');
    await pg.waitForFunction(() => !(G.player.dashing > 0) && !(G.player.falling > 0), null, { timeout: 4000 }).catch(() => {});
    await wait(80);
  };
  const lit = () => ev(() => G.ents.filter(e => e.kind === 'bell').sort((a, b) => a.def.size - b.def.size).map(e => e.lit));
  const says = re => ev(re => G.state === 'talk' && new RegExp(re).test(JSON.stringify([G.talk.cur, ...G.talk.queue])), re);

  await pg.goto('file://' + path.resolve(__dirname, '../web/index.html'));

  // ---- the room ----
  await fresh([]); await ev(() => { G.save.items.dash = true; });
  await crypt(7, 11);
  await check('the bell crypt introduces itself once: little to big, and only a spirit can ring them', await says('LITTLE TO BIG') && await says('Voodoo Dash'));
  await talkThrough();
  await check('three spirit bells hang over the water, with Fluffy watching', await ev(() => G.ents.filter(e => e.kind === 'bell').length === 3 && G.ents.some(e => e.id === 'fluffy') && G.ents.filter(e => e.kind === 'bell').every(e => tileAt(e.x, e.y) === 'w' && !e.lit)));
  await check('the chest is not there yet', await ev(() => !G.ents.some(e => e.kind === 'chest')));
  await pg.screenshot({ path: SHOTS + '/barrow_bells.png' });

  // ---- ringing ----
  const hp0 = await ev(() => G.player.hp);
  await dash(6, 11, -1, 0);
  await check('dashing across the water from the south island to the west one rings the little bell', JSON.stringify(await lit()) === '[true,false,false]' && await ev(() => tileAt(G.player.x, G.player.y) === '_' && Math.floor(G.player.x / 16) - 32 <= 3));
  await pg.screenshot({ path: SHOTS + '/barrow_ding.png' });
  await dash(3, 2, 1, 0);
  await check('the big bell out of order silences them all, and Jon explains the first time', JSON.stringify(await lit()) === '[false,false,false]' && await says('Wrong order'));
  await talkThrough();
  await dash(6, 2, -1, 0);
  await check('...after that a wrong bell is a CLUNK, with no conversation', await ev(() => G.state === 'play' && BELL.seq.length === 0 && G.fx.some(f => f.kind === 'text' && /CLUNK/.test(f.label || ''))));
  await dash(3, 6, 1, 0);
  await check('a dash that ends in the water rings nothing (and Owen climbs back out at the door)', JSON.stringify(await lit()) === '[false,false,false]' && await ev(hp0 => G.player.hp < hp0 && Math.floor(G.player.y / 16) >= 10, hp0));
  await talkThrough();

  // leaving resets
  await dash(6, 11, -1, 0);
  await check('(setup) the little bell is ringing', (await lit())[0] === true);
  await ev(() => { loadMap('barrow', 39 * 16 + 8, 15 * 16 + 8); }); await wait(60); await crypt(7, 11);
  await check('leaving the room quiets the bells', JSON.stringify(await lit()) === '[false,false,false]' && await ev(() => G.state === 'play'));

  // ---- Fluffy's hints in the crypt follow what has rung ----
  const fluffySays = async () => { await ev(() => { G.state = 'play'; G.talk = null; interact(G.ents.find(e => e.id === 'fluffy')); }); const t = await ev(() => JSON.stringify([G.talk.cur, ...G.talk.queue])); await ev(() => { G.talk = null; G.state = 'play'; }); return t; };
  await check('Fluffy (through Jon): the little bell is first', /little bell is first/.test(await fluffySays()));
  await dash(6, 11, -1, 0);
  await check('...then: the middle bell is around the other way, not north', /middle bell is on the far side/.test(await fluffySays()) && /Do NOT go north/.test(await fluffySays()));

  // ---- the solve: little, back, around, middle, big ----
  await dash(3, 11, 1, 0);
  await check('crossing back under a bell that is already ringing changes nothing', JSON.stringify(await lit()) === '[true,false,false]' && await ev(() => BELL.seq.length === 1));
  await dash(9, 11, 1, 0);
  await check('the east gap has no bell: a free crossing', JSON.stringify(await lit()) === '[true,false,false]' && await ev(() => Math.floor(G.player.x / 16) - 32 >= 12));
  await dash(12, 2, -1, 0);
  await check('east to north rings the middle bell', JSON.stringify(await lit()) === '[true,true,false]');
  await check('Fluffy: the big one is all that is left', /big one is all that is left/.test(await fluffySays()));
  await dash(6, 2, -1, 0);
  await check('north to west rings the big bell: solved, and a chest rises on the north island', JSON.stringify(await lit()) === '[true,true,true]' && await ev(() => flag('puzzle_barrow') && G.ents.some(e => e.kind === 'chest' && e.def.id === 'br_bell')) && await says('ring together'));
  await pg.screenshot({ path: SHOTS + '/barrow_solved.png' });
  await talkThrough(); await wait(700);
  await check('...and the Ding Dong trophy', await ev(() => G.save.trophies.bells === true));

  // ---- the reward ----
  await ev(() => { TOASTS.length = 0; G.state = 'play'; G.talk = null; interact(G.ents.find(e => e.kind === 'chest')); }); await wait(60);
  await check('the chest holds the Spirit Bell charm', await ev(() => hasCharm('bell') && CHARMS.bell.name === 'Spirit Bell'));
  await pg.screenshot({ path: SHOTS + '/barrow_charm.png' });
  await talkThrough(); await wait(1400); await talkThrough();
  const cd = async on => { await ev(on => { G.state = 'play'; G.talk = null; G.save.charm = on ? 'bell' : null; const p = G.player; p.x = (32 + 2) * 16 + 8; p.y = 8 * 16 + 8; p.fx = 0; p.fy = -1; p.dashCd = 0; p.dashing = 0; p.fuel = 0; startDash(); }, on); const v = await ev(() => G.player.dashCd); await wait(500); return v; };
  const off = await cd(false), on = await cd(true);
  await check('wearing it, the Voodoo Dash is ready again twice as fast', Math.abs(off - 0.55) < 0.02 && Math.abs(on - 0.275) < 0.02);
  await crypt(7, 11);
  await check('coming back later: the bells are still glowing, and the chest stays open', JSON.stringify(await lit()) === '[true,true,true]' && await ev(() => G.state === 'play' && G.ents.some(e => e.kind === 'chest' && e.open)));
  await dash(6, 11, -1, 0);
  await check('...and they still chime when you dash through', await ev(() => G.ents.find(e => e.kind === 'bell' && e.def.size === 0).ring > 0 && flag('puzzle_barrow')));

  // ---- Fluffy guides the whole Barrow ----
  await fresh([]); await ev(() => { loadMap('barrow', 24 * 16 + 8, 36 * 16 + 8); G.talk = null; G.state = 'play'; G.ents = G.ents.filter(e => !e.enemy); }); await wait(60);
  const entrance = async () => { await ev(() => { G.state = 'play'; G.talk = null; interact(G.ents.find(e => e.id === 'fluffy')); }); const t = await ev(() => JSON.stringify([G.talk.cur, ...G.talk.queue])); await ev(() => { G.talk = null; G.state = 'play'; }); return t; };
  await check('the first meeting is still Owen\'s own scene', (await entrance()) === await ev(() => JSON.stringify(STORY.fluffy_1)));
  await check('after that: the key is west', /go west from here/.test(await entrance()));
  await ev(() => setFlag('chest:br_key'));
  await check('with the key: the locked door north, then west to the guardian', /key opens the door north/.test(await entrance()));
  await ev(() => { G.save.items.dash = true; });
  await check('with the dash: the spirit wall in the east of the hall, and the big key', /spirit wall/.test(await entrance()) && /big key/.test(await entrance()));
  await ev(() => { G.save.bigkeys = { barrow: true }; });
  await check('with the big key: Owen\'s own "after the dash" scene', (await entrance()) === await ev(() => JSON.stringify(STORY.fluffy_2)));
  await ev(() => setFlag('d2done'));
  await check('after Hank, if the bells are unsolved, he points to them', /bells/.test(await entrance()) && /door goes north/.test(await entrance()));
  await ev(() => setFlag('puzzle_barrow'));
  await check('with everything done he rolls over for belly rubs', (await entrance()) === await ev(() => JSON.stringify(STORY.fluffy_after)));

  // ---- the map and the script ----
  await ev(() => { G.state = 'menu'; G.menuPage = MENU_TABS.indexOf('MAP'); }); await wait(120);
  await check('the Barrow\'s floor plan includes the crypt', await ev(() => roomExists(G.map, 2, 0) && roomExists(G.map, 2, 1) && !roomExists(G.map, 0, 0)));
  await pg.screenshot({ path: SHOTS + '/barrow_map.png' });
  await check('Owen can rewrite the crypt\'s three scenes in OWEN\'S SCRIPT', await ev(() => ['bells_intro', 'bells_wrong', 'bells_done'].every(k => SCENE_NAMES[k] && STORY[k])));

  console.log('errors:', errs);
  console.log('FAILS:', fails);
  await b.close();
  process.exit(fails || errs.length ? 1 : 0);
})();
