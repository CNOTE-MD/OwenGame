// Jon's personality + growth, and the touch thumbstick. Run: NODE_PATH=$(npm root -g) node tests/jon_test.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 500, height: 900 } });
  const errs = []; let fails = 0;
  pg.on('pageerror', e => errs.push('pageerror ' + e.message));
  pg.on('console', m => { if (m.type() === 'error' && !/fonts|net::|ERR_/.test(m.text())) errs.push(m.text()); });
  const ev = (f, a) => pg.evaluate(f, a);
  const wait = ms => pg.waitForTimeout(ms);
  const check = async (name, ok) => { console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) { fails++; console.log('   ', JSON.stringify(await ev(() => ({ st: G.state, jon: G.save && G.save.jon, line: JT.line, face: jonFaceNow() })))); } };
  async function talkThrough(max = 60) { for (let i = 0; i < max; i++) { const st = await ev(() => G.state); if (st !== 'talk' && st !== 'hold') return; await pg.keyboard.press('KeyZ'); await wait(40); } }

  await pg.goto('file://' + path.resolve(__dirname, '../web/index.html'));
  await ev(() => { try { localStorage.clear(); } catch (e) {} G.mode = 'story'; G.save = newSave(); applyJonPerks(); G.player = makePlayer(); G.jon = makeJon(); setFlag('met_astrid'); loadMap('overworld', 20 * 16 + 8, 22 * 16 + 8); G.state = 'play'; G.talk = null; G.ents = G.ents.filter(e => !e.enemy); });
  await wait(100);

  // personality
  await check('Jon greets a new area', await ev(() => JT.line === JON.area.village || flag('jonarea:village')));
  await ev(() => { JT.t = 0; JT.cd = {}; JT.idle = 8.95; G.player.moving = false; });
  await wait(150);
  await check('Jon talks when Owen stands still', await ev(() => JON.idle.includes(JT.line)));
  await ev(() => { JT.t = 0; JT.idle = 21.95; });
  await wait(150);
  await check('...then falls asleep', await ev(() => JT.asleep && jonFaceNow() === 'sleepy'));
  await pg.keyboard.down('ArrowLeft'); await wait(120); await pg.keyboard.up('ArrowLeft');
  await check('moving wakes him up', await ev(() => !JT.asleep && JON.wake.includes(JT.line)));
  await ev(() => { JT.t = 0; JT.cd = {}; G.player.inv = 0; hurtPlayer(1, { x: G.player.x + 10, y: G.player.y }); });
  await check('Jon worries when Owen gets hurt', await ev(() => jonFaceNow() === 'worried' && JON.hurt.includes(JT.line)));
  await check('four faces built', await ev(() => ['excited', 'worried', 'sleepy'].every(f => SPR['jon_' + f])));

  // growth
  await ev(() => { G.player.hp = G.save.maxHp; G.player.inv = 9; for (let i = 0; i < 10; i++) { const e = makeEnemy('penguin', G.player.x + 40, G.player.y); G.ents.push(e); killEnemy(e); } });
  await check('kills give Jon XP', await ev(() => G.save.jon.xp >= 20 || G.state === 'jonlevel'));
  await wait(100);
  await check('level-up screen offers 3 perks', await ev(() => G.state === 'jonlevel' && G.jonChoices.length === 3));
  await ev(() => { G.jonChoices[0] = JON_PERKS.find(p => p.id === 'edge'); G.menuSel = 0; });
  await pg.keyboard.press('KeyZ'); await wait(80);
  await check('picking Sharper Edge raises damage', await ev(() => G.save.jon.lvl === 2 && Math.abs(G.st.dmg - 1.2) < 1e-9 && G.state === 'play'));
  await ev(() => writeSave());
  await ev(() => { G.st = baseStats(); continueGame(); });
  await check('perks survive save and continue', await ev(() => Math.abs(G.st.dmg - 1.2) < 1e-9 && G.save.jon.lvl === 2));
  await check('arena ignores story perks', await ev(() => { startArena(); const ok = G.st.dmg === 1 && !jonHas('spin'); G.mode = 'story'; continueGame(); return ok; }));

  // spin attack at level 3
  await ev(() => { G.save.jon.lvl = 3; G.state = 'play'; G.talk = null; G.ents = G.ents.filter(e => !e.enemy); G.player.cd = 0; G.jon.mode = 'follow'; });
  await ev(() => { for (const [dx, dy] of [[18, 0], [-18, 0], [0, 18]]) G.ents.push(makeEnemy('penguin', G.player.x + dx, G.player.y + dy)); G.ents.forEach(e => { if (e.enemy) e.hp = 5; }); });
  await pg.keyboard.down('KeyZ'); await wait(900); await pg.keyboard.up('KeyZ'); await wait(500);
  await check('Spin Attack hits enemies on all sides', await ev(() => G.ents.filter(e => e.enemy).every(e => e.hp < 5)));

  // ricochet at level 7
  await ev(() => { G.save.jon.lvl = 7; G.ents = G.ents.filter(e => !e.enemy); G.jon.mode = 'follow'; G.player.cd = 0; G.player.fx = 1; G.player.fy = 0;
    const a = makeEnemy('penguin', G.player.x + 40, G.player.y), c = makeEnemy('penguin', G.player.x + 40, G.player.y + 60); a.hp = c.hp = 5; G.ents.push(a, c); });
  await pg.keyboard.press('KeyX'); await wait(1200);
  await check('Ricochet: one throw hits two enemies', await ev(() => G.ents.filter(e => e.enemy).every(e => e.hp < 5)));

  // best friends forever at level 10
  await ev(() => { G.save.jon.lvl = 9; G.save.jon.xp = 0; G.ents = G.ents.filter(e => !e.enemy); jonXP(200); maybeJonLevelUp(); });
  await check('level 10 unlocks Best Friends Forever', await ev(() => G.save.jon.lvl === 10 && G.save.voodoo2 === true));
  await ev(() => { G.state = 'play'; G.save.potions = 0; G.save.voodoo = false; G.player.inv = 0; hurtPlayer(99, G.player); });
  await pg.waitForFunction(() => G.state !== 'dying', null, { timeout: 4000 });
  await check('BFF revive saves Owen after the voodoo bond is spent', await ev(() => G.state === 'talk' && G.player.hp === G.save.maxHp && !G.save.voodoo2));
  await talkThrough();
  await ev(() => { G.state = 'menu'; G.menuPage = 0; });
  await pg.keyboard.press('ArrowRight'); await wait(60);
  await check('gear menu has a JON page', await ev(() => G.menuPage === 1));
  await pg.keyboard.press('Enter'); await wait(60);

  // thumbstick
  await pg.addStyleTag({ content: '.pad { display: flex !important; }' });
  await ev(() => { G.state = 'play'; G.talk = null; G.ents = G.ents.filter(e => !e.enemy); loadMap('overworld', 8 * 16 + 8, 34 * 16 + 8); G.state = 'play'; G.talk = null; });
  const box = await (await pg.$('#stick')).boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  const x0 = await ev(() => G.player.x);
  await pg.mouse.move(cx, cy); await pg.mouse.down(); await pg.mouse.move(cx + 50, cy, { steps: 4 }); await wait(500);
  const x1 = await ev(() => G.player.x);
  await check('dragging the stick right walks Owen right', x1 > x0 + 15);
  await check('the knob follows the thumb', await ev(() => document.getElementById('knob').style.transform.includes('translate')));
  await pg.mouse.move(cx + 30, cy + 30, { steps: 3 }); await wait(80);
  await check('diagonals are analog (both axes)', await ev(() => stick.x > 0.5 && stick.y > 0.5));
  await pg.mouse.up(); await wait(200);
  const x2 = await ev(() => G.player.x); await wait(300);
  await check('letting go stops Owen and recenters the knob', Math.abs((await ev(() => G.player.x)) - x2) < 1 && await ev(() => document.getElementById('knob').style.transform === ''));
  await ev(() => { G.state = 'title'; G.titleOpts = null; G.menuSel = 0; });
  await wait(50);
  await pg.mouse.move(cx, cy); await pg.mouse.down(); await pg.mouse.move(cx, cy + 50, { steps: 3 }); await wait(80); await pg.mouse.up(); await wait(50);
  await check('the stick steps through menus', await ev(() => G.menuSel === 1));

  console.log('errors:', JSON.stringify(errs));
  console.log('FAILS:', fails + errs.length);
  await b.close();
  process.exit(fails + errs.length ? 1 : 0);
})();
