// Chapter 2 draft: the Drowned Barrow. Run: NODE_PATH=$(npm root -g) node tests/ch2_test.js
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
  const check = async (name, ok) => { console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) { fails++; console.log('   ', JSON.stringify(await ev(() => ({ st: G.state, map: G.mapId, scr: G.scr, x: G.player.x / 16, y: G.player.y / 16, talk: G.talk && G.talk.cur })))); } };
  async function talkThrough(max = 80) { for (let i = 0; i < max; i++) { const st = await ev(() => G.state); if (st !== 'talk' && st !== 'hold' && st !== 'warp' && st !== 'jonlevel') return; await pg.keyboard.press('KeyZ'); await wait(40); } }
  async function place(tx, ty, fx, fy) { await ev(([tx, ty, fx, fy]) => { const p = G.player; p.x = tx * 16 + 8; p.y = ty * 16 + 8; p.fx = fx; p.fy = fy; p.cd = 0; p.dashCd = 0; p.vx = p.vy = 0; G.jon.mode = 'follow'; }, [tx, ty, fx, fy]); }
  async function go(map, tx, ty, keepEnemies) { await ev(([m, x, y, k]) => { G.state = 'play'; G.talk = null; loadMap(m, x * 16 + 8, y * 16 + 8); if (!k) { G.ents = G.ents.filter(e => !e.enemy); G.state = 'play'; G.talk = null; } }, [map, tx, ty, !!keepEnemies]); await wait(60); }

  await pg.goto('file://' + path.resolve(__dirname, '../web/index.html'));
  await ev(() => { try { localStorage.clear(); } catch (e) {} G.save = newSave(); G.player = makePlayer(); G.jon = makeJon(); setFlag('met_astrid'); });

  // the barrow seal
  await go('overworld', 7, 4);
  await check('barrow sealed before chapter 1 ends', await ev(() => tile(7, 2) === 'X'));
  await ev(() => { setFlag('d1done'); G.save.items.thunder = true; G.save.items.homing = true; });
  await go('overworld', 7, 4);
  await check('seal opens into a cave mouth after the Thunder Rune', await ev(() => tile(7, 2) === 'E' && G.ents.some(e => e.kind === 'warp')));
  await place(7, 3, 0, -1); await pg.keyboard.down('ArrowUp'); await wait(300); await pg.keyboard.up('ArrowUp'); await wait(900); await talkThrough();
  await check('enter the Drowned Barrow', await ev(() => G.mapId === 'barrow'));
  await check('barrow plays its 9/8 theme', await ev(() => musicFor() === 'barrow'));
  await check('Astrid now points at the barrow', await ev(() => npcLines('astrid').some(l => /Barrow/.test(l[1]))));

  // water and barriers stop you without the dash
  await go('barrow', 24, 21);
  await place(24, 21, 0, -1); await pg.keyboard.down('ArrowUp'); await wait(700); await pg.keyboard.up('ArrowUp');
  await check('channel blocks walking', await ev(() => G.player.y / 16 > 19.5));
  await place(28, 20, 1, 0); await pg.keyboard.down('ArrowRight'); await wait(700); await pg.keyboard.up('ArrowRight');
  await check('spirit barrier blocks walking', await ev(() => G.player.x / 16 < 31));

  // Draugr Captain guards the Voodoo Dash
  await go('barrow', 12, 20, true);
  await check('Captain intro', await ev(() => G.state === 'talk' && G.talk.cur[0] === 'Draugr Captain'));
  await talkThrough();
  await ev(() => { const c = G.ents.find(e => e.type === 'captain'); c.fx = 1; c.fy = 0; c.st = 'chase'; });
  await ev(() => { const c = G.ents.find(e => e.type === 'captain'); damageEnemy(c, 1, { x: c.x + 20, y: c.y }, 'swing'); });
  await check('Captain\'s shield blocks the front and staggers', await ev(() => { const c = G.ents.find(e => e.type === 'captain'); return c.hp === c.max && c.guardDown > 0; }));
  await ev(() => { const c = G.ents.find(e => e.type === 'captain'); c.hp = 1; c.flash = 0; damageEnemy(c, 1, { x: c.x + 20, y: c.y }, 'swing'); });
  await wait(450); await talkThrough();   // the boss hit-stop lasts 0.28s before Jon's level-up can appear
  await check('beating him reveals the dash chest', await ev(() => G.ents.some(e => e.def && e.def.id === 'br_dash')));
  await place(8, 21, 0, -1); await pg.keyboard.press('KeyZ'); await wait(1400); await talkThrough();
  await check('got the Voodoo Dash', await ev(() => G.save.items.dash));

  // dash across the channel and through the barrier
  await go('barrow', 24, 21);
  await place(24, 21, 0, -1); await pg.keyboard.press('ShiftLeft'); await wait(500);
  await check('dash crosses the flooded channel', await ev(() => G.player.y / 16 < 18 && G.player.falling <= 0));
  await place(29, 20, 1, 0); await pg.keyboard.press('KeyF'); await wait(500);
  await check('dash passes the spirit barrier', await ev(() => G.player.x / 16 > 32));
  await pg.waitForFunction(() => !G.trans, null, { timeout: 3000 }); await talkThrough();
  await place(35, 20, 1, 0); await pg.keyboard.press('KeyF'); await wait(500);
  await check('dash clears the pit gap', await ev(() => G.player.x / 16 > 38.5 && G.player.falling <= 0));
  await place(39, 20, 1, 0); await ev(() => { G.player.x = 39 * 16 + 8; });
  await place(43, 20, 1, 0); await pg.keyboard.press('KeyZ'); await wait(1400); await talkThrough();
  await check('big key across the pits', await ev(() => G.save.bigkeys.barrow));
  // dashing into deep water from a standstill drops you back at the room entrance
  await go('barrow', 34, 34); await place(40, 34, 1, 0); await ev(() => { G.player.dashCd = 0; startDash(); G.player.dashing = 0.05; });
  await wait(1200); await talkThrough();
  await check('ending a dash in deep water sinks you and respawns you', await ev(() => tileAt(G.player.x, G.player.y) !== 'w'));

  // Hank's ghost
  await ev(() => { G.save.bigkeys.barrow = true; });
  await go('barrow', 24, 10, true);
  await check('Hank intro', await ev(() => G.state === 'talk'));
  await talkThrough();
  await check('boss music', await ev(() => musicFor() === 'boss'));
  const hank = () => ev(() => { const h = G.ents.find(e => e.type === 'hank'); return h && { st: h.st, hp: h.hp, frozen: h.frozen }; });
  await wait(100);
  await ev(() => { const h = G.ents.find(e => e.type === 'hank'); damageEnemy(h, 1, G.player, 'swing'); });
  await check('frozen Hank shrugs off Jon', (await hank()).hp === 10 && (await hank()).frozen);
  await ev(() => { const h = G.ents.find(e => e.type === 'hank'); G.player.inv = 9; G.player.x = h.x; G.player.y = h.y + 30; G.player.fx = 0; G.player.fy = -1; G.player.dashCd = 0; startDash(); });
  await wait(400);
  await check('dashing through him shatters the frost', !(await hank()).frozen && (await hank()).st === 'daze');
  await ev(() => { const h = G.ents.find(e => e.type === 'hank'); h.flash = 0; damageEnemy(h, 1, G.player, 'swing'); });
  await check('then Jon can hurt him', (await hank()).hp === 9);
  await ev(() => { const h = G.ents.find(e => e.type === 'hank'); h.throwT = 2.39; h.st = 'float'; h.frozen = true; });
  await wait(150);
  await check('he throws spectral axes', await ev(() => HK.axes.length > 0));
  await ev(() => { G.save.rune = RUNE_MAX; G.player.cd = 0; });
  await pg.keyboard.press('KeyC'); await wait(1500);
  await check('Thunder Strike also shatters the frost', !(await hank()).frozen && (await hank()).hp < 9);
  await ev(() => { const h = G.ents.find(e => e.type === 'hank'); h.frozen = false; h.st = 'daze'; h.t = 0; h.flash = 0; h.hp = 1; damageEnemy(h, 1, G.player, 'swing'); });
  await wait(100); await talkThrough(); await wait(100);
  await check('freeing Hank completes chapter 2', await ev(() => flag('d2done') && G.ents.some(e => e.what === 'container')));
  await check('objective moves on to Walter\'s Forge', await ev(() => /Forge/.test(objective())));
  await go('overworld', 7, 5);
  await check('CHAPTER 3 COMPLETE banner (Barrow is journal chapter 3)', await ev(() => G.banner === 'CHAPTER 3 COMPLETE'));

  console.log('errors:', JSON.stringify(errs));
  console.log('FAILS:', fails + errs.length);
  await b.close();
  process.exit(fails + errs.length ? 1 : 0);
})();
