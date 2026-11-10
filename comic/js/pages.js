// Jöntuka: A Viking Tale. The script is Owen's journal; captions are his words.
'use strict';

const FW = 25, FH = 22;            // balloon/caption sizes for wide (640) and half (420) panels
const PAGES = [];
const page = (label, rows, extra = {}) => PAGES.push({ label, rows, ...extra });

// ---------- shared backgrounds ----------
function bedroom(W, H, o = {}) {
  let s = Rect(0, 0, W, H, lin(o.night ? ['#1a1440', '#3a2a70', '#5a3a8a'] : ['#3a2a78', '#7a4a9a', '#c86a8a']));
  s += halftoneRect(0, 0, W, H, 'htp', 0.35);
  const wx = o.wx ?? W * 0.66, wy = 26, ww = Math.min(150, W * 0.24), wh = 130;
  s += Rect(wx - 8, wy - 8, ww + 16, wh + 16, '#5a3418', 3) + Rect(wx, wy, ww, wh, lin(o.night ? ['#0a0c24', '#283468'] : ['#ffcf6a', '#ff7a5a', '#a04a9a']), 3);
  if (o.night) s += C(wx + ww * 0.7, wy + 34, 14, '#f2ecd0', 2) + C(wx + ww * 0.7 + 7, wy + 30, 12, '#283468', 0);
  else s += C(wx + ww * 0.5, wy + wh * 0.8, 26, '#fff2a0', 0) + glowBlob(wx + ww * 0.5, wy + wh * 0.8, 120, '#ffd060', 0.5);
  s += L(wx + ww / 2, wy, wx + ww / 2, wy + wh, 6, '#5a3418') + L(wx, wy + wh / 2, wx + ww, wy + wh / 2, 6, '#5a3418');
  s += Rect(0, H * 0.78, W, H * 0.22, '#5a3418', 0) + Rect(0, H * 0.78, W, 4, INK);
  for (let x = 0; x < W; x += 70) s += L(x, H * 0.78, x - 30, H, 2);
  return s;
}
function bed(x, y, w, col = '#3a5ab8') {
  let s = Rect(x - 20, y - 110, 24, 150, '#7a4418', 3) + Rect(x - 26, y - 118, 36, 14, '#9a6030', 3);
  s += E(x + 70, y - 34, 70, 28, '#f4f4ff', 3) + PF(`M${x + 70},${y - 6} Q${x + 120},${y - 20} ${x + 140},${y - 34} Q${x + 130},${y - 10} ${x + 70},${y - 6}Z`, 'url(#ht)', 'opacity=".5"');
  s += P(`M${x + 40},${y - 24} Q${x + w * 0.5},${y - 70} ${x + w},${y - 30} L${x + w + 10},${y + 40} L${x + 20},${y + 40}Z`, col, 3.5);
  s += PF(`M${x + w * 0.55},${y - 50} Q${x + w * 0.85},${y - 50} ${x + w},${y - 30} L${x + w + 10},${y + 40} L${x + w * 0.6},${y + 40}Z`, 'url(#hatch)', 'opacity=".5"');
  for (let k = 1; k < 5; k++) s += P(`M${x + 20 + k * w / 5},${y - 40} L${x + 10 + k * w / 5},${y + 40}`, 'none', 2, 'stroke-dasharray="6 5"');
  return s;
}
function fjord(W, H, o = {}) {
  const horizon = o.horizon ?? H * 0.5;
  let s = Rect(0, 0, W, horizon + 4, lin(o.sky || ['#3a1a6a', '#b0306a', '#ff7a3a', '#ffd06a']));
  s += glowBlob(o.sunX ?? W * 0.7, horizon - 10, W * 0.45, '#ffe08a', 0.6);
  s += mountains(W, horizon - H * 0.28, H * 0.3, o.mtn || '#4a2a7a', o.seed || 3, '#f0e0ff', 5);
  s += mountains(W, horizon - H * 0.14, H * 0.16, o.mtn2 || '#2a1a50', (o.seed || 3) + 4, null, 7);
  s += Rect(0, horizon, W, H - horizon, lin(o.water || ['#1a8a9a', '#0a4a6a', '#08284a']), 3);
  s += halftoneRect(0, horizon, W, H - horizon, 'htc', 0.35) + waterLines(0, horizon + 6, W, H - horizon, 22, '#bff6ff', o.seed || 3);
  return s;
}
function forestBG(W, H, o = {}) {
  let s = Rect(0, 0, W, H, lin(o.sky || ['#0a2a2a', '#1a4a4a', '#3a6a3a']));
  if (o.shafts !== false) for (let i = 0; i < 4; i++) s += P(`M${W * (0.15 + i * 0.25)},0 L${W * (0.25 + i * 0.25)},0 L${W * (0.05 + i * 0.25) + 80},${H} L${W * (0.05 + i * 0.25)},${H}Z`, '#d8ff9a', 0, 'opacity=".12"');
  s += forestRow(W, H * 0.55, H * 0.5, 9, '#14403a', '#0a2620', (o.seed || 1), 2);
  s += halftoneRect(0, 0, W, H * 0.7, 'ht', 0.18);
  s += forestRow(W, H * 0.72, H * 0.7, 6, '#1f5a3a', '#0e2a22', (o.seed || 1) + 7, 3);
  s += Rect(0, H * 0.78, W, H * 0.22, o.floor || '#4a3418', 3);
  const R = rng(o.seed || 5);
  for (let i = 0; i < 10; i++) s += E(R() * W, H * 0.82 + R() * H * 0.16, 30 + R() * 50, 6 + R() * 6, '#2a1a0a', 0, 'opacity=".7"');
  s += halftoneRect(0, H * 0.78, W, H * 0.22, 'ht2', 0.35);
  return s;
}
function cabin(W, H, o = {}) {
  const d = !!o.dark;
  let s = Rect(0, 0, W, H, lin(d ? ['#060208', '#2a0010', '#400018'] : ['#4a4a64', '#2a2f44', '#1a1d2e']));
  // vanishing-point cabin: bins, windows, seats
  const vx = o.vx ?? W / 2, vy = o.vy ?? H * 0.38;
  s += P(`M0,0 L${W},0 L${vx + 60},${vy - 50} L${vx - 60},${vy - 50}Z`, d ? '#14060c' : '#6a6a80', 3);
  s += P(`M0,${H} L${W},${H} L${vx + 40},${vy + 40} L${vx - 40},${vy + 40}Z`, d ? '#1a0408' : '#3a2f4a', 3);
  for (let k = 0; k < 6; k++) { const t = k / 6, y = vy + 40 + (H - vy - 40) * (1 - Math.pow(1 - t, 2)); void y; }
  for (let i = 0; i < 9; i++) { const t = i / 9, xL = vx - 60 - (vx - 60) * Math.pow(1 - t, 1.6), xR = vx + 60 + (W - vx - 60) * Math.pow(1 - t, 1.6), y1 = vy - 50 - (vy - 50) * Math.pow(1 - t, 1.6); s += L(xL, y1, xL, y1 + 10, 2) + L(xR, y1, xR, y1 + 10, 2); }
  // seats rows receding left & right
  for (let r = 5; r >= 0; r--) {
    const t = r / 6, sc = 0.25 + (1 - t) * 0.9, cy = vy + 40 + (H - vy) * (1 - t) * 0.75;
    for (const side of [-1, 1]) {
      const cx = vx + side * (70 + (1 - t) * W * 0.32);
      const sw = 90 * sc, sh = 120 * sc;
      s += P(`M${cx - sw / 2},${cy} L${cx - sw / 2},${cy - sh} Q${cx},${cy - sh - 14 * sc} ${cx + sw / 2},${cy - sh} L${cx + sw / 2},${cy}Z`, d ? '#1a2244' : '#2f5aa8', 3) + Rect(cx - sw * 0.38, cy - sh * 0.95, sw * 0.76, sh * 0.25, d ? '#5a5a6a' : '#e8e8f0', 2);
      s += PF(`M${cx + side * sw * 0.1},${cy - sh} L${cx + side * sw / 2},${cy - sh} L${cx + side * sw / 2},${cy}L${cx + side * sw * 0.2},${cy}Z`, 'url(#hatch)', 'opacity=".5"');
    }
  }
  // windows
  for (let i = 0; i < 4; i++) { const t = i / 4, sc = 0.3 + (1 - t) * 0.7; for (const side of [-1, 1]) { const x = vx + side * (90 + (1 - t) * W * 0.4); s += Rect(x - 12 * sc, vy - 40 - 30 * (1 - t), 24 * sc, 30 * sc, d ? '#000' : '#0c1030', 2); } }
  s += halftoneRect(0, 0, W, H, d ? 'htr' : 'htp', d ? 0.25 : 0.2);
  return s;
}

// =====================================================================
// COVER
// =====================================================================
page('Cover', [[{
  vb: [600, 900], alt: 'Cover: Owen in his horned helmet raises Jon the glowing axe, with the Forest Giant and red-eyed penguins behind.',
  bg: '#1a0a3a',
  art: (W, H) => {
    let s = Rect(0, 0, W, H, lin(['#12083a', '#4a1a8a', '#c0306a', '#ff8a2a']));
    s += glowBlob(300, 470, 420, '#ffe08a', 0.55);
    s += speedLines(300, 430, 160, 900, 70, '#ffffff', 7, 4).replace(/<polygon/g, '<polygon opacity=".22"');
    s += halftoneRect(0, 0, W, H, 'htm', 0.35);
    // the Forest Giant looms
    s += G('translate(470 900) scale(1.05)', giant({ pose: 'reveal', ex: 'roar' })).replace(/fill="#6e4420"/g, 'fill="#3a1a4a"').replace(/fill="#3a2410"/g, 'fill="#1a0a2a"').replace(/fill="#4a8a3a"/g, 'fill="#2a3a5a"');
    s += Rect(0, 0, W, H, lin([[0, '#12083a', 0], [0.6, '#12083a', 0.15], [1, '#12083a', 0.55]]));
    // lightning off Jon
    const bolt = (d) => P(d, 'none', 10, 'stroke="#5fe8ff" opacity=".5" filter="url(#glow)"') + P(d, 'none', 3.5, 'stroke="#ffffff"');
    s += bolt('M300,170 L250,120 L270,110 L210,40 L230,34 L190,-10') + bolt('M330,170 L380,110 L364,104 L430,40 L414,34 L470,-10') + bolt('M300,180 L180,170 L196,156 L80,150');
    // Owen, hero pose from below
    s += owen({ x: 300, y: 835, s: 2.65, pose: 'hero', ex: 'grit', zombie: true, look: [0.6, -0.6], jon: { face: 'yell', aura: '#5fe8ff', s: 0.75, rot: -6 } });
    // penguins at his feet
    s += penguin({ x: 80, y: 900, s: 1.3, pose: 'lunge', seed: 2 }) + penguin({ x: 530, y: 905, s: 1.45, pose: 'lunge', flip: true, seed: 4 }) + penguin({ x: 470, y: 890, s: 0.8, pose: 'raise', seed: 6 });
    return s;
  },
  pop: (W, H) => {
    let s = '';
    // chrome logo
    const chrome = lin([[0, '#ffffff'], [0.42, '#bfe8ff'], [0.5, '#2a4a9a'], [0.58, '#5a8ad8'], [1, '#ffffff']]);
    const T = (t, x, y, sz, fill, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" font-family='${BANG_FONT}' font-size="${sz}" letter-spacing="3" fill="${fill}" ${extra}>${t}</text>`;
    s += G('rotate(-4 300 120)', T('JÖNTUKA', 312, 162, 132, '#ff3fa4', `stroke="${INK}" stroke-width="16" stroke-linejoin="round"`) + T('JÖNTUKA', 300, 150, 132, INK, `stroke="${INK}" stroke-width="18" stroke-linejoin="round"`) + T('JÖNTUKA', 300, 150, 132, chrome, `stroke="#ffffff" stroke-width="2"`) + T('JÖNTUKA', 300, 150, 132, 'url(#htw)', 'opacity=".25"'));
    s += G('rotate(-4 300 120)', P('M150,178 L460,178 L448,214 L138,214Z', '#c0182b', 4) + T('A VIKING TALE', 299, 207, 34, '#ffe14a', `stroke="${INK}" stroke-width="5" paint-order="stroke"`));
    // corner box
    s += Rect(14, 14, 92, 112, '#ffe14a', 4) + Rect(14, 14, 92, 30, INK, 0) + T('Nº 1', 60, 39, 26, '#ffe14a') + G('translate(40 120) scale(.42) rotate(-10)', axe({ face: 'grin' })) + T('NOV', 84, 116, 16, INK);
    // #1 burst
    s += burst(520, 300, 64, 58, '#ffe14a', 12, 0.3, 9) + `<text x="520" y="322" text-anchor="middle" font-family='${BANG_FONT}' font-size="64" fill="#ff3fa4" stroke="${INK}" stroke-width="6" paint-order="stroke" transform="rotate(10 520 300)">#1</text>`;
    // cover lines
    s += G('rotate(-3 120 690)', P('M20,640 L230,628 L236,700 L26,712Z', '#ffffff', 4) + textBlock(['FEATURING A', 'FLYING, TALKING,', 'SINGING AXE!'], 128, 668, 22, 22, BANG_FONT, INK, 400));
    s += Rect(0, H - 54, W, 54, INK) + textBlock(['WRITTEN BY OWEN · DRAWN IN THE WORLD OF THE GAME'], W / 2, H - 27, 22, 22, BANG_FONT, '#ffe14a', 400, 'middle', 'letter-spacing="1.5"');
    return s;
  },
}]], { cls: 'cover' });

// =====================================================================
// PAGE 1  (journal page 1)
// =====================================================================
page('Page 1: Get up, you oaf!', [
  [{
    vb: [640, 330], alt: 'Owen in bed as Jon the axe zooms in yelling.',
    art: (W, H) => {
      let s = bedroom(W, H, { wx: 450 });
      s += bed(40, 270, 360);
      s += speedLines(150, 200, 40, 120, 18, INK, 5, 2);
      s += G('translate(150 206) rotate(-80) scale(1.35)', owenHead({ ex: 'shock', zombie: true }));
      s += motionLines(520, 150, 140, 80, 9, -25, '#ffffff', 4);
      s += axe({ x: 470, y: 200, s: 1.05, rot: -25, face: 'yell', aura: '#5fe8ff' });
      return s;
    },
    text: (W) => caption({ x: 14, y: 14, w: 300, t: 'As I woke up, Jon yelled at me,', size: FW }) + balloon({ kind: 'yell', x: 470, y: 62, w: 190, t: 'Get up, you oaf!', tail: [492, 128], size: 30, seed: 4 }),
  }],
  [{
    vb: [420, 420], alt: 'Owen sits up, bleary, while Jon grins beside him.',
    art: (W, H) => {
      let s = bedroom(W, H, { wx: 250 });
      s += owenBust({ x: 140, y: 350, s: 1.6, ex: 'tired', zombie: true, look: [1, 0] });
      s += P('M0,330 Q140,300 300,340 L300,420 L0,420Z', '#3a5ab8', 3.5) + PF('M0,330 Q140,300 300,340 L300,420 L0,420Z', 'url(#hatch)', 'opacity=".3"');
      s += axe({ x: 320, y: 270, s: 0.95, rot: 12, face: 'grin', aura: '#5fe8ff' });
      s += sfx('Z', 60, 200, 30, { fill: '#bfe8ff', rot: -10 }) + sfx('z', 90, 170, 22, { fill: '#bfe8ff', rot: -10 });
      return s;
    },
    text: (W) => caption({ x: 12, y: 12, w: 396, t: 'Oh, I forgot to mention: Jon is a flying axe that can talk.', size: FH }),
  }, {
    vb: [420, 420], alt: 'Jon hops on piano keys playing Rush E while Owen covers his ears.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, lin(['#ff3fa4', '#ffb03a'])) + speedLines(220, 250, 40, 420, 36, '#ffe14a', 8, 7) + halftoneRect(0, 0, W, H, 'htm', 0.4);
      // the piano
      s += P('M10,280 L330,280 L330,420 L10,420Z', '#2a1a2a', 4) + P('M10,250 L330,250 L330,282 L10,282Z', '#3a2a3a', 4);
      for (let x = 14; x < 330; x += 20) s += Rect(x, 284, 18, 46, '#ffffff', 2);
      for (let x = 26; x < 320; x += 20) if ((x / 20 | 0) % 7 !== 2 && (x / 20 | 0) % 7 !== 6) s += Rect(x, 284, 10, 28, INK, 0);
      s += P('M120,190 L230,190 L224,250 L126,250Z', '#f4eedb', 3) + textBlock(['RUSH E'], 175, 210, 18, 18, BANG_FONT, INK, 400) + [224, 232, 240].map(y => L(132, y, 218, y, 1.2)).join('');
      s += axe({ x: 210, y: 210, s: 0.85, rot: -40, face: 'sing', aura: '#ffe14a' });
      s += musicNote(70, 170, 1, '#ffe14a', -10) + musicNote(320, 120, 0.8, '#5fe8ff', 12) + musicNote(110, 90, 0.7, '#ffffff', -20) + musicNote(360, 220, 0.9, '#ffe14a', 8);
      s += owenBust({ x: 370, y: 430, s: 0.9, ex: 'annoyed', zombie: true, flip: true });
      return s;
    },
    text: (W) => caption({ x: 12, y: 12, w: 396, t: "If you think that's weird, just know that he can recite Rush E note for note, from memory.", size: FH }) + sfx('PLINKA-PLINK-PLINK!', 170, 380, 34, { fill: '#5fe8ff', rot: -6 }),
  }],
  [{
    vb: [640, 380], alt: 'Long ago, inside a volcano, Walter the Wonderful hammers Jon on an anvil.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, rad([[0, '#fff2a0'], [0.25, '#ff9a2a'], [0.6, '#c0182b'], [1, '#2a0010']], 0.42, 0.62, 0.7));
      s += halftoneRect(0, 0, W, H, 'hto', 0.4);
      // cave mouth / volcano walls
      s += PF(`M0,0 L${W},0 L${W},120 Q560,60 500,150 Q470,90 400,110 L380,0 L250,0 Q200,80 120,60 Q60,140 0,110Z`, INK);
      s += PF(`M0,${H} L0,250 Q60,240 100,300 L150,${H}Z`, INK) + PF(`M${W},${H} L${W},260 Q580,250 540,320 L500,${H}Z`, INK);
      // lava river
      s += P(`M0,350 Q160,320 320,345 Q480,370 ${W},335 L${W},${H} L0,${H}Z`, lin(['#ffe14a', '#ff7a1a', '#c0182b']), 3);
      // Walter: the smith, in silhouette with a hot rim
      const walter = PF('M-60,0 L-50,-90 L-80,-170 Q-60,-230 0,-236 Q60,-230 80,-170 L50,-90 L60,0 L14,0 L8,-70 L-8,-70 L-14,0Z', INK) + C(0, -262, 34, INK, 0) + PF('M-30,-250 Q0,-180 30,-250 L36,-210 Q0,-150 -36,-210Z', INK);
      s += G('translate(200 360)', P('M-60,0 L-50,-90 L-80,-170 Q-60,-230 0,-236 Q60,-230 80,-170 L50,-90 L60,0', 'none', 8, 'stroke="#ffb03a" opacity=".9"') + walter + G('translate(50 -200) rotate(-150)', Rect(-12, 0, 24, 140, INK) + Rect(-40, 130, 80, 50, INK) + Rect(-40, 130, 80, 50, 'none', 3, 'stroke="#ffb03a"')) + C(14, -266, 4, '#ffe14a', 0) + C(-8, -266, 4, '#ffe14a', 0));
      // anvil and the newborn axe
      s += P('M300,300 L440,300 L420,330 L460,360 L280,360 L320,330Z', '#1a1020', 3, 'stroke="#ff9a2a"');
      s += P('M280,300 L470,300 L486,280 L300,280Z', '#2a1a2a', 3, 'stroke="#ff9a2a"');
      s += axe({ x: 390, y: 270, s: 0.7, rot: 90, face: 'excited', aura: '#ffe14a' });
      s += speedLines(330, 250, 20, 140, 22, '#fff2a0', 6, 11);
      return s;
    },
    text: (W, H) => caption({ x: 360, y: 14, w: 266, t: 'So, maybe a bizillion years ago, Jöntuka was forged in a volcano by Walter the Wonderful', size: FW - 2 }) + sfx('KRANNNG!', 250, 250, 64, { fill: '#ffe14a', rot: -8 }) + caption({ x: 18, y: 244, w: 300, t: "(I just call him that because I can't remember his actual name.)", size: FW - 4, rot: 1.5 }),
  }],
  [{
    vb: [420, 400], alt: 'At sunset a Viking man throws the axe into the lake.',
    art: (W, H) => {
      let s = fjord(W, H, { horizon: 230, sunX: 300, seed: 5 });
      s += P('M0,320 Q120,300 200,330 L0,400Z', '#c8a870', 3) + P('M0,400 L0,330 Q100,320 160,360 L180,400Z', '#a88850', 0);
      s += G('translate(110 340) scale(.62)', vikingSil({}));
      s += P('M150,190 Q260,60 320,300', 'none', 3, 'stroke="#ffffff" stroke-dasharray="10 9"');
      s += axe({ x: 252, y: 120, s: 0.32, rot: 140, face: 'shock' });
      s += burst(320, 312, 50, 30, '#bff6ff', 10, 0.45, 5) + E(320, 318, 40, 9, '#0a4a6a', 2);
      return s;
    },
    text: (W) => caption({ x: 12, y: 12, w: 396, t: 'Then, this Viking man threw it in a lake so only someone of Viking blood could pull it out.', size: FH }) + sfx('SPLOOSH!', 324, 380, 40, { fill: '#5fe8ff', rot: -4 }),
  }, {
    vb: [420, 400], alt: 'Owen dives into the lake to escape a crazed penguin swinging at him.',
    art: (W, H) => {
      let s = fjord(W, H, { horizon: 150, sunX: 60, seed: 8, sky: ['#2a1a6a', '#8a2a8a', '#ff6a5a'] });
      s += P('M0,250 Q90,230 150,270 L120,400 L0,400Z', '#c8a870', 3) + halftoneRect(0, 240, 150, 160, 'hto', 0.4);
      s += glowBlob(330, 330, 90, '#5fe8ff', 0.75);
      s += penguin({ x: 76, y: 290, s: 1.05, pose: 'raise', seed: 8 });
      s += motionLines(110, 160, 160, 80, 7, 30, INK, 9);
      s += owen({ x: 250, y: 300, s: 0.95, pose: 'dive', ex: 'scream', rot: -10, shadow: false });
      return s;
    },
    text: (W) => caption({ x: 12, y: 12, w: 396, t: 'And then I went to the lake and fell in to avoid being decapitated by a possessed/rabid/crazy penguin', size: FH - 2 }) + sfx('AK AK AK!', 90, 168, 34, { fill: '#ff3a4a', rot: -12 }) + caption({ x: 214, y: 336, w: 194, t: 'and Jon found me.', size: FH, rot: 1 }),
  }],
  [{
    vb: [640, 270], alt: 'Owen shakes his arm trying to fling Jon off, but Jon clings on happily.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, lin(['#ffe14a', '#ff9a2a'], 0, 0, 1, 0)) + halftoneRect(0, 0, W, H, 'htm', 0.35) + speedLines(470, 150, 30, 500, 40, '#ffffff', 7, 12);
      s += owen({ x: 470, y: 268, s: 1.05, pose: 'swing', p: { ra: [120, 30] }, ex: 'grit', zombie: true, jon: { face: 'grin', rot: 40 } });
      s += G('translate(470 0)', motionLines(-120, 40, 120, 90, 7, 0, INK, 2));
      s += P('M598,60 C606,48 622,52 616,66 L598,84 L580,66 C574,52 590,48 598,60Z', '#ff3fa4', 2.6);
      return s;
    },
    text: (W) => caption({ x: 14, y: 14, w: 300, t: 'Ever since, me and Jon have been mutual friends.', size: FW }) + caption({ x: 14, y: 128, w: 300, t: "(And by that I mean I've been trying to get rid of him but he keeps sticking to me.)", size: FW - 4, rot: 1 }) + sfx('SHAKE! SHAKE!', 470, 56, 40, { fill: '#ffffff', rot: 6 }),
  }],
]);

// =====================================================================
// PAGE 2  (journal page 2)
// =====================================================================
page('Page 2: TA DA!', [
  [{
    vb: [640, 330], alt: 'Jon drags Owen down the stairs by his tunic.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, lin(['#2a8a9a', '#1a4a6a'])) + halftoneRect(0, 0, W, H, 'htc', 0.4);
      for (let i = 0; i < 9; i++) s += P(`M${40 + i * 70},${60 + i * 30} L${110 + i * 70},${60 + i * 30} L${110 + i * 70},${H} L${40 + i * 70},${H}Z`, i % 2 ? '#7a4418' : '#8a5428', 3);
      s += L(20, 30, W, 300, 6, '#5a3418') + Array.from({ length: 9 }, (_, i) => L(60 + i * 70, 40 + i * 30, 60 + i * 70, 0, 4, '#5a3418')).join('');
      s += motionLines(60, 80, 220, 120, 10, 22, '#ffffff', 5);
      s += owen({ x: 300, y: 200, s: 0.95, pose: 'run', ex: 'shock', zombie: true, rot: 22, shadow: false });
      s += axe({ x: 430, y: 200, s: 0.75, rot: 70, face: 'excited', aura: '#ffe14a' });
      s += P('M378,124 Q404,140 420,170', 'none', 4);
      return s;
    },
    text: (W) => caption({ x: 14, y: 14, w: 330, t: 'Anyway, as I was saying last time, Jon woke me up and yelled me downstairs.', size: FW - 2 }) + balloon({ x: 200, y: 250, w: 120, t: 'What?', tail: [270, 205], size: FW }) + balloon({ x: 530, y: 80, w: 150, t: 'Just wait!', tail: [470, 150], size: FW }),
  }],
  [{
    vb: [640, 440], alt: 'TA DA! Jon shows off a wooden block he carved, on the kitchen table.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, rad([[0, '#fff6c0'], [0.35, '#ffd84a'], [0.7, '#ff7a3a'], [1, '#c0306a']], 0.5, 0.55, 0.75));
      s += speedLines(320, 260, 120, 700, 60, '#ffffff', 6, 13).replace(/<polygon/g, '<polygon opacity=".6"') + halftoneRect(0, 0, W, H, 'hto', 0.3);
      // table
      s += P('M40,330 L600,330 L640,380 L0,380Z', '#9a6030', 4) + Rect(0, 380, W, 16, '#5a3418', 3) + Rect(40, 396, 24, 60, '#5a3418', 3) + Rect(576, 396, 24, 60, '#5a3418', 3);
      // the carved block
      s += P('M120,190 L520,180 L540,330 L100,340Z', '#c8904a', 4.5) + P('M520,180 L556,200 L574,322 L540,330Z', '#8a5a28', 4) + PF('M520,180 L556,200 L574,322 L540,330Z', 'url(#hatch)', 'opacity=".6"');
      s += P('M120,190 L520,180 L556,200 L160,212Z', '#e0a868', 3.5);
      for (let i = 0; i < 6; i++) s += P(`M${130 + i * 60},${224 + i} Q${160 + i * 60},${280} ${130 + i * 60},${330}`, 'none', 1.4, 'stroke="#8a5a28"');
      s += `<g transform="rotate(-1.5 320 260)">${textBlock(["WORLD'S BEST OWNER", 'OF A FLYING AND', 'TALKING AXE', 'NAMED JON'], 322, 266, 30, 30, BANG_FONT, '#5a2a10', 400, 'middle', 'letter-spacing="1.5"')}</g>`;
      // wood chips
      const R = rng(31); for (let i = 0; i < 18; i++) { const x = 60 + R() * 520, y = 60 + R() * 200; s += P(`M${x},${y} l${8 + R() * 8},${-4 + R() * 8} l${-4},${8} Z`, '#e0a868', 2); }
      s += axe({ x: 560, y: 120, s: 0.9, rot: 28, face: 'excited', aura: '#5fe8ff' });
      return s;
    },
    pop: (W, H) => owenBust({ x: 70, y: 470, s: 1.25, ex: 'shock', zombie: true, look: [1, -0.3] }),
    text: (W) => balloon({ kind: 'yell', x: 330, y: 74, w: 230, t: 'TA DA!', tail: [500, 110], size: 52, seed: 21 }),
  }],
  [{
    vb: [420, 380], alt: 'Owen stares at the sign with an awkward smile. Jon waits.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, lin(['#7a4ab8', '#3a2a78'])) + halftoneRect(0, 0, W, H, 'htp', 0.5);
      s += owenBust({ x: 190, y: 360, s: 2.1, ex: 'awk', zombie: true, look: [-0.4, 0] });
      s += P('M318,170 Q326,186 318,196 Q308,186 318,170Z', '#bfe8ff', 2.4);
      return s;
    },
    text: (W) => caption({ x: 12, y: 12, w: 300, t: 'As I stared at it, I wondered what to say.', size: FH }) + balloon({ x: 350, y: 110, w: 90, t: 'Well?', tail: [420, 60], size: FH }) + balloon({ x: 300, y: 330, w: 190, t: 'Very nice of you Jon, I appreciate it.', tail: [240, 300], size: FH }),
  }, {
    vb: [420, 380], alt: 'Jon, thrilled, asks if the sign goes in their room. Owen says um, sure.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, lin(['#2ad0d8', '#1a6a9a'])) + speedLines(260, 230, 30, 400, 30, '#ffffff', 6, 3) + halftoneRect(0, 0, W, H, 'htc', 0.4);
      s += axe({ x: 210, y: 300, s: 1.5, rot: 8, face: 'excited', aura: '#ffe14a' });
      s += owenBust({ x: 380, y: 400, s: 0.95, ex: 'worried', zombie: true, flip: true });
      return s;
    },
    text: (W) => balloon({ x: 140, y: 64, w: 220, t: 'Are you gonna put it in our room?!?', tail: [250, 170], size: FH + 2 }) + caption({ x: 12, y: 290, w: 270, t: "I wasn't sure how it fit in the house, much less my living room.", size: FH - 3, rot: 1 }) + balloon({ kind: 'whisper', x: 352, y: 296, w: 90, t: 'Um, sure...', tail: [386, 350], size: FH - 2 }),
  }],
  [{
    vb: [420, 360], alt: 'Jon says they should get going. Owen asks, where exactly?',
    art: (W, H) => {
      let s = bedroom(W, H, { wx: 270 });
      s += owen({ x: 120, y: 350, s: 1.15, pose: 'think', ex: 'annoyed', zombie: true, look: [1, -0.4] });
      s += axe({ x: 300, y: 230, s: 0.85, rot: -10, face: 'smug' });
      return s;
    },
    text: (W) => balloon({ x: 300, y: 64, w: 190, t: 'Well, I think we should get going.', tail: [320, 170], size: FH }) + balloon({ x: 120, y: 160, w: 150, t: 'Get going to where exactly?', tail: [124, 196], size: FH - 2 }),
  }, {
    vb: [420, 360], alt: 'Jon in a spotlight: TO... (dramatic pause...)',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, INK) + P(`M150,0 L270,0 L380,${H} L40,${H}Z`, lin([['0', '#ffffff', 0.5], ['1', '#ffe14a', 0.15]]), 0);
      s += E(210, 330, 140, 20, '#ffe14a', 0, 'opacity=".25"');
      s += axe({ x: 200, y: 220, s: 1.0, rot: 0, face: 'smug' });
      return s;
    },
    text: (W) => balloon({ x: 210, y: 54, w: 200, t: 'TO...', tail: [240, 110], size: FH + 8 }) + caption({ x: 210, y: 292, w: 200, t: '(dramatic pause...)', size: FH, rot: -2 }),
  }],
  [{
    vb: [640, 360], alt: 'NORWAY! Owen screams WHAT?!',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, '#c0182b') + P(`M0,${H * 0.36} H${W} V${H * 0.64} H0Z`, '#ffffff', 0) + P(`M180,0 H300 V${H} H180Z`, '#ffffff', 0) + P(`M0,${H * 0.42} H${W} V${H * 0.58} H0Z`, '#1e2a8a', 0) + P(`M204,0 H276 V${H} H204Z`, '#1e2a8a', 0);
      s += speedLines(470, 200, 60, 600, 46, INK, 6, 21).replace(/<polygon/g, '<polygon opacity=".45"') + halftoneRect(0, 0, W, H, 'ht', 0.25);
      s += owenBust({ x: 480, y: 360, s: 2.0, ex: 'scream', zombie: true, look: [0, -1] });
      s += axe({ x: 110, y: 230, s: 0.85, rot: -20, face: 'excited', aura: '#ffe14a' });
      return s;
    },
    text: (W, H) => sfx('NORWAY!', 210, 108, 92, { fill: '#ffe14a', rot: -8 }) + balloon({ kind: 'yell', x: 470, y: 74, w: 140, t: 'WHAT?!?', tail: [480, 140], size: 38, seed: 33 }) + caption({ x: 14, y: 254, w: 330, t: 'Norway was where I got Jon, but also where I was killed and brought back to life.', size: FW - 3, rot: -1 }),
  }],
]);

// ---------- more props ----------
function airliner(o = {}) {
  let s = P('M-200,0 C-200,-30 -170,-40 -120,-40 L170,-40 C200,-40 220,-20 226,0 C220,16 200,20 170,20 L-150,20 C-180,20 -200,12 -200,0Z', lin(['#ffffff', '#e6eaf0', '#a8aeb8']), 4);
  s += P('M120,-40 L180,-110 L210,-110 L190,-40Z', '#c0392b', 4) + P('M-20,4 L60,4 L-10,70 L-50,70Z', '#c8ced8', 4) + P('M-10,-30 L40,-30 L-20,-70 L-40,-70Z', '#a8aeb8', 3);
  s += P('M-196,4 L220,4', 'none', 3, 'stroke="#c0392b"') + P('M-196,9 L218,9', 'none', 3, 'stroke="#2a4a8a"');
  for (let x = -150; x < 160; x += 18) s += Rect(x, -24, 9, 11, '#1e2a48', 1.5);
  s += P('M-196,-6 Q-186,-24 -160,-26 L-160,-12 L-194,-6Z', '#1e2a48', 2);
  s += PF('M-200,0 C-200,12 -180,20 -150,20 L170,20 C200,20 220,16 226,0Z', 'url(#hatch)', 'opacity=".35"');
  return G(`translate(${o.x || 0} ${o.y || 0}) rotate(${o.rot || 0}) scale(${o.s || 1})`, s);
}
function suitcase(x, y, s = 1, glow = false) {
  let g = (glow ? glowBlob(0, -30, 90, '#5fe8ff', 0.8) : '') + P('M-60,-70 L60,-70 L60,0 L-60,0Z', '#7a3a8a', 4) + PF('M10,-70 L60,-70 L60,0 L10,0Z', 'url(#hatch)', 'opacity=".5"') + P('M-20,-70 L-20,-86 L20,-86 L20,-70', 'none', 5) + Rect(-62, -40, 124, 8, '#2a1a3a', 2) + Rect(-40, -66, 22, 14, '#f4eedb', 2);
  return G(`translate(${x} ${y}) scale(${s})`, g);
}
function taxi(x, y, s = 1) {
  let g = P('M-110,0 L-110,-40 L-60,-44 L-30,-80 L50,-80 L80,-44 L120,-40 L120,0Z', '#ffd84a', 4) + PF('M10,-80 L50,-80 L80,-44 L120,-40 L120,0 L10,0Z', 'url(#hatch)', 'opacity=".35"');
  g += P('M-24,-74 L14,-74 L14,-46 L-50,-46Z', '#7ad0ff', 3) + P('M22,-74 L46,-74 L70,-46 L22,-46Z', '#7ad0ff', 3) + Rect(-20, -96, 40, 16, INK, 0) + textBlock(['TAXI'], 0, -88, 15, 15, BANG_FONT, '#ffd84a', 400);
  g += C(-62, 0, 22, INK, 0) + C(-62, 0, 9, '#9aa0ac', 2) + C(70, 0, 22, INK, 0) + C(70, 0, 9, '#9aa0ac', 2) + Rect(110, -34, 12, 10, '#fff2a0', 2);
  return G(`translate(${x} ${y}) scale(${s})`, g);
}
function lightbulb(x, y, s = 1) {
  return G(`translate(${x} ${y}) scale(${s})`, glowBlob(0, -20, 70, '#ffe14a', 0.9) + P('M-26,-30 C-26,-66 26,-66 26,-30 C26,-12 12,-4 10,10 L-10,10 C-12,-4 -26,-12 -26,-30Z', '#fff6b0', 4) + Rect(-11, 10, 22, 14, '#9aa0ac', 3) + P('M-8,-10 L-4,-30 L0,-14 L4,-30 L8,-10', 'none', 2.4) + [0, 1, 2, 3, 4, 5, 6].map(i => { const a = -Math.PI + i * Math.PI / 6; return L(Math.cos(a) * 40, -30 + Math.sin(a) * 40, Math.cos(a) * 56, -30 + Math.sin(a) * 56, 4); }).join(''));
}
function palace(x, y, s = 1) {
  let g = glowBlob(0, -80, 200, '#9fe8ff', 0.7);
  g += [[-110, 50, 150], [-50, 44, 210], [0, 60, 260], [50, 44, 210], [110, 50, 150]].map(([tx, w, h]) => P(`M${tx - w / 2},0 L${tx - w / 2},${-h} L${tx},${-h - 50} L${tx + w / 2},${-h} L${tx + w / 2},0Z`, '#dff4ff', 3) + PF(`M${tx},${-h - 50} L${tx + w / 2},${-h} L${tx + w / 2},0 L${tx + 4},0Z`, '#a8d0e8') + Rect(tx - 6, -h + 30, 12, 18, '#2a4a7a', 2) + P(`M${tx},${-h - 50} L${tx},${-h - 80} L${tx + 22},${-h - 72} L${tx},${-h - 64}`, '#ff2a3a', 2)).join('');
  return G(`translate(${x} ${y}) scale(${s})`, g);
}
const pageHead = (t, sub) => `<div class="pagehead"><span>${t}</span>${sub ? `<small>${sub}</small>` : ''}</div>`;

// =====================================================================
// PAGE 3  (journal page 3: how I died, a flashback)
// =====================================================================
page('Page 3: How I died', [
  [{
    vb: [640, 300], alt: 'Flashback: Owen runs along the lake beach from a screeching penguin.',
    art: (W, H) => {
      let s = fjord(W, H, { horizon: 120, sunX: 520, seed: 12, sky: ['#2a1a5a', '#6a2a8a', '#ff5a6a', '#ffc06a'] });
      s += P(`M0,190 Q320,170 ${W},200 L${W},${H} L0,${H}Z`, '#d8b878', 3) + halftoneRect(0, 185, W, 120, 'hto', 0.4);
      s += motionLines(200, 160, 200, 120, 12, 0, INK, 14);
      s += penguin({ x: 170, y: 290, s: 1.1, pose: 'lunge', seed: 12 });
      s += owen({ x: 440, y: 290, s: 0.95, pose: 'run', ex: 'scream', look: [-1, 0] });
      return s;
    },
    text: (W) => caption({ x: 14, y: 12, w: 300, t: 'Let me tell you the story of how I died.', size: FW }) + caption({ x: 330, y: 12, w: 296, t: 'So, basically, you know how when I said I was being chased by a penguin?', size: FW - 5, rot: 1 }) + sfx('AK AK AK!', 170, 156, 40, { fill: '#ff3a4a', rot: -10 }),
  }],
  [{
    vb: [640, 600], alt: 'Splash: Jon rockets Owen out of the lake on a pillar of water, like the Lady of the Lake.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, lin(['#1a0a4a', '#4a1a8a', '#c0306a', '#ff8a3a']));
      s += speedLines(380, 200, 80, 800, 64, '#ffffff', 5, 41).replace(/<polygon/g, '<polygon opacity=".3"') + halftoneRect(0, 0, W, H, 'htm', 0.3);
      s += mountains(W, 330, 130, '#2a1a50', 17, '#f0e0ff', 6);
      s += Rect(0, 440, W, 160, lin(['#1a8a9a', '#08284a']), 3) + halftoneRect(0, 440, W, 160, 'htc', 0.4);
      s += P('M0,470 Q60,450 130,480 L170,600 L0,600Z', '#d8b878', 3);
      s += penguin({ x: 80, y: 520, s: 0.85, pose: 'stand', seed: 4 });
      // the geyser
      s += P('M320,600 C330,480 340,380 350,300 C360,260 410,260 420,300 C430,380 440,480 460,600Z', lin(['#ffffff', '#9ff4ff', '#3fc8e8']), 4);
      s += P('M350,300 C300,280 280,240 300,220 C330,250 340,270 360,280 M420,300 C470,280 490,240 470,220 C440,250 430,270 410,280', '#dffcff', 3.5);
      const R = rng(9); for (let i = 0; i < 26; i++) { const a = -Math.PI * (0.1 + R() * 0.8), r = 70 + R() * 150; s += E(385 + Math.cos(a) * r, 270 + Math.sin(a) * r * 0.8, 6 + R() * 6, 9 + R() * 8, '#bff6ff', 2.4); }
      s += glowBlob(385, 200, 200, '#5fe8ff', 0.6);
      s += owen({ x: 385, y: 330, s: 1.1, pose: 'rise', ex: 'scream', look: [-1, -0.5], shadow: false, jon: { face: 'excited', aura: '#5fe8ff', s: 0.75 } });
      return s;
    },
    text: (W, H) => caption({ x: 14, y: 14, w: 290, t: 'Whenever I jumped into the lake, Jon found me and rocketed me out like the lady of the lake,', size: FW - 1 }) + sfx('KA-SPLOOOSH!', 410, 568, 48, { fill: '#5fe8ff', rot: -6 }) + caption({ x: 160, y: 470, w: 230, t: 'onto the shore where the penguin was waiting.', size: FW - 4, rot: 2 }),
  }],
  [{
    vb: [420, 380], alt: 'The penguin, utterly dumbfounded.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, lin(['#ffe14a', '#ff9a2a'])) + speedLines(210, 240, 60, 400, 34, '#ffffff', 7, 5) + halftoneRect(0, 0, W, H, 'hto', 0.4);
      s += penguin({ x: 210, y: 470, s: 3.2, pose: 'shock', aura: false });
      return s;
    },
    text: (W) => caption({ x: 12, y: 12, w: 396, t: 'Utterly dumbfounded when he saw me again though,', size: FH }) + sfx('?!', 340, 150, 70, { fill: '#ff3fa4', rot: 10 }),
  }, {
    vb: [420, 380], alt: 'Darkness. Only the penguin’s red eyes, and Owen’s helmet lying on the sand.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, '#0a0410') + halftoneRect(0, 0, W, H, 'htr', 0.15);
      s += glowBlob(170, 130, 50, '#ff2a3a', 0.9) + glowBlob(250, 130, 50, '#ff2a3a', 0.9) + E(170, 130, 18, 10, '#ff2a3a', 2) + E(250, 130, 18, 10, '#ff2a3a', 2);
      s += P('M140,104 L196,124', 'none', 7, 'stroke="#f4f4ff"') + P('M280,104 L224,124', 'none', 7, 'stroke="#f4f4ff"');
      s += P(`M0,300 Q210,280 ${W},310 L${W},${H} L0,${H}Z`, '#3a2a1a', 3);
      s += G('translate(300 330) rotate(20) scale(1.1)', PF('M-28,-14 C-28,-54 32,-54 32,-14Z', 'url(#helm)') + P('M-28,-14 C-28,-54 32,-54 32,-14Z', 'none', 3) + P('M-28,-17 L32,-17 L32,-9 L-28,-9Z', '#8a90a4', 3) + P('M-22,-26 C-42,-28 -54,-44 -50,-68 C-44,-52 -34,-44 -18,-40Z', OC.horn, 3));
      return s;
    },
    text: (W) => caption({ x: 12, y: 12, w: 300, t: 'he killed me', size: FH + 4 }) + caption({ x: 120, y: 180, w: 290, t: '(Not going into details about that).', size: FH - 2, rot: 1.5 }) + sfx('AK.', 330, 70, 34, { fill: '#ff3a4a', rot: 8 }),
  }],
  [{
    vb: [640, 360], alt: 'Jon blazes with runes and voodoo magic swirls around Owen lying on the beach.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, rad([[0, '#9dff6a'], [0.3, '#3a9a8a'], [0.7, '#4a1a8a'], [1, '#12063a']], 0.5, 0.45, 0.7)) + halftoneRect(0, 0, W, H, 'htp', 0.45);
      for (let i = 0; i < 4; i++) s += P(`M320,${160} m${-60 - i * 50},0 a${60 + i * 50},${40 + i * 30} 0 1 1 ${120 + i * 100},0 a${60 + i * 50},${40 + i * 30} 0 1 1 ${-120 - i * 100},0`, 'none', 6 - i, `stroke="${i % 2 ? '#9dff6a' : '#c08aff'}" stroke-dasharray="${30 - i * 4} ${14 + i * 6}" filter="url(#glow)" opacity=".85"`);
      s += P(`M0,290 Q320,270 ${W},300 L${W},${H} L0,${H}Z`, '#a88850', 3) + halftoneRect(0, 280, W, 80, 'ht', 0.3);
      s += G('translate(330 300) rotate(-90) scale(1.0)', owen({ pose: 'stand', ex: 'sleep', zombie: true, shadow: false }));
      s += axe({ x: 440, y: 150, s: 0.9, rot: 0, face: 'shock', aura: '#9dff6a' });
      s += RUNES.map((r, i) => G(`translate(${120 + i * 80} ${70 + (i % 2) * 30}) scale(1.8)`, P(r, 'none', 3, 'stroke="#9dff6a"'), 'filter="url(#glow)"')).join('');
      return s;
    },
    text: (W) => caption({ x: 14, y: 14, w: 350, t: 'Then Jon did some magic voodoo stuff and basically eternally bonded me with him.', size: FW - 2 }) + sfx('VOOOOOM!', 500, 250, 56, { fill: '#9dff6a', rot: -8 }),
  }],
  [{
    vb: [420, 460], alt: 'Zombie Owen rises and chops the shocked penguin into a puff of feathers.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, lin(['#2a1a6a', '#9dff6a'], 0, 0, 1, 1)) + speedLines(300, 250, 40, 500, 40, INK, 6, 51).replace(/<polygon/g, '<polygon opacity=".5"') + halftoneRect(0, 0, W, H, 'htp', 0.4);
      s += burst(310, 250, 120, 100, '#ffffff', 14, 0.4, 6);
      s += penguin({ x: 345, y: 270, s: 1.05, pose: 'shock', aura: false });
      const R = rng(7); for (let i = 0; i < 14; i++) { const x = 250 + R() * 140, y = 170 + R() * 140; s += P(`M${x},${y} q10,-14 20,0 q-10,6 -20,0Z`, '#f4f4ff', 2); }
      s += owen({ x: 140, y: 440, s: 1.25, pose: 'swing', ex: 'yell', zombie: true, glowEyes: true, jon: { face: 'yell', rot: 30, aura: '#9dff6a' } });
      return s;
    },
    text: (W) => caption({ x: 12, y: 10, w: 396, t: 'So, I got un-unalived and (with the help of Jon the flying, talking, and singing magical Viking axe)', size: FH - 2 }) + sfx('CHOP!', 320, 160, 60, { fill: '#ffe14a', rot: -10 }) + caption({ x: 150, y: 330, w: 262, t: 'I killed the penguin while he was shocked about me turning into an undead voodoo magic zombie on a lake beach in Norway.', size: FH - 6, rot: 1 }),
  }, {
    vb: [420, 460], alt: 'Night: zombie Owen lies wide awake while Jon makes penguin noises in the dark.',
    art: (W, H) => {
      let s = bedroom(W, H, { night: true, wx: 270 }) + Rect(0, 0, W, H, '#0a0820', 0, 'opacity=".45"');
      s += bed(30, 400, 300, '#2a3a7a');
      s += G('translate(130 340) rotate(-80) scale(1.25)', owenHead({ ex: 'shock', zombie: true }));
      s += axe({ x: 330, y: 230, s: 0.8, rot: 14, face: 'grin' }).replace(/<g /, '<g opacity=".95" ');
      s += Rect(250, 100, 170, 260, rad([[0, '#000', 0], [1, '#000', 0.6]]));
      return s;
    },
    text: (W) => caption({ x: 12, y: 10, w: 396, t: 'Ever since, Jon has been making penguin noises in the middle of the night to give me nightmares or wake me up.', size: FH - 2 }) + balloon({ kind: 'whisper', x: 300, y: 170, w: 120, t: 'ak... ak... AK...', tail: [340, 200], size: FH }),
  }],
], { head: pageHead('Flashback', 'Norway. The lake. The penguin.'), cls: 'flash' });

// =====================================================================
// PAGE 4  (journal page 4: Flight 364, part one)
// =====================================================================
page('Page 4: Flight 364', [
  [{
    vb: [640, 320], alt: 'Flight 364 climbs into the night. Below, Jon is packed in a checked bag.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, lin(['#0a0c24', '#1e2858', '#4a3a8a', '#8a4a9a'])) + halftoneRect(0, 0, W, H, 'htp', 0.3);
      const R = rng(3); for (let i = 0; i < 40; i++) s += C(R() * W, R() * 200, R() * 1.6 + 0.4, '#e8e8ff', 0);
      s += C(560, 60, 26, '#f2ecd0', 2) + C(572, 52, 22, '#1e2858', 0);
      for (let i = 0; i < 5; i++) s += E(80 + i * 150, 280 + (i % 2) * 20, 110, 30, '#3a4682', 3);
      s += motionLines(20, 110, 150, 60, 8, -10, '#ffffff', 31);
      s += airliner({ x: 300, y: 140, s: 1.05, rot: -10 });
      return s;
    },
    pop: (W, H) => G('translate(560 250)', C(0, 0, 76, '#1a1020', 5) + G('', glowBlob(0, 10, 70, '#5fe8ff', 0.6) + suitcase(0, 34, 0.75, false) + axe({ x: 30, y: -10, s: 0.36, rot: 30, face: 'worried' }))),
    text: (W) => caption({ x: 14, y: 14, w: 330, t: 'As I boarded the plane (Jon was in a checked bag down below) I tried not to think about my last time in Norway.', size: FW - 4 }) + sfx('Mmph!', 560, 190, 26, { fill: '#5fe8ff', rot: 8 }),
  }],
  [{
    vb: [420, 420], alt: 'The flight attendant makes the boarding announcement. Owen turns green.',
    art: (W, H) => {
      let s = cabin(W, H, { vx: 140 });
      s += attendant({ x: 130, y: 380, s: 1.2, pose: 'point' }).replace('rotate(-100)', 'rotate(-150)');
      s += G('translate(150 102)', Rect(-6, 0, 22, 34, INK, 2) + P('M16,10 Q40,10 40,40', 'none', 3));
      s += owenBust({ x: 330, y: 330, s: 1.2, ex: 'sick', zombie: true });
      s += P('M220,420 L220,372 Q300,350 420,372 L420,420Z', '#2f5aa8', 3);
      return s;
    },
    text: (W) => caption({ x: 12, y: 10, w: 220, t: 'When the announcer said', size: FH }) + balloon({ kind: 'radio', x: 280, y: 130, w: 200, t: 'Flight 364, New York to Norway. Now ending boarding.', tail: [170, 160], size: FH - 2 }) + caption({ x: 240, y: 360, w: 170, t: 'I almost puked.', size: FH, rot: 2 }),
  }, {
    vb: [420, 420], alt: 'She gives Owen an odd look.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, lin(['#c0306a', '#4a1a8a'])) + halftoneRect(0, 0, W, H, 'htm', 0.45);
      s += G('translate(210 220) scale(3.6)', attHead({ ex: 'odd' }));
      s += Rect(0, 360, W, 60, '#1e2a5a', 0) + P('M150,420 L210,370 L270,420Z', '#c0182b', 3);
      return s;
    },
    text: (W) => caption({ x: 12, y: 10, w: 300, t: 'She gave me an odd look.', size: FH }) + balloon({ x: 210, y: 368, w: 320, t: 'Refreshments will come around once we reach a steady flying level.', tail: [220, 300], size: FH - 2 }),
  }],
  [{
    vb: [640, 600], alt: 'Splash: the attendant smiles by Owen’s seat, but her shadow is a horned demon. DEMON!! his mind screams.',
    art: (W, H) => {
      let s = cabin(W, H, { vx: 230, vy: 200 });
      s += Rect(0, 0, W, H, '#600010', 0, 'opacity=".25"');
      // the shadow on the bulkhead
      s += PF('M150,560 L120,300 L80,220 L90,120 L130,160 L150,90 L190,130 L230,90 L250,160 L290,120 L300,220 L260,300 L230,560Z', '#1a0008', 'opacity=".9"') + glowBlob(170, 180, 18, '#ff2020', 1) + glowBlob(215, 180, 18, '#ff2020', 1);
      s += attendant({ x: 280, y: 590, s: 1.75, pose: 'tray' });
      s += P('M430,600 L430,420 Q530,380 640,420 L640,600Z', '#2f5aa8', 4) + PF('M540,400 L640,420 L640,600 L560,600Z', 'url(#hatch)', 'opacity=".5"');
      s += owenBust({ x: 540, y: 560, s: 1.55, ex: 'scream', zombie: true, look: [-1, -0.4] });
      return s;
    },
    text: (W, H) => caption({ x: 14, y: 14, w: 290, t: 'Then, she came by my seat,', size: FW }) + balloon({ kind: 'yell', x: 470, y: 120, w: 160, t: 'DEMON!!', tail: [540, 400], size: 46, seed: 13, fill: '#ffd0e0' }) + caption({ x: 410, y: 232, w: 200, t: 'my mind screamed,', size: FW - 4, rot: 2 }) + balloon({ x: 140, y: 300, w: 180, t: 'Is everything alright, sir?', tail: [250, 210], size: FW - 2 }) + balloon({ kind: 'whisper', x: 410, y: 340, w: 100, t: 'Yep...', tail: [480, 420], size: FW - 2 }) + caption({ x: 450, y: 548, w: 176, t: 'I stammered.', size: FW - 6, rot: -2 }),
  }],
], { head: pageHead('Flight 364', 'New York to Norway') });

// =====================================================================
// PAGE 5  (journal page 4, continued: the dream)
// =====================================================================
page('Page 5: Wonderful', [
  [{
    vb: [420, 380], alt: 'Owen falls asleep in his seat.',
    art: (W, H) => {
      let s = cabin(W, H, { dark: false, vx: 300 }) + Rect(0, 0, W, H, '#0a0820', 0, 'opacity=".45"');
      s += owenBust({ x: 200, y: 330, s: 1.5, ex: 'sleep', zombie: true, rot: -14 });
      s += P('M40,380 L40,342 Q200,316 360,342 L360,380Z', '#2f5aa8', 3);
      return s;
    },
    text: (W) => caption({ x: 12, y: 10, w: 396, t: 'I fell asleep once she left. My dreams were incredibly weird.', size: FH }) + sfx('Z', 330, 200, 44, { fill: '#bfe8ff', rot: -12 }) + sfx('z', 370, 160, 30, { fill: '#bfe8ff', rot: -12 }),
  }, {
    vb: [420, 380], alt: 'Dream: Owen has turned into a cow, still wearing his horned helmet.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, rad([['0', '#fff0ff'], ['0.6', '#ffb0e0'], ['1', '#a06ad0']])) + halftoneRect(0, 0, W, H, 'htm', 0.35);
      for (let i = 0; i < 7; i++) s += C(30 + i * 60, 360 - (i % 2) * 20, 40, '#ffffff', 3);
      s += cowOwen({ x: 190, y: 330, s: 1.25 });
      return s;
    },
    frames: null,
    text: (W) => caption({ x: 12, y: 10, w: 300, t: 'One was that I turned into a cow,', size: FH }) + sfx('MOO.', 340, 140, 54, { fill: '#ffffff', rot: 8 }),
  }],
  [{
    vb: [640, 360], alt: 'The dark cabin. The attendant leans in again. DEMON!? Owen’s mind screams. Eh, he says.',
    art: (W, H) => {
      let s = cabin(W, H, { dark: true, vx: 200, vy: 140 });
      s += attendant({ x: 150, y: 560, s: 1.6, pose: 'tray' }).replace(/#ecd2c0/g, '#d8c8c8');
      s += owenBust({ x: 520, y: 400, s: 1.45, ex: 'tired', zombie: true, look: [-1, 0] });
      return s;
    },
    text: (W) => caption({ x: 14, y: 14, w: 230, t: 'and the other was', size: FW }) + balloon({ kind: 'yell', x: 500, y: 64, w: 140, t: 'DEMON!?', tail: [530, 230], size: 34, seed: 8, fill: '#ffd0e0' }) + caption({ x: 300, y: 120, w: 220, t: 'my mind screamed again.', size: FW - 4, rot: 2 }) + balloon({ x: 420, y: 216, w: 60, t: 'Eh.', tail: [480, 270], size: FW - 2 }) + balloon({ x: 190, y: 250, w: 160, t: 'Any refreshments, sir?', tail: [160, 200], size: FW - 3 }) + balloon({ x: 400, y: 312, w: 150, t: "Nah, I'm good.", tail: [470, 330], size: FW - 4 }) + caption({ x: 14, y: 312, w: 210, t: 'we conversed.', size: FW - 4, rot: -1 }),
  }],
  [{
    vb: [640, 640], alt: 'Splash: her nails grow into talons and her teeth into fangs. Wonderful, she hisses.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, rad([[0, '#ff2a3a'], [0.4, '#8a0020'], [1, '#12000a']], 0.5, 0.4, 0.75));
      s += speedLines(320, 260, 90, 700, 60, INK, 8, 66) + halftoneRect(0, 0, W, H, 'htr', 0.35);
      s += attendant({ x: 320, y: 700, s: 2.5, demon: true });
      return s;
    },
    pop: (W, H) => G(`translate(${W - 120} ${H - 20})`, owenBust({ s: 1.2, ex: 'scream', zombie: true, look: [-1, -1], flip: true })),
    text: (W) => caption({ x: 14, y: 14, w: 236, t: 'Then, her nails grew into talons, her teeth into fangs.', size: FW }) + sfx('SKREEEK!', 140, 470, 56, { fill: '#9dff6a', rot: -12 }) + balloon({ x: 520, y: 80, w: 160, t: 'Wonderful,', tail: [370, 140], size: FW + 4, fill: '#ffe0e0' }) + caption({ x: 450, y: 140, w: 170, t: 'she hissed.', size: FW - 4, rot: 2 }),
  }],
  [{
    vb: [640, 260], alt: 'Owen yells down at the floor of the plane, trying to call Jon in the cargo hold.',
    frames: [
      { d: 'M0,0 L400,0 L360,260 L0,260Z', art: (W, H) => Rect(0, 0, W, H, lin(['#ffe14a', '#ff7a3a'])) + speedLines(200, 180, 30, 400, 34, '#ffffff', 7, 71) + halftoneRect(0, 0, W, H, 'hto', 0.4) + owenBust({ x: 210, y: 290, s: 1.5, ex: 'yell', zombie: true, look: [0, 1], rot: 10 }) },
      { d: 'M414,0 L640,0 L640,260 L374,260Z', art: (W, H) => Rect(0, 0, W, H, '#140a24') + halftoneRect(0, 0, W, H, 'htc', 0.25) + suitcase(520, 220, 1.0, true) + axe({ x: 560, y: 120, s: 0.5, rot: 20, face: 'shock', aura: '#5fe8ff' }) },
    ],
    text: (W) => caption({ x: 14, y: 14, w: 200, t: 'I tried to call Jon.', size: FW }) + balloon({ kind: 'yell', x: 300, y: 80, w: 120, t: 'JON!!', tail: [240, 160], size: 34, seed: 3 }),
  }],
]);

// =====================================================================
// PAGE 6  (journal page 5: chapter two)
// =====================================================================
page('Page 6: Chapter Two', [
  [{
    vb: [640, 440], alt: 'Norway at sunset. The perfectly normal flight attendant points Owen to the subway.',
    art: (W, H) => {
      let s = fjord(W, H, { horizon: 250, sunX: 480, seed: 21, sky: ['#3a4a8a', '#6a5a9a', '#c8708a', '#f8c070'], water: ['#5a5a62', '#3a3a42', '#2a2a32'] });
      s += Rect(0, 250, W, H - 250, '#3a6a3a', 3) + P(`M200,252 L440,252 L640,${H} L0,${H}Z`, '#5a5a62', 3);
      for (let i = 0; i < 6; i++) s += Rect(316, 262 + i * 20, 8, 10, '#ffffff', 0);
      s += attendant({ x: 530, y: 420, s: 1.05, pose: 'point', flip: true });
      s += owen({ x: 370, y: 420, s: 0.9, pose: 'stand', ex: 'annoyed', zombie: true, look: [1, 0] }) + suitcase(440, 420, 0.6);
      return s;
    },
    text: (W) => sfx('CHAPTER TWO', 470, 64, 56, { fill: '#ffe14a', rot: -3 }) + caption({ x: 14, y: 14, w: 300, t: 'When I got off the plane, the perfectly normal (it was a dream) flight attendant sent me off to the nearby subway station', size: FW - 5 }) + caption({ x: 14, y: 196, w: 290, t: 'where I could exchange U.S. dollars for kroner and hitch a ride for the forest to search for a palace filled with penguins (I know, right?) and destroy it.', size: FW - 7, rot: 1 }),
  }],
  [{
    vb: [420, 400], alt: 'At the subway station Owen works an exchange machine. KA-CHING!',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, '#dfe8e4');
      for (let y = 0; y < H; y += 24) for (let x = (y / 24 % 2) * 12; x < W; x += 24) s += Rect(x, y, 23, 23, '#eef4f0', 0);
      s += Rect(0, 140, W, 26, '#1a8a5a', 2) + textBlock(['T-BANE'], 340, 153, 18, 18, BANG_FONT, '#ffffff', 400) + Rect(0, 330, W, 70, '#5a5a62', 3);
      s += P('M60,330 L60,170 L200,170 L200,330Z', '#2a4a8a', 4) + Rect(76, 186, 108, 54, '#9ff4ff', 3) + textBlock(['USD → KR'], 130, 213, 18, 18, BANG_FONT, INK, 400) + Rect(110, 260, 40, 8, INK) + Rect(96, 290, 70, 22, '#1a1020', 3);
      const R = rng(4); for (let i = 0; i < 9; i++) s += E(110 + R() * 70, 315 + R() * 30, 9, 9, '#ffd84a', 2.4) + L(106 + R() * 70, 310 + R() * 30, 110 + R() * 70, 318 + R() * 30, 1);
      s += owen({ x: 300, y: 392, s: 1.05, pose: 'point', flip: true, ex: 'smirk', zombie: true });
      return s;
    },
    text: (W) => caption({ x: 12, y: 10, w: 396, t: 'When I got to the subway station, I found one of those exchangy doohickeys and worked it for a couple hundred kroner', size: FH - 2 }) + sfx('KA-CHING!', 130, 160, 44, { fill: '#ffe14a', rot: -8 }),
  }, {
    vb: [420, 400], alt: 'A taxi races toward the forest.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, lin(['#ff9a5a', '#c0306a', '#4a1a8a'])) + halftoneRect(0, 0, W, H, 'htm', 0.35);
      s += forestRow(W, 260, 150, 8, '#1f3a3a', '#0e2020', 9, 2);
      s += Rect(0, 280, W, 120, '#3a3a48', 3) + Rect(0, 334, W, 6, '#ffd84a', 0);
      s += motionLines(-40, 200, 300, 120, 14, 0, '#ffffff', 41);
      s += taxi(260, 340, 1.3);
      s += owenBust({ x: 262, y: 290, s: 0.5, ex: 'happy', zombie: true });
      return s;
    },
    text: (W) => caption({ x: 12, y: 10, w: 300, t: '(some of which I used for an uber/taxicab).', size: FH }) + sfx('VROOOM!', 120, 380, 44, { fill: '#ffe14a', rot: -6 }),
  }],
  [{
    vb: [640, 330], alt: 'Owen trudges through the muck of the forest floor.',
    art: (W, H) => {
      let s = forestBG(W, H, { seed: 3, floor: '#4a3418' });
      s += owen({ x: 320, y: 300, s: 1.05, pose: 'trudge', ex: 'annoyed', zombie: true });
      s += P('M260,300 Q240,280 250,270 M380,300 Q400,280 392,268', 'none', 4, 'stroke="#2a1a0a"') + [[250, 266], [395, 262], [230, 288], [410, 284]].map(([x, y]) => E(x, y, 6, 4, '#2a1a0a', 2)).join('');
      return s;
    },
    text: (W) => caption({ x: 14, y: 14, w: 330, t: 'Once I got to the forest, I trudged through the muck and grime on the floor.', size: FW - 2 }) + sfx('SQUELCH!', 150, 300, 40, { fill: '#c8a060', rot: -6 }) + sfx('SQUELCH!', 520, 290, 40, { fill: '#c8a060', rot: 6 }) + caption({ x: 430, y: 130, w: 196, t: 'After about 2 hours of this,', size: FW - 4, rot: 2 }),
  }],
  [{
    vb: [420, 400], alt: 'A huge log blocks the path: too high to step over, too low to duck under.',
    art: (W, H) => {
      let s = forestBG(W, H, { seed: 8, shafts: true });
      s += P('M-10,200 L430,190 L430,320 L-10,330Z', '#6e4420', 4) + PF('M-10,280 L430,270 L430,320 L-10,330Z', 'url(#xhatch)', 'opacity=".5"');
      for (let i = 0; i < 8; i++) s += P(`M${i * 60},${204} Q${i * 60 + 20},${260} ${i * 60 - 4},${324}`, 'none', 2);
      s += E(200, 250, 30, 7, '#3a2410', 2.4) + L(176, 250, 224, 250, 2);   // a knot that looks a lot like a shut eye
      s += owen({ x: 330, y: 390, s: 0.75, pose: 'think', ex: 'think', zombie: true, look: [-1, -1] });
      return s;
    },
    text: (W) => caption({ x: 12, y: 10, w: 396, t: 'I got to a log that was too high to step over and too low to duck under.', size: FH }) + sfx('TOO HIGH', 110, 176, 26, { fill: '#ffffff', rot: -4 }) + sfx('TOO LOW', 110, 366, 26, { fill: '#ffffff', rot: 3 }),
  }, {
    vb: [420, 400], alt: 'Jon bursts out of the bag: Hello Señor!',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, lin(['#5fe8ff', '#2a6ad8'])) + speedLines(250, 200, 40, 400, 40, '#ffffff', 7, 33) + halftoneRect(0, 0, W, H, 'htc', 0.4);
      s += suitcase(110, 400, 1.2, true) + P('M40,316 L180,316 L200,280 L20,280Z', '#7a3a8a', 3);
      s += axe({ x: 250, y: 200, s: 1.15, rot: 16, face: 'excited', aura: '#ffe14a' });
      s += owenBust({ x: 370, y: 420, s: 0.9, ex: 'tired', flip: true, zombie: true });
      return s;
    },
    text: (W) => caption({ x: 12, y: 10, w: 220, t: 'Naturally, Jon took this as a golden opportunity and flew out', size: FH - 4 }) + balloon({ kind: 'yell', x: 330, y: 70, w: 140, t: 'HELLO SEÑOR!', tail: [300, 150], size: FH + 2, seed: 9 }) + balloon({ x: 120, y: 160, w: 170, t: "Ooh, that's a big log, want me to chop it?", tail: [210, 180], size: FH - 3 }) + balloon({ kind: 'whisper', x: 300, y: 300, w: 60, t: 'Jon...', tail: [350, 330], size: FH }),
  }],
], { head: pageHead('Chapter Two', 'The Forest') });

// =====================================================================
// PAGE 7  (journal page 6: the Forest Giant of the North)
// =====================================================================
page('Page 7: The Forest Giant of the North', [
  [{
    vb: [640, 280], alt: 'Two red eyes open in the log.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, '#14301e') + P('M-10,60 L650,40 L650,250 L-10,270Z', '#6e4420', 4) + PF('M-10,200 L650,190 L650,250 L-10,270Z', 'url(#xhatch)', 'opacity=".5"');
      for (let i = 0; i < 12; i++) s += P(`M${i * 60},${54} Q${i * 60 + 20},${150} ${i * 60 - 4},${264}`, 'none', 2);
      s += G('translate(330 150) scale(1.4)', PF('M-80,-40 Q0,-10 80,-40 L80,30 L-80,30Z', INK) + glowBlob(-40, 0, 40, '#ff3030', 0.9) + glowBlob(40, 0, 40, '#ff3030', 0.9) + P('M-62,0 Q-40,-12 -18,0 Q-40,10 -62,0Z', '#ff3030', 2.4) + P('M18,0 Q40,-12 62,0 Q40,10 18,0Z', '#ff3030', 2.4));
      s += owenBust({ x: 70, y: 300, s: 0.95, ex: 'shock', zombie: true }) + axe({ x: 590, y: 200, s: 0.55, rot: -10, face: 'shock' });
      return s;
    },
    text: (W) => balloon({ kind: 'whisper', x: 100, y: 40, w: 90, t: 'Jon...', tail: [80, 120], size: FW }) + caption({ x: 160, y: 18, w: 120, t: 'I stutter.', size: FW - 6 }) + balloon({ x: 520, y: 50, w: 170, t: 'What, Señor? Oh...', tail: [580, 140], size: FW - 2 }) + sfx('CREEEAK', 330, 260, 34, { fill: '#c8a060', rot: -2 }),
  }],
  [{
    vb: [640, 820], alt: 'Splash: a 50-foot Forest Giant rises out of the log, club raised. Owen and Jon are tiny at his feet.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, lin(['#0a1a2a', '#1a4a4a', '#5a8a3a', '#c8e070']));
      s += speedLines(320, 820, 200, 1100, 70, '#ffffff', 4, 77).replace(/<polygon/g, '<polygon opacity=".18"') + halftoneRect(0, 0, W, H, 'htc', 0.2);
      s += forestRow(W, 760, 360, 7, '#14403a', '#0a2620', 5, 2);
      s += giant({ x: 330, y: 790, s: 1.18, pose: 'reveal', ex: 'roar' });
      s += Rect(0, 740, W, 80, '#4a3418', 3) + halftoneRect(0, 740, W, 80, 'ht2', 0.4);
      s += owen({ x: 250, y: 808, s: 0.42, pose: 'stand', ex: 'shock', zombie: true, look: [0, -1] }) + axe({ x: 300, y: 770, s: 0.2, face: 'shock' });
      return s;
    },
    text: (W, H) => caption({ x: 14, y: 14, w: 270, t: 'In front of us was a 50 ft tall Forest Giant.', size: FW + 2 }) + balloon({ kind: 'yell', x: 470, y: 120, w: 240, t: 'Who awakens the Forest Giant of the NORTH?!', tail: [380, 220], size: FW + 1, seed: 17 }) + caption({ x: 14, y: 250, w: 240, t: 'These guys are known for hiding as trees and logs, and they absolutely HATE humans due to our ability to chop down trees, which these guys basically worship to the greatest amount.', size: FW - 9, rot: -1 }) + caption({ x: 400, y: 470, w: 226, t: 'Oh they also have a club the size of a narrow building.', size: FW - 7, rot: 1.5 }) + sfx('RRRUMBLE', 470, 790, 46, { fill: '#c8a060', rot: -4 }),
  }],
  [{
    vb: [420, 400], alt: 'Looking down from the giant: tiny Owen says they were looking for Jjorvic Palace.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, '#4a3418') + halftoneRect(0, 0, W, H, 'ht2', 0.35);
      const R = rng(12); for (let i = 0; i < 12; i++) s += E(R() * W, R() * H, 30 + R() * 40, 8, '#2a1a0a', 0, 'opacity=".6"');
      s += PF('M0,0 L140,0 Q120,120 60,180 L0,200Z', '#0a0604', 'opacity=".7"');
      s += owen({ x: 230, y: 320, s: 0.7, pose: 'shrug', ex: 'awk', zombie: true, look: [0, -1] }) + axe({ x: 300, y: 270, s: 0.35, face: 'worried' });
      return s;
    },
    text: (W) => balloon({ x: 230, y: 70, w: 220, t: 'Um, we were looking for JJORVIC palace.', tail: [228, 160], size: FH }) + caption({ x: 250, y: 344, w: 160, t: 'I say.', size: FH - 2, rot: 1 }),
  }, {
    vb: [420, 400], alt: 'The giant’s face leans close: the penguins told me about you. Gulp.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, lin(['#ff3a4a', '#4a0a2a'])) + speedLines(210, 220, 60, 400, 30, INK, 6, 19).replace(/<polygon/g, '<polygon opacity=".5"');
      s += giantHead({ x: 210, y: 220, s: 1.9, ex: 'glare' });
      return s;
    },
    text: (W) => balloon({ x: 140, y: 56, w: 220, t: 'Ah, the penguins told me about you.', tail: [200, 130], size: FH }) + sfx('GULP.', 340, 340, 44, { fill: '#ffe14a', rot: 8 }) + caption({ x: 12, y: 330, w: 220, t: "That wasn't good.", size: FH - 2, rot: -1 }),
  }],
  [{
    vb: [420, 360], alt: 'Jon whispers: can we get to the big boss fight scene please? Owen, through pursed lips: later, Jon.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, lin(['#2ad0d8', '#7a4ab8'])) + halftoneRect(0, 0, W, H, 'htc', 0.4);
      s += owenBust({ x: 140, y: 345, s: 1.6, ex: 'pursed', zombie: true, look: [1, 0] });
      s += axe({ x: 330, y: 230, s: 0.9, rot: -14, face: 'excited' });
      return s;
    },
    text: (W) => balloon({ x: 300, y: 70, w: 200, t: 'Señor, can we get to the big boss fight scene please?', tail: [330, 140], size: FH - 3 }) + balloon({ kind: 'whisper', x: 100, y: 110, w: 110, t: 'Later, Jon', tail: [140, 200], size: FH }) + caption({ x: 12, y: 300, w: 230, t: 'I say through my currently pursed lips.', size: FH - 5, rot: -1 }),
  }, {
    vb: [420, 360], alt: 'The giant raises his club. Its shadow falls over Owen and Jon.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, lin(['#c8e070', '#3a6a3a'])) + halftoneRect(0, 0, W, H, 'ht', 0.25);
      s += G('translate(210 420) scale(.62)', giant({ pose: 'swing', ex: 'roar' })).replace(/fill="#6e4420"/g, 'fill="#1a1020"').replace(/fill="#3a2410"/g, 'fill="#0a0410"').replace(/fill="#4a8a3a"/g, 'fill="#1a1020"');
      s += Rect(0, 290, W, 70, '#0a0410', 0, 'opacity=".55"');
      s += owen({ x: 330, y: 355, s: 0.42, pose: 'stand', ex: 'shock', zombie: true }) + axe({ x: 370, y: 320, s: 0.18, face: 'shock' });
      return s;
    },
    text: (W) => caption({ x: 12, y: 10, w: 300, t: 'The giant raises his club.', size: FH + 2 }) + sfx('WHOOOM', 300, 120, 44, { fill: '#ffe14a', rot: 10 }),
  }],
]);

// =====================================================================
// PAGE 8  (journal page 7: a blur)
// =====================================================================
const blurFrames = [
  { d: 'M0,0 L330,0 L300,190 L0,190Z', t: 'The giant swings,', art: (W, H) => Rect(0, 0, W, H, lin(['#ff7a3a', '#c0306a'])) + halftoneRect(0, 0, W, H, 'hto', 0.4) + motionLines(20, 40, 260, 120, 12, 30, '#ffffff', 2) + G('translate(170 110) rotate(-60) scale(.38)', club({})) + sfx('WHOOSH!', 210, 170, 32, { fill: '#ffe14a', rot: -6 }) },
  { d: 'M344,0 L640,0 L640,190 L314,190Z', t: 'I dodge,', art: (W, H) => Rect(0, 0, W, H, lin(['#5fe8ff', '#2a6ad8'])) + halftoneRect(0, 0, W, H, 'htc', 0.4) + motionLines(360, 60, 200, 100, 10, 0, '#ffffff', 5) + owen({ x: 520, y: 200, s: 0.7, pose: 'dodge', ex: 'shock', zombie: true, look: [-1, -1] }) },
  { d: 'M0,204 L298,204 L270,404 L0,404Z', t: 'I swing,', art: (W, H) => Rect(0, 0, W, H, lin(['#9dff6a', '#2a8a5a'])) + halftoneRect(0, 0, W, H, 'ht', 0.25) + speedLines(150, 300, 30, 300, 26, '#ffffff', 6, 8) + owen({ x: 140, y: 400, s: 0.75, pose: 'swing', ex: 'yell', zombie: true, jon: { face: 'yell', rot: 70 } }) },
  { d: 'M312,204 L640,204 L640,404 L284,404Z', t: 'I miss,', art: (W, H) => Rect(0, 0, W, H, lin(['#ffe14a', '#c89a18'])) + halftoneRect(0, 0, W, H, 'hto', 0.3) + G('translate(520 600) scale(.55)', giant({ pose: 'rest', ex: 'smile' })) + axe({ x: 360, y: 350, s: 0.4, rot: 120, face: 'worried' }) + sfx('WHIFF', 400, 270, 40, { fill: '#ffffff', rot: 8 }) },
  { d: 'M0,418 L268,418 L240,620 L0,620Z', t: 'Jon sings,', art: (W, H) => Rect(0, 0, W, H, lin(['#ff3fa4', '#7a3cff'])) + halftoneRect(0, 0, W, H, 'htm', 0.4) + axe({ x: 130, y: 540, s: 0.6, rot: -10, face: 'sing', aura: '#ffe14a' }) + musicNote(60, 490, 0.8, '#ffe14a', -12) + musicNote(220, 480, 0.7, '#5fe8ff', 14) + musicNote(200, 580, 0.6, '#ffffff', 6) },
  { d: 'M282,418 L640,418 L640,620 L254,620Z', t: 'I tell him to be quiet,', art: (W, H) => Rect(0, 0, W, H, lin(['#7a4ab8', '#2a1a5a'])) + halftoneRect(0, 0, W, H, 'htp', 0.4) + owenBust({ x: 470, y: 640, s: 1.3, ex: 'yell', zombie: true, look: [-1, 0] }) + axe({ x: 330, y: 560, s: 0.4, rot: -10, face: 'sing' }) },
];
const BY = 64;
const shiftD = d => d.replace(/(-?\d+),(-?\d+)/g, (m, x, y) => `${x},${+y + BY}`);
page('Page 8: A blur', [
  [{
    vb: [640, 620 + BY], alt: 'A blur of panels: the giant swings, Owen dodges, swings, misses, Jon sings, Owen tells him to be quiet.',
    frames: blurFrames.map(f => ({ d: shiftD(f.d), art: (W, H) => G(`translate(0 ${BY})`, f.art(W, H)) })),
    text: (W) => caption({ x: 60, y: 8, w: 520, t: 'Those next few minutes were a blur to me.', size: FW, rot: -1 }) + G(`translate(0 ${BY})`, blurFrames.map((f, i) => { const m = /M(\d+),(\d+)/.exec(f.d); return caption({ x: +m[1] + 10, y: +m[2] + 10, w: i === 5 ? 230 : 190, t: f.t, size: FW - 4, rot: i % 2 ? 1 : -1 }); }).join('') + balloon({ kind: 'yell', x: 520, y: 500, w: 90, t: 'QUIET!', tail: [480, 545], size: 26, seed: 5 }) + caption({ x: 14, y: 560, w: 150, t: 'and so on.', size: FW - 4, rot: 2 })),
  }],
  [{
    vb: [420, 420], alt: 'Exhausted, Owen makes the time-out T. The giant roars and keeps coming.',
    art: (W, H) => {
      let s = forestBG(W, H, { seed: 14 }) + Rect(0, 0, W, H, '#600010', 0, 'opacity=".25"');
      s += G('translate(330 620) scale(.62)', giant({ pose: 'swing', ex: 'roar' }));
      s += owen({ x: 120, y: 410, s: 0.95, pose: 'timeout', ex: 'tired', zombie: true });
      return s;
    },
    text: (W) => caption({ x: 12, y: 10, w: 396, t: 'When I felt tired, I accidentally made the time-out signal, which I guess is a sign of war for giants, so he didn\'t stop.', size: FH - 3 }) + sfx('RAAAH!', 310, 230, 50, { fill: '#ff3a4a', rot: 8 }),
  }, {
    vb: [420, 420], alt: 'A lightbulb moment for Owen.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, rad([[0, '#fff6c0'], [0.5, '#ffd84a'], [1, '#ff7a3a']])) + speedLines(210, 160, 60, 400, 40, '#ffffff', 7, 23);
      s += owenBust({ x: 210, y: 470, s: 2.0, ex: 'think', zombie: true, look: [0.4, -1] });
      s += lightbulb(300, 170, 1.0);
      return s;
    },
    text: (W) => caption({ x: 12, y: 10, w: 300, t: 'Just then, a hint of knowledge came to my noggin.', size: FH }) + sfx('DING!', 110, 180, 50, { fill: '#ffffff', rot: -10 }),
  }],
  [{
    vb: [640, 560], alt: 'Owen’s notebook diagram of the giant war: North and East against South and West.',
    bg: '#f4eedb',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, '#f4eedb');
      for (let y = 30; y < H; y += 30) s += L(0, y, W, y, 1.2, '#8fb2de');
      s += L(52, 0, 52, H, 2, '#e0525a');
      const head = (x, y, lab, col, ex) => G(`translate(${x} ${y}) scale(.36)`, giantHead({ ex, moss: col, mossL: col })) + textBlock([lab], x, y + 82, 22, 22, BANG_FONT, INK, 400);
      s += head(150, 150, 'NORTH', '#4a8a3a', 'smile') + head(300, 150, 'EAST (KNÖRVIC)', '#3a8aa8', 'smile');
      s += head(470, 150, 'SOUTH', '#c89a40', 'glare') + head(590, 150, 'WEST', '#c0504a', 'glare');
      s += P('M84,40 Q225,20 376,40 L376,250 Q225,266 84,250Z', 'none', 3, 'stroke="#1d2a5a" stroke-dasharray="8 6"');
      s += P('M429,40 Q520,20 636,40 L636,250 Q520,266 429,250Z', 'none', 3, 'stroke="#c0182b" stroke-dasharray="8 6"');
      s += P('M225,92 C233,78 251,82 245,98 L227,116 L209,98 C203,82 221,78 225,92Z', '#ff3fa4', 2.4);
      s += burst(403, 150, 34, 28, '#ffe14a', 10, 0.35, 3) + textBlock(['VS'], 403, 150, 26, 26, BANG_FONT, '#c0182b', 400);
      return s;
    },
    text: (W, H) => caption({ x: 66, y: 276, w: 300, t: 'I remembered that the north giants literally despised the south giants, and the same with the east and west, so they had a war in which north sided with east, and south sided with west.', size: 21, rot: -1 }) + caption({ x: 384, y: 300, w: 244, t: 'Ever since, east has liked north, and north liked east, etc., etc.', size: 21, rot: 1.5 }),
  }],
  [{
    vb: [640, 220], alt: 'Close on Owen’s eyes, narrowing with resolve.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, lin(['#2a1a6a', '#5fe8ff'], 0, 0, 1, 0));
      s += G('translate(300 150) scale(5.2)', owenHead({ ex: 'grit', zombie: true, look: [1, 0] }));
      return s;
    },
    text: (W) => caption({ x: 420, y: 150, w: 210, t: 'So I gathered my wits...', size: FW, rot: -1 }),
  }],
]);

// =====================================================================
// PAGE 9  (journal page 8: the peace-giving speech)
// =====================================================================
page('Page 9: The peace-giving speech', [
  [{
    vb: [420, 460], alt: 'STOP! Owen throws up a hand. WHAT?!! roars the giant.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, lin(['#ff3a4a', '#ffe14a'])) + speedLines(130, 300, 40, 400, 36, '#ffffff', 7, 91) + halftoneRect(0, 0, W, H, 'htr', 0.3);
      s += G('translate(380 120) rotate(-120) scale(.5)', club({}));
      s += owen({ x: 140, y: 450, s: 1.25, pose: 'stop', ex: 'yell', zombie: true, look: [1, -0.5], jonBack: 'worried' });
      return s;
    },
    text: (W) => balloon({ kind: 'yell', x: 110, y: 70, w: 100, t: 'STOP!', tail: [140, 140], size: 38, seed: 2 }) + balloon({ kind: 'yell', x: 320, y: 230, w: 120, t: 'WHAT?!!', tail: [420, 180], size: 30, seed: 6 }) + balloon({ x: 290, y: 380, w: 190, t: 'The giant of the east sent us!!', tail: [220, 330], size: FH - 1 }),
  }, {
    vb: [420, 460], alt: 'The giant scoffs. Owen thinks: you’re absolutely right!',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, lin(['#3a8a3a', '#14301e'])) + halftoneRect(0, 0, W, H, 'ht', 0.3);
      s += giantHead({ x: 260, y: 230, s: 1.45, ex: 'pah' });
      s += owenBust({ x: 70, y: 470, s: 0.9, ex: 'awk', zombie: true });
      return s;
    },
    text: (W) => balloon({ kind: 'yell', x: 250, y: 60, w: 250, t: 'PAH!! I doubt he sent you here to bother me!', tail: [260, 150], size: FH - 2, seed: 14 }) + balloon({ kind: 'thought', x: 110, y: 240, w: 150, t: "You're absolutely right!", tail: [70, 380], size: FH - 3 }) + caption({ x: 150, y: 330, w: 260, t: 'my mind screamed, but thankfully I kept that to myself and carry on with my majestically wonderful peace-giving speech.', size: FH - 9, rot: 1 }),
  }],
  [{
    vb: [640, 340], alt: 'Owen explains the mission. The giant, chin in hand: why?',
    art: (W, H) => {
      let s = forestBG(W, H, { seed: 22 });
      s += G('translate(470 900) scale(1.35)', giant({ pose: 'chin', ex: 'think' }));
      s += owen({ x: 150, y: 330, s: 1.05, pose: 'point', ex: 'smirk', zombie: true, jonBack: 'smug' });
      return s;
    },
    text: (W) => balloon({ x: 190, y: 70, w: 270, t: 'He sent me to take down this palace full of penguins for him.', tail: [160, 140], size: FW - 2 }) + balloon({ x: 560, y: 260, w: 70, t: 'Why?', tail: [520, 210], size: FW }) + balloon({ kind: 'whisper', x: 300, y: 250, w: 110, t: 'Because...', tail: [210, 230], size: FW - 2 }),
  }],
  [{
    vb: [640, 340], alt: 'Inside Owen’s head: Jon’s voice glows. Oh, I have one! Alright!',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, rad([[0, '#5fe8ff'], [0.4, '#7a3cff'], [1, '#12063a']], 0.5, 0.5, 0.7)) + halftoneRect(0, 0, W, H, 'htc', 0.35);
      for (let i = 0; i < 5; i++) s += E(320, 170, 80 + i * 70, 50 + i * 40, 'none', 0, `stroke="#5fe8ff" stroke-width="${4 - i * 0.6}" opacity="${0.8 - i * 0.12}"`);
      s += owenBust({ x: 170, y: 330, s: 1.7, ex: 'think', zombie: true, glowEyes: true, look: [1, 0] });
      s += axe({ x: 480, y: 210, s: 0.95, rot: 10, face: 'excited', aura: '#5fe8ff' });
      s += RUNES.map((r, i) => G(`translate(${300 + (i % 3) * 30} ${120 + (i / 3 | 0) * 120}) scale(1.4)`, P(r, 'none', 3, 'stroke="#ffffff"'), 'filter="url(#glow)"')).join('');
      return s;
    },
    text: (W) => balloon({ kind: 'mind', x: 470, y: 64, w: 180, t: 'Oh, I have one!', tail: [470, 140], size: FW }) + caption({ x: 14, y: 14, w: 220, t: 'Jon yelled in my mind.', size: FW - 4 }) + balloon({ kind: 'mind', x: 320, y: 270, w: 110, t: 'Alright!', tail: [230, 220], size: FW }) + caption({ x: 410, y: 296, w: 210, t: '(also in mind.)', size: FW - 6, rot: 1 }),
  }],
  [{
    vb: [420, 420], alt: 'Owen delivers Jon’s excuse with confidence.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, lin(['#ffe14a', '#ff7a3a'])) + speedLines(200, 330, 40, 400, 30, '#ffffff', 7, 4) + halftoneRect(0, 0, W, H, 'hto', 0.3);
      s += owen({ x: 210, y: 420, s: 1.2, pose: 'shrug', ex: 'smirk', zombie: true, jonBack: 'grin' });
      return s;
    },
    text: (W) => balloon({ x: 210, y: 80, w: 330, t: 'He sent us because penguins were invading his luxurious apartment/townhome getaway.', tail: [210, 160], size: FH - 1 }) + caption({ x: 220, y: 360, w: 190, t: 'I followed as Jon instructed me.', size: FH - 6, rot: 1 }),
  }, {
    vb: [420, 420], alt: 'The giant’s face softens: Ahhh. Knörvic does like his luxurious getaways.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, lin(['#9fe8ff', '#3a8a5a'])) + halftoneRect(0, 0, W, H, 'htc', 0.3);
      s += giantHead({ x: 210, y: 260, s: 1.55, ex: 'ahh' });
      return s;
    },
    text: (W) => balloon({ x: 100, y: 60, w: 100, t: 'Ahhh...', tail: [170, 140], size: FH + 2 }) + balloon({ x: 290, y: 370, w: 230, t: 'KNÖRVIC does like his luxurious getaways.', tail: [240, 320], size: FH - 1 }),
  }],
]);

// =====================================================================
// PAGE 10  (journal page 8, end: Thou shall pass)
// =====================================================================
page('Page 10: Thou shall pass', [
  [{
    vb: [640, 860], alt: 'Splash: the Forest Giant steps aside and sweeps an arm toward the glowing deep forest. Thou shall pass.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, lin(['#0a2a3a', '#1a5a5a', '#3a7a4a']));
      s += glowBlob(420, 470, 300, '#d8ff9a', 0.8);
      for (let i = 0; i < 6; i++) s += P(`M${300 + i * 40},0 L${330 + i * 40},0 L${440 + i * 10},560 L${400 + i * 10},560Z`, '#f4ffd0', 0, 'opacity=".14"');
      s += forestRow(W, 520, 380, 8, '#14403a', '#0a2620', 41, 2) + halftoneRect(0, 0, W, 560, 'htc', 0.2);
      s += P('M380,560 L460,560 L640,860 L160,860Z', lin(['#e8ffb0', '#8a7a3a']), 3);
      s += Rect(0, 560, 380, 300, '#3a2a14', 0) + Rect(460, 560, 180, 300, '#3a2a14', 0) + halftoneRect(0, 560, W, 300, 'ht2', 0.35);
      s += G('translate(200 850) scale(1.0)', giant({ pose: 'aside', ex: 'smile', headRot: 8 }));
      s += owen({ x: 430, y: 820, s: 0.85, pose: 'bow', ex: 'happy', zombie: true, flip: true }) + axe({ x: 510, y: 700, s: 0.5, rot: 10, face: 'grin', aura: '#ffe14a' });
      return s;
    },
    text: (W, H) => caption({ x: 330, y: 14, w: 296, t: 'I hoped this faux story would get us through his guard, and it actually did (for once).', size: FW - 3 }) + balloon({ kind: 'yell', x: 390, y: 260, w: 260, t: 'THOU SHALL PASS INTO THE DEEP FOREST.', tail: [250, 390], size: FW + 5, seed: 25, fill: '#fffbe0' }) + balloon({ x: 560, y: 600, w: 90, t: 'Thank you.', tail: [460, 680], size: FW - 2 }) + caption({ x: 470, y: 690, w: 150, t: 'I said.', size: FW - 6, rot: 1.5 }),
  }],
]);

// =====================================================================
// PAGE 11  (to be continued)
// =====================================================================
page('Page 11: To be continued', [
  [{
    vb: [600, 760], alt: 'Owen and Jon walk into the deep forest toward a palace of ice. Red eyes watch from the trees. To be continued.',
    art: (W, H) => {
      let s = Rect(0, 0, W, H, lin(['#0a0a2a', '#2a1a5a', '#4a3a8a', '#9fe8ff']));
      const R = rng(8); for (let i = 0; i < 50; i++) s += C(R() * W, R() * 300, R() * 1.4 + 0.4, '#ffffff', 0);
      s += palace(300, 470, 0.9);
      s += forestRow(W, 540, 170, 9, '#0e2a30', '#06161a', 3, 2) + halftoneRect(0, 0, W, H, 'htp', 0.2);
      s += Rect(0, 520, W, 240, '#0a1418', 0);
      s += P('M260,520 L340,520 L520,760 L80,760Z', lin(['#9fe8ff', '#1a3a4a']), 0, 'opacity=".55"');
      [[60, 600], [520, 590], [90, 470], [560, 450]].forEach(([x, y]) => { s += glowBlob(x, y, 14, '#ff2a3a', 1) + glowBlob(x + 18, y, 14, '#ff2a3a', 1); });
      s += G('translate(290 650)', owen({ s: 0.85, pose: 'stand', ex: 'neutral', zombie: true, shadow: false, p: { la: [-10, 10], ra: [20, 20] } }), 'filter="url(#sil)"');
      s += axe({ x: 345, y: 540, s: 0.4, rot: 6, face: 'happy', aura: '#5fe8ff' });
      return s;
    },
    text: (W, H) => caption({ x: 20, y: 20, w: 260, t: 'Next: the deep forest... and a palace filled with penguins.', size: 24 }) + sfx('TO BE CONTINUED...', 300, 722, 58, { fill: '#ffe14a', rot: -4 }) + `<text x="580" y="170" text-anchor="end" font-family='${HAND_FONT}' font-size="22" fill="#e0303a" transform="rotate(-6 580 170)">Quite the cliffhanger!</text>`,
  }],
], { foot: '<p class="endnote">Written by Owen. Drawn in the world of the game.</p>' });
