// Graphics pass: crisp pixel primitives (no smooth vector lines in a pixel world), bosses drawn at
// native resolution (Scale2x/Scale3x instead of chunky blown-up pixels), framed boss bars,
// a hand-drawn Flight 364, more distinct villagers and portraits, and props for empty rooms.

// ---------------- pixel primitives ----------------
const qa = a => Math.round(clamp(a, 0, 1) * 4) / 4;          // alpha in quarter steps, like SNES color math
function pxLine(x0, y0, x1, y1, color, t = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, n = 0;
  while (n++ < 600) { R(x0 - (t >> 1), y0 - (t >> 1), t, t, color); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
}
function pxEllipse(cx, cy, rx, ry, color, t = 1, a0 = 0, a1 = Math.PI * 2) {
  cx = Math.round(cx); cy = Math.round(cy);
  const n = Math.max(16, Math.round((rx + ry) * 3 * (a1 - a0) / (Math.PI * 2)));
  let lx = null, ly = null;
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n, x = Math.round(cx + Math.cos(a) * rx), y = Math.round(cy + Math.sin(a) * ry); if (x !== lx || y !== ly) R(x - (t >> 1), y - (t >> 1), t, t, color); lx = x; ly = y; }
}
function pxEllipseFill(cx, cy, rx, ry, color) {
  cx = Math.round(cx); cy = Math.round(cy); rx = Math.max(1, Math.round(rx)); ry = Math.max(1, Math.round(ry));
  for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry)))); R(cx - w, cy + y, w * 2 + 1, 1, color); }
}
// a glow: three stepped discs instead of a soft gradient
function pxGlow(cx, cy, r, rgb, a) {
  for (const [k, m] of [[1, 0.25], [0.66, 0.5], [0.36, 1]]) { ctx.globalAlpha = qa(a * m); pxEllipseFill(cx, cy, r * k, r * k, `rgb(${rgb})`); }
  ctx.globalAlpha = 1;
}
function pxPoly(pts, color) {
  const ys = pts.map(p => p[1]), y0 = Math.ceil(Math.min(...ys)), y1 = Math.floor(Math.max(...ys));
  for (let y = y0; y <= y1; y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= y && by > y) || (by <= y && ay > y)) xs.push(ax + (y - ay) / (by - ay) * (bx - ax)); }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) R(Math.round(xs[i]), y, Math.round(xs[i + 1]) - Math.round(xs[i]) + 1, 1, color);
  }
}

// ---------------- native-resolution scaling (Scale2x / Scale3x) ----------------
// Sprites drawn at 2x or 3x are re-drawn with the classic EPX/AdvMAME algorithms: the shape grows,
// but every pixel stays the size of the world's pixels, with smoothed diagonals instead of stairs.
const UP = new Map();
function up(c, s) {
  if (!c || (s !== 2 && s !== 3)) return c;
  let m = UP.get(c); if (!m) { m = {}; UP.set(c, m); }
  if (m[s]) return m[s];
  const w = c.width, h = c.height, src = new Uint32Array(c.getContext('2d').getImageData(0, 0, w, h).data.buffer);
  const out = mkCanvas(w * s, h * s), og = out.getContext('2d'), img = og.createImageData(w * s, h * s), dst = new Uint32Array(img.data.buffer);
  const P = (x, y) => src[clamp(y, 0, h - 1) * w + clamp(x, 0, w - 1)], W = w * s;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const E = P(x, y), B = P(x, y - 1), D = P(x - 1, y), F = P(x + 1, y), H = P(x, y + 1);
    const o = (y * s) * W + x * s;
    if (s === 2) {
      dst[o] = D === B && B !== F && D !== H ? D : E;
      dst[o + 1] = B === F && B !== D && F !== H ? F : E;
      dst[o + W] = D === H && D !== B && H !== F ? D : E;
      dst[o + W + 1] = H === F && D !== H && B !== F ? F : E;
    } else {
      const A = P(x - 1, y - 1), C = P(x + 1, y - 1), Gp = P(x - 1, y + 1), I = P(x + 1, y + 1);
      const db = D === B && B !== F && D !== H, bf = B === F && B !== D && F !== H, dh = D === H && D !== B && H !== F, hf = H === F && D !== H && B !== F;
      dst[o] = db ? D : E;
      dst[o + 1] = (db && E !== C) || (bf && E !== A) ? B : E;
      dst[o + 2] = bf ? F : E;
      dst[o + W] = (db && E !== Gp) || (dh && E !== A) ? D : E;
      dst[o + W + 1] = E;
      dst[o + W + 2] = (bf && E !== I) || (hf && E !== C) ? F : E;
      dst[o + 2 * W] = dh ? D : E;
      dst[o + 2 * W + 1] = (dh && E !== I) || (hf && E !== Gp) ? H : E;
      dst[o + 2 * W + 2] = hf ? F : E;
    }
  }
  og.putImageData(img, 0, 0);
  return (m[s] = out);
}

// ---------------- framed bars ----------------
function bossBar(cx, y, frac, color = '#e23') {
  const w = 60, x = Math.round(cx - w / 2); y = Math.round(y);
  R(x - 3, y - 3, w + 6, 9, '#0a0812'); R(x - 2, y - 2, w + 4, 7, '#e8dcb8'); R(x - 1, y - 1, w + 2, 5, '#0a0812');
  const f = Math.round(w * clamp(frac, 0, 1));
  if (f) { R(x, y, f, 3, color); R(x, y, f, 1, 'rgba(255,255,255,.45)'); }
  for (const rx of [x - 3, x + w + 1]) R(rx, y - 1, 2, 2, '#ffd84a');
}

// ---------------- Flight 364, hand-built ----------------
const CUT = {};
function cutImg(key, w, h, draw) { return CUT[key] || (CUT[key] = makeImg(w, h, draw)); }
function airlinerSide() {
  return cutImg('liner', 112, 34, (P) => {
    const rect = (x, y, w, h, c) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) P(xx, yy, c); };
    for (let x = 6; x < 104; x++) { const top = x < 18 ? 14 - Math.round(Math.sqrt(Math.max(0, 36 - (x - 12) * (x - 12)))) * 0.9 : 9, bot = 22; for (let y = Math.round(top); y < bot; y++) P(x, y, y < 12 ? '#ffffff' : y < 17 ? '#e6eaf0' : y < 20 ? '#c8ced8' : '#a8aeb8'); }
    for (let x = 104; x < 110; x++) for (let y = 10 + (x - 104); y < 20; y++) P(x, y, '#c8ced8');
    for (let y = 0; y < 10; y++) for (let x = 92 + Math.round(y * 0.8); x < 104; x++) P(x, y, y < 3 ? '#e05040' : '#c0392b');
    rect(10, 17, 92, 1, '#c0392b'); rect(10, 18, 92, 1, '#2a4a8a');
    for (let x = 24; x < 88; x += 5) { P(x, 13, '#1e2a48'); P(x + 1, 13, '#1e2a48'); P(x, 14, '#3a5a8a'); P(x + 1, 14, '#3a5a8a'); }
    for (const [x, y] of [[9, 13], [10, 13], [12, 12], [13, 12], [15, 12]]) P(x, y, '#1a2a4a');
    for (let k = 0; k < 9; k++) for (let x = 46 + k * 2; x < 72 - k; x++) P(x, 22 + k, k > 6 ? '#9aa2ae' : '#c4cad4');
    rect(52, 26, 12, 5, '#7a808c'); rect(52, 26, 12, 1, '#a8aeba'); rect(51, 27, 2, 3, '#20242c');
  });
}
// outline a finished image with the game's dark outline
function outlined(c) {
  const w = c.width, h = c.height, g = c.getContext('2d'), d = g.getImageData(0, 0, w, h), a = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d.data[(y * w + x) * 4 + 3] > 0;
  const o = mkCanvas(w + 2, h + 2), og = o.getContext('2d'); og.fillStyle = OUTLINE;
  for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) if (!a(x, y) && (a(x + 1, y) || a(x - 1, y) || a(x, y + 1) || a(x, y - 1))) og.fillRect(x + 1, y + 1, 1, 1);
  og.drawImage(c, 1, 1); return o;
}
let LINER = null;
const liner = () => LINER || (LINER = outlined(airlinerSide()));
// the flight attendant, full height for the cutscene: normal and demon
const ATT_BIG = [
  '......hhhhhh......', '.....hhhhhhhh.....', '....hhhhhhhhhh....', '...hhhrrrrrrhhh...', '...hhrrRRRRrrhh...', '...hsssssssssh....', '...hsSsssssSsh....',
  '...hseesssseesh...', '...hsssssssssh....', '....sssSSSsss.....', '....ssmmmmmss.....', '.....sssssss......', '......sssss.......', '....rrrwwwwrrr....',
  '...uurrrwwrrruu...', '..uuuurrrrrruuuu..', '..uuuuuuggguuuuu..', '.suuuuuuuuuuuuuus.', '.suuUuuuuuuuuUuus.', '.suuUuuuuuuuuUuus.', 'ss.uUuuuuuuuuUu.ss',
  's..uuuuuuuuuuuu..s', 's..uuuuuuuuuuuu..s', '...uuuuuuuuuuuu...', '...UUUUUUUUUUUU...', '...uuuuuuuuuuuu...', '..uuuuuuuuuuuuuu..', '..uuuuuuuuuuuuuu..',
  '..UUUUUUUUUUUUUU..', '....ssss..ssss....', '....ssss..ssss....', '....ssss..ssss....', '....kkkk..kkkk....', '...kkkkk..kkkkk...',
];
const PAL_ATT_BIG = { h: '#3a2418', r: '#c0182b', R: '#e84050', s: '#ecd2c0', S: '#c8a090', e: '#20141c', m: '#b04050', u: '#1e2a5a', U: '#141c40', w: '#f4f4f8', g: '#ffd84a', k: '#1a1a1a' };
const ATT_BIG_DEMON = ATT_BIG.map((r, i) => i === 7 ? '...hsRRsssssRRsh...'.slice(0, 18) : i === 9 ? '....sssSSSsss.....' : i === 10 ? '....smwmwmwms.....' : i === 11 ? '.....swsswss......' : i === 20 ? 'kk.uUuuuuuuuuUu.kk' : i === 21 ? 'k..uuuuuuuuuuuu..k' : i === 22 ? 'k..uuuuuuuuuuuu..k' : i < 3 ? r.replace(/h/g, 'H') : r);
let ATTS = null;
function attBig(demon) {
  if (!ATTS) ATTS = { n: buildSprite(ATT_BIG, PAL_ATT_BIG), d: buildSprite(ATT_BIG_DEMON, { ...PAL_ATT_BIG, R: '#ff2020', H: '#1a0a10', s: '#d8e8d0', S: '#a8b8a0' }) };
  return demon ? ATTS.d : ATTS.n;
}
function seatBack(dark) {
  return cutImg('seat' + (dark ? 'd' : ''), 26, 30, (P) => {
    for (let y = 0; y < 30; y++) for (let x = 0; x < 26; x++) {
      const inside = (y > 2 || (x > 2 && x < 23)) && x > 0 && x < 25;
      if (!inside) continue;
      let c = dark ? '#1a2244' : '#2f5aa8';
      if (x < 4) c = dark ? '#141a36' : '#24488a'; else if (x > 21) c = dark ? '#10162c' : '#1e3a78';
      if (y < 9 && x > 4 && x < 21) c = dark ? '#8a8a9a' : '#e8e8f0';      // headrest cover
      if (y === 9 && x > 4 && x < 21) c = dark ? '#5a5a6a' : '#b8b8c8';
      if (y > 20 && y < 24 && x > 6 && x < 19) c = dark ? '#262c4a' : '#3e6cc8'; // seat-back pocket
      P(x, y, c);
    }
  });
}
function drawFlightArt(art, t) {
  if (art === 'plane') {
    const SKY = ['#0a0c24', '#101436', '#161c46', '#1e2858', '#283468', '#344278'];
    SKY.forEach((c, i) => R(0, i * 24, VW, 24, c));
    for (let i = 0; i < 6; i++) for (let x = (i % 2); x < VW; x += 2) R(x, i * 24 + 23, 1, 1, SKY[Math.min(5, i + 1)]);   // dithered band edges
    for (let i = 0; i < 40; i++) R((i * 71) % VW, (i * 37) % 110, 1, 1, i % 5 ? '#6a72a8' : '#e8e8ff');
    pxEllipseFill(206, 30, 9, 9, '#f2ecd0'); pxEllipseFill(210, 27, 8, 8, '#344278');          // a crescent moon
    for (let i = 0; i < 5; i++) { const cx = ((i * 83 - t * 14) % 330 + 330) % 330 - 40, cy = 104 + (i % 3) * 12; for (const [dx, dy, r] of [[0, 0, 10], [12, -4, 12], [24, 0, 9]]) pxEllipseFill(cx + dx, cy + dy, r, r * 0.55, i % 2 ? '#3a4682' : '#2e3a72'); }
    const bob = Math.round(Math.sin(t * 1.4) * 2), px = 70, py = 62 + bob;
    for (let i = 1; i < 8; i++) R(px - i * 7, py + 15 + (i % 2), 4, 1, `rgba(220,230,255,${qa(0.5 - i * 0.06)})`);
    ctx.drawImage(liner(), px, py);
    if (Math.floor(t * 2) % 2) { R(px + 54, py + 31, 2, 2, '#ff3030'); R(px + 106, py + 14, 2, 2, '#ffffff'); }
    return;
  }
  // cabin and demon share the room
  const demon = art === 'demon', flick = demon && Math.sin(t * 23) > 0.6;
  R(0, 0, VW, 150, flick ? '#060608' : '#3a3a48');
  R(0, 0, VW, 22, flick ? '#0a0a0e' : '#5a5a6c'); R(0, 22, VW, 2, flick ? '#000' : '#2a2a36');          // overhead bins
  for (let x = 4; x < VW; x += 42) { R(x, 4, 38, 14, flick ? '#121218' : '#6a6a7e'); R(x + 16, 13, 6, 2, flick ? '#000' : '#3a3a4a'); }
  for (let i = 0; i < 5; i++) { const wx = 12 + i * 52; R(wx, 32, 20, 16, OUTLINE); R(wx + 1, 33, 18, 14, flick ? '#000' : '#0c1030'); R(wx + 1, 33, 18, 3, flick ? '#000' : '#1a2048'); if (!flick && i % 2) R(wx + 6, 38, 1, 1, '#e8e8ff'); }
  R(0, 50, VW, 100, flick ? '#0c0c12' : '#2a2f44');
  for (let y = 50; y < 150; y += 4) R(110, y, 36, 2, flick ? '#140808' : '#4a2a3a');                  // the aisle carpet
  const seat = seatBack(flick);
  for (let row = 0; row < 3; row++) {
    const y = 58 + row * 30;
    for (const x of [8, 36, 64, 152, 180, 208]) ctx.drawImage(seat, x + (row % 2), y);
  }
  // the attendant stands in the aisle; in the demon pages she changes
  const a = attBig(demon), ax = 128 - a.width / 2 + (demon && Math.floor(t * 18) % 4 === 0 ? 1 : 0), ay = 150 - a.height + (demon ? 0 : 0);
  ctx.globalAlpha = 0.3; pxEllipseFill(128, 148, 12, 3, '#000'); ctx.globalAlpha = 1;
  ctx.drawImage(a, Math.round(ax), Math.round(ay));
  if (demon) {
    ctx.globalAlpha = qa(0.25 + 0.15 * Math.sin(t * 3)); R(0, 0, VW, 150, '#600010'); ctx.globalAlpha = 1;
    pxGlow(124, ay + 9, 5, '255,40,40', 0.6); pxGlow(132, ay + 9, 5, '255,40,40', 0.6);
  }
}
function drawLandArt(t) {
  const SKY = ['#3a4a8a', '#6a5a9a', '#c8708a', '#f09a6a', '#f8c070', '#fbe0a0'];
  SKY.forEach((c, i) => R(0, i * 14, VW, 14, c));
  for (let i = 0; i < 5; i++) for (let x = i % 2; x < VW; x += 2) R(x, i * 14 + 13, 1, 1, SKY[i + 1]);
  pxEllipseFill(196, 84, 12, 12, '#fff2c0');
  pxPoly([[0, 96], [30, 62], [58, 84], [92, 50], [128, 88], [160, 58], [196, 82], [230, 54], [256, 76], [256, 100], [0, 100]], '#4a4a7a');
  for (const [x, y] of [[30, 62], [92, 50], [160, 58], [230, 54]]) pxPoly([[x - 8, y + 9], [x, y], [x + 8, y + 9]], '#e8e8f8');
  R(0, 96, VW, 54, '#2f6a3a'); R(0, 96, VW, 2, '#3a7a44');
  pxPoly([[96, 98], [160, 98], [256, 150], [0, 150]], '#5a5a62');                                     // runway in perspective
  for (let i = 0; i < 6; i++) { const k = ((t * 0.9 + i / 6) % 1), y = 100 + k * k * 50, w = 1 + k * 6; R(128 - w / 2, y, w, 1 + k * 3, '#f4f4f4'); }
  for (let i = 0; i < 8; i++) { const k = i / 8, y = 99 + k * k * 51; R(96 - k * 96 - 2, y, 2, 2, Math.floor(t * 4 + i) % 2 ? '#ffd84a' : '#a07a20'); R(160 + k * 96, y, 2, 2, Math.floor(t * 4 + i) % 2 ? '#ffd84a' : '#a07a20'); }
  const k = clamp((t % 6) / 4, 0, 1), px = 40 + k * 70, py = 40 + k * 46;
  ctx.drawImage(liner(), Math.round(px), Math.round(py));
  if (k >= 1) for (let i = 0; i < 4; i++) R(Math.round(px) + 40 + i * 5, Math.round(py) + 34 + (i % 2), 3, 1, '#d8d8d8');
}

// ---------------- distinct villagers and portraits ----------------
function drawPersonExtra(x, y, id) {
  const top = y - 10;
  switch (id) {
    case 'astrid': pxLine(x + 8, top + 2, x + 8, y + 7, '#7a4a22'); R(x + 7, top - 1, 3, 3, Math.floor(G.t * 2) % 2 ? '#7fd4ff' : '#4aa0d8'); break;        // a rune staff
    case 'lars': R(x - 4, y - 2, 8, 6, '#f0ece0'); R(x - 4, y - 2, 8, 1, '#c8c4b8'); R(x - 1, y, 2, 2, '#b33a2e'); break;                                // a market apron
    case 'sven': if (flag('sven_done')) { R(x + 5, y, 6, 2, '#8a5428'); R(x + 7, y - 4, 1, 4, '#e02838'); R(x + 8, y - 4, 2, 2, '#e02838'); } else R(x + 6, y - 6, 1, 7, '#c8c8d8'); break;   // wooden sword, or his longship back
    case 'ingrid': pxLine(x + 6, y, x + 18, top - 6, '#6b4322'); pxLine(x + 18, top - 6, x + 20, y + 4, 'rgba(255,255,255,.7)'); R(x + 19, y + 4, 2, 2, '#e02838'); break;   // fishing rod
    case 'bjarne': R(x + 5, y - 3, 6, 7, '#f4ecd0'); for (let i = 0; i < 3; i++) R(x + 6, y - 2 + i * 2, 4, 1, '#3a2a1a'); break;                       // sheet music
    case 'commuter': R(x - 6, y - 3, 12, 7, '#e8e4d8'); R(x - 5, y - 2, 5, 1, '#5a5a6a'); R(x - 5, y, 9, 1, '#9a9aa8'); R(x - 5, y + 2, 9, 1, '#9a9aa8'); break;   // a newspaper
    case 'attendant_ok': R(x - 2, y - 4, 4, 2, '#c0182b'); R(x - 3, y - 1, 2, 1, '#ffd84a'); R(x + 1, y - 1, 2, 1, '#ffd84a'); break;                      // scarf and wings pin
  }
}
function drawPortraitExtra(who) {
  // called inside drawPortrait's 2x transform, centered on (0, 0)
  if (who === 'Hank') { spr(SPR.draugr_down_0, 0, 7); R(-8, -10, 2, 5, '#f2ebcc'); R(6, -10, 2, 5, '#f2ebcc'); return true; }
  if (who === 'Draugr Captain') { spr(SPR.draugr_down_0, 0, 7); R(-5, -8, 10, 2, '#c9a227'); return true; }
  if (who === 'Fluffy') { ctx.globalAlpha = 0.85; spr(SPR.fluffy, 0, 4); ctx.globalAlpha = 1; return true; }
  if (who === 'Driver') { spr(SPR.npc_commuter, 0, 7); R(-6, -9, 12, 2, '#ffd84a'); return true; }
  if (who === 'Announcer') { R(-6, -6, 6, 10, '#8a8a9c'); R(-5, -5, 4, 8, '#5a5a6c'); pxPoly([[0, -6], [7, -10], [7, 8], [0, 4]], '#a8a8bc'); for (const r of [3, 6]) pxEllipse(9, -1, r, r + 2, '#ffd84a', 1, -0.9, 0.9); return true; }
  return false;
}

// ---------------- props for rooms that were empty ----------------
const DECOR = {
  home: [
    { x: 12 * 16 + 8, y: 10 * 16 + 10, tall: false, draw: (x, y) => { R(x - 6, y - 8, 12, 10, '#c0392b'); R(x - 6, y - 8, 12, 2, '#e05a40'); R(x - 4, y - 5, 8, 4, '#a8302a'); R(x - 3, y - 11, 6, 3, '#7a2018'); R(x + 3, y - 6, 4, 3, '#f4f4f8'); R(x + 4, y - 5, 2, 1, '#2f5aa8'); R(x + 1, y - 7, 2, 2, '#d8d0b8'); } },   // backpack with a luggage tag, packed for Norway
    { x: 13 * 16 + 4, y: 11 * 16 + 12, tall: false, draw: (x, y) => { R(x - 6, y - 3, 5, 3, '#f4f4f8'); R(x - 6, y - 1, 5, 1, '#c03a2a'); R(x + 1, y - 2, 5, 3, '#f4f4f8'); R(x + 1, y, 5, 1, '#c03a2a'); } },                                               // sneakers
    { x: 4 * 16, y: 9 * 16 + 8, tall: false, draw: (x, y) => { pxEllipseFill(x, y, 10, 7, '#2f8a5a'); pxEllipseFill(x - 2, y - 2, 6, 4, '#3aa06a'); } },                                                                                       // a bean bag
  ],
  overworld: [
    { x: 30 * 16 + 8, y: 30 * 16 + 12, tall: true, draw: (x, y) => { R(x, y - 30, 2, 30, '#8a8a9c'); const w = Math.round(Math.sin(G.t * 3) * 2); for (let i = 0; i < 4; i++) R(x + 2 + i * 4, y - 29 + Math.round(w * i / 3), 4, 5 - Math.floor(i / 2), i % 2 ? '#f4f4f8' : '#ff6a1a'); } },   // windsock
    { x: 26 * 16 + 8, y: 38 * 16 + 12, tall: true, draw: (x, y) => { R(x - 12, y - 6, 24, 3, '#8a8a9c'); R(x - 11, y - 3, 2, 3, '#3a3a4a'); R(x + 9, y - 3, 2, 3, '#3a3a4a'); R(x - 10, y - 14, 9, 8, '#b33a2e'); R(x - 10, y - 14, 9, 1, '#e05a40'); R(x, y - 12, 10, 6, '#2f5aa8'); R(x + 2, y - 18, 7, 6, '#3a7a4a'); R(x - 7, y - 15, 3, 1, '#3a2a1a'); } },   // luggage cart
    { x: 16 * 16 + 8, y: 35 * 16 + 12, tall: true, draw: (x, y) => { for (const dx of [0, 10]) { pxPoly([[x + dx - 3, y], [x + dx, y - 8], [x + dx + 3, y]], '#ff6a1a'); R(x + dx - 2, y - 4, 4, 1, '#ffffff'); } } },                                                                 // traffic cones
  ],
};
function decorOnScreen(d) { const sx = d.x - G.cam.x, sy = (d.wall ? 0 : d.y) - G.cam.y; return sx > -30 && sx < VW + 30 && sy > -40 && sy < VH + 40; }
function drawDecorGround() {
  const list = DECOR[G.mapId]; if (!list) return;
  for (const d of list) if (!d.tall && decorOnScreen(d)) d.wall ? d.draw(Math.round(d.x - G.cam.x)) : d.draw(Math.round(d.x - G.cam.x), Math.round(d.y - G.cam.y));
  // runway stripes along the airstrip path
  if (G.mapId === 'overworld' && G.scr.x === 1 && G.scr.y === 2) for (let tx = 16; tx < 32; tx++) if (tile(tx, 34) === 's' && tx % 2 === 0) R(tx * 16 + 4 - G.cam.x, 34 * 16 + 7 - G.cam.y, 8, 2, 'rgba(255,255,255,.75)');
}
function decorSorted() {
  const list = DECOR[G.mapId] || [];
  return list.filter(d => d.tall && decorOnScreen(d)).map(d => ({ y: d.y, f: () => d.draw(Math.round(d.x - G.cam.x), Math.round(d.y - G.cam.y)) }));
}
