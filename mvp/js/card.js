/* FORMA MVP — менеджерская карточка заявки и копирование.
   Источник: ТЗ_MVP.md FR-09 (фиксированный шаблон карточки),
   FR-10 + состояние S8 (копирование и резервный ручной путь),
   BR-04 (статус и причины видны только менеджеру). */

(function () {
  'use strict';

  var C = window.FORMA;

  function fieldDef(id) {
    for (var i = 0; i < C.FIELD_DEFS.length; i++) {
      if (C.FIELD_DEFS[i].id === id) { return C.FIELD_DEFS[i]; }
    }
    return null;
  }

  function optionLabel(fieldId, value) {
    var def = fieldDef(fieldId);
    if (def && def.options) {
      for (var i = 0; i < def.options.length; i++) {
        if (def.options[i].value === value) { return def.options[i].label; }
      }
    }
    return value === null || value === undefined ? '' : String(value);
  }

  function dashIfEmpty(value) {
    return (value === null || value === undefined || String(value).trim() === '') ? '—' : String(value).trim();
  }

  /* FR-09: текст карточки точно по шаблону из ТЗ */
  function buildCardText(a, result) {
    var remoteDef = fieldDef('remoteReady');
    var remoteVisible = !remoteDef.visibleIf || remoteDef.visibleIf(a);

    var lines = [
      'Карточка заявки · FORMA',
      'Дата создания: ' + new Date().toLocaleString('ru-RU'),
      'Предварительный статус: ' + C.STATUS_LABELS[result.status],
      'Причины: ' + (result.reasons.length > 0 ? result.reasons.join('; ') : '—'),
      '---',
      'Имя: ' + dashIfEmpty(a.name),
      'Контакт: ' + dashIfEmpty(a.contact),
      'Объект: ' + optionLabel('objectType', a.objectType) + ', площадь ' + dashIfEmpty(a.area) + ' м²',
      'Локация: ' + optionLabel('location', a.location),
      'Готов(а) к удаленному формату: ' + (remoteVisible ? optionLabel('remoteReady', a.remoteReady) : '— (не применимо)'),
      'Услуга: ' + optionLabel('service', a.service),
      'Срок начала ремонта: ' + optionLabel('timeline', a.timeline),
      'Бюджет на реализацию: ' + optionLabel('budget', a.budget),
      'Решение принимает: ' + (a.decision ? optionLabel('decision', a.decision) : '—'),
      'Комментарий: ' + dashIfEmpty(a.comment),
      '---',
      'Статус является подсказкой; окончательное решение принимает менеджер.'
    ];

    return lines.join('\n');
  }

  /* FR-10: буфер обмена; при любом отказе — callback(false) для перехода в S8 */
  function copyToClipboard(text, callback) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text).then(
        function () { callback(true); },
        function () { callback(false); }
      );
    } else {
      callback(false);
    }
  }

  window.FORMA.card = {
    buildCardText: buildCardText,
    copyToClipboard: copyToClipboard
  };
})();
