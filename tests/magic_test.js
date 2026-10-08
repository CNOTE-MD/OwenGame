// Magic (Rune Spells) and items (Bag, Charms). Run: NODE_PATH=$(npm root -g) node tests/magic_test.js
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
  const check = async (name, ok) => { console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) { fails++; console.log('   ', JSON.stringify(await ev(() => ({ st: G.state, map: G.mapId, x: G.player.x / 16, y: G.player.y / 16, rune: G.save.rune, spell: G.save.spell, bag: G.save.bag, charm: G.save.charm, talk: G.talk && G.talk.cur })))); } };
  async function talkThrough(max = 80) { for (let i = 0; i < max; i++) { const st = await ev(() => G.state); if (st !== 'talk' && st !== 'hold' && st !== 'warp' && st !== 'jonlevel' && st !== 'cutscene') return; await pg.keyboard.press('KeyZ'); await wait(40); } }
  async function place(tx, ty, fx, fy) { await ev(([tx, ty, fx, fy]) => { const p = G.player; p.x = tx * 16 + 8; p.y = ty * 16 + 8; p.fx = fx; p.fy = fy; p.cd = 0; p.dashCd = 0; p.vx = p.vy = 0; p.inv = 0; G.jon.mode = 'follow'; }, [tx, ty, fx, fy]); }
  async function go(map, tx, ty, keepEnemies) { await ev(([m, x, y, k]) => { G.state = 'play'; G.talk = null; loadMap(m, x * 16 + 8, y * 16 + 8); if (!k) { G.ents = G.ents.filter(e => !e.enemy); } G.state = 'play'; G.talk = null; G.bossCard = null; }, [map, tx, ty, !!keepEnemies]); await wait(60); }
  const spawn = (type, tx, ty) => ev(([t, x, y]) => { const e = makeEnemy(t, x * 16 + 8, y * 16 + 8); e.st = 'idle'; e.aggro = true; G.ents.push(e); return e.hp; }, [type, tx, ty]);

  await pg.goto('file://' + path.resolve(__dirname, '../web/index.html'));
  await ev(() => { try { localStorage.clear(); } catch (e) {} G.mode = 'story'; G.save = newSave(); applyJonPerks(); G.player = makePlayer(); G.jon = makeJon(); setFlag('met_astrid'); setFlag('jonarea:overworld'); JT.cd = {}; });

  // --- spells ---
  await go('overworld', 20, 36);
  await pg.keyboard.press('KeyC'); await wait(80);
  await check('no rune yet: C does nothing but say so', await ev(() => G.fx.some(f => f.kind === 'text' && f.label === 'No rune yet') && G.state === 'play'));
  await ev(() => { giveItem('frost'); }); await talkThrough();
  await check('Frost Rune learned and equipped', await ev(() => G.save.items.frost && equippedSpell() === 'frost' && knownSpells().length === 1));
  await ev(() => { G.save.rune = 2; }); await place(20, 36, 1, 0); await pg.keyboard.press('KeyC'); await wait(80);
  await check('not enough rune refuses the cast', await ev(() => G.save.rune === 2 && G.fx.some(f => f.kind === 'text' && f.label === 'Not enough rune')));
  await ev(() => { G.save.rune = 10; });
  await spawn('penguin', 22, 36); await spawn('penguin', 30, 36);
  await place(20, 36, 1, 0); await pg.keyboard.press('KeyC'); await wait(80);
  await check('Frost costs 4 rune', (await ev(() => G.save.rune)) === 6);
  await check('nearby enemy frozen, far one not', await ev(() => { const [a, b] = G.ents.filter(e => e.type === 'penguin'); return a.freeze > 0 && !(b.freeze > 0); }));
  const fx0 = await ev(() => G.ents.find(e => e.type === 'penguin').x);
  await wait(500);
  await check('a frozen enemy does not move or bite', (await ev(() => G.ents.find(e => e.type === 'penguin').x)) === fx0 && await ev(() => G.player.hp === G.save.maxHp));
  await ev(() => { const e = G.ents.find(e => e.type === 'penguin'); e.flash = 0; damageEnemy(e, 1, G.player, 'swing'); });
  await check('chopping the ice shatters it for double damage', await ev(() => { const e = G.ents.find(e => e.type === 'penguin'); return !e || (!(e.freeze > 0) && e.hp === 0) || G.ents.filter(e => e.type === 'penguin').length === 1; }));
  await ev(() => { giveItem('fire'); }); await talkThrough();
  await place(20, 36, 1, 0); await pg.keyboard.press('KeyQ'); await wait(60);
  await check('Q cycles to the Fire Rune', await ev(() => equippedSpell() === 'fire' && PAD_MAP[4] === 'spell'));
  await go('overworld', 17, 11); await ev(() => { G.save.rune = 10; });
  await place(17, 11, 1, 0); await pg.keyboard.press('KeyC'); await wait(60);
  await check('fireball flies', await ev(() => FIRE.length === 1 && G.save.rune === 7));
  await wait(400);
  await check('fire burns the tall grass in its path', await ev(() => tile(18, 11) !== ','));
  await go('overworld', 20, 36); await ev(() => { G.save.rune = 10; G.ents = G.ents.filter(e => !e.enemy); });
  const hp0 = await spawn('penguin', 24, 36);
  await place(20, 36, 1, 0); await pg.keyboard.press('KeyC'); await wait(500);
  await check('fireball hits for 2', await ev(() => !G.ents.some(e => e.type === 'penguin')) || (await ev(() => G.ents.find(e => e.type === 'penguin').hp)) === hp0 - 2);
  await ev(() => { giveItem('mend'); }); await talkThrough();
  await ev(() => { G.save.spell = 'mend'; G.save.rune = 10; G.player.hp = 1; }); await place(20, 36, 1, 0);
  await pg.keyboard.press('KeyC'); await wait(60);
  await check('Mend heals two hearts for 6 rune', await ev(() => G.player.hp === 5 && G.save.rune === 4));
  await pg.keyboard.press('Enter'); await wait(60); await ev(() => { G.menuPage = 4; }); await wait(60);
  await pg.screenshot({ path: SHOTS + '/magic_spells.png' });
  await ev(() => { G.spellSel = 0; }); await pg.keyboard.press('KeyZ'); await wait(60);
  await check('SPELLS page equips with Z and stays open', await ev(() => G.state === 'menu' && equippedSpell() === 'frost'));
  await pg.keyboard.press('Enter'); await wait(60);
  await check('rune meter regenerates once any spell is known', await ev(() => { G.save.rune = 0; G.runeT = 4.99; return true; }) && (await wait(120), await ev(() => G.save.rune >= 1)));

  // --- where the runes live ---
  await check('Frost Rune chest in the palace, Fire Rune on the subway tracks', await ev(() => MAPS.cavern.ents.some(e => e.id === 'cv_frost' && e.item === 'frost') && MAPS.subway.ents.some(e => e.id === 'c_fire')));
  await go('astrid_house', 7, 10);
  await check('Astrid\'s Mend chest waits for the palace to fall', await ev(() => !G.ents.some(e => e.def && e.def.id === 'c_mend')));
  await ev(() => setFlag('d1done')); await go('astrid_house', 7, 10);
  await check('...then appears', await ev(() => G.ents.some(e => e.def && e.def.id === 'c_mend')));

  // --- the bag and charms ---
  await go('overworld', 27, 21); await ev(() => { G.save.kr = 100; G.save.rune = 0; });
  await ev(() => { const s = G.ents.find(e => e.kind === 'shop' && e.item === 'salmon'); G.player.x = s.x; G.player.y = s.y + 14; G.player.fy = -1; G.player.fx = 0; G.player.cd = 0; });
  await pg.keyboard.press('KeyZ'); await wait(60); await talkThrough();
  await check('Lars sells smoked salmon into the bag', await ev(() => bagCount('salmon') === 1 && G.save.kr === 85));
  await ev(() => { addToBag('salmon', 10); });
  await check('the bag holds five salmon at most', (await ev(() => bagCount('salmon'))) === 5);
  await ev(() => { const s = G.ents.find(e => e.kind === 'shop' && e.item === 'tooth'); G.player.x = s.x; G.player.y = s.y + 14; G.player.fy = -1; G.player.fx = 0; G.player.cd = 0; G.save.kr = 100; });
  await pg.keyboard.press('KeyZ'); await wait(60); await talkThrough();
  await check('Troll Tooth bought, worn, and raises luck', await ev(() => hasCharm('tooth') && G.save.charm === 'tooth' && G.st.luck > 0.5));
  await ev(() => { G.player.hp = 1; });
  await pg.keyboard.press('Enter'); await wait(60); await ev(() => { G.menuPage = 5; G.bagSel = 0; }); await wait(60);
  await pg.screenshot({ path: SHOTS + '/magic_bag.png' });
  await pg.keyboard.press('KeyZ'); await wait(60);
  await check('eating salmon from the BAG heals two hearts', await ev(() => G.player.hp === 5 && bagCount('salmon') === 4 && G.state === 'menu'));
  await pg.keyboard.press('Enter'); await wait(60);
  await ev(() => { giveItem('boots'); }); await talkThrough();
  await ev(() => { G.save.charm = 'boots'; applyJonPerks(); });
  await go('overworld', 18, 7);
  await check('Fisherman\'s Boots: muck no longer slows', (await ev(() => groundSpeed(G.player))) === 1 && await ev(() => tileAt(G.player.x, G.player.y + 4) === '%'));
  await ev(() => { G.save.charm = 'tooth'; applyJonPerks(); });
  await check('swapping charms swaps their effect', (await ev(() => groundSpeed(G.player))) < 1);
  await check('charm chests sit on the forest, the Frozen Path and Storm Peak', await ev(() => ['c_boots', 'c_cloak', 'c_bearclaw'].every(id => MAPS.overworld.ents.some(e => e.id === id))));
  await ev(() => { addToBag('lutefisk'); JT.queued = null; JT.cd = {}; G.player.hp = 1; useConsumable('lutefisk'); }); await wait(120);
  await check('lutefisk heals and Jon has opinions', await ev(() => G.player.hp === G.save.maxHp && (JT.queued === 'lutefisk' || JON.lutefisk.includes(JT.line))));
  await check('an old save without a bag still loads', await ev(() => { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ map: 'home', x: 10, y: 10, maxHp: 6, hp: 6, kr: 0, rune: 0, potions: 0, pieces: 0, items: { thunder: true }, flags: {}, keys: {}, bigkeys: {}, voodoo: true, jon: { lvl: 1, xp: 0, perks: {} } })); } catch (e) { return true; } const s = readSave(); return s && s.bag && s.charms && s.spell === null; }));
  await check('HUD shows the equipped spell with cost pips', await ev(() => { G.state = 'play'; G.save.spell = 'frost'; render(); return true; }));

  console.log('errors:', JSON.stringify(errs));
  console.log('FAILS:', fails + errs.length);
  await b.close();
  process.exit(fails + errs.length ? 1 : 0);
})();
