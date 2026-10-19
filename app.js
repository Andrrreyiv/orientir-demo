// Переключатель Solo / Team: меняет экран спереди и подписи плавающих карточек
(function () {
  var seg = document.querySelector('.seg');
  var stage = document.querySelector('.stage');
  var btns = document.querySelectorAll('.seg__btn');
  var swaps = document.querySelectorAll('[data-solo]');

  function setVersion(v) {
    stage.setAttribute('data-v', v);
    seg.classList.toggle('is-team', v === 'team');
    btns.forEach(function (b) {
      var on = b.getAttribute('data-v') === v;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    swaps.forEach(function (el) { el.textContent = el.getAttribute('data-' + v); });
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
