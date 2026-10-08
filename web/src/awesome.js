// The "even more awesome" pass: boss title cards, hit-stop, combo callouts, a Jukebox page,
// Snow Penguins and Royal Guards, King Owen on the throne, and a livelier title screen.

// ---------------- boss title cards ----------------
const BOSS_CARDS = {
  knight: ['PENGUIN KNIGHT', 'Guard of the Palace'],
  king: ['THE PENGUIN KING', 'Ak. Ak. Ak.'],
  captain: ['DRAUGR CAPTAIN', 'He guards the Voodoo Dash'],
  hank: ["HANK'S GHOST", 'Frozen by Chilly'],
  attendant: ['THE FLIGHT ATTENDANT', 'Any refreshments, sir?'],
};
function showBossCard(type) {
  const c = BOSS_CARDS[type];
  if (!c) return;
  G.bossCard = { name: c[0], sub: c[1], t: 0, life: 3.2 };
  G.flash = 0.2; G.flashColor = '#fff'; G.shake = Math.max(G.shake, 0.3);
}
function updateBossCard(dt) { if (G.bossCard) { G.bossCard.t += dt; if (G.bossCard.t > G.bossCard.life) G.bossCard = null; } }
function drawBossCard() {
  const c = G.bossCard;
  if (!c || G.state === 'menu' || G.state === 'title' || G.state === 'jonlevel') return;
  const k = Math.min(1, c.t / 0.35), out = Math.max(0, (c.t - (c.life - 0.4)) / 0.4);
  const bar = Math.round(28 * k * (1 - out));
  R(0, 0, VW, bar, '#000'); R(0, VH - bar, VW, bar, '#000');
  if (out >= 1) return;
  ctx.globalAlpha = 1 - out;
  const slide = Math.round((1 - k) * 40);
  R(0, 86, VW, 44, 'rgba(0,0,0,0.72)'); R(0, 86, VW, 1, '#ffd84a'); R(0, 129, VW, 1, '#ffd84a');
  ctx.font = '12px "Press Start 2P", ui-monospace, Menlo, monospace'; ctx.textAlign = 'center';
  ctx.fillStyle = '#000'; ctx.fillText(c.name, VW / 2 + 2 - slide, 108); ctx.fillStyle = Math.floor(c.t * 10) % 2 && c.t < 0.8 ? '#fff' : '#ff6b6b'; ctx.fillText(c.name, VW / 2 - slide, 106);
  text(c.sub, VW / 2 + slide, 122, '#f3ecd2', 'center', false);
  ctx.globalAlpha = 1;
}

// ---------------- hit-stop and combos ----------------
function hitStop(sec) { G.hitstop = Math.max(G.hitstop || 0, sec); }
function comboUp() {
  const n = JT.streak;
  if (n < 2) return;
  G.combo = { n, t: 0 };
  if (n >= 5 && G.save.items.thunder) { G.save.rune = Math.min(RUNE_MAX, G.save.rune + 1); }
  if (n === 5) Sound.play('secret');
}
function drawCombo() {
  const c = G.combo;
  if (!c || G.state === 'menu' || G.state === 'title') return;
  c.t += 1 / 60;
  if (c.t > 1.4) { G.combo = null; return; }
  const pop = c.t < 0.15 ? 1 + (0.15 - c.t) * 6 : 1, a = c.t > 1 ? 1 - (c.t - 1) / 0.4 : 1;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(VW / 2, 40); ctx.scale(pop, pop);
  const label = c.n >= 7 ? `x${c.n}  LEGENDARY!` : c.n >= 5 ? `x${c.n}  CHOP STORM!` : c.n >= 3 ? `x${c.n}  CHOP COMBO!` : `x${c.n}  COMBO`;
  text(label, 1, 1, '#000', 'center'); text(label, 0, 0, c.n >= 5 ? '#ffd84a' : '#9be08a', 'center');
  ctx.restore();
}

// ---------------- the Jukebox ----------------
const JUKE_ORDER = ['title', 'overworld', 'village', 'journey', 'cold', 'aero', 'palace', 'dungeon', 'boss', 'barrow', 'bjarne', 'arena', 'creepy'];
function markHeard(id) { if (id && G.save && G.mode === 'story' && !flag('heard:' + id)) { G.save.flags['heard:' + id] = true; } }
function jukeList() { return JUKE_ORDER.filter(id => SCORE[id]); }
function updateJukebox() {
  const list = jukeList();
  G.jukeSel = clamp(G.jukeSel || 0, 0, list.length - 1);
  if (just('up')) { G.jukeSel = (G.jukeSel + list.length - 1) % list.length; Sound.play('menu'); }
  if (just('down')) { G.jukeSel = (G.jukeSel + 1) % list.length; Sound.play('menu'); }
  if (just('a')) {
    const id = list[G.jukeSel];
    if (flag('heard:' + id)) { G.jukebox = G.jukebox === id ? null : id; Sound.play('coin'); } else Sound.play('clank');
  }
}
function drawJukebox() {
  const list = jukeList();
  R(0, 0, VW, VH, 'rgba(5,5,20,.92)'); R(8, 8, 240, 208, '#ffd84a'); R(10, 10, 236, 204, '#0d0d33');
  text('◀ MAP', 20, 26, '#8a8ab0', 'left', false); text('JUKEBOX', 128, 26, '#ffe64d', 'center'); text('GEAR ▶', 236, 26, '#8a8ab0', 'right', false);
  const heard = list.filter(id => flag('heard:' + id)).length;
  text(`${heard}/${list.length} songs found. Hear them in the world to unlock.`, 128, 40, '#a79fc4', 'center', false);
  list.forEach((id, i) => {
    const y = 54 + i * 11, sel = i === (G.jukeSel || 0), got = flag('heard:' + id), playing = G.jukebox === id;
    const nm = got ? SCORE[id].name.replace(/ \(.*\)$/, '') : '???';
    if (sel) R(18, y - 8, 220, 11, '#1a2238');
    text((sel ? '> ' : '  ') + nm, 22, y, !got ? '#55577a' : sel ? '#ffd84a' : '#f3ecd2', 'left', false);
    if (playing) { const b = Math.floor(G.t * 8) % 4; text('♪'.repeat(1 + b), 230, y, '#9be08a', 'right', false); }
  });
  text('Z: play / stop     Enter: close', 128, 212, '#8a8ab0', 'center', false);
}

// ---------------- Snow Penguins and Royal Guards ----------------
const PAL_SNOWPENG = { n: '#dfe7f2', N: '#aebfd6', w: '#ffffff', W: '#d8e4f0', o: '#7fd4ff', O: '#3a8ad0', r: '#4aa0ff', g: '#ffd84a', G: '#c89a18', c: '#7a1a8a', h: '#a8acc0', H: '#6a6e84', R: '#4aa0ff' };
const PAL_GUARD = { n: '#3a2a10', N: '#6a4a18', w: '#ffd84a', W: '#c89a18', o: '#ff6020', O: '#c83010', r: '#ff2828', g: '#ffd84a', G: '#c89a18', c: '#7a1a8a', h: '#a8acc0', H: '#6a6e84', R: '#e02838' };
function buildAwesomeArt() {
  for (const [key, pal] of [['snow', PAL_SNOWPENG], ['guard', PAL_GUARD]]) {
    for (const dir of ['down', 'up', 'side']) for (let f = 0; f < 2; f++) {
      const c = buildSprite(PENG[dir][f], pal);
      SPR[`${key}_${dir}_${f}`] = c; SPR[`${key}_${dir}_${f}_f`] = flipped(c);
    }
  }
}
function pengKey(e) { return e.type === 'snowpeng' ? 'snow' : e.type === 'guard' ? 'guard' : 'peng'; }
function updateSnowPeng(e, dt, dx, dy, d, mr) {
  // fast and twitchy: skates toward Owen in zigzags, slides a little on ice
  if (d > 140 && !e.aggro) return;
  e.aggro = true;
  const a = e.t * 7, zx = -dy / d * Math.sin(a) * 50, zy = dx / d * Math.sin(a) * 50;
  e.fx = dx / d; e.fy = dy / d;
  tryMove(e, (dx / d * e.speed + zx) * dt, (dy / d * e.speed + zy) * dt, mr, 'walker');
  if (Math.random() < 0.15) G.fx.push({ x: e.x + rnd(-3, 3), y: e.y + 6, vx: rnd(-10, 10), vy: rnd(-15, -5), t: 0, life: 0.3, color: '#ffffff', size: 1 });
}
function updateGuard(e, dt, dx, dy, d, mr) {
  // a shield-bearing penguin: slow to turn, so get around him; when staggered he waddles in a panic
  if (d < 110 || e.aggro) { e.aggro = true; if (e.t > 0.7) { e.t = 0; e.fx = dx / d; e.fy = dy / d; } tryMove(e, e.fx * e.speed * dt, e.fy * e.speed * dt, mr, 'walker'); }
}
function awesomeOnKill(e) {
  if (e.type === 'guard') { Sound.play('coin'); G.ents.push({ kind: 'pickup', what: 'kr5', x: e.x, y: e.y, life: 9 }); }
  if (e.type === 'snowpeng') puff(e.x, e.y, '#ffffff', 10);
}

// ---------------- King Owen ----------------
function sitOnThrone() {
  if (!flag('d1done')) return say([['', 'A throne of ice. Someone very round sits here. Often.']]);
  if (flag('king_owen')) return say([['', 'Your throne. Cold, bony, perfect.'], ['Jon', 'Your Majesty. Can we go now? Your Majesty.']]);
  return say([['', 'The Penguin King\'s throne. Ice, fish bones and one very small cushion.'], ['Jon', 'Sit on it. SIT ON IT. You\'re the king now.'], ['Owen', 'I\'m not sitting on fish bones, Jon.'], ['Jon', '...'], ['Owen', 'Fine. One second.'], ['', 'You sit. The ice creaks. Somewhere in the palace a hundred penguins stop what they are doing.']], () => {
    setFlag('king_owen'); G.banner = 'KING OWEN OF THE PENGUINS'; G.bannerT = 4; Sound.play('secret'); G.shake = 0.3;
    for (const e of G.ents) if (e.type === 'penguin' && e.alive) { e.bow = true; }
    jonXP(20); JT.queued = 'boss'; writeSave();
  });
}
function kingOwenRules(e) {
  // once Owen has sat on the throne, every penguin in the palace bows instead of biting
  if (e.type === 'penguin' && G.mapId === 'cavern' && flag('king_owen')) { e.bow = true; return true; }
  return false;
}

// ---------------- title screen ----------------
const TITLE_FX = { flakes: [] };
function drawTitleExtras() {
  const t = G.t;
  while (TITLE_FX.flakes.length < 36) TITLE_FX.flakes.push({ x: Math.random() * VW, y: Math.random() * 150, s: 8 + Math.random() * 16, w: Math.random() * 6 });
  for (const f of TITLE_FX.flakes) { f.y += f.s / 60; f.x += Math.sin(t + f.w) * 0.2; if (f.y > 150) { f.y = 0; f.x = Math.random() * VW; } R(f.x, f.y, f.s > 18 ? 2 : 1, f.s > 18 ? 2 : 1, 'rgba(255,255,255,0.8)'); }
  // Jon flies across the sky every so often, trailing sparkle
  const fx = ((t * 60) % (VW + 200)) - 100, fy = 30 + Math.sin(t * 3) * 6;
  if (fx > -40 && fx < VW + 40) { drawJonSprite(fx, fy, t * 10, false); for (let i = 1; i < 5; i++) R(fx - i * 9, fy + Math.sin(t * 9 + i) * 3, 2, 2, `rgba(255,216,74,${0.6 - i * 0.12})`); }
  // logo glow pulse
  const g = 0.5 + 0.5 * Math.sin(t * 2);
  ctx.globalAlpha = 0.25 * g; R(VW / 2 - 90, 44, 180, 22, '#8fd0ff'); ctx.globalAlpha = 1;
}
