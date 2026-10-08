// Owen, Jon, enemies, people and things.

// ---------- factory ----------
function makeEnt(d, x, y) {
  const s = G.save;
  const base = { x, y, def: d, kind: d.t };
  switch (d.t) {
    case 'start': return null;
    case 'runestone': return { ...base, solid: true, talk: true };
    case 'sign': case 'plaque': return { ...base, solid: true, talk: true };
    case 'sealed': if (d.opensWith && s.flags[d.opensWith]) return null; return { ...base, talk: true };
    case 'cargo': return { ...base, talk: true };
    case 'npc': return { ...base, solid: true, talk: true, id: d.id, bob: Math.random() * 6 };
    case 'shop': return { ...base, talk: true, item: d.item, price: d.price };
    case 'chest': if (d.needs && !s.flags[d.needs]) return null; return { ...base, solid: true, talk: true, open: !!s.flags['chest:' + d.id] };
    case 'piece': case 'container': return s.flags['got:' + d.id] ? null : { ...base, kind: 'pickup', what: d.t, id: d.id, permanent: true };
    case 'warp': return { ...base, portal: !!d.portal };
    case 'flight': return { ...base };
    case 'door': return { ...base, talk: true };
    case 'grave': return { ...base, talk: true };
    case 'stairs': return s.flags['grave_open'] ? { ...base, kind: 'warp' } : null;
    case 'qitem': return (s.flags['got:' + d.id] || (d.needs && !s.flags[d.needs])) ? null : { ...base, kind: 'pickup', what: 'qitem', id: d.id, underBush: !!d.underBush, permanent: true };
    case 'switch': return { ...base, solid: true, hittable: true, id: d.id, cd: 0 };
    case 'cart': return { ...base, kind: 'hazard', type: 'cart', dir: 1, wob: 0 };
    case 'runedoor': return s.flags[d.needs] ? { ...base, kind: 'warp' } : null;
    case 'tablet': return { ...base, solid: true, talk: true };
    case 'throne': return { ...base, solid: true, talk: true };
    case 'exchange': return { ...base, solid: true, talk: true };
    case 'taxi': return { ...base, solid: true, talk: true };
    case 'log': return s.flags['log_chopped'] ? null : makeLog(d, x, y);
    default: return makeEnemy(d.t, x, y);
  }
}
const ENEMY = {
  penguin: { hp: 2, r: 6, touch: 1, speed: 40 },
  draugr: { hp: 3, r: 6, touch: 1, speed: 18, shield: true },
  wisp: { hp: 1, r: 5, touch: 1, speed: 26, fly: true },
  bat: { hp: 1, r: 5, touch: 1, speed: 75, fly: true },
  knight: { hp: 5, r: 10, touch: 2, speed: 28, shield: true, boss: true },
  king: { hp: 10, r: 16, touch: 2, speed: 26, boss: true },
  imp: { hp: 2, r: 5, touch: 1, speed: 0 },
  attendant: { hp: 12, r: 8, touch: 2, speed: 0, boss: true },
  captain: { hp: 6, r: 10, touch: 2, speed: 24, shield: true, boss: true },
  hank: { hp: 10, r: 14, touch: 2, speed: 0, boss: true, fly: true },
  spore: { hp: 2, r: 6, touch: 1, speed: 0 },
  snowpeng: { hp: 2, r: 6, touch: 1, speed: 66 },
  guard: { hp: 4, r: 7, touch: 1, speed: 30, shield: true },
  slime: { hp: 3, r: 6, touch: 1, speed: 0 },
  beetle: { hp: 3, r: 7, touch: 1, speed: 26 },
};
function makeEnemy(type, x, y) {
  const d = ENEMY[type];
  if (!d) return null;
  return { x, y, kind: 'enemy', enemy: true, alive: true, type, ...d, max: d.hp, flash: 0, kx: 0, ky: 0, t: Math.random() * 2,
    st: ['king', 'knight', 'attendant', 'captain', 'hank'].includes(type) ? 'intro' : 'idle', fx: 0, fy: 1, wob: Math.random() * 6, tx: x, ty: y, bounces: 0, summoned: false };
}

// ---------- particles ----------
function puff(x, y, color = '#fff', n = 7) {
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = rnd(20, 60); G.fx.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, life: 0.4, color, size: 2 }); }
}
function updateFx(dt) {
  for (const f of G.fx) { f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt; if (f.grav) f.vy += f.grav * dt; else { f.vx *= 0.9; f.vy *= 0.9; } }
  G.fx = G.fx.filter(f => f.t < f.life);
}
function drawFx() {
  for (const f of G.fx) {
    if (f.kind === 'text') { text(f.label, f.x - G.cam.x, f.y - G.cam.y - f.t * 12, f.color, 'center'); continue; }
    if (f.kind === 'poof') { const img = POOF[Math.min(3, Math.floor(f.t / f.life * 4))], s = f.scale; ctx.drawImage(img, Math.round(f.x - G.cam.x - 12 * s), Math.round(f.y - G.cam.y - 12 * s), 24 * s, 24 * s); continue; }
    if (f.kind === 'whisper') { drawWhisper(f); continue; }
    if (f.kind === 'ghost') { drawDashGhost(f); continue; }
    if (f.kind === 'ring') { const k = f.t / f.life; ctx.strokeStyle = `rgba(255,120,90,${1 - k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(Math.round(f.x - G.cam.x), Math.round(f.y - G.cam.y), 8 + k * 120, 0, Math.PI * 2); ctx.stroke(); continue; }
    if (f.kind === 'ripple') { if (f.t < 0) continue; const k = f.t / f.life; ctx.strokeStyle = `rgba(220,240,255,${1 - k})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(Math.round(f.x - G.cam.x), Math.round(f.y - G.cam.y + 4), 4 + k * 14, 2 + k * 6, 0, 0, Math.PI * 2); ctx.stroke(); continue; }
    if (f.kind === 'leaf') { R(f.x - G.cam.x, f.y - G.cam.y, 2, 1, f.color); R(f.x - G.cam.x + 1, f.y - G.cam.y + 1, 1, 1, '#205818'); continue; }
    R(f.x - G.cam.x, f.y - G.cam.y, f.size, f.size, f.color);
  }
}
function ripple(x, y, delay = 0) { G.fx.push({ kind: 'ripple', x, y, vx: 0, vy: 0, t: -delay, life: 0.6 }); }
function leaves(x, y, colors) {
  for (let i = 0; i < 8; i++) G.fx.push({ kind: 'leaf', x: x + rnd(-5, 5), y: y + rnd(-5, 3), vx: rnd(-50, 50), vy: rnd(-90, -30), grav: 260, t: 0, life: 0.55, color: pick(colors) });
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
  p.dashCd = Math.max(0, (p.dashCd || 0) - dt);
  if (p.dashing > 0) return updateDash(dt);
  if (p.launching) {
    p.lp += dt / 0.7;
    const k = Math.min(p.lp, 1);
    p.x = p.from.x + (p.to.x - p.from.x) * k; p.y = p.from.y + (p.to.y - p.from.y) * k;
    if (p.lp >= 1) { p.launching = false; puff(p.x, p.y + 6, '#e8e0c8', 6); }
    return;
  }
  const v = inputVec();
  p.moving = !!(v.x || v.y);
  if (p.moving) { p.fx = v.x; p.fy = v.y; p.walk += dt * 14; }
  const onIce = tileAt(p.x, p.y) === 'i';
  p.boost = Math.max(0, (p.boost || 0) - dt);
  const spd = 72 * G.st.speed * (p.boost > 0 ? 1.4 : 1) * (p.dashing > 0 ? 1 : groundSpeed(p));
  if (onIce) { const k = Math.min(1, 2.2 * dt); p.vx += (v.x * spd * 1.1 - p.vx) * k; p.vy += (v.y * spd * 1.1 - p.vy) * k; }
  else { p.vx = v.x * spd; p.vy = v.y * spd; }
  const hit = tryMove(p, p.vx * dt, p.vy * dt, 5, 'player');
  if (onIce) {
    if (hit.hitX) p.vx *= -0.3; if (hit.hitY) p.vy *= -0.3;
    // skidding throws up frost
    if (Math.hypot(v.x * spd - p.vx, v.y * spd - p.vy) > 45 && Math.hypot(p.vx, p.vy) > 15 && Math.random() < 0.5)
      G.fx.push({ x: p.x + rnd(-3, 3), y: p.y + 6, vx: -p.vx * 0.2 + rnd(-10, 10), vy: rnd(-20, -5), t: 0, life: 0.35, color: Math.random() < 0.5 ? '#ffffff' : '#cfefff', size: 1 });
  }
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
    ripple(p.x, p.y); ripple(p.x, p.y, 0.15);
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
  updateSpinCharge(dt);
  if (p.cd > 0) return;
  if (just('a')) {
    const f = facing4(p), px = p.x + f.x * 13, py = p.y + f.y * 13;
    const target = G.ents.find(e => e.talk && Math.abs(e.x - px) < 11 && Math.abs(e.y - py) < 11);
    if (target) return interact(target);
    if (tileAt(px, py) === 'D' && G.mapId === 'overworld') return say(STORY.house);
    if (G.jon.mode === 'follow') { G.jon.swing(Math.atan2(p.fy, p.fx)); Sound.play('swing'); }
  } else if (just('b') && G.jon.mode === 'follow') {
    G.jon.throw(p.x, p.y, p.fx, p.fy); Sound.play('throw');
  } else if (just('dash')) {
    startDash();
  } else if (just('horn')) {
    blowHorn();
  } else if (just('c')) {
    castSpell();
  } else if (just('spell')) {
    cycleSpell();
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
  if (G.mode !== 'arena') jonOnHurt(from);
  if (from) { const d = Math.hypot(p.x - from.x, p.y - from.y) || 1; p.kx = (p.x - from.x) / d * 170; p.ky = (p.y - from.y) / d * 170; }
  if (p.hp > 0) return;
  // A Link to the Past death: Owen spins in place, then juice, voodoo or game over
  p.hp = 0; p.kx = p.ky = 0; G.state = 'dying'; G.dieT = 0; G.jon.mode = 'follow'; Sound.play('fall');
}
function updateDying(dt) {
  const p = G.player;
  G.dieT += dt;
  const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]], i = Math.floor(G.dieT / 0.07) % 4;
  if (G.dieT < 0.85) { p.fx = dirs[i][0]; p.fy = dirs[i][1]; return; }
  p.fx = 0; p.fy = 1;
  finishDeath();
}
function finishDeath() {
  const p = G.player, s = G.save;
  G.state = 'play';
  if (s.potions > 0) { s.potions--; p.hp = s.maxHp; p.inv = 2; Sound.play('heart'); if (jonHas('pep')) { p.boost = 6; return say([...STORY.juice, ['Jon', 'PEP TALK! You got this! Now RUN!']]); } return say(STORY.juice); }
  if (G.mode === 'arena') return arenaOver(false);
  if (!s.voodoo && s.voodoo2) { s.voodoo2 = false; p.hp = s.maxHp; p.inv = 2.5; puff(p.x, p.y, '#ffd84a', 16); Sound.play('secret'); return say([['Jon', 'Best friends forever means FOREVER. Get up!']]); }
  if (s.voodoo) { s.voodoo = false; p.hp = s.maxHp; p.inv = 2.5; puff(p.x, p.y, '#9a4dd9', 16); Sound.play('secret'); return say(STORY.revive); }
  G.state = 'over'; G.menuSel = 0;
}

function interact(e) {
  const s = G.save, p = G.player;
  p.cd = 0.2;
  switch (e.kind) {
    case 'sign': return say(STORY.signs[e.def.text] || [['', '...']]);
    case 'tablet': return readTablet(e);
    case 'exchange': return useExchange();
    case 'taxi': return useTaxi(e);
    case 'throne': return sitOnThrone();
    case 'log': return say([['Jon', 'That log isn\'t going to chop itself. Swing me! (Z)']]);
    case 'sealed': return say(STORY.signs[e.def.text]);
    case 'plaque': return say(STORY.plaque, () => setFlag('read_plaque'));
    case 'door': return startWarp(e.def.to, e.def.dest);
    case 'grave':
      if (flag('grave_open')) return say(STORY.grave_open);
      return say(STORY.grave, () => {
        setFlag('grave_open'); jonXP(15);
        const tx = Math.floor(e.x / T), ty = Math.floor(e.y / T);
        setTile(tx, ty, '>'); setFlag(`tile:${G.mapId}:${tx},${ty}:>`);
        G.ents = G.ents.filter(o => o !== e);
        G.ents.push({ kind: 'warp', x: e.x, y: e.y, def: MAPS[G.mapId].ents.find(d => d.t === 'stairs') });
        Sound.play('secret'); G.shake = 0.3; puff(e.x, e.y, '#c8c8d8', 14); writeSave();
      });
    case 'cargo':
      if (!flag('cargo')) { setFlag('cargo'); Sound.play('creep'); G.flash = 0.25; G.flashColor = '#5a0000'; return say(STORY.cargo); }
      if (!flag('d1done')) return say(STORY.cargo_later);
      if (flag('redeye_done')) return say(STORY.cargo_done);
      Sound.play('creep');
      return say(STORY.cargo_open, () => startWarp('redeye', [2, 7]));
    case 'runestone':
      p.hp = s.maxHp; s.voodoo = true; s.voodoo2 = jonHas('bff'); s.cp = { map: G.mapId, x: p.x, y: p.y }; writeSave(); Sound.play('save'); puff(e.x, e.y - 6, '#7fd4ff', 12);
      return say(STORY.saved);
    case 'npc': { const lines = npcLines(e.id), after = G.afterTalk; G.afterTalk = null; return say(lines, after); }
    case 'shop': return buy(e);
    case 'chest':
      if (e.open) return say([['', 'The chest is empty.']]);
      e.open = true; setFlag('chest:' + e.def.id); JT.queued = 'chest';
      return giveItem(e.def.item);
  }
}

function npcLines(id) {
  if (id === 'astrid') {
    if (!flag('met_astrid')) { setFlag('met_astrid'); G.save.kr += 30; return [...STORY.astrid_1, ['', 'Astrid gave you 30 kroner.']]; }
    return flag('d2done') ? STORY.astrid_4 : flag('d1done') ? STORY.astrid_3 : STORY.astrid_2;
  }
  if (id === 'sven') {
    if (!flag('met_astrid')) return flag('got:hp_forest') ? STORY.sven_2 : STORY.sven_1;
    if (!flag('quest_sven')) { setFlag('quest_sven'); return STORY.sven_quest; }
    if (flag('got:ship') && !flag('sven_done')) {
      setFlag('sven_done'); jonXP(20); G.save.kr += 30; G.save.potions = Math.min(3, G.save.potions + 1);
      return [...STORY.sven_thanks, ['', 'Sven gave you 30 kroner and a Lingonberry Juice!']];
    }
    if (!flag('sven_done')) return STORY.sven_waiting;
    return flag('got:hp_forest') ? STORY.sven_2 : STORY.sven_1;
  }
  if (id === 'fluffy') return flag('d2done') ? STORY.fluffy_after : flag('got:br_dash') || G.save.items.dash ? STORY.fluffy_2 : STORY.fluffy_1;
  if (id === 'bjarne') {
    if (!flag('quest_bjarne')) { setFlag('quest_bjarne'); return STORY.bjarne_quest; }
    if (flag('got:sheet') && !flag('bjarne_done')) {
      setFlag('bjarne_done'); jonXP(20);
      G.afterTalk = () => { setFlag('got:hp_bjarne'); giveItem('piece'); };
      return STORY.bjarne_thanks;
    }
    return flag('bjarne_done') ? STORY.bjarne_after : STORY.bjarne_waiting;
  }
  return STORY[id] || [['', '...']];
}

function buy(e) {
  const s = G.save, it = ITEMS[e.item];
  if (e.item === 'juice' && s.potions >= 3) return say([['Lars', 'You can only carry three bottles. Drink some first. Or die. Then it drinks itself.']]);
  const lim = magicBuyLimit(e.item); if (lim) return say([['Lars', lim]]);
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
    case 'sheet': case 'ship': break;
    case 'horn': s.items.horn = true; break;
    case 'dash': s.items.dash = true; break;
    case 'kr50': s.kr += 50; break;
    default: magicApplyItem(id);
  }
}
function giveItem(id, after) {
  applyItem(id);
  if (['homing', 'thunder', 'dash', 'horn', 'container', 'frost', 'fire', 'mend', 'bearclaw', 'boots', 'cloak', 'tooth'].includes(id)) jonXP(15); else jonXP(5);
  setJonFace('excited', 2.5);
  G.player.hold = { id, t: 1.1 };
  G.state = 'hold'; Sound.play('item');
  G.afterHold = () => say(ITEMS[id].lines, () => { if (after) after(); writeSave(); });
}

// ---------- Jon ----------
function makeJon() {
  const j = { x: 0, y: 0, mode: 'follow', vx: 0, vy: 0, trav: 0, hit: [], t: 0, st: 0, base: 0, spin: 0, quip: '', qt: 0, nq: 8 };
  j.swing = a => { j.mode = 'swing'; j.st = 0; j.base = a; j.hit = []; };
  j.throw = (x, y, fx, fy) => {
    j.mode = 'out'; j.x = x; j.y = y; j.trav = 0; j.hit = []; j.rico = false;
    if (Math.random() < 0.25) jonSay('thrown', { cooldown: 14 });
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
  if (j.mode === 'spin') updateSpin(dt);
  else if (j.mode === 'follow') {
    // asleep: he lies down next to Owen; excited: he hops
    const hop = jonFaceNow() === 'excited' ? -Math.abs(Math.sin(j.t * 9)) * 4 : 0;
    const tx = p.x + 10, ty = JT.asleep ? p.y + 2 : p.y - 14 + Math.sin(j.t * 3) * 2 + hop, k = Math.min(1, 8 * dt);
    j.x += (tx - j.x) * k; j.y += (ty - j.y) * k; j.spin += ((JT.asleep ? 1.4 : 0) - j.spin) * Math.min(1, 6 * dt);
  } else if (j.mode === 'swing') {
    j.st += dt;
    const k = j.st / (0.2 / G.st.atk), a = j.base + (-1.3 + 2.6 * k);
    j.x = p.x + Math.cos(a) * 15 * G.st.swing; j.y = p.y + Math.sin(a) * 15 * G.st.swing; j.spin = a + Math.PI / 2;
    jonHits(1, 11 * G.st.swing, p, 'swing');
    cutAt(j.x, j.y);
    if (k >= 1) j.mode = 'follow';
  } else if (j.mode === 'out') {
    if (j.target && (j.target.alive || j.target.hittable) && G.ents.includes(j.target)) {
      const dx = j.target.x - j.x, dy = j.target.y - j.y, d = Math.hypot(dx, dy) || 1, sp = 210 * G.st.atk;
      const k = Math.min(1, 9 * dt); j.vx += (dx / d * sp - j.vx) * k; j.vy += (dy / d * sp - j.vy) * k;
    }
    j.x += j.vx * dt; j.y += j.vy * dt; j.trav += Math.hypot(j.vx, j.vy) * dt; j.spin += dt * 22;
    jonHits(1, 9, j, 'throw');
    if (solidAt(j.x, j.y, 'jon') && Math.random() < 0.5) jonSay('wall', { cooldown: 15, face: 'worried' });
    if (cutAt(j.x, j.y) || j.trav > range || solidAt(j.x, j.y, 'jon')) { j.mode = 'back'; j.hit = []; }
  } else if (j.mode === 'back') {
    const dx = p.x - j.x, dy = p.y - j.y, d = Math.hypot(dx, dy) || 1;
    j.x += dx / d * 240 * G.st.atk * dt; j.y += dy / d * 240 * G.st.atk * dt; j.spin += dt * 22;
    jonHits(1, 9, j, 'throw');
    if (d < 9) j.mode = 'follow';
  }
  if (j.mode === 'out' || j.mode === 'back') {
    j.trail = (j.trail || []).concat([{ x: j.x, y: j.y, spin: j.spin }]).slice(-4);
  } else j.trail = [];
  if (j.mode === 'out' || j.mode === 'back') {
    for (const e of G.ents) if (e.kind === 'pickup' && dist(e, j) < 10) { e.x = j.x; e.y = j.y; }   // Jon fetches loot
  }
}
function jonHits(dmg, reach, from, how) {
  const j = G.jon;
  for (const e of G.ents.slice()) {
    if (j.hit.includes(e)) continue;
    if (e.hittable && dist(j, e) < reach + 6) { j.hit.push(e); if (e.onHit) e.onHit(); else hitSwitch(e); if (how === 'throw') j.mode = 'back'; continue; }
    if (!e.enemy || !e.alive) continue;
    if (dist(j, e) < reach + e.r) {
      j.hit.push(e);
      const blockedHit = damageEnemy(e, rollDamage(dmg), from, how);
      if (blockedHit && how === 'throw') j.mode = 'back';
      else if (!blockedHit && G.mode === 'arena') arenaOnHit(e);
      else if (!blockedHit && how === 'throw' && jonHas('ricochet') && !j.rico) {
        // Ricochet: bounce on to the nearest other enemy
        const next = G.ents.filter(o => o.enemy && o.alive && o !== e && !j.hit.includes(o) && dist(o, e) < 110).sort((a, b) => dist(a, e) - dist(b, e))[0];
        if (next) { j.rico = true; j.target = next; j.trav = 0; j.mode = 'out'; const d = dist(next, j) || 1; j.vx = (next.x - j.x) / d * 210; j.vy = (next.y - j.y) / d * 210; floatText(j.x, j.y - 8, 'RICOCHET', '#ffd84a'); }
      }
    }
  }
}
function cutAt(x, y) {
  const tx = Math.floor(x / T), ty = Math.floor(y / T), c = tile(tx, ty);
  if (!sameScreen(tx, ty)) return false;
  if (c === 'b') { setTile(tx, ty, SNOWY(tx, ty) ? 'n' : '.'); leaves(tx * T + 8, ty * T + 8, ['#58b840', '#a8e070', '#388828']); Sound.play('swing'); maybeDrop(tx * T + 8, ty * T + 8, 0.4); return true; }
  if (c === ',') { setTile(tx, ty, SNOWY(tx, ty) ? 'n' : '.'); leaves(tx * T + 8, ty * T + 8, ['#5fbb44', '#9ee064', '#2f7a2a']); maybeDrop(tx * T + 8, ty * T + 8, 0.12); if (Math.random() < 0.3) jonSay('grass', { cooldown: 45 }); return false; }
  if (c === 'O') { setTile(tx, ty, '_'); leaves(tx * T + 8, ty * T + 8, ['#b8784a', '#8a5432', '#e0a070']); Sound.play('kill'); maybeDrop(tx * T + 8, ty * T + 8, 0.6); return true; }
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
  if (snesDamageRule(e, how, jonHit)) return true;
  { const fz = frozenRule(e, how, jonHit); if (fz) dmg *= fz; }
  const dx = from.x - e.x, dy = from.y - e.y, d = Math.hypot(dx, dy) || 1;
  // Shields block a hit from the front, but the block knocks the shield aside for a moment:
  // hit-hit always works, and hitting from the side or back works right away.
  if (jonHit && e.shield && !(e.guardDown > 0) && (dx / d * e.fx + dy / d * e.fy) > 0.55 && e.st !== 'charge') {
    Sound.play('clank'); puff(e.x + e.fx * 8, e.y + e.fy * 8, '#ffd84a', 4);
    e.guardDown = 1.1; e.kx = -dx / d * 110; e.ky = -dy / d * 110;
    floatText(e.x, e.y - 18, 'STAGGER!', '#ffd84a');
    return true;
  }
  if (e.type === 'hank' && e.frozen) {
    if (how === 'thunder') { shatterFrost(e); dmg = 2; }
    else { if (jonHit) { Sound.play('clank'); floatText(e.x, e.y - 50, 'FROZEN', '#9fe0ff'); } return true; }
  }
  if ((e.type === 'king' || e.type === 'attendant') && e.st !== 'daze' && how !== 'thunder') {
    if (jonHit) { Sound.play('clank'); floatText(e.x, e.y - 30, 'CLANK', '#ffd84a'); }
    return true;
  }
  if ((e.type === 'king' || e.type === 'attendant') && how === 'thunder') { e.st = 'daze'; e.t = 0; dmg = 2; }
  e.hp -= dmg; e.flash = 0.18; Sound.play('hit');
  floatText(e.x, e.y - 12, String(Math.round(dmg * 10) / 10), G.lastCrit ? '#ffd84a' : '#fff');
  const k = (e.boss ? 60 : 150) * G.st.knock; e.kx = -dx / d * k; e.ky = -dy / d * k;
  if (e.hp <= 0) killEnemy(e);
  return false;
}
function killEnemy(e) {
  e.alive = false;
  G.ents = G.ents.filter(o => o !== e);
  poof(e.x, e.y, e.boss); Sound.play('kill');
  snesOnKill(e); awesomeOnKill(e);
  if (G.mode !== 'arena') hitStop(e.boss ? 0.28 : 0.05);
  const s = G.save;
  if (s.items.thunder) s.rune = Math.min(RUNE_MAX, s.rune + G.st.runeKill);
  if (G.mode === 'arena') return arenaKill(e);
  jonXP(e.boss ? 25 : e.shield ? 3 : 2); jonOnKill(e);
  if (e.boss) JT.queued = 'boss';
  if (!e.boss) maybeDrop(e.x, e.y, 0.65);
  if (e.type === 'king') { G.shake = 0.6; say(STORY.king_down, checkRoomClear); return; }
  if (e.type === 'hank') { G.shake = 0.6; HK.axes = []; for (const w of G.ents.filter(o => o.type === 'wisp')) killEnemy(w); say(STORY.hank_down, () => { setFlag('d2done'); checkRoomClear(); writeSave(); }); return; }
  if (e.type === 'attendant') { G.shake = 0.6; RE.shots = []; say(STORY.attendant_down, () => { setFlag('redeye_done'); checkRoomClear(); }); return; }
  checkRoomClear();
}
function maybeDrop(x, y, chance) {
  if (Math.random() > chance * (1 + G.st.luck)) return;
  const r = Math.random();
  const what = r < 0.33 ? 'heart' : r < 0.7 ? 'kr1' : r < 0.85 ? 'kr5' : r < 0.95 ? 'rune' : 'salmon';
  G.ents.push({ kind: 'pickup', what, x, y, life: 9 });
}
function spawnEnemy(type, x, y) { const e = makeEnemy(type, x, y); e.st = 'idle'; G.ents.push(e); puff(x, y, '#cfe8ff', 8); G.roomEnemies = true; }

function updateEnemy(e, dt) {
  e.flash = Math.max(0, e.flash - dt); e.wob += dt * 8; e.t += dt;
  if (e.guardDown > 0) { e.guardDown -= dt; if (e.type === 'draugr' || e.type === 'knight' || e.type === 'captain') { const kl0 = Math.hypot(e.kx, e.ky); if (kl0 > 1) { tryMove(e, e.kx * dt, e.ky * dt, e.r * 0.6, 'walker'); e.kx *= 0.85; e.ky *= 0.85; } return; } }
  const p = G.player, dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
  const who = e.fly ? 'flyer' : 'walker', mr = e.r * 0.6;
  const kl = Math.hypot(e.kx, e.ky);
  if (kl > 1) { tryMove(e, e.kx * dt, e.ky * dt, mr, who); const nl = Math.max(0, kl - 420 * dt); e.kx *= nl / kl; e.ky *= nl / kl; }
  const toward = sp => tryMove(e, dx / d * sp * dt, dy / d * sp * dt, mr, who);
  if (e.fear > 0) { e.fear -= dt; tryMove(e, -dx / d * 70 * dt, -dy / d * 70 * dt, mr, who); return; }   // Demon Horn
  switch (e.type) {
    case 'imp': updateImp(e, dt, dx, dy, d, mr); break;
    case 'attendant': updateAttendant(e, dt, dx, dy, d, mr); break;
    case 'penguin':
      if (kingOwenRules(e)) break;
      if (d < 120 || e.aggro) { toward(e.speed); e.fx = dx / d; e.fy = dy / d; }
      break;
    case 'snowpeng': updateSnowPeng(e, dt, dx, dy, d, mr); break;
    case 'guard': updateGuard(e, dt, dx, dy, d, mr); break;
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
    case 'hank': updateHank(e, dt, dx, dy, d); break;
    case 'spore': updateSpore(e, dt, dx, dy, d); break;
    case 'slime': updateSlime(e, dt, dx, dy, d, mr); break;
    case 'beetle': updateBeetle(e, dt, dx, dy, d, mr); break;
    case 'knight': case 'captain':
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
  if (d < e.r + 5 && e.st !== 'daze' && !(e.flipped > 0) && !e.bow && !(e.type === 'attendant' && (e.st === 'hide' || e.st === 'intro'))) hurtPlayer(e.touch, e);
}

function updatePickup(e, dt) {
  if (e.life !== undefined) { e.life -= dt; if (e.life <= 0) { G.ents = G.ents.filter(o => o !== e); return; } }
  if (e.underBush && tileAt(e.x, e.y) === 'b') return;   // still hidden under its bush
  const dp = dist(e, G.player);
  if ((G.mode === 'arena' || G.st.pickup > 28) && e.kind === 'pickup' && e.what !== 'qitem' && (dp < G.st.pickup || e.magnet)) { const k = Math.min(1, 9 * dt); e.x += (G.player.x - e.x) * k; e.y += (G.player.y - e.y) * k; }
  if (dp > 11) return;
  G.ents = G.ents.filter(o => o !== e);
  const s = G.save, p = G.player;
  switch (e.what) {
    case 'heart': p.hp = Math.min(s.maxHp, p.hp + 2); Sound.play('heart'); break;
    case 'kr1': s.kr += 1; Sound.play('coin'); break;
    case 'kr5': s.kr += 5; Sound.play('coin'); break;
    case 'krn': s.kr += e.value; Sound.play('coin'); break;
    case 'rune': s.rune = Math.min(RUNE_MAX, s.rune + 4); Sound.play('heart'); break;
    case 'salmon': addToBag('salmon'); Sound.play('coin'); floatText(p.x, p.y - 18, 'Salmon!', '#ff8a6a'); break;
    case 'piece': case 'container':
      setFlag('got:' + e.id);
      giveItem(e.what);
      break;
    case 'qitem':
      setFlag('got:' + e.id);
      giveItem(e.id);
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
