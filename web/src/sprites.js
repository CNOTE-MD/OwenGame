// Pixel art drawn in code. Everything is centered on (x, y) = feet-ish center.

function drawOwen(x, y) {
  const p = G.player;
  let lift = 0, scale = 1;
  if (p.launching) lift = Math.sin(Math.PI * Math.min(p.lp, 1)) * 30;
  if (p.falling > 0) scale = Math.max(0.15, p.falling / 0.6);
  shadowAt(x, y + 6, p.launching ? 0.7 : 1);
  const hurt = p.inv > 0 && Math.floor(p.inv * 20) % 2 === 0 && !p.launching && G.state === 'play';
  const key = G.save.voodoo || G.mode === 'arena' ? 'owen' : 'zombie';
  if (p.hold) {
    spr(SPR[key + '_hold'], x, y + 7);
    // A Link to the Past item fanfare: rays and twinkles around the prize
    const ix = x, iy = y - 22, t = G.t * 3;
    ctx.strokeStyle = 'rgba(255,240,170,0.5)'; ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) { const a = t * 0.5 + i * Math.PI / 4, r0 = 9, r1 = 14 + 3 * Math.sin(t * 2 + i); ctx.beginPath(); ctx.moveTo(ix + Math.cos(a) * r0, iy + Math.sin(a) * r0); ctx.lineTo(ix + Math.cos(a) * r1, iy + Math.sin(a) * r1); ctx.stroke(); }
    drawItemIcon(p.hold.id, ix, iy);
    for (let i = 0; i < 3; i++) { const a = t + i * 2.1; drawTwinkle(ix + Math.cos(a) * 12, iy + Math.sin(a) * 9, (Math.floor(G.t * 8) + i) % 2); }
    return;
  }
  const { d, flip } = dirOf(p.fx, p.fy);
  let f;
  if (G.jon.mode === 'swing') { const k = G.jon.st / (0.2 / G.st.atk); f = 'a' + (k < 0.25 ? 0 : k < 0.7 ? 1 : 2); }
  else f = 'w' + ((p.moving || G.trans) ? Math.floor(p.walk) % 8 : 0);
  spr(SPR[`${key}_${d}_${f}${flip ? '_f' : ''}`], x, y + 7 - lift, { scale, white: hurt });
}
function drawTwinkle(x, y, big) {
  R(x, y - (big ? 3 : 2), 1, big ? 7 : 5, '#ffffff'); R(x - (big ? 3 : 2), y, big ? 7 : 5, 1, '#ffffff'); R(x, y, 1, 1, '#ffe066');
}

function drawJonSprite(x, y, spin, blink, face) {
  const img = blink && face !== 'sleepy' ? SPR.jon_blink : (face && SPR['jon_' + face]) || SPR.jon;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(spin);
  if (G.save && G.save.items.homing) { ctx.globalAlpha = 0.25 + 0.1 * Math.sin(G.t * 6); ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(1, -2, 10, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
  ctx.drawImage(img, -img.width / 2 + 1, -img.height / 2);
  ctx.restore();
}
function drawSlash() {
  const j = G.jon, p = G.player;
  if (j.mode !== 'swing') return;
  const k = Math.min(1, j.st / (0.2 / G.st.atk)), a0 = j.base - 1.3, a1 = j.base - 1.3 + 2.6 * k;
  const x = p.x - G.cam.x, y = p.y - G.cam.y;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(x, y, 15, Math.max(a0, a1 - 1.6), a1); ctx.stroke();
  ctx.strokeStyle = 'rgba(160,220,255,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 18, Math.max(a0, a1 - 1.2), a1); ctx.stroke();
  ctx.lineCap = 'butt';
}
function drawJon() {
  const j = G.jon, x = j.x - G.cam.x, y = j.y - G.cam.y;
  drawSlash();
  if (j.mode === 'follow') shadowAt(x, y + 18, 0.6);
  (j.trail || []).forEach((tr, i) => { ctx.globalAlpha = 0.12 + i * 0.07; drawJonSprite(tr.x - G.cam.x, tr.y - G.cam.y, tr.spin); });
  ctx.globalAlpha = 1;
  drawSpinFx();
  drawJonSprite(x, y, j.spin, j.t % 3.2 < 0.14, jonFaceNow());
  if (JT.asleep && G.state === 'play') { const k = (G.t * 0.7) % 1; text('z', x + 8 + k * 6, y - 8 - k * 12, `rgba(255,255,255,${1 - k})`, 'left', false); }
  drawJonBubble(x, y);
}

function drawEnemy(e) {
  const x = Math.round(e.x - G.cam.x), y = Math.round(e.y - G.cam.y);
  if (drawCh2Enemy(e, x, y)) return;
  if (drawRedeyeEnemy(e, x, y)) { if (e.boss && e.alive && attendantVisible(e)) { R(x - 31, y - 41, 62, 5, '#000'); R(x - 30, y - 40, 60 * Math.max(0, e.hp / e.max), 3, '#e23'); } return; }
  const white = e.flash > 0 || (e.st === 'wind' && Math.floor(G.t * 16) % 2 === 0);
  const f = Math.floor(e.wob / 2.5) % 2;
  switch (e.type) {
    case 'penguin': case 'knight': case 'king': {
      const s = e.type === 'king' ? 3 : e.type === 'knight' ? 2 : 1;
      const { d, flip } = dirOf(e.fx, e.fy);
      const waddle = e.st === 'daze' || e.st === 'slide' ? 0 : [0, 1, 0, -1][Math.floor(e.wob / 2.5) % 4] * s;
      const shake = (e.type === 'king' && (e.st === 'wind' || e.st === 'slide') ? Math.round(rnd(-1, 1)) : 0) + waddle;
      shadowAt(x, y + 5 * s, s);
      const img = SPR[`peng_${d}_${e.st === 'daze' ? 0 : f}${flip ? '_f' : ''}`];
      const foot = y + 6 * s;
      spr(img, x + shake, foot, { scale: s, white });
      const top = foot - img.height * s + 2 * s;
      if (e.type === 'king') {
        spr(SPR.crown, x + shake, top + 3 * s, { scale: s });
        if (e.st === 'daze') for (let i = 0; i < 3; i++) { const a = G.t * 5 + i * 2.1; drawStar(x + Math.cos(a) * 18, top - 4 + Math.sin(a) * 4); }
      }
      if (e.type === 'knight') {
        spr(SPR.helmet, x, top + 4 * s, { scale: s, white });
        drawShield(e, x, y - 2 * s, s);
      }
      break; }
    case 'draugr': {
      const { d, flip } = dirOf(e.fx, e.fy);
      shadowAt(x, y + 6, 1);
      const behind = e.fy < -0.5 && Math.abs(e.fx) < 0.6;
      if (behind) drawShield(e, x, y - 4, 1);
      spr(SPR[`draugr_${d === 'up' ? 'down' : d}_${f}${flip ? '_f' : ''}`], x, y + 7, { white });
      if (!behind) drawShield(e, x, y - 4, 1);
      break; }
    case 'wisp': {
      const g = 0.6 + 0.4 * Math.sin(G.t * 6 + e.wob);
      const gr = ctx.createRadialGradient(x, y, 0, x, y, 12); gr.addColorStop(0, `rgba(160,230,255,${0.55 * g})`); gr.addColorStop(1, 'rgba(160,230,255,0)');
      ctx.fillStyle = gr; ctx.fillRect(x - 12, y - 12, 24, 24);
      R(x - 3, y - 3, 6, 6, e.flash > 0 ? '#fff' : '#dff6ff'); R(x - 2, y - 4, 4, 1, '#dff6ff'); R(x - 1, y - 6 - Math.round(g * 2), 2, 2, '#bfeaff');
      R(x - 2, y - 1, 1, 2, '#123'); R(x + 1, y - 1, 1, 2, '#123');
      break; }
    case 'bat':
      shadowAt(x, y + 10, 0.6);
      spr(SPR['bat_' + (Math.floor(G.t * 10 + e.wob) % 2)], x, y + 4, { white });
      break;
  }
  if (e.boss && e.alive) {
    const w = 60, bx = x - w / 2, by = y - (e.type === 'king' ? 54 : 40);
    R(bx - 1, by - 1, w + 2, 5, '#000'); R(bx, by, w * Math.max(0, e.hp / e.max), 3, '#e23');
  }
}
function drawShield(e, x, y, s) {
  const down = e.guardDown > 0;
  const ox = down ? -e.fy * 9 * s : e.fx * 7 * s, oy = down ? e.fx * 4 * s + 4 : e.fy * 5 * s;
  ctx.save(); ctx.translate(Math.round(x + ox), Math.round(y + oy));
  if (down) ctx.rotate(0.6);
  const img = SPR.shield, w = img.width * s * 0.9, h = img.height * s * 0.9;
  ctx.drawImage(e.flash > 0 ? whiteOf(img) : img, Math.round(-w / 2), Math.round(-h / 2), w, h);
  ctx.restore();
}
function drawStar(x, y) { R(x - 1, y - 3, 2, 6, '#ffe066'); R(x - 3, y - 1, 6, 2, '#ffe066'); R(x, y, 1, 1, '#fff'); }

function drawPerson(x, y, id, bob) {
  const b = Math.round(Math.sin(G.t * 2 + bob) * 0.6);
  shadowAt(x, y + 6, 1);
  const blink = (G.t + bob) % 3.6 < 0.13;
  spr(SPR['npc_' + id + (blink ? '_blink' : '')] || SPR.npc_sven, x, y + 7 + b);
}
const LOOKS = {
  bjarne: { shirt: '#3a7a4a', hair: '#e8e8e8', beard: true, hat: '#7a4a22' },
  astrid: { shirt: '#6b3fa0', hair: '#e8e8e8', long: true },
  lars: { shirt: '#b33a2e', hair: '#d9a441', beard: true },
  sven: { shirt: '#2f8a5a', hair: '#f2d27a' },
  ingrid: { shirt: '#2f5aa8', hair: '#a0522d', long: true, hat: '#e0c040' },
};

function drawItemIcon(id, x, y) {
  x = Math.round(x); y = Math.round(y);
  const ic = ITEMS[id] ? ITEMS[id].icon : id;
  if (ic !== 'homing' && drawIconSpr(ic, x, y)) return;
  switch (ic) {
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
    case 'hazard': return drawRedeyeEnemy(e, x, y);
    case 'npc':
      if (e.id === 'fluffy') { const b = Math.round(Math.sin(G.t * 3) * 2); ctx.globalAlpha = 0.75; spr(G.player.x < e.x ? SPR.fluffy_f : SPR.fluffy, x, y + 4 + b); ctx.globalAlpha = 1; return; }
      return drawPerson(x, y, e.id, e.bob);
    case 'sign': shadowAt(x, y + 6, 0.8); spr(SPR.sign, x, y + 7); break;
    case 'plaque': R(x - 7, y - 4, 14, 7, '#c08a50'); R(x - 6, y - 3, 12, 1, '#6b4322'); R(x - 6, y, 9, 1, '#6b4322'); break;
    case 'runestone': {
      shadowAt(x, y + 6, 1); spr(SPR.runestone, x, y + 7);
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 3); R(x - 1, y - 7, 2, 9, '#7fd4ff'); R(x - 3, y - 5, 6, 2, '#7fd4ff'); R(x - 3, y, 2, 2, '#7fd4ff'); R(x + 1, y + 2, 2, 2, '#7fd4ff'); ctx.globalAlpha = 1;
      break; }
    case 'chest': shadowAt(x, y + 6, 1.1); spr(e.open ? SPR.chest_open : SPR.chest, x, y + 6); break;
    case 'shop': drawItemIcon(e.item, x, y - 2); text(String(e.price), x, y + 12, '#fff', 'center'); break;
    case 'pickup': {
      if (e.life !== undefined && e.life < 2 && Math.floor(t * 10) % 2) break;
      if (e.underBush && tileAt(e.x, e.y) === 'b') break;
      if (e.what === 'qitem') { const b = Math.round(Math.sin(t * 4) * 1.5); shadowAt(x, y + 6, 0.7); drawItemIcon(e.id, x, y + b); if (Math.floor(t * 3) % 3 === 0) drawTwinkle(x + 6, y - 6 + b, 0); break; }
      const b = Math.round(Math.sin(t * 4 + e.x) * 1.5);
      if (e.what === 'heart') drawHeart(x - 3, y - 3 + b, 1);
      else if (e.what === 'kr1' || e.what === 'kr5' || e.what === 'krn') { drawIconSpr(e.what === 'kr5' || e.value >= 5 ? 'gold' : 'coin', x, y + b); }
      else if (false) { R(x - 3, y - 3 + b, 6, 6, (e.what === 'kr5' || e.value >= 5) ? '#ffd84a' : '#d0d6e0'); R(x - 1, y - 2 + b, 2, 4, (e.what === 'kr5' || e.value >= 5) ? '#a87a10' : '#8a92a0'); }
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
