// Game state, maps, tiles, collision and screen-by-screen camera (like A Link to the Past).
const G = {
  state: 'title', t: 0, mode: 'story', st: null,
  save: null,                 // persistent progress (see newSave)
  mapId: '', map: null, rows: null, cols: 0, nrows: 0,
  scr: { x: 0, y: 0 }, cam: { x: 0, y: 0 }, trans: null,
  ents: [], fx: [], pending: [], roomEnemies: false,
  player: null, jon: null,
  talk: null, banner: '', bannerT: 0, shake: 0, flash: 0,
  entry: { x: 0, y: 0 },
};

function newSave() {
  return { map: 'home', x: 0, y: 0, maxHp: 6, hp: 6, kr: 0, rune: 0, potions: 0, pieces: 0,
    items: {}, flags: {}, keys: {}, bigkeys: {}, voodoo: true };
}
const SAVE_KEY = 'jontuka-save-v1';
// Stats Owen carries. Story mode uses the defaults; the Arena upgrades them.
function baseStats() { return { dmg: 1, speed: 1, atk: 1, range: 1, pickup: 28, armor: 0, regen: 0, crit: 0, knock: 1 }; }
G.st = baseStats();
function writeSave() {
  if (G.mode === 'arena') return;
  const s = G.save, p = G.player;
  if (p) { s.x = p.x; s.y = p.y; s.hp = p.hp; s.map = G.mapId; }
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { /* storage blocked: progress lives for this visit only */ }
}
function readSave() {
  try { const s = localStorage.getItem(SAVE_KEY); return s ? Object.assign(newSave(), JSON.parse(s)) : null; } catch (e) { return null; }
}
const flag = k => !!G.save.flags[k];
const setFlag = k => { G.save.flags[k] = true; };

// ---------- tiles ----------
const SOLID = new Set('T#MwHRDPqX+lWtOYQZxLKbV'.split(''));
function tile(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= G.cols || ty >= G.nrows) return G.map.dungeon ? 'W' : 'T';
  return G.rows[ty][tx];
}
const tileAt = (x, y) => tile(Math.floor(x / T), Math.floor(y / T));
function setTile(tx, ty, c) { G.rows[ty][tx] = c; }
function screenOf(x, y) { return { x: Math.floor(x / VW), y: Math.floor(y / VH) }; }
const sameScreen = (tx, ty) => (G.map && G.map.arena) || (Math.floor(tx / SW) === G.scr.x && Math.floor(ty / SH) === G.scr.y);
function shutterClosed(tx, ty) { return sameScreen(tx, ty) && G.roomEnemies && G.ents.some(e => e.enemy && e.alive); }
function gatesDown() { return flag(G.mapId + ':gates'); }

// who: 'player' | 'walker' | 'flyer' | 'jon'
function solidTile(tx, ty, who) {
  const c = tile(tx, ty);
  if (c === 'T' && isCanopy(tx, ty)) return false;   // walk behind big tree tops
  if (who === 'flyer') return c === 'W' || c === 'T' || c === 'M' || c === 'Z' || c === 'V';
  if (c === 'h') return shutterClosed(tx, ty);
  if (c === 'G') return !gatesDown();
  if (who === 'jon') return SOLID.has(c) && c !== 'b' && c !== 'O' && c !== 'x' && c !== 'w' && c !== 'Q';
  if (who === 'walker' && (c === 'v' || c === '~' || c === 'E')) return true;
  return SOLID.has(c);
}
function solidAt(x, y, who) { return solidTile(Math.floor(x / T), Math.floor(y / T), who); }
function blocked(x, y, r, who, self) {
  if (solidAt(x - r, y - r, who) || solidAt(x + r, y - r, who) || solidAt(x - r, y + r, who) || solidAt(x + r, y + r, who)) return true;
  // keep actors inside the current screen
  const sx = G.scr.x * VW, sy = G.scr.y * VH;
  if (who !== 'player' && !G.map.arena && (x - r < sx || x + r > sx + VW || y - r < sy || y + r > sy + VH)) return true;
  if (who === 'player' || who === 'walker') {
    for (const e of G.ents) if (e.solid && e !== self && Math.abs(e.x - x) < 7 + r && Math.abs(e.y - y) < 7 + r) return true;
  }
  return false;
}
function tryMove(n, mx, my, r, who) {
  let hitX = false, hitY = false;
  if (!blocked(n.x + mx, n.y, r, who, n)) n.x += mx; else hitX = mx !== 0;
  if (!blocked(n.x, n.y + my, r, who, n)) n.y += my; else hitY = my !== 0;
  return { hitX, hitY };
}

// ---------- maps and screens ----------
function loadMap(id, px, py) {
  G.mapId = id; G.map = MAPS[id];
  G.rows = G.map.rows.map(r => [...r]);
  G.nrows = G.rows.length; G.cols = G.rows[0].length;
  computeBigs();
  // reapply opened doors from the save
  for (const k in G.save.flags) {
    const m = k.match(/^open:(\w+):(\d+),(\d+)$/);
    if (m && m[1] === id) setTile(+m[2], +m[3], '_');
  }
  const p = G.player;
  p.x = px; p.y = py; p.vx = p.vy = p.kx = p.ky = 0; p.launching = false; p.falling = 0; p.hold = null;
  G.jon.x = px + 10; G.jon.y = py - 14; G.jon.mode = 'follow';
  G.scr = screenOf(px, py);
  G.trans = null;
  enterScreen();
}

function enterScreen() {
  G.cam = { x: G.scr.x * VW, y: G.scr.y * VH };
  G.entry = { x: G.player.x, y: G.player.y };
  G.ents = []; G.fx = []; G.pending = [];
  const key = `clear:${G.mapId}:${G.scr.x},${G.scr.y}`;
  const cleared = flag(key);
  for (const d of G.map.ents) {
    const [tx, ty] = d.at;
    if (!sameScreen(tx, ty)) continue;
    const e = makeEnt(d, tx * T + 8, ty * T + 8);
    if (!e) continue;
    if (e.enemy && G.map.dungeon && cleared) continue;
    if (d.clear && !cleared) { G.pending.push(e); continue; }
    G.ents.push(e);
  }
  G.roomEnemies = G.ents.some(e => e.enemy);
  if (G.map.dungeon && !G.roomEnemies && !cleared) setFlag(key);
  if (G.map.dungeon && cleared) G.ents.push(...G.pending.splice(0));
  onEnterScreen();
}

function checkRoomClear() {
  if (!G.roomEnemies || G.ents.some(e => e.enemy && e.alive)) return;
  G.roomEnemies = false;
  const key = `clear:${G.mapId}:${G.scr.x},${G.scr.y}`;
  if (G.map.dungeon) setFlag(key);
  if (G.pending.length) {
    for (const e of G.pending) { G.ents.push(e); puff(e.x, e.y, '#fff'); }
    G.pending = [];
    Sound.play('secret');
  } else if (G.map.dungeon) Sound.play('door');
}

// screen transitions: when Owen walks off the edge, slide the camera to the next screen
function checkScreenEdge() {
  if (G.map.arena) return;
  const p = G.player, s = screenOf(p.x, p.y);
  if (s.x === G.scr.x && s.y === G.scr.y) return;
  const dx = Math.sign(s.x - G.scr.x), dy = Math.sign(s.y - G.scr.y);
  G.trans = { from: { ...G.cam }, to: { x: s.x * VW, y: s.y * VH }, t: 0, dx, dy };
  G.ents = G.ents.filter(e => e.keep); G.fx = []; G.roomEnemies = false;
  G.scr = s;
}
function updateTransition(dt) {
  const tr = G.trans, p = G.player;
  tr.t += dt / 0.5;
  const k = Math.min(1, tr.t);
  G.cam.x = tr.from.x + (tr.to.x - tr.from.x) * k;
  G.cam.y = tr.from.y + (tr.to.y - tr.from.y) * k;
  p.x += tr.dx * 52 * dt; p.y += tr.dy * 52 * dt; p.walk += dt * 14;
  G.jon.x = p.x + 10; G.jon.y = p.y - 14;
  if (k >= 1) { G.trans = null; enterScreen(); }
}

// find the nearest dry, walkable tile (used when the lake spits Owen out)
function nearestDry(px, py) {
  const sx = Math.floor(px / T), sy = Math.floor(py / T);
  const seen = new Set([sx + ',' + sy]), q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift();
    const c = tile(x, y);
    if (c !== '~' && !solidTile(x, y, 'player') && c !== 'v' && sameScreen(x, y)) return { x: x * T + 8, y: y * T + 8 };
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = (x + dx) + ',' + (y + dy);
      if (!seen.has(k) && x + dx >= 0 && y + dy >= 0 && x + dx < G.cols && y + dy < G.nrows) { seen.add(k); q.push([x + dx, y + dy]); }
    }
  }
  return { ...G.entry };
}

// ---------- tile art ----------
const SNOWY = (tx, ty) => G.mapId === 'overworld' && Math.floor(ty / SH) === 0 && Math.floor(tx / SW) >= 2;
function groundColor(tx, ty) {
  if (G.map.dungeon) return '#5b6b8c';
  if (G.map.arena) return '#8a7a5a';
  if (G.mapId === 'home') return '#a8703c';
  return SNOWY(tx, ty) ? '#e8eef7' : '#549a3d';
}
function drawTile(c, ox, oy, tx, ty) {
  const h = hash(tx, ty), t = G.t;
  const ground = groundColor(tx, ty);
  switch (c) {
    case '.': R(ox, oy, T, T, '#549a3d'); if (h < 30) R(ox + h % 12 + 1, oy + (h * 7) % 12 + 1, 2, 3, '#40801d'); break;
    case 'f': R(ox, oy, T, T, '#549a3d');
      for (const [a, b] of [[3, 3], [10, 5], [5, 10], [12, 12]]) { R(ox + a, oy + b, 2, 2, h % 2 ? '#ffd84a' : '#ff8ab0'); R(ox + a, oy + b + 2, 1, 2, '#2f6b1a'); } break;
    case 's': R(ox, oy, T, T, SNOWY(tx, ty) ? '#c9d2e0' : '#dbc780'); if (h < 25) R(ox + h % 12 + 1, oy + (h * 5) % 12 + 1, 2, 1, SNOWY(tx, ty) ? '#aab4c8' : '#bda866'); break;
    case 'n': R(ox, oy, T, T, '#e8eef7'); if (h < 30) R(ox + h % 12 + 1, oy + (h * 3) % 12 + 1, 2, 1, '#c3cfe3'); break;
    case 'T': R(ox, oy, T, T, SNOWY(tx, ty) ? '#dfe7f2' : '#2f6b2a');
      R(ox + 2, oy + 1, 12, 10, SNOWY(tx, ty) ? '#2e5e4a' : '#1f7a33'); R(ox + 1, oy + 4, 14, 5, SNOWY(tx, ty) ? '#2e5e4a' : '#1f7a33');
      R(ox + 4, oy + 2, 5, 3, SNOWY(tx, ty) ? '#ffffff' : '#36a24a'); R(ox + 6, oy + 11, 4, 5, '#6b4322'); break;
    case 'b': R(ox, oy, T, T, '#549a3d'); R(ox + 2, oy + 3, 12, 11, '#1d5e22'); R(ox + 3, oy + 2, 10, 11, '#4fbf4a'); R(ox + 5, oy + 4, 3, 2, '#9be08a'); break;
    case '#': R(ox, oy, T, T, ground); R(ox + 1, oy + 3, 14, 12, '#77778a'); R(ox + 3, oy + 3, 8, 3, '#a9a9bb'); R(ox + 1, oy + 12, 14, 3, '#4c4c5c'); break;
    case 'M': R(ox, oy, T, T, '#7a5a3c'); R(ox, oy + (h % 3) * 4 + 2, T, 2, '#5c4128'); R(ox + (h % 10), oy, 2, T, '#8f6c4a'); break;
    case 'w': R(ox, oy, T, T, '#1d3f8a'); if ((Math.floor(t * 2) + tx + ty) % 3 === 0) R(ox + 3, oy + 6, 8, 1, '#3d66c4'); break;
    case '~': R(ox, oy, T, T, '#3366cc'); { const w = Math.floor(t * 2 + tx + ty) % 4; if (w === 0) R(ox + 3, oy + 5, 8, 1, '#73a6f2'); else if (w === 2) R(ox + 5, oy + 11, 7, 1, '#73a6f2'); } break;
    case 'U': R(ox, oy, T, T, '#1d3f8a'); R(ox, oy + 2, T, 12, '#9c6b3a'); for (let i = 0; i < 4; i++) R(ox + i * 4, oy + 2, 1, 12, '#6b4322'); break;
    case 'x': R(ox, oy, T, T, ground); R(ox, oy + 5, T, 2, '#8a5a2b'); R(ox, oy + 10, T, 2, '#8a5a2b'); R(ox + 2, oy + 3, 2, 11, '#6b4322'); R(ox + 12, oy + 3, 2, 11, '#6b4322'); break;
    case 'R': R(ox, oy, T, T, '#b33a2e'); R(ox, oy + 3 + (tx % 2) * 4, T, 2, '#8a2a21'); R(ox, oy + 11, T, 1, '#8a2a21'); break;
    case 'H': R(ox, oy, T, T, '#a8743f'); R(ox, oy + 5, T, 1, '#7a5229'); R(ox, oy + 10, T, 1, '#7a5229'); R(ox + 7, oy + 2, 2, 2, '#ffe9a3'); break;
    case 'D': R(ox, oy, T, T, '#a8743f'); R(ox + 3, oy + 2, 10, 14, '#4a2e17'); R(ox + 10, oy + 9, 2, 2, '#ffd84a'); break;
    case 'P': { const top = tile(tx, ty - 1) !== 'P';
      R(ox, oy, T, T, ground === '#549a3d' ? '#549a3d' : ground);
      R(ox, oy + (top ? 4 : 0), T, top ? 12 : 10, '#e9edf2'); R(ox, oy + (top ? 4 : 0), T, 1, '#c3cad4');
      if (top) { R(ox + 3, oy + 8, 3, 3, '#3a5a8a'); R(ox + 10, oy + 8, 3, 3, '#3a5a8a'); } else R(ox, oy + 2, T, 3, '#c0392b');
      if (tile(tx - 1, ty) !== 'P') { R(ox, oy, 4, T, '#549a3d'); R(ox + 2, oy + (top ? 6 : 0), 3, top ? 10 : 8, '#e9edf2'); }
      if (tile(tx + 1, ty) !== 'P' && top) R(ox + 8, oy - 6, 8, 10, '#c0392b');
      break; }
    case 'q': R(ox, oy, T, T, ground === '#549a3d' ? '#dbc780' : ground); R(ox, oy + 4, T, 8, '#b6bcc6'); R(ox, oy + 11, T, 1, '#8a909a'); break;
    case 'E': R(ox, oy, T, T, '#7a5a3c'); R(ox + 2, oy + 3, 12, 13, '#111'); R(ox + 3, oy + 2, 10, 2, '#111'); break;
    case 'X': R(ox, oy, T, T, '#7a5a3c'); R(ox + 1, oy + 1, 14, 15, '#6c6c7c'); R(ox + 2, oy + 2, 12, 13, '#555565');
      { const g = 0.5 + 0.5 * Math.sin(t * 3 + tx); ctx.globalAlpha = 0.5 + g * 0.5; R(ox + 7, oy + 4, 2, 9, '#7fd4ff'); R(ox + 5, oy + 6, 6, 2, '#7fd4ff'); R(ox + 5, oy + 10, 2, 2, '#7fd4ff'); R(ox + 9, oy + 10, 2, 2, '#7fd4ff'); ctx.globalAlpha = 1; } break;
    case '+': R(ox, oy, T, T, '#549a3d'); R(ox + 4, oy + 3, 8, 12, '#8a8a99'); R(ox + 5, oy + 2, 6, 2, '#8a8a99'); R(ox + 7, oy + 5, 2, 6, '#5c5c6b'); R(ox + 5, oy + 7, 6, 2, '#5c5c6b'); R(ox + 3, oy + 14, 10, 2, '#3a5a2a'); break;
    case 'l': { const g = Math.sin(t * 4 + tx * 2 + ty) > 0; R(ox, oy, T, T, '#c2410c'); R(ox + 2, oy + 3, 6, 3, g ? '#fb923c' : '#fde047'); R(ox + 9, oy + 10, 5, 2, g ? '#fde047' : '#fb923c'); break; }
    case '_': R(ox, oy, T, T, '#5b6b8c'); R(ox, oy, T, 1, '#4c5a78'); R(ox, oy, 1, T, '#4c5a78'); if (h < 15) R(ox + 5, oy + 7, 3, 1, '#6c7c9e'); break;
    case 'i': R(ox, oy, T, T, '#a8d8f0'); R(ox, oy, T, 1, '#8cc4e0'); R(ox, oy, 1, T, '#8cc4e0'); if ((h + Math.floor(t)) % 7 === 0) R(ox + 4, oy + 4, 5, 1, '#fff'); break;
    case 'W': R(ox, oy, T, T, '#25304d'); R(ox, oy + 7, T, 1, '#1a2238'); R(ox + (ty % 2) * 8, oy, 1, 7, '#1a2238'); R(ox + ((ty + 1) % 2) * 8, oy + 8, 1, 8, '#1a2238'); R(ox, oy, T, 1, '#36446b'); break;
    case 't': { R(ox, oy, T, T, '#5b6b8c'); R(ox + 4, oy + 8, 8, 7, '#3a3a4a'); R(ox + 3, oy + 7, 10, 2, '#59596b');
      const f = Math.floor(t * 8 + tx) % 3; R(ox + 5, oy + 2 + f, 6, 6 - f, '#ff9a1f'); R(ox + 7, oy + 3 + f, 2, 4 - f, '#ffe066'); break; }
    case 'v': R(ox, oy, T, T, '#05060a'); if (tile(tx, ty - 1) !== 'v') R(ox, oy, T, 3, '#2a3550'); break;
    case 'L': R(ox, oy, T, T, '#25304d'); R(ox + 1, oy + 1, 14, 14, '#7a5229'); R(ox + 1, oy + 1, 14, 2, '#5e3f1f'); R(ox + 6, oy + 6, 4, 4, '#ffd84a'); R(ox + 7, oy + 9, 2, 3, '#222'); break;
    case 'K': R(ox, oy, T, T, '#25304d'); R(ox + 1, oy + 1, 14, 14, '#5c2a6b'); R(ox + 4, oy + 5, 8, 7, '#ffd84a'); R(ox + 5, oy + 2, 6, 4, '#c9a227'); R(ox + 7, oy + 8, 2, 3, '#222'); break;
    case 'h': R(ox, oy, T, T, '#5b6b8c'); if (shutterClosed(tx, ty)) { R(ox, oy, T, T, '#3a3a4a'); for (let i = 1; i < 16; i += 4) R(ox + i, oy, 2, T, '#9aa0b4'); } break;
    case 'G': R(ox, oy, T, T, '#5b6b8c');
      if (!gatesDown()) { R(ox + 1, oy + 1, 14, 14, '#e07b1a'); R(ox + 1, oy + 1, 14, 3, '#ffb15c'); R(ox + 1, oy + 12, 14, 3, '#9c4f0d'); }
      else { R(ox + 2, oy + 2, 12, 12, '#cf6f12'); R(ox + 3, oy + 3, 10, 10, '#5b6b8c'); } break;
    case 'O': R(ox, oy, T, T, ground === '#e8eef7' ? '#5b6b8c' : ground); R(ox + 3, oy + 5, 10, 10, '#8a5a3a'); R(ox + 5, oy + 3, 6, 3, '#6b4322'); R(ox + 4, oy + 8, 8, 2, '#b07a4e'); break;
    case 'F': R(ox, oy, T, T, '#a8703c'); R(ox, oy + 7, T, 1, '#8a5a2b'); R(ox + ((ty % 2) ? 4 : 11), oy, 1, 7, '#8a5a2b'); R(ox + ((ty % 2) ? 11 : 4), oy + 8, 1, 8, '#8a5a2b'); break;
    case 'Z': R(ox, oy, T, T, '#e6d3b0'); R(ox, oy + 12, T, 4, '#8a6a4a'); if (ty === 0 && tx % 5 === 2) { R(ox + 3, oy + 3, 10, 7, '#9fd0ff'); R(ox + 7, oy + 3, 1, 7, '#fff'); } break;
    case 'Y': R(ox, oy, T, T, '#a8703c'); { const top = tile(tx, ty - 1) !== 'Y'; R(ox + 1, oy, 14, T, '#2f5aa8'); if (top) R(ox + 2, oy + 2, 12, 5, '#f2f2f2'); } break;
    case 'Q': R(ox, oy, T, T, ground === '#549a3d' ? '#dbc780' : ground); R(ox, oy + 4, T, 9, '#8a5a2b'); R(ox, oy + 4, T, 2, '#b07a4e'); R(ox + 1, oy + 13, 2, 3, '#5e3f1f'); R(ox + 13, oy + 13, 2, 3, '#5e3f1f'); break;
    case 'd': R(ox, oy, T, T, '#3a2a1a'); R(ox + 1, oy, 14, T, '#5e3f1f'); R(ox + 2, oy + 12, 12, 4, '#a83a3a'); break;
    case 'a': R(ox, oy, T, T, '#8a7a5a'); R(ox, oy, T, 1, '#6e6146'); R(ox, oy, 1, T, '#6e6146'); if ((tx + ty) % 4 === 0) R(ox + 4, oy + 4, 8, 8, '#93835f'); if (h < 8) R(ox + 6, oy + 9, 3, 1, '#5e5238'); break;
    case 'V': R(ox, oy, T, T, '#3a2e1e'); R(ox + 1, oy + 1, 14, 14, '#5a4630'); R(ox, oy + 7, T, 2, '#c9a227'); if (tx % 4 === 0 && ty <= 1) { R(ox + 5, oy + 1, 6, 6, '#b33a2e'); R(ox + 7, oy + 2, 2, 4, '#ffd84a'); } break;
    case 'r': R(ox, oy, T, T, '#a83a3a'); R(ox + 2, oy + 2, 12, 12, '#c25a3a'); if ((tx + ty) % 2) R(ox + 6, oy + 6, 4, 4, '#ffd84a'); break;
    default: R(ox, oy, T, T, ground);
  }
}
function drawMap() {
  const cx = Math.floor(G.cam.x), cy = Math.floor(G.cam.y);
  const x0 = Math.floor(cx / T), y0 = Math.floor(cy / T);
  for (let ty = y0; ty <= y0 + SH; ty++) for (let tx = x0; tx <= x0 + SW; tx++) {
    if (tx < 0 || ty < 0 || tx >= G.cols || ty >= G.nrows) continue;
    const c = claimedGround(tx, ty) || G.rows[ty][tx], ox = tx * T - cx, oy = ty * T - cy;
    if (!drawTileArt(c, ox, oy, tx, ty) && !drawTileB(c, ox, oy, tx, ty)) drawTile(c, ox, oy, tx, ty);
  }
}
