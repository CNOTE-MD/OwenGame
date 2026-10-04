// The Red-Eye side dungeon. Run: NODE_PATH=$(npm root -g) node tests/redeye_test.js
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
  async function place(tx, ty, fx, fy) { await ev(([tx, ty, fx, fy]) => { const p = G.player; p.x = tx * 16 + 8; p.y = ty * 16 + 8; p.fx = fx; p.fy = fy; p.cd = 0; G.jon.mode = 'follow'; }, [tx, ty, fx, fy]); }

  await pg.goto('file://' + path.resolve(__dirname, '../web/index.html'));
  await ev(() => { try { localStorage.clear(); } catch (e) {} G.save = newSave(); G.player = makePlayer(); G.jon = makeJon(); setFlag('met_astrid'); setFlag('cargo'); });

  // locked until chapter 1 is done
  await ev(() => { loadMap('overworld', 29 * 16 + 8, 35 * 16 + 8); G.state = 'play'; });
  await place(29, 34, 0, -1); await pg.keyboard.press('KeyZ'); await wait(80); await talkThrough(); await wait(800);
  await check('cargo hold stays shut before the Thunder Rune', await ev(() => G.mapId === 'overworld'));
  await ev(() => { setFlag('d1done'); G.save.items.thunder = true; G.save.items.homing = true; });
  await place(29, 34, 0, -1); await pg.keyboard.press('KeyZ'); await wait(80); await talkThrough(); await wait(900);
  await check('after chapter 1 the cargo hold leads into the Red-Eye', await ev(() => G.mapId === 'redeye'));
  await check('Red-Eye plays the creepy theme', await ev(() => musicFor() === 'creepy'));
  await check('dark, with emergency lights', await ev(() => G.map.dark && G.map.redeye));

  // phantom seats: appear after a blackout, never on top of Owen
  await ev(() => { G.ents = G.ents.filter(e => !e.enemy); loadMap('redeye', 18 * 16 + 8, 6 * 16 + 8); G.state = 'play'; G.talk = null; G.ents = G.ents.filter(e => !e.enemy); RE.layout = 0; RE.nextBlack = 0; });
  await check('phantom seat is open in layout 0', await ev(() => !solidTile(21, 5, 'player')));
  await wait(1300);
  await check('after a blackout the phantom seats are solid', await ev(() => RE.layout === 1 && solidTile(21, 5, 'player')));
  await ev(() => { RE.layout = 0; G.player.x = 21 * 16 + 8; G.player.y = 5 * 16 + 8; RE.nextBlack = 0; RE.blackout = 0; });
  await wait(1300);
  await check('a seat never closes on top of Owen', await ev(() => RE.layout === 0));

  // galley carts roll on their own and hurt
  await ev(() => { loadMap('redeye', 33 * 16 + 8, 6 * 16 + 8); G.state = 'play'; G.talk = null; });
  const cy0 = await ev(() => G.ents.find(e => e.type === 'cart').y);
  await wait(500);
  await check('refreshment carts roll', await ev(() => G.ents.find(e => e.type === 'cart').y) !== cy0);
  await check('carts don\'t count as enemies to clear', await ev(() => !G.ents.find(e => e.type === 'cart').enemy));

  // the Flight Attendant
  await ev(() => { G.state = 'play'; G.talk = null; loadMap('redeye', 50 * 16 + 8, 7 * 16 + 8); G.player.inv = 999; });
  await wait(50);
  await check('boss intro with jump scare', await ev(() => G.state === 'talk' && G.talk.cur[0] === 'Attendant' && RE.scare > 0));
  await talkThrough();
  await check('music switches to the boss theme', await ev(() => musicFor() === 'boss'));
  await check('shutter locks the door behind you', await ev(() => shutterClosed(48, 6)));
  const att = () => ev(() => { const a = G.ents.find(e => e.type === 'attendant'); return a && { st: a.st, hp: a.hp, max: a.max }; });
  await ev(() => { const a = G.ents.find(e => e.type === 'attendant'); a.st = 'hide'; a.t = 0; damageEnemy(a, 1, G.player, 'swing'); });
  await check('she can\'t be hit while hidden', (await att()).hp === 12);
  await wait(2500);
  await check('she cycles hide -> reveal -> dash -> daze', ['hide', 'reveal', 'dash', 'daze'].includes((await att()).st));
  await ev(() => { const a = G.ents.find(e => e.type === 'attendant'); a.st = 'daze'; a.t = 0; a.flash = 0; damageEnemy(a, 1, G.player, 'swing'); });
  await check('she takes damage while dazed', (await att()).hp === 11);
  await ev(() => { const a = G.ents.find(e => e.type === 'attendant'); a.hp = 6; a.st = 'hide'; a.t = 1.29; });
  await wait(200);
  await check('below half health she throws peanuts', await ev(() => RE.shots.length >= 3));
  await ev(() => { G.save.rune = RUNE_MAX; G.player.cd = 0; });
  await pg.keyboard.press('KeyC'); await wait(1500);
  await check('Thunder Strike dazes and hurts her', (await att()).hp < 6);
  await ev(() => { const a = G.ents.find(e => e.type === 'attendant'); a.st = 'daze'; a.t = 0; a.flash = 0; a.hp = 1; damageEnemy(a, 1, G.player, 'swing'); });
  await wait(100); await talkThrough(); await wait(100);
  await check('beating her opens the rewards', await ev(() => flag('redeye_done') && G.ents.some(e => e.def && e.def.id === 'c_horn')));
  await place(57, 8, 0, -1); await pg.keyboard.press('KeyZ'); await wait(1400); await talkThrough();
  await check('Demon Horn obtained', await ev(() => G.save.items.horn));

  // the horn scares regular enemies away
  await ev(() => { loadMap('redeye', 4 * 16 + 8, 6 * 16 + 8); G.state = 'play'; G.talk = null; G.save.rune = RUNE_MAX; G.player.cd = 0; });
  await pg.keyboard.press('KeyV'); await wait(100);
  await check('Demon Horn makes enemies flee and costs half the rune meter', await ev(() => G.ents.filter(e => e.enemy).every(e => e.fear > 0) && G.save.rune === RUNE_MAX / 2));
  await check('menu objective now says chapter 1 is fully done', await ev(() => !objective().includes('cargo')));

  console.log('errors:', JSON.stringify(errs));
  console.log('FAILS:', fails + errs.length);
  await b.close();
  process.exit(fails + errs.length ? 1 : 0);
})();
