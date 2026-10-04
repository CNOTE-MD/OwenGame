// Gamepad and full-screen/theater mode. Run: NODE_PATH=$(npm root -g) node tests/pad_test.js
// Playwright can't plug in a controller, so this fakes navigator.getGamepads.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1180, height: 820 } });
  const errs = []; let fails = 0;
  pg.on('pageerror', e => errs.push('pageerror ' + e.message));
  pg.on('console', m => { if (m.type() === 'error' && !/fonts|net::|ERR_/.test(m.text())) errs.push(m.text()); });
  const ev = (f, a) => pg.evaluate(f, a);
  const wait = ms => pg.waitForTimeout(ms);
  const check = async (name, ok) => { console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) { fails++; console.log('   ', JSON.stringify(await ev(() => ({ st: G.state, pad: PAD, x: G.player && G.player.x, jon: G.jon && G.jon.mode })))); } };

  await pg.goto('file://' + path.resolve(__dirname, '../web/index.html'));
  // a fake controller: 17 buttons, 4 axes, controlled from the test
  await ev(() => {
    window.FAKE = { connected: true, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
    navigator.getGamepads = () => [window.FAKE];
    G.mode = 'story'; G.save = newSave(); applyJonPerks(); G.player = makePlayer(); G.jon = makeJon(); setFlag('met_astrid'); setFlag('jonarea:overworld');
    loadMap('overworld', 8 * 16 + 8, 34 * 16 + 8); G.state = 'play'; G.talk = null; G.ents = G.ents.filter(e => !e.enemy);
  });
  await wait(100);
  await check('controller detected', await ev(() => PAD.on && document.getElementById('padnote').classList.contains('on')));

  const x0 = await ev(() => G.player.x);
  await ev(() => { FAKE.axes[0] = 0.9; FAKE.axes[1] = 0; }); await wait(400); await ev(() => { FAKE.axes[0] = 0; });
  await check('left stick moves Owen', (await ev(() => G.player.x)) > x0 + 15);
  const y0 = await ev(() => G.player.y);
  await ev(() => { FAKE.axes[0] = 0.1; FAKE.axes[1] = 0.1; }); await wait(200); await ev(() => { FAKE.axes[1] = 0; FAKE.axes[0] = 0; });
  await check('dead zone ignores a drifting stick', Math.abs((await ev(() => G.player.y)) - y0) < 1);
  await ev(() => { FAKE.buttons[13].pressed = true; }); await wait(200); await ev(() => { FAKE.buttons[13].pressed = false; });
  await check('d-pad moves too', (await ev(() => G.player.y)) > y0 + 5);

  await ev(() => { G.player.cd = 0; FAKE.buttons[0].pressed = true; }); await wait(60);
  await check('A swings Jon', await ev(() => G.jon.mode === 'swing' || G.jon.mode === 'follow'));
  await ev(() => { FAKE.buttons[0].pressed = false; }); await wait(300);
  await ev(() => { G.player.cd = 0; G.jon.mode = 'follow'; FAKE.buttons[1].pressed = true; }); await wait(60); await ev(() => { FAKE.buttons[1].pressed = false; });
  await check('B throws Jon', await ev(() => G.jon.mode === 'out' || G.jon.mode === 'back'));
  await wait(1500);
  await ev(() => { G.save.items.dash = true; G.player.dashCd = 0; G.player.cd = 0; G.jon.mode = 'follow'; FAKE.buttons[5].pressed = true; }); await wait(40); await ev(() => { FAKE.buttons[5].pressed = false; });
  await check('RB dashes', await ev(() => G.player.dashing > 0 || G.fx.some(f => f.kind === 'ghost')));
  await wait(400);
  await ev(() => { FAKE.buttons[9].pressed = true; }); await wait(60); await ev(() => { FAKE.buttons[9].pressed = false; });
  await check('Start opens the gear menu', await ev(() => G.state === 'menu'));
  await ev(() => { FAKE.axes[0] = 1; }); await wait(60); await ev(() => { FAKE.axes[0] = 0; });
  await check('stick flips to the JON page', await ev(() => G.menuPage === 1));
  await ev(() => { FAKE.buttons[9].pressed = true; }); await wait(60); await ev(() => { FAKE.buttons[9].pressed = false; });
  // hold A: spin charge works from a controller
  await ev(() => { G.save.jon.lvl = 3; G.state = 'play'; G.player.cd = 0; G.jon.mode = 'follow'; FAKE.buttons[0].pressed = true; });
  await wait(900); await ev(() => { FAKE.buttons[0].pressed = false; }); await wait(120);
  await check('holding A then releasing spins', await ev(() => G.jon.mode === 'spin' || JON.spin.includes(JT.line)));
  await ev(() => { FAKE.connected = false; }); await wait(100);
  await check('unplugging the controller clears its input', await ev(() => !PAD.on && !PAD.active && !virt.a));

  // theater / full screen
  await pg.click('#fsbtn'); await wait(200);
  const fit = await ev(() => { const r = document.querySelector('.screen').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), vw: innerWidth, vh: innerHeight, theater: document.body.classList.contains('theater') }; });
  await check('theater mode fills the viewport height', fit.theater && Math.abs(fit.h - fit.vh) <= 2 && Math.abs(fit.w / fit.h - 8 / 7) < 0.02);
  await check('touch controls float over the screen in theater', await ev(() => getComputedStyle(document.querySelector('.pad')).position === 'fixed'));
  await pg.screenshot({ path: (process.env.SHOTS || '/tmp') + '/theater.png' });
  await pg.click('#exitfs'); await wait(100);
  await check('exit returns to the normal layout', await ev(() => !document.body.classList.contains('theater')));

  console.log('errors:', JSON.stringify(errs));
  console.log('FAILS:', fails + errs.length);
  await b.close();
  process.exit(fails + errs.length ? 1 : 0);
})();
