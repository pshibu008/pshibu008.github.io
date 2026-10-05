(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };

  // Theme
  const root = document.documentElement;
  const saved = store.get('theme');
  root.dataset.theme = saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  $('#theme').onclick = () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    store.set('theme', root.dataset.theme);
  };

  // Mobile menu
  const links = $('#links');
  $('#burger').onclick = () => links.classList.toggle('open');
  $$('a', links).forEach(a => a.addEventListener('click', () => links.classList.remove('open')));

  // Scroll: progress bar, nav border, active link
  const sections = $$('main section[id]');
  const onScroll = () => {
    const h = document.documentElement;
    $('#progress').style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%';
    $('#nav').classList.toggle('scrolled', h.scrollTop > 10);
    let cur = sections[0].id;
    sections.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * 0.35) cur = s.id; });
    if (h.scrollTop + innerHeight >= h.scrollHeight - 4) cur = sections[sections.length - 1].id;
    $$('a:not(.btn)', links).forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
    if (hashReady && cur !== currentHash) {
      currentHash = cur;
      try { history.replaceState(null, '', '#' + cur); } catch {}
    }
  };
  // Keep the URL hash in sync with the visible section, but only once the page has
  // loaded and the user scrolls — so a deep link like #contact isn't overwritten on load.
  let currentHash = location.hash.slice(1), hashReady = false, loaded = false;
  addEventListener('load', () => setTimeout(() => { loaded = true; }, 600));
  addEventListener('scroll', () => { if (loaded) hashReady = true; onScroll(); }, { passive: true });
  onScroll();

  // Typing effect
  const words = ['Android apps', 'payment SDKs', 'BLE & IoT solutions', 'secure experiences'];
  const el = $('#typed');
  let w = 0, c = 0, del = false;
  (function tick() {
    const word = words[w];
    el.textContent = word.slice(0, c);
    if (!del && c === word.length) { del = true; return setTimeout(tick, 1600); }
    if (del && c === 0) { del = false; w = (w + 1) % words.length; }
    c += del ? -1 : 1;
    setTimeout(tick, del ? 40 : 85);
  })();

  // Counters
  const count = n => {
    const target = +n.dataset.count, suf = n.dataset.suffix || '';
    const t0 = performance.now();
    (function step(t) {
      const p = Math.min((t - t0) / 1400, 1);
      n.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suf;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  };

  // Reveal on scroll
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    $$('[data-count]', e.target).forEach(count);
    if (e.target.matches('[data-count]')) count(e.target);
    $$('.bar', e.target).forEach(b => b.classList.add('in'));
    io.unobserve(e.target);
  }), { threshold: .15 });
  $$('.reveal').forEach((n, i) => { n.style.transitionDelay = (i % 4) * 90 + 'ms'; io.observe(n); });
  $$('.hero [data-count]').forEach(count);

  // Project filters
  $$('.filters button').forEach(b => b.onclick = () => {
    $$('.filters button').forEach(x => x.classList.toggle('on', x === b));
    $$('.proj').forEach(p => p.classList.toggle('hide', b.dataset.f !== 'all' && p.dataset.cat !== b.dataset.f));
  });

  // Contact form -> FormSubmit (delivers to the inbox), mailto only as a fallback
  const TO = 'pshibu311@gmail.com';
  const form = $('#form'), note = $('#formnote'), sendBtn = $('button[type=submit]', form);
  const say = (msg, kind) => { note.textContent = msg; note.className = 'small form-note ' + (kind || ''); };
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const f = new FormData(form);
    if (f.get('_honey')) return; // bot trap
    sendBtn.disabled = true; sendBtn.textContent = 'Sending…'; say('');
    try {
      const res = await fetch('https://formsubmit.co/ajax/' + TO, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: JSON.stringify({
          name: f.get('name'), email: f.get('email'), message: f.get('message'),
          _subject: 'Portfolio enquiry from ' + f.get('name'),
          _replyto: f.get('email'), _template: 'table', _captcha: 'false'
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === 'false') throw new Error(data.message || 'Request failed');
      form.reset();
      say('✅ Thanks! Your message has been sent — I\'ll get back to you soon.', 'ok');
    } catch (err) {
      const body = `${f.get('message')}\n\n— ${f.get('name')} (${f.get('email')})`;
      say('⚠️ Couldn\'t send right now. Opening your email app instead…', 'err');
      setTimeout(() => location.href = `mailto:${TO}?subject=${encodeURIComponent('Portfolio enquiry from ' + f.get('name'))}&body=${encodeURIComponent(body)}`, 900);
    } finally {
      sendBtn.disabled = false; sendBtn.textContent = 'Send message';
    }
  });

  $('#year').textContent = new Date().getFullYear();
})();
