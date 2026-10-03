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
  a: ['KeyZ', 'Space', 'KeyJ'], b: ['KeyX', 'KeyK', 'ShiftLeft', 'ShiftRight'], c: ['KeyC', 'KeyL'],
  menu: ['Enter', 'Escape', 'KeyP'], mute: ['KeyM'],
};
const keys = {}, virt = {}, edge = {};
const held = a => !!virt[a] || ACTIONS[a].some(c => keys[c]);
const just = a => !!edge[a];
function inputVec() {
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
