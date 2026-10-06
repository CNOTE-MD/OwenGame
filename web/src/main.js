// State machine and main loop.

function newGame() {
  G.mode = 'story'; resetJon();
  G.save = newSave(); applyJonPerks();
  G.player = makePlayer(); G.jon = makeJon();
  const st = MAPS.home.ents.find(e => e.t === 'start').at;
  G.state = 'play';
  loadMap('home', st[0] * T + 8, st[1] * T + 8);
  say(STORY.intro);
}
function continueGame(fromCheckpoint) {
  G.mode = 'story'; resetJon();
  G.save = readSave() || newSave(); applyJonPerks();
  G.player = makePlayer(); G.jon = makeJon();
  G.player.hp = G.save.maxHp;
  G.state = 'play';
  if (!G.save.x) return newGame();
  // after a game over you wake at the last runestone with the voodoo bond recharged
  if (fromCheckpoint && G.save.cp) { G.save.voodoo = true; G.save.voodoo2 = jonHas('bff'); loadMap(G.save.cp.map, G.save.cp.x, G.save.cp.y); writeSave(); return; }
  loadMap(G.save.map, G.save.x, G.save.y);
}

function startWarp(to, dest) {
  G.state = 'warp'; G.warp = { to, dest, t: 0, done: false };
  Sound.play('door');
}
function updateWarp(dt) {
  const w = G.warp; w.t += dt;
  if (w.t > 0.35 && !w.done) {
    w.done = true;
    loadMap(w.to, w.dest[0] * T + 8, w.dest[1] * T + 8);
  }
  if (w.t > 0.7) { G.state = 'play'; writeSave(); }
}

function onEnterScreen() {
  const has = type => G.ents.some(e => e.type === type && e.alive);
  if (G.mapId === 'cavern' && !flag('intro:cavern')) { setFlag('intro:cavern'); say(STORY.cavern_enter); }
  if (has('knight') && !flag('intro:knight')) { setFlag('intro:knight'); Sound.play('boss'); say(STORY.knight); }
  if (G.map.redeye) redeyeEnter();
  HK.axes = [];
  if (G.mapId === 'barrow' && !flag('intro:barrow')) { setFlag('intro:barrow'); say(STORY.barrow_enter); }
  if (has('captain') && !flag('intro:captain')) { setFlag('intro:captain'); Sound.play('boss'); say(STORY.captain); }
  if (has('hank')) { Sound.play('boss'); say(flag('intro:hank') ? [['Hank', 'TURN... BACK...']] : STORY.hank); setFlag('intro:hank'); }
  if (has('attendant') && !flag('intro:attendant')) { setFlag('intro:attendant'); say(STORY.attendant); }
  if (has('king')) { Sound.play('boss'); say(flag('intro:king') ? [['Penguin King', 'AK! Back for more?']] : STORY.king); setFlag('intro:king'); }
  if (G.mapId === 'overworld' && flag('d2done') && !flag('chapter2_banner') && G.scr.x === 0 && G.scr.y === 0) {
    setFlag('chapter2_banner'); G.banner = 'CHAPTER 2 COMPLETE'; G.bannerT = 4; Sound.play('secret'); writeSave();
  }
  if (G.mapId === 'overworld' && flag('d1done') && !flag('chapter1_banner') && G.scr.x === 2 && G.scr.y === 0) {
    setFlag('chapter1_banner'); G.banner = STORY.chapter_done; G.bannerT = 4; Sound.play('secret'); writeSave();
  }
}

function update(dt) {
  G.t += dt;
  G.shake = Math.max(0, G.shake - dt); G.flash = Math.max(0, G.flash - dt); G.bannerT = Math.max(0, G.bannerT - dt);
  if (G.state !== 'play') { JT.t = Math.max(0, JT.t - dt); JT.faceT = Math.max(0, JT.faceT - dt); }
  if (just('mute')) Sound.muted = !Sound.muted;
  if (just('music')) Music.on = !Music.on;
  switch (G.state) {
    case 'title': {
      if (!G.titleOpts) { G.titleOpts = titleOptions(); G.titleBest = arenaBest(); }
      const opts = G.titleOpts;
      if (just('up')) { G.menuSel = (G.menuSel + opts.length - 1) % opts.length; G.confirmErase = false; Sound.play('menu'); }
      if (just('down')) { G.menuSel = (G.menuSel + 1) % opts.length; G.confirmErase = false; Sound.play('menu'); }
      G.menuSel = clamp(G.menuSel, 0, opts.length - 1);
      if (just('a') || just('menu') || just('tap')) {
        G.titleOpts = null;
        const o = opts[G.menuSel];
        if (o.disabled) { Sound.play('clank'); break; }
        if (o.id === 'arena') { startArena(); break; }
        if (o.id === 'continue') continueGame();
        else if (o.id === 'new') {
          if (readSave() && !G.confirmErase) { G.confirmErase = true; break; }
          try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
          newGame();
        }
      }
      return;
    }
    case 'talk': updateTalk(dt); return;
    case 'cutscene': return;
    case 'hold':
      G.player.hold.t -= dt;
      if (G.player.hold.t <= 0) { G.player.hold = null; G.state = 'play'; G.afterHold(); }
      return;
    case 'warp': updateWarp(dt); return;
    case 'menu':
      if (just('left') || just('right')) { G.menuPage = G.menuPage ? 0 : 1; Sound.play('menu'); }
      if (just('menu') || just('a') || just('tap')) { G.state = 'play'; Sound.play('menu'); }
      return;
    case 'over':
      if (just('a') || just('menu') || just('tap')) { continueGame(true); }
      return;
    case 'jonlevel': updateJonLevel(); return;
    case 'levelup': case 'shop': case 'arenapause': case 'arenaover': updateArenaMenus(); return;
    case 'thunder': updateThunder(dt); updateFx(dt); return;
    case 'dying': updateDying(dt); updateFx(dt); return;
  }
  // play
  if (G.trans) { updateTransition(dt); return; }
  if (just('menu')) { G.state = G.mode === 'arena' ? 'arenapause' : 'menu'; Sound.play('menu'); return; }
  const s = G.save;
  if (s.items.thunder) { G.runeT = (G.runeT || 0) + dt; if (G.runeT > 5) { G.runeT = 0; s.rune = Math.min(RUNE_MAX, s.rune + 1); } }
  updatePlayer(dt);
  if (G.state !== 'play') return;
  updateJon(dt);
  if (G.mode === 'arena') { updateArena(dt); if (G.state !== 'play') return; }
  if (G.map.redeye) updateRedeye(dt);
  updateJonTalk(dt);
  maybeJonLevelUp();
  if (G.state !== 'play') return;
  if (HK.axes.length) updateHankAxes(dt);
  for (const e of G.ents.slice()) {
    if (e.kind === 'enemy' && e.alive) { if (e.slow > 0) { e.slow -= dt; updateEnemy(e, dt * 0.5); } else updateEnemy(e, dt); }
    else if (e.kind === 'pickup') updatePickup(e, dt);
    else if (e.kind === 'hazard') updateCart(e, dt);
    else if (e.kind === 'switch') e.cd = Math.max(0, e.cd - dt);
    if (G.state !== 'play') break;
  }
  updateFx(dt);
  if (G.state === 'play') checkScreenEdge();
}

function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, VW, VH);
  if (G.state === 'title') return drawTitle();
  if (G.state === 'cutscene' || (G.state === 'talk' && G.talk && G.talk.back === 'cutscene')) { drawCutscene(); drawTalk(); return; }
  if (G.shake > 0) ctx.setTransform(1, 0, 0, 1, Math.round(rnd(-2, 2)), Math.round(rnd(-2, 2)));
  drawMap();
  const p = G.player;
  const list = G.ents.filter(e => e.kind !== 'warp' || e.portal).map(e => ({ y: e.y, f: () => drawThing(e) }));
  list.push({ y: p.y, f: () => drawOwen(p.x - G.cam.x, p.y - G.cam.y) });
  list.push(...bigDrawList());
  list.sort((a, b) => a.y - b.y).forEach(o => o.f());
  if (G.mode === 'arena') drawArenaWorld();
  drawHankAxes();
  if (!p.hold) drawJon();
  drawFx();
  drawLightning();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (G.map.dungeon || G.map.dark) drawDungeonLight();
  drawRedeyeOverlay();
  if (G.flash > 0) { ctx.globalAlpha = Math.min(1, G.flash * 3); R(0, 0, VW, VH, G.flashColor || '#fff'); ctx.globalAlpha = 1; }
  if (G.mode === 'arena') drawArenaHud(); else drawHud();
  if (G.state === 'warp') { ctx.globalAlpha = clamp(1 - Math.abs(G.warp.t - 0.35) / 0.35, 0, 1); R(0, 0, VW, VH, '#000'); ctx.globalAlpha = 1; }
  if (G.bannerT > 0) { R(0, 92, VW, 34, 'rgba(0,0,0,.8)'); text(G.banner, VW / 2, 113, '#ffd84a', 'center'); }
  if (G.state === 'talk') drawTalk();
  if (G.state === 'menu') { if (G.menuPage) drawJonPage(); else drawMenu(); }
  drawJonLevel();
  drawArenaMenus();
  if (G.state === 'over') {
    R(0, 0, VW, VH, 'rgba(40,0,0,.8)');
    text('GAME OVER', VW / 2, 96, '#ff6b6b', 'center');
    text('Even zombies need a nap.', VW / 2, 116, '#fff', 'center');
    text('Press Z to continue', VW / 2, 140, '#ffd84a', 'center');
    text('from your last runestone', VW / 2, 154, '#ffd84a', 'center');
  }
}

let last = performance.now();
G.menuSel = 0;
buildAll();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  try { pollGamepad(); update(dt); render(); Music.want(musicFor()); Music.tick(); } catch (err) { console.error(err); }
  for (const k in edge) edge[k] = false;
  requestAnimationFrame(frame);
}
(document.fonts && document.fonts.load ? document.fonts.load('8px "Press Start 2P"').catch(() => {}) : Promise.resolve())
  .then(() => requestAnimationFrame(t => { last = t; frame(t); }));
window.__game = G;
