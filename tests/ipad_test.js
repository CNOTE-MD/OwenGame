// iPad readiness, checked in an emulated iPad (touch, iPad-sized window). This is Chromium pretending
// to be an iPad, not Safari on a real one: it proves the layout and the touch plumbing, nothing more.
// Run: NODE_PATH=$(npm root -g) node tests/ipad_test.js
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const UA = 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const WEB = path.resolve(__dirname, '../web');
(async () => {
  const b = await chromium.launch();
  const errs = []; let fails = 0;
  const SHOTS = process.env.SHOTS || '/tmp';
  const check = (name, ok, extra) => { console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) { fails++; if (extra !== undefined) console.log('   ', JSON.stringify(extra)); } };
  const open = async (w, h) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, userAgent: UA, deviceScaleFactor: 2 });
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errs.push('pageerror ' + e.message));
    pg.on('console', m => { if (m.type() === 'error' && !/fonts|net::|ERR_|manifest/i.test(m.text())) errs.push(m.text()); });
    await pg.goto('file://' + path.join(WEB, 'index.html'));
    await pg.waitForFunction(() => typeof G !== 'undefined' && G.state === 'title');
    return { ctx, pg, ev: (f, a) => pg.evaluate(f, a), wait: ms => pg.waitForTimeout(ms) };
  };
  const box = (pg, sel) => pg.evaluate(sel => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, r: r.right, b: r.bottom }; }, sel);
  const inView = (r, w, h) => r.w > 0 && r.h > 0 && r.x >= 0 && r.y >= 0 && r.r <= w + 0.5 && r.b <= h + 0.5;

  // ---- the document itself ----
  const html = fs.readFileSync(path.join(WEB, 'index.html'), 'utf8');
  check('the page is a whole document: doctype, UTF-8, a phone/tablet viewport', /^<!doctype html>/i.test(html) && /<meta charset="utf-8">/.test(html) && /name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/.test(html));
  check('it can be added to the iPad home screen as a full-screen app with its own icon', /apple-mobile-web-app-capable" content="yes"/.test(html) && /rel="apple-touch-icon" href="icon-180.png"/.test(html) && fs.existsSync(path.join(WEB, 'icon-180.png')));
  const png = fs.readFileSync(path.join(WEB, 'icon-180.png'));
  check('the icon is a real 180 x 180 PNG', png.readUInt32BE(16) === 180 && png.readUInt32BE(20) === 180);
  const man = JSON.parse(fs.readFileSync(path.join(WEB, 'manifest.json'), 'utf8'));
  check('the web manifest points at files that exist', man.icons.every(i => fs.existsSync(path.join(WEB, i.src))) && man.display === 'standalone');

  // ---- iPad, held sideways ----
  let { ctx, pg, ev, wait } = await open(1180, 820);
  check('standards mode', await ev(() => document.compatMode === 'CSS1Compat'));
  check('on a touch device it opens straight into the fill-the-window layout', await ev(() => document.body.classList.contains('theater')));
  let scr = await box(pg, '.screen'), stick = await box(pg, '#stick'), ab = await box(pg, '.ab');
  check('landscape: the whole game screen is visible, as tall as the window', inView(scr, 1180, 820) && Math.abs(scr.h - 820) <= 2 && Math.abs(scr.w / scr.h - 8 / 7) < 0.02, scr);
  check('landscape: thumbstick and buttons are on screen, in the bottom corners', inView(stick, 1180, 820) && inView(ab, 1180, 820) && stick.x < 60 && ab.r > 1120, { stick, ab });
  check('nothing else is drawn over the game (the closed script panel stays closed)', await ev(() => { const s = document.getElementById('script'); return s.hidden && getComputedStyle(s).display === 'none'; }));
  check('landscape: nothing to scroll', await ev(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth));
  await pg.screenshot({ path: SHOTS + '/ipad_title.png' });

  // tap the screen to begin, then play with the touch controls
  await pg.touchscreen.tap(scr.x + scr.w / 2, scr.y + scr.h / 2); await wait(250);
  check('a tap on the title screen starts the game', await ev(() => G.state !== 'title'), await ev(() => G.state));
  await ev(() => { try { localStorage.clear(); } catch (e) {} G.mode = 'story'; G.save = newSave(); applyJonPerks(); G.player = makePlayer(); G.jon = makeJon(); for (const f of ['hint:move', 'hint:look', 'hint:chop', 'hint:gear', 'chapter_card:1', 'jonarea:home']) setFlag(f); G.state = 'play'; G.talk = null; loadMap('home', 3 * 16 + 8, 4 * 16 + 8); G.talk = null; G.state = 'play'; });
  await wait(100);
  const cdp = await ctx.newCDPSession(pg);
  const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
  const x0 = await ev(() => G.player.x), cx = stick.x + stick.w / 2, cy = stick.y + stick.h / 2;
  await touch('touchStart', [{ x: cx, y: cy, id: 1 }]); await touch('touchMove', [{ x: cx + 50, y: cy, id: 1 }]); await wait(450);
  check('dragging the thumbstick right walks Owen right', await ev(x0 => G.player.x > x0 + 8, x0), { x0, x: await ev(() => G.player.x) });
  // a second finger on SWING while the first still holds the stick
  const sw = await box(pg, '[data-a="a"]');
  const n0 = await ev(() => G.st.swings || 0);
  await ev(() => { window.__sw = 0; const s = G.jon.swing; G.jon.swing = function (a) { window.__sw++; return s.call(this, a); }; });
  await touch('touchStart', [{ x: cx + 50, y: cy, id: 1 }, { x: sw.x + sw.w / 2, y: sw.y + sw.h / 2, id: 2 }]); await wait(120);
  await touch('touchEnd', [{ x: cx + 50, y: cy, id: 1 }]); await wait(120);
  check('SWING works with a second finger while the first is on the stick', await ev(() => window.__sw >= 1), n0);
  await touch('touchEnd', []); await wait(150);
  const x1 = await ev(() => G.player.x); await wait(250);
  check('letting go stops him', await ev(x1 => Math.abs(G.player.x - x1) < 2, x1));
  await pg.screenshot({ path: SHOTS + '/ipad_play.png' });
  // GEAR opens the menu, and a tap closes it
  const gear = await box(pg, '[data-a="menu"]');
  await pg.touchscreen.tap(gear.x + gear.w / 2, gear.y + gear.h / 2); await wait(150);
  check('GEAR opens the menu', await ev(() => G.state === 'menu'));
  await pg.touchscreen.tap(gear.x + gear.w / 2, gear.y + gear.h / 2); await wait(150);
  check('...and closes it', await ev(() => G.state === 'play'));
  // the X leaves the full-window layout for the page (Owen's Script lives there)
  const x = await box(pg, '#exitfs');
  check('the X is on screen', inView(x, 1180, 820), x);
  await pg.touchscreen.tap(x.x + x.w / 2, x.y + x.h / 2); await wait(150);
  check('the X goes back to the page, where OWEN\'S SCRIPT is', await ev(() => !document.body.classList.contains('theater') && document.getElementById('scriptbtn').getBoundingClientRect().width > 0));
  await pg.touchscreen.tap(...Object.values(await pg.evaluate(() => { const r = document.getElementById('fsbtn').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }))); await wait(200);
  check('FULL SCREEN brings the layout back', await ev(() => document.body.classList.contains('theater')));
  await ctx.close();

  // ---- iPad, held upright ----
  ({ ctx, pg, ev, wait } = await open(820, 1180));
  scr = await box(pg, '.screen'); stick = await box(pg, '#stick'); ab = await box(pg, '.ab');
  check('portrait: the game screen is the full width of the iPad', inView(scr, 820, 1180) && Math.abs(scr.w - 820) <= 2, scr);
  check('portrait: the controls sit below the game screen, not over it', inView(stick, 820, 1180) && inView(ab, 820, 1180) && stick.y >= scr.b - 1 && ab.y >= scr.b - 1, { scr, stick, ab });
  await pg.screenshot({ path: SHOTS + '/ipad_portrait.png' });
  await ctx.close();

  // ---- a phone, held upright: Jon's pop-up lines go in the empty space above the game ----
  ({ ctx, pg, ev, wait } = await open(390, 844));
  scr = await box(pg, '.screen'); stick = await box(pg, '#stick'); ab = await box(pg, '.ab');
  check('phone: screen and controls all fit', inView(scr, 390, 844) && inView(stick, 390, 844) && inView(ab, 390, 844) && stick.y >= scr.b - 1, { scr, stick, ab });
  const playing = () => ev(() => { try { localStorage.clear(); } catch (e) {} TOASTS.length = 0; G.mode = 'story'; G.save = newSave(); applyJonPerks(); G.save.trophies = Object.fromEntries(TROPHIES.map(t => [t.id, true])); G.player = makePlayer(); G.jon = makeJon(); for (const f of ['met_astrid', 'hint:move', 'hint:look', 'hint:chop', 'hint:gear', 'chapter_card:1', 'jonarea:overworld']) setFlag(f); G.state = 'play'; G.talk = null; loadMap('overworld', 20 * 16 + 8, 34 * 16 + 8); G.ents = G.ents.filter(e => !e.enemy); G.talk = null; G.state = 'play'; });
  const LINE = "Reminder: I am a MAGICAL. TALKING. FLYING. AXE. Just so we're clear.";
  // how much of the game picture is the bubble's cream color (the bubble drawn inside the game)
  const cream = () => ev(() => { render(); const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 250 && d[i + 1] > 246 && d[i + 2] > 226 && d[i + 2] < 238) n++; return n / (cv.width * cv.height); });
  await playing(); await wait(150);
  await ev(l => { JT.line = l; JT.t = 6; }, LINE); await wait(500);
  const cap = await box(pg, '#jonline');
  check('upright: Jon\'s pop-up line shows in a bubble above the game screen', await ev(l => { const e = document.getElementById('jonline'); return e.classList.contains('on') && e.textContent === l && getComputedStyle(e).display === 'block'; }, LINE) && inView(cap, 390, 844), cap);
  check('...and it covers none of the game', cap.b <= scr.y + 0.5 && (await cream()) < 0.002, { cap, scrTop: scr.y, cream: await cream() });
  check('...with its tail pointing down at Jon', await ev(() => { const e = document.getElementById('jonline'), r = e.getBoundingClientRect(), c = cv.getBoundingClientRect(); const tail = r.left + parseFloat(e.style.getPropertyValue('--tail')); return Math.abs(tail - (c.left + JCAP.x / VW * c.width)) < 16; }));
  await pg.screenshot({ path: SHOTS + '/phone_jon_caption.png' });
  await ev(() => { G.state = 'menu'; }); await wait(120);
  check('it goes away while the game is paused', await ev(() => !document.getElementById('jonline').classList.contains('on')));
  await ev(() => { G.state = 'play'; JT.t = 0; }); await wait(120);
  check('...and is gone once he stops', await ev(() => getComputedStyle(document.getElementById('jonline')).display === 'none'));
  await ctx.close();
  // sideways there is no empty space above, so the bubble stays over Jon as before
  ({ ctx, pg, ev, wait } = await open(844, 390));
  await playing(); await wait(150);
  await ev(l => { JT.line = l; JT.t = 6; }, LINE); await wait(500);
  check('sideways: the bubble is drawn in the game, over Jon, as before', await ev(() => !document.getElementById('jonline').classList.contains('on')) && (await cream()) > 0.02, await cream());
  await ctx.close();

  // ---- a desktop is unchanged ----
  { const p2 = await b.newPage({ viewport: { width: 1280, height: 800 } }); await p2.goto('file://' + path.join(WEB, 'index.html')); await p2.waitForFunction(() => typeof G !== 'undefined');
    check('with a mouse and keyboard it still opens as the normal page', await p2.evaluate(() => !document.body.classList.contains('theater') && getComputedStyle(document.querySelector('.pad')).display === 'none'));
    await p2.close(); }

  // ---- no internet: once opened online, it opens again offline ----
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png' };
  let notice = false;   // a host's "one more step" page in front of the game
  const srv = http.createServer((q, s) => { if (notice && /index\.html/.test(q.url)) { s.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return s.end('<!doctype html><title>External Content Notice</title><p>One more step</p>'); } const f = path.join(WEB, decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/, '') || 'index.html'); if (!f.startsWith(WEB) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port;
  ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: true, userAgent: UA });
  pg = await ctx.newPage();
  await pg.goto(`http://localhost:${port}/index.html`);
  await pg.waitForFunction(() => typeof G !== 'undefined' && G.state === 'title');
  const swOk = await pg.evaluate(() => navigator.serviceWorker.ready.then(r => !!r.active).catch(() => false));
  check('the offline helper installs on a real web address', swOk);
  await pg.reload(); await pg.waitForFunction(() => typeof G !== 'undefined' && !!navigator.serviceWorker.controller); await pg.waitForTimeout(400);
  notice = true; await pg.reload(); await pg.waitForTimeout(500);
  check('(setup) the host now shows a notice page instead of the game', await pg.title() === 'External Content Notice');
  await ctx.setOffline(true); srv.close(); srv.closeAllConnections && srv.closeAllConnections();
  let offline = false;
  try { await pg.reload({ timeout: 8000 }); offline = await pg.waitForFunction(() => typeof G !== 'undefined' && G.state === 'title', null, { timeout: 5000 }).then(() => true); } catch (e) { offline = false; }
  check('with the network gone, the game still opens from the copy it kept (the notice page did not replace it)', offline);
  check('...icon included', offline && await pg.evaluate(() => fetch('icon-180.png').then(r => r.ok).catch(() => false)));
  await ctx.close();

  console.log('errors:', errs);
  console.log('FAILS:', fails);
  await b.close();
  process.exit(fails || errs.length ? 1 : 0);
})();
