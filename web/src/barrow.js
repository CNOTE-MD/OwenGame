// The Drowned Barrow gets the care the palace got. All of it is a draft for Owen to change:
//   - Fluffy is the Barrow's guide. Talk to him anywhere and Jon translates a hint for where you are.
//   - The bell crypt, north of the big key room: three spirit bells over the water. Only the Voodoo
//     Dash can touch them. Ring them little, middle, big and a chest rises.
//   - The reward is the Spirit Bell charm: the Voodoo Dash is ready again twice as fast.

// ---------------- Fluffy, the guide ----------------
const inBellCrypt = () => G.mapId === 'barrow' && G.scr && G.scr.x === 2 && G.scr.y === 0;
function barrowHint() {
  const s = G.save, n = BELL.seq.length;
  if (inBellCrypt() && !flag('puzzle_barrow')) {
    if (n === 0) return 'He says the little bell is first. It hangs over the water just left of this island. Dash through it.';
    if (n === 1) return 'He says the middle bell is on the far side. Do NOT go north from here, that is the big one. Go back the way we came, and around the other way.';
    return 'He says the big one is all that is left. Dash through it!';
  }
  if (flag('d2done')) return flag('puzzle_barrow') ? null : 'He says there are bells he likes to sing with. Past the pits where the big key was, a door goes north.';
  if (s.bigkeys && s.bigkeys.barrow) return null;                         // Owen's own scene covers this one (fluffy_2)
  if (s.items.dash) return 'He says the glowing wall on the east side of the great hall is a spirit wall. Dash through it. The big key is past the pits.';
  if (flag('chest:br_key')) return 'He says the key opens the door north of here. Then go west. Something big is guarding a treasure.';
  return 'He says go west from here. Beat the dead guys and a key shows up.';
}
function talkFluffy() {
  G.player.cd = 0.2;
  if (!flag('met_fluffy') && !inBellCrypt()) { setFlag('met_fluffy'); return say(STORY.fluffy_1); }
  setFlag('met_fluffy');
  const h = barrowHint();
  if (h) return say([['Fluffy', inBellCrypt() ? 'Woof! Woof!' : 'Woof!'], ['Jon', h]]);
  say(flag('d2done') ? STORY.fluffy_after : STORY.fluffy_2);
}

// ---------------- the bell crypt ----------------
// A dash that crosses a bell's water and LANDS rings it. Little, middle, big is the order.
// A bell out of order silences them all. Leaving the room does too.
const BELL = { seq: [], touched: [], was: 0 };
const BELL_HZ = [1568, 1175, 784], BELL_WORD = ['ding!', 'DONG!', 'BONNNG!'];
function updateBells(dt) {
  const p = G.player, bells = G.ents.filter(e => e.kind === 'bell');
  if (!bells.length) { BELL.was = 0; BELL.touched.length = 0; return; }
  for (const b of bells) b.ring = Math.max(0, b.ring - dt);
  if (p.dashing > 0) {
    const tx = Math.floor(p.x / T), ty = Math.floor(p.y / T);
    for (const b of bells) { const z = b.def.zone; if (tx >= z[0] && tx <= z[2] && ty >= z[1] && ty <= z[3] && !BELL.touched.includes(b)) BELL.touched.push(b); }
  } else if (BELL.was > 0) {
    const landed = tileAt(p.x, p.y) !== 'w' && !(p.falling > 0);         // a spirit who sinks rings nothing
    const hit = BELL.touched.splice(0);
    if (landed) for (const b of hit) ringBell(b, bells);
  }
  BELL.was = p.dashing;
}
const wordY = b => b.y - G.cam.y < 4 * T ? b.y + 22 : b.y - 22;                 // keep the word clear of the HUD
function ringBell(b, bells) {
  const size = b.def.size, f = BELL_HZ[size], fluffy = G.ents.find(e => e.id === 'fluffy');
  b.ring = 0.9;
  if (b.lit) { Sound.tone([[f, 0.4, 'sine', f * 0.995]], 0.05); return; }   // already singing (or the puzzle is done): just a chime
  if (size !== BELL.seq.length) {
    // out of order: every bell goes quiet
    for (const o of bells) o.lit = false;
    BELL.seq.length = 0; G.shake = Math.max(G.shake, 0.15);
    Sound.tone([[233, 0.22, 'triangle', 110], [0, 0.03], [117, 0.3, 'triangle', 70]], 0.09);
    if (!flag('tip:bells')) { setFlag('tip:bells'); return say(STORY.bells_wrong); }
    floatText(b.x + 8, wordY(b), 'CLUNK. The bells go quiet.', '#aab');
    if (fluffy) floatText(fluffy.x, fluffy.y - 18, 'woof.', '#9fe0ff');
    return;
  }
  b.lit = true; BELL.seq.push(size);
  Sound.tone([[f, 0.7, 'sine', f * 0.995]], 0.08); Sound.tone([[f * 2.76, 0.3, 'sine']], 0.025);
  floatText(b.x + 8, wordY(b), BELL_WORD[size], '#ffe9a0');
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; G.fx.push({ x: b.x + 8, y: b.y - 4, vx: Math.cos(a) * 50, vy: Math.sin(a) * 50, t: 0, life: 0.5, color: i % 2 ? '#ffffff' : '#ffe9a0', size: 2 }); }
  if (fluffy) floatText(fluffy.x, fluffy.y - 18, 'Awoo!', '#9fe0ff');
  if (BELL.seq.length === 3) {
    setFlag('puzzle_barrow'); Sound.play('secret'); G.shake = 0.3;
    const d = MAPS[G.mapId].ents.find(o => o.id === 'br_bell');
    if (d) { const c = makeEnt(d, d.at[0] * T + 8, d.at[1] * T + 8); if (c) { G.ents.push(c); puff(c.x, c.y, '#ffe9a0', 14); } }
    say(STORY.bells_done, writeSave);
  }
}
function drawBell(e) {
  const size = e.def.size, w = [8, 12, 18][size], h = [9, 13, 17][size], lit = e.lit;
  const swing = e.ring > 0 ? Math.sin(G.t * 34) * 2.5 * Math.min(1, e.ring * 2) : 0;
  const x = Math.round(e.x - G.cam.x) + 8, y = Math.round(e.y - G.cam.y) + 5 + Math.round(Math.sin(G.t * 2 + size * 2) * 1.5);
  const body = lit ? '#ffe9a0' : '#bfe6ff', edge = lit ? '#c89a2a' : '#5a86c0';
  if (lit) { ctx.globalAlpha = 0.2 + 0.08 * Math.sin(G.t * 6 + size); ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.arc(x, y - h / 2, w + 2, 0, 7); ctx.fill(); }
  ctx.globalAlpha = lit ? 1 : 0.85;
  R(x - 1, y - h - 2, 2, 2, edge);                                                              // the loop it hangs from
  for (let i = 0; i < h; i++) {
    const t = i / (h - 1), k = t < 0.72 ? 0.42 + 0.5 * t : 0.78 + 0.8 * (t - 0.72), ww = Math.max(2, Math.round(w * k / 2) * 2), sx = Math.round(swing * t);
    R(x - ww / 2 + sx, y - h + i, ww, 1, i >= h - 2 ? edge : body);
    if (i > 1 && i < h - 3) R(x - ww / 2 + 1 + sx, y - h + i, 1, 1, '#ffffff');
  }
  R(x - 1 + Math.round(swing * 1.6), y, 2, 2, edge);                                             // the clapper
  ctx.globalAlpha = 1;
}
// a thread of light across each bell's gap, so it is clear that crossing here touches the bell
function drawBellThreads() {
  for (const e of G.ents) {
    if (e.kind !== 'bell') continue;
    const x = Math.round(e.x - G.cam.x) + 8, y0 = Math.round(e.y - G.cam.y) - 24;
    for (let i = 0; i < 9; i++) {
      const y = y0 + i * 6 + Math.round(Math.sin(G.t * 3 + i) * 1), on = (Math.floor(G.t * 4) + i) % 3 === 0;
      R(x + Math.round(Math.sin(G.t * 2 + i * 1.7) * 2), y, on ? 2 : 1, on ? 2 : 1, e.lit ? (on ? '#ffffff' : '#ffe9a0') : (on ? '#dff6ff' : '#7aa6e0'));
    }
  }
}
function buildBarrowArt() {
  SPR.icon_bell = buildSprite(['...kk...', '..yYYy..', '..yYYy..', '.yYYYYy.', '.yYYYYy.', 'yyyyyyyy', '...kk...', '........'], { y: '#c89a2a', Y: '#ffe9a0', k: '#8a6a1a' });
}

// ---------------- wiring ----------------
CHARMS.bell = { name: 'Spirit Bell', icon: 'bell', desc: 'Dash again twice as fast.', apply: () => {} };
const _startDashB = startDash;
startDash = function () {
  const p = G.player, was = p.dashing > 0;
  _startDashB();
  if (!was && p.dashing > 0 && charmOn('bell')) p.dashCd *= 0.5;
};
const _makeEntB = makeEnt;
makeEnt = function (d, x, y) {
  if (d.t === 'bell') return { x, y, def: d, kind: 'bell', lit: !!G.save.flags.puzzle_barrow, ring: 0 };
  return _makeEntB(d, x, y);
};
const _interactB = interact;
interact = function (e) { if (e.kind === 'npc' && e.id === 'fluffy' && G.mapId === 'barrow') return talkFluffy(); return _interactB(e); };
const _drawThingB = drawThing;
drawThing = function (e) { if (e.kind === 'bell') return drawBell(e); return _drawThingB(e); };
const _drawDecorGroundB = drawDecorGround;
drawDecorGround = function () { _drawDecorGroundB(); drawBellThreads(); };
const _onEnterScreenB = onEnterScreen;
onEnterScreen = function () {
  _onEnterScreenB();
  BELL.seq.length = 0; BELL.touched.length = 0; BELL.was = 0;
  if (inBellCrypt() && !flag('intro:bells') && G.state === 'play') { setFlag('intro:bells'); say(STORY.bells_intro); }
};
TROPHIES.splice(TROPHIES.findIndex(t => t.id === 'hank') + 1, 0,
  { id: 'bells', name: 'Ding Dong', desc: 'Ring the spirit bells of the Drowned Barrow in order.', ok: () => flag('puzzle_barrow') });
