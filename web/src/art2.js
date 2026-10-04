// Second art pass: the tiles and objects that were still drawn as plain rectangles.
// Dungeon doors, shutters, peg gates and braziers; cave mouths and rune doors; lava;
// Owen's bedroom; Valhalla Arena; the Flight 364 airliner; and outlined item icons.

const TILE_B = 'tLKhGEXlFZYQrdaVkpCg<>';

function renderTileB(c, v, frame, extra, tx, ty, snowy) {
  const r = rng(v * 4513 + c.charCodeAt(0) * 37 + frame);
  const nb = (dx, dy) => tile(tx + dx, ty + dy);
  return makeTile((P) => {
    const fill = (col) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) P(x, y, col); };
    const rect = (x, y, w, h, col, a) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) P(xx, yy, col, a); };
    const slab = () => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const lx = x % 8, ly = y % 8; P(x, y, lx === 0 || ly === 0 ? '#7888b8' : lx === 7 || ly === 7 ? '#48548a' : '#6070a0'); } };
    const wallTop = () => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) P(x, y, (x + y * 3) % 7 === 0 ? '#222c48' : '#2a3656'); };
    const cliff = () => {
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const band = (y + Math.floor((x + v * 3) / 6) * 2) % 6; P(x, y, band === 0 ? '#c09868' : band === 1 ? '#5a3c22' : band === 2 ? '#7a5634' : '#94704a'); }
    };
    switch (c) {
      case 't': {   // stone brazier with a living flame
        slab();
        rect(5, 10, 6, 6, '#5a5a6c'); rect(5, 10, 2, 6, '#7a7a8c'); rect(4, 15, 8, 1, OUTLINE);
        rect(3, 8, 10, 3, '#3a3a4a'); rect(3, 8, 10, 1, '#6a6a7c'); rect(2, 8, 1, 3, OUTLINE); rect(13, 8, 1, 3, OUTLINE);
        const f = frame % 4, sway = [0, 1, 0, -1][f];
        const flame = [[8 + sway, 1], [7, 2], [9 + sway, 2], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [11, 7]];
        for (const [x, y] of flame) P(x + (y < 4 ? sway : 0), y + (f === 2 ? 1 : 0), y < 3 ? '#ff6a1a' : y < 5 ? '#ff9a2a' : '#ffc040');
        for (const [x, y] of [[8, 5], [7, 6], [8, 6], [9, 6], [8, 7]]) P(x, y, '#fff2a0');
        if (f % 2) P(4 + (frame * 3) % 8, 0, '#ffd040');
        break; }
      case 'L': case 'K': {   // wooden door in the wall: small-key lock, or the ornate boss door
        wallTop();
        const boss = c === 'K';
        rect(1, 1, 14, 15, boss ? '#c9a227' : '#7888b8'); rect(0, 0, 16, 1, OUTLINE);
        rect(2, 2, 12, 14, boss ? '#5a2a6a' : '#7a4a22');
        for (let x = 2; x < 14; x += 3) rect(x, 2, 1, 14, boss ? '#3a1848' : '#5a3418');
        rect(2, 5, 12, 1, '#3a3a4a'); rect(2, 12, 12, 1, '#3a3a4a');
        if (boss) {
          rect(4, 6, 8, 7, '#ffd84a'); rect(5, 3, 6, 4, '#c9a227'); rect(6, 4, 4, 3, '#5a2a6a'); rect(4, 6, 8, 1, '#fff2a0');
          rect(7, 8, 2, 2, OUTLINE); rect(7, 10, 2, 2, OUTLINE); rect(3, 6, 1, 7, OUTLINE); rect(12, 6, 1, 7, OUTLINE);
        } else {
          rect(6, 7, 4, 5, '#ffd84a'); rect(6, 7, 4, 1, '#fff2a0'); rect(7, 8, 2, 2, OUTLINE); rect(7, 10, 1, 1, OUTLINE);
        }
        break; }
      case 'h':     // shutter: iron bars when closed, plain floor when open
        if (extra === 'o') { slab(); break; }
        wallTop(); rect(0, 0, 16, 2, '#7888b8');
        for (let x = 1; x < 16; x += 4) { rect(x, 2, 2, 14, '#9aa0b4'); rect(x, 2, 1, 14, '#d0d4e0'); rect(x + 2, 2, 1, 14, '#141a2c'); }
        rect(0, 8, 16, 2, '#6a7088'); rect(0, 8, 16, 1, '#b0b6c8');
        break;
      case 'G':     // A Link to the Past peg block: up = solid orange block, down = flat outline
        slab();
        if (extra === 'u') {
          rect(1, 1, 14, 14, OUTLINE); rect(2, 2, 12, 9, '#f08a2a'); rect(2, 2, 12, 2, '#ffc070'); rect(2, 11, 12, 3, '#9c4f0d');
          rect(5, 4, 6, 5, '#e07b1a'); rect(6, 5, 4, 3, '#ffb15c');
        } else { rect(2, 2, 12, 12, '#cf6f12'); rect(3, 3, 10, 10, '#6070a0'); rect(3, 3, 10, 1, '#48548a'); }
        break;
      case 'E': {   // cave mouth in the cliff
        cliff();
        for (let y = 2; y < 16; y++) for (let x = 1; x < 15; x++) {
          const arch = y >= 6 || (x - 7.5) * (x - 7.5) / 42 + (y - 6) * (y - 6) / 16 <= 1;
          if (arch) P(x, y, y < 8 ? '#120c08' : '#050403');
        }
        for (const [x, y] of [[2, 6], [13, 6], [3, 4], [12, 4], [5, 2], [10, 2]]) P(x, y, '#c09868');
        if (snowy) for (const x of [3, 6, 9, 12]) { P(x, 4, '#ffffff'); P(x, 5, '#d8eef8'); P(x, 6, '#bfe0f0'); }
        break; }
      case 'X': {   // stone door sealed by a glowing rune
        cliff();
        rect(1, 1, 14, 15, OUTLINE); rect(2, 2, 12, 14, '#7c7c8c'); rect(2, 2, 12, 2, '#a0a0b0'); rect(3, 4, 10, 11, '#6a6a7a');
        rect(3, 4, 10, 1, '#5a5a6a'); rect(3, 14, 10, 1, '#8a8a9a');
        const glow = ['#5ab8ff', '#7fd4ff', '#bfeaff', '#7fd4ff'][frame % 4];
        for (const [x, y] of [[8, 5], [8, 6], [8, 7], [8, 8], [8, 9], [8, 10], [8, 11], [8, 12], [6, 6], [7, 7], [10, 6], [9, 7], [6, 11], [7, 10], [10, 11], [9, 10]]) P(x - 0.5, y, glow);
        break; }
      case 'l': {   // lava: churning swirls and popping bubbles
        fill('#c8380c');
        for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const w = Math.sin((x + frame * 1.5) * 0.7 + y * 0.9 + v) + Math.sin(y * 0.5 - frame); if (w > 1.1) P(x, y, '#ff7a1a'); else if (w > 0.6) P(x, y, '#ea5a12'); }
        const bx = (v * 5 + 3) % 12 + 2, by = (v * 7 + 4) % 10 + 3;
        if (frame % 4 < 2) { P(bx, by, '#ffd040'); P(bx + 1, by, '#ffd040'); P(bx, by - 1, '#fff2a0'); } else { P(bx, by, '#ff9a2a'); P(bx - 1, by + 1, '#ffd040'); P(bx + 2, by + 1, '#ffd040'); }
        break; }
      case 'F':     // wooden floorboards
        for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const board = Math.floor(y / 4), seam = y % 4 === 3, joint = (x + board * 5 + v * 3) % 16 === 0; P(x, y, seam || joint ? '#6e4420' : board % 2 ? '#b07840' : '#a26c38'); }
        P((v * 5 + 2) % 16, 1, '#d09858'); P((v * 3 + 9) % 16, 9, '#d09858');
        break;
      case 'Z': {
        if (ty === 0) {   // back wall: wallpaper, wainscot, windows
          for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) P(x, y, x % 4 === 0 ? '#a8bce0' : '#c4d4f0');
          rect(0, 11, 16, 5, '#8a5a2e'); rect(0, 11, 16, 1, '#c08a50'); rect(0, 15, 16, 1, '#4a2a12');
          if (tx % 5 === 2) { rect(3, 2, 10, 8, OUTLINE); rect(4, 3, 8, 6, '#7fc4ff'); rect(4, 3, 8, 2, '#bfe4ff'); rect(7, 3, 2, 6, '#e8e0d0'); rect(4, 5, 8, 1, '#e8e0d0'); }
        } else { fill('#4a2e18'); for (let y = 0; y < T; y += 4) rect(0, y, 16, 1, '#3a2212'); rect(0, 0, 16, 1, '#6a4428'); }
        break; }
      case 'Y': {   // bed: headboard and pillow on top, quilt below
        for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) P(x, y, '#a26c38');
        const top = nb(0, -1) !== 'Y', left = nb(-1, 0) !== 'Y', right = nb(1, 0) !== 'Y';
        const x0 = left ? 1 : 0, x1 = right ? 15 : 16;
        if (top) { rect(x0, 0, x1 - x0, 4, '#6a3c1a'); rect(x0, 0, x1 - x0, 1, '#9a6030'); rect(x0 + 1, 5, x1 - x0 - 2, 6, '#f4f4f8'); rect(x0 + 1, 10, x1 - x0 - 2, 1, '#c8c8d8'); rect(x0, 12, x1 - x0, 4, '#2f5aa8'); rect(x0, 12, x1 - x0, 1, '#5a88e0'); }
        else { for (let y = 0; y < 15; y++) for (let x = x0; x < x1; x++) P(x, y, ((x >> 2) + (y >> 2)) % 2 ? '#2f5aa8' : '#3e6cc8'); rect(x0, 14, x1 - x0, 2, '#1e3a78'); }
        if (left) rect(0, 0, 1, 16, OUTLINE); if (right) rect(15, 0, 1, 16, OUTLINE);
        break; }
      case 'Q': {   // table: a desk indoors, a market counter outside
        if (G.map.interior) fill('#a26c38'); else fill(nb(0, 1) === 's' || nb(-1, 0) === 's' ? '#d8c078' : COL.grass);
        rect(0, 3, 16, 9, OUTLINE); rect(0, 4, 16, 7, '#b07840'); rect(0, 4, 16, 2, '#d09858'); rect(0, 10, 16, 1, '#6e4420');
        rect(1, 12, 2, 4, '#6e4420'); rect(13, 12, 2, 4, '#6e4420');
        if (G.map.interior && v % 2 === 0) { rect(3, 1, 4, 5, '#2f5aa8'); rect(3, 1, 4, 1, '#fff'); rect(9, 2, 5, 3, '#e8e0d0'); }
        break; }
      case 'r': {   // patterned rug with a gold border
        fill('#a8302a');
        for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if ((x + y) % 6 === 0 || (x - y + 18) % 6 === 0) P(x, y, '#c8503a');
        if (nb(0, -1) !== 'r') rect(0, 0, 16, 2, '#ffd84a'); if (nb(0, 1) !== 'r') rect(0, 14, 16, 2, '#ffd84a');
        if (nb(-1, 0) !== 'r') rect(0, 0, 2, 16, '#ffd84a'); if (nb(1, 0) !== 'r') rect(14, 0, 2, 16, '#ffd84a');
        break; }
      case 'd': fill('#2a1a10'); rect(1, 0, 14, 16, '#3a2414'); rect(2, 10, 12, 6, '#7a2a24'); rect(2, 10, 12, 1, '#a84a3a'); break;
      case 'a': {   // sandstone arena flags
        fill('#9a8660');
        const off = (ty % 2) * 8;
        for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { if (y % 8 === 0 || (x + off) % 16 === 0) P(x, y, '#6e5e40'); else if (y % 8 === 1 || (x + off) % 16 === 1) P(x, y, '#b4a074'); }
        if (v === 1) { P(5, 4, '#6e5e40'); P(6, 5, '#6e5e40'); P(6, 6, '#6e5e40'); }
        if (v === 3) { P(11, 12, '#857350'); P(12, 12, '#857350'); }
        break; }
      case 'V': {   // arena walls: gold-banded stone, red banners along the top
        const face = nb(0, 1) === 'a' || nb(0, 1) === '#';
        for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const row = y >> 2, bx = (x + (row % 2) * 4) % 8; P(x, y, y % 4 === 3 || bx === 0 ? '#3a2e1e' : face ? '#6a5638' : '#4a3c26'); }
        if (face) {
          rect(0, 6, 16, 2, '#c9a227'); rect(0, 6, 16, 1, '#ffe066'); rect(0, 15, 16, 1, '#1e160c');
          if (tx % 4 === 0 && ty <= 1) { rect(4, 0, 8, 13, '#b33a2e'); rect(4, 0, 8, 1, '#ffd84a'); rect(5, 13, 2, 2, '#b33a2e'); rect(9, 13, 2, 2, '#b33a2e'); rect(7, 3, 2, 7, '#ffd84a'); rect(6, 4, 4, 2, '#ffd84a'); }
        }
        break; }
      case 'k': {   // bookshelf against the wall
        fill('#4a2e18'); rect(1, 1, 14, 15, '#6e4420'); rect(1, 1, 14, 1, '#9a6030');
        for (const sy of [2, 7, 12]) { rect(2, sy + 4, 12, 1, '#3a2212'); for (let x = 2; x < 14; x += 2) rect(x, sy + (x * 7 + v) % 2, 2, 4 - (x * 7 + v) % 2, ['#b03028', '#2f5aa8', '#3a7a4a', '#c89a18', '#7a4a9a'][(x + sy + v) % 5]); }
        rect(0, 0, 1, 16, OUTLINE); rect(15, 0, 1, 16, OUTLINE);
        break; }
      case 'p': {   // stone fireplace with a crackling fire
        fill('#4a2e18'); rect(0, 0, 16, 16, '#7a7a8c');
        for (let y = 0; y < 16; y += 4) for (let x = (y / 4 % 2) * 4; x < 16; x += 8) rect(x, y, 1, 4, '#5a5a6a');
        for (let y = 0; y < 16; y += 4) rect(0, y, 16, 1, '#5a5a6a');
        rect(2, 6, 12, 10, '#1a0c06');
        const f = frame % 4;
        for (let x = 3; x < 13; x++) { const hgt = 3 + ((x * 5 + f * 3) % 5); for (let y = 15 - hgt; y < 15; y++) P(x, y, y < 15 - hgt + 1 ? '#ff6a1a' : y < 13 ? '#ff9a2a' : '#ffd040'); }
        rect(3, 14, 10, 2, '#5a3418'); rect(0, 5, 16, 1, '#9a9aac');
        break; }
      case 'C': {   // cave rock; a lit face where it meets the floor
        const face = nb(0, 1) === 'g' || nb(0, 1) === '<' || nb(0, 1) === 'O';
        for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const n = (x * 7 + y * 13 + v * 5) % 11; P(x, y, n < 2 ? '#4a3a2c' : n < 6 ? '#76604a' : '#66523e'); }
        const open = ch => ch === 'g' || ch === '<' || ch === 'O';
        if (open(nb(0, -1))) rect(0, 0, 16, 2, '#9a8264');
        if (open(nb(-1, 0))) rect(0, 0, 1, 16, OUTLINE);
        if (open(nb(1, 0))) rect(15, 0, 1, 16, OUTLINE);
        if (face) { for (let y = 8; y < 16; y++) for (let x = 0; x < T; x++) P(x, y, y < 10 ? '#7a6248' : (x + y) % 5 === 0 ? '#4a3a2c' : '#5e4a36'); rect(0, 15, 16, 1, '#1a120c'); }
        break; }
      case 'g': fill('#2c2018'); for (let i = 0; i < 6; i++) P((v * 5 + i * 7) % 16, (v * 3 + i * 5) % 16, i % 2 ? '#4e3e30' : '#2a2018'); break;
      case '>': {   // stairs going down, cut into the ground where the grave stood
        fill(COL.grass); rect(1, 1, 14, 14, OUTLINE);
        for (let k = 0; k < 5; k++) rect(2 + k, 2 + k * 2, 12 - k * 2, 2, ['#8a8a9c', '#6a6a7c', '#4a4a5c', '#2a2a3a', '#14141e'][k]);
        rect(2, 12, 12, 2, '#05050a');
        break; }
      case '<': {   // stairs going up out of the cave
        fill('#3a2c22');
        for (let k = 0; k < 6; k++) rect(2, 2 + k * 2, 12, 2, k % 2 ? '#6a5a48' : '#8a7a64');
        rect(1, 1, 1, 13, OUTLINE); rect(14, 1, 1, 13, OUTLINE); rect(2, 0, 12, 2, '#c8d8a8');
        break; }
      default: return;
    }
  });
}

function drawTileB(c, ox, oy, tx, ty) {
  if (!TILE_B.includes(c)) return false;
  const v = hash(tx, ty) % 4, snowy = SNOWY(tx, ty);
  const frame = c === 't' || c === 'p' ? Math.floor(G.t * 9) % 4 : c === 'l' ? Math.floor(G.t * 4) % 8 : c === 'X' ? Math.floor(G.t * 3) % 4 : 0;
  const extra = c === 'h' ? (shutterClosed(tx, ty) ? 'c' : 'o') : c === 'G' ? (gatesDown() ? 'd' : 'u') : '';
  const nbKey = 'YrVZQCk'.includes(c) ? [tile(tx, ty - 1), tile(tx, ty + 1), tile(tx - 1, ty), tile(tx + 1, ty)].join('') + (ty === 0 ? 't' : '') + (tx % 5) + (tx % 4) + G.mapId : '';
  const key = `B${c}|${v}|${frame}|${extra}|${snowy ? 1 : 0}|${nbKey}`;
  let img = TILE_CACHE.get(key);
  if (img === undefined) { img = renderTileB(c, v, frame, extra, tx, ty, snowy); TILE_CACHE.set(key, img); }
  ctx.drawImage(img, ox, oy);
  return true;
}

// ---------------- Flight 364 on the airstrip ----------------
function planeImage(h) {
  const W = (h.x1 - h.x0 + 1) * T + 12, H = (h.y1 - h.y0 + 1) * T + 16;
  const fx0 = 6, fx1 = W - 6, fy0 = (h.fy0 - h.y0) * T + 8 + 2, fy1 = (h.fy1 - h.y0 + 1) * T + 8 - 2;
  const mid = (fy0 + fy1) / 2, rad = (fy1 - fy0) / 2;
  return makeImg(W, H, (P, has) => {
    const rect = (x, y, w, hh, c, a) => { for (let yy = y; yy < y + hh; yy++) for (let xx = x; xx < x + w; xx++) P(xx, yy, c, a); };
    // shadow on the ground
    for (let y = fy1 + 2; y < fy1 + 8; y++) for (let x = fx0 + 10; x < fx1; x++) P(x, y, '#000000', 50);
    // wings (swept back) with engines, top and bottom
    const wx = (h.wingX - h.x0) * T + 6;
    for (const dir of [-1, 1]) {
      for (let k = 0; k < 22; k++) {
        const y = dir < 0 ? fy0 - 1 - k : fy1 + k, x0 = wx + Math.round(k * 0.8), x1 = x0 + 26 - Math.round(k * 0.5);
        if (y < 0 || y >= H) continue;
        for (let x = x0; x < x1; x++) P(x, y, k > 18 ? '#9aa2ae' : x < x0 + 2 ? '#e8ecf2' : '#c4cad4');
        P(x0 - 1, y, OUTLINE); P(x1, y, OUTLINE);
      }
      const ey = dir < 0 ? fy0 - 12 : fy1 + 6;
      rect(wx + 6, ey, 12, 6, '#7a808c'); rect(wx + 6, ey, 12, 2, '#a8aeba'); rect(wx + 5, ey + 1, 2, 4, '#20242c'); rect(wx + 5, ey - 1, 14, 1, OUTLINE); rect(wx + 5, ey + 6, 14, 1, OUTLINE);
    }
    // tail stabilizers and the red fin
    for (const dir of [-1, 1]) for (let k = 0; k < 9; k++) { const y = dir < 0 ? fy0 - 1 - k : fy1 + k; for (let x = fx1 - 22 + k; x < fx1 - 8; x++) P(x, y, '#c4cad4'); P(fx1 - 23 + k, y, OUTLINE); }
    // fuselage: a long capsule, white on top shading to grey
    for (let y = fy0; y <= fy1; y++) for (let x = fx0; x <= fx1; x++) {
      const dy = (y - mid) / rad;
      const capL = x < fx0 + rad * 1.6 ? Math.pow((x - (fx0 + rad * 1.6)) / (rad * 1.6), 2) + dy * dy > 1 : false;
      const capR = x > fx1 - rad * 0.8 ? Math.pow((x - (fx1 - rad * 0.8)) / (rad * 0.8), 2) + dy * dy > 1 : false;
      if (capL || capR) continue;
      P(x, y, dy < -0.6 ? '#ffffff' : dy < 0.2 ? '#eef0f4' : dy < 0.65 ? '#cfd4dc' : '#a8aeb8');
    }
    for (let x = fx0 + 6; x < fx1 - 4; x++) { if (has(x, Math.round(mid) + 2)) P(x, Math.round(mid) + 2, '#c0392b'); if (has(x, Math.round(mid) + 3)) P(x, Math.round(mid) + 3, '#2a4a8a'); }
    for (let x = fx0 + 20; x < fx1 - 18; x += 6) { P(x, Math.round(mid) - 3, '#3a5a8a'); P(x + 1, Math.round(mid) - 3, '#3a5a8a'); P(x, Math.round(mid) - 2, '#5a7aaa'); }
    for (const [x, y] of [[fx0 + 4, mid - 3], [fx0 + 5, mid - 3], [fx0 + 7, mid - 4], [fx0 + 8, mid - 4], [fx0 + 10, mid - 4]]) P(x, y, '#1a2a4a');
    for (let y = fy0 - 10; y < fy0 + 2; y++) for (let x = fx1 - 14 + (fy0 - y) / 2; x < fx1 - 4; x++) P(x, y, y < fy0 - 7 ? '#e05040' : '#c0392b');
    // outline the hull
    const edge = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!has(x, y) && (has(x + 1, y) || has(x - 1, y) || has(x, y + 1) || has(x, y - 1))) edge.push([x, y]);
    for (const [x, y] of edge) P(x, y, OUTLINE);
  });
}

// ---------------- item icons ----------------
const ICONS = {
  key: [['..ggg...', '.gG.Gg..', '.g...g..', '.gG.Gg..', '..ggg...', '...g....', '...g....', '...gg...', '...g....', '...ggg..', '...g....'], { g: '#ffd84a', G: '#c89a18' }],
  bigkey: [['..gggggg..', '.gGGrrGGg.', '.gG.rr.Gg.', '.gGGGGGGg.', '..gggggg..', '....gg....', '....gg....', '....gggg..', '....gg....', '....gggg..', '....gg....', '....gggg..'], { g: '#ffd84a', G: '#c89a18', r: '#e02838' }],
  juice: [['..ccc...', '..www...', '..w.w...', '.wwwww..', 'wrrrrrw.', 'wrLrrrw.', 'wrLrrrw.', 'wrrrrrw.', 'wRRRRRw.', '.wwwww..'], { c: '#a0703c', w: '#d8e8f0', r: '#c0182b', R: '#801020', L: '#ff8090' }],
  shard: [['...l...', '..lLb..', '.lLbbb.', '.lLbbB.', 'lLbbbBB', '.lbbbB.', '.lbbBB.', '..bBB..', '...B...'], { l: '#ffffff', L: '#cfefff', b: '#7fd4ff', B: '#3a8ac8' }],
  heart: [['.rr...rr.', 'rLrr.rrrr', 'rLrrrrrrr', 'rrrrrrrrr', '.rrrrrrr.', '..rrrrr..', '...rrr...', '....r....'], { r: '#f02838', L: '#ffa0a8' }],
  coin: [['.sss.', 'sllSs', 'slsSs', 'slsSs', 'slsSs', 'sSSSs', '.sss.'], { s: '#a8b0c0', l: '#f0f4fa', S: '#7a8494' }],
  gold: [['.sss.', 'sllSs', 'slsSs', 'slsSs', 'slsSs', 'sSSSs', '.sss.'], { s: '#d8a820', l: '#fff2a0', S: '#a87a10' }],
  thunder: [['..ssssss..', '.sSSSSSSs.', 'sSSSSySSSs', 'sSSSyySSSs', 'sSSyySSSSs', 'sSyyyyySSs', 'sSSSSyySSs', 'sSSSyySSSs', 'sSSSySSSSs', '.sSSSSSSs.', '..ssssss..'], { s: '#5a5a6a', S: '#8a8a9c', y: '#ffe066' }],
  horn: [['........hh..', '......hhHh..', '....hhhHh...', '..hhhhHh....', 'bbhhhHh.....', 'bbbhHh......', '.bb.........'], { h: '#e8dcc0', H: '#b8a888', b: '#8a2a1a' }],
  dash: [['..vvvv.....', '.vVVVVv....', 'vVVvvVVv...', '.vv..vVVv..', '......vVVvv', '.......vVVv', '........vv.'], { v: '#9a4dd9', V: '#d8a8ff' }],
  sheet: [['wwwwwwww', 'wkkkkkkw', 'wwwwwwww', 'wk.kk.kw', 'wwwwwwww', 'wkk.kkkw', 'wwwwwwww', 'wk.k.kkw', 'wwwwwwww'], { w: '#f4ecd0', k: '#3a2a1a' }],
  ship: [['....r.....', '....rr....', '....rrr...', '....r.....', 'bbbbbbbbbb', '.bBBBBBBb.', '..bbbbbb..'], { r: '#e02838', b: '#8a5428', B: '#c08040' }],
};
function buildIcons() {
  for (const k in ICONS) SPR['icon_' + k] = buildSprite(ICONS[k][0], ICONS[k][1]);
  const piece = ICONS.heart[0].map((row, y) => [...row].map((ch, x) => ch === '.' ? '.' : (x < 5 && y < 4) ? ch : 'd').join(''));
  SPR.icon_piece = buildSprite(piece, { r: '#f02838', L: '#ffa0a8', d: '#5a2028' });
  const cont = Array.from({ length: 12 }, (_, y) => Array.from({ length: 13 }, (_, x) => (x === 0 || y === 0 || x === 12 || y === 11) ? 'g' : (x === 1 || y === 1 || x === 11 || y === 10) ? 'G' : 'k').join(''));
  ICONS.heart[0].forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') cont[y + 2] = cont[y + 2].slice(0, x + 2) + ch + cont[y + 2].slice(x + 3); }));
  SPR.icon_container = buildSprite(cont, { g: '#ffd84a', G: '#c89a18', k: '#1a2238', r: '#f02838', L: '#ffa0a8' });
}
function drawIconSpr(name, x, y) {
  const img = SPR['icon_' + name];
  if (!img) return false;
  ctx.drawImage(img, Math.round(x - img.width / 2), Math.round(y - img.height / 2));
  return true;
}
