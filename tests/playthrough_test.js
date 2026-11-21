// A bot plays Owen's nine pages from a new save with the game's own inputs (direction keys and
// buttons, pathfinding by BFS): room, flight, Astrid, subway, exchange, taxi, log, giant, palace.
// It fails if any step stalls or errors. Takes about 90 seconds.
// Run: NODE_PATH=$(npm root -g) node tests/playthrough_test.js
const { chromium } = require('playwright');
const path = require('path');
const OUT = process.env.SHOTS || '/tmp';
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 560, height: 560 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + path.resolve(__dirname, '../web/index.html')); await pg.waitForTimeout(600);
  const ev = (f, a) => pg.evaluate(f, a); const wait = ms => pg.waitForTimeout(ms);
  const shot = async n => pg.locator('canvas').screenshot({ path: `${OUT}/play_${n.replace(/[^a-z0-9]+/gi, '_')}.png` });
  await ev(() => {
    try { localStorage.clear(); } catch (e) {}
    const B = window.BOT = { goal: null, adj: false, lines: 0, lineLog: [], hurt: 0, deaths: 0, fight: true, log: [], t0: performance.now(), talkT: 0, lastHp: null, lastState: null, jonLines: 0, lastJon: '' };
    const DIRS = [['ArrowRight', 1, 0], ['ArrowLeft', -1, 0], ['ArrowDown', 0, 1], ['ArrowUp', 0, -1]];
    const bad = (tx, ty) => { const c = tile(tx, ty); return solidTile(tx, ty, 'player') || c === '~' || c === 'w' || c === 'v' || c === 'l'; };
    B.path = (gx, gy, adj) => {
      const p = G.player, sx = Math.floor(p.x / 16), sy = Math.floor(p.y / 16), W = G.cols, H = G.rows.length;
      const blockedEnt = new Set(G.ents.filter(e => e.solid).map(e => Math.floor(e.x / 16) + ',' + Math.floor(e.y / 16)));
      const prev = new Map(), q = [[sx, sy]]; prev.set(sx + ',' + sy, null);
      const done = (x, y) => adj ? Math.abs(x - gx) + Math.abs(y - gy) === 1 : x === gx && y === gy;
      while (q.length) {
        const [x, y] = q.shift();
        if (done(x, y)) { const out = []; let k = x + ',' + y; while (prev.get(k)) { out.unshift(k.split(',').map(Number)); k = prev.get(k); } return out; }
        for (const [, dx, dy] of DIRS) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (nx < 0 || ny < 0 || nx >= W || ny >= H || prev.has(k) || bad(nx, ny) || blockedEnt.has(k)) continue; prev.set(k, x + ',' + y); q.push([nx, ny]); }
      }
      return null;
    };
    B.tick = () => {
      for (const k of (B.mine || [])) keys[k] = false; B.mine = [];
      const _k = keys; const set = k => { _k[k] = true; B.mine.push(k); };
      const st = G.state;
      if (st !== B.lastState) { B.log.push([Math.round((performance.now() - B.t0) / 100) / 10, st, G.mapId, G.scr ? G.scr.x + ',' + G.scr.y : '']); B.lastState = st; }
      if (G.player) { if (B.lastHp !== null && G.player.hp < B.lastHp) B.hurt += B.lastHp - G.player.hp; B.lastHp = G.player.hp; }
      if (typeof JT !== 'undefined' && JT.line && JT.line !== B.lastJon && JT.t > 0) { B.lastJon = JT.line; B.jonLines++; }
      if (st === 'over') { B.deaths++; edge.a = true; return; }
      if (st === 'talk') { B.talkT = (B.talkT || 0) + 1; if (G.talk && G.talk.cur && G.talk.cur !== B.curLine) { B.curLine = G.talk.cur; B.lines++; B.lineLog.push(G.talk.cur[0] + ': ' + G.talk.cur[1].slice(0, 60)); } if (B.talkT % 4 === 0) edge.a = true; return; }
      if (st === 'cutscene') { B.talkT++; if (B.talkT % 4 === 0) edge.a = true; return; }
      if (st === 'jonlevel') { B.talkT++; if (B.talkT % 40 === 0) edge.a = true; return; }
      if (st !== 'play' || G.trans) return;
      const p = G.player;
      if (B.fight) { const e = G.ents.filter(o => o.enemy && o.alive && !o.safe && !o.under && !o.boss).sort((a, c) => dist(a, p) - dist(c, p))[0]; if (e && dist(e, p) < 26) { const dx = e.x - p.x, dy = e.y - p.y; set(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp')); if (p.cd <= 0) edge.a = true; return; } }
      if (!B.goal) return;
      const path = B.path(B.goal[0], B.goal[1], B.adj);
      if (!path) { B.stuck = (B.stuck || 0) + 1; return; }
      if (!path.length) { B.arrived = true; return; }
      const [nx, ny] = path[0], cx = nx * 16 + 8, cy = ny * 16 + 8, dx = cx - p.x, dy = cy - p.y;
      // line up on the cross axis first so corners don't snag
      const ptx = Math.floor(p.x / 16), pty = Math.floor(p.y / 16);
      if (nx !== ptx) { if (Math.abs(p.y - (pty * 16 + 8)) > 3) set(p.y > pty * 16 + 8 ? 'ArrowUp' : 'ArrowDown'); set(dx > 0 ? 'ArrowRight' : 'ArrowLeft'); }
      else { if (Math.abs(p.x - (ptx * 16 + 8)) > 3) set(p.x > ptx * 16 + 8 ? 'ArrowLeft' : 'ArrowRight'); set(dy > 0 ? 'ArrowDown' : 'ArrowUp'); }
    };
    setInterval(B.tick, 33);
  });
  const stat = () => ev(() => ({ t: Math.round((performance.now() - BOT.t0) / 1000), st: G.state, map: G.mapId, scr: G.scr && G.scr.x + ',' + G.scr.y, x: G.player && Math.floor(G.player.x / 16), y: G.player && Math.floor(G.player.y / 16), hp: G.player && G.player.hp, lines: BOT.lines, hurt: BOT.hurt, deaths: BOT.deaths, jon: BOT.jonLines, kr: G.save && G.save.kr }));
  const marks = []; const mark = async name => { const s = await stat(); marks.push({ name, ...s }); console.log('MARK', name, JSON.stringify(s)); await shot(name); };
  const goto = async (tx, ty, { adj = false, timeout = 60000, until } = {}) => {
    await ev(([tx, ty, adj]) => { BOT.goal = [tx, ty]; BOT.adj = adj; BOT.arrived = false; BOT.stuck = 0; }, [tx, ty, adj]);
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      await wait(150);
      const r = await ev(() => ({ a: BOT.arrived, st: G.state, s: BOT.stuck, map: G.mapId }));
      if (until && await ev(until)) break;
      if (r.a && r.st === 'play') break;
      if (r.s > 200) { console.log('  no path to', tx, ty, JSON.stringify(await stat())); break; }
    }
    await ev(() => { BOT.goal = null; });
    return (Date.now() - t0) < timeout;
  };
  const face = async (dx, dy) => { const k = dx > 0 ? 'ArrowRight' : dx < 0 ? 'ArrowLeft' : dy > 0 ? 'ArrowDown' : 'ArrowUp'; await pg.keyboard.down(k); await wait(90); await pg.keyboard.up(k); };
  const press = async (code, ms = 120) => { await pg.keyboard.press(code); await wait(ms); };
  const idle = async (cond, timeout = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < timeout) { if (await ev(cond)) return true; await wait(150); } return false; };
  const talkTo = async (tx, ty) => { await goto(tx, ty, { adj: true }); const p = await stat(); await face(Math.sign(tx - p.x), Math.sign(ty - p.y)); await press('KeyZ', 200); await idle(() => G.state === 'play' && !G.talk, 60000); };

  // ---------------- the playthrough ----------------
  await shot('title'); await press('KeyZ', 400);
  await idle(() => G.state === 'play', 30000); await mark('01 control after intro');
  await goto(7, 12, { timeout: 20000 });
  await pg.keyboard.down('ArrowDown'); await idle(() => G.state !== 'play' || G.mapId !== 'home', 5000); await pg.keyboard.up('ArrowDown');
  await idle(() => G.state === 'play' && G.mapId === 'overworld', 90000); await mark('02 landed in Norway');
  await talkTo(21, 35); await mark('03 talked to attendant');
  await talkTo(5, 20); await mark('04 met Astrid');
  await goto(19, 38, { until: () => G.mapId === 'subway', timeout: 90000 }); await idle(() => G.state === 'play' && G.mapId === 'subway', 8000); await mark('05 in the subway');
  await talkTo(3, 1); await mark('06 exchanged dollars');
  await talkTo(14, 5); await idle(() => G.state === 'play' && G.mapId === 'overworld', 90000); await mark('07 taxi to the Muck Forest');
  await goto(29, 6, { timeout: 120000, until: () => flag('log_scene') }); await idle(() => G.state === 'play', 30000); await mark('08 at the log');
  // chop the log three times
  for (let i = 0; i < 6 && !(await ev(() => flag('giant_woke'))); i++) { await goto(31, 6, { adj: true, timeout: 15000 }); const p = await stat(); await face(Math.sign(31 - p.x), Math.sign(6 - p.y)); await press('KeyZ', 500); }
  await idle(() => G.state === 'play' && G.ents.some(e => e.type === 'giant'), 60000); await mark('09 giant fight starts');
  // the fight: stay clear of the club, chop when it sticks, find the shivering tree, then talk him down
  const tFight = Date.now();
  while (Date.now() - tFight < 240000) {
    const r = await ev(() => {
      const g = G.ents.find(e => e.type === 'giant'), p = G.player; BOT.fight = false; const set = k => { keys[k] = !0; BOT.mine.push(k); };
      if (flag('giant_done')) return 'done';
      if (G.state === 'choice') { const c = G.choice; c.sel = c.opts.findIndex(o => /EAST|Jon.s idea/.test(o)); if (c.t > 0.3) edge.a = true; return 'choice'; }
      if (G.state !== 'play' || !g) { BOT.goal = null; return G.state; }
      const tiles = []; for (let ty = 1; ty < 13; ty++) for (let tx = 17; tx < 31; tx++) if (!solidTile(tx, ty, 'player') && tile(tx, ty) !== '~') tiles.push([tx, ty]);
      if (g.hiding) { const t = G.ents.find(e => e.kind === 'faketree' && e.real); if (t) { BOT.goal = [Math.floor(t.x / 16), Math.floor(t.y / 16)]; BOT.adj = true; if (dist(t, p) < 26) { const dx = t.x - p.x, dy = t.y - p.y; set(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp')); if (p.cd <= 0) edge.a = true; } } return 'hide'; }
      if (g.st === 'stuck') { BOT.goal = [Math.floor(g.x / 16), Math.floor(g.y / 16)]; BOT.adj = true; if (dist(g, p) < 30) { const dx = g.x - p.x, dy = g.y - p.y; BOT.goal = null; set(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp')); if (p.cd <= 0) edge.a = true; } return 'stuck'; }
      // otherwise keep moving away from him and from where the club or leaves will land
      const danger = [g, g.aim, g.wrapAt].filter(Boolean);
      const score = ([tx, ty]) => { const c = { x: tx * 16 + 8, y: ty * 16 + 8 }; return Math.min(...danger.map(d => dist(d, c))) - dist(c, p) * 0.35; };
      const best = tiles.filter(t => Math.hypot(t[0] * 16 + 8 - p.x, t[1] * 16 + 8 - p.y) < 90).sort((a, c) => score(c) - score(a))[0];
      BOT.goal = best || null; BOT.adj = false; return g.st;
    });
    if (r === 'done') break;
    await wait(120);
  }
  await ev(() => { BOT.fight = true; BOT.goal = null; }); await idle(() => G.state === 'play', 60000);
  await mark('10 giant resolved ' + (await ev(() => flag('giant_peace') ? '(peace)' : flag('giant_done') ? '(beaten)' : '(NOT DONE)')));
  await goto(34, 6, { timeout: 60000, until: () => flag('page9') }); await wait(600); await shot('palace_scene'); await idle(() => G.state === 'play', 60000); await mark('11 saw the palace (page 9)');
  await goto(39, 4, { timeout: 60000 }); await pg.keyboard.down('ArrowUp'); await idle(() => G.mapId === 'cavern', 6000); await pg.keyboard.up('ArrowUp'); await idle(() => G.state === 'play', 30000); await mark('12 inside Jjorvic Palace');
  const want = { '02': m => m.map === 'overworld', '04': m => m.kr >= 30, '05': m => m.map === 'subway', '06': m => m.kr >= 200, '07': m => m.scr === '1,0', '10': m => /peace|beaten/.test(m.name), '11': m => m.scr === '2,0', '12': m => m.map === 'cavern' };
  let fails = 0;
  for (const [k, ok] of Object.entries(want)) { const m = marks.find(x => x.name.startsWith(k)); const pass = !!m && ok(m); console.log((pass ? 'PASS ' : 'FAIL ') + (m ? m.name : k)); if (!pass) fails++; }
  const last = marks[marks.length - 1];
  console.log(`played in ${last.t}s, ${last.lines} lines of dialogue, ${last.hurt} half-hearts lost, ${last.deaths} naps`);
  console.log('errors:', errs); console.log('FAILS:', fails);
  await b.close();
  process.exit(fails || errs.length ? 1 : 0);
})();
