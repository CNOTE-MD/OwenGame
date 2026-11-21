// Owen's page 10 (the elf), the palace concierge, the ice block puzzle and the floor plan.
// Run: NODE_PATH=$(npm root -g) node tests/elf_test.js
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
  const check = async (name, ok) => { console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) { fails++; console.log('   ', JSON.stringify(await ev(() => ({ st: G.state, map: G.mapId, scr: G.scr, x: G.player.x / 16, y: G.player.y / 16, talk: G.talk && G.talk.cur, blocks: G.ents.filter(e => e.kind === 'iceblock').map(e => [e.x / 16, e.y / 16]) })))); } };
  async function talkThrough(max = 80) { for (let i = 0; i < max; i++) { const st = await ev(() => G.state); if (st !== 'talk' && st !== 'hold' && st !== 'warp' && st !== 'jonlevel') return; await pg.keyboard.press('KeyZ'); await wait(40); } }
  const fresh = flags => ev(flags => { try { localStorage.clear(); } catch (e) {} TOASTS.length = 0; G.mode = 'story'; G.save = newSave(); applyJonPerks(); G.player = makePlayer(); G.jon = makeJon(); for (const f of ['met_astrid', 'jonarea:overworld', 'log_scene', 'forest_arrival', 'giant_done', 'giant_peace', 'log_chopped', 'chapter_card:1', 'chapter_card:2', 'hint:move', 'hint:look', 'hint:chop', 'hint:gear', 'jonarea:frozen', 'jonarea:cavern', 'intro:cavern', ...flags]) setFlag(f); G.save.trophies = Object.fromEntries(TROPHIES.map(t => [t.id, true])); G.save.clock = 12; }, flags);
  const push = async (tx, ty, key, ms = 700) => { await ev(([tx, ty]) => { const p = G.player; p.x = tx * 16 + 8; p.y = ty * 16 + 8; p.vx = p.vy = 0; }, [tx, ty]); await pg.keyboard.down(key); await wait(ms); await pg.keyboard.up(key); await pg.waitForFunction(() => !G.ents.some(e => e.kind === 'iceblock' && e.to), null, { timeout: 4000 }).catch(() => {}); await wait(80); };

  await pg.goto('file://' + path.resolve(__dirname, '../web/index.html'));

  // ---- page 10 follows page 9 ----
  await fresh([]); await ev(() => { G.state = 'play'; loadMap('overworld', 34 * 16 + 8, 6 * 16 + 8); G.ents = G.ents.filter(e => !e.enemy); });
  await wait(150);
  await check('page 9 plays first, ending on "How can I be of service?"', await ev(() => G.state === 'talk' && flag('page9') && !flag('page10')));
  for (let i = 0; i < 40; i++) { if (await ev(() => G.ents.some(e => e.kind === 'elf'))) break; await pg.keyboard.press('KeyZ'); await wait(50); }
  await check('then the elf pops up right behind Owen (page 10)', await ev(() => { const e = G.ents.find(o => o.kind === 'elf'); return !!e && dist(e, G.player) < 22 && G.state === 'talk' && /no bigger than a lawn chair/.test(JSON.stringify([G.talk.cur, ...G.talk.queue])); }));
  await pg.screenshot({ path: SHOTS + '/elf_meet.png' });
  await check('Owen\'s lines: Chilly already slain by the warrior of Hüngrruk Alkāmö', await ev(() => STORY.elf_meet.some(l => /already been slain/.test(l[1])) && STORY.elf_meet.some(l => /Hüngrruk Alkāmö/.test(l[1])) && STORY.elf_meet[STORY.elf_meet.length - 1][1] === 'Come on, over here.'));
  await check('every letter of the warrior\'s village has a glyph', await ev(() => [...'Hüngrruk Alkāmö'].every(c => c === ' ' || PF_GLYPHS[c])));
  await talkThrough(); await wait(100);
  await check('"Come on, over here": the elf heads for the palace doors', await ev(() => flag('page10') && G.ents.find(o => o.kind === 'elf').path.length > 0));
  await pg.waitForFunction(() => { const e = G.ents.find(o => o.kind === 'elf'); return e && !e.path.length; }, null, { timeout: 12000 }).catch(() => {});
  await check('...and waits beside them', await ev(() => { const e = G.ents.find(o => o.kind === 'elf'); return Math.floor(e.x / 16) === 38 && Math.floor(e.y / 16) === 4 && e.solid; }));
  await pg.screenshot({ path: SHOTS + '/elf_door.png' });
  await ev(() => { loadMap('overworld', 34 * 16 + 8, 6 * 16 + 8); G.ents = G.ents.filter(e => !e.enemy); }); await wait(150);
  await check('the scene plays once; the elf stays by the doors', await ev(() => G.state === 'play' && G.ents.filter(o => o.kind === 'elf').length === 1));

  // a save from before page 10 existed
  await fresh(['page9']); await ev(() => { G.state = 'play'; loadMap('overworld', 34 * 16 + 8, 6 * 16 + 8); }); await wait(150);
  await check('a save that already saw page 9 still gets page 10', await ev(() => G.state === 'talk' && G.talk.cur[1] === STORY.elf_late[0][1]));
  await talkThrough();

  // ---- the concierge ----
  await ev(() => { G.state = 'play'; G.talk = null; loadMap('cavern', 24 * 16 + 8, 52 * 16 + 8); G.talk = null; G.state = 'play'; }); await wait(150);
  await check('the elf is in the palace lobby', await ev(() => G.ents.some(e => e.kind === 'elf')));

  // ---- Owen's answer: "Come on, over here" leads into the palace and into "dead Chilly" ----
  await check('"dead Chilly" lies across the lobby, in a cape, on his back', await ev(() => G.ents.filter(e => e.kind === 'deadchilly').length === 2 && SPR.deadchilly.width >= 28));
  await check('the elf starts just inside the doors and hops ahead to him', await ev(() => { const e = G.ents.find(o => o.kind === 'elf'); return e.path.length > 0 && e.y > 50 * 16 && !flag('dead_chilly'); }));
  await pg.waitForFunction(() => G.state === 'talk', null, { timeout: 12000 }).catch(() => {});
  await check('...and presents him: slain, by the warrior of Hüngrruk Alkāmö', await ev(() => { const e = G.ents.find(o => o.kind === 'elf'), all = JSON.stringify([G.talk.cur, ...G.talk.queue]); return G.state === 'talk' && flag('dead_chilly') && Math.floor(e.x / 16) === 26 && Math.floor(e.y / 16) === 46 && /Here we are\. Chilly\./.test(all) && /Hüngrruk Alkāmö/.test(all); }));
  await pg.screenshot({ path: SHOTS + '/elf_deadchilly.png' });
  await check('Owen\'s answer on the warrior: we don\'t know yet', await ev(() => STORY.dead_chilly.some(l => l[0] === 'Elf' && /We don't know yet/.test(l[1])) && STORY.elf_warrior.some(l => /We don't know yet/.test(l[1]))));
  await check('the game does not give away that the elf is wrong: Jon is only suspicious', await ev(() => { const t = JSON.stringify([STORY.dead_chilly, STORY.dead_chilly_look, STORY.elf_warrior]); return /nothing is ever that easy/.test(t) && !/alive|not dead|faking|fake|lying/i.test(t); }));
  await talkThrough(); await wait(100);
  await pg.screenshot({ path: SHOTS + '/elf_deadchilly2.png' });
  await ev(() => { const c = G.ents.find(e => e.kind === 'deadchilly'); const p = G.player; p.x = c.x; p.y = c.y + 14; p.fx = 0; p.fy = -1; }); await wait(80);
  await check('he is in the way: Owen has to walk around him', await ev(() => { const c = G.ents.filter(e => e.kind === 'deadchilly'); return c.every(e => blocked(e.x, e.y, 5, 'player', G.player)) && !blocked(c[0].x - 32, c[0].y, 5, 'player', G.player); }));
  await pg.keyboard.press('KeyZ'); await wait(80);
  await check('Owen can look at (and poke) "DEAD CHILLY"', await ev(() => G.state === 'talk' && /"DEAD CHILLY\."/.test(G.talk.cur[1])));
  await talkThrough();
  await ev(() => { G.state = 'play'; G.talk = null; loadMap('cavern', 24 * 16 + 8, 52 * 16 + 8); }); await wait(200);
  await check('the scene plays once; after that the elf just waits beside him', await ev(() => { const e = G.ents.find(o => o.kind === 'elf'); return G.state === 'play' && !e.path && Math.floor(e.x / 16) === 26 && Math.floor(e.y / 16) === 46; }));

  await ev(() => interact(G.ents.find(e => e.kind === 'elf'))); await talkThrough(); await wait(60);
  await check('"How can I be of service?" offers help', await ev(() => G.state === 'choice' && G.choice.opts.length === 4));
  await pg.screenshot({ path: SHOTS + '/elf_lobby.png' });
  await ev(() => { G.choice.t = 1; G.choice.sel = 2; }); await pg.keyboard.press('KeyZ'); await wait(80);
  await check('"Who slew Chilly?": the warrior of Hüngrruk Alkāmö, and nobody knows who that is yet', await ev(() => G.state === 'talk' && JSON.stringify([G.talk.cur, ...G.talk.queue]) === JSON.stringify(STORY.elf_warrior)));
  await talkThrough();
  await ev(() => interact(G.ents.find(e => e.kind === 'elf'))); await talkThrough(); await wait(60);
  await ev(() => { G.choice.t = 1; G.choice.sel = 0; }); await pg.keyboard.press('KeyZ'); await wait(80);
  await check('first hint: two small keys, west and east', await ev(() => G.state === 'talk' && /Two small keys/.test(G.talk.cur[1])));
  await talkThrough();
  await check('the hint follows your progress through the palace', await ev(() => { const h = []; G.save.items.homing = true; h.push(palaceHint()); setFlag('cavern:gates'); h.push(palaceHint()); G.save.bigkeys.cavern = true; h.push(palaceHint()); return /crystal switch/.test(h[0]) && /big key/.test(h[1]) && /throne room/.test(h[2]) && new Set(h).size === 3; }));

  // ---- the ice block puzzle ----
  await ev(() => { G.state = 'play'; G.talk = null; loadMap('cavern', 13 * 16 + 8, 48 * 16 + 8); }); await wait(150);
  await check('west of the lobby: Jon explains the ice blocks', await ev(() => G.state === 'talk' && flag('intro:puzzle')));
  await talkThrough();
  await check('two blocks, two plates, no chest yet', await ev(() => G.ents.filter(e => e.kind === 'iceblock').length === 2 && G.ents.filter(e => e.kind === 'plate').length === 2 && !G.ents.some(e => e.kind === 'chest')));
  await pg.screenshot({ path: SHOTS + '/elf_puzzle.png' });
  await push(8, 50, 'ArrowLeft');
  await check('a pushed block slides until a pillar stops it', await ev(() => G.ents.some(e => e.kind === 'iceblock' && Math.floor(e.x / 16) === 4 && Math.floor(e.y / 16) === 50)));
  await push(4, 51, 'ArrowUp');
  await check('...up onto the first plate', await ev(() => G.ents.some(e => e.kind === 'iceblock' && Math.floor(e.x / 16) === 4 && Math.floor(e.y / 16) === 45) && !flag('puzzle_palace')));
  await push(11, 51, 'ArrowUp'); await wait(150);
  await check('both plates covered: the chest rises', await ev(() => flag('puzzle_palace') && G.ents.some(e => e.kind === 'chest')));
  await pg.screenshot({ path: SHOTS + '/elf_solved.png' });
  await talkThrough();
  await ev(() => { const c = G.ents.find(e => e.kind === 'chest'); interact(c); }); await wait(1400); await talkThrough();
  await check('inside: the Ice Skates charm', await ev(() => hasCharm('skates') && !!ITEMS.skates && !!SPR.icon_skates));
  await check('wearing them, ice no longer makes Owen slide', await ev(() => { G.save.charm = 'skates'; return charmOn('skates') && /charmOn\('skates'\)/.test(updatePlayer.toString()); }));
  await ev(() => { loadMap('cavern', 24 * 16 + 8, 50 * 16 + 8); loadMap('cavern', 13 * 16 + 8, 48 * 16 + 8); }); await wait(100);
  await check('solved stays solved: blocks rest on the plates', await ev(() => G.ents.filter(e => e.kind === 'iceblock').every(b => G.ents.some(p => p.kind === 'plate' && p.x === b.x && p.y === b.y))));
  // an unsolved room resets when you leave
  await fresh(['page9', 'page10', 'intro:puzzle']); await ev(() => { G.state = 'play'; loadMap('cavern', 13 * 16 + 8, 48 * 16 + 8); G.talk = null; G.state = 'play'; }); await wait(100);
  await push(12, 50, 'ArrowLeft');
  await check('a wrong push can jam the blocks...', await ev(() => G.ents.some(e => e.kind === 'iceblock' && Math.floor(e.x / 16) === 8)));
  await ev(() => { loadMap('cavern', 24 * 16 + 8, 50 * 16 + 8); loadMap('cavern', 13 * 16 + 8, 48 * 16 + 8); G.talk = null; G.state = 'play'; }); await wait(100);
  await check('...and stepping out puts them back', await ev(() => G.ents.some(e => e.kind === 'iceblock' && Math.floor(e.x / 16) === 11 && Math.floor(e.y / 16) === 50)));

  // ---- the floor plan ----
  await ev(() => { G.state = 'menu'; G.menuPage = 2; }); await wait(120);
  await check('inside the palace the MAP page shows its floor plan', await ev(() => flag('room:cavern:0,3') && roomExists(G.map, 0, 3) && !roomExists(G.map, 0, 0)));
  await pg.screenshot({ path: SHOTS + '/elf_map.png' });
  await ev(() => { G.state = 'play'; });

  console.log('errors:', errs);
  console.log('FAILS:', fails);
  await b.close();
  process.exit(fails || errs.length ? 1 : 0);
})();
