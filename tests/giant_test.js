// Owen's page 6: the Forest Giant of the North. Run: NODE_PATH=$(npm root -g) node tests/giant_test.js
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
  const giant = () => ev(() => { const g = G.ents.find(e => e.type === 'giant'); return g && { st: g.st, hp: g.hp, hiding: !!g.hiding, hid: !!g.hid, x: g.x / 16, y: g.y / 16 }; });
  const check = async (name, ok) => { console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) { fails++; console.log('   ', JSON.stringify({ st: await ev(() => G.state), g: await giant(), talk: await ev(() => G.talk && G.talk.cur), p: await ev(() => [G.player.x / 16, G.player.y / 16, G.player.hp]) })); } };
  async function talkThrough(max = 80) { for (let i = 0; i < max; i++) { const st = await ev(() => G.state); if (st !== 'talk' && st !== 'hold' && st !== 'warp' && st !== 'jonlevel' && st !== 'cutscene') return; await pg.keyboard.press('KeyZ'); await wait(40); } }
  async function place(tx, ty, fx, fy) { await ev(([tx, ty, fx, fy]) => { const p = G.player; p.x = tx * 16 + 8; p.y = ty * 16 + 8; p.fx = fx; p.fy = fy; p.cd = 0; p.dashCd = 0; p.vx = p.vy = 0; p.inv = 0; G.jon.mode = 'follow'; }, [tx, ty, fx, fy]); }
  async function go(map, tx, ty) { await ev(([m, x, y]) => { G.state = 'play'; G.talk = null; loadMap(m, x * 16 + 8, y * 16 + 8); G.ents = G.ents.filter(e => !e.enemy || e.type === 'giant'); G.state = 'play'; G.talk = null; G.bossCard = null; }, [map, tx, ty]); await wait(60); }

  await pg.goto('file://' + path.resolve(__dirname, '../web/index.html'));
  await ev(() => { try { localStorage.clear(); } catch (e) {} G.mode = 'story'; G.save = newSave(); applyJonPerks(); G.player = makePlayer(); G.jon = makeJon(); setFlag('met_astrid'); setFlag('jonarea:overworld'); setFlag('log_scene'); setFlag('forest_arrival'); setFlag('exchanged'); G.save.maxHp = 10; G.player.hp = 10; });

  await go('overworld', 28, 6);
  await check('the log waits in the Muck Forest', await ev(() => G.ents.some(e => e.kind === 'log') && MAPS.cavern.name === 'Jjorvic Palace'));
  for (let i = 0; i < 3; i++) { await place(30, 6, 1, 0); await pg.keyboard.press('KeyZ'); await wait(450); }
  await check('the third chop: the log stands up', await ev(() => G.state === 'talk' && STORY.log_wakes.some(l => l[1] === G.talk.cur[1])));
  await talkThrough(4);
  await check('Owen\'s page 6 plays: "Who awakens the Forest Giant of the NORTH?!"', await ev(() => G.ents.some(e => e.type === 'giant') && flag('giant_woke') && G.bossCard && G.bossCard.name === 'FOREST GIANT OF THE NORTH' && giantIntroLines().some(l => /awakens the Forest Giant of the NORTH/i.test(l[1])) && giantIntroLines().some(l => l[1] === 'Um, we were looking for Jjorvic Palace.') && giantIntroLines().some(l => /big boss fight scene please/.test(l[1]))));
  await pg.screenshot({ path: SHOTS + '/giant_intro.png' });
  await talkThrough();
  await wait(100);
  await check('after the talk he stalks', (await giant()).st === 'stalk');
  await check('the log tiles stay until he falls', await ev(() => tile(31, 5) === 'o'));
  // too tall
  await ev(() => { const g = G.ents.find(e => e.type === 'giant'); g.st = 'stalk'; g.flash = 0; damageEnemy(g, 1, G.player, 'swing'); });
  await check('a chop while he stands is TOO TALL', (await giant()).hp === 12 && await ev(() => G.fx.some(f => f.kind === 'text' && f.label === 'TOO TALL')));
  // fire burns
  await ev(() => { const g = G.ents.find(e => e.type === 'giant'); g.flash = 0; damageEnemy(g, 2, G.player, 'magic'); });
  await check('fire burns him for extra', (await giant()).hp === 9);
  // the slam
  await place(26, 9, 1, 0);
  await ev(() => { const g = G.ents.find(e => e.type === 'giant'); g.st = 'raise'; g.t = 0.6; g.aim = { x: G.player.x, y: G.player.y }; G.player.inv = 0; G.player.kx = G.player.ky = 0; });
  const hp0 = await ev(() => G.player.hp);
  await pg.waitForFunction(() => { const g = G.ents.find(e => e.type === 'giant'); return g && g.st === 'stuck'; }, null, { timeout: 3000 }).catch(() => {});
  await check('the club slams where Owen stood and sticks in the muck', (await giant()).st === 'stuck' && (await ev(() => G.player.hp)) === hp0 - 2);
  await pg.screenshot({ path: SHOTS + '/giant_stuck.png' });
  await ev(() => { const g = G.ents.find(e => e.type === 'giant'); g.flash = 0; damageEnemy(g, 1, G.player, 'swing'); });
  await check('while stuck, Jon\'s chop lands', (await giant()).hp === 8);
  // hide and seek
  await ev(() => { const g = G.ents.find(e => e.type === 'giant'); g.hp = 6; g.st = 'stalk'; g.t = 0; }); await wait(120); await talkThrough();
  await check('below half health he hides as a tree', (await giant()).hiding && await ev(() => G.ents.filter(e => e.kind === 'faketree').length === 3 && G.ents.filter(e => e.kind === 'faketree' && e.real).length === 1));
  await pg.screenshot({ path: SHOTS + '/giant_hide.png' });
  await ev(() => { const g = G.ents.find(e => e.type === 'giant'); g.flash = 0; damageEnemy(g, 1, G.player, 'swing'); });
  await check('you can\'t hurt a hidden giant', (await giant()).hp === 6);
  await ev(() => { const t = G.ents.find(e => e.kind === 'faketree' && !e.real); hitFakeTree(t); });
  await check('a wrong tree is just a tree', await ev(() => G.ents.filter(e => e.kind === 'faketree').length === 2 && G.ents.find(e => e.type === 'giant').hiding));
  await ev(() => { const t = G.ents.find(e => e.kind === 'faketree' && e.real); hitFakeTree(t); });
  await check('the shivering tree is him: found and stuck', !(await giant()).hiding && (await giant()).st === 'stuck' && await ev(() => !G.ents.some(e => e.kind === 'faketree') && JON.giant_found.includes(JT.line)));
  // leaving and coming back
  await go('overworld', 20, 36); await go('overworld', 28, 6);
  await check('he is still there if you run away', await ev(() => G.ents.some(e => e.type === 'giant') && !G.ents.some(e => e.kind === 'log')));
  await talkThrough();
  // the fall
  await ev(() => { const g = G.ents.find(e => e.type === 'giant'); g.st = 'stuck'; g.hp = 1; g.flash = 0; damageEnemy(g, 1, G.player, 'swing'); });
  await wait(400); await talkThrough();
  await check('the giant falls; the way east opens for good', await ev(() => tile(31, 5) === 's' && tile(31, 6) === 's' && flag('log_chopped') && flag('giant_done') && !G.ents.some(e => e.type === 'giant')));
  await go('overworld', 28, 6);
  await check('no log, no giant, after a reload', await ev(() => !G.ents.some(e => e.type === 'giant' || e.kind === 'log') && tile(31, 6) === 's'));
  await check('a runestone stands in the forest for the retry', await ev(() => G.ents.some(e => e.kind === 'runestone')));
  await check('the palace is Jjorvic Palace everywhere', await ev(() => /Jjorvic/i.test(STORY.signs.sign_cavern[0][1]) && /Jjorvic/.test(STORY.astrid_2[0][1]) && /Jjorvic/.test(objective() + '')));

  console.log('errors:', JSON.stringify(errs));
  console.log('FAILS:', fails + errs.length);
  await b.close();
  process.exit(fails + errs.length ? 1 : 0);
})();
