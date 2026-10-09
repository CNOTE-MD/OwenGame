// Screen, input, sound and drawing helpers.
const T = 16, SW = 16, SH = 14, VW = 256, VH = 224;
const cv = document.getElementById('g');
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const FONT = '8px "Press Start 2P", ui-monospace, Menlo, Consolas, monospace';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// ---------- input ----------
const ACTIONS = {
  left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
  a: ['KeyZ', 'Space', 'KeyJ'], b: ['KeyX', 'KeyK'], c: ['KeyC', 'KeyL'], dash: ['ShiftLeft', 'ShiftRight', 'KeyF'],
  menu: ['Enter', 'Escape', 'KeyP'], mute: ['KeyM'], music: ['KeyN'], horn: ['KeyV'], spell: ['KeyQ', 'Tab'],
};
const keys = {}, virt = {}, edge = {};
const held = a => !!virt[a] || ACTIONS[a].some(c => keys[c]);
const just = a => !!edge[a];
// on-screen thumbstick: analog direction, plus direction "presses" so it also drives menus
const stick = { active: false, x: 0, y: 0 };
(function setupStick() {
  const base = document.getElementById('stick'), knob = document.getElementById('knob');
  if (!base) return;
  let id = null;
  const dirs = { left: false, right: false, up: false, down: false };
  const move = e => {
    const r = base.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, max = r.width * 0.38;
    let dx = e.clientX - cx, dy = e.clientY - cy;
    const m = Math.hypot(dx, dy); if (m > max) { dx *= max / m; dy *= max / m; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    const nx = dx / max, ny = dy / max, mag = Math.hypot(nx, ny);
    stick.active = mag > 0.22; stick.x = stick.active ? nx / mag : 0; stick.y = stick.active ? ny / mag : 0;
    const want = { left: nx < -0.5, right: nx > 0.5, up: ny < -0.5, down: ny > 0.5 };
    for (const k in want) { if (want[k] && !dirs[k]) edge[k] = true; dirs[k] = want[k]; virt[k] = want[k]; }
  };
  const end = e => {
    if (e.pointerId !== id) return;
    id = null; base.classList.remove('on'); knob.style.transform = '';
    stick.active = false; stick.x = stick.y = 0;
    for (const k in dirs) { dirs[k] = false; virt[k] = false; }
  };
  base.addEventListener('pointerdown', e => { e.preventDefault(); id = e.pointerId; base.setPointerCapture(id); base.classList.add('on'); Sound.unlock(); move(e); });
  base.addEventListener('pointermove', e => { if (e.pointerId === id) { e.preventDefault(); move(e); } });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => base.addEventListener(t, end));
})();
// ---------- gamepad (Xbox / PlayStation / Backbone / Switch Pro, over Bluetooth on iPad) ----------
const PAD = { on: false, x: 0, y: 0, active: false, prev: {}, idx: null };
const PAD_MAP = { 0: 'a', 1: 'b', 2: 'c', 3: 'horn', 4: 'spell', 5: 'dash', 6: 'dash', 7: 'dash', 8: 'mute', 9: 'menu', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };
function pollGamepad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  let gp = null;
  for (const p of pads) if (p && p.connected) { gp = p; break; }
  if (!gp) { if (PAD.on) { PAD.on = false; PAD.active = false; for (const k in PAD.prev) if (PAD.prev[k]) virt[k] = false; PAD.prev = {}; setPadNote(false); } return; }
  if (!PAD.on) { PAD.on = true; setPadNote(true); Sound.unlock(); }
  // left stick with a dead zone; the d-pad also moves
  let x = gp.axes[0] || 0, y = gp.axes[1] || 0;
  const m = Math.hypot(x, y);
  if (m < 0.25) { x = 0; y = 0; }
  if (gp.buttons[14] && gp.buttons[14].pressed) x = -1; if (gp.buttons[15] && gp.buttons[15].pressed) x = 1;
  if (gp.buttons[12] && gp.buttons[12].pressed) y = -1; if (gp.buttons[13] && gp.buttons[13].pressed) y = 1;
  const mm = Math.hypot(x, y);
  PAD.active = mm > 0; PAD.x = PAD.active ? x / mm : 0; PAD.y = PAD.active ? y / mm : 0;
  // menu stepping from the stick
  const dirs = { left: x < -0.5, right: x > 0.5, up: y < -0.5, down: y > 0.5 };
  for (const k in dirs) { if (dirs[k] && !PAD.prev[k]) edge[k] = true; PAD.prev[k] = dirs[k]; virt[k] = dirs[k] || (virt[k] && stick.active); }
  for (const i in PAD_MAP) {
    const a = PAD_MAP[i]; if (a === 'up' || a === 'down' || a === 'left' || a === 'right') continue;
    const down = !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5));
    const key = 'b' + i;
    if (down && !PAD.prev[key]) { edge[a] = true; if (a === 'a') edge.tap = edge.tap; }
    PAD.prev[key] = down;
    if (down) PAD.held = PAD.held || {}; 
  }
  // held state for actions (spin charge uses held('a'))
  for (const a of ['a', 'b', 'c', 'horn', 'dash', 'menu']) {
    const anyDown = Object.keys(PAD_MAP).some(i => PAD_MAP[i] === a && gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5));
    virt[a] = anyDown || (virt[a] && !PAD.prev['v' + a]);
    PAD.prev['v' + a] = anyDown;
  }
}
function setPadNote(on) { const n = document.getElementById('padnote'); if (n) n.classList.toggle('on', on); document.body.classList.toggle('nopad', on); }
window.addEventListener('gamepadconnected', () => setPadNote(true));

// ---------- full screen / theater ----------
function enterTheater() {
  document.body.classList.add('theater');
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (req) { try { const r = req.call(el); if (r && r.catch) r.catch(() => {}); } catch (e) { /* not allowed here; theater layout still applies */ } }
  cv.focus();
}
function exitTheater() {
  document.body.classList.remove('theater');
  const ex = document.exitFullscreen || document.webkitExitFullscreen;
  if (ex && (document.fullscreenElement || document.webkitFullscreenElement)) { try { const r = ex.call(document); if (r && r.catch) r.catch(() => {}); } catch (e) {} }
}
(function setupTheater() {
  const b = document.getElementById('fsbtn'), x = document.getElementById('exitfs');
  if (b) b.addEventListener('click', () => { Sound.unlock(); enterTheater(); });
  if (x) x.addEventListener('click', exitTheater);
  const onChange = () => { if (!(document.fullscreenElement || document.webkitFullscreenElement) && document.body.classList.contains('theater') && theaterWasFull) exitTheater(); theaterWasFull = !!(document.fullscreenElement || document.webkitFullscreenElement); };
  let theaterWasFull = false;
  document.addEventListener('fullscreenchange', onChange); document.addEventListener('webkitfullscreenchange', onChange);
  window.addEventListener('keydown', e => { if (e.code === 'Escape' && document.body.classList.contains('theater') && !(document.fullscreenElement || document.webkitFullscreenElement)) exitTheater(); });
})();

function inputVec() {
  if (PAD.active) return { x: PAD.x, y: PAD.y };
  if (stick.active) return { x: stick.x, y: stick.y };
  let x = (held('right') ? 1 : 0) - (held('left') ? 1 : 0), y = (held('down') ? 1 : 0) - (held('up') ? 1 : 0);
  const m = Math.hypot(x, y);
  return m ? { x: x / m, y: y / m } : { x: 0, y: 0 };
}
window.addEventListener('keydown', e => {
  if (e.code.startsWith('Arrow') || e.code === 'Space' || e.code === 'Tab') e.preventDefault();
  if (e.repeat) return;
  keys[e.code] = true;
  for (const a in ACTIONS) if (ACTIONS[a].includes(e.code)) edge[a] = true;
  Sound.unlock();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; for (const k in virt) virt[k] = false; });
cv.addEventListener('pointerdown', () => { cv.focus(); Sound.unlock(); edge.tap = true; });
document.querySelectorAll('.btn[data-a]').forEach(b => {
  const a = b.dataset.a;
  const on = e => { e.preventDefault(); virt[a] = true; edge[a] = true; b.classList.add('on'); Sound.unlock(); };
  const off = e => { e.preventDefault(); virt[a] = false; b.classList.remove('on'); };
  b.addEventListener('pointerdown', on);
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => b.addEventListener(t, off));
});

// ---------- sound: tiny chiptune effects ----------
const Sound = {
  ac: null, muted: false,
  unlock() { try { if (!this.ac) this.ac = new (window.AudioContext || window.webkitAudioContext)(); if (this.ac.state === 'suspended') this.ac.resume(); } catch (e) { this.ac = null; } },
  tone(seq, vol = 0.08) {
    if (this.muted || !this.ac) return;
    let t = this.ac.currentTime;
    for (const [f, d, type = 'square', f2] of seq) {
      if (f > 0) {
        const o = this.ac.createOscillator(), g = this.ac.createGain();
        o.type = type; o.frequency.setValueAtTime(f, t);
        if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + d);
        o.connect(g).connect(this.ac.destination); o.start(t); o.stop(t + d + 0.02);
      }
      t += d;
    }
  },
  noise(d, vol = 0.12, lp = 1200) {
    if (this.muted || !this.ac) return;
    const n = Math.floor(this.ac.sampleRate * d), buf = this.ac.createBuffer(1, n, this.ac.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = this.ac.createBufferSource(), f = this.ac.createBiquadFilter(), g = this.ac.createGain();
    f.type = 'lowpass'; f.frequency.value = lp; g.gain.value = vol;
    s.buffer = buf; s.connect(f).connect(g).connect(this.ac.destination); s.start();
  },
  play(name) {
    switch (name) {
      case 'swing': this.tone([[700, 0.07, 'square', 200]], 0.04); break;
      case 'throw': this.tone([[300, 0.06, 'triangle', 600], [600, 0.06, 'triangle', 300]], 0.06); break;
      case 'hit': this.tone([[240, 0.06, 'square', 120]], 0.07); break;
      case 'mud': this.tone([[140, 0.08, 'triangle', 60]], 0.04); break;
      case 'clank': this.tone([[1400, 0.04, 'triangle'], [900, 0.06, 'triangle']], 0.07); break;
      case 'hurt': this.tone([[420, 0.18, 'sawtooth', 90]], 0.07); break;
      case 'kill': this.noise(0.15, 0.1, 2000); break;
      case 'coin': this.tone([[1320, 0.05], [1980, 0.12]], 0.05); break;
      case 'heart': this.tone([[880, 0.05], [1175, 0.08]], 0.05); break;
      case 'item': this.tone([[523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.45]], 0.07); break;
      case 'secret': this.tone([[784, 0.09], [740, 0.09], [622, 0.09], [440, 0.09], [415, 0.09], [659, 0.09], [831, 0.09], [1047, 0.3]], 0.06); break;
      case 'door': this.tone([[200, 0.12, 'square', 420]], 0.06); break;
      case 'fall': this.tone([[700, 0.5, 'triangle', 90]], 0.08); break;
      case 'switch': this.tone([[1200, 0.06, 'triangle'], [1600, 0.1, 'triangle']], 0.07); break;
      case 'blip': this.tone([[1100, 0.012, 'square']], 0.015); break;
      case 'menu': this.tone([[660, 0.05], [990, 0.05]], 0.04); break;
      case 'splash': this.noise(0.35, 0.12, 900); this.tone([[200, 0.3, 'sine', 800]], 0.06); break;
      case 'save': this.tone([[523, 0.1, 'triangle'], [784, 0.1, 'triangle'], [1047, 0.3, 'triangle']], 0.07); break;
      case 'thunder': this.noise(1.2, 0.35, 500); this.tone([[90, 0.9, 'sawtooth', 40]], 0.1); break;
      case 'charge': this.tone([[200, 0.4, 'sawtooth', 900]], 0.04); break;
      case 'boss': this.tone([[110, 0.2, 'sawtooth'], [104, 0.2, 'sawtooth'], [98, 0.5, 'sawtooth']], 0.08); break;
      case 'scratch': for (let i = 0; i < 4; i++) setTimeout(() => this.noise(0.05 + Math.random() * 0.05, 0.05, 2500 + Math.random() * 2000), i * (90 + Math.random() * 80)); break;
      case 'flicker': this.tone([[60, 0.05, 'square'], [0, 0.04], [60, 0.05, 'square'], [0, 0.08], [55, 0.1, 'square']], 0.05); break;
      case 'horn': this.tone([[98, 0.9, 'sawtooth', 92]], 0.12); this.tone([[147, 0.9, 'sawtooth', 139]], 0.07); break;
      case 'dash': this.noise(0.18, 0.12, 3000); this.tone([[300, 0.15, 'sawtooth', 900]], 0.04); break;
      case 'creep': this.tone([[70, 1.2, 'sine', 55]], 0.12); this.tone([[1760, 0.6, 'sine', 1700]], 0.012); break;
    }
  },
};

// ---------- drawing ----------
const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
function poly(pts, fill, stroke) {
  ctx.beginPath(); pts.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}
function text(s, x, y, color = '#fff', align = 'left', shadow = true) {
  ctx.font = FONT; ctx.textAlign = align;
  if (shadow) { ctx.fillStyle = '#000'; ctx.fillText(s, x + 1, y + 1); }
  ctx.fillStyle = color; ctx.fillText(s, x, y);
}
function wrap(s, maxW) {
  ctx.font = FONT;
  const out = []; let line = '';
  for (const w of s.split(' ')) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
  }
  if (line) out.push(line);
  return out;
}
const hash = (x, y) => Math.floor(Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453)) % 100;
const HEART = [' ## ## ', '#######', '#######', ' ##### ', '  ###  ', '   #   '];
function drawHeart(x, y, fill, color = '#f22633') {
  HEART.forEach((row, yy) => [...row].forEach((ch, xx) => {
    if (ch !== '#') return;
    const lit = fill >= 1 || (fill > 0 && xx < 4);
    R(x + xx, y + yy, 1, 1, lit ? color : '#3a1820');
  }));
}
