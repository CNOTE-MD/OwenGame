// The Red-Eye: optional side dungeon inside Flight 364. Creepy, not gory: darkness, flicker,
// scratching, seats that move while the lights are out, and a flight attendant you only see
// in the flashes. Reward: a heart container and the Demon Horn (V: enemies flee).

const RE = { blackout: 0, nextBlack: 4, scratchT: 3, whisperT: 6, scare: 0, layout: 0, shots: [] };

function redeyeEnter() {
  Object.assign(RE, { blackout: 0, nextBlack: 3 + Math.random() * 3, scratchT: 2, whisperT: 5, shots: [] });
  if (G.ents.some(e => e.type === 'attendant' && e.alive)) { RE.scare = 0.22; Sound.play('creep'); Sound.play('scratch'); }
}

function phantomSolid() { return RE.layout === 1; }

function updateRedeye(dt) {
  const p = G.player;
  // blackouts: the lights cut out, and when they come back the phantom seats may have moved
  RE.nextBlack -= dt;
  if (RE.nextBlack <= 0 && RE.blackout <= 0) { RE.blackout = 0.7; RE.nextBlack = 4 + Math.random() * 4; Sound.play('flicker'); }
  if (RE.blackout > 0) {
    RE.blackout -= dt;
    if (RE.blackout <= 0) {
      const next = 1 - RE.layout;
      // never close a seat on top of Owen or an enemy
      const blocked = next === 1 && [p, ...G.ents.filter(e => e.enemy)].some(a => tile(Math.floor(a.x / T), Math.floor(a.y / T)) === 'J');
      if (!blocked) RE.layout = next;
    }
  }
  RE.scratchT -= dt;
  if (RE.scratchT <= 0) { RE.scratchT = 3 + Math.random() * 4; Sound.play('scratch'); }
  RE.whisperT -= dt;
  if (RE.whisperT <= 0) {
    RE.whisperT = 7 + Math.random() * 6;
    G.fx.push({ kind: 'whisper', x: G.cam.x + rnd(40, VW - 40), y: G.cam.y + rnd(50, VH - 40), vx: 0, vy: -4, t: 0, life: 2.4, label: pick(['any refreshments?', 'sir...', 'please remain seated', 'wonderful...']) });
  }
  RE.scare = Math.max(0, RE.scare - dt);
  // peanuts
  for (const s of RE.shots) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (s.life < 1.85 && dist(s, p) < 7) { s.life = 0; hurtPlayer(1, s); }   // a fresh peanut can't hit on the frame it's thrown
    if (solidAt(s.x, s.y, 'jon')) s.life = 0;
  }
  RE.shots = RE.shots.filter(s => s.life > 0);
}

// ---------------- enemies ----------------
function updateImp(e, dt, dx, dy, d, mr) {
  // darts in bursts, pauses, darts again
  if (e.t > (e.st === 'dart' ? 0.35 : 0.8)) { e.t = 0; e.st = e.st === 'dart' ? 'pause' : 'dart'; e.fx = dx / d; e.fy = dy / d; }
  if (e.st === 'dart') tryMove(e, e.fx * 120 * dt, e.fy * 120 * dt, mr, 'walker');
}
function updateCart(e, dt) {
  // rolls up and down the galley on its own; can't be stopped
  const h = tryMove(e, 0, e.dir * 62 * dt, 6, 'walker');
  if (h.hitY) e.dir *= -1;
  e.wob += dt * 12;
  if (dist(e, G.player) < 12) hurtPlayer(2, e);
}
function updateAttendant(e, dt, dx, dy, d, mr) {
  const p = G.player;
  switch (e.st) {
    case 'intro': if (G.state === 'play') { e.st = 'hide'; e.t = 0; } break;
    case 'hide':
      if (e.t > 1.3) {
        // reappear somewhere near Owen
        for (let i = 0; i < 40; i++) {
          const a = Math.random() * Math.PI * 2, r = rnd(46, 70), x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r;
          if (!blocked(x, y, 6, 'walker', e) && sameScreen(Math.floor(x / T), Math.floor(y / T))) { e.x = x; e.y = y; break; }
        }
        e.st = 'reveal'; e.t = 0; Sound.play('creep');
        if (e.hp <= e.max / 2) for (const k of [-0.35, 0, 0.35]) { const a = Math.atan2(p.y - e.y, p.x - e.x) + k; RE.shots.push({ x: e.x, y: e.y, vx: Math.cos(a) * 95, vy: Math.sin(a) * 95, life: 2 }); }
      }
      break;
    case 'reveal': e.fx = dx / d; e.fy = dy / d; if (e.t > 0.7) { e.st = 'dash'; e.t = 0; Sound.play('charge'); } break;
    case 'dash': {
      const h = tryMove(e, e.fx * 175 * dt, e.fy * 175 * dt, mr, 'walker');
      if (e.t > 0.5 || h.hitX || h.hitY) { e.st = 'daze'; e.t = 0; }
      break; }
    case 'daze': if (e.t > 1.4) { e.st = 'hide'; e.t = 0; } break;
  }
}
const attendantVisible = e => e.st !== 'hide' || Math.random() < 0.06 || RE.blackout > 0.5;

// ---------------- Demon Horn ----------------
function blowHorn() {
  const s = G.save, p = G.player;
  if (!s.items.horn) return floatText(p.x, p.y - 18, 'No horn yet', '#aab');
  if (s.rune < RUNE_MAX / 2) return floatText(p.x, p.y - 18, 'Need half a rune meter', '#7fd4ff');
  s.rune -= RUNE_MAX / 2;
  Sound.play('horn'); G.shake = 0.3;
  for (const e of G.ents) if (e.enemy && e.alive && !e.boss) e.fear = 4;
  G.fx.push({ kind: 'ring', x: p.x, y: p.y, vx: 0, vy: 0, t: 0, life: 0.6 });
  floatText(p.x, p.y - 26, 'BWAAAMP!', '#ff8a6a');
}

// ---------------- art ----------------
const PAL_ATT = { h: '#2a1a12', s: '#e8d0c0', S: '#c0a090', e: '#20141c', u: '#1e2a5a', U: '#141c40', r: '#c0182b', w: '#f4f4f8', f: '#1a1a1a', R: '#ff2020', t: '#d8d8e8' };
const ATT_ROWS = [
  '.....hhhh.....',
  '....hhhhhh....',
  '...hhhhhhhh...',
  '...hsssssshh..',
  '...hsessess...',
  '....ssssss....',
  '.....sSSs.....',
  '....rrwwrr....',
  '...uuurruuu...',
  '..suuuuuuuus..',
  '..suUuuuuUus..',
  '..s.uuuuuu.s..',
  '....uuuuuu....',
  '....UUUUUU....',
  '....ss..ss....',
  '....ff..ff....',
];
const ATT_DEMON = ATT_ROWS.map((r, i) => i === 4 ? '...hsRssRss...' : i === 6 ? '.....stttS.....'.slice(0, 14) : i === 9 ? '.tsuuuuuuuust.' : i === 10 ? 't.suUuuuuUus.t' : i === 11 ? 't.s.uuuuuu.s.t' : r);
const IMP = [[
  '.h......h...',
  '.hh....hh...',
  '..rrrrrr....',
  '.rrYrrYrr...',
  '.rrrrrrrr...',
  'wwrrmmrrww..',
  'w.rrrrrr.w..',
  '...rrrr.....',
  '...r..r.....',
], [
  '.h......h...',
  '.hh....hh...',
  '..rrrrrr....',
  'wrrYrrYrrw..',
  'wwrrrrrrww..',
  '..rrmmrr....',
  '..rrrrrr....',
  '...rrrr.....',
  '..r....r....',
]];
const PAL_IMP = { h: '#e8dcc0', r: '#a8203a', Y: '#ffe066', m: '#2a0a10', w: '#5a1020' };
const CART = ['cccccccccccc', 'cCCCCCCCCCCc', 'cddddddddddc', 'cCCCCCCCCCCc', 'cddddddddddc', 'cCCCCCCCCCCc', 'cddddddddddc', 'cCCCCCCCCCCc', 'cccccccccccc', '.k........k.'];
const PAL_CART = { c: '#9aa0ac', C: '#c8ced8', d: '#6a7080', k: '#202020' };

function buildRedeyeArt() {
  SPR.att = buildSprite(ATT_ROWS, PAL_ATT); SPR.att_demon = buildSprite(ATT_DEMON, PAL_ATT);
  SPR.imp_0 = buildSprite(IMP[0], PAL_IMP); SPR.imp_1 = buildSprite(IMP[1], PAL_IMP);
  SPR.cart = buildSprite(CART, PAL_CART);
}

function drawRedeyeEnemy(e, x, y) {
  const white = e.flash > 0;
  if (e.type === 'imp') { shadowAt(x, y + 6, 0.8); spr(SPR['imp_' + (Math.floor(G.t * 10 + e.wob) % 2)], x, y + 6 + Math.round(Math.sin(G.t * 8 + e.wob)), { white }); return true; }
  if (e.type === 'cart') { shadowAt(x, y + 7, 1.1); spr(SPR.cart, x + Math.round(Math.sin(e.wob)), y + 7); return true; }
  if (e.type === 'attendant') {
    if (!attendantVisible(e)) return true;
    const demon = e.st === 'reveal' || e.st === 'dash';
    shadowAt(x, y + 7, 1);
    ctx.globalAlpha = e.st === 'hide' ? 0.45 : 1;
    spr(demon ? SPR.att_demon : SPR.att, x + (e.st === 'reveal' ? Math.round(rnd(-1, 1)) : 0), y + 10, { scale: 2, white });
    ctx.globalAlpha = 1;
    if (e.st === 'daze') for (let i = 0; i < 3; i++) { const a = G.t * 5 + i * 2.1; drawStar(x + Math.cos(a) * 14, y - 30 + Math.sin(a) * 3); }
    return true;
  }
  return false;
}

function drawRedeyeOverlay() {
  if (!G.map || !G.map.redeye) return;
  for (const s of RE.shots) { R(s.x - G.cam.x - 2, s.y - G.cam.y - 1, 4, 3, '#c8a060'); R(s.x - G.cam.x - 1, s.y - G.cam.y - 1, 1, 1, '#f0d8a0'); }
  if (RE.blackout > 0) { ctx.fillStyle = `rgba(0,0,0,${RE.blackout > 0.6 || RE.blackout < 0.1 ? 0.6 : 0.88})`; ctx.fillRect(0, 0, VW, VH); }
  if (RE.scare > 0) {
    // the jump scare: her face fills the screen for a moment
    ctx.fillStyle = 'rgba(40,0,0,0.85)'; ctx.fillRect(0, 0, VW, VH);
    spr(SPR.att_demon, VW / 2, VH - 10, { scale: 9 });
  }
}

function drawWhisper(f) {
  ctx.globalAlpha = Math.sin(Math.PI * f.t / f.life) * 0.55;
  text(f.label, f.x - G.cam.x, f.y - G.cam.y, '#ffb0b0', 'center', false);
  ctx.globalAlpha = 1;
}

// red-eye tiles: plane walls with windows, emergency lights, cargo grate, carpet, seats, crates
function renderTileRE(c, v, frame, extra, tx, ty) {
  const nb = (dx, dy) => tile(tx + dx, ty + dy);
  return makeTile((P) => {
    const rect = (x, y, w, h, col, a) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) P(xx, yy, col, a); };
    const carpet = () => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) P(x, y, (x + y) % 8 === 0 || (x - y + 16) % 8 === 0 ? '#2a2050' : '#1e1840'); };
    switch (c) {
      case 'u': case 'e': {
        const face = nb(0, 1) !== 'u' && nb(0, 1) !== 'e';
        rect(0, 0, 16, 16, '#3a3a48');
        if (face) {
          rect(0, 4, 16, 12, '#c8c4bc'); rect(0, 4, 16, 1, '#e8e4dc'); rect(0, 15, 16, 1, '#5a5650');
          if (c === 'u' && (tx % 3 === 0)) { rect(5, 6, 6, 7, OUTLINE); rect(6, 7, 4, 5, extra === 'L' ? '#e8f0ff' : '#0a0c1a'); if (extra !== 'L' && v % 2) P(7, 8, '#ffffff'); }
          if (c === 'e') { rect(5, 7, 6, 5, OUTLINE); rect(6, 8, 4, 3, frame % 2 ? '#ff2020' : '#a01010'); }
        }
        break; }
      case '=': for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) P(x, y, x % 4 === 0 || y % 4 === 0 ? '#2a2c34' : '#4a4e58'); break;
      case 'm': carpet(); break;
      case 'A': case 'J': {
        carpet();
        if (c === 'J' && extra !== 'on') break;
        const ghost = c === 'J';
        rect(2, 1, 12, 14, OUTLINE); rect(3, 2, 10, 12, ghost ? '#4a3a6a' : '#2f5aa8'); rect(3, 2, 10, 3, ghost ? '#6a5a8a' : '#5a88e0');
        rect(3, 5, 10, 1, ghost ? '#2a2040' : '#1e3a78'); rect(1, 6, 2, 8, '#8a8a9c'); rect(13, 6, 2, 8, '#8a8a9c'); rect(5, 2, 6, 2, '#e8e8f0');
        break; }
      case 'B':
        rect(0, 0, 16, 16, nb(0, 0) && tx < 16 ? '#4a4e58' : '#1e1840');
        rect(1, 1, 14, 14, OUTLINE); rect(2, 2, 12, 12, '#a8703c'); rect(2, 2, 12, 2, '#c89058');
        for (let k = 2; k < 14; k++) { P(k, k, '#6a4422'); P(15 - k, k, '#6a4422'); }
        rect(2, 13, 12, 1, '#6a4422');
        break;
      default: return;
    }
  });
}
function drawTileRE(c, ox, oy, tx, ty) {
  if (!G.map || !G.map.redeye || !'ue=mAJB'.includes(c)) return false;
  const v = hash(tx, ty) % 4;
  const frame = c === 'e' ? Math.floor(G.t * 2) % 2 : 0;
  const extra = c === 'J' ? (phantomSolid() ? 'on' : 'off') : c === 'u' ? (RE.blackout > 0.55 ? 'L' : '') : '';
  const key = `RE${c}|${v}|${frame}|${extra}|${tile(tx, ty + 1)}|${tx % 3}`;
  let img = TILE_CACHE.get(key);
  if (img === undefined) { img = renderTileRE(c, v, frame, extra, tx, ty); TILE_CACHE.set(key, img); }
  ctx.drawImage(img, ox, oy);
  return true;
}
