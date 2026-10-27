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
// Dialogue: the A Link to the Past box, with the speaker's portrait and a name plate.
const PORTRAIT_NPC = { Astrid: 'astrid', Lars: 'lars', Sven: 'sven', Ingrid: 'ingrid', Bjarne: 'bjarne', Attendant: 'attendant_ok', Commuter: 'commuter' };
function drawPortrait(who, x, y) {
  // x, y: centre of a 30x30 window
  const blink = G.t % 3.4 < 0.12;
  ctx.save(); ctx.translate(x, y); ctx.scale(2, 2);
  if (who === 'Jon') drawJonSprite(0, 1, 0, blink, typeof jonFaceNow === 'function' ? jonFaceNow() : null);
  else if (who === 'Owen') { const key = G.save && (G.save.voodoo || G.mode === 'arena') ? 'owen' : 'zombie'; spr(SPR[key + '_down_w0'], 0, 7); }
  else if (who === 'Penguin King') { spr(SPR.peng_down_0, 0, 6); spr(SPR.crown, 0, -6); }
  else if (who === 'Forest Giant') { ctx.scale(0.5, 0.5); spr(SPR.giant, 0, 16); }
  else if (PORTRAIT_NPC[who]) spr(SPR['npc_' + PORTRAIT_NPC[who] + (blink ? '_blink' : '')] || SPR.npc_sven, 0, 7);
  else { ctx.restore(); return false; }
  ctx.restore(); return true;
}
const HAS_PORTRAIT = who => who === 'Jon' || who === 'Owen' || who === 'Penguin King' || who === 'Forest Giant' || !!PORTRAIT_NPC[who];
function drawTalk() {
  const tk = G.talk; if (!tk) return;
  const [who, msg] = tk.cur;
  const inCut = tk.back === 'cutscene';
  const top = !inCut && G.player && G.player.y - G.cam.y > 140;
  const by = top ? 30 : 156, bx = 6, bw = 244, bh = 62;
  drawPanel(bx, by, bw, bh);
  let tx = bx + 10, tw = bw - 20;
  if (who && HAS_PORTRAIT(who)) {
    R(bx + 6, by + 7, 36, 36, '#0a0812'); R(bx + 7, by + 8, 34, 34, '#2a2f66'); R(bx + 7, by + 8, 34, 12, '#343a7a');
    ctx.save(); ctx.beginPath(); ctx.rect(bx + 7, by + 8, 34, 34); ctx.clip(); drawPortrait(who, bx + 24, by + 24); ctx.restore();
    tx = bx + 48; tw = bw - 56;
  }
  if (who) {
    const nw = textWidth(who) + 12;
    drawPanel(tx - 4, by - 9, nw, 14, { plain: true, field: '#2a1a10', top: '#3a2616' });
    text(who, tx + 2, by + 1, '#ffd84a', 'left', false);
  }
  let left = Math.floor(tk.shown), y = by + 17;
  for (const l of wrap(msg, tw).slice(0, 4)) { text(l.slice(0, Math.max(0, left)), tx, y, '#f6f0dc', 'left', true); left -= l.length + 1; y += 11; }
  if (tk.shown >= msg.length) text('▼', bx + bw - 13, by + bh - 6 + (Math.floor(G.t * 4) % 2), '#ffd84a', 'left', false);
}

// ---------- HUD (A Link to the Past layout: magic meter, item box, money, keys, life) ----------
// HUD: A Link to the Past's layout, drawn with outlines over a soft shade instead of a box.
function drawHud() {
  const s = G.save, p = G.player;
  for (let i = 0; i < 7; i++) R(0, i * 4, VW, 4, `rgba(10,8,18,${(0.5 - i * 0.07).toFixed(2)})`);
  // rune meter: a bone-framed vial
  R(5, 2, 10, 21, '#0a0812'); R(6, 3, 8, 19, '#e8dcb8'); R(7, 4, 6, 17, '#0a0812');
  const fill = Math.round(17 * s.rune / RUNE_MAX), full = s.rune >= RUNE_MAX;
  if (fill) { R(7, 21 - fill, 6, fill, full ? (Math.floor(G.t * 4) % 2 ? '#7fd4ff' : '#cfefff') : '#2f8fd0'); R(7, 21 - fill, 2, fill, full ? '#ffffff' : '#7fd4ff'); R(7, 21 - fill, 6, 1, '#cfefff'); }
  R(8, 1, 4, 2, '#ffd84a');
  // item box
  drawSpellBox();
  // kroner, keys, juice
  drawItemIcon('coin', 46, 7); text(String(s.kr).padStart(3, '0'), 52, 11, '#ffffff', 'left', 'outline');
  if (G.map && G.map.dungeon && !G.map.nokeys) { drawItemIcon('key', 46, 18); text('x' + (s.keys[G.mapId] || 0), 52, 22, '#ffffff', 'left', 'outline'); if (s.bigkeys[G.mapId]) drawItemIcon('bigkey', 74, 16); }
  if (s.potions) { drawItemIcon('juice', 86, 12); text('x' + s.potions, 92, 16, '#ffffff', 'left', 'outline'); }
  // life
  text('- LIFE -', 191, 8, '#ff9a8a', 'center', 'outline');
  const n = s.maxHp / 2;
  for (let i = 0; i < n; i++) {
    const v = clamp(p.hp - i * 2, 0, 2) / 2, row = Math.floor(i / 10), col = i % 10;
    const hx = 147 + col * 9, hy = 12 + row * 8;
    R(hx - 1, hy - 1, 9, 8, 'rgba(10,8,18,.55)');
    drawHeart(hx, hy, v, s.voodoo ? '#f22633' : s.voodoo2 ? '#ffd84a' : '#9a4dd9');
  }
}

// ---------- gear menu ----------
function objective() {
  const s = G.save;
  if (G.mapId === 'home') return 'Read what Jon carved, then leave through the door.';
  if (!flag('met_astrid')) return 'Find Elder Astrid in Fjordvik: west of the airstrip, then north.';
  if (!flag('exchanged') && !flag('d1done')) return 'Chapter 2: find the subway station south-west of the airstrip. Exchange your dollars for kroner.';
  if (flag('giant_woke') && !flag('log_chopped')) return 'Chapter 2: the log was the Forest Giant of the North. Dodge the club. When it sticks in the muck, chop him. Fire burns him.';
  if (!flag('log_chopped') && !flag('d1done')) return 'Chapter 2: take a taxi (or walk) to the Muck Forest. Trudge east. Something is in the way.';
  if (!s.items.homing && !flag('d1done')) return 'Chapter 2: Jjorvic Palace is up the Frozen Path, east of the forest. Find the treasure behind the Penguin Knight.';
  if (!flag('d1done')) return 'Chapter 2: destroy Jjorvic Palace. Whatever rules it sits on the throne at the top.';
  if (!flag('d2done')) {
    if (!s.items.dash) return 'Chapter 3: the Drowned Barrow has opened in the north-west foothills. Find what the Draugr Captain guards.';
    return 'Chapter 3: use the Voodoo Dash to cross the water and barriers. Find the big key and free Hank\'s ghost.';
  }
  return 'Chapter 3 complete! Walter\'s Forge and the Storm Peak wait for Owen\'s next chapters.';
}
const MENU_TABS = ['GEAR', 'JON', 'MAP', 'MUSIC', 'SPELLS', 'BAG'];
function drawMenuTabs(active) {
  R(11, 11, 234, 22, '#14163a'); R(11, 11, 234, 10, '#1e2250'); R(14, 32, 228, 1, '#3a3f80');
  const gap = 9, ws = MENU_TABS.map(t => textWidth(t)), total = ws.reduce((a, b) => a + b, 0) + gap * (MENU_TABS.length - 1);
  let x = Math.round(128 - total / 2);
  MENU_TABS.forEach((t, i) => {
    const on = i === active;
    if (on) { R(x - 3, 15, ws[i] + 6, 14, '#ffd84a'); R(x - 2, 16, ws[i] + 4, 12, '#2a1a10'); }
    text(t, x, 25, on ? '#ffd84a' : '#8a8ab0', 'left', false);
    x += ws[i] + gap;
  });
  text('◀', 16, 25, '#55577a', 'left', false); text('▶', 240, 25, '#55577a', 'right', false);
}
function drawMenu() {
  const s = G.save;
  R(0, 0, VW, VH, 'rgba(5,5,20,.92)');
  drawPanel(8, 8, 240, 208);
  const slots = [
    ['Jon Lv' + jonData().lvl + ' (swing Z)', 'homing', true, () => drawJonSprite(30, 44, 0, false, jonFaceNow())],
    ['Homing Jon (throw X)', 'homing', !!s.items.homing],
    ['Rune Spells (C) ' + knownSpells().length + '/5', 'thunder', anySpell()],
    ['Lingonberry Juice x' + s.potions, 'juice', s.potions > 0],
    ['Demon Horn (V)', 'horn', !!s.items.horn],
    ['Voodoo Dash (Shift/F)', 'dash', !!s.items.dash],
  ];
  slots.forEach(([label, icon, have, custom], i) => {
    const y = 46 + i * 15;
    R(19, y - 9, 20, 17, '#0a0812'); R(20, y - 8, 18, 15, '#232860');
    if (have) { if (custom) custom(); else drawItemIcon(icon, 29, y); text(label, 44, y + 4, '#f6f0dc'); }
    else text('???', 44, y + 4, '#55577a');
  });
  const sq = (n, start, done) => flag(start) ? n + (flag(done) ? ' ✓' : ' …') : null;
  const side = [sq('Bjarne', 'quest_bjarne', 'bjarne_done'), sq('Sven', 'quest_sven', 'sven_done')].filter(Boolean);
  text('Heart pieces ' + s.pieces + '/4', 20, 140, '#f2ebcc');
  text('Voodoo bond ' + (s.voodoo ? 'ready' : 'used'), 20, 151, s.voodoo ? '#9be08a' : '#c9a0f0');
  if (side.length) text('Side quests ' + side.join('  '), 20, 162, '#c8e8ff', 'left', false);
  text(Sound.muted ? 'M sound off' : 'M sound on', 236, 140, '#8a8ab0', 'right', false);
  text(Music.on ? 'N music on' : 'N music off', 236, 151, '#8a8ab0', 'right', false);
  R(16, 169, 224, 1, '#3a3f80');
  text('QUEST', 20, 180, '#ffd84a');
  wrap(objective(), 216).slice(0, 3).forEach((l, i) => text(l, 20, 191 + i * 10, '#f6f0dc', 'left', false));
}

// ---------- title ----------
function drawTitle() {
  const t = G.t;
  // night sky, banded like SNES gradients
  const SKY = ['#070818', '#0a0c24', '#0e1030', '#13153c', '#191a48', '#211f52', '#2b2459'];
  SKY.forEach((c, i) => R(0, i * 20, VW, 20, c));
  for (let i = 0; i < 70; i++) { const x = (i * 53 + 7) % VW, y = (i * 97) % 120; if ((Math.floor(t * 2 + i * 0.7)) % 7) R(x, y, 1, 1, i % 4 ? '#5a5690' : '#e8e4ff'); }
  // aurora borealis: three ribbons, stepped alpha so it stays pixel art
  const ribbons = [['#4dffb0', 34, 0.0, 26], ['#3ad0ff', 48, 1.7, 20], ['#b06bff', 58, 3.1, 14]];
  for (const [col, base, ph, len] of ribbons) for (let x = 0; x < VW; x += 2) {
    const y = Math.round(base + Math.sin(x * 0.028 + t * 0.45 + ph) * 11 + Math.sin(x * 0.071 + t * 0.9 + ph) * 4);
    const pulse = 0.55 + 0.45 * Math.sin(x * 0.05 - t * 1.3 + ph);
    ctx.globalAlpha = 0.34 * pulse; R(x, y, 2, Math.round(len * 0.35), col);
    ctx.globalAlpha = 0.18 * pulse; R(x, y + Math.round(len * 0.35), 2, Math.round(len * 0.4), col);
    ctx.globalAlpha = 0.08 * pulse; R(x, y + Math.round(len * 0.75), 2, len, col);
  }
  ctx.globalAlpha = 1;
  // mountains: a far range and a near range, jagged and snow-capped
  const ridge = (seed, base, amp, step) => { const pts = []; for (let x = -step; x <= VW + step; x += step) pts.push([x, base - Math.abs(Math.sin(x * 0.019 + seed) * amp) - (hash(x, seed) % 9)]); return pts; };
  const far = ridge(1.3, 132, 38, 12), near = ridge(4.1, 148, 24, 9);
  poly([[0, 150], ...far, [VW, 150]], '#2c3070');
  for (const [x, y] of far) if (y < 108) poly([[x - 6, y + 7], [x, y], [x + 6, y + 7]], '#b8bfe8');
  poly([[0, 152], ...near, [VW, 152]], '#171a44');
  for (const [x, y] of near) R(x, y, 2, 1, '#3a4a8a');
  // the fjord, with the aurora shimmering in it
  R(0, 148, VW, 76, '#0b1530'); R(0, 148, VW, 1, '#3a4a8a');
  for (let i = 0; i < 26; i++) { const y = 152 + (i * 13) % 70, x = ((i * 71 + t * (6 + i % 3)) % (VW + 40)) - 20; ctx.globalAlpha = 0.5; R(x, y, 8 + (i % 4) * 4, 1, i % 3 === 0 ? '#4dffb0' : i % 3 === 1 ? '#3ad0ff' : '#2a3a7a'); }
  ctx.globalAlpha = 1;
  // a longship drifting across the water
  const sx = ((t * 7) % (VW + 90)) - 60, sy = 166 + Math.round(Math.sin(t * 1.6) * 1);
  poly([[sx, sy], [sx + 44, sy], [sx + 40, sy + 6], [sx + 4, sy + 6]], '#3a2410');
  R(sx + 2, sy, 40, 2, '#6b4322'); for (let k = 0; k < 6; k++) R(sx + 7 + k * 6, sy + 1, 3, 3, k % 2 ? '#c03a2a' : '#e8dcb8');
  poly([[sx + 44, sy], [sx + 49, sy - 8], [sx + 52, sy - 7], [sx + 47, sy]], '#6b4322'); R(sx + 50, sy - 7, 1, 1, '#ffd84a');
  R(sx + 21, sy - 22, 2, 22, '#3a2410');
  for (let k = 0; k < 5; k++) R(sx + 11, sy - 20 + k * 3, 22, 3, k % 2 ? '#e8dcb8' : '#c03a2a');
  ctx.globalAlpha = 0.25; R(sx + 4, sy + 7, 40, 2, '#c03a2a'); ctx.globalAlpha = 1;
  drawTitleExtras();
  // the logo: chunky outlined letters, ice-blue with a darker lower half
  const ly = 92;
  text('JÖNTUKA', VW / 2, ly, '#dff6ff', 'center', 'outline', 3);
  ctx.save(); ctx.beginPath(); ctx.rect(0, ly - 9, VW, 10); ctx.clip(); text('JÖNTUKA', VW / 2, ly, '#5aa8e8', 'center', false, 3); ctx.restore();
  R(VW / 2 - 70, ly + 8, 140, 1, '#ffd84a');
  text('A VIKING TALE', VW / 2, ly + 20, '#ffd84a', 'center', 'outline');
  text('a game by Owen', VW / 2, ly + 32, '#a79fc4', 'center', true);
  drawJonSprite(VW / 2 + 92 + Math.sin(t * 2) * 3, ly - 26, Math.sin(t * 1.5) * 0.3, t % 3.2 < 0.14);
  // menu
  const opts = G.titleOpts || titleOptions(), mh = 14 + opts.length * 13;
  drawPanel(VW / 2 - 64, 222 - mh - 12, 128, mh);
  opts.forEach((o, i) => {
    const sel = i === G.menuSel, y = 222 - mh - 12 + 15 + i * 13;
    if (sel) text('▶', VW / 2 - 52, y, '#ffd84a', 'left', false);
    text(o.label, VW / 2 - 42, y, o.disabled ? '#55577a' : sel ? '#ffd84a' : '#f6f0dc', 'left', true);
  });
  if (G.confirmErase) text('Press Z again to erase your save', VW / 2, 220, '#ff8a8a', 'center', 'outline');
  else { const best = G.titleBest || 0; if (best) text('Arena best: wave ' + best, VW - 6, 220, '#a79fc4', 'right', true); }
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
  const c = G.cut, page = (G.cutPages || STORY.flight)[c.i], t = G.t;
  R(0, 0, VW, VH, '#000');
  if (page.art && page.art.startsWith('taxi')) return drawTaxiScene(page);
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
  G.state = 'cutscene'; G.cut = { i: 0 }; G.cutPages = null;
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
