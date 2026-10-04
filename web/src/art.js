// Pixel art in the style of A Link to the Past: hand-placed sprites with dark outlines,
// 3-4 shade ramps, directional walk cycles, and tiles whose edges blend into their neighbors.
// Sprites are text grids: one character per pixel, '.' is transparent, letters map to a palette.

const OUTLINE = '#181420';
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// rows -> canvas, with a 1px outline around every opaque pixel
function buildSprite(rows, pal, outline = true) {
  const w = Math.max(...rows.map(r => r.length)), h = rows.length, pad = outline ? 1 : 0;
  const c = mkCanvas(w + pad * 2, h + pad * 2), g = c.getContext('2d'), img = g.createImageData(c.width, c.height);
  const filled = (x, y) => y >= 0 && y < h && x >= 0 && x < rows[y].length && rows[y][x] !== '.' && rows[y][x] !== ' ';
  const put = (x, y, hex, a = 255) => { const [r, gg, b] = hexRgb(hex), i = (y * c.width + x) * 4; img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = a; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (filled(x, y)) { const col = pal[rows[y][x]]; if (col) put(x + pad, y + pad, col); }
  }
  if (outline) {
    for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) {
      if (filled(x, y)) continue;
      if (filled(x + 1, y) || filled(x - 1, y) || filled(x, y + 1) || filled(x, y - 1)) put(x + pad, y + pad, OUTLINE);
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}
function flipped(c) { const f = mkCanvas(c.width, c.height), g = f.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return f; }
function tinted(c, color) { const f = mkCanvas(c.width, c.height), g = f.getContext('2d'); g.drawImage(c, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height); return f; }

// ---------------- palettes ----------------
const PAL_OWEN = { w: '#f4ecd0', h: '#c8ccd8', H: '#8a90a4', r: '#a0581e', s: '#f8c898', S: '#d89060', e: '#20141c',
  t: '#3c7ce0', T: '#2850a0', b: '#7a4418', g: '#ffd84a', p: '#6a4a2a', f: '#4a2c14', P: '#4a3220', F: '#2e1a0c' };
const PAL_ZOMBIE = { ...PAL_OWEN, s: '#a8d090', S: '#78a868', t: '#8a50c0', T: '#5a3088' };
const PAL_JON = { h: '#9a6030', b: '#5a3418', p: '#c0c0cc', S: '#c8d8ec', l: '#f4fbff', d: '#a8b8cc', D: '#d8e4f4', w: '#ffffff', k: '#141018', m: '#4a5a80' };
const PAL_PENGUIN = { n: '#20203a', N: '#3e3e66', w: '#f4f4ff', W: '#c4c4dc', o: '#ffa020', O: '#c86010', r: '#ff2828', g: '#ffd84a', G: '#c89a18', c: '#7a1a8a', h: '#a8acc0', H: '#6a6e84', R: '#e02838' };
const PAL_PAL = { ...PAL_PENGUIN, r: '#202030', R: '#e02838' };
const PAL_DRAUGR = { c: '#d8dcc0', C: '#a0a488', e: '#9cff6a', a: '#5a6a4a', A: '#3e4a32', h: '#8a8a9a', H: '#5a5a6a', m: '#2a2a20' };
const PAL_SHIELD = { w: '#7a4418', r: '#b03028', R: '#801818', g: '#ffd84a' };
const PAL_BAT = { b: '#3d5a9e', B: '#26386a', e: '#ffee44', m: '#8aa0d8' };

// ---------------- Owen (16 x 19) ----------------
const OWEN_HEAD_DOWN = [
  '................',
  '...w........w...',
  '...ww......ww...',
  '....whhhhhhw....',
  '....hhhhhhhh....',
  '...hHHHHHHHHh...',
  '....rssssssr....',
  '....rsesseSr....',
  '....rssssssr....',
  '.....sSSSSs.....',
];
const OWEN_BODY_DOWN = [
  '....tttttttt....',
  '...stttttttts...',
  '...sTttttttTs...',
  '....bbbggbbb....',
  '....tttttttt....',
  '....TTTttTTT....',
];
const OWEN_HEAD_UP = [
  '................',
  '...w........w...',
  '...ww......ww...',
  '....whhhhhhw....',
  '....hhhhhhhh....',
  '...hHHHHHHHHh...',
  '....rrrrrrrr....',
  '....rrrrrrrr....',
  '....rrrrrrrr....',
  '.....SSSSSS.....',
];
const OWEN_BODY_UP = [
  '....tttttttt....',
  '...stttttttts...',
  '...sTttttttTs...',
  '....bbbbbbbb....',
  '....tttttttt....',
  '....TTTTTTTT....',
];
const OWEN_HEAD_SIDE = [
  '................',
  '....w.......w...',
  '....ww.....ww...',
  '.....whhhhhw....',
  '.....hhhhhhh....',
  '....hHHHHHHHh...',
  '.....rrrssss....',
  '.....rrrssess...',
  '.....rrrsssss...',
  '......rSSSs.....',
];
const OWEN_BODY_SIDE = [
  '.....ttttttt....',
  '.....tttsttt....',
  '.....tTtsttT....',
  '.....bbbbgbb....',
  '.....ttttttt....',
  '.....TTTTTTT....',
];
// ---- walk cycle: 8 frames per direction, legs + swinging arms + a 1px body bob ----
const setc = (row, i, ch) => row.slice(0, i) + ch + row.slice(i + 1);
const LEG_POSES = {
  front: {   // down and up views
    N: ['....ppp..ppp....', '....fff..fff....', '................'],
    Lh: ['....ppp..ppp....', '....ppp..fff....', '....fff.........'],
    L: ['....ppp..fff....', '....ppp.........', '....fff.........'],
    Rh: ['....ppp..ppp....', '....fff..ppp....', '.........fff....'],
    R: ['....fff..ppp....', '.........ppp....', '.........fff....'],
  },
  side: {    // P/F = the far leg, a shade darker
    N: ['......pp.pp.....', '......ff.ff.....', '................'],
    Lh: ['......PP.pp.....', '.....FF...ff....', '................'],
    L: ['.....PP...pp....', '....FF.....ff...', '................'],
    Rh: ['......pp.PP.....', '.....ff...FF....', '................'],
    R: ['.....pp...PP....', '....ff.....FF...', '................'],
  },
};
const WALK = ['N', 'Lh', 'L', 'Lh', 'N', 'Rh', 'R', 'Rh'];
const WALK_BOB = [0, 0, 1, 0, 0, 0, 1, 0];
const WALK_ARM = [0, 1, 1, 1, 0, -1, -1, -1];
function swingArms(body, dir, arm) {
  const b = body.slice();
  if (!arm) return b;
  if (dir === 'side') {
    b[1] = setc(b[1], 8, 't'); b[2] = setc(b[2], 8, 't');
    if (arm > 0) { b[2] = setc(b[2], 9, 's'); b[3] = setc(b[3], 10, 's'); }
    else { b[2] = setc(b[2], 6, 's'); b[3] = setc(b[3], 5, 's'); }
    return b;
  }
  // front/back view: the forward hand drops a pixel, the other rises
  const fwd = arm > 0 ? 12 : 3, back = arm > 0 ? 3 : 12;
  b[3] = setc(b[3], fwd, 's'); b[2] = setc(b[2], back, '.');
  return b;
}
function walkFrame(head, body, dir, i) {
  const legs = LEG_POSES[dir === 'side' ? 'side' : 'front'][WALK[i]];
  const torso = [...head, ...swingArms(body, dir, WALK_ARM[i])];
  return WALK_BOB[i] ? ['................', ...torso, ...legs.slice(1)] : [...torso, ...legs];
}
// ---- swinging Jon: wind-up, strike, follow-through (body rows only) ----
const OWEN_ATTACK = {
  down: [
    ['....tttttttt.s..', '...stttttttt.s..', '...sTtttttttT...', '....bbbggbbb....', '....tttttttt....', '....TTTttTTT....'],
    ['....tttttttt....', '...stttttttts...', '...sTtttttttTs..', '....bbbggbbb.ss.', '....tttttttt..s.', '....TTTttTTT....'],
    ['....tttttttt....', '..sstttttttts...', '.ss.TtttttttT...', '....bbbggbbb....', '....tttttttt....', '....TTTttTTT....'],
  ],
  up: [
    ['..s.tttttttt....', '..s.tttttttts...', '...sTttttttTs...', '....bbbbbbbb....', '....tttttttt....', '....TTTTTTTT....'],
    ['....tttttttt.s..', '...sttttttttss..', '...sTttttttT....', '....bbbbbbbb....', '....tttttttt....', '....TTTTTTTT....'],
    ['....ttttttttss..', '...stttttttt.ss.', '...sTttttttT....', '....bbbbbbbb....', '....tttttttt....', '....TTTTTTTT....'],
  ],
  side: [
    ['...ssttttttt....', '.....ttttttt....', '.....tTttttT....', '.....bbbbgbb....', '.....ttttttt....', '.....TTTTTTT....'],
    ['.....ttttttt....', '.....ttttttsss..', '.....tTtttTsss..', '.....bbbbgbb....', '.....ttttttt....', '.....TTTTTTT....'],
    ['.....ttttttt....', '.....ttttttt....', '.....tTttttTs...', '.....bbbbgbbss..', '.....ttttttt....', '.....TTTTTTT....'],
  ],
};

// ---------------- Jon (16 x 16, blade up) ----------------
const JON_ROWS = [
  '................',
  '......hh.lllll..',
  '......hhlSSSSSl.',
  '...dd.hhSwwSwwSl',
  '..dDDdhhSwkSwkSl',
  '...dd.hhSSSSSSSl',
  '......hhSSmmmSSl',
  '......hhlSSSSSl.',
  '......hh.lllll..',
  '......bb........',
  '......hh........',
  '......hh........',
  '......bb........',
  '......hh........',
  '......pp........',
  '................',
];
const JON_BLINK = JON_ROWS.map((r, i) => i === 3 ? '...dd.hhSSSSSSSl' : i === 4 ? '..dDDdhhSmmSmmSl' : r);

// ---------------- Penguins (16 x 14) ----------------
const PENG = {
  down: [[
    '................',
    '.....nnnnnn.....',
    '....nNNnnNNn....',
    '....nrnnnnrn....',
    '....nnnoonnn....',
    '...nnwwOOwwnn...',
    '...nwwwwwwwwn...',
    '..nnwwwwwwwwnn..',
    '..n.wwwwwwww.n..',
    '....wwwwwwww....',
    '....WwwwwwwW....',
    '.....WWWWWW.....',
    '.....oo..oo.....',
  ], [
    '................',
    '................',
    '.....nnnnnn.....',
    '....nNNnnNNn....',
    '....nrnnnnrn....',
    '....nnnoonnn....',
    '..nnnwwOOwwnnn..',
    '.n.nwwwwwwwwn.n.',
    '...nwwwwwwwwn...',
    '....wwwwwwww....',
    '....WwwwwwwW....',
    '.....WWWWWW.....',
    '....oo....oo....',
  ]],
  up: [[
    '................',
    '.....nnnnnn.....',
    '....nNNNNNNn....',
    '....nnnnnnnn....',
    '....nnnnnnnn....',
    '...nnnnnnnnnn...',
    '...nnnnnnnnnn...',
    '..nnnnnnnnnnnn..',
    '..n.nnnnnnnn.n..',
    '....nnnnnnnn....',
    '....nnnnnnnn....',
    '.....nnnnnn.....',
    '.....oo..oo.....',
  ], [
    '................',
    '................',
    '.....nnnnnn.....',
    '....nNNNNNNn....',
    '....nnnnnnnn....',
    '....nnnnnnnn....',
    '..nnnnnnnnnnnn..',
    '.n.nnnnnnnnnn.n.',
    '...nnnnnnnnnn...',
    '....nnnnnnnn....',
    '....nnnnnnnn....',
    '.....nnnnnn.....',
    '....oo....oo....',
  ]],
  side: [[
    '................',
    '......nnnn......',
    '.....nNNnnn.....',
    '.....nnnrnno....',
    '.....nnnnnnoo...',
    '....nnnwwwn.....',
    '....nnwwwwwn....',
    '...nnnwwwwwn....',
    '...nnnwwwwwn....',
    '....nnwwwwwn....',
    '....nnWwwwW.....',
    '.....nnWWW......',
    '.....oo..oo.....',
  ], [
    '................',
    '................',
    '......nnnn......',
    '.....nNNnnn.....',
    '.....nnnrnno....',
    '.....nnnnnnoo...',
    '....nnnwwwn.....',
    '...nnnwwwwwn....',
    '..n.nnwwwwwn....',
    '....nnwwwwwn....',
    '....nnWwwwW.....',
    '.....nnWWW......',
    '....oo....oo....',
  ]],
};
const CROWN = ['.g..g..g.', '.gg.g.gg.', 'gggRgRggg', 'GGGGGGGGG'];
const HELMET = ['...RR...', '..hhhh..', '.hhhhhh.', 'hHhhhhHh', 'hHHHHHHh'];

// ---------------- Draugr (16 x 17) ----------------
const DRAUGR = {
  down: [[
    '................',
    '......hhhh......',
    '.....hhhhhh.....',
    '....hHhhhhHh....',
    '....hccccccH....',
    '....cceccecc....',
    '....ccccCccc....',
    '.....cmmmmc.....',
    '......cccc......',
    '....aaaaaaaa....',
    '...caAaaaaAac...',
    '...c.aaaaaa.c...',
    '...C.AAAAAA.C...',
    '.....aa..aa.....',
    '.....cc..cc.....',
    '.....CC..CC.....',
  ], [
    '................',
    '......hhhh......',
    '.....hhhhhh.....',
    '....hHhhhhHh....',
    '....hccccccH....',
    '....cceccecc....',
    '....ccccCccc....',
    '.....cmmmmc.....',
    '......cccc......',
    '....aaaaaaaa....',
    '...caAaaaaAac...',
    '...c.aaaaaa.c...',
    '...C.AAAAAA.C...',
    '.....aa..aa.....',
    '.....cc...cc....',
    '.....CC...CC....',
  ]],
  side: [[
    '................',
    '......hhhh......',
    '.....hhhhhhh....',
    '.....hHhhhhh....',
    '.....hcccccc....',
    '.....cccceccc...',
    '.....ccccccc....',
    '......ccmmmc....',
    '.......ccc......',
    '.....aaaaaaa....',
    '.....aAaaaac....',
    '.....aaaaaac....',
    '.....AAAAAAC....',
    '......aa.aa.....',
    '......cc.cc.....',
    '......CC.CC.....',
  ], [
    '................',
    '......hhhh......',
    '.....hhhhhhh....',
    '.....hHhhhhh....',
    '.....hcccccc....',
    '.....cccceccc...',
    '.....ccccccc....',
    '......ccmmmc....',
    '.......ccc......',
    '.....aaaaaaa....',
    '.....aAaaaac....',
    '.....aaaaaac....',
    '.....AAAAAAC....',
    '.....aa...aa....',
    '....cc.....cc...',
    '....CC.....CC...',
  ]],
};
const SHIELD = ['...wwww...', '.wwrrrrww.', '.wrrRrrrw.', 'wrrRrrrrrw', 'wrrrggrrrw', 'wrrrggrrRw', 'wrrrrrrrRw', '.wrrrrRRw.', '.wwRRRRww.', '...wwww...'];
const BAT = [[
  'mm............mm',
  '.mbb........bbm.',
  '..bbbb.bb.bbbb..',
  '...BbbbbbbbbB...',
  '.....bebbeb.....',
  '......bbbb......',
], [
  '................',
  '......bbbb......',
  '...bbbbbbbbbb...',
  '.mbbBbebbebBbbm.',
  'mm...bbbbbb...mm',
  '......b..b......',
]];

// ---------------- People (16 x 14) ----------------
const PERSON = [
  '................',
  '.....hhhhhh.....',
  '....hhhhhhhh....',
  '....hssssssh....',
  '....hsesseSh....',
  '....hssssssh....',
  '.....sSSSSs.....',
  '....tttttttt....',
  '...stttttttts...',
  '...sTttttttTs...',
  '....tttttttt....',
  '....TTTTTTTT....',
  '....ppp..ppp....',
  '....fff..fff....',
];
function personRows(look) {
  const r = PERSON.slice();
  if (look.beard) { r[5] = '....hBBBBBBh....'; r[6] = '.....BBBBBB.....'; }
  if (look.long) { r[5] = '...hhssssssh....'.slice(0, 16); r[6] = '...hhsSSSSshh...'; r[7] = '...htttttttth...'; }
  if (look.hat) { r[0] = '....yyyyyyyy....'; r[1] = '...yyyyyyyyyy...'; }
  return r;
}

// ---------------- props ----------------
const CHEST_ROWS = ['bbbbbbbbbbbbbb', 'bBBBBBBBBBBBBb', 'bBBBBBBBBBBBBb', 'gggggggggggggg', 'bwwwwwggwwwwwb', 'bwwwwwgGwwwwwb', 'bwwwwwwwwwwwwb', 'bwwwwwwwwwwwwb', 'bddddddddddddb'];
const PAL_CHEST = { b: '#5a3418', B: '#c07a40', g: '#ffd84a', G: '#a87a10', w: '#9a5a2a', d: '#6a3c1a' };
const SIGN_ROWS = ['bbbbbbbbbbbb', 'bLLLLLLLLLLb', 'bLddLLddLdLb', 'bLLLLLLLLLLb', 'bLdddLLddLLb', 'bbbbbbbbbbbb', '.....pp.....', '.....pp.....', '.....pp.....'];
const PAL_SIGN = { b: '#6a3c1a', L: '#d8a868', d: '#7a4a22', p: '#7a4a22' };
const RUNE_ROWS = ['...llll...', '..lLLLLd..', '.lLLLLLLd.', '.lLLLLLLd.', '.lLLLLLLd.', '.lLLLLLLd.', '.lLLLLLLd.', '.lLLLLLLd.', '.lLLLLLLd.', '.lLLLLLLd.', '.lLLLLLLd.', 'lLLLLLLLLd', 'dddddddddd'];
const PAL_RUNE = { l: '#c0c0d0', L: '#8a8a9c', d: '#5a5a6c' };

// ---------------- build everything once ----------------
const SPR = {};
function buildAll() {
  for (const [key, pal] of [['owen', PAL_OWEN], ['zombie', PAL_ZOMBIE]]) {
    for (const dir of ['down', 'up', 'side']) {
      const head = dir === 'down' ? OWEN_HEAD_DOWN : dir === 'up' ? OWEN_HEAD_UP : OWEN_HEAD_SIDE;
      const body = dir === 'down' ? OWEN_BODY_DOWN : dir === 'up' ? OWEN_BODY_UP : OWEN_BODY_SIDE;
      const legsN = LEG_POSES[dir === 'side' ? 'side' : 'front'].N;
      for (let i = 0; i < 8; i++) {
        const c = buildSprite(walkFrame(head, body, dir, i), pal);
        SPR[`${key}_${dir}_w${i}`] = c; SPR[`${key}_${dir}_w${i}_f`] = flipped(c);
      }
      for (let i = 0; i < 3; i++) {
        const c = buildSprite([...head, ...OWEN_ATTACK[dir][i], ...legsN], pal);
        SPR[`${key}_${dir}_a${i}`] = c; SPR[`${key}_${dir}_a${i}_f`] = flipped(c);
      }
    }
    // holding an item over his head (both arms up)
    const hold = [...OWEN_HEAD_DOWN.map((r, i) => i === 6 || i === 7 ? 's' + r.slice(1, 15) + 's' : r), ...OWEN_BODY_DOWN.map((r, i) => i < 2 ? '.' + r.slice(1, 15) + '.' : r), ...LEG_POSES.front.N];
    hold[4] = 's' + hold[4].slice(1, 15) + 's'; hold[5] = 's' + hold[5].slice(1, 15) + 's';
    SPR[`${key}_hold`] = buildSprite(hold, pal);
  }
  SPR.jon = buildSprite(JON_ROWS, PAL_JON); SPR.jon_blink = buildSprite(JON_BLINK, PAL_JON);
  SPR.jon_gold = tinted(SPR.jon, 'rgba(255,216,74,0.0)');
  for (const [key, pal] of [['peng', PAL_PENGUIN], ['pal', PAL_PAL]]) {
    for (const dir of ['down', 'up', 'side']) for (let f = 0; f < 2; f++) {
      const c = buildSprite(PENG[dir][f], pal);
      SPR[`${key}_${dir}_${f}`] = c; SPR[`${key}_${dir}_${f}_f`] = flipped(c);
    }
  }
  SPR.crown = buildSprite(CROWN, PAL_PENGUIN); SPR.helmet = buildSprite(HELMET, PAL_PENGUIN);
  for (const dir of ['down', 'side']) for (let f = 0; f < 2; f++) {
    const c = buildSprite(DRAUGR[dir][f], PAL_DRAUGR);
    SPR[`draugr_${dir}_${f}`] = c; SPR[`draugr_${dir}_${f}_f`] = flipped(c);
  }
  SPR.shield = buildSprite(SHIELD, PAL_SHIELD);
  SPR.bat_0 = buildSprite(BAT[0], PAL_BAT); SPR.bat_1 = buildSprite(BAT[1], PAL_BAT);
  SPR.shadow = buildSprite(['..xxxxxxxx..', '.xxxxxxxxxx.', 'xxxxxxxxxxxx', '.xxxxxxxxxx.', '..xxxxxxxx..'], { x: '#000000' }, false);
  for (const id in LOOKS) {
    const l = LOOKS[id];
    const npcPal = { h: l.hair, B: l.hair, s: l.skin || '#f0c49a', S: '#c89068', e: '#20141c', t: l.shirt, T: shade(l.shirt, -0.3), p: '#4a3a2a', f: '#2a1a10', y: l.hat || '#000' };
    SPR['npc_' + id] = buildSprite(personRows(l), npcPal);
    SPR['npc_' + id + '_blink'] = buildSprite(personRows(l).map(r => r.replace(/e/g, 'S')), npcPal);
  }
  SPR.chest = buildSprite(CHEST_ROWS, PAL_CHEST);
  SPR.chest_open = buildSprite(CHEST_ROWS.map((r, i) => i === 1 || i === 2 ? 'b' + 'k'.repeat(12) + 'b' : r), { ...PAL_CHEST, k: '#1a0c06' });
  SPR.sign = buildSprite(SIGN_ROWS, PAL_SIGN);
  SPR.runestone = buildSprite(RUNE_ROWS, PAL_RUNE);
  buildIcons();
  buildPoof();
}
function shade(hex, k) { const [r, g, b] = hexRgb(hex); const f = v => Math.max(0, Math.min(255, Math.round(v * (1 + k)))); return '#' + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2, '0')).join(''); }

// white silhouettes for the hurt flash, built on demand
const WHITE = new Map();
function whiteOf(c) { let w = WHITE.get(c); if (!w) { w = tinted(c, '#ffffff'); WHITE.set(c, w); } return w; }

// draw a sprite with its feet at (x, y)
function spr(c, x, y, opts = {}) {
  if (!c) return;
  const img = opts.white ? whiteOf(c) : c, sc = opts.scale || 1;
  const w = img.width * sc, h = img.height * sc;
  if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
  ctx.drawImage(img, Math.round(x - w / 2), Math.round(y - h + (opts.foot || 1) * sc), w, h);
  ctx.globalAlpha = 1;
}
function shadowAt(x, y, scale = 1) { ctx.globalAlpha = 0.28; const c = SPR.shadow; ctx.drawImage(c, Math.round(x - c.width * scale / 2), Math.round(y - 2 * scale), c.width * scale, c.height * scale); ctx.globalAlpha = 1; }
function dirOf(fx, fy) { return Math.abs(fx) > Math.abs(fy) ? { d: 'side', flip: fx < 0 } : { d: fy < 0 ? 'up' : 'down', flip: false }; }

// ALttP-style enemy death cloud: 4 frames of puffs
const POOF = [];
function buildPoof() {
  for (let f = 0; f < 4; f++) {
    const c = mkCanvas(24, 24), g = c.getContext('2d');
    const r = 3 + f * 2.2, n = 5;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + f * 0.4, px = 12 + Math.cos(a) * r * 1.2, py = 12 + Math.sin(a) * r;
      const rr = Math.max(1, 5 - f);
      g.fillStyle = f < 2 ? '#ffffff' : '#c8d0e8'; g.beginPath(); g.arc(Math.round(px), Math.round(py), rr, 0, Math.PI * 2); g.fill();
    }
    POOF.push(c);
  }
}
function poof(x, y, big) { G.fx.push({ kind: 'poof', x, y, vx: 0, vy: 0, t: 0, life: 0.32, scale: big ? 2 : 1 }); }

// ================= TILES =================
// Each tile is rendered once into a 16x16 canvas and cached by (char, variant, neighbor mask, frame).
const TILE_CACHE = new Map();
const COL = {
  grass: '#48a038', grassD: '#307828', grassL: '#68c050',
  path: '#d8c078', pathD: '#b8a058', pathL: '#ead79a',
  snow: '#eef2fa', snowD: '#c8d4e8', snowP: '#c8d0e0', snowPD: '#a8b2c8',
  water: '#3868d0', waterL: '#5888e8', waterH: '#a8c8ff', waterD: '#203c8a',
  deep: '#20409a', deepL: '#3058b8',
};
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000) / 1000; }; }

function makeTile(draw) {
  const c = mkCanvas(T, T), g = c.getContext('2d'), img = g.createImageData(T, T);
  const P = (x, y, hex, a = 255) => {
    if (x < 0 || y < 0 || x >= T || y >= T) return;
    const [r, gg, b] = hexRgb(hex), i = (y * T + x) * 4;
    if (a < 255 && img.data[i + 3]) { const k = a / 255; img.data[i] = img.data[i] * (1 - k) + r * k; img.data[i + 1] = img.data[i + 1] * (1 - k) + gg * k; img.data[i + 2] = img.data[i + 2] * (1 - k) + b * k; return; }
    img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = a;
  };
  const get = (x, y) => { const i = (y * T + x) * 4; return img.data[i + 3]; };
  draw(P, get);
  g.putImageData(img, 0, 0);
  return c;
}
// shaded ball (bushes, tree tops, rocks): light from the top-left, outline outside
function ball(P, cx, cy, rx, ry, ramp, rnd, opts = {}) {
  const inside = (x, y) => { const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry; return nx * nx + ny * ny <= 1; };
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    if (!inside(x, y)) {
      if (opts.outline !== false && (inside(x + 1, y) || inside(x - 1, y) || inside(x, y + 1) || inside(x, y - 1))) P(x, y, OUTLINE);
      continue;
    }
    const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
    let l = -nx * 0.6 - ny * 0.8 + (rnd() - 0.5) * (opts.noise || 0.5);
    P(x, y, l > 0.55 ? ramp[0] : l > 0.05 ? ramp[1] : l > -0.5 ? ramp[2] : ramp[3]);
  }
}
function groundFill(P, kind, r) {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) P(x, y, COL[kind] || kind);
  if (kind === 'grass') {
    for (let i = 0; i < 5; i++) { const x = Math.floor(r() * 13) + 1, y = Math.floor(r() * 13) + 1; P(x, y, COL.grassD); P(x + 2, y, COL.grassD); P(x + 1, y + 1, COL.grassD); if (r() < 0.4) P(x + 1, y - 1, COL.grassL); }
  } else if (kind === 'path') {
    for (let i = 0; i < 6; i++) { const x = Math.floor(r() * 15), y = Math.floor(r() * 15); P(x, y, r() < 0.5 ? COL.pathD : COL.pathL); }
  } else if (kind === 'snow') {
    for (let i = 0; i < 4; i++) { const x = Math.floor(r() * 14), y = Math.floor(r() * 14); P(x, y, COL.snowD); P(x + 1, y, COL.snowD); }
  } else if (kind === 'snowP') {
    for (let i = 0; i < 6; i++) { const x = Math.floor(r() * 15), y = Math.floor(r() * 15); P(x, y, COL.snowPD); }
  }
}
// grass growing over a path edge: a ragged 2-3px strip plus a dark lip
function fringe(P, side, base, dark, r) {
  for (let i = 0; i < T; i++) {
    const depth = 2 + (r() < 0.35 ? 1 : 0);
    for (let k = 0; k < depth; k++) {
      const [x, y] = side === 'n' ? [i, k] : side === 's' ? [i, T - 1 - k] : side === 'w' ? [k, i] : [T - 1 - k, i];
      P(x, y, k === depth - 1 ? dark : base);
    }
  }
}

const CLASS = c => '.fbx+S'.includes(c) ? 'grass' : c === 's' ? 'path' : c === 'n' ? 'snow' : c === '~' ? 'water' : 'wU'.includes(c) ? 'deep' : 'TMRHDPqEXl#O'.includes(c) ? 'solid' : 'other';
const CASTS_SHADOW = new Set('T#HMX+EO'.split(''));

function tileKey(c, tx, ty, snowy) {
  const nb = (dx, dy) => tile(tx + dx, ty + dy);
  const cls = CLASS(c);
  let mask = '';
  if (cls === 'path' || cls === 'snow' || c === 'n' || c === 's') {
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) { const o = CLASS(nb(dx, dy)); mask += (o === 'grass' || (snowy && (o === 'snow' || nb(dx, dy) === 'T'))) ? '1' : '0'; }
  } else if (cls === 'water' || cls === 'deep') {
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) { const o = CLASS(nb(dx, dy)); mask += (o !== 'water' && o !== 'deep') ? '1' : '0'; }
  } else if (c === 'T' || c === 'M' || c === 'W' || c === 'R' || c === 'H') {
    mask = (nb(0, 1) === c ? '1' : '0') + (nb(0, -1) === c ? '1' : '0');
  }
  const shadow = CASTS_SHADOW.has(nb(0, -1)) && !CASTS_SHADOW.has(c) && c !== 'R' && c !== 'H' ? 1 : 0;
  return { mask, shadow };
}

function renderTile(c, v, mask, shadow, frame, snowy, dungeon) {
  const r = rng(v * 7919 + c.charCodeAt(0) * 131 + 17);
  const ground = snowy ? 'snow' : 'grass';
  return makeTile((P, get) => {
    switch (c) {
      case '.': groundFill(P, ground, r); break;
      case 'f': groundFill(P, 'grass', r);
        for (const [x, y] of [[3, 3], [10, 5], [5, 10], [12, 12]]) { const sway = frame % 2 && (x + y) % 2 ? 1 : 0; P(x + sway, y, v % 2 ? '#ffe060' : '#ff90b8'); P(x - 1 + sway, y + 1, v % 2 ? '#ffe060' : '#ff90b8'); P(x + 1 + sway, y + 1, v % 2 ? '#ffe060' : '#ff90b8'); P(x + sway, y + 1, '#ffffff'); P(x, y + 2, COL.grassD); P(x, y + 3, COL.grassD); }
        break;
      case 's':
        if (snowy) { groundFill(P, 'snowP', r); if (mask) ['n', 's', 'w', 'e'].forEach((sd, i) => mask[i] === '1' && fringe(P, sd, COL.snow, COL.snowPD, r)); }
        else { groundFill(P, 'path', r); if (mask) ['n', 's', 'w', 'e'].forEach((sd, i) => mask[i] === '1' && fringe(P, sd, COL.grass, COL.grassD, r)); }
        break;
      case 'n': groundFill(P, 'snow', r); break;
      case '~': case 'w': case 'U': {
        const base = c === '~' ? COL.water : COL.deep, light = c === '~' ? COL.waterL : COL.deepL;
        for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) P(x, y, base);
        // drifting wave crests
        for (let y = 2; y < T; y += 5) for (let x = 0; x < T; x++) { const ph = (x + frame * 2 + y * 3 + v * 5) % 12; if (ph < 4) P(x, y + (ph === 1 || ph === 2 ? -1 : 0), light); }
        if ((frame + v) % 4 === 0) P(4 + v % 8, 8, COL.waterH);
        if (mask) {
          // shoreline: dark rim + foam that laps in and out
          if (mask[0] === '1') for (let x = 0; x < T; x++) { P(x, 0, COL.waterD); P(x, 1, COL.waterD, 140); if ((x + frame) % 3 === 0) P(x, 2 + (frame % 2), COL.waterH); }
          if (mask[1] === '1') for (let x = 0; x < T; x++) { P(x, T - 1, COL.waterD); if ((x + frame) % 4 === 0) P(x, T - 2, COL.waterH); }
          if (mask[2] === '1') for (let y = 0; y < T; y++) { P(0, y, COL.waterD); if ((y + frame) % 4 === 0) P(1, y, COL.waterH); }
          if (mask[3] === '1') for (let y = 0; y < T; y++) { P(T - 1, y, COL.waterD); if ((y + frame) % 4 === 0) P(T - 2, y, COL.waterH); }
        }
        if (c === 'U') {
          for (let y = 2; y < 14; y++) for (let x = 0; x < T; x++) P(x, y, x % 4 === 0 ? '#6b4322' : y === 2 ? '#c89058' : '#a8703c');
          for (let x = 0; x < T; x++) { P(x, 1, OUTLINE); P(x, 14, OUTLINE); P(x, 15, COL.waterD, 160); }
        }
        break;
      }
      case 'b': groundFill(P, ground, r);
        ball(P, 8, 8.5, 7, 6.5, ['#a8e070', '#58b840', '#388828', '#205818'], r, { noise: 0.9 });
        for (let i = 0; i < 6; i++) { const x = 3 + Math.floor(r() * 10), y = 4 + Math.floor(r() * 8); if (get(x, y)) P(x, y, '#205818'); }
        break;
      case 'T': {
        // round tree top; the trunk shows only when the tile below isn't more forest
        const bottom = mask[0] !== '1';
        // inside a forest the gaps between trees are deep shade; a lone tree stands on grass
        const deep = mask[0] === '1' && mask[1] === '1';
        if (snowy) groundFill(P, 'snow', r);
        else if (deep) for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) P(x, y, '#2a6a24');
        else groundFill(P, 'grass', r);
        if (bottom) { for (let y = 11; y < 16; y++) for (let x = 6; x < 10; x++) P(x, y, x === 6 ? '#4a2a12' : x === 9 ? '#5a3418' : '#7a4a22'); P(5, 15, OUTLINE); P(10, 15, OUTLINE); }
        const ramp = snowy ? ['#ffffff', '#d8e6f0', '#3a7060', '#24483c'] : ['#78c858', '#48a038', '#2e7a2a', '#1a5018'];
        ball(P, 8, bottom ? 6.5 : 8, 8, bottom ? 6.5 : 8, ramp, r, { noise: 1.1 });
        for (let i = 0; i < 5; i++) { const x = 3 + Math.floor(r() * 10), y = 3 + Math.floor(r() * 7); if (get(x, y)) { P(x, y, ramp[3]); P(x + 1, y - 1, ramp[2]); } }
        break; }
      case '#': groundFill(P, G.map.arena ? '#8a7a5a' : dungeon ? '#6070a0' : snowy ? 'snow' : 'grass', r);
        ball(P, 8, 9, 7, 6, ['#d8d8e4', '#a0a0b4', '#74748a', '#4a4a5c'], r, { noise: 0.4 });
        P(6, 8, '#4a4a5c'); P(7, 9, '#4a4a5c'); P(7, 10, '#4a4a5c'); P(10, 7, '#4a4a5c');
        break;
      case 'O': for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) P(x, y, dungeon ? '#5b6b8c' : G.map.interior ? '#a26c38' : G.map.dark ? '#3a2c22' : COL.grass);
        ball(P, 8, 10, 6, 5, ['#e0a070', '#b8784a', '#8a5432', '#5a3420'], r, { noise: 0.2 });
        for (let x = 5; x < 11; x++) { P(x, 4, OUTLINE); P(x, 5, '#3a2014'); } P(4, 5, OUTLINE); P(11, 5, OUTLINE);
        for (let x = 5; x < 11; x++) P(x, 9, '#5a3420');
        break;
      case '+': groundFill(P, 'grass', r);
        for (let y = 3; y < 14; y++) for (let x = 4; x < 12; x++) { const rr = (y < 5 && (x === 4 || x === 11)); if (!rr) P(x, y, x < 6 ? '#b8b8c8' : x > 9 ? '#6a6a7c' : '#8a8a9c'); }
        for (let x = 4; x < 12; x++) P(x, 2, OUTLINE); for (let y = 3; y < 14; y++) { P(3, y, OUTLINE); P(12, y, OUTLINE); }
        for (let y = 6; y < 11; y++) P(7, y, '#4a4a5c'); for (let x = 6; x < 10; x++) P(x, 7, '#4a4a5c');
        for (let x = 2; x < 14; x++) P(x, 14, '#307828');
        break;
      case 'x': groundFill(P, ground, r);
        for (const yy of [5, 10]) for (let x = 0; x < T; x++) { P(x, yy, '#b07a44'); P(x, yy + 1, '#7a4a22'); P(x, yy - 1, OUTLINE, 200); P(x, yy + 2, OUTLINE, 200); }
        for (const xx of [2, 12]) for (let y = 2; y < 15; y++) { P(xx, y, '#c08a50'); P(xx + 1, y, '#7a4a22'); P(xx - 1, y, OUTLINE); P(xx + 2, y, OUTLINE); }
        break;
      case 'M': {
        const top = mask[1] !== '1', bottom = mask[0] !== '1';
        // rock face: stepped ledges with a lit top edge and a dark underside, plus cracks
        for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
          const band = (y + Math.floor((x + v * 3) / 6) * 2) % 6;
          P(x, y, band === 0 ? '#c09868' : band === 1 ? '#5a3c22' : band === 2 ? '#7a5634' : '#94704a');
        }
        for (let i = 0; i < 3; i++) { const x = Math.floor(r() * 14) + 1, y = Math.floor(r() * 12) + 2; P(x, y, '#5a3c22'); P(x, y + 1, '#5a3c22'); P(x + 1, y + 2, '#5a3c22'); }
        if (top) { for (let x = 0; x < T; x++) { P(x, 0, snowy ? '#ffffff' : '#58a848'); P(x, 1, snowy ? '#e0e8f4' : '#48a038'); P(x, 2, '#b08858'); P(x, 3, OUTLINE, 120); } }
        if (bottom) for (let x = 0; x < T; x++) { P(x, 15, '#3a2410'); P(x, 14, '#4a3018'); }
        break; }
      case 'R': {
        // scalloped roof shingles
        for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const row = Math.floor(y / 4), xx = (x + (row % 2) * 2) % 4, edge = y % 4 === 3 || (y % 4 === 2 && (xx === 0 || xx === 3)); P(x, y, edge ? '#7a2018' : y % 4 === 0 ? '#e05a40' : '#c03a2a'); }
        if (mask[0] !== '1') for (let x = 0; x < T; x++) { P(x, 14, '#5a1810'); P(x, 15, OUTLINE); }
        if (mask[1] !== '1') for (let x = 0; x < T; x++) P(x, 0, OUTLINE);
        break; }
      case 'H':
        for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) P(x, y, x % 4 === 0 ? '#8a5a2e' : '#c08a50');
        for (let y = 0; y < T; y++) P((v * 4 + 3) % 16, y, '#7a4a22');
        if (v % 3 === 0) { for (let y = 4; y < 10; y++) for (let x = 5; x < 11; x++) P(x, y, (x === 7 || y === 6) ? '#5a3418' : '#9fd0ff'); for (let x = 4; x < 12; x++) { P(x, 3, OUTLINE); P(x, 10, OUTLINE); } }
        for (let x = 0; x < T; x++) P(x, 0, '#3a2010', 160);
        break;
      case 'D':
        for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) P(x, y, '#c08a50');
        for (let y = 2; y < T; y++) for (let x = 3; x < 13; x++) P(x, y, x === 3 || x === 12 || y === 2 ? OUTLINE : x % 3 === 0 ? '#4a2a12' : '#6a3c1a');
        P(10, 9, '#ffd84a'); P(10, 10, '#c89a18');
        break;
      case '_': {
        // dungeon floor: 8x8 slabs with a bevel
        for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const lx = x % 8, ly = y % 8; P(x, y, lx === 0 || ly === 0 ? '#7888b8' : lx === 7 || ly === 7 ? '#48548a' : '#6070a0'); }
        if (v % 5 === 0) { P(4, 5, '#48548a'); P(5, 5, '#48548a'); P(11, 12, '#48548a'); }
        break; }
      case 'i':
        for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const lx = x % 8, ly = y % 8; P(x, y, lx === 0 || ly === 0 ? '#d8f4ff' : lx === 7 || ly === 7 ? '#88c4e4' : '#aedcf4'); }
        { const g0 = (frame * 3 + v * 5) % 24; for (let k = 0; k < 4; k++) { const x = g0 - k, y = 2 + k; if (x >= 0 && x < 16) P(x, y, '#ffffff'); } }
        break;
      case 'W': {
        const faceVisible = mask[0] !== '1';
        for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const g = (x + y * 3) % 7 === 0; P(x, y, g ? '#222c48' : '#2a3656'); }
        if (faceVisible) {
          // wall face with bricks, darker toward the floor
          for (let y = 4; y < T; y++) for (let x = 0; x < T; x++) {
            const row = Math.floor((y - 4) / 4), bx = (x + (row % 2) * 4) % 8;
            const mortar = (y - 4) % 4 === 3 || bx === 0;
            P(x, y, mortar ? '#1a2238' : y < 8 ? '#5a6890' : y < 12 ? '#4a5880' : '#3c4870');
          }
          for (let x = 0; x < T; x++) { P(x, 3, '#7888b8'); P(x, 15, '#141a2c'); }
        }
        break; }
      case 'v':
        for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) P(x, y, '#05060a');
        if (mask[1] !== '1') for (let x = 0; x < T; x++) { P(x, 0, '#48548a'); P(x, 1, '#2a3550'); P(x, 2, '#151a28'); }
        break;
      default: return null;
    }
    if (shadow) for (let y = 0; y < 3; y++) for (let x = 0; x < T; x++) P(x, y, '#000000', 70 - y * 20);
  });
}
// wall/pit/etc. masks use their own neighbor rule
function tileMaskFor(c, tx, ty) {
  if (c === 'v') return '0' + (tile(tx, ty - 1) === 'v' ? '1' : '0');
  return null;
}
function drawTileArt(c, ox, oy, tx, ty) {
  const snowy = SNOWY(tx, ty), dungeon = !!(G.map && G.map.dungeon);
  if (!'.fsn~wUbT#O+xMRHD_iWv'.includes(c)) return false;
  const k = tileKey(c, tx, ty, snowy), mask = tileMaskFor(c, tx, ty) || k.mask;
  const v = hash(tx, ty) % 4;
  const animated = '~wUi'.includes(c) || c === 'f';
  const frame = animated ? Math.floor(G.t * (c === 'f' ? 2 : 4)) % 8 : 0;
  const key = `${c}|${v}|${mask}|${k.shadow}|${frame}|${snowy ? 1 : 0}|${dungeon ? 1 : 0}|${G.map.arena ? 1 : 0}|${G.map.interior ? 1 : G.map.dark ? 2 : 0}`;
  let img = TILE_CACHE.get(key);
  if (img === undefined) { img = renderTile(c, v, mask, k.shadow, frame, snowy, dungeon); TILE_CACHE.set(key, img); }
  if (!img) return false;
  ctx.drawImage(img, ox, oy);
  return true;
}

// dungeon lighting: darkness with warm pools around torches and a glow around Owen
let LIGHT = null;
function drawDungeonLight() {
  if (!LIGHT) LIGHT = mkCanvas(VW, VH);
  const g = LIGHT.getContext('2d'), p = G.player;
  g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, VW, VH);
  g.fillStyle = 'rgba(4,6,24,0.5)'; g.fillRect(0, 0, VW, VH);
  g.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
  hole(p.x - G.cam.x, p.y - G.cam.y - 6, 96);
  const x0 = Math.floor(G.cam.x / T), y0 = Math.floor(G.cam.y / T);
  const flick = Math.sin(G.t * 9) * 3 + Math.sin(G.t * 23) * 2;
  for (let ty = y0; ty <= y0 + SH; ty++) for (let tx = x0; tx <= x0 + SW; tx++) if (tile(tx, ty) === 't') hole(tx * T + 8 - G.cam.x, ty * T + 6 - G.cam.y, 52 + flick);
  ctx.drawImage(LIGHT, 0, 0);
  // warm glow on top
  ctx.globalCompositeOperation = 'lighter';
  for (let ty = y0; ty <= y0 + SH; ty++) for (let tx = x0; tx <= x0 + SW; tx++) if (tile(tx, ty) === 't') {
    const x = tx * T + 8 - G.cam.x, y = ty * T + 6 - G.cam.y, gr = ctx.createRadialGradient(x, y, 0, x, y, 30 + flick);
    gr.addColorStop(0, 'rgba(255,150,40,0.22)'); gr.addColorStop(1, 'rgba(255,150,40,0)'); ctx.fillStyle = gr; ctx.fillRect(x - 40, y - 40, 80, 80);
  }
  ctx.globalCompositeOperation = 'source-over';
}
