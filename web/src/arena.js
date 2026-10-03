// Valhalla Arena: Brotato-style survival. 20 timed waves; spend kroner on cards between waves.
// Tuning lives in ARENA_CARDS, LEVEL_UPS and waveSpec(). Owen: add cards here.

const ARENA_WAVES = 20;
const ARENA_BEST_KEY = 'jontuka-arena-best';
const A = { wave: 0, t: 0, len: 0, spawnT: 0, kills: 0, xp: 0, lvl: 1, pendingLv: 0, owned: {}, cards: [], sel: 0,
  rerolls: 0, orbit: 0, frost: 0, chain: 0, turrets: [], pals: [], shots: [], bolts: [], regenT: 0, frostT: 0, marks: [], won: false, choices: [] };

const ARENA_CARDS = [
  { id: 'orbit', name: 'Ghost Jon', desc: 'A ghost axe circles you', price: 30, max: 4, apply: () => { A.orbit++; } },
  { id: 'frost', name: 'Frost Aura', desc: 'Freezes and hurts nearby enemies', price: 35, max: 3, apply: () => { A.frost++; } },
  { id: 'chain', name: 'Chain Lightning', desc: 'Jon hits can zap 3 more', price: 40, max: 3, apply: () => { A.chain++; } },
  { id: 'turret', name: 'Rune Turret', desc: 'A runestone that shoots', price: 35, max: 3, apply: () => { A.turrets.push({ x: 0, y: 0, cd: 0 }); placeTurrets(); } },
  { id: 'pal', name: 'Penguin Pal', desc: 'A good penguin. Slides at foes', price: 30, max: 2, apply: () => { A.pals.push({ x: G.player.x, y: G.player.y, cd: 1, dash: 0, dx: 0, dy: 0, wob: 0 }); } },
  { id: 'homing', name: 'Homing Jon', desc: 'Throws lock on, fly far', price: 25, max: 1, apply: () => { G.save.items.homing = true; } },
  { id: 'thunder', name: 'Thunder Rune', desc: 'C: strike all (full meter)', price: 45, max: 1, apply: () => { G.save.items.thunder = true; G.save.rune = RUNE_MAX; } },
  { id: 'juice', name: 'Lingonberry Juice', desc: 'Auto-revive once', price: 20, max: 3, apply: () => { G.save.potions++; } },
  { id: 'helmet', name: "Hank's Helmet", desc: '+1 armor (10% block)', price: 25, max: 5, apply: () => { G.st.armor++; } },
  { id: 'boots', name: 'Fjord Boots', desc: '+12% move speed', price: 20, max: 4, apply: () => { G.st.speed += 0.12; } },
  { id: 'magnet', name: 'Magnet Rune', desc: 'Grab kroner from farther', price: 15, max: 3, apply: () => { G.st.pickup += 14; } },
  { id: 'blood', name: 'Viking Blood', desc: '+25% damage', price: 30, max: 5, apply: () => { G.st.dmg += 0.25; } },
  { id: 'rushe', name: 'Rush E Sheet Music', desc: '+20% attack speed', price: 30, max: 4, apply: () => { G.st.atk += 0.2; } },
  { id: 'hammer', name: "Walter's Hammer", desc: '+10% crit, more knockback', price: 35, max: 3, apply: () => { G.st.crit += 0.1; G.st.knock += 0.25; } },
  { id: 'heart', name: 'Heart Container', desc: '+1 heart, heal', price: 30, max: 5, apply: () => { G.save.maxHp += 2; G.player.hp += 2; } },
  { id: 'herring', name: 'Pickled Herring', desc: '+1 regen', price: 20, max: 4, apply: () => { G.st.regen++; } },
];
const LEVEL_UPS = [
  { name: '+1 Heart', apply: () => { G.save.maxHp += 2; G.player.hp += 2; } },
  { name: '+12% Damage', apply: () => { G.st.dmg += 0.12; } },
  { name: '+10% Speed', apply: () => { G.st.speed += 0.1; } },
  { name: '+15% Attack Speed', apply: () => { G.st.atk += 0.15; } },
  { name: '+1 Regen', apply: () => { G.st.regen++; } },
  { name: '+5% Crit', apply: () => { G.st.crit += 0.05; } },
  { name: '+30% Pickup Range', apply: () => { G.st.pickup *= 1.3; } },
  { name: '+1 Armor', apply: () => { G.st.armor++; } },
  { name: '+15% Throw Range', apply: () => { G.st.range += 0.15; } },
];

function arenaBest() { try { return +localStorage.getItem(ARENA_BEST_KEY) || 0; } catch (e) { return 0; } }
function waveSpec(w) {
  const pool = ['penguin'];
  if (w >= 2) pool.push('bat');
  if (w >= 3) pool.push('wisp', 'penguin');
  if (w >= 4) pool.push('draugr');
  if (w >= 7) pool.push('draugr', 'bat');
  return {
    len: Math.min(18 + (w - 1) * 3, 45),
    every: Math.max(0.22, 1.2 - w * 0.055),
    batch: 1 + Math.floor(w / 6),
    pool,
    knightChance: w >= 6 ? 0.03 + w * 0.004 : 0,
    hpMul: 1 + 0.2 * (w - 1),
    touchAdd: Math.floor(w / 8),
    bosses: w === 20 ? 2 : (w % 5 === 0 ? 1 : 0),
  };
}

function startArena() {
  G.mode = 'arena';
  G.save = newSave(); G.save.voodoo = false; G.save.map = 'arena';
  G.st = baseStats();
  G.player = makePlayer(); G.jon = makeJon(); G.player.hp = G.save.maxHp;
  Object.assign(A, { wave: 0, kills: 0, xp: 0, lvl: 1, pendingLv: 0, owned: {}, orbit: 0, frost: 0, chain: 0, turrets: [], pals: [], shots: [], bolts: [], marks: [], won: false, rerolls: 0 });
  G.state = 'play';
  loadMap('arena', 16 * T, 14 * T + 8);
  G.cam = { x: 16 * T - VW / 2, y: 14 * T + 8 - VH / 2 };
  say([
    ['Jon', 'Welcome to VALHALLA ARENA! Chilly sends twenty waves of minions. We survive all twenty.'],
    ['Jon', 'Enemies drop kroner. Between waves we shop for upgrades. Level ups give free stats.'],
    ['Jon', 'Z swings me, X throws me. Enter pauses. Ready? Of course you are. You have ME.'],
  ], () => nextWave());
}

function nextWave() {
  A.wave++;
  const sp = waveSpec(A.wave);
  A.t = 0; A.len = sp.len; A.spawnT = 0.5; A.marks = []; A.shots = [];
  G.state = 'play';
  placeTurrets();
  G.banner = A.wave % 5 === 0 ? `WAVE ${A.wave} · BOSS` : `WAVE ${A.wave}`; G.bannerT = 1.6;
  if (sp.bosses) {
    Sound.play('boss');
    for (let i = 0; i < sp.bosses; i++) arenaSpawn('king', 16 * T + (i ? 80 : -80) * (sp.bosses > 1 ? 1 : 0), 9 * T, true);
  }
}
function placeTurrets() {
  const p = G.player, n = A.turrets.length;
  A.turrets.forEach((t, i) => { const a = (i / Math.max(1, n)) * Math.PI * 2; t.x = clamp(p.x + Math.cos(a) * 34, 24, G.cols * T - 24); t.y = clamp(p.y + Math.sin(a) * 34, 40, G.nrows * T - 24); });
}

function arenaSpawn(type, x, y, now) {
  if (!now) { A.marks.push({ type, x, y, t: 0.8 }); return; }
  const sp = waveSpec(Math.max(1, A.wave));
  const e = makeEnemy(type, x, y);
  e.aggro = true;
  if (e.st === 'intro') e.st = type === 'king' ? 'waddle' : 'chase';
  const mul = type === 'king' ? (1 + 0.5 * Math.floor(A.wave / 5 - 1)) * 2 : sp.hpMul;
  e.hp = e.max = e.hp * mul; e.touch += sp.touchAdd;
  G.ents.push(e);
  puff(x, y, '#cfe8ff', 6);
}
function randomSpawnPoint() {
  const p = G.player;
  for (let i = 0; i < 20; i++) {
    const x = rnd(2.5, G.cols - 2.5) * T, y = rnd(3, G.nrows - 2.5) * T;
    if (Math.hypot(x - p.x, y - p.y) > 70 && !solidAt(x, y, 'walker')) return { x, y };
  }
  return { x: 3 * T, y: 4 * T };
}

function arenaKill(e) {
  A.kills++;
  const val = { penguin: 1, bat: 1, wisp: 1, draugr: 2, knight: 5, king: 25 }[e.type] || 1;
  const n = Math.min(val, 5);
  for (let i = 0; i < n; i++) G.ents.push({ kind: 'pickup', what: 'krn', value: Math.ceil(val / n), x: e.x + rnd(-6, 6), y: e.y + rnd(-6, 6), life: 30 });
  if (Math.random() < 0.04) G.ents.push({ kind: 'pickup', what: 'heart', x: e.x, y: e.y, life: 10 });
  A.xp += e.type === 'king' ? 15 : e.type === 'knight' ? 4 : e.type === 'draugr' ? 2 : 1;
  while (A.xp >= xpNeed()) { A.xp -= xpNeed(); A.lvl++; A.pendingLv++; floatText(G.player.x, G.player.y - 24, 'LEVEL UP!', '#9be08a'); Sound.play('heart'); }
}
const xpNeed = () => 5 + A.lvl * 4;

function arenaOnHit(e) {
  if (!A.chain || Math.random() > 0.2 * A.chain) return;
  const near = G.ents.filter(o => o.enemy && o.alive && o !== e && dist(o, e) < 80).sort((a, b) => dist(a, e) - dist(b, e)).slice(0, 3);
  let from = e;
  for (const o of near) {
    A.bolts.push({ x1: from.x, y1: from.y, x2: o.x, y2: o.y, t: 0.15 });
    damageEnemy(o, rollDamage(0.8), from, 'magic');
    from = o;
  }
  if (near.length) Sound.play('switch');
}

function updateArena(dt) {
  const p = G.player, sp = waveSpec(A.wave);
  // camera follows Owen
  G.cam.x = clamp(p.x - VW / 2, 0, G.cols * T - VW); G.cam.y = clamp(p.y - VH / 2, 0, G.nrows * T - VH);
  A.t += dt;
  // regen
  if (G.st.regen > 0) { A.regenT += dt; if (A.regenT > 8 / G.st.regen) { A.regenT = 0; if (p.hp < G.save.maxHp) { p.hp++; floatText(p.x, p.y - 16, '+', '#9be08a'); } } }
  // spawning with warning marks
  A.spawnT -= dt;
  const alive = G.ents.filter(e => e.enemy && e.alive).length;
  if (A.spawnT <= 0 && A.t < A.len - 1 && alive < 55) {
    A.spawnT = sp.every;
    for (let i = 0; i < sp.batch; i++) {
      const pt = randomSpawnPoint();
      arenaSpawn(Math.random() < sp.knightChance ? 'knight' : pick(sp.pool), pt.x, pt.y);
    }
  }
  for (const m of A.marks) { m.t -= dt; if (m.t <= 0) arenaSpawn(m.type, m.x, m.y, true); }
  A.marks = A.marks.filter(m => m.t > 0);
  // Ghost Jons
  if (A.orbit) {
    for (let i = 0; i < A.orbit; i++) {
      const a = G.t * 3.2 + i * Math.PI * 2 / A.orbit, ox = p.x + Math.cos(a) * 28, oy = p.y + Math.sin(a) * 28;
      for (const e of G.ents) if (e.enemy && e.alive && Math.hypot(e.x - ox, e.y - oy) < e.r + 7 && !(e.orbCd > 0)) { e.orbCd = 0.5; damageEnemy(e, rollDamage(0.7), { x: ox, y: oy }, 'magic'); }
    }
  }
  for (const e of G.ents) if (e.orbCd > 0) e.orbCd -= dt;
  // Frost aura
  if (A.frost) {
    A.frostT += dt;
    const r = 34 + A.frost * 10;
    for (const e of G.ents) if (e.enemy && e.alive && dist(e, p) < r) e.slow = 0.3;
    if (A.frostT > 0.7) { A.frostT = 0; for (const e of G.ents.slice()) if (e.enemy && e.alive && dist(e, p) < r) damageEnemy(e, 0.35 * A.frost * G.st.dmg, p, 'magic'); }
  }
  // turrets
  for (const t of A.turrets) {
    t.cd -= dt;
    if (t.cd > 0) continue;
    const tgt = G.ents.filter(e => e.enemy && e.alive && dist(e, t) < 130).sort((a, b) => dist(a, t) - dist(b, t))[0];
    if (!tgt) continue;
    t.cd = 1.1 / G.st.atk;
    const d = dist(tgt, t) || 1;
    A.shots.push({ x: t.x, y: t.y - 6, vx: (tgt.x - t.x) / d * 170, vy: (tgt.y - t.y) / d * 170, life: 1.2 });
  }
  for (const s of A.shots) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    const hit = G.ents.find(e => e.enemy && e.alive && Math.hypot(e.x - s.x, e.y - s.y) < e.r + 3);
    if (hit) { s.life = 0; damageEnemy(hit, rollDamage(1), s, 'magic'); }
    if (solidAt(s.x, s.y, 'jon')) s.life = 0;
  }
  A.shots = A.shots.filter(s => s.life > 0);
  // Penguin Pals: waddle after Owen, belly-slide into the nearest enemy
  A.pals.forEach((pl, i) => {
    pl.wob += dt * 8; pl.cd -= dt;
    if (pl.dash > 0) {
      pl.dash -= dt; pl.x += pl.dx * 200 * dt; pl.y += pl.dy * 200 * dt;
      for (const e of G.ents) if (e.enemy && e.alive && Math.hypot(e.x - pl.x, e.y - pl.y) < e.r + 6 && !(e.palCd > 0)) { e.palCd = 0.4; damageEnemy(e, rollDamage(1.5), pl, 'magic'); }
    } else {
      const tx = p.x - 16 + i * 32, ty = p.y + 14;
      pl.x += (tx - pl.x) * Math.min(1, 4 * dt); pl.y += (ty - pl.y) * Math.min(1, 4 * dt);
      if (pl.cd <= 0) {
        const tgt = G.ents.filter(e => e.enemy && e.alive && dist(e, pl) < 120).sort((a, b) => dist(a, pl) - dist(b, pl))[0];
        if (tgt) { const d = dist(tgt, pl) || 1; pl.dx = (tgt.x - pl.x) / d; pl.dy = (tgt.y - pl.y) / d; pl.dash = 0.45; pl.cd = 2; }
      }
    }
    pl.x = clamp(pl.x, 20, G.cols * T - 20); pl.y = clamp(pl.y, 36, G.nrows * T - 20);
  });
  for (const e of G.ents) if (e.palCd > 0) e.palCd -= dt;
  for (const b of A.bolts) b.t -= dt;
  A.bolts = A.bolts.filter(b => b.t > 0);
  // wave over
  if (A.t >= A.len && !G.ents.some(e => e.enemy && e.alive && e.type === 'king')) endWave();
}

function endWave() {
  for (const e of G.ents.filter(e => e.enemy)) puff(e.x, e.y, '#fff', 4);
  G.ents = G.ents.filter(e => !e.enemy);
  for (const e of G.ents) if (e.kind === 'pickup' && e.what === 'krn') { G.save.kr += e.value; }
  G.ents = G.ents.filter(e => !(e.kind === 'pickup'));
  A.marks = []; A.shots = [];
  G.jon.mode = 'follow';
  Sound.play('secret');
  if (A.wave >= ARENA_WAVES) return arenaOver(true);
  if (A.pendingLv > 0) openLevelUp(); else openShop();
}
function openLevelUp() {
  G.state = 'levelup'; A.sel = 0;
  A.choices = [...LEVEL_UPS].sort(() => Math.random() - 0.5).slice(0, 4);
}
function openShop() {
  G.state = 'shop'; A.sel = 0; A.rerolls = 0;
  rollCards();
}
function cardPrice(c) { return Math.round(c.price * (1 + 0.12 * (A.wave - 1))); }
function rollCards() {
  const avail = ARENA_CARDS.filter(c => (A.owned[c.id] || 0) < c.max);
  A.cards = [...avail].sort(() => Math.random() - 0.5).slice(0, 4).map(c => ({ ...c, sold: false }));
}
const rerollCost = () => 3 + A.wave + A.rerolls * 2;

function updateArenaMenus() {
  if (G.state === 'levelup') {
    if (just('up')) { A.sel = (A.sel + 3) % 4; Sound.play('menu'); }
    if (just('down')) { A.sel = (A.sel + 1) % 4; Sound.play('menu'); }
    if (just('a') || just('tap')) {
      A.choices[A.sel].apply(); A.pendingLv--; Sound.play('item');
      if (A.pendingLv > 0) openLevelUp(); else openShop();
    }
    return;
  }
  if (G.state === 'shop') {
    const n = A.cards.length + 1;   // last row = Next wave
    if (just('up')) { A.sel = (A.sel + n - 1) % n; Sound.play('menu'); }
    if (just('down')) { A.sel = (A.sel + 1) % n; Sound.play('menu'); }
    if (just('b')) {
      if (G.save.kr >= rerollCost()) { G.save.kr -= rerollCost(); A.rerolls++; rollCards(); A.sel = 0; Sound.play('coin'); } else Sound.play('clank');
    }
    if (just('menu')) return nextWave();
    if (just('a') || just('tap')) {
      if (A.sel === A.cards.length) return nextWave();
      const c = A.cards[A.sel];
      if (!c || c.sold) return;
      if (G.save.kr < cardPrice(c)) { Sound.play('clank'); return; }
      G.save.kr -= cardPrice(c); c.sold = true; A.owned[c.id] = (A.owned[c.id] || 0) + 1; c.apply(); Sound.play('item');
    }
    return;
  }
  if (G.state === 'arenapause') {
    if (just('menu') || just('a')) G.state = 'play';
    if (just('b')) { G.mode = 'story'; G.st = baseStats(); G.state = 'title'; G.menuSel = 0; G.titleOpts = null; }
    return;
  }
  if (G.state === 'arenaover') {
    if (just('a') || just('menu') || just('tap')) { G.mode = 'story'; G.st = baseStats(); G.state = 'title'; G.menuSel = 0; G.titleOpts = null; }
  }
}

function arenaOver(won) {
  A.won = won;
  G.state = 'arenaover';
  const reached = won ? ARENA_WAVES : A.wave;
  try { if (reached > arenaBest()) localStorage.setItem(ARENA_BEST_KEY, String(reached)); } catch (e) {}
  Sound.play(won ? 'secret' : 'hurt');
}

// ---------- drawing ----------
function drawArenaWorld() {
  const cx = G.cam.x, cy = G.cam.y, p = G.player;
  for (const m of A.marks) { const a = Math.floor(G.t * 10) % 2; R(m.x - cx - 5, m.y - cy - 1, 10, 2, a ? '#ff4d4d' : '#ffd84a'); R(m.x - cx - 1, m.y - cy - 5, 2, 10, a ? '#ff4d4d' : '#ffd84a'); }
  if (A.frost) {
    const r = 34 + A.frost * 10;
    ctx.strokeStyle = `rgba(160,220,255,${0.25 + 0.1 * Math.sin(G.t * 4)})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x - cx, p.y - cy, r, 0, Math.PI * 2); ctx.stroke();
  }
  for (const t of A.turrets) {
    const x = t.x - cx, y = t.y - cy;
    R(x - 5, y - 9, 10, 14, '#7c7c8c'); R(x - 4, y - 11, 8, 3, '#7c7c8c');
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(G.t * 5); R(x - 1, y - 8, 2, 9, '#ffd84a'); R(x - 3, y - 5, 6, 2, '#ffd84a'); ctx.globalAlpha = 1;
  }
  for (const s of A.shots) R(s.x - cx - 2, s.y - cy - 2, 4, 4, '#ffd84a');
  A.pals.forEach(pl => {
    const x = pl.x - cx, y = pl.y - cy, f = Math.floor(pl.wob / 2.5) % 2;
    const { d, flip } = pl.dash > 0 ? dirOf(pl.dx, pl.dy) : { d: 'down', flip: false };
    shadowAt(x, y + 5, 1);
    spr(SPR[`pal_${d}_${f}${flip ? '_f' : ''}`], x, y + 6);
    R(x - 5, y - 6, 10, 2, '#e02838'); R(x + 3, y - 4, 2, 3, '#e02838');   // red scarf: the good penguin
  });
  for (let i = 0; i < A.orbit; i++) {
    const a = G.t * 3.2 + i * Math.PI * 2 / A.orbit;
    ctx.globalAlpha = 0.6; drawJonSprite(p.x - cx + Math.cos(a) * 28, p.y - cy + Math.sin(a) * 28, a * 2); ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = '#cfefff'; ctx.lineWidth = 1;
  for (const b of A.bolts) { ctx.beginPath(); ctx.moveTo(b.x1 - cx, b.y1 - cy); ctx.lineTo((b.x1 + b.x2) / 2 - cx + rnd(-5, 5), (b.y1 + b.y2) / 2 - cy + rnd(-5, 5)); ctx.lineTo(b.x2 - cx, b.y2 - cy); ctx.stroke(); }
}

function drawArenaHud() {
  const s = G.save, p = G.player;
  R(0, 0, VW, 22, 'rgba(0,0,0,.55)');
  R(6, 3, 8, 17, '#000'); R(7, 4, 6, 15, '#1a2238');
  const fill = Math.round(15 * s.rune / RUNE_MAX); R(7, 19 - fill, 6, fill, s.items.thunder ? (s.rune >= RUNE_MAX ? '#cfefff' : '#2f8fd0') : '#333');
  drawItemIcon('coin', 22, 7); text(String(s.kr), 28, 11, '#fff');
  text('LV' + A.lvl, 22, 20, '#9be08a');
  R(44, 15, 40, 4, '#000'); R(45, 16, 38 * A.xp / xpNeed(), 2, '#9be08a');
  const left = Math.max(0, Math.ceil(A.len - A.t));
  text('WAVE ' + A.wave, 128, 10, '#ffd84a', 'center');
  text(left + 's', 128, 20, left <= 5 ? '#ff8a8a' : '#fff', 'center');
  const n = s.maxHp / 2;
  for (let i = 0; i < n; i++) drawHeart(170 + (i % 9) * 9, 4 + Math.floor(i / 9) * 8, clamp(p.hp - i * 2, 0, 2) / 2);
  if (s.potions) { drawItemIcon('juice', 244, 18); }
}

function statLines() {
  const st = G.st;
  return [
    `Hearts ${G.save.maxHp / 2}   Regen ${st.regen}   Armor ${st.armor}`,
    `Damage ${Math.round(st.dmg * 100)}%   Crit ${Math.round(st.crit * 100)}%`,
    `Speed ${Math.round(st.speed * 100)}%   Attack ${Math.round(st.atk * 100)}%`,
  ];
}
function drawPanel(title) {
  R(0, 0, VW, VH, 'rgba(5,5,20,.9)'); R(6, 6, 244, 212, '#c9a227'); R(8, 8, 240, 208, '#14102a');
  text(title, 16, 22, '#ffd84a');
}
function drawArenaMenus() {
  if (G.state === 'levelup') {
    drawPanel('LEVEL UP!  Pick one');
    A.choices.forEach((c, i) => {
      const y = 46 + i * 26, sel = i === A.sel;
      R(16, y - 12, 224, 20, sel ? '#3a2e5a' : '#1e1838'); if (sel) R(16, y - 12, 3, 20, '#9be08a');
      text(c.name, 26, y + 2, sel ? '#9be08a' : '#fff');
    });
    statLines().forEach((l, i) => text(l, 16, 168 + i * 12, '#a79fc4', 'left', false));
    text('Z: choose', 16, 208, '#8a8ab0', 'left', false);
    return;
  }
  if (G.state === 'shop') {
    drawPanel('SHOP · after wave ' + A.wave);
    text(String(G.save.kr) + ' kr', 240, 22, '#ffd84a', 'right');
    A.cards.forEach((c, i) => {
      const y = 40 + i * 30, sel = i === A.sel, price = cardPrice(c), afford = G.save.kr >= price;
      R(16, y - 10, 224, 26, sel ? '#3a2e5a' : '#1e1838'); if (sel) R(16, y - 10, 3, 26, '#ffd84a');
      text(c.name + (A.owned[c.id] ? ` (${A.owned[c.id]})` : ''), 24, y + 1, c.sold ? '#555' : '#fff');
      text(c.desc, 24, y + 12, c.sold ? '#444' : '#a79fc4', 'left', false);
      text(c.sold ? 'SOLD' : price + ' kr', 234, y + 1, c.sold ? '#555' : afford ? '#ffd84a' : '#ff6b6b', 'right');
    });
    const ny = 40 + A.cards.length * 30, nsel = A.sel === A.cards.length;
    R(16, ny - 10, 224, 18, nsel ? '#2a5a3a' : '#1e3828'); text('NEXT WAVE ▶', 128, ny + 2, nsel ? '#9be08a' : '#cfe', 'center');
    statLines().forEach((l, i) => text(l, 16, 176 + i * 11, '#a79fc4', 'left', false));
    text(`Z buy · X reroll (${rerollCost()} kr) · Enter next wave`, 16, 210, '#8a8ab0', 'left', false);
    return;
  }
  if (G.state === 'arenapause') {
    drawPanel('PAUSED');
    statLines().forEach((l, i) => text(l, 16, 44 + i * 12, '#fff', 'left', false));
    const owned = Object.entries(A.owned).map(([id, n]) => ARENA_CARDS.find(c => c.id === id).name + (n > 1 ? ' x' + n : ''));
    text('BUILD', 16, 92, '#ffd84a');
    wrap(owned.join(', ') || 'Nothing yet', 222).slice(0, 6).forEach((l, i) => text(l, 16, 106 + i * 11, '#cfe', 'left', false));
    text('Enter: resume   X: quit to title', 16, 208, '#8a8ab0', 'left', false);
    return;
  }
  if (G.state === 'arenaover') {
    drawPanel(A.won ? 'VALHALLA CHAMPION!' : 'DEFEATED');
    text(A.won ? 'All 20 waves. Chilly is furious.' : `You reached wave ${A.wave}.`, 128, 56, '#fff', 'center');
    text(`Kills ${A.kills}   Level ${A.lvl}   Best: wave ${arenaBest()}`, 128, 76, '#a79fc4', 'center', false);
    const owned = Object.entries(A.owned).map(([id, n]) => ARENA_CARDS.find(c => c.id === id).name + (n > 1 ? ' x' + n : ''));
    text('BUILD', 16, 102, '#ffd84a');
    wrap(owned.join(', ') || 'Nothing! Bold.', 222).slice(0, 6).forEach((l, i) => text(l, 16, 116 + i * 11, '#cfe', 'left', false));
    text('Press Z for the title screen', 128, 204, '#ffd84a', 'center');
  }
}
