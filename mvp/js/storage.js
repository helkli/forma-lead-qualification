/* FORMA MVP — хранение черновика анкеты.
   Источник: ТЗ_MVP.md FR-11 (черновик), NFR-07 (один ключ),
   риск R2 (деградация при недоступном localStorage).
   Все обращения к localStorage обернуты: приложение обязано работать
   даже когда хранилище отключено. */

(function () {
  'use strict';

  var KEY = 'forma_mvp_draft_v1';

  function isAvailable() {
    try {
      var probe = '__forma_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return true;
    } catch (e) {
      return false;
    }
  }

  function save(data) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) { /* деградация R2: без черновика */ }
  }

  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function clear() {
    try {
      window.localStorage.removeItem(KEY);
    } catch (e) { /* игнорируем */ }
  }

  window.FORMA.storage = {
    KEY: KEY,
    isAvailable: isAvailable,
    save: save,
    load: load,
    clear: clear
  };
})();
