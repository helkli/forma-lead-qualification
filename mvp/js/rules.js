/* FORMA MVP — бизнес-правила квалификации заявок.
   Источник: ТЗ_MVP.md раздел 9. Порядок проверки фиксированный:
   сначала BR-01 («Не наш формат»), затем BR-02 («Приоритетная»),
   затем BR-03 («Нужно уточнить»). Применяется ровно один статус.
   Каждое сработавшее условие попадает в перечень причин для менеджера.
   Клиентские экраны эти данные никогда не получают (BR-04). */

(function () {
  'use strict';

  var C = window.FORMA;
  var R = C.REASONS;

  /* BR-01: хотя бы одно условие */
  function checkReject(a) {
    var reasons = [];
    if (a.service === 'consult') {
      reasons.push(R.consultOnly);
    }
    if (a.budget === 'b_lt90') {
      reasons.push(R.budgetBelowRange);
    }
    if ((a.location === 'km30plus' || a.location === 'region') && a.remoteReady === 'no') {
      reasons.push(R.geoNoRemote);
    }
    return reasons;
  }

  /* BR-02: все условия одновременно; возвращает список невыполненных */
  function checkPriorityMisses(a) {
    var misses = [];

    if (!(Number(a.area) >= 45)) {
      misses.push(R.areaSmall);
    }
    if (!(a.location === 'moscow' || a.location === 'km30')) {
      misses.push(R.geoOutside);
    }
    if (!(a.service === 'full' || a.service === 'full_pack')) {
      misses.push(a.service === 'unknown' ? R.serviceUnknown : R.serviceNotPriority);
    }
    if (!(a.timeline === 't0_3' || a.timeline === 't4_9')) {
      misses.push(a.timeline === 'unknown' ? R.timelineUnknown : R.lateStart);
    }
    if (!(a.budget === 'b_120_180' || a.budget === 'b_gt180')) {
      misses.push(a.budget === 'unknown' ? R.budgetUnknown : R.budgetBelowPriority);
    }

    return misses;
  }

  /* Возвращает ровно один статус с перечнем причин (FR-07) */
  function computeStatus(answers) {
    var rejectReasons = checkReject(answers);
    if (rejectReasons.length > 0) {
      return { status: 'NOT_OUR_FORMAT', reasons: rejectReasons };
    }

    var misses = checkPriorityMisses(answers);
    if (misses.length === 0) {
      return { status: 'PRIORITY', reasons: [] };
    }

    return { status: 'NEEDS_CLARIFICATION', reasons: unique(misses) };
  }

  function unique(items) {
    var seen = {};
    return items.filter(function (item) {
      if (seen[item]) { return false; }
      seen[item] = true;
      return true;
    });
  }

  window.FORMA.rules = {
    computeStatus: computeStatus,
    STATUS: {
      PRIORITY: 'PRIORITY',
      NEEDS_CLARIFICATION: 'NEEDS_CLARIFICATION',
      NOT_OUR_FORMAT: 'NOT_OUR_FORMAT'
    }
  };
})();
