// The SNES pass and Owen's page 5 (subway, taxi, Muck Forest, the big log, Penguin Palace). Run: NODE_PATH=$(npm root -g) node tests/snes_test.js
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
  const check = async (name, ok) => { console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) { fails++; console.log('   ', JSON.stringify(await ev(() => ({ st: G.state, map: G.mapId, scr: G.scr, x: G.player.x / 16, y: G.player.y / 16, talk: G.talk && G.talk.cur })))); } };
  async function talkThrough(max = 80) { for (let i = 0; i < max; i++) { const st = await ev(() => G.state); if (st !== 'talk' && st !== 'hold' && st !== 'warp' && st !== 'jonlevel' && st !== 'cutscene') return; await pg.keyboard.press('KeyZ'); await wait(40); } }
  async function place(tx, ty, fx, fy) { await ev(([tx, ty, fx, fy]) => { const p = G.player; p.x = tx * 16 + 8; p.y = ty * 16 + 8; p.fx = fx; p.fy = fy; p.cd = 0; p.dashCd = 0; p.vx = p.vy = 0; G.jon.mode = 'follow'; }, [tx, ty, fx, fy]); }
  async function go(map, tx, ty, keepEnemies) { await ev(([m, x, y, k]) => { G.state = 'play'; G.talk = null; loadMap(m, x * 16 + 8, y * 16 + 8); if (!k) { G.ents = G.ents.filter(e => !e.enemy); G.state = 'play'; G.talk = null; } }, [map, tx, ty, !!keepEnemies]); await wait(60); }

  await pg.goto('file://' + path.resolve(__dirname, '../web/index.html'));
  await ev(() => { try { localStorage.clear(); } catch (e) {} G.mode = 'story'; G.save = newSave(); applyJonPerks(); G.player = makePlayer(); G.jon = makeJon(); setFlag('met_astrid'); setFlag('jonarea:overworld'); });

  // --- the airstrip: a normal attendant, the subway stairs ---
  await go('overworld', 20, 36);
  await check('a (perfectly normal) flight attendant stands by the plane', await ev(() => G.ents.some(e => e.kind === 'npc' && e.id === 'attendant_ok')));
  await check('arrival text follows Owen\'s page 5', await ev(() => STORY.arrival[0][1].includes('it was a dream')));
  await check('objective sends you to the subway first', await ev(() => /subway/i.test(objective())));
  await place(19, 38, -1, 0); await pg.keyboard.down('ArrowLeft'); await wait(500); await pg.keyboard.up('ArrowLeft'); await wait(800); await talkThrough();
  await check('stairs lead into the Fjordvik T-bane', await ev(() => G.mapId === 'subway' && G.map.name === 'Fjordvik T-bane'));
  await pg.screenshot({ path: SHOTS + '/snes_subway.png' });

  // --- the exchangy doohickey ---
  const kr0 = await ev(() => G.save.kr);
  await place(3, 2, 0, -1); await pg.keyboard.press('KeyZ'); await wait(100); await talkThrough();
  await check('exchange machine pays a couple hundred kroner', (await ev(() => G.save.kr)) === kr0 + 200);
  await place(3, 2, 0, -1); await pg.keyboard.press('KeyZ'); await wait(100); await talkThrough();
  await check('the machine only takes dollars once', (await ev(() => G.save.kr)) === kr0 + 200);
  await check('objective now points at the forest', await ev(() => /forest/i.test(objective())));

  // --- the taxi ride ---
  await place(13, 5, 1, 0); await pg.keyboard.press('KeyZ'); await wait(100);
  await check('driver quotes the fare', await ev(() => G.state === 'talk' && G.talk.cur[0] === 'Driver'));
  await talkThrough(6);
  await check('taxi cutscene plays', await ev(() => G.state === 'cutscene' || (G.state === 'talk' && G.talk.back === 'cutscene')));
  await pg.screenshot({ path: SHOTS + '/snes_taxi.png' });
  await talkThrough();
  await check('taxi drops you in the Muck Forest and charges 20 kr', await ev(() => G.mapId === 'overworld' && G.scr.x === 1 && G.scr.y === 0) && (await ev(() => G.save.kr)) === kr0 + 180);
  await check('forest arrival text (two hours of muck)', await ev(() => flag('forest_arrival')));

  // --- muck slows, tall grass rustles and cuts ---
  await go('overworld', 18, 7);
  await check('standing in muck', await ev(() => tileAt(G.player.x, G.player.y + 4) === '%'));
  await check('muck slows Owen', (await ev(() => groundSpeed(G.player))) < 0.7);
  const x0 = await ev(() => G.player.x);
  await pg.keyboard.down('ArrowRight'); await wait(400); await pg.keyboard.up('ArrowRight');
  const mucked = (await ev(() => G.player.x)) - x0;
  await check('walking through muck is slow but possible', mucked > 8 && mucked < 24);
  await check('muck splashes', await ev(() => G.fx.length > 0));
  await go('overworld', 17, 11);
  await check('tall grass grows in the Muck Forest', await ev(() => tile(18, 11) === ','));
  await place(17, 11, 1, 0); await pg.keyboard.press('KeyZ'); await wait(400);
  await check('Jon cuts tall grass', await ev(() => tile(18, 11) !== ','));

  // --- the big log (Owen's exact lines) ---
  await go('overworld', 28, 6);
  await check('a log blocks the way east', await ev(() => tile(31, 5) === 'o' && tile(31, 6) === 'o' && G.ents.some(e => e.kind === 'log')));
  await place(29, 6, 1, 0); await wait(150);
  await check('Jon: "Hello Señor! Ooh, that\'s a big log, want me to chop it?"', await ev(() => G.state === 'talk' && STORY.log_scene.some(l => l[1].startsWith('Hello Señor!'))));
  await talkThrough();
  await pg.screenshot({ path: SHOTS + '/snes_log.png' });
  for (let i = 0; i < 4; i++) { await place(30, 6, 1, 0); await pg.keyboard.press('KeyZ'); await wait(450); await talkThrough(); }
  await check('three chops clear the log for good', await ev(() => tile(31, 5) === 's' && tile(31, 6) === 's' && flag('log_chopped') && flag('tile:overworld:31,5:s')));
  await go('overworld', 28, 6);
  await check('the log stays chopped after reloading the map', await ev(() => tile(31, 6) === 's' && !G.ents.some(e => e.kind === 'log')));

  // --- the Penguin Palace ---
  await check('dungeon 1 is the Penguin Palace', await ev(() => MAPS.cavern.name === 'Penguin Palace' && MAPS.cavern.palace));
  await check('Astrid talks about the palace', await ev(() => npcLines('astrid').some(l => /Palace/.test(l[1]))));
  await go('cavern', 24, 5);
  await check('a throne behind the king', await ev(() => G.ents.some(e => e.kind === 'throne')));
  await pg.screenshot({ path: SHOTS + '/snes_palace.png' });
  await check('beating the palace is CHAPTER 2 COMPLETE in Owen\'s numbering', await ev(() => STORY.chapter_done === 'CHAPTER 2 COMPLETE'));

  // --- new enemies ---
  await go('overworld', 20, 5, true);
  await ev(() => { G.ents = G.ents.filter(e => !e.enemy); const e = makeEnemy('spore', 20 * 16 + 8, 3 * 16 + 8); e.st = 'idle'; G.ents.push(e); });
  await place(20, 8, 0, -1); await wait(2200);
  await check('Spore Cap spits from range', await ev(() => SHOTS.length > 0 || G.player.hp < G.save.maxHp));
  await place(20, 5, 0, -1); await wait(100);
  await check('Spore Cap hides under its cap up close', await ev(() => G.ents.find(e => e.type === 'spore').hiding));
  const sporeHp = await ev(() => G.ents.find(e => e.type === 'spore').hp);
  await ev(() => { const e = G.ents.find(e => e.type === 'spore'); damageEnemy(e, 1, G.player, 'swing'); });
  await check('a hidden Spore Cap blocks the chop', (await ev(() => G.ents.find(e => e.type === 'spore').hp)) === sporeHp);
  await ev(() => { G.ents = G.ents.filter(e => !e.enemy); const e = makeEnemy('slime', 18 * 16 + 8, 2 * 16 + 8); e.st = 'idle'; G.ents.push(e); e.hp = 1; damageEnemy(e, 1, G.player, 'swing'); });
  await check('a Slime splits into two minis', await ev(() => G.ents.filter(e => e.type === 'slime' && e.mini).length === 2));
  await ev(() => { G.ents = G.ents.filter(e => !e.enemy); const e = makeEnemy('beetle', 18 * 16 + 8, 2 * 16 + 8); e.st = 'idle'; G.ents.push(e); });
  await ev(() => { const e = G.ents.find(e => e.type === 'beetle'); damageEnemy(e, 1, G.player, 'swing'); });
  await check('a Beetle shrugs off a swing', await ev(() => G.ents.find(e => e.type === 'beetle').hp === 3));
  await ev(() => { const e = G.ents.find(e => e.type === 'beetle'); damageEnemy(e, 1, G.player, 'throw'); });
  await check('a thrown Jon flips the Beetle', await ev(() => G.ents.find(e => e.type === 'beetle').flipped > 0));
  await ev(() => { const e = G.ents.find(e => e.type === 'beetle'); e.flash = 0; damageEnemy(e, 1, G.player, 'swing'); });
  await check('a flipped Beetle takes the chop', await ev(() => G.ents.find(e => e.type === 'beetle').hp === 2));
  await check('damage numbers show in story mode', await ev(() => G.fx.some(f => f.kind === 'text' && f.label === '1')));

  // --- rune tablets, the map page, the clock ---
  await go('overworld', 2, 33);
  await place(2, 32, 0, -1); await pg.keyboard.press('KeyZ'); await wait(100); await talkThrough();
  await check('reading a rune tablet counts it', await ev(() => tabletsFound() === 1 && flag('got:tab_coast')));
  await ev(() => { for (const k in TABLETS) setFlag('got:' + k); });
  await ev(() => { G.save.flags['got:tab_palace'] = false; });
  const hp0 = await ev(() => G.save.maxHp);
  await go('cavern', 2, 17); await place(2, 17, 0, -1); await pg.keyboard.press('KeyZ'); await wait(100); await talkThrough();
  await check('all eight tablets grant a heart container', (await ev(() => G.save.maxHp)) === hp0 + 2 && await ev(() => flag('got:hc_tablets')));
  await go('overworld', 20, 36);
  await pg.keyboard.press('Enter'); await wait(80); await pg.keyboard.press('ArrowLeft'); await wait(80);
  await check('gear menu wraps left to the MAP page', await ev(() => G.state === 'menu' && G.menuPage === 2));
  await pg.screenshot({ path: SHOTS + '/snes_map.png' });
  await check('the map remembers screens you have visited', await ev(() => flag('seen:1,2') && flag('seen:1,0') && !flag('seen:3,0')));
  await pg.keyboard.press('Enter'); await wait(80);
  await ev(() => { G.save.clock = 22; });
  await wait(150);
  await check('night tints the overworld and lights fireflies', await ev(() => skyTint()[3] > 0.4 && isNight()));
  await pg.screenshot({ path: SHOTS + '/snes_night.png' });
  await ev(() => { G.save.clock = 6; }); await wait(150);
  await check('dawn is its own phase', await ev(() => phaseOfDay() === 'dawn'));
  await go('overworld', 40, 6); await ev(() => { G.save.clock = 12; }); await wait(300);
  await check('snow falls on the frozen screens', await ev(() => AMB.flakes.length > 0));
  await pg.screenshot({ path: SHOTS + '/snes_snow.png' });
  await go('cavern', 24, 5); await wait(100);
  await check('no snow or tint indoors', await ev(() => AMB.flakes.length === 0));

  // --- the nightmare reframe ---
  await check('the Red-Eye is a dream now', await ev(() => STORY.cargo_open[0][1].includes('bench') && STORY.attendant_down.some(l => /wake up/.test(l[1]))));
  await check('Jon says Hello Señor', await ev(() => JON.idle.includes('Hello Señor!')));

  console.log('errors:', JSON.stringify(errs));
  console.log('FAILS:', fails + errs.length);
  await b.close();
  process.exit(fails + errs.length ? 1 : 0);
})();
