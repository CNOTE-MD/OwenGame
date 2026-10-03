// Big scenery, A Link to the Past style: 2x2-tile trees with a canopy Owen walks behind,
// and whole buildings drawn as one piece (log walls, shingled roofs, chimneys with smoke).
// The map ASCII doesn't change: computeBigs() finds the shapes when a map loads.

function makeImg(w, h, draw) {
  const c = mkCanvas(w, h), g = c.getContext('2d'), img = g.createImageData(w, h);
  const P = (x, y, hex, a = 255) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const [r, gg, b] = hexRgb(hex), i = (y * w + x) * 4;
    if (a < 255 && img.data[i + 3]) { const k = a / 255; img.data[i] = img.data[i] * (1 - k) + r * k; img.data[i + 1] = img.data[i + 1] * (1 - k) + gg * k; img.data[i + 2] = img.data[i + 2] * (1 - k) + b * k; return; }
    img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = a;
  };
  const has = (x, y) => x >= 0 && y >= 0 && x < w && y < h && img.data[(y * w + x) * 4 + 3] > 0;
  draw(P, has);
  g.putImageData(img, 0, 0);
  return c;
}

// ---------------- big trees (36 x 42 image over a 32 x 32 footprint) ----------------
const BIG_TREE_W = 36, BIG_TREE_H = 42;
function treeImage(variant, snowy) {
  const r = rng(variant * 977 + (snowy ? 5 : 1));
  const ramp = snowy ? ['#ffffff', '#dfe9f2', '#3e7a68', '#2a5a4c', '#1a3c32'] : ['#88d860', '#58b040', '#3a8a30', '#26682a', '#174a1c'];
  // the canopy is a union of lumpy circles; light comes from the top-left
  const lumps = [[18, 15, 16, 13], [9, 19, 9, 8], [27, 19, 9, 8], [18, 7, 11, 7], [11, 10, 7, 6], [25, 10, 7, 6]]
    .map(([x, y, rx, ry]) => [x + (r() - 0.5) * 2, y + (r() - 0.5) * 2, rx, ry]);
  const inCanopy = (x, y) => lumps.some(([cx, cy, rx, ry]) => { const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry; return nx * nx + ny * ny <= 1; });
  return makeImg(BIG_TREE_W, BIG_TREE_H, (P, has) => {
    // ground shadow, offset down-right
    for (let y = 33; y < 42; y++) for (let x = 4; x < 34; x++) { const nx = (x - 19) / 15, ny = (y - 37) / 4.5; if (nx * nx + ny * ny <= 1) P(x, y, '#000000', 60); }
    // trunk with roots
    for (let y = 24; y < 39; y++) for (let x = 13; x < 23; x++) {
      const root = y > 34 ? (x - 18) * (x - 18) < (y - 30) * 4 : x >= 14 && x < 22;
      if (!root) continue;
      P(x, y, x < 15 ? '#5a3418' : x > 20 ? '#4a2810' : (x + y) % 5 === 0 ? '#6a3c1a' : '#8a5428');
    }
    for (let y = 26; y < 39; y++) { if (has(13, y) || has(14, y)) P(has(13, y) ? 12 : 13, y, OUTLINE); if (has(22, y) || has(21, y)) P(has(22, y) ? 23 : 22, y, OUTLINE); }
    for (let x = 12; x < 25; x++) if (has(x, 38)) P(x, 39, OUTLINE);
    // canopy fill
    for (let y = 0; y < 31; y++) for (let x = 0; x < BIG_TREE_W; x++) {
      if (!inCanopy(x, y)) continue;
      const nx = (x - 18) / 17, ny = (y - 14) / 14;
      const l = -nx * 0.65 - ny * 0.75 + (r() - 0.5) * 0.55;
      P(x, y, l > 0.7 ? ramp[0] : l > 0.25 ? ramp[1] : l > -0.2 ? ramp[2] : l > -0.6 ? ramp[3] : ramp[4]);
    }
    // leaf clusters: small dark crescents with a lit edge above
    for (let i = 0; i < 26; i++) {
      const x = 3 + Math.floor(r() * 30), y = 3 + Math.floor(r() * 24);
      if (!inCanopy(x, y) || !inCanopy(x + 3, y + 1)) continue;
      const dark = (x - 18) * 0.65 + (y - 14) * 0.75 > -4;
      P(x, y + 1, dark ? ramp[4] : ramp[3]); P(x + 1, y + 2, dark ? ramp[4] : ramp[3]); P(x + 2, y + 2, dark ? ramp[4] : ramp[3]); P(x + 3, y + 1, dark ? ramp[4] : ramp[3]);
      P(x + 1, y, ramp[1]); P(x + 2, y, ramp[1]);
    }
    if (snowy) for (let i = 0; i < 18; i++) { const x = 4 + Math.floor(r() * 28), y = 2 + Math.floor(r() * 12); if (inCanopy(x, y) && !inCanopy(x, y - 2)) { P(x, y, '#ffffff'); P(x + 1, y, '#ffffff'); P(x, y + 1, '#e8f0f8'); } }
    // outline around the canopy
    for (let y = 0; y < 32; y++) for (let x = 0; x < BIG_TREE_W; x++) {
      if (inCanopy(x, y)) continue;
      if (inCanopy(x + 1, y) || inCanopy(x - 1, y) || inCanopy(x, y + 1) || inCanopy(x, y - 1)) P(x, y, OUTLINE);
    }
    // canopy shadow onto the trunk
    for (let x = 13; x < 23; x++) for (let y = 24; y < 31; y++) if (!inCanopy(x, y) && has(x, y) && !inCanopy(x, y - 1) === false) P(x, y, '#000000', 90);
  });
}

// ---------------- buildings ----------------
function houseImage(h) {
  const tw = h.x1 - h.x0 + 1, th = h.y1 - h.y0 + 1;
  const W = tw * T + 8, H = th * T + 12;
  const roofH = (h.roofEnd - h.y0 + 1) * T - 2;   // roof ends just above the wall row
  const stall = !h.doors.length;
  const r = rng(h.x0 * 31 + h.y0 * 17);
  const oy = 12;                                      // room above the footprint for ridge and chimney
  return makeImg(W, H, (P) => {
    const rect = (x, y, w, hh, c, a) => { for (let yy = y; yy < y + hh; yy++) for (let xx = x; xx < x + w; xx++) P(xx, yy, c, a); };
    // ---- walls: horizontal logs with round ends ----
    const wallTop = oy + roofH - 2, wallBot = oy + th * T;
    for (let y = wallTop; y < wallBot; y++) for (let x = 4; x < W - 4; x++) {
      const k = (y - wallTop) % 5;
      P(x, y, k === 0 ? '#d8a060' : k === 4 ? '#5a3418' : k === 3 ? '#7a4a22' : '#a8703c');
    }
    for (let y = wallTop; y < wallBot; y += 5) for (const x of [4, W - 7]) { rect(x, y, 3, 4, '#e8c088'); P(x + 1, y + 1, '#a8703c'); P(x + 1, y + 2, '#a8703c'); }
    rect(4, wallBot - 2, W - 8, 2, '#3a2010');
    if (stall) {
      // Lars's stall: open front with shelves of jars
      rect(8, wallTop + 2, W - 16, wallBot - wallTop - 4, '#3a2412');
      for (let x = 10; x < W - 12; x += 6) { rect(x, wallTop + 4, 4, 5, ['#c0182b', '#7fd4ff', '#ffd84a'][(x / 6 | 0) % 3]); P(x + 1, wallTop + 3, '#d8d8e8'); P(x + 2, wallTop + 3, '#d8d8e8'); }
      rect(8, wallTop + 10, W - 16, 2, '#8a5428');
    } else {
      // windows with shutters, skipping door columns
      for (let c = 0; c < tw; c++) {
        const tx = h.x0 + c;
        if (h.doors.some(d => Math.abs(d - tx) <= 0) || (c % 2 === 1 && tw > 3)) continue;
        const x = 4 + c * T + 4, y = wallTop + 3;
        if (y + 8 > wallBot - 2) continue;
        rect(x - 1, y - 1, 10, 9, OUTLINE); rect(x, y, 8, 7, '#9fd0ff'); rect(x, y, 8, 2, '#d8f0ff'); rect(x + 3, y, 2, 7, '#5a3418'); rect(x, y + 3, 8, 1, '#5a3418');
        rect(x - 4, y - 1, 3, 9, '#2f6a3a'); rect(x + 9, y - 1, 3, 9, '#2f6a3a');
      }
      // arched doors
      for (const d of h.doors) {
        const x = 4 + (d - h.x0) * T + 2, y = wallBot - 15;
        rect(x - 1, y - 1, 14, 16, OUTLINE);
        for (let yy = 0; yy < 15; yy++) for (let xx = 0; xx < 12; xx++) {
          if (yy < 3 && (xx < 2 - yy || xx > 9 + yy)) continue;
          P(x + xx, y + yy, xx % 4 === 0 ? '#3a1e0c' : yy === 6 ? '#2a1408' : '#6a3c1a');
        }
        P(x + 9, y + 8, '#ffd84a'); P(x + 9, y + 9, '#c89a18');
        rect(x - 2, wallBot - 1, 16, 1, '#7a7a8c');
      }
      // a Viking round shield hangs by the door on wider houses
      if (tw >= 5) {
        const sx = 4 + (tw - 1) * T - 2, sy = wallTop + 4;
        for (let yy = -4; yy <= 4; yy++) for (let xx = -4; xx <= 4; xx++) { const d = xx * xx + yy * yy; if (d <= 16) P(sx + xx, sy + yy, d >= 12 ? OUTLINE : d <= 2 ? '#ffd84a' : (xx + yy) % 3 === 0 ? '#801818' : '#b03028'); }
      }
    }
    // ---- roof ----
    const roofTop = oy, roofBot = oy + roofH;
    for (let y = roofTop; y < roofBot; y++) {
      const inset = Math.max(0, 3 - Math.floor((y - roofTop) / 2));   // slight taper at the ridge
      for (let x = inset; x < W - inset; x++) {
        if (stall) {
          const stripe = Math.floor(x / 6) % 2;
          P(x, y, y < roofTop + 3 ? '#7a2018' : stripe ? '#f4ecd8' : '#c8302a');
          continue;
        }
        const row = Math.floor((y - roofTop) / 4), xx = (x + (row % 2) * 3) % 6, yy = (y - roofTop) % 4;
        const edge = yy === 3 || (yy === 2 && (xx === 0 || xx === 5));
        const light = 1 - (y - roofTop) / roofH;          // top of the roof faces the sun
        let c = edge ? '#6a1a12' : light > 0.66 ? '#e8644a' : light > 0.33 ? '#c84030' : '#a03024';
        if (!edge && yy === 0 && light > 0.33) c = '#f08a6a';
        P(x, y, c);
      }
    }
    if (stall) {
      // scalloped awning edge
      for (let x = 0; x < W; x++) { const s = Math.floor(x / 6) % 2; const d = 2 + Math.round(Math.sin((x % 6) / 6 * Math.PI) * 2); for (let k = 0; k < d; k++) P(x, roofBot + k, s ? '#f4ecd8' : '#c8302a'); P(x, roofBot + d, OUTLINE); }
    } else {
      // ridge cap and crossed gable beams (dragon-head ends)
      rect(2, roofTop, W - 4, 3, '#5a1810'); rect(2, roofTop, W - 4, 1, '#8a2a20');
      for (const [x, dir] of [[3, -1], [W - 4, 1]]) for (let k = 0; k < 6; k++) { P(x + dir * k * 0.6, roofTop - k, '#7a4a22'); P(x + dir * k * 0.6 + 1, roofTop - k, '#5a3418'); }
      // eave shadow on the wall
      rect(4, roofBot, W - 8, 3, '#000000', 90);
      // chimney
      if (tw >= 4) {
        const cx = W - 16, cy = roofTop - 6;
        rect(cx - 1, cy - 1, 10, 14, OUTLINE);
        for (let y = 0; y < 12; y++) for (let x = 0; x < 8; x++) P(cx + x, cy + y, (y % 4 === 3 || (x + (Math.floor(y / 4) % 2) * 4) % 8 === 0) ? '#5a5a6a' : x < 3 ? '#a8a8b8' : '#8a8a9a');
        rect(cx - 1, cy - 2, 10, 2, '#6a6a7a');
        h.chimney = { x: cx + 4, y: cy - 3 };
      }
    }
    // outline the roof silhouette
    for (let x = 0; x < W; x++) P(x, roofTop - 1, OUTLINE);
    for (let y = roofTop; y < roofBot; y++) { const inset = Math.max(0, 3 - Math.floor((y - roofTop) / 2)); P(inset - 1, y, OUTLINE); P(W - inset, y, OUTLINE); }
    if (!stall) for (let x = 0; x < W; x++) P(x, roofBot, OUTLINE);
    for (let y = wallTop; y < wallBot; y++) { P(3, y, OUTLINE); P(W - 4, y, OUTLINE); }
  });
}

// ---------------- find the shapes in a map ----------------
const BIG_CACHE = new Map();
function computeBigs() {
  G.bigs = []; G.claim = new Map(); G.canopy = new Set();
  if (G.map.dungeon || G.map.arena || G.mapId === 'home') return;
  const key = (x, y) => y * G.cols + x;
  // trees: pack 2x2 blocks of 'T' within a screen, scanning top-left first
  for (let ty = 0; ty < G.nrows - 1; ty++) for (let tx = 0; tx < G.cols - 1; tx++) {
    const cells = [[tx, ty], [tx + 1, ty], [tx, ty + 1], [tx + 1, ty + 1]];
    if (!cells.every(([x, y]) => G.rows[y][x] === 'T' && !G.claim.has(key(x, y)))) continue;
    const snowy = SNOWY(tx, ty), v = hash(tx, ty) % 3;
    for (const [x, y] of cells) G.claim.set(key(x, y), snowy ? 'n' : '.');
    // the canopy row is walkable when open ground lies above it: Owen walks behind the tree
    for (const x of [tx, tx + 1]) {
      const above = ty > 0 ? G.rows[ty - 1][x] : 'T';
      if (ty % SH !== 0 && !SOLID.has(above) && above !== '~' && above !== 'w') G.canopy.add(key(x, ty));
    }
    const ck = 'tree' + v + (snowy ? 's' : '');
    if (!BIG_CACHE.has(ck)) BIG_CACHE.set(ck, treeImage(v, snowy));
    G.bigs.push({ kind: 'tree', img: BIG_CACHE.get(ck), x: tx * T - 2, y: ty * T + 2 * T - BIG_TREE_H, sortY: ty * T + 2 * T - 2, tx, ty, w: 2, h: 2 });
  }
  // buildings: connected roof/wall/door tiles
  const seen = new Set();
  for (let ty = 0; ty < G.nrows; ty++) for (let tx = 0; tx < G.cols; tx++) {
    if (!'RHD'.includes(G.rows[ty][tx]) || seen.has(key(tx, ty))) continue;
    const q = [[tx, ty]], cells = [];
    seen.add(key(tx, ty));
    while (q.length) {
      const [x, y] = q.pop(); cells.push([x, y]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= G.cols || ny >= G.nrows || seen.has(key(nx, ny)) || !'RHD'.includes(G.rows[ny][nx])) continue;
        seen.add(key(nx, ny)); q.push([nx, ny]);
      }
    }
    const xs = cells.map(c => c[0]), ys = cells.map(c => c[1]);
    const h = { kind: 'house', x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), doors: [] };
    h.roofEnd = Math.max(...cells.filter(([x, y]) => G.rows[y][x] === 'R').map(c => c[1]), h.y0);
    for (const [x, y] of cells) { if (G.rows[y][x] === 'D') h.doors.push(x); G.claim.set(key(x, y), '.'); }
    h.img = houseImage(h);
    h.x = h.x0 * T - 4; h.y = h.y0 * T - 12; h.sortY = (h.y1 + 1) * T - 1;
    G.bigs.push(h);
  }
}

function claimedGround(tx, ty) { return G.claim ? G.claim.get(ty * G.cols + tx) : undefined; }
function isCanopy(tx, ty) { return !!(G.canopy && G.canopy.has(ty * G.cols + tx)); }

function bigDrawList() {
  const out = [], p = G.player;
  for (const b of G.bigs || []) {
    const sx = b.x - G.cam.x, sy = b.y - G.cam.y;
    if (sx > VW || sy > VH || sx + b.img.width < 0 || sy + b.img.height < 0) continue;
    out.push({ y: b.sortY, f: () => {
      // a little see-through when Owen is hidden behind it, so kids never lose him
      const behind = p.y < b.sortY && p.x > b.x + 2 && p.x < b.x + b.img.width - 2 && p.y > b.y + 4;
      ctx.globalAlpha = behind ? 0.72 : 1;
      ctx.drawImage(b.img, Math.round(sx), Math.round(sy));
      ctx.globalAlpha = 1;
      if (b.chimney) {
        for (let i = 0; i < 3; i++) {
          const k = ((G.t * 0.6 + i / 3) % 1), x = sx + b.chimney.x + Math.sin(k * 6 + i) * 2 + k * 6, y = sy + b.chimney.y - k * 18;
          ctx.globalAlpha = 0.55 * (1 - k); ctx.fillStyle = '#e8e8f0'; ctx.beginPath(); ctx.arc(Math.round(x), Math.round(y), 2 + k * 3, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        }
      }
    } });
  }
  return out;
}
