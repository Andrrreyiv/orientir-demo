// Переключатель Solo / Team, «оживление» экрана продукта и мелкое движение страницы
(function () {
  var seg = document.querySelector('.seg');
  var stage = document.querySelector('.stage');
  var btns = document.querySelectorAll('.seg__btn');
  var swaps = document.querySelectorAll('[data-solo]');
  var floats = document.querySelectorAll('.float');
  var wins = { solo: stage.querySelector('.win--solo'), team: stage.querySelector('.win--team') };
  // При «уменьшить движение» всё сразу в итоговом виде: без счёта, параллакса и появлений
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var current = null, swapTimer = 0, GAP = 120;

  // Цифры дашборда: в HTML стоят итоговые значения, отсюда они считаются от нуля
  function numberOf(el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), node;
    while ((node = walker.nextNode())) {
      var m = node.nodeValue.match(/\d+(?:[  ]\d{3})*/);
      if (m) return { node: node, pre: node.nodeValue.slice(0, m.index), suf: node.nodeValue.slice(m.index + m[0].length), v: +m[0].replace(/\D/g, ''), group: /\D/.test(m[0]) };
    }
  }
  function fmt(o, v) {
    var s = String(v);
    if (o.group) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return o.pre + s + o.suf;
  }
  Object.keys(wins).forEach(function (k) {
    wins[k]._nums = [].map.call(wins[k].querySelectorAll('.kpi__val, .stats b, .bar em, .team__sum b, .load em, .num'), numberOf).filter(Boolean);
  });
  function countUp(win, delay) {
    var nums = win._nums, token = win._tok = (win._tok || 0) + 1, t0 = performance.now() + delay;
    nums.forEach(function (o) { o.node.nodeValue = fmt(o, 0); });
    requestAnimationFrame(function tick(now) {
      if (win._tok !== token) return;
      var p = Math.min(1, Math.max(0, (now - t0) / 900)), e = 1 - Math.pow(1 - p, 3);
      nums.forEach(function (o) { o.node.nodeValue = fmt(o, Math.round(o.v * e)); });
      if (p < 1) requestAnimationFrame(tick);
    });
  }
  function replay(win) { win.classList.remove('is-replay'); void win.offsetWidth; win.classList.add('is-replay'); }
  function setTexts() { swaps.forEach(function (el) { el.textContent = el.getAttribute('data-' + current); }); }

  function setVersion(v) {
    if (v === current) return;
    var first = current === null;
    current = v;
    stage.setAttribute('data-v', v);
    seg.classList.toggle('is-team', v === 'team');
    btns.forEach(function (b) {
      var on = b.getAttribute('data-v') === v;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    if (first || still) { setTexts(); return; }
    // Подписи карточек гаснут, меняются и проявляются; новый экран собирается заново
    stage.classList.remove('is-wait');
    floats.forEach(function (f) { f.classList.add('is-swap'); });
    clearTimeout(swapTimer);
    swapTimer = setTimeout(function () { setTexts(); floats.forEach(function (f) { f.classList.remove('is-swap'); }); }, 170);
    stage.style.setProperty('--d', '120ms');
    replay(wins[v]);
    countUp(wins[v], 270);
  }

  btns.forEach(function (b) {
    b.addEventListener('click', function () { setVersion(b.getAttribute('data-v')); });
  });
  // Стрелки влево и вправо переключают вкладки, как положено для role="tab"
  seg.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    var v = e.key === 'ArrowRight' ? 'team' : 'solo';
    setVersion(v);
    seg.querySelector('[data-v="' + v + '"]').focus();
    e.preventDefault();
  });
  var q = new URLSearchParams(location.search).get('v');
  setVersion(q === 'team' ? 'team' : 'solo');

  // Первый запуск экрана: виден сразу — считаем сразу; ниже сгиба (телефон) — ждём прокрутки
  if (!still) {
    var started = false;
    var go = function () {
      if (started) return;
      started = true;
      stage.style.setProperty('--d', '150ms');
      stage.classList.remove('is-wait');
      countUp(wins[current], 300);
    };
    if (stage.getBoundingClientRect().top < innerHeight - GAP) {
      started = true;
      countUp(wins[current], 700);
    } else {
      stage.classList.add('is-wait');
      wins[current]._nums.forEach(function (o) { o.node.nodeValue = fmt(o, 0); });
      if (hasIO) {
        var io = new IntersectionObserver(function (es) {
          if (es.some(function (x) { return x.isIntersecting; })) { io.disconnect(); go(); }
        }, { rootMargin: '0px 0px -' + GAP + 'px 0px' });
        io.observe(stage);
      }
      var onScroll = function () {
        if (stage.getBoundingClientRect().top < innerHeight - GAP) { removeEventListener('scroll', onScroll); go(); }
      };
      addEventListener('scroll', onScroll, { passive: true });
    }
  }

  // Блок «Проблема»: то, что ниже сгиба, проявляется при прокрутке
  if (!still && hasIO) {
    var reveal = [].filter.call(document.querySelectorAll('.problem .h2, .problem .pcard'), function (el) {
      return el.getBoundingClientRect().top > innerHeight;
    });
    reveal.forEach(function (el) { el.classList.add('rv-s'); });
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('is-in'); rio.unobserve(x.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveal.forEach(function (el) { rio.observe(el); });
    // Страховка: быстрая прокрутка или прыжок по якорю не должны оставить блок невидимым
    var pending = false;
    addEventListener('scroll', function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        reveal.forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight * 0.9) el.classList.add('is-in'); });
      });
    }, { passive: true });
  }

  // Лёгкий параллакс первого экрана за курсором: только мышь, без «уменьшить движение»
  var hero = document.querySelector('.hero');
  if (hero && !still && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    var step = function () {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      hero.style.setProperty('--mx', cx.toFixed(3));
      hero.style.setProperty('--my', cy.toFixed(3));
      raf = Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002 ? requestAnimationFrame(step) : 0;
    };
    var kick = function () { if (!raf) raf = requestAnimationFrame(step); };
    hero.addEventListener('pointermove', function (e) {
      tx = e.clientX / innerWidth * 2 - 1;
      ty = e.clientY / innerHeight * 2 - 1;
      kick();
    });
    hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; kick(); });
  }

  // Мобильное меню
  var burger = document.querySelector('.burger');
  var mnav = document.getElementById('mnav');
  burger.addEventListener('click', function () {
    var open = mnav.hasAttribute('hidden');
    mnav.toggleAttribute('hidden', !open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  });
  mnav.addEventListener('click', function (e) {
    if (e.target.closest('a')) { mnav.setAttribute('hidden', ''); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Открыть меню'); }
  });
})();
