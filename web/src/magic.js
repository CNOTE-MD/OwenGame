// Magic and items: Rune Spells on the rune meter (Thunder, Frost, Fire, Mend), a Bag of
// consumables, and Charms with one equip slot. SPELLS and BAG pages in the gear menu.

// ---------------- rune spells ----------------
const SPELLS = {
  thunder: { name: 'Thunder Strike', cost: 16, icon: 'thunder', desc: 'Lightning hits everything on screen.' },
  frost: { name: 'Frost Rune', cost: 4, icon: 'frost', desc: 'Freezes enemies near you. Chop for double.' },
  fire: { name: 'Fire Rune', cost: 3, icon: 'fire', desc: 'A fireball. Burns bushes and grass.' },
  mend: { name: 'Mend Rune', cost: 6, icon: 'mend', desc: 'Heals two hearts.' },
};
const SPELL_ORDER = ['thunder', 'frost', 'fire', 'mend'];
function knownSpells() { return SPELL_ORDER.filter(id => G.save.items[id]); }
function anySpell() { return knownSpells().length > 0; }
function equippedSpell() { const s = G.save; if (s.spell && s.items[s.spell]) return s.spell; const k = knownSpells(); s.spell = k[0] || null; return s.spell; }
function cycleSpell() {
  const k = knownSpells(); if (k.length < 2) return;
  const i = k.indexOf(equippedSpell()); G.save.spell = k[(i + 1) % k.length];
  Sound.play('menu'); floatText(G.player.x, G.player.y - 18, SPELLS[G.save.spell].name, '#7fd4ff');
}
function castSpell() {
  const s = G.save, p = G.player, id = equippedSpell();
  if (!id) return floatText(p.x, p.y - 18, 'No rune yet', '#aab');
  const sp = SPELLS[id];
  if (s.rune < sp.cost) return floatText(p.x, p.y - 18, id === 'thunder' ? 'Rune not full' : 'Not enough rune', '#7fd4ff');
  if (id === 'thunder') return startThunder();
  s.rune -= sp.cost; p.cd = 0.3;
  if (id === 'frost') castFrost(); else if (id === 'fire') castFire(); else if (id === 'mend') castMend();
}
function castFrost() {
  const p = G.player; Sound.play('splash'); Sound.play('charge'); G.shake = 0.12;
  for (let i = 0; i < 18; i++) { const a = Math.random() * Math.PI * 2, sp = rnd(40, 110); G.fx.push({ x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, life: 0.5, color: pick(['#ffffff', '#cfefff', '#7fd4ff']), size: 2 }); }
  let n = 0;
  for (const e of G.ents) if (e.enemy && e.alive && dist(e, p) < 84 && e.type !== 'hank') { e.freeze = e.boss ? 1.6 : 3.5; e.kx = e.ky = 0; puff(e.x, e.y, '#cfefff', 6); n++; }
  floatText(p.x, p.y - 20, n ? 'FROZEN!' : 'Brr.', '#cfefff');
  if (n) jonSay('frost', { cooldown: 20, face: 'excited' });
}
const FIRE = [];
function castFire() {
  const p = G.player, f = facing4(p); Sound.play('throw'); Sound.play('charge');
  FIRE.push({ x: p.x + f.x * 8, y: p.y + f.y * 2, vx: f.x * 150, vy: f.y * 150, life: 1.3, t: 0 });
}
function updateFire(dt) {
  for (const f of FIRE) {
    f.t += dt; f.life -= dt; f.x += f.vx * dt; f.y += f.vy * dt;
    G.fx.push({ x: f.x + rnd(-2, 2), y: f.y + rnd(-2, 2), vx: -f.vx * 0.1, vy: -20, t: 0, life: 0.3, color: pick(['#ff9a1f', '#ffd84a', '#ff4a1f']), size: 2 });
    const tx = Math.floor(f.x / T), ty = Math.floor(f.y / T), c = tile(tx, ty);
    if (c === 'b' || c === ',') { setTile(tx, ty, SNOWY(tx, ty) ? 'n' : '.'); leaves(tx * T + 8, ty * T + 8, ['#ff9a1f', '#3a2a1a', '#ffd84a']); maybeDrop(tx * T + 8, ty * T + 8, 0.3); }
    else if (c === 'o') { const e = G.ents.find(o => o.kind === 'log'); if (e) { e.cd = 0; hitLog(e); } f.life = 0; }
    else if (solidAt(f.x, f.y, 'walker')) { f.life = 0; puff(f.x, f.y, '#ff9a1f', 8); }
    for (const e of G.ents) if (e.enemy && e.alive && dist(e, f) < e.r + 5) { f.life = 0; e.flash = 0; damageEnemy(e, 2, { x: f.x - f.vx * 0.01, y: f.y - f.vy * 0.01 }, 'magic'); puff(e.x, e.y, '#ff9a1f', 10); if (e.freeze > 0) e.freeze = 0; break; }
  }
  for (let i = FIRE.length - 1; i >= 0; i--) if (FIRE[i].life <= 0) FIRE.splice(i, 1);
}
function drawFire() {
  for (const f of FIRE) { const x = Math.round(f.x - G.cam.x), y = Math.round(f.y - G.cam.y), k = Math.floor(f.t * 20) % 2; R(x - 4, y - 4, 8, 8, '#ff4a1f'); R(x - 3, y - 3 - k, 6, 6, '#ff9a1f'); R(x - 1, y - 2 + k, 3, 3, '#ffe066'); }
}
function castMend() {
  const p = G.player, s = G.save; p.hp = Math.min(s.maxHp, p.hp + 4); Sound.play('heart'); Sound.play('secret');
  for (let i = 0; i < 14; i++) G.fx.push({ x: p.x + rnd(-8, 8), y: p.y + rnd(-4, 8), vx: 0, vy: rnd(-40, -15), t: 0, life: 0.7, color: pick(['#9be08a', '#ffffff', '#5fdc8a']), size: 2 });
  floatText(p.x, p.y - 20, 'MENDED', '#9be08a'); jonSay('mend', { cooldown: 30, face: 'excited' });
}
// frozen enemies stand still; a chop shatters the ice for double damage
function frozenRule(e, how, jonHit) {
  if (!(e.freeze > 0)) return null;
  e.freeze = 0; puff(e.x, e.y, '#cfefff', 10); Sound.play('clank'); floatText(e.x, e.y - 16, 'SHATTER!', '#cfefff');
  return jonHit ? 2 : 1;
}
function drawFrozen(e) {
  if (!(e.freeze > 0)) return;
  const x = Math.round(e.x - G.cam.x), y = Math.round(e.y - G.cam.y), r = e.r + 6, blink = e.freeze < 0.8 && Math.floor(G.t * 10) % 2;
  if (blink) return;
  ctx.globalAlpha = 0.45; R(x - r, y - r - 6, r * 2, r * 2 + 4, '#9fe0ff'); ctx.globalAlpha = 0.9;
  R(x - r, y - r - 6, r * 2, 1, '#ffffff'); R(x - r, y - r - 6, 1, r * 2 + 4, '#ffffff'); R(x + r - 2, y - r - 3, 1, r, '#ffffff'); R(x - r + 2, y + r - 4, r, 1, '#4aa0ff');
  ctx.globalAlpha = 1;
}

// ---------------- the Bag: consumables ----------------
const CONSUMABLES = {
  salmon: { name: 'Smoked Salmon', icon: 'salmon', heal: 4, price: 15, max: 5, text: 'Smoky. Perfect. Two hearts back.' },
  lutefisk: { name: 'Lutefisk', icon: 'lutefisk', heal: 99, price: 8, max: 3, text: 'Fish. Lye. Jelly. All your hearts back, and a memory you will never lose.' },
  shard: { name: 'Rune Shard', icon: 'shard', rune: true, price: 25, max: 3, text: 'The rune meter fills up.' },
};
function bagCount(id) { return (G.save.bag && G.save.bag[id]) || 0; }
function addToBag(id, n = 1) { const s = G.save; s.bag = s.bag || {}; s.bag[id] = Math.min(CONSUMABLES[id].max, (s.bag[id] || 0) + n); }
function useConsumable(id) {
  const s = G.save, p = G.player, c = CONSUMABLES[id];
  if (!bagCount(id)) return false;
  if (c.heal && p.hp >= s.maxHp) { Sound.play('clank'); return false; }
  s.bag[id]--;
  if (c.heal) { p.hp = Math.min(s.maxHp, p.hp + c.heal); Sound.play('heart'); }
  if (c.rune) { s.rune = RUNE_MAX; Sound.play('heart'); }
  if (id === 'lutefisk') JT.queued = 'lutefisk';
  G.bagMsg = { text: c.text, t: 2.5 }; writeSave();
  return true;
}

// ---------------- charms ----------------
const CHARMS = {
  bearclaw: { name: 'Bear Claw Charm', icon: 'bearclaw', desc: 'Chops crit twice as often.', apply: st => { st.crit += 0.25; } },
  boots: { name: "Fisherman's Boots", icon: 'boots', desc: 'Muck cannot slow you.', apply: () => {} },
  cloak: { name: 'Wool Cloak', icon: 'cloak', desc: 'Shrugs off some hits.', apply: st => { st.armor += 2; } },
  tooth: { name: 'Troll Tooth', icon: 'tooth', desc: 'Enemies drop more.', apply: st => { st.luck += 0.6; } },
};
function hasCharm(id) { return !!(G.save.charms && G.save.charms[id]); }
function charmOn(id) { return G.save.charm === id && hasCharm(id); }
function applyCharm(st) { const id = G.save && G.save.charm; if (id && CHARMS[id] && hasCharm(id)) CHARMS[id].apply(st); }
function equipCharm(id) { G.save.charm = G.save.charm === id ? null : id; applyJonPerks(); Sound.play('coin'); writeSave(); }

// ---------------- items hooks ----------------
function magicApplyItem(id) {
  const s = G.save;
  if (SPELLS[id] && id !== 'thunder') { s.items[id] = true; if (!s.spell || !s.items[s.spell]) s.spell = id; if (s.rune < SPELLS[id].cost) s.rune = SPELLS[id].cost; return true; }
  if (CONSUMABLES[id] && id !== 'shard') { addToBag(id); return true; }
  if (CHARMS[id]) { s.charms = s.charms || {}; s.charms[id] = true; if (!s.charm) s.charm = id; applyJonPerks(); return true; }
  return false;
}
function magicBuyLimit(id) {
  if (CONSUMABLES[id] && id !== 'shard' && bagCount(id) >= CONSUMABLES[id].max) return `Your bag already holds ${CONSUMABLES[id].max}. Eat some!`;
  if (CHARMS[id] && hasCharm(id)) return 'You already have one. It\'s a charm, not a snack.';
  return null;
}

// ---------------- menu pages ----------------
function updateSpellsPage() {
  const k = knownSpells();
  if (!k.length) return;
  G.spellSel = clamp(G.spellSel || 0, 0, k.length - 1);
  if (just('up')) { G.spellSel = (G.spellSel + k.length - 1) % k.length; Sound.play('menu'); }
  if (just('down')) { G.spellSel = (G.spellSel + 1) % k.length; Sound.play('menu'); }
  if (just('a')) { G.save.spell = k[G.spellSel]; Sound.play('coin'); writeSave(); }
}
function drawSpellsPage() {
  const s = G.save, k = knownSpells();
  R(0, 0, VW, VH, 'rgba(5,5,20,.92)'); R(8, 8, 240, 208, '#ffd84a'); R(10, 10, 236, 204, '#0d0d33');
  text('◀ JUKEBOX', 20, 26, '#8a8ab0', 'left', false); text('RUNE SPELLS', 128, 26, '#ffe64d', 'center'); text('BAG ▶', 236, 26, '#8a8ab0', 'right', false);
  R(20, 36, 8, 60, '#000'); R(21, 37, 6, 58, '#1a2238'); const fill = Math.round(58 * s.rune / RUNE_MAX); R(21, 95 - fill, 6, fill, '#2f8fd0');
  text(`Rune ${s.rune}/${RUNE_MAX}`, 34, 44, '#7fd4ff', 'left', false);
  text('Cast with C. Cycle with Q.', 34, 56, '#a79fc4', 'left', false);
  if (!k.length) { text('No runes yet. Walter carved them into Jon long ago; find them.', 34, 76, '#55577a', 'left', false); return; }
  SPELL_ORDER.forEach((id, i) => {
    const y = 80 + i * 26, know = s.items[id], sel = know && k[G.spellSel || 0] === id, eq = equippedSpell() === id;
    if (sel) R(18, y - 11, 220, 22, '#1a2238');
    R(22, y - 9, 18, 18, '#0d1a2e');
    if (know) { drawItemIcon(SPELLS[id].icon, 31, y); text((eq ? '★ ' : '') + SPELLS[id].name, 46, y - 2, sel ? '#ffd84a' : '#f3ecd2', 'left', false); text(SPELLS[id].desc, 46, y + 8, '#a79fc4', 'left', false); text(`${SPELLS[id].cost}`, 228, y - 2, s.rune >= SPELLS[id].cost ? '#7fd4ff' : '#55577a', 'right', false); }
    else text('???', 46, y + 2, '#55577a', 'left', false);
  });
  text('Z: equip     ★ equipped', 128, 212, '#8a8ab0', 'center', false);
}
function bagEntries() {
  const out = [];
  for (const id in CONSUMABLES) if (bagCount(id)) out.push({ kind: 'eat', id });
  for (const id in CHARMS) if (hasCharm(id)) out.push({ kind: 'charm', id });
  return out;
}
function updateBagPage() {
  const list = bagEntries();
  if (G.bagMsg) { G.bagMsg.t -= 1 / 60; if (G.bagMsg.t <= 0) G.bagMsg = null; }
  if (!list.length) return;
  G.bagSel = clamp(G.bagSel || 0, 0, list.length - 1);
  if (just('up')) { G.bagSel = (G.bagSel + list.length - 1) % list.length; Sound.play('menu'); }
  if (just('down')) { G.bagSel = (G.bagSel + 1) % list.length; Sound.play('menu'); }
  if (just('a')) { const e = list[G.bagSel]; if (e.kind === 'eat') useConsumable(e.id); else equipCharm(e.id); }
}
function drawBagPage() {
  const list = bagEntries();
  R(0, 0, VW, VH, 'rgba(5,5,20,.92)'); R(8, 8, 240, 208, '#ffd84a'); R(10, 10, 236, 204, '#0d0d33');
  text('◀ SPELLS', 20, 26, '#8a8ab0', 'left', false); text('BAG', 128, 26, '#ffe64d', 'center'); text('GEAR ▶', 236, 26, '#8a8ab0', 'right', false);
  text(`Hearts ${Math.ceil(G.player.hp / 2)}/${G.save.maxHp / 2}   Kroner ${G.save.kr}`, 20, 42, '#f2ebcc', 'left', false);
  if (!list.length) text('Empty. Lars sells salmon. Chests hide charms.', 20, 70, '#55577a', 'left', false);
  list.forEach((e, i) => {
    const y = 62 + i * 20, sel = i === (G.bagSel || 0);
    if (sel) R(18, y - 10, 220, 20, '#1a2238');
    R(22, y - 8, 16, 16, '#0d1a2e');
    if (e.kind === 'eat') { const c = CONSUMABLES[e.id]; drawItemIcon(c.icon, 30, y); text(`${c.name}  x${bagCount(e.id)}`, 44, y - 1, sel ? '#ffd84a' : '#f3ecd2', 'left', false); text(c.heal === 99 ? 'Full heal. Jon will have opinions.' : c.heal ? `Heals ${c.heal / 2} hearts` : 'Fills the rune meter', 44, y + 8, '#a79fc4', 'left', false); }
    else { const c = CHARMS[e.id]; drawItemIcon(c.icon, 30, y); text((charmOn(e.id) ? '★ ' : '') + c.name, 44, y - 1, sel ? '#ffd84a' : '#f3ecd2', 'left', false); text(c.desc, 44, y + 8, '#a79fc4', 'left', false); }
  });
  if (G.bagMsg) { R(14, 186, 228, 14, '#1a2238'); text(G.bagMsg.text, 128, 196, '#9be08a', 'center', false); }
  text('Z: eat / wear     ★ worn (one charm at a time)', 128, 212, '#8a8ab0', 'center', false);
}
// the HUD: equipped spell in the item box, cost pips, worn charm
function drawSpellBox() {
  const s = G.save, id = equippedSpell();
  R(17, 2, 20, 19, '#ffd84a'); R(18, 3, 18, 17, '#0d0d33');
  if (id) {
    const sp = SPELLS[id], ok = s.rune >= sp.cost;
    ctx.globalAlpha = ok ? 1 : 0.4; drawItemIcon(sp.icon, 27, 12); ctx.globalAlpha = 1;
    if (id !== 'thunder') for (let i = 0; i < sp.cost; i++) R(19 + i * 3, 18, 2, 1, ok ? '#7fd4ff' : '#55577a');
  } else if (s.items.homing) drawItemIcon('homing', 27, 12);
  if (s.charm && hasCharm(s.charm)) drawItemIcon(CHARMS[s.charm].icon, 128, 12);
}

// ---------------- art ----------------
function buildMagicArt() {
  const mk = (rows, pal) => buildSprite(rows, pal);
  SPR.icon_frost = mk(['...bb...', '.b.bb.b.', '..bbbb..', 'bbbWWbbb', 'bbbWWbbb', '..bbbb..', '.b.bb.b.', '...bb...'], { b: '#7fd4ff', W: '#ffffff' });
  SPR.icon_fire = mk(['...r....', '..rr.r..', '.rrrrrr.', '.roooor.', 'rrooyorr', 'rroyyorr', '.rooyor.', '..rrrr..'], { r: '#ff4a1f', o: '#ff9a1f', y: '#ffe066' });
  SPR.icon_mend = mk(['..gggg..', '.gGGGGg.', 'gGGwwGGg', 'gGwwwwGg', 'gGwwwwGg', 'gGGwwGGg', '.gGGGGg.', '..gggg..'], { g: '#2f8a5a', G: '#5fdc8a', w: '#ffffff' });
  SPR.icon_salmon = mk(['......pp', '..ppppPp', '.pPPPPPp', 'pPPePPPp', '.pPPPPPp', '..ppppPp', '......pp'], { p: '#c05a3a', P: '#ff8a6a', e: '#202030' });
  SPR.icon_lutefisk = mk(['.wwwwww.', 'wjjjjjjw', 'wjJJjJjw', 'wjjjjjjw', 'wjJjjJjw', '.wwwwww.'], { w: '#d8e8f0', j: '#e8e4c8', J: '#c8c4a0' });
  SPR.icon_bearclaw = mk(['k......k', 'kk....kk', '.kk..kk.', '..kkkk..', '..bbbb..', '.bBBBBb.', '..bbbb..', '...bb...'], { k: '#e8e0d0', b: '#8a5a28', B: '#c89058' });
  SPR.icon_boots = mk(['..bb....', '..bb....', '..bb....', '..bbb...', '..bbbb..', 'bbbbbbb.', 'BBBBBBB.'], { b: '#3a6a3a', B: '#1a3a1a' });
  SPR.icon_cloak = mk(['...rr...', '..rRRr..', '.rRRRRr.', '.rRRRRr.', 'rRRRRRRr', 'rRRRRRRr', 'rrrrrrrr'], { r: '#6b3fa0', R: '#9a6ad0' });
  SPR.icon_tooth = mk(['.wwwww..', 'wWWWWWw.', 'wWWWWWw.', '.wWWWw..', '..wWw...', '..wWw...', '...w....'], { w: '#c8c8a8', W: '#f0f0e0' });
}
