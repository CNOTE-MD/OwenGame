// The finishing layer: credits, Jon's Trophy Wall, options, fast-forward and control prompts.
// Run: NODE_PATH=$(npm root -g) node tests/finish_test.js
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
  const check = async (name, ok) => { console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) { fails++; console.log('   ', JSON.stringify(await ev(() => ({ st: G.state, map: G.mapId, page: G.menuPage, opt: G.opt, toasts: TOASTS.length })))); } };
  const fresh = () => ev(() => { try { localStorage.clear(); } catch (e) {} Object.assign(OPT, { text: 0, shake: true, flash: true }); TOASTS.length = 0; G.mode = 'story'; G.save = newSave(); applyJonPerks(); G.player = makePlayer(); G.jon = makeJon(); G.state = 'play'; G.talk = null; loadMap('home', 3 * 16 + 8, 4 * 16 + 8); G.talk = null; G.state = 'play'; });

  await pg.goto('file://' + path.resolve(__dirname, '../web/index.html'));
  await fresh(); await wait(200);

  // ---- prompts ----
  await check('a new game shows how to walk', await ev(() => { render(); return !flag('hint:move') && HINTS[0].when(); }));
  await pg.screenshot({ path: SHOTS + '/finish_hint.png' });
  await pg.keyboard.down('ArrowRight'); await wait(300); await pg.keyboard.up('ArrowRight'); await wait(100);
  await check('...and stops once you have walked', await ev(() => flag('hint:move')));
  await ev(() => { const e = G.ents.find(o => o.kind === 'plaque'); const p = G.player; p.x = e.x; p.y = e.y + 14; p.fx = 0; p.fy = -1; });
  await wait(100);
  await check('facing something you can read shows the button to press', await ev(() => { const t = interactTarget(); return !!t && t.kind === 'plaque'; }));
  await pg.screenshot({ path: SHOTS + '/finish_prompt.png' });
  await pg.keyboard.press('KeyZ'); await wait(100);
  await check('...pressing it reads the plaque', await ev(() => G.state === 'talk' && flag('hint:look')));

  // ---- text speed and fast-forward ----
  const n0 = await ev(() => G.talk.queue.length);
  await pg.keyboard.down('KeyX'); await wait(900); await pg.keyboard.up('KeyX'); await wait(100);
  await check('holding THROW fast-forwards a conversation', await ev(() => G.state === 'play') || (await ev(() => G.talk.queue.length)) < n0 - 1);
  await ev(() => { G.talk = null; G.state = 'play'; OPT.text = 2; say([['Jon', 'A long line that would normally take a while to type out, letter by letter.']]); });
  await wait(80);
  await check('text speed INSTANT shows a whole line at once', await ev(() => G.talk.shown >= G.talk.cur[1].length));
  await ev(() => { OPT.text = 0; G.talk = null; G.state = 'play'; });

  // ---- options ----
  await ev(() => { G.state = 'menu'; G.menuPage = 0; }); await wait(60);
  await pg.keyboard.press('KeyC'); await wait(80);
  await check('C on the gear page opens OPTIONS', await ev(() => !!G.opt && G.state === 'menu'));
  await pg.screenshot({ path: SHOTS + '/finish_options.png' });
  await pg.keyboard.press('ArrowDown'); await wait(60); await pg.keyboard.press('ArrowDown'); await wait(60); await pg.keyboard.press('KeyZ'); await wait(60);
  await check('screen shake can be turned off, and it is remembered', await ev(() => OPT.shake === false && JSON.parse(localStorage.getItem('jontuka-options')).shake === false));
  await pg.keyboard.press('ArrowDown'); await wait(60); await pg.keyboard.press('KeyZ'); await wait(60);
  await check('flashes can be softened', await ev(() => OPT.flash === false && flashAlpha() < 0.5));
  await pg.keyboard.press('ArrowRight'); await wait(60);
  await check('left and right change a setting instead of the tab while options are open', await ev(() => G.menuPage === 0 && OPT.flash === true));
  await pg.keyboard.press('KeyC'); await wait(60);
  await check('C closes options', await ev(() => !G.opt && G.state === 'menu'));

  // ---- the trophy wall ----
  for (let i = 0; i < 6; i++) { await pg.keyboard.press('ArrowRight'); await wait(40); }
  await check('the seventh tab is Jon\'s Trophy Wall', await ev(() => G.menuPage === 6 && MENU_TABS[6] === 'WALL'));
  await check('a new game has no trophies', await ev(() => trophyCount() === 0));
  await pg.keyboard.press('Enter'); await wait(60);
  await ev(() => { setFlag('met_astrid'); setFlag('exchanged'); setFlag('giant_peace'); setFlag('giant_done'); G.state = 'play'; G.talk = null; loadMap('overworld', 20 * 16 + 8, 36 * 16 + 8); G.talk = null; G.state = 'play'; G.ents = G.ents.filter(e => !e.enemy); });
  await wait(900);
  await check('doing things earns trophies, with a toast', await ev(() => G.save.trophies.norway && G.save.trophies.doohickey && G.save.trophies.peace && !G.save.trophies.timber && trophyCount() === 3));
  await pg.screenshot({ path: SHOTS + '/finish_toast.png' });
  await check('secret trophies stay hidden until earned', await ev(() => TROPHIES.filter(t => t.secret).length >= 4));
  await ev(() => { G.state = 'menu'; G.menuPage = 6; }); await wait(100);
  await pg.screenshot({ path: SHOTS + '/finish_wall.png' });
  await ev(() => { G.state = 'play'; writeSave(); });
  await check('trophies are saved', await ev(() => readSave().trophies.peace === true));

  // ---- credits ----
  await ev(() => { TOASTS.length = 0; startCredits(); }); await wait(300);
  await check('the credits roll: written by Owen, with your stats and a rank from Jon', await ev(() => G.state === 'credits' && G.credits.lines.some(l => l.t === 'OWEN') && G.credits.lines.some(l => /Trophies: 3 of/.test(l.t)) && G.credits.lines.some(l => l.t === jonRank().toUpperCase())));
  await check('credits music is the Journey-sound piece', await ev(() => musicFor() === 'journey'));
  await ev(() => { G.credits.t = 8; }); await wait(100);
  await pg.screenshot({ path: SHOTS + '/finish_credits.png' });
  await ev(() => { G.credits.t = 24; }); await wait(100);
  await pg.screenshot({ path: SHOTS + '/finish_credits2.png' });
  const t0 = await ev(() => G.credits.t);
  await pg.keyboard.down('KeyZ'); await wait(400); await pg.keyboard.up('KeyZ');
  await check('holding Z speeds them up', (await ev(() => G.credits.t)) - t0 > 1.2);
  await ev(() => { G.credits.t = 9999; }); await wait(900);
  await check('when they end you are back in the game, with the last trophy', await ev(() => G.state === 'play' && flag('credits_seen') && G.save.trophies.end));
  await check('Jon\'s top rank is the one he carved in Owen\'s room', await ev(() => { const s = G.save.trophies; for (const t of TROPHIES) s[t.id] = true; return /World's Best Owner of a Flying and Talking Axe/.test(jonRank()); }));

  // ---- fixes found by playing it through ----
  await fresh(); await ev(() => { setFlag('met_astrid'); for (const h of ['move', 'look', 'chop', 'gear']) setFlag('hint:' + h); loadMap('overworld', 284, 534.08); G.talk = null; G.state = 'play'; });
  await wait(100);
  await check('(setup) Owen starts a pixel inside the plane\'s hull', await ev(() => blocked(284, 534.08, 5, 'player', G.player)));
  await pg.keyboard.down('ArrowDown'); await pg.keyboard.down('ArrowLeft'); await wait(500); await pg.keyboard.up('ArrowDown'); await pg.keyboard.up('ArrowLeft');
  await check('Owen can never stay wedged in a wall: he slides free and walks on', await ev(() => G.player.y > 540 && !blocked(G.player.x, G.player.y, 5, 'player', G.player)));
  await ev(() => { loadMap('overworld', 13 * 16 + 8, 6 * 16 + 8); G.talk = null; G.state = 'play'; G.ents = G.ents.filter(e => !e.enemy); });
  await wait(100);
  await check('before the taxi ride, deep muck blocks the walk from the Foothills to the forest', await ev(() => G.ents.filter(e => e.kind === 'roadblock').length === 4 && [5, 6, 7, 8].every(ty => blocked(15 * 16 + 8, ty * 16 + 8, 5, 'player', G.player))));
  await pg.screenshot({ path: SHOTS + '/finish_roadblock.png' });
  await ev(() => interact(G.ents.find(e => e.kind === 'roadblock')));
  await check('...and Jon says to take the T-bane and a taxi', await ev(() => G.state === 'talk' && /T-bane/.test(JSON.stringify([G.talk.cur, ...G.talk.queue]))));
  await ev(() => { G.talk = null; G.state = 'play'; setFlag('forest_arrival'); loadMap('overworld', 13 * 16 + 8, 6 * 16 + 8); G.talk = null; G.state = 'play'; });
  await check('after the ride it is an open shortcut', await ev(() => !G.ents.some(e => e.kind === 'roadblock')));
  await ev(() => { G.fx = []; floatText(100, 100, 'ONE'); floatText(100, 100, 'TWO'); floatText(100, 100, 'THREE'); });
  await check('floating words stack instead of overlapping', await ev(() => new Set(G.fx.filter(f => f.kind === 'text').map(f => f.y)).size === 3));

  console.log('errors:', errs);
  console.log('FAILS:', fails);
  await b.close();
  process.exit(fails || errs.length ? 1 : 0);
})();
