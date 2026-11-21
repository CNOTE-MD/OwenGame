// Owen's page 9: Jjorvic Palace from the deep forest. "The palace looked like a five star hotel
// and a cathedral were put in a bowl and mixed into one." At least ten arches, penguins on top of
// them, and Imperial Ruby. The front is drawn over the palace's cliff tiles on the Deep Forest screen.

const PALACE = { x0: 33 * 16, y0: 0, w: 224, door: 104 };   // door: the E tile at x 39, from x0
// lower arcade (the hotel) and upper arcade (the cathedral), skipping the grand door in the middle
const PALACE_ARCHES = (() => {
  const a = [];
  for (let i = 0; i < 12; i++) { const x = 10 + i * 17 + (i >= 5 ? 44 : 0); if (x < 214) a.push({ x, y: 46, w: 14, h: 18, lit: i % 3 !== 1 }); }
  for (let i = 0; i < 10; i++) { const x = 14 + i * 20 + (i >= 4 ? 28 : 0); if (x < 210) a.push({ x, y: 28, w: 10, h: 12, glass: true }); }
  return a.filter(r => r.x + r.w < 206 && r.x > 6);
})();
// which arches have a penguin sitting on top (Yay!)
const PALACE_PENGUINS = [0, 2, 4, 6, 9, 13, 16].filter(i => PALACE_ARCHES[i]);
const RUBY = '#b0142c', RUBY_HI = '#ff5a6e', RUBY_DK = '#6a0818', MARBLE = '#e8eef6', MARBLE_DK = '#b8c8dc', GOLD = '#e0b84a';

function onPalaceScreen() { return G.mapId === 'overworld' && G.scr && G.scr.x === 2 && G.scr.y === 0; }
function drawPalace() {
  if (!onPalaceScreen()) return;
  const ox = Math.round(PALACE.x0 - G.cam.x), oy = Math.round(PALACE.y0 - G.cam.y), night = isNight();
  const X = (x, y, w, h, c) => R(ox + x, oy + y, w, h, c);
  // the glacier it is carved into
  X(0, 0, 224, 64, '#bcd6ea'); for (let i = 0; i < 14; i++) X(i * 16 + (i % 3) * 3, 0, 2, 64, '#a6c4dc');
  // a red carpet out of the front door, like a hotel
  X(PALACE.door - 6, 62, 12, 34, RUBY); X(PALACE.door - 6, 62, 1, 34, GOLD); X(PALACE.door + 5, 62, 1, 34, GOLD);
  // side towers with pointed roofs and ruby flags
  for (const tx of [6, 196]) {
    X(tx, 10, 22, 54, MARBLE); X(tx + 18, 10, 4, 54, MARBLE_DK);
    pxPoly([[ox + tx - 2, oy + 12], [ox + tx + 11, oy - 8], [ox + tx + 24, oy + 12]], '#5a6a9a');
    X(tx + 10, -14, 1, 8, '#4a4a5a'); X(tx + 11, -14, 6, 4, Math.floor(G.t * 3 + tx) % 2 ? RUBY : RUBY_HI);
    X(tx + 7, 20, 8, 10, night ? '#ffd27a' : '#3a4a7a'); X(tx + 7, 20, 8, 1, RUBY);
  }
  // the hotel: two storeys of marble with gold cornices
  X(26, 22, 172, 42, MARBLE); X(26, 22, 172, 2, GOLD); X(26, 42, 172, 2, GOLD); X(26, 60, 172, 4, MARBLE_DK);
  for (let x = 30; x < 196; x += 6) X(x, 24, 1, 2, MARBLE_DK);
  // the cathedral front in the middle: a tall gable, a spire and a rose window
  X(80, 8, 48, 56, MARBLE); X(124, 8, 4, 56, MARBLE_DK);
  pxPoly([[ox + 78, oy + 10], [ox + 104, oy - 18], [ox + 130, oy + 10]], '#d0dcec');
  pxPoly([[ox + 100, oy - 10], [ox + 104, oy - 30], [ox + 108, oy - 10]], '#5a6a9a');
  const rx = ox + PALACE.door, ry = oy + 24;
  pxEllipseFill(rx, ry, 9, 9, RUBY_DK);
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + G.t * 0.2; pxEllipseFill(rx + Math.cos(a) * 5, ry + Math.sin(a) * 5, 2, 2, k % 2 ? RUBY_HI : '#5fa8ff'); }
  pxEllipseFill(rx, ry, 2, 2, '#ffd84a'); pxEllipse(rx, ry, 9, 9, RUBY, 1);
  // the arches: Imperial Ruby frames, warm hotel windows below, stained glass above
  for (const a of PALACE_ARCHES) {
    const x = ox + a.x, y = oy + a.y, r = a.w / 2;
    R(x, y + r, a.w, a.h - r, RUBY); pxEllipseFill(x + r, y + r, r, r, RUBY);
    const inner = a.glass ? (Math.floor(a.x / 20) % 2 ? '#3a6ad0' : '#7a3ab0') : (a.lit && night ? '#ffd27a' : a.lit ? '#f0c068' : '#2a1040');
    R(x + 2, y + r, a.w - 4, a.h - r - (a.glass ? 1 : 0), inner); pxEllipseFill(x + r, y + r, r - 2, r - 2, inner);
    if (!a.glass) R(x + 2, y + a.h - 3, a.w - 4, 1, '#c89848');
    R(x + 1, y + r, 1, a.h - r, RUBY_HI);
  }
  // the grand door: a pointed ruby portal, five gold stars above it
  pxPoly([[ox + 90, oy + 64], [ox + 90, oy + 46], [ox + 104, oy + 34], [ox + 118, oy + 46], [ox + 118, oy + 64]], RUBY);
  pxPoly([[ox + 94, oy + 64], [ox + 94, oy + 48], [ox + 104, oy + 39], [ox + 114, oy + 48], [ox + 114, oy + 64]], '#3a2210');
  X(103, 44, 2, 20, '#24140a'); X(100, 54, 2, 2, GOLD); X(106, 54, 2, 2, GOLD);
  X(88, 30, 32, 6, '#2a1040'); X(88, 30, 32, 1, GOLD);
  for (let i = 0; i < 5; i++) pxPoly(starPts(ox + 92 + i * 6, oy + 33, 2.5), '#ffd84a');
  // penguins on top of the arches (Yay!)
  PALACE_PENGUINS.forEach((i, k) => {
    const a = PALACE_ARCHES[i], f = Math.floor(G.t * 2 + k) % 2, img = SPR[`peng_down_${f}${k % 2 ? '_f' : ''}`];
    if (img) spr(img, ox + a.x + a.w / 2, oy + a.y + 1);
  });
}
function starPts(cx, cy, r) { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return p; }

// ---------- the scene: Owen's observation point in the forest ----------
function palaceScene() {
  setFlag('page9');
  const done = () => { writeSave(); elfArrives(false); };
  if (G.state === 'talk' && G.talk) { G.talk.queue.push(...STORY.palace_view); const d = G.talk.done; G.talk.done = () => { if (d) d(); done(); }; return; }
  say(STORY.palace_view, done);
}
const _onEnterScreen = onEnterScreen;
onEnterScreen = function () {
  _onEnterScreen();
  if (G.mode === 'story' && onPalaceScreen() && flag('giant_done') && !flag('page9')) palaceScene();
  else if (G.mode === 'story' && onPalaceScreen() && flag('page9') && !flag('page10') && G.state === 'play') elfArrives(true);
};
const _drawDecorGroundP = drawDecorGround;
drawDecorGround = function () { _drawDecorGroundP(); drawPalace(); };
// Jon brings it up later, like his other memories
MEMORIES.push({ id: 'catch', ok: () => flag('page9'), line: () => 'For the record, I am NOT bad at catch. I am being NICE. There is a difference.' });
MEMORIES.push({ id: 'ruby', ok: () => flag('page9'), line: () => 'Imperial Ruby is the SECOND sharpest. Second. Who\'s first? Me. Just making sure you remember.' });
