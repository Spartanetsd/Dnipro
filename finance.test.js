/*
 * BASE — проверка финансового ядра.
 * Запуск: `node finance.test.js` или откройте tests.html в браузере.
 */
(function (root) {
  'use strict';

  function runTests(F) {
    var results = [];
    var NOW = new Date(2026, 9, 27); // фиксированная дата → предсказуемый стартовый месяц (ноябрь 2026)

    function test(name, fn) {
      try { fn(); results.push({ name: name, ok: true }); }
      catch (e) { results.push({ name: name, ok: false, error: e && e.message ? e.message : String(e) }); }
    }
    function eq(actual, expected, label) {
      if (Math.abs(actual - expected) > 0.01) throw new Error((label || 'значение') + ': ожидалось ' + expected + ', получено ' + actual);
    }
    function ok(cond, label) { if (!cond) throw new Error(label || 'условие не выполнено'); }
    function base(mut) { var s = F.defaults(NOW); if (mut) mut(s); return s; }
    function run(mut, light) { return F.compute(base(mut), { now: NOW, light: !!light }); }

    /* ── Тесты из ТЗ ── */
    test('Тест А: 20 ночей × 700 ₴ = 14 000 ₴/мес, 168 000 ₴ за 12 мес.', function () {
      var r = run(null, true);
      eq(r.options.daily.first, 14000, 'первый месяц');
      eq(r.options.daily.avg, 14000, 'средний месяц');
      eq(r.options.daily.year, 168000, 'год');
    });
    test('Тест Б: риелтор — 39 000 первый месяц, 144 000 за 6, 270 000 за 12; залог не в расходах', function () {
      var r = run(null, true);
      var o = r.options.realtor;
      eq(o.first, 39000, 'первый месяц');
      eq(o.cum[5], 144000, '6 месяцев');
      eq(o.cum[11], 270000, '12 месяцев');
      eq(o.refundable, 18000, 'возвратный залог');
      ok(o.total === 270000, 'залог не должен входить в расходы');
    });
    test('Тест В: напрямую — 18 000 ₴/мес, 216 000 ₴ за 12 мес.', function () {
      var r = run(null, true);
      eq(r.options.direct.avg, 18000);
      eq(r.options.direct.year, 216000);
    });
    test('Тест Г: экономия посуточно против риелтора — 102 000 ₴ за год (8 500 ₴/мес)', function () {
      var r = run(null, true);
      eq(r.options.realtor.year - r.options.daily.year, 102000, 'год');
      eq(r.bestId === 'daily' ? 1 : 0, 1, 'лучший вариант по умолчанию — посуточно');
      eq(r.savings.monthly, 8500, 'экономия в месяц на главном экране');
      eq(r.savings.year, 102000, 'экономия за год');
    });
    test('Тест Д: 16 ночей → 11 200 ₴/мес, 134 400 ₴/год', function () {
      var r = run(function (s) { s.schedule.dutyDays = 14; }, true);
      eq(r.months[0].nights, 16, 'ночей');
      eq(r.options.daily.avg, 11200);
      eq(r.options.daily.year, 134400);
    });
    test('Тест Е: 23 ночи → 16 100 ₴/мес, 193 200 ₴/год', function () {
      var r = run(function (s) { s.schedule.dutyDays = 7; }, true);
      eq(r.months[0].nights, 23, 'ночей');
      eq(r.options.daily.avg, 16100);
      eq(r.options.daily.year, 193200);
    });

    /* ── Граничные случаи ── */
    test('Нулевые значения: всё по нулям — без NaN и деления на ноль', function () {
      var r = F.compute(base(function (s) {
        ['daily', 'realtor', 'direct'].forEach(function (id) { var o = s.options[id]; o.price = 0; o.rent = 0; o.utilities = 0; o.deposit = 0; });
      }), { now: NOW });
      ['daily', 'realtor', 'direct'].forEach(function (id) {
        var o = r.options[id];
        ok(isFinite(o.avg) && isFinite(o.flex.score) && isFinite(o.score.total), id + ': числа конечны');
        eq(o.total, 0, id + ' итого');
      });
      ok(r.advice.every(function (a) { return a.text.indexOf('NaN') < 0 && a.calc.indexOf('NaN') < 0; }), 'нет NaN в советах');
    });
    test('Отрицательные числа приводятся к 0 с предупреждением', function () {
      var r = run(function (s) { s.options.daily.price = -500; s.options.realtor.rent = -1; }, true);
      eq(r.options.daily.total, 0, 'посуточно');
      eq(r.options.realtor.params.rent, 0, 'аренда');
      ok(r.warnings.some(function (w) { return w.path === 'options.daily.price' && w.code === 'negative'; }), 'есть предупреждение');
    });
    test('Пустые поля считаются нулём и помечаются', function () {
      var r = run(function (s) { s.options.direct.utilities = ''; s.options.daily.cleaningFee = null; }, true);
      eq(r.options.direct.avg, 15000, 'напрямую без коммунальных');
      ok(r.warnings.filter(function (w) { return w.code === 'empty'; }).length === 2, 'два предупреждения о пустых полях');
    });
    test('Строки с запятой и пробелами разбираются как числа', function () {
      var r = run(function (s) { s.options.daily.price = '1 000,5'; }, true);
      eq(r.options.daily.params.price, 1000.5);
    });
    test('Скидка 100% делает ночи бесплатными, но уборка остаётся', function () {
      var r = run(function (s) { var o = s.options.daily; o.geniusOn = true; o.geniusPct = 100; o.cleaningFee = 300; }, true);
      eq(r.options.daily.first, 300);
    });
    test('Скидка больше 100% ограничивается 100% с предупреждением', function () {
      var r = run(function (s) { var o = s.options.daily; o.geniusOn = true; o.geniusPct = 150; }, true);
      eq(r.options.daily.params.geniusPct, 100);
      eq(r.options.daily.first, 0);
      ok(r.warnings.some(function (w) { return w.code === 'max' && w.path === 'options.daily.geniusPct'; }), 'предупреждение');
    });
    test('Дежурство дольше месяца: ночей 0, посуточно 0, долгосрочно — полная оплата', function () {
      var r = F.compute(base(function (s) { s.schedule.dutyDays = 40; }), { now: NOW });
      eq(r.months[0].nights, 0, 'ночей');
      eq(r.options.daily.first, 0, 'посуточно');
      eq(r.options.direct.first, 18000, 'напрямую');
      ok(r.warnings.some(function (w) { return w.code === 'capped'; }), 'предупреждение о длинном дежурстве');
      ok(r.advice.some(function (a) { return a.id === 'capped'; }), 'совет о длинном дежурстве');
    });
    test('Частичная потеря залога: удержанная часть — расход, остальное возвращается', function () {
      var r = run(function (s) { s.options.direct.depositRefundPct = 70; }, true);
      var o = r.options.direct;
      eq(o.depositLoss, 4500, 'удержано');
      eq(o.refundable, 10500, 'вернётся');
      eq(o.first, 18000 + 4500, 'первый месяц');
      eq(o.year, 216000 + 4500, 'год');
      eq(o.sunk, 4500, 'невозвратные');
    });
    test('Возврат залога в денежном потоке: выплаты − возвраты = расходы', function () {
      ['realtor', 'direct', 'daily'].forEach(function (id) {
        var r = run(function (s) { s.options.direct.depositRefundPct = 60; s.options.daily.deposit = 2000; s.options.realtor.prepayLastMonth = true; }, true);
        var o = r.options[id];
        eq(o.cashOutTotal - o.cashInTotal, o.total, id + ': баланс потока');
      });
    });
    test('Предоплата последнего месяца не учитывается дважды', function () {
      var a = run(null, true).options.realtor;
      var b = run(function (s) { s.options.realtor.prepayLastMonth = true; }, true).options.realtor;
      eq(b.total, a.total, 'расходы не меняются');
      eq(b.moveIn, a.moveIn + 18000, 'при заселении +1 месяц');
      eq(b.rows[0].cashOut, a.rows[0].cashOut + 18000, 'поток первого месяца');
      eq(b.rows[11].cashOut, 3000, 'в последнем месяце только коммунальные');
      ok(b.opp.prepay > 0, 'альтернативная стоимость предоплаты учтена отдельно');
    });
    test('Предоплата последнего месяца при горизонте 1 месяц не создаёт второй платёж', function () {
      var r = run(function (s) { s.schedule.horizon = 1; s.options.realtor.prepayLastMonth = true; }, true);
      eq(r.options.realtor.moveIn, 18000 + 18000 + 18000, 'аренда + комиссия + залог');
      eq(r.options.realtor.total, 39000);
    });
    test('Несколько бронирований: 20 ночей = 2 × 10, уборка за каждый заезд, без скидки за 14 ночей', function () {
      var r = run(function (s) {
        s.schedule.staysPerMonth = 2;
        var o = s.options.daily; o.cleaningFee = 300; o.los14On = true; o.los14Pct = 15;
      }, true);
      var row = r.options.daily.rows[0];
      eq(row.stays.length, 2, 'заездов');
      eq(row.stays[0].nights, 10, 'ночей в заезде');
      eq(row.expense, 14000 + 600, 'расход месяца');
      var one = run(function (s) { var o = s.options.daily; o.cleaningFee = 300; o.los14On = true; o.los14Pct = 15; }, true);
      eq(one.options.daily.rows[0].expense, 20 * 700 * 0.85 + 300, 'один заезд со скидкой 15%');
    });
    test('Неравные заезды: 23 ночи в 3 брони → 8 + 8 + 7', function () {
      var st = F.splitStays(23, 3);
      eq(st[0], 8); eq(st[1], 8); eq(st[2], 7);
      eq(F.splitStays(0, 3).length, 0, 'без ночей — без броней');
      eq(F.splitStays(2, 5).length, 2, 'заездов не больше ночей');
    });
    test('Календарный режим: февраль 28 дней → 18 ночей, 31 день → 21 ночь', function () {
      var r = run(function (s) { s.schedule.monthMode = 'calendar'; s.schedule.startMonth = '2027-01'; }, true);
      eq(r.months[0].days, 31, 'январь'); eq(r.months[0].nights, 21);
      eq(r.months[1].days, 28, 'февраль 2027'); eq(r.months[1].nights, 18);
      eq(r.options.daily.rows[1].expense, 18 * 700, 'посуточно в феврале');
      eq(r.options.daily.rows[0].expense, 21 * 700, 'посуточно в январе');
      eq(r.options.direct.rows[1].expense, 18000, 'аренда за февраль не меняется');
      var yearNights = r.months.slice(0, 12).reduce(function (a, m) { return a + m.nights; }, 0);
      eq(yearNights, 365 - 120, 'ночей за 2027 год');
      eq(r.options.daily.year, (365 - 120) * 700, 'посуточно за календарный год');
    });
    test('Високосный февраль 2028 — 29 дней', function () {
      var r = run(function (s) { s.schedule.monthMode = 'calendar'; s.schedule.startMonth = '2028-02'; }, true);
      eq(r.months[0].days, 29);
    });
    test('Разное число дней дежурства по месяцам', function () {
      var r = run(function (s) { s.schedule.dutyOverrides = { 0: 7, 1: 14 }; }, true);
      eq(r.options.daily.rows[0].expense, 23 * 700, 'месяц 1');
      eq(r.options.daily.rows[1].expense, 16 * 700, 'месяц 2');
      eq(r.options.daily.rows[2].expense, 20 * 700, 'месяц 3');
    });
    test('Скидки не суммируются: Genius 10% и 15% за 14 ночей = −23,5%, а не −25%', function () {
      var o = F.defaults(NOW).options.daily;
      o.geniusOn = true; o.geniusPct = 10; o.los14On = true; o.los14Pct = 15;
      var d = F.discountSteps(o, 20);
      eq(d.unit, 700 * 0.9 * 0.85, 'цена ночи');
      eq(Math.round(d.effectivePct * 10) / 10, 23.5, 'итоговая скидка');
      eq(d.naiveSumPct, 25, 'арифметическая сумма для сравнения');
      eq(d.steps.length, 3, 'шаги: база → Genius → длительность');
    });
    test('Режим «только наибольшая скидка»', function () {
      var o = F.defaults(NOW).options.daily;
      o.geniusOn = true; o.geniusPct = 10; o.los14On = true; o.los14Pct = 15; o.stackMode = 'max';
      var d = F.discountSteps(o, 20);
      eq(d.unit, 700 * 0.85);
      eq(d.skipped.length, 1, 'Genius пропущен');
    });
    test('Из скидок за длительность применяется только одна ступень', function () {
      var o = F.defaults(NOW).options.daily;
      o.los7On = true; o.los7Pct = 10; o.los14On = true; o.los14Pct = 15; o.los28On = true; o.los28Pct = 20;
      eq(F.discountSteps(o, 10).unit, 630, '10 ночей → 7+');
      eq(F.discountSteps(o, 20).unit, 595, '20 ночей → 14+');
      eq(F.discountSteps(o, 30).unit, 560, '30 ночей → 28+');
      eq(F.discountSteps(o, 5).unit, 700, '5 ночей → без скидки');
    });
    test('Понедельно: остаток по посуточной цене, если дешевле; иначе — неиспользованные ночи', function () {
      var r = run(function (s) { var w = s.options.weekly; w.enabled = true; w.pricePerWeek = 4200; w.remainderNightPrice = 700; }, true);
      eq(r.options.weekly.first, 2 * 4200 + 6 * 700, '2 недели + 6 ночей');
      var r2 = run(function (s) { var w = s.options.weekly; w.enabled = true; w.pricePerWeek = 3500; w.remainderNightPrice = 700; }, true);
      eq(r2.options.weekly.first, 3 * 3500, '3 недели дешевле');
      eq(r2.options.weekly.rows[0].unused, 1, 'одна ночь оплачена впустую');
      eq(r2.options.weekly.rows[0].idle, 500, 'стоимость пустой ночи');
    });
    test('Переплата за пустующие дни у долгосрочной аренды', function () {
      var r = run(null, true);
      eq(r.options.direct.idleTotal, 18000 * 10 / 30 * 12, 'за год');
      eq(r.options.direct.unusedPerMonth, 10, 'дней в месяц');
      eq(r.options.daily.idleTotal, 0, 'посуточно — ноль');
    });
    test('Комиссия как процент и как произвольная сумма', function () {
      var r = run(function (s) { s.options.realtor.commissionPct = 50; s.options.realtor.commissionFixed = 1000; }, true);
      eq(r.options.realtor.commission, 10000);
    });
    test('Деньги при заселении', function () {
      var r = run(null, true);
      eq(r.options.realtor.moveIn, 54000, 'риелтор: аренда + комиссия + залог');
      eq(r.options.direct.moveIn, 30000, 'напрямую: аренда + залог');
      eq(r.options.daily.moveIn, 14000, 'посуточно: первая бронь');
    });
    test('Точка безубыточности по цене ночи: напрямую 900 ₴, риелтор 1 125 ₴', function () {
      var r = run();
      var d = r.breakEven.price.filter(function (p) { return p.longId === 'direct'; })[0];
      var re = r.breakEven.price.filter(function (p) { return p.longId === 'realtor'; })[0];
      eq(d.price, 900); eq(re.price, 1125);
    });
    test('Момент безубыточности во времени: при 1 100 ₴/ночь риелтор выгоднее с 19-го месяца', function () {
      var r = run(function (s) { s.options.daily.price = 1100; });
      var t = r.breakEven.time.filter(function (x) { return x.cheaperLater === 'realtor' && x.vs === 'daily'; })[0];
      ok(t, 'точка найдена');
      eq(t.month, 19);
    });
    test('Снижение цены на 100 ₴ сохраняет 24 000 ₴ в год при 20 ночах', function () {
      var r = run();
      var a = r.advice.filter(function (x) { return x.id === 'price100'; })[0];
      ok(a && a.title.indexOf('24') >= 0, 'совет с суммой 24 000');
    });
    test('Советник: совет про 14 дней дежурства подтверждается расчётом', function () {
      var r = run();
      var a = r.advice.filter(function (x) { return x.id === 'duty14'; })[0];
      ok(a, 'совет есть');
      ok(a.text.indexOf('11') >= 0 && a.text.indexOf('6') >= 0, 'посуточно 11 200 против 18 000 — разница 6 800');
    });
    test('Сценарии: 14 дней снижают годовой бюджет, максимальный эффект определён', function () {
      var r = run();
      var d14 = r.scenarios.list.filter(function (x) { return x.id === 'duty14'; })[0];
      eq(d14.delta, 134400 - 168000, 'изменение годового бюджета');
      var cur = r.scenarios.list.filter(function (x) { return x.id === 'duty10'; })[0];
      ok(cur.isCurrent, '10 дней — текущий сценарий');
      ok(r.scenarios.maxImpactId, 'есть сценарий с максимальным влиянием');
    });
    test('Сценарий «без риелтора» убирает комиссию', function () {
      var s = F.applyScenario(base(), 'noRealtor');
      var r = F.compute(s, { now: NOW, light: true });
      eq(r.options.realtor.year, 252000);
    });
    test('Эффект отсутствия: 7/10/14 дней', function () {
      var r = run();
      var d = r.absence.byOption.daily, l = r.absence.byOption.direct;
      eq(d[0], 16100); eq(d[1], 14000); eq(d[2], 11200);
      eq(l[0], 18000); eq(l[2], 18000);
    });
    test('Калькулятор свободы: накопленная экономия за 1/3/6/12 мес.', function () {
      var r = run();
      var p = r.reserve.points;
      eq(p[0].saved, 25000, '1 мес. (комиссия в первом месяце)');
      eq(p[1].saved, 39000, '3 мес.');
      eq(p[2].saved, 60000, '6 мес.');
      eq(p[3].saved, 102000, '12 мес.');
      ok(p[3].withYield > p[3].saved, 'с доходностью больше');
      var z = run(function (s) { s.finance.rate = 0; });
      eq(z.reserve.points[3].withYield, 102000, 'при 0% — без изменений');
    });
    test('Альтернативная стоимость залога вынесена отдельно', function () {
      var r = run();
      eq(r.options.direct.opp.deposit, 15000 * 0.10, '15 000 × 10% × 12/12');
      eq(r.options.direct.total, 216000, 'в расходы не входит');
    });
    test('Города: порог поездок для Каменского', function () {
      var r = run(function (s) { var k = s.cities.list[1]; k.distanceKm = 40; k.consumption = 8; k.fuelPrice = 60; k.trips = 4; });
      var k = r.cities.rows.filter(function (c) { return c.id === 'kamianske'; })[0];
      eq(k.housing, r.best.avg * 0.8, 'жильё');
      eq(k.perTrip, 2 * 40 * 0.08 * 60, 'поездка');
      eq(k.tripThreshold, (r.best.avg - r.best.avg * 0.8) / k.perTrip, 'порог');
      var kw = run().cities.rows.filter(function (c) { return c.id === 'kamianske'; })[0];
      ok(kw.warnings.length > 0, 'без расстояния — предупреждение');
    });
    test('Мои варианты: выбирается самый дешёвый тариф объекта', function () {
      var l = { name: 'Тест', priceNight: 800, priceWeek: 4900, priceMonth: 17000, utilities: 2000 };
      var r = F.computeListing(base(), l, { now: NOW });
      ok(r.best, 'есть лучший тариф');
      eq(r.best.avg, Math.min.apply(null, r.modes.map(function (m) { return m.avg; })));
      eq(r.modes.length, 3);
    });
    test('Одинаковые числа на всех экранах: таблица и CSV берут значения из того же расчёта', function () {
      var r = run();
      var rows = F.tableRows(r);
      var avg = rows.filter(function (x) { return x.key === 'avg'; })[0];
      eq(avg.values.daily, r.options.daily.avg);
      var csv = F.toCSV(r);
      ok(csv.indexOf('22500') >= 0 && csv.indexOf('14000') >= 0, 'CSV содержит средние месяцы');
      ok(csv.charCodeAt(0) === 0xfeff, 'BOM для Excel');
    });
    test('Импорт мусора не ломает расчёт', function () {
      var r = F.compute({ options: 'x', schedule: { horizon: 'abc', dutyDays: 1e9 }, listings: [null, 5] }, { now: NOW });
      ok(r.best, 'есть результат');
      eq(r.H, 12, 'горизонт по умолчанию');
      eq(r.state.listings.length, 2);
    });
    test('Горизонт 1, 3, 6 и произвольный (60)', function () {
      [1, 3, 6, 60].forEach(function (h) {
        var r = run(function (s) { s.schedule.horizon = h; }, true);
        eq(r.options.direct.total, 18000 * h, 'напрямую ' + h);
        eq(r.options.realtor.total, 21000 * h + 18000, 'риелтор ' + h);
      });
    });
    test('Нет включённых вариантов — пустой результат без ошибок', function () {
      var r = F.compute(base(function (s) { F.OPTION_IDS.forEach(function (id) { s.options[id].enabled = false; }); }), { now: NOW });
      ok(r.best === null, 'лучшего нет');
      ok(Array.isArray(r.advice), 'советы — массив');
    });

    return results;
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = runTests;
    if (require.main === module) {
      var F = require('./finance.js');
      var res = runTests(F);
      var failed = res.filter(function (r) { return !r.ok; });
      res.forEach(function (r) { console.log((r.ok ? '  ✓ ' : '  ✗ ') + r.name + (r.ok ? '' : '\n      ' + r.error)); });
      console.log('\n' + (res.length - failed.length) + ' из ' + res.length + ' проверок пройдено');
      process.exit(failed.length ? 1 : 0);
    }
  } else {
    root.runBaseTests = runTests;
  }
})(typeof self !== 'undefined' ? self : this);
