// Compass, Royal Rage, ambience, bench, deeds. Run: NODE_PATH=$(npm root -g) node tests/better_test.js
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
  const check = async (name, ok) => { console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) { fails++; console.log('   ', JSON.stringify(await ev(() => ({ st: G.state, map: G.mapId, x: G.player.x / 16, y: G.player.y / 16, deeds: G.save.deeds, ic: ICICLES.length })))); } };
  async function talkThrough(max = 80) { for (let i = 0; i < max; i++) { const st = await ev(() => G.state); if (st !== 'talk' && st !== 'hold' && st !== 'warp' && st !== 'jonlevel' && st !== 'cutscene') return; await pg.keyboard.press('KeyZ'); await wait(40); } }
  async function go(map, tx, ty, keepEnemies) { await ev(([m, x, y, k]) => { G.state = 'play'; G.talk = null; loadMap(m, x * 16 + 8, y * 16 + 8); if (!k) { G.ents = G.ents.filter(e => !e.enemy); } G.state = 'play'; G.talk = null; G.bossCard = null; }, [map, tx, ty, !!keepEnemies]); await wait(60); }

  await pg.goto('file://' + path.resolve(__dirname, '../web/index.html'));
  await ev(() => { try { localStorage.clear(); } catch (e) {} G.mode = 'story'; G.save = newSave(); applyJonPerks(); G.player = makePlayer(); G.jon = makeJon(); setFlag('jonarea:overworld'); });

  // compass
  await go('overworld', 20, 36);
  await check('compass points at Astrid first', await ev(() => objectiveTarget().label === 'Astrid'));
  await ev(() => setFlag('met_astrid'));
  await check('...then the subway', await ev(() => objectiveTarget().label === 'Subway'));
  await ev(() => setFlag('exchanged'));
  await check('...then the log', await ev(() => objectiveTarget().label === 'The log'));
  await ev(() => setFlag('log_chopped'));
  await check('...then the Penguin Palace', await ev(() => objectiveTarget().label === 'Jjorvic Palace'));
  await wait(100); await pg.screenshot({ path: SHOTS + '/better_compass.png' });
  await go('overworld', 38, 4);
  await check('on the palace screen the marker sits on the cave mouth', await ev(() => { const t = objectiveTarget(); const sx = t.x * 16 + 8 - G.cam.x; return sx > 8 && sx < 248; }));
  await go('subway', 8, 3);
  await check('no compass indoors', await ev(() => objectiveTarget() === null));
  await ev(() => { setFlag('d1done'); setFlag('d2done'); setFlag('redeye_done'); });
  await go('overworld', 20, 36);
  await check('compass rests when every chapter is done', await ev(() => objectiveTarget() === null));

  // ambience
  await check('ambience: birds by day on the overworld', await ev(() => { G.save.clock = 12; return Ambience.for() === 'birds'; }));
  await check('ambience: crickets at night', await ev(() => { G.save.clock = 23; return Ambience.for() === 'crickets'; }));
  await go('overworld', 40, 6); await check('ambience: wind on the Frozen Path', await ev(() => Ambience.for() === 'wind'));
  await go('subway', 8, 3); await check('ambience: the subway hums', await ev(() => Ambience.for() === 'subway'));
  await go('cavern', 24, 20); await check('ambience: drips in the palace', await ev(() => Ambience.for() === 'drips'));
  await ev(() => { Sound.unlock && Sound.unlock(); Ambience.tick(0.1); });
  await check('ambience ticks without errors', errs.length === 0);

  // the bench by the plane
  await go('overworld', 20, 36);
  await check('a bench appears by Flight 364 after the palace', await ev(() => G.ents.some(e => e.kind === 'cargo') && !!SPR.bench));

  // Royal Rage
  await ev(() => { G.save.flags['king_owen'] = false; G.save.flags['intro:king'] = true; });
  await go('cavern', 24, 8, true); await talkThrough();
  await ev(() => { const k = G.ents.find(e => e.type === 'king'); k.st = 'waddle'; k.t = 0; k.hp = 4; });
  await wait(150);
  await check('the King rages below four hearts', await ev(() => { const k = G.ents.find(e => e.type === 'king'); return k.raged && JON.rage.includes(JT.line); }));
  await ev(() => { const k = G.ents.find(e => e.type === 'king'); k.st = 'slide'; k.t = 0; k.bounces = 0; k.fx = 1; k.fy = 0; });
  await pg.waitForFunction(() => ICICLES.length > 0, null, { timeout: 4000 }).catch(() => {});
  await check('his bounces shake icicles loose', await ev(() => ICICLES.length >= 1));
  await pg.screenshot({ path: SHOTS + '/better_rage.png' });
  await ev(() => { ICICLES.length = 0; ICICLES.push({ x: G.player.x, y: G.player.y, t: 0, warn: 0.1, fall: 0.2 }); G.player.inv = 0; });
  const hp0 = await ev(() => G.player.hp);
  await wait(300);
  await check('an icicle landing on Owen hurts', (await ev(() => G.player.hp)) === hp0 - 1);
  await ev(() => { const k = G.ents.find(e => e.type === 'king'); killEnemy(k); });
  await check('the King\'s fall clears the icicles', await ev(() => ICICLES.length === 0));
  await talkThrough();

  // deeds
  await check('deeds count chops and time', await ev(() => G.save.deeds.kills >= 1 && G.save.deeds.seconds > 0));
  await ev(() => { JT.streak = 3; comboUp(); });
  await check('best combo is remembered', await ev(() => G.save.deeds.combo === 3));
  await ev(() => { G.player.hp = 1; G.save.voodoo = false; G.save.voodoo2 = false; G.save.potions = 0; G.player.inv = 0; hurtPlayer(1, { x: 0, y: 0 }, true); });
  await pg.waitForFunction(() => G.state === 'over', null, { timeout: 5000 }).catch(() => {});
  await check('a nap is a deed too', await ev(() => G.state === 'over' && G.save.deeds.deaths === 1));
  await check('rumble helper is safe without a controller', await ev(() => { rumble(50); return true; }));

  console.log('errors:', JSON.stringify(errs));
  console.log('FAILS:', fails + errs.length);
  await b.close();
  process.exit(fails + errs.length ? 1 : 0);
})();
