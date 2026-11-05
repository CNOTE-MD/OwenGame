const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const pg = await b.newPage();
pg.on('pageerror', e => console.log('ERR', e.message));
await pg.goto('file:///home/user/OwenGame/web/index.html'); await pg.waitForTimeout(500);
const r = await pg.evaluate(() => { const ks = Object.keys(SPR); const groups = {}; ks.forEach(k => { const g = k.split('_')[0]; (groups[g] = groups[g] || []).push(k + ':' + SPR[k].width + 'x' + SPR[k].height); });
 return { n: ks.length, groups: Object.fromEntries(Object.entries(groups).map(([g, a]) => [g, a.length > 8 ? a.slice(0, 8).concat(['...' + a.length]) : a])), maps: Object.keys(MAPS), story: Object.keys(STORY) }; });
console.log(JSON.stringify(r, null, 1)); await b.close(); })();
