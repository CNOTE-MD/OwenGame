// A walk through every screen, room, menu page and mode, by day and by night, checking that
// nothing throws and every frame draws. Run: NODE_PATH=$(npm root -g) node tests/tour_test.js
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
  const check = (name, ok) => { console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) fails++; };
  await pg.goto('file://' + path.resolve(__dirname, '../web/index.html'));
  await ev(() => { try { localStorage.clear(); } catch (e) {} G.mode = 'story'; G.save = newSave(); applyJonPerks(); G.player = makePlayer(); G.jon = makeJon(); for (const f of ['met_astrid', 'exchanged', 'log_scene', 'forest_arrival']) setFlag(f); });
  const visit = async (m, x, y) => { await ev(([m, x, y]) => { G.talk = null; G.state = 'play'; loadMap(m, x * 16 + 8, y * 16 + 8); G.player.inv = 99; }, [m, x, y]); await wait(250); await ev(() => { if (G.state === 'talk') { G.talk = null; G.state = 'play'; } }); await wait(150); };
  for (const clock of [12, 22]) {
    await ev(c => { G.save.clock = c; }, clock);
    for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 4; sx++) await visit('overworld', sx * 16 + 7, sy * 14 + 7);
    check(`all 12 overworld screens run at ${clock}:00`, errs.length === 0);
  }
  const n0 = errs.length;
  for (const m of await ev(() => Object.keys(MAPS).filter(k => k !== 'overworld' && k !== 'arena'))) {
    const at = await ev(m => { const M = MAPS[m], w = M.ents.find(e => e.t === 'warp' || e.t === 'start'); return w ? w.at : [2, 2]; }, m);
    await visit(m, at[0], Math.max(1, at[1] - 1));
  }
  check('every room and dungeon loads and runs', errs.length === n0);
  check('overworld screens stay fair: no more than 5 enemies on any one', await ev(() => { const c = {}; for (const e of MAPS.overworld.ents) if (ENEMY[e.t]) { const k = Math.floor(e.at[0] / 16) + ',' + Math.floor(e.at[1] / 14); c[k] = (c[k] || 0) + 1; } return Math.max(...Object.values(c)) <= 5; }));
  await visit('overworld', 20, 36);
  for (let i = 0; i < 6; i++) { await ev(i => { G.state = 'menu'; G.menuPage = i; }, i); await wait(80); }
  await ev(() => { G.state = 'over'; }); await wait(80);
  await ev(() => { G.state = 'play'; ask('Test?', ['Yes', 'A much longer answer that has to wrap onto a second line'], () => {}); }); await wait(80);
  await ev(() => { G.choice = null; G.state = 'play'; startDuel(); G.rh.started = true; }); await wait(200);
  check('menus, game over, choices and the duel all draw', errs.length === n0);
  console.log('errors:', errs.slice(0, 5));
  console.log('FAILS:', fails);
  await b.close();
  process.exit(fails || errs.length ? 1 : 0);
})();
