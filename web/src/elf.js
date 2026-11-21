// Owen's page 10: the elf. "Behind us was an elf (maybe a dwarf with a pointy hat on) no bigger
// than a lawn chair." They ask "How can I be of service?", say Chilly has already been slain by
// the warrior of Hüngrruk Alkāmö, and say "Come on, over here." That is where Owen's page ends.
// What follows is a draft built on that one line: inside the palace the elf really is of service
// (hints, and the floor plan on the MAP page), and housekeeping has an ice-block puzzle.

// ---------------- the elf ----------------
const PAL_ELF = { r: '#c0392b', R: '#e85a48', w: '#f4f4f8', s: '#f0c8a0', e: '#20141c', b: '#d8d8e0', g: '#2f8a4a', G: '#3aa85a', y: '#ffd84a', k: '#3a2418' };
const ELF_ROWS = [
  ['......r...', '.....rR...', '....rRr...', '...rRRrr..', '..wwwwwww.', '...sssss..', '...sesse..', '...sssss..', '...bbbbb..', '..ggbbbgg.', '..gGGyGGg.', '..ggggggg.', '...k...k..'],
  ['......r...', '.....rR...', '....rRr...', '...rRRrr..', '..wwwwwww.', '...sssss..', '...sesse..', '...sssss..', '...bbbbb..', '..ggbbbgg.', '..gGGyGGg.', '..ggggggg.', '....k.k...'],
];
function buildElfArt() {
  ELF_ROWS.forEach((r, i) => { SPR['elf_' + i] = buildSprite(r, PAL_ELF); });
  SPR.npc_elf = SPR.elf_0; SPR.npc_elf_blink = buildSprite(ELF_ROWS[0].map(r => r.replace(/e/g, 's')), PAL_ELF);
  SPR.icon_skates = buildSprite(['.ww.....', '.ww.....', '.www....', '.wwwww..', '.wwwwww.', '..k..k..', 'bbbbbbbb', '........'], { w: '#f4f4f8', k: '#8a8a9c', b: '#7fd4ff' });
}
PORTRAIT_NPC.Elf = 'elf';
function elfArrives(late) {
  const p = G.player;
  // behind Owen: he is looking up at the palace, so the elf pops in below him
  let ex = p.x, ey = p.y + 18; if (blocked(ex, ey, 4, 'walker')) { ex = p.x + 16; ey = p.y; }
  const e = { kind: 'elf', x: ex, y: ey, talk: true, hop: 0, def: { t: 'elf' } };
  G.ents = G.ents.filter(o => o.kind !== 'elf'); G.ents.push(e);
  puff(ex, ey, '#ffffff', 10); Sound.play('secret');
  p.fx = Math.sign(ex - p.x); p.fy = ex === p.x ? 1 : 0;
  say(late ? [...STORY.elf_late, ...STORY.elf_meet] : STORY.elf_meet, () => {
    setFlag('page10'); e.path = [[39 * T + 8, 6 * T + 8], [38 * T + 8, 4 * T + 8]]; writeSave();
  });
}
function talkElf(e) {
  G.player.cd = 0.2;
  if (G.mapId !== 'cavern') return say(STORY.elf_door);
  say(STORY.elf_lobby, () => ask('How can I be of service?', ['Where do I go next?', 'What is this place?', 'Nothing, thanks.'], i => {
    if (i === 0) return say([['Elf', palaceHint()]]);
    if (i === 1) return say(STORY.elf_place);
    say(STORY.elf_bye);
  }));
}
// the concierge knows the building: one hint for wherever Owen is in the palace
function palaceHint() {
  const s = G.save, opened = id => flag('chest:' + id);
  if (flag('d1done')) return flag('puzzle_palace') ? 'You have seen everything, sir. Checkout is whenever you like.' : 'Housekeeping, west of this lobby, has misplaced something under the ice. Two blocks, two plates.';
  if (s.bigkeys && s.bigkeys.cavern) return 'The throne room is behind the big door at the very top. The big key fits it.';
  if (flag('cavern:gates')) return 'The gate is down. The upper west wing keeps the big key. The Royal Guards keep the upper west wing.';
  if (s.items.homing) return 'There is a crystal switch across the pit, north of the ice ballroom. Throw your axe at it. He knows the way now.';
  if (opened('cv_key1') || opened('cv_key2')) return 'Small keys open the locked doors north of the ice ballroom. A knight in the upper east wing guards something your axe will want.';
  return 'Two small keys, sir. One in the west wing, with the bats. One in the east wing, past the holes in the floor.';
}
function drawElf(e) {
  const x = Math.round(e.x - G.cam.x), y = Math.round(e.y - G.cam.y), moving = !!(e.path && e.path.length);
  const hop = moving ? Math.round(Math.abs(Math.sin(G.t * 12)) * 3) : 0;
  shadowAt(x, y + 5, 0.8);
  spr(SPR['elf_' + (moving ? Math.floor(G.t * 8) % 2 : 0)], x, y + 6 - hop);
  if (!moving && G.mapId === 'cavern' && Math.floor(G.t * 0.8) % 3 === 0) text('?', x + 7, y - 12, '#9be08a', 'left', 'outline');
}

// ---------------- housekeeping: the ice block puzzle ----------------
// Push a block and it slides until something stops it. Cover both plates and a chest rises.
// Leaving the room puts the blocks back.
const blockTile = e => [Math.floor(e.x / T), Math.floor(e.y / T)];
function tileFreeForBlock(tx, ty, self) {
  if (solidTile(tx, ty, 'walker')) return false;
  const sx = G.scr.x * 16, sy = G.scr.y * 14;
  if (tx <= sx || tx >= sx + 15 || ty <= sy || ty >= sy + 13) return false;      // never out through a doorway
  return !G.ents.some(o => o !== self && o.solid && Math.floor(o.x / T) === tx && Math.floor(o.y / T) === ty);
}
function updateIceBlocks(dt) {
  const p = G.player, v = inputVec();
  let moved = false;
  for (const b of G.ents) {
    if (b.kind !== 'iceblock') continue;
    if (b.to) {
      const dx = b.to.x - b.x, dy = b.to.y - b.y, d = Math.hypot(dx, dy), step = 150 * dt;
      if (d <= step) { b.x = b.to.x; b.y = b.to.y; b.to = null; Sound.play('clank'); G.shake = Math.max(G.shake, 0.08); moved = true; }
      else { b.x += dx / d * step; b.y += dy / d * step; }
      continue;
    }
    const dx = b.x - p.x, dy = b.y - p.y;
    let dir = null;
    if (Math.abs(dy) < 7 && Math.abs(dx) > 8 && Math.abs(dx) < 15 && Math.abs(v.x) > 0.7 && Math.sign(v.x) === Math.sign(dx)) dir = [Math.sign(dx), 0];
    else if (Math.abs(dx) < 7 && Math.abs(dy) > 8 && Math.abs(dy) < 15 && Math.abs(v.y) > 0.7 && Math.sign(v.y) === Math.sign(dy)) dir = [0, Math.sign(dy)];
    b.pushT = dir ? (b.pushT || 0) + dt : 0;
    if (b.pushT > 0.22) {
      b.pushT = 0;
      let [tx, ty] = blockTile(b), n = 0;
      while (tileFreeForBlock(tx + dir[0], ty + dir[1], b)) { tx += dir[0]; ty += dir[1]; n++; }
      if (n) { b.to = { x: tx * T + 8, y: ty * T + 8 }; Sound.play('swing'); } else Sound.play('clank');
    }
  }
  if (moved && !flag('puzzle_palace')) {
    const plates = G.ents.filter(e => e.kind === 'plate'), blocks = G.ents.filter(e => e.kind === 'iceblock');
    if (plates.length && plates.every(pl => blocks.some(b => !b.to && Math.abs(b.x - pl.x) < 3 && Math.abs(b.y - pl.y) < 3))) {
      setFlag('puzzle_palace'); Sound.play('secret'); G.shake = 0.3;
      const d = MAPS[G.mapId].ents.find(o => o.id === 'cv_skates');
      if (d) { const c = makeEnt(d, d.at[0] * T + 8, d.at[1] * T + 8); if (c) { G.ents.push(c); puff(c.x, c.y, '#cfefff', 14); } }
      say(STORY.puzzle_done, writeSave);
    }
  }
}
function drawIceBlock(e) {
  const x = Math.round(e.x - G.cam.x), y = Math.round(e.y - G.cam.y);
  shadowAt(x, y + 7, 1.2);
  R(x - 8, y - 9, 16, 16, '#0a0812'); R(x - 7, y - 8, 14, 14, '#9fd8f4'); R(x - 7, y - 8, 14, 4, '#dff6ff'); R(x - 7, y + 3, 14, 3, '#6aa8d0');
  R(x - 5, y - 6, 2, 6, '#ffffff'); R(x + 2, y - 1, 3, 1, '#dff6ff'); R(x + 3, y + 1, 2, 1, '#dff6ff');
}
function drawPlate(e) {
  const x = Math.round(e.x - G.cam.x), y = Math.round(e.y - G.cam.y);
  const on = G.ents.some(b => b.kind === 'iceblock' && Math.abs(b.x - e.x) < 3 && Math.abs(b.y - e.y) < 3);
  R(x - 7, y - 7, 14, 14, '#1a2a5a'); R(x - 6, y - 6, 12, 12, on ? '#ffd84a' : '#2a4a9a');
  const g = on ? '#fff6c0' : (Math.floor(G.t * 2) % 2 ? '#7fd4ff' : '#4a8ad0');
  R(x - 1, y - 4, 2, 8, g); R(x - 4, y - 1, 8, 2, g);
}

// ---------------- the palace floor plan on the MAP page ----------------
const _markSeenE = markSeen;
markSeen = function () { _markSeenE(); if (G.map && G.map.dungeon && G.scr) setFlag(`room:${G.mapId}:${G.scr.x},${G.scr.y}`); };
function roomExists(M, rx, ry) { for (let y = 1; y < 13; y++) for (let x = 1; x < 15; x++) if (M.rows[ry * 14 + y][rx * 16 + x] !== 'W') return true; return false; }
function drawDungeonMap() {
  const M = G.map, cols = Math.round(M.rows[0].length / 16), rows = Math.round(M.rows.length / 14);
  R(14, 36, 228, 104, '#14163a');
  const cw = Math.min(40, Math.floor(200 / cols)), ch = Math.min(24, Math.floor(100 / rows)), ox = Math.round(128 - cols * cw / 2), oy = 40 + Math.round((100 - rows * ch) / 2);
  const door = c => c !== 'W' && c !== 't';
  for (let ry = 0; ry < rows; ry++) for (let rx = 0; rx < cols; rx++) {
    if (!roomExists(M, rx, ry)) continue;
    const seen = flag(`room:${G.mapId}:${rx},${ry}`), X = ox + rx * cw, Y = oy + ry * ch, here = G.scr.x === rx && G.scr.y === ry;
    R(X + 1, Y + 1, cw - 2, ch - 2, '#0a0812'); R(X + 2, Y + 2, cw - 4, ch - 4, seen ? '#4a5aa8' : '#1e2250');
    // doorways, read off the room's own walls
    const gx = rx * 16, gy = ry * 14, row = y => M.rows[gy + y];
    if (door(row(0)[gx + 7])) R(X + cw / 2 - 2, Y, 4, 2, seen ? '#4a5aa8' : '#1e2250');
    if (door(row(13)[gx + 7])) R(X + cw / 2 - 2, Y + ch - 2, 4, 2, seen ? '#4a5aa8' : '#1e2250');
    for (const y of [6, 9]) { if (door(row(y)[gx])) R(X, Y + ch / 2 - 2, 2, 4, seen ? '#4a5aa8' : '#1e2250'); if (door(row(y)[gx + 15])) R(X + cw - 2, Y + ch / 2 - 2, 2, 4, seen ? '#4a5aa8' : '#1e2250'); }
    if (!seen) { text('?', X + cw / 2 - 1, Y + ch / 2 + 3, '#3a3f80', 'center', false); continue; }
    const inRoom = d => Math.floor(d.at[0] / 16) === rx && Math.floor(d.at[1] / 14) === ry;
    if (M.ents.some(d => d.t === 'chest' && inRoom(d) && !flag('chest:' + d.id) && (!d.needs || flag(d.needs)))) { R(X + 5, Y + ch - 9, 6, 5, '#8a5a28'); R(X + 5, Y + ch - 9, 6, 2, '#ffd84a'); }
    if (M.ents.some(d => ['king', 'knight', 'hank', 'captain'].includes(d.t) && inRoom(d)) && !flag(`clear:${G.mapId}:${rx},${ry}`)) { R(X + cw - 11, Y + 4, 6, 6, '#e23'); R(X + cw - 10, Y + 6, 1, 1, '#000'); R(X + cw - 7, Y + 6, 1, 1, '#000'); }
    if (M.ents.some(d => d.t === 'elf' && inRoom(d)) && flag('page10')) text('?', X + cw - 8, Y + ch - 4, '#9be08a', 'left', false);
    if (here && Math.floor(G.t * 3) % 2 === 0) { R(X + cw / 2 - 3, Y + ch / 2 - 3, 6, 6, '#0a0812'); R(X + cw / 2 - 2, Y + ch / 2 - 2, 4, 4, '#ffd84a'); }
  }
}
const _drawMapPageE = drawMapPage;
drawMapPage = function () { _drawMapPageE(); if (G.map && G.map.dungeon && !G.map.redeye) drawDungeonMap(); };

// ---------------- wiring ----------------
CHARMS.skates = { name: 'Ice Skates', icon: 'skates', desc: 'Ice cannot make you slide.', apply: () => {} };
function updateElfWorld(dt) {
  for (const e of G.ents) {
    if (e.kind !== 'elf' || !e.path || !e.path.length) continue;
    const [tx, ty] = e.path[0], dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy), step = 70 * dt;
    if (d <= step) { e.x = tx; e.y = ty; e.path.shift(); if (!e.path.length) e.solid = true; } else { e.x += dx / d * step; e.y += dy / d * step; }
  }
  if (G.mapId === 'cavern') updateIceBlocks(dt);
}
const _makeEntE = makeEnt;
makeEnt = function (d, x, y) {
  const s = G.save, base = { x, y, def: d, kind: d.t };
  switch (d.t) {
    case 'elf': return s.flags.page10 ? { ...base, solid: true, talk: true } : null;
    case 'plate': return { ...base };
    case 'iceblock': {
      // once solved, the blocks rest on the plates
      if (s.flags.puzzle_palace) { const M = MAPS[G.mapId], i = M.ents.filter(o => o.t === 'iceblock').indexOf(d), pl = M.ents.filter(o => o.t === 'plate')[i]; if (pl) return { ...base, x: pl.at[0] * T + 8, y: pl.at[1] * T + 8, solid: true }; }
      return { ...base, solid: true };
    }
  }
  return _makeEntE(d, x, y);
};
const _interactE = interact;
interact = function (e) { if (e.kind === 'elf') return talkElf(e); return _interactE(e); };
const _drawThingE = drawThing;
drawThing = function (e) {
  switch (e.kind) { case 'elf': return drawElf(e); case 'iceblock': return drawIceBlock(e); case 'plate': return; }
  return _drawThingE(e);
};
const _drawDecorGroundE = drawDecorGround;
drawDecorGround = function () { _drawDecorGroundE(); for (const e of G.ents) if (e.kind === 'plate') drawPlate(e); };
const _onEnterScreenE = onEnterScreen;
onEnterScreen = function () {
  _onEnterScreenE();
  if (G.mapId === 'cavern' && G.scr.x === 0 && G.scr.y === 3 && !flag('intro:puzzle') && G.state === 'play') { setFlag('intro:puzzle'); say(STORY.puzzle_intro); }
};
TROPHIES.splice(TROPHIES.findIndex(t => t.id === 'king'), 0,
  { id: 'elf', name: 'Of Service', desc: 'Meet the elf at Jjorvic Palace.', ok: () => flag('page10') });
TROPHIES.splice(TROPHIES.findIndex(t => t.id === 'hank'), 0,
  { id: 'housekeeping', name: 'Housekeeping', desc: 'Solve the ice block puzzle in the palace.', ok: () => flag('puzzle_palace') });
