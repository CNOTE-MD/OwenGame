// Jon: personality (what he says and how his face looks) and growth (XP, levels, perks, milestones).
// Jon is based on Owen's real best friend, so he grows alongside Owen as the game goes on.

// ---------------- talking ----------------
const JT = { cd: {}, line: '', t: 0, idle: 0, asleep: false, streak: 0, streakT: 0, face: 'happy', faceT: 0, lastArea: '', queued: null };
function resetJon() { Object.assign(JT, { cd: {}, line: '', t: 0, idle: 0, asleep: false, streak: 0, streakT: 0, face: 'happy', faceT: 0, lastArea: '', queued: null }); }
function jonSay(cat, opts = {}) {
  if (G.mode === 'arena' && !opts.arena) return false;
  const now = G.t;
  if (!opts.force && (JT.cd[cat] || 0) > now) return false;
  if (!opts.force && JT.t > 0.6 && !opts.interrupt) return false;   // don't talk over himself
  const pool = typeof cat === 'string' && JON[cat] ? JON[cat] : null;
  const line = opts.line || (Array.isArray(pool) ? pick(pool) : null);
  if (!line) return false;
  JT.line = line; JT.t = Math.min(4, 1.6 + line.length * 0.05);
  JT.cd[cat] = now + (opts.cooldown || 10);
  if (opts.face) setJonFace(opts.face, 2);
  return true;
}
function setJonFace(f, t) { JT.face = f; JT.faceT = t; }

function updateJonTalk(dt) {
  const p = G.player, s = G.save;
  JT.t = Math.max(0, JT.t - dt);
  JT.faceT = Math.max(0, JT.faceT - dt);
  JT.streakT = Math.max(0, JT.streakT - dt); if (JT.streakT <= 0) JT.streak = 0;
  if (G.state !== 'play' || G.mode === 'arena') return;
  // a line queued during a cutscene (boss cheer) plays once we're back in control
  if (JT.queued) { const q = JT.queued; JT.queued = null; jonSay(q, { force: true, face: 'excited' }); }
  // idling: he gets chatty, then bored, then falls asleep
  if (p.moving || G.jon.mode !== 'follow') {
    if (JT.asleep) { JT.asleep = false; jonSay('wake', { force: true }); setJonFace('excited', 1.5); }
    JT.idle = 0;
  } else {
    JT.idle += dt;
    if (JT.idle > 9 && JT.idle - dt <= 9) jonSay(Math.random() < 0.35 ? 'sing' : 'idle', { cooldown: 6 });
    if (JT.idle > 16 && JT.idle - dt <= 16) jonSay('sing', { cooldown: 6 });
    if (JT.idle > 22 && !JT.asleep) { JT.asleep = true; jonSay('sleepy', { force: true }); }
    if (JT.asleep && Math.floor(JT.idle) % 6 === 0 && Math.floor(JT.idle - dt) % 6 !== 0) jonSay('sleepy', { force: true });
  }
  // worried when Owen is low
  if (p.hp <= 2 && s.maxHp > 2) { if (JT.faceT <= 0) setJonFace('worried', 0.5); jonSay('lowhp', { cooldown: 25, face: 'worried' }); }
  // first time in each area
  const area = G.map.dungeon || G.map.interior || G.map.dark ? G.mapId : (G.scr.y === 1 && G.scr.x <= 1 ? 'village' : G.scr.y === 0 && G.scr.x === 1 ? 'forest' : G.scr.y === 0 && G.scr.x >= 2 ? 'frozen' : 'overworld');
  if (area !== JT.lastArea) {
    JT.lastArea = area;
    const line = JON.area[area];
    if (line && !flag('jonarea:' + area)) { setFlag('jonarea:' + area); jonSay('area', { line, force: true, face: 'excited' }); }
  }
  // near water or a penguin
  if (G.mapId === 'overworld' && tileAt(p.x + p.fx * 20, p.y + p.fy * 20) === '~') jonSay('water', { cooldown: 40, face: 'worried' });
  if (G.ents.some(e => e.type === 'penguin' && e.alive && dist(e, p) < 70)) jonSay('penguin', { cooldown: 45 });
  for (const t of ['beetle', 'slime', 'spore', 'guard', 'snowpeng']) if (G.ents.some(e => e.type === t && e.alive && dist(e, p) < 80)) jonSay(t, { cooldown: 70 });
  // the weather and the hour
  if (G.map.outdoor) {
    if (typeof isNight === 'function' && isNight()) jonSay('night', { cooldown: 150 });
    else if (typeof phaseOfDay === 'function' && phaseOfDay() === 'dawn') jonSay('dawn', { cooldown: 200 });
    if (typeof AMB !== 'undefined' && AMB.flakes.length) jonSay('snow', { cooldown: 120 });
  }
  if (G.map.dark) jonSay('dark', { cooldown: 90 });
}
// event hooks used by the rest of the game
function jonOnKill(e) {
  JT.streak++; JT.streakT = 2.5;
  if (e.boss) return;
  comboUp();
  if (JT.streak === 3) jonSay('streak', { force: true, face: 'excited', cooldown: 8 });
  else if (Math.random() < 0.3) jonSay('kill', { cooldown: 7, face: 'excited' });
}
function jonOnHurt(from) { setJonFace('worried', 1.2); if (from) jonSay('hurt', { cooldown: 8, interrupt: true }); }

function jonFaceNow() {
  if (JT.asleep) return 'sleepy';
  if (JT.faceT > 0) return JT.face;
  return 'happy';
}

function drawJonBubble(x, y) {
  if (JT.t <= 0 || !JT.line || G.state !== 'play') return;
  ctx.font = FONT;
  const lines = wrap(JT.line, 150).slice(0, 3);
  const w = Math.max(...lines.map(l => Math.ceil(ctx.measureText(l).width))) + 8, h = lines.length * 10 + 4;
  const bx = clamp(Math.round(x - w / 2), 2, VW - w - 2), by = clamp(Math.round(y - 22 - h), 24, VH - h - 4);
  ctx.globalAlpha = Math.min(1, JT.t * 3);
  R(bx - 1, by - 1, w + 2, h + 2, OUTLINE); R(bx, by, w, h, '#fffbe8');
  const tx = clamp(Math.round(x), bx + 4, bx + w - 6);
  R(tx, by + h, 4, 2, '#fffbe8'); R(tx + 1, by + h + 2, 2, 2, '#fffbe8'); R(tx - 1, by + h, 1, 2, OUTLINE); R(tx + 4, by + h, 1, 2, OUTLINE);
  lines.forEach((l, i) => text(l, bx + 4, by + 10 + i * 10, '#2a1a10', 'left', false));
  ctx.globalAlpha = 1;
}

// ---------------- growth ----------------
const JON_MAX = 10;
const jonNeed = lvl => 20 + (lvl - 1) * 16;
const JON_PERKS = [
  { id: 'edge', name: 'Sharper Edge', desc: '+20% damage', max: 3, apply: st => { st.dmg += 0.2; } },
  { id: 'wide', name: 'Wide Swing', desc: 'Bigger swing arc and reach', max: 2, apply: st => { st.swing += 0.2; } },
  { id: 'fast', name: 'Fast Hands', desc: '+15% attack speed', max: 3, apply: st => { st.atk += 0.15; } },
  { id: 'flight', name: 'Long Flight', desc: '+20% throw range', max: 2, apply: st => { st.range += 0.2; } },
  { id: 'rune', name: 'Rune Buddy', desc: 'Rune meter fills faster', max: 2, apply: st => { st.runeKill += 1; } },
  { id: 'magnet', name: 'Loot Magnet', desc: 'Grab loot from farther', max: 2, apply: st => { st.pickup += 18; } },
  { id: 'lucky', name: 'Lucky Axe', desc: 'Enemies drop more', max: 2, apply: st => { st.luck += 0.25; } },
  { id: 'crit', name: 'Critical Chop', desc: '+8% chance of double damage', max: 3, apply: st => { st.crit += 0.08; } },
];
const JON_MILESTONES = [
  { lvl: 3, id: 'spin', name: 'Spin Attack', desc: 'Hold Z after a swing, then let go' },
  { lvl: 5, id: 'pep', name: 'Pep Talk', desc: 'Juice heals AND gives a speed boost' },
  { lvl: 7, id: 'ricochet', name: 'Ricochet', desc: 'Thrown Jon bounces to a 2nd enemy' },
  { lvl: 10, id: 'bff', name: 'Best Friends Forever', desc: 'A second revive charge' },
];
function jonData() { if (!G.save.jon) G.save.jon = { lvl: 1, xp: 0, perks: {} }; return G.save.jon; }
const jonHas = id => G.mode !== 'arena' && JON_MILESTONES.some(m => m.id === id && jonData().lvl >= m.lvl);

// story-mode stats come from Jon's perks
function applyJonPerks() {
  G.st = baseStats();
  const d = jonData();
  for (const pk of JON_PERKS) for (let i = 0; i < (d.perks[pk.id] || 0); i++) pk.apply(G.st);
  if (typeof applyCharm === 'function') applyCharm(G.st);
}
function jonXP(n) {
  if (G.mode === 'arena' || !G.save) return;
  const d = jonData();
  if (d.lvl >= JON_MAX) return;
  d.xp += n;
  floatText(G.jon.x, G.jon.y - 10, '+' + n + ' XP', '#9be08a');
  if (d.xp >= jonNeed(d.lvl)) { d.pending = (d.pending || 0) + 1; }
}
function maybeJonLevelUp() {
  const d = jonData();
  if (!d.pending || G.state !== 'play') return;
  d.pending--; d.xp -= jonNeed(d.lvl); d.lvl++;
  if (d.lvl >= JON_MAX) d.xp = 0;
  Sound.play('item'); G.jon.spin = 0;
  setJonFace('excited', 3);
  const ms = JON_MILESTONES.find(m => m.lvl === d.lvl);
  const avail = JON_PERKS.filter(pk => (d.perks[pk.id] || 0) < pk.max);
  G.jonChoices = [...avail].sort(() => Math.random() - 0.5).slice(0, 3);
  G.jonMilestone = ms || null;
  G.menuSel = 0;
  G.state = G.jonChoices.length ? 'jonlevel' : 'play';
  if (ms && ms.id === 'bff') G.save.voodoo2 = true;
}
function updateJonLevel() {
  const n = G.jonChoices.length;
  if (just('up')) { G.menuSel = (G.menuSel + n - 1) % n; Sound.play('menu'); }
  if (just('down')) { G.menuSel = (G.menuSel + 1) % n; Sound.play('menu'); }
  if (just('a') || just('tap')) {
    const pk = G.jonChoices[G.menuSel], d = jonData();
    d.perks[pk.id] = (d.perks[pk.id] || 0) + 1;
    applyJonPerks(); Sound.play('secret');
    G.state = 'play'; G.player.cd = 0.3;
    jonSay('levelup', { force: true, face: 'excited' });
    writeSave();
  }
}
function drawJonLevel() {
  if (G.state !== 'jonlevel') return;
  const d = jonData();
  R(0, 0, VW, VH, 'rgba(5,5,20,.88)'); R(10, 14, 236, 196, '#ffd84a'); R(12, 16, 232, 192, '#14102a');
  drawJonSprite(40, 44, Math.sin(G.t * 6) * 0.4, false, 'excited');
  text('JON LEVEL UP!', 64, 36, '#ffd84a');
  text('Jon is now level ' + d.lvl, 64, 50, '#fff', 'left', false);
  let y = 72;
  if (G.jonMilestone) { text('NEW: ' + G.jonMilestone.name, 22, y, '#9be08a'); text(G.jonMilestone.desc, 22, y + 11, '#cfe', 'left', false); y += 28; }
  text('Pick a perk:', 22, y, '#ffe64d'); y += 8;
  G.jonChoices.forEach((pk, i) => {
    const yy = y + i * 26, sel = i === G.menuSel, have = d.perks[pk.id] || 0;
    R(20, yy, 216, 22, sel ? '#3a2e5a' : '#1e1838'); if (sel) R(20, yy, 3, 22, '#9be08a');
    text(pk.name + (have ? ` (${have + 1}/${pk.max})` : ''), 28, yy + 10, sel ? '#9be08a' : '#fff');
    text(pk.desc, 28, yy + 19, '#a79fc4', 'left', false);
  });
}
// JON page of the gear menu
function drawJonPage() {
  drawJonPageBody();
  text('◀ GEAR', 20, 206, '#8a8ab0', 'left', false); text('MAP ▶', 236, 206, '#8a8ab0', 'right', false);
}
function drawJonPageBody() {
  const d = jonData();
  R(0, 0, VW, VH, 'rgba(5,5,20,.92)'); R(8, 8, 240, 208, '#ffd84a'); R(10, 10, 236, 204, '#0d0d33');
  text('JON', 20, 26, '#ffe64d'); text('◀ GEAR', 236, 26, '#8a8ab0', 'right', false);
  drawJonSprite(36, 56, Math.sin(G.t * 2) * 0.2, G.t % 3.2 < 0.14, jonFaceNow());
  text('Level ' + d.lvl + (d.lvl >= JON_MAX ? ' (max)' : ''), 56, 48, '#fff');
  text("Owen's best friend", 56, 60, '#c8e8ff', 'left', false);
  R(56, 66, 120, 6, '#000'); R(57, 67, d.lvl >= JON_MAX ? 118 : Math.round(118 * Math.min(1, d.xp / jonNeed(d.lvl))), 4, '#9be08a');
  text(d.lvl >= JON_MAX ? 'MAX' : d.xp + '/' + jonNeed(d.lvl) + ' XP', 182, 72, '#9be08a', 'left', false);
  text('ABILITIES', 20, 92, '#ffe64d');
  JON_MILESTONES.forEach((m, i) => { const got = d.lvl >= m.lvl; text((got ? '✓ ' : 'Lv' + m.lvl + ' ') + m.name, 20, 104 + i * 11, got ? '#9be08a' : '#55577a', 'left', false); });
  text('PERKS', 20, 156, '#ffe64d');
  const owned = JON_PERKS.filter(pk => d.perks[pk.id]).map(pk => pk.name + (d.perks[pk.id] > 1 ? ' x' + d.perks[pk.id] : ''));
  wrap(owned.join(', ') || 'None yet. Level Jon up by fighting, finding secrets and finishing quests.', 214).slice(0, 4).forEach((l, i) => text(l, 20, 168 + i * 10, '#cfe', 'left', false));
}

// ---------------- Spin Attack (unlocked at level 3) ----------------
function updateSpinCharge(dt) {
  const p = G.player, j = G.jon;
  if (!jonHas('spin')) return;
  if (held('a') && j.mode === 'follow' && !p.dashing && p.cd <= 0) {
    p.charge = (p.charge || 0) + dt;
    if (p.charge > 0.55 && p.charge - dt <= 0.55) { Sound.play('switch'); setJonFace('excited', 1); }
  } else {
    if ((p.charge || 0) > 0.55 && j.mode === 'follow' && !held('a')) {
      j.mode = 'spin'; j.st = 0; j.hit = []; Sound.play('throw'); Sound.play('swing');
      if (Math.random() < 0.5) jonSay('spin', { force: true, face: 'excited' });
    }
    p.charge = 0;
  }
}
function updateSpin(dt) {
  const j = G.jon, p = G.player;
  j.st += dt;
  const k = j.st / 0.36, a = -Math.PI / 2 + k * Math.PI * 2.2;
  const r = 17 * G.st.swing;
  j.x = p.x + Math.cos(a) * r; j.y = p.y + Math.sin(a) * r; j.spin = a + Math.PI / 2;
  jonHits(2, 12, p, 'swing'); cutAt(j.x, j.y);
  if (k >= 1) j.mode = 'follow';
}
function drawSpinFx() {
  const p = G.player, j = G.jon;
  if (j.mode === 'spin') {
    const x = p.x - G.cam.x, y = p.y - G.cam.y;
    ctx.strokeStyle = 'rgba(160,220,255,0.6)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, 17 * G.st.swing, 0, Math.PI * 2); ctx.stroke();
  }
  if ((p.charge || 0) > 0.55 && Math.floor(G.t * 12) % 2) { drawTwinkle(j.x - G.cam.x + 6, j.y - G.cam.y - 10, 1); }
}
