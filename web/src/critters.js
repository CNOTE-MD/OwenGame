// Owen's "Build the game" answers from the Quest Log (Rune 5), built in:
// Q41 possessed animals (a wombat, a squirrel and a Carolina dog), Q42 a very large lion made of
// peanut butter, Q43 Chilly's arch-enemy's secret palace, Q44 the riddle in Chilly's throne room.
// Possessed animals are freed, not killed: Chilly's red glow pops off and the animal runs home.

const CR = { shots: [], puddles: [], freed: [] };

// ---------------- art ----------------
// All face right; flipped() makes the left-facing copy. buildSprite adds the dark outline.
const PAL_WOMBAT = { b: '#7a5a3a', B: '#9a7a52', d: '#4e3822', n: '#2a1a12', e: '#ff3030', p: '#c87a7a' };
const WOMBAT = [
  ['..........bb..', '...bbbbbbbbBb.', '.bbbbbbbbbbBBb', 'bbbBBBBBbbbBeB', 'bbBBBBBBBbbBBBn', 'bbBBBBBBBbbbBp.', '.bbbbbbbbbbbb..', '.dd.dd...dd.dd.'],
  ['..........bb..', '...bbbbbbbbBb.', '.bbbbbbbbbbBBb', 'bbbBBBBBbbbBeB', 'bbBBBBBBBbbBBBn', 'bbBBBBBBBbbbBp.', '.bbbbbbbbbbbb..', '..dd.dd.dd.dd..'],
];
const PAL_SQUIRREL = { o: '#b8642a', O: '#dc8c4a', w: '#f0e0c8', e: '#ff3030', n: '#2a1a12' };
const SQUIRREL = [
  ['.OO.......', 'OooO......', 'OooO...oo.', 'OooO..ooeo', '.OoO.ooooon', '..OO.owwo..', '...OOowwo..', '....oowwo..', '....oooo...', '....o..o...'],
  ['..OO......', '.OooO.....', '.OooO..oo.', '.OooO.ooeo', '..OoOooooon', '...OOowwo..', '...OOowwo..', '....oowwo..', '....oooo...', '.....oo....'],
];
const PAL_CDOG = { t: '#c89858', T: '#e2bc80', d: '#8a6a3a', w: '#f2e8d4', e: '#ff3030', n: '#2a1a12' };
const CDOG = [
  ['............T.T.', '.t..........TtTt.', 'tTt........tttttt', '.tTttttttttttetn', '..tTTTTTTTTTtwt.', '..tTTTTTTTTTt...', '..ttwwwwwwwtt...', '..td.td..td.td..', '..d..d...d..d...'],
  ['............T.T.', '.t..........TtTt.', 'tTt........tttttt', '.tTttttttttttetn', '..tTTTTTTTTTtwt.', '..tTTTTTTTTTt...', '..ttwwwwwwwtt...', '...tdtd..tdtd...', '...d.d....d.d...'],
];
// the lion is peanut butter all the way through: smooth body, chunky mane, goofy eyes
const PAL_LION = { M: '#7a4818', m: '#a8682a', b: '#cc8c3c', B: '#e8b064', s: '#fadca0', w: '#ffffff', k: '#181420', n: '#4a2810', r: '#7a2a1a', d: '#b07028' };
const LION = [
  '......................MMMM......',
  '....................MMmmmmMM....',
  '...................MmmmmmmmmM...',
  '..................MmmBBBBBmmmM..',
  '..................MmBBwkBBwkBmM.',
  '..................MmBBwwBBwwBBmM',
  '..................MmBBBBBBBnnBBM',
  '...bb.............MmBBBrrrrBBmM.',
  '..bMb..............MmBBBBBBBmM..',
  '..b.bbbbbbbbbbbbbbbMmmBBBBmmM...',
  '....bBBBBBBBBBBBBBbbMMmmmmMM....',
  '...bBBsBBBBBBsBBBBBbbbMMMM......',
  '...bBBBBBBBBBBBBBBBBBbbb........',
  '...bbBBBBBBBBBBBBBBBBBbb........',
  '....bbbbbbbbbbbbbbbbbbbb........',
  '....bbd.bb.....bb.d.bb..........',
  '....bb..bb.....bb...bb..........',
  '...bbb.bbb....bbb..bbb..........',
];
const LION_WALK = LION.slice(0, 15).concat(['....bb..bb....bb..bb.d..........', '.....bb..bb..bb..bb.............', '....bbb.bbb.bbb..bbb............']);
const PAL_BARON = { g: '#6e5446', G: '#9a7a68', m: '#c8a898', d: '#3a2a22', w: '#f8f4e8', k: '#181420', p: '#f0a0b8', P: '#d87898', o: '#c8e0f0', y: '#ffd84a' };
const BARON = [
  '.....pppppppp.....',
  '...ppPPPPPPPPpp...',
  '..pPPPPPPPPPPPPp..',
  '..gggggggggggggg..',
  '.gGGGGGGGGGGGGGGg.',
  '.gGkGGGGGGGGooGGg.',
  '.gGGGGGGGGGGokGGg.',
  '.gGGGmmmmmmmGyGGg.',
  '.gGGmmdmmmdmmGGGg.',
  '.gGGmmmmmmmmmGGGg.',
  'gGGGGwmmmmmwGGGGGg',
  'gGGGGwGGGGGwGGGGGg',
  'gGGGGwGGGGGwGGGGGg',
  'gGGGGGGGGGGGGGGGGg',
  '.ggggggggggggggg..',
  'dd.............dd.',
];
function freedPal(pal) { return { ...pal, e: '#181420' }; }
function buildCritterArt() {
  const both = (name, rows, pal) => { const c = buildSprite(rows, pal); SPR[name] = c; SPR[name + 'f'] = flipped(c); };
  WOMBAT.forEach((r, i) => { both('wombat_' + i, r, PAL_WOMBAT); both('wombatfree_' + i, r, freedPal(PAL_WOMBAT)); });
  SQUIRREL.forEach((r, i) => { both('squirrel_' + i, r, PAL_SQUIRREL); both('squirrelfree_' + i, r, freedPal(PAL_SQUIRREL)); });
  CDOG.forEach((r, i) => { both('cdog_' + i, r, PAL_CDOG); both('cdogfree_' + i, r, freedPal(PAL_CDOG)); });
  both('lion_0', LION, PAL_LION); both('lion_1', LION_WALK, PAL_LION);
  SPR.baron = buildSprite(BARON, PAL_BARON);
}

// ---------------- enemy stats ----------------
Object.assign(ENEMY, {
  wombat: { hp: 4, r: 7, touch: 1, speed: 20 },
  squirrel: { hp: 1, r: 4, touch: 1, speed: 120 },
  cdog: { hp: 2, r: 6, touch: 1, speed: 80 },
  pblion: { hp: 14, r: 18, touch: 1, speed: 26, boss: true },
});
for (const t of ['wombat', 'squirrel', 'cdog']) NIGHT_BOLD.add(t);
BOSS_CARDS.pblion = ['PEANUT BUTTER LION', 'Smooth. Not crunchy.'];
DEFEATED.pblion = 'PEANUT BUTTER LION';

// ---------------- Q41: the wombat ----------------
// Waddles. When Owen is close it digs in, tunnels under him and bursts up. A wombat's rump is a
// bony shield (a real wombat fact), so Jon bounces off it from behind: chop the face.
function updateWombat(e, dt, dx, dy, d, mr) {
  switch (e.st) {
    case 'idle': case 'waddle':
      e.st = 'waddle';
      if (d < 140) { e.fx = dx / d; e.fy = dy / d; tryMove(e, dx / d * e.speed * dt, dy / d * e.speed * dt, mr, 'walker'); }
      if (d < 110 && e.t > 2.2) { e.st = 'dig'; e.t = 0; }
      break;
    case 'dig':
      if (Math.random() < 0.5) G.fx.push({ x: e.x + rnd(-6, 6), y: e.y + 4, vx: rnd(-30, 30), vy: rnd(-50, -20), grav: 160, t: 0, life: 0.4, color: '#6b4a2a', size: 2 });
      if (e.t > 0.5) { e.under = true; e.st = 'tunnel'; e.t = 0; Sound.play('mud'); }
      break;
    case 'tunnel':
      tryMove(e, dx / d * 62 * dt, dy / d * 62 * dt, mr, 'walker');
      if (d < 8 || e.t > 2.2) { e.st = 'rise'; e.t = 0; }
      break;
    case 'rise':
      if (e.t > 0.45 * bossWindow()) {
        e.under = false; e.st = 'dazed'; e.t = 0; G.shake = 0.12; Sound.play('clank');
        for (let i = 0; i < 10; i++) G.fx.push({ x: e.x, y: e.y, vx: rnd(-60, 60), vy: rnd(-90, -30), grav: 200, t: 0, life: 0.5, color: pick(['#6b4a2a', '#8a6a3a']), size: 2 });
        if (dist(e, G.player) < 16 && !(G.player.dashing > 0)) hurtPlayer(1, e);
      }
      break;
    case 'dazed': if (e.t > 1.3 * bossWindow()) { e.st = 'waddle'; e.t = 0; } break;
  }
  e.safe = !!e.under || e.st === 'rise';
}

// ---------------- Q41: the squirrel ----------------
// Darts in quick zigzags, freezes for a moment, then flings an acorn.
function updateSquirrel(e, dt, dx, dy, d, mr) {
  if (d > 170) return;
  if (e.st === 'aim') {
    e.fx = dx / d;
    if (e.t > 0.45) { CR.shots.push({ kind: 'acorn', x: e.x, y: e.y - 4, vx: dx / d * 115, vy: dy / d * 115, life: 1.6, spin: 0 }); Sound.play('throw'); e.st = 'dart'; e.t = 0; e.burst = 0; }
    return;
  }
  e.st = 'dart'; e.burst = (e.burst || 0) - dt;
  if (e.burst <= 0) {
    e.burst = rnd(0.3, 0.55); e.darts = (e.darts || 0) + 1;
    const away = d < 44 ? Math.PI : 0;
    e.dir = Math.atan2(dy, dx) + away + (Math.random() < 0.5 ? 1 : -1) * rnd(0.9, 1.5);
    if (e.darts >= 3 && d < 140) { e.st = 'aim'; e.t = 0; e.darts = 0; return; }
  }
  if (e.burst > 0.1) { const vx = Math.cos(e.dir), vy = Math.sin(e.dir); e.fx = vx; tryMove(e, vx * e.speed * dt, vy * e.speed * dt, mr, 'walker'); }
}

// ---------------- Q41: the Carolina dog ----------------
// Runs with its pack: they circle Owen, and one dog at a time yips and darts in.
function updateCdog(e, dt, dx, dy, d, mr) {
  if (d > 170 && e.st === 'idle') return;
  if (d > 230) { e.st = 'idle'; return; }   // Owen left: the pack stays home
  if (e.spin === undefined) { e.spin = Math.random() < 0.5 ? 1 : -1; e.wait = rnd(0.8, 2.2); }
  const p = G.player;
  if (e.st === 'idle' || e.st === 'circle') {
    e.st = 'circle';
    const a = Math.atan2(e.y - p.y, e.x - p.x) + dt * 1.6 * e.spin, tx = p.x + Math.cos(a) * 54, ty = p.y + Math.sin(a) * 54;
    const ax = tx - e.x, ay = ty - e.y, al = Math.hypot(ax, ay) || 1;
    e.fx = ax / al; tryMove(e, ax / al * Math.min(e.speed, al * 4) * dt, ay / al * Math.min(e.speed, al * 4) * dt, mr, 'walker');
    const busy = G.ents.some(o => o !== e && o.type === 'cdog' && o.alive && (o.st === 'yip' || o.st === 'rush'));
    if (e.t > e.wait && !busy) { e.st = 'yip'; e.t = 0; floatText(e.x, e.y - 14, 'YIP!', '#f2e8d4'); }
  } else if (e.st === 'yip') {
    e.fx = dx / d;
    if (e.t > 0.4) { e.st = 'rush'; e.t = 0; e.lx = dx / d; e.ly = dy / d; Sound.play('charge'); }
  } else if (e.st === 'rush') {
    const h = tryMove(e, e.lx * 175 * dt, e.ly * 175 * dt, mr, 'walker');
    if (e.t > 0.45 || h.hitX || h.hitY) { e.st = 'circle'; e.t = 0; e.wait = rnd(1.4, 2.6); e.spin *= -1; }
  }
}

// ---------------- Q42: the Peanut Butter Lion ----------------
// Asleep on the beach until Owen comes close. Prowls, crouches, pounces and lands in a sticky
// puddle of itself, and gets stuck: that's the opening. It roars globs of peanut butter that make
// more puddles (which slow Owen down). Half its health gone, it melts down to a cub and gets fast.
function updateLion(e, dt, dx, dy, d, mr) {
  const p = G.player, big = !e.cub;
  switch (e.st) {
    case 'idle': e.st = 'sleep'; break;
    case 'sleep': if (d < 60 || (e.hp < e.max && d < 200)) wakeLion(e); break;
    case 'intro': if (G.state === 'play') { e.st = 'prowl'; e.t = 0; } break;
    case 'prowl': {
      if (d > 260) { e.st = 'sleep'; e.t = 0; break; }   // Owen left the beach: it gets bored and dozes off
      const sp = big ? 26 : 50;
      e.fx = dx / d; e.fy = dy / d; tryMove(e, dx / d * sp * dt, dy / d * sp * dt, mr, 'walker');
      if (e.t > (big ? 1.8 : 1.1)) { e.t = 0; e.n = (e.n || 0) + 1; if (e.n % 3 === 0) e.st = 'roar'; else { e.st = 'crouch'; e.aim = { x: p.x, y: p.y }; } }
      break; }
    case 'crouch':
      if (e.t < 0.35) e.aim = { x: p.x, y: p.y };
      e.fx = Math.sign(e.aim.x - e.x) || e.fx;
      if (e.t > 0.65 * (isEasy() ? 1.25 : 1)) { e.st = 'pounce'; e.t = 0; e.from = { x: e.x, y: e.y }; e.to = lionLanding(e); Sound.play('charge'); }
      break;
    case 'pounce': {
      const k = Math.min(1, e.t / (big ? 0.6 : 0.45));
      e.x = e.from.x + (e.to.x - e.from.x) * k; e.y = e.from.y + (e.to.y - e.from.y) * k;
      e.z = Math.sin(k * Math.PI) * (big ? 34 : 22);
      if (k >= 1) {
        e.z = 0; e.st = 'stuck'; e.t = 0; G.shake = big ? 0.35 : 0.2; Sound.play('clank');
        CR.puddles.push({ x: e.x, y: e.y + 4, r: big ? 20 : 13, t: 0, life: 9 });
        if (dist(e, p) < (big ? 26 : 18) && !(p.dashing > 0)) hurtPlayer(big ? 2 : 1, e);
        floatText(e.x, e.y - (big ? 44 : 26), 'STUCK!', '#fadca0');
      }
      break; }
    case 'stuck': if (e.t > (big ? 1.6 : 1.1) * bossWindow()) { e.st = 'prowl'; e.t = 0; } break;
    case 'roar':
      if (e.t > 0.5 && !e.roared) {
        e.roared = true; G.shake = 0.3; Sound.play('creep'); floatText(e.x, e.y - (big ? 48 : 28), 'RAWRRR', '#fadca0');
        const n = big ? 5 : 3;
        for (let i = 0; i < n; i++) { const a = Math.atan2(dy, dx) + (i - (n - 1) / 2) * 0.45; CR.shots.push({ kind: 'glob', x: e.x, y: e.y - 10, tx: p.x + Math.cos(a) * 26 * i * 0.4, ty: p.y + Math.sin(a) * 26 * i * 0.4, t: 0, dur: 0.8 + i * 0.08 }); }
        for (const o of G.ents) if (o.type === 'penguin' && o.alive && dist(o, e) < 220) o.fear = 4;   // even the penguins are scared of it
      }
      if (e.t > 1.1) { e.st = 'prowl'; e.t = 0; e.roared = false; }
      break;
  }
  if (big && e.hp <= e.max / 2 && e.st !== 'pounce') {
    e.cub = true; e.r = 10; e.st = 'prowl'; e.t = 0; G.shake = 0.3; Sound.play('kill');
    for (let i = 0; i < 24; i++) G.fx.push({ x: e.x + rnd(-20, 20), y: e.y - rnd(0, 30), vx: rnd(-70, 70), vy: rnd(-80, -10), grav: 220, t: 0, life: 0.8, color: pick(['#cc8c3c', '#e8b064', '#7a4818']), size: 3 });
    CR.puddles.push({ x: e.x, y: e.y + 4, r: 24, t: 0, life: 9 });
    floatText(e.x, e.y - 30, 'IT SHRANK!', '#fadca0');
    jonSay('lioncub', { force: true, face: 'excited' });
  }
  e.safe = ['sleep', 'intro', 'pounce', 'stuck'].includes(e.st);
}
function lionLanding(e) {
  // land where Owen was, or as close to it as the ground allows
  const r = e.r * 0.6;
  for (let k = 1; k > 0; k -= 0.1) { const x = e.x + (e.aim.x - e.x) * k, y = e.y + (e.aim.y - e.y) * k; if (!blocked(x, y, r, 'walker', e)) return { x, y }; }
  return { x: e.x, y: e.y };
}
function wakeLion(e) {
  e.st = 'intro'; e.t = 0; G.shake = 0.3; showBossCard('pblion');
  for (const o of G.ents) if (o.type === 'penguin' && o.alive && dist(o, e) < 220) o.fear = 5;
  say(flag('lion_met') ? STORY.lion_again : STORY.lion_wake, () => setFlag('lion_met'));
}
function drawLion(e, x, y) {
  const big = !e.cub, img = SPR[`lion_${e.st === 'prowl' && Math.floor(e.wob / 3) % 2 ? 1 : 0}${e.fx < 0 ? 'f' : ''}`];
  const z = Math.round(e.z || 0), white = e.flash > 0 || (e.st === 'crouch' && Math.floor(G.t * 16) % 2 === 0);
  if (e.st === 'crouch' && e.aim) { const ax = Math.round(e.aim.x - G.cam.x), ay = Math.round(e.aim.y - G.cam.y), k = Math.min(1, e.t / 0.65); ctx.globalAlpha = qa(0.3 + 0.5 * k); pxEllipse(ax, ay + 4, (big ? 22 : 14) * (1.4 - k * 0.4), (big ? 10 : 6) * (1.4 - k * 0.4), '#7a4818', 2); ctx.globalAlpha = 1; }
  shadowAt(x, y + 6, big ? 3 : 1.6);
  const squish = e.st === 'stuck' ? 1 : e.st === 'crouch' ? 2 : 0;
  spr(img, x, y + 7 - z + squish, { scale: big ? 2 : 1, white });
  if (e.st === 'sleep') { const hx = x + (e.fx < 0 ? -30 : 30), k = (G.t * 0.8) % 1; text('z', hx + k * 8, y - 30 - k * 14, `rgba(255,255,255,${qa(1 - k)})`, 'left', false); text('Z', hx + 8, y - 44 - Math.round(Math.sin(G.t * 2) * 2), '#ffffff', 'left', false); }
  if (e.st === 'stuck') for (let i = -2; i <= 2; i++) R(x + i * (big ? 9 : 5) - 1, y + 5 + Math.abs(i), 3, 2 + ((Math.floor(G.t * 4) + i) & 1), '#b07028');
  if (e.st !== 'sleep') bossBar(x, y - (big ? 50 : 30), e.hp / e.max, '#cc8c3c');
}

// ---------------- possessed look, and freeing them ----------------
function drawCritter(e, x, y) {
  const types = { wombat: 1, squirrel: 1, cdog: 1, pblion: 1 };
  if (!types[e.type]) return false;
  if (e.type === 'pblion') { drawLion(e, x, y); return true; }
  const white = e.flash > 0 || ((e.st === 'yip' || e.st === 'aim' || e.st === 'rise') && Math.floor(G.t * 16) % 2 === 0);
  if (e.type === 'wombat' && e.under) {
    // only a moving dirt mound shows while it tunnels
    const w = e.st === 'rise' ? 8 + Math.round(Math.sin(G.t * 40) * 2) : 7;
    R(x - w, y + 2, w * 2, 3, '#4e3822'); R(x - w + 2, y, w * 2 - 4, 2, '#6b4a2a'); R(x - 2, y - 1, 4, 1, '#8a6a3a');
    return true;
  }
  const f = Math.floor(e.wob / 2.5) % 2, flip = e.fx < 0 ? 'f' : '';
  shadowAt(x, y + 5, e.type === 'squirrel' ? 0.6 : 1);
  spr(SPR[`${e.type}_${f}${flip}`], x, y + 6, { white });
  // Chilly's possession: a few purple sparks drifting up
  if (Math.floor(G.t * 6 + e.wob) % 3 === 0) R(x + Math.round(Math.sin(G.t * 3 + e.wob) * 6), y - 10 - Math.floor((G.t * 20 + e.wob * 5) % 8), 1, 1, '#c070ff');
  if (e.type === 'wombat' && e.st === 'dazed') for (let i = 0; i < 3; i++) { const a = G.t * 5 + i * 2.1; drawStar(x + Math.cos(a) * 8, y - 12 + Math.sin(a) * 2); }
  return true;
}
function freeCritter(e) {
  const p = G.player, d = Math.hypot(e.x - p.x, e.y - p.y) || 1;
  CR.freed.push({ type: e.type, x: e.x, y: e.y, vx: (e.x - p.x) / d * 70, vy: (e.y - p.y) / d * 40, t: 0, life: 1.8 });
  floatText(e.x, e.y - 16, 'FREED!', '#c070ff');
  for (let i = 0; i < 8; i++) G.fx.push({ x: e.x, y: e.y - 6, vx: rnd(-30, 30), vy: rnd(-70, -30), grav: 0, t: 0, life: 0.5, color: '#c070ff', size: 1 });
  const s = G.save; s.freed = s.freed || {}; s.freed[e.type] = (s.freed[e.type] || 0) + 1;
  if (!flag('freed_any')) { setFlag('freed_any'); JT.queued = 'freed'; }
  // the forest squirrels leave Owen something from their stash once two of them are free
  if (e.type === 'squirrel' && s.freed.squirrel >= 2 && !flag('got:hp_squirrels') && G.mapId === 'overworld' && !G.ents.some(o => o.id === 'hp_squirrels')) {
    G.ents.push({ kind: 'pickup', what: 'piece', id: 'hp_squirrels', x: e.x, y: e.y, permanent: true });
    floatText(e.x, e.y - 28, 'A stash!', '#ffd84a'); Sound.play('secret'); JT.queued = 'stash';
  }
}
function critterOnKill(e) {
  if (['wombat', 'squirrel', 'cdog'].includes(e.type) && G.mode !== 'arena') freeCritter(e);
  if (e.type === 'pblion') {
    setFlag('lion_done'); CR.puddles.length = 0; CR.shots = CR.shots.filter(s => s.kind !== 'glob');
    for (let i = 0; i < 30; i++) G.fx.push({ x: e.x + rnd(-10, 10), y: e.y - rnd(0, 16), vx: rnd(-90, 90), vy: rnd(-120, -30), grav: 240, t: 0, life: 1, color: pick(['#cc8c3c', '#e8b064', '#fadca0']), size: 3 });
    if (!flag('got:hp_lion')) G.ents.push({ kind: 'pickup', what: 'piece', id: 'hp_lion', x: e.x, y: e.y, permanent: true });
    G.ents.push({ kind: 'pickup', what: 'krn', value: 25, x: e.x + 14, y: e.y + 4, life: 30 });
    say(STORY.lion_down, writeSave);
  }
}
// the critter's own damage rules: 0 blocks the hit, otherwise a damage multiplier
function critterHit(e, how, jonHit, from) {
  if (e.type === 'wombat') {
    if (e.under || e.st === 'rise') return 0;
    const dx = from.x - e.x, dy = from.y - e.y, d = Math.hypot(dx, dy) || 1;
    if (jonHit && e.st !== 'dazed' && (dx / d * e.fx + dy / d * e.fy) < -0.4) {
      Sound.play('clank'); floatText(e.x, e.y - 16, 'BUTT ARMOR!', '#ffd84a'); jonSay('wombatbutt', { cooldown: 30 });
      e.kx = -dx / d * 80; e.ky = -dy / d * 80; return 0;
    }
  }
  if (e.type === 'pblion') {
    if (e.st === 'sleep') { wakeLion(e); return 0; }
    if (e.st === 'intro' || e.st === 'pounce') return 0;
    if (jonHit && e.st !== 'stuck') { floatText(e.x, e.y - (e.cub ? 22 : 40), 'SQUISH', '#fadca0'); return 0.5; }
  }
  return 1;
}

// ---------------- acorns, peanut butter globs and puddles ----------------
function updateCritterWorld(dt) {
  const p = G.player;
  for (const s of CR.shots) {
    if (s.kind === 'acorn') {
      s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; s.spin += dt * 14;
      if (s.life < 1.5 && dist(s, p) < 7) { s.life = 0; hurtPlayer(1, s); }
      if (solidAt(s.x, s.y, 'jon')) s.life = 0;
    } else if (s.kind === 'glob') {
      s.t += dt;
      if (s.t >= s.dur) {
        s.life = 0; CR.puddles.push({ x: s.tx, y: s.ty, r: 9, t: 0, life: 7 });
        if (Math.hypot(s.tx - p.x, s.ty - p.y) < 10) hurtPlayer(1, { x: s.tx, y: s.ty });
        for (let i = 0; i < 5; i++) G.fx.push({ x: s.tx, y: s.ty, vx: rnd(-40, 40), vy: rnd(-50, -10), grav: 200, t: 0, life: 0.35, color: '#cc8c3c', size: 2 });
      }
    }
  }
  CR.shots = CR.shots.filter(s => s.kind === 'glob' ? s.life !== 0 : s.life > 0);
  for (const q of CR.puddles) q.t += dt;
  CR.puddles = CR.puddles.filter(q => q.t < q.life);
  for (const f of CR.freed) { f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt; }
  CR.freed = CR.freed.filter(f => f.t < f.life);
  revealSauna();
  if (G.mapId === 'sauna' && Math.random() < dt * 6) G.fx.push({ x: rnd(5, 8) * T, y: 2 * T + 4, vx: rnd(-6, 6), vy: rnd(-22, -12), grav: 0, t: 0, life: 1.6, color: 'rgba(240,240,250,.55)', size: 4 });
}
function inPeanutButter(p) { return CR.puddles.some(q => Math.hypot((p.x - q.x) / q.r, (p.y + 4 - q.y) / (q.r * 0.55)) < 1); }
function drawPuddles() {
  for (const q of CR.puddles) {
    const fade = q.life - q.t < 1 ? qa(q.life - q.t) : 1, x = q.x - G.cam.x, y = q.y - G.cam.y;
    ctx.globalAlpha = fade; pxEllipseFill(x, y, q.r, q.r * 0.55, '#a8682a'); pxEllipseFill(x - 1, y - 1, q.r - 2, q.r * 0.55 - 2, '#cc8c3c'); R(Math.round(x - q.r / 3), Math.round(y - q.r * 0.25), 3, 1, '#fadca0'); ctx.globalAlpha = 1;
  }
}
function drawCritterShots() {
  for (const s of CR.shots) {
    if (s.kind === 'acorn') { const x = Math.round(s.x - G.cam.x), y = Math.round(s.y - G.cam.y); R(x - 2, y - 1, 4, 4, '#8a5428'); R(x - 2, y - 2, 4, 2, '#5a3416'); R(x, y - 3 + (Math.floor(s.spin) & 1), 1, 1, '#5a3416'); }
    if (s.kind === 'glob') {
      const k = s.t / s.dur, x = s.x + (s.tx - s.x) * k - G.cam.x, y = s.y + (s.ty - s.y) * k - Math.sin(k * Math.PI) * 40 - G.cam.y;
      ctx.globalAlpha = 0.5; pxEllipseFill(s.tx - G.cam.x, s.ty - G.cam.y, 5 * k + 2, 2 * k + 1, '#7a4818'); ctx.globalAlpha = 1;
      pxEllipseFill(x, y, 3, 3, '#cc8c3c'); R(Math.round(x) - 1, Math.round(y) - 2, 2, 1, '#fadca0');
    }
  }
  for (const f of CR.freed) {
    const x = Math.round(f.x - G.cam.x), y = Math.round(f.y - G.cam.y), hop = Math.round(Math.abs(Math.sin(f.t * 12)) * 4);
    ctx.globalAlpha = f.life - f.t < 0.5 ? qa((f.life - f.t) * 2) : 1;
    spr(SPR[`${f.type}free_${Math.floor(f.t * 10) % 2}${f.vx < 0 ? 'f' : ''}`], x, y + 6 - hop);
    if (Math.floor(f.t * 4) % 2) text('♥', x + 6, y - 14 - Math.round(f.t * 8), '#ff9aa2', 'left', false);
    ctx.globalAlpha = 1;
  }
}

// ---------------- Q44: the riddle in Chilly's throne ----------------
const RIDDLES = [
  { q: 'What has keys but can\'t open locks?', a: 'A piano', wrong: ['A jail', 'A penguin', 'A map'] },
  { q: 'What gets wetter the more it dries?', a: 'A towel', wrong: ['The lake', 'A fish', 'Snow'] },
  { q: 'What has to be broken before you can use it?', a: 'An egg', wrong: ['A sword', 'Ice', 'A rule'] },
  { q: 'I have a head and a tail but no body. What am I?', a: 'A coin', wrong: ['A snake', 'Jon', 'A ghost'] },
];
const _sitOnThrone = sitOnThrone;
sitOnThrone = function () {
  if (!flag('king_owen') || flag('riddle_done')) return _sitOnThrone();
  return say(STORY.throne_riddle, askRiddle);
};
function askRiddle() {
  const s = G.save, r = RIDDLES[(s.riddleN || 0) % RIDDLES.length];
  const opts = [r.a, ...r.wrong].sort(() => Math.random() - 0.5);
  ask(r.q, opts.concat(['Not now']), i => {
    if (i < 0 || i === opts.length) return say([['Jon', 'Coward. ...Smart coward. The throne will wait.']]);
    if (opts[i] === r.a) {
      setFlag('riddle_done'); Sound.play('secret'); G.shake = 0.2;
      return say(STORY.throne_riddle_right, () => { setFlag('got:hp_riddle'); giveItem('piece'); writeSave(); });
    }
    s.riddleN = (s.riddleN || 0) + 1; Sound.play('clank');
    say([['', 'Nothing happens. A fish bone falls off the throne.'], ['Jon', pick(['Wrong! Bold, though. Very bold. Look again, there\'s a different riddle now.', 'Nope. I knew it. I was going to say it. I was being polite.', 'The throne said no. Thrones are rude. Try the new one.'])]]);
  });
}

// ---------------- a choice menu, for riddles and anything else that asks ----------------
function ask(prompt, opts, cb) {
  G.choice = { prompt, opts, sel: 0, cb, t: 0 };
  G.state = 'choice'; Sound.play('menu');
}
function updateChoice(dt) {
  const c = G.choice; c.t += dt;
  if (just('down')) { c.sel = (c.sel + 1) % c.opts.length; Sound.play('menu'); }
  if (just('up')) { c.sel = (c.sel + c.opts.length - 1) % c.opts.length; Sound.play('menu'); }
  let pickI = null;
  if (c.t > 0.25 && just('a')) pickI = c.sel;
  if (c.t > 0.25 && just('tap') && G.tapY !== undefined) { const row = Math.floor((G.tapY * VH - CHOICE_Y0) / 14); if (row >= 0 && row < c.opts.length) pickI = row; }
  if (c.t > 0.25 && just('b')) pickI = -1;
  if (pickI === null) return;
  G.choice = null; G.state = 'play'; Sound.play('menu');
  c.cb(pickI);
}
const CHOICE_Y0 = 104;
function drawChoice() {
  const c = G.choice; if (!c) return;
  ctx.globalAlpha = 0.55; R(0, 0, VW, VH, '#000'); ctx.globalAlpha = 1;
  drawPaper(22, 30, 212, 60, -0.01);
  const lines = wrap(c.prompt, 176);
  lines.slice(0, 3).forEach((l, i) => text(l, 44, 50 + i * 12, INK, 'left', false));
  drawPanel(40, CHOICE_Y0 - 8, 176, c.opts.length * 14 + 10);
  c.opts.forEach((o, i) => {
    const y = CHOICE_Y0 + i * 14 + 6, on = i === c.sel;
    if (on) { R(46, y - 9, 164, 13, 'rgba(255,216,74,.18)'); text('▶', 52, y, '#ffd84a', 'left', false); }
    text(o, 66, y, on ? '#ffd84a' : '#f6f0dc', 'left', true);
  });
}

// ---------------- Q43: Chilly's arch-enemy, Baron Blubber, and his sauna ----------------
// A walrus who is not helping you. He is just MAD at Chilly. His door is under a bush on the
// Volcano Road, next to a sign that says NO PENGUINS.
function revealSauna() {
  if (G.mapId !== 'overworld') return;
  for (const e of G.ents) {
    if (e.kind !== 'hiddenstairs') continue;
    const tx = Math.floor(e.x / T), ty = Math.floor(e.y / T);
    if (tile(tx, ty) === 'b') continue;
    setTile(tx, ty, '>'); setFlag(`tile:overworld:${tx},${ty}:>`); setFlag('sauna_found');
    e.kind = 'warp'; Sound.play('secret'); G.shake = 0.2; puff(e.x, e.y, '#c8c8d8', 10);
    jonSay('saunastairs', { force: true, face: 'excited' });
  }
}
function talkBaron() {
  if (!flag('baron_met')) return say(STORY.baron_1, () => { setFlag('baron_met'); jonXP(10); writeSave(); });
  return say([['Baron Blubber', pick(STORY.baron_rants)]]);
}
function talkTrophy(e) {
  if (flag('got:hp_baron')) return say([['', 'The case is empty. The label still says "HA."']]);
  return say(STORY.baron_trophy, () => { setFlag('got:hp_baron'); giveItem('piece'); writeSave(); });
}
function drawBaron(e) {
  const x = Math.round(e.x - G.cam.x), y = Math.round(e.y - G.cam.y), breathe = Math.round(Math.sin(G.t * 1.6));
  shadowAt(x, y + 6, 1.6);
  spr(SPR.baron, x, y + 7 + breathe);
  if (Math.floor(G.t * 0.7) % 4 === 0) text('hmph', x + 12, y - 18, '#c8d8e8', 'left', false);
}
function drawTrophy(e) {
  const x = Math.round(e.x - G.cam.x), y = Math.round(e.y - G.cam.y);
  R(x - 7, y - 4, 14, 10, '#5a3a22'); R(x - 6, y - 16, 12, 12, '#c8e8f8'); R(x - 5, y - 15, 10, 10, '#a8d0e8');
  if (!flag('got:hp_baron')) { R(x - 3, y - 8, 6, 2, '#b0304a'); poly([[x, y - 8], [x - 4, y - 12], [x - 4, y - 10], [x, y - 6]], '#f22633'); poly([[x, y - 8], [x + 4, y - 12], [x + 4, y - 10], [x, y - 6]], '#f22633'); }
  R(x - 5, y - 15, 2, 4, 'rgba(255,255,255,.7)');
}
function drawDartboard(e) {
  const x = Math.round(e.x - G.cam.x), y = Math.round(e.y - G.cam.y) - 4;
  R(x - 5, y + 4, 2, 10, '#5a3a22'); R(x + 3, y + 4, 2, 10, '#5a3a22');   // on a little stand
  pxEllipseFill(x, y, 6, 6, '#e8e0c8'); pxEllipse(x, y, 6, 6, '#c0392b'); pxEllipse(x, y, 4, 4, '#2a6a3a');
  R(x - 2, y - 2, 4, 3, '#2a1040'); R(x - 1, y - 1, 1, 1, '#ff3030'); R(x + 1, y - 1, 1, 1, '#ff3030'); R(x - 1, y + 1, 2, 1, '#ffd84a');   // Chilly's face
  R(x + 3, y - 4, 4, 1, '#7fa8c8'); R(x - 6, y + 2, 4, 1, '#7fa8c8');   // two fish stuck in it
}

// ---------------- wiring ----------------
const _makeEnt = makeEnt;
makeEnt = function (d, x, y) {
  const s = G.save, base = { x, y, def: d, kind: d.t };
  switch (d.t) {
    case 'pblion': { if (s.flags.lion_done) return null; const e = makeEnemy('pblion', x, y); e.st = 'sleep'; e.fx = -1; return e; }
    case 'hiddenstairs': return s.flags.sauna_found ? { ...base, kind: 'warp' } : { ...base };
    case 'baron': return { ...base, solid: true, talk: true };
    case 'trophy': return { ...base, solid: true, talk: true };
    case 'dartboard': return { ...base, solid: true, talk: true };
  }
  return _makeEnt(d, x, y);
};
const _interact = interact;
interact = function (e) {
  switch (e.kind) {
    case 'baron': G.player.cd = 0.2; return talkBaron();
    case 'trophy': G.player.cd = 0.2; return talkTrophy(e);
    case 'dartboard': G.player.cd = 0.2; return say(STORY.baron_dartboard);
  }
  return _interact(e);
};
const _drawThing = drawThing;
drawThing = function (e) {
  switch (e.kind) {
    case 'baron': return drawBaron(e);
    case 'trophy': return drawTrophy(e);
    case 'dartboard': return drawDartboard(e);
    case 'hiddenstairs': return;
  }
  return _drawThing(e);
};
const _groundSpeed = groundSpeed;
groundSpeed = p => _groundSpeed(p) * (CR.puddles.length && inPeanutButter(p) ? 0.45 : 1);
const _updateShots = updateShots;
updateShots = function (dt) { _updateShots(dt); updateCritterWorld(dt); };
const _drawShots = drawShots;
drawShots = function () { _drawShots(); drawCritterShots(); };
const _drawDecorGround = drawDecorGround;
drawDecorGround = function () { _drawDecorGround(); drawPuddles(); };
const _loadMap = loadMap;
loadMap = function (...a) { CR.shots = []; CR.puddles = []; CR.freed = []; return _loadMap(...a); };
const _musicFor = musicFor;
musicFor = function () {
  const m = _musicFor();
  if (G.state !== 'title' && G.mode !== 'arena' && G.mapId === 'overworld' && G.ents.some(e => e.type === 'pblion' && e.alive && e.st !== 'sleep')) return 'aero';
  return m;
};
