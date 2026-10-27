// Owen's Quest Log answers, built in. Run: NODE_PATH=$(npm root -g) node tests/owen_test.js
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
  async function talkThrough(max = 80) { for (let i = 0; i < max; i++) { const st = await ev(() => G.state); if (st !== 'talk' && st !== 'hold' && st !== 'warp' && st !== 'jonlevel' && st !== 'cutscene') return; await pg.keyboard.press('KeyZ'); await wait(40); } }
  async function place(tx, ty, fx, fy) { await ev(([tx, ty, fx, fy]) => { const p = G.player; p.x = tx * 16 + 8; p.y = ty * 16 + 8; p.fx = fx; p.fy = fy; p.cd = 0; p.dashCd = 0; p.vx = p.vy = 0; p.inv = 0; G.jon.mode = 'follow'; }, [tx, ty, fx, fy]); }
  async function go(map, tx, ty, keep) { await ev(([m, x, y, k]) => { G.mode = 'story'; G.state = 'play'; G.talk = null; loadMap(m, x * 16 + 8, y * 16 + 8); if (!k) G.ents = G.ents.filter(e => !e.enemy); G.state = 'play'; G.talk = null; G.bossCard = null; }, [map, tx, ty, !!keep]); await wait(60); }
  const spawn = (type, tx, ty) => ev(([t, x, y]) => { const e = makeEnemy(t, x * 16 + 8, y * 16 + 8); e.st = e.st === 'intro' ? 'intro' : 'idle'; e.aggro = true; G.ents.push(e); return true; }, [type, tx, ty]);

  await pg.goto('file://' + path.resolve(__dirname, '../web/index.html'));
  await ev(() => { try { localStorage.clear(); } catch (e) {} G.mode = 'story'; G.save = newSave(); applyJonPerks(); G.player = makePlayer(); G.jon = makeJon(); for (const f of ['met_astrid', 'jonarea:overworld', 'exchanged', 'log_scene', 'forest_arrival']) setFlag(f); G.save.maxHp = 10; G.player.hp = 10; });

  // Q3: easier King, gentler wisps
  await check('Q3: the Penguin King has 8 hearts of health, not 10', await ev(() => ENEMY.king.hp === 8));
  await go('overworld', 20, 36); await spawn('wisp', 21, 36); await ev(() => { G.player.inv = 0; });
  await pg.waitForFunction(() => !G.ents.some(e => e.type === 'wisp'), null, { timeout: 4000 }).catch(() => {});
  await check('Q3: a wisp (the little flying coin) pops when it hits you: one hit, not a swarm', await ev(() => !G.ents.some(e => e.type === 'wisp') && G.player.hp === 9));

  // Q4, Q7, Q10: Led Zeppelin and more Queen
  await check('Q4/Q7: a Led Zeppelin-sound piece and a second Queen piece exist', await ev(() => SCORE.zep && /Led Zeppelin/.test(SCORE.zep.name) && SCORE.chop && /Queen/.test(SCORE.chop.name) && Music.compile('zep').ev.length > 80 && Music.compile('chop').ev.length > 40));
  await go('overworld', 28, 6); await spawn('giant', 29, 6); await talkThrough();
  await check('Q4: the Forest Giant fight plays the Zeppelin piece', await ev(() => musicFor() === 'zep'));
  await ev(() => setFlag('intro:king')); await go('cavern', 24, 8, true); await talkThrough();
  await check('Q4: the Penguin King fight plays "We Will Chop You"', await ev(() => musicFor() === 'chop'));
  await check('Q10/Q13: Jon sings Zeppelin and Rush E badly', await ev(() => JON.sing.some(l => /Valhalla|AHHHH/.test(l)) && JON.sing.some(l => /Rush E/.test(l))));

  // Q8: the varg replaces the spitting mushroom
  await check('Q8: no spitting mushrooms in the world; vargs prowl the forest', await ev(() => !MAPS.overworld.ents.some(e => e.t === 'spore') && MAPS.overworld.ents.filter(e => e.t === 'varg').length >= 3));
  await go('overworld', 20, 36); await spawn('varg', 23, 36); await place(20, 36, 1, 0);
  await pg.waitForFunction(() => { const v = G.ents.find(e => e.type === 'varg'); return v && v.st === 'howl'; }, null, { timeout: 4000 }).catch(() => {});
  await check('Q8: the varg howls before it lunges', await ev(() => G.ents.find(e => e.type === 'varg').st === 'howl'));
  await pg.waitForFunction(() => { const v = G.ents.find(e => e.type === 'varg'); return v && v.st === 'pant'; }, null, { timeout: 3000 }).catch(() => {});
  await check('...then pants: the window to chop it', await ev(() => G.ents.find(e => e.type === 'varg').st === 'pant'));
  await pg.screenshot({ path: SHOTS + '/owen_varg.png' });

  // Q9: the plane dream is a one-timer: nothing points you back to it
  await ev(() => { setFlag('d1done'); setFlag('d2done'); setFlag('log_chopped'); });
  await check('Q9: no compass or objective nudges toward the nightmare', await ev(() => objectiveTarget() === null && !/nap|Flight 364|bench/.test(objective())));

  // Q11, Q12, Q14: Jon's voice
  await check('Q11: "You\'re terrible. Do better." with love', await ev(() => JON.hurt.some(l => /terrible/.test(l)) && JON.kill.some(l => /terrible/.test(l))));
  await check('Q12: Jon speaks Spanish', await ev(() => [...JON.kill, ...JON.hurt, ...JON.thrown].some(l => /¡|amigo|señor/i.test(l))));
  await check('Q14: Jon brags about being a magical talking flying axe, and spiders terrify him', await ev(() => JON.idle.some(l => /MAGICAL/.test(l)) && JON.spider.length >= 3));
  await go('secret_cave', 8, 10, true);
  await check('Q14: spiders live in Fluffy\'s tunnel', await ev(() => G.ents.filter(e => e.type === 'spider').length === 2));

  // Q15: Jon's compliment heals half a heart
  await go('overworld', 20, 36); await ev(() => { G.player.hp = 2; JT.compT = 0; JT.t = 0; });
  await wait(150);
  await check('Q15: at one heart, Jon\'s compliment gives back half a heart', await ev(() => G.player.hp === 3 && JON_COMPLIMENTS.includes(JT.line)));
  await ev(() => { G.player.hp = 2; }); await wait(150);
  await check('...once every 25 seconds', await ev(() => G.player.hp === 2));

  // Q19, Q20, Q46: Mango, cucumbers, Fjord Fuel
  await go('overworld', 27, 21); await ev(() => { G.save.kr = 200; G.save.items.dash = true; });
  for (const item of ['mango', 'fuel']) { await ev((it) => { const s = G.ents.find(e => e.kind === 'shop' && e.item === it); G.player.x = s.x; G.player.y = s.y + 14; G.player.fy = -1; G.player.fx = 0; G.player.cd = 0; }, item); await pg.keyboard.press('KeyZ'); await wait(60); await talkThrough(); }
  await check('Q19: Lars sells a Mango charm; wearing it speeds Jon up', await ev(() => hasCharm('mango') && G.save.charm === 'mango' && G.st.atk > 1.15));
  await check('Q20: Jon hates cucumbers and squash', await ev(() => JON.idle.some(l => /cucumber/i.test(l) && /squash/i.test(l))));
  await ev(() => useConsumable('fuel'));
  await check('Q46: Fjord Fuel makes the dash last longer', await ev(() => { G.player.fuel = 60; G.player.dashCd = 0; G.player.dashing = 0; G.state = 'play'; startDash(); return G.player.dashing > 0.3; }));

  // Q22, Q47: lore on the tablets
  await check('Q22/Q47: tablets say Chilly is part vampire, all penguin, and Hank is Hank with a J', await ev(() => /vampire/.test(TABLETS.tab_grave) && /penguin/.test(TABLETS.tab_grave) && /Hank with a J/.test(TABLETS.tab_village)));

  // Q27, Q28: the giant wraps you in leaves, then turns back into a log
  await ev(() => { G.save.flags.giant_done = false; G.save.flags.log_chopped = false; G.save.flags.giant_woke = true; });
  await go('overworld', 26, 9, true); await talkThrough();
  await place(20, 9, 1, 0); await ev(() => { G.player.hp = 10; const g = G.ents.find(e => e.type === 'giant'); g.st = 'wrap'; g.t = 0; g.wrapAt = { x: G.player.x, y: G.player.y }; G.player.inv = 0; });
  await pg.waitForFunction(() => G.player.rooted > 0, null, { timeout: 2500 }).catch(() => {});
  await check('Q27: leaves wrap Owen up if he stands in the ring', await ev(() => G.player.rooted > 0 || JON.wrapped.includes(JT.line)));
  const x0 = await ev(() => G.player.x);
  await pg.keyboard.down('ArrowLeft'); await wait(150); await pg.keyboard.up('ArrowLeft');
  await check('...and he can\'t move while wrapped', Math.abs((await ev(() => G.player.x)) - x0) < 1);
  await ev(() => { const g = G.ents.find(e => e.type === 'giant'); g.st = 'stuck'; g.hp = 1; g.flash = 0; damageEnemy(g, 1, G.player, 'swing'); });
  await wait(300);
  await check('Q28: the giant turns back into a log', await ev(() => STORY.giant_down.some(l => /turns back into a log/.test(l[1]))));
  await talkThrough(); await go('overworld', 26, 9);
  await check('...a snoring log by the path', await ev(() => G.ents.some(e => e.kind === 'sleeplog')));
  await pg.screenshot({ path: SHOTS + '/owen_sleeplog.png' });

  // Q45: the Leaf Rune, hidden in the big forest
  await check('Q45: the Leaf Rune chest waits in the Muck Forest after the giant', await ev(() => G.ents.some(e => e.kind === 'chest' && e.def.id === 'c_leaf')));
  await ev(() => { giveItem('leaf'); }); await talkThrough();
  await ev(() => { G.save.spell = 'leaf'; G.save.rune = 10; G.ents = G.ents.filter(e => !e.enemy); const e = makeEnemy('slime', G.player.x + 30, G.player.y); e.st = 'idle'; G.ents.push(e); G.player.cd = 0; });
  await place(26, 9, 1, 0); await pg.keyboard.press('KeyC'); await wait(80);
  await check('Q45: the Leaf Rune roots nearby enemies for 5 rune', await ev(() => G.save.rune === 5 && G.ents.find(e => e.type === 'slime').root > 0 && SPELL_ORDER.length === 5));

  // Q48, Q49: Arena cards and the mini-Chilly finale
  await check('Q48: Fire of Helheim, Infinity Health and Rune Shield are Arena cards', await ev(() => ['helheim', 'infinity', 'runeshield'].every(id => ARENA_CARDS.some(c => c.id === id))));
  await check('Q49: wave 20 is nothing but mini Chillys', await ev(() => { const s = waveSpec(20); return s.pool.length === 1 && s.pool[0] === 'minichilly' && s.bosses === 0 && SPR.chilly_down_0; }));
  await ev(() => { startArena(); G.talk = null; nextWave(); G.ents = G.ents.filter(e => !e.enemy); A.marks = []; A.spawnT = 99; });
  await ev(() => { G.state = 'play'; ARENA_CARDS.find(c => c.id === 'runeshield').apply(); A.rsT = 0; G.player.inv = 0; });
  const hpA = await ev(() => G.player.hp);
  await ev(() => hurtPlayer(1, { x: 0, y: 0 }));
  await check('Q48: Rune Shield blocks a hit', (await ev(() => G.player.hp)) === hpA);
  await ev(() => { ARENA_CARDS.find(c => c.id === 'helheim').apply(); A.helT = 1.49; A.spawnT = 99; A.marks = []; G.ents = G.ents.filter(e => !e.enemy); const e = makeEnemy('penguin', G.player.x + 60, G.player.y); e.hp = 5; G.ents.push(e); });
  await wait(150);
  await check('Q48: Fire of Helheim burns enemies', await ev(() => G.ents.find(e => e.type === 'penguin').hp < 5));
  await pg.screenshot({ path: SHOTS + '/owen_helheim.png' });

  // Q50
  await check('Q50: Bjarne is writing Rush P', await ev(() => { G.mode = 'story'; setFlag('quest_bjarne'); setFlag('bjarne_done'); return npcLines('bjarne').some(l => /Rush P/.test(l[1])); }));

  console.log('errors:', JSON.stringify(errs));
  console.log('FAILS:', fails + errs.length);
  await b.close();
  process.exit(fails + errs.length ? 1 : 0);
})();
