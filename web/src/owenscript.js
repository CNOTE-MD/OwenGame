// Easy/Normal difficulty, chapter title cards, a bigger level-up and boss-defeated moment,
// OWEN'S SCRIPT (edit any line in the game, saved for good), and Chapter 4 written by Owen.

// ---------------- difficulty ----------------
// Easy: hits cost half as much, boss openings last 40% longer, Jon's compliments come faster.
const DIFF_KEY = 'jontuka-difficulty';
function defaultDiff() { try { return localStorage.getItem(DIFF_KEY) === 'easy' ? 'easy' : 'normal'; } catch (e) { return 'normal'; } }
function isEasy() { return G.mode !== 'arena' && !!G.save && G.save.diff === 'easy'; }
function dmgScale() { return isEasy() ? 0.5 : 1; }
function bossWindow() { return isEasy() ? 1.4 : 1; }
function setDifficulty(d, silent) {
  if (G.save) G.save.diff = d;
  try { localStorage.setItem(DIFF_KEY, d); } catch (e) {}
  if (!silent) { Sound.play('menu'); if (G.save && G.mode === 'story' && G.player) writeSave(); }
}
function toggleDifficulty() { setDifficulty(isEasy() || (!G.save && defaultDiff() === 'easy') ? 'normal' : 'easy'); }

// ---------------- chapter title cards ----------------
const CHAPTERS = {
  1: 'Unfinished Business',      // Jon's words in Owen's room
  2: 'Jjorvic Palace',
  3: 'The Drowned Barrow',
  4: "Walter's Forge",
  5: 'The Storm Peak',
};
function showChapter(n) {
  if (!G.save || G.mode === 'arena' || flag('chapter_card:' + n)) return;
  setFlag('chapter_card:' + n);
  G.chapterCard = { n, name: CHAPTERS[n] || '', t: 0, life: 3.4 };
  Sound.play('save');
}
function drawChapterCard() {
  const c = G.chapterCard;
  if (!c || G.state === 'menu' || G.state === 'title' || G.state === 'jonlevel') return;
  c.t += 1 / 60;
  if (c.t > c.life) { G.chapterCard = null; return; }
  const k = Math.min(1, c.t / 0.5), out = Math.max(0, (c.t - (c.life - 0.6)) / 0.6), a = k * (1 - out);
  ctx.globalAlpha = 0.82 * a; R(0, 52, VW, 74, '#0a0812'); ctx.globalAlpha = a;
  R(28, 60, VW - 56, 1, '#ffd84a'); R(28, 118, VW - 56, 1, '#ffd84a');
  text('CHAPTER ' + c.n, VW / 2, 82, '#ffd84a', 'center', 'outline', 2);
  // the name types itself out, like a storybook caption
  const shown = c.name.slice(0, Math.floor(Math.max(0, c.t - 0.4) * 22));
  text(shown, VW / 2, 104, '#f6f0dc', 'center', true);
  ctx.globalAlpha = 1;
}

// ---------------- level up and boss defeated ----------------
// The level-up screen opens with a burst and ignores button mashing for a moment, so a perk
// is never picked by accident in the middle of a fight.
const LEVEL_GUARD = 0.75;
function drawLevelBurst() {
  if (G.state !== 'jonlevel') return;
  const t = G.jonLvT || 0;
  if (t > LEVEL_GUARD + 0.3) return;
  const k = Math.min(1, t / 0.35), fade = t > LEVEL_GUARD ? 1 - (t - LEVEL_GUARD) / 0.3 : 1;
  ctx.globalAlpha = 0.9 * fade; R(0, 0, VW, VH, '#120c22');
  ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 2;
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + t * 2, r0 = 20 + k * 20, r1 = 40 + k * 90; pxLine(128 + Math.cos(a) * r0, 104 + Math.sin(a) * r0, 128 + Math.cos(a) * r1, 104 + Math.sin(a) * r1, '#ffd84a', 2); }
  drawJonSprite(128, 104, t * 9, false, 'excited');
  text('LEVEL UP!', 128, 150, '#ffd84a', 'center', 'outline', 2);
  ctx.globalAlpha = 1;
}
const DEFEATED = { giant: 'FOREST GIANT', king: 'PENGUIN KING', captain: 'DRAUGR CAPTAIN', hank: "HANK'S GHOST", attendant: 'FLIGHT ATTENDANT', knight: 'PENGUIN KNIGHT' };
function bossDefeated(e) {
  if (G.mode === 'arena' || !DEFEATED[e.type]) return;
  G.bossCard = { name: DEFEATED[e.type], sub: 'DEFEATED!', t: 0, life: 2.6 };
  G.flash = 0.3; G.flashColor = '#fff';
  Sound.tone([[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.18], [784, 0.08], [1047, 0.4]], 0.07);
  for (let i = 0; i < 26; i++) { const a = Math.random() * Math.PI * 2, sp = rnd(40, 140); G.fx.push({ x: e.x, y: e.y - 10, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, grav: 160, t: 0, life: 1.1, color: pick(['#ffd84a', '#ffffff', '#ff6b6b', '#7fd4ff']), size: 2 }); }
}

// ---------------- OWEN'S SCRIPT ----------------
// Every scene of dialogue in the game, editable in a panel under the screen. Owen's edits are
// saved in the artifact's shared database (so they follow him to any device, and Claude can read
// them to build the next chapter); without it they stay in this browser.
const STORY_ORIG = JSON.parse(JSON.stringify(STORY));
const SCRIPT = { open: false, db: null, edits: {}, ch4: [], sel: null, tab: 'scenes', status: '' };
const SCENE_NAMES = {
  intro: "Owen's room: waking up", plaque: 'The plaque Jon carved', poster: 'The longship poster', arrival: 'Landing in Norway',
  attendant_ok: 'The (normal) flight attendant', commuter: 'Commuter in the subway', forest_arrival: 'Arriving at the Muck Forest',
  log_scene: 'The big log', log_wakes: 'The log wakes up', giant_blur: 'Giant fight: the blur', giant_timeout: 'Giant fight: the time-out signal',
  giant_lore: "Giant fight: the giants' old war", giant_hide: 'Giant hides as a tree', giant_down: 'Giant defeated',
  cargo: 'Bench by the plane', cargo_open: 'The Red-Eye dream', attendant: 'Flight Attendant boss', attendant_down: 'Flight Attendant defeated',
  astrid_1: 'Meeting Astrid', astrid_2: 'Astrid: where the palace is', astrid_3: 'Astrid: the Thunder Rune', astrid_4: 'Astrid: after Hank',
  barrow_enter: 'Entering the Drowned Barrow', fluffy_1: 'Fluffy (first time)', fluffy_2: 'Fluffy (after the dash)', captain: 'Draugr Captain',
  hank: "Hank's Ghost", hank_down: 'Hank freed', lars: 'Lars at the market', sven_quest: "Sven's lost longship", sven_thanks: 'Sven says thanks',
  bjarne_quest: "Bjarne's sheet music", bjarne_thanks: 'Bjarne plays RUSH Ø', ingrid: 'Ingrid by the lake', cavern_enter: 'Entering Jjorvic Palace',
  knight: 'Penguin Knight', king: 'Penguin King', king_down: 'Penguin King defeated', revive: 'Voodoo revive', grave: "Fluffy's grave",
  'flight.0': 'Flight 364: takeoff', 'flight.1': 'Flight 364: the odd look', 'flight.2': 'Flight 364: DEMON', 'flight.3': 'Flight 364: the cow dream',
  'signs.sign_fjordvik': 'Sign: Fjordvik', 'signs.sign_beach': 'Sign: the beach', 'signs.sign_airstrip': 'Sign: the airstrip', 'signs.sign_cavern': 'Sign: Jjorvic Palace', 'signs.sign_tbane': 'Sign: the T-bane', 'signs.seal_peak': 'Sealed door: Storm Peak',
  'flight.4': 'Flight 364: refreshments', 'flight.5': 'Flight 364: landing', 'taxi_out.0': 'Taxi to the forest (1)', 'taxi_out.1': 'Taxi to the forest (2)',
  lion_wake: 'Peanut Butter Lion wakes up', lion_again: 'Peanut Butter Lion (again)', lion_down: 'Peanut Butter Lion melts', throne_riddle: 'The riddle in the throne', throne_riddle_right: 'Riddle solved',
  baron_1: 'Meeting Baron Blubber', baron_trophy: "Baron Blubber's trophy", baron_dartboard: 'The Chilly dartboard', 'signs.sign_nopeng': 'Sign: NO PENGUINS',
};
const SCENE_ORDER = Object.keys(SCENE_NAMES);
function sceneGet(id, from = STORY) { const [k, i] = id.split('.'); const v = from[k]; if (i === undefined) return v; if (Array.isArray(v)) return v[+i] && v[+i].lines; return v && v[i]; }
function sceneSet(id, lines) {
  const [k, i] = id.split('.');
  if (i === undefined) STORY[k] = lines; else if (Array.isArray(STORY[k])) { if (STORY[k][+i]) STORY[k][+i].lines = lines; } else if (STORY[k]) STORY[k][i] = lines;
}
function applyEdits() {
  for (const id of SCENE_ORDER) {
    const orig = sceneGet(id, STORY_ORIG);
    const ed = SCRIPT.edits[id];
    sceneSet(id, ed ? ed.map(l => [l.who || '', l.text || '']) : JSON.parse(JSON.stringify(orig)));
  }
}
function localScript() { try { return JSON.parse(localStorage.getItem('jontuka-script') || '{}'); } catch (e) { return {}; } }
function saveLocal() { try { localStorage.setItem('jontuka-script', JSON.stringify({ edits: SCRIPT.edits, ch4: SCRIPT.ch4 })); } catch (e) {} }

(function bootScript() {
  const l = localScript(); SCRIPT.edits = l.edits || {}; SCRIPT.ch4 = l.ch4 || []; applyEdits();
  const c = window.claude && window.claude.use;
  if (!c) return;
  window.claude.use('db').then(db => {
    if (!db) { SCRIPT.status = 'Saved in this browser only.'; renderScript(); return; }
    SCRIPT.db = db;
    const timer = setTimeout(() => { SCRIPT.status = 'Still loading Owen\'s script…'; renderScript(); }, 10000);
    db.collection('script').onSnapshot(snap => {
      clearTimeout(timer);
      const edits = {};
      for (const d of snap.docs) { const v = d.data(); if (v && Array.isArray(v.lines)) edits[v.scene || d.id] = v.lines; }
      SCRIPT.edits = edits; applyEdits(); saveLocal(); SCRIPT.status = 'Saved for good. Works on any device.'; renderScript();
    }, () => { clearTimeout(timer); SCRIPT.status = 'Could not reach the save. Edits stay in this browser.'; renderScript(); });
    db.collection('chapter4').onSnapshot(snap => {
      SCRIPT.ch4 = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p && Array.isArray(p.lines)).sort((a, b) => (a.order || 0) - (b.order || 0));
      saveLocal(); renderScript();
    }, () => {});
  }).catch(() => {});
})();

const docId = id => id.replace(/[^a-zA-Z0-9_-]/g, '_');
async function storeScene(id, lines) {
  if (lines) SCRIPT.edits[id] = lines; else delete SCRIPT.edits[id];
  applyEdits(); saveLocal();
  if (!SCRIPT.db) return true;
  try {
    const ref = SCRIPT.db.doc('script/' + docId(id));
    if (lines) await ref.set({ scene: id, lines, updatedAt: new Date().toISOString() }); else await ref.delete();
    return true;
  } catch (e) { SCRIPT.status = e && e.code === 'permission_denied' ? 'This account can read the script but not change it.' : 'Saved in this browser; the shared save did not take.'; return false; }
}
async function storePage(page) {
  const i = SCRIPT.ch4.findIndex(p => p.id === page.id);
  if (i >= 0) SCRIPT.ch4[i] = page; else SCRIPT.ch4.push(page);
  saveLocal();
  if (!SCRIPT.db) return;
  try { await SCRIPT.db.doc('chapter4/' + page.id).set({ order: page.order, title: page.title, lines: page.lines, updatedAt: new Date().toISOString() }); } catch (e) { SCRIPT.status = 'Saved in this browser; the shared save did not take.'; }
}
async function removePage(id) {
  SCRIPT.ch4 = SCRIPT.ch4.filter(p => p.id !== id); saveLocal();
  if (SCRIPT.db) { try { await SCRIPT.db.doc('chapter4/' + id).delete(); } catch (e) {} }
}

// ---- panel ----
const $ = id => document.getElementById(id);
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function openScript(tab) {
  SCRIPT.open = true; if (tab) SCRIPT.tab = tab;
  for (const k in keys) keys[k] = false; for (const k in virt) virt[k] = false;
  if (document.body.classList.contains('theater')) exitTheater();
  $('script').hidden = false; renderScript(); $('script').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function closeScript() { SCRIPT.open = false; $('script').hidden = true; cv.focus(); }
function draftLines(id) { return (SCRIPT.edits[id] || sceneGet(id, STORY_ORIG) || []).map(l => Array.isArray(l) ? { who: l[0], text: l[1] } : { who: l.who, text: l.text }); }
function renderScript() {
  const box = $('script'); if (!box || box.hidden) return;
  $('st-status').textContent = SCRIPT.status;
  for (const t of ['scenes', 'ch4', 'notebook']) $('tab-' + t).setAttribute('aria-selected', SCRIPT.tab === t);
  const body = $('st-body');
  if (SCRIPT.tab === 'ch4') return renderCh4(body);
  if (SCRIPT.tab === 'notebook') return renderNotebookTab(body);
  if (!SCRIPT.sel) {
    body.innerHTML = '<p class="hint">Pick a scene. Change any words you want; they play in the game right away.</p><ul class="scenes">' +
      SCENE_ORDER.map(id => `<li><button class="scene" data-id="${esc(id)}"><span>${esc(SCENE_NAMES[id])}</span>${SCRIPT.edits[id] ? '<em>edited</em>' : NOTES.map[id] ? '<em>note</em>' : ''}</button></li>`).join('') + '</ul>';
    body.querySelectorAll('.scene').forEach(b => b.onclick = () => { SCRIPT.sel = b.dataset.id; SCRIPT.draft = draftLines(SCRIPT.sel); renderScript(); });
    return;
  }
  const id = SCRIPT.sel, d = SCRIPT.draft;
  body.innerHTML = `<div class="row"><button class="ghost" id="st-back">◀ All scenes</button><h3>${esc(SCENE_NAMES[id])}</h3></div>` +
    '<p class="hint">Leave the name empty for narration.</p>' +
    d.map((l, i) => `<div class="line"><input id="who-${i}" value="${esc(l.who)}" placeholder="Narration" aria-label="Who is talking, line ${i + 1}" list="speakers"><textarea id="txt-${i}" rows="2" aria-label="Line ${i + 1}">${esc(l.text)}</textarea><button class="x" data-i="${i}" aria-label="Delete line ${i + 1}">✕</button></div>`).join('') +
    `<label class="note"><span>Owen's note <i>(optional: shows on notebook paper after this scene when notes are on)</i></span><textarea id="st-note" rows="2" placeholder="Why I wrote it this way, a secret, a joke…">${esc(NOTES.map[id] || '')}</textarea></label>` +
    `<div class="row wrap"><button class="ghost" id="st-add">+ Add a line</button><span class="grow"></span>${SCRIPT.edits[id] ? '<button class="ghost" id="st-reset">Put back the original</button>' : ''}<button class="ghost" id="st-play">▶ Play it</button><button id="st-save">Save</button></div>`;
  const pull = () => d.forEach((l, i) => { l.who = $('who-' + i).value.trim(); l.text = $('txt-' + i).value; });
  $('st-back').onclick = () => { SCRIPT.sel = null; renderScript(); };
  $('st-add').onclick = () => { pull(); d.push({ who: 'Jon', text: '' }); renderScript(); $('txt-' + (d.length - 1)).focus(); };
  body.querySelectorAll('.x').forEach(b => b.onclick = () => { pull(); d.splice(+b.dataset.i, 1); renderScript(); });
  $('st-save').onclick = async () => { pull(); const note = $('st-note').value; const lines = d.filter(l => l.text.trim()); SCRIPT.draft = lines; $('st-save').textContent = 'Saving…'; const orig = JSON.stringify((sceneGet(id, STORY_ORIG) || []).map(l => [l[0], l[1]])); if (SCRIPT.edits[id] || JSON.stringify(lines.map(l => [l.who, l.text])) !== orig) await storeScene(id, lines); await storeNote(id, note); renderScript(); flashSaved(); };
  if ($('st-reset')) $('st-reset').onclick = async () => { await storeScene(id, null); SCRIPT.draft = draftLines(id); renderScript(); flashSaved('Original back'); };
  $('st-play').onclick = () => { pull(); playLines(d.filter(l => l.text.trim()).map(l => [l.who, l.text])); };
}
function renderCh4(body) {
  const pages = SCRIPT.ch4;
  body.innerHTML = '<p class="hint">Chapter 4 is Walter\'s Forge, on the volcano road. Write it page by page: who says what, and what happens. After Hank is freed, the forge door plays your pages.</p>' +
    (pages.length ? '' : '<p class="empty">No pages yet. Start with what Owen sees when the forge door opens.</p>') +
    pages.map((p, n) => `<section class="page" data-id="${esc(p.id)}"><div class="row"><b>Page ${n + 1}</b><input class="ptitle" value="${esc(p.title || '')}" placeholder="What happens on this page" aria-label="Page ${n + 1} title"><button class="x del" aria-label="Delete page ${n + 1}">✕</button></div>` +
      p.lines.map((l, i) => `<div class="line"><input class="pw" data-i="${i}" value="${esc(l.who || '')}" placeholder="Narration" list="speakers" aria-label="Who, line ${i + 1}"><textarea class="pt" data-i="${i}" rows="2" aria-label="Line ${i + 1}">${esc(l.text || '')}</textarea></div>`).join('') +
      `<div class="row wrap"><button class="ghost padd">+ Add a line</button><span class="grow"></span><button class="ghost pplay">▶ Play it</button><button class="psave">Save page</button></div></section>`).join('') +
    '<div class="row"><button id="ch4-new">+ New page</button></div>';
  $('ch4-new').onclick = () => { const p = { id: 'p' + Date.now().toString(36), order: Date.now(), title: '', lines: [{ who: '', text: '' }] }; SCRIPT.ch4.push(p); renderScript(); };
  body.querySelectorAll('.page').forEach(sec => {
    const p = SCRIPT.ch4.find(x => x.id === sec.dataset.id);
    const pull = () => { p.title = sec.querySelector('.ptitle').value; sec.querySelectorAll('.pw').forEach(w => p.lines[+w.dataset.i].who = w.value.trim()); sec.querySelectorAll('.pt').forEach(t => p.lines[+t.dataset.i].text = t.value); };
    sec.querySelector('.padd').onclick = () => { pull(); p.lines.push({ who: 'Jon', text: '' }); renderScript(); };
    sec.querySelector('.psave').onclick = async () => { pull(); p.lines = p.lines.filter(l => l.text.trim()); if (!p.lines.length) p.lines = [{ who: '', text: '' }]; await storePage(p); renderScript(); flashSaved(); };
    sec.querySelector('.pplay').onclick = () => { pull(); playLines(p.lines.filter(l => l.text.trim()).map(l => [l.who, l.text])); };
    sec.querySelector('.del').onclick = () => { if (sec.dataset.confirm) { removePage(p.id).then(renderScript); } else { sec.dataset.confirm = '1'; sec.querySelector('.del').textContent = 'Delete?'; } };
  });
}
function flashSaved(msg = 'Saved') { const t = $('st-toast'); t.textContent = msg + (SCRIPT.db ? '' : ' (this browser)'); t.hidden = false; clearTimeout(t._h); t._h = setTimeout(() => { t.hidden = true; }, 1800); }
function playLines(lines) {
  if (!lines.length) return;
  if (G.state !== 'play' || !G.player || !G.map) { SCRIPT.status = 'Start or continue the game, then press Play it.'; renderScript(); return; }
  closeScript(); say(lines);
}
(function wireScript() {
  const b = $('scriptbtn'); if (b) b.addEventListener('click', () => SCRIPT.open ? closeScript() : openScript());
  const c = $('st-close'); if (c) c.addEventListener('click', closeScript);
  $('tab-scenes').addEventListener('click', () => { SCRIPT.tab = 'scenes'; renderScript(); });
  $('tab-ch4').addEventListener('click', () => { SCRIPT.tab = 'ch4'; renderScript(); });
  $('tab-notebook').addEventListener('click', () => { SCRIPT.tab = 'notebook'; renderScript(); });
  const dl = document.createElement('datalist'); dl.id = 'speakers';
  dl.innerHTML = ['Owen', 'Jon', 'Astrid', 'Hank', 'Fluffy', 'Walter', 'Chilly', 'Lars', 'Sven', 'Bjarne', 'Ingrid', 'Penguin King', 'Forest Giant', 'Baron Blubber'].map(n => `<option value="${n}">`).join('');
  document.body.appendChild(dl);
})();

// ---------------- Chapter 4: Walter's Forge, from Owen's pages ----------------
function forgeDoor() {
  if (!flag('d2done')) return say(STORY.signs.seal_forge);
  const pages = SCRIPT.ch4.filter(p => p.lines.some(l => l.text && l.text.trim()));
  if (!pages.length) return say([['', 'A stone door, sealed by a glowing rune. WALTER\'S FORGE. The rune is warm now.'], ['Jon', 'It\'s waiting for the next part of the story, Señor. Open OWEN\'S SCRIPT under the screen and write Chapter 4.']]);
  showChapter(4);
  const all = [];
  pages.forEach((p, i) => { if (p.title) all.push(['', `Page ${i + 1}: ${p.title}`]); for (const l of p.lines) if (l.text && l.text.trim()) all.push([l.who || '', l.text]); });
  all.paper = true;
  all.push(['Jon', 'That\'s as far as Owen has written. The forge gets built from these pages. No pressure. Some pressure.']);
  say(all, () => { setFlag('ch4_read'); jonXP(10); writeSave(); });
}
