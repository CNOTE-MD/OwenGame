// Screenshot every comic page at phone (390x844) and iPad (820x1180) widths.
// usage: node shoot.js [outdir] [pages e.g. 0,1,2] [sizes: phone,ipad]
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const out = process.argv[2] || path.join(__dirname, '../shots');
const only = process.argv[3] ? process.argv[3].split(',').map(Number) : null;
const sizes = (process.argv[4] || 'phone,ipad').split(',');
const SZ = { phone: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, ipad: { width: 820, height: 1180, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true } };
(async () => {
  const b = await chromium.launch(); fs.mkdirSync(out, { recursive: true });
  // mimic the Artifact publish skeleton around index.html
  const body = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  fs.writeFileSync(path.join(__dirname, 'preview.html'), `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><base href="../"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
  for (const sz of sizes) {
    const { width, height, ...rest } = SZ[sz];
    const ctx = await b.newContext({ viewport: { width, height }, ...rest });
    const pg = await ctx.newPage();
    pg.on('pageerror', e => console.log('ERR', e.message)); pg.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
    await pg.goto('file://' + path.join(__dirname, 'preview.html'));
    await pg.waitForFunction(() => typeof Reader !== "undefined" && Reader.count > 0, null, { timeout: 15000 });
    await pg.waitForTimeout(800);
    const n = await pg.evaluate(() => Reader.count);
    const fonts = await pg.evaluate(() => ['Bangers', 'Kalam', 'Comic Neue'].map(f => f + ':' + document.fonts.check(`700 20px "${f}"`)).join(' '));
    console.log(sz, 'pages', n, fonts);
    const sw = await pg.evaluate(() => document.documentElement.scrollWidth);
    if (sw > width) console.log('HORIZONTAL OVERFLOW', sz, sw);
    for (let i = 0; i < n; i++) {
      if (only && !only.includes(i)) continue;
      await pg.evaluate(i => Reader.go(i), i); await pg.waitForTimeout(350);
      await pg.screenshot({ path: path.join(out, `${sz}_p${i}.png`), fullPage: true });
      if (process.env.EL) await pg.locator('#page-' + i).screenshot({ path: path.join(out, `${sz}_el${i}.png`) });
    }
    await ctx.close();
  }
  await b.close();
})();
