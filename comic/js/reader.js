// Panel renderer + page-by-page reader.
'use strict';

// A panel: { vb: [W, H], art(W, H), pop?(W, H), text?(W, H), frames?: [{ d, art }], bg?, tilt? }
// art is clipped to the frame; pop draws over the border (figures breaking out); text letters on top.
function panelSVG(p) {
  DEFS = [];
  const [W, H] = p.vb;
  LETTER_MIN = W >= 600 ? 21 : 15;
  let body = '';
  const frames = p.frames ? p.frames.map(f => ({ d: typeof f.d === 'function' ? f.d(W, H) : f.d, art: f.art })) : [{ d: `M0,0 H${W} V${H} H0Z`, art: p.art }];
  for (const f of frames) {
    const art = f.art(W, H);
    const cid = uid('fc');
    DEFS.push(`<clipPath id="${cid}"><path d="${f.d}"/></clipPath>`);
    body += `<g clip-path="url(#${cid})">${Rect(-10, -10, W + 20, H + 20, p.bg || '#ffffff')}${art}</g>${P(f.d, 'none', 5)}`;
  }
  const pop = p.pop ? p.pop(W, H) : '';
  const txt = p.text ? p.text(W, H) : '';
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${(p.alt || '').replace(/"/g, '&quot;')}"><defs>${DEFS.join('')}</defs>${body}${pop}${txt}</svg>`;
}

function renderPage(pg, i) {
  const rows = pg.rows.map(row => { const sum = row.reduce((a, p) => a + p.vb[0] / p.vb[1], 0); return `<div class="row">${row.map(p => `<figure class="pnl${p.cls ? ' ' + p.cls : ''}" style="--ar:${p.vb[0]}/${p.vb[1]};--basis:calc((100% - ${(row.length - 1) * 10}px) * ${((p.vb[0] / p.vb[1]) / sum).toFixed(5)})">${panelSVG(p)}</figure>`).join('')}</div>`; }).join('');
  return `<article class="page${pg.cls ? ' ' + pg.cls : ''}" id="page-${i}" data-i="${i}" aria-label="${pg.label}">${pg.head || ''}${rows}${pg.foot || ''}<div class="folio">${i === 0 ? '' : i}</div></article>`;
}

const Reader = {
  i: 0, mode: 'page',
  init() {
    const book = document.getElementById('book');
    book.innerHTML = PAGES.map(renderPage).join('');
    this.pages = [...book.querySelectorAll('.page')];
    this.count = this.pages.length;
    const fromHash = () => { const m = /^#page-(\d+)$/.exec(location.hash); return m ? Math.min(this.count - 1, +m[1]) : null; };
    let start = fromHash();
    if (start === null) { try { start = +(localStorage.getItem('jontuka-page') || 0); } catch (e) { start = 0; } }
    try { if (localStorage.getItem('jontuka-mode') === 'scroll') this.mode = 'scroll'; } catch (e) {}
    this.go(start || 0, false);
    document.getElementById('prev').onclick = () => this.go(this.i - 1);
    document.getElementById('next').onclick = () => this.go(this.i + 1);
    document.getElementById('prev2').onclick = () => this.go(this.i - 1);
    document.getElementById('next2').onclick = () => this.go(this.i + 1);
    document.getElementById('mode').onclick = () => this.setMode(this.mode === 'page' ? 'scroll' : 'page');
    window.addEventListener('hashchange', () => { const h = fromHash(); if (h !== null && h !== this.i) this.go(h, false); });
    document.addEventListener('keydown', e => {
      if (e.target.closest && e.target.closest('input,textarea')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { if (this.mode === 'page') { e.preventDefault(); this.go(this.i + 1); } }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { if (this.mode === 'page') { e.preventDefault(); this.go(this.i - 1); } }
    });
    // swipe (page mode): a mostly-horizontal flick turns the page
    let sx = 0, sy = 0, st = 0;
    book.addEventListener('touchstart', e => { if (e.touches.length !== 1) { st = 0; return; } sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now(); }, { passive: true });
    book.addEventListener('touchend', e => {
      if (!st || this.mode !== 'page' || (window.visualViewport && window.visualViewport.scale > 1.05)) return;
      const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (Date.now() - st < 700 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6) this.go(this.i + (dx < 0 ? 1 : -1));
      st = 0;
    }, { passive: true });
    this.setMode(this.mode, true);
    // in scroll mode keep the counter honest
    this.io = new IntersectionObserver(es => { if (this.mode !== 'scroll') return; es.forEach(en => { if (en.isIntersecting) { this.i = +en.target.dataset.i; this.ui(); } }); }, { rootMargin: '-45% 0px -50% 0px' });
    this.pages.forEach(p => this.io.observe(p));
  },
  go(n, scroll = true) {
    n = Math.max(0, Math.min(this.count - 1, n));
    const changed = n !== this.i;
    this.i = n;
    if (this.mode === 'page') {
      this.pages.forEach((p, k) => { p.hidden = k !== n; });
      if (scroll && changed) window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
      if (changed) { const pg = this.pages[n]; pg.classList.remove('turn'); void pg.offsetWidth; pg.classList.add('turn'); }
    } else if (scroll) this.pages[n].scrollIntoView({ behavior: 'smooth', block: 'start' });
    try { localStorage.setItem('jontuka-page', String(n)); } catch (e) {}
    try { if (location.hash !== '#page-' + n) history.replaceState(null, '', '#page-' + n); } catch (e) {}
    this.ui();
  },
  setMode(m, first) {
    this.mode = m;
    document.body.classList.toggle('scrollmode', m === 'scroll');
    try { localStorage.setItem('jontuka-mode', m); } catch (e) {}
    if (m === 'page') this.pages.forEach((p, k) => { p.hidden = k !== this.i; });
    else { this.pages.forEach(p => { p.hidden = false; }); if (!first) this.pages[this.i].scrollIntoView({ block: 'start' }); }
    this.ui();
  },
  ui() {
    const label = this.i === 0 ? 'Cover' : `Page ${this.i} of ${this.count - 1}`;
    document.getElementById('count').textContent = label;
    document.getElementById('count2').textContent = label;
    const m = document.getElementById('mode');
    m.textContent = this.mode === 'page' ? 'Read all' : 'Page by page';
    m.setAttribute('aria-pressed', this.mode === 'scroll');
    ['prev', 'prev2'].forEach(id => { document.getElementById(id).disabled = this.i === 0; });
    ['next', 'next2'].forEach(id => { document.getElementById(id).disabled = this.i === this.count - 1; });
  },
};

function boot() {
  document.body.insertAdjacentHTML('afterbegin', globalDefs());
  Reader.init();
}
const fontsReady = document.fonts && document.fonts.load
  ? Promise.race([Promise.all(['700 24px "Comic Neue"', '700 24px Kalam', '24px Bangers'].map(f => document.fonts.load(f))), new Promise(r => setTimeout(r, 2500))])
  : Promise.resolve();
fontsReady.then(boot, boot);
