// Pixel art drawn in code. Everything is centered on (x, y) = feet-ish center.

function drawOwen(x, y) {
  const p = G.player;
  let lift = 0, scale = 1;
  if (p.launching) lift = Math.sin(Math.PI * Math.min(p.lp, 1)) * 30;
  if (p.falling > 0) scale = Math.max(0.1, p.falling / 0.6);
  R(x - 5, y + 5, 10, 2, 'rgba(0,0,0,.3)');
  if (p.inv > 0 && Math.floor(p.inv * 20) % 2 === 0 && !p.launching && G.state === 'play') return;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y - lift)); ctx.scale(scale, scale);
  const zombie = !G.save.voodoo;
  const skin = zombie ? '#8cbf80' : '#fac799', tunic = zombie ? '#73409c' : '#3380d9';
  const st = (G.state === 'play' || G.trans) ? Math.floor(p.walk) % 2 : 0;
  R(-4, 3 + st, 3, 3, '#59381a'); R(1, 3 + (1 - st), 3, 3, '#59381a');
  R(-5, -3, 10, 7, tunic); R(-5, 1, 10, 1, '#664019'); R(-1, 1, 2, 1, '#ffd84a');
  R(-4, -9, 8, 7, skin); R(-4, -9, 8, 2, '#8a5a2b');
  R(-5, -11, 10, 4, '#9999ad'); R(-5, -11, 10, 1, '#c9c9d9'); R(-7, -13, 2, 4, '#f2ebcc'); R(5, -13, 2, 4, '#f2ebcc');
  const back = p.fy < -0.5 && Math.abs(p.fx) < 0.3;
  if (!back) { const ex = p.fy <= 0.5 ? clamp(p.fx, -1, 1) : 0; R(-3 + ex, -6, 1, 2, '#1a1a1a'); R(2 + ex, -6, 1, 2, '#1a1a1a'); }
  if (p.hold) { ctx.restore(); drawItemIcon(p.hold.id, x, y - 26); return; }
  ctx.restore();
}

function drawJonSprite(x, y, spin) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(spin);
  const homing = G.save && G.save.items.homing;
  R(-6, -9, 12, 18, homing ? 'rgba(255,216,74,.18)' : 'rgba(77,153,255,.18)');
  R(-1, -8, 2, 17, '#805224'); R(-1, -2, 2, 1, '#4d2e14'); R(-1, 2, 2, 1, '#4d2e14'); R(-1, 8, 2, 2, '#b3b3bf');
  poly([[1, -9], [10, -12], [12, -5], [10, 2], [1, -1]], '#d1e0f2');
  poly([[10, -12], [12, -5], [10, 2], [9, -5]], '#f2faff');
  poly([[-1, -8], [-4, -6], [-1, -4]], '#d1e0f2');
  poly([[1, -9], [10, -12], [12, -5], [10, 2], [1, -1]], null, '#40598c');
  R(3, -8, 3, 3, '#fff'); R(7, -8, 3, 3, '#fff'); R(4, -7, 1, 2, '#000'); R(8, -7, 1, 2, '#000'); R(4, -3, 5, 1, '#40598c');
  ctx.restore();
}
function drawJon() {
  const j = G.jon, x = j.x - G.cam.x, y = j.y - G.cam.y;
  drawJonSprite(x, y, j.spin);
  if (j.qt > 0 && j.quip && G.state === 'play') {
    ctx.font = FONT;
    const w = Math.ceil(ctx.measureText(j.quip).width) + 6, bx = clamp(x - w / 2, 2, VW - w - 2), by = clamp(y - 32, 24, VH - 14);
    R(bx, by, w, 12, 'rgba(10,10,32,.85)'); text(j.quip, bx + 3, by + 9, '#ffffb3', 'left', false);
  }
}

function drawPenguinBody(e, crown) {
  const sw = Math.round(Math.sin(e.wob));
  let body = '#1a1a38';
  if (e.flash > 0) body = '#fff'; else if (e.st === 'wind') body = '#8c1a1a';
  R(-6, 5, 12, 2, 'rgba(0,0,0,.3)');
  R(-5 + sw, -6, 10, 12, body); R(-3 + sw, -2, 6, 7, '#f2f2ff'); R(-4 + sw, -5, 8, 3, body);
  R(-6 + sw, -2, 1, 5, body); R(5 + sw, -2, 1, 5, body);
  R(-1 + sw, -3, 3, 2, '#ffa61a'); R(-3, 6, 2, 1, '#ffa61a'); R(1, 6, 2, 1, '#ffa61a');
  R(-3 + sw, -5, 2, 2, '#ff1a1a'); R(1 + sw, -5, 2, 2, '#ff1a1a');
  if (crown) { R(-4 + sw, -9, 8, 3, '#ffd84a'); R(-4 + sw, -11, 2, 2, '#ffd84a'); R(-1 + sw, -11, 2, 2, '#ffd84a'); R(2 + sw, -11, 2, 2, '#ffd84a'); R(-1 + sw, -8, 2, 1, '#e23'); }
}
function drawEnemy(e) {
  const x = Math.round(e.x - G.cam.x), y = Math.round(e.y - G.cam.y);
  ctx.save(); ctx.translate(x, y);
  switch (e.type) {
    case 'penguin': drawPenguinBody(e); break;
    case 'king':
      if (e.st === 'wind' || e.st === 'slide') ctx.translate(rnd(-1, 1), 0);
      ctx.scale(2.4, 2.4); drawPenguinBody(e, true);
      if (e.st === 'daze') for (let i = 0; i < 3; i++) { const a = G.t * 5 + i * 2.1; R(Math.cos(a) * 6 - 1, -13 + Math.sin(a) * 2, 2, 2, '#ffe066'); }
      break;
    case 'knight':
      ctx.scale(1.5, 1.5); drawPenguinBody(e);
      R(-5, -8, 10, 4, '#8a8aa0'); R(-5, -8, 10, 1, '#c9c9d9'); R(-1, -10, 2, 3, '#e23');
      R(Math.round(e.fx * 6) - 3, Math.round(e.fy * 5) - 3, 6, 8, '#6b4322'); R(Math.round(e.fx * 6) - 2, Math.round(e.fy * 5) - 2, 4, 6, '#b8b8c8');
      break;
    case 'draugr': {
      const sw = Math.round(Math.sin(e.wob * 0.5));
      const bone = e.flash > 0 ? '#fff' : '#b9c4a8';
      R(-6, 6, 12, 2, 'rgba(0,0,0,.3)');
      R(-4, 2 + sw, 3, 5, '#5a5a4a'); R(1, 2 - sw, 3, 5, '#5a5a4a');
      R(-5, -4, 10, 7, '#4a5a3a'); R(-4, -11, 8, 7, bone); R(-3, -8, 2, 2, '#111'); R(1, -8, 2, 2, '#111'); R(-2, -5, 4, 1, '#111');
      R(-5, -13, 10, 3, '#7a7a8a'); R(-1, -15, 2, 2, '#7a7a8a');
      R(Math.round(e.fx * 7) - 4, Math.round(e.fy * 5) - 4, 8, 8, '#8a2a21'); R(Math.round(e.fx * 7) - 1, Math.round(e.fy * 5) - 1, 2, 2, '#ffd84a');
      break; }
    case 'wisp': {
      const g = 0.6 + 0.4 * Math.sin(G.t * 6 + e.wob);
      ctx.globalAlpha = 0.35 * g; R(-7, -7, 14, 14, '#7fd4ff'); ctx.globalAlpha = 1;
      R(-3, -3, 6, 6, e.flash > 0 ? '#fff' : '#cfefff'); R(-1, -5, 2, 2, '#cfefff'); R(-2, -1, 1, 1, '#123'); R(1, -1, 1, 1, '#123');
      break; }
    case 'bat': {
      const f = Math.floor(G.t * 12 + e.wob) % 2;
      const c = e.flash > 0 ? '#fff' : '#3d5a9e';
      R(-2, -2, 4, 4, c); R(-7, f ? -4 : 0, 5, 2, c); R(2, f ? -4 : 0, 5, 2, c); R(-1, -1, 1, 1, '#ff4'); R(1, -1, 1, 1, '#ff4');
      break; }
  }
  ctx.restore();
  if (e.boss && e.alive) {
    const w = 60, bx = x - w / 2, by = y - (e.type === 'king' ? 44 : 26);
    R(bx - 1, by - 1, w + 2, 5, '#000'); R(bx, by, w * Math.max(0, e.hp / e.max), 3, '#e23');
  }
}

function drawPerson(x, y, look, bob) {
  const b = Math.round(Math.sin(G.t * 2 + bob) * 0.6);
  R(x - 5, y + 5, 10, 2, 'rgba(0,0,0,.3)');
  R(x - 4, y + 3, 3, 3, '#3a2a1a'); R(x + 1, y + 3, 3, 3, '#3a2a1a');
  R(x - 5, y - 3 + b, 10, 7, look.shirt); R(x - 4, y - 9 + b, 8, 7, look.skin || '#f0c49a');
  R(x - 4, y - 10 + b, 8, 3, look.hair);
  if (look.long) { R(x - 5, y - 9 + b, 2, 8, look.hair); R(x + 3, y - 9 + b, 2, 8, look.hair); }
  if (look.beard) R(x - 4, y - 4 + b, 8, 3, look.hair);
  if (look.hat) { R(x - 5, y - 12 + b, 10, 3, look.hat); }
  R(x - 3, y - 6 + b, 1, 2, '#111'); R(x + 2, y - 6 + b, 1, 2, '#111');
}
const LOOKS = {
  astrid: { shirt: '#6b3fa0', hair: '#e8e8e8', long: true },
  lars: { shirt: '#b33a2e', hair: '#d9a441', beard: true },
  sven: { shirt: '#2f8a5a', hair: '#f2d27a' },
  ingrid: { shirt: '#2f5aa8', hair: '#a0522d', long: true, hat: '#e0c040' },
};

function drawItemIcon(id, x, y) {
  x = Math.round(x); y = Math.round(y);
  switch (ITEMS[id] ? ITEMS[id].icon : id) {
    case 'key': R(x - 1, y - 6, 3, 9, '#ffd84a'); R(x - 3, y - 7, 7, 4, '#ffd84a'); R(x - 1, y - 6, 3, 2, '#000'); R(x + 2, y + 1, 2, 2, '#ffd84a'); break;
    case 'bigkey': R(x - 2, y - 7, 4, 13, '#ffd84a'); R(x - 5, y - 8, 10, 6, '#ffd84a'); R(x - 2, y - 7, 4, 3, '#a87a10'); R(x + 2, y + 2, 3, 2, '#ffd84a'); R(x + 2, y - 1, 3, 2, '#ffd84a'); break;
    case 'homing': drawJonSprite(x, y, 0.4); R(x - 8, y - 8, 3, 1, '#ffd84a'); R(x + 6, y + 6, 3, 1, '#ffd84a'); break;
    case 'thunder': R(x - 6, y - 7, 12, 14, '#2a3a6a'); poly([[x + 1, y - 6], [x - 4, y + 1], [x, y + 1], [x - 2, y + 6], [x + 4, y - 1], [x, y - 1]], '#ffe066'); break;
    case 'piece': poly([[x, y - 2], [x - 5, y - 6], [x - 6, y - 1], [x, y + 5]], '#f22633'); R(x - 4, y - 5, 2, 2, '#ff9aa2'); break;
    case 'container': R(x - 7, y - 7, 15, 14, '#ffd84a'); drawHeart(x - 3, y - 3, 1); break;
    case 'heart': drawHeart(x - 3, y - 3, 1); break;
    case 'coin': R(x - 3, y - 3, 7, 7, '#d0d6e0'); R(x - 1, y - 2, 3, 5, '#8a92a0'); break;
    case 'juice': R(x - 3, y - 6, 6, 3, '#d8d8e8'); R(x - 4, y - 3, 8, 9, '#c0182b'); R(x - 2, y - 1, 2, 4, '#ff6b7f'); break;
    case 'shard': poly([[x, y - 6], [x + 4, y], [x, y + 6], [x - 4, y]], '#7fd4ff'); R(x - 1, y - 2, 2, 4, '#fff'); break;
  }
}

function drawThing(e) {
  const x = Math.round(e.x - G.cam.x), y = Math.round(e.y - G.cam.y), t = G.t;
  switch (e.kind) {
    case 'enemy': return drawEnemy(e);
    case 'npc': return drawPerson(x, y, LOOKS[e.id] || LOOKS.sven, e.bob);
    case 'sign': R(x - 1, y, 2, 7, '#6b4322'); R(x - 7, y - 7, 14, 9, '#b07a4e'); R(x - 7, y - 7, 14, 1, '#d9a46e'); R(x - 5, y - 4, 10, 1, '#6b4322'); R(x - 5, y - 1, 7, 1, '#6b4322'); break;
    case 'plaque': R(x - 7, y - 4, 14, 7, '#c08a50'); R(x - 6, y - 3, 12, 1, '#6b4322'); R(x - 6, y, 9, 1, '#6b4322'); break;
    case 'runestone': {
      R(x - 6, y + 5, 12, 2, 'rgba(0,0,0,.3)'); R(x - 5, y - 9, 10, 15, '#7c7c8c'); R(x - 4, y - 11, 8, 3, '#7c7c8c'); R(x - 5, y - 9, 2, 15, '#9a9aaa');
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 3); R(x - 1, y - 8, 2, 11, '#7fd4ff'); R(x - 3, y - 6, 6, 2, '#7fd4ff'); R(x - 3, y - 1, 2, 2, '#7fd4ff'); R(x + 1, y + 1, 2, 2, '#7fd4ff'); ctx.globalAlpha = 1;
      break; }
    case 'chest':
      R(x - 7, y - 5, 14, 11, '#7a4a1f'); R(x - 7, y - 5, 14, 3, e.open ? '#3a2410' : '#9c6431'); R(x - 7, y - 1, 14, 1, '#ffd84a'); R(x - 1, y - 2, 3, 3, e.open ? '#7a4a1f' : '#ffd84a');
      R(x - 7, y - 5, 1, 11, '#ffd84a'); R(x + 6, y - 5, 1, 11, '#ffd84a'); break;
    case 'shop': drawItemIcon(e.item, x, y - 2); text(String(e.price), x, y + 12, '#fff', 'center'); break;
    case 'pickup': {
      if (e.life !== undefined && e.life < 2 && Math.floor(t * 10) % 2) break;
      const b = Math.round(Math.sin(t * 4 + e.x) * 1.5);
      if (e.what === 'heart') drawHeart(x - 3, y - 3 + b, 1);
      else if (e.what === 'kr1' || e.what === 'kr5') { R(x - 3, y - 3 + b, 6, 6, e.what === 'kr5' ? '#ffd84a' : '#d0d6e0'); R(x - 1, y - 2 + b, 2, 4, e.what === 'kr5' ? '#a87a10' : '#8a92a0'); }
      else if (e.what === 'rune') drawItemIcon('shard', x, y + b);
      else drawItemIcon(e.what, x, y + b);
      break; }
    case 'switch': {
      const on = flag(G.mapId + ':gates');
      R(x - 5, y + 2, 10, 5, '#3a3a4a'); poly([[x, y - 9], [x + 6, y - 2], [x, y + 4], [x - 6, y - 2]], on ? '#7fd4ff' : '#ff9a1f'); R(x - 2, y - 5, 2, 3, '#fff');
      break; }
    case 'warp': if (e.portal) { for (let i = 0; i < 3; i++) { const r = 4 + ((t * 10 + i * 4) % 10); ctx.strokeStyle = `rgba(127,212,255,${1 - r / 14})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2); ctx.stroke(); } } break;
  }
}
