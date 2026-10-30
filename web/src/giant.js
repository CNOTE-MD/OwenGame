// Owen's page 6: the log was the Forest Giant of the North. A boss fight in the Muck Forest.
// He stalks, raises a club the size of a narrow building, slams it, and it sticks in the muck:
// that is when Jon can chop him. Below half health he hides as a tree; throw Jon at the right one.

const GIANT_PAL = { b: '#6e4420', B: '#8a5a28', d: '#3a2410', m: '#4a8a3a', M: '#6ab04a', l: '#2f7a2a', L: '#58b840', e: '#ff3030', k: '#1a1208', c: '#8a6a3a', C: '#a8864a' };
const GIANT_ROWS = [
  '....LLLLLLLL....', '..LLllLLLLllLL..', '.LlLLLLLLLLLLlL.', '.LLLLllLLllLLLL.',
  '..LLBBBBBBBBLL..', '..BBBBBBBBBBBB..', '..BBeeBBBBeeBB..', '..BBBBBBBBBBBB..',
  '..BBBdddddBBBB..', '...BBBBBBBBBB...', '....BBBBBBBB....', '..mmBBBBBBBBmm..',
  '.mBBBBBBBBBBBBm.', 'mBBBBbBBBBbBBBBm', 'mBBBBbBBBBbBBBBm', 'MBBBBBBBBBBBBBBM',
  '.BBBBBBBBBBBBBB.', '.BBBBBBBBBBBBBB.', '..BBBBB..BBBBB..', '..BBBBB..BBBBB..',
  '..BBBBB..BBBBB..', '..dBBBd..dBBBd..', '.ddddddd.ddddddd', '.ddddddd.ddddddd',
];
const CLUB_ROWS = ['..CCCC..', '.CCCCCC.', 'CCCCCCCC', 'CCcCCcCC', 'CCCCCCCC', '.CCCCCC.', '..cccc..', '...cc...', '...cc...', '...cc...', '...cc...', '...cc...', '...cc...', '...cc...', '...cc...', '...cc...'];
function buildGiantArt() {
  SPR.giant = buildSprite(GIANT_ROWS, GIANT_PAL); SPR.giant_f = flipped(SPR.giant);
  SPR.giant_club = buildSprite(CLUB_ROWS, GIANT_PAL);
  SPR.fake_tree = SPR.giant; // the hiding trees use the normal big tree art; the real one shivers
}
function giantIntroLines() {
  return [
    ['Owen', '"Jon..." I stutter.'],
    ['Jon', 'What, Señor? Oh...'],
    ['', 'In front of you is a FIFTY FOOT TALL Forest Giant. These guys are known for hiding as trees and logs, and they absolutely HATE humans, because we chop down trees, which these guys basically worship.'],
    ['', 'Oh. They also have a club the size of a narrow building.'],
    ['Forest Giant', 'WHO AWAKENS THE FOREST GIANT OF THE NORTH?!'],
    ['Owen', 'Um, we were looking for Jjorvic Palace.'],
    ['Forest Giant', 'Ah. The penguins told me about you.'],
    ['Owen', '(Gulp. That wasn\'t good.)'],
    ['Jon', 'Señor, can we get to the big boss fight scene please?'],
    ['Owen', 'Later, Jon.'],
    ['', 'The giant raises his club.'],
    ['Jon', 'Dodge the club! When it sticks in the muck, chop his ankles! And if you\'ve got fire... giants HATE fire.'],
  ];
}
function wakeGiant(x, y) {
  setFlag('giant_woke');
  const g = makeEnemy('giant', x, y); g.st = 'intro'; g.fx = -1; g.fy = 0; G.ents.push(g); G.roomEnemies = true;
  for (let i = 0; i < 20; i++) leaves(x + rnd(-20, 20), y + rnd(-30, 10), ['#a8723a', '#58b840', '#6e4420']);
  G.shake = 0.6; Sound.play('boss'); showBossCard('giant');
  return g;
}
function updateGiant(e, dt, dx, dy, d, mr) {
  const p = G.player;
  if (e.st === 'intro') { if (G.state === 'play') { e.st = 'stalk'; e.t = 0; e.fightT = 0; } return; }
  if (giantPage7(e, dt)) return;
  if (e.hiding) { updateGiantHide(e, dt); return; }
  if (!e.hid && e.hp <= 6) { startGiantHide(e); return; }
  if (giantWrap(e, dt)) return;
  if (e.st === 'stalk') {
    e.fx = Math.sign(dx) || -1; e.fy = 0;
    if (d > 40) tryMove(e, dx / d * e.speed * (e.warred ? 1.5 : 1) * dt, dy / d * e.speed * (e.warred ? 1.5 : 1) * dt, mr, 'walker');
    if (e.t > (e.hid || e.warred ? 1.4 : 2.2)) {
      e.cycle = (e.cycle || 0) + 1;
      if (e.cycle % 3 === 2) { e.st = 'wrap'; e.t = 0; e.wrapAt = { x: p.x, y: p.y }; Sound.play('secret'); }   // Owen: giants summon leaves to wrap you up
      else { e.st = 'raise'; e.t = 0; e.aim = { x: p.x, y: p.y }; Sound.play('charge'); }
    }
  } else if (e.st === 'raise') {
    if (e.t < 0.55) e.aim = { x: p.x, y: p.y };   // tracks you, then commits
    if (e.t > 0.9) { e.st = 'slam'; e.t = 0; slamClub(e); }
  } else if (e.st === 'slam') {
    if (e.t > 0.25) { e.st = 'stuck'; e.t = 0; floatText(e.x, e.y - 60, 'STUCK! CHOP!', '#ffd84a'); jonSay('giant_stuck', { force: true, face: 'excited', cooldown: 4 }); }
  } else if (e.st === 'stuck') {
    if (e.t > (e.hid ? 1.9 : 2.4)) { e.st = 'stalk'; e.t = 0; Sound.play('clank'); }
  }
  if (e.st !== 'stuck' && d < e.r + 6) hurtPlayer(1, e);
}
function slamClub(e) {
  const a = e.aim || { x: e.x, y: e.y + 30 };
  e.slamAt = a; G.shake = 0.6; Sound.play('kill'); Sound.play('fall'); rumble(300, 1, 0.5);
  for (let i = 0; i < 16; i++) { const an = Math.random() * Math.PI * 2, sp = rnd(30, 90); G.fx.push({ x: a.x, y: a.y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, t: 0, life: 0.5, color: pick(['#5a3e22', '#7a5a32', '#3a2a16']), size: 2 }); }
  if (dist(a, G.player) < 30 && !(G.player.dashing > 0)) hurtPlayer(2, a);
  // the slam shakes bushes and grass loose nearby
  for (let ty = Math.floor(a.y / T) - 2; ty <= Math.floor(a.y / T) + 2; ty++) for (let tx = Math.floor(a.x / T) - 2; tx <= Math.floor(a.x / T) + 2; tx++) { const c = tile(tx, ty); if (c === 'b' || c === ',') cutAt(tx * T + 8, ty * T + 8); }
}
function startGiantHide(e) {
  e.hid = true; e.hiding = true; e.hideT = 0; e.st = 'stalk'; e.t = 0;
  for (let i = 0; i < 24; i++) leaves(e.x + rnd(-24, 24), e.y + rnd(-40, 10), ['#58b840', '#2f7a2a', '#a8723a']);
  Sound.play('secret');
  if (!flag('giant_lore')) { setFlag('giant_lore'); say([...STORY.giant_lore, ...STORY.giant_hide]); } else say(STORY.giant_hide);
  // three trees sprout on the screen; one of them is him
  const spots = [];
  for (let tries = 0; tries < 200 && spots.length < 3; tries++) {
    const x = G.cam.x + rnd(40, VW - 40), y = G.cam.y + rnd(60, VH - 40);
    if (solidAt(x, y, 'walker') || dist({ x, y }, G.player) < 40 || spots.some(s => dist(s, { x, y }) < 50)) continue;
    spots.push({ x, y });
  }
  const real = Math.floor(Math.random() * spots.length);
  spots.forEach((s, i) => G.ents.push({ kind: 'faketree', x: s.x, y: s.y, solid: true, hittable: true, real: i === real, cd: 0, giant: e, onHit() { hitFakeTree(this); } }));
  e.hideSpot = spots[real] || { x: e.x, y: e.y };
}
function hitFakeTree(t) {
  if (t.cd > 0) return; t.cd = 0.5;
  G.ents = G.ents.filter(o => o !== t);
  if (t.real) { revealGiant(t.giant, t.x, t.y, true); }
  else { leaves(t.x, t.y, ['#58b840', '#a8e070', '#388828']); Sound.play('swing'); floatText(t.x, t.y - 20, 'just a tree', '#aab'); }
}
function revealGiant(e, x, y, found) {
  e.hiding = false; e.x = x; e.y = y; e.st = found ? 'stuck' : 'stalk'; e.t = found ? -1.2 : 0;
  G.ents = G.ents.filter(o => o.kind !== 'faketree');
  for (let i = 0; i < 20; i++) leaves(x + rnd(-24, 24), y + rnd(-40, 10), ['#58b840', '#6e4420']);
  G.shake = 0.4; Sound.play('boss');
  floatText(x, y - 60, found ? 'FOUND HIM!' : 'HE\'S BACK', found ? '#ffd84a' : '#ff6b6b');
  if (found) jonSay('giant_found', { force: true, face: 'excited' });
}
function updateGiantHide(e, dt) {
  e.hideT += dt;
  for (const t of G.ents) if (t.kind === 'faketree') t.cd = Math.max(0, t.cd - dt);
  if (e.hideT > 9) revealGiant(e, e.hideSpot.x, e.hideSpot.y, false);
}
// hits only land while the club is stuck; fire always burns him
function giantDamageRule(e, how, jonHit) {
  if (how === 'magic') return 0;        // let the fireball through (and it hurts extra, below)
  if (how === 'thunder') return 0;
  if (e.hiding) return 1;
  if (e.st !== 'stuck') { if (jonHit) { Sound.play('clank'); floatText(e.x, e.y - 60, 'TOO TALL', '#aab'); jonSay('giant_tall', { cooldown: 12 }); } return 1; }
  return 0;
}
function drawGiant(e, x, y) {
  if (e.hiding) return true;
  const img = e.fx < 0 ? SPR.giant : SPR.giant_f, s = 3, foot = y + 8;
  const sway = e.st === 'stalk' ? Math.round(Math.sin(e.wob) * 2) : 0, white = e.flash > 0;
  shadowAt(x, foot, 4);
  // the club: up during raise, down and buried while stuck
  const side = e.fx < 0 ? -1 : 1;
  if (e.st === 'raise') { const lift = Math.min(1, e.t / 0.6); ctx.save(); ctx.translate(x + side * 20, foot - 50 * s / 3 - lift * 20); ctx.rotate(side * (-0.6 - lift * 1.2)); ctx.drawImage(SPR.giant_club, -12, -40, 24, 48); ctx.restore(); }
  spr(img, x + sway, foot, { scale: s, white });
  if (e.st === 'slam' || e.st === 'stuck') { const a = e.slamAt; if (a) { const ax = Math.round(a.x - G.cam.x), ay = Math.round(a.y - G.cam.y); ctx.drawImage(SPR.giant_club, ax - 12, ay - 44 + (e.st === 'stuck' ? 6 : 0), 24, 48); if (e.st === 'stuck' && Math.floor(G.t * 6) % 2) R(ax - 10, ay - 2, 20, 3, '#5a3e22'); } }
  if (e.st === 'raise' && e.aim) { const ax = Math.round(e.aim.x - G.cam.x), ay = Math.round(e.aim.y - G.cam.y), k = Math.min(1, e.t / 0.9); ctx.globalAlpha = 0.35 + k * 0.4; ctx.fillStyle = '#3a2a16'; ctx.beginPath(); ctx.ellipse(ax, ay + 2, 10 + k * 20, 5 + k * 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
  // health bar
  if (e.alive) { R(x - 31, y - 82, 62, 5, '#000'); R(x - 30, y - 81, 60 * Math.max(0, e.hp / e.max), 3, '#9be08a'); }
  return true;
}
function drawFakeTree(t) {
  const x = Math.round(t.x - G.cam.x), y = Math.round(t.y - G.cam.y);
  const shiver = t.real && Math.floor(G.t * 7) % 3 === 0 ? 1 : 0;   // the real one can't hold still
  const img = typeof treeImage === 'function' ? treeImage(0, false) : null;
  shadowAt(x, y + 6, 1.6);
  if (img) ctx.drawImage(img, x - img.width / 2 + shiver, y - img.height + 8); else { R(x - 10, y - 26, 20, 26, '#2f7a2a'); R(x - 3, y - 6, 6, 12, '#6b4322'); }
}
function giantOnKill(e) {
  G.ents = G.ents.filter(o => o.kind !== 'faketree');
  G.shake = 0.8; rumble(600, 1, 1);
  // he falls: the log tiles become path, for good, and Jon gets his timber
  const lx = 31;
  for (const yy of [5, 6]) if (tile(lx, yy) === 'o') { setTile(lx, yy, 's'); setFlag(`tile:overworld:${lx},${yy}:s`); leaves(lx * T + 8, yy * T + 8, ['#a8723a', '#6e4420', '#c89058']); }
  setFlag('log_chopped'); setFlag('giant_done');
  say(STORY.giant_down, () => { writeSave(); checkRoomClear(); });
}

// ---------- Owen's page 7: the blur, the time-out signal, and the giants' old war ----------
function giantPage7(e, dt) {
  if (G.state !== 'play') return false;
  e.fightT = (e.fightT || 0) + dt;
  // a few seconds in: the blur, and Jon will not stop singing
  if (!flag('giant_blur') && e.fightT > 4 && !e.hiding) { setFlag('giant_blur'); say(STORY.giant_blur); return true; }
  // tired at half health: Owen makes the time-out signal, which giants read as a sign of war
  if (!flag('giant_timeout') && G.player.hp <= G.save.maxHp / 2 && !e.hiding) {
    setFlag('giant_timeout'); e.warred = true; e.st = 'stalk'; e.t = 0;
    G.shake = 0.5; Sound.play('boss'); floatText(e.x, e.y - 70, 'SIGN OF WAR!', '#ff6b6b');
    say(STORY.giant_timeout); return true;
  }
  if (flag('giant_timeout')) e.warred = true;   // he stays angry if you leave and come back
  return false;
}
