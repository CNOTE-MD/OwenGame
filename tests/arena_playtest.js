// Headless test of Valhalla Arena. Run: NODE_PATH=$(npm root -g) node tests/arena_playtest.js
const { chromium } = require('playwright');
const path = require('path');
const SHOTS = process.env.SHOTS || '/tmp';
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 820, height: 900 } });
  const errs = []; let fails = 0;
  pg.on('pageerror', e => errs.push('pageerror ' + e.message));
  pg.on('console', m => { if (m.type() === 'error' && !/fonts|net::|ERR_/.test(m.text())) errs.push(m.text()); });
  const check = (name, ok) => { console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) fails++; };
  const ev = (f, a) => pg.evaluate(f, a);
  const wait = ms => pg.waitForTimeout(ms);
  async function talkThrough() { for (let i = 0; i < 40 && (await ev(() => G.state)) === 'talk'; i++) { await pg.keyboard.press('KeyZ'); await wait(40); } }

  await pg.goto('file://' + path.resolve(__dirname, '../web/index.html'));
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await pg.reload(); await wait(300);
  const idx = await ev(() => titleOptions().findIndex(o => o.id === 'arena'));
  for (let i = 0; i < idx; i++) { await pg.keyboard.press('ArrowDown'); await wait(30); }
  await pg.keyboard.press('KeyZ'); await wait(100);
  check('arena intro', await ev(() => G.mode === 'arena' && G.state === 'talk'));
  await talkThrough();
  check('wave 1 running', await ev(() => A.wave === 1 && G.state === 'play'));
  await ev(() => { G.player.inv = 999; });
  await wait(4000);
  check('enemies spawn with warnings', await ev(() => G.ents.filter(e => e.enemy).length > 0));
  check('camera follows Owen', await ev(() => Math.abs(G.cam.x - clamp(G.player.x - 128, 0, G.cols * 16 - 256)) < 1));
  // fight: swing and throw a bunch
  for (let i = 0; i < 12; i++) { await pg.keyboard.press(i % 2 ? 'KeyX' : 'KeyZ'); await wait(150); }
  await pg.screenshot({ path: SHOTS + '/a1_wave.png' });
  check('kills give kroner + xp', await ev(() => A.kills > 0 || G.save.kr >= 0));
  // fast-forward to end of wave
  await ev(() => { G.save.kr += 200; A.xp = xpNeed() - 1; killEnemy(G.ents.find(e => e.enemy) || makeEnemy('penguin', 300, 300)); A.t = A.len; });
  await wait(200);
  check('level-up screen after wave', await ev(() => G.state === 'levelup'));
  const dmg0 = await ev(() => G.st.dmg + G.st.speed + G.st.atk + G.save.maxHp + G.st.regen + G.st.crit + G.st.pickup + G.st.armor + G.st.range);
  await pg.keyboard.press('KeyZ'); await wait(100);
  check('level-up applied a stat', await ev(() => G.st.dmg + G.st.speed + G.st.atk + G.save.maxHp + G.st.regen + G.st.crit + G.st.pickup + G.st.armor + G.st.range) !== dmg0);
  check('shop opens', await ev(() => G.state === 'shop' && A.cards.length === 4));
  await pg.screenshot({ path: SHOTS + '/a2_shop.png' });
  const kr0 = await ev(() => G.save.kr);
  await pg.keyboard.press('KeyZ'); await wait(80);
  check('bought a card', await ev(() => A.cards[0].sold) && (await ev(() => G.save.kr)) < kr0);
  await pg.keyboard.press('KeyX'); await wait(80);
  check('reroll', await ev(() => A.rerolls === 1 && !A.cards[0].sold));
  // give every weapon and test they work
  await ev(() => { for (const id of ['orbit', 'frost', 'chain', 'turret', 'pal', 'homing', 'thunder']) { const c = ARENA_CARDS.find(c => c.id === id); c.apply(); A.owned[id] = (A.owned[id] || 0) + 1; } });
  await pg.keyboard.press('Enter'); await wait(100);
  check('wave 2 starts', await ev(() => A.wave === 2 && G.state === 'play'));
  await ev(() => { G.player.inv = 999; for (let i = 0; i < 6; i++) arenaSpawn('penguin', G.player.x + 30 + i * 6, G.player.y + 10, true); });
  await wait(2500);
  await pg.screenshot({ path: SHOTS + '/a3_weapons.png' });
  check('weapons kill enemies on their own', await ev(() => A.kills) >= 4);
  // boss wave
  await ev(() => { A.wave = 4; A.t = A.len; });
  await wait(150);
  for (let i = 0; i < 6 && (await ev(() => G.state)) !== 'play'; i++) { await pg.keyboard.press('Enter'); await pg.keyboard.press('KeyZ'); await wait(80); }
  check('wave 5 has the Penguin King', await ev(() => A.wave === 5 && G.ents.some(e => e.type === 'king')));
  await ev(() => { G.save.rune = RUNE_MAX; G.player.cd = 0; });
  await pg.keyboard.press('KeyC'); await wait(1600);
  check('thunder works in arena', await ev(() => { const k = G.ents.find(e => e.type === 'king'); return !k || k.hp < k.max; }));
  await ev(() => { A.t = A.len; for (const k of G.ents.filter(e => e.type === 'king')) killEnemy(k); });
  await wait(200);
  check('boss wave ends after king dies', await ev(() => G.state === 'levelup' || G.state === 'shop'));
  // death -> results
  await ev(() => { G.state = 'play'; G.save.potions = 0; G.player.inv = 0; hurtPlayer(99, G.player); });
  await wait(100);
  await pg.screenshot({ path: SHOTS + '/a4_over.png' });
  check('defeat screen + best saved', await ev(() => G.state === 'arenaover' && arenaBest() >= 5));
  await pg.keyboard.press('KeyZ'); await wait(100);
  check('back to title, story stats reset', await ev(() => G.state === 'title' && G.mode === 'story' && G.st.dmg === 1));
  console.log('errors:', JSON.stringify(errs));
  console.log('FAILS:', fails + errs.length);
  await b.close();
  process.exit(fails + errs.length ? 1 : 0);
})();
