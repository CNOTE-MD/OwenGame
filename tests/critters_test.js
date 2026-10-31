// Owen's "Build the game" answers: possessed animals (Q41), the Peanut Butter Lion (Q42),
// Baron Blubber's secret sauna (Q43) and the throne riddle (Q44). Run: NODE_PATH=$(npm root -g) node tests/critters_test.js
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
  const check = async (name, ok) => { console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) { fails++; console.log('   ', JSON.stringify(await ev(() => ({ st: G.state, map: G.mapId, x: G.player.x / 16, y: G.player.y / 16, hp: G.player.hp, talk: G.talk && G.talk.cur, line: JT.line })))); } };
  async function talkThrough(max = 80) { for (let i = 0; i < max; i++) { const st = await ev(() => G.state); if (st !== 'talk' && st !== 'hold' && st !== 'warp' && st !== 'jonlevel') return; await pg.keyboard.press('KeyZ'); await wait(40); } }
  async function place(tx, ty, fx, fy) { await ev(([tx, ty, fx, fy]) => { const p = G.player; p.x = tx * 16 + 8; p.y = ty * 16 + 8; p.fx = fx; p.fy = fy; p.cd = 0; p.dashCd = 0; p.vx = p.vy = 0; p.inv = 0; G.jon.mode = 'follow'; }, [tx, ty, fx, fy]); }
  async function go(map, tx, ty, keep) { await ev(([m, x, y, k]) => { G.mode = 'story'; G.state = 'play'; G.talk = null; loadMap(m, x * 16 + 8, y * 16 + 8); if (!k) G.ents = G.ents.filter(e => !e.enemy); G.state = 'play'; G.talk = null; G.bossCard = null; }, [map, tx, ty, !!keep]); await wait(60); }
  const spawn = (type, tx, ty) => ev(([t, x, y]) => { const e = makeEnemy(t, x * 16 + 8, y * 16 + 8); G.ents.push(e); return true; }, [type, tx, ty]);
  const one = type => ev(t => { const e = G.ents.find(o => o.type === t && o.alive); return e && { st: e.st, hp: e.hp, max: e.max, under: !!e.under, safe: !!e.safe, cub: !!e.cub, x: e.x, y: e.y }; }, type);

  await pg.goto('file://' + path.resolve(__dirname, '../web/index.html'));
  await ev(() => { try { localStorage.clear(); } catch (e) {} G.mode = 'story'; G.save = newSave(); applyJonPerks(); G.player = makePlayer(); G.jon = makeJon(); for (const f of ['met_astrid', 'jonarea:overworld', 'exchanged', 'log_scene', 'forest_arrival', 'chapter_card:1', 'chapter_card:2']) setFlag(f); G.save.maxHp = 10; G.player.hp = 10; });

  // ---- Q41: possessed animals ----
  await check('Q41: wombats, squirrels and a pack of Carolina dogs live in the world', await ev(() => ['wombat', 'squirrel', 'cdog'].every(t => MAPS.overworld.ents.filter(e => e.t === t).length >= 2)));
  await go('overworld', 4, 6, true);
  await check('a wombat waddles in the Foothills', !!(await one('wombat')));
  await ev(() => { const w = G.ents.find(o => o.type === 'wombat'); w.x = G.player.x + 30; w.y = G.player.y; w.fx = 1; w.fy = 0; w.st = 'waddle'; w.t = 0; w.flash = 0; });
  await ev(() => { const w = G.ents.find(o => o.type === 'wombat'); w.fx = 1; w.fy = 0; damageEnemy(w, 1, G.player, 'swing'); });
  await check('Q41: hitting a wombat from behind bounces off its bony butt', (await one('wombat')).hp === 4);
  await ev(() => { const w = G.ents.find(o => o.type === 'wombat'); w.fx = -1; w.fy = 0; w.flash = 0; damageEnemy(w, 1, G.player, 'swing'); });
  await check('...hitting its face works', (await one('wombat')).hp < 4);
  await ev(() => { const w = G.ents.find(o => o.type === 'wombat'); w.st = 'waddle'; w.t = 3; w.flash = 0; });
  await pg.waitForFunction(() => { const w = G.ents.find(o => o.type === 'wombat'); return w && w.under; }, null, { timeout: 3000 }).catch(() => {});
  await check('it digs in and tunnels toward Owen', (await one('wombat')).under);
  await ev(() => { const w = G.ents.find(o => o.type === 'wombat'); w.flash = 0; damageEnemy(w, 1, G.player, 'swing'); });
  await check('...and can\'t be hit underground', (await one('wombat')).hp === 3);
  await pg.screenshot({ path: SHOTS + '/critters_wombat.png' });
  await pg.waitForFunction(() => { const w = G.ents.find(o => o.type === 'wombat'); return w && w.st === 'dazed'; }, null, { timeout: 4000 }).catch(() => {});
  await check('it bursts up and sits dazed: the opening', (await one('wombat')).st === 'dazed');
  await ev(() => { G.player.inv = 9; const w = G.ents.find(o => o.type === 'wombat'); w.hp = 0.5; w.flash = 0; damageEnemy(w, 1, G.player, 'swing'); });
  await check('Q41: defeated animals are FREED, not killed: the red glow pops off and they run home', await ev(() => CR.freed.some(f => f.type === 'wombat') && G.save.freed.wombat === 1 && flag('freed_any')));
  await pg.screenshot({ path: SHOTS + '/critters_freed.png' });

  await go('overworld', 18, 6); await spawn('squirrel', 22, 6); await place(18, 6, 1, 0);
  await pg.waitForFunction(() => CR.shots.some(s => s.kind === 'acorn'), null, { timeout: 6000 }).catch(() => {});
  await check('Q41: the squirrel zigzags, stops, and flings acorns', await ev(() => CR.shots.some(s => s.kind === 'acorn')));
  await pg.screenshot({ path: SHOTS + '/critters_squirrel.png' });
  await ev(() => { G.player.inv = 9; for (let i = 0; i < 2; i++) { const e = makeEnemy('squirrel', G.player.x + 20, G.player.y); G.ents.push(e); e.flash = 0; damageEnemy(e, 2, G.player, 'swing'); } });
  await check('freeing two squirrels leaves their stash: a heart piece', await ev(() => G.ents.some(e => e.id === 'hp_squirrels' && e.what === 'piece')));

  await go('overworld', 8, 31, true);
  await ev(() => { G.player.inv = 9; for (const d of G.ents.filter(o => o.type === 'cdog')) { d.x = G.player.x + rnd(-50, 50); d.y = G.player.y + rnd(-40, 40); } });
  let most = 0;
  for (let i = 0; i < 40; i++) { most = Math.max(most, await ev(() => G.ents.filter(o => o.type === 'cdog' && (o.st === 'yip' || o.st === 'rush')).length)); await wait(60); }
  await check('Q41: the Carolina dogs circle as a pack, and only one darts in at a time', most === 1);
  await pg.screenshot({ path: SHOTS + '/critters_dogs.png' });
  await check('Jon has lines for all three', await ev(() => JON.wombat.length && JON.squirrel.length && JON.cdog.length && JON.wombatbutt.length));

  // ---- Q42: the Peanut Butter Lion ----
  await go('overworld', 36, 30, true);
  await check('Q42: a very large peanut butter lion sleeps on the beach', (await one('pblion')).st === 'sleep');
  await pg.screenshot({ path: SHOTS + '/critters_lion_sleep.png' });
  await check('it can\'t hurt you asleep', (await one('pblion')).safe);
  await ev(() => { const l = G.ents.find(o => o.type === 'pblion'); G.player.x = l.x - 40; G.player.y = l.y; });
  await wait(200);
  await check('walking up wakes it: boss card and its own scene', await ev(() => G.state === 'talk' && G.bossCard && /PEANUT/.test(G.bossCard.name)));
  await talkThrough();
  await check('the fight plays the Aerosmith-sound piece', await ev(() => musicFor() === 'aero'));
  await ev(() => { G.player.inv = 99; const l = G.ents.find(o => o.type === 'pblion'); l.st = 'prowl'; l.t = 1.79; l.n = 0; l.flash = 0; damageEnemy(l, 2, G.player, 'swing'); });
  await check('outside its opening Jon only SQUISHes it (half damage)', Math.abs((await one('pblion')).hp - 13) < 1e-9);
  await pg.waitForFunction(() => { const l = G.ents.find(o => o.type === 'pblion'); return l && l.st === 'stuck'; }, null, { timeout: 4000 }).catch(() => {});
  await check('it crouches, pounces, and lands STUCK in its own peanut butter', (await one('pblion')).st === 'stuck' && await ev(() => CR.puddles.length > 0));
  await pg.screenshot({ path: SHOTS + '/critters_lion_stuck.png' });
  await ev(() => { const l = G.ents.find(o => o.type === 'pblion'); l.flash = 0; damageEnemy(l, 1, G.player, 'swing'); });
  await check('stuck, it takes full damage', Math.abs((await one('pblion')).hp - 12) < 1e-9);
  await ev(() => { const q = CR.puddles[0]; G.player.x = q.x; G.player.y = q.y - 4; });
  await check('peanut butter puddles slow Owen down', await ev(() => groundSpeed(G.player) < 0.6));
  await ev(() => { const l = G.ents.find(o => o.type === 'pblion'); l.hp = 7; l.st = 'prowl'; });
  await wait(100); await talkThrough();
  await check('at half health it melts down to a cub', (await one('pblion')).cub);
  await pg.screenshot({ path: SHOTS + '/critters_lion_cub.png' });
  await ev(() => { const l = G.ents.find(o => o.type === 'pblion'); l.st = 'roar'; l.t = 0.49; l.roared = false; });
  await wait(150);
  await check('it roars globs of peanut butter', await ev(() => CR.shots.some(s => s.kind === 'glob')));
  await ev(() => { const l = G.ents.find(o => o.type === 'pblion'); l.st = 'stuck'; l.t = 0; l.hp = 0.5; l.flash = 0; damageEnemy(l, 1, G.player, 'swing'); });
  await wait(100);
  await check('defeated, it melts: its own scene, and it stays melted', await ev(() => G.state === 'talk' && flag('lion_done') && !G.ents.some(e => e.type === 'pblion')));
  await talkThrough();
  await check('it leaves a heart piece', await ev(() => G.ents.some(e => e.id === 'hp_lion') || flag('got:hp_lion')));
  await check('after the lion, the beach is back to normal music', await ev(() => musicFor() !== 'aero'));

  // ---- Q44: the riddle in the throne ----
  await ev(() => { setFlag('d1done'); setFlag('king_owen'); setFlag('intro:king'); });
  await go('cavern', 24, 4, true);
  const before = await ev(() => G.save.pieces);
  await ev(() => { const t = G.ents.find(e => e.kind === 'throne'); interact(t); });
  await check('Q44: observing the throne gives a riddle', await ev(() => G.state === 'talk' && STORY.throne_riddle.length > 0));
  await talkThrough();
  await check('...with answers to pick from', await ev(() => G.state === 'choice' && G.choice.opts.length === 5));
  await pg.screenshot({ path: SHOTS + '/critters_riddle.png' });
  const wrongI = await ev(() => { const r = RIDDLES[(G.save.riddleN || 0) % RIDDLES.length]; return G.choice.opts.findIndex(o => o !== r.a && o !== 'Not now'); });
  await ev(i => { G.choice.sel = i; G.choice.t = 1; }, wrongI); await pg.keyboard.press('KeyZ'); await wait(80);
  await check('a wrong answer costs nothing and swaps in a new riddle', await ev(() => G.save.riddleN === 1 && !flag('riddle_done')));
  await talkThrough();
  await ev(() => { const t = G.ents.find(e => e.kind === 'throne'); interact(t); }); await talkThrough();
  const rightI = await ev(() => { const r = RIDDLES[G.save.riddleN % RIDDLES.length]; return G.choice.opts.indexOf(r.a); });
  for (let i = 0; i < rightI; i++) { await pg.keyboard.press('ArrowDown'); await wait(40); }
  await wait(250); await pg.keyboard.press('KeyZ'); await wait(80);
  await talkThrough();
  await check('the right answer opens a drawer with a heart piece', await ev(() => flag('riddle_done') && flag('got:hp_riddle')) && (await ev(() => G.save.pieces)) !== before);

  // ---- Q43: Baron Blubber's sauna ----
  await go('overworld', 59, 25);
  await check('Q43: a NO PENGUINS sign stands next to a bush on the Volcano Road', await ev(() => tile(61, 25) === 'b' && STORY.signs.sign_nopeng && G.ents.some(e => e.kind === 'hiddenstairs')));
  await ev(() => { setTile(61, 25, '.'); });
  await wait(100);
  await check('cutting the bush reveals stairs down', await ev(() => tile(61, 25) === '>' && flag('sauna_found') && G.ents.some(e => e.kind === 'warp' && e.def.to === 'sauna')));
  await place(61, 25, 0, 1); await wait(600); await talkThrough();
  await check('the stairs lead to Baron Blubber\'s Sauna', await ev(() => G.mapId === 'sauna'));
  await ev(() => interact(G.ents.find(e => e.kind === 'baron')));
  await check('Baron Blubber is not helping. He is just mad at Chilly.', await ev(() => G.state === 'talk' && STORY.baron_1.some(l => /MAD at Chilly/.test(l[1]))));
  await pg.screenshot({ path: SHOTS + '/critters_baron.png' });
  await talkThrough();
  await ev(() => interact(G.ents.find(e => e.kind === 'trophy'))); await talkThrough();
  await check('his trophy (stolen from Chilly) is a heart piece', await ev(() => flag('got:hp_baron') && flag('baron_met')));
  await check('the secret stays open after a reload', await ev(() => { loadMap('overworld', 59 * 16 + 8, 25 * 16 + 8); return tile(61, 25) === '>' && G.ents.some(e => e.kind === 'warp' && e.def && e.def.to === 'sauna'); }));

  // ---- the editable script knows the new scenes ----
  await check('the new scenes are editable in OWEN\'S SCRIPT', await ev(() => ['lion_wake', 'lion_down', 'throne_riddle', 'baron_1', 'baron_trophy', 'signs.sign_nopeng'].every(id => SCENE_NAMES[id] && sceneGet(id, STORY_ORIG))));
  await check('heart pieces now count to eight', await ev(() => { G.state = 'menu'; G.menuPage = 2; render(); G.state = 'play'; return true; }));

  console.log('errors:', errs);
  console.log('FAILS:', fails);
  await b.close();
  process.exit(fails || errs.length ? 1 : 0);
})();
