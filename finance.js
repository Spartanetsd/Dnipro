/*!
 * BASE — Умная аренда · finance.js
 * Единственный вычислительный модуль приложения. Все экраны, таблицы, графики,
 * советы и экспорт берут числа только отсюда — поэтому они не могут расходиться.
 *
 * Принципы учёта:
 *  • Расход (expense) — деньги, которые уходят безвозвратно: аренда, коммунальные,
 *    комиссии, уборка, сборы, удержанная часть залога.
 *  • Возвратный залог — не расход, а замороженные деньги. Он показан отдельно,
 *    вместе с альтернативной стоимостью (упущенный доход по ставке пользователя).
 *  • Предоплата последнего месяца меняет только график платежей (cash flow),
 *    но не сумму расходов — она не учитывается дважды.
 *  • Комиссия риелтора и разовые платежи — расход первого месяца.
 *
 * Работает и в браузере (window.BaseFinance), и в Node (module.exports).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BaseFinance = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = 1;
  var MAX_SERIES = 60; // месяцев в рядах для поиска точек перелома

  var MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  var MONTHS_FULL = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

  /* Порядок = порядок серий на графиках и фиксированный цвет у каждого варианта. */
  var OPTION_IDS = ['daily', 'realtor', 'direct', 'weekly', 'aparthotel', 'custom'];
  var OPTION_TYPES = {
    nightly: 'Посуточно (цена за ночь)',
    weekly: 'Понедельно (цена за неделю)',
    monthly: 'Помесячно (аренда в месяц)'
  };

  var COMFORT_CRITERIA = [
    { key: 'shelter', label: 'Укрытие рядом', weight: 25 },
    { key: 'heating', label: 'Нормальное отопление', weight: 20 },
    { key: 'kitchen', label: 'Кухня', weight: 15 },
    { key: 'washer', label: 'Стиральная машина', weight: 15 },
    { key: 'parking', label: 'Парковка', weight: 10 },
    { key: 'ownSpace', label: 'Вещи остаются на месте', weight: 10 },
    { key: 'internet', label: 'Стабильный интернет', weight: 5 }
  ];
  var COMFORT_VALUES = { yes: 1, unknown: 0.5, no: 0 };

  var FLEX_FACTORS = [
    { key: 'upfront', label: 'Предоплата сверх одного месяца', weight: 25,
      rule: '100 — при заселении платите не больше среднего месяца; 0 — сверху ещё два месяца и больше' },
    { key: 'sunk', label: 'Невозвратные разовые платежи', weight: 25,
      rule: '100 — их нет; 0 — комиссия и сборы равны среднему месяцу или больше' },
    { key: 'commitment', label: 'Срок обязательств', weight: 25,
      rule: '100 — можно уйти завтра; 0 — 90 дней предупреждения и больше' },
    { key: 'idle', label: 'Оплата дней отсутствия', weight: 25,
      rule: '100 — не платите за пустые дни; 0 — все расходы приходятся на пустые дни' }
  ];

  var PRIORITIES = {
    economy: { label: 'Максимальная экономия', short: 'Экономия', weights: { cost: 80, flex: 10, comfort: 10 } },
    flex: { label: 'Максимальная гибкость', short: 'Гибкость', weights: { cost: 30, flex: 60, comfort: 10 } },
    comfort: { label: 'Комфорт и безопасность', short: 'Комфорт', weights: { cost: 30, flex: 10, comfort: 60 } },
    balanced: { label: 'Сбалансированный', short: 'Баланс', weights: { cost: 45, flex: 25, comfort: 30 } }
  };
  var PRIORITY_IDS = ['economy', 'flex', 'comfort', 'balanced'];

  /* Допустимые диапазоны полей. Значения вне диапазона приводятся к границе
     с понятным предупреждением; пустое поле считается нулём. */
  var LIMITS = {
    price: [0, 1e6], pricePerWeek: [0, 1e7], remainderNightPrice: [0, 1e6],
    rent: [0, 1e7], utilities: [0, 1e7], commissionPct: [0, 1000], commissionFixed: [0, 1e7],
    setupFees: [0, 1e7], deposit: [0, 1e7], depositRefundPct: [0, 100],
    cleaningFee: [0, 1e6], feePerStay: [0, 1e6], taxPerPersonNight: [0, 1e5], recheckinCost: [0, 1e6],
    storageMonthly: [0, 1e6], noticeDays: [0, 365],
    geniusPct: [0, 100], los7Pct: [0, 100], los14Pct: [0, 100], los28Pct: [0, 100],
    dutyDays: [0, 62], otherAwayDays: [0, 31], staysPerMonth: [1, 10], persons: [1, 10], horizon: [1, 60],
    rate: [0, 100], reserveGoalMonths: [0, 36],
    factorPct: [0, 500], manualMonthly: [0, 1e7], trips: [0, 62], distanceKm: [0, 5000], consumption: [0, 50],
    fuelPrice: [0, 1000], fare: [0, 1e5], parking: [0, 1e5], minutes: [0, 1440], otherMonthly: [0, 1e7],
    valuePerHour: [0, 1e5],
    rentUpPct: [0, 500], dailyDownPct: [0, 100], weeklyDiscountPct: [0, 100], utilitiesUpPct: [0, 500],
    priceNight: [0, 1e6], priceWeek: [0, 1e7], priceMonth: [0, 1e7], fees: [0, 1e6],
    floor: [-5, 200], comfortRating: [0, 5]
  };
  var INT_KEYS = { dutyDays: 1, otherAwayDays: 1, staysPerMonth: 1, persons: 1, horizon: 1, noticeDays: 1, trips: 1,
    reserveGoalMonths: 1, floor: 1, comfortRating: 1, minutes: 1 };

  var FIELD_LABELS = {
    price: 'Цена за ночь', pricePerWeek: 'Цена за неделю', remainderNightPrice: 'Цена ночи для остатка',
    rent: 'Арендная плата', utilities: 'Коммунальные', commissionPct: 'Комиссия, %', commissionFixed: 'Комиссия, ₴',
    setupFees: 'Оформление', deposit: 'Залог', depositRefundPct: 'Возвратная часть залога',
    cleaningFee: 'Уборка за заезд', feePerStay: 'Прочие сборы за заезд', taxPerPersonNight: 'Туристический сбор',
    recheckinCost: 'Расходы на повторное заселение', storageMonthly: 'Хранение вещей', noticeDays: 'Срок обязательств',
    geniusPct: 'Скидка Genius', los7Pct: 'Скидка за 7+ ночей', los14Pct: 'Скидка за 14+ ночей', los28Pct: 'Скидка за 28+ ночей',
    dutyDays: 'Дней в Краматорске', otherAwayDays: 'Других дней вне дома', staysPerMonth: 'Заездов в месяц',
    persons: 'Проживающих', horizon: 'Горизонт планирования', rate: 'Ставка', reserveGoalMonths: 'Цель резерва',
    factorPct: 'Уровень цен', manualMonthly: 'Жильё в месяц', trips: 'Поездок в месяц', distanceKm: 'Расстояние',
    consumption: 'Расход топлива', fuelPrice: 'Цена топлива', fare: 'Билет', parking: 'Парковка за поездку',
    minutes: 'Время в пути', otherMonthly: 'Прочий транспорт', valuePerHour: 'Цена часа',
    rentUpPct: 'Рост аренды', dailyDownPct: 'Снижение цены посуточно', weeklyDiscountPct: 'Недельная скидка',
    utilitiesUpPct: 'Рост коммунальных', priceNight: 'Цена за ночь', priceWeek: 'Цена за неделю',
    priceMonth: 'Цена за месяц', fees: 'Доп. сборы', floor: 'Этаж', comfortRating: 'Оценка комфорта'
  };

  /* ───────────────────────── утилиты ───────────────────────── */
  function r2(x) { return Math.round((x + Number.EPSILON) * 100) / 100; }
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function sum(arr) { var s = 0; for (var i = 0; i < arr.length; i++) s += arr[i]; return s; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function isObj(o) { return o !== null && typeof o === 'object' && !Array.isArray(o); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function daysInMonth(y, m) { return new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); }
  function parseYM(s) {
    var m = /^(\d{4})-(\d{2})$/.exec(String(s || ''));
    if (!m) return null;
    var y = +m[1], mo = +m[2] - 1;
    if (mo < 0 || mo > 11 || y < 1970 || y > 2200) return null;
    return { y: y, m: mo };
  }
  function nextMonthISO(now) {
    var d = now ? new Date(now) : new Date();
    var y = d.getFullYear(), m = d.getMonth() + 1;
    if (m > 11) { m = 0; y++; }
    return y + '-' + pad2(m + 1);
  }

  /* Разряды всегда через узкий неразрывный пробел — и для четырёхзначных чисел (1 264, а не 1264). */
  function fmtNum(n, digits) {
    if (!isFinite(n)) return '—';
    var v = digits ? Math.round(n * 10) / 10 : Math.round(n);
    if (v === 0) v = 0; // убираем −0
    var neg = v < 0, a = Math.abs(v);
    var parts = (digits ? String(a) : String(Math.round(a))).split('.');
    var int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
    return (neg ? '−' : '') + int + (parts[1] ? ',' + parts[1] : '');
  }
  function fmtMoney(n) { return fmtNum(n) + '\u00a0₴'; }
  function fmtSigned(n) { var v = Math.round(n); return (v > 0 ? '+' : v < 0 ? '−' : '') + fmtMoney(Math.abs(v)); }
  function plural(n, one, few, many) {
    var a = Math.abs(Math.round(n)) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  }
  function nightsWord(n) { return plural(n, 'ночь', 'ночи', 'ночей'); }
  function daysWord(n) { return plural(n, 'день', 'дня', 'дней'); }
  function monthsWord(n) { return plural(n, 'месяц', 'месяца', 'месяцев'); }

  /* ───────────────────────── значения по умолчанию ───────────────────────── */
  function comfortPreset(kind) {
    var p = {
      nightly: { shelter: 'unknown', heating: 'unknown', kitchen: 'yes', washer: 'unknown', parking: 'unknown', ownSpace: 'no', internet: 'yes' },
      monthly: { shelter: 'unknown', heating: 'unknown', kitchen: 'yes', washer: 'yes', parking: 'unknown', ownSpace: 'yes', internet: 'unknown' },
      hotel: { shelter: 'unknown', heating: 'yes', kitchen: 'yes', washer: 'unknown', parking: 'yes', ownSpace: 'no', internet: 'yes' }
    };
    return clone(p[kind] || p.monthly);
  }

  /* Каждый вариант хранит полный набор полей всех типов — тогда «Мой вариант»
     можно переключать между типами без потери введённых значений. */
  function optionBase() {
    return {
      type: 'monthly', name: '', enabled: true,
      // посуточно
      price: 700, geniusOn: false, geniusPct: 10, los7On: false, los7Pct: 10, los14On: false, los14Pct: 15,
      los28On: false, los28Pct: 20, stackMode: 'sequential',
      // понедельно
      pricePerWeek: 4200, remainderMode: 'nightly', remainderNightPrice: 700,
      // общие для коротких сроков
      cleaningFee: 0, feePerStay: 0, taxPerPersonNight: 0, recheckinCost: 0, storageMonthly: 0,
      // помесячно
      rent: 15000, utilities: 3000, commissionPct: 0, commissionFixed: 0, setupFees: 0,
      depositRefundPct: 100, prepayLastMonth: false,
      // общие
      deposit: 0, noticeDays: 30,
      comfort: comfortPreset('monthly')
    };
  }

  function defaults(now) {
    function opt(over) { var o = optionBase(); for (var k in over) o[k] = over[k]; return o; }
    return {
      app: 'BASE', version: VERSION,
      schedule: {
        monthMode: 'conventional', startMonth: nextMonthISO(now), dutyDays: 10, otherAwayDays: 0,
        dutyOverrides: {}, staysPerMonth: 1, persons: 2, horizon: 12
      },
      priority: 'balanced',
      baselineId: 'realtor',
      finance: { rate: 10, reserveGoalMonths: 3 },
      options: {
        daily: opt({ type: 'nightly', name: 'Посуточно', short: 'Посуточно', enabled: true, price: 700, deposit: 0, noticeDays: 1, comfort: comfortPreset('nightly') }),
        realtor: opt({ type: 'monthly', name: 'Через риелтора', short: 'Риелтор', enabled: true, rent: 18000, utilities: 3000, commissionPct: 100, deposit: 18000, noticeDays: 30 }),
        direct: opt({ type: 'monthly', name: 'Напрямую от собственника', short: 'Напрямую', enabled: true, rent: 15000, utilities: 3000, commissionPct: 0, deposit: 15000, noticeDays: 30 }),
        weekly: opt({ type: 'weekly', name: 'Понедельно', short: 'Понедельно', enabled: false, pricePerWeek: 4200, remainderNightPrice: 700, deposit: 0, noticeDays: 7, comfort: comfortPreset('nightly') }),
        aparthotel: opt({ type: 'monthly', name: 'Апарт-отель (месячный тариф)', short: 'Апарт-отель', enabled: false, rent: 22000, utilities: 0, commissionPct: 0, deposit: 0, noticeDays: 14, comfort: comfortPreset('hotel') }),
        custom: opt({ type: 'monthly', name: 'Мой вариант', short: 'Мой вариант', enabled: false, rent: 16000, utilities: 2500, commissionPct: 50, deposit: 16000, noticeDays: 30 })
      },
      scenarioParams: { rentUpPct: 15, dailyDownPct: 20, weeklyDiscountPct: 10, utilitiesUpPct: 20 },
      cities: {
        homeId: 'dnipro', valuePerHour: 0, includeTime: false,
        list: [
          { id: 'dnipro', name: 'Днепр', enabled: true, housingMode: 'auto', factorPct: 100, manualMonthly: 0, trips: 0, distanceKm: 0, mode: 'car', consumption: 8, fuelPrice: 60, fare: 0, parking: 0, minutes: 0, otherMonthly: 0 },
          { id: 'kamianske', name: 'Каменское', enabled: true, housingMode: 'auto', factorPct: 80, manualMonthly: 0, trips: 4, distanceKm: 0, mode: 'car', consumption: 8, fuelPrice: 60, fare: 0, parking: 0, minutes: 0, otherMonthly: 0 },
          { id: 'custom', name: 'Свой город', enabled: false, housingMode: 'manual', factorPct: 100, manualMonthly: 12000, trips: 2, distanceKm: 0, mode: 'transit', consumption: 8, fuelPrice: 60, fare: 0, parking: 0, minutes: 0, otherMonthly: 0 }
        ]
      },
      listings: [],
      compareIds: [],
      ui: { theme: 'auto', animations: true }
    };
  }

  /* ───────────────────────── нормализация и проверка ввода ───────────────────────── */
  function labelFor(path) {
    var parts = path.split('.');
    var key = parts[parts.length - 1];
    return FIELD_LABELS[key] || key;
  }

  function numField(src, key, def, path, warnings) {
    var lim = LIMITS[key] || [-1e12, 1e12];
    var v = src ? src[key] : undefined;
    if (v === undefined) return def;
    var label = labelFor(path);
    if (v === null || (typeof v === 'string' && v.trim() === '')) {
      var z = clamp(0, lim[0], lim[1]);
      warnings.push({ path: path, code: 'empty', message: label + ': пустое поле — считается как ' + fmtNum(z) });
      return z;
    }
    var n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[\s\u00a0\u202f]/g, '').replace(',', '.'));
    if (!isFinite(n)) {
      warnings.push({ path: path, code: 'nan', message: label + ': не число — использовано ' + fmtNum(def) });
      return def;
    }
    if (n < lim[0]) {
      warnings.push({ path: path, code: n < 0 ? 'negative' : 'min', message: label + ': не может быть меньше ' + fmtNum(lim[0]) + ' — учтено ' + fmtNum(lim[0]) });
      n = lim[0];
    }
    if (n > lim[1]) {
      var pct = /Pct$/.test(key) || key === 'rate';
      warnings.push({ path: path, code: 'max', message: label + ': не больше ' + fmtNum(lim[1]) + (pct ? '%' : '') + ' — учтено ' + fmtNum(lim[1]) + (pct ? '%' : '') });
      n = lim[1];
    }
    if (INT_KEYS[key]) n = Math.round(n);
    return n;
  }
  function boolField(src, key, def) {
    var v = src ? src[key] : undefined;
    return typeof v === 'boolean' ? v : def;
  }
  function enumField(src, key, def, allowed) {
    var v = src ? src[key] : undefined;
    return allowed.indexOf(v) >= 0 ? v : def;
  }
  function strField(src, key, def, maxLen) {
    var v = src ? src[key] : undefined;
    if (typeof v !== 'string') return def;
    return v.slice(0, maxLen || 200);
  }

  function normalizeComfort(src, def) {
    var out = {};
    COMFORT_CRITERIA.forEach(function (c) {
      var v = src ? src[c.key] : undefined;
      out[c.key] = COMFORT_VALUES.hasOwnProperty(v) ? v : def[c.key];
    });
    return out;
  }

  function normalizeOption(src, def, path, warnings) {
    var o = {};
    o.type = enumField(src, 'type', def.type, ['nightly', 'weekly', 'monthly']);
    o.name = strField(src, 'name', def.name, 60) || def.name;
    o.short = strField(src, 'short', def.short || def.name, 24) || def.short || def.name;
    o.enabled = boolField(src, 'enabled', def.enabled);
    ['price', 'geniusPct', 'los7Pct', 'los14Pct', 'los28Pct', 'pricePerWeek', 'remainderNightPrice', 'cleaningFee', 'feePerStay',
      'taxPerPersonNight', 'recheckinCost', 'storageMonthly', 'rent', 'utilities', 'commissionPct', 'commissionFixed', 'setupFees',
      'depositRefundPct', 'deposit', 'noticeDays'].forEach(function (k) {
      o[k] = numField(src, k, def[k], path + '.' + k, warnings);
    });
    ['geniusOn', 'los7On', 'los14On', 'los28On', 'prepayLastMonth'].forEach(function (k) { o[k] = boolField(src, k, def[k]); });
    o.stackMode = enumField(src, 'stackMode', def.stackMode, ['sequential', 'max']);
    o.remainderMode = enumField(src, 'remainderMode', def.remainderMode, ['nightly', 'week']);
    o.comfort = normalizeComfort(src && src.comfort, def.comfort);
    return o;
  }

  function normalizeCity(src, def, path, warnings) {
    var c = {};
    c.id = def.id;
    c.name = strField(src, 'name', def.name, 40) || def.name;
    c.enabled = boolField(src, 'enabled', def.enabled);
    c.housingMode = enumField(src, 'housingMode', def.housingMode, ['auto', 'manual']);
    c.mode = enumField(src, 'mode', def.mode, ['car', 'transit']);
    ['factorPct', 'manualMonthly', 'trips', 'distanceKm', 'consumption', 'fuelPrice', 'fare', 'parking', 'minutes', 'otherMonthly'].forEach(function (k) {
      c[k] = numField(src, k, def[k], path + '.' + k, warnings);
    });
    return c;
  }

  var LISTING_DEFAULT = {
    id: '', name: '', city: '', address: '', url: '',
    priceNight: 0, priceWeek: 0, priceMonth: 0, fees: 0, utilities: 0, commissionPct: 0, deposit: 0,
    kitchen: 'unknown', washer: 'unknown', parking: 'unknown', shelter: 'unknown', internet: 'unknown', heating: 'unknown',
    floor: 0, cancellation: '', comfortRating: 0, notes: '', enteredAt: ''
  };
  function normalizeListing(src, idx, warnings) {
    var d = LISTING_DEFAULT, l = {};
    var path = 'listings.' + idx;
    l.id = strField(src, 'id', '', 40) || ('l' + idx + '_' + Math.random().toString(36).slice(2, 8));
    ['name', 'city', 'address', 'cancellation', 'enteredAt'].forEach(function (k) { l[k] = strField(src, k, d[k], 160); });
    l.notes = strField(src, 'notes', '', 2000);
    var url = strField(src, 'url', '', 500);
    l.url = /^https?:\/\//i.test(url) ? url : (url ? 'https://' + url.replace(/^\/+/, '') : '');
    ['priceNight', 'priceWeek', 'priceMonth', 'fees', 'utilities', 'commissionPct', 'deposit', 'floor', 'comfortRating'].forEach(function (k) {
      l[k] = numField(src, k, d[k], path + '.' + k, warnings);
    });
    ['kitchen', 'washer', 'parking', 'shelter', 'internet', 'heating'].forEach(function (k) {
      l[k] = enumField(src, k, d[k], ['yes', 'unknown', 'no']);
    });
    if (!l.name) l.name = 'Вариант без названия';
    return l;
  }

  function normalize(raw, now) {
    var d = defaults(now);
    var src = isObj(raw) ? raw : {};
    var w = [];
    var s = {};
    s.app = 'BASE'; s.version = VERSION;
    var sc = isObj(src.schedule) ? src.schedule : {};
    s.schedule = {
      monthMode: enumField(sc, 'monthMode', d.schedule.monthMode, ['conventional', 'calendar']),
      startMonth: parseYM(sc.startMonth) ? sc.startMonth : d.schedule.startMonth,
      dutyDays: numField(sc, 'dutyDays', d.schedule.dutyDays, 'schedule.dutyDays', w),
      otherAwayDays: numField(sc, 'otherAwayDays', d.schedule.otherAwayDays, 'schedule.otherAwayDays', w),
      staysPerMonth: numField(sc, 'staysPerMonth', d.schedule.staysPerMonth, 'schedule.staysPerMonth', w),
      persons: numField(sc, 'persons', d.schedule.persons, 'schedule.persons', w),
      horizon: numField(sc, 'horizon', d.schedule.horizon, 'schedule.horizon', w),
      dutyOverrides: {}
    };
    if (isObj(sc.dutyOverrides)) {
      Object.keys(sc.dutyOverrides).forEach(function (k) {
        var i = parseInt(k, 10);
        if (!(i >= 0 && i < MAX_SERIES)) return;
        var v = sc.dutyOverrides[k];
        if (v === null || v === undefined || v === '') return;
        s.schedule.dutyOverrides[i] = numField({ dutyDays: v }, 'dutyDays', s.schedule.dutyDays, 'schedule.dutyOverrides.' + i, w);
      });
    }
    s.priority = enumField(src, 'priority', d.priority, PRIORITY_IDS);
    s.baselineId = enumField(src, 'baselineId', d.baselineId, OPTION_IDS);
    var fi = isObj(src.finance) ? src.finance : {};
    s.finance = {
      rate: numField(fi, 'rate', d.finance.rate, 'finance.rate', w),
      reserveGoalMonths: numField(fi, 'reserveGoalMonths', d.finance.reserveGoalMonths, 'finance.reserveGoalMonths', w)
    };
    var so = isObj(src.options) ? src.options : {};
    s.options = {};
    OPTION_IDS.forEach(function (id) {
      var o = normalizeOption(isObj(so[id]) ? so[id] : {}, d.options[id], 'options.' + id, w);
      if (id !== 'custom') { o.type = d.options[id].type; } // тип базовых вариантов фиксирован
      s.options[id] = o;
    });
    var sp = isObj(src.scenarioParams) ? src.scenarioParams : {};
    s.scenarioParams = {};
    ['rentUpPct', 'dailyDownPct', 'weeklyDiscountPct', 'utilitiesUpPct'].forEach(function (k) {
      s.scenarioParams[k] = numField(sp, k, d.scenarioParams[k], 'scenarioParams.' + k, w);
    });
    var ci = isObj(src.cities) ? src.cities : {};
    var list = Array.isArray(ci.list) ? ci.list : [];
    s.cities = {
      homeId: enumField(ci, 'homeId', d.cities.homeId, ['dnipro', 'kamianske', 'custom']),
      valuePerHour: numField(ci, 'valuePerHour', d.cities.valuePerHour, 'cities.valuePerHour', w),
      includeTime: boolField(ci, 'includeTime', d.cities.includeTime),
      list: d.cities.list.map(function (def, i) {
        var found = list.filter(function (c) { return c && c.id === def.id; })[0];
        return normalizeCity(found || {}, def, 'cities.list.' + i, w);
      })
    };
    s.listings = (Array.isArray(src.listings) ? src.listings : []).slice(0, 100).map(function (l, i) { return normalizeListing(isObj(l) ? l : {}, i, w); });
    var ids = s.listings.map(function (l) { return l.id; });
    s.compareIds = (Array.isArray(src.compareIds) ? src.compareIds : []).filter(function (id, i, a) { return ids.indexOf(id) >= 0 && a.indexOf(id) === i; }).slice(0, 5);
    var ui = isObj(src.ui) ? src.ui : {};
    s.ui = { theme: enumField(ui, 'theme', d.ui.theme, ['auto', 'light', 'dark']), animations: boolField(ui, 'animations', d.ui.animations) };
    return { state: s, warnings: w };
  }

  /* ───────────────────────── календарь ───────────────────────── */
  function buildMonths(sched, count) {
    var start = parseYM(sched.startMonth) || parseYM(nextMonthISO());
    var out = [];
    for (var i = 0; i < count; i++) {
      var days, label, labelLong, year = null, month = null;
      if (sched.monthMode === 'calendar') {
        var dt = new Date(Date.UTC(start.y, start.m + i, 1));
        year = dt.getUTCFullYear(); month = dt.getUTCMonth();
        days = daysInMonth(year, month);
        label = MONTHS_SHORT[month] + (i === 0 || month === 0 ? ' ' + String(year).slice(2) : '');
        labelLong = MONTHS_FULL[month] + ' ' + year;
      } else {
        days = 30;
        label = String(i + 1);
        labelLong = 'Месяц ' + (i + 1);
      }
      var hasOv = Object.prototype.hasOwnProperty.call(sched.dutyOverrides, i);
      var dutyRaw = hasOv ? sched.dutyOverrides[i] : sched.dutyDays;
      var awayRaw = dutyRaw + sched.otherAwayDays;
      var away = Math.min(days, awayRaw);
      out.push({
        i: i, days: days, dutyRaw: dutyRaw, duty: Math.min(days, dutyRaw), otherAway: Math.max(0, away - Math.min(days, dutyRaw)),
        away: away, nights: days - away, capped: awayRaw > days, overridden: hasOv,
        label: label, labelLong: labelLong, year: year, month: month
      });
    }
    return out;
  }

  /* ───────────────────────── скидки ───────────────────────── */
  function losTier(o, n) {
    var tiers = [];
    if (o.los7On && o.los7Pct > 0 && n >= 7) tiers.push({ label: 'Скидка за 7+ ночей', pct: o.los7Pct, min: 7 });
    if (o.los14On && o.los14Pct > 0 && n >= 14) tiers.push({ label: 'Скидка за 14+ ночей', pct: o.los14Pct, min: 14 });
    if (o.los28On && o.los28Pct > 0 && n >= 28) tiers.push({ label: 'Скидка за 28+ ночей', pct: o.los28Pct, min: 28 });
    if (!tiers.length) return null;
    // из ступеней за длительность всегда применяется только одна — самая выгодная
    return tiers.reduce(function (a, b) { return (b.pct > a.pct || (b.pct === a.pct && b.min > a.min)) ? b : a; });
  }

  /** Порядок применения скидок к цене ночи для заезда длиной n ночей. */
  function discountSteps(o, n, basePrice) {
    var base = basePrice === undefined ? o.price : basePrice;
    var steps = [{ label: 'Базовая цена', pct: 0, price: base }];
    var cands = [];
    if (o.geniusOn && o.geniusPct > 0) cands.push({ label: 'Genius', pct: o.geniusPct });
    var los = losTier(o, n);
    if (los) cands.push(los);
    var applied;
    if (o.stackMode === 'max') {
      applied = cands.length ? [cands.reduce(function (a, b) { return b.pct > a.pct ? b : a; })] : [];
    } else {
      applied = cands; // последовательно: сначала Genius, затем скидка за длительность — от уже сниженной цены
    }
    var price = base;
    applied.forEach(function (d) {
      price = price * (1 - d.pct / 100);
      steps.push({ label: d.label, pct: d.pct, price: price });
    });
    var skipped = cands.filter(function (c) { return applied.indexOf(c) < 0; });
    return {
      unit: price, steps: steps, skipped: skipped,
      effectivePct: base > 0 ? (1 - price / base) * 100 : 0,
      naiveSumPct: sum(cands.map(function (c) { return c.pct; }))
    };
  }

  function splitStays(nights, count) {
    if (nights <= 0) return [];
    var k = Math.max(1, Math.min(count, nights));
    var base = Math.floor(nights / k), extra = nights % k, out = [];
    for (var i = 0; i < k; i++) out.push(base + (i < extra ? 1 : 0));
    return out;
  }

  /* ───────────────────────── расчёт одного варианта ───────────────────────── */
  function emptyComp() { return { rent: 0, utilities: 0, commission: 0, cleaning: 0, fees: 0 }; }

  function computeOption(state, id, months, H, o) {
    o = o || state.options[id];
    var sched = state.schedule;
    var rate = state.finance.rate / 100;
    var type = o.type;
    var rows = [];
    var commission = type === 'monthly' ? r2(o.rent * o.commissionPct / 100 + o.commissionFixed) : 0;
    var depositLoss = type === 'monthly' ? r2(o.deposit * (1 - o.depositRefundPct / 100)) : 0;
    var refundable = type === 'monthly' ? r2(o.deposit - depositLoss) : o.deposit;
    var prepay = type === 'monthly' && o.prepayLastMonth && H > 1;
    var firstStay = null;

    months.forEach(function (m) {
      var inH = m.i < H;
      var row = { i: m.i, comp: emptyComp(), expense: 0, paidDays: 0, usedNights: m.nights, unused: 0, idle: 0,
        cashOut: 0, cashIn: 0, frozen: 0, events: [], stays: [] };
      function ev(label, amount, kind, note) { if (inH) row.events.push({ label: label, amount: r2(amount), kind: kind, note: note || '' }); }

      if (type === 'monthly') {
        row.comp.rent = o.rent;
        row.comp.utilities = o.utilities;
        row.paidDays = m.days;
        row.unused = m.away;
        row.idle = m.days > 0 ? r2((o.rent + o.utilities) * m.away / m.days) : 0;
        if (m.i === 0) {
          row.comp.commission = commission;
          row.comp.fees = r2(o.setupFees + depositLoss);
        }
        if (inH) {
          if (m.i === 0) {
            ev('Аренда за первый месяц', o.rent, 'pay');
            if (prepay) ev('Предоплата последнего месяца', o.rent, 'prepay', 'расход ' + MONTHS_LABEL(months, H - 1));
            if (commission > 0) ev('Комиссия риелтора', commission, 'pay');
            if (o.setupFees > 0) ev('Оформление договора', o.setupFees, 'pay');
            if (o.deposit > 0) ev('Залог', o.deposit, 'freeze', depositLoss > 0 ? 'вернётся ' + fmtMoney(refundable) + ', удержат ' + fmtMoney(depositLoss) : 'возвратный');
          } else if (prepay && m.i === H - 1) {
            ev('Аренда — оплачена при заселении', 0, 'info');
          } else {
            ev('Аренда', o.rent, 'pay');
          }
          if (o.utilities > 0) ev('Коммунальные', o.utilities, 'pay');
          if (m.i === H - 1 && refundable > 0) ev('Возврат залога', refundable, 'refund');
        }
      } else {
        var stays = splitStays(m.nights, sched.staysPerMonth);
        stays.forEach(function (n, si) {
          var acc, unit, unused = 0, paid = n, info = null;
          if (type === 'nightly') {
            info = discountSteps(o, n);
            unit = info.unit;
            acc = r2(n * unit);
          } else {
            var full = Math.ceil(n / 7), wk = Math.floor(n / 7), rem = n % 7;
            var costFull = full * o.pricePerWeek;
            var costMix = wk * o.pricePerWeek + rem * o.remainderNightPrice;
            if (o.remainderMode === 'nightly' && rem > 0 && costMix <= costFull) {
              acc = r2(costMix); unused = 0; paid = n;
              info = { weeks: wk, remNights: rem, mode: 'mix' };
            } else {
              acc = r2(costFull); unused = full * 7 - n; paid = full * 7;
              info = { weeks: full, remNights: 0, mode: 'weeks' };
            }
            unit = n > 0 ? acc / n : 0;
          }
          var tax = r2(o.taxPerPersonNight * sched.persons * n);
          var stayFees = r2(o.feePerStay + o.recheckinCost + tax);
          row.comp.rent += acc;
          row.comp.cleaning += o.cleaningFee;
          row.comp.fees += stayFees;
          row.paidDays += paid;
          row.unused += unused;
          if (type === 'weekly' && unused > 0) row.idle += r2(unused * o.pricePerWeek / 7);
          var stay = { nights: n, unit: unit, accommodation: acc, cleaning: o.cleaningFee, fees: stayFees, info: info,
            total: r2(acc + o.cleaningFee + stayFees) };
          row.stays.push(stay);
          if (!firstStay) firstStay = { month: m.i, stay: stay };
          var lbl = type === 'nightly'
            ? 'Бронь' + (stays.length > 1 ? ' №' + (si + 1) + ': ' : ': ') + n + ' ' + nightsWord(n)
            : 'Бронь' + (stays.length > 1 ? ' №' + (si + 1) + ': ' : ': ') + (info.mode === 'mix' ? info.weeks + ' нед. + ' + info.remNights + ' ' + nightsWord(info.remNights) : info.weeks + ' нед.');
          ev(lbl, acc, 'pay', type === 'weekly' && unused > 0 ? unused + ' ' + nightsWord(unused) + ' оплачено, но не используется' : '');
          if (o.cleaningFee > 0) ev('Уборка', o.cleaningFee, 'pay');
          if (stayFees > 0) ev('Сборы и заселение', stayFees, 'pay');
          if (o.deposit > 0) {
            ev('Залог на время проживания', o.deposit, 'freeze', 'возвращается при выезде');
            ev('Возврат залога', o.deposit, 'refund');
          }
        });
        if (o.storageMonthly > 0) {
          row.comp.fees += o.storageMonthly;
          row.idle += o.storageMonthly;
          ev('Хранение вещей', o.storageMonthly, 'pay');
        }
        row.comp.rent = r2(row.comp.rent); row.comp.fees = r2(row.comp.fees); row.idle = r2(row.idle);
        row.frozenFrac = m.days > 0 && stays.length ? m.nights / m.days : 0;
      }
      row.expense = r2(row.comp.rent + row.comp.utilities + row.comp.commission + row.comp.cleaning + row.comp.fees);
      row.events.forEach(function (e) {
        if (e.kind === 'pay' || e.kind === 'prepay' || e.kind === 'freeze') row.cashOut += e.amount;
        if (e.kind === 'refund') row.cashIn += e.amount;
      });
      row.cashOut = r2(row.cashOut); row.cashIn = r2(row.cashIn);
      rows.push(row);
    });

    var cum = [], acc = 0;
    rows.forEach(function (r) { acc = r2(acc + r.expense); cum.push(acc); });
    var inH = rows.slice(0, H);
    var total = cum[H - 1];
    var avg = total / H;
    var structure = emptyComp();
    inH.forEach(function (r) { for (var k in structure) structure[k] += r.comp[k]; });
    for (var k in structure) structure[k] = structure[k] / H;

    var moveIn, moveInParts = [];
    if (type === 'monthly') {
      moveIn = o.rent + (prepay ? o.rent : 0) + commission + o.setupFees + o.deposit;
      moveInParts.push({ label: 'Аренда за первый месяц', amount: o.rent });
      if (prepay) moveInParts.push({ label: 'Последний месяц вперёд', amount: o.rent });
      if (commission) moveInParts.push({ label: 'Комиссия', amount: commission });
      if (o.setupFees) moveInParts.push({ label: 'Оформление', amount: o.setupFees });
      if (o.deposit) moveInParts.push({ label: 'Залог', amount: o.deposit });
    } else {
      moveIn = (firstStay ? firstStay.stay.total : 0) + o.deposit;
      if (firstStay) moveInParts.push({ label: 'Первая бронь (' + firstStay.stay.nights + ' ' + nightsWord(firstStay.stay.nights) + ')', amount: firstStay.stay.total });
      if (o.deposit) moveInParts.push({ label: 'Залог', amount: o.deposit });
    }
    moveIn = r2(moveIn);

    var sunk = r2(commission + (type === 'monthly' ? o.setupFees + depositLoss : 0));
    var idleTotal = r2(sum(inH.map(function (r) { return r.idle; })));
    var unusedTotal = sum(inH.map(function (r) { return r.unused; }));
    var paidTotal = sum(inH.map(function (r) { return r.paidDays; }));

    // Альтернативная стоимость — отдельно, в расходы не входит (простые проценты).
    var oppDeposit, oppPrepay = 0;
    if (type === 'monthly') {
      oppDeposit = r2(refundable * rate * H / 12);
      if (prepay) oppPrepay = r2(o.rent * rate * (H - 1) / 12);
    } else {
      oppDeposit = r2(o.deposit * rate / 12 * sum(inH.map(function (r) { return r.frozenFrac || 0; })));
    }

    var cashOutTotal = r2(sum(inH.map(function (r) { return r.cashOut; })));
    var cashInTotal = r2(sum(inH.map(function (r) { return r.cashIn; })));

    return {
      id: id, type: type, name: o.name, short: o.short || o.name, enabled: o.enabled, params: o,
      rows: rows, cum: cum, total: total, avg: avg, year: cum[11], first: rows[0].expense,
      moveIn: moveIn, moveInParts: moveInParts, refundable: refundable, depositLoss: depositLoss,
      commission: commission, setupFees: type === 'monthly' ? o.setupFees : 0, sunk: sunk,
      idleTotal: idleTotal, unusedTotal: unusedTotal, unusedPerMonth: unusedTotal / H, paidTotal: paidTotal,
      opp: { deposit: oppDeposit, prepay: oppPrepay, total: r2(oppDeposit + oppPrepay), frozen: r2(refundable + (prepay ? o.rent : 0)) },
      structure: structure, cashOutTotal: cashOutTotal, cashInTotal: cashInTotal,
      firstStay: firstStay, prepay: prepay
    };
  }
  function MONTHS_LABEL(months, i) { return months[i] ? months[i].labelLong.toLowerCase() : ''; }

  /* ───────────────────────── оценки ───────────────────────── */
  function flexScore(r) {
    var o = r.params, avg = r.avg;
    var vals = {};
    vals.upfront = avg > 0 ? 100 * clamp(1 - (r.moveIn - avg) / (2 * avg), 0, 1) : (r.moveIn > 0 ? 0 : 100);
    vals.sunk = avg > 0 ? 100 * clamp(1 - r.sunk / avg, 0, 1) : (r.sunk > 0 ? 0 : 100);
    vals.commitment = 100 * clamp(1 - o.noticeDays / 90, 0, 1);
    vals.idle = r.total > 0 ? 100 * clamp(1 - r.idleTotal / r.total, 0, 1) : 100;
    var factors = FLEX_FACTORS.map(function (f) {
      var detail;
      if (f.key === 'upfront') detail = 'при заселении ' + fmtMoney(r.moveIn) + ', средний месяц ' + fmtMoney(avg);
      else if (f.key === 'sunk') detail = r.sunk > 0 ? 'невозвратно ' + fmtMoney(r.sunk) : 'нет';
      else if (f.key === 'commitment') detail = o.noticeDays + ' ' + daysWord(o.noticeDays);
      else detail = r.idleTotal > 0 ? fmtMoney(r.idleTotal) + ' из ' + fmtMoney(r.total) : 'нет';
      return { key: f.key, label: f.label, weight: f.weight, rule: f.rule, value: vals[f.key], detail: detail };
    });
    var score = sum(factors.map(function (f) { return f.value * f.weight; })) / sum(FLEX_FACTORS.map(function (f) { return f.weight; }));
    return { score: score, factors: factors };
  }

  function comfortScore(comfort) {
    var items = COMFORT_CRITERIA.map(function (c) {
      var v = comfort[c.key];
      return { key: c.key, label: c.label, weight: c.weight, value: v, points: c.weight * COMFORT_VALUES[v] };
    });
    return { score: sum(items.map(function (i) { return i.points; })), items: items };
  }

  /* ───────────────────────── точки безубыточности ───────────────────────── */
  /** Общая стоимость посуточного варианта линейна по цене ночи: total(P) = a·P + b. */
  function nightlyLinear(state, months, H, o) {
    var p0 = clone(o); p0.price = 0;
    var p1 = clone(o); p1.price = 1000;
    var r0 = computeOption(state, 'tmp', months, H, p0), r1 = computeOption(state, 'tmp', months, H, p1);
    return { a: (r1.total - r0.total) / 1000, b: r0.total };
  }
  function priceBreakEven(state, months, H, o, targetTotal) {
    var lin = nightlyLinear(state, months, H, o);
    if (lin.a <= 0) return null;
    return { price: (targetTotal - lin.b) / lin.a, a: lin.a, b: lin.b };
  }
  /** Первый месяц (1…), к концу которого накопленные расходы A становятся строго меньше B, если в начале A > B. */
  function crossover(cumA, cumB) {
    if (!cumA.length) return null;
    var startAbove = cumA[0] > cumB[0] + 0.5;
    if (!startAbove) return null;
    for (var i = 1; i < cumA.length; i++) if (cumA[i] < cumB[i] - 0.5) return i + 1;
    return null;
  }
  /** Максимальная аренда, при которой помесячный вариант сравнивается с целью за горизонт. */
  function rentBreakEven(o, H, targetTotal) {
    var c = o.commissionPct / 100;
    var loss = o.deposit * (1 - o.depositRefundPct / 100);
    var rent = (targetTotal - o.utilities * H - o.setupFees - o.commissionFixed - loss) / (H + c);
    return rent;
  }

  /* ───────────────────────── города ───────────────────────── */
  function computeCities(state, bestAvg, bestName) {
    var C = state.cities, persons = state.schedule.persons;
    var rows = C.list.filter(function (c) { return c.enabled || c.id === C.homeId; }).map(function (c) {
      var housing = c.housingMode === 'auto' ? bestAvg * c.factorPct / 100 : c.manualMonthly;
      var perTrip = c.mode === 'car'
        ? 2 * c.distanceKm * c.consumption / 100 * c.fuelPrice + c.parking
        : 2 * c.fare * persons + c.parking;
      var hoursPerTrip = 2 * c.minutes / 60;
      var timePerTrip = C.includeTime ? hoursPerTrip * C.valuePerHour : 0;
      var transport = c.trips * perTrip + c.otherMonthly;
      var hours = c.trips * hoursPerTrip;
      var timeCost = C.includeTime ? hours * C.valuePerHour : 0;
      var warnings = [];
      if (c.trips > 0 && c.id !== C.homeId) {
        if (c.mode === 'car' && c.distanceKm <= 0) warnings.push('Укажите расстояние — поездки сейчас считаются бесплатными');
        if (c.mode === 'car' && c.distanceKm > 0 && (c.consumption <= 0 || c.fuelPrice <= 0)) warnings.push('Укажите расход и цену топлива');
        if (c.mode === 'transit' && c.fare <= 0) warnings.push('Укажите стоимость билета');
      }
      return {
        id: c.id, name: c.name, housing: r2(housing), housingSource: c.housingMode === 'auto' ? ('«' + bestName + '» × ' + fmtNum(c.factorPct) + '%') : 'введено вручную',
        perTrip: r2(perTrip), timePerTrip: r2(timePerTrip), trips: c.trips, transport: r2(transport), hours: hours, timeCost: r2(timeCost),
        tco: r2(housing + transport + timeCost), warnings: warnings, params: c
      };
    });
    var home = rows.filter(function (r) { return r.id === C.homeId; })[0] || rows[0];
    rows.forEach(function (r) {
      r.isHome = r === home;
      r.diff = home ? r2(r.tco - home.tco) : 0; // >0 — дороже дома
      r.tripThreshold = null;
      if (home && r !== home) {
        var perTripFull = r.perTrip + r.timePerTrip;
        var fixed = r.housing + r.params.otherMonthly;
        if (perTripFull > 0) r.tripThreshold = (home.tco - fixed) / perTripFull; // поездок, при которых города равны
      }
    });
    var cheapest = rows.slice().sort(function (a, b) { return a.tco - b.tco; })[0];
    return { rows: rows, home: home, cheapest: cheapest, includeTime: C.includeTime, valuePerHour: C.valuePerHour };
  }

  /* ───────────────────────── сценарии «Что, если?» ───────────────────────── */
  var SCENARIOS = [
    { id: 'duty7', group: 'schedule', title: 'В Краматорске 7 дней', apply: function (s) { s.schedule.dutyDays = 7; s.schedule.dutyOverrides = {}; } },
    { id: 'duty10', group: 'schedule', title: 'В Краматорске 10 дней', apply: function (s) { s.schedule.dutyDays = 10; s.schedule.dutyOverrides = {}; } },
    { id: 'duty14', group: 'schedule', title: 'В Краматорске 14 дней', apply: function (s) { s.schedule.dutyDays = 14; s.schedule.dutyOverrides = {}; } },
    { id: 'rentUp', group: 'price', title: function (p) { return 'Аренда выросла на ' + fmtNum(p.rentUpPct) + '%'; },
      apply: function (s, p) { eachOpt(s, 'monthly', function (o) { o.rent = r2(o.rent * (1 + p.rentUpPct / 100)); }); } },
    { id: 'dailyDown', group: 'price', title: function (p) { return 'Посуточно дешевле на ' + fmtNum(p.dailyDownPct) + '%'; },
      apply: function (s, p) { eachOpt(s, 'nightly', function (o) { o.price = r2(o.price * (1 - p.dailyDownPct / 100)); }); } },
    { id: 'noRealtor', group: 'deal', title: 'Нашлась квартира без риелтора',
      apply: function (s) { var o = s.options.realtor; o.commissionPct = 0; o.commissionFixed = 0; o.setupFees = 0; } },
    { id: 'weekDiscount', group: 'deal', title: function (p) { return 'Скидка за неделю ' + fmtNum(p.weeklyDiscountPct) + '%'; },
      apply: function (s, p) { eachOpt(s, 'nightly', function (o) { if (!o.los7On || o.los7Pct < p.weeklyDiscountPct) { o.los7On = true; o.los7Pct = p.weeklyDiscountPct; } }); } },
    { id: 'utilUp', group: 'price', title: function (p) { return 'Коммунальные выросли на ' + fmtNum(p.utilitiesUpPct) + '%'; },
      apply: function (s, p) { eachOpt(s, 'monthly', function (o) { o.utilities = r2(o.utilities * (1 + p.utilitiesUpPct / 100)); }); } }
  ];
  function eachOpt(s, type, fn) { OPTION_IDS.forEach(function (id) { if (s.options[id].type === type) fn(s.options[id]); }); }
  function scenarioTitle(sc, p) { return typeof sc.title === 'function' ? sc.title(p) : sc.title; }
  function applyScenario(state, id) {
    var sc = SCENARIOS.filter(function (x) { return x.id === id; })[0];
    var s = clone(state);
    if (sc) sc.apply(s, s.scenarioParams);
    return s;
  }

  /* ───────────────────────── главный расчёт ───────────────────────── */
  function compute(raw, opts) {
    opts = opts || {};
    var n = normalize(raw, opts.now);
    var state = n.state, warnings = n.warnings;
    var H = state.schedule.horizon;
    // облегчённый расчёт (сценарии, зоны решения на ползунках) не ищет точки перелома на 5 лет — хватает года
    var M = opts.light ? Math.max(H, 12) : Math.max(H, MAX_SERIES);
    var months = buildMonths(state.schedule, M);
    var mH = months.slice(0, H);
    mH.forEach(function (m) {
      if (m.capped) warnings.push({ path: 'schedule.dutyDays', code: 'capped', message: m.labelLong + ': дней вне города (' + (m.dutyRaw + state.schedule.otherAwayDays) + ') больше, чем дней в месяце (' + m.days + ') — ночей в городе 0' });
    });

    var options = {};
    OPTION_IDS.forEach(function (id) { options[id] = computeOption(state, id, months, H); });
    var enabled = OPTION_IDS.filter(function (id) { return state.options[id].enabled; });

    // оценки
    var minAvg = enabled.length ? Math.min.apply(null, enabled.map(function (id) { return options[id].avg; })) : 0;
    var W = PRIORITIES[state.priority].weights;
    OPTION_IDS.forEach(function (id) {
      var r = options[id];
      r.flex = flexScore(r);
      r.comfort = comfortScore(state.options[id].comfort);
      var costScore = r.avg <= 0 ? 100 : (minAvg <= 0 ? 0 : 100 * minAvg / r.avg);
      if (!state.options[id].enabled) costScore = r.avg <= 0 ? 100 : (minAvg > 0 ? Math.min(100, 100 * minAvg / r.avg) : 0);
      r.score = {
        cost: costScore, flex: r.flex.score, comfort: r.comfort.score,
        total: (W.cost * costScore + W.flex * r.flex.score + W.comfort * r.comfort.score) / 100
      };
    });
    var ranking = enabled.slice().sort(function (a, b) {
      var d = options[b].score.total - options[a].score.total;
      if (Math.abs(d) > 1e-9) return d;
      return options[a].avg - options[b].avg;
    });
    var byCost = enabled.slice().sort(function (a, b) { return options[a].avg - options[b].avg; });
    var bestId = ranking[0] || null;
    var best = bestId ? options[bestId] : null;
    var baseline = options[state.baselineId];

    var savings = null;
    if (best) {
      savings = {
        vs: baseline.id, same: best.id === baseline.id,
        monthly: baseline.avg - best.avg,
        horizon: r2(baseline.total - best.total),
        year: r2(baseline.year - best.year),
        pctOfBaseline: baseline.total > 0 ? (baseline.total - best.total) / baseline.total * 100 : 0
      };
      if (savings.same) {
        var next = byCost.filter(function (id) { return id !== best.id; })[0];
        savings.nextId = next || null;
        savings.nextMonthly = next ? options[next].avg - best.avg : 0;
      }
    }

    var result = {
      state: state, warnings: warnings, H: H, months: months, monthsH: mH, options: options,
      enabled: enabled, ranking: ranking, byCost: byCost, bestId: bestId, best: best, baseline: baseline,
      savings: savings, priority: { id: state.priority, label: PRIORITIES[state.priority].label, weights: W },
      schedule: {
        avgNights: sum(mH.map(function (m) { return m.nights; })) / H,
        avgAway: sum(mH.map(function (m) { return m.away; })) / H,
        avgDays: sum(mH.map(function (m) { return m.days; })) / H,
        totalNights: sum(mH.map(function (m) { return m.nights; }))
      }
    };
    if (opts.light) return result;

    result.breakEven = computeBreakEven(state, result);
    result.reserve = computeReserve(state, result);
    result.cities = computeCities(state, best ? best.avg : 0, best ? best.short : '—');
    result.scenarios = computeScenarios(state, result, opts);
    result.absence = computeAbsence(state, opts);
    result.advice = computeAdvice(state, result, opts);
    return result;
  }

  function computeBreakEven(state, R) {
    var out = { price: [], time: [], rent: [] };
    var H = R.H, months = R.months;
    var nightlyIds = R.enabled.filter(function (id) { return R.options[id].type === 'nightly'; });
    var longIds = R.enabled.filter(function (id) { return R.options[id].type === 'monthly'; });
    nightlyIds.forEach(function (nid) {
      var o = state.options[nid];
      var lin = nightlyLinear(state, months, H, o);
      longIds.forEach(function (lid) {
        var L = R.options[lid];
        if (lin.a <= 0) return;
        var p = (L.total - lin.b) / lin.a;
        out.price.push({ nightlyId: nid, longId: lid, price: p, current: o.price, margin: p - o.price, a: lin.a, b: lin.b, longTotal: L.total });
      });
    });
    // время: когда долгосрочный вариант догоняет краткосрочный (или наоборот)
    var shortIds = R.enabled.filter(function (id) { return R.options[id].type !== 'monthly'; });
    shortIds.forEach(function (sid) {
      longIds.forEach(function (lid) {
        var S = R.options[sid].cum, L = R.options[lid].cum;
        var kL = crossover(L, S); // долгосрочный дороже в начале, потом дешевле
        var kS = crossover(S, L);
        if (kL) out.time.push({ cheaperLater: lid, vs: sid, month: kL });
        if (kS) out.time.push({ cheaperLater: sid, vs: lid, month: kS });
      });
    });
    // целевая аренда: при какой цене долгосрочный вариант сравняется с лучшим
    if (R.best) {
      longIds.forEach(function (lid) {
        if (lid === R.bestId) return;
        var targetId = R.byCost[0] === lid ? R.byCost[1] : R.byCost[0];
        if (!targetId) return;
        var rent = rentBreakEven(state.options[lid], H, R.options[targetId].total);
        out.rent.push({ id: lid, vs: targetId, rent: rent, current: state.options[lid].rent });
      });
    }
    return out;
  }

  function computeReserve(state, R) {
    var best = R.best, base = R.baseline;
    if (!best) return null;
    var rate = state.finance.rate / 100;
    var points = [1, 3, 6, 12].map(function (k) {
      var saved = r2(base.cum[k - 1] - best.cum[k - 1]);
      var balance = 0;
      for (var i = 0; i < k; i++) {
        var s = base.rows[i].expense - best.rows[i].expense; // отложенная экономия месяца i
        balance += s * Math.pow(1 + rate / 12, k - 1 - i);
      }
      return {
        months: k, saved: saved, pct: base.cum[k - 1] > 0 ? saved / base.cum[k - 1] * 100 : 0,
        monthsOfLiving: best.avg > 0 ? saved / best.avg : 0, withYield: r2(balance), yieldPart: r2(balance - saved)
      };
    });
    var goal = r2(state.finance.reserveGoalMonths * best.avg);
    var reachMonth = null;
    if (goal > 0) {
      for (var i = 0; i < MAX_SERIES; i++) if (base.cum[i] - best.cum[i] >= goal) { reachMonth = i + 1; break; }
    }
    return { points: points, goal: goal, goalMonths: state.finance.reserveGoalMonths, reachMonth: reachMonth, rate: state.finance.rate,
      monthly: base.avg - best.avg };
  }

  function computeScenarios(state, R, opts) {
    var cur = clone(state); cur.schedule.horizon = 12;
    var r0 = compute(cur, { light: true, now: opts.now });
    var baseBestYear = r0.best ? r0.best.year : 0;
    var list = SCENARIOS.map(function (sc) {
      var s = applyScenario(state, sc.id);
      s.schedule.horizon = 12;
      var r = compute(s, { light: true, now: opts.now });
      var per = {};
      R.enabled.forEach(function (id) { per[id] = { before: r0.options[id].year, after: r.options[id].year, delta: r2(r.options[id].year - r0.options[id].year) }; });
      var bestYear = r.best ? r.best.year : 0;
      var curYear = r0.best ? r0.best.year : 0;
      return {
        id: sc.id, group: sc.group, title: scenarioTitle(sc, state.scenarioParams),
        bestId: r.bestId, bestName: r.best ? r.best.short : '—', bestYear: bestYear, delta: r2(bestYear - curYear),
        bestChanged: r.bestId !== r0.bestId, per: per,
        isCurrent: isSameAsCurrent(sc.id, state)
      };
    });
    var maxImpact = list.filter(function (x) { return !x.isCurrent; }).sort(function (a, b) { return Math.abs(b.delta) - Math.abs(a.delta); })[0] || null;
    return { list: list, maxImpactId: maxImpact && Math.abs(maxImpact.delta) > 0.5 ? maxImpact.id : null, baseYear: baseBestYear };
  }
  function isSameAsCurrent(id, s) {
    var noOv = Object.keys(s.schedule.dutyOverrides).length === 0;
    if (id === 'duty7') return noOv && s.schedule.dutyDays === 7;
    if (id === 'duty10') return noOv && s.schedule.dutyDays === 10;
    if (id === 'duty14') return noOv && s.schedule.dutyDays === 14;
    return false;
  }

  /** «Эффект отсутствия»: средний месяц каждого варианта при 7, 10 и 14 днях дежурства. */
  function computeAbsence(state, opts) {
    var levels = [7, 10, 14];
    var out = { levels: levels, byOption: {} };
    var runs = levels.map(function (d) {
      var s = clone(state); s.schedule.dutyDays = d; s.schedule.dutyOverrides = {};
      return compute(s, { light: true, now: opts.now });
    });
    OPTION_IDS.forEach(function (id) { out.byOption[id] = runs.map(function (r) { return r.options[id].avg; }); });
    out.nights = runs.map(function (r) { return r.schedule.avgNights; });
    return out;
  }

  /* ───────────────────────── советник ───────────────────────── */
  function computeAdvice(state, R, opts) {
    var A = [];
    var best = R.best, H = R.H, O = R.options;
    if (!best) return A;
    var horizonTxt = H === 12 ? '12 месяцев' : H + ' ' + monthsWord(H);
    var nightlyEnabled = R.enabled.filter(function (id) { return O[id].type === 'nightly'; });
    var longEnabled = R.enabled.filter(function (id) { return O[id].type === 'monthly'; }).sort(function (a, b) { return O[a].avg - O[b].avg; });
    var cheapestLong = longEnabled[0] ? O[longEnabled[0]] : null;
    var avgN = R.schedule.avgNights;

    // 1. итог
    var sv = R.savings, baseline = R.baseline;
    if (sv && !sv.same && sv.year > 0.5) {
      A.push({ id: 'summary', tone: 'positive', impact: sv.year + 1e9,
        title: best.short + ' — выгоднее, чем «' + baseline.short + '»',
        text: 'Экономия ' + fmtMoney(sv.monthly) + ' в месяц и ' + fmtMoney(sv.year) + ' за 12 месяцев.',
        calc: baseline.short + ' за 12 мес.: ' + fmtMoney(baseline.year) + ' − ' + best.short + ': ' + fmtMoney(best.year) + ' = ' + fmtMoney(sv.year) });
    } else if (sv && !sv.same && sv.year < -0.5) {
      A.push({ id: 'summary', tone: 'warning', impact: 1e9,
        title: '«' + best.short + '» дороже базы на ' + fmtMoney(-sv.monthly) + ' в месяц',
        text: 'При приоритете «' + PRIORITIES[state.priority].short + '» вы доплачиваете за гибкость или комфорт. В режиме «Экономия» лучшим станет «' + O[R.byCost[0]].short + '».',
        calc: best.short + ': ' + fmtMoney(best.year) + ' за 12 мес.; ' + baseline.short + ': ' + fmtMoney(baseline.year) });
    }

    // 2. эффект длины дежурства (14 дней, или 7 — если сейчас 14)
    if (nightlyEnabled.length && cheapestLong) {
      var target = state.schedule.dutyDays === 14 ? 7 : 14;
      var s = clone(state); s.schedule.dutyDays = target; s.schedule.dutyOverrides = {};
      var rr = compute(s, { light: true, now: opts.now });
      var nid = nightlyEnabled[0];
      var nAvg = rr.options[nid].avg, lAvg = rr.options[cheapestLong.id].avg;
      var diff = lAvg - nAvg;
      var nights = rr.schedule.avgNights, away = rr.schedule.avgAway;
      if (target === 14) {
        A.push({ id: 'duty14', tone: diff > 0 ? 'positive' : 'neutral', impact: Math.abs(diff) * 12,
          title: 'Если дежурство продлится 14 дней',
          text: diff > 0
            ? '«' + O[nid].short + '» обойдётся в ' + fmtMoney(nAvg) + ' в месяц — на ' + fmtMoney(diff) + ' меньше, чем «' + cheapestLong.short + '»: вы не платите за ' + fmtNum(away) + ' ' + nightsWord(away) + ' без вас.'
            : '«' + cheapestLong.short + '» всё равно дешевле на ' + fmtMoney(-diff) + ' в месяц, хотя ' + fmtNum(away) + ' ' + daysWord(away) + ' квартира будет пустовать.',
          calc: O[nid].short + ': ' + fmtNum(nights) + ' ' + nightsWord(nights) + ' → ' + fmtMoney(nAvg) + '/мес; ' + cheapestLong.short + ': ' + fmtMoney(lAvg) + '/мес (в среднем за ' + horizonTxt + ')' });
      } else {
        A.push({ id: 'duty7', tone: 'neutral', impact: Math.abs(diff) * 12,
          title: 'Если дежурства сократятся до 7 дней',
          text: diff > 0 ? '«' + O[nid].short + '» всё ещё дешевле — на ' + fmtMoney(diff) + ' в месяц.' : '«' + cheapestLong.short + '» станет дешевле на ' + fmtMoney(-diff) + ' в месяц — вы будете дома ' + fmtNum(nights) + ' ' + nightsWord(nights) + '.',
          calc: O[nid].short + ': ' + fmtMoney(nAvg) + '/мес; ' + cheapestLong.short + ': ' + fmtMoney(lAvg) + '/мес' });
      }
    }

    // 3. порог цены за ночь
    if (nightlyEnabled.length && cheapestLong) {
      var be = R.breakEven.price.filter(function (p) { return p.nightlyId === nightlyEnabled[0] && p.longId === cheapestLong.id; })[0];
      if (be) {
        var ok = be.price > be.current;
        A.push({ id: 'priceBE', tone: ok ? 'positive' : 'warning', impact: Math.abs(be.margin) * be.a,
          title: ok ? 'Посуточно выгоднее, пока ночь стоит до ' + fmtMoney(Math.floor(be.price)) : '«' + cheapestLong.short + '» выгоднее при текущей цене',
          text: ok
            ? 'Сейчас ' + fmtMoney(be.current) + ' — запас ' + fmtMoney(Math.floor(be.margin)) + ' за ночь. Выше порога выгоднее «' + cheapestLong.short + '».'
            : 'При ' + fmtMoney(be.current) + ' за ночь посуточно дороже. Ищите цену ниже ' + fmtMoney(Math.floor(be.price)) + ' — тогда оно снова выгоднее.',
          calc: '(' + fmtMoney(be.longTotal) + ' − ' + fmtMoney(be.b) + ' сборов) ÷ ' + fmtNum(be.a, 1) + ' оплачиваемых ночей за ' + horizonTxt + ' = ' + fmtMoney(be.price) + ' за ночь' });
      }
    }

    // 4. момент безубыточности во времени
    R.breakEven.time.forEach(function (t) {
      if (t.month > 36) return;
      var later = O[t.cheaperLater], vs = O[t.vs];
      if (later.type !== 'monthly') return;
      A.push({ id: 'time_' + t.cheaperLater + '_' + t.vs, tone: 'neutral', impact: later.sunk,
        title: '«' + later.short + '» окупает разовые платежи на ' + t.month + '-м месяце',
        text: 'Первые ' + (t.month - 1) + ' ' + monthsWord(t.month - 1) + ' дешевле «' + vs.short + '», затем выгоднее «' + later.short + '». Это важно, если вы не уверены, что проживёте здесь дольше.',
        calc: 'Накоплено к ' + t.month + '-му месяцу: ' + later.short + ' ' + fmtMoney(later.cum[t.month - 1]) + ' ≤ ' + vs.short + ' ' + fmtMoney(vs.cum[t.month - 1]) });
    });

    // 5. чувствительность к цене ночи
    if (nightlyEnabled.length) {
      var o = state.options[nightlyEnabled[0]];
      if (o.price >= 100) {
        var months12 = buildMonths(state.schedule, 12);
        var r0 = computeOption(state, 'x', months12, 12, o);
        var o2 = clone(o); o2.price = o.price - 100;
        var r1 = computeOption(state, 'x', months12, 12, o2);
        var save = r0.total - r1.total;
        var n12 = sum(months12.map(function (m) { return m.nights; })) / 12;
        A.push({ id: 'price100', tone: 'positive', impact: save,
          title: 'Каждые 100 ₴ скидки за ночь — ' + fmtMoney(save) + ' в год',
          text: 'Снижение цены с ' + fmtMoney(o.price) + ' до ' + fmtMoney(o.price - 100) + ' сохранит ' + fmtMoney(save) + ' за год, если вы дома ' + fmtNum(n12, 1) + ' ' + (n12 % 1 ? 'ночи' : nightsWord(n12)) + ' в месяц. Об этом стоит говорить с хозяином.',
          calc: fmtMoney(r0.total) + ' − ' + fmtMoney(r1.total) + ' = ' + fmtMoney(save) + ' за 12 мес.' });
      }
    }

    // 6. пустые дни у долгосрочной аренды
    if (cheapestLong && cheapestLong.idleTotal > 0) {
      var m12 = buildMonths(state.schedule, 12);
      var idle12 = sum(cheapestLong.rows.slice(0, 12).map(function (r) { return r.idle; }));
      var un12 = sum(m12.map(function (m) { return m.away; }));
      A.push({ id: 'idle', tone: 'warning', impact: idle12,
        title: 'Пустые дни стоят ' + fmtMoney(idle12) + ' в год',
        text: 'С вариантом «' + cheapestLong.short + '» вы оплачиваете ' + fmtNum(un12) + ' ' + daysWord(un12) + ' в год, когда вас нет дома.',
        calc: '(' + fmtMoney(cheapestLong.params.rent) + ' + ' + fmtMoney(cheapestLong.params.utilities) + ') × дни отсутствия ÷ дни месяца, сумма за 12 мес. = ' + fmtMoney(idle12) });
    }

    // 7. деньги при заселении
    var bigUp = longEnabled.map(function (id) { return O[id]; }).sort(function (a, b) { return b.moveIn - a.moveIn; })[0];
    if (bigUp && bigUp.moveIn > 0) {
      var parts = bigUp.moveInParts.map(function (p) { return p.label.toLowerCase() + ' ' + fmtMoney(p.amount); }).join(' + ');
      A.push({ id: 'upfront', tone: bigUp.sunk > 0 ? 'warning' : 'neutral', impact: bigUp.sunk + bigUp.refundable * 0.1,
        title: '«' + bigUp.short + '»: ' + fmtMoney(bigUp.moveIn) + ' сразу при заселении',
        text: (bigUp.refundable > 0 ? fmtMoney(bigUp.refundable) + ' залога вернутся' : 'Залога нет') + (bigUp.sunk > 0 ? ', ' + fmtMoney(bigUp.sunk) + ' — не вернутся никогда.' : '.') + ' Для сравнения: «' + best.short + '» требует ' + fmtMoney(best.moveIn) + '.',
        calc: parts + ' = ' + fmtMoney(bigUp.moveIn) });
    }

    // 8. квартира без комиссии
    if (state.options.realtor.enabled && O.realtor.sunk > 0) {
      A.push({ id: 'noComm', tone: 'positive', impact: O.realtor.sunk,
        title: 'Без риелтора — минус ' + fmtMoney(O.realtor.sunk),
        text: 'Та же квартира напрямую от собственника сэкономит комиссию и сборы целиком. Ищите объявления с пометкой «без посредников».',
        calc: 'Комиссия ' + fmtNum(state.options.realtor.commissionPct) + '% × ' + fmtMoney(state.options.realtor.rent) + (O.realtor.sunk > O.realtor.commission ? ' + сборы' : '') + ' = ' + fmtMoney(O.realtor.sunk) });
    }

    // 9. альтернативная стоимость залога
    if (state.finance.rate > 0) {
      var frozen = R.enabled.map(function (id) { return O[id]; }).sort(function (a, b) { return b.opp.total - a.opp.total; })[0];
      if (frozen && frozen.opp.total > 0) {
        A.push({ id: 'opp', tone: 'neutral', impact: frozen.opp.total,
          title: 'Замороженные деньги: ~' + fmtMoney(frozen.opp.total) + ' упущенного дохода',
          text: '«' + frozen.short + '» держит ' + fmtMoney(frozen.opp.frozen) + ' залога' + (frozen.prepay ? ' и предоплаты' : '') + '. Под ' + fmtNum(state.finance.rate, 1) + '% годовых они принесли бы ~' + fmtMoney(frozen.opp.total) + ' за ' + horizonTxt + '. В расходы не включено.',
          calc: 'Залог ' + fmtMoney(frozen.refundable) + ' × ' + fmtNum(state.finance.rate, 1) + '% × ' + H + '/12' + (frozen.opp.prepay ? ' + предоплата ' + fmtMoney(frozen.params.rent) + ' × ' + fmtNum(state.finance.rate, 1) + '% × ' + (H - 1) + '/12' : '') + ' ≈ ' + fmtMoney(frozen.opp.total) });
      }
    }

    // 10. понедельная аренда — неиспользованные ночи
    if (state.options.weekly.enabled && O.weekly.unusedTotal > 0) {
      A.push({ id: 'weeklyUnused', tone: 'warning', impact: O.weekly.idleTotal,
        title: 'Понедельно: ' + fmtNum(O.weekly.unusedTotal) + ' оплаченных ночей пропадают',
        text: 'Брони кратны неделе, поэтому часть ночей оплачена впустую — ' + fmtMoney(O.weekly.idleTotal) + ' за ' + horizonTxt + '. Попросите оплатить остаток по посуточной цене.',
        calc: fmtNum(O.weekly.unusedTotal) + ' ноч. × ' + fmtMoney(state.options.weekly.pricePerWeek / 7) + ' = ' + fmtMoney(O.weekly.idleTotal) });
    }

    // 11. лишние заезды
    if (state.schedule.staysPerMonth > 1) {
      nightlyEnabled.concat(R.enabled.filter(function (id) { return O[id].type === 'weekly'; })).slice(0, 1).forEach(function (id) {
        var s1 = clone(state); s1.schedule.staysPerMonth = 1;
        var r1 = compute(s1, { light: true, now: opts.now });
        var d = O[id].avg - r1.options[id].avg;
        if (d > 0.5) A.push({ id: 'stays', tone: 'positive', impact: d * 12,
          title: 'Один заезд вместо ' + state.schedule.staysPerMonth + ' — минус ' + fmtMoney(d) + ' в месяц',
          text: 'Каждый отдельный заезд добавляет уборку и сборы, а короткие брони теряют скидку за длительность.',
          calc: O[id].short + ': ' + fmtMoney(O[id].avg) + ' → ' + fmtMoney(r1.options[id].avg) + ' в месяц' });
      });
    }

    // 12. города
    var C = R.cities;
    if (C && C.home) {
      C.rows.forEach(function (c) {
        if (c.isHome) return;
        if (c.warnings.length) {
          A.push({ id: 'city_' + c.id, tone: 'neutral', impact: 1,
            title: c.name + ': сравнение неполное', text: c.warnings[0] + ' в разделе «Города».', calc: 'Поездок в месяц: ' + c.trips + ', стоимость поездки: ' + fmtMoney(c.perTrip) });
          return;
        }
        if (c.tripThreshold === null) return;
        var thr = Math.floor(c.tripThreshold + 1e-9);
        var cheaper = c.tco < C.home.tco;
        A.push({ id: 'city_' + c.id, tone: cheaper ? 'positive' : 'warning', impact: Math.abs(c.diff) * 12,
          title: cheaper ? c.name + ' дешевле на ' + fmtMoney(-c.diff) + ' в месяц' : c.name + ' дороже на ' + fmtMoney(c.diff) + ' в месяц',
          text: thr < 0 ? 'Даже без поездок жильё здесь дороже, чем «' + C.home.name + '».'
            : c.name + ' выгоднее, пока поездок в ' + C.home.name + ' не больше ' + thr + ' в месяц. Сейчас — ' + c.trips + '.',
          calc: 'Жильё ' + fmtMoney(c.housing) + ' + транспорт ' + fmtMoney(c.transport) + (c.timeCost ? ' + время ' + fmtMoney(c.timeCost) : '') + ' = ' + fmtMoney(c.tco) + ' против ' + fmtMoney(C.home.tco) });
      });
    }

    // 13. резерв
    var rs = R.reserve;
    if (rs && rs.monthly > 0.5 && rs.goal > 0) {
      A.push({ id: 'reserve', tone: 'positive', impact: 0,
        title: rs.reachMonth ? 'Резерв на ' + rs.goalMonths + ' ' + monthsWord(rs.goalMonths) + ' жилья — за ' + rs.reachMonth + ' ' + monthsWord(rs.reachMonth) : 'Резерв растёт на ' + fmtMoney(rs.monthly) + ' в месяц',
        text: 'Откладывайте разницу с вариантом «' + baseline.short + '» на отдельный счёт в день оплаты жилья — так экономия станет подушкой, а не растворится в расходах.',
        calc: 'Цель ' + rs.goalMonths + ' × ' + fmtMoney(best.avg) + ' = ' + fmtMoney(rs.goal) + '; накоплено к 12-му месяцу: ' + fmtMoney(rs.points[3].saved) });
    }

    // 14. длинные дежурства
    if (R.monthsH.some(function (m) { return m.capped; })) {
      A.push({ id: 'capped', tone: 'warning', impact: 2e9,
        title: 'Дежурство длиннее месяца',
        text: 'В некоторых месяцах дней вне города больше, чем дней в месяце. Ночей дома — 0: посуточно вы платите только за хранение, долгосрочная аренда — полностью.',
        calc: R.monthsH.filter(function (m) { return m.capped; }).map(function (m) { return m.labelLong; }).join(', ') });
    }

    A.sort(function (a, b) { return b.impact - a.impact; });
    return A;
  }

  /* ───────────────────────── «Мои варианты» ───────────────────────── */
  function computeListing(rawState, listing, opts) {
    var n = normalize(rawState, opts && opts.now);
    var state = n.state;
    var l = normalizeListing(listing, 0, []);
    var H = state.schedule.horizon;
    var months = buildMonths(state.schedule, Math.max(H, 12));
    var comfortBase = { shelter: l.shelter, heating: l.heating, kitchen: l.kitchen, washer: l.washer, parking: l.parking, internet: l.internet };
    var modes = [];
    var base = optionBase();
    if (l.priceNight > 0) {
      var o = clone(base); o.type = 'nightly'; o.price = l.priceNight; o.feePerStay = l.fees; o.deposit = l.deposit; o.noticeDays = 1;
      modes.push({ mode: 'nightly', label: 'посуточно', o: o });
    }
    if (l.priceWeek > 0) {
      var w = clone(base); w.type = 'weekly'; w.pricePerWeek = l.priceWeek; w.feePerStay = l.fees; w.deposit = l.deposit; w.noticeDays = 7;
      if (l.priceNight > 0) { w.remainderMode = 'nightly'; w.remainderNightPrice = l.priceNight; } else { w.remainderMode = 'week'; }
      modes.push({ mode: 'weekly', label: 'понедельно', o: w });
    }
    if (l.priceMonth > 0) {
      var mo = clone(base); mo.type = 'monthly'; mo.rent = l.priceMonth; mo.utilities = l.utilities; mo.commissionPct = l.commissionPct;
      mo.deposit = l.deposit; mo.setupFees = l.fees; mo.noticeDays = 30;
      modes.push({ mode: 'monthly', label: 'помесячно', o: mo });
    }
    var res = modes.map(function (m) {
      var r = computeOption(state, 'listing', months, H, m.o);
      return { mode: m.mode, label: m.label, avg: r.avg, total: r.total, year: r.year, moveIn: r.moveIn, idleTotal: r.idleTotal, option: m.o, r: r };
    });
    res.sort(function (a, b) { return a.avg - b.avg; });
    var bestMode = res[0] || null;
    var comfort = clone(comfortBase); comfort.ownSpace = bestMode && bestMode.mode === 'monthly' ? 'yes' : 'no';
    var cs = comfortScore(comfort);
    var flex = bestMode ? flexScore(bestMode.r) : null;
    return { listing: l, modes: res, best: bestMode, comfort: cs, flex: flex, H: H };
  }

  /* ───────────────────────── таблица и CSV ───────────────────────── */
  function tableRows(R) {
    var H = R.H;
    var ids = R.enabled;
    function row(key, label, get, kind, hint) {
      var values = {};
      ids.forEach(function (id) { values[id] = get(R.options[id]); });
      return { key: key, label: label, values: values, kind: kind || 'money', hint: hint || '' };
    }
    return [
      row('avg', 'Месячные расходы', function (o) { return o.avg; }, 'money', 'в среднем за ' + H + ' мес., с учётом разовых платежей'),
      row('first', 'Первый месяц', function (o) { return o.first; }),
      row('total', 'Расходы за ' + H + ' мес.', function (o) { return o.total; }),
      row('year', 'Годовые расходы', function (o) { return o.year; }, 'money', 'за 12 месяцев'),
      row('moveIn', 'Деньги при заселении', function (o) { return o.moveIn; }, 'money', 'платёж, а не расход: включает возвратный залог'),
      row('refundable', 'Возвратный залог', function (o) { return o.refundable; }, 'money', 'заморожен, но вернётся'),
      row('commission', 'Комиссии', function (o) { return o.commission; }),
      row('sunk', 'Невозвратные разовые', function (o) { return o.sunk; }, 'money', 'комиссия, оформление, удержанная часть залога'),
      row('idle', 'Переплата за пустующие дни', function (o) { return o.idleTotal; }, 'money', 'за ' + H + ' мес.'),
      row('unused', 'Оплачено, но не использовано', function (o) { return o.unusedPerMonth; }, 'days', 'дней в месяц'),
      row('opp', 'Альтернативная стоимость', function (o) { return o.opp.total; }, 'money', 'упущенный доход на замороженных деньгах, в расходы не входит'),
      row('flex', 'Финансовая гибкость', function (o) { return o.flex.score; }, 'score'),
      row('comfort', 'Комфорт и безопасность', function (o) { return o.comfort.score; }, 'score'),
      row('score', 'Итоговая оценка', function (o) { return o.score.total; }, 'score', 'приоритет «' + R.priority.label + '»')
    ];
  }

  function toCSV(R) {
    var rows = tableRows(R);
    var ids = R.enabled;
    function esc(v) { var s = String(v); return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
    function num(v, kind) {
      if (kind === 'money') return String(Math.round(v));
      return String(Math.round(v * 10) / 10).replace('.', ',');
    }
    var lines = [];
    lines.push(['Показатель'].concat(ids.map(function (id) { return R.options[id].name; })).map(esc).join(';'));
    rows.forEach(function (r) {
      var unit = r.kind === 'money' ? ', грн' : r.kind === 'days' ? ', дней/мес' : ', из 100';
      lines.push([r.label + unit].concat(ids.map(function (id) { return num(r.values[id], r.kind); })).map(esc).join(';'));
    });
    lines.push('');
    lines.push(esc('Горизонт: ' + R.H + ' мес.; дней в Краматорске: ' + R.state.schedule.dutyDays + '; ночей дома в среднем: ' + (Math.round(R.schedule.avgNights * 10) / 10)));
    lines.push(esc('Цены введены пользователем и не являются подтверждёнными рыночными предложениями.'));
    return '﻿' + lines.join('\r\n');
  }

  return {
    VERSION: VERSION, OPTION_IDS: OPTION_IDS, OPTION_TYPES: OPTION_TYPES, PRIORITIES: PRIORITIES, PRIORITY_IDS: PRIORITY_IDS,
    COMFORT_CRITERIA: COMFORT_CRITERIA, COMFORT_VALUES: COMFORT_VALUES, FLEX_FACTORS: FLEX_FACTORS, SCENARIOS: SCENARIOS,
    LIMITS: LIMITS, FIELD_LABELS: FIELD_LABELS, MONTHS_FULL: MONTHS_FULL,
    defaults: defaults, normalize: normalize, compute: compute, computeOption: computeOption, buildMonths: buildMonths,
    discountSteps: discountSteps, splitStays: splitStays, computeListing: computeListing, applyScenario: applyScenario,
    scenarioTitle: scenarioTitle, tableRows: tableRows, toCSV: toCSV, crossover: crossover, rentBreakEven: rentBreakEven,
    fmtNum: fmtNum, fmtMoney: fmtMoney, fmtSigned: fmtSigned, plural: plural, nightsWord: nightsWord, daysWord: daysWord,
    monthsWord: monthsWord, clone: clone, r2: r2
  };
});
