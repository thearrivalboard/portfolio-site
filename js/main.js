/* Shared behaviour across all pages. Everything below guards on the
   presence of its target element, so it's safe to load on every page. */

document.documentElement.classList.add('js');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------------- */
/* header: condense + hide on scroll down                                  */
/* ---------------------------------------------------------------------- */
(function header(){
  const header = document.querySelector('.site-header');
  if(!header) return;
  let lastY = window.scrollY;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    header.classList.toggle('is-condensed', y > 40);
    if(y > lastY && y > 200){
      header.classList.add('is-hidden');
    } else {
      header.classList.remove('is-hidden');
    }
    lastY = y;
  }, { passive: true });
})();

/* ---------------------------------------------------------------------- */
/* scroll progress bar                                                     */
/* ---------------------------------------------------------------------- */
(function progress(){
  const bar = document.querySelector('.scroll-progress');
  if(!bar) return;
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? window.scrollY / max : 0;
    bar.style.transform = `scaleX(${pct})`;
  }, { passive: true });
})();

/* ---------------------------------------------------------------------- */
/* mobile menu                                                             */
/* ---------------------------------------------------------------------- */
(function mobileMenu(){
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.mobile-menu');
  if(!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }));
})();

/* ---------------------------------------------------------------------- */
/* custom cursor                                                           */
/* ---------------------------------------------------------------------- */
(function cursor(){
  if(window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if(!dot || !ring) return;

  let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
  let ringX = mouseX, ringY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%,-50%)`;
  });

  function loop(){
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  const hoverables = 'a, button, .project-card, .work-row, .hero-chip, input, textarea, select';
  document.addEventListener('mouseover', (e) => {
    if(e.target.closest(hoverables)) ring.classList.add('is-active');
  });
  document.addEventListener('mouseout', (e) => {
    if(e.target.closest(hoverables)) ring.classList.remove('is-active');
  });
})();

/* ---------------------------------------------------------------------- */
/* reveal on scroll                                                        */
/* ---------------------------------------------------------------------- */
(function reveal(){
  const items = document.querySelectorAll('[data-reveal]');
  if(!items.length) return;

  if(prefersReducedMotion){
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  items.forEach(el => io.observe(el));
})();

/* ---------------------------------------------------------------------- */
/* hero headline split-reveal on load                                      */
/* ---------------------------------------------------------------------- */
(function heroLoad(){
  const hero = document.querySelector('.hero');
  if(!hero) return;
  requestAnimationFrame(() => {
    setTimeout(() => hero.classList.add('is-loaded'), 150);
  });
})();

/* ---------------------------------------------------------------------- */
/* hero parallax (mouse + scroll)                                          */
/* ---------------------------------------------------------------------- */
(function heroParallax(){
  if(prefersReducedMotion) return;
  const hero = document.querySelector('.hero');
  const layers = document.querySelectorAll('[data-parallax]');
  if(!hero || !layers.length) return;

  hero.addEventListener('mousemove', (e) => {
    const { innerWidth: w, innerHeight: h } = window;
    const px = (e.clientX / w - 0.5);
    const py = (e.clientY / h - 0.5);
    layers.forEach(layer => {
      const depth = parseFloat(layer.dataset.parallax) || 10;
      layer.style.transform = `translate(${px * depth}px, ${py * depth}px)`;
    });
  });

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    hero.style.setProperty('--scrollShift', `${y * 0.25}px`);
  }, { passive: true });
})();

/* ---------------------------------------------------------------------- */
/* draggable hero chips                                                    */
/* ---------------------------------------------------------------------- */
(function dragChips(){
  const chips = document.querySelectorAll('.hero-chip');
  const ring = document.querySelector('.cursor-ring');
  if(!chips.length) return;

  chips.forEach(chip => {
    let active = false, offX = 0, offY = 0, startX = 0, startY = 0;

    const start = (x, y) => {
      active = true;
      const rect = chip.getBoundingClientRect();
      offX = x - rect.left; offY = y - rect.top;
      startX = rect.left; startY = rect.top;
      chip.style.position = 'fixed';
      chip.style.left = rect.left + 'px';
      chip.style.top = rect.top + 'px';
      chip.style.right = 'auto';
      chip.style.zIndex = 50;
      if(ring) ring.classList.add('is-drag');
    };
    const move = (x, y) => {
      if(!active) return;
      chip.style.left = (x - offX) + 'px';
      chip.style.top = (y - offY) + 'px';
    };
    const end = () => {
      active = false;
      if(ring) ring.classList.remove('is-drag');
    };

    chip.addEventListener('pointerdown', (e) => {
      chip.setPointerCapture(e.pointerId);
      start(e.clientX, e.clientY);
    });
    chip.addEventListener('pointermove', (e) => move(e.clientX, e.clientY));
    chip.addEventListener('pointerup', end);
    chip.addEventListener('pointercancel', end);
  });
})();

/* ---------------------------------------------------------------------- */
/* magnetic buttons                                                        */
/* ---------------------------------------------------------------------- */
(function magnetic(){
  if(prefersReducedMotion) return;
  const els = document.querySelectorAll('.magnetic');
  els.forEach(el => {
    const strength = 22;
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x / rect.width * strength}px, ${y / rect.height * strength}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = 'translate(0,0)'; });
  });
})();

/* ---------------------------------------------------------------------- */
/* marquee: duplicate content for seamless loop                            */
/* ---------------------------------------------------------------------- */
(function marquee(){
  document.querySelectorAll('.marquee-track').forEach(track => {
    track.innerHTML += track.innerHTML;
  });
})();

/* ---------------------------------------------------------------------- */
/* counting stats                                                          */
/* ---------------------------------------------------------------------- */
(function counters(){
  const nums = document.querySelectorAll('[data-count]');
  if(!nums.length) return;

  const animate = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const duration = 1200;
    const startTime = performance.now();

    if(prefersReducedMotion){
      el.textContent = target + suffix;
      return;
    }

    function tick(now){
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if(t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        animate(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  nums.forEach(el => io.observe(el));
})();

/* ---------------------------------------------------------------------- */
/* work card tilt                                                          */
/* ---------------------------------------------------------------------- */
(function tilt(){
  if(prefersReducedMotion) return;
  document.querySelectorAll('.project-card').forEach(card => {
    const media = card.querySelector('.card-media');
    if(!media) return;
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      media.style.transform = `perspective(600px) rotateX(${y * -6}deg) rotateY(${x * 6}deg)`;
    });
    card.addEventListener('mouseleave', () => { media.style.transform = ''; });
  });
})();

/* ---------------------------------------------------------------------- */
/* work.html filter                                                        */
/* ---------------------------------------------------------------------- */
(function filter(){
  const bar = document.querySelector('.filter-bar');
  const cards = document.querySelectorAll('.project-card');
  if(!bar || !cards.length) return;

  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if(!btn) return;
    bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const cat = btn.dataset.filter;

    cards.forEach(card => {
      const match = cat === 'all' || card.dataset.category === cat;
      card.classList.toggle('is-hidden', !match);
    });
  });
})();
