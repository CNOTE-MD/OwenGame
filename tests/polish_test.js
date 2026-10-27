// The presentation layer: pixel font coverage, whole-number prescale, every menu page and the title draw cleanly.
// Run: NODE_PATH=$(npm root -g) node tests/polish_test.js
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
  const check = async (name, ok, extra) => { console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) { fails++; if (extra) console.log('   ', JSON.stringify(extra)); } };
  await pg.goto('file://' + path.resolve(__dirname, '../web/index.html'));
  await wait(400);
  const missing = await ev(() => {
    const seen = new Set();
    const walk = v => { if (typeof v === 'string') { for (const ch of v) seen.add(ch); } else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
    walk(STORY); walk(JON); walk(ITEMS); walk(TABLETS); walk(SPELLS); walk(CHARMS); walk(CONSUMABLES); walk(JON_COMPLIMENTS); walk(BOSS_CARDS); walk(MENU_TABS);
    for (const id in SCORE) walk(SCORE[id].name);
    return [...seen].filter(ch => ch !== ' ' && ch !== '\n' && !PF.map.has(ch));
  });
  await check('every character the game writes has a pixel-font glyph', missing.length === 0, missing);
  await check('text measures in whole pixels', await ev(() => textWidth('Hello Señor!') > 40 && Number.isInteger(textWidth('Jöntuka'))));
  await check('the screen presents at a whole-number multiple of 256x224', await ev(() => { fitScreen(); return cv.width % 256 === 0 && cv.height % 224 === 0 && cv.width / 256 === cv.height / 224 && PRESCALE >= 2; }));
  await ev(() => { G.mode = 'story'; G.save = newSave(); applyJonPerks(); G.player = makePlayer(); G.jon = makeJon(); setFlag('met_astrid'); loadMap('overworld', 20 * 16 + 8, 36 * 16 + 8); G.state = 'menu'; });
  for (let i = 0; i < 6; i++) { await ev(i => { G.menuPage = i; render(); }, i); }
  await check('all six menu pages draw under one tab strip', errs.length === 0 && await ev(() => MENU_TABS.length === 6));
  await ev(() => { G.state = 'play'; say([['Jon', 'Hello Señor! ¡Vámonos!'], ['Astrid', 'Wipe your feet.'], ['Penguin King', 'AK!'], ['Driver', 'Twenty kroner.']]); });
  for (let i = 0; i < 4; i++) { await ev(() => { G.talk.shown = 999; render(); }); await pg.keyboard.press('KeyZ'); await wait(40); }
  await check('dialogue draws with and without portraits', errs.length === 0 && await ev(() => HAS_PORTRAIT('Jon') && HAS_PORTRAIT('Astrid') && !HAS_PORTRAIT('Driver')));
  await ev(() => { G.state = 'title'; G.titleOpts = null; render(); });
  await check('the title screen draws', errs.length === 0);
  console.log('errors:', JSON.stringify(errs));
  console.log('FAILS:', fails + errs.length);
  await b.close();
  process.exit(fails + errs.length ? 1 : 0);
})();
