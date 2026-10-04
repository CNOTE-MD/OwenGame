// Music: plays music/score.json (inlined as SCORE) with a small Web Audio band.
// Bass, distorted guitar, saw lead, pads, plucks, bells, flute, and a drum kit with toms.

const Music = {
  on: true, name: null, bus: null, ev: null, len: 0, start: 0, idx: 0, cache: {}, noise: null, dist: null,

  midiFreq(tok) {
    const n = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[tok[0]];
    const acc = tok[1] === '#' ? 1 : tok[1] === 'b' ? -1 : 0, oct = parseInt(tok.slice(acc ? 2 : 1), 10);
    return 440 * Math.pow(2, ((oct + 1) * 12 + n + acc - 69) / 12);
  },
  compile(id) {
    if (this.cache[id]) return this.cache[id];
    const tr = SCORE[id], step = 30 / tr.bpm, ev = [];
    let t0 = 0;
    for (const sid of tr.order) {
      const sec = tr.sections[sid], n = sec.steps;
      let bars = 0;
      for (const line in sec) {
        if (line === 'steps') continue;
        if (/^[a-z]$/.test(line)) {
          const chars = sec[line].replace(/[|\s]/g, '');
          bars = chars.length / n;
          [...chars].forEach((c, i) => { if (c !== '.') ev.push({ t: t0 + i * step, inst: 'drum', kind: line === 't' ? 't' + c : line, acc: c === 'X' }); });
        } else {
          const toks = sec[line].split('|').flatMap(b => b.trim().split(/\s+/));
          bars = toks.length / n;
          toks.forEach((tok, i) => {
            if (tok === '-' || tok === '.') return;
            let hold = 1; while (toks[i + hold] === '-') hold++;
            ev.push({ t: t0 + i * step, d: hold * step, inst: line, f: tok.split('+').map(x => this.midiFreq(x)) });
          });
        }
      }
      t0 += bars * n * step;
    }
    ev.sort((a, b) => a.t - b.t);
    return (this.cache[id] = { ev, len: t0, gain: tr.gain || 1 });
  },

  want(id) {
    const ac = Sound.ac;
    if (!ac) return;
    if (!this.on || Sound.muted) id = null;
    if (id === this.name) return;
    const now = ac.currentTime;
    if (this.bus) { const old = this.bus; old.gain.cancelScheduledValues(now); old.gain.setValueAtTime(old.gain.value, now); old.gain.linearRampToValueAtTime(0, now + 0.7); setTimeout(() => old.disconnect(), 900); }
    this.name = id; this.bus = null;
    if (!id) return;
    const c = this.compile(id);
    this.ev = c.ev; this.len = c.len; this.idx = 0; this.start = now + 0.15;
    this.bus = ac.createGain(); this.bus.gain.setValueAtTime(0, now); this.bus.gain.linearRampToValueAtTime(0.32 * c.gain, now + 0.8);
    this.bus.connect(ac.destination);
  },

  tick() {
    const ac = Sound.ac;
    if (!ac || !this.bus || !this.ev) return;
    const now = ac.currentTime, ahead = now + 0.25;
    // after the tab was hidden, rejoin at the start of the loop instead of firing a backlog
    if (this.start + (this.ev[this.idx] ? this.ev[this.idx].t : this.len) < now - 0.3) { this.start = now + 0.1; this.idx = 0; }
    while (true) {
      if (this.idx >= this.ev.length) { this.idx = 0; this.start += this.len; }
      const e = this.ev[this.idx], at = this.start + e.t;
      if (at > ahead) break;
      if (at >= now - 0.05) this.note(e, Math.max(at, now));
      this.idx++;
    }
  },

  // ---------- instruments ----------
  env(g, t, a, peak, d, sus, rel, end) {
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * sus), t + a + d);
    g.gain.setValueAtTime(Math.max(0.0001, peak * sus), end); g.gain.exponentialRampToValueAtTime(0.0001, end + rel);
  },
  osc(type, f, t, end, detune = 0) { const o = Sound.ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.setValueAtTime(detune, t); o.start(t); o.stop(end + 0.6); return o; },
  note(e, t) {
    const ac = Sound.ac, out = this.bus;
    if (e.inst === 'drum') return this.drum(e, t);
    const end = t + e.d * 0.92;
    for (const f of e.f) {
      const g = ac.createGain(), flt = ac.createBiquadFilter();
      flt.type = 'lowpass'; g.connect(out); flt.connect(g);
      switch (e.inst) {
        case 'bass': {   // round-wound pick bass: saw + square, filter that snaps shut
          this.osc('sawtooth', f, t, end).connect(flt); this.osc('square', f / 2, t, end, 4).connect(flt);
          flt.frequency.setValueAtTime(2200, t); flt.frequency.exponentialRampToValueAtTime(500, t + 0.18); flt.Q.value = 4;
          this.env(g, t, 0.005, 0.55, 0.2, 0.55, 0.08, end); break; }
        case 'gtr': {    // distorted power chords
          const sh = this.shaper(), o1 = this.osc('sawtooth', f, t, end, -9), o2 = this.osc('sawtooth', f, t, end, 9);
          o1.connect(sh); o2.connect(sh); sh.connect(flt); flt.frequency.value = 2600; flt.Q.value = 1;
          this.env(g, t, 0.004, 0.13, 0.1, 0.7, 0.06, end); break; }
        case 'lead': {   // two detuned saws with delayed vibrato
          const o1 = this.osc('sawtooth', f, t, end, -7), o2 = this.osc('sawtooth', f, t, end, 7);
          const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 5.5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(12, t + 0.35);
          lfo.connect(lg); lg.connect(o1.detune); lg.connect(o2.detune); lfo.start(t); lfo.stop(end + 0.6);
          o1.connect(flt); o2.connect(flt); flt.frequency.setValueAtTime(1200, t); flt.frequency.linearRampToValueAtTime(3400, t + 0.08); flt.Q.value = 2;
          this.env(g, t, 0.02, 0.2, 0.3, 0.75, 0.15, end); break; }
        case 'pad':
          this.osc('triangle', f, t, end, -5).connect(flt); this.osc('sawtooth', f, t, end, 6).connect(flt); flt.frequency.value = 900;
          this.env(g, t, 0.35, 0.12, 0.5, 0.8, 0.6, end); break;
        case 'pluck':
          this.osc('triangle', f, t, end).connect(flt); this.osc('square', f * 2, t, end).connect(flt);
          flt.frequency.setValueAtTime(3000, t); flt.frequency.exponentialRampToValueAtTime(700, t + 0.25);
          this.env(g, t, 0.003, 0.22, 0.35, 0.2, 0.2, end); break;
        case 'bell':
          this.osc('sine', f, t, end).connect(flt); this.osc('sine', f * 2.76, t, end).connect(flt); flt.frequency.value = 6000;
          this.env(g, t, 0.003, 0.25, 0.9, 0.25, 1.2, end); break;
        case 'flute':
          this.osc('sine', f, t, end).connect(flt); this.osc('triangle', f, t, end, 3).connect(flt); flt.frequency.value = 2400;
          this.env(g, t, 0.06, 0.28, 0.2, 0.85, 0.15, end); break;
      }
    }
  },
  shaper() {
    if (!this.curve) { const n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / n * 2 - 1; c[i] = Math.tanh(x * 6); } this.curve = c; }
    const s = Sound.ac.createWaveShaper(); s.curve = this.curve; s.oversample = '2x'; return s;
  },
  noiseBuf() {
    if (!this.noise) { const ac = Sound.ac, n = ac.sampleRate, b = ac.createBuffer(1, n, n), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; this.noise = b; }
    return this.noise;
  },
  hit(t, dur, hp, lp, vol) {
    const ac = Sound.ac, s = ac.createBufferSource(), f1 = ac.createBiquadFilter(), f2 = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = this.noiseBuf(); f1.type = 'highpass'; f1.frequency.value = hp; f2.type = 'lowpass'; f2.frequency.value = lp;
    s.connect(f1); f1.connect(f2); f2.connect(g); g.connect(this.bus);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  },
  thump(t, f0, f1, dur, vol, type = 'sine') {
    const ac = Sound.ac, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + dur + 0.05);
  },
  drum(e, t) {
    const a = e.acc ? 1.3 : 1;
    switch (e.kind) {
      case 'k': this.thump(t, 140, 42, 0.16, 0.9 * a); break;
      case 's': this.hit(t, 0.14, 1200, 9000, 0.35 * a); this.thump(t, 220, 160, 0.06, 0.25 * a, 'triangle'); break;
      case 'r': this.hit(t, 0.03, 2500, 9000, 0.18); this.thump(t, 900, 700, 0.02, 0.12, 'square'); break;
      case 'h': this.hit(t, 0.035, 7000, 14000, 0.09 * a); break;
      case 'o': this.hit(t, 0.18, 6000, 14000, 0.09); break;
      case 'c': this.hit(t, 1.1, 3500, 14000, 0.16 * a); break;
      case 'th': this.thump(t, 260, 170, 0.22, 0.55); break;
      case 'tm': this.thump(t, 190, 120, 0.25, 0.55); break;
      case 'tl': this.thump(t, 130, 80, 0.3, 0.6); break;
    }
  },
};

// which piece fits what is on screen
function musicFor() {
  const st = G.state;
  if (st === 'title') return 'title';
  if (st === 'cutscene' || (st === 'talk' && G.talk && G.talk.back === 'cutscene')) return 'creepy';
  if (st === 'over' || st === 'arenaover') return null;
  if (G.mode === 'arena') {
    if (st === 'shop' || st === 'levelup') return 'village';
    return G.ents.some(e => e.type === 'king' && e.alive) ? 'boss' : 'arena';
  }
  if (!G.map) return null;
  if (G.mapId === 'bjarne_house' && flag('bjarne_done')) return 'bjarne';
  if (G.map.interior) return 'village';
  if (G.map.dark) return 'dungeon';
  if (G.map.dungeon) return G.ents.some(e => e.boss && e.alive) ? 'boss' : 'dungeon';
  if (G.scr.y === 1 && G.scr.x <= 1) return 'village';
  return 'overworld';
}
