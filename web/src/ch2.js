// Chapter 2 (draft from the story bible): the Drowned Barrow, Voodoo Dash, the Draugr Captain,
// Fluffy's ghost, and Hank's ghost frozen by Chilly.

// ---------------- Voodoo Dash ----------------
const DASH_TIME = 0.22, DASH_SPEED = 340;
function startDash() {
  const p = G.player, s = G.save;
  if (!s.items.dash) return floatText(p.x, p.y - 18, 'No dash yet', '#aab');
  if (p.dashCd > 0 || p.dashing > 0) return;
  const l = Math.hypot(p.fx, p.fy) || 1;
  p.dashing = DASH_TIME; p.dashCd = 0.55; p.dx = p.fx / l; p.dy = p.fy / l; p.dashHit = [];
  p.inv = Math.max(p.inv, DASH_TIME + 0.08);
  G.jon.mode = 'follow';
  Sound.play('dash');
}
// tiles Owen can pass over while dashing (but not stand on): water, pits, spirit barriers
const dashSolid = (x, y) => { const c = tileAt(x, y); return c === 'w' || c === 'v' || c === 'y' || c === '~' ? false : solidAt(x, y, 'player') || c === 'y'; };
function updateDash(dt) {
  const p = G.player;
  p.dashing -= dt;
  const step = DASH_SPEED * dt, r = 5;
  const free = (x, y) => !(dashSolid(x - r, y - r) || dashSolid(x + r, y - r) || dashSolid(x - r, y + r) || dashSolid(x + r, y + r));
  const nx = p.x + p.dx * step, ny = p.y + p.dy * step;
  if (free(nx, p.y)) p.x = nx;
  if (free(p.x, ny)) p.y = ny;
  G.fx.push({ kind: 'ghost', x: p.x, y: p.y, vx: 0, vy: 0, t: 0, life: 0.25, fx: p.fx, fy: p.fy });
  // dash straight through enemies, hurting them (shields don't help); shatters Hank's frost
  for (const e of G.ents.slice()) {
    if (!e.enemy || !e.alive || p.dashHit.includes(e) || dist(e, p) > e.r + 7) continue;
    p.dashHit.push(e);
    if (e.type === 'hank') { if (e.frozen) shatterFrost(e); continue; }
    if ((e.type === 'king' || e.type === 'attendant') && e.st !== 'daze') continue;
    damageEnemy(e, rollDamage(1), p, 'magic');
  }
  // never end a dash inside a barrier: keep going until clear
  if (p.dashing <= 0 && tileAt(p.x, p.y) === 'y') p.dashing = 0.02;
  if (p.dashing <= 0) {
    p.dashing = 0;
    const c = tileAt(p.x, p.y);
    if (c === 'w') { p.falling = 0.6; Sound.play('splash'); ripple(p.x, p.y); floatText(p.x, p.y - 18, 'Zombies sink...', '#bfe0ff'); }
  }
}

// ---------------- Hank's ghost ----------------
function shatterFrost(e) {
  e.frozen = false; e.st = 'daze'; e.t = 0;
  G.shake = 0.3; Sound.play('clank'); Sound.play('secret');
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; G.fx.push({ x: e.x, y: e.y - 10, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, t: 0, life: 0.5, color: i % 2 ? '#ffffff' : '#9fe0ff', size: 2 }); }
  floatText(e.x, e.y - 50, 'FROST SHATTERED!', '#9fe0ff');
}
const HK = { axes: [] };
function updateHank(e, dt, dx, dy, d) {
  const p = G.player;
  switch (e.st) {
    case 'intro': if (G.state === 'play') { e.st = 'float'; e.t = 0; e.frozen = true; } break;
    case 'float':
      tryMove(e, dx / d * 22 * dt + Math.cos(G.t * 1.3) * 18 * dt, dy / d * 22 * dt + Math.sin(G.t * 1.7) * 14 * dt, 8, 'flyer');
      e.fx = dx / d; e.fy = dy / d;
      e.throwT = (e.throwT || 0) + dt; e.raiseT = (e.raiseT || 0) + dt;
      if (e.throwT > 2.4) { e.throwT = 0; HK.axes.push({ x: e.x, y: e.y - 20, vx: dx / d * 150, vy: dy / d * 150, t: 0, home: e, spin: 0 }); Sound.play('throw'); }
      if (e.raiseT > 7.5 && G.ents.filter(o => o.type === 'wisp' && o.alive).length < 2) { e.raiseT = 0; spawnEnemy('wisp', e.x - 30, e.y); spawnEnemy('wisp', e.x + 30, e.y); Sound.play('creep'); }
      break;
    case 'daze': if (e.t > 2.6) { e.st = 'float'; e.t = 0; e.frozen = true; Sound.play('charge'); floatText(e.x, e.y - 50, 'Frost returns!', '#9fe0ff'); } break;
  }
}
function updateHankAxes(dt) {
  const p = G.player;
  for (const a of HK.axes) {
    a.t += dt; a.spin += dt * 20;
    if (a.t > 0.85) { const dx = a.home.x - a.x, dy = a.home.y - 20 - a.y, d = Math.hypot(dx, dy) || 1; a.vx = dx / d * 170; a.vy = dy / d * 170; if (d < 10) a.done = true; }
    a.x += a.vx * dt; a.y += a.vy * dt;
    if (dist(a, p) < 9) { hurtPlayer(1, a); }
  }
  HK.axes = HK.axes.filter(a => !a.done && a.t < 3 && a.home.alive);
}

// ---------------- art ----------------
const FLUFFY = ['.ee.......', 'eEEe....tt', '.eEEeeee.t', '.eKEEEEEe.', '..eEEEEEe.', '..e.e..e.e', '..e.e..e.e'];
function buildCh2Art() {
  SPR.fluffy = buildSprite(FLUFFY, { e: '#9fe0ff', E: '#d8f4ff', K: '#20304a', t: '#9fe0ff' });
  SPR.fluffy_f = flipped(SPR.fluffy);
}
function drawCh2Enemy(e, x, y) {
  const white = e.flash > 0, f = Math.floor(e.wob / 2.5) % 2;
  if (e.type === 'captain') {
    const { d, flip } = dirOf(e.fx, e.fy);
    shadowAt(x, y + 10, 2);
    spr(SPR[`draugr_${d === 'up' ? 'down' : d}_${f}${flip ? '_f' : ''}`], x, y + 12, { scale: 2, white });
    R(x - 9, y - 30, 18, 3, '#c9a227');   // gold helm band: the captain
    drawShield(e, x, y - 6, 2);
    return true;
  }
  if (e.type === 'hank') {
    const bob = Math.round(Math.sin(G.t * 2) * 2);
    shadowAt(x, y + 18, 2.5);
    ctx.globalAlpha = e.st === 'daze' ? 0.95 : 0.78;
    spr(SPR[`draugr_down_${f}`], x, y + 18 + bob, { scale: 3, white });
    ctx.globalAlpha = 0.35; spr(whiteOf(SPR[`draugr_down_${f}`]), x, y + 18 + bob, { scale: 3 }); ctx.globalAlpha = 1;
    // horned helm and spectral axe
    R(x - 16, y - 36 + bob, 4, 8, '#f2ebcc'); R(x + 12, y - 36 + bob, 4, 8, '#f2ebcc');
    if (e.frozen) {
      ctx.strokeStyle = `rgba(160,230,255,${0.6 + 0.3 * Math.sin(G.t * 6)})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, y - 6 + bob, 26, 30, 0, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 6; i++) { const a = G.t * 1.5 + i * 1.05; R(x + Math.cos(a) * 26 - 1, y - 6 + bob + Math.sin(a) * 30 - 1, 3, 3, '#e8f8ff'); }
    }
    if (e.st === 'daze') for (let i = 0; i < 3; i++) { const a = G.t * 5 + i * 2.1; drawStar(x + Math.cos(a) * 18, y - 44 + Math.sin(a) * 4); }
    R(x - 31, y - 61, 62, 5, '#000'); R(x - 30, y - 60, 60 * Math.max(0, e.hp / e.max), 3, '#e23');
    return true;
  }
  return false;
}
function drawHankAxes() {
  for (const a of HK.axes) { ctx.globalAlpha = 0.8; drawJonSprite(a.x - G.cam.x, a.y - G.cam.y, a.spin); ctx.globalAlpha = 0.35; ctx.fillStyle = '#9fe0ff'; ctx.beginPath(); ctx.arc(a.x - G.cam.x, a.y - G.cam.y, 10, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
}
function drawDashGhost(f) {
  const { d, flip } = dirOf(f.fx, f.fy);
  ctx.globalAlpha = 0.45 * (1 - f.t / f.life);
  spr(purpleOf(SPR[`zombie_${d}_w0${flip ? '_f' : ''}`]), f.x - G.cam.x, f.y - G.cam.y + 7);
  ctx.globalAlpha = 1;
}
const PURPLE = new Map();
function purpleOf(c) { let p = PURPLE.get(c); if (!p) { p = tinted(c, '#b070ff'); PURPLE.set(c, p); } return p; }
// spirit barrier tile: shimmering purple wards
function renderBarrier(frame) {
  return makeTile((P) => {
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const lx = x % 8, ly = y % 8; P(x, y, lx === 0 || ly === 0 ? '#7888b8' : lx === 7 || ly === 7 ? '#48548a' : '#6070a0'); }
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const w = Math.sin(x * 0.8 + y * 0.5 + frame * 0.8) + Math.sin(y * 0.9 - frame * 0.6); if (w > 0.4) P(x, y, w > 1.2 ? '#e8c8ff' : '#9a4dd9', w > 1.2 ? 230 : 170); }
    for (const y of [3, 8, 13]) for (let x = 0; x < T; x++) if ((x + frame) % 4 < 2) P(x, y, '#d8a8ff', 200);
  });
}
function drawTileCh2(c, ox, oy) {
  if (c !== 'y') return false;
  const frame = Math.floor(G.t * 6) % 8, key = 'Y|' + frame;
  let img = TILE_CACHE.get(key); if (!img) { img = renderBarrier(frame); TILE_CACHE.set(key, img); }
  ctx.drawImage(img, ox, oy);
  return true;
}
