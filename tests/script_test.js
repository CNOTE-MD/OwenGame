// The editor's systems: OWEN'S SCRIPT (edit any scene, write Chapter 4, notes), Easy/Normal,
// chapter cards, Jon's songs and the beat, the RUSH Ø duel, Chilly's night and Owen's grave.
// Run: NODE_PATH=$(npm root -g) node tests/script_test.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 900, height: 1400 } });
  const errs = []; let fails = 0;
  pg.on('pageerror', e => errs.push('pageerror ' + e.message));
  pg.on('console', m => { if (m.type() === 'error' && !/fonts|net::|ERR_/.test(m.text())) errs.push(m.text()); });
  const ev = (f, a) => pg.evaluate(f, a);
  const wait = ms => pg.waitForTimeout(ms);
  const check = async (name, ok) => { console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) { fails++; console.log('   ', JSON.stringify(await ev(() => ({ st: G.state, map: G.mapId, talk: G.talk && G.talk.cur, status: SCRIPT.status })))); } };
  async function talkThrough(max = 80) { for (let i = 0; i < max; i++) { const st = await ev(() => G.state); if (st !== 'talk' && st !== 'hold' && st !== 'warp') return; await ev(() => cv.focus()); await pg.keyboard.press('KeyZ'); await wait(40); } }
  async function go(map, tx, ty) { await ev(([m, x, y]) => { G.mode = 'story'; G.state = 'play'; G.talk = null; loadMap(m, x * 16 + 8, y * 16 + 8); G.ents = G.ents.filter(e => !e.enemy); G.state = 'play'; G.talk = null; G.bossCard = null; G.chapterCard = null; }, [map, tx, ty]); await wait(60); }

  await pg.goto('file://' + path.resolve(__dirname, '../web/index.html'));
  await ev(() => { try { localStorage.clear(); } catch (e) {} G.mode = 'story'; G.save = newSave(); applyJonPerks(); G.player = makePlayer(); G.jon = makeJon(); for (const f of ['met_astrid', 'jonarea:overworld', 'exchanged', 'log_scene', 'forest_arrival']) setFlag(f); G.save.maxHp = 10; G.player.hp = 10; });
  await go('overworld', 20, 36);

  // ---- Easy / Normal ----
  await ev(() => { G.player.inv = 0; G.player.hp = 10; hurtPlayer(2, { x: G.player.x + 10, y: G.player.y }); });
  await check('Normal: a 2-damage hit costs a full heart', await ev(() => G.player.hp === 8));
  await ev(() => { setDifficulty('easy', true); G.player.inv = 0; G.player.hp = 10; hurtPlayer(2, { x: G.player.x + 10, y: G.player.y }); });
  await check('Easy: the same hit costs half, and boss openings last longer', await ev(() => G.player.hp === 9 && bossWindow() > 1 && isEasy()));
  await check('the choice is remembered for the next game', await ev(() => localStorage.getItem('jontuka-difficulty') === 'easy' && defaultDiff() === 'easy'));
  await ev(() => setDifficulty('normal', true));

  // ---- chapter cards ----
  await ev(() => { G.chapterCard = null; showChapter(2); });
  await check('a chapter card shows once per chapter', await ev(() => G.chapterCard && G.chapterCard.n === 2 && flag('chapter_card:2')));
  await ev(() => { G.chapterCard = null; showChapter(2); });
  await check('...and not twice', await ev(() => !G.chapterCard));

  // ---- OWEN'S SCRIPT: edit a scene ----
  await pg.click('#scriptbtn'); await wait(100);
  await check('OWEN\'S SCRIPT opens under the screen with every scene listed', await ev(() => !document.getElementById('script').hidden && document.querySelectorAll('.scene').length === SCENE_ORDER.length));
  await ev(() => { const b = [...document.querySelectorAll('.scene')].find(b => b.dataset.id === 'lars'); b.click(); });
  await wait(50);
  await check('picking a scene shows its lines to edit', await ev(() => document.querySelectorAll('#st-body .line').length === STORY_ORIG.lars.length));
  await pg.fill('#txt-0', 'Welcome to my stall! Everything is on sale. Except the troll tooth.');
  await ev(() => { G.player.x = 20 * 16 + 8; });
  await pg.focus('#txt-0'); await pg.keyboard.press('KeyD'); await pg.keyboard.press('Backspace');
  await check('typing in the script never moves Owen', await ev(() => G.player.x === 20 * 16 + 8 && !keys.KeyD));
  await pg.click('#st-save'); await wait(80);
  await check('saving changes the game\'s words right away', await ev(() => STORY.lars[0][1].startsWith('Welcome to my stall! Everything is on sale.')));
  await check('...and keeps them in this browser', await ev(() => JSON.parse(localStorage.getItem('jontuka-script')).edits.lars[0].text.includes('troll tooth')));
  await check('the list marks the scene as edited', await ev(() => { SCRIPT.sel = null; renderScript(); return [...document.querySelectorAll('.scene')].find(b => b.dataset.id === 'lars').textContent.includes('edited'); }));
  await ev(() => { const b = [...document.querySelectorAll('.scene')].find(b => b.dataset.id === 'lars'); b.click(); });
  await pg.click('#st-reset'); await wait(80);
  await check('"Put back the original" restores Owen\'s words', await ev(() => JSON.stringify(STORY.lars) === JSON.stringify(STORY_ORIG.lars)));

  // ---- notes ----
  await ev(() => { const b = document.getElementById('st-back'); if (b) b.click(); const s = [...document.querySelectorAll('.scene')].find(b => b.dataset.id === 'ingrid'); s.click(); });
  await pg.fill('#st-note', 'Ingrid is based on my grandma. She also fishes.');
  await pg.click('#st-save'); await wait(80);
  await check('the note is saved with the scene', await ev(() => /grandma/.test(NOTES.map.ingrid || '')));
  await ev(() => { closeScript(); NOTES.on = true; G.state = 'play'; G.talk = null; const after = noteAfter(STORY.ingrid, null); after(); });
  await check('with notes on, Owen\'s note plays on notebook paper after its scene', await ev(() => G.state === 'talk' && G.talk.paper && JSON.stringify([G.talk.cur, ...G.talk.queue]).includes('grandma')));
  await talkThrough();
  await check('with notes off, nothing extra plays', await ev(() => { NOTES.on = false; return noteAfter(STORY.ingrid, null) === null; }));
  await ev(() => { NOTES.on = true; storeNote('ingrid', ''); });

  // ---- Chapter 4: Walter's Forge, written by Owen ----
  await go('overworld', 60, 18);
  await ev(() => forgeDoor()); await wait(50);
  await check('before Chapter 3 is done the forge door is just sealed', await ev(() => G.state === 'talk' && /Chapter 4|WALTER/.test(JSON.stringify(G.talk.cur || G.talk.queue))));
  await talkThrough();
  await ev(() => { setFlag('d2done'); forgeDoor(); }); await wait(50);
  await check('after Hank, with no pages yet, Jon says the forge is waiting for Owen to write it', await ev(() => G.state === 'talk' && JSON.stringify([G.talk.cur, ...G.talk.queue]).includes('OWEN\'S SCRIPT')));
  await talkThrough();
  await ev(() => openScript('ch4')); await wait(50);
  await pg.click('#ch4-new'); await wait(50);
  await ev(() => { document.querySelector('.ptitle').value = 'The forge door opens'; document.querySelector('.pt').value = 'It was HOT. Like, really hot.'; });
  await pg.click('.psave'); await wait(80);
  await check('Owen can write a Chapter 4 page and save it', await ev(() => SCRIPT.ch4.length === 1 && SCRIPT.ch4[0].lines[0].text.includes('HOT')));
  await ev(() => { closeScript(); G.state = 'play'; forgeDoor(); }); await wait(50);
  await check('the forge door plays Owen\'s pages on notebook paper', await ev(() => G.state === 'talk' && G.talk.paper && JSON.stringify([G.talk.cur, ...G.talk.queue]).includes('really hot')));
  await talkThrough();
  await check('...and the compass stops pointing at the forge once they\'re read', await ev(() => flag('ch4_read') && (!objectiveTarget() || objectiveTarget().label !== "Walter's Forge")));

  // ---- Jon remembers songs; the beat ----
  await go('overworld', 20, 36);
  await check('with no songs, outdoor music is just bass and kick', await ev(() => { Music.name = 'overworld'; return songsKnown() === 0 && !layerOn({ inst: 'lead' }) && layerOn({ inst: 'drum', kind: 'k' }) && !layerOn({ inst: 'drum', kind: 's' }); }));
  await ev(() => giveItem('fire')); await talkThrough();
  await check('finding a rune makes Jon remember a song, and the drums come back', await ev(() => flag('song:fire') && songsKnown() === 1 && layerOn({ inst: 'drum', kind: 's' }) && !layerOn({ inst: 'lead' })));
  await check('a chop on the beat hits 1.5x', await ev(() => { const e = makeEnemy('draugr', G.player.x + 14, G.player.y); e.hp = 10; e.max = 10; e.shield = false; G.ents.push(e); const _on = onBeat; onBeat = () => true; G.st.crit = 0; damageEnemy(e, 1, G.player, 'swing'); onBeat = _on; return Math.abs(e.hp - 8.5) < 1e-9; }));

  // ---- RUSH Ø duel ----
  await ev(() => { G.ents = G.ents.filter(e => !e.enemy); G.save.kr = 0; startDuel(); });
  await check('Bjarne\'s duel opens a rhythm game', await ev(() => G.state === 'rhythm' && G.rh.notes.length === 36));
  await ev(() => { const r = G.rh; r.started = true; for (const n of r.notes) n.hit = 1; r.hits = r.notes.length; r.t = r.notes[r.notes.length - 1].t + 2; });
  await wait(100);
  await check('clearing it pays 40 kroner once and records the best score', await ev(() => G.save.rushBest === 100 && G.save.kr === 40 && flag('rush_cleared')));
  await talkThrough();

  // ---- Chilly's night ----
  await ev(() => { G.save.clock = 22; }); await go('overworld', 44, 31);
  await check('at night a pale grave appears on the beach', await ev(() => isNight() && G.ents.some(e => e.kind === 'owengrave')));
  await ev(() => { G.save.kr = 0; G.save.rune = 0; interact(G.ents.find(e => e.kind === 'owengrave')); }); await talkThrough();
  await check('"HERE LIES OWEN. HE GOT BETTER." (60 kroner and a full rune meter)', await ev(() => flag('owen_grave') && G.save.kr === 60 && G.save.rune === RUNE_MAX));
  await check('Chilly\'s creatures are bolder at night', await ev(() => nightBold(makeEnemy('penguin', 0, 0)) && nightBold(makeEnemy('squirrel', 0, 0))));
  await ev(() => { G.save.clock = 12; }); await go('overworld', 44, 31);
  await check('by day the grave is gone', await ev(() => !G.ents.some(e => e.kind === 'owengrave')));

  // ---- level-up guard ----
  await ev(() => { G.state = 'play'; G.talk = null; jonXP(jonNeed(G.save.jon.lvl)); maybeJonLevelUp(); });
  await check('a level-up opens Jon\'s perk screen', await ev(() => G.state === 'jonlevel'));
  await wait(30); await ev(() => cv.focus()); await pg.keyboard.press('KeyZ'); await wait(30);
  await check('a mashed button can\'t pick a perk in the first moment of a level-up', await ev(() => G.state === 'jonlevel'));

  console.log('errors:', errs);
  console.log('FAILS:', fails);
  await b.close();
  process.exit(fails || errs.length ? 1 : 0);
})();
