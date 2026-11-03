(function () {
  // Header shadow on scroll
  const header = document.getElementById('header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Mobile nav (not on the host pages)
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    }));
  }

  // Reveal on scroll
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          e.target.style.transitionDelay = (i % 4) * 80 + 'ms';
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }

  // Hero video: plays once over the still photo; the photo stays if the file fails or motion is unwelcome
  const heroVideo = document.getElementById('heroVideo');
  if (heroVideo) {
    const drop = () => heroVideo.remove();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      drop();
    } else {
      // Phone held upright: swap in the portrait video before anything loads
      const m = heroVideo.dataset;
      if (m.mMp4 && window.matchMedia('(max-aspect-ratio: 3/4)').matches) {
        heroVideo.innerHTML = (m.mWebm ? `<source src="${m.mWebm}" type="video/webm">` : '') + `<source src="${m.mMp4}" type="video/mp4">`;
        if (m.mPoster) heroVideo.poster = m.mPoster;
      }
      const sources = heroVideo.querySelectorAll('source');
      sources[sources.length - 1].addEventListener('error', drop);
      heroVideo.addEventListener('playing', () => heroVideo.classList.add('is-playing'), { once: true });
      heroVideo.preload = 'auto';
      heroVideo.load();
      heroVideo.play().catch(() => {});
    }
  }

  // Before / after sliders
  document.querySelectorAll('.ba__range').forEach(r => {
    const stage = r.closest('.ba__stage');
    const set = () => stage.style.setProperty('--pos', r.value + '%');
    r.addEventListener('input', set);
    set();
  });

  // Filmstrip gallery (atelier skeleton): arrows scroll it by most of a screen
  const strip = document.getElementById('atStrip');
  if (strip) {
    document.querySelectorAll('[data-strip]').forEach(b => b.addEventListener('click', () => {
      strip.scrollBy({ left: Number(b.dataset.strip) * strip.clientWidth * 0.8, behavior: 'smooth' });
    }));
  }

  // Proposal countdown: "ends in 5 days" beats a bare date
  document.querySelectorAll('[data-until]').forEach(el => {
    const until = el.dataset.until;
    if (!until) return;
    const end = new Date(until + 'T23:59:59');
    const days = Math.floor((end - new Date()) / 86400000);
    if (days < 0) return;
    const many = (days >= 2 && days <= 4 && el.dataset.few) ? el.dataset.few : el.dataset.many;  // čeština: 2–4 dny, 5+ dní
    el.textContent = days === 0 ? el.dataset.zero : days === 1 ? el.dataset.one : many.replace('{n}', days);
  });

  // Opening hours: highlight today
  const today = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
  document.querySelectorAll('.hours tr[data-day="' + today + '"]').forEach(tr => tr.classList.add('is-today'));

  // Google Map loads only on request (it sets third-party cookies)
  const mapBox = document.getElementById('mapBox');
  const mapLoad = document.getElementById('mapLoad');
  if (mapBox && mapLoad) {
    mapLoad.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.title = mapBox.dataset.title || 'Map';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.src = mapBox.dataset.src;
      mapBox.replaceChildren(f);
    });
  }

  // Gallery lightbox
  const items = Array.from(document.querySelectorAll('.gallery__item'));
  const lb = document.getElementById('lightbox');
  if (lb && items.length) {
    const lbImg = document.getElementById('lbImg');
    const lbCap = document.getElementById('lbCap');
    let current = 0;
    const show = idx => {
      current = (idx + items.length) % items.length;
      const img = items[current].querySelector('img');
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = items[current].querySelector('figcaption').textContent;
    };
    const close = () => { lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); };
    items.forEach((it, i) => {
      it.tabIndex = 0;
      const open = () => { show(i); lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false'); };
      it.addEventListener('click', open);
      it.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
    });
    document.getElementById('lbClose').addEventListener('click', close);
    document.getElementById('lbPrev').addEventListener('click', () => show(current - 1));
    document.getElementById('lbNext').addEventListener('click', () => show(current + 1));
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
  }

  // Quote form. On a proposal nothing is sent anywhere: the business has no inbox wired up yet,
  // so the form only shows how an enquiry would arrive once the site is theirs.
  // Once the owner adds an action (e.g. Formspree, per the free-page guide), valid forms submit for real.
  const form = document.getElementById('quoteForm');
  if (form) {
    const status = document.getElementById('formStatus');
    form.addEventListener('submit', e => {
      status.className = 'form__status';
      let valid = true;
      form.querySelectorAll('[required]').forEach(el => {
        const bad = !el.value.trim();
        el.closest('.field').classList.toggle('has-error', bad);
        if (bad) valid = false;
      });
      if (!valid) {
        e.preventDefault();
        status.textContent = form.dataset.msgInvalid;
        status.classList.add('is-error');
        return;
      }
      if (form.getAttribute('action')) return;
      e.preventDefault();
      status.textContent = form.dataset.msgPreview;
      status.classList.add('is-info');
    });
    form.addEventListener('input', e => {
      const f = e.target.closest('.field');
      if (f && e.target.value.trim()) f.classList.remove('has-error');
    });
  }
})();
