// contact sheet: node contact.js out.png cols width file...
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const [out, cols, width, ...files] = process.argv.slice(2);
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: +width, height: 900 } });
const imgs = files.map(f => `<figure><img src="data:image/png;base64,${fs.readFileSync(f).toString('base64')}"><figcaption>${path.basename(f)}</figcaption></figure>`).join('');
await pg.setContent(`<style>body{margin:0;background:#333;display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px;padding:8px;font:12px sans-serif;color:#ddd;align-items:start}img{width:100%;display:block}figure{margin:0}</style>${imgs}`);
await pg.screenshot({ path: out, fullPage: true }); await b.close(); })();
