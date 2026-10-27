(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // load-in
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('loaded')));

  // reveal on scroll (staggered within a group)
  const items = $$('.reveal');
  items.forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 5) * 0.09}s`);
  });
  const countUp = (el) => {
    const to = +el.dataset.count; if (reduce) { el.textContent = to; return; }
    el.textContent = 0;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / 1400, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        el.classList.add('in');
        if (el.classList.contains('card')) setTimeout(() => el.classList.add('settled'), 1300);
        $$('.count', el).forEach(countUp);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => { el.classList.add('in', 'settled'); $$('.count', el).forEach((c) => (c.textContent = c.dataset.count)); });
  }
  $$('.count').forEach((c) => { if (!c.closest('.reveal')) countUp(c); });

  // cards: cursor glow + gentle tilt (mouse only)
  $$('[data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      el.style.setProperty('--mx', `${x}px`);
      el.style.setProperty('--my', `${y}px`);
      if (reduce) return;
      el.style.setProperty('--ry', `${((x / r.width) - .5) * 4}deg`);
      el.style.setProperty('--rx', `${(.5 - (y / r.height)) * 3}deg`);
      el.style.setProperty('--ty', '-4px');
    });
    el.addEventListener('pointerleave', () => {
      ['--rx', '--ry'].forEach((k) => el.style.setProperty(k, '0deg'));
      el.style.setProperty('--ty', '0px');
    });
  });

  // nav state
  const nav = $('#nav');

  // hero stage: scale to container + pointer parallax
  const wrap = $('.stage-wrap'), stage = $('#stage');
  const fit = () => {
    if (!wrap.clientWidth) return;
    const s = Math.min(1, wrap.clientWidth / 560);
    wrap.style.setProperty('--s', s.toFixed(4));
  };
  fit();
  window.addEventListener('resize', fit);

  const depthEls = $$('[data-depth]');
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  const loop = () => {
    cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07;
    depthEls.forEach((el) => {
      const d = +el.dataset.depth;
      el.style.transform = `translate3d(${(cx * d).toFixed(2)}px, ${(cy * d).toFixed(2)}px, 0)`;
    });
    raf = (Math.abs(tx - cx) > .001 || Math.abs(ty - cy) > .001) ? requestAnimationFrame(loop) : 0;
  };
  if (!reduce) {
    const hero = $('.hero');
    hero.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - .5) * -1;
      ty = ((e.clientY - r.top) / r.height - .5) * -1;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    hero.addEventListener('pointerleave', () => { tx = ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
  } else {
    $$('svg').forEach((s) => s.pauseAnimations && s.pauseAnimations());
  }

  // manifesto: scroll-scrubbed word highlight
  const man = $('#manifest');
  const words = man.textContent.trim().split(/\s+/);
  man.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(' ');
  const wEls = $$('.w', man);

  // scroll: parallax var, nav, rail, manifesto
  const rail = $$('.rail a');
  const secs = rail.map((a) => document.getElementById(a.dataset.sec));
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = window.scrollY, vh = window.innerHeight;
    document.documentElement.style.setProperty('--sy', y);
    nav.classList.toggle('scrolled', y > 20);
    let cur = 0;
    secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < vh * 0.5) cur = i; });
    rail.forEach((a, i) => a.classList.toggle('on', i === cur));
    const r = man.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.45 + r.height)));
    const n = Math.round(p * wEls.length * 1.15);
    wEls.forEach((w, i) => w.classList.toggle('on', i < n));
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  $('#year').textContent = new Date().getFullYear();
})();