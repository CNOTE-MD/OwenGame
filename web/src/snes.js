// The SNES-RPG pass: atmosphere (time of day, cloud shadows, snow, fireflies), living ground
// (tall grass, muck), deeper enemies (Spore Cap, Slime, Beetle), damage numbers, a world map,
// collectible rune tablets, and Owen's page-5 beats: the subway, the taxi, and the big log.

// ---------------- time of day ----------------
// A full day lasts 20 real minutes. The overworld is tinted by the hour; interiors are not.
const DAY_SECONDS = 1200;
function clockHour() { return (G.save && G.save.clock !== undefined) ? G.save.clock : 9; }
function updateClock(dt) {
  if (!G.save || G.mode === 'arena') return;
  if (G.save.clock === undefined) G.save.clock = 9;
  G.save.clock = (G.save.clock + dt * 24 / DAY_SECONDS) % 24;
}
function phaseOfDay(h = clockHour()) { return h < 5 ? 'night' : h < 7 ? 'dawn' : h < 18 ? 'day' : h < 20 ? 'dusk' : 'night'; }
function isNight() { return phaseOfDay() === 'night'; }
function skyTint() {
  const h = clockHour();
  const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
  const NIGHT = [8, 14, 70, 0.6], DAWN = [255, 150, 70, 0.22], DAY = [0, 0, 0, 0], DUSK = [130, 60, 120, 0.3];
  let c;
  if (h < 5) c = NIGHT; else if (h < 7) c = mix(NIGHT, DAWN, (h - 5) / 2); else if (h < 8) c = mix(DAWN, DAY, h - 7);
  else if (h < 17) c = DAY; else if (h < 19) c = mix(DAY, DUSK, (h - 17) / 2); else if (h < 21) c = mix(DUSK, NIGHT, (h - 19) / 2); else c = NIGHT;
  return c;
}
const AMB = { clouds: [{ x: 40, y: 30, w: 90, h: 40, s: 7 }, { x: 180, y: 120, w: 120, h: 50, s: 5 }, { x: 300, y: 70, w: 70, h: 30, s: 9 }], flakes: [], flies: [] };
function drawAtmosphere() {
  if (!G.map || !G.map.outdoor || G.mode === 'arena') { AMB.flakes.length = 0; AMB.flies.length = 0; return; }
  const t = G.t, cx = G.cam.x, cy = G.cam.y;
  // cloud shadows drift across by day
  const [r, g, b, a] = skyTint();
  if (a < 0.3) {
    ctx.fillStyle = `rgba(0,0,30,${0.11 * (1 - a * 2)})`;
    for (const c of AMB.clouds) {
      const x = ((c.x + t * c.s) % (VW + 200)) - 100, y = ((c.y + t * c.s * 0.3) % (VH + 120)) - 60;
      ctx.beginPath(); ctx.ellipse(x, y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2); ctx.ellipse(x + c.w * 0.3, y - c.h * 0.2, c.w / 3, c.h / 3, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  // snow on the frozen screens
  if (G.scr.y === 0 && G.scr.x >= 2) {
    while (AMB.flakes.length < 40) AMB.flakes.push({ x: Math.random() * VW, y: Math.random() * VH, s: 10 + Math.random() * 20, w: Math.random() * 6 });
    for (const f of AMB.flakes) { f.y += f.s / 60; f.x += Math.sin(t * 1.5 + f.w) * 0.3; if (f.y > VH) { f.y = -2; f.x = Math.random() * VW; } R(f.x, f.y, f.s > 22 ? 2 : 1, f.s > 22 ? 2 : 1, 'rgba(255,255,255,0.85)'); }
  } else AMB.flakes.length = 0;
  // fireflies at night near grass and water
  if (a > 0.3) {
    while (AMB.flies.length < 14) AMB.flies.push({ x: Math.random() * VW, y: 40 + Math.random() * (VH - 60), p: Math.random() * 6, s: Math.random() * 2 + 1 });
    for (const f of AMB.flies) {
      f.x += Math.sin(t * f.s + f.p) * 0.4; f.y += Math.cos(t * f.s * 0.7 + f.p) * 0.3;
      const glow = Math.max(0, Math.sin(t * 2 + f.p * 3));
      if (glow > 0.2) { ctx.fillStyle = `rgba(200,255,120,${glow * 0.9})`; ctx.fillRect(Math.round(f.x), Math.round(f.y), 2, 2); ctx.fillStyle = `rgba(200,255,120,${glow * 0.25})`; ctx.fillRect(Math.round(f.x) - 1, Math.round(f.y) - 1, 4, 4); }
    }
  } else AMB.flies.length = 0;
  // the tint itself
  if (a > 0) { ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${a})`; ctx.fillRect(0, 0, VW, VH); }
  // stars
  if (a > 0.35) for (let i = 0; i < 30; i++) { const sx = (i * 97) % VW, sy = (i * 53) % 90 + 20; if (Math.floor(t * 2 + i) % 5) R(sx, sy, 1, 1, `rgba(255,255,255,${(a - 0.3) * 2})`); }
}

// ---------------- living ground ----------------
const RUST = { t: 0 };
function updateGround(dt) {
  const p = G.player;
  if (G.state !== 'play' || !p.moving) return;
  const c = tileAt(p.x, p.y + 4);
  RUST.t -= dt;
  if (c === ',' && RUST.t <= 0) { RUST.t = 0.18; for (let i = 0; i < 2; i++) G.fx.push({ kind: 'leaf', x: p.x + rnd(-5, 5), y: p.y + 4, vx: rnd(-20, 20), vy: rnd(-40, -15), grav: 180, t: 0, life: 0.4, color: pick(['#58b840', '#a8e070']) }); }
  if (c === '%' && RUST.t <= 0) { RUST.t = 0.22; Sound.play('mud'); jonSay('muck', { cooldown: 60, face: 'worried' }); for (let i = 0; i < 3; i++) G.fx.push({ x: p.x + rnd(-4, 4), y: p.y + 5, vx: rnd(-25, 25), vy: rnd(-35, -10), grav: 200, t: 0, life: 0.35, color: pick(['#5a3e22', '#7a5a32', '#3a2a16']), size: 2 }); }
}
function groundSpeed(p) { const c = tileAt(p.x, p.y + 4); return c === '%' ? (typeof charmOn === 'function' && charmOn('boots') ? 1 : 0.55) : c === ',' ? 0.9 : 1; }

function renderGroundTile(c, v, frame, snowy) {
  const r = rng(v * 311 + c.charCodeAt(0) * 17);
  return makeTile((P) => {
    if (c === ',') {
      groundFill(P, snowy ? 'snow' : 'grass', r);
      const sway = [0, 1, 0, -1][frame % 4];
      for (let i = 0; i < 9; i++) {
        const x = 1 + Math.floor(r() * 14), base = 15 - Math.floor(r() * 3), h = 6 + Math.floor(r() * 5), lean = (i % 2 ? 1 : -1) * sway;
        for (let k = 0; k < h; k++) { const px = x + Math.round(k / h * lean), col = k > h - 3 ? '#9ee064' : k > h / 2 ? '#5fbb44' : '#2f7a2a'; P(px, base - k, col); }
        P(x + Math.round(lean), base - h, '#c8f08c');
      }
    } else if (c === '%') {
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const n = (x * 5 + y * 11 + v * 7) % 13; P(x, y, n < 2 ? '#3a2816' : n < 7 ? '#5a3e22' : '#4e3620'); }
      // puddles that glint
      for (let i = 0; i < 2; i++) { const x = 2 + Math.floor(r() * 9), y = 3 + Math.floor(r() * 9), w = 3 + Math.floor(r() * 4); for (let k = 0; k < w; k++) { P(x + k, y, '#6a5a44'); P(x + k, y + 1, '#7a6a52'); } if ((frame + i) % 4 === 0) P(x + 1, y, '#c8d0d8'); }
      for (let i = 0; i < 3; i++) P(Math.floor(r() * 16), Math.floor(r() * 16), '#2a1c10');
    } else if (c === 'o') {
      groundFill(P, 'grass', r);
      // one segment of a fat fallen log, bark rings on the ends when a neighbor isn't log
      for (let y = 1; y < 15; y++) for (let x = 0; x < T; x++) { const band = (y + v) % 4; P(x, y, y === 1 || y === 14 ? OUTLINE : band === 0 ? '#8a5a28' : band === 1 ? '#a8723a' : band === 2 ? '#6e4420' : '#946432'); }
      for (let x = 0; x < T; x += 5) { P(x + v % 3, 4, '#5a3418'); P(x + (v + 1) % 3, 9, '#5a3418'); }
      P(3, 6, '#3a7a2a'); P(4, 6, '#58b840'); P(11, 11, '#58b840');
    } else if (c === 'j') {
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) P(x, y, (x % 8 === 0 || y % 8 === 0) ? '#6a6e7a' : (x % 8 === 1 || y % 8 === 1) ? '#9a9eaa' : '#848894');
      if (v === 2) { P(5, 5, '#6a6e7a'); P(6, 5, '#6a6e7a'); }
    } else if (c === 'I') {
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const tile = (x % 4 === 3 || y % 4 === 3); P(x, y, tile ? '#b8c0cc' : y < 8 ? '#e8ecf0' : '#2c5aa0'); }
      if (v === 1) { for (let x = 2; x < 14; x++) P(x, 10, '#ffd84a'); }
    } else if (c === ':') {
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) P(x, y, '#2a2a30');
      for (let x = 0; x < T; x++) { if (x % 6 < 4) { P(x, 2, '#5a4a3a'); P(x, 3, '#5a4a3a'); P(x, 12, '#5a4a3a'); P(x, 13, '#5a4a3a'); } P(x, 5, '#a0a4ac'); P(x, 6, '#6a6e76'); P(x, 10, '#a0a4ac'); P(x, 11, '#6a6e76'); }
    }
  });
}
function drawTileSnes(c, ox, oy, tx, ty) {
  if (!',%ojI:'.includes(c)) return false;
  const v = hash(tx, ty) % 4, snowy = SNOWY(tx, ty);
  const frame = c === ',' ? Math.floor(G.t * 3 + (tx + ty) % 2) % 4 : c === '%' ? Math.floor(G.t * 2) % 4 : 0;
  const key = `S${c}|${v}|${frame}|${snowy ? 1 : 0}`;
  let img = TILE_CACHE.get(key);
  if (img === undefined) { img = renderGroundTile(c, v, frame, snowy); TILE_CACHE.set(key, img); }
  ctx.drawImage(img, ox, oy);
  return true;
}

// ---------------- new enemies ----------------
const SHOTS = [];   // story-mode projectiles (spore spit)
function updateShots(dt) {
  const p = G.player;
  for (const s of SHOTS) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (s.life < 1.4 && dist(s, p) < 7) { s.life = 0; hurtPlayer(1, s); }
    if (s.life < 1.5 && solidAt(s.x, s.y, 'jon')) s.life = 0;
  }
  for (let i = SHOTS.length - 1; i >= 0; i--) if (SHOTS[i].life <= 0) SHOTS.splice(i, 1);
}
function drawShots() { for (const s of SHOTS) { R(s.x - G.cam.x - 2, s.y - G.cam.y - 2, 4, 4, '#b8d860'); R(s.x - G.cam.x - 1, s.y - G.cam.y - 1, 2, 2, '#e8ff9a'); } }

function updateSpore(e, dt, dx, dy, d) {
  // a mushroom that spits from range and ducks under its cap when you get close
  e.hiding = d < 44;
  e.fx = dx / d; e.fy = dy / d;
  if (!e.hiding && d < 120) { e.t2 = (e.t2 || 0) + dt; if (e.t2 > 1.6) { e.t2 = 0; SHOTS.push({ x: e.x, y: e.y, vx: dx / d * 70, vy: dy / d * 70, life: 1.6 }); e.puff = 0.2; Sound.play('throw'); } }
  e.puff = Math.max(0, (e.puff || 0) - dt);
}
function updateSlime(e, dt, dx, dy, d, mr) {
  // hops toward Owen; splits in two when a big one dies (see killEnemy hook)
  e.hop = (e.hop || 0) - dt;
  if (e.hop <= 0) { e.hop = e.mini ? 0.6 : 0.95; e.vx = dx / d * (e.mini ? 110 : 85); e.vy = dy / d * (e.mini ? 110 : 85); e.air = e.mini ? 0.3 : 0.4; }
  if (e.air > 0) { e.air -= dt; tryMove(e, e.vx * dt, e.vy * dt, mr, 'walker'); }
}
function updateBeetle(e, dt, dx, dy, d, mr) {
  // armored: Jon's swing clanks off the shell. A THROW flips it; chop the soft belly before it rights itself
  if (e.flipped > 0) { e.flipped -= dt; e.wiggle = (e.wiggle || 0) + dt * 14; if (e.flipped <= 0) { e.flipped = 0; Sound.play('clank'); } return; }
  e.fx = dx / d; e.fy = dy / d;
  if (d < 100) tryMove(e, dx / d * 26 * dt, dy / d * 26 * dt, mr, 'walker');
}
// returns true if the hit was blocked
function snesDamageRule(e, how, jonHit) {
  if (e.type === 'beetle' && !(e.flipped > 0)) {
    if (how === 'throw') { e.flipped = 3.2; e.wiggle = 0; Sound.play('switch'); floatText(e.x, e.y - 16, 'FLIPPED!', '#ffd84a'); return true; }
    if (jonHit) { Sound.play('clank'); return true; }
  }
  if (e.type === 'spore' && e.hiding && jonHit) { Sound.play('clank'); floatText(e.x, e.y - 14, 'blocked', '#aab'); return true; }
  return false;
}
function snesOnKill(e) {
  if (e.type === 'slime' && !e.mini) {
    for (const k of [-1, 1]) { const m = makeEnemy('slime', e.x + k * 9, e.y); m.mini = true; m.hp = m.max = 1; m.r = 4; m.st = 'idle'; G.ents.push(m); G.roomEnemies = true; }
    Sound.play('splash');
  }
}

const PAL_SPORE = { c: '#d04040', C: '#f06060', d: '#f8e8e0', s: '#e8d8c0', S: '#b8a890', e: '#20141c' };
const SPORE = [['....cccccc....', '..ccCCCCCCcc..', '.cCCdCCCCdCCc.', 'cCCCCCCdCCCCCc', 'cCdCCCCCCCCdCc', '.cccccccccccc.', '....ssssss....', '....seSSes....', '....ssssss....', '....SSSSSS....'],
  ['..............', '..............', '....cccccc....', '..ccCCCCCCcc..', '.cCCdCCCCdCCc.', 'cCCCCCCdCCCCCc', 'cCdCCCCCCCCdCc', '.cccccccccccc.', '....ssssss....', '....SSSSSS....']];
const PAL_SLIME = { b: '#58c0ff', B: '#2878c8', l: '#c8f0ff', e: '#102030' };
const SLIME = [['....bbbb....', '..bblbbbbb..', '.bblbbbbbbb.', '.bbebbbebbb.', 'bbbbbbbbbbbb', 'bbbbbBbbbbbb', '.BBBBBBBBBB.'], ['............', '............', '..bbbbbbbb..', '.bblbbbbbbb.', 'bbbebbbebbbb', 'bbbbbbbbbbbb', 'BBBBBBBBBBBB']];
const PAL_BEETLE = { s: '#2a6a3a', S: '#4aa05a', h: '#8ae0a0', k: '#1a1a1a', b: '#c8a060', e: '#ff4040' };
const BEETLE = [['..k......k..', '...k....k...', '..ssSSSSss..', '.sSShSShSSs.', 'sSSSSSSSSSSs', 'sSSSSSSSSSSs', 'sSSSSSSSSSSs', '.sSSSSSSSSs.', '..ssssssss..', '.k..k..k..k.'],
  ['............', '.k..k..k..k.', '..bbbbbbbb..', '.bbbbbbbbbb.', 'bbbbeebbbbbb', 'bbbbbbbbbbbb', 'bbbbbbbbbbbb', '.bbbbbbbbbb.', '..bbbbbbbb..', '.k..k..k..k.']];
function buildSnesArt() {
  SPR.spore_0 = buildSprite(SPORE[0], PAL_SPORE); SPR.spore_1 = buildSprite(SPORE[1], PAL_SPORE);
  SPR.slime_0 = buildSprite(SLIME[0], PAL_SLIME); SPR.slime_1 = buildSprite(SLIME[1], PAL_SLIME);
  SPR.beetle_0 = buildSprite(BEETLE[0], PAL_BEETLE); SPR.beetle_1 = buildSprite(BEETLE[1], PAL_BEETLE);
  SPR.tablet = buildSprite(['.gggggg.', 'gGGGGGGg', 'gGrGGrGg', 'gGGrrGGg', 'gGrGGrGg', 'gGGGGGGg', 'gGGGGGGg', 'gggggggg'], { g: '#5a5a6c', G: '#8a8a9c', r: '#7fd4ff' });
  SPR.throne = buildSprite(['..gggggggggg..', '.gGGGGGGGGGGg.', '.gGrrrrrrrrGg.', '.gGrrrrrrrrGg.', '.gGrrrrrrrrGg.', 'ggGrrrrrrrrGgg', 'gGGGGGGGGGGGGg', 'gGbbbbbbbbbbGg', 'gGbbbbbbbbbbGg', 'gGGGGGGGGGGGGg', 'gg..........gg'], { g: '#c9a227', G: '#ffd84a', r: '#c0182b', b: '#2f5aa8' });
  SPR.machine = buildSprite(['.mmmmmmmmmm.', 'mMMMMMMMMMMm', 'mMssssssssMm', 'mMsSSSSSSsMm', 'mMssssssssMm', 'mMMMMMMMMMMm', 'mMkkMMMMkkMm', 'mMMMMggMMMMm', 'mMMMMMMMMMMm', 'mmmmmmmmmmmm'], { m: '#2c5aa0', M: '#4a7ac8', s: '#0a1a2a', S: '#5fdc8a', k: '#1a1a1a', g: '#ffd84a' });
  SPR.taxi = buildSprite(['....yyyyyyyy....', '...yYYYYYYYYy...', '..yYwwYYYYwwYy..', '.yYYYYYYYYYYYYy.', 'yyyyyyyyyyyyyyyy', 'yYYYYkkYYkkYYYYy', 'yYYYYYYYYYYYYYYy', '.yyyyyyyyyyyyyy.', '..kk........kk..', '..kk........kk..'], { y: '#c89a18', Y: '#ffd84a', w: '#9fd0ff', k: '#1a1a1a' });
  SPR.bench = buildSprite(['bbbbbbbbbbbbbb', 'BBBBBBBBBBBBBB', 'bbbbbbbbbbbbbb', '.k..........k.', '.k..........k.'], { b: '#a8703c', B: '#c89058', k: '#3a3a4a' });
}
function drawSnesEnemy(e, x, y) {
  const white = e.flash > 0, f = Math.floor(e.wob / 2.5) % 2;
  if (e.type === 'spore') { shadowAt(x, y + 6, 0.9); spr(e.hiding ? SPR.spore_1 : SPR.spore_0, x, y + 7, { white }); if (e.puff > 0) R(x - 1, y - 12, 3, 3, '#e8ff9a'); return true; }
  if (e.type === 'slime') { const s = e.mini ? 0.6 : 1; shadowAt(x, y + 5 * s, s); spr(SPR[e.air > 0 ? 'slime_0' : 'slime_1'], x, y + 6 * s - (e.air > 0 ? Math.sin(e.air * 8) * 6 : 0), { scale: s, white }); return true; }
  if (e.type === 'beetle') { shadowAt(x, y + 6, 1); if (e.flipped > 0) { const w = Math.round(Math.sin(e.wiggle || 0) * 2); spr(SPR.beetle_1, x + w, y + 7, { white }); } else spr(SPR.beetle_0, x, y + 7, { white }); return true; }
  return false;
}

// ---------------- rune tablets ----------------
const TABLET_TOTAL = 8;
const TABLETS = {
  tab_coast: 'Rune tablet: "HANK WAS HERE. HANK THREW THE AXE. HANK IS SORRY."',
  tab_hills: 'Rune tablet: "The smith\'s name is a vegetable. Do not laugh. He hears."',
  tab_lake: 'Rune tablet: "The lake keeps what the lake is given. Unless you have Viking blood. Then it spits."',
  tab_grave: 'Rune tablet: "Chilly cannot stand the sun. That is why he sends birds that cannot fly."',
  tab_volcano: 'Rune tablet: "Behind the forge door: the real name. Behind the real name: the way to end winter."',
  tab_snow: 'Rune tablet: "A penguin in Norway is a lie with feathers."',
  tab_village: 'Rune tablet: "Fjordvik, founded by Hank. Population: brave. Dogs: one, very good."',
  tab_palace: 'Rune tablet: "The King is a cousin. The real one is still out there. Ak."',
};
function tabletsFound() { return Object.keys(TABLETS).filter(k => flag('got:' + k)).length; }
function readTablet(e) {
  const id = e.def.id;
  if (flag('got:' + id)) return say([['', TABLETS[id]]]);
  setFlag('got:' + id); jonXP(8); Sound.play('secret'); JT.queued = 'tablet';
  const n = tabletsFound();
  const lines = [['', TABLETS[id]], ['', `Rune tablet ${n} of ${TABLET_TOTAL} found.`]];
  if (n === TABLET_TOTAL) { say(lines, () => { setFlag('got:hc_tablets'); giveItem('container'); }); return; }
  say(lines, () => writeSave());
}

// ---------------- world map page ----------------
function markSeen() { if (G.mapId === 'overworld') setFlag(`seen:${G.scr.x},${G.scr.y}`); }
const SCREEN_NAMES = { '0,0': 'Foothills', '1,0': 'Muck Forest', '2,0': 'Frozen Path', '3,0': 'Storm Peak', '0,1': 'Fjordvik', '1,1': 'Market', '2,1': 'Lake Jöntuka', '3,1': 'Volcano Road', '0,2': 'Fjord Coast', '1,2': 'Airstrip', '2,2': 'The Beach', '3,2': 'Graveyard' };
function drawMapPage() {
  const s = G.save;
  R(0, 0, VW, VH, 'rgba(5,5,20,.92)'); R(8, 8, 240, 208, '#ffd84a'); R(10, 10, 236, 204, '#0d0d33');
  text('◀ JON', 20, 26, '#8a8ab0', 'left', false); text('MAP OF NORWAY', 128, 26, '#ffe64d', 'center'); text('GEAR ▶', 236, 26, '#8a8ab0', 'right', false);
  const ox = 32, oy = 40, cw = 48, ch = 34;
  for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) {
    const seen = flag(`seen:${x},${y}`), X = ox + x * cw, Y = oy + y * ch;
    const base = !seen ? '#1a1a2e' : y === 0 && x >= 2 ? '#dfe7f2' : x === 3 && y === 1 ? '#7a5a3c' : x === 2 && y === 1 ? '#3868d0' : y === 1 && x <= 1 ? '#6aa84a' : '#48a038';
    R(X, Y, cw - 2, ch - 2, base);
    if (seen) {
      if (x === 1 && y === 0) for (let i = 0; i < 6; i++) R(X + 6 + i * 6, Y + 10 + (i % 2) * 8, 4, 3, '#5a3e22');
      if (y === 1 && x <= 1) { R(X + 10, Y + 8, 10, 8, '#c03a2a'); R(X + 26, Y + 12, 10, 8, '#c03a2a'); }
      if (x === 2 && y === 0) { R(X + 20, Y + 4, 8, 6, '#6aa0d8'); R(X + 23, Y + 2, 2, 3, '#ffd84a'); }
      if (x === 0 && y === 0) R(X + 20, Y + 4, 8, 6, flag('d1done') ? '#8a8a9c' : '#5a5a6c');
      if (x === 3 && y === 1) R(X + 34, Y + 4, 8, 6, '#c2410c');
      if (x === 1 && y === 2) R(X + 8, Y + 14, 30, 6, '#e9edf2');
      if (x === 3 && y === 2) for (let i = 0; i < 4; i++) R(X + 6 + i * 10, Y + 10, 3, 5, '#8a8a99');
    } else text('?', X + cw / 2 - 1, Y + ch / 2 + 3, '#3a3a5a', 'center', false);
    if (G.mapId === 'overworld' && G.scr.x === x && G.scr.y === y && Math.floor(G.t * 3) % 2 === 0) { R(X + cw / 2 - 5, Y + ch / 2 - 5, 8, 8, OUTLINE); R(X + cw / 2 - 4, Y + ch / 2 - 4, 6, 6, '#ffd84a'); }
  }
  const here = G.mapId === 'overworld' ? SCREEN_NAMES[`${G.scr.x},${G.scr.y}`] : G.map.name;
  text(here || '', 128, 150, '#fff', 'center');
  const h = clockHour(), hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
  text(`${phaseOfDay().toUpperCase()}  ${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`, 128, 164, '#a79fc4', 'center', false);
  const pieces = ['hp_forest', 'hp_grave', 'c_cave', 'hp_bjarne'].filter(k => flag('got:' + k) || flag('chest:' + k)).length;
  const conts = ['hc_cavern', 'hc_barrow', 'hc_redeye', 'hc_tablets'].filter(k => flag('got:' + k)).length;
  text(`Heart pieces ${pieces}/4   Containers ${conts}/4`, 20, 184, '#f2ebcc', 'left', false);
  text(`Rune tablets ${tabletsFound()}/${TABLET_TOTAL}` + (tabletsFound() >= TABLET_TOTAL ? '  ✓' : ''), 20, 196, '#c8e8ff', 'left', false);
  text('Side quests ' + ['bjarne_done', 'sven_done'].filter(flag).length + '/2   Chapters ' + (flag('d2done') ? 3 : flag('d1done') ? 2 : 1) + ' of 5', 20, 208, '#f2ebcc', 'left', false);
}

// ---------------- Owen's page 5: subway, taxi, the big log ----------------
function useExchange() {
  if (flag('exchanged')) return say([['', 'The exchangy doohickey blinks. "NO MORE DOLLARS DETECTED." Jon tries to feed it a kroner. It beeps angrily.']]);
  setFlag('exchanged'); G.save.kr += 200; Sound.play('coin'); Sound.play('coin');
  say([['', 'One of those exchangy doohickeys. You feed it your U.S. dollars. It thinks about it. KA-CHUNK.'], ['', 'A couple hundred kroner! (200 kr)'], ['Jon', 'Exchangy doohickey. That is the technical term. I checked.'], ['Owen', 'Some of this is for an uber. Or a taxicab. Whatever Norway has.']], writeSave);
}
function useTaxi(e) {
  const to = e.def.to, fare = 20;
  if (G.save.kr < fare) return say([['Driver', `Forest? Twenty kroner. You have ${G.save.kr}. There\'s an exchange machine in the station.`]]);
  const go = () => { G.save.kr -= fare; Sound.play('coin'); startRide(to); };
  if (to === 'forest') return say([['Driver', 'Where to? ...The forest? With the penguins? Twenty kroner. Hop in.'], ['Jon', 'Shotgun! ...I\'ll ride in the bag. Fine.']], go);
  return say([['Driver', 'Back to the airport? Twenty kroner.'], ['Jon', 'Can we get the window seat this time?']], go);
}
function startRide(to) {
  G.state = 'cutscene';
  G.cutPages = to === 'forest' ? STORY.taxi_out : STORY.taxi_back;
  G.cut = { i: 0 };
  G.cutDone = () => {
    if (to === 'forest') { loadMap('overworld', 23 * T + 8, 12 * T + 8); } else { loadMap('overworld', 20 * T + 8, 37 * T + 8); }
    G.state = 'play'; writeSave();
    if (to === 'forest' && !flag('forest_arrival')) { setFlag('forest_arrival'); say(STORY.forest_arrival); }
    JT.queued = 'taxi';
  };
  Sound.play('door');
  say(G.cutPages[0].lines, nextCutPage);
}
function nextCutPage() {
  G.cut.i++;
  if (G.cut.i >= G.cutPages.length) { const done = G.cutDone; G.cutDone = null; done(); return; }
  if (G.cutPages[G.cut.i].art === 'demon') Sound.play('creep');
  G.state = 'cutscene';
  say(G.cutPages[G.cut.i].lines, nextCutPage);
}
function drawTaxiScene(page) {
  const t = G.t;
  R(0, 0, VW, 140, page.art === 'taxi_night' ? '#101830' : '#7fb6e8');
  R(0, 90, VW, 50, '#2f7a2a');
  for (let i = 0; i < 7; i++) { const x = ((i * 48 - t * 90) % (VW + 60) + VW + 60) % (VW + 60) - 30; R(x + 6, 62, 8, 30, '#6b4322'); ctx.fillStyle = '#1f7a33'; ctx.beginPath(); ctx.arc(x + 10, 58, 16, 0, Math.PI * 2); ctx.fill(); }
  R(0, 104, VW, 24, '#555'); for (let i = 0; i < 8; i++) R(((i * 40 - t * 180) % (VW + 40) + VW + 40) % (VW + 40) - 20, 115, 18, 2, '#ffd84a');
  const bounce = Math.round(Math.sin(t * 14) * 1);
  ctx.save(); ctx.translate(110, 106 + bounce); ctx.scale(2, 2); ctx.drawImage(SPR.taxi, -SPR.taxi.width / 2, -SPR.taxi.height); ctx.restore();
  for (let i = 0; i < 4; i++) R(70 - i * 10 - (t * 60 % 10), 118 + (i % 2) * 2, 4, 2, 'rgba(120,100,80,0.6)');
  text(page.art === 'taxi_night' ? 'FJORDVIK → AIRSTRIP' : 'FJORDVIK T-BANE → THE FOREST', VW / 2, 12, '#888', 'center', false);
}
// the big log
function makeLog(d, x, y) { return { x, y, def: d, kind: 'log', hittable: true, hp: 3, cd: 0, talk: false, onHit() { hitLog(this); } }; }
function hitLog(e) {
  if (e.cd > 0 || e.hp <= 0) return;
  e.cd = 0.3; e.hp--; Sound.play('swing'); leaves(e.x, e.y, ['#a8723a', '#6e4420', '#c89058']);
  G.shake = 0.08;
  if (e.hp > 0) { jonSay('log', { force: true, face: 'excited' }); return; }
  // chopped: both log tiles become path, for good
  const tx = Math.floor(e.x / T), ty = Math.floor(e.y / T);
  for (const yy of [ty, ty + 1]) if (tile(tx, yy) === 'o') { setTile(tx, yy, 's'); setFlag(`tile:${G.mapId}:${tx},${yy}:s`); leaves(tx * T + 8, yy * T + 8, ['#a8723a', '#6e4420', '#c89058']); }
  setFlag('log_chopped'); G.ents = G.ents.filter(o => o !== e); G.shake = 0.3; Sound.play('kill'); Sound.play('secret');
  jonXP(10);
  say(STORY.log_chopped);
}
function checkLogScene() {
  const e = G.ents.find(o => o.kind === 'log');
  if (!e || flag('log_scene')) return;
  if (dist(e, G.player) < 44) { setFlag('log_scene'); setJonFace('excited', 4); say(STORY.log_scene); }
}
