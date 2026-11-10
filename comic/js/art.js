// Jöntuka comic: hand-inked SVG art kit. Every function returns an SVG string.
// Coordinates: characters are drawn around their feet (x, y) unless noted.
'use strict';

const INK = '#120a1a';
let UID = 0;
let DEFS = [];                        // per-panel <defs>, flushed by panelSVG()
const uid = p => p + (++UID);
let LETTER_MIN = 15;              // smallest lettering for the current panel, so phones stay legible
const f1 = n => Math.round(n * 10) / 10;

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---------- primitives ----------
const G = (tr, inner, extra = '') => `<g transform="${tr}" ${extra}>${inner}</g>`;
const P = (d, fill = 'none', sw = 3, extra = '') => `<path d="${d}" fill="${fill}" stroke="${sw ? INK : 'none'}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
const PF = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const C = (cx, cy, r, fill, sw = 3, extra = '') => `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}" fill="${fill}" stroke="${sw ? INK : 'none'}" stroke-width="${sw}" ${extra}/>`;
const E = (cx, cy, rx, ry, fill, sw = 3, extra = '') => `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${fill}" stroke="${sw ? INK : 'none'}" stroke-width="${sw}" ${extra}/>`;
const Rect = (x, y, w, h, fill, sw = 0, extra = '') => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="${fill}" stroke="${sw ? INK : 'none'}" stroke-width="${sw}" ${extra}/>`;
const L = (x1, y1, x2, y2, sw = 2, col = INK, extra = '') => `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" ${extra}/>`;
// fill + shade + hatch, then the contour on top: the inker's order
function shape(d, fill, shadeD, sw = 3, hatch = 'hatch') {
  return PF(d, fill) + (shadeD ? PF(shadeD.d, shadeD.fill) + (hatch ? PF(shadeD.d, `url(#${hatch})`, 'opacity=".55"') : '') : '') + P(d, 'none', sw);
}

function lin(stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) {
  const id = uid('lg');
  DEFS.push(`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map((s, i) => `<stop offset="${Array.isArray(s) ? s[0] : i / (stops.length - 1)}" stop-color="${Array.isArray(s) ? s[1] : s}"${Array.isArray(s) && s[2] !== undefined ? ` stop-opacity="${s[2]}"` : ''}/>`).join('')}</linearGradient>`);
  return `url(#${id})`;
}
function rad(stops, cx = 0.5, cy = 0.5, r = 0.5) {
  const id = uid('rg');
  DEFS.push(`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map((s, i) => `<stop offset="${Array.isArray(s) ? s[0] : i / (stops.length - 1)}" stop-color="${Array.isArray(s) ? s[1] : s}"${Array.isArray(s) && s[2] !== undefined ? ` stop-opacity="${s[2]}"` : ''}/>`).join('')}</radialGradient>`);
  return `url(#${id})`;
}
function clip(d) { const id = uid('cp'); DEFS.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`); return `clip-path="url(#${id})"`; }

// global defs: halftones, hatching, steel, glows (lives once in the document)
function globalDefs() {
  const dots = (id, col, s, r, rot = 45) => `<pattern id="${id}" width="${s}" height="${s}" patternUnits="userSpaceOnUse" patternTransform="rotate(${rot})"><circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="${col}"/></pattern>`;
  const lines = (id, s, w, rot, col = INK) => `<pattern id="${id}" width="${s}" height="${s}" patternUnits="userSpaceOnUse" patternTransform="rotate(${rot})"><rect width="${w}" height="${s}" fill="${col}"/></pattern>`;
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  ${dots('ht', INK, 7, 1.5)}${dots('ht2', INK, 7, 2.4)}${dots('htw', '#ffffff', 7, 1.6)}${dots('htm', '#ff3fa4', 8, 2)}${dots('htc', '#3fe0ff', 8, 2)}
  ${dots('hty', '#ffe14a', 8, 2.2)}${dots('htr', '#ff2a3a', 8, 2)}${dots('htp', '#7a3cff', 8, 2.2)}${dots('hto', '#ff8a1a', 8, 2.2)}${dots('htk', INK, 10, 3.2)}
  ${lines('hatch', 6, 1.6, 35)}${lines('hatchF', 4.5, 1, 35)}${lines('hatchV', 6, 1.6, 0)}${lines('hatchW', 7, 1.6, -35, '#ffffff')}
  <pattern id="xhatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><rect width="1.4" height="6" fill="${INK}"/><rect width="6" height="1.4" fill="${INK}"/></pattern>
  <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#cfe0f4"/><stop offset=".6" stop-color="#8496b8"/><stop offset=".8" stop-color="#d8e6fa"/><stop offset="1" stop-color="#6a7a9c"/></linearGradient>
  <linearGradient id="helm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f2f5fb"/><stop offset=".45" stop-color="#c8ccd8"/><stop offset="1" stop-color="#6e748a"/></linearGradient>
  <linearGradient id="wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c07a40"/><stop offset=".5" stop-color="#9a6030"/><stop offset="1" stop-color="#5a3418"/></linearGradient>
  <filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>
  <filter id="sil"><feColorMatrix type="matrix" values="0 0 0 0 .04  0 0 0 0 .03  0 0 0 0 .1  0 0 0 1 0"/></filter>
  <filter id="softS" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
  </defs></svg>`;
}

// ---------- comic devices ----------
function speedLines(cx, cy, r0, r1, n, col = INK, w = 7, seed = 1) {
  const R = rng(seed); let s = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + R() * 0.12, ww = w * (0.4 + R()) / 100, ri = r0 * (0.8 + R() * 0.5);
    s += `${f1(cx + Math.cos(a) * ri)},${f1(cy + Math.sin(a) * ri)} ${f1(cx + Math.cos(a - ww) * r1)},${f1(cy + Math.sin(a - ww) * r1)} ${f1(cx + Math.cos(a + ww) * r1)},${f1(cy + Math.sin(a + ww) * r1)} `;
    s = s.trim() + '|';
  }
  return s.split('|').filter(Boolean).map(p => `<polygon points="${p}" fill="${col}"/>`).join('');
}
function motionLines(x, y, w, h, n, ang = 0, col = INK, seed = 3) {
  const R = rng(seed); let s = '';
  for (let i = 0; i < n; i++) { const yy = y + R() * h, xx = x + R() * w * 0.4, len = w * (0.3 + R() * 0.6); s += L(xx, yy, xx + len, yy, 1 + R() * 3, col); }
  return G(`rotate(${ang} ${x + w / 2} ${y + h / 2})`, s);
}
function burstPath(cx, cy, rx, ry, n = 14, jag = 0.35, seed = 7) {
  const R = rng(seed); let d = '';
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2, k = i % 2 ? 1 - jag * (0.6 + R() * 0.6) : 1 + R() * 0.12;
    d += (i ? 'L' : 'M') + f1(cx + Math.cos(a) * rx * k) + ',' + f1(cy + Math.sin(a) * ry * k);
  }
  return d + 'Z';
}
function burst(cx, cy, rx, ry, fill = '#ffe14a', n = 14, jag = 0.35, seed = 7, sw = 4) { return P(burstPath(cx, cy, rx, ry, n, jag, seed), fill, sw); }
function halftoneRect(x, y, w, h, pat = 'ht', op = 0.35) { return Rect(x, y, w, h, `url(#${pat})`, 0, `opacity="${op}"`); }
// airbrushed glow blob
function glowBlob(cx, cy, r, col, op = 0.8) { return C(cx, cy, r, rad([[0, col, op], [0.5, col, op * 0.5], [1, col, 0]]), 0); }

// ---------- lettering ----------
const MEAS = document.createElement('canvas').getContext('2d');
function measure(t, size, family, weight = 700) { MEAS.font = `${weight} ${size}px ${family}`; return MEAS.measureText(t).width; }
function wrap(text, size, family, maxW, weight = 700) {
  const out = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const w of para.split(' ')) {
      const t = line ? line + ' ' + w : w;
      if (measure(t, size, family, weight) > maxW && line) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  return out;
}
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const BALLOON_FONT = '"Comic Neue", "Comic Sans MS", "Chalkboard SE", sans-serif';
const HAND_FONT = '"Kalam", "Bradley Hand", "Comic Neue", cursive';
const BANG_FONT = '"Bangers", "Impact", "Arial Black", sans-serif';
function textBlock(lines, cx, cy, size, lh, family, fill = INK, weight = 700, anchor = 'middle', extra = '') {
  const top = cy - ((lines.length - 1) * lh) / 2;
  return `<text text-anchor="${anchor}" font-family='${family}' font-weight="${weight}" font-size="${size}" fill="${fill}" ${extra}>${lines.map((l, i) => `<tspan x="${f1(cx)}" y="${f1(top + i * lh + size * 0.35)}">${esc(l)}</tspan>`).join('')}</text>`;
}
// Balloon: {x, y (center), w (max text width), t (text), tail: [x, y], kind, size}
// kinds: speech, yell (jagged burst), thought (cloud), mind (Jon's in-head voice, glowing), radio (loudspeaker), whisper (dashed)
function balloon(o) {
  const size = Math.max(o.size || 24, LETTER_MIN), lh = size * 1.12, upper = o.kind !== 'whisper' ? o.t.toUpperCase() : o.t;
  const lines = wrap(upper, size, BALLOON_FONT, o.w || 220);
  const tw = Math.max(...lines.map(l => measure(l, size, BALLOON_FONT))), th = lines.length * lh;
  const cx = o.x, cy = o.y, kind = o.kind || 'speech';
  let rx = tw / 2 * 1.2 + size * 0.75, ry = th / 2 * 1.25 + size * 0.6;
  if (kind === 'yell') { rx *= 1.28; ry *= 1.45; }
  const fill = o.fill || (kind === 'mind' ? '#e8fbff' : kind === 'radio' ? '#fff8d0' : '#ffffff');
  let bodyD;
  if (kind === 'yell') bodyD = burstPath(cx, cy, rx, ry, o.n || 16, 0.22, o.seed || 11);
  else if (kind === 'radio') { const R = rng(o.seed || 5); bodyD = ''; const n = 22; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, k = i % 2 ? 0.92 : 1.05 + R() * 0.05; bodyD += (i ? 'L' : 'M') + f1(cx + Math.cos(a) * rx * k) + ',' + f1(cy + Math.sin(a) * ry * k); } bodyD += 'Z'; }
  else bodyD = `M${f1(cx - rx)},${f1(cy)} A${f1(rx)},${f1(ry)} 0 1 0 ${f1(cx + rx)},${f1(cy)} A${f1(rx)},${f1(ry)} 0 1 0 ${f1(cx - rx)},${f1(cy)}Z`;
  let tailD = '', extra = '';
  if (o.tail && (kind === 'thought' || kind === 'mind')) {
    const [tx, ty] = o.tail; const dx = tx - cx, dy = ty - cy, dist = Math.hypot(dx, dy), ux = dx / dist, uy = dy / dist;
    const startK = Math.min(1, (rx * ry) / Math.sqrt((ry * dx) ** 2 + (rx * dy) ** 2));
    const sx = cx + dx * startK, sy = cy + dy * startK, rem = Math.hypot(tx - sx, ty - sy);
    [0.3, 0.62, 0.9].forEach((k, i) => { extra += C(sx + ux * rem * k, sy + uy * rem * k, size * (0.42 - i * 0.11), fill, 2.5); });
  } else if (o.tail) {
    const [tx, ty] = o.tail; const ang = Math.atan2(ty - cy, tx - cx), bw = Math.min(rx, ry) * 0.38;
    const bx1 = cx + Math.cos(ang + Math.PI / 2) * bw + Math.cos(ang) * rx * 0.5, by1 = cy + Math.sin(ang + Math.PI / 2) * bw + Math.sin(ang) * ry * 0.5;
    const bx2 = cx + Math.cos(ang - Math.PI / 2) * bw * 0.2 + Math.cos(ang) * rx * 0.5, by2 = cy + Math.sin(ang - Math.PI / 2) * bw * 0.2 + Math.sin(ang) * ry * 0.5;
    if (kind === 'yell' || kind === 'radio') tailD = `M${f1(bx1)},${f1(by1)} L${f1((bx1 + tx) / 2 + 10)},${f1((by1 + ty) / 2 - 8)} L${f1((bx1 + tx) / 2 - 4)},${f1((by1 + ty) / 2 + 4)} L${f1(tx)},${f1(ty)} L${f1((bx2 + tx) / 2 - 8)},${f1((by2 + ty) / 2 - 2)} L${f1(bx2)},${f1(by2)}Z`;
    else tailD = `M${f1(bx1)},${f1(by1)} Q${f1((bx1 + tx) / 2)},${f1((by1 + ty) / 2)} ${f1(tx)},${f1(ty)} Q${f1((bx2 + tx) / 2 + 4)},${f1((by2 + ty) / 2)} ${f1(bx2)},${f1(by2)}Z`;
  }
  if (kind === 'thought' || kind === 'mind') {
    // cloud: scalloped ring of circles
    const n = Math.max(9, Math.round((rx + ry) / 16)); let cl = '', clF = '';
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, r = Math.min(rx, ry) * 0.42; cl += C(cx + Math.cos(a) * rx * 0.86, cy + Math.sin(a) * ry * 0.86, r, fill, 3); clF += C(cx + Math.cos(a) * rx * 0.86, cy + Math.sin(a) * ry * 0.86, r - 1.6, fill, 0); }
    const glow = kind === 'mind' ? E(cx, cy, rx * 1.12, ry * 1.18, '#5fe8ff', 0, 'opacity=".55" filter="url(#glow)"') : '';
    return `<g class="bal">${glow}${extra}${cl}${E(cx, cy, rx * 0.9, ry * 0.9, fill, 0)}${clF}${textBlock(lines, cx, cy, size, lh, BALLOON_FONT, kind === 'mind' ? '#0b3a5a' : INK, 700, 'middle', kind === 'mind' ? 'font-style="italic"' : '')}</g>`;
  }
  const sw = kind === 'yell' ? 4 : 3, dash = kind === 'whisper' ? 'stroke-dasharray="6 6"' : '';
  return `<g class="bal">${P(bodyD, fill, sw, dash)}${tailD ? P(tailD, fill, sw) : ''}${PF(bodyD, fill)}${tailD ? PF(tailD, fill) : ''}${textBlock(lines, cx, cy, size, lh, BALLOON_FONT, o.color || INK, 700)}</g>`;
}
// Owen's narrator voice: a scrap of his lined notebook paper. x, y = top-left.
function caption(o) {
  const size = Math.max(o.size || 22, LETTER_MIN), lh = size * 1.32, padL = size * 1.5, padR = size * 0.6, padT = size * 0.45;
  const lines = wrap(o.t, size, HAND_FONT, o.w - padL - padR, 700);
  const h = lines.length * lh + padT * 2;
  let rules = '';
  for (let i = 0; i <= lines.length; i++) rules += L(o.x + 2, o.y + padT + i * lh + lh * 0.18, o.x + o.w - 2, o.y + padT + i * lh + lh * 0.18, 1.2, '#8fb2de');
  const rot = o.rot ?? -1;
  const ty = o.y + padT + lh * 0.5 - lh * 0.04;
  const txt = `<text font-family='${HAND_FONT}' font-weight="700" font-size="${size}" fill="#1d2a5a">${lines.map((l, i) => `<tspan x="${f1(o.x + padL)}" y="${f1(ty + i * lh + size * 0.08)}">${esc(l)}</tspan>`).join('')}</text>`;
  return `<g class="cap" transform="rotate(${rot} ${o.x} ${o.y})">${Rect(o.x + 5, o.y + 5, o.w, h, INK, 0, 'opacity=".55"')}${Rect(o.x, o.y, o.w, h, '#f4eedb', 2.5)}${rules}${L(o.x + padL * 0.62, o.y + 1, o.x + padL * 0.62, o.y + h - 1, 1.6, '#e0525a')}${txt}</g>`;
}
caption.height = (o) => { const size = Math.max(o.size || 22, LETTER_MIN), lh = size * 1.32; return wrap(o.t, size, HAND_FONT, o.w - size * 2.1, 700).length * lh + size * 0.9; };
// SFX: big outlined lettering with a drop extrude
function sfx(t, x, y, size, o = {}) {
  const fill = o.fill || '#ffe14a', rot = o.rot || 0, skew = o.skew || 0, ex = o.extrude ?? Math.max(3, size * 0.08);
  const base = `text-anchor="middle" font-family='${BANG_FONT}' font-size="${size}" letter-spacing="${o.ls ?? 2}"`;
  let s = '';
  for (let i = Math.round(ex); i > 0; i -= 1.5) s += `<text x="${x + i}" y="${y + i}" ${base} fill="${o.dark || INK}" stroke="${o.dark || INK}" stroke-width="${size * 0.14}" stroke-linejoin="round">${esc(t)}</text>`;
  s += `<text x="${x}" y="${y}" ${base} fill="${fill}" stroke="${INK}" stroke-width="${size * 0.14}" stroke-linejoin="round" paint-order="stroke">${esc(t)}</text>`;
  if (o.shine !== false) s += `<text x="${x}" y="${y}" ${base} fill="url(#htw)" opacity=".5">${esc(t)}</text>`;
  return G(`rotate(${rot} ${x} ${y}) skewX(${skew})`, s, 'class="sfx"');
}
function musicNote(x, y, s = 1, col = '#ffe14a', rot = 0) {
  return G(`translate(${x} ${y}) rotate(${rot}) scale(${s})`, P('M0,0 L0,-30 L16,-36 L16,-8', 'none', 4) + E(-5, 1, 7, 5.5, col, 3, 'transform="rotate(-20 -5 1)"') + E(11, -7, 7, 5.5, col, 3, 'transform="rotate(-20 11 -7)"') + P('M0,-30 L16,-36 L16,-29 L0,-23Z', INK, 2));
}

// ---------- characters ----------
const OC = { skin: '#f8c898', skinS: '#d89060', tunic: '#3c7ce0', tunicS: '#2850a0', tunicD: '#183470', belt: '#7a4418', gold: '#ffd84a', pants: '#6a4a2a', pantsS: '#47301a', boot: '#4a2c14', fur: '#f4ecd0', horn: '#f4ecd0', hornS: '#cbb88a', hair: '#a0581e', hairS: '#5e300c' };
const OZ = { skin: '#c4dfae', skinS: '#86ac74' };

function limb(len, w0, w1, fill, shade, sw = 3) {
  const d = `M${-w0},0 L${-w1},${len} A${w1},${w1} 0 0 0 ${w1},${len} L${w0},0 A${w0},${w0} 0 0 0 ${-w0},0Z`;
  const sd = `M${w0 * 0.15},0 L${w1 * 0.15},${len} L${w1},${len} L${w0},0Z`;
  const spot = `M${w0 * 0.62},0 L${w1 * 0.62},${len} L${w1},${len} L${w0},0Z`;
  return PF(d, fill) + PF(sd, shade) + PF(sd, 'url(#hatch)', 'opacity=".6"') + PF(spot, INK, 'opacity=".85"') + P(d, 'none', sw);
}
// facial features for Owen, head center (0,0), facing right
function owenFace(ex, skin, zombie, look = [1, 0]) {
  const [lx, ly] = look; let s = '';
  const eye = (x, y, big = 1) => E(x, y, 5 * big, 6.5 * big, '#fff', 2.4) + C(x + lx * 1.8, y + ly * 1.8 + 1, 2.6 * (big > 1.2 ? 0.7 : 1), INK, 0) + C(x + lx * 1.8 + 1, y + ly * 1.8, 0.9, '#fff', 0);
  const brows = (l, r) => P(l, 'none', 3.6) + P(r, 'none', 3.6);
  const lid = (x, y) => P(`M${x - 6},${y - 1} Q${x},${y - 4} ${x + 6},${y - 1}`, 'none', 2.6) + P(`M${x - 5.5},${y - 1} Q${x},${y - 7} ${x + 5.5},${y - 1}Z`, skin, 0);
  const L_ = -6, R_ = 14, Y = 2;
  switch (ex) {
    case 'sleep':
      s += P(`M${L_ - 6},${Y + 1} Q${L_},${Y + 6} ${L_ + 6},${Y + 1}`, 'none', 3) + P(`M${R_ - 6},${Y + 1} Q${R_},${Y + 6} ${R_ + 6},${Y + 1}`, 'none', 3);
      s += E(6, 18, 4, 5, '#5a1a20', 2.4); break;
    case 'happy':
      s += P(`M${L_ - 6},${Y + 3} Q${L_},${Y - 5} ${L_ + 6},${Y + 3}`, 'none', 3) + P(`M${R_ - 6},${Y + 3} Q${R_},${Y - 5} ${R_ + 6},${Y + 3}`, 'none', 3);
      s += P('M-4,14 Q6,26 16,14 Z', '#5a1a20', 2.6) + P('M-1,15 L13,15 L12,18 L0,18Z', '#fff', 0); break;
    default: {
      const big = ex === 'shock' || ex === 'scream' ? 1.25 : 1;
      s += eye(L_, Y, big) + eye(R_, Y, big);
      if (ex === 'tired' || ex === 'annoyed' || ex === 'pursed' || ex === 'smirk' && false) s += lid(L_, Y - 2) + lid(R_, Y - 2);
    }
  }
  const BR = {
    neutral: [`M${L_ - 6},-8 L${L_ + 5},-9`, `M${R_ - 5},-9 L${R_ + 6},-8`],
    grit: [`M${L_ - 7},-11 L${L_ + 6},-6`, `M${R_ - 6},-6 L${R_ + 7},-11`],
    yell: [`M${L_ - 7},-12 L${L_ + 6},-6`, `M${R_ - 6},-6 L${R_ + 7},-12`],
    shock: [`M${L_ - 6},-13 Q${L_},-17 ${L_ + 6},-13`, `M${R_ - 6},-13 Q${R_},-17 ${R_ + 6},-13`],
    scream: [`M${L_ - 6},-14 Q${L_},-18 ${L_ + 6},-14`, `M${R_ - 6},-14 Q${R_},-18 ${R_ + 6},-14`],
    worried: [`M${L_ - 6},-7 L${L_ + 6},-12`, `M${R_ - 6},-12 L${R_ + 6},-7`],
    tired: [`M${L_ - 6},-8 L${L_ + 6},-8`, `M${R_ - 6},-8 L${R_ + 6},-8`],
    annoyed: [`M${L_ - 6},-7 L${L_ + 6},-8`, `M${R_ - 6},-9 L${R_ + 6},-6`],
    pursed: [`M${L_ - 6},-9 L${L_ + 6},-6`, `M${R_ - 6},-6 L${R_ + 6},-9`],
    smirk: [`M${L_ - 6},-8 L${L_ + 6},-8`, `M${R_ - 6},-12 Q${R_},-15 ${R_ + 6},-11`],
    awk: [`M${L_ - 6},-9 L${L_ + 6},-12`, `M${R_ - 6},-12 L${R_ + 6},-9`],
    sick: [`M${L_ - 6},-7 L${L_ + 6},-11`, `M${R_ - 6},-11 L${R_ + 6},-7`],
    sleep: [`M${L_ - 6},-6 L${L_ + 6},-6`, `M${R_ - 6},-6 L${R_ + 6},-6`],
    happy: [`M${L_ - 6},-10 Q${L_},-13 ${L_ + 6},-10`, `M${R_ - 6},-10 Q${R_},-13 ${R_ + 6},-10`],
    think: [`M${L_ - 6},-8 L${L_ + 6},-8`, `M${R_ - 6},-13 Q${R_},-16 ${R_ + 6},-12`],
  }[ex] || [`M${L_ - 6},-8 L${L_ + 5},-9`, `M${R_ - 5},-9 L${R_ + 6},-8`];
  s += brows(BR[0], BR[1]);
  // nose
  s += P('M6,6 Q10,11 5,12', 'none', 2.2);
  const M = {
    neutral: P('M0,18 L11,17', 'none', 2.6),
    grit: P('M-3,15 L15,14 L14,22 L-2,22Z', '#fff', 2.6) + L(3, 15, 3, 22, 1.5) + L(9, 15, 9, 22, 1.5) + L(-2, 18.5, 14.5, 18.5, 1.5),
    yell: P('M-4,13 Q6,10 17,13 Q15,30 5,30 Q-3,28 -4,13Z', '#5a1a20', 2.6) + P('M-2,14 L15,14 L14,17 L-1,17Z', '#fff', 0) + E(6, 26, 6, 3, '#e0525a', 0),
    shock: E(6, 20, 5, 6.5, '#5a1a20', 2.6),
    scream: P('M-6,12 Q6,8 19,12 Q17,34 6,34 Q-5,32 -6,12Z', '#5a1a20', 2.6) + E(6, 29, 7, 3.5, '#e0525a', 0),
    worried: P('M-1,19 Q3,16 6,19 Q9,22 13,18', 'none', 2.6),
    tired: P('M1,19 L12,19', 'none', 2.6),
    annoyed: P('M0,19 L12,17', 'none', 2.6),
    pursed: P('M3,17 Q6,15 9,17 Q6,20 3,17Z', '#c8605a', 2.2) + P('M2,17 L-1,16', 'none', 1.6) + P('M10,17 L13,16', 'none', 1.6),
    smirk: P('M0,18 Q8,20 15,13', 'none', 2.8),
    awk: P('M-3,15 L16,15 Q15,22 6,22 Q-2,22 -3,15Z', '#fff', 2.4) + L(-2, 18.5, 15, 18.5, 1.4) + L(3, 15, 3, 22, 1.2) + L(9, 15, 9, 22, 1.2),
    sick: P('M-1,18 Q6,14 13,18', 'none', 2.6) + E(-12, 12, 6, 4, '#9ad070', 0, 'opacity=".8"') + E(22, 12, 6, 4, '#9ad070', 0, 'opacity=".8"'),
    sleep: '', happy: '',
    think: P('M1,19 Q7,17 12,19', 'none', 2.6),
  }[ex] ?? P('M0,18 L11,17', 'none', 2.6);
  s += M;
  if (zombie) s += P(`M${L_ - 6},${Y + 8} Q${L_},${Y + 12} ${L_ + 6},${Y + 8}`, 'none', 1.6, 'stroke="#6a3a8a"') + P(`M${R_ - 6},${Y + 8} Q${R_},${Y + 12} ${R_ + 6},${Y + 8}`, 'none', 1.6, 'stroke="#6a3a8a"') + P('M-20,-6 L-12,4', 'none', 1.6) + L(-18, -3, -15, -5, 1.3) + L(-16, 0, -13, -2, 1.3);
  return s;
}
// Owen's head (center 0,0), with the horned helmet
function owenHead(o = {}) {
  const z = o.zombie, skin = z ? OZ.skin : OC.skin, skinS = z ? OZ.skinS : OC.skinS;
  let s = '';
  // horns (behind)
  const horn = (m) => G(`scale(${m} 1)`, shape('M-22,-26 C-42,-28 -54,-44 -50,-68 C-44,-52 -34,-44 -18,-40Z', OC.horn, { d: 'M-24,-32 C-40,-34 -48,-46 -50,-68 C-44,-52 -34,-44 -18,-40Z', fill: OC.hornS }, 3) + P('M-36,-36 Q-40,-40 -38,-46', 'none', 1.6) + P('M-44,-44 Q-48,-50 -46,-56', 'none', 1.6));
  s += G('translate(2 0)', horn(-1)) + horn(1);
  // hair at back + ears
  s += P('M-26,-14 L-31,8 L-24,3 L-26,14 L-18,4Z', OC.hair, 2.6) + P('M30,-14 L34,6 L28,3 L29,12 L22,4Z', OC.hair, 2.6);
  s += C(-23, 6, 6, skin, 2.6) + C(28, 6, 6, skinS, 2.6);
  // face
  const fd = 'M-23,-12 C-26,8 -18,28 3,30 C24,28 30,8 27,-12Z';
  s += shape(fd, skin, { d: 'M14,-12 C22,-2 24,14 16,26 C24,22 30,8 27,-12Z', fill: skinS }, 3);
  // shadow under the helmet brim: spotted black
  s += PF('M-24,-13 Q2,-1 28,-13 L28,-16 L-24,-16Z', INK);
  s += owenFace(o.ex || 'neutral', skin, z, o.look);
  // bangs
  s += P('M-14,-12 L-8,-4 L-4,-12 L2,-5 L6,-12Z', OC.hair, 2.2);
  // helmet
  s += shape('M-28,-14 C-28,-54 32,-54 32,-14Z', 'url(#helm)', { d: 'M12,-48 C26,-42 32,-30 32,-14 L18,-14Z', fill: '#7a8098' }, 3);
  s += P('M2,-50 L2,-16', 'none', 2.2) + P('M-28,-17 L32,-17 L32,-9 L-28,-9Z', '#8a90a4', 3) + [-20, -8, 4, 16, 26].map(x => C(x, -13, 1.8, '#f2f5fb', 1.2)).join('');
  s += P('M-18,-40 Q-10,-48 0,-48', 'none', 3, 'stroke="#ffffff" opacity=".9"');
  if (z && o.glowEyes) s += glowBlob(-6, 2, 9, '#9dff6a', 0.7) + glowBlob(14, 2, 9, '#9dff6a', 0.7);
  return s;
}
// Owen full figure. pose angles are degrees: arms/legs measured "forward" (toward the way he faces), 0 = hanging down.
const POSES = {
  stand: { lean: 0, head: 0, la: [8, -10], ra: [-8, -10], ll: [4, 0], rl: [-4, 0] },
  hero: { lean: -4, head: -6, la: [-30, 40], ra: [168, 8], ll: [-18, 6], rl: [22, 4] },
  run: { lean: 14, head: -6, la: [-50, 70], ra: [60, 60], ll: [50, -60], rl: [-35, -30] },
  swing: { lean: 12, head: 0, la: [20, 30], ra: [110, 10], ll: [32, -14], rl: [-24, -4] },
  windup: { lean: -10, head: -6, la: [40, 50], ra: [175, -40], ll: [22, -6], rl: [-22, 0] },
  dodge: { lean: -24, head: 10, la: [100, 30], ra: [-60, 40], ll: [40, -60], rl: [-30, -50] },
  timeout: { lean: 0, head: -4, la: [80, 90], ra: [92, -2], ll: [6, 0], rl: [-6, 0] },
  stop: { lean: -4, head: -4, la: [10, -10], ra: [100, 70], ll: [16, -4], rl: [-14, 0] },
  shrug: { lean: 0, head: 6, la: [40, 80], ra: [40, 80], ll: [4, 0], rl: [-4, 0] },
  point: { lean: 4, head: 0, la: [6, -8], ra: [95, 0], ll: [10, 0], rl: [-8, 0] },
  trudge: { lean: 18, head: 10, la: [-20, 20], ra: [30, 30], ll: [22, -36], rl: [-14, -10] },
  dive: { lean: 70, head: -30, la: [150, 10], ra: [160, 0], ll: [-20, -10], rl: [-40, -20] },
  rise: { lean: -6, head: -10, la: [-20, 30], ra: [175, 0], ll: [-6, 4], rl: [10, 0] },
  tired: { lean: 22, head: 18, la: [10, 20], ra: [20, 30], ll: [24, -20], rl: [-18, -10] },
  think: { lean: 0, head: -4, la: [10, -10], ra: [40, 140], ll: [6, 0], rl: [-6, 0] },
  bow: { lean: 24, head: 20, la: [-10, 0], ra: [-6, 0], ll: [6, 0], rl: [-6, 0] },
  shoo: { lean: -6, head: -2, la: [70, 40], ra: [150, 30], ll: [10, 0], rl: [-10, 0] },
  cup: { lean: 0, head: -10, la: [60, 120], ra: [60, 120], ll: [6, 0], rl: [-6, 0] },
};
function owen(o = {}) {
  const p = { ...POSES[o.pose || 'stand'], ...(o.p || {}) }, z = o.zombie;
  const skin = z ? OZ.skin : OC.skin, skinS = z ? OZ.skinS : OC.skinS;
  const hand = (jon, tot) => (jon ? G(`rotate(${tot + (jon.rot || 0)}) translate(0 ${-58 * (jon.s || 0.62)})`, axe({ s: 0.62, ...jon, rot: 0 })) : '') + C(0, 0, 8, skin, 2.8) + P('M-5,-3 L4,-3', 'none', 1.5);
  const arm = ([a1, a2], jon, back) => G(`rotate(${-a1})`, limb(28, 8.5, 7.5, back ? OC.tunicS : OC.tunic, OC.tunicD) + G(`translate(0 26) rotate(${-a2})`, limb(26, 7, 6, back ? skinS : skin, skinS) + G('translate(0 30)', hand(jon, a1 + a2 - p.lean))));
  const leg = ([a1, a2], back) => G(`rotate(${-a1})`, limb(36, 10.5, 9, back ? OC.pantsS : OC.pants, OC.pantsS) + G(`translate(0 34) rotate(${-a2})`, limb(30, 9, 8.5, OC.boot, '#2e1a0c') + P('M-11,2 L11,2 L12,10 L-12,10Z', OC.fur, 2.4) + G(`translate(0 30) rotate(${a1 + a2})`, P('M-10,-6 L14,-6 Q24,-4 24,4 L-10,4Z', OC.boot, 2.8))));
  const torso = 'M-21,-60 Q-27,-30 -23,0 L-29,20 L29,20 L23,0 Q27,-30 21,-60 Q0,-66 -21,-60Z';
  let up = '';
  if (o.jonBack) up += G('translate(10 -40) rotate(-32) scale(.62)', axe({ face: o.jonBack, glow: true }));
  up += G('translate(-17 -54)', arm(p.la, o.jonL, true));
  up += shape(torso, OC.tunic, { d: 'M6,-62 Q22,-30 16,0 L22,20 L29,20 L23,0 Q27,-30 21,-60Z', fill: OC.tunicS }, 3);
  up += P('M-29,20 L29,20 L28,14 L-28,14Z', OC.tunicD, 2.4);
  up += P('M-24,-4 L24,-4 L24,7 L-24,7Z', OC.belt, 2.8) + P('M-5,-5 L6,-5 L6,8 L-5,8Z', OC.gold, 2.4);
  up += P('M-8,-62 Q0,-50 8,-62', 'none', 2.4) + PF('M-12,-60 Q0,-48 12,-60 Q0,-56 -12,-60Z', INK);
  up += G(`translate(1 -60) rotate(${-p.head})`, Rect(-6, -10, 13, 12, skinS, 2.4) + G('translate(0 -30)', owenHead({ ex: o.ex, zombie: z, look: o.look, glowEyes: o.glowEyes })));
  up += G('translate(17 -54)', arm(p.ra, o.jon, false));
  const body = G('translate(-9 -78)', leg(p.ll, true)) + G('translate(9 -78)', leg(p.rl, false)) + G(`translate(0 -78) rotate(${p.lean})`, up);
  const aura = o.aura ? glowBlob(0, -110, 150, o.aura, 0.55) : '';
  return G(`translate(${o.x || 0} ${o.y || 0}) rotate(${o.rot || 0}) scale(${(o.flip ? -1 : 1) * (o.s || 1)} ${o.s || 1})`, aura + (o.shadow !== false ? E(0, 2, 40, 7, INK, 0, 'opacity=".35"') : '') + body);
}
// Owen from the waist up (for seats, beds, close-ups): head + shoulders
function owenBust(o = {}) {
  const z = o.zombie, skin = z ? OZ.skin : OC.skin;
  let s = shape('M-46,40 Q-44,-4 -18,-10 L20,-10 Q46,-4 48,40Z', OC.tunic, { d: 'M14,-10 Q42,-4 48,40 L28,40 Q30,8 14,-10Z', fill: OC.tunicS }, 3);
  s += PF('M-12,-10 Q0,4 12,-10 Q0,-2 -12,-10Z', INK) + Rect(-7, -22, 14, 14, z ? OZ.skinS : OC.skinS, 2.4);
  s += G('translate(0 -50)', owenHead(o));
  if (o.hands === 'grip') s += C(-30, 34, 9, skin, 2.6) + C(32, 34, 9, skin, 2.6);
  return G(`translate(${o.x || 0} ${o.y || 0}) rotate(${o.rot || 0}) scale(${(o.flip ? -1 : 1) * (o.s || 1)} ${o.s || 1})`, s);
}

// Jon: the axe. origin at the middle of the handle; blade up and to the right.
const RUNES = ['M0,-8 L0,8 M0,-6 L6,-2 M0,0 L6,4', 'M-4,8 L-4,-8 L4,-2 L4,8', 'M0,-8 L0,8 M0,-4 L5,0 L0,4', 'M-5,-8 L5,8 M5,-8 L-5,8', 'M0,-8 L5,-3 L0,2 L-5,-3Z M-5,8 L0,2 L5,8', 'M-4,-8 L-4,8 M-4,-8 L4,-3 L-4,2 L4,8'];
function axe(o = {}) {
  const face = o.face || 'happy', glow = o.glow !== false;
  let s = '';
  if (o.aura) s += glowBlob(36, -40, 90, o.aura === true ? '#5fe8ff' : o.aura, 0.6);
  // handle
  s += P('M-6,-60 L6,-60 L7,98 L-7,98Z', 'url(#wood)', 3) + [10, 22, 34].map(y => P(`M-7,${y} L7,${y + 6} L7,${y + 10} L-7,${y + 4}Z`, '#5a3418', 1.6)).join('');
  s += P('M-3,-50 L-3,90', 'none', 1.4, 'stroke="#e8a868" opacity=".7"');
  s += P('M-10,96 L10,96 L8,110 L-8,110Z', 'url(#steel)', 3) + C(0, 114, 6, '#ffd84a', 2.6);
  // back spike + socket
  s += shape('M-10,-70 L-30,-58 L-10,-44Z', 'url(#steel)', { d: 'M-10,-58 L-30,-58 L-10,-44Z', fill: '#6a7a9c' }, 3);
  // blade
  const bd = 'M8,-78 C30,-82 50,-104 76,-110 C96,-76 98,-10 76,22 C54,12 32,-14 8,-36Z';
  s += shape(bd, 'url(#steel)', { d: 'M8,-50 C32,-30 54,8 76,22 C60,18 34,-6 8,-36Z', fill: '#7484a8' }, 3.4, 'hatchF');
  s += P('M72,-104 C90,-72 92,-14 72,16', 'none', 3, 'stroke="#ffffff" opacity=".9"');
  s += P('M-12,-80 L12,-80 L12,-30 L-12,-30Z', 'url(#steel)', 3) + C(0, -70, 2.6, INK, 0) + C(0, -40, 2.6, INK, 0);
  // runes along the edge
  const rp = [[80, -84], [86, -58], [88, -32], [85, -6]];
  let runes = rp.map(([x, y], i) => G(`translate(${x} ${y}) scale(.75)`, P(RUNES[i % RUNES.length], 'none', 3, 'stroke="#5fe8ff"'))).join('');
  if (glow) s += G('', runes, 'filter="url(#glow)"'); else s += runes;
  // the carved face
  const ey = -62, e1 = 34, e2 = 56;
  const eye = (x, sc = 1) => E(x, ey, 6.5 * sc, 7.5 * sc, '#ffffff', 2.6) + C(x + 1.5, ey + 1, 3 * (sc > 1.1 ? 0.75 : 1), INK, 0) + C(x + 2.5, ey - 0.5, 1, '#fff', 0);
  const closed = x => P(`M${x - 7},${ey} Q${x},${ey - 8} ${x + 7},${ey}`, 'none', 3);
  const brow = (x, a) => P(`M${x - 8},${ey - 12 + a} L${x + 8},${ey - 12 - a}`, 'none', 3.4);
  switch (face) {
    case 'sing': s += closed(e1) + closed(e2) + E(47, -36, 7, 9, '#4a1020', 2.6) + E(47, -32, 4, 3, '#e0525a', 0); break;
    case 'sleep': s += P(`M${e1 - 7},${ey} Q${e1},${ey + 6} ${e1 + 7},${ey}`, 'none', 3) + P(`M${e2 - 7},${ey} Q${e2},${ey + 6} ${e2 + 7},${ey}`, 'none', 3) + P('M40,-36 Q47,-32 54,-36', 'none', 2.6); break;
    case 'excited': s += eye(e1, 1.15) + eye(e2, 1.15) + brow(e1, 2) + brow(e2, -2) + P('M33,-44 Q47,-44 61,-46 Q58,-24 47,-24 Q36,-26 33,-44Z', '#4a1020', 2.6) + P('M35,-44 L59,-46 L58,-41 L36,-40Z', '#fff', 0) + E(47, -29, 6, 3, '#e0525a', 0); break;
    case 'worried': s += eye(e1) + eye(e2) + brow(e1, -4) + brow(e2, 4) + P('M38,-38 Q42,-42 46,-38 Q50,-34 56,-39', 'none', 2.8); break;
    case 'smug': s += eye(e1) + eye(e2) + P(`M${e1 - 7},${ey - 2} L${e1 + 7},${ey - 2}`, 'none', 3.2) + P(`M${e2 - 7},${ey - 2} L${e2 + 7},${ey - 2}`, 'none', 3.2) + PF(`M${e1 - 7},${ey - 2} L${e1 + 7},${ey - 2} L${e1 + 7},${ey - 9} L${e1 - 7},${ey - 9}Z`, '#c8d8ec') + PF(`M${e2 - 7},${ey - 2} L${e2 + 7},${ey - 2} L${e2 + 7},${ey - 9} L${e2 - 7},${ey - 9}Z`, '#c8d8ec') + P('M36,-38 Q48,-36 58,-46', 'none', 3); break;
    case 'yell': s += eye(e1) + eye(e2) + brow(e1, -3) + brow(e2, 3) + P('M32,-46 Q47,-50 62,-48 Q60,-18 46,-18 Q34,-22 32,-46Z', '#4a1020', 2.8) + E(47, -24, 7, 3.5, '#e0525a', 0) + P('M34,-46 L60,-48 L59,-43 L35,-41Z', '#fff', 0); break;
    case 'shock': s += eye(e1, 1.3) + eye(e2, 1.3) + brow(e1, -1) + brow(e2, 1) + E(47, -34, 4.5, 6, '#4a1020', 2.6); break;
    case 'grin': s += eye(e1) + eye(e2) + brow(e1, 2) + brow(e2, -2) + P('M32,-44 Q47,-30 62,-46 Q60,-36 47,-34 Q36,-36 32,-44Z', '#fff', 2.6) + L(40, -40, 41, -35, 1.4) + L(47, -40, 47, -34, 1.4) + L(54, -42, 54, -36, 1.4); break;
    default: s += eye(e1) + eye(e2) + brow(e1, 1) + brow(e2, -1) + P('M36,-42 Q47,-32 58,-44', 'none', 3);
  }
  return G(`translate(${o.x || 0} ${o.y || 0}) rotate(${o.rot || 0}) scale(${(o.flip ? -1 : 1) * (o.s || 1)} ${o.s || 1})`, s);
}

// Possessed penguin. origin at feet.
function penguin(o = {}) {
  const pose = o.pose || 'stand';
  let s = '';
  if (o.aura !== false) s += P(burstPath(0, -56, 62, 66, 12, 0.3, o.seed || 3), '#ff2a3a', 0, 'opacity=".35"');
  const fl = pose === 'lunge' ? -70 : pose === 'shock' ? 50 : pose === 'raise' ? -120 : 10;
  // flippers
  s += G(`translate(-26 -66) rotate(${fl})`, shape('M0,0 C-10,10 -14,34 -6,52 C0,40 6,20 6,4Z', '#20203a', null, 3));
  s += G(`translate(26 -66) rotate(${-fl}) scale(-1 1)`, shape('M0,0 C-10,10 -14,34 -6,52 C0,40 6,20 6,4Z', '#20203a', null, 3));
  // feet
  s += P('M-22,-2 L-6,-4 L-4,4 L-26,4Z', '#ffa020', 2.6) + P('M6,-4 L22,-2 L26,4 L4,4Z', '#ffa020', 2.6);
  // body
  s += shape('M-30,-2 C-42,-40 -32,-92 0,-98 C32,-92 42,-40 30,-2Z', '#20203a', { d: 'M8,-96 C34,-86 42,-40 30,-2 L16,-2 C30,-40 26,-80 8,-96Z', fill: '#0c0c1c' }, 3.2, 'hatchW');
  s += shape('M-20,-6 C-26,-36 -20,-66 0,-70 C20,-66 26,-36 20,-6Z', '#f4f4ff', { d: 'M6,-70 C22,-62 26,-36 20,-6 L10,-6 C18,-30 16,-58 6,-70Z', fill: '#b8b8d8' }, 2.6, 'ht');
  // eyes: red, glaring
  const eY = -78;
  if (pose === 'shock') s += C(-10, eY, 7, '#fff', 2.4) + C(10, eY, 7, '#fff', 2.4) + C(-10, eY, 2.4, '#ff2a3a', 0) + C(10, eY, 2.4, '#ff2a3a', 0);
  else s += glowBlob(-10, eY, 12, '#ff2a3a', 0.8) + glowBlob(10, eY, 12, '#ff2a3a', 0.8) + E(-10, eY, 5, 4, '#ff2a3a', 2) + E(10, eY, 5, 4, '#ff2a3a', 2) + C(-10, eY, 1.6, '#fff', 0) + C(10, eY, 1.6, '#fff', 0) + P(`M-18,${eY - 9} L-3,${eY - 3}`, 'none', 4, 'stroke="#f4f4ff"') + P(`M18,${eY - 9} L3,${eY - 3}`, 'none', 4, 'stroke="#f4f4ff"');
  // beak (open and screaming unless calm)
  if (pose === 'stand' || pose === 'shock') s += P('M-8,-68 L8,-68 L0,-56Z', '#ffa020', 2.4);
  else s += P('M-9,-70 L9,-70 L0,-60Z', '#ffa020', 2.4) + P('M-8,-58 L8,-58 L0,-46Z', '#c86010', 2.4) + P('M-6,-60 L6,-60 L0,-56Z', '#7a1020', 0);
  return G(`translate(${o.x || 0} ${o.y || 0}) rotate(${o.rot || 0}) scale(${(o.flip ? -1 : 1) * (o.s || 1)} ${o.s || 1})`, s);
}

// The Forest Giant of the North. origin at feet, ~600 tall at s=1.
function giantHead(o = {}) {
  const ex = o.ex || 'glare', bark = o.bark || '#6e4420', barkL = o.barkL || '#8a5a28', moss = o.moss || '#4a8a3a', mossL = o.mossL || '#6ab04a', eyeC = o.eye || '#ff3030';
  let s = '';
  // branch antlers + leaves
  const br = (m) => G(`scale(${m} 1)`, P('M-30,-70 C-40,-100 -60,-110 -80,-140 M-52,-104 C-70,-104 -86,-96 -100,-104 M-40,-90 C-36,-110 -30,-120 -30,-140', 'none', 9, `stroke="${INK}"`) + P('M-30,-70 C-40,-100 -60,-110 -80,-140 M-52,-104 C-70,-104 -86,-96 -100,-104 M-40,-90 C-36,-110 -30,-120 -30,-140', 'none', 5, `stroke="${bark}"`) + [[-80, -146, 22], [-104, -106, 18], [-30, -146, 18], [-60, -124, 14]].map(([x, y, r]) => C(x, y, r, mossL, 3) + C(x + 4, y + 4, r * 0.6, `url(#ht)`, 0, 'opacity=".5"')).join(''));
  s += br(1) + br(-1);
  // head mass
  const hd = 'M-70,-70 C-84,-20 -80,40 -56,74 C-30,96 30,96 56,74 C80,40 84,-20 70,-70 C40,-92 -40,-92 -70,-70Z';
  s += shape(hd, bark, { d: 'M20,-86 C54,-80 84,-30 70,40 C64,60 56,74 40,84 C60,40 56,-30 20,-86Z', fill: '#3a2410' }, 4, 'xhatch');
  // bark grain
  const R = rng(o.seed || 9);
  for (let i = 0; i < 9; i++) { const x = -60 + i * 15 + R() * 6; s += P(`M${x},-76 Q${x + R() * 10 - 5},-20 ${x + R() * 8 - 4},${40 + R() * 30}`, 'none', 1.8, `opacity=".7"`); }
  s += P('M-60,-60 Q0,-80 60,-60', 'none', 2.4, `stroke="${barkL}"`);
  // moss cap and beard
  s += shape('M-74,-64 C-60,-96 60,-96 74,-64 C60,-58 50,-70 30,-62 C10,-74 -10,-60 -30,-70 C-50,-58 -60,-70 -74,-64Z', moss, { d: 'M10,-88 C40,-86 64,-80 74,-64 C60,-58 50,-70 30,-62 Z', fill: '#2f6a2a' }, 3);
  // brow ridge: heavy black
  const browTilt = ex === 'ahh' || ex === 'smile' ? -6 : ex === 'think' ? 4 : 10;
  s += PF(`M-62,${-28 - browTilt} Q-30,${-8 + browTilt} -4,${-6 + browTilt} Q4,${-14} 4,${-6 + browTilt} Q30,${-8 + browTilt} 62,${-28 - browTilt} L64,-14 Q30,22 0,10 Q-30,22 -64,-14Z`, INK);
  // eyes
  const eye = (x, sq) => glowBlob(x, 6, 30, eyeC, 0.7) + P(`M${x - 18},${6} Q${x},${sq ? 0 : -8} ${x + 18},6 Q${x},${sq ? 10 : 16} ${x - 18},6Z`, eyeC, 2.4) + E(x, 6, 4, sq ? 2 : 6, '#ffe8a0', 0);
  if (ex === 'think') s += eye(-30, true) + eye(30, false); else s += eye(-30, ex === 'ahh' || ex === 'smile') + eye(30, ex === 'ahh' || ex === 'smile');
  // nose: knot
  s += shape('M-10,14 Q0,4 10,14 Q14,34 0,40 Q-14,34 -10,14Z', barkL, { d: 'M0,10 Q10,14 10,30 Q8,38 0,40Z', fill: bark }, 3);
  // mouth
  const M = {
    glare: 'M-40,54 L-26,48 L-12,56 L0,48 L14,56 L28,48 L40,54 L30,64 L-30,64Z',
    roar: 'M-46,48 Q0,36 46,48 Q40,92 0,96 Q-40,92 -46,48Z',
    pah: 'M-10,50 Q20,40 44,50 Q38,72 14,72 Q-6,68 -10,50Z',
    ahh: 'M-16,50 Q0,46 16,50 Q16,72 0,74 Q-16,72 -16,50Z',
    think: 'M-30,58 Q0,52 30,62 L28,66 Q0,58 -30,62Z',
    smile: 'M-36,50 Q0,76 36,50 Q0,64 -36,50Z',
  }[ex] || 'M-40,54 L40,54 L30,64 L-30,64Z';
  s += P(M, '#1a0806', 3);
  if (ex === 'roar') s += [-34, -18, -2, 14, 30].map(x => P(`M${x - 6},${50 - Math.abs(x) * 0.15} L${x},${64} L${x + 6},${50 - Math.abs(x) * 0.15}Z`, '#e8d8a8', 2)).join('') + [-24, -6, 12, 28].map(x => P(`M${x - 5},92 L${x},80 L${x + 5},92Z`, '#e8d8a8', 2)).join('') + E(0, 82, 18, 6, '#a02020', 0);
  if (ex === 'glare') s += [-26, -10, 6, 22].map(x => L(x, 54, x + 2, 62, 2.4, '#e8d8a8')).join('');
  // moss beard
  s += shape('M-56,70 C-40,110 -30,150 -12,170 L-6,120 L4,180 L14,120 L26,160 C34,130 44,100 56,70 C30,92 -30,92 -56,70Z', moss, { d: 'M14,120 L26,160 C34,130 44,100 56,70 C46,80 36,86 24,90Z', fill: '#2f6a2a' }, 3);
  s += PF('M-56,70 C-40,110 -30,150 -12,170 L-6,120 L4,180 L14,120 L26,160 C34,130 44,100 56,70 C30,92 -30,92 -56,70Z', 'url(#ht)', 'opacity=".35"');
  return G(`translate(${o.x || 0} ${o.y || 0}) rotate(${o.rot || 0}) scale(${(o.flip ? -1 : 1) * (o.s || 1)} ${o.s || 1})`, s);
}
function club(o = {}) {
  // a club the size of a narrow building: a whole trunk with a few windows' worth of knots
  let s = shape('M-34,0 L-60,-400 Q0,-440 60,-400 L34,0 Q0,12 -34,0Z', '#8a6a3a', { d: 'M8,0 L30,-410 Q48,-406 60,-400 L34,0Z', fill: '#5a4220' }, 4, 'xhatch');
  s += P('M-60,-400 Q0,-370 60,-400', 'none', 3) + E(0, -398, 58, 16, '#a8864a', 3) + E(0, -398, 34, 9, 'none', 2) + E(0, -398, 14, 4, 'none', 2);
  const R = rng(4); for (let i = 0; i < 8; i++) { const x = -40 + i * 11; s += P(`M${x * 0.6},-10 Q${x + R() * 8},-200 ${x * 1.3},-390`, 'none', 1.8, 'opacity=".7"'); }
  s += [[-36, -260], [26, -150], [-14, -330]].map(([x, y]) => E(x, y, 9, 13, '#3a2410', 2.6) + E(x, y, 4, 6, INK, 0)).join('');
  s += P('M-50,-300 L-90,-330 L-84,-318 L-50,-290', '#8a6a3a', 3);
  s += P('M-30,-6 L-34,40 L34,40 L30,-6', '#5a3418', 3) + [6, 18, 30].map(y => L(-33, y, 33, y + 4, 2)).join('');
  return G(`translate(${o.x || 0} ${o.y || 0}) rotate(${o.rot || 0}) scale(${(o.flip ? -1 : 1) * (o.s || 1)} ${o.s || 1})`, s);
}
function giant(o = {}) {
  const pose = o.pose || 'reveal', bark = '#6e4420', moss = '#4a8a3a';
  let s = '';
  // legs: trunks with roots
  const leg = (x, m) => G(`translate(${x} 0) scale(${m} 1)`, shape('M-40,-200 Q-46,-100 -40,-30 L-70,0 L-30,-6 L-20,6 L0,-6 L30,4 L40,-20 Q44,-100 40,-200Z', bark, { d: 'M10,-200 Q30,-100 26,-20 L40,-20 Q44,-100 40,-200Z', fill: '#3a2410' }, 4, 'xhatch') + P('M-20,-190 Q-26,-110 -22,-30', 'none', 2) + P('M2,-190 Q6,-110 0,-30', 'none', 2));
  s += leg(-62, 1) + leg(62, -1);
  // far arm
  const armL = pose === 'reveal' || pose === 'swing' ? 'rotate(30)' : pose === 'kneel' ? 'rotate(-10)' : pose === 'chin' ? 'rotate(-150)' : 'rotate(18)';
  const armShape = shape('M-26,0 Q-36,90 -30,170 L30,170 Q34,90 26,0Z', bark, { d: 'M8,0 Q22,90 16,170 L30,170 Q34,90 26,0Z', fill: '#3a2410' }, 4, 'xhatch') + P('M-36,166 L-48,206 L-30,196 L-24,224 L-6,200 L4,228 L14,198 L30,214 L36,170Z', bark, 3.2);
  s += G(`translate(-136 -420) ${armL}`, armShape);
  // torso
  const td = 'M-140,-430 C-160,-360 -120,-260 -96,-190 L96,-190 C120,-260 160,-360 140,-430 C80,-470 -80,-470 -140,-430Z';
  s += shape(td, bark, { d: 'M40,-460 C120,-450 160,-380 120,-260 L96,-190 L40,-190 C90,-280 100,-380 40,-460Z', fill: '#3a2410' }, 4.4, 'xhatch');
  const R = rng(21);
  for (let i = 0; i < 14; i++) { const x = -120 + i * 18 + R() * 6; s += P(`M${x},-440 Q${x + R() * 20 - 10},-330 ${x * 0.8},-200`, 'none', 2, 'opacity=".75"'); }
  s += E(-30, -320, 16, 22, '#3a2410', 3) + E(-30, -320, 7, 10, INK, 0) + E(50, -260, 10, 14, '#3a2410', 2.6);
  // moss shoulders and belt of vines
  s += shape('M-160,-420 C-150,-470 -60,-470 -40,-440 C-70,-420 -100,-430 -130,-400 C-140,-396 -156,-404 -160,-420Z', moss, null, 3) + Rect(-160, -470, 120, 70, 'url(#ht)', 0, 'opacity=".25"');
  s += shape('M160,-420 C150,-470 60,-470 40,-440 C70,-420 100,-430 130,-400 C140,-396 156,-404 160,-420Z', moss, null, 3);
  s += P('M-110,-230 Q0,-200 110,-230 L106,-212 Q0,-182 -106,-212Z', '#2f6a2a', 3);
  // head
  s += G(`translate(0 -510) rotate(${o.headRot || 0})`, giantHead({ ex: o.ex || 'roar', seed: 5 }));
  // near arm with the club
  if (pose === 'reveal' || pose === 'swing') {
    const a = pose === 'swing' ? 40 : -40;
    s += G(`translate(136 -420) rotate(${-160 + a})`, armShape + G('translate(0 200) rotate(180) scale(.9)', club({})));
  } else if (pose === 'rest') {
    s += G('translate(140 -420) rotate(-14)', armShape) + G('translate(190 -10) rotate(4) scale(.95)', club({}));
  } else if (pose === 'kneel' || pose === 'chin') {
    s += G('translate(136 -420) rotate(-20)', armShape) + G('translate(200 -10) rotate(8) scale(.95)', club({}));
  } else if (pose === 'aside') {
    s += G('translate(136 -420) rotate(-70)', armShape);
  }
  return G(`translate(${o.x || 0} ${o.y || 0}) rotate(${o.rot || 0}) scale(${(o.flip ? -1 : 1) * (o.s || 1)} ${o.s || 1})`, s);
}

// Flight attendant. origin at feet, ~230 tall.
function attendant(o = {}) {
  const d = !!o.demon, skin = d ? '#b8cbb0' : '#ecd2c0', skinS = d ? '#7e9478' : '#c8a090';
  const pose = o.pose || (d ? 'claw' : 'tray');
  let s = '';
  if (d) s += P(burstPath(0, -140, 150, 170, 9, 0.5, 2), '#2a0010', 0, 'opacity=".75"') + glowBlob(0, -150, 170, '#ff2040', 0.5);
  // legs + shoes
  s += Rect(-18, -70, 12, 64, skin, 2.6) + Rect(6, -70, 12, 64, skin, 2.6) + P('M-22,-8 L-4,-8 L-2,2 L-26,2Z', INK, 2) + P('M4,-8 L22,-8 L26,2 L2,2Z', INK, 2);
  // skirt + jacket
  s += shape('M-30,-130 L30,-130 L36,-66 L-36,-66Z', '#1e2a5a', { d: 'M8,-130 L30,-130 L36,-66 L14,-66Z', fill: '#141c40' }, 3);
  s += shape('M-34,-196 Q-40,-160 -32,-126 L32,-126 Q40,-160 34,-196 Q0,-204 -34,-196Z', '#1e2a5a', { d: 'M10,-200 Q38,-170 32,-126 L14,-126 Q22,-170 10,-200Z', fill: '#141c40' }, 3);
  s += P('M-8,-196 L0,-160 L8,-196', 'none', 2.4) + [-150, -140].map(y => C(-4, y, 2.4, '#ffd84a', 1.4)).join('');
  s += P('M14,-178 L30,-180 L28,-174 L14,-173Z', '#ffd84a', 1.6);
  // scarf
  s += P('M-14,-200 Q0,-188 14,-200 L10,-188 L18,-170 L4,-178 L-2,-166 L-4,-186Z', '#c0182b', 2.6);
  // arms
  if (pose === 'tray') {
    s += G('translate(-32 -190) rotate(14)', limb(36, 8, 7, '#1e2a5a', '#141c40') + G('translate(0 34) rotate(-80)', limb(30, 7, 6, skin, skinS) + C(0, 32, 7, skin, 2.4)));
    s += G('translate(32 -190) rotate(-30)', limb(36, 8, 7, '#1e2a5a', '#141c40') + G('translate(0 34) rotate(80)', limb(30, 7, 6, skin, skinS) + C(0, 32, 7, skin, 2.4)));
    s += P('M-50,-132 L40,-132 L40,-124 L-50,-124Z', '#9aa0ac', 2.4) + Rect(-40, -146, 12, 14, '#f4f4f8', 2) + Rect(-22, -150, 10, 18, '#ffa020', 2) + Rect(6, -144, 14, 12, '#f4f4f8', 2);
  } else if (pose === 'point') {
    s += G('translate(-32 -190) rotate(10)', limb(36, 8, 7, '#1e2a5a', '#141c40') + G('translate(0 34) rotate(-10)', limb(30, 7, 6, skin, skinS) + C(0, 32, 7, skin, 2.4)));
    s += G('translate(32 -190) rotate(-100)', limb(36, 8, 7, '#1e2a5a', '#141c40') + G('translate(0 34) rotate(-10)', limb(30, 7, 6, skin, skinS) + C(0, 32, 7, skin, 2.4)));
  } else {
    // claws up
    const talon = 'M0,0 L-6,26 L-2,24 L2,30 L4,24 L10,28 L8,20 L14,22 L6,2Z';
    const cl = (m) => G(`scale(${m} 1)`, G('translate(-32 -190) rotate(60)', limb(36, 8, 7, '#1e2a5a', '#141c40') + G('translate(0 34) rotate(-110)', limb(30, 7, 6, skin, skinS) + G('translate(0 28)', C(0, 4, 8, skin, 2.4) + P('M-8,4 L-16,34 L-6,12 M-3,8 L-6,42 L1,12 M3,8 L6,42 L7,12 M8,4 L16,34 L10,6', '#2a0a2a', 3) + P('M-8,4 L-16,34 L-6,12Z M-3,8 L-6,42 L1,12Z M3,8 L6,42 L7,12Z M8,4 L16,34 L10,6Z', '#3a0a3a', 2)))));
    s += cl(1) + cl(-1);
    void talon;
  }
  // neck + head
  s += Rect(-6, -212, 12, 14, skinS, 2.4);
  s += G('translate(0 -236)', attHead({ demon: d, ex: o.ex }));
  return G(`translate(${o.x || 0} ${o.y || 0}) rotate(${o.rot || 0}) scale(${(o.flip ? -1 : 1) * (o.s || 1)} ${o.s || 1})`, s);
}
function attHead(o = {}) {
  const d = !!o.demon, skin = d ? '#b8cbb0' : '#ecd2c0', skinS = d ? '#7e9478' : '#c8a090', ex = o.ex || (d ? 'hiss' : 'smile');
  let s = '';
  // hair: neat bun, or wild when demon
  if (d) s += P('M-30,-6 L-48,-40 L-30,-30 L-36,-62 L-16,-38 L-8,-70 L4,-40 L18,-66 L22,-36 L42,-54 L34,-20 L50,-18 L32,4Z', '#1a0a10', 3);
  else s += C(0, -30, 14, '#3a2418', 3) + P('M-6,-40 Q0,-44 6,-40', 'none', 1.6, 'stroke="#6a4430"');
  s += shape('M-24,-10 C-26,14 -14,30 0,30 C14,30 26,14 24,-10 C20,-28 -20,-28 -24,-10Z', skin, { d: 'M10,-24 C22,-14 26,10 14,28 C22,24 26,12 24,-10 Z', fill: skinS }, 3);
  if (!d) s += P('M-26,-4 C-28,-30 28,-30 26,-4 C20,-16 6,-20 -2,-14 C-10,-20 -20,-14 -26,-4Z', '#3a2418', 3) + P('M-14,-24 L14,-24 L12,-30 L-12,-30Z', '#1e2a5a', 2.4) + Rect(-4, -30, 8, 5, '#ffd84a', 1.2);
  else s += P('M-26,-4 C-28,-30 28,-30 26,-4 C20,-14 6,-16 -2,-12 C-10,-16 -20,-12 -26,-4Z', '#1a0a10', 3);
  // eyes
  if (d) s += glowBlob(-9, 2, 14, '#ff2020', 0.9) + glowBlob(9, 2, 14, '#ff2020', 0.9) + P('M-16,0 L-3,4 L-4,-2Z', '#ff2020', 2) + P('M16,0 L3,4 L4,-2Z', '#ff2020', 2) + P('M-18,-8 L-2,-2', 'none', 3.4) + P('M18,-8 L2,-2', 'none', 3.4) + PF('M-24,-6 L-2,-2 L-2,10 L-24,6Z', 'url(#ht2)', 'opacity=".6"');
  else if (ex === 'odd') s += E(-9, 1, 4, 3, '#fff', 2) + C(-8, 1, 1.8, INK, 0) + E(9, 1, 4, 4.5, '#fff', 2) + C(10, 1, 1.8, INK, 0) + P('M-14,-8 L-3,-5', 'none', 2.6) + P('M4,-9 Q10,-13 15,-8', 'none', 2.6);
  else s += P('M-14,1 Q-9,-3 -4,1', 'none', 2.6) + P('M4,1 Q9,-3 14,1', 'none', 2.6) + P('M-15,-7 Q-9,-10 -4,-7', 'none', 2) + P('M4,-7 Q9,-10 15,-7', 'none', 2) + L(-15, 0, -17, -2, 1.6) + L(15, 0, 17, -2, 1.6);
  s += P('M0,4 Q3,10 -1,11', 'none', 1.8);
  // mouth
  if (d) s += P('M-14,16 Q0,10 14,16 Q10,28 0,28 Q-10,28 -14,16Z', '#3a0010', 2.6) + P('M-10,15 L-7,25 L-4,15Z M4,15 L7,25 L10,15Z', '#fff', 1.6) + P('M-3,26 L-1,22 L1,26Z', '#fff', 1);
  else if (ex === 'odd') s += P('M-6,18 L7,17', 'none', 2.6);
  else s += P('M-9,15 Q0,22 9,15 Q0,18 -9,15Z', '#c0182b', 2.2);
  s += C(-15, 10, 3, '#f2a0a0', 0, 'opacity=".6"') + C(15, 10, 3, '#f2a0a0', 0, 'opacity=".6"');
  return s;
}
// silhouettes for the legend panels
function vikingSil(o = {}) {
  const c = o.fill || INK;
  let s = PF('M-30,0 L-24,-80 L-40,-150 Q-30,-200 0,-206 Q30,-200 40,-150 L24,-80 L30,0 L8,0 L4,-70 L-4,-70 L-8,0Z', c);
  s += C(0, -226, 24, c, 0) + PF('M-24,-232 C-40,-236 -52,-252 -48,-276 C-40,-258 -30,-250 -18,-246Z M24,-232 C40,-236 52,-252 48,-276 C40,-258 30,-250 18,-246Z', c);
  s += PF('M-8,-210 L8,-210 L20,-170 L0,-150 L-20,-170Z', c);   // beard
  s += PF('M-40,-190 Q-80,-120 -70,-20 L-40,-60Z', c);          // cape
  s += G('translate(30 -190) rotate(-130)', PF('M-9,0 L9,0 L9,80 L-9,80Z', c));
  return G(`translate(${o.x || 0} ${o.y || 0}) scale(${(o.flip ? -1 : 1) * (o.s || 1)} ${o.s || 1})`, s);
}
function cowOwen(o = {}) {
  let s = shape('M-90,-40 C-96,-110 60,-120 80,-60 C90,-30 70,-6 50,-6 L-70,-6 C-86,-10 -92,-24 -90,-40Z', '#ffffff', { d: 'M20,-110 C60,-100 90,-60 70,-20 C60,-10 50,-6 40,-6 C60,-40 50,-90 20,-110Z', fill: '#d8d8e0' }, 3.4);
  s += P('M-60,-90 C-40,-104 -20,-96 -24,-76 C-40,-64 -60,-70 -60,-90Z', INK, 0) + P('M10,-60 C30,-74 48,-60 40,-40 C20,-30 4,-40 10,-60Z', INK, 0);
  [[-70, 0], [-46, 0], [28, 0], [52, 0]].forEach(([x]) => { s += Rect(x - 7, -10, 14, 36, '#ffffff', 3) + Rect(x - 7, 20, 14, 8, INK, 0); });
  s += P('M-90,-60 C-110,-50 -116,-30 -104,-10', 'none', 4);
  // head with Owen's helmet
  s += G('translate(96 -86)', shape('M-30,-20 C-34,20 -20,44 10,46 C40,44 46,20 36,-20Z', '#ffffff', null, 3.2) + E(6, 34, 26, 16, '#f2a0b0', 3) + C(-4, 34, 3, INK, 0) + C(16, 34, 3, INK, 0) + C(-8, 6, 5, '#fff', 2.2) + C(-7, 7, 2.4, INK, 0) + C(20, 6, 5, '#fff', 2.2) + C(21, 7, 2.4, INK, 0) + G('translate(4 -6) scale(.95)', PF('M-28,-14 C-28,-54 32,-54 32,-14Z', 'url(#helm)') + P('M-28,-14 C-28,-54 32,-54 32,-14Z', 'none', 3) + P('M-28,-17 L32,-17 L32,-9 L-28,-9Z', '#8a90a4', 3) + G('translate(2 0) scale(-1 1)', P('M-22,-26 C-42,-28 -54,-44 -50,-68 C-44,-52 -34,-44 -18,-40Z', OC.horn, 3)) + P('M-22,-26 C-42,-28 -54,-44 -50,-68 C-44,-52 -34,-44 -18,-40Z', OC.horn, 3)));
  return G(`translate(${o.x || 0} ${o.y || 0}) scale(${(o.flip ? -1 : 1) * (o.s || 1)} ${o.s || 1})`, s);
}

// ---------- scenery ----------
function sky(w, h, stops) { return Rect(0, 0, w, h, lin(stops)); }
function mountains(w, y, h, col, seed = 1, snow = '#e8ecf8', peaks = 6) {
  const R = rng(seed); let d = `M0,${y + h}`; const pts = [];
  for (let i = 0; i <= peaks; i++) { const x = i / peaks * w + (R() - 0.5) * w / peaks * 0.5, py = y + R() * h * 0.6; pts.push([x, py]); d += ` L${f1(x)},${f1(py)}`; if (i < peaks) { const mx = (i + 0.5) / peaks * w, my = y + h * (0.55 + R() * 0.3); d += ` L${f1(mx)},${f1(my)}`; } }
  d += ` L${w},${y + h}Z`;
  let s = P(d, col, 3);
  if (snow) pts.forEach(([x, py]) => { s += P(`M${f1(x - 16)},${f1(py + 18)} L${f1(x)},${f1(py)} L${f1(x + 16)},${f1(py + 18)} L${f1(x + 6)},${f1(py + 12)} L${f1(x)},${f1(py + 20)} L${f1(x - 6)},${f1(py + 12)}Z`, snow, 2); });
  return s;
}
function spruce(x, y, h, col = '#1f4a3a', shade = '#0e2a22', sw = 3) {
  const w = h * 0.42; let s = Rect(x - h * 0.04, y - h * 0.12, h * 0.08, h * 0.14, '#3a2410', 2);
  for (let i = 0; i < 4; i++) { const ty = y - h * 0.12 - i * h * 0.22, tw = w * (1 - i * 0.2); s += P(`M${f1(x - tw)},${f1(ty)} L${f1(x)},${f1(ty - h * 0.4)} L${f1(x + tw)},${f1(ty)} Q${f1(x)},${f1(ty - h * 0.06)} ${f1(x - tw)},${f1(ty)}Z`, col, sw) + PF(`M${f1(x)},${f1(ty - h * 0.4)} L${f1(x + tw)},${f1(ty)} Q${f1(x + tw * 0.4)},${f1(ty - h * 0.04)} ${f1(x + tw * 0.1)},${f1(ty - h * 0.03)}Z`, shade); }
  return s;
}
function forestRow(w, y, h, n, col, shade, seed = 2, sw = 3) {
  const R = rng(seed); let s = '';
  for (let i = 0; i < n; i++) s += spruce((i + R() * 0.6) / n * (w + 80) - 40, y + R() * 16, h * (0.75 + R() * 0.5), col, shade, sw);
  return s;
}
function waterLines(x, y, w, h, n, col = '#ffffff', seed = 6) {
  const R = rng(seed); let s = '';
  for (let i = 0; i < n; i++) { const yy = y + R() * h, xx = x + R() * w, l = 20 + R() * 60; s += L(xx, yy, xx + l, yy, 2, col, 'opacity=".7"'); }
  return s;
}
