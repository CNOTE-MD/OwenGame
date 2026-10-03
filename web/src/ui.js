// Dialogue, HUD, gear menu, title screen, Flight 364 cutscene.

function say(lines, done) {
  if (!lines || !lines.length) { if (done) done(); return; }
  G.talk = { queue: lines.slice(), done: done || null, cur: null, shown: 0, back: G.state === 'talk' ? 'play' : (G.state === 'hold' ? 'play' : G.state) };
  if (G.talk.back !== 'play' && G.talk.back !== 'cutscene') G.talk.back = 'play';
  G.state = 'talk';
  nextLine();
}
function nextLine() {
  const tk = G.talk;
  if (!tk.queue.length) {
    G.state = tk.back; G.talk = null; if (G.player) G.player.cd = 0.25;
    if (tk.done) tk.done();
    return;
  }
  tk.cur = tk.queue.shift(); tk.shown = 0;
}
function updateTalk(dt) {
  const tk = G.talk, before = Math.floor(tk.shown);
  tk.shown += dt * 55;
  if (Math.floor(tk.shown) !== before && Math.floor(tk.shown) % 3 === 0 && tk.shown < tk.cur[1].length) Sound.play('blip');
  if (just('a') || just('b') || just('tap')) { if (tk.shown < tk.cur[1].length) tk.shown = 999; else nextLine(); }
}
function drawTalk() {
  const tk = G.talk; if (!tk) return;
  const [who, msg] = tk.cur;
  const inCut = tk.back === 'cutscene';
  const top = !inCut && G.player && G.player.y - G.cam.y > 140;
  const by = top ? 26 : 152;
  R(8, by - 2, 240, 66, '#fff'); R(10, by, 236, 62, '#0d0d33');
  let y = by + 12;
  if (who) { text(who, 16, y, '#ffe64d'); y += 12; }
  let left = Math.floor(tk.shown);
  for (const l of wrap(msg, 222).slice(0, who ? 4 : 5)) { text(l.slice(0, Math.max(0, left)), 16, y, '#fff', 'left', false); left -= l.length + 1; y += 10; }
  if (tk.shown >= msg.length && Math.floor(G.t * 3) % 2 === 0) text('▼', 234, by + 58, '#fff', 'left', false);
}

// ---------- HUD (A Link to the Past layout: magic meter, item box, money, keys, life) ----------
function drawHud() {
  const s = G.save, p = G.player;
  R(0, 0, VW, 22, 'rgba(0,0,0,.45)');
  // rune meter
  R(6, 3, 8, 17, '#000'); R(7, 4, 6, 15, '#1a2238');
  const fill = Math.round(15 * s.rune / RUNE_MAX); R(7, 19 - fill, 6, fill, s.rune >= RUNE_MAX ? (Math.floor(G.t * 4) % 2 ? '#7fd4ff' : '#cfefff') : '#2f8fd0');
  // item box
  R(17, 2, 20, 19, '#ffd84a'); R(18, 3, 18, 17, '#0d0d33');
  if (s.items.thunder) drawItemIcon('thunder', 27, 12); else if (s.items.homing) drawItemIcon('homing', 27, 12);
  // kroner, keys
  drawItemIcon('coin', 46, 7); text(String(s.kr).padStart(3, '0'), 52, 11, '#fff');
  if (G.map && G.map.dungeon) { drawItemIcon('key', 46, 17); text('x' + (s.keys[G.mapId] || 0), 52, 20, '#fff'); if (s.bigkeys[G.mapId]) drawItemIcon('bigkey', 82, 15); }
  if (s.potions) { drawItemIcon('juice', 98, 12); text('x' + s.potions, 104, 16, '#fff'); }
  // life
  text('-LIFE-', 190, 9, '#f2ebcc', 'center');
  const n = s.maxHp / 2;
  for (let i = 0; i < n; i++) {
    const v = clamp(p.hp - i * 2, 0, 2) / 2, row = Math.floor(i / 10), col = i % 10;
    drawHeart(144 + col * 9, 12 + row * 8, v, s.voodoo ? '#f22633' : '#9a4dd9');
  }
}

// ---------- gear menu ----------
function objective() {
  const s = G.save;
  if (G.mapId === 'home') return 'Read what Jon carved, then leave through the door.';
  if (!flag('met_astrid')) return 'Find Elder Astrid in Fjordvik: west of the airstrip, then north.';
  if (!s.items.homing && !flag('d1done')) return 'Go to the Penguin Ice Cavern on the Frozen Path (north-east). Find the treasure behind the Penguin Knight.';
  if (!flag('d1done')) return 'Defeat whatever is possessing the penguins at the bottom of the Ice Cavern.';
  return 'Chapter 1 complete! Talk to Astrid. Three sealed rune doors wait for Owen\'s next chapters.';
}
function drawMenu() {
  const s = G.save;
  R(0, 0, VW, VH, 'rgba(5,5,20,.92)');
  R(8, 8, 240, 208, '#ffd84a'); R(10, 10, 236, 204, '#0d0d33');
  text('GEAR', 20, 26, '#ffe64d');
  const slots = [
    ['Jon (swing Z)', 'homing', true, () => drawJonSprite(30, 48, 0)],
    ['Homing Jon (throw X)', 'homing', !!s.items.homing],
    ['Thunder Rune (C)', 'thunder', !!s.items.thunder],
    ['Lingonberry Juice x' + s.potions, 'juice', s.potions > 0],
  ];
  slots.forEach(([label, icon, have, custom], i) => {
    const y = 48 + i * 20;
    R(20, y - 9, 18, 18, '#1a2238');
    if (have) { if (custom) custom(); else drawItemIcon(icon, 29, y); text(label, 44, y + 4, '#fff'); }
    else text('???', 44, y + 4, '#55577a');
  });
  text('Heart pieces: ' + s.pieces + '/4', 20, 138, '#f2ebcc');
  text('Voodoo bond: ' + (s.voodoo ? 'ready' : 'used'), 20, 150, s.voodoo ? '#9be08a' : '#c9a0f0');
  if (G.map.dungeon) text('Keys ' + (s.keys[G.mapId] || 0) + '   Big key: ' + (s.bigkeys[G.mapId] ? 'yes' : 'no'), 20, 162, '#f2ebcc');
  text('QUEST', 20, 180, '#ffe64d');
  wrap(objective(), 214).slice(0, 3).forEach((l, i) => text(l, 20, 192 + i * 10, '#fff', 'left', false));
  text(Sound.muted ? 'M: sound off' : 'M: sound on', 236, 26, '#8a8ab0', 'right', false);
}

// ---------- title ----------
function drawTitle() {
  R(0, 0, VW, VH, '#14121f');
  for (let i = 0; i < 50; i++) R((i * 53) % VW, (i * 97) % 130, 1, 1, i % 3 ? '#4a4570' : '#a79fc4');
  R(0, 150, VW, 74, '#1b3a6b'); R(0, 150, VW, 2, '#73a6f2');
  for (let x = 0; x < VW; x += 32) R(x + (G.t * 8) % 32, 160 + (x / 32 % 3) * 14, 10, 1, '#3d66c4');
  ctx.font = '20px "Press Start 2P", ui-monospace, Menlo, monospace'; ctx.textAlign = 'center';
  ctx.fillStyle = '#000'; ctx.fillText('JÖNTUKA', VW / 2 + 2, 62); ctx.fillStyle = '#8fd0ff'; ctx.fillText('JÖNTUKA', VW / 2, 60);
  text('A VIKING TALE', VW / 2, 80, '#f3ecd2', 'center');
  text('a game by Owen', VW / 2, 96, '#a79fc4', 'center');
  drawJonSprite(VW / 2 + 74 + Math.sin(G.t * 2) * 3, 124, Math.sin(G.t * 1.5) * 0.3);
  const opts = G.titleOpts || titleOptions();
  opts.forEach((o, i) => {
    const sel = i === G.menuSel;
    text((sel ? '> ' : '  ') + o.label, VW / 2 - 58, 170 + i * 14, o.disabled ? '#55577a' : sel ? '#ffd84a' : '#f3ecd2');
  });
  if (G.confirmErase) text('Press Z again to erase your save', VW / 2, 218, '#ff8a8a', 'center');
  const best = G.titleBest || 0; if (best && !G.confirmErase) text('Arena best: wave ' + best, VW / 2, 218, '#a79fc4', 'center');
}
function titleOptions() {
  const has = !!readSave();
  const o = [];
  if (has) o.push({ label: 'CONTINUE', id: 'continue' });
  o.push({ label: 'NEW GAME', id: 'new' });
  o.push({ label: 'VALHALLA ARENA', id: 'arena' });
  return o;
}

// ---------- Flight 364 ----------
function drawCutscene() {
  const c = G.cut, page = STORY.flight[c.i], t = G.t;
  R(0, 0, VW, VH, '#000');
  switch (page.art) {
    case 'plane':
      R(0, 0, VW, 140, '#1b2a55'); for (let i = 0; i < 30; i++) R((i * 71) % VW, (i * 37) % 120, 1, 1, '#8899cc');
      for (let i = 0; i < 4; i++) { const cx = ((i * 90 - t * 20) % 340 + 340) % 340 - 40; R(cx, 100 + i * 8, 40, 8, '#2c3e70'); }
      R(80, 60, 96, 14, '#e9edf2'); R(76, 63, 6, 8, '#e9edf2'); R(172, 52, 10, 10, '#c0392b'); R(110, 72, 30, 6, '#b6bcc6');
      for (let i = 0; i < 7; i++) R(92 + i * 10, 64, 3, 3, '#3a5a8a');
      R(80, 66, 96, 2, '#c0392b');
      break;
    case 'cabin':
    case 'demon': {
      const flick = page.art === 'demon' && Math.sin(t * 23) > 0.6;
      R(0, 0, VW, 140, flick ? '#050505' : '#3a3a48');
      for (let i = 0; i < 5; i++) { R(14 + i * 50, 70, 30, 40, '#2f5aa8'); R(14 + i * 50, 66, 30, 8, '#24488a'); }
      for (let i = 0; i < 4; i++) R(30 + i * 60, 20, 18, 12, flick ? '#111' : '#9fb4d0');
      if (page.art === 'demon') {
        const x = 128, y = 60;
        R(x - 12, y - 20, 24, 50, '#7a1020'); R(x - 9, y - 30, 18, 14, flick ? '#d0ffd0' : '#e8c8b0');
        R(x - 6, y - 26, 4, 3, '#ff1a1a'); R(x + 2, y - 26, 4, 3, '#ff1a1a');
        R(x - 6, y - 19, 12, 2, '#200'); for (let i = 0; i < 4; i++) R(x - 5 + i * 3, y - 19, 1, 3, '#fff');
        for (let i = 0; i < 3; i++) { R(x - 18 - i * 2, y + 6 + i * 3, 6, 1, '#ddd'); R(x + 12 + i * 2, y + 6 + i * 3, 6, 1, '#ddd'); }
        ctx.fillStyle = `rgba(120,0,0,${0.15 + 0.1 * Math.sin(t * 3)})`; ctx.fillRect(0, 0, VW, 140);
      }
      break; }
    case 'land':
      R(0, 0, VW, 140, '#7fb6e8'); R(0, 100, VW, 40, '#549a3d'); R(0, 112, VW, 10, '#777');
      for (let x = 0; x < VW; x += 24) R(x + 4, 116, 12, 2, '#fff');
      R(40 + Math.min(t * 10 % 200, 120), 98, 70, 12, '#e9edf2');
      for (let i = 0; i < 5; i++) R(0, 60 + i * 5, VW, 1, '#9cc8ef');
      break;
  }
  text('FLIGHT 364  ·  NEW YORK → NORWAY', VW / 2, 12, '#888', 'center', false);
}
function startFlight() {
  G.state = 'cutscene'; G.cut = { i: 0 };
  Sound.play('door');
  say(STORY.flight[0].lines, nextFlightPage);
}
function nextFlightPage() {
  G.cut.i++;
  if (G.cut.i >= STORY.flight.length) {
    G.state = 'play';
    const st = MAPS.overworld.ents.find(e => e.t === 'start').at;
    loadMap('overworld', st[0] * T + 8, st[1] * T + 8);
    writeSave();
    say(STORY.arrival);
    return;
  }
  if (STORY.flight[G.cut.i].art === 'demon') Sound.play('creep');
  G.state = 'cutscene';
  say(STORY.flight[G.cut.i].lines, nextFlightPage);
}
