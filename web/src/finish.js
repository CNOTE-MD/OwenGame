// The finishing layer: what separates a good game from a great one once the content is there.
// An ending (credits with your stats), Jon's Trophy Wall and a completion count, an options
// screen (text speed, screen shake, flashes), fast-forward for conversations, and prompts that
// teach the controls by showing them where they are needed.

// ---------------- options ----------------
const OPT = { text: 0, shake: true, flash: true };
try { Object.assign(OPT, JSON.parse(localStorage.getItem('jontuka-options') || '{}')); } catch (e) {}
function saveOptions() { try { localStorage.setItem('jontuka-options', JSON.stringify(OPT)); } catch (e) {} }
const TEXT_SPEEDS = ['NORMAL', 'FAST', 'INSTANT'];
function textRate() { return OPT.text === 2 ? 999 : OPT.text === 1 ? 2.5 : 1; }
function flashAlpha() { return OPT.flash ? 1 : 0.3; }
const OPTION_ROWS = [
  { name: 'Difficulty', get: () => (isEasy() || (!G.save && defaultDiff() === 'easy') ? 'EASY' : 'NORMAL'), set: () => toggleDifficulty(), help: 'Easy: hits hurt half as much.' },
  { name: 'Text speed', get: () => TEXT_SPEEDS[OPT.text], set: () => { OPT.text = (OPT.text + 1) % 3; }, help: 'How fast the words appear.' },
  { name: 'Screen shake', get: () => (OPT.shake ? 'ON' : 'OFF'), set: () => { OPT.shake = !OPT.shake; }, help: 'Off keeps the screen still on big hits.' },
  { name: 'Flashes', get: () => (OPT.flash ? 'FULL' : 'SOFT'), set: () => { OPT.flash = !OPT.flash; }, help: 'Soft dims the bright screen flashes.' },
  { name: "Owen's notes", get: () => (NOTES.on ? 'ON' : 'OFF'), set: () => toggleNotes(), help: 'Owen\'s own notes, shown after scenes.' },
  { name: 'Sound', get: () => (Sound.muted ? 'OFF' : 'ON'), set: () => { Sound.muted = !Sound.muted; }, help: 'Everything. (M)' },
  { name: 'Music', get: () => (Music.on ? 'ON' : 'OFF'), set: () => { Music.on = !Music.on; }, help: 'Just the music. (N)' },
  { name: 'Old TV look', get: () => (G.crt ? 'ON' : 'OFF'), set: () => { G.crt = !G.crt; try { localStorage.setItem('jontuka-crt', G.crt ? '1' : '0'); } catch (e) {} }, help: 'Scan lines, like a 90s TV. (Y)' },
];
function openOptions() { G.opt = { sel: 0 }; Sound.play('menu'); }
function updateOptions() {
  const o = G.opt, n = OPTION_ROWS.length;
  if (just('down')) { o.sel = (o.sel + 1) % n; Sound.play('menu'); }
  if (just('up')) { o.sel = (o.sel + n - 1) % n; Sound.play('menu'); }
  if (just('a') || just('left') || just('right')) { OPTION_ROWS[o.sel].set(); saveOptions(); Sound.play('menu'); }
  if (just('tap') && G.tapY !== undefined) { const row = Math.floor((G.tapY * VH - 50) / 15); if (row >= 0 && row < n) { o.sel = row; OPTION_ROWS[row].set(); saveOptions(); Sound.play('menu'); } else if (G.tapY * VH > 190) G.opt = null; }
  if (just('c') || just('b') || just('menu')) { G.opt = null; Sound.play('menu'); }
}
function drawOptions() {
  if (!G.opt) return;
  R(0, 0, VW, VH, 'rgba(5,5,20,.92)'); drawPanel(8, 8, 240, 208);
  text('OPTIONS', 128, 28, '#ffd84a', 'center', 'outline', 2);
  R(16, 38, 224, 1, '#3a3f80');
  OPTION_ROWS.forEach((r, i) => {
    const y = 60 + i * 15, on = i === G.opt.sel;
    if (on) { R(16, y - 10, 224, 14, 'rgba(255,216,74,.16)'); text('▶', 20, y, '#ffd84a', 'left', false); }
    text(r.name, 34, y, on ? '#ffd84a' : '#f6f0dc', 'left', true);
    text(r.get(), 232, y, on ? '#ffd84a' : '#9be08a', 'right', true);
  });
  R(16, 178, 224, 1, '#3a3f80');
  wrap(OPTION_ROWS[G.opt.sel].help, 216).slice(0, 1).forEach(l => text(l, 128, 190, '#c8e8ff', 'center', false));
  text('In a talk, hold THROW (X) to fast-forward.', 128, 201, '#8a8ab0', 'center', false);
  text('Z: change    C: back', 128, 212, '#8a8ab0', 'center', false);
}

// ---------------- fast-forward a conversation ----------------
// Tap advances as always. Holding THROW (X) runs through the lines, for scenes you've seen.
function talkSkip(dt) {
  const tk = G.talk;
  if (!tk || !held('b')) { G.skipT = 0; return false; }
  G.skipT = (G.skipT || 0) + dt;
  if (G.skipT < 0.45) return false;
  G.skipTick = (G.skipTick || 0) + dt;
  if (G.skipTick > 0.06) { G.skipTick = 0; if (tk.cur && tk.shown < tk.cur[1].length) tk.shown = 999; else nextLine(); }
  return true;
}
function drawSkipHint() { if (G.state === 'talk' && G.skipT > 0.45) text('▶▶ FAST', 244, 12, '#ffd84a', 'right', 'outline'); }

// ---------------- Jon's Trophy Wall ----------------
// Owen's page 2: Jon carved "WORLD'S BEST OWNER OF A FLYING AND TALKING AXE NAMED JON". Jon keeps
// carving. Each trophy is something Owen did; secret ones show as ??? until they're earned.
const freedTotal = () => { const f = (G.save && G.save.freed) || {}; return (f.wombat || 0) + (f.squirrel || 0) + (f.cdog || 0); };
const heartPieces = () => ['hp_forest', 'hp_grave', 'c_cave', 'hp_bjarne', 'hp_squirrels', 'hp_lion', 'hp_riddle', 'hp_baron'].filter(k => flag('got:' + k) || flag('chest:' + k)).length;
const TROPHIES = [
  { id: 'norway', name: 'Unfinished Business', short: 'Hello, Norway', desc: 'Land in Norway.', ok: () => flag('met_astrid') },
  { id: 'doohickey', name: 'Exchangy Doohickey', short: 'The Doohickey', desc: 'Work the exchange machine in the subway.', ok: () => flag('exchanged') },
  { id: 'peace', name: 'Peace-Giving Speech', short: 'Peace Speech', desc: 'Talk your way past the Forest Giant.', ok: () => flag('giant_peace') },
  { id: 'timber', name: 'TIMBER!', desc: 'Beat the Forest Giant the hard way.', ok: () => flag('giant_done') && !flag('giant_peace'), secret: true },
  { id: 'palace', name: 'Quite the Combo', desc: 'See Jjorvic Palace from the deep forest.', ok: () => flag('page9') },
  { id: 'king', name: 'Ak. Ak. Ak.', desc: 'Defeat the Penguin King.', ok: () => flag('d1done') },
  { id: 'throne', name: 'King Owen', desc: 'Sit on the fish-bone throne.', ok: () => flag('king_owen') },
  { id: 'riddle', name: 'Riddle Me This', desc: 'Solve the riddle in the throne.', ok: () => flag('riddle_done') },
  { id: 'hank', name: 'Hank With a J', desc: 'Free Hank\'s ghost in the Drowned Barrow.', ok: () => flag('d2done') },
  { id: 'lion', name: 'Smooth, Not Crunchy', short: 'Not Crunchy', desc: 'Melt the Peanut Butter Lion.', ok: () => flag('lion_done') },
  { id: 'rescue', name: 'Animal Rescue', desc: 'Free 10 possessed animals.', ok: () => freedTotal() >= 10 },
  { id: 'baron', name: 'Not Helping', desc: 'Find Chilly\'s arch-enemy.', ok: () => flag('baron_met'), secret: true },
  { id: 'rush', name: 'RUSH Ø', desc: 'Play Bjarne\'s masterpiece and pass.', ok: () => flag('rush_cleared') },
  { id: 'songs', name: 'Every Note', desc: 'Help Jon remember all five songs.', ok: () => typeof songsKnown === 'function' && G.mode !== 'arena' && songsKnown() >= 5 },
  { id: 'tablets', name: 'Rune Reader', desc: 'Read all eight rune tablets.', ok: () => tabletsFound() >= TABLET_TOTAL },
  { id: 'hearts', name: 'Big Heart', desc: 'Find all eight heart pieces.', ok: () => heartPieces() >= 8 },
  { id: 'combo', name: 'Combo x10', desc: 'Chain a x10 combo.', ok: () => ((G.save.deeds || {}).combo || 0) >= 10 },
  { id: 'bff', name: 'Best Friends Forever', short: 'BFFs Forever', desc: 'Get Jon to level 10.', ok: () => G.save.jon && G.save.jon.lvl >= 10 },
  { id: 'grave', name: 'He Got Better', desc: 'Visit a certain grave at night.', ok: () => flag('owen_grave'), secret: true },
  { id: 'naps', name: 'Zombies Need Naps', desc: 'Take five naps. It happens.', ok: () => ((G.save.deeds || {}).deaths || 0) >= 5, secret: true },
  { id: 'arena', name: 'Valhalla', desc: 'Reach wave 10 in the Valhalla Arena.', ok: () => arenaBest() >= 10 },
  { id: 'end', name: 'To Be Continued', desc: 'Watch the credits.', ok: () => flag('credits_seen') },
];
function trophyCount() { const t = (G.save && G.save.trophies) || {}; return TROPHIES.filter(x => t[x.id]).length; }
const TOASTS = [];
let trophyT = 0;
function updateTrophies(dt) {
  if (!G.save || G.mode === 'arena' || !G.player) return;
  if (!G.creditsDue && flag('chapter2_banner') && !flag('credits_seen') && G.mapId === 'overworld') G.creditsDue = true;   // also catches a save made before the credits ran
  if (G.creditsDue && !(G.bannerT > 0) && !G.trans) { G.creditsDue = false; return startCredits(); }
  trophyT += dt; if (trophyT < 0.5) return; trophyT = 0;
  const got = G.save.trophies || (G.save.trophies = {});
  for (const t of TROPHIES) {
    if (got[t.id]) continue;
    let ok = false; try { ok = t.ok(); } catch (e) {}
    if (!ok) continue;
    got[t.id] = true; TOASTS.push({ name: t.name, t: 0 });
  }
}
function drawToasts() {
  const a = TOASTS[0]; if (!a) return;
  if (G.state !== 'play' || G.bossCard || G.chapterCard || G.bannerT > 0 || G.trans) return;   // wait for a quiet moment
  if (a.t === 0) { Sound.play('secret'); jonSay('trophy', { face: 'excited' }); }
  a.t += 1 / 60;
  const life = 3.2, k = Math.min(1, a.t / 0.25), out = Math.max(0, (a.t - (life - 0.3)) / 0.3);
  const w = Math.max(120, textWidth(a.name) + 44), x = Math.round(128 - w / 2), y = Math.round(-26 + 56 * k - 40 * out);
  drawPanel(x, y, w, 24);
  drawCup(x + 13, y + 12, true);
  text('TROPHY', x + 26, y + 10, '#ffd84a', 'left', false); text(a.name, x + 26, y + 20, '#f6f0dc', 'left', true);
  if (a.t > life) TOASTS.shift();
}
function drawCup(x, y, have) {
  const c = have ? '#ffd84a' : '#3a3f70', d = have ? '#c89a18' : '#2a2e58';
  R(x - 4, y - 5, 8, 6, c); R(x - 6, y - 4, 2, 3, d); R(x + 4, y - 4, 2, 3, d); R(x - 2, y + 1, 4, 1, d); R(x - 1, y + 2, 2, 2, c); R(x - 3, y + 4, 6, 1, d);
  if (have) R(x - 3, y - 4, 1, 3, '#fff6c0');
}
function updateWall() {
  const n = TROPHIES.length;
  if (just('down')) { G.wallSel = ((G.wallSel || 0) + 1) % n; Sound.play('menu'); }
  if (just('up')) { G.wallSel = ((G.wallSel || 0) + n - 1) % n; Sound.play('menu'); }
}
function drawWall() {
  const got = (G.save && G.save.trophies) || {}, n = TROPHIES.length, have = trophyCount(), sel = G.wallSel || 0;
  R(0, 0, VW, VH, 'rgba(5,5,20,.92)'); drawPanel(8, 8, 240, 208);
  text("JON'S TROPHY WALL", 20, 46, '#ffd84a'); text(`${have}/${n}  ${Math.round(100 * have / n)}%`, 236, 46, have === n ? '#9be08a' : '#c8e8ff', 'right');
  const rows = Math.ceil(n / 2);
  TROPHIES.forEach((t, i) => {
    const col = i < rows ? 0 : 1, row = col ? i - rows : i, x = 18 + col * 114, y = 62 + row * 11, on = i === sel, h = !!got[t.id];
    if (on) R(x - 3, y - 9, 113, 11, 'rgba(255,216,74,.16)');
    drawCup(x + 4, y - 3, h);
    text(h || !t.secret ? (t.short || t.name) : '???', x + 14, y, h ? '#f6f0dc' : '#6a6c94', 'left', false);
  });
  R(16, 192, 224, 1, '#3a3f80');
  const s = TROPHIES[sel], known = got[s.id] || !s.secret;
  text(known ? s.name : '???', 20, 203, got[s.id] ? '#ffd84a' : '#8a8ab0', 'left', false);
  text(known ? s.desc : 'A secret. Keep exploring.', 20, 213, '#c8e8ff', 'left', false);
}

// ---------------- the ending: credits, with what you did ----------------
function jonRank() {
  const k = trophyCount() / TROPHIES.length;
  return k >= 0.9 ? "World's Best Owner of a Flying and Talking Axe" : k >= 0.6 ? 'Legend of Fjordvik' : k >= 0.3 ? 'Certified Viking' : 'Apprentice Chopper';
}
function creditLines() {
  const d = (G.save && G.save.deeds) || {}, mins = Math.floor((d.seconds || 0) / 60);
  const L = [];
  const big = t => L.push({ t, big: true, h: 26 }), head = t => L.push({ t, head: true, h: 16 }), line = (t, c) => L.push({ t, c, h: 12 }), gap = (h = 14) => L.push({ t: '', h });
  const who = (name, role, draw) => L.push({ t: name, role, draw, h: 26 });
  gap(20); big('JÖNTUKA'); line('A VIKING TALE', '#ffd84a'); gap(22);
  head('WRITTEN BY'); big('OWEN'); line('in pencil, in a spiral notebook'); gap(22);
  head('STARRING');
  who('Owen', 'an undead voodoo magic zombie', (x, y) => spr(SPR.owen_down_w0 || SPR.owen_down_0, x, y + 8));
  who('Jon', 'a flying, talking, singing magical Viking axe', (x, y) => drawJonSprite(x, y, Math.sin(G.t * 3) * 0.2, false, 'excited'));
  who('The Forest Giant of the North', 'he was the log', (x, y) => spr(SPR.giant, x, y + 10));
  who('The Penguin King', 'ak. ak. ak.', (x, y) => { spr(SPR.peng_down_0, x, y + 8); if (SPR.crown) spr(SPR.crown, x, y - 3); });
  who('Elder Astrid', 'knows more than she says', (x, y) => spr(SPR.npc_astrid, x, y + 8));
  who('Hank', 'threw the axe in the lake', (x, y) => spr(SPR.draugr_down_0, x, y + 8));
  who('Fluffy', 'just a random dog', (x, y) => spr(SPR.fluffy, x, y + 6));
  who('The Peanut Butter Lion', 'smooth, not crunchy', (x, y) => spr(SPR.lion_0, x, y + 8));
  who('Baron Blubber', 'not helping', (x, y) => spr(SPR.baron, x, y + 9));
  gap(16);
  head('MUSIC'); line('in the sound of Owen\'s bands'); line('Rush, Queen, Led Zeppelin, Journey,'); line('Aerosmith and Foreigner'); gap(8); line('with Edvard Grieg of Norway,'); line('J. S. Bach and L. van Beethoven'); gap(8); line('and public-domain rock by'); line('nene, R0rque, ZeMystic'); line('and continuum.mid'); gap(8); line('all played by Jon\'s band'); gap(22);
  head('YOUR ADVENTURE');
  line(`Time played: ${mins} min`); line(`Chops: ${d.kills || 0}    Best combo: x${d.combo || 0}`); line(`Naps: ${d.deaths || 0}    Animals freed: ${freedTotal()}`);
  line(`Trophies: ${trophyCount()} of ${TROPHIES.length}`); gap(8);
  line('Jon says you are a', '#8a8ab0'); line(jonRank().toUpperCase(), '#ffd84a'); gap(26);
  head('NEXT'); line("Walter's Forge. The Storm Peak."); line('And whoever said "How can I be of service?"'); gap(26);
  big('TO BE CONTINUED...'); line('when Owen writes the next page', '#c8e8ff'); gap(40);
  return L;
}
function startCredits() {
  if (G.mode === 'arena') return;
  G.credits = { t: 0, lines: creditLines() }; G.credits.total = G.credits.lines.reduce((a, l) => a + l.h, 0);
  G.state = 'credits'; G.bannerT = 0;
}
function updateCredits(dt) {
  const c = G.credits; c.t += dt * (held('a') || held('b') ? 5 : 1);
  if (c.t * 22 > c.total + VH - 40 || just('menu')) { G.credits = null; G.state = 'play'; setFlag('credits_seen'); writeSave(); }
}
function drawCredits() {
  const c = G.credits, t = G.t;
  const SKY = ['#070818', '#0a0c24', '#0e1030', '#13153c', '#191a48', '#211f52', '#2b2459'];
  SKY.forEach((col, i) => R(0, i * 32, VW, 32, col));
  for (let i = 0; i < 80; i++) { const x = (i * 53 + 7) % VW, y = (i * 97) % VH; if ((Math.floor(t * 2 + i * 0.7)) % 7) R(x, y, 1, 1, i % 4 ? '#5a5690' : '#e8e4ff'); }
  let y = VH - c.t * 22;
  for (const l of c.lines) {
    if (y > -30 && y < VH + 10) {
      if (l.draw) { l.draw(64, Math.round(y + 8)); text(l.t, 84, Math.round(y + 8), '#f6f0dc', 'left', true); text(l.role, 84, Math.round(y + 18), '#8a8ab0', 'left', false); }
      else if (l.big) text(l.t, 128, Math.round(y + 16), '#ffd84a', 'center', 'outline', 2);
      else if (l.head) text(l.t, 128, Math.round(y + 10), '#7fd4ff', 'center', false);
      else if (l.t) text(l.t, 128, Math.round(y + 9), l.c || '#f6f0dc', 'center', true);
    }
    y += l.h;
  }
  R(0, 0, VW, 10, '#070818'); R(0, VH - 12, VW, 12, '#2b2459');
  text('hold Z: faster', 250, VH - 3, '#55577a', 'right', false);
}

// ---------------- prompts: show the control where it is needed ----------------
const TOUCH = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
const BTN = { a: TOUCH ? 'SWING' : 'Z', b: TOUCH ? 'THROW' : 'X', menu: TOUCH ? 'GEAR' : 'Enter', dash: TOUCH ? 'DASH' : 'Shift' };
function interactTarget() {
  const p = G.player; if (!p || G.state !== 'play' || G.mode === 'arena') return null;
  const f = facing4(p), px = p.x + f.x * 13, py = p.y + f.y * 13;
  return G.ents.find(e => e.talk && e.kind !== 'log' && Math.abs(e.x - px) < 11 && Math.abs(e.y - py) < 11) || null;
}
function drawInteractPrompt() {
  const e = interactTarget(); if (!e) return;
  const x = Math.round(e.x - G.cam.x), y = Math.round(e.y - G.cam.y) - 22 - Math.round(Math.abs(Math.sin(G.t * 5)) * 2), w = textWidth(BTN.a) + 6;
  R(x - w / 2 - 1, y - 6, w + 2, 11, '#0a0812'); R(x - w / 2, y - 5, w, 9, '#ffd84a'); R(x - 1, y + 4, 2, 2, '#ffd84a'); R(x - 1, y + 5, 2, 1, '#0a0812');
  text(BTN.a, x, y + 2, '#2a1a10', 'center', false);
}
const HINTS = [
  { id: 'move', text: () => (TOUCH ? 'Drag the stick to walk' : 'Arrow keys or WASD to walk'), when: () => G.mapId === 'home', done: () => G.player.moving },
  { id: 'look', text: () => `${BTN.a}: talk, read and look`, when: () => !!interactTarget(), done: () => false },
  { id: 'chop', text: () => `${BTN.a}: chop    ${BTN.b}: throw Jon`, when: () => G.ents.some(e => e.enemy && e.alive && dist(e, G.player) < 90), done: () => G.jon && G.jon.mode !== 'follow' },
  { id: 'gear', text: () => `${BTN.menu}: quest, map, trophies, options`, when: () => G.mapId === 'overworld' && flag('met_astrid'), done: () => false },
];
function setHintDone(id) { if (G.save && !flag('hint:' + id)) setFlag('hint:' + id); }
function drawHints() {
  if (G.state !== 'play' || G.mode === 'arena' || !G.save || G.trans) return;
  for (const h of HINTS) {
    if (flag('hint:' + h.id)) continue;
    if (!h.when()) continue;
    h.t = (h.t || 0) + 1 / 60;
    if (h.done() || h.t > 9) { setHintDone(h.id); continue; }
    const s = h.text(), w = textWidth(s) + 16, x = Math.round(128 - w / 2);
    ctx.globalAlpha = Math.min(1, h.t * 4); R(x - 1, 197, w + 2, 17, '#0a0812'); R(x, 198, w, 15, '#232860'); R(x, 198, w, 1, '#e8dcb8'); R(x, 212, w, 1, '#e8dcb8');
    text(s, 128, 209, '#f6f0dc', 'center', true); ctx.globalAlpha = 1;
    return;
  }
}

// ---------------- wiring ----------------
const _interactF = interact;
interact = function (e) { setHintDone('look'); return _interactF(e); };
const _musicForF = musicFor;
musicFor = function () { return G.state === 'credits' ? 'journey' : _musicForF(); };
MENU_TABS.push('WALL');
JON.trophy = ['I\'m carving that one on the wall!', 'TROPHY! I carve, you earn. Teamwork.', 'That goes right next to "World\'s Best Owner."', 'Another one for the wall, Señor!'];

// ---------------- fixes found by playing it through ----------------
// 1. Never leave Owen wedged in a wall. If he is ever overlapping something solid (a pixel into
//    the plane's hull, say), slide him to the nearest free spot before moving.
const _tryMoveF = tryMove;
tryMove = function (n, mx, my, r, who) {
  if (who === 'player' && blocked(n.x, n.y, r, who, n)) {
    search: for (let d = 1; d <= 6; d++) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      if (!blocked(n.x + dx * d, n.y + dy * d, r, who, n)) { n.x += dx * d; n.y += dy * d; break search; }
    }
  }
  return _tryMoveF(n, mx, my, r, who);
};
// 2. Owen's page 5 is how you first reach the forest: subway, exchange machine, taxi. Until
//    that ride, the walk from the Foothills is too deep in muck. Afterwards it is a shortcut.
function drawRoadblock(e) {
  const x = Math.round(e.x - G.cam.x), y = Math.round(e.y - G.cam.y);
  R(x - 8, y - 8, 16, 16, '#4a3a22'); R(x - 8, y - 8, 16, 2, '#5e4a2c');
  for (let i = 0; i < 4; i++) { const bx = x - 6 + ((i * 7 + e.y) % 11), by = y - 5 + ((i * 5) % 9), k = Math.floor(G.t * 1.5 + i + e.y) % 3; R(bx, by, 3, 2, '#3a2c18'); if (k === 0) R(bx + 1, by - 2, 1, 1, '#7a6a4a'); }
  R(x - 7, y + 3, 4, 3, '#2f5a2a'); R(x + 2, y - 6, 5, 3, '#2f5a2a'); R(x + 3, y - 7, 2, 1, '#58b840');
}
const _makeEntF = makeEnt;
makeEnt = function (d, x, y) {
  if (d.t === 'roadblock') return G.save.flags.forest_arrival ? null : { x, y, def: d, kind: 'roadblock', solid: true, talk: true };
  return _makeEntF(d, x, y);
};
const _interactF2 = interact;
interact = function (e) {
  if (e.kind === 'roadblock') { G.player.cd = 0.2; return say(STORY.roadblock); }
  return _interactF2(e);
};
const _drawThingF = drawThing;
drawThing = function (e) { if (e.kind === 'roadblock') return drawRoadblock(e); return _drawThingF(e); };
// 3. Floating words stack upward instead of printing on top of each other.
const _floatTextF = floatText;
floatText = function (x, y, label, color) {
  for (let n = 0; n < 4; n++) { if (!G.fx.some(f => f.kind === 'text' && f.t < 0.6 && Math.abs(f.x - x) < 44 && Math.abs((f.y - f.t * 12) - y) < 9)) break; y -= 10; }
  return _floatTextF(x, y, label, color);
};
