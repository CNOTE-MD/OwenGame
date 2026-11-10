// Owen's answers to the Quest Log (October 2026), built in. Each block names the question it answers.

// ---------- Q8: the spitting mushroom goes; a werewolf-style Varg comes in ----------
const PAL_VARG = { g: '#5a5a6a', G: '#8a8a9c', d: '#3a3a48', w: '#c8c8d8', e: '#ffd84a', E: '#ff3030', k: '#181420', t: '#e8e0d0' };
const VARG = [
  ['..g.......g...', '..gg.....gg...', '..gGgggggGg...', '.gGGGGGGGGGg..', '.gGeGGGGGeGg..', '.gGGGGGGGGGg..', '..gGGtktGGg...', '...gGGGGGgg...', '..ggGGGGGGgg..', '.gGGGGGGGGGGg.', '.gGGGwwwwGGGg.', '..gGGGGGGGGg..', '..gg..gg..gg..', '..dd..dd..dd..'],
  ['..g.......g...', '..gg.....gg...', '..gGgggggGg...', '.gGGGGGGGGGg..', '.gGEGGGGGEGg..', '.gGGGGGGGGGg..', '..gGtktktGg...', '...gGGGGGgg...', '..ggGGGGGGgg..', '.gGGGGGGGGGGg.', '.gGGGwwwwGGGg.', '..gGGGGGGGGg..', '.gg....gg..gg.', '.dd....dd..dd.'],
];
const PAL_SPIDER = { k: '#181420', b: '#3a2a3a', B: '#6a4a6a', e: '#ff3030' };
const SPIDER = ['k..k..k..k', '.k.bbbb.k.', '..bBBBBb..', 'kbBeBBeBbk', '..bBBBBb..', '.k.bbbb.k.', 'k..k..k..k'];
const PAL_CHILLY = { n: '#2a1040', N: '#4a2a6a', w: '#dfe7f2', W: '#aebfd6', o: '#7fd4ff', O: '#3a8ad0', r: '#ff3030', g: '#ffd84a', G: '#c89a18', c: '#7a1a8a', h: '#a8acc0', H: '#6a6e84', R: '#ff3030' };
function buildOwenArt() {
  SPR.varg_0 = buildSprite(VARG[0], PAL_VARG); SPR.varg_1 = buildSprite(VARG[1], PAL_VARG);
  SPR.varg_0f = flipped(SPR.varg_0); SPR.varg_1f = flipped(SPR.varg_1);
  SPR.spider = buildSprite(SPIDER, PAL_SPIDER);
  for (const dir of ['down', 'up', 'side']) for (let f = 0; f < 2; f++) { const c = buildSprite(PENG[dir][f], PAL_CHILLY); SPR[`chilly_${dir}_${f}`] = c; SPR[`chilly_${dir}_${f}_f`] = flipped(c); }
  SPR.icon_leaf = buildSprite(['...gg...', '..gGGg..', '.gGGGGg.', 'gGGlGGGg', 'gGlGGGGg', '.gGGGGg.', '..gbbg..', '...bb...'], { g: '#2f7a2a', G: '#58b840', l: '#c8f08c', b: '#6b4322' });
  SPR.icon_mango = buildSprite(['....gg..', '...g....', '..oooo..', '.oOOOOo.', 'oOOyOOOo', 'oOyOOOOo', '.oOOOOo.', '..oooo..'], { g: '#2f7a2a', o: '#c86010', O: '#ff9a1f', y: '#ffe066' });
  SPR.icon_fuel = buildSprite(['..kkkk..', '..bbbb..', '.bBBBBb.', '.bByyBb.', '.bByBBb.', '.bBBBBb.', '.bBBBBb.', '..bbbb..'], { k: '#181420', b: '#2c5aa0', B: '#4a8ad0', y: '#ffd84a' });
}
function updateVarg(e, dt, dx, dy, d, mr) {
  // prowls in a circle, howls (eyes flare), lunges in a straight line, then pants: chop it while it pants
  const night = typeof isNight === 'function' && isNight();
  e.st = e.st === 'idle' ? 'prowl' : e.st;
  if (e.st === 'prowl') {
    if (d > 150) return;
    const a = Math.atan2(dy, dx) + Math.PI / 2, want = d > 60 ? 1 : -0.4;
    e.fx = dx / d; e.fy = dy / d;
    tryMove(e, (Math.cos(a) * 34 + dx / d * 30 * want) * dt, (Math.sin(a) * 34 + dy / d * 30 * want) * dt, mr, 'walker');
    if (e.t > (night ? 1.4 : 2)) { e.st = 'howl'; e.t = 0; Sound.play('creep'); floatText(e.x, e.y - 18, 'AWOOO', '#c8c8d8'); }
  } else if (e.st === 'howl') {
    e.fx = dx / d; e.fy = dy / d;
    if (e.t > 0.6) { e.st = 'lunge'; e.t = 0; e.lx = dx / d; e.ly = dy / d; Sound.play('charge'); }
  } else if (e.st === 'lunge') {
    const h = tryMove(e, e.lx * (night ? 230 : 190) * dt, e.ly * (night ? 230 : 190) * dt, mr, 'walker');
    if (e.t > 0.45 || h.hitX || h.hitY) { e.st = 'pant'; e.t = 0; }
  } else if (e.st === 'pant') {
    if (e.t > 1.3) { e.st = 'prowl'; e.t = 0; }
  }
}
function drawVarg(e, x, y) {
  const white = e.flash > 0, f = e.st === 'lunge' ? 1 : Math.floor(e.wob / 2.5) % 2, flip = e.fx < 0;
  shadowAt(x, y + 6, 1.1);
  spr(SPR[`varg_${f}${flip ? 'f' : ''}`], x, y + 7, { white });
  if (e.st === 'howl' && Math.floor(G.t * 10) % 2) { R(x - 3, y - 7, 2, 2, '#ff3030'); R(x + 2, y - 7, 2, 2, '#ff3030'); }
  if (e.st === 'pant') text('hff', x + 8, y - 10, '#c8c8d8', 'left', false);
}
function updateSpider(e, dt, dx, dy, d, mr) {
  // skitters in short bursts
  e.burst = (e.burst || 0) - dt;
  if (e.burst <= 0) { e.burst = rnd(0.5, 1.1); e.dir = d < 130 ? Math.atan2(dy, dx) + rnd(-0.8, 0.8) : rnd(0, Math.PI * 2); }
  if (e.burst > 0.3) tryMove(e, Math.cos(e.dir) * e.speed * dt, Math.sin(e.dir) * e.speed * dt, mr, 'walker');
}

// ---------- Q15: Jon's top ability, a compliment worth half a heart ----------
const JON_COMPLIMENTS = ['You\'re terrible. Do better. ...Okay you\'re actually amazing. Half a heart, go.', 'Hey. You\'re the bravest zombie I know. That\'s a fact. Here.', 'Best friend in all of Norway. Get up. Half a heart, on me.', 'Señor, you are muy magnífico. Keep fighting!', 'You got this. I\'ve SEEN you get this.'];
function jonCompliment(dt) {
  const p = G.player, s = G.save;
  if (G.mode === 'arena' || G.state !== 'play' || !s) return;
  JT.compT = Math.max(0, (JT.compT || 0) - dt);
  if (p.hp > 2 || p.hp <= 0 || JT.compT > 0 || p.hp >= s.maxHp) return;
  JT.compT = isEasy() ? 15 : 25;
  p.hp = Math.min(s.maxHp, p.hp + 1);
  floatText(p.x, p.y - 20, '+½ ♥', '#ff9aa2'); Sound.play('heart');
  jonSay('compliment', { force: true, line: pick(JON_COMPLIMENTS), face: 'excited' });
}

// ---------- Q45: the fifth rune, the Leaf Rune (plants rise), hidden in a big forest ----------
function castLeaf() {
  const p = G.player; Sound.play('secret'); G.shake = 0.12;
  for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2; G.fx.push({ kind: 'leaf', x: p.x + Math.cos(a) * 20, y: p.y + Math.sin(a) * 14, vx: Math.cos(a) * 60, vy: Math.sin(a) * 40 - 20, grav: 60, t: 0, life: 0.6, color: pick(['#58b840', '#2f7a2a', '#a8e070']) }); }
  let n = 0;
  for (const e of G.ents) if (e.enemy && e.alive && dist(e, p) < 96 && e.type !== 'hank') { e.root = e.boss ? 1.2 : 3; e.kx = e.ky = 0; e.flash = 0; damageEnemy(e, 1, p, 'magic'); n++; }
  floatText(p.x, p.y - 20, n ? 'ROOTED!' : 'Leafy.', '#9be08a');
  if (n) jonSay('leaf', { cooldown: 20, face: 'excited' });
}
function drawRooted(e) {
  if (!(e.root > 0)) return;
  const x = Math.round(e.x - G.cam.x), y = Math.round(e.y - G.cam.y), w = e.r + 4;
  for (let i = -w; i <= w; i += 4) { const h = 6 + ((i * 7) & 7); R(x + i, y + 6 - h, 2, h, '#2f7a2a'); R(x + i, y + 6 - h, 2, 2, '#58b840'); }
}

// ---------- Q27: the Forest Giant wraps you in leaves ----------
function giantWrap(e, dt) {
  // a green ring marks where the leaves will rise; be outside it when they do
  if (e.st === 'wrap') {
    if (e.t > 0.9) {
      const a = e.wrapAt; for (let i = 0; i < 18; i++) leaves(a.x + rnd(-24, 24), a.y + rnd(-14, 14), ['#58b840', '#2f7a2a', '#a8e070']);
      if (dist(a, G.player) < 26 && !(G.player.dashing > 0)) { G.player.rooted = 1.1; floatText(G.player.x, G.player.y - 20, 'WRAPPED!', '#9be08a'); jonSay('wrapped', { force: true, face: 'worried' }); Sound.play('hurt'); }
      e.st = 'stalk'; e.t = 0; e.wraps = (e.wraps || 0) + 1;
    }
    return true;
  }
  return false;
}
function drawGiantWrap(e) {
  if (e.st !== 'wrap' || !e.wrapAt) return;
  const x = Math.round(e.wrapAt.x - G.cam.x), y = Math.round(e.wrapAt.y - G.cam.y), k = Math.min(1, e.t / 0.9);
  ctx.globalAlpha = qa(0.3 + 0.5 * k); pxEllipse(x, y + 2, 26, 15, '#58b840', 2); ctx.globalAlpha = 1;
}

// ---------- Q48: three new Arena cards ----------
const OWEN_CARDS = [
  { id: 'helheim', name: 'Fire of Helheim', desc: 'The arena becomes lava land', price: 45, max: 2, apply: () => { A.helheim = (A.helheim || 0) + 1; } },
  { id: 'infinity', name: 'Infinity Health', desc: '30 seconds unhurtable each wave', price: 40, max: 1, apply: () => { A.infinity = 1; A.infT = 30; } },
  { id: 'runeshield', name: 'Rune Shield', desc: 'Blocks a hit every 6 seconds', price: 35, max: 2, apply: () => { A.rshield = (A.rshield || 0) + 1; A.rsT = 0; } },
];
function updateOwenCards(dt) {
  const p = G.player;
  if (A.infT > 0) { A.infT -= dt; p.inv = Math.max(p.inv, 0.1); }
  if (A.rshield) A.rsT = Math.max(0, (A.rsT || 0) - dt);
  if (A.helheim) {
    A.helT = (A.helT || 0) + dt;
    if (A.helT > 1.5) { A.helT = 0; for (const e of G.ents) if (e.enemy && e.alive && !e.boss) { e.flash = 0; damageEnemy(e, 0.4 * A.helheim, { x: e.x, y: e.y + 4 }, 'magic'); } }
  }
}
function runeShieldBlocks() {
  if (G.mode !== 'arena' || !A.rshield || A.rsT > 0) return false;
  A.rsT = 6 / A.rshield; floatText(G.player.x, G.player.y - 18, 'SHIELD!', '#7fd4ff'); Sound.play('clank'); G.player.inv = 0.5; return true;
}
function drawOwenCards() {
  const p = G.player, cx = G.cam.x, cy = G.cam.y;
  if (A.helheim) { ctx.globalAlpha = 0.3 + 0.06 * Math.sin(G.t * 3); R(0, 0, VW, VH, '#ff3a1f'); ctx.globalAlpha = 1; for (let i = 0; i < 6; i++) { const x = (i * 53 + G.t * 20) % VW, y = VH - ((G.t * 40 + i * 37) % VH); R(x, y, 2, 2, '#ffd84a'); } }
  if (A.rshield && !(A.rsT > 0)) pxEllipse(p.x - cx, p.y - cy - 2, 13, 13, '#7fd4ff');
  if (A.infT > 0) { ctx.globalAlpha = qa(0.5 + 0.3 * Math.sin(G.t * 12)); pxEllipse(p.x - cx, p.y - cy - 2, 11, 11, '#ffd84a'); ctx.globalAlpha = 1; text(Math.ceil(A.infT) + 's', p.x - cx, p.y - cy - 22, '#ffd84a', 'center', false); }
}

// ---------- Q28: the giant turns back into a log, rolls off the path and snores ----------
function drawSleepLog(e) {
  const x = Math.round(e.x - G.cam.x), y = Math.round(e.y - G.cam.y);
  shadowAt(x, y + 6, 2);
  R(x - 16, y - 6, 32, 12, '#181420'); R(x - 15, y - 5, 30, 10, '#8a5a28'); R(x - 15, y - 2, 30, 2, '#6e4420'); R(x - 15, y + 2, 30, 1, '#a8723a');
  R(x + 11, y - 5, 4, 10, '#c89058'); R(x + 12, y - 2, 2, 3, '#8a5a28');
  const z = Math.floor(G.t * 1.5) % 3; for (let i = 0; i <= z; i++) text('z', x + 8 + i * 5, y - 10 - i * 6, '#c8e8ff', 'left', false);
}
