// Engine and SNES-hardware techniques: a fixed 60 Hz simulation step, Mode 7, HDMA-style
// per-scanline effects, mosaic and iris transitions, an SPC700-style echo on the music,
// an optional CRT filter, and a developer overlay (` or F3).

// ---------------- fixed timestep ----------------
// The simulation always advances in 1/60 s steps, so a 120 Hz iPad and a 60 Hz laptop play
// the same game; rendering happens once per display frame. Input edges are consumed by the
// first step that sees them and kept for the next frame when no step ran.
const STEP = 1 / 60, MAX_STEPS = 6;
const PERF = { acc: 0, steps: 0, fps: 60, ms: 0, frames: 0 };
function runFrame(now) {
  const dt = clamp((now - last) / 1000, 0, 0.1); last = now;   // a clock that jumps backward never stalls the game
  PERF.acc += dt; PERF.fps += ((dt > 0 ? 1 / dt : 60) - PERF.fps) * 0.05;
  const t0 = performance.now();
  let steps = 0;
  pollGamepad();
  while (PERF.acc >= STEP && steps < MAX_STEPS) {
    update(STEP); PERF.acc -= STEP; steps++;
    if (!(G.hitstop > 0)) for (const k in edge) edge[k] = false;
  }
  if (steps === MAX_STEPS) PERF.acc = 0;   // a long stall (tab hidden) never fast-forwards the game
  PERF.steps = steps;
  render(); postFx();
  if ((G.fitT = (G.fitT || 0) - dt) <= 0) { G.fitT = 0.5; fitScreen(); }
  present(); crtPass();
  const mid = musicFor(); markHeard(mid); Music.want(mid); Music.tick(); Echo.tick(mid); Ambience.tick(dt);
  PERF.ms += ((performance.now() - t0) - PERF.ms) * 0.1; PERF.frames++;
}

// ---------------- Mode 7 ----------------
// A perspective-mapped ground plane, scanline by scanline, the way the SNES did F-Zero and the
// Final Fantasy VI airship. The texture is the real overworld, 8 texels per tile.
const M7 = { tex: null, px: null, w: 0, h: 0, out: null, outC: null, horizon: 70 };
function m7TileColor(c, x, y) {
  const n = hash(x, y) % 4;
  switch (c) {
    case 'T': return n < 2 ? '#1f6a2e' : '#25793a';
    case '.': case 'f': case ',': return n ? '#4a9a3a' : '#54a844';
    case 's': return '#d8c08a';
    case '~': case 'w': return n ? '#2f68c8' : '#3a78d8';
    case 'U': return '#a0703c';
    case 'n': case 'i': return n ? '#e8eef6' : '#dbe4f0';
    case 'M': case '#': return n ? '#7a7a8c' : '#8a8a9c';
    case 'R': return '#b8402e';
    case 'H': case 'D': return '#8a5a2a';
    case 'P': case 'q': return '#e9edf2';
    case '%': return n ? '#5a3e22' : '#4e3620';
    case 'l': return '#ff6a1f';
    case 'E': case 'X': return '#1a1228';
    case 'x': return '#8a6a3a';
    case 'b': return '#3a8a3a';
    case 'o': return '#8a5a28';
    default: return '#4a9a3a';
  }
}
function buildMode7() {
  const rows = MAPS.overworld.rows, S = 8, w = rows[0].length * S, h = rows.length * S;
  const c = mkCanvas(w, h), g = c.getContext('2d');
  for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[0].length; x++) {
    const ch = rows[y][x];
    g.fillStyle = m7TileColor(ch, x, y); g.fillRect(x * S, y * S, S, S);
    if (ch === 'T') { g.fillStyle = '#0f4a1e'; g.fillRect(x * S + 1, y * S + 5, 6, 3); g.fillStyle = '#3a9a4a'; g.fillRect(x * S + 2, y * S + 1, 3, 2); }
    if (ch === 'R') { g.fillStyle = '#e05a40'; g.fillRect(x * S, y * S, S, 2); }
    if (ch === '~' && (x + y) % 3 === 0) { g.fillStyle = '#9fd0ff'; g.fillRect(x * S + 2, y * S + 3, 3, 1); }
    if (ch === '.' && hash(x, y) % 9 === 0) { g.fillStyle = '#ffd84a'; g.fillRect(x * S + 3, y * S + 3, 1, 1); }
  }
  M7.tex = c; M7.w = w; M7.h = h;
  M7.px = new Uint32Array(g.getImageData(0, 0, w, h).data.buffer);
  M7.outC = mkCanvas(VW, VH - M7.horizon);
  M7.out = M7.outC.getContext('2d').createImageData(VW, VH - M7.horizon);
}
// camera at (cx, cy) in texels, facing angle a, eye height hgt
function drawMode7(cx, cy, a, hgt, night) {
  if (!M7.tex) buildMode7();
  const H = M7.horizon, rowsN = VH - H, out = new Uint32Array(M7.out.data.buffer);
  const fx = Math.cos(a), fy = Math.sin(a), rx = -fy, ry = fx;
  const sea = night ? 0xff3a1a10 : 0xffc87830;   // ABGR: deep water beyond the map
  for (let y = 0; y < rowsN; y++) {
    const z = hgt * 150 / (y + 1), half = z * 0.9;
    const bx = cx + fx * z, by = cy + fy * z;
    for (let x = 0; x < VW; x++) {
      const s = ((x - 128) / 128) * half;
      const u = (bx + rx * s) | 0, v = (by + ry * s) | 0;
      out[y * VW + x] = (u >= 0 && v >= 0 && u < M7.w && v < M7.h) ? M7.px[v * M7.w + u] : sea;
    }
  }
  M7.outC.getContext('2d').putImageData(M7.out, 0, 0);
  // sky, banded like an HDMA gradient, with a mountain range that turns with the camera
  const SKY = night ? ['#070818', '#0c1030', '#141a48', '#1e2a5a'] : ['#3a78c8', '#5a98e0', '#7fb6e8', '#a8d0f0'];
  SKY.forEach((col, i) => R(0, i * (H / 4), VW, H / 4 + 1, col));
  const off = Math.round(-a * 160);
  ctx.fillStyle = night ? '#1c1f4a' : '#6a7aa0';
  ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= VW; x += 8) ctx.lineTo(x, H - 6 - Math.abs(Math.sin((x - off) * 0.045)) * 14 - (hash((x - off) >> 3, 7) % 5));
  ctx.lineTo(VW, H); ctx.fill();
  if (night) for (let i = 0; i < 30; i++) R((i * 53 + off) & 255, (i * 29) % (H - 20), 1, 1, '#e8e4ff');
  ctx.drawImage(M7.outC, 0, H);
  // distance haze toward the horizon
  for (let i = 0; i < 6; i++) { ctx.globalAlpha = 0.5 - i * 0.08; R(0, H + i * 3, VW, 3, night ? '#1e2a5a' : '#a8d0f0'); }
  ctx.globalAlpha = 1;
}
// the taxi ride, flown in Mode 7 from the airstrip to the forest (or back)
function drawRideMode7(page) {
  const night = page.art === 'taxi_night', toForest = !night;
  const A = { x: 19 * 8 + 4, y: 38 * 8 + 4 }, B = { x: 23 * 8 + 4, y: 13 * 8 + 4 };
  const from = toForest ? A : B, to = toForest ? B : A;
  const k = clamp((G.t - (G.rideT0 || G.t)) / 14, 0, 1), e = k * k * (3 - 2 * k);
  const sway = Math.sin(G.t * 0.7) * 0.18;
  const ang = Math.atan2(to.y - from.y, to.x - from.x) + sway;
  const cx = from.x + (to.x - from.x) * e - Math.cos(ang) * 22, cy = from.y + (to.y - from.y) * e - Math.sin(ang) * 22;
  drawMode7(cx, cy, ang, 13, night);
  const bounce = Math.round(Math.sin(G.t * 14));
  shadowAt(128, 196, 3);
  ctx.save(); ctx.translate(128, 196 + bounce); ctx.scale(2, 2); ctx.drawImage(SPR.taxi, -SPR.taxi.width / 2, -SPR.taxi.height); ctx.restore();
  for (let i = 0; i < 4; i++) { ctx.globalAlpha = 0.5 - i * 0.1; R(114 + (i % 2) * 24, 198 + i * 3, 4, 2, '#d8c08a'); }
  ctx.globalAlpha = 1;
  text(night ? 'FJORDVIK → AIRSTRIP' : 'FJORDVIK T-BANE → THE FOREST', VW / 2, 218, '#ffffff', 'center', 'outline');
}

// ---------------- HDMA-style scanline effects ----------------
let SCAN = null;
function scanlineShift(amp, freq, speed, y0 = 0) {
  if (!SCAN) SCAN = mkCanvas(VW, VH);
  const g = SCAN.getContext('2d'); g.clearRect(0, 0, VW, VH); g.drawImage(buf, 0, 0);
  for (let y = y0; y < VH; y++) {
    const off = Math.round(Math.sin(y * freq + G.t * speed) * amp);
    if (off) ctx.drawImage(SCAN, 0, y, VW, 1, off, y, VW, 1);
  }
}
function hdmaKind() {
  if (G.state === 'title' || !G.map || G.mode === 'arena') return null;
  if (G.map.redeye) return 'dream';
  if (G.mapId === 'overworld' && G.scr.x === 3 && G.scr.y === 1) return 'heat';   // the volcano road
  return null;
}

// ---------------- transitions and post effects ----------------
let MOS = null;
function mosaic(b) {
  if (b <= 1) return;
  if (!MOS) MOS = mkCanvas(VW, VH);
  const w = Math.ceil(VW / b), h = Math.ceil(VH / b), g = MOS.getContext('2d');
  g.imageSmoothingEnabled = false; g.clearRect(0, 0, VW, VH); g.drawImage(buf, 0, 0, w, h);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(MOS, 0, 0, w, h, 0, 0, w * b, h * b); ctx.restore();
}
function iris(r, cx, cy) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.rect(0, 0, VW, VH); ctx.arc(cx, cy, Math.max(0, r), 0, Math.PI * 2, true); ctx.fill('evenodd'); ctx.restore();
}
function postFx() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const h = G.state === 'play' || G.state === 'talk' ? hdmaKind() : null;
  G.hdma = h;
  if (h === 'heat') scanlineShift(1, 0.18, 7, 30);
  if (h === 'dream') scanlineShift(RE && RE.blackout > 0 ? 3 : 1.5, 0.07, 3);
  if (G.state === 'warp' && G.warp) {
    const k = clamp(1 - Math.abs(G.warp.t - 0.35) / 0.35, 0, 1);
    if (G.warp.kind === 'iris') { const p = G.player; iris((1 - k) * 190, p.x - G.cam.x, p.y - G.cam.y - 6); }
    else mosaic(1 + Math.round(k * 14));
  }
  if (G.state === 'dying' && G.dieT > 0.4) mosaic(1 + Math.round(clamp((G.dieT - 0.4) / 0.6, 0, 1) * 8));
  if (G.debug) drawDebug();
}

// ---------------- SPC700-style echo ----------------
// The SNES sound chip had an echo buffer with feedback and a filter. Music runs through one here:
// dry everywhere, wet in stone rooms, very wet in the nightmare.
const Echo = {
  input: null, wet: null, level: 0,
  ensure() {
    const ac = Sound.ac; if (!ac || this.input) return !!this.input;
    this.input = ac.createGain(); const delay = ac.createDelay(1), fb = ac.createGain(), lp = ac.createBiquadFilter();
    this.wet = ac.createGain(); this.wet.gain.value = 0;
    delay.delayTime.value = 0.19; fb.gain.value = 0.38; lp.type = 'lowpass'; lp.frequency.value = 2600;
    this.input.connect(delay); delay.connect(lp); lp.connect(fb); fb.connect(delay); lp.connect(this.wet); this.wet.connect(ac.destination);
    return true;
  },
  attach(bus) { if (this.ensure()) bus.connect(this.input); },
  wetFor(mid) {
    if (!G.map || G.state === 'title') return mid === 'title' ? 0.22 : 0;
    if (G.map.redeye || mid === 'creepy') return 0.7;
    if (G.map.dungeon || G.map.dark || G.mapId === 'barrow') return 0.5;
    if (G.mapId === 'subway') return 0.35;
    if (G.map.interior) return 0.14;
    if (G.mode === 'arena') return 0.12;
    return 0.06;
  },
  tick(mid) {
    if (!this.ensure()) return;
    const w = this.wetFor(mid);
    if (Math.abs(w - this.level) > 0.001) { this.level = w; this.wet.gain.setTargetAtTime(w, Sound.ac.currentTime, 0.4); }
  },
};

// ---------------- CRT filter (Y) and developer overlay (` or F3) ----------------
try { G.crt = localStorage.getItem('jontuka-crt') === '1'; } catch (e) { G.crt = false; }
function techKeys() {
  if (just('crt')) { G.crt = !G.crt; try { localStorage.setItem('jontuka-crt', G.crt ? '1' : '0'); } catch (e) {} Sound.play('menu'); }
  if (just('debug')) G.debug = !G.debug;
}
function crtPass() {
  if (!G.crt || PRESCALE < 2) return;
  const k = PRESCALE, w = cv.width, h = cv.height;
  dctx.fillStyle = 'rgba(0,0,0,0.28)';
  for (let y = 0; y < VH; y++) dctx.fillRect(0, y * k + k - 1, w, Math.max(1, k >> 2));
  // a soft vignette, like a tube's curved edges
  const gr = dctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.78);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.35)');
  dctx.fillStyle = gr; dctx.fillRect(0, 0, w, h);
}
function drawDebug() {
  const lines = [
    `${PERF.fps.toFixed(0)} fps  ${PERF.ms.toFixed(1)} ms  ${PERF.steps} step${PERF.steps === 1 ? '' : 's'}`,
    `state ${G.state}  mode ${G.mode || 'story'}`,
    `map ${G.mapId || '-'} ${G.scr ? G.scr.x + ',' + G.scr.y : ''}  ents ${G.ents ? G.ents.length : 0}  fx ${G.fx ? G.fx.length : 0}`,
    `scale x${PRESCALE}  hdma ${G.hdma || 'off'}  crt ${G.crt ? 'on' : 'off'}`,
    `echo ${Echo.level.toFixed(2)}  music ${Music.name || '-'}`,
  ];
  R(2, VH - 6 - lines.length * 10, 200, lines.length * 10 + 4, 'rgba(0,0,0,0.7)');
  lines.forEach((l, i) => text(l, 6, VH - 6 - (lines.length - 1 - i) * 10 - 1, '#9be08a', 'left', false));
}
