// Engine and SNES techniques. Run: NODE_PATH=$(npm root -g) node tests/tech_test.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 900, height: 800 } });
  const errs = []; let fails = 0;
  pg.on('pageerror', e => errs.push('pageerror ' + e.message));
  pg.on('console', m => { if (m.type() === 'error' && !/fonts|net::|ERR_/.test(m.text())) errs.push(m.text()); });
  const ev = (f, a) => pg.evaluate(f, a);
  const wait = ms => pg.waitForTimeout(ms);
  const SHOTS = process.env.SHOTS || '/tmp';
  const check = async (name, ok, extra) => { console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) { fails++; if (extra !== undefined) console.log('   ', JSON.stringify(extra)); } };
  await pg.goto('file://' + path.resolve(__dirname, '../web/index.html'));
  await wait(300);
  await ev(() => { G.mode = 'story'; G.save = newSave(); applyJonPerks(); G.player = makePlayer(); G.jon = makeJon(); setFlag('met_astrid'); setFlag('jonarea:overworld'); loadMap('overworld', 20 * 16 + 8, 36 * 16 + 8); G.ents = G.ents.filter(e => !e.enemy); G.state = 'play'; });

  // fixed timestep: stop the live loop and drive frames by hand
  const steps = await ev(() => {
    window.frame = () => {};   // the next rAF callback does nothing; we drive runFrame ourselves
    const run = (hz, secs) => { let t = 1e6; last = t; PERF.acc = 0; let n = 0; for (let i = 0; i < hz * secs; i++) { t += 1000 / hz; runFrame(t); n += PERF.steps; } return n; };
    return { hz30: run(30, 2), hz60: run(60, 2), hz120: run(120, 2), hz144: run(144, 2) };
  });
  await check('the simulation takes 60 steps a second at 30, 60, 120 and 144 Hz', Object.values(steps).every(n => Math.abs(n - 120) <= 1), steps);
  const stall = await ev(() => { let t = 2e6; last = t; PERF.acc = 0; runFrame(t + 5000); return PERF.steps; });
  await check('a long stall (hidden tab) never fast-forwards more than a few steps', stall <= 6, stall);
  const keep = await ev(() => { let t = 3e6; last = t; PERF.acc = 0; edge.a = true; runFrame(t + 4); const kept = edge.a === true; runFrame(t + 4 + 16.7); return { kept, consumed: edge.a === false }; });
  await check('a press between steps waits for the next step instead of being lost', keep.kept && keep.consumed, keep);
  await pg.evaluate(() => { last = performance.now(); PERF.acc = 0; window.frame = function (now) { try { runFrame(now); } catch (err) { console.error(err); } requestAnimationFrame(window.frame); }; requestAnimationFrame(window.frame); });

  // transitions
  await check('warping into a building or dungeon uses an iris; out to the world, a mosaic', await ev(() => { startWarp('astrid_house', [7, 12]); const a = G.warp.kind; G.state = 'play'; startWarp('overworld', [4, 21]); const b2 = G.warp.kind; G.state = 'play'; return a === 'iris' && b2 === 'mosaic'; }));
  await ev(() => { startWarp('cavern', [24, 54]); G.warp.t = 0.3; }); await wait(30);
  await pg.screenshot({ path: SHOTS + '/tech_iris.png' });
  await ev(() => { G.state = 'play'; loadMap('overworld', 20 * 16 + 8, 36 * 16 + 8); startWarp('overworld', [20, 36]); G.warp.t = 0.3; });
  await wait(30); await pg.screenshot({ path: SHOTS + '/tech_mosaic.png' });
  await pg.waitForFunction(() => G.state === 'play', null, { timeout: 3000 }).catch(() => {});

  // HDMA scanline effects
  await ev(() => { G.state = 'play'; loadMap('overworld', 52 * 16 + 8, 20 * 16 + 8); G.ents = G.ents.filter(e => !e.enemy); G.state = 'play'; G.talk = null; });
  await wait(100);
  await check('heat haze shimmers on the volcano road', await ev(() => G.hdma === 'heat'));
  await pg.screenshot({ path: SHOTS + '/tech_heat.png' });
  await ev(() => { loadMap('overworld', 20 * 16 + 8, 36 * 16 + 8); G.ents = G.ents.filter(e => !e.enemy); G.state = 'play'; }); await wait(60);
  await check('and nowhere else on the overworld', await ev(() => G.hdma === null));
  await ev(() => { loadMap('redeye', 4 * 16 + 8, 6 * 16 + 8); G.ents = G.ents.filter(e => !e.enemy); G.state = 'play'; G.talk = null; }); await wait(60);
  await check('the nightmare wobbles', await ev(() => G.hdma === 'dream'));

  // Mode 7 taxi ride
  await ev(() => { loadMap('subway', 8 * 16 + 8, 3 * 16 + 8); G.state = 'play'; G.save.kr = 50; startRide('forest'); });
  await wait(200);
  await check('the taxi ride renders in Mode 7 over the real overworld', await ev(() => !!M7.tex && M7.w === MAPS.overworld.rows[0].length * 8 && M7.h === MAPS.overworld.rows.length * 8));
  await pg.screenshot({ path: SHOTS + '/tech_mode7_a.png' });
  const px1 = await ev(() => { const d = buf.getContext('2d').getImageData(0, 150, VW, 1).data; return Array.from(d.slice(0, 40)).join(','); });
  await ev(() => { G.rideT0 -= 7; }); await wait(100);
  const px2 = await ev(() => { const d = buf.getContext('2d').getImageData(0, 150, VW, 1).data; return Array.from(d.slice(0, 40)).join(','); });
  await check('the ground moves as the taxi drives', px1 !== px2);
  await pg.screenshot({ path: SHOTS + '/tech_mode7_b.png' });
  for (let i = 0; i < 20 && (await ev(() => G.state)) !== 'play'; i++) { await pg.keyboard.press('KeyZ'); await wait(60); }
  await check('the ride still ends in the Muck Forest', await ev(() => G.mapId === 'overworld' && G.scr.x === 1 && G.scr.y === 0), await ev(() => ({ st: G.state, map: G.mapId, scr: G.scr, cut: G.cut, talk: G.talk && G.talk.cur, frames: PERF.frames })));

  // echo, CRT, overlay
  await check('the echo is dry outdoors and wet in stone rooms and the nightmare', await ev(() => { G.map = MAPS.overworld; G.mapId = 'overworld'; G.state = 'play'; const o = Echo.wetFor('overworld'); G.map = MAPS.cavern; G.mapId = 'cavern'; const c = Echo.wetFor('palace'); G.map = MAPS.redeye; G.mapId = 'redeye'; const r = Echo.wetFor('creepy'); return o < 0.1 && c >= 0.4 && r > c; }));
  await ev(() => { loadMap('overworld', 20 * 16 + 8, 36 * 16 + 8); G.ents = G.ents.filter(e => !e.enemy); G.state = 'play'; G.talk = null; });
  await pg.keyboard.press('KeyY'); await wait(80);
  await check('Y toggles the CRT filter and remembers it', await ev(() => G.crt === true && localStorage.getItem('jontuka-crt') === '1'), await ev(() => ({ crt: G.crt, st: G.state, frames: PERF.frames })));
  await pg.screenshot({ path: SHOTS + '/tech_crt.png' });
  await pg.keyboard.press('KeyY'); await wait(40);
  await pg.keyboard.press('Backquote'); await wait(120);
  await check('` opens the developer overlay', await ev(() => G.debug === true && PERF.fps > 0));
  await pg.screenshot({ path: SHOTS + '/tech_debug.png' });
  await pg.keyboard.press('Backquote');

  console.log('errors:', JSON.stringify(errs));
  console.log('FAILS:', fails + errs.length);
  await b.close();
  process.exit(fails + errs.length ? 1 : 0);
})();
