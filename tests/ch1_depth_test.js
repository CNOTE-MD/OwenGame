// Chapter 1 depth: house interiors, both side quests, the grave secret and Bjarne's song.
// Run: NODE_PATH=$(npm root -g) node tests/ch1_depth_test.js
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
  const check = async (name, ok) => { console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) { fails++; console.log('   ', JSON.stringify(await ev(() => ({ st: G.state, map: G.mapId, x: G.player.x / 16, y: G.player.y / 16, talk: G.talk && G.talk.cur })))); } };
  async function talkThrough(max = 80) { for (let i = 0; i < max; i++) { const st = await ev(() => G.state); if (st !== 'talk' && st !== 'hold' && st !== 'warp') return; await pg.keyboard.press('KeyZ'); await wait(40); } }
  async function place(tx, ty, fx, fy) { await ev(([tx, ty, fx, fy]) => { const p = G.player; p.x = tx * 16 + 8; p.y = ty * 16 + 8; p.fx = fx; p.fy = fy; p.cd = 0; p.inv = 9; G.jon.mode = 'follow'; }, [tx, ty, fx, fy]); }
  async function go(map, tx, ty) { await ev(([m, x, y]) => { loadMap(m, x * 16 + 8, y * 16 + 8); G.state = 'play'; G.talk = null; G.ents = G.ents.filter(e => !e.enemy); }, [map, tx, ty]); await wait(60); }
  async function press(k, ms = 80) { await pg.keyboard.press(k); await wait(ms); }

  await pg.goto('file://' + path.resolve(__dirname, '../web/index.html'));
  await ev(() => { try { localStorage.clear(); } catch (e) {} G.save = newSave(); G.player = makePlayer(); G.jon = makeJon(); setFlag('met_astrid'); });

  // Astrid's house: door from outside, chest inside, exit back out
  await go('overworld', 4, 20); await place(4, 19, 0, -1); await press('KeyZ', 900);
  await check('enter Astrid\'s house through the door', await ev(() => G.mapId === 'astrid_house'));
  await place(10, 1, 0, -1); await press('KeyZ'); await talkThrough();
  await place(14, 11, 0, -1); await press('KeyZ', 1400); await talkThrough();
  await check('Astrid\'s chest gives juice', await ev(() => G.save.potions === 1));
  await place(7, 12, 0, 1); await pg.keyboard.down('ArrowDown'); await wait(500); await pg.keyboard.up('ArrowDown'); await wait(800);
  await check('exit back to the village', await ev(() => G.mapId === 'overworld' && Math.floor(G.player.y / 16) === 19));

  // Bjarne's quest
  await go('overworld', 13, 21); await place(13, 20, 0, -1); await press('KeyZ', 900);
  await check('enter Bjarne\'s house', await ev(() => G.mapId === 'bjarne_house'));
  await place(7, 7, 0, -1); await press('KeyZ'); await talkThrough();
  await check('Bjarne starts his quest', await ev(() => flag('quest_bjarne')));
  await go('overworld', 43, 38); await wait(100);
  await check('sheet music appears on the beach', await ev(() => G.ents.some(e => e.what === 'qitem' && e.id === 'sheet')));
  await place(43, 37, 0, -1); await wait(1500); await talkThrough();
  await check('picked up the sheet music', await ev(() => flag('got:sheet')));
  await go('bjarne_house', 7, 8); await place(7, 7, 0, -1);
  const pieces0 = await ev(() => G.save.pieces);
  await press('KeyZ'); await talkThrough(); await wait(1400); await talkThrough();
  await check('Bjarne rewards a heart piece', await ev(() => flag('bjarne_done')) && (await ev(() => G.save.pieces)) === pieces0 + 1);
  await check('Rush Ø plays in Bjarne\'s house afterwards', await ev(() => musicFor() === 'bjarne'));

  // Sven's quest: the ship is hidden under a bush until it's cut
  await go('overworld', 24, 26); await ev(() => { G.ents.find(e => e.id === 'sven') && (G.player.x = G.ents.find(e => e.id === 'sven').x - 14, G.player.y = G.ents.find(e => e.id === 'sven').y); G.player.fx = 1; G.player.fy = 0; G.player.cd = 0; });
  await press('KeyZ'); await talkThrough();
  await check('Sven starts his quest', await ev(() => flag('quest_sven')));
  await go('overworld', 21, 11); await wait(60);
  await check('ship hidden while its bush stands', await ev(() => tile(21, 9) === 'b' && G.ents.some(e => e.id === 'ship')));
  await place(21, 10, 0, -1); await press('KeyZ', 300);
  await check('cutting the bush reveals it', await ev(() => tile(21, 9) !== 'b'));
  await place(21, 9, 0, -1); await wait(1500); await talkThrough();
  await check('picked up the longship', await ev(() => flag('got:ship')));
  await go('overworld', 24, 26); await ev(() => { const s = G.ents.find(e => e.id === 'sven'); G.player.x = s.x - 14; G.player.y = s.y; G.player.fx = 1; G.player.fy = 0; G.player.cd = 0; });
  const kr0 = await ev(() => G.save.kr);
  await press('KeyZ'); await talkThrough();
  await check('Sven pays 30 kr', await ev(() => flag('sven_done')) && (await ev(() => G.save.kr)) === kr0 + 30);

  // the grave secret
  await go('overworld', 61, 38); await place(61, 37, 0, -1); await press('KeyZ'); await talkThrough(); await wait(100);
  await check('reading Fluffy\'s grave opens stairs', await ev(() => tile(61, 36) === '>' && flag('grave_open')));
  await place(61, 37, 0, -1); await pg.keyboard.down('ArrowUp'); await wait(400); await pg.keyboard.up('ArrowUp'); await wait(900); await talkThrough();
  await check('stairs lead to the hidden cave', await ev(() => G.mapId === 'secret_cave'));
  await ev(() => { G.ents = G.ents.filter(e => !e.enemy); });
  const p1 = await ev(() => G.save.pieces);
  await place(5, 2, 0, -1); await press('KeyZ', 1400); await talkThrough();
  await check('cave chest holds a heart piece', await ev(() => G.save.pieces) === p1 + 1);
  await check('cave is dark (lighting on)', await ev(() => !!G.map.dark));
  // the opened stairs stay open after a reload
  await ev(() => writeSave());
  await ev(() => { G.save = readSave(); loadMap('overworld', 61 * 16 + 8, 38 * 16 + 8); });
  await check('stairs persist after saving', await ev(() => tile(61, 36) === '>'));

  console.log('errors:', JSON.stringify(errs));
  console.log('FAILS:', fails + errs.length);
  await b.close();
  process.exit(fails + errs.length ? 1 : 0);
})();
