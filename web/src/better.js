// The "better" pass: an objective compass, the Penguin King's Royal Rage, ambient sound,
// controller rumble, the nap bench, and a record of Owen's deeds on the map page.

// ---------------- objective compass ----------------
// where the current objective lives on the overworld (tile coords), or null
function objectiveTarget() {
  const s = G.save;
  if (G.mode === 'arena' || G.mapId !== 'overworld') return null;
  if (!flag('met_astrid')) return { x: 4, y: 19, label: 'Astrid' };
  if (!flag('exchanged') && !flag('d1done')) return { x: 19, y: 38, label: 'Subway' };
  if (!flag('log_chopped') && !flag('d1done')) return { x: 31, y: 6, label: 'The log' };
  if (!flag('d1done')) return { x: 39, y: 2, label: 'Penguin Palace' };
  if (!flag('d2done')) return { x: 7, y: 2, label: 'Drowned Barrow' };
  if (!flag('redeye_done')) return { x: 29, y: 33, label: 'A nap' };
  return null;
}
function drawCompass() {
  const t = objectiveTarget();
  if (!t || G.state !== 'play') return;
  const p = G.player, tx = t.x * T + 8, ty = t.y * T + 8;
  const sx = tx - G.cam.x, sy = ty - G.cam.y;
  if (sx > 8 && sx < VW - 8 && sy > 26 && sy < VH - 8) {
    // on this screen: a bobbing marker over the spot
    const b = Math.round(Math.sin(G.t * 5) * 2);
    poly([[sx, sy - 12 + b], [sx - 4, sy - 18 + b], [sx + 4, sy - 18 + b]], '#ffd84a'); R(sx - 1, sy - 24 + b, 2, 5, '#ffd84a');
    return;
  }
  // off screen: an arrow at the edge of the screen, pointing the way
  const a = Math.atan2(ty - p.y, tx - p.x), cx = p.x - G.cam.x, cy = p.y - G.cam.y;
  const ax = clamp(cx + Math.cos(a) * 60, 12, VW - 12), ay = clamp(cy + Math.sin(a) * 60, 34, VH - 12);
  const pulse = 0.6 + 0.4 * Math.sin(G.t * 6);
  ctx.save(); ctx.translate(Math.round(ax), Math.round(ay)); ctx.rotate(a); ctx.globalAlpha = pulse;
  poly([[7, 0], [-5, -5], [-2, 0], [-5, 5]], '#000'); poly([[6, 0], [-4, -4], [-2, 0], [-4, 4]], '#ffd84a');
  ctx.restore(); ctx.globalAlpha = 1;
}

// ---------------- the Penguin King's Royal Rage ----------------
const ICICLES = [];
function kingRage(e, dt, dx, dy, d, mr, who) {
  // below four hearts the King rages: faster slides, more bounces, and every bounce shakes icicles loose
  if (e.hp > 4 || e.raged) return;
  e.raged = true; e.st = 'wind'; e.t = 0; G.shake = 0.5; Sound.play('boss');
  floatText(e.x, e.y - 40, 'ROYAL RAGE!', '#ff6b6b');
  JT.queued = null; jonSay('rage', { force: true, face: 'worried' });
}
function dropIcicles(n, nearX, nearY) {
  for (let i = 0; i < n; i++) {
    const x = clamp(nearX + rnd(-70, 70), G.cam.x + 16, G.cam.x + VW - 16), y = clamp(nearY + rnd(-50, 50), G.cam.y + 40, G.cam.y + VH - 16);
    if (solidAt(x, y, 'walker')) continue;
    ICICLES.push({ x, y, t: 0, warn: 0.7, fall: 0.25 });
  }
}
function updateIcicles(dt) {
  const p = G.player;
  for (const c of ICICLES) {
    c.t += dt;
    if (c.t >= c.warn && !c.hit) { c.hit = true; Sound.play('clank'); puff(c.x, c.y, '#cfefff', 8); if (dist(c, p) < 11) hurtPlayer(1, c); }
  }
  for (let i = ICICLES.length - 1; i >= 0; i--) if (ICICLES[i].t > ICICLES[i].warn + ICICLES[i].fall) ICICLES.splice(i, 1);
}
function drawIcicles() {
  for (const c of ICICLES) {
    const x = Math.round(c.x - G.cam.x), y = Math.round(c.y - G.cam.y);
    if (c.t < c.warn) { const k = c.t / c.warn; ctx.globalAlpha = 0.35 + k * 0.4; ctx.fillStyle = '#9fd0ff'; ctx.beginPath(); ctx.ellipse(x, y + 3, 7 * k + 2, 3 * k + 1, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; const fy = y - 120 + k * 120; poly([[x, fy + 8], [x - 3, fy - 6], [x + 3, fy - 6]], '#dff6ff'); R(x - 1, fy - 6, 2, 3, '#ffffff'); }
    else { const k = (c.t - c.warn) / c.fall; for (let i = 0; i < 4; i++) R(x - 6 + i * 4, y - 2 - k * 8, 2, 2, '#dff6ff'); }
  }
}

// ---------------- ambient sound ----------------
const Ambience = {
  name: null, nodes: [], timer: 0,
  for() {
    if (!G.map || G.state === 'title' || G.mode === 'arena' || Sound.muted) return null;
    if (G.mapId === 'subway') return 'subway';
    if (G.map.redeye) return null;
    if (G.map.dungeon || G.map.dark) return 'drips';
    if (G.map.interior) return null;
    if (G.scr.y === 0 && G.scr.x >= 2) return 'wind';
    if (typeof isNight === 'function' && isNight()) return 'crickets';
    return 'birds';
  },
  start(id) {
    const ac = Sound.ac; if (!ac) return;
    this.stop(); this.name = id;
    if (id === 'wind' || id === 'subway') {
      const n = ac.sampleRate * 2, buf = ac.createBuffer(1, n, ac.sampleRate), ch = buf.getChannelData(0);
      for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
      src.buffer = buf; src.loop = true; f.type = id === 'wind' ? 'bandpass' : 'lowpass'; f.frequency.value = id === 'wind' ? 500 : 110; f.Q.value = id === 'wind' ? 0.6 : 2;
      g.gain.value = id === 'wind' ? 0.05 : 0.07; lfo.frequency.value = id === 'wind' ? 0.18 : 0.5; lg.gain.value = id === 'wind' ? 300 : 30;
      lfo.connect(lg); lg.connect(f.frequency); src.connect(f).connect(g).connect(ac.destination); src.start(); lfo.start();
      this.nodes = [src, lfo, g];
    }
  },
  stop() { for (const n of this.nodes) { try { if (n.gain) { n.gain.setTargetAtTime(0, Sound.ac.currentTime, 0.2); } else if (n.stop) setTimeout(() => { try { n.stop(); } catch (e) {} }, 600); } catch (e) {} } this.nodes = []; this.name = null; },
  tick(dt) {
    const id = this.for();
    if (id !== this.name) { if (id === 'wind' || id === 'subway') this.start(id); else { this.stop(); this.name = id; } }
    if (!Sound.ac || Sound.muted) return;
    this.timer -= dt;
    if (this.timer > 0) return;
    // one-shot sounds that recur at random
    if (id === 'birds') { this.timer = rnd(2.5, 7); const base = pick([1800, 2200, 2600]); Sound.tone([[base, 0.06, 'sine', base * 1.3], [base * 1.2, 0.08, 'sine', base * 0.9], [base * 1.05, 0.05, 'sine', base * 1.4]], 0.025); }
    else if (id === 'crickets') { this.timer = rnd(0.4, 1.2); Sound.tone([[4200, 0.03, 'square'], [4200, 0.03, 'square'], [4200, 0.03, 'square']], 0.008); }
    else if (id === 'drips') { this.timer = rnd(2, 6); const f = pick([900, 1200, 1500]); Sound.tone([[f, 0.05, 'sine', f * 0.5]], 0.03); }
    else if (id === 'wind') { this.timer = rnd(4, 9); }
    else this.timer = 1;
  },
};

// ---------------- controller rumble ----------------
function rumble(ms, strong = 0.6, weak = 0.3) {
  try {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of pads) {
      if (!gp || !gp.connected) continue;
      const act = gp.vibrationActuator || (gp.hapticActuators && gp.hapticActuators[0]);
      if (act && act.playEffect) act.playEffect('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak });
      else if (act && act.pulse) act.pulse(strong, ms);
    }
  } catch (e) {}
}

// ---------------- deeds ----------------
function deed(k, n = 1) { if (!G.save || G.mode === 'arena') return; const d = G.save.deeds || (G.save.deeds = {}); d[k] = (d[k] || 0) + n; }
function drawDeeds() {
  const d = (G.save && G.save.deeds) || {};
  const mins = Math.floor((d.seconds || 0) / 60);
  text(`Chops ${d.kills || 0}   Best combo x${d.combo || 0}   Naps ${d.deaths || 0}   ${mins} min`, 20, 220, '#8a8ab0', 'left', false);
}
