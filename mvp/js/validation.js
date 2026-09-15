/* FORMA MVP — валидация полей и шагов.
   Источник: ТЗ_MVP.md разделы 8 (словарь полей), 10 (тексты ошибок S3).
   Требования: FR-02 (обязательные поля блокируют переход),
   FR-04 (площадь — целое 10–2000, длины текстовых полей),
   FR-05 (скрытое поле не проверяется). */

(function () {
  'use strict';

  var C = window.FORMA;

  /* Видимо ли поле при текущих ответах (FR-05) */
  function isVisible(def, answers) {
    return !def.visibleIf || def.visibleIf(answers);
  }

  function isEmpty(value) {
    return value === null || value === undefined || String(value).trim() === '';
  }

  /* Возвращает '' если поле корректно, иначе текст ошибки для показа под полем */
  function validateField(def, answers) {
    if (!isVisible(def, answers)) { return ''; }

    var value = answers[def.id];

    if (def.type === 'select') {
      return (def.required && isEmpty(value)) ? C.MESSAGES.required : '';
    }

    var text = String(value === null || value === undefined ? '' : value).trim();

    if (def.type === 'number') {
      if (text === '') {
        return def.required ? C.MESSAGES.required : '';
      }
      var n = Number(text);
      if (!isFinite(n) || !Number.isInteger(n) || n < def.min || n > def.max) {
        return C.MESSAGES.area;
      }
      return '';
    }

    /* text / textarea */
    if (def.required && text === '') { return C.MESSAGES.required; }
    if (text === '') { return ''; }
    /* Текст ошибки определяется полем (ТЗ §10): у полей с диапазоном
       всегда «От N до M символов», у комментария — «До 1000 символов». */
    var tooShort = def.minLength && text.length < def.minLength;
    var tooLong = def.maxLength && text.length > def.maxLength;
    if (tooShort || tooLong) {
      return def.minLength
        ? C.MESSAGES.lengthRange(def.minLength, def.maxLength)
        : C.MESSAGES.maxLength(def.maxLength);
    }
    return '';
  }

  /* Ошибки всех полей шага: { fieldId: текст } ; пустой объект — шаг валиден */
  function validateStep(stepNumber, answers) {
    var errors = {};
    C.FIELD_DEFS.forEach(function (def) {
      if (def.step !== stepNumber) { return; }
      var message = validateField(def, answers);
      if (message) { errors[def.id] = message; }
    });
    return errors;
  }

  window.FORMA.validation = {
    isVisible: isVisible,
    validateField: validateField,
    validateStep: validateStep
  };
})();
