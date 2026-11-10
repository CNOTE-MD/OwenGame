// viewport-only phone screenshot of page N scrolled to panel K: node vp.js N K out.png
const { chromium } = require('playwright'); const path = require('path');
const [n, k, out] = process.argv.slice(2);
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); const pg = await ctx.newPage();
await pg.goto('file://' + path.join(__dirname, 'preview.html')); await pg.waitForFunction(() => typeof Reader !== 'undefined' && Reader.count > 0); await pg.waitForTimeout(600);
await pg.evaluate(([n, k]) => { Reader.go(+n); const p = document.querySelectorAll('#page-' + n + ' .pnl')[+k]; window.scrollTo(0, p.getBoundingClientRect().top + scrollY - 70); }, [n, k]); await pg.waitForTimeout(400);
await pg.screenshot({ path: out }); await b.close(); })();
