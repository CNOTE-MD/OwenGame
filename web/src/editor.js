// The editor's pass: Owen's notebook as the look of the story (paper, plus photos of his real
// pages), Jon remembers what you did, the RUSH Ø duel at Bjarne's piano, Chilly's night,
// and Owen's notes (director's commentary he writes himself).

// ---------------- notebook paper ----------------
function drawPaper(x, y, w, h, tilt = 0) {
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(tilt); ctx.translate(-w / 2, -h / 2);
  R(2, 3, w, h, 'rgba(0,0,0,.35)');                       // shadow
  R(0, 0, w, h, '#f4eedb');
  for (let ly = 14; ly < h - 2; ly += 11) R(2, ly, w - 4, 1, '#a9c0de');
  R(16, 0, 1, h, '#e08a8a');                               // the red margin
  for (let i = 0; i < 3; i++) { R(6, 10 + i * (h - 24) / 2, 4, 4, '#d8d0b8'); R(7, 11 + i * (h - 24) / 2, 2, 2, '#b8b098'); }   // binder holes
  for (let tx = 0; tx < w; tx += 3) if (hash(tx, h) % 3 === 0) R(tx, h - 1, 2, 1, '#d8d0b8');   // a rough bottom edge
  R(w / 2 - 14, -4, 28, 8, 'rgba(255,240,170,.75)');     // tape
  ctx.restore();
}
const INK = '#26305a', PENCIL = '#5a5a6e';
function isPaper(lines) { return !!lines && (lines.paper === true || Object.values(STORY.signs).includes(lines)); }

// ---------------- photos of Owen's real notebook ----------------
// Slots: chapter cards and boss cards. Photos are uploaded from OWEN'S SCRIPT → Notebook.
const NOTEBOOK = { slots: {}, assets: null };
const PHOTO_SLOTS = [['title', 'Title screen'], ['flight', 'Flight 364 cutscene'], ['grave', "Owen's grave (at night)"], ['chapter:1', 'Chapter 1 card'], ['chapter:2', 'Chapter 2 card'], ['chapter:3', 'Chapter 3 card'], ['chapter:4', 'Chapter 4 card'], ['chapter:5', 'Chapter 5 card'],
  ['boss:giant', 'Forest Giant'], ['boss:knight', 'Penguin Knight'], ['boss:king', 'Penguin King'], ['boss:attendant', 'Flight Attendant'], ['boss:captain', 'Draugr Captain'], ['boss:hank', "Hank's Ghost"]];
function slotImage(slot) {
  const s = NOTEBOOK.slots[slot]; if (!s || !s.assetId) return null;
  if (!s.img) { s.img = new Image(); s.img.src = '/_blob/' + s.assetId; }
  return s.img.complete && s.img.naturalWidth ? s.img : null;
}
function drawPhoto(slot, cx, cy, maxW, maxH, tilt) {
  const img = slotImage(slot); if (!img) return false;
  const k = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight), w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt);
  R(-w / 2 - 3, -h / 2 - 3, w + 6, h + 9, '#fbf8ef'); R(-w / 2 - 2, -h / 2 + h + 6, w + 6, 2, 'rgba(0,0,0,.3)');
  ctx.imageSmoothingEnabled = true; ctx.drawImage(img, -w / 2, -h / 2, w, h); ctx.imageSmoothingEnabled = false;
  R(-6, -h / 2 - 7, 12, 6, 'rgba(255,240,170,.8)');
  ctx.restore(); return true;
}
// the chapter card, now a torn notebook page
drawChapterCard = function () {
  const c = G.chapterCard;
  if (!c || G.state === 'menu' || G.state === 'title' || G.state === 'jonlevel') return;
  c.t += 1 / 60;
  if (c.t > c.life) { G.chapterCard = null; return; }
  const k = Math.min(1, c.t / 0.45), out = Math.max(0, (c.t - (c.life - 0.5)) / 0.5);
  const drop = Math.round((1 - k) * -90 + out * 140);
  const photo = !!slotImage('chapter:' + c.n), w = photo ? 220 : 180, x = (VW - w) / 2, y = 54 + drop;
  ctx.globalAlpha = 1 - out;
  drawPaper(x, y, w, 76, -0.03);
  const tx = photo ? x + 100 : VW / 2;
  text('CHAPTER ' + c.n, tx + (photo ? 0 : 0), y + 30, INK, 'center', false, 2);
  text(c.name.slice(0, Math.floor(Math.max(0, c.t - 0.3) * 22)), tx, y + 50, PENCIL, 'center', false);
  if (photo) drawPhoto('chapter:' + c.n, x + 40, y + 38, 56, 60, 0.06);
  ctx.globalAlpha = 1;
};
// a boss card with Owen's drawing of that boss pinned to it
const _drawBossCard = drawBossCard;
drawBossCard = function () {
  _drawBossCard();
  const c = G.bossCard;
  if (!c || !c.type || G.state === 'menu' || G.state === 'title' || G.state === 'jonlevel') return;
  const k = Math.min(1, c.t / 0.4), out = Math.max(0, (c.t - (c.life - 0.4)) / 0.4);
  ctx.globalAlpha = 1 - out; drawPhoto('boss:' + c.type, VW - 46, 64 - (1 - k) * 60, 70, 60, 0.08); ctx.globalAlpha = 1;
};
const _showBossCard = showBossCard;
showBossCard = function (type) { _showBossCard(type); if (G.bossCard) G.bossCard.type = type; };

// ---------------- Jon remembers ----------------
// He keeps a running memory of Owen's deeds and brings them up later, a couple of times each at most.
function deeds() { return (G.save && G.save.deeds) || {}; }
const MEMORIES = [
  { id: 'tsign', ok: () => flag('giant_timeout'), line: () => 'Remember when you made the T at the giant? Do NOT do that here.' },
  { id: 'naps', ok: () => (deeds().deaths || 0) >= 1, line: () => { const n = deeds().deaths; return `You've napped ${n} time${n === 1 ? '' : 's'} so far. Zombies need naps. I get it.`; } },
  { id: 'combo', ok: () => (deeds().combo || 0) >= 5, line: () => `Best combo so far: x${deeds().combo}. I'm still telling everyone.` },
  { id: 'chops', ok: () => (deeds().kills || 0) >= 50, line: () => `That's ${Math.floor(deeds().kills / 10) * 10}-something chops together. I count every one.` },
  { id: 'king', ok: () => flag('king_owen'), line: () => 'Still can\'t believe you sat on the fish-bone throne. Your Majesty.' },
  { id: 'lutefisk', ok: () => flag('ate_lutefisk'), line: () => 'You ate lutefisk once. ONCE. I can still smell it.' },
  { id: 'lake', ok: () => (deeds().lake || 0) >= 3, line: () => `The lake has spat you out ${deeds().lake} times. It really doesn't want you.` },
  { id: 'rush', ok: () => (G.save && G.save.rushBest) > 0, line: () => `You hit ${G.save.rushBest}% of RUSH Ø. Bjarne put it on his fridge.` },
  { id: 'palace', ok: () => flag('d1done') && G.mapId === 'barrow', line: () => 'First a penguin palace, now a tomb. We are on a ROLL.' },
  { id: 'redeye', ok: () => flag('redeye_done'), line: () => 'Scarier than the flight attendant? Nah. Nothing is.' },
];
function memoryLine() {
  if (!G.save || G.mode === 'arena') return null;
  const used = G.save.mem || (G.save.mem = {});
  const pool = MEMORIES.filter(m => (used[m.id] || 0) < 2 && m.ok());
  if (!pool.length) return null;
  const m = pick(pool); used[m.id] = (used[m.id] || 0) + 1;
  return m.line();
}
// before a boss fight, Jon brings one up
function jonBossMemory() {
  if (G.state !== 'talk' || !G.talk) return;
  const boss = G.ents.find(e => e.boss && e.alive);
  if (!boss || flag('mem_boss:' + boss.type)) return;
  const line = memoryLine(); if (!line) return;
  setFlag('mem_boss:' + boss.type);
  G.talk.queue.push(['Jon', line]);
}

// ---------------- RUSH Ø: a duel at Bjarne's piano ----------------
// Notes fall into three keys. ◀ / Z / ▶ (or tap the left, middle or right of the screen) on the beat.
const RH_LANES = [{ key: '◀', f: 659 }, { key: 'Z', f: 784 }, { key: '▶', f: 988 }];
const RH_FALL = 1.5, RH_HITY = 182;
function startDuel() {
  const gap = isEasy() ? 0.62 : 0.48, toks = SCORE.bjarne.sections.A.pluck.split(/[\s|]+/).filter(t => /[A-G]/.test(t));
  const notes = [];
  for (let i = 0; i < 36; i++) {
    const tok = toks[(i * 3) % toks.length], n = { C: 0, D: 1, E: 2, F: 0, G: 1, A: 2, B: 0 }[tok[0]];
    const extra = i > 12 && i % 5 === 0 ? 0.5 : 0;      // a few quick doubles once he warms up
    notes.push({ t: 2.2 + i * gap - extra * gap, lane: n, hit: 0 });
  }
  G.rh = { t: 0, notes, hits: 0, perfect: 0, combo: 0, maxCombo: 0, flash: [0, 0, 0], judge: null, started: false };
  G.state = 'rhythm'; Sound.play('menu');
}
function rhLaneInput() {
  const out = [];
  if (just('left')) out.push(0); if (just('a') || just('down') || just('up')) out.push(1); if (just('right')) out.push(2);
  if (just('tap') && G.tapX !== undefined) out.push(G.tapX < 0.36 ? 0 : G.tapX > 0.64 ? 2 : 1);
  return out;
}
function updateRhythm(dt) {
  const r = G.rh;
  if (!r.started) {
    if (just('a') || just('tap')) { r.started = true; r.t = 0; Sound.play('save'); }
    if (just('b') || just('menu')) { G.state = 'play'; G.rh = null; say([['Bjarne', 'Another time! RUSH Ø waits for no one. Except you.']]); }
    return;
  }
  r.t += dt;
  const win = isEasy() ? 0.2 : 0.15, perfect = 0.06;
  for (const lane of rhLaneInput()) {
    r.flash[lane] = 0.15;
    const n = r.notes.filter(n => !n.hit && n.lane === lane).sort((a, b) => Math.abs(a.t - r.t) - Math.abs(b.t - r.t))[0];
    if (n && Math.abs(n.t - r.t) <= win) {
      const p = Math.abs(n.t - r.t) <= perfect;
      n.hit = 1; r.hits++; if (p) r.perfect++; r.combo++; r.maxCombo = Math.max(r.maxCombo, r.combo);
      r.judge = { text: p ? 'PERFECT!' : 'GOOD', t: 0.5, color: p ? '#ffd84a' : '#9be08a' };
      Sound.tone([[RH_LANES[lane].f * (p ? 2 : 1), 0.09, 'square']], 0.05);
    }
  }
  for (const n of r.notes) if (!n.hit && r.t > n.t + win) { n.hit = -1; r.combo = 0; r.judge = { text: 'miss', t: 0.4, color: '#ff8a8a' }; }
  for (let i = 0; i < 3; i++) r.flash[i] = Math.max(0, r.flash[i] - dt);
  if (r.judge) { r.judge.t -= dt; if (r.judge.t <= 0) r.judge = null; }
  if (r.t > r.notes[r.notes.length - 1].t + 1) finishDuel();
}
function finishDuel() {
  const r = G.rh, pct = Math.round(100 * r.hits / r.notes.length), s = G.save;
  const first = pct >= 60 && !flag('rush_cleared');
  s.rushBest = Math.max(s.rushBest || 0, pct);
  G.state = 'play'; G.rh = null;
  const lines = [['', `RUSH Ø: ${pct}% of the notes. Best streak ${r.maxCombo}. Perfect ${r.perfect}.`]];
  if (pct >= 90) lines.push(['Bjarne', 'You... you played it FASTER than me. I need to sit down. I am sitting down.']);
  else if (pct >= 60) lines.push(['Bjarne', 'MAGNIFICENT! Most people faint at note four.']);
  else lines.push(['Bjarne', 'A fine start! Rush Ø humbles everyone. Even me. Mostly me.']);
  if (first) { setFlag('rush_cleared'); s.kr += 40; lines.push(['', 'Bjarne gave you 40 kroner.']); jonXP(20); }
  lines.push(['Jon', pct >= 60 ? 'I knew every note. EVERY note. You played them. Same thing.' : 'Again! I wasn\'t ready. I was ready. Again!']);
  say(lines, writeSave);
}
function drawRhythm() {
  const r = G.rh;
  R(0, 0, VW, VH, '#20140c');
  for (let y = 0; y < VH; y += 8) R(0, y, VW, 1, '#2a1a10');
  text('RUSH Ø', VW / 2, 18, '#ffd84a', 'center', 'outline', 2);
  text('Bjarne\'s Masterpiece', VW / 2, 32, '#e8c890', 'center', false);
  spr(SPR.npc_bjarne, 30, 62, { scale: 2 }); text('Bjarne', 30, 74, '#e8c890', 'center', false);
  drawJonSprite(VW - 30, 50, Math.sin(G.t * 6) * 0.3, false, 'excited');
  const lx = l => 68 + l * 60;
  for (let l = 0; l < 3; l++) {
    const x = lx(l);
    R(x - 18, 40, 36, RH_HITY - 34, 'rgba(255,240,200,.05)');
    R(x - 1, 40, 2, RH_HITY - 40, 'rgba(255,240,200,.12)');
    R(x - 20, RH_HITY + 6, 40, 30, r.flash[l] > 0 ? '#ffd84a' : '#f4eedb'); R(x - 20, RH_HITY + 34, 40, 2, '#8a6a4a');
    text(RH_LANES[l].key, x, RH_HITY + 26, '#2a1a10', 'center', false);
  }
  R(40, RH_HITY, 176, 2, '#ffd84a');
  if (!r.started) {
    drawPaper(48, 92, 160, 64, 0.02);
    text('Play RUSH Ø with Bjarne', 128, 112, INK, 'center', false);
    text('◀  Z  ▶  on the beat', 128, 126, PENCIL, 'center', false);
    text('Z: play    X: not now', 128, 144, INK, 'center', false);
    return;
  }
  for (const n of r.notes) {
    if (n.hit === 1) continue;
    const k = 1 - (n.t - r.t) / RH_FALL; if (k < 0 || k > 1.15) continue;
    const x = lx(n.lane), y = 40 + k * (RH_HITY - 40);
    ctx.globalAlpha = n.hit === -1 ? 0.3 : 1;
    pxEllipseFill(x, y, 6, 4, '#f4eedb');
    R(x + 4, y - 16, 2, 16, '#f4eedb'); R(x + 5, y - 16, 5, 2, '#f4eedb');
    ctx.globalAlpha = 1;
  }
  if (r.judge) text(r.judge.text, VW / 2, 92, r.judge.color, 'center', 'outline', 2);
  if (r.combo >= 4) text('x' + r.combo, VW / 2, 110, '#ffd84a', 'center', 'outline');
  const done = r.notes.filter(n => n.hit === 1).length;
  text(`${done} / ${r.notes.length}`, VW - 10, 220, '#e8c890', 'right', false);
}
function offerDuel() { if (G.state === 'play') startDuel(); }

// ---------------- Chilly's night ----------------
// Chilly can't walk in daylight, so his creatures get bolder after dark: faster, and they drop
// more. And a zombie has a grave of his own on the beach, which only shows up at night.
const NIGHT_BOLD = new Set(['penguin', 'snowpeng', 'draugr', 'varg', 'wisp', 'slime', 'beetle']);
function nightBold(e) { return G.mode !== 'arena' && G.map && G.map.outdoor && isNight() && NIGHT_BOLD.has(e.type); }
MAPS.overworld.ents.push({ t: 'owengrave', at: [45, 30] });
function owenGrave() {
  G.photoCard = 'grave';
  if (flag('owen_grave')) return say([['', '"HERE LIES OWEN. HE GOT BETTER."'], ['Jon', 'Still weird. Visiting your own grave. At night. With an axe.']], () => { G.photoCard = null; });
  return say([['', 'A pale gravestone glows in the moonlight. It was not here this afternoon.'], ['', '"HERE LIES OWEN. HE GOT BETTER."'], ['Owen', 'That\'s... mine. From last time.'],
    ['Jon', 'Only a zombie can see it. Only a zombie would WANT to. Look, there\'s something in the flowers.']], () => {
    setFlag('owen_grave'); G.save.kr += 60; G.save.rune = RUNE_MAX; jonXP(25); Sound.play('secret');
    say([['', 'You found 60 kroner and a rune shard someone left for you. Your rune meter is full.']], () => { G.photoCard = null; writeSave(); });
  });
}
function drawOwenGrave(e) {
  const x = Math.round(e.x - G.cam.x), y = Math.round(e.y - G.cam.y), g = 0.6 + 0.3 * Math.sin(G.t * 2);
  ctx.globalAlpha = qa(g * 0.4); pxEllipseFill(x, y + 4, 14, 6, '#bfe0ff');
  ctx.globalAlpha = g; R(x - 6, y - 10, 12, 16, '#d8e4f0'); R(x - 5, y - 12, 10, 2, '#d8e4f0'); R(x - 1, y - 8, 2, 7, '#8aa0c0'); R(x - 3, y - 6, 6, 2, '#8aa0c0');
  ctx.globalAlpha = 1;
}
// resting at a runestone: talk to it twice to sleep until nightfall (or morning)
function runestoneRest() {
  const night = isNight();
  G.save.clock = night ? 7.5 : 20.5;
  G.flash = 0.6; G.flashColor = '#000'; Sound.play('save');
  return say(night ? [['', 'You rest against the runestone until the sun comes up.'], ['Jon', 'Morning! Chilly hates this part.']]
    : [['', 'You rest against the runestone until the stars come out.'], ['Jon', 'Night. Chilly\'s critters get brave now. Stay sharp. Zombies see things at night, you know.']]);
}

// ---------------- Owen's notes (director's commentary) ----------------
// Owen writes a note for any scene in OWEN'S SCRIPT. With notes on, it appears on notebook paper
// right after that scene plays. Nothing here is written for him: no note, no card.
const NOTES = { map: {}, on: true };
try { NOTES.on = localStorage.getItem('jontuka-notes') !== '0'; } catch (e) {}
try { NOTES.map = JSON.parse(localStorage.getItem('jontuka-notes-text') || '{}'); } catch (e) {}
function toggleNotes() { NOTES.on = !NOTES.on; try { localStorage.setItem('jontuka-notes', NOTES.on ? '1' : '0'); } catch (e) {} Sound.play('menu'); }
function sceneOf(lines) { for (const id of SCENE_ORDER) if (sceneGet(id) === lines) return id; return null; }
function noteAfter(lines, done) {
  if (!NOTES.on || G.mode === 'arena') return done;
  const id = sceneOf(lines), note = id && NOTES.map[id];
  if (!note || !note.trim()) return done;
  const card = [["Owen's note", note]]; card.paper = true;
  return () => say(card, done);
}
async function storeNote(id, note) {
  if (note && note.trim()) NOTES.map[id] = note.trim(); else delete NOTES.map[id];
  try { localStorage.setItem('jontuka-notes-text', JSON.stringify(NOTES.map)); } catch (e) {}
  if (!SCRIPT.db) return;
  try { const ref = SCRIPT.db.doc('notes/' + docId(id)); if (NOTES.map[id]) await ref.set({ scene: id, note: NOTES.map[id], updatedAt: new Date().toISOString() }); else await ref.delete(); } catch (e) {}
}

// ---------------- wiring: shared storage for notes and photos ----------------
(function bootEditor() {
  if (!window.claude || !window.claude.use) return;
  window.claude.use('db').then(db => {
    if (!db) return;
    db.collection('notes').onSnapshot(snap => {
      const m = {}; for (const d of snap.docs) { const v = d.data(); if (v && v.note) m[v.scene || d.id] = v.note; }
      NOTES.map = m; try { localStorage.setItem('jontuka-notes-text', JSON.stringify(m)); } catch (e) {} renderScript();
    }, () => {});
    db.collection('notebook').onSnapshot(snap => {
      const m = {}; for (const d of snap.docs) { const v = d.data(); if (v && v.assetId) m[v.slot || d.id] = { assetId: v.assetId }; }
      for (const k in m) if (NOTEBOOK.slots[k] && NOTEBOOK.slots[k].assetId === m[k].assetId) m[k] = NOTEBOOK.slots[k];
      NOTEBOOK.slots = m; renderScript();
    }, () => {});
  }).catch(() => {});
  window.claude.use('assets').then(a => { NOTEBOOK.assets = a; renderScript(); }).catch(() => {});
})();
async function uploadPhoto(slot, file) {
  if (!NOTEBOOK.assets || !SCRIPT.db || !file) return;
  SCRIPT.status = 'Uploading…'; renderScript();
  try {
    const old = NOTEBOOK.slots[slot];
    const res = await NOTEBOOK.assets.upload(file);
    await SCRIPT.db.doc('notebook/' + docId(slot)).set({ slot, assetId: res.id, updatedAt: new Date().toISOString() });
    NOTEBOOK.slots[slot] = { assetId: res.id };
    if (old && old.assetId && !Object.values(NOTEBOOK.slots).some(v => v.assetId === old.assetId)) { try { await NOTEBOOK.assets.delete(old.assetId); } catch (e) {} }
    SCRIPT.status = 'Photo added. It shows in the game.';
  } catch (e) { SCRIPT.status = 'That photo did not upload. Try a JPG or PNG under 20 MB.'; }
  renderScript();
}
async function removePhoto(slot) {
  const old = NOTEBOOK.slots[slot]; delete NOTEBOOK.slots[slot];
  if (SCRIPT.db) { try { await SCRIPT.db.doc('notebook/' + docId(slot)).delete(); } catch (e) {} }
  if (old && old.assetId && NOTEBOOK.assets && !Object.values(NOTEBOOK.slots).some(v => v.assetId === old.assetId)) { try { await NOTEBOOK.assets.delete(old.assetId); } catch (e) {} }
  renderScript();
}
function renderNotebookTab(body) {
  const can = !!(NOTEBOOK.assets && SCRIPT.db);
  body.innerHTML = '<p class="hint">Photograph pages from Owen\'s real notebook: drawings, maps, a page of the story. Each photo shows up in the game on that chapter\'s title card or pinned to that boss\'s card.</p>' +
    (can ? '' : '<p class="empty">Adding photos needs the page\'s owner to be signed in. Photos already added still show.</p>') +
    '<ul class="slots">' + PHOTO_SLOTS.map(([slot, name]) => { const has = NOTEBOOK.slots[slot]; return `<li class="slot"><div class="thumb">${has ? `<img src="/_blob/${esc(has.assetId)}" alt="Owen's page for ${esc(name)}">` : '<span>no photo</span>'}</div><b>${esc(name)}</b>` +
      (can ? `<label class="ghost up">${has ? 'Replace' : 'Add photo'}<input type="file" accept="image/*" data-slot="${esc(slot)}" hidden></label>${has ? `<button class="x rm" data-slot="${esc(slot)}" aria-label="Remove photo for ${esc(name)}">Remove</button>` : ''}` : '') + '</li>'; }).join('') + '</ul>';
  body.querySelectorAll('input[type=file]').forEach(i => i.onchange = () => uploadPhoto(i.dataset.slot, i.files[0]));
  body.querySelectorAll('.rm').forEach(b => b.onclick = () => removePhoto(b.dataset.slot));
  body.querySelectorAll('.thumb img').forEach(img => { img.tabIndex = 0; img.onclick = () => openPage(img.src, img.alt); img.onkeydown = e => { if (e.key === 'Enter') openPage(img.src, img.alt); }; });
}
function openPage(src, alt) {
  const box = document.createElement('div'); box.className = 'lightbox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', alt);
  box.innerHTML = `<img src="${esc(src)}" alt="${esc(alt)}"><button class="ghost">Close ✕</button>`;
  const close = () => box.remove(); box.onclick = close; document.body.appendChild(box); box.querySelector('button').focus();
}
