// Draws the home-screen icon from the game's own sprites (Owen and Jon) and writes
// web/icon-180.png (iPad / iPhone) and web/icon-512.png (the web manifest).
// Run after a build: NODE_PATH=$(npm root -g) node tools/make_icon.js
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage();
  await pg.goto('file://' + path.resolve(__dirname, '../web/index.html'));
  await pg.waitForFunction(() => typeof SPR !== 'undefined' && SPR.jon && SPR.owen_down_w0);
  for (const [size, scale] of [[180, 4], [512, 12]]) {
    const url = await pg.evaluate(([size, scale]) => {
      const L = 42, art = document.createElement('canvas'); art.width = art.height = L;
      const a = art.getContext('2d');
      a.fillStyle = '#1e2250'; a.fillRect(0, 0, L, L);
      a.fillStyle = '#2a3070'; a.fillRect(0, 30, L, 12);                                   // ground
      a.fillStyle = '#343c8a'; for (let x = 0; x < L; x += 6) a.fillRect(x + (x % 12 ? 0 : 3), 33 + (x % 4), 2, 1);
      a.fillStyle = '#ffffff'; for (const [x, y] of [[4, 5], [12, 9], [9, 2], [38, 26], [3, 22], [16, 15]]) a.fillRect(x, y, 1, 1);   // stars
      a.fillStyle = '#ffd84a'; for (const [x, y] of [[7, 13], [36, 21]]) a.fillRect(x, y, 1, 1);
      a.fillStyle = 'rgba(0,0,0,.35)'; a.fillRect(7, 37, 14, 2);                           // Owen's shadow
      a.drawImage(SPR.owen_down_w0, 5, 17);
      a.drawImage(SPR.jon, 22, 5);
      const out = document.createElement('canvas'); out.width = out.height = size;
      const o = out.getContext('2d'); o.imageSmoothingEnabled = false;
      o.fillStyle = '#1e2250'; o.fillRect(0, 0, size, size);
      const m = Math.floor((size - L * scale) / 2);
      o.drawImage(art, m, m, L * scale, L * scale);
      return out.toDataURL('image/png');
    }, [size, scale]);
    const file = path.resolve(__dirname, `../web/icon-${size}.png`);
    fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
    console.log(file, fs.statSync(file).size, 'bytes');
  }
  await b.close();
})();
