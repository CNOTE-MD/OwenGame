// Owen, Jon, enemies, people and things.

// ---------- factory ----------
function makeEnt(d, x, y) {
  const s = G.save;
  const base = { x, y, def: d, kind: d.t };
  switch (d.t) {
    case 'start': return null;
    case 'runestone': return { ...base, solid: true, talk: true };
    case 'sign': case 'plaque': return { ...base, solid: true, talk: true };
    case 'sealed': case 'cargo': return { ...base, talk: true };
    case 'npc': return { ...base, solid: true, talk: true, id: d.id, bob: Math.random() * 6 };
    case 'shop': return { ...base, talk: true, item: d.item, price: d.price };
    case 'chest': return { ...base, solid: true, talk: true, open: !!s.flags['chest:' + d.id] };
    case 'piece': case 'container': return s.flags['got:' + d.id] ? null : { ...base, kind: 'pickup', what: d.t, id: d.id, permanent: true };
    case 'warp': return { ...base, portal: !!d.portal };
    case 'flight': return { ...base };
    case 'switch': return { ...base, solid: true, hittable: true, id: d.id, cd: 0 };
    default: return makeEnemy(d.t, x, y);
  }
}
const ENEMY = {
  penguin: { hp: 2, r: 6, touch: 1, speed: 40 },
  draugr: { hp: 4, r: 6, touch: 2, speed: 20, shield: true },
  wisp: { hp: 1, r: 5, touch: 1, speed: 26, fly: true },
  bat: { hp: 1, r: 5, touch: 1, speed: 75, fly: true },
  knight: { hp: 7, r: 9, touch: 2, speed: 30, shield: true, boss: true },
  king: { hp: 10, r: 14, touch: 2, speed: 26, boss: true },
};
function makeEnemy(type, x, y) {
  const d = ENEMY[type];
  if (!d) return null;
  return { x, y, kind: 'enemy', enemy: true, alive: true, type, ...d, max: d.hp, flash: 0, kx: 0, ky: 0, t: Math.random() * 2,
    st: type === 'king' || type === 'knight' ? 'intro' : 'idle', fx: 0, fy: 1, wob: Math.random() * 6, tx: x, ty: y, bounces: 0, summoned: false };
}

// ---------- particles ----------
function puff(x, y, color = '#fff', n = 7) {
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = rnd(20, 60); G.fx.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, life: 0.4, color, size: 2 }); }
}
function updateFx(dt) {
  for (const f of G.fx) { f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.9; f.vy *= 0.9; }
  G.fx = G.fx.filter(f => f.t < f.life);
}
function drawFx() {
  for (const f of G.fx) {
    if (f.kind === 'text') { text(f.label, f.x - G.cam.x, f.y - G.cam.y - f.t * 12, f.color, 'center'); continue; }
    R(f.x - G.cam.x, f.y - G.cam.y, f.size, f.size, f.color);
  }
}
function floatText(x, y, label, color = '#fff') { G.fx.push({ kind: 'text', x, y, vx: 0, vy: 0, t: 0, life: 0.9, label, color }); }

// ---------- Owen ----------
function makePlayer() {
  return { x: 0, y: 0, vx: 0, vy: 0, fx: 0, fy: 1, hp: G.save.hp, inv: 0, cd: 0, kx: 0, ky: 0, walk: 0,
    launching: false, lp: 0, from: null, to: null, falling: 0, bump: 0, hold: null };
}
const facing4 = p => Math.abs(p.fx) > Math.abs(p.fy) ? { x: Math.sign(p.fx), y: 0 } : { x: 0, y: Math.sign(p.fy) || 1 };

function updatePlayer(dt) {
  const p = G.player, s = G.save;
  p.inv = Math.max(0, p.inv - dt); p.cd = Math.max(0, p.cd - dt); p.bump = Math.max(0, p.bump - dt);
  if (p.falling > 0) {
    p.falling -= dt;
    if (p.falling <= 0) {
      p.x = G.entry.x; p.y = G.entry.y; p.vx = p.vy = 0;
      hurtPlayer(1, null, true);
      if (!flag('tip:pit')) { setFlag('tip:pit'); say(STORY.pit_first); }
    }
    return;
  }
  if (p.launching) {
    p.lp += dt / 0.7;
    const k = Math.min(p.lp, 1);
    p.x = p.from.x + (p.to.x - p.from.x) * k; p.y = p.from.y + (p.to.y - p.from.y) * k;
    if (p.lp >= 1) p.launching = false;
    return;
  }
  const v = inputVec();
  if (v.x || v.y) { p.fx = v.x; p.fy = v.y; p.walk += dt * 10; }
  const onIce = tileAt(p.x, p.y) === 'i';
  const spd = 72 * G.st.speed;
  if (onIce) { const k = Math.min(1, 2.2 * dt); p.vx += (v.x * spd * 1.1 - p.vx) * k; p.vy += (v.y * spd * 1.1 - p.vy) * k; }
  else { p.vx = v.x * spd; p.vy = v.y * spd; }
  const hit = tryMove(p, p.vx * dt, p.vy * dt, 5, 'player');
  if (onIce) { if (hit.hitX) p.vx *= -0.3; if (hit.hitY) p.vy *= -0.3; }
  const kl = Math.hypot(p.kx, p.ky);
  if (kl > 1) { tryMove(p, p.kx * dt, p.ky * dt, 5, 'player'); const nl = Math.max(0, kl - 520 * dt); p.kx *= nl / kl; p.ky *= nl / kl; }

  // doors that need keys
  if (v.x || v.y) {
    const f = facing4(p), c = tileAt(p.x + f.x * 9, p.y + f.y * 9);
    if ((c === 'L' || c === 'K') && p.bump <= 0) tryUnlock(Math.floor((p.x + f.x * 9) / T), Math.floor((p.y + f.y * 9) / T), c);
  }
  const here = tileAt(p.x, p.y);
  if (here === '~') {
    p.launching = true; p.lp = 0; p.from = { x: p.x, y: p.y }; p.to = nearestDry(p.x, p.y); p.inv = 1.2;
    G.jon.mode = 'follow'; Sound.play('splash'); puff(p.x, p.y, '#bfe0ff', 10);
    floatText(p.x, p.y - 20, 'Lady of the Lake!', '#bfe0ff');
    return;
  }
  if (here === 'v') { p.falling = 0.6; Sound.play('fall'); return; }

  // warps and triggers
  for (const e of G.ents) {
    if (e.kind === 'warp' && Math.abs(e.x - p.x) < 8 && Math.abs(e.y - p.y) < 8) return startWarp(e.def.to, e.def.dest);
    if (e.kind === 'flight' && Math.abs(e.x - p.x) < 9 && Math.abs(e.y - p.y) < 10) return startFlight();
  }

  // actions
  if (p.cd > 0) return;
  if (just('a')) {
    const f = facing4(p), px = p.x + f.x * 13, py = p.y + f.y * 13;
    const target = G.ents.find(e => e.talk && Math.abs(e.x - px) < 11 && Math.abs(e.y - py) < 11);
    if (target) return interact(target);
    if (tileAt(px, py) === 'D' && G.mapId === 'overworld') return say(STORY.house);
    if (G.jon.mode === 'follow') { G.jon.swing(Math.atan2(p.fy, p.fx)); Sound.play('swing'); }
  } else if (just('b') && G.jon.mode === 'follow') {
    G.jon.throw(p.x, p.y, p.fx, p.fy); Sound.play('throw');
  } else if (just('c')) {
    if (!s.items.thunder) floatText(p.x, p.y - 18, 'No rune yet', '#aab');
    else if (s.rune < RUNE_MAX) { floatText(p.x, p.y - 18, 'Rune not full', '#7fd4ff'); }
    else startThunder();
  }
}

function tryUnlock(tx, ty, c) {
  const s = G.save, p = G.player;
  p.bump = 0.6;
  if (c === 'L' && !(s.keys[G.mapId] > 0)) return say(STORY.locked);
  if (c === 'K' && !s.bigkeys[G.mapId]) return say(STORY.bossdoor);
  if (c === 'L') s.keys[G.mapId]--;
  // open the whole door (both tiles, both sides)
  const q = [[tx, ty]], seen = new Set();
  while (q.length) {
    const [x, y] = q.pop(); const k = x + ',' + y;
    if (seen.has(k) || tile(x, y) !== c) continue;
    seen.add(k); setTile(x, y, '_'); setFlag(`open:${G.mapId}:${x},${y}`);
    q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  Sound.play('door'); puff(tx * T + 8, ty * T + 8, '#ffd84a');
}

function hurtPlayer(dmg, from, force) {
  const p = G.player, s = G.save;
  if (!force && (p.inv > 0 || p.launching || p.falling > 0 || G.state !== 'play')) return;
  if (!force && G.st.armor > 0 && Math.random() < Math.min(0.6, G.st.armor * 0.1)) { p.inv = 0.4; floatText(p.x, p.y - 18, 'BLOCK', '#9fd0ff'); Sound.play('clank'); return; }
  p.hp -= dmg; p.inv = 1; Sound.play('hurt'); G.shake = 0.15;
  if (from) { const d = Math.hypot(p.x - from.x, p.y - from.y) || 1; p.kx = (p.x - from.x) / d * 170; p.ky = (p.y - from.y) / d * 170; }
  if (p.hp > 0) return;
  if (s.potions > 0) { s.potions--; p.hp = s.maxHp; p.inv = 2; Sound.play('heart'); return say(STORY.juice); }
  if (G.mode === 'arena') { p.hp = 0; return arenaOver(false); }
  if (s.voodoo) { s.voodoo = false; p.hp = s.maxHp; p.inv = 2.5; puff(p.x, p.y, '#9a4dd9', 16); Sound.play('secret'); return say(STORY.revive); }
  p.hp = 0; G.state = 'over'; G.menuSel = 0;
}

function interact(e) {
  const s = G.save, p = G.player;
  p.cd = 0.2;
  switch (e.kind) {
    case 'sign': return say(STORY.signs[e.def.text] || [['', '...']]);
    case 'sealed': return say(STORY.signs[e.def.text]);
    case 'plaque': return say(STORY.plaque, () => setFlag('read_plaque'));
    case 'cargo':
      if (!flag('cargo')) { setFlag('cargo'); Sound.play('creep'); G.flash = 0.25; G.flashColor = '#5a0000'; return say(STORY.cargo); }
      return say(STORY.cargo_later);
    case 'runestone':
      p.hp = s.maxHp; s.voodoo = true; s.cp = { map: G.mapId, x: p.x, y: p.y }; writeSave(); Sound.play('save'); puff(e.x, e.y - 6, '#7fd4ff', 12);
      return say(STORY.saved);
    case 'npc': return say(npcLines(e.id));
    case 'shop': return buy(e);
    case 'chest':
      if (e.open) return say([['', 'The chest is empty.']]);
      e.open = true; setFlag('chest:' + e.def.id);
      return giveItem(e.def.item);
  }
}

function npcLines(id) {
  if (id === 'astrid') {
    if (!flag('met_astrid')) { setFlag('met_astrid'); G.save.kr += 30; return [...STORY.astrid_1, ['', 'Astrid gave you 30 kroner.']]; }
    return flag('d1done') ? STORY.astrid_3 : STORY.astrid_2;
  }
  if (id === 'sven') return flag('got:hp_forest') ? STORY.sven_2 : STORY.sven_1;
  return STORY[id] || [['', '...']];
}

function buy(e) {
  const s = G.save, it = ITEMS[e.item];
  if (e.item === 'juice' && s.potions >= 3) return say([['Lars', 'You can only carry three bottles. Drink some first. Or die. Then it drinks itself.']]);
  if (s.kr < e.price) return say([['Lars', `${it.name} costs ${e.price} kroner. You have ${s.kr}. Cut more bushes!`]]);
  s.kr -= e.price; Sound.play('coin');
  applyItem(e.item);
  say([['Lars', `One ${it.name}. Takk!`], ...it.lines]);
}

const RUNE_MAX = 16;
function applyItem(id) {
  const s = G.save, p = G.player;
  switch (id) {
    case 'key': s.keys[G.mapId] = (s.keys[G.mapId] || 0) + 1; break;
    case 'bigkey': s.bigkeys[G.mapId] = true; break;
    case 'homing': s.items.homing = true; break;
    case 'thunder': s.items.thunder = true; s.rune = RUNE_MAX; break;
    case 'piece': s.pieces++; if (s.pieces >= 4) { s.pieces = 0; s.maxHp += 2; p.hp = s.maxHp; } break;
    case 'container': s.maxHp += 2; p.hp = s.maxHp; break;
    case 'kr20': s.kr += 20; break;
    case 'juice': s.potions++; break;
    case 'shard': s.rune = RUNE_MAX; break;
    case 'heart3': p.hp = s.maxHp; break;
  }
}
function giveItem(id, after) {
  applyItem(id);
  G.player.hold = { id, t: 1.1 };
  G.state = 'hold'; Sound.play('item');
  G.afterHold = () => say(ITEMS[id].lines, () => { if (after) after(); writeSave(); });
}

// ---------- Jon ----------
function makeJon() {
  const j = { x: 0, y: 0, mode: 'follow', vx: 0, vy: 0, trav: 0, hit: [], t: 0, st: 0, base: 0, spin: 0, quip: '', qt: 0, nq: 8 };
  j.swing = a => { j.mode = 'swing'; j.st = 0; j.base = a; j.hit = []; };
  j.throw = (x, y, fx, fy) => {
    j.mode = 'out'; j.x = x; j.y = y; j.trav = 0; j.hit = [];
    const l = Math.hypot(fx, fy) || 1, sp = 200 * G.st.atk; j.vx = fx / l * sp; j.vy = fy / l * sp;
    j.target = G.save.items.homing ? findTarget(x, y, fx / l, fy / l) : null;
  };
  return j;
}
function findTarget(x, y, fx, fy) {
  let best = null, bd = 1e9;
  for (const e of G.ents) {
    if (!((e.enemy && e.alive) || e.hittable)) continue;
    const dx = e.x - x, dy = e.y - y, d = Math.hypot(dx, dy);
    if (d > 200) continue;
    const score = d - (dx * fx + dy * fy) * 0.6;   // prefer things in front
    if (score < bd) { bd = score; best = e; }
  }
  return best;
}
function updateJon(dt) {
  const j = G.jon, p = G.player;
  j.t += dt;
  const range = (G.save.items.homing ? 175 : 88) * G.st.range;
  if (j.mode === 'follow') {
    const tx = p.x + 10, ty = p.y - 14 + Math.sin(j.t * 3) * 2, k = Math.min(1, 8 * dt);
    j.x += (tx - j.x) * k; j.y += (ty - j.y) * k; j.spin = 0;
  } else if (j.mode === 'swing') {
    j.st += dt;
    const k = j.st / (0.2 / G.st.atk), a = j.base + (-1.3 + 2.6 * k);
    j.x = p.x + Math.cos(a) * 15; j.y = p.y + Math.sin(a) * 15; j.spin = a + Math.PI / 2;
    jonHits(1, 11, p, 'swing');
    cutAt(j.x, j.y);
    if (k >= 1) j.mode = 'follow';
  } else if (j.mode === 'out') {
    if (j.target && (j.target.alive || j.target.hittable) && G.ents.includes(j.target)) {
      const dx = j.target.x - j.x, dy = j.target.y - j.y, d = Math.hypot(dx, dy) || 1, sp = 210 * G.st.atk;
      const k = Math.min(1, 9 * dt); j.vx += (dx / d * sp - j.vx) * k; j.vy += (dy / d * sp - j.vy) * k;
    }
    j.x += j.vx * dt; j.y += j.vy * dt; j.trav += Math.hypot(j.vx, j.vy) * dt; j.spin += dt * 22;
    jonHits(1, 9, j, 'throw');
    if (cutAt(j.x, j.y) || j.trav > range || solidAt(j.x, j.y, 'jon')) { j.mode = 'back'; j.hit = []; }
  } else if (j.mode === 'back') {
    const dx = p.x - j.x, dy = p.y - j.y, d = Math.hypot(dx, dy) || 1;
    j.x += dx / d * 240 * G.st.atk * dt; j.y += dy / d * 240 * G.st.atk * dt; j.spin += dt * 22;
    jonHits(1, 9, j, 'throw');
    if (d < 9) j.mode = 'follow';
  }
  if (j.mode === 'out' || j.mode === 'back') {
    for (const e of G.ents) if (e.kind === 'pickup' && dist(e, j) < 10) { e.x = j.x; e.y = j.y; }   // Jon fetches loot
  }
  j.nq -= dt; j.qt = Math.max(0, j.qt - dt);
  if (j.nq <= 0) { j.nq = rnd(12, 20); j.quip = pick(STORY.quips); j.qt = 2.5; }
}
function jonHits(dmg, reach, from, how) {
  const j = G.jon;
  for (const e of G.ents.slice()) {
    if (j.hit.includes(e)) continue;
    if (e.hittable && dist(j, e) < reach + 6) { j.hit.push(e); hitSwitch(e); if (how === 'throw') j.mode = 'back'; continue; }
    if (!e.enemy || !e.alive) continue;
    if (dist(j, e) < reach + e.r) {
      j.hit.push(e);
      const blockedHit = damageEnemy(e, rollDamage(dmg), from, how);
      if (blockedHit && how === 'throw') j.mode = 'back';
      else if (!blockedHit && G.mode === 'arena') arenaOnHit(e);
    }
  }
}
function cutAt(x, y) {
  const tx = Math.floor(x / T), ty = Math.floor(y / T), c = tile(tx, ty);
  if (!sameScreen(tx, ty)) return false;
  if (c === 'b') { setTile(tx, ty, '.'); puff(tx * T + 8, ty * T + 8, '#4fbf4a', 8); Sound.play('swing'); maybeDrop(tx * T + 8, ty * T + 8, 0.4); return true; }
  if (c === 'O') { setTile(tx, ty, '_'); puff(tx * T + 8, ty * T + 8, '#8a5a3a', 8); Sound.play('kill'); maybeDrop(tx * T + 8, ty * T + 8, 0.6); return true; }
  return false;
}
function hitSwitch(e) {
  if (e.cd > 0) return;
  e.cd = 0.5;
  const k = G.mapId + ':gates';
  if (!flag(k)) { setFlag(k); Sound.play('secret'); G.shake = 0.2; floatText(e.x, e.y - 14, 'Gates lowered!', '#ffb15c'); writeSave(); }
  else Sound.play('switch');
}

// damage with Owen's stats; crits double it
function rollDamage(base) {
  let d = base * G.st.dmg;
  if (G.st.crit > 0 && Math.random() < G.st.crit) { d *= 2; G.lastCrit = true; } else G.lastCrit = false;
  return d;
}

// ---------- enemies ----------
function damageEnemy(e, dmg, from, how) {
  // how: 'swing' | 'throw' (Jon), 'thunder' (Thunder Strike), 'magic' (arena weapons)
  const jonHit = how === 'swing' || how === 'throw';
  if (e.flash > 0.05 && jonHit) return false;
  const dx = from.x - e.x, dy = from.y - e.y, d = Math.hypot(dx, dy) || 1;
  if (jonHit && e.shield && (dx / d * e.fx + dy / d * e.fy) > 0.55 && e.st !== 'charge') { Sound.play('clank'); puff(e.x + e.fx * 8, e.y + e.fy * 8, '#ffd84a', 4); return true; }
  if (e.type === 'king' && e.st !== 'daze' && how !== 'thunder') {
    if (jonHit) { Sound.play('clank'); floatText(e.x, e.y - 30, 'CLANK', '#ffd84a'); }
    return true;
  }
  if (e.type === 'king' && how === 'thunder') { e.st = 'daze'; e.t = 0; dmg = 2; }
  e.hp -= dmg; e.flash = 0.18; Sound.play('hit');
  if (G.mode === 'arena') floatText(e.x, e.y - 12, String(Math.round(dmg * 10) / 10), G.lastCrit ? '#ffd84a' : '#fff');
  const k = (e.boss ? 60 : 150) * G.st.knock; e.kx = -dx / d * k; e.ky = -dy / d * k;
  if (e.hp <= 0) killEnemy(e);
  return false;
}
function killEnemy(e) {
  e.alive = false;
  G.ents = G.ents.filter(o => o !== e);
  puff(e.x, e.y, '#fff', e.boss ? 24 : 9); Sound.play('kill');
  const s = G.save;
  if (s.items.thunder) s.rune = Math.min(RUNE_MAX, s.rune + 1);
  if (G.mode === 'arena') return arenaKill(e);
  if (!e.boss) maybeDrop(e.x, e.y, 0.65);
  if (e.type === 'king') { G.shake = 0.6; say(STORY.king_down, checkRoomClear); return; }
  checkRoomClear();
}
function maybeDrop(x, y, chance) {
  if (Math.random() > chance) return;
  const r = Math.random();
  const what = r < 0.35 ? 'heart' : r < 0.75 ? 'kr1' : r < 0.9 ? 'kr5' : 'rune';
  G.ents.push({ kind: 'pickup', what, x, y, life: 9 });
}
function spawnEnemy(type, x, y) { const e = makeEnemy(type, x, y); e.st = 'idle'; G.ents.push(e); puff(x, y, '#cfe8ff', 8); G.roomEnemies = true; }

function updateEnemy(e, dt) {
  e.flash = Math.max(0, e.flash - dt); e.wob += dt * 8; e.t += dt;
  const p = G.player, dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
  const who = e.fly ? 'flyer' : 'walker', mr = e.r * 0.6;
  const kl = Math.hypot(e.kx, e.ky);
  if (kl > 1) { tryMove(e, e.kx * dt, e.ky * dt, mr, who); const nl = Math.max(0, kl - 420 * dt); e.kx *= nl / kl; e.ky *= nl / kl; }
  const toward = sp => tryMove(e, dx / d * sp * dt, dy / d * sp * dt, mr, who);
  switch (e.type) {
    case 'penguin':
      if (d < 120 || e.aggro) { toward(e.speed); e.fx = dx / d; e.fy = dy / d; }
      break;
    case 'draugr':
      // sluggish: only turns to face you every 0.8s, so circling behind works
      if (d < 110 || e.aggro) { if (e.t > 0.8) { e.t = 0; e.fx = dx / d; e.fy = dy / d; } tryMove(e, e.fx * e.speed * dt, e.fy * e.speed * dt, mr, who); }
      else { if (e.t > 2) { e.t = 0; e.tx = e.x + rnd(-30, 30); e.ty = e.y + rnd(-30, 30); }
        const ax = e.tx - e.x, ay = e.ty - e.y, al = Math.hypot(ax, ay); if (al > 2) { e.fx = ax / al; e.fy = ay / al; tryMove(e, ax / al * 14 * dt, ay / al * 14 * dt, mr, who); } }
      break;
    case 'wisp': {
      const a = e.t * 2.2;
      tryMove(e, (dx / d * e.speed + Math.cos(a) * 30) * dt, (dy / d * e.speed + Math.sin(a * 1.3) * 30) * dt, mr, who);
      break; }
    case 'bat':
      if (e.t > 0.7) { e.t = 0; e.tx = p.x + rnd(-40, 40); e.ty = p.y + rnd(-40, 40); }
      { const ax = e.tx - e.x, ay = e.ty - e.y, al = Math.hypot(ax, ay) || 1; tryMove(e, ax / al * e.speed * dt, ay / al * e.speed * dt, mr, who); }
      break;
    case 'knight':
      if (e.st === 'intro') { if (G.state === 'play') { e.st = 'chase'; e.t = 0; } break; }
      if (e.st === 'chase') { e.turnT = (e.turnT || 0) + dt; if (e.turnT > 0.5) { e.turnT = 0; e.fx = dx / d; e.fy = dy / d; } tryMove(e, e.fx * e.speed * dt, e.fy * e.speed * dt, mr, who); if (e.t > 2.8) { e.st = 'wind'; e.t = 0; } }
      else if (e.st === 'wind') { e.fx = dx / d; e.fy = dy / d; if (e.t > 0.5) { e.st = 'charge'; e.t = 0; Sound.play('charge'); } }
      else if (e.st === 'charge') { const h = tryMove(e, e.fx * 140 * dt, e.fy * 140 * dt, mr, who); if (e.t > 0.7 || h.hitX || h.hitY) { e.st = 'chase'; e.t = 0; } }
      break;
    case 'king':
      if (e.st === 'intro') { if (G.state === 'play') { e.st = 'waddle'; e.t = 0; } break; }
      if (!e.summoned && e.hp <= 5) {
        e.summoned = true;
        if (G.mode === 'arena') { arenaSpawn('penguin', e.x - 40, e.y); arenaSpawn('penguin', e.x + 40, e.y); }
        else { spawnEnemy('penguin', G.cam.x + 40, G.cam.y + 60); spawnEnemy('penguin', G.cam.x + VW - 40, G.cam.y + 60); }
      }
      if (e.st === 'waddle') { e.fx = dx / d; e.fy = dy / d; toward(e.speed); if (e.t > 2.2) { e.st = 'wind'; e.t = 0; Sound.play('charge'); } }
      else if (e.st === 'wind') { e.fx = dx / d; e.fy = dy / d; if (e.t > 0.6) { e.st = 'slide'; e.t = 0; e.bounces = 0; } }
      else if (e.st === 'slide') {
        const h = tryMove(e, e.fx * 190 * dt, e.fy * 190 * dt, mr, who);
        if (h.hitX) e.fx *= -1; if (h.hitY) e.fy *= -1;
        if (h.hitX || h.hitY) { e.bounces++; G.shake = 0.15; Sound.play('clank'); }
        if (e.bounces >= 3 || e.t > 4) { e.st = 'daze'; e.t = 0; }
      } else if (e.st === 'daze') { if (e.t > 2.2) { e.st = 'waddle'; e.t = 0; } }
      break;
  }
  if (d < e.r + 5 && e.st !== 'daze') hurtPlayer(e.touch, e);
}

function updatePickup(e, dt) {
  if (e.life !== undefined) { e.life -= dt; if (e.life <= 0) { G.ents = G.ents.filter(o => o !== e); return; } }
  const dp = dist(e, G.player);
  if (G.mode === 'arena' && (dp < G.st.pickup || e.magnet)) { const k = Math.min(1, 9 * dt); e.x += (G.player.x - e.x) * k; e.y += (G.player.y - e.y) * k; }
  if (dp > 11) return;
  G.ents = G.ents.filter(o => o !== e);
  const s = G.save, p = G.player;
  switch (e.what) {
    case 'heart': p.hp = Math.min(s.maxHp, p.hp + 2); Sound.play('heart'); break;
    case 'kr1': s.kr += 1; Sound.play('coin'); break;
    case 'kr5': s.kr += 5; Sound.play('coin'); break;
    case 'krn': s.kr += e.value; Sound.play('coin'); break;
    case 'rune': s.rune = Math.min(RUNE_MAX, s.rune + 4); Sound.play('heart'); break;
    case 'piece': case 'container':
      setFlag('got:' + e.id);
      giveItem(e.what);
      break;
  }
}

// ---------- thunder strike ----------
function startThunder() {
  G.save.rune = 0; G.state = 'thunder'; G.thunderT = 0; G.thunderHit = false;
  Sound.play('charge');
  G.jon.mode = 'follow';
}
function updateThunder(dt) {
  G.thunderT += dt;
  const j = G.jon, p = G.player;
  j.x += (p.x - j.x) * Math.min(1, 6 * dt); j.y += (p.y - 40 - j.y) * Math.min(1, 6 * dt);
  if (G.thunderT > 0.45 && !G.thunderHit) {
    G.thunderHit = true; G.flash = 0.35; G.flashColor = '#ffffff'; G.shake = 0.5; Sound.play('thunder');
    for (const e of G.ents.slice()) if (e.enemy && e.alive) damageEnemy(e, 4 * G.st.dmg, e, 'thunder');
    floatText(p.x, p.y - 50, 'THUNDER STRIKE!', '#ffe066');
  }
  if (G.thunderT > 1.3) G.state = 'play';
}
function drawLightning() {
  if (G.state !== 'thunder') return;
  const t = G.thunderT, j = G.jon;
  ctx.fillStyle = `rgba(10,10,40,${Math.min(0.6, t * 1.5)})`; ctx.fillRect(0, 0, VW, VH);
  if (t > 0.3 && t < 1.0) {
    const x0 = j.x - G.cam.x, y1 = j.y - G.cam.y;
    for (const [w, c] of [[5, 'rgba(127,212,255,0.5)'], [2, '#fff']]) {
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath();
      let x = x0 + rnd(-20, 20); ctx.moveTo(x, 0);
      for (let y = 0; y < y1; y += 12) { x = x0 + rnd(-10, 10) * (1 - y / y1); ctx.lineTo(x, y); }
      ctx.lineTo(x0, y1); ctx.stroke();
    }
    for (const e of G.ents) if (e.enemy && e.alive && t > 0.45 && t < 0.7) {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y1);
      ctx.lineTo((x0 + e.x - G.cam.x) / 2 + rnd(-8, 8), (y1 + e.y - G.cam.y) / 2 + rnd(-8, 8)); ctx.lineTo(e.x - G.cam.x, e.y - G.cam.y); ctx.stroke();
    }
  }
}
