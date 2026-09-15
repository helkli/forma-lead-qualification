/* FORMA MVP — конфигурация полей, опций и текстов.
   Источник: ТЗ_MVP.md, разделы 8 (словарь полей), 10 (состояния и тексты).
   Значения списков хранятся латинскими ключами; подписи — только здесь. */

window.FORMA = window.FORMA || {};
var FORMA = window.FORMA;

FORMA.TEXTS = {
  stepOf: function (n) { return 'Шаг ' + n + ' из 4'; },
  reviewLabel: 'Проверка ответов',
  emptyOption: 'Выберите…',
  emptyValue: '—'
};

/* Тексты ошибок валидации (ТЗ_MVP.md, §10 состояние S3) */
FORMA.MESSAGES = {
  required: 'Это поле обязательно для продолжения',
  area: 'Введите целое число от 10 до 2000',
  lengthRange: function (min, max) { return 'От ' + min + ' до ' + max + ' символов'; },
  maxLength: function (max) { return 'До ' + max + ' символов'; }
};

/* Детерминированные причины статуса для менеджерской карточки (ТЗ_MVP.md §9).
   Один ключ — один фиксированный текст; правила ссылаются только на ключи. */
FORMA.REASONS = {
  consultOnly: 'Только разовая услуга',
  budgetBelowRange: 'Бюджет ниже рабочего диапазона',
  geoNoRemote: 'Объект за пределами рабочей географии без готовности к удаленному формату',
  areaSmall: 'Площадь менее 45 м²',
  geoOutside: 'Объект за пределами рабочей географии',
  serviceNotPriority: 'Услуга не входит в приоритетный перечень',
  lateStart: 'Старт ремонта позднее девяти месяцев',
  budgetBelowPriority: 'Бюджет ниже приоритетного диапазона',
  serviceUnknown: 'Услуга не выбрана окончательно',
  timelineUnknown: 'Срок начала ремонта не определен',
  budgetUnknown: 'Бюджет не определен'
};

/* Человекочитаемые подписи статусов (видит только менеджер, BR-04) */
FORMA.STATUS_LABELS = {
  PRIORITY: 'Приоритетная',
  NEEDS_CLARIFICATION: 'Нужно уточнить',
  NOT_OUR_FORMAT: 'Не наш формат'
};

FORMA.STEPS = [
  { n: 1, title: 'Контакты' },
  { n: 2, title: 'Объект' },
  { n: 3, title: 'Задача' },
  { n: 4, title: 'Детали' }
];

FORMA.FIELD_DEFS = [
  {
    id: 'name',
    type: 'text',
    step: 1,
    label: 'Как вас зовут?',
    required: true,
    minLength: 2,
    maxLength: 60
  },
  {
    id: 'contact',
    type: 'text',
    step: 1,
    label: 'Телефон или Telegram',
    required: true,
    minLength: 3,
    maxLength: 100,
    hint: 'Тестовые данные, например +7 900 000-00-00 или @username'
  },
  {
    id: 'objectType',
    type: 'select',
    step: 2,
    label: 'Что за объект?',
    required: true,
    options: [
      { value: 'flat', label: 'Квартира' },
      { value: 'house', label: 'Загородный дом' },
      { value: 'other', label: 'Другое' }
    ]
  },
  {
    id: 'area',
    type: 'number',
    step: 2,
    label: 'Площадь объекта, м²',
    required: true,
    min: 10,
    max: 2000
  },
  {
    id: 'location',
    type: 'select',
    step: 2,
    label: 'Где находится объект?',
    required: true,
    options: [
      { value: 'moscow', label: 'Москва' },
      { value: 'km30', label: 'До 30 км от МКАД' },
      { value: 'km30plus', label: 'Более 30 км от МКАД' },
      { value: 'region', label: 'Другой регион' }
    ]
  },
  {
    id: 'remoteReady',
    type: 'select',
    step: 2,
    label: 'Готовы ли вы к полностью удаленному формату работы?',
    required: true,
    options: [
      { value: 'yes', label: 'Да, готов(а)' },
      { value: 'no', label: 'Нет' }
    ],
    visibleIf: function (answers) {
      return answers.location === 'km30plus' || answers.location === 'region';
    }
  },
  {
    id: 'service',
    type: 'select',
    step: 3,
    label: 'Какая услуга нужна?',
    required: true,
    options: [
      { value: 'full', label: 'Полный дизайн-проект' },
      { value: 'full_pack', label: 'Дизайн-проект и комплектация' },
      { value: 'supervision', label: 'Авторский надзор к проекту' },
      { value: 'consult', label: 'Разовая консультация' },
      { value: 'unknown', label: 'Пока не знаю' }
    ]
  },
  {
    id: 'timeline',
    type: 'select',
    step: 3,
    label: 'Когда планируете начать ремонт?',
    required: true,
    options: [
      { value: 't0_3', label: 'В течение 3 месяцев' },
      { value: 't4_9', label: '4–9 месяцев' },
      { value: 't10_18', label: '10–18 месяцев' },
      { value: 't18p', label: 'Более 18 месяцев' },
      { value: 'unknown', label: 'Пока не знаю' }
    ]
  },
  {
    id: 'budget',
    type: 'select',
    step: 3,
    label: 'Ориентир бюджета на реализацию, ₽ за м²',
    required: true,
    options: [
      { value: 'b_lt90', label: 'До 90 тыс.' },
      { value: 'b_90_120', label: '90–120 тыс.' },
      { value: 'b_120_180', label: '120–180 тыс.' },
      { value: 'b_gt180', label: 'Более 180 тыс.' },
      { value: 'unknown', label: 'Пока не знаю' }
    ]
  },
  {
    id: 'decision',
    type: 'select',
    step: 4,
    label: 'Кто принимает решение о проекте?',
    required: false,
    options: [
      { value: 'single', label: 'Я один(на)' },
      { value: 'joint', label: 'Совместно с кем-то' },
      { value: 'other', label: 'Другое' }
    ]
  },
  {
    id: 'comment',
    type: 'textarea',
    step: 4,
    label: 'Комментарий: референсы, пожелания',
    required: false,
    maxLength: 1000
  }
];

/* Блоки экрана проверки (FR-06): заголовок, шаг возврата по «Изменить», состав полей */
FORMA.REVIEW_BLOCKS = [
  { title: 'Контакты', step: 1, fields: ['name', 'contact'] },
  { title: 'Объект', step: 2, fields: ['objectType', 'area', 'location', 'remoteReady'] },
  { title: 'Задача', step: 3, fields: ['service', 'timeline', 'budget'] },
  { title: 'Детали', step: 4, fields: ['decision', 'comment'] }
];
