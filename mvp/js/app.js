/* FORMA MVP — каркас приложения: состояние, рендер полей, навигация по шагам.
   Итерация 1 (ТЗ_MVP.md: FR-01, FR-03, показ/скрытие FR-05, каркас FR-06).
   Валидация, правила квалификации и черновик подключаются в следующих итерациях. */

(function () {
  'use strict';

  var C = window.FORMA;
  var LAST_STEP = 4;
  var REVIEW_STEP = 5;
  var SUCCESS_STEP = 6;

  /* Модель состояния анкеты */
  var state = {
    step: 1,
    answers: createEmptyAnswers(),
    result: null,        // {status, reasons} — заполняется при отправке (FR-07)
    draftRestored: false, // S4: показываем плашку восстановления
    submitted: false      // заявка отправлена — черновик больше не пишем
  };

  var currentCardText = '';

  function createEmptyAnswers() {
    var answers = {};
    C.FIELD_DEFS.forEach(function (def) {
      answers[def.id] = (def.type === 'text' || def.type === 'textarea') ? '' : null;
    });
    answers.confirmed = false;
    return answers;
  }

  /* Кэш DOM */
  var els = {};
  var fieldWrappers = {}; // id -> { wrapper, control, error }

  function cacheDom() {
    els.form = document.getElementById('anketa-form');
    els.screens = Array.prototype.slice.call(document.querySelectorAll('.screen'));
    els.progressBar = document.getElementById('progress-bar');
    els.progressLabel = document.getElementById('progress-label');
    els.backBtn = document.getElementById('back-btn');
    els.nextBtn = document.getElementById('next-btn');
    els.submitBtn = document.getElementById('submit-btn');
    els.confirmedInput = document.getElementById('confirmed-input');
    els.reviewSummary = document.getElementById('review-summary');
    els.progressEl = document.getElementById('progress');
    els.successPre = document.getElementById('success-card-pre');
    els.fallbackTextarea = document.getElementById('fallback-textarea');
    els.copyHint = document.getElementById('copy-hint');
    els.copyBtn = document.getElementById('copy-btn');
    els.restoreBanner = document.getElementById('restore-banner');
    els.restartBtn = document.getElementById('restart-btn');
    els.storageWarning = document.getElementById('storage-warning');
    els.newAppBtn = document.getElementById('new-app-btn');
  }

  /* Построение полей из конфигурации (без бизнес-логики в разметке) */
  function buildFields() {
    C.FIELD_DEFS.forEach(function (def) {
      var container = document.querySelector('[data-fields-for="' + def.step + '"]');
      if (!container) { return; }

      var wrapper = document.createElement('div');
      wrapper.className = 'field';

      var label = document.createElement('label');
      label.setAttribute('for', 'input-' + def.id);
      label.textContent = def.label;
      wrapper.appendChild(label);

      var control = createControl(def);
      wrapper.appendChild(control);

      if (def.hint) {
        var hint = document.createElement('p');
        hint.className = 'hint';
        hint.id = 'hint-' + def.id;
        hint.textContent = def.hint;
        wrapper.appendChild(hint);
      }

      var error = document.createElement('p');
      error.className = 'field__error';
      error.id = 'error-' + def.id;
      wrapper.appendChild(error);

      container.appendChild(wrapper);

      fieldWrappers[def.id] = { def: def, wrapper: wrapper, control: control, error: error };
    });
  }

  function createControl(def) {
    var control;

    if (def.type === 'select') {
      control = document.createElement('select');

      var placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = C.TEXTS.emptyOption;
      control.appendChild(placeholder);

      def.options.forEach(function (opt) {
        var option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        control.appendChild(option);
      });
    } else {
      control = document.createElement(def.type === 'textarea' ? 'textarea' : 'input');
      if (def.type === 'number') {
        /* Текстовое поле с ручной валидацией: input[type=number] не пропускает
           буквы, и случаи вроде "abc" из AC-03 не дошли бы до проверки */
        control.type = 'text';
        control.inputMode = 'numeric';
      }
      if (def.maxLength) {
        control.maxLength = def.maxLength;
      }
    }

    control.className = 'control';
    control.id = 'input-' + def.id;
    control.name = def.id;
    if (def.hint) {
      control.setAttribute('aria-describedby', 'hint-' + def.id);
    }

    control.addEventListener('input', function () {
      setValue(def.id, control.value);
      clearFieldError(def.id);
    });
    control.addEventListener('change', function () {
      syncConditionalFields();
    });

    return control;
  }

  function setValue(id, rawValue) {
    var def = fieldWrappers[id].def;
    if (def.type === 'text' || def.type === 'textarea') {
      state.answers[id] = rawValue;
    } else if (def.type === 'number') {
      state.answers[id] = rawValue === '' ? null : rawValue; // нормализация в число — в итерации валидации
    } else {
      state.answers[id] = rawValue === '' ? null : rawValue;
    }
    state.draftRestored = false;
    persistDraft();
  }

  /* FR-11 / NFR-07: один ключ, запись при каждом изменении */
  function persistDraft() {
    if (state.submitted) { return; }
    FORMA.storage.save({
      schemaVersion: 1,
      currentStep: state.step,
      answers: state.answers
    });
  }

  function restoreDraft() {
    var draft = FORMA.storage.load();
    if (!draft || !draft.answers) { return; }

    C.FIELD_DEFS.forEach(function (def) {
      if (draft.answers[def.id] !== undefined) {
        state.answers[def.id] = draft.answers[def.id];
      }
    });
    state.answers.confirmed = !!draft.answers.confirmed;
    state.step = Math.min(Math.max(Number(draft.currentStep) || 1, 1), REVIEW_STEP);
    state.draftRestored = true;

    syncControlsFromState();
    syncConditionalFields();
  }

  function syncControlsFromState() {
    C.FIELD_DEFS.forEach(function (def) {
      var w = fieldWrappers[def.id];
      var v = state.answers[def.id];
      w.control.value = (v === null || v === undefined) ? '' : String(v);
    });
  }

  /* FR-12 / S4 «Начать заново» / S9: полная очистка формы и черновика */
  function resetApplication() {
    FORMA.storage.clear();
    state.answers = createEmptyAnswers();
    state.result = null;
    state.submitted = false;
    state.draftRestored = false;
    state.step = 1;
    currentCardText = '';
    Object.keys(fieldWrappers).forEach(clearFieldError);
    syncControlsFromState();
    syncConditionalFields();
    render();
  }

  /* FR-05: вопрос об удаленном формате виден только вне Москвы и зоны 30 км */
  function syncConditionalFields() {
    C.FIELD_DEFS.forEach(function (def) {
      if (!def.visibleIf) { return; }
      var w = fieldWrappers[def.id];
      var visible = def.visibleIf(state.answers);
      w.wrapper.hidden = !visible;
      if (!visible) {
        state.answers[def.id] = null;
        w.control.value = '';
        clearFieldError(def.id);
      }
    });
  }

  /* FR-02: показ ошибки под полем + связь с полем для скринридера */
  function showErrors(errors) {
    Object.keys(errors).forEach(function (id) {
      var w = fieldWrappers[id];
      w.error.textContent = errors[id];
      w.error.classList.add('visible');
      w.control.setAttribute('aria-invalid', 'true');
      w.control.setAttribute('aria-describedby', 'error-' + id);
    });
  }

  function clearFieldError(id) {
    var w = fieldWrappers[id];
    if (!w) { return; }
    w.error.classList.remove('visible');
    w.control.removeAttribute('aria-invalid');
    if (w.def.hint) {
      w.control.setAttribute('aria-describedby', 'hint-' + id);
    } else {
      w.control.removeAttribute('aria-describedby');
    }
  }

  /* FR-01/FR-02: «Далее» переходит только с валидным шагом */
  function goNext() {
    if (state.step <= LAST_STEP) {
      var errors = FORMA.validation.validateStep(state.step, state.answers);
      var ids = Object.keys(errors);
      if (ids.length > 0) {
        showErrors(errors);
        fieldWrappers[ids[0]].control.focus();
        return;
      }
    }
    goToStep(state.step + 1);
  }

  /* Навигация */

  function goToStep(n) {
    state.step = Math.min(Math.max(n, 1), REVIEW_STEP);
    state.draftRestored = false;
    if (state.step === REVIEW_STEP) {
      renderSummary();
    }
    persistDraft();
    render();
  }

  function render() {
    els.screens.forEach(function (screen) {
      screen.hidden = Number(screen.getAttribute('data-step')) !== state.step;
    });

    var onReview = state.step === REVIEW_STEP;
    var onSuccess = state.step === SUCCESS_STEP;

    els.progressEl.hidden = onSuccess;
    els.nextBtn.hidden = onReview || onSuccess;
    els.backBtn.hidden = state.step === 1 || onSuccess;
    els.restoreBanner.hidden = !state.draftRestored || onSuccess;

    if (!onSuccess) {
      updateProgress();
      els.confirmedInput.checked = state.answers.confirmed;
      els.submitBtn.disabled = !state.answers.confirmed;
    }

    focusCurrentTitle();
  }

  function updateProgress() {
    var isReview = state.step >= REVIEW_STEP;
    var value = isReview ? LAST_STEP : state.step;

    els.progressLabel.textContent = isReview ? C.TEXTS.reviewLabel : C.TEXTS.stepOf(state.step);
    els.progressBar.style.width = (value / LAST_STEP * 100) + '%';
    els.progressBar.setAttribute('aria-valuenow', String(value));
  }

  function focusCurrentTitle() {
    var current = els.screens.filter(function (s) {
      return !s.hidden;
    })[0];
    if (!current) { return; }
    var title = current.querySelector('.screen-title');
    if (title) { title.focus(); }
  }

  /* Экран проверки: сводка ответов по блокам с кнопками «Изменить» */

  function renderSummary() {
    els.reviewSummary.innerHTML = '';

    C.REVIEW_BLOCKS.forEach(function (block) {
      var blockEl = document.createElement('div');
      blockEl.className = 'review-block';

      var head = document.createElement('div');
      head.className = 'review-block__head';

      var title = document.createElement('h3');
      title.className = 'review-block__title';
      title.textContent = block.title;

      var editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'linklike';
      editBtn.setAttribute('data-goto', String(block.step));
      editBtn.textContent = 'Изменить';

      head.appendChild(title);
      head.appendChild(editBtn);
      blockEl.appendChild(head);

      var list = document.createElement('dl');
      list.className = 'summary-list';

      block.fields.forEach(function (id) {
        var def = fieldWrappers[id].def;
        var visible = !def.visibleIf || def.visibleIf(state.answers);
        if (!visible) { return; } // скрытое поле не показываем и не оцениваем

        var row = document.createElement('div');
        var dt = document.createElement('dt');
        var dd = document.createElement('dd');

        dt.textContent = def.label;
        dd.textContent = humanValue(id);

        row.appendChild(dt);
        row.appendChild(dd);
        list.appendChild(row);
      });

      blockEl.appendChild(list);
      els.reviewSummary.appendChild(blockEl);
    });
  }

  function humanValue(id) {
    var def = fieldWrappers[id].def;
    var v = state.answers[id];
    if (v === null || v === '') { return C.TEXTS.emptyValue; }
    if (def.options) {
      for (var i = 0; i < def.options.length; i++) {
        if (def.options[i].value === v) { return def.options[i].label; }
      }
    }
    return String(v);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Инициализация */

  function bindEvents() {
    els.nextBtn.addEventListener('click', goNext);
    els.backBtn.addEventListener('click', function () { goToStep(state.step - 1); });

    els.reviewSummary.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-goto]');
      if (btn) { goToStep(Number(btn.getAttribute('data-goto'))); }
    });

    els.confirmedInput.addEventListener('change', function () {
      state.answers.confirmed = els.confirmedInput.checked;
      els.submitBtn.disabled = !state.answers.confirmed;
    });

    /* FR-07 + FR-08/FR-09: расчет статуса и переход на пост-экран */
    els.submitBtn.addEventListener('click', function () {
      if (!state.answers.confirmed) { return; }
      state.result = FORMA.rules.computeStatus(state.answers);
      state.submitted = true;
      FORMA.storage.clear(); // FR-11: черновик завершенной заявки удаляется
      showSuccess();
    });

    /* FR-12: «Заполнить новую заявку» */
    els.newAppBtn.addEventListener('click', resetApplication);

    /* S4: «Начать заново» */
    els.restartBtn.addEventListener('click', resetApplication);

    /* FR-10: копирование карточки, при отказе — S8 */
    els.copyBtn.addEventListener('click', function () {
      FORMA.card.copyToClipboard(currentCardText, function (success) {
        if (!success) { enterCopyFallback(); }
      });
    });
  }

  /* Пост-экран: клиентская часть (S6) + менеджерская карточка (S7) */
  function showSuccess() {
    currentCardText = FORMA.card.buildCardText(state.answers, state.result);
    els.successPre.textContent = currentCardText;
    exitCopyFallback();
    goToStep(SUCCESS_STEP);
  }

  function enterCopyFallback() {
    els.successPre.hidden = true;
    els.fallbackTextarea.value = currentCardText;
    els.fallbackTextarea.hidden = false;
    els.copyHint.hidden = false;
    els.fallbackTextarea.focus();
    els.fallbackTextarea.select();
  }

  function exitCopyFallback() {
    els.successPre.hidden = false;
    els.fallbackTextarea.hidden = true;
    els.fallbackTextarea.value = '';
    els.copyHint.hidden = true;
  }

  function init() {
    cacheDom();
    buildFields();
    bindEvents();
    restoreDraft();
    if (!FORMA.storage.isAvailable()) {
      els.storageWarning.hidden = false; // R2: деградация без черновика
    }
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
