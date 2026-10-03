// Headless playtest of the browser build. Run: NODE_PATH=$(npm root -g) node tests/web_playtest.js
const { chromium } = require('playwright');
const path = require('path');
const SHOTS = process.env.SHOTS || '/tmp';
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 820, height: 900 } });
  const errs = []; let fails = 0;
  pg.on('pageerror', e => errs.push('pageerror ' + e.message));
  pg.on('console', m => { if (m.type() === 'error' && !/fonts|net::|ERR_/.test(m.text())) errs.push(m.text()); });
  let pgRef = null;
  const check = async (name, ok) => {
    console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) { fails++;
      console.log('   state', JSON.stringify(await pgRef.evaluate(() => ({ st: G.state, map: G.mapId, scr: G.scr, x: G.player && G.player.x / 16, y: G.player && G.player.y / 16, talk: G.talk && G.talk.cur })))); }
  };
  const ev = (f, a) => pg.evaluate(f, a); pgRef = pg;
  const wait = ms => pg.waitForTimeout(ms);
  async function talkThrough(max = 80) {
    for (let i = 0; i < max; i++) {
      const st = await ev(() => G.state);
      if (st !== 'talk' && st !== 'hold' && st !== 'cutscene') return;
      await pg.keyboard.press('KeyZ'); await wait(40);
    }
  }
  async function place(tx, ty, fx = 0, fy = 1) {
    await ev(([tx, ty, fx, fy]) => { const p = G.player; p.x = tx * 16 + 8; p.y = ty * 16 + 8; p.fx = fx; p.fy = fy; p.vx = p.vy = 0; p.kx = p.ky = 0; p.inv = 0; p.cd = 0; G.jon.x = p.x; G.jon.y = p.y; G.jon.mode = 'follow'; }, [tx, ty, fx, fy]);
  }
  async function goScreen(map, tx, ty) {
    await ev(([map, tx, ty]) => { loadMap(map, tx * 16 + 8, ty * 16 + 8); G.state = 'play'; }, [map, tx, ty]);
    await wait(50); await talkThrough();
  }

  await pg.goto('file://' + path.resolve(__dirname, '../web/index.html'));
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await pg.reload(); await wait(400);
  await pg.screenshot({ path: SHOTS + '/p1_title.png' });
  await check('title screen', await ev(() => G.state) === 'title');

  await pg.keyboard.press('KeyZ'); await wait(100);
  await check('new game starts with intro talk', await ev(() => G.state === 'talk' && G.mapId === 'home'));
  await talkThrough();
  // read the plaque (table at 12,2; stand below it facing up)
  await place(12, 3, 0, -1); await pg.keyboard.press('KeyZ'); await wait(80);
  await check('plaque dialogue', await ev(() => G.state === 'talk'));
  await talkThrough();
  await check('plaque flag', await ev(() => !!G.save.flags.read_plaque));
  // walk out the door
  await place(7, 12, 0, 1); await pg.keyboard.down('ArrowDown'); await wait(400); await pg.keyboard.up('ArrowDown');
  await check('flight cutscene', await ev(() => G.state === 'talk' && G.talk.back === 'cutscene'));
  await pg.keyboard.press('KeyZ'); await wait(30);
  for (let i = 0; i < 8; i++) { await pg.keyboard.press('KeyZ'); await wait(30); }
  await pg.screenshot({ path: SHOTS + '/p2_flight.png' });
  await talkThrough(120);
  await check('landed in Norway', await ev(() => G.mapId === 'overworld' && G.state === 'play'));
  await wait(200);
  await pg.screenshot({ path: SHOTS + '/p3_airstrip.png' });

  // screen transition: walk west off the airstrip screen
  await place(17, 33, -1, 0);
  const before = await ev(() => G.scr.x);
  await pg.keyboard.down('ArrowLeft'); await wait(1100); await pg.keyboard.up('ArrowLeft'); await wait(100);
  await check('screen transition west', await ev(() => G.scr.x) === before - 1);

  // Elder Astrid at (5,20); stand right of her facing left
  await goScreen('overworld', 7, 20); await place(6, 20, -1, 0);
  await pg.keyboard.press('KeyZ'); await wait(80); await talkThrough();
  await check('met Astrid, got 30 kr', await ev(() => G.save.flags.met_astrid && G.save.kr >= 30));

  // cut a bush at (3,24) in village west: stand at (4,24) facing left
  await place(4, 24, -1, 0); await pg.keyboard.press('KeyZ'); await wait(300);
  await check('bush cut', await ev(() => tile(3, 24) === '.'));

  // buy juice at Lars (shop at 20,19; stand at 20,20 facing up)
  await goScreen('overworld', 20, 21); await place(20, 20, 0, -1); await ev(() => { G.save.kr = 100; });
  await pg.keyboard.press('KeyZ'); await wait(60); await talkThrough();
  await check('bought juice', await ev(() => G.save.potions === 1));

  // lake rocket at (38,20)
  await goScreen('overworld', 33, 22); await place(36, 20, 1, 0);
  await ev(() => { G.ents = G.ents.filter(e => !e.enemy); });
  await pg.keyboard.down('ArrowRight'); await wait(300); await pg.keyboard.up('ArrowRight');
  await pg.waitForFunction(() => !G.player.launching, null, { timeout: 5000 }).catch(() => {});
  await check('lake spits Owen out', await ev(() => tileAt(G.player.x, G.player.y) !== '~' && !G.player.launching));

  // enter the cavern through the cave mouth (39,2)
  await goScreen('overworld', 39, 4); await place(39, 3, 0, -1);
  await pg.keyboard.down('ArrowUp'); await wait(300); await pg.keyboard.up('ArrowUp'); await wait(900); await talkThrough();
  await check('entered Ice Cavern', await ev(() => G.mapId === 'cavern'));
  await pg.screenshot({ path: SHOTS + '/p4_cavern.png' });

  // locked door in hub (top at 23-24,28). No key -> stays locked; with key -> opens
  await goScreen('cavern', 24, 32); await ev(() => { G.ents = G.ents.filter(e => !e.enemy); });
  await place(23, 29, 0, -1); await pg.keyboard.down('ArrowUp'); await wait(250); await pg.keyboard.up('ArrowUp'); await talkThrough();
  await check('locked without key', await ev(() => tile(23, 28) === 'L'));
  await ev(() => { G.save.keys.cavern = 1; G.player.bump = 0; });
  await place(23, 29, 0, -1); await pg.keyboard.down('ArrowUp'); await wait(250); await pg.keyboard.up('ArrowUp');
  await check('key opens door (both tiles)', await ev(() => tile(23, 28) === '_' && tile(24, 27) === '_' && G.save.keys.cavern === 0));

  // pit fall in east room
  await goScreen('cavern', 34, 34); await ev(() => { G.ents = G.ents.filter(e => !e.enemy); });
  const hp0 = await ev(() => G.player.hp);
  await place(36, 37, 0, 1); await wait(900); await talkThrough();
  await check('pit: fall, respawn, lose half heart', await ev(() => G.player.hp) === hp0 - 1 && await ev(() => tileAt(G.player.x, G.player.y) !== 'v'));

  // switch room: plain throw can't reach, homing can
  await goScreen('cavern', 24, 26); await ev(() => { G.ents = G.ents.filter(e => !e.enemy); });
  await place(18, 22, 0, -1); await pg.keyboard.press('KeyX'); await wait(1200);
  await check('plain throw misses far switch', await ev(() => !G.save.flags['cavern:gates']));
  await ev(() => { G.save.items.homing = true; });
  await place(20, 22, 0, -1); await pg.keyboard.press('KeyX'); await wait(1500);
  await check('Homing Jon hits switch -> gates down', await ev(() => !!G.save.flags['cavern:gates']));
  await talkThrough();

  // draugr: frontal hits clank, hits from behind land
  await goScreen('cavern', 8, 20); await ev(() => { G.ents = G.ents.filter(e => !e.enemy); });
  await ev(() => { const e = makeEnemy('draugr', 8 * 16 + 8, 18 * 16 + 8); e.fx = 0; e.fy = 1; e.t = 0; G.ents.push(e); G.roomEnemies = true; });
  await place(8, 19, 0, -1); await pg.keyboard.press('KeyZ'); await wait(300);
  await check('draugr shield blocks the first frontal hit and staggers', await ev(() => { const e = G.ents.find(e => e.type === 'draugr'); return e.hp === e.max && e.guardDown > 0; }));
  await ev(() => { const e = G.ents.find(e => e.type === 'draugr'); damageEnemy(e, 1, G.player, 'swing'); });
  await check('second frontal hit lands while staggered', await ev(() => { const e = G.ents.find(e => e.type === 'draugr'); return !e || e.hp < e.max; }));
  await ev(() => { const e = G.ents.find(e => e.type === 'draugr'); if (e) { e.hp = e.max; e.guardDown = 0; e.flash = 0; e.kx = e.ky = 0; e.t = 0; e.x = 8 * 16 + 8; e.y = 18 * 16 + 8; e.fx = 0; e.fy = 1; } });
  await place(8, 17, 0, 1); await pg.keyboard.press('KeyZ'); await wait(300);
  await check('draugr takes damage from behind', await ev(() => { const e = G.ents.find(e => e.type === 'draugr'); return !e || e.hp < e.max; }));
  await goScreen('cavern', 24, 20); await ev(() => { G.ents = G.ents.filter(e => !e.enemy); G.roomEnemies = false; });

  // boss door needs big key
  await place(24, 15, 0, -1); await pg.keyboard.down('ArrowUp'); await wait(300); await pg.keyboard.up('ArrowUp'); await talkThrough();
  await check('boss door locked without big key', await ev(() => tile(23, 14) === 'K'));
  await ev(() => { G.save.bigkeys.cavern = true; G.player.bump = 0; });
  await place(24, 15, 0, -1); await pg.keyboard.down('ArrowUp'); await wait(900); await pg.keyboard.up('ArrowUp'); await wait(700);
  await talkThrough();
  await check('in boss room with Penguin King', await ev(() => G.scr.y === 0 && G.ents.some(e => e.type === 'king')));
  await pg.screenshot({ path: SHOTS + '/p5_boss.png' });
  // swing on an undazed king clanks
  const kingHp = await ev(() => G.ents.find(e => e.type === 'king').hp);
  await ev(() => { const k = G.ents.find(e => e.type === 'king'); k.st = 'waddle'; damageEnemy(k, 1, G.player, 'swing'); });
  await check('king blocks when not dazed', await ev(() => G.ents.find(e => e.type === 'king').hp) === kingHp);
  // thunder strike
  await ev(() => { G.save.items.thunder = true; G.save.rune = RUNE_MAX; G.player.inv = 5; G.player.cd = 0; });
  await pg.keyboard.press('KeyC'); await wait(200);
  await pg.screenshot({ path: SHOTS + '/p6_thunder.png' });
  await wait(1400);
  await check('thunder strike damages + dazes king', await ev(() => { const k = G.ents.find(e => e.type === 'king'); return k && k.hp < k.max; }));
  // finish him
  await ev(() => { G.save.items.thunder = false; const k = G.ents.find(e => e.type === 'king'); k.st = 'daze'; k.t = 0; k.flash = 0; k.hp = 1; damageEnemy(k, 1, G.player, 'swing'); });
  await wait(100); await talkThrough();
  await ev(() => { for (const e of G.ents.filter(e => e.enemy)) killEnemy(e); });
  await wait(100); await talkThrough();
  await check('boss chest + heart container appeared', await ev(() => G.ents.some(e => e.def && e.def.id === 'cv_thunder') && G.ents.some(e => e.what === 'container')));
  // open the thunder chest: chest at (24,4); stand at (24,5) facing up
  await place(24, 5, 0, -1); await pg.keyboard.press('KeyZ'); await wait(1400); await talkThrough();
  await check('got Thunder Rune', await ev(() => G.save.items.thunder));
  await ev(() => setFlag('d1done'));
  // heart container pickup at (22,7)
  const maxHp = await ev(() => G.save.maxHp);
  await place(22, 7, 0, 1); await wait(1400); await talkThrough();
  await check('heart container +1 heart', await ev(() => G.save.maxHp) === maxHp + 2);
  // menu
  await pg.keyboard.press('Enter'); await wait(100);
  await pg.screenshot({ path: SHOTS + '/p7_menu.png' });
  await check('gear menu opens', await ev(() => G.state === 'menu'));
  await pg.keyboard.press('Enter'); await wait(50);

  // save + reload + continue
  await ev(() => writeSave());
  await pg.reload(); await wait(400);
  await check('title offers CONTINUE', await ev(() => titleOptions()[0].id === 'continue'));
  await pg.keyboard.press('KeyZ'); await wait(150);
  await check('continue restores cavern + items', await ev(() => G.mapId === 'cavern' && G.save.items.thunder && G.save.items.homing));

  // game over path: potion, voodoo, then over
  await ev(() => { G.save.potions = 0; G.save.voodoo = true; G.player.inv = 0; G.state = 'play'; hurtPlayer(99, G.player); });
  await talkThrough();
  await check('voodoo revive', await ev(() => !G.save.voodoo && G.player.hp === G.save.maxHp));
  await ev(() => { G.player.inv = 0; G.state = 'play'; hurtPlayer(99, G.player); });
  await check('game over after voodoo used', await ev(() => G.state === 'over'));
  await ev(() => { G.save.cp = { map: 'overworld', x: 39 * 16 + 8, y: 4 * 16 + 8 }; writeSave(); });
  await pg.keyboard.press('KeyZ'); await wait(150); await talkThrough();
  await check('continue after game over -> last runestone, voodoo back', await ev(() => G.mapId === 'overworld' && G.save.voodoo && Math.floor(G.player.x / 16) === 39));

  console.log('errors:', JSON.stringify(errs));
  console.log('FAILS:', fails + errs.length);
  await b.close();
  process.exit(fails + errs.length ? 1 : 0);
})();
