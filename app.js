/*!
 * BASE — Умная аренда · app.js
 * Интерфейс. Никаких собственных формул: все числа берутся из finance.js (BaseFinance.compute).
 */
(function () {
  'use strict';

  var F = window.BaseFinance;
  var Ch = window.BaseCharts;
  var KEY = 'base.v1';
  var OPT = F.OPTION_IDS;
  var TABS = ['home', 'compare', 'scenarios', 'listings', 'settings'];
  var COLOR = { daily: 'var(--c-daily)', realtor: 'var(--c-realtor)', direct: 'var(--c-direct)', weekly: 'var(--c-weekly)', aparthotel: 'var(--c-aparthotel)', custom: 'var(--c-custom)' };
  var COMP = [
    { key: 'rent', label: 'Аренда / проживание', color: 'var(--k-rent)' },
    { key: 'utilities', label: 'Коммунальные', color: 'var(--k-utilities)' },
    { key: 'commission', label: 'Комиссии', color: 'var(--k-commission)' },
    { key: 'cleaning', label: 'Уборка', color: 'var(--k-cleaning)' },
    { key: 'fees', label: 'Доп. сборы', color: 'var(--k-fees)' },
    { key: 'transport', label: 'Транспорт', color: 'var(--k-transport)' }
  ];
  var TRI = [['yes', 'Да'], ['unknown', '?'], ['no', 'Нет']];

  var I = {
    minus: '<svg viewBox="0 0 24 24"><path d="M6 12h12"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 6v12M6 12h12"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="M12 5v14"/><path d="m6 13 6 6 6-6"/></svg>',
    alert: '<svg viewBox="0 0 24 24"><path d="M12 4 2.8 19.5h18.4Z"/><path d="M12 10v4.5"/><path d="M12 17.3v.2"/></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><path d="M12 7.6v.2"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    out: '<svg viewBox="0 0 24 24"><path d="M7 17 17 7"/><path d="M9 7h8v8"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-2"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    link: '<svg viewBox="0 0 24 24"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16Z"/><path d="m13.5 6.5 4 4"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M9 7V4.5h6V7"/><path d="M6.5 7 7.5 20h9l1-13"/></svg>',
    download: '<svg viewBox="0 0 24 24"><path d="M12 4v11"/><path d="m7 10.5 5 5 5-5"/><path d="M5 20h14"/></svg>',
    upload: '<svg viewBox="0 0 24 24"><path d="M12 20V9"/><path d="m7 13.5 5-5 5 5"/><path d="M5 4h14"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/></svg>',
    hand: '<svg viewBox="0 0 24 24"><path d="M12 20.5c-4 0-6.5-2.6-6.5-6.5V9.5a1.5 1.5 0 0 1 3 0V12"/><path d="M8.5 11V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M11.5 10.5V4.5a1.5 1.5 0 0 1 3 0v6"/><path d="M14.5 10.5V6a1.5 1.5 0 0 1 3 0v8c0 3.9-2.5 6.5-5.5 6.5"/></svg>',
    mark: '<svg viewBox="0 0 24 24"><path d="M6 11.8 12 6.5l6 5.3"/><path d="M8 10.3v6.9M16 10.3v6.9"/><path d="M5 17.2h14"/></svg>',
    home: '<svg viewBox="0 0 24 24"><path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10v9.5h11V10"/></svg>',
    plusCircle: '<svg viewBox="0 0 24 24"><path d="M12 6v12M6 12h12"/></svg>'
  };

  /* ───────────────────────── состояние ───────────────────────── */
  var state = load();
  var R = F.compute(state);
  var ui = { tab: 'home', compareTab: 'options', flowId: null, flowMonth: 0, reserveK: 12, scFor: 'best', scOpen: null, adviceAll: false };
  var lastVals = {};
  var installEvent = null;

  function load() {
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { raw = null; }
    return raw ? F.normalize(raw).state : F.defaults();
  }
  var saveTimer = null;
  function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 250); }
  function saveNow() {
    clearTimeout(saveTimer);
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { toast('Не удалось сохранить: память браузера недоступна'); }
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') saveNow(); });
  window.addEventListener('pagehide', saveNow);

  function getPath(obj, path) {
    var p = path.split('.'), o = obj;
    for (var i = 0; i < p.length; i++) { if (o == null) return undefined; o = o[p[i]]; }
    return o;
  }
  function setPath(obj, path, val) {
    var p = path.split('.'), o = obj;
    for (var i = 0; i < p.length - 1; i++) { if (o[p[i]] == null || typeof o[p[i]] !== 'object') o[p[i]] = {}; o = o[p[i]]; }
    o[p[p.length - 1]] = val;
  }

  function commit(opts) {
    opts = opts || {};
    R = F.compute(state);
    scheduleSave();
    applyAppearance();
    if (!opts.skipView) render();
    refreshSheet();
  }
  var rafPending = false;
  function commitSoon() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(function () { rafPending = false; commit(); });
  }

  /* ───────────────────────── форматирование ───────────────────────── */
  var money = F.fmtMoney, num = F.fmtNum;
  function h(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function fmtVal(v, kind) {
    v = Number(v) || 0;
    switch (kind) {
      case 'money': return money(v);
      case 'days': return num(v) + '<small> дн.</small>';
      case 'nights': return num(v) + '<small> ноч.</small>';
      case 'pct': return num(v, 1) + '<small>%</small>';
      case 'months': return num(v) + '<small> мес.</small>';
      case 'people': return num(v) + '<small> чел.</small>';
      default: return num(v);
    }
  }
  function signedMoney(v) { return F.fmtSigned(v); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function ruDate(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? m[3] + '.' + m[2] + '.' + m[1] : ''; }
  function reduceMotion() {
    return !state.ui.animations || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function optColor(id) { return COLOR[id] || 'var(--ink-3)'; }
  function oname(id) { return R.options[id].short; }
  function enabledOpts() { return R.enabled; }
  function typeLabel(t) { return t === 'nightly' ? 'посуточно' : t === 'weekly' ? 'понедельно' : 'помесячно'; }

  /* ───────────────────────── компоненты ───────────────────────── */
  function stepper(path, step, min, max, kind, label) {
    var v = getPath(R.state, path);
    return '<span class="stepper" role="group" aria-label="' + h(label) + '">' +
      '<button type="button" data-step="' + path + '" data-delta="-' + step + '" data-min="' + min + '" data-max="' + max + '" aria-label="' + h(label) + ': меньше">' + I.minus + '</button>' +
      '<output data-show="' + path + '" data-fmt="' + kind + '" aria-live="polite">' + fmtVal(v, kind) + '</output>' +
      '<button type="button" data-step="' + path + '" data-delta="' + step + '" data-min="' + min + '" data-max="' + max + '" aria-label="' + h(label) + ': больше">' + I.plus + '</button></span>';
  }
  function seg(path, items, cls) {
    var cur = String(getPath(state, path));
    return '<div class="seg ' + (cls || '') + '" role="group">' + items.map(function (it) {
      return '<button type="button" data-set="' + path + '" data-value="' + h(it[0]) + '" aria-pressed="' + (cur === String(it[0])) + '">' + h(it[1]) + '</button>';
    }).join('') + '</div>';
  }
  function chipsSet(path, items, type) {
    var cur = String(getPath(R.state, path));
    return '<div class="chips">' + items.map(function (it) {
      return '<button type="button" class="chip" data-set="' + path + '" data-type="' + (type || 'num') + '" data-value="' + h(it[0]) + '" aria-pressed="' + (cur === String(it[0])) + '">' + h(it[1]) + '</button>';
    }).join('') + '</div>';
  }
  function fid(path) { return 'f_' + path.replace(/[^\w]/g, '_'); }
  function rawStr(v) { return v === '' || v === null || v === undefined ? '' : String(v).replace('.', ','); }
  function fnum(path, label, unit, hint, extra) {
    var id = fid(path);
    return '<div class="field" data-path="' + path + '"><label class="field-label" for="' + id + '">' + h(label) + (hint ? '<small>' + h(hint) + '</small>' : '') + '</label>' +
      '<span class="field-inline">' + (extra || '') + '<span class="field-input"><input id="' + id + '" type="text" inputmode="decimal" autocomplete="off" enterkeyhint="done" data-bind="' + path + '" data-kind="num" value="' + h(rawStr(getPath(state, path))) + '">' +
      (unit ? '<em>' + h(unit) + '</em>' : '') + '</span></span><div class="field-msg" role="alert"></div></div>';
  }
  function ftext(path, label, placeholder, hint) {
    var id = fid(path);
    return '<div class="field wide" data-path="' + path + '"><label class="field-label" for="' + id + '">' + h(label) + (hint ? '<small>' + h(hint) + '</small>' : '') + '</label>' +
      '<span class="field-input"><input id="' + id + '" type="text" autocomplete="off" data-bind="' + path + '" data-kind="text" maxlength="60" placeholder="' + h(placeholder || '') + '" value="' + h(getPath(state, path) || '') + '"></span><div class="field-msg"></div></div>';
  }
  function switchHtml(path, label) {
    return '<label class="switch"><input type="checkbox" role="switch" data-bind="' + path + '" data-kind="bool" aria-label="' + h(label) + '"' + (getPath(state, path) ? ' checked' : '') + '><span></span></label>';
  }
  function ftoggle(path, label, hint) {
    return '<div class="field"><span class="field-label">' + h(label) + (hint ? '<small>' + h(hint) + '</small>' : '') + '</span>' + switchHtml(path, label) + '</div>';
  }
  function frow(label, control, hint) {
    return '<div class="control-row"><span class="control-label">' + h(label) + (hint ? '<span class="control-hint">' + h(hint) + '</span>' : '') + '</span>' + control + '</div>';
  }
  function meter(v) { return '<div class="meter"><i style="width:' + Math.max(0, Math.min(100, v)) + '%"></i></div>'; }
  function kpi(label, value, dot) { return '<div class="kpi"><div class="kpi-label">' + (dot ? '<i class="dot" style="--c:' + dot + '"></i>' : '') + h(label) + '</div><div class="kpi-value">' + value + '</div></div>'; }
  function badge(text, cls) { return '<span class="badge ' + (cls || '') + '">' + h(text) + '</span>'; }

  /* ───────────────────────── отрисовка ───────────────────────── */
  function fkOf(el) {
    if (!el || !el.getAttribute) return null;
    var keys = ['data-step', 'data-delta', 'data-set', 'data-value', 'data-act', 'data-id', 'data-bind', 'data-k', 'data-i'];
    var sel = '';
    keys.forEach(function (k) { var v = el.getAttribute(k); if (v !== null) sel += '[' + k + '="' + String(v).replace(/"/g, '\\"') + '"]'; });
    return sel || null;
  }
  function render() {
    var el = document.getElementById('view-' + ui.tab);
    if (!el) return;
    var active = document.activeElement;
    var fk = active && el.contains(active) ? fkOf(active) : null;
    el.innerHTML = VIEWS[ui.tab].html();
    if (VIEWS[ui.tab].after) VIEWS[ui.tab].after(el);
    animateNumbers(el);
    if (fk) { var f = el.querySelector(fk); if (f) try { f.focus({ preventScroll: true }); } catch (e) {} }
  }

  function animateNumbers(root) {
    root.querySelectorAll('[data-anim]').forEach(function (el) {
      var key = el.getAttribute('data-anim'), to = parseFloat(el.getAttribute('data-value'));
      var from = lastVals[key];
      lastVals[key] = to;
      if (from === undefined || !isFinite(to) || Math.abs(from - to) < 0.5 || reduceMotion()) return;
      var t0 = performance.now(), dur = 560;
      el.textContent = money(from);
      function step(t) {
        if (!el.isConnected) return;
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = money(from + (to - from) * e);
        if (p < 1) requestAnimationFrame(step); else el.textContent = money(to);
      }
      requestAnimationFrame(step);
    });
  }

  function setTab(tab, noScroll) {
    if (TABS.indexOf(tab) < 0) tab = 'home';
    var changed = ui.tab !== tab;
    ui.tab = tab;
    TABS.forEach(function (t) {
      var v = document.getElementById('view-' + t);
      v.hidden = t !== tab;
      if (t !== tab) v.innerHTML = '';
    });
    document.querySelectorAll('.tab').forEach(function (a) {
      if (a.getAttribute('data-tab') === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    render();
    if (changed && !noScroll) window.scrollTo(0, 0);
  }

  /* ═════════════════════════ ГЛАВНАЯ ═════════════════════════ */
  function brandHead() {
    return '<header class="brand-head"><div class="brand"><span class="brand-mark" aria-hidden="true">' + I.mark + '</span><div><div class="brand-name">BASE</div><p class="brand-tag">Живи свободно. Плати разумно.</p></div></div>' +
      '<button type="button" class="head-chip" data-act="schedule" aria-label="График проживания">' + num(R.state.schedule.dutyDays) + '&nbsp;дн. · ' + num(R.schedule.avgNights, 1) + '&nbsp;ноч.</button></header>';
  }
  function emptyEnabled() {
    return '<div class="card empty"><h3>Нет вариантов для сравнения</h3><p>Включите хотя бы один вариант жилья — и BASE посчитает, какой выгоднее.</p><a class="btn btn-primary" href="#compare">Открыть варианты</a></div>';
  }
  function baselineSelect() {
    return '<select class="inline-select" data-bind="baselineId" data-kind="str" aria-label="С чем сравнивать">' + OPT.map(function (id) {
      return '<option value="' + id + '"' + (R.state.baselineId === id ? ' selected' : '') + '>' + h(R.options[id].short) + (R.state.options[id].enabled ? '' : ' (выкл.)') + '</option>';
    }).join('') + '</select>';
  }

  function heroHtml() {
    var b = R.best, sv = R.savings, cls, label, val, sub;
    if (sv.same) {
      cls = sv.nextMonthly > 0.5 ? 'is-pos' : 'is-neutral';
      label = 'Вы уже на лучшем варианте — он дешевле';
      val = Math.max(0, sv.nextMonthly);
      sub = 'в месяц, чем «' + h(sv.nextId ? oname(sv.nextId) : '—') + '» · база: ' + baselineSelect();
    } else if (sv.monthly > 0.5) {
      cls = 'is-pos'; label = 'Вы экономите'; val = sv.monthly;
      sub = 'в месяц по сравнению с ' + baselineSelect();
    } else if (sv.monthly < -0.5) {
      cls = 'is-warn'; label = 'Вы доплачиваете'; val = -sv.monthly;
      sub = 'в месяц по сравнению с ' + baselineSelect() + ' — за гибкость и комфорт';
    } else {
      cls = 'is-neutral'; label = 'Разницы почти нет'; val = 0;
      sub = 'по сравнению с ' + baselineSelect();
    }
    return '<section class="card hero ' + cls + '" aria-live="polite">' +
      '<div class="hero-top"><span class="eyebrow">Лучшая стратегия</span>' +
      '<button type="button" class="best-chip" data-act="editOption" data-id="' + b.id + '"><i class="dot" style="--c:' + optColor(b.id) + '"></i>' + h(b.short) + '</button></div>' +
      '<div class="hero-label">' + label + '</div>' +
      '<div class="hero-value" data-anim="hero" data-value="' + val + '">' + money(val) + '</div>' +
      '<div class="hero-sub">' + sub + '</div>' +
      '<div class="hero-note">в среднем за ' + R.H + ' ' + F.monthsWord(R.H) + ' · приоритет «' + h(F.PRIORITIES[R.state.priority].short) + '»</div></section>';
  }

  function metricsHtml() {
    var b = R.best, sv = R.savings;
    var yearCls = sv.year > 0.5 && !sv.same ? 'good' : sv.year < -0.5 ? 'warn' : '';
    var yearVal = sv.same ? (sv.nextId ? R.options[sv.nextId].year - b.year : 0) : sv.year;
    var yearFoot = sv.same ? (sv.nextId ? 'против «' + oname(sv.nextId) + '»' : '') : 'против «' + R.baseline.short + '»';
    if (sv.same && yearVal > 0.5) yearCls = 'good';
    var unusedFoot = b.idleTotal > 0 ? 'переплата ' + money(b.idleTotal) + ' за ' + R.H + ' мес.' : 'платите только за свои ночи';
    var moveFoot = b.refundable > 0 ? 'из них ' + money(b.refundable) + ' залог — вернётся' : (b.type === 'monthly' ? 'без залога' : 'первая бронь, без залога');
    return '<div class="metrics">' +
      '<div class="metric"><span class="metric-label">Стоимость месяца</span><span class="metric-value num">' + money(b.avg) + '</span><span class="metric-foot">«' + h(b.short) + '», в среднем</span></div>' +
      '<div class="metric"><span class="metric-label">Экономия за 12 мес.</span><span class="metric-value num ' + yearCls + '">' + money(yearVal) + '</span><span class="metric-foot">' + h(yearFoot) + '</span></div>' +
      '<div class="metric"><span class="metric-label">Нужно для заселения</span><span class="metric-value num">' + money(b.moveIn) + '</span><span class="metric-foot">' + h(moveFoot) + '</span></div>' +
      '<div class="metric"><span class="metric-label">Оплачено, но пустует</span><span class="metric-value num">' + num(b.unusedPerMonth, 1) + ' <small>' + F.daysWord(b.unusedPerMonth) + '/мес</small></span><span class="metric-foot">' + h(unusedFoot) + '</span></div>' +
      '<button type="button" class="metric" data-act="flex" data-id="' + b.id + '"><span class="metric-label">Финансовая гибкость</span><span class="metric-value num">' + num(b.flex.score) + '<small>/100</small></span>' + meter(b.flex.score) + '</button>' +
      '<button type="button" class="metric" data-act="editOption" data-id="' + b.id + '" data-section="comfort"><span class="metric-label">Комфорт и безопасность</span><span class="metric-value num">' + num(b.comfort.score) + '<small>/100</small></span>' + meter(b.comfort.score) + '</button>' +
      '</div>';
  }

  function quickHtml() {
    var S = R.state.schedule;
    var noOv = Object.keys(S.dutyOverrides).length === 0;
    var m0 = R.monthsH[0];
    var dutyChips = '<div class="chips">' + [7, 10, 14].map(function (d) {
      return '<button type="button" class="chip" data-set="schedule.dutyDays" data-type="num" data-value="' + d + '" aria-pressed="' + (S.dutyDays === d) + '">' + d + ' ' + F.daysWord(d) + '</button>';
    }).join('') + (noOv ? '' : '<span class="badge warn">есть дни по месяцам</span>') + '</div>';
    var horizonChips = '<div class="chips">' + [1, 3, 6, 12].map(function (m) {
      return '<button type="button" class="chip" data-set="schedule.horizon" data-type="num" data-value="' + m + '" aria-pressed="' + (S.horizon === m) + '">' + m + ' мес.</button>';
    }).join('') + '<button type="button" class="chip" data-act="schedule" data-id="horizon" aria-pressed="' + ([1, 3, 6, 12].indexOf(S.horizon) < 0) + '">' + ([1, 3, 6, 12].indexOf(S.horizon) < 0 ? S.horizon + ' мес.' : 'Другой') + '</button></div>';
    var where = { dnipro: 'в Днепре', kamianske: 'в Каменском' }[R.state.cities.homeId] || 'дома';
    var nightsHint = S.monthMode === 'calendar' ? where + ' · ' + m0.labelLong.toLowerCase() + ', дальше по календарю' : where + ' · из 30 дней месяца';
    var d = R.state.options.daily;
    return '<section class="card section" aria-labelledby="quick-t">' +
      '<div class="row-between"><h2 class="card-title" id="quick-t">Ваш месяц</h2><button type="button" class="link-btn" data-act="schedule">Подробный график</button></div>' +
      frow('Дней в Краматорске', stepper('schedule.dutyDays', 1, 0, 62, 'num', 'Дней в Краматорске'), 'дежурство') +
      '<div class="control-sub">' + dutyChips + '</div>' +
      frow('Ночей дома', '<span class="stepper" role="group" aria-label="Ночей дома"><button type="button" data-act="nights" data-delta="-1" aria-label="Ночей дома: меньше">' + I.minus + '</button><output class="num">' + num(m0.nights) + '</output><button type="button" data-act="nights" data-delta="1" aria-label="Ночей дома: больше">' + I.plus + '</button></span>', nightsHint) +
      (d.enabled ? frow('Цена за ночь', stepper('options.daily.price', 50, 0, 100000, 'money', 'Цена за ночь'), 'посуточная аренда') : '') +
      frow('Горизонт', '', 'для средних значений и итогов') +
      '<div class="control-sub">' + horizonChips + '</div></section>';
  }

  function priorityHtml() {
    var max = Math.max.apply(null, R.ranking.map(function (id) { return R.options[id].score.total; }).concat([1]));
    var list = R.ranking.map(function (id, i) {
      var r = R.options[id];
      return '<li><button type="button" class="rank-btn" data-act="editOption" data-id="' + id + '" style="--c:' + optColor(id) + '">' +
        '<i class="dot lg"></i><span class="rank-name"><span>' + h(r.short) + '</span>' + (i === 0 ? badge('лучший', 'good') : '') + '</span>' +
        '<span class="rank-val">' + money(r.avg) + '<span class="muted small">/мес</span></span>' +
        '<span class="rank-meta"><span class="rank-bar"><i style="width:' + (r.score.total / max * 100) + '%"></i></span><span>' + num(r.score.total) + ' баллов</span></span></button></li>';
    }).join('');
    return '<section class="section"><div class="section-head"><h2 class="section-title">Что для вас важнее</h2><button type="button" class="link-btn" data-act="scoring">Как считается</button></div>' +
      seg('priority', F.PRIORITY_IDS.map(function (p) { return [p, F.PRIORITIES[p].short]; }), 'seg-lg') +
      '<div class="card" style="margin-top:12px"><ul class="rank">' + list + '</ul></div></section>';
  }

  function warningsHtml() {
    var seen = {}, list = [];
    R.warnings.forEach(function (w) { if (!seen[w.message]) { seen[w.message] = 1; list.push(w); } });
    if (!list.length) return '';
    return '<div class="notice" role="status">' + I.alert + '<div><b>Проверьте данные · ' + list.length + '</b><ul>' +
      list.slice(0, 5).map(function (w) { return '<li>' + h(w.message) + '</li>'; }).join('') + (list.length > 5 ? '<li>…и ещё ' + (list.length - 5) + '</li>' : '') + '</ul></div></div>';
  }

  function adviceHtml() {
    var A = R.advice || [];
    if (!A.length) return '';
    var shown = ui.adviceAll ? A : A.slice(0, 4);
    var icon = { positive: I.down, warning: I.alert, neutral: I.info };
    return '<section class="section"><div class="section-head"><h2 class="section-title">Советник</h2><p class="section-note">считает по вашим цифрам</p></div>' +
      '<div class="card"><ul class="advice">' + shown.map(function (a) {
        return '<li class="' + a.tone + '"><span class="advice-ico" aria-hidden="true">' + (icon[a.tone] || I.info) + '</span><div><div class="advice-title">' + h(a.title) + '</div>' +
          '<div class="advice-text">' + h(a.text) + '</div><details><summary>Расчёт</summary><div class="calc">' + h(a.calc) + '</div></details></div></li>';
      }).join('') + '</ul>' + (A.length > 4 ? '<button type="button" class="btn btn-ghost btn-block" style="margin-top:8px" data-act="adviceAll">' + (ui.adviceAll ? 'Свернуть' : 'Все советы · ' + A.length) + '</button>' : '') +
      '</div></section>';
  }

  function flowId() { return ui.flowId && R.state.options[ui.flowId] && R.state.options[ui.flowId].enabled ? ui.flowId : R.bestId; }
  function flowHtml() {
    var id = flowId(), r = R.options[id];
    if (ui.flowMonth >= R.H) ui.flowMonth = 0;
    var m = ui.flowMonth, row = r.rows[m], ml = R.months[m];
    var ico = { pay: I.out, prepay: I.clock, freeze: I.lock, refund: I.back, info: I.check };
    var events = row.events.length ? row.events.map(function (e) {
      var amt = e.kind === 'refund' ? '+' + money(e.amount) : e.kind === 'info' ? '—' : money(e.amount);
      return '<li class="' + e.kind + '"><span class="flow-ico" aria-hidden="true">' + (ico[e.kind] || I.out) + '</span><span>' + h(e.label) + '</span><span class="amt">' + amt + '</span>' +
        (e.note || e.kind === 'freeze' ? '<span class="note">' + h(e.note || 'временно заморожено') + '</span>' : '') + '</li>';
    }).join('') : '<li class="info"><span class="flow-ico">' + I.check + '</span><span>Платежей нет — вы весь месяц на дежурстве</span><span class="amt">0&nbsp;₴</span></li>';
    return '<section class="section"><div class="section-head"><h2 class="section-title">Денежный поток</h2><p class="section-note">когда и сколько платить</p></div>' +
      '<div class="card"><div class="chips">' + enabledOpts().map(function (oid) {
        return '<button type="button" class="chip" data-act="flowOpt" data-id="' + oid + '" aria-pressed="' + (oid === id) + '"><i class="dot" style="--c:' + optColor(oid) + '"></i>' + h(oname(oid)) + '</button>';
      }).join('') + '</div>' +
      '<div data-chart="flow" style="margin-top:12px"></div>' +
      '<div class="flow-detail"><div class="row-between"><b>' + h(ml.labelLong) + '</b><span class="muted small">' + ml.nights + ' ' + F.nightsWord(ml.nights) + ' дома · ' + ml.away + ' ' + F.daysWord(ml.away) + ' вне</span></div>' +
      '<ul class="flow-list">' + events + '</ul></div>' +
      '<div class="flow-sum">' + kpi('Заплатите', money(r.cashOutTotal)) + kpi('Вернётся', money(r.cashInTotal)) + kpi('Расход', money(r.total)) + '</div>' +
      '<p class="group-note">За ' + R.H + ' ' + F.monthsWord(R.H) + '. Залог и предоплата — это деньги, которые уходят сейчас, но не все они расход.</p></div></section>';
  }

  function reserveHtml() {
    var rs = R.reserve;
    if (!rs) return '';
    var head = '<section class="section"><div class="section-head"><h2 class="section-title">Калькулятор свободы</h2><p class="section-note">экономия → резерв</p></div><div class="card">';
    if (rs.monthly <= 0.5 && rs.points[3].saved <= 0.5) {
      return head + '<p class="card-sub">Относительно варианта «' + h(R.baseline.short) + '» экономии нет. Выберите другую базу сравнения в карточке вверху — например, самый дорогой вариант, который вы рассматривали.</p></div></section>';
    }
    var idx = [1, 3, 6, 12].indexOf(ui.reserveK); if (idx < 0) idx = 3;
    var p = rs.points[idx];
    var prog = rs.goal > 0 ? Math.max(0, Math.min(1, p.saved / rs.goal)) : 0;
    var C = 2 * Math.PI * 46;
    return head +
      '<div class="seg" role="group">' + [1, 3, 6, 12].map(function (k) {
        return '<button type="button" data-act="reserveK" data-k="' + k + '" aria-pressed="' + (k === ui.reserveK) + '">' + k + ' мес.</button>';
      }).join('') + '</div>' +
      '<div class="reserve-top"><div><div class="muted small">Сохраните за ' + p.months + ' ' + F.monthsWord(p.months) + '</div>' +
      '<div class="reserve-big good num" data-anim="reserve" data-value="' + p.saved + '">' + money(p.saved) + '</div>' +
      '<div class="muted small" style="margin-top:6px">против «' + h(R.baseline.short) + '»</div></div>' +
      '<div class="ring" role="img" aria-label="Прогресс к цели резерва: ' + Math.round(prog * 100) + '%"><svg viewBox="0 0 104 104"><circle class="ring-track" cx="52" cy="52" r="46"/><circle class="ring-fill" cx="52" cy="52" r="46" stroke-dasharray="' + C + '" stroke-dashoffset="' + (C * (1 - prog)) + '"/></svg>' +
      '<div class="ring-center"><div><b>' + Math.round(prog * 100) + '%</b>цели</div></div></div></div>' +
      '<div class="kpis">' + kpi('От расходов на жильё', num(p.pct, 1) + '%') + kpi('Это месяцев жизни', num(p.monthsOfLiving, 1)) +
      kpi('С доходностью ' + num(rs.rate, 1) + '%', money(p.withYield)) + '</div>' +
      '<p class="group-note">Цель — резерв на ' + rs.goalMonths + ' ' + F.monthsWord(rs.goalMonths) + ' жилья: ' + money(rs.goal) + '. ' +
      (rs.reachMonth ? 'Наберёте за ' + rs.reachMonth + ' ' + F.monthsWord(rs.reachMonth) + '.' : 'При текущей разнице цель не достигается за 5 лет.') +
      ' Доходность — ваша ставка, а не обещание: проценты начисляются на отложенную экономию ежемесячно.</p>' +
      '<ol class="steps"><li>В день оплаты жилья переводите <b>' + money(Math.max(0, rs.monthly)) + '</b> — разницу с «' + h(R.baseline.short) + '» — на отдельный накопительный счёт.</li>' +
      '<li>Не трогайте эти деньги, пока не наберёте ' + money(rs.goal) + ': это запас на случай смены графика, переезда или ремонта машины.</li>' +
      '<li>Сверх цели — решайте сами: вклад, досрочные платежи или крупная покупка без долгов.</li></ol>' +
      frow('Ставка вклада', stepper('finance.rate', 0.5, 0, 100, 'pct', 'Ставка вклада'), 'годовых, ваша оценка') +
      frow('Цель резерва', stepper('finance.reserveGoalMonths', 1, 0, 36, 'months', 'Цель резерва'), 'месяцев жилья') +
      '</div></section>';
  }

  var Home = {
    html: function () {
      if (!R.best) return brandHead() + emptyEnabled() + quickHtml();
      return brandHead() + heroHtml() + warningsHtml() + metricsHtml() + quickHtml() + priorityHtml() + adviceHtml() + flowHtml() + reserveHtml() +
        '<p class="group-note" style="margin-top:22px;text-align:center">Все суммы — ваши вводные. BASE не получает цены с Booking или OLX автоматически и ничего не отправляет на сервер.</p>';
    },
    after: function (el) {
      var fc = el.querySelector('[data-chart="flow"]');
      if (fc && R.best) {
        var id = flowId(), r = R.options[id];
        Ch.flow(fc, {
          labels: R.monthsH.map(function (m) { return m.label; }),
          values: r.rows.slice(0, R.H).map(function (x) { return x.cashOut; }),
          refunds: r.rows.slice(0, R.H).map(function (x) { return x.cashIn; }),
          selected: ui.flowMonth, color: optColor(id),
          onSelect: function (i) { ui.flowMonth = i; render(); var c = document.querySelector('[data-chart="flow"]'); if (c) c.focus({ preventScroll: true }); }
        });
      }
    }
  };

  /* ═════════════════════════ СРАВНЕНИЕ ═════════════════════════ */
  function compareHead() {
    var S = R.state.schedule;
    return '<header class="page-head"><h1 class="page-title">Сравнение</h1><p class="page-sub">' + S.dutyDays + ' ' + F.daysWord(S.dutyDays) + ' в Краматорске · ' + num(R.schedule.avgNights, 1) + ' ноч. дома · горизонт ' + R.H + ' мес. <button type="button" class="link-btn" data-act="schedule">изменить</button></p></header>' +
      '<div class="seg" role="tablist" aria-label="Разделы сравнения">' + [['options', 'Варианты'], ['table', 'Таблица'], ['charts', 'Графики'], ['cities', 'Города']].map(function (t) {
        return '<button type="button" role="tab" data-act="cmpTab" data-id="' + t[0] + '" aria-pressed="' + (ui.compareTab === t[0]) + '" aria-selected="' + (ui.compareTab === t[0]) + '">' + t[1] + '</button>';
      }).join('') + '</div>';
  }

  function optTags(id) {
    var o = R.state.options[id], r = R.options[id], t = [];
    if (o.type === 'monthly') {
      t.push('аренда ' + money(o.rent));
      if (o.utilities) t.push('коммунальные ' + money(o.utilities));
      if (r.commission) t.push('комиссия ' + money(r.commission));
      if (o.deposit) t.push('залог ' + money(o.deposit) + (r.depositLoss ? ', удержат ' + money(r.depositLoss) : ''));
      if (r.prepay) t.push('последний месяц вперёд');
    } else {
      t.push(o.type === 'nightly' ? money(o.price) + ' за ночь' : money(o.pricePerWeek) + ' за неделю');
      if (o.type === 'nightly') {
        var st = r.firstStay ? F.discountSteps(o, r.firstStay.stay.nights) : null;
        t.push(st && st.effectivePct > 0.05 ? 'скидка −' + num(st.effectivePct, 1) + '%' : 'без скидок');
      }
      if (o.cleaningFee) t.push('уборка ' + money(o.cleaningFee));
      if (o.storageMonthly) t.push('хранение ' + money(o.storageMonthly) + '/мес');
      if (o.deposit) t.push('залог ' + money(o.deposit));
    }
    t.push(o.noticeDays + ' ' + F.daysWord(o.noticeDays) + ' обязательств');
    return t.map(function (x) { return '<span class="tag">' + h(x) + '</span>'; }).join('');
  }
  function optionsPane() {
    return '<p class="group-note" style="margin:14px 4px">Цены — стартовые примеры. Замените их своими, включите нужные варианты — расчёт обновится мгновенно.</p>' +
      OPT.map(function (id) {
        var r = R.options[id], o = R.state.options[id];
        return '<article class="card opt-card' + (o.enabled ? '' : ' off') + '" style="--c:' + optColor(id) + '">' +
          '<div class="opt-head"><div class="grow"><div class="opt-name">' + h(o.name) + (id === R.bestId ? ' ' + badge('лучший', 'good') : '') + '</div><div class="opt-type">' + typeLabel(o.type) + (id === 'custom' ? ' · настраиваемый' : '') + '</div></div>' +
          switchHtml('options.' + id + '.enabled', 'Включить «' + o.name + '» в сравнение') + '</div>' +
          '<div class="opt-figures"><div><div class="fig-label">Средний месяц</div><div class="fig-value big">' + money(r.avg) + '</div></div>' +
          '<div><div class="fig-label">Первый месяц</div><div class="fig-value">' + money(r.first) + '</div></div>' +
          '<div><div class="fig-label">При заселении</div><div class="fig-value">' + money(r.moveIn) + '</div></div></div>' +
          '<div class="opt-tags">' + optTags(id) + '</div>' +
          '<div class="opt-actions"><button type="button" class="btn btn-sm" data-act="editOption" data-id="' + id + '">' + I.edit + 'Настроить</button>' +
          '<button type="button" class="btn btn-sm btn-ghost" data-act="flex" data-id="' + id + '">Гибкость ' + num(r.flex.score) + '</button></div></article>';
      }).join('');
  }

  function tablePane() {
    var ids = R.enabled;
    if (!ids.length) return '<div style="margin-top:14px">' + emptyEnabled() + '</div>';
    var rows = F.tableRows(R);
    var groups = [['Расходы', ['avg', 'first', 'total', 'year']], ['Деньги', ['moveIn', 'refundable', 'commission', 'sunk']], ['Пустые дни', ['idle', 'unused']], ['Оценка', ['flex', 'comfort', 'score']]];
    var byKey = {}; rows.forEach(function (r) { byKey[r.key] = r; });
    var html = '<div class="table-wrap" style="margin-top:14px"><table class="cmp"><thead><tr><th scope="col">Показатель</th>' +
      ids.map(function (id) { return '<th scope="col" class="' + (id === R.bestId ? 'best' : '') + '"><i class="dot" style="--c:' + optColor(id) + '"></i>' + h(oname(id)) + '</th>'; }).join('') + '</tr></thead><tbody>';
    groups.forEach(function (g) {
      html += '<tr class="sep"><td colspan="' + (ids.length + 1) + '">' + g[0] + '</td></tr>';
      g[1].forEach(function (k) {
        var r = byKey[k];
        var vals = ids.map(function (id) { return r.values[id]; });
        var bestV = r.kind === 'score' ? Math.max.apply(null, vals) : Math.min.apply(null, vals);
        var distinct = Math.max.apply(null, vals) - Math.min.apply(null, vals) > 0.5;
        html += '<tr><td>' + h(r.label) + (r.hint ? '<small>' + h(r.hint) + '</small>' : '') + '</td>' + ids.map(function (id) {
          var v = r.values[id];
          var txt = r.kind === 'money' ? money(v) : r.kind === 'days' ? num(v, 1) : num(v);
          var isBest = distinct && Math.abs(v - bestV) < 0.5 && ['refundable', 'opp'].indexOf(k) < 0;
          return '<td class="' + (id === R.bestId ? 'best ' : '') + (isBest ? 'best-cell' : '') + '">' + txt + '</td>';
        }).join('') + '</tr>';
      });
    });
    html += '</tbody></table></div>';
    html += '<div class="btn-row" style="margin-top:12px"><button type="button" class="btn" data-act="csv">' + I.download + 'Экспорт CSV</button><button type="button" class="btn" data-act="cmpTab" data-id="options">' + I.edit + 'Изменить варианты</button></div>';
    html += '<div class="info" style="margin-top:12px">' + I.info + '<div><b>Деньги при заселении</b> — разовый платёж, а не расход: возвратный залог вернётся при выезде. <b>Предоплата последнего месяца</b> меняет только график платежей и не учитывается дважды. Комиссия и удержанная часть залога — расход первого месяца.</div></div>';
    // альтернативная стоимость
    var opp = ids.map(function (id) { var r = R.options[id]; return '<tr><td><i class="dot" style="--c:' + optColor(id) + ';display:inline-block;margin-right:6px"></i>' + h(oname(id)) + '</td><td>' + money(r.opp.frozen) + '</td><td>' + money(r.opp.total) + '</td></tr>'; }).join('');
    html += '<section class="card section"><h2 class="card-title">Альтернативная стоимость</h2><p class="card-sub">Сколько принесли бы замороженные залог и предоплата на вкладе. Отдельный расчёт — в расходы не входит.</p>' +
      '<table class="opp-table"><thead><tr><th>Вариант</th><th>Заморожено</th><th>Упущено за ' + R.H + ' мес.</th></tr></thead><tbody>' + opp + '</tbody></table>' +
      frow('Ставка вклада', stepper('finance.rate', 0.5, 0, 100, 'pct', 'Ставка вклада'), 'годовых, простые проценты') + '</section>';
    return html;
  }

  function chartsPane() {
    var ids = R.enabled;
    if (!ids.length) return '<div style="margin-top:14px">' + emptyEnabled() + '</div>';
    var legend = '<div class="legend">' + ids.map(function (id) { return '<span><i style="--c:' + optColor(id) + '"></i>' + h(oname(id)) + '</span>'; }).join('') + '</div>';
    // точки во времени
    var times = (R.breakEven.time || []).filter(function (t) { return t.month <= 60; });
    var timeTxt = times.length ? times.map(function (t) {
      return '<li>«' + h(oname(t.cheaperLater)) + '» становится выгоднее «' + h(oname(t.vs)) + '» на <b>' + t.month + '-м месяце</b>' + (t.month > R.H ? ' — за пределами горизонта' : '') + '</li>';
    }).join('') : '<li>За 5 лет линии не пересекаются: порядок вариантов по накопленным расходам не меняется.</li>';
    // безубыточность по цене
    var nightly = ids.filter(function (id) { return R.options[id].type === 'nightly'; })[0];
    var beList = (R.breakEven.price || []).filter(function (p) { return p.nightlyId === nightly; });
    var beKpis = beList.map(function (p) {
      return kpi('vs ' + oname(p.longId), p.price > 0 ? 'до ' + money(Math.floor(p.price)) : 'не выгодно', optColor(p.longId));
    }).join('');
    var beFoot = beList.length ? (function () {
      var minBE = beList.slice().sort(function (a, b) { return a.price - b.price; })[0];
      return minBE.margin > 0
        ? 'Сейчас ' + money(minBE.current) + ' за ночь — запас ' + money(Math.floor(minBE.margin)) + ' до порога «' + oname(minBE.longId) + '». Выше порога постоянная аренда выгоднее.'
        : 'Сейчас ' + money(minBE.current) + ' за ночь — это выше порога «' + oname(minBE.longId) + '» (' + money(Math.floor(minBE.price)) + '): постоянная аренда выгоднее.';
    })() : '';
    // структура
    var home = R.cities && R.cities.home;
    var transport = home ? home.transport : 0;
    var used = {};
    ids.forEach(function (id) { COMP.forEach(function (c) { var v = c.key === 'transport' ? transport : R.options[id].structure[c.key]; if (v > 0.5) used[c.key] = 1; }); });
    var compLegend = '<div class="legend">' + COMP.filter(function (c) { return used[c.key]; }).map(function (c) { return '<span><i class="sq" style="--c:' + c.color + '"></i>' + c.label + '</span>'; }).join('') + '</div>';
    // эффект отсутствия
    var ab = R.absence, nid = nightly;
    var absFoot = nid ? oname(nid) + ': ' + money(ab.byOption[nid][0]) + ' → ' + money(ab.byOption[nid][2]) + ' в месяц при росте дежурства с 7 до 14 дней. Долгосрочная аренда стоит одинаково — вы платите и за пустые дни.' : 'Долгосрочная аренда стоит одинаково при любом графике — вы платите и за пустые дни.';

    return '<section class="card chart-card section"><div class="chart-head"><h2 class="card-title">Накопленные расходы</h2><p class="card-sub">Сколько всего уйдёт за ' + R.H + ' ' + F.monthsWord(R.H) + '. Без возвратного залога.</p></div>' +
      '<div data-chart="cum"></div>' + legend + '<ul class="chart-foot" style="padding-left:20px;margin:6px 0 0">' + timeTxt + '</ul></section>' +

      '<section class="card chart-card section"><div class="chart-head"><h2 class="card-title">Точка безубыточности</h2><p class="card-sub">Цена ночи, выше которой постоянная аренда выгоднее посуточной.</p></div>' +
      (nightly && beList.length ? '<div data-chart="be"></div><div class="legend"><span><i style="--c:' + optColor(nightly) + '"></i>' + h(oname(nightly)) + ' при разной цене</span>' + beList.map(function (p) { return '<span><i style="--c:' + optColor(p.longId) + '"></i>' + h(oname(p.longId)) + '</span>'; }).join('') + '</div>' +
        '<div class="kpis">' + beKpis + '</div><p class="chart-foot">' + h(beFoot) + '</p>'
        : '<p class="card-sub" style="padding:0 4px">Включите посуточный и хотя бы один помесячный вариант.</p>') + '</section>' +

      '<section class="card chart-card section"><div class="chart-head"><h2 class="card-title">Структура расходов</h2><p class="card-sub">Из чего складывается средний месяц.' + (transport > 0 ? ' Транспорт — из раздела «Города» (' + h(home.name) + ').' : '') + '</p></div>' +
      '<div data-chart="stack"></div>' + compLegend + '</section>' +

      '<section class="card chart-card section"><div class="chart-head"><h2 class="card-title">Эффект отсутствия</h2><p class="card-sub">Средний месяц при 7, 10 и 14 днях в Краматорске.</p></div>' +
      '<div data-chart="absence"></div>' + legend + '<p class="chart-foot">' + h(absFoot) + '</p></section>';
  }

  function citiesPane() {
    var C = R.cities;
    if (!C) return '';
    var html = '<div class="info" style="margin-top:14px">' + I.info + '<div>Расстояния, тарифы и цены жилья вводите сами — BASE их не придумывает. Жильё по умолчанию считается от лучшего варианта («' + h(R.best ? R.best.short : '—') + '») с поправкой на уровень цен города.</div></div>' +
      '<div class="btn-row" style="margin-top:10px"><button type="button" class="btn btn-sm" data-act="citiesParams">Параметры сравнения</button></div>';
    C.rows.forEach(function (c) {
      var diffTxt = c.isHome ? badge('вы живёте здесь', '') : (Math.abs(c.diff) < 0.5 ? '<span class="muted">как «' + h(C.home.name) + '»</span>' : c.diff < 0 ? '<span class="good"><b>дешевле на ' + money(-c.diff) + '</b> в месяц</span>' : '<span class="warn"><b>дороже на ' + money(c.diff) + '</b> в месяц</span>');
      var thr = '';
      if (!c.isHome && c.tripThreshold !== null && !c.warnings.length) {
        var t = Math.floor(c.tripThreshold + 1e-9);
        thr = t < 0 ? '<p class="chart-foot">Дороже даже без поездок.</p>' : '<p class="chart-foot">Выгоднее, пока поездок в ' + h(C.home.name) + ' <b>не больше ' + t + '</b> в месяц. Сейчас — ' + c.trips + '.</p>';
      }
      html += '<article class="card section"><div class="row-between"><h2 class="card-title">' + h(c.name) + '</h2><div>' + diffTxt + '</div></div>' +
        '<div class="city-total">' + money(c.tco) + '<span class="muted small" style="font-weight:500;letter-spacing:0"> /мес</span></div>' +
        '<div class="city-figs"><div><div class="fig-label">Жильё</div><div class="fig-value">' + money(c.housing) + '</div><div class="tiny muted">' + h(c.housingSource) + '</div></div>' +
        '<div><div class="fig-label">Транспорт</div><div class="fig-value">' + money(c.transport) + '</div><div class="tiny muted">' + c.trips + ' × ' + money(c.perTrip) + '</div></div>' +
        '<div><div class="fig-label">В дороге</div><div class="fig-value">' + num(c.hours, 1) + ' ч</div><div class="tiny muted">' + (C.includeTime ? money(c.timeCost) : 'в месяц') + '</div></div></div>' + thr +
        (c.warnings.length ? '<div class="notice">' + I.alert + '<div>' + h(c.warnings.join('. ')) + '</div></div>' : '') +
        '<div class="opt-actions"><button type="button" class="btn btn-sm" data-act="city" data-id="' + c.id + '">' + I.edit + 'Настроить</button></div></article>';
    });
    var custom = R.state.cities.list.filter(function (c) { return c.id === 'custom'; })[0];
    if (custom && !custom.enabled && R.state.cities.homeId !== 'custom') {
      html += '<button type="button" class="btn btn-block section" data-act="cityEnable">' + I.plus + 'Добавить свой город</button>';
    }
    if (C.rows.length > 1) {
      html += '<section class="card chart-card section"><div class="chart-head"><h2 class="card-title">Когда поездки съедают выгоду</h2><p class="card-sub">Полная стоимость в месяц (по вертикали) в зависимости от числа поездок в ' + h(C.home.name) + ' за месяц (по горизонтали).</p></div><div data-chart="trips"></div>' +
        '<div class="legend">' + C.rows.map(function (c, i) { return '<span><i class="line-key' + (i ? ' dash' : '') + '" style="--c:' + (i === 0 ? 'var(--ink)' : i === 1 ? 'var(--ink-2)' : 'var(--ink-3)') + '"></i>' + h(c.name) + '</span>'; }).join('') + '</div></section>';
    }
    return html;
  }

  var Compare = {
    html: function () {
      var pane = ui.compareTab === 'table' ? tablePane() : ui.compareTab === 'charts' ? chartsPane() : ui.compareTab === 'cities' ? citiesPane() : optionsPane();
      return compareHead() + pane;
    },
    after: function (el) {
      var ids = R.enabled;
      var cum = el.querySelector('[data-chart="cum"]');
      if (cum) {
        Ch.line(cum, {
          xLabels: R.monthsH.map(function (m) { return m.label; }),
          series: ids.map(function (id) { return { id: id, name: oname(id), color: optColor(id), values: R.options[id].cum.slice(0, R.H) }; }),
          yFmt: money, endLabels: true, height: 230, ariaLabel: 'Накопленные расходы по месяцам',
          tipTitle: function (i) { return R.months[i].labelLong + ' — всего с начала'; }
        });
      }
      var be = el.querySelector('[data-chart="be"]');
      if (be) {
        var nightly = ids.filter(function (id) { return R.options[id].type === 'nightly'; })[0];
        var list = R.breakEven.price.filter(function (p) { return p.nightlyId === nightly; });
        var cur = R.state.options[nightly].price;
        var prices = list.map(function (p) { return p.price; }).filter(function (p) { return p > 0; });
        var hi = Math.max(cur * 1.5, (prices.length ? Math.max.apply(null, prices) : cur) * 1.25, 400);
        var lo = Math.max(0, Math.floor(Math.min(cur, prices.length ? Math.min.apply(null, prices) : cur) * 0.5 / 50) * 50);
        hi = Math.ceil(hi / 50) * 50;
        var xs = []; for (var i = 0; i <= 30; i++) xs.push(lo + (hi - lo) * i / 30);
        var lin = list[0];
        var series = [{ id: nightly, name: oname(nightly), color: optColor(nightly), values: xs.map(function (p) { return (lin.a * p + lin.b) / R.H; }) }];
        list.forEach(function (p) { series.push({ id: p.longId, name: oname(p.longId), color: optColor(p.longId), values: xs.map(function () { return R.options[p.longId].avg; }) }); });
        Ch.line(be, {
          xValues: xs, series: series, yFmt: money, xFmt: function (v) { return num(v) + ' ₴'; }, height: 230,
          vline: { x: cur, label: 'сейчас ' + money(cur) },
          markers: list.filter(function (p) { return p.price >= lo && p.price <= hi; }).map(function (p) { return { x: p.price, y: R.options[p.longId].avg, label: money(Math.floor(p.price)), color: optColor(p.longId) }; }),
          tipTitle: function (i) { return 'Цена ночи ' + money(xs[i]); }, ariaLabel: 'Средний месяц в зависимости от цены ночи'
        });
      }
      var st = el.querySelector('[data-chart="stack"]');
      if (st) {
        var transport = R.cities && R.cities.home ? R.cities.home.transport : 0;
        Ch.stack(st, {
          fmt: money,
          rows: ids.map(function (id) {
            var s = R.options[id].structure;
            var parts = COMP.map(function (c) { return { label: c.label, color: c.color, value: c.key === 'transport' ? transport : s[c.key] }; });
            return { name: oname(id), total: parts.reduce(function (a, p) { return a + p.value; }, 0), parts: parts };
          })
        });
      }
      var ab = el.querySelector('[data-chart="absence"]');
      if (ab) {
        var lv = R.absence.levels;
        Ch.bars(ab, {
          groups: lv.map(function (d) { return d + ' ' + F.daysWord(d); }),
          series: ids.map(function (id) { return { name: oname(id), color: optColor(id), values: R.absence.byOption[id] }; }),
          yFmt: money, highlightGroup: lv.indexOf(R.state.schedule.dutyDays), height: 220,
          groupTitle: function (i) { return lv[i] + ' ' + F.daysWord(lv[i]) + ' в Краматорске · ' + num(R.absence.nights[i], 1) + ' ноч. дома'; }
        });
      }
      var tr = el.querySelector('[data-chart="trips"]');
      if (tr && R.cities) {
        var rows = R.cities.rows;
        var maxT = Math.max(12, Math.max.apply(null, rows.map(function (c) { return c.trips; })) * 2);
        var tx = []; for (var t = 0; t <= maxT; t++) tx.push(t);
        var cols = ['var(--ink)', 'var(--ink-2)', 'var(--ink-3)'];
        Ch.line(tr, {
          xValues: tx, height: 210, yFmt: money, xFmt: function (v) { return v + ''; },
          series: rows.map(function (c, i) {
            var fixed = c.housing + c.params.otherMonthly;
            return { name: c.name, color: cols[i] || cols[2], dashed: i > 0, values: tx.map(function (n) { return c.isHome ? c.tco : fixed + n * (c.perTrip + c.timePerTrip); }) };
          }),
          markers: rows.filter(function (c) { return !c.isHome && c.tripThreshold !== null && c.tripThreshold >= 0 && c.tripThreshold <= maxT; }).map(function (c) {
            return { x: c.tripThreshold, y: R.cities.home.tco, label: num(c.tripThreshold, 1), color: 'var(--ink)' };
          }),
          tipTitle: function (i) { return tx[i] + ' ' + plural(tx[i], 'поездка', 'поездки', 'поездок') + ' в месяц'; }
        });
      }
    }
  };
  function plural(n, a, b, c) { return F.plural(n, a, b, c); }

  /* ═════════════════════════ СЦЕНАРИИ ═════════════════════════ */
  function scValue(sc) { return ui.scFor === 'best' ? sc.delta : (sc.per[ui.scFor] ? sc.per[ui.scFor].delta : 0); }
  var Scenarios = {
    html: function () {
      if (!R.best) return '<header class="page-head"><h1 class="page-title">Что, если?</h1></header>' + emptyEnabled();
      if (ui.scFor !== 'best' && R.enabled.indexOf(ui.scFor) < 0) ui.scFor = 'best';
      var list = R.scenarios.list;
      var ranked = list.filter(function (s) { return !s.isCurrent; }).sort(function (a, b) { return Math.abs(scValue(b)) - Math.abs(scValue(a)); });
      var top = ranked[0] && Math.abs(scValue(ranked[0])) > 0.5 ? ranked[0] : null;
      var forName = ui.scFor === 'best' ? 'лучшего варианта' : '«' + oname(ui.scFor) + '»';
      var html = '<header class="page-head"><h1 class="page-title">Что, если?</h1><p class="page-sub">Одно касание — и видно, как изменится годовой бюджет.</p></header>';
      html += '<div class="chips" role="group" aria-label="Чей бюджет показывать"><button type="button" class="chip" data-act="scFor" data-id="best" aria-pressed="' + (ui.scFor === 'best') + '">Лучший вариант</button>' +
        R.enabled.map(function (id) { return '<button type="button" class="chip" data-act="scFor" data-id="' + id + '" aria-pressed="' + (ui.scFor === id) + '"><i class="dot" style="--c:' + optColor(id) + '"></i>' + h(oname(id)) + '</button>'; }).join('') + '</div>';
      html += '<section class="card section"><h2 class="card-title">Влияние на год</h2><p class="card-sub">' + (top ? 'Сильнее всего на бюджет ' + forName + ' влияет «' + h(top.title) + '»: ' + signedMoney(scValue(top)) + ' за 12 месяцев.' : 'Сценарии почти не меняют бюджет ' + forName + '.') + '</p>' +
        '<div data-chart="impact" style="margin-top:8px"></div><p class="group-note">Годовой бюджет — расходы за 12 месяцев при текущих вводных. Зелёный — дешевле, янтарный — дороже.</p></section>';
      html += '<div class="sc-grid section">' + list.map(function (s) {
        var v = scValue(s), cls = v < -0.5 ? 'down' : v > 0.5 ? 'up' : '';
        return '<button type="button" class="sc-card" data-act="scOpen" data-id="' + s.id + '" aria-pressed="' + (ui.scOpen === s.id) + '"><span class="sc-title">' + h(s.title) + '</span>' +
          '<span class="sc-delta ' + cls + '">' + (Math.abs(v) < 0.5 ? (s.isCurrent ? 'сейчас' : '0 ₴') : signedMoney(v)) + '</span>' +
          '<span class="sc-meta">' + (s.isCurrent ? 'ваш текущий график' : 'в год · лучший: ' + h(s.bestName) + (s.bestChanged ? ' (меняется)' : '')) + '</span></button>';
      }).join('') + '</div>';
      if (ui.scOpen) {
        var s = list.filter(function (x) { return x.id === ui.scOpen; })[0];
        if (s) {
          html += '<section class="card section" id="sc-detail"><div class="row-between"><h2 class="card-title">' + h(s.title) + '</h2><button type="button" class="btn-text" data-act="scOpen" data-id="' + s.id + '">Скрыть</button></div>' +
            '<table class="opp-table"><thead><tr><th>Вариант, за 12 мес.</th><th>Сейчас</th><th>Станет</th><th>Разница</th></tr></thead><tbody>' +
            R.enabled.map(function (id) {
              var p = s.per[id];
              return '<tr><td><i class="dot" style="--c:' + optColor(id) + ';display:inline-block;margin-right:6px"></i>' + h(oname(id)) + '</td><td>' + money(p.before) + '</td><td>' + money(p.after) + '</td><td class="' + (p.delta < -0.5 ? 'good' : p.delta > 0.5 ? 'warn' : 'muted') + '">' + signedMoney(p.delta) + '</td></tr>';
            }).join('') + '</tbody></table>' +
            '<p class="group-note">Лучший вариант при этом сценарии: <b>' + h(s.bestName) + '</b>' + (s.bestChanged ? ' — он меняется.' : '.') + '</p>' +
            (s.isCurrent ? '' : '<div class="btn-row" style="margin-top:12px"><button type="button" class="btn btn-primary" data-act="scApply" data-id="' + s.id + '">Применить к расчётам</button></div>') + '</section>';
        }
      }
      html += '<div class="btn-row section"><button type="button" class="btn" data-act="scParams">Параметры сценариев</button></div>';
      return html;
    },
    after: function (el) {
      var c = el.querySelector('[data-chart="impact"]');
      if (!c) return;
      var list = R.scenarios.list.slice().sort(function (a, b) { return scValue(a) - scValue(b); });
      var ranked = list.filter(function (s) { return !s.isCurrent; }).sort(function (a, b) { return Math.abs(scValue(b)) - Math.abs(scValue(a)); });
      var topId = ranked[0] && Math.abs(scValue(ranked[0])) > 0.5 ? ranked[0].id : null;
      Ch.impact(c, {
        fmt: function (v) { return Math.abs(v) < 0.5 ? '0 ₴' : signedMoney(v); },
        rows: list.map(function (s) { return { id: s.id, label: s.title, value: scValue(s), highlight: s.id === topId, current: s.isCurrent, selected: s.id === ui.scOpen }; })
      });
      c.querySelectorAll('[data-sc]').forEach(function (b) { b.addEventListener('click', function () { openScenario(b.getAttribute('data-sc')); }); });
    }
  };
  function openScenario(id) {
    ui.scOpen = ui.scOpen === id ? null : id;
    render();
    if (ui.scOpen) { var d = document.getElementById('sc-detail'); if (d) d.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'nearest' }); }
  }

  /* ═════════════════════════ МОИ ВАРИАНТЫ ═════════════════════════ */
  var AMEN = [['kitchen', 'Кухня'], ['washer', 'Стиралка'], ['parking', 'Парковка'], ['shelter', 'Укрытие'], ['internet', 'Интернет'], ['heating', 'Отопление']];
  var Listings = {
    html: function () {
      var L = R.state.listings;
      var html = '<header class="page-head row-between"><div><h1 class="page-title">Мои варианты</h1><p class="page-sub">Реальные объявления — и во что они обойдутся при вашем графике.</p></div></header>' +
        '<button type="button" class="btn btn-primary btn-block" data-act="listingNew">' + I.plus + 'Добавить вариант</button>';
      if (!L.length) {
        return html + '<div class="card empty section"><svg class="empty-art" viewBox="0 0 96 96" aria-hidden="true"><path d="M18 46 48 20l30 26"/><path d="M26 40v34h44V40"/><path d="M42 74V56h12v18"/><circle cx="72" cy="24" r="8"/><path d="M72 20v8M68 24h8"/></svg>' +
          '<h3>Пока пусто</h3><p>Сохраните квартиру с Booking, OLX или от знакомых: цены за ночь, неделю или месяц, удобства и заметки. BASE посчитает реальную стоимость и сравнит до пяти вариантов.</p></div>';
      }
      var cmp = R.state.compareIds;
      L.forEach(function (l) {
        var c = F.computeListing(state, l);
        var best = c.best;
        var checked = cmp.indexOf(l.id) >= 0;
        var disabled = !checked && cmp.length >= 5;
        html += '<article class="card listing section"><div class="listing-top"><div class="grow"><div class="listing-name">' + h(l.name) + '</div>' +
          '<div class="listing-place">' + h([l.city, l.address].filter(Boolean).join(' · ') || 'город не указан') + (l.floor ? ' · ' + l.floor + ' этаж' : '') + '</div></div>' +
          (l.comfortRating ? '<span class="stars" aria-label="Оценка ' + l.comfortRating + ' из 5">' + '★★★★★'.slice(0, l.comfortRating) + '<span class="muted">' + '★★★★★'.slice(l.comfortRating) + '</span></span>' : '') + '</div>' +
          '<div class="prices">' + (l.priceNight ? '<span>Ночь <b>' + money(l.priceNight) + '</b></span>' : '') + (l.priceWeek ? '<span>Неделя <b>' + money(l.priceWeek) + '</b></span>' : '') + (l.priceMonth ? '<span>Месяц <b>' + money(l.priceMonth) + '</b></span>' : '') + (l.fees ? '<span>Сборы <b>' + money(l.fees) + '</b></span>' : '') + '</div>' +
          '<div class="manual-note">' + I.hand + 'Цены введены вручную' + (l.enteredAt ? ' ' + ruDate(l.enteredAt) : '') + ' — не проверены автоматически</div>' +
          '<div class="amen">' + AMEN.map(function (a) { return l[a[0]] === 'unknown' ? '' : '<span class="' + l[a[0]] + '">' + a[1] + '</span>'; }).join('') + '</div>' +
          (best ? '<div class="listing-result"><div><div class="fig-label">При вашем графике, ' + best.label + '</div><div class="fig-value big">' + money(best.avg) + '<span class="muted small"> /мес</span></div></div><div style="text-align:right"><div class="fig-label">Комфорт</div><div class="fig-value">' + num(c.comfort.score) + '/100</div></div></div>'
            : '<p class="group-note">Укажите цену за ночь, неделю или месяц, чтобы посчитать стоимость.</p>') +
          (l.notes ? '<p class="small" style="color:var(--ink-2);margin:10px 0 0;white-space:pre-wrap">' + h(l.notes) + '</p>' : '') +
          '<div class="row-between wrap" style="margin-top:10px"><label class="check-cmp"><input type="checkbox" data-act="listingCmp" data-id="' + h(l.id) + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + '> Сравнить</label>' +
          '<div class="row">' + (l.url ? '<a class="btn btn-sm btn-ghost" href="' + h(l.url) + '" target="_blank" rel="noopener noreferrer">' + I.link + 'Ссылка</a>' : '') +
          '<button type="button" class="btn btn-sm" data-act="listingEdit" data-id="' + h(l.id) + '" aria-label="Изменить">' + I.edit + '</button>' +
          '<button type="button" class="btn btn-sm btn-ghost" data-act="listingDel" data-id="' + h(l.id) + '" aria-label="Удалить">' + I.trash + '</button></div></div>' +
          (best ? '<button type="button" class="btn btn-sm btn-block" style="margin-top:8px" data-act="listingUse" data-id="' + h(l.id) + '">Добавить в сравнение как «Мой вариант»</button>' : '') + '</article>';
      });
      html += Listings.compare();
      return html;
    },
    compare: function () {
      var ids = R.state.compareIds;
      if (!ids.length) return '<p class="group-note section" style="text-align:center">Отметьте «Сравнить» у двух–пяти вариантов.</p>';
      if (ids.length < 2) return '<p class="group-note section" style="text-align:center">Отметьте ещё хотя бы один вариант для сравнения.</p>';
      var items = ids.map(function (id) { var l = R.state.listings.filter(function (x) { return x.id === id; })[0]; return l ? F.computeListing(state, l) : null; }).filter(Boolean);
      var bestAvg = Math.min.apply(null, items.map(function (c) { return c.best ? c.best.avg : Infinity; }));
      var amenTxt = { yes: 'да', no: 'нет', unknown: '—' };
      function rowM(label, fn, kind) {
        return '<tr><td>' + h(label) + '</td>' + items.map(function (c) { var v = fn(c); return '<td>' + (v === null ? '—' : kind === 'money' ? money(v) : h(v)) + '</td>'; }).join('') + '</tr>';
      }
      return '<section class="section"><div class="section-head"><h2 class="section-title">Сравнение · ' + items.length + '</h2></div><div class="table-wrap"><table class="cmp"><thead><tr><th>Показатель</th>' +
        items.map(function (c) { return '<th class="' + (c.best && Math.abs(c.best.avg - bestAvg) < 0.5 ? 'best' : '') + '">' + h(c.listing.name.slice(0, 22)) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        rowM('Выгоднее всего', function (c) { return c.best ? c.best.label : null; }) +
        rowM('Средний месяц', function (c) { return c.best ? c.best.avg : null; }, 'money') +
        rowM('За ' + R.H + ' мес.', function (c) { return c.best ? c.best.total : null; }, 'money') +
        rowM('При заселении', function (c) { return c.best ? c.best.moveIn : null; }, 'money') +
        rowM('Переплата за пустые дни', function (c) { return c.best ? c.best.idleTotal : null; }, 'money') +
        rowM('Комфорт и безопасность', function (c) { return num(c.comfort.score) + '/100'; }) +
        rowM('Гибкость', function (c) { return c.flex ? num(c.flex.score) + '/100' : null; }) +
        AMEN.map(function (a) { return rowM(a[1], function (c) { return amenTxt[c.listing[a[0]]]; }); }).join('') +
        rowM('Этаж', function (c) { return c.listing.floor ? String(c.listing.floor) : null; }) +
        rowM('Условия отмены', function (c) { return c.listing.cancellation || null; }) +
        rowM('Ваша оценка', function (c) { return c.listing.comfortRating ? c.listing.comfortRating + ' из 5' : null; }) +
        '</tbody></table></div><p class="group-note">Цены введены вручную и не обновляются автоматически.</p></section>';
    }
  };

  /* ═════════════════════════ НАСТРОЙКИ ═════════════════════════ */
  function monthOptions() {
    var out = [], d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1);
    for (var i = 0; i < 26; i++) {
      var v = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2);
      out.push([v, F.MONTHS_FULL[d.getMonth()] + ' ' + d.getFullYear()]);
      d.setMonth(d.getMonth() + 1);
    }
    var cur = R.state.schedule.startMonth;
    if (!out.some(function (o) { return o[0] === cur; })) out.unshift([cur, cur]);
    return out;
  }
  function startMonthSelect() {
    return '<span class="field-input"><select data-bind="schedule.startMonth" data-kind="str" aria-label="Первый месяц">' + monthOptions().map(function (o) {
      return '<option value="' + o[0] + '"' + (o[0] === R.state.schedule.startMonth ? ' selected' : '') + '>' + o[1] + '</option>';
    }).join('') + '</select></span>';
  }
  var Settings = {
    html: function () {
      var S = R.state;
      var standalone = window.matchMedia && (matchMedia('(display-mode: standalone)').matches || navigator.standalone);
      return '<header class="page-head"><h1 class="page-title">Настройки</h1></header>' +
        '<h2 class="group-title">Внешний вид</h2><div class="group">' +
        '<div class="control-row"><span class="control-label">Тема</span></div><div class="control-sub">' + seg('ui.theme', [['auto', 'Как в системе'], ['light', 'Светлая'], ['dark', 'Тёмная']]) + '</div>' +
        frow('Анимации', switchHtml('ui.animations', 'Анимации'), 'при «Уменьшить движение» в системе выключены всегда') + '</div>' +

        '<h2 class="group-title">Расчёт</h2><div class="group">' +
        '<div class="control-row"><span class="control-label">Месяц</span></div><div class="control-sub">' + seg('schedule.monthMode', [['conventional', 'Условный, 30 дней'], ['calendar', 'Календарный']]) + '</div>' +
        (S.schedule.monthMode === 'calendar' ? frow('Первый месяц', startMonthSelect()) : '') +
        frow('Проживающих', stepper('schedule.persons', 1, 1, 10, 'people', 'Проживающих'), 'для сборов и билетов') +
        frow('Ставка вклада', stepper('finance.rate', 0.5, 0, 100, 'pct', 'Ставка вклада'), 'альтернативная стоимость и резерв') +
        frow('Цель резерва', stepper('finance.reserveGoalMonths', 1, 0, 36, 'months', 'Цель резерва'), 'месяцев жилья') +
        '<div class="control-row"><button type="button" class="link-btn" data-act="schedule">График дежурств, заезды и дни по месяцам</button></div></div>' +

        '<h2 class="group-title">Данные</h2><div class="group" style="padding:14px">' +
        '<p class="card-sub" style="margin-bottom:12px">Всё хранится только на этом устройстве (localStorage). Сохраните копию, чтобы перенести данные на другой телефон.</p>' +
        '<div class="btn-row"><button type="button" class="btn" data-act="exportJson">' + I.download + 'Экспорт JSON</button><button type="button" class="btn" data-act="importOpen">' + I.upload + 'Импорт</button></div>' +
        '<div class="btn-row" style="margin-top:10px"><button type="button" class="btn" data-act="csv">' + I.download + 'Таблица в CSV</button><button type="button" class="btn" data-act="copyJson">' + I.copy + 'Скопировать</button></div>' +
        '<div class="btn-row" style="margin-top:10px"><button type="button" class="btn btn-ghost" data-act="reset">Вернуть стартовые значения</button></div></div>' +

        '<h2 class="group-title">Приложение</h2><div class="group" style="padding:14px">' +
        (standalone ? '<p class="card-sub">BASE установлен на главный экран и работает офлайн.</p>' :
          (installEvent ? '<button type="button" class="btn btn-primary btn-block" data-act="install">Установить приложение</button>' : '<button type="button" class="btn btn-block" data-act="installHelp">Как добавить на главный экран</button>')) +
        '<div class="btn-row" style="margin-top:10px"><a class="btn" href="./tests.html">Проверка формул</a></div>' +
        '<p class="group-note">BASE ' + F.VERSION + '.0 · ' + (navigator.onLine ? 'онлайн' : 'офлайн') + ' · без регистрации, без серверов, без платных API.</p></div>' +

        '<h2 class="group-title">О расчётах</h2><div class="group" style="padding:14px"><p class="card-sub" style="line-height:1.5">' +
        'Стартовые суммы — иллюстрация, а не рыночные предложения. Расход — деньги, которые не вернутся. Возвратный залог и предоплата показаны отдельно как замороженные деньги. ' +
        'Комиссия — расход первого месяца. Скидки применяются по очереди от уже сниженной цены, из скидок за длительность — одна ступень. Это не финансовая консультация: решение остаётся за вами.</p></div>';
    }
  };

  var VIEWS = { home: Home, compare: Compare, scenarios: Scenarios, listings: Listings, settings: Settings };

  /* ═════════════════════════ ЛИСТЫ ═════════════════════════ */
  var sheet = null, lastFocus = null;
  var $root = document.getElementById('sheet-root'), $body = document.getElementById('sheet-body'), $title = document.getElementById('sheet-title');
  function openSheet(def) {
    var wasOpen = !!sheet;
    sheet = def;
    if (!wasOpen) lastFocus = document.activeElement;
    $title.textContent = def.title;
    $body.innerHTML = def.render();
    $body.scrollTop = 0;
    if (def.after) def.after($body);
    $root.hidden = false;
    refreshSheet();
    document.body.classList.add('sheet-open');
    requestAnimationFrame(function () { requestAnimationFrame(function () { $root.classList.add('open'); }); });
    setTimeout(function () {
      var f = $body.querySelector('[data-autofocus]') || $root.querySelector('.sheet-done');
      if (f) try { f.focus({ preventScroll: !$body.querySelector('[data-autofocus]') }); } catch (e) {}
    }, 60);
  }
  function rebuildSheet() {
    if (!sheet) return;
    var st = $body.scrollTop;
    $title.textContent = sheet.title;
    $body.innerHTML = sheet.render();
    if (sheet.after) sheet.after($body);
    refreshSheet();
    $body.scrollTop = st;
  }
  function closeSheet() {
    if (!sheet) return;
    var s = sheet;
    sheet = null;
    $root.classList.remove('open');
    document.body.classList.remove('sheet-open');
    setTimeout(function () { if (!sheet) { $root.hidden = true; $body.innerHTML = ''; } }, 340);
    if (s.onClose) s.onClose();
    if (lastFocus && lastFocus.isConnected) try { lastFocus.focus({ preventScroll: true }); } catch (e) {}
  }
  function refreshSheet() {
    if (!sheet) return;
    if (sheet.refresh) sheet.refresh($body);
    syncControls($body);
  }
  function syncControls(root) {
    root.querySelectorAll('[data-show]').forEach(function (el) { el.innerHTML = fmtVal(getPath(R.state, el.getAttribute('data-show')), el.getAttribute('data-fmt')); });
    root.querySelectorAll('[data-set]').forEach(function (el) {
      if (el.closest('[data-chart]')) return;
      el.setAttribute('aria-pressed', String(String(getPath(state, el.getAttribute('data-set'))) === el.getAttribute('data-value')));
    });
    root.querySelectorAll('[data-if]').forEach(function (el) { el.hidden = !getPath(state, el.getAttribute('data-if')); });
    root.querySelectorAll('[data-if-eq]').forEach(function (el) {
      var p = el.getAttribute('data-if-eq').split('=');
      el.hidden = String(getPath(state, p[0])) !== p[1];
    });
    root.querySelectorAll('input[data-bind], select[data-bind]').forEach(function (el) {
      if (el === document.activeElement) return;
      var v = getPath(state, el.getAttribute('data-bind'));
      var kind = el.getAttribute('data-kind');
      if (kind === 'bool') el.checked = !!v;
      else if (kind === 'num') { var s = rawStr(v); if (el.value !== s) el.value = s; }
      else if (el.value !== String(v == null ? '' : v)) el.value = v == null ? '' : v;
    });
    // сообщения о некорректном вводе
    root.querySelectorAll('.field[data-path]').forEach(function (f) {
      var p = f.getAttribute('data-path');
      var w = R.warnings.filter(function (x) { return x.path === p && x.code !== 'capped'; })[0];
      f.classList.toggle('invalid', !!w);
      var m = f.querySelector('.field-msg');
      if (m) m.textContent = w ? w.message.replace(/^[^:]+:\s*/, '') : '';
    });
  }
  // свайп вниз по шапке листа закрывает его
  (function () {
    var head = $root.querySelector('.sheet-head'), panel = $root.querySelector('.sheet'), y0 = null, dy = 0;
    head.addEventListener('pointerdown', function (e) { if (e.target.closest('button')) return; y0 = e.clientY; dy = 0; panel.style.transition = 'none'; head.setPointerCapture(e.pointerId); });
    head.addEventListener('pointermove', function (e) { if (y0 === null) return; dy = Math.max(0, e.clientY - y0); panel.style.transform = 'translateY(' + dy + 'px)'; });
    function end() { if (y0 === null) return; y0 = null; panel.style.transition = ''; panel.style.transform = ''; if (dy > 90) closeSheet(); }
    head.addEventListener('pointerup', end);
    head.addEventListener('pointercancel', end);
  })();

  /* ── лист: настройка варианта ── */
  function sumBox(id) {
    return '<div class="sheet-summary" data-out="sum"></div>';
  }
  function sumRefresh(body, id) {
    var box = body.querySelector('[data-out="sum"]');
    if (!box) return;
    var r = R.options[id];
    box.innerHTML = '<div class="kpis">' + kpi('Средний месяц', money(r.avg), optColor(id)) + kpi('Первый месяц', money(r.first)) + kpi('При заселении', money(r.moveIn)) + '</div>';
  }
  function comfortGroup(base) {
    var c = getPath(state, base + '.comfort') || {};
    return '<h3 class="group-title" id="sec-comfort">Комфорт и безопасность</h3><div class="group">' + F.COMFORT_CRITERIA.map(function (k) {
      return '<div class="field"><span class="field-label">' + h(k.label) + '<small>вес ' + k.weight + ' из 100</small></span><span class="tri" role="group" aria-label="' + h(k.label) + '">' +
        TRI.map(function (t) { return '<button type="button" data-set="' + base + '.comfort.' + k.key + '" data-type="str" data-value="' + t[0] + '" aria-pressed="' + (c[k.key] === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</span></div>';
    }).join('') + '<div class="field"><span class="field-label"><b>Итого</b><small>«да» — полный вес, «?» — половина, «нет» — 0</small></span><b data-out="comfortScore"></b></div></div>';
  }
  function optionSheet(id, section) {
    var base = 'options.' + id;
    return {
      title: R.state.options[id].name,
      render: function () {
        var o = state.options[id];
        var t = R.state.options[id].type;
        var html = sumBox(id);
        html += '<div class="group">' + (id === 'custom' ? ftext(base + '.name', 'Название', 'Например, квартира у вокзала') : '') +
          ftoggle(base + '.enabled', 'Участвует в сравнении') + '</div>';
        if (id === 'custom') {
          html += '<h3 class="group-title">Тип оплаты</h3>' + '<div class="seg">' + [['nightly', 'За ночь'], ['weekly', 'За неделю'], ['monthly', 'За месяц']].map(function (x) {
            return '<button type="button" data-act="customType" data-value="' + x[0] + '" aria-pressed="' + (t === x[0]) + '">' + x[1] + '</button>';
          }).join('') + '</div>';
        }
        if (t === 'nightly') {
          html += '<h3 class="group-title">Цена</h3><div class="group">' + fnum(base + '.price', 'Цена за ночь', '₴', 'за всю квартиру') + '</div>';
          html += '<h3 class="group-title">Скидки</h3><div class="group">' +
            fnum(base + '.geniusPct', 'Booking Genius', '%', 'скидка программы лояльности', switchHtml(base + '.geniusOn', 'Genius')) +
            fnum(base + '.los7Pct', 'За 7+ ночей', '%', 'недельная', switchHtml(base + '.los7On', '7+ ночей')) +
            fnum(base + '.los14Pct', 'За 14+ ночей', '%', '', switchHtml(base + '.los14On', '14+ ночей')) +
            fnum(base + '.los28Pct', 'За 28–30 ночей', '%', 'месячная', switchHtml(base + '.los28On', '28+ ночей')) + '</div>' +
            '<h3 class="group-title">Как сочетать скидки</h3>' + seg(base + '.stackMode', [['sequential', 'Genius + длительность'], ['max', 'Только наибольшая']]) +
            '<div class="group" style="margin-top:8px;padding:12px 14px"><div class="small muted">Порядок применения для брони в <span data-out="stayN"></span>:</div><ul class="discount-steps" data-out="steps"></ul></div>' +
            '<p class="group-note">Скидки не складываются: 10% и 15% — это −23,5%, потому что вторая считается от уже сниженной цены. Из скидок за длительность действует одна — самая выгодная для длины брони.</p>';
        }
        if (t === 'weekly') {
          html += '<h3 class="group-title">Цена</h3><div class="group">' + fnum(base + '.pricePerWeek', 'Цена за неделю', '₴', '7 ночей') +
            fnum(base + '.remainderNightPrice', 'Цена ночи для остатка', '₴', 'если бронь не кратна неделе') + '</div>' +
            '<h3 class="group-title">Остаток ночей</h3>' + seg(base + '.remainderMode', [['nightly', 'По цене ночи, если дешевле'], ['week', 'Целой неделей']]);
        }
        if (t === 'nightly' || t === 'weekly') {
          html += '<h3 class="group-title">Сборы и заезды</h3><div class="group">' +
            fnum(base + '.cleaningFee', 'Уборка', '₴', 'за каждый заезд') +
            fnum(base + '.feePerStay', 'Прочие обязательные сборы', '₴', 'за заезд') +
            fnum(base + '.taxPerPersonNight', 'Туристический сбор', '₴', 'за человека в ночь · проживающих: ' + R.state.schedule.persons) +
            fnum(base + '.recheckinCost', 'Повторное заселение', '₴', 'такси, перевозка вещей — за заезд') +
            fnum(base + '.storageMonthly', 'Хранение вещей между поездками', '₴/мес', '0 — если можно оставить у хозяина или в машине') +
            fnum(base + '.deposit', 'Возвратный залог', '₴', 'на время проживания') +
            fnum(base + '.noticeDays', 'Срок обязательств', 'дн.', 'бесплатная отмена / предоплата') + '</div>' +
            '<p class="group-note">Заездов в месяц: ' + R.state.schedule.staysPerMonth + ' — меняется в «Подробном графике».</p>';
        }
        if (t === 'monthly') {
          html += '<h3 class="group-title">Ежемесячно</h3><div class="group">' + fnum(base + '.rent', 'Арендная плата', '₴/мес') + fnum(base + '.utilities', 'Коммунальные', '₴/мес', 'в среднем, отопление зимой дороже') + '</div>' +
            '<h3 class="group-title">При заселении</h3><div class="group">' +
            fnum(base + '.commissionPct', 'Комиссия риелтора', '%', 'от месячной аренды') +
            '<div class="field-extra" style="padding:0 0 10px">' + chipsSet(base + '.commissionPct', [[0, '0%'], [50, '50%'], [100, '100%']], 'num') + '</div>' +
            fnum(base + '.commissionFixed', 'Комиссия суммой', '₴', 'если риелтор называет фиксированную сумму') +
            fnum(base + '.setupFees', 'Оформление договора', '₴', 'невозвратные расходы') +
            fnum(base + '.deposit', 'Залог', '₴') +
            fnum(base + '.depositRefundPct', 'Вернётся из залога', '%', '100% — вернут полностью') +
            ftoggle(base + '.prepayLastMonth', 'Предоплата последнего месяца', 'меняет платежи, но не расходы') +
            fnum(base + '.noticeDays', 'Срок предупреждения', 'дн.', 'за сколько дней нужно сообщить о выезде') + '</div>';
        }
        html += comfortGroup(base);
        return html;
      },
      after: function (body) {
        if (section) { var s = body.querySelector('#sec-' + section); if (s) setTimeout(function () { s.scrollIntoView({ block: 'start' }); }, 30); }
      },
      refresh: function (body) {
        sumRefresh(body, id);
        var cs = body.querySelector('[data-out="comfortScore"]');
        if (cs) cs.textContent = num(R.options[id].comfort.score) + ' / 100';
        var stepsEl = body.querySelector('[data-out="steps"]');
        if (stepsEl) {
          var o = R.state.options[id], r = R.options[id];
          var n = r.firstStay ? r.firstStay.stay.nights : Math.max(1, Math.round(R.schedule.avgNights / R.state.schedule.staysPerMonth));
          var d = F.discountSteps(o, n);
          body.querySelector('[data-out="stayN"]').textContent = n + ' ' + F.nightsWord(n);
          stepsEl.innerHTML = d.steps.map(function (s, i) {
            return '<li><span>' + (i ? i + '. ' : '') + h(s.label) + (s.pct ? ' −' + num(s.pct, 1) + '%' : '') + '</span><span>' + money(s.price) + '</span></li>';
          }).join('') + (d.skipped.length ? '<li><span class="muted">Не применяется: ' + h(d.skipped.map(function (s) { return s.label; }).join(', ')) + '</span><span></span></li>' : '') +
            '<li><span><b>Итоговая скидка</b></span><span><b>−' + num(d.effectivePct, 1) + '%</b></span></li>';
        }
      }
    };
  }

  /* ── лист: график проживания ── */
  function scheduleSheet(focus) {
    return {
      title: 'График проживания',
      render: function () {
        return '<div class="sheet-summary" data-out="schedSum"></div>' +
          '<h3 class="group-title">Месяц</h3>' + seg('schedule.monthMode', [['conventional', 'Условный, 30 дней'], ['calendar', 'Календарный']]) +
          '<div data-if-eq="schedule.monthMode=calendar"><div class="group" style="margin-top:8px"><div class="field"><span class="field-label">Первый месяц<small>февраль — 28–29 дней, есть месяцы по 31</small></span>' + startMonthSelect() + '</div></div></div>' +
          '<h3 class="group-title">Каждый месяц</h3><div class="group">' +
          frow('Дней в Краматорске', stepper('schedule.dutyDays', 1, 0, 62, 'days', 'Дней в Краматорске'), 'по умолчанию для всех месяцев') +
          frow('Других дней вне дома', stepper('schedule.otherAwayDays', 1, 0, 31, 'days', 'Других дней вне дома'), 'отпуск, командировки') +
          frow('Заездов в месяц', stepper('schedule.staysPerMonth', 1, 1, 10, 'num', 'Заездов в месяц'), 'для посуточной и понедельной аренды') +
          frow('Проживающих', stepper('schedule.persons', 1, 1, 10, 'people', 'Проживающих')) + '</div>' +
          '<h3 class="group-title" id="sec-horizon">Горизонт планирования</h3><div class="group">' + fnum('schedule.horizon', 'Месяцев', 'мес.', 'от 1 до 60') +
          '<div class="field-extra" style="padding:0 0 10px">' + chipsSet('schedule.horizon', [[1, '1'], [3, '3'], [6, '6'], [12, '12'], [24, '24']], 'num') + '</div></div>' +
          '<h3 class="group-title">Дни дежурства по месяцам</h3><p class="group-note" style="margin-top:0;margin-bottom:8px">Если дежурства неодинаковые — задайте дни для конкретных месяцев.</p>' +
          '<div class="group" data-out="months"></div>';
      },
      after: function (body) {
        if (focus === 'horizon') {
          var s = body.querySelector('#sec-horizon');
          setTimeout(function () { s.scrollIntoView({ block: 'start' }); var inp = body.querySelector('[data-bind="schedule.horizon"]'); if (inp) inp.focus(); }, 60);
        }
      },
      refresh: function (body) {
        var sum = body.querySelector('[data-out="schedSum"]');
        if (sum) sum.innerHTML = '<div class="kpis">' + kpi('Ночей дома', num(R.schedule.avgNights, 1)) + kpi('Вне дома', num(R.schedule.avgAway, 1) + ' дн.') + kpi('Горизонт', R.H + ' мес.') + '</div>';
        var box = body.querySelector('[data-out="months"]');
        if (!box) return;
        var active = document.activeElement, fk = active && box.contains(active) ? fkOf(active) : null;
        var hasOv = Object.keys(R.state.schedule.dutyOverrides).length > 0;
        box.innerHTML = R.monthsH.map(function (m) {
          return '<div class="control-row"><span class="control-label">' + h(m.labelLong) + '<span class="control-hint">' + m.nights + ' ' + F.nightsWord(m.nights) + ' дома из ' + m.days + (m.capped ? ' · дежурство длиннее месяца' : '') + '</span></span>' +
            '<span class="row">' + (m.overridden ? '<button type="button" class="btn-text small" data-act="ovrReset" data-i="' + m.i + '" aria-label="Сбросить">↺</button>' : '') +
            '<span class="stepper"><button type="button" data-act="ovr" data-i="' + m.i + '" data-delta="-1" aria-label="' + h(m.labelLong) + ': меньше дней">' + I.minus + '</button><output>' + m.dutyRaw + '<small> дн.</small></output>' +
            '<button type="button" data-act="ovr" data-i="' + m.i + '" data-delta="1" aria-label="' + h(m.labelLong) + ': больше дней">' + I.plus + '</button></span></span></div>';
        }).join('') + (hasOv ? '<div class="control-row"><button type="button" class="btn btn-sm btn-block" data-act="ovrClear">Одинаково во всех месяцах</button></div>' : '');
        if (fk) { var f = box.querySelector(fk); if (f) f.focus({ preventScroll: true }); }
      }
    };
  }

  /* ── лист: гибкость ── */
  function flexSheet(id) {
    return {
      title: 'Финансовая гибкость',
      render: function () {
        var r = R.options[id];
        return '<div class="row" style="margin:6px 0 4px"><i class="dot lg" style="--c:' + optColor(id) + '"></i><b>' + h(r.name) + '</b></div>' +
          '<div class="reserve-big num">' + num(r.flex.score) + '<span class="muted" style="font-size:20px">/100</span></div>' +
          '<p class="card-sub" style="margin:8px 0 14px">Насколько легко изменить решение без потерь: четыре фактора, у каждого вес 25%. Никаких скрытых баллов.</p>' +
          '<div class="group" style="padding:2px 14px">' + r.flex.factors.map(function (f) {
            return '<div class="factor"><div class="factor-top"><span>' + h(f.label) + '</span><span class="num">' + num(f.value) + '</span></div>' +
              '<div class="small" style="color:var(--ink-2);margin-top:2px">' + h(f.detail) + '</div>' + meter(f.value) + '<div class="factor-rule">' + h(f.rule) + ' · вес ' + f.weight + '%</div></div>';
          }).join('') + '</div>' +
          '<p class="group-note">Сравнение гибкости всех вариантов: ' + R.enabled.map(function (x) { return h(oname(x)) + ' — ' + num(R.options[x].flex.score); }).join(', ') + '.</p>' +
          '<div class="btn-row" style="margin-top:12px"><button type="button" class="btn" data-act="editOption" data-id="' + id + '">Настроить вариант</button></div>';
      }
    };
  }

  /* ── лист: как считается оценка ── */
  function scoringSheet() {
    return {
      title: 'Как считается оценка',
      render: function () {
        var P = F.PRIORITIES;
        return '<p class="card-sub" style="margin:4px 0 14px">Итоговая оценка = стоимость × вес + гибкость × вес + комфорт × вес. Веса зависят от приоритета:</p>' +
          '<div class="table-wrap"><table class="cmp"><thead><tr><th>Приоритет</th><th>Стоимость</th><th>Гибкость</th><th>Комфорт</th></tr></thead><tbody>' +
          F.PRIORITY_IDS.map(function (p) { return '<tr class="' + (p === R.state.priority ? 'best' : '') + '"><td>' + h(P[p].label) + '</td><td>' + P[p].weights.cost + '%</td><td>' + P[p].weights.flex + '%</td><td>' + P[p].weights.comfort + '%</td></tr>'; }).join('') + '</tbody></table></div>' +
          '<h3 class="group-title">Стоимость</h3><p class="card-sub">100 × (самый дешёвый средний месяц ÷ средний месяц варианта). Самый дешёвый получает 100.</p>' +
          '<h3 class="group-title">Финансовая гибкость</h3><div class="group" style="padding:10px 14px">' + F.FLEX_FACTORS.map(function (f) { return '<div class="small" style="padding:6px 0"><b>' + h(f.label) + '</b> · 25%<br><span class="muted">' + h(f.rule) + '</span></div>'; }).join('') + '</div>' +
          '<h3 class="group-title">Комфорт и безопасность</h3><div class="group" style="padding:10px 14px">' + F.COMFORT_CRITERIA.map(function (c) { return '<div class="row-between small" style="padding:5px 0"><span>' + h(c.label) + '</span><b>' + c.weight + '</b></div>'; }).join('') +
          '<p class="tiny muted" style="margin:6px 0 4px">«Да» — полный вес, «неизвестно» — половина, «нет» — 0. Отмечается в настройках каждого варианта.</p></div>' +
          '<h3 class="group-title">Сейчас</h3><div class="table-wrap"><table class="cmp"><thead><tr><th>Вариант</th><th>Стоим.</th><th>Гибк.</th><th>Комф.</th><th>Итог</th></tr></thead><tbody>' +
          R.ranking.map(function (id) { var s = R.options[id].score; return '<tr><td><i class="dot" style="--c:' + optColor(id) + ';display:inline-block;margin-right:6px"></i>' + h(oname(id)) + '</td><td>' + num(s.cost) + '</td><td>' + num(s.flex) + '</td><td>' + num(s.comfort) + '</td><td><b>' + num(s.total) + '</b></td></tr>'; }).join('') + '</tbody></table></div>';
      }
    };
  }

  /* ── лист: город ── */
  function cityIndex(id) { var l = state.cities.list; for (var i = 0; i < l.length; i++) if (l[i].id === id) return i; return -1; }
  function citySheet(id) {
    var i = cityIndex(id), base = 'cities.list.' + i;
    return {
      title: R.state.cities.list[i].name,
      render: function () {
        return '<div class="sheet-summary" data-out="citySum"></div>' +
          '<div class="group">' + (id === 'custom' ? ftext(base + '.name', 'Название города', 'Например, Павлоград') : '') + (id !== R.state.cities.homeId ? ftoggle(base + '.enabled', 'Участвует в сравнении') : '') + '</div>' +
          '<h3 class="group-title">Жильё</h3>' + seg(base + '.housingMode', [['auto', 'От лучшего варианта, %'], ['manual', 'Своя сумма']]) +
          '<div class="group" style="margin-top:8px"><div data-if-eq="' + base + '.housingMode=auto">' + fnum(base + '.factorPct', 'Уровень цен', '%', '100% — как в расчёте, 80% — на пятую часть дешевле') + '</div>' +
          '<div data-if-eq="' + base + '.housingMode=manual">' + fnum(base + '.manualMonthly', 'Жильё в месяц', '₴', 'всё включено') + '</div></div>' +
          '<h3 class="group-title">Поездки в Днепр</h3><div class="group">' + fnum(base + '.trips', 'Поездок в месяц', '', 'туда и обратно') + '</div>' +
          '<div style="margin-top:8px">' + seg(base + '.mode', [['car', 'Автомобиль'], ['transit', 'Общественный транспорт']]) + '</div>' +
          '<div class="group" style="margin-top:8px"><div data-if-eq="' + base + '.mode=car">' +
          fnum(base + '.distanceKm', 'Расстояние в одну сторону', 'км', 'введите сами — по карте или одометру') +
          fnum(base + '.consumption', 'Расход топлива', 'л/100 км') + fnum(base + '.fuelPrice', 'Цена топлива', '₴/л') + '</div>' +
          '<div data-if-eq="' + base + '.mode=transit">' + fnum(base + '.fare', 'Билет в одну сторону', '₴', 'на человека · проживающих: ' + R.state.schedule.persons) + '</div>' +
          fnum(base + '.parking', 'Платная парковка', '₴', 'за поездку') +
          fnum(base + '.minutes', 'Время в пути', 'мин', 'в одну сторону') +
          fnum(base + '.otherMonthly', 'Прочий транспорт', '₴/мес', 'например, дорога на службу') + '</div>';
      },
      refresh: function (body) {
        var c = R.cities.rows.filter(function (x) { return x.id === id; })[0];
        var box = body.querySelector('[data-out="citySum"]');
        if (box) box.innerHTML = c ? '<div class="kpis">' + kpi('Жильё', money(c.housing)) + kpi('Транспорт', money(c.transport)) + kpi('Итого', money(c.tco)) + '</div>' : '<p class="small muted">Город выключен из сравнения.</p>';
      }
    };
  }
  function citiesParamsSheet() {
    return {
      title: 'Сравнение городов',
      render: function () {
        return '<h3 class="group-title">Где вы живёте сейчас</h3>' + seg('cities.homeId', state.cities.list.map(function (c) { return [c.id, c.name]; })) +
          '<h3 class="group-title">Время в дороге</h3><div class="group">' + ftoggle('cities.includeTime', 'Учитывать время как деньги', 'часы в пути × цена часа') +
          '<div data-if="cities.includeTime">' + fnum('cities.valuePerHour', 'Цена часа', '₴/ч', 'сколько для вас стоит час') + '</div></div>' +
          '<p class="group-note">Все расстояния и тарифы — ваши данные. BASE не подставляет их автоматически.</p>';
      }
    };
  }

  /* ── лист: параметры сценариев ── */
  function scParamsSheet() {
    return {
      title: 'Параметры сценариев',
      render: function () {
        return '<div class="group">' + fnum('scenarioParams.rentUpPct', 'Рост аренды', '%', 'помесячные варианты') + fnum('scenarioParams.dailyDownPct', 'Снижение посуточной цены', '%') +
          fnum('scenarioParams.weeklyDiscountPct', 'Недельная скидка', '%', 'на брони от 7 ночей') + fnum('scenarioParams.utilitiesUpPct', 'Рост коммунальных', '%') + '</div>' +
          '<p class="group-note">Сценарии не меняют ваши данные, пока вы не нажмёте «Применить к расчётам».</p>';
      }
    };
  }

  /* ── лист: объект недвижимости ── */
  var draft = null;
  function listingSheet(id) {
    var existing = id ? R.state.listings.filter(function (l) { return l.id === id; })[0] : null;
    draft = existing ? JSON.parse(JSON.stringify(existing)) : {
      id: 'l' + Date.now().toString(36), name: '', city: 'Днепр', address: '', url: '', priceNight: '', priceWeek: '', priceMonth: '', fees: '',
      utilities: '', commissionPct: '', deposit: '', kitchen: 'unknown', washer: 'unknown', parking: 'unknown', shelter: 'unknown', internet: 'unknown', heating: 'unknown',
      floor: '', cancellation: '', comfortRating: 0, notes: '', enteredAt: today()
    };
    function lf(key, label, unit, hint, kind) {
      var v = draft[key];
      return '<div class="field' + (kind === 'text' ? ' wide' : '') + '"><label class="field-label" for="lf_' + key + '">' + h(label) + (hint ? '<small>' + h(hint) + '</small>' : '') + '</label><span class="field-input">' +
        '<input id="lf_' + key + '" type="' + (kind === 'url' ? 'url' : 'text') + '" ' + (kind === 'num' ? 'inputmode="decimal"' : '') + ' data-lf="' + key + '" data-kind="' + (kind || 'text') + '" value="' + h(v === 0 && kind === 'num' ? '' : rawStr(v)) + '" autocomplete="off"' + (key === 'name' ? ' data-autofocus' : '') + '>' + (unit ? '<em>' + unit + '</em>' : '') + '</span></div>';
    }
    function lt(key, label) {
      return '<div class="field"><span class="field-label">' + h(label) + '</span><span class="tri" role="group" aria-label="' + h(label) + '">' + TRI.map(function (t) {
        return '<button type="button" data-lf-set="' + key + '" data-value="' + t[0] + '" aria-pressed="' + (draft[key] === t[0]) + '">' + t[1] + '</button>';
      }).join('') + '</span></div>';
    }
    return {
      title: existing ? 'Изменить вариант' : 'Новый вариант',
      render: function () {
        return '<div class="sheet-summary" data-out="lprev"></div>' +
          '<div class="group">' + lf('name', 'Название', '', '', 'text') + lf('city', 'Город', '', '', 'text') + lf('address', 'Адрес или район', '', '', 'text') + lf('url', 'Ссылка', '', 'Booking, OLX или другой сайт', 'url') + '</div>' +
          '<h3 class="group-title">Цены — вводятся вручную</h3><div class="group">' + lf('priceNight', 'За ночь', '₴', '', 'num') + lf('priceWeek', 'За неделю', '₴', '', 'num') + lf('priceMonth', 'За месяц', '₴', '', 'num') +
          lf('fees', 'Дополнительные сборы', '₴', 'уборка, сервисный сбор — за заезд', 'num') + lf('utilities', 'Коммунальные', '₴/мес', 'если не включены в месячную цену', 'num') +
          lf('commissionPct', 'Комиссия', '%', 'при помесячной аренде', 'num') + lf('deposit', 'Залог', '₴', '', 'num') + '</div>' +
          '<p class="group-note">BASE не загружает цены с сайтов: проверьте их по ссылке перед решением.</p>' +
          '<h3 class="group-title">Комфорт и безопасность</h3><div class="group">' + lt('shelter', 'Укрытие рядом') + lt('heating', 'Нормальное отопление') + lt('kitchen', 'Кухня') + lt('washer', 'Стиральная машина') + lt('parking', 'Парковка') + lt('internet', 'Стабильный интернет') +
          lf('floor', 'Этаж', '', '', 'num') +
          '<div class="field"><span class="field-label">Ваша оценка комфорта</span><span class="tri" role="group" aria-label="Оценка">' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-lf-set="comfortRating" data-value="' + n + '" aria-pressed="' + (+draft.comfortRating === n) + '">' + n + '★</button>'; }).join('') + '</span></div></div>' +
          '<h3 class="group-title">Условия и заметки</h3><div class="group">' + lf('cancellation', 'Условия отмены', '', 'например, бесплатно за 3 дня', 'text') +
          '<div class="field wide"><label class="field-label" for="lf_notes">Личные заметки</label><span class="field-input"><textarea id="lf_notes" data-lf="notes" rows="3">' + h(draft.notes || '') + '</textarea></span></div></div>' +
          '<div class="btn-row" style="margin-top:16px"><button type="button" class="btn btn-primary" data-act="listingSave">Сохранить</button></div>';
      },
      refresh: function (body) {
        var box = body.querySelector('[data-out="lprev"]');
        if (!box) return;
        var c = F.computeListing(state, draft);
        box.innerHTML = c.best ? '<div class="kpis">' + kpi('Выгоднее', c.best.label) + kpi('Средний месяц', money(c.best.avg)) + kpi('Комфорт', num(c.comfort.score) + '/100') + '</div>'
          : '<p class="small muted" style="margin:4px 0">Введите цену — и BASE посчитает стоимость при вашем графике.</p>';
        body.querySelectorAll('[data-lf-set]').forEach(function (b) { b.setAttribute('aria-pressed', String(String(draft[b.getAttribute('data-lf-set')]) === b.getAttribute('data-value'))); });
      }
    };
  }

  /* ── лист: импорт ── */
  function importSheet() {
    return {
      title: 'Импорт данных',
      render: function () {
        return '<p class="card-sub" style="margin:4px 0 14px">Выберите файл, сохранённый через «Экспорт JSON», или вставьте его содержимое. Текущие данные будут заменены — их можно вернуть кнопкой «Отменить».</p>' +
          '<label class="btn btn-block" for="imp-file">' + I.upload + 'Выбрать файл</label><input id="imp-file" type="file" accept="application/json,.json,text/plain" hidden data-act-change="importFile">' +
          '<div class="field wide" style="margin-top:14px;border-top:0"><label class="field-label" for="imp-text">Или вставьте JSON</label><span class="field-input"><textarea id="imp-text" rows="6" placeholder="{ &quot;app&quot;: &quot;BASE&quot;, … }"></textarea></span></div>' +
          '<div class="btn-row" style="margin-top:10px"><button type="button" class="btn btn-primary" data-act="importText">Импортировать</button></div>';
      }
    };
  }
  function installSheet() {
    return {
      title: 'На главный экран',
      render: function () {
        return '<h3 class="group-title">iPhone и iPad — Safari</h3><ol class="steps"><li>Откройте адрес BASE в Safari.</li><li>Нажмите «Поделиться» — квадрат со стрелкой вверх.</li><li>Выберите «На экран „Домой“» и подтвердите «Добавить».</li><li>Запустите BASE с иконки — он откроется на весь экран и будет работать без интернета.</li></ol>' +
          '<h3 class="group-title">Android — Chrome</h3><ol class="steps"><li>Откройте меню ⋮.</li><li>Выберите «Установить приложение» или «Добавить на главный экран».</li></ol>' +
          '<p class="group-note">Данные живут в памяти браузера на этом устройстве. Перед сменой телефона сделайте «Экспорт JSON».</p>';
      }
    };
  }

  /* ═════════════════════════ ДЕЙСТВИЯ ═════════════════════════ */
  function snapshot() { return JSON.parse(JSON.stringify(state)); }
  function restore(snap) { state = snap; commit(); }
  function iso() { return today(); }

  var ACTIONS = {
    schedule: function (el) { openSheet(scheduleSheet(el.getAttribute('data-id'))); },
    editOption: function (el) { openSheet(optionSheet(el.getAttribute('data-id'), el.getAttribute('data-section'))); },
    flex: function (el) { openSheet(flexSheet(el.getAttribute('data-id'))); },
    scoring: function () { openSheet(scoringSheet()); },
    city: function (el) { openSheet(citySheet(el.getAttribute('data-id'))); },
    citiesParams: function () { openSheet(citiesParamsSheet()); },
    cityEnable: function () { var i = cityIndex('custom'); state.cities.list[i].enabled = true; commit(); openSheet(citySheet('custom')); },
    scParams: function () { openSheet(scParamsSheet()); },
    installHelp: function () { openSheet(installSheet()); },
    importOpen: function () { openSheet(importSheet()); },
    cmpTab: function (el) { ui.compareTab = el.getAttribute('data-id'); if (ui.tab !== 'compare') { location.replace('#compare'); } else render(); },
    adviceAll: function () { ui.adviceAll = !ui.adviceAll; render(); },
    flowOpt: function (el) { ui.flowId = el.getAttribute('data-id'); render(); },
    reserveK: function (el) { ui.reserveK = +el.getAttribute('data-k'); render(); },
    scFor: function (el) { ui.scFor = el.getAttribute('data-id'); render(); },
    scOpen: function (el) { openScenario(el.getAttribute('data-id')); },
    scApply: function (el) {
      var snap = snapshot();
      var id = el.getAttribute('data-id');
      var applied = F.applyScenario(F.normalize(state).state, id);
      state = applied;
      ui.scOpen = null;
      commit();
      toast('Сценарий применён', { action: 'Отменить', onAction: function () { restore(snap); } });
    },
    nights: function (el) {
      var d = +el.getAttribute('data-delta');
      var m0 = R.monthsH[0];
      var target = Math.max(0, Math.min(m0.days, m0.nights + d));
      state.schedule.dutyDays = Math.max(0, m0.days - R.state.schedule.otherAwayDays - target);
      commit();
    },
    ovr: function (el) {
      var i = +el.getAttribute('data-i'), d = +el.getAttribute('data-delta');
      var m = R.months[i];
      var ov = state.schedule.dutyOverrides || (state.schedule.dutyOverrides = {});
      ov[i] = Math.max(0, Math.min(62, m.dutyRaw + d));
      if (ov[i] === R.state.schedule.dutyDays) delete ov[i];
      commit();
    },
    ovrReset: function (el) { delete state.schedule.dutyOverrides[+el.getAttribute('data-i')]; commit(); },
    ovrClear: function () { state.schedule.dutyOverrides = {}; commit(); },
    customType: function (el) { state.options.custom.type = el.getAttribute('data-value'); commit(); rebuildSheet(); },
    csv: function () { download('base-sravnenie-' + iso() + '.csv', F.toCSV(R), 'text/csv;charset=utf-8'); },
    exportJson: function () { download('base-backup-' + iso() + '.json', backupJson(), 'application/json'); },
    copyJson: function () {
      var txt = backupJson();
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { toast('Данные скопированы — вставьте их в заметку или сообщение'); }, function () { toast('Не удалось скопировать'); });
      else toast('Копирование недоступно в этом браузере');
    },
    importText: function () {
      var t = document.getElementById('imp-text');
      importFromText(t ? t.value : '');
    },
    reset: function () {
      if (!confirm('Вернуть стартовые значения? Сохранённые объекты в «Моих вариантах» останутся.')) return;
      var snap = snapshot();
      var keep = { listings: state.listings, compareIds: state.compareIds, ui: state.ui };
      state = F.defaults();
      state.listings = keep.listings; state.compareIds = keep.compareIds; state.ui = keep.ui;
      commit();
      toast('Стартовые значения возвращены', { action: 'Отменить', onAction: function () { restore(snap); } });
    },
    install: function () {
      if (!installEvent) return;
      installEvent.prompt();
      installEvent.userChoice.then(function () { installEvent = null; render(); });
    },
    listingNew: function () { openSheet(listingSheet(null)); },
    listingEdit: function (el) { openSheet(listingSheet(el.getAttribute('data-id'))); },
    listingSave: function () {
      if (!draft) return;
      if (!String(draft.name || '').trim()) { toast('Укажите название'); var n = document.getElementById('lf_name'); if (n) n.focus(); return; }
      var clean = F.normalize({ listings: [draft] }).state.listings[0];
      clean.id = draft.id;
      var i = state.listings.map(function (l) { return l.id; }).indexOf(draft.id);
      if (i >= 0) state.listings[i] = clean; else state.listings.unshift(clean);
      closeSheet();
      commit();
      toast(i >= 0 ? 'Изменения сохранены' : 'Вариант добавлен');
    },
    listingDel: function (el) {
      var id = el.getAttribute('data-id');
      var l = state.listings.filter(function (x) { return x.id === id; })[0];
      if (!l || !confirm('Удалить «' + l.name + '»?')) return;
      var snap = snapshot();
      state.listings = state.listings.filter(function (x) { return x.id !== id; });
      state.compareIds = (state.compareIds || []).filter(function (x) { return x !== id; });
      commit();
      toast('Вариант удалён', { action: 'Отменить', onAction: function () { restore(snap); } });
    },
    listingCmp: function (el) {
      var id = el.getAttribute('data-id');
      var ids = (state.compareIds || []).slice();
      var i = ids.indexOf(id);
      if (i >= 0) ids.splice(i, 1); else if (ids.length < 5) ids.push(id); else { toast('Можно сравнить до пяти вариантов'); }
      state.compareIds = ids;
      commit();
    },
    listingUse: function (el) {
      var id = el.getAttribute('data-id');
      var l = R.state.listings.filter(function (x) { return x.id === id; })[0];
      if (!l) return;
      var c = F.computeListing(state, l);
      if (!c.best) return;
      var snap = snapshot();
      var o = state.options.custom, src = c.best.option;
      ['type', 'price', 'pricePerWeek', 'remainderMode', 'remainderNightPrice', 'feePerStay', 'deposit', 'rent', 'utilities', 'commissionPct', 'setupFees', 'noticeDays'].forEach(function (k) { o[k] = src[k]; });
      o.commissionFixed = 0; o.cleaningFee = 0; o.geniusOn = false; o.los7On = false; o.los14On = false; o.los28On = false; o.prepayLastMonth = false; o.depositRefundPct = 100;
      o.name = l.name.slice(0, 60); o.short = l.name.slice(0, 22); o.enabled = true;
      o.comfort = { shelter: l.shelter, heating: l.heating, kitchen: l.kitchen, washer: l.washer, parking: l.parking, internet: l.internet, ownSpace: c.best.mode === 'monthly' ? 'yes' : 'no' };
      commit();
      toast('«' + o.short + '» участвует в сравнении', { action: 'Отменить', onAction: function () { restore(snap); } });
    }
  };

  function backupJson() {
    return JSON.stringify({ app: 'BASE', kind: 'backup', version: F.VERSION, exportedAt: new Date().toISOString(), state: state }, null, 2);
  }
  function importFromText(text) {
    var data;
    try { data = JSON.parse(String(text || '').trim()); } catch (e) { toast('Это не похоже на файл BASE: ошибка JSON'); return; }
    var raw = data && data.state ? data.state : data;
    if (!raw || typeof raw !== 'object' || (raw.app && raw.app !== 'BASE') || (!raw.options && !raw.schedule && !raw.listings)) { toast('В файле нет данных BASE'); return; }
    var n = F.normalize(raw);
    var snap = snapshot();
    state = n.state;
    closeSheet();
    commit();
    toast('Данные восстановлены' + (n.warnings.length ? ' · исправлено полей: ' + n.warnings.length : ''), { action: 'Отменить', onAction: function () { restore(snap); } });
  }

  function download(name, text, mime) {
    var blob = new Blob([text], { type: mime });
    var file = null;
    try { file = new File([blob], name, { type: mime }); } catch (e) {}
    var ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (ios && file && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: name }).catch(function () {});
      return;
    }
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    toast('Файл «' + name + '» сохранён');
  }

  /* ── тост ── */
  var toastTimer = null;
  function toast(msg, opts) {
    opts = opts || {};
    var t = document.getElementById('toast');
    t.innerHTML = '<span>' + h(msg) + '</span>' + (opts.action ? '<button type="button">' + h(opts.action) + '</button>' : '');
    t.hidden = false;
    requestAnimationFrame(function () { t.classList.add('on'); });
    if (opts.action) t.querySelector('button').onclick = function () { hide(); opts.onAction(); };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hide, opts.action ? 6000 : 3200);
    function hide() { t.classList.remove('on'); setTimeout(function () { if (!t.classList.contains('on')) t.hidden = true; }, 300); }
  }

  /* ═════════════════════════ СОБЫТИЯ ═════════════════════════ */
  function parseInput(str) {
    var s = String(str).replace(/[\s  ]/g, '').replace(',', '.');
    if (s === '') return '';
    var n = Number(s);
    return isFinite(n) ? n : str;
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    var close = t.closest('[data-close-sheet]');
    if (close) { closeSheet(); return; }
    var setEl = t.closest('[data-set]');
    if (setEl && !setEl.disabled) {
      var path = setEl.getAttribute('data-set'), raw = setEl.getAttribute('data-value'), type = setEl.getAttribute('data-type');
      var val = type === 'num' || (!type && /^-?\d+(\.\d+)?$/.test(raw) && path.indexOf('comfort') < 0) ? Number(raw) : raw;
      if (path === 'schedule.dutyDays') state.schedule.dutyOverrides = state.schedule.dutyOverrides || {};
      setPath(state, path, val);
      commit();
      return;
    }
    var lset = t.closest('[data-lf-set]');
    if (lset && draft) {
      var key = lset.getAttribute('data-lf-set'), v = lset.getAttribute('data-value');
      draft[key] = key === 'comfortRating' ? (+draft[key] === +v ? 0 : +v) : v;
      refreshSheet();
      return;
    }
    var stepEl = t.closest('[data-step]');
    if (stepEl) {
      var p = stepEl.getAttribute('data-step'), d = parseFloat(stepEl.getAttribute('data-delta'));
      var min = parseFloat(stepEl.getAttribute('data-min')), max = parseFloat(stepEl.getAttribute('data-max'));
      var cur = Number(getPath(R.state, p)) || 0;
      var next = Math.round((cur + d) * 100) / 100;
      if (Math.abs(d) >= 1 && Math.abs(d) < 50) next = Math.round(next);
      if (Math.abs(d) >= 50) next = Math.round(next / d) * d;
      next = Math.max(min, Math.min(max, next));
      setPath(state, p, next);
      commit();
      return;
    }
    var act = t.closest('[data-act]');
    if (act && act.tagName !== 'INPUT' && ACTIONS[act.getAttribute('data-act')]) {
      e.preventDefault();
      ACTIONS[act.getAttribute('data-act')](act, e);
      return;
    }
    var tab = t.closest('.tab');
    if (tab) {
      e.preventDefault();
      var name = tab.getAttribute('data-tab');
      if (name === ui.tab) { window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' }); return; }
      location.replace('#' + name);
    }
  });

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.matches('[data-bind]') && (t.getAttribute('data-kind') === 'num' || t.getAttribute('data-kind') === 'text')) {
      var path = t.getAttribute('data-bind');
      setPath(state, path, t.getAttribute('data-kind') === 'num' ? parseInput(t.value) : t.value);
      if (path === 'options.custom.name') { state.options.custom.short = String(t.value).slice(0, 22); if (sheet) $title.textContent = t.value || 'Мой вариант'; }
      if (/^cities\.list\.2\.name$/.test(path) && sheet) $title.textContent = t.value || 'Свой город';
      commitSoon();
      return;
    }
    if (t.matches('[data-lf]') && draft) {
      var k = t.getAttribute('data-lf');
      draft[k] = t.getAttribute('data-kind') === 'num' ? parseInput(t.value) : t.value;
      refreshSheet();
    }
  });

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches('[data-bind]')) {
      var kind = t.getAttribute('data-kind'), path = t.getAttribute('data-bind');
      if (kind === 'bool') setPath(state, path, t.checked);
      else if (kind === 'str') setPath(state, path, t.value);
      else return;
      commit();
      return;
    }
    if (t.matches('input[data-act="listingCmp"]')) { ACTIONS.listingCmp(t); return; }
    if (t.matches('[data-act-change="importFile"]')) {
      var f = t.files && t.files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () { importFromText(rd.result); };
      rd.onerror = function () { toast('Не удалось прочитать файл'); };
      rd.readAsText(f);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && sheet) { closeSheet(); return; }
    if (e.key === 'Enter' && e.target.matches('input[data-bind], input[data-lf]')) { e.target.blur(); }
  });
  document.addEventListener('focusout', function (e) {
    // после ввода приводим отображение поля к нормализованному значению, если оно было исправлено
    if (e.target.matches && e.target.matches('input[data-bind][data-kind="num"]') && sheet) setTimeout(function () { refreshSheet(); }, 0);
  });

  window.addEventListener('hashchange', function () { setTab((location.hash || '#home').slice(1)); });

  // перерисовка графиков при изменении ширины
  var lastW = 0, rsT = null;
  function onResize() {
    var w = document.getElementById('main').clientWidth;
    if (Math.abs(w - lastW) < 2) return;
    lastW = w;
    clearTimeout(rsT);
    rsT = setTimeout(render, 120);
  }
  if (window.ResizeObserver) new ResizeObserver(onResize).observe(document.getElementById('main'));
  else window.addEventListener('resize', onResize);

  /* ═════════════════════════ ТЕМА ═════════════════════════ */
  function applyAppearance() {
    var root = document.documentElement, t = state.ui.theme;
    if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t); else root.removeAttribute('data-theme');
    root.classList.toggle('no-motion', !state.ui.animations);
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    metas.forEach(function (m) {
      var isDarkMeta = /dark/.test(m.getAttribute('media') || '');
      m.setAttribute('content', t === 'light' ? '#f2f2f4' : t === 'dark' ? '#0d0e10' : (isDarkMeta ? '#0d0e10' : '#f2f2f4'));
    });
  }

  /* ═════════════════════════ PWA ═════════════════════════ */
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEvent = e; if (ui.tab === 'settings') render(); });
  window.addEventListener('appinstalled', function () { installEvent = null; toast('BASE установлен'); });
  window.addEventListener('online', function () { if (ui.tab === 'settings') render(); });
  window.addEventListener('offline', function () { if (ui.tab === 'settings') render(); toast('Нет сети — BASE продолжает работать офлайн'); });

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    var hadController = !!navigator.serviceWorker.controller;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./service-worker.js').then(function (reg) {
        function prompt(w) {
          toast('Доступна новая версия BASE', { action: 'Обновить', onAction: function () { w.postMessage({ type: 'SKIP_WAITING' }); } });
        }
        if (reg.waiting && hadController) prompt(reg.waiting);
        reg.addEventListener('updatefound', function () {
          var w = reg.installing;
          if (!w) return;
          w.addEventListener('statechange', function () { if (w.state === 'installed' && navigator.serviceWorker.controller) prompt(w); });
        });
      }).catch(function () {});
      var reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (!hadController || reloading) return;
        reloading = true;
        location.reload();
      });
    });
  }

  /* ═════════════════════════ СТАРТ ═════════════════════════ */
  applyAppearance();
  lastW = document.getElementById('main').clientWidth;
  setTab((location.hash || '#home').slice(1), true);
  window.BASE = { get state() { return state; }, get result() { return R; }, commit: commit };
})();
