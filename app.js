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
  var ui = { tab: 'home', compareTab: 'options', flowMonth: 0, reserveK: 12, scFor: 'best', scOpen: null };
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
    var V = VIEWS[ui.tab];
    if (V.canUpdate && V.canUpdate(el)) { V.update(); return; }
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

  /* ═════════════════════════ ГЛАВНАЯ ═════════════════════════
     Один экран — один ответ. Экран собирается один раз и дальше только обновляется:
     цифры прокручиваются, ползунки скользят, ответ меняется прямо под пальцем. */
  var DO_TEXT = { daily: 'Снимайте посуточно', realtor: 'Снимайте через риелтора', direct: 'Снимайте напрямую', weekly: 'Снимайте понедельно', aparthotel: 'Живите в апарт-отеле' };
  var VS_TEXT = { daily: 'посуточной арендой', realtor: 'риелтором', direct: 'арендой напрямую', weekly: 'понедельной арендой', aparthotel: 'апарт-отелем' };
  var CITY_IN = { dnipro: 'в Днепре', kamianske: 'в Каменском' };
  var HEX_DARK = { daily: '#3987e5', realtor: '#d95926', direct: '#199e70', weekly: '#e66767', aparthotel: '#9085e9', custom: '#d55181' };
  var PRIORITY_NOTE = {
    economy: 'Цена решает почти всё — 80% оценки.',
    flex: 'Минимум предоплат и обязательств, легко передумать — 60%.',
    comfort: 'Укрытие, отопление, кухня и стиралка важнее цены — 60%.',
    balanced: 'Цена 45%, гибкость 25%, комфорт и безопасность 30%.'
  };
  var CHEV = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>';
  var NEXT = '<svg class="next" viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 6 6 6-6 6"/></svg>';
  var SHARE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14.5V3.5"/><path d="m7.5 7.5 4.5-4.5 4.5 4.5"/><path d="M8.5 10.5H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1.5"/></svg>';
  var DIGITS = '<i>0</i><i>1</i><i>2</i><i>3</i><i>4</i><i>5</i><i>6</i><i>7</i><i>8</i><i>9</i>';
  var PRICE_STEP = 50;
  var homeShown = false;

  function doText(id) { return DO_TEXT[id] || ('Выбирайте «' + oname(id) + '»'); }
  function vsText(id) { return VS_TEXT[id] || ('«' + oname(id) + '»'); }
  function homeIn(st) {
    var hid = (st || R.state).cities.homeId;
    if (CITY_IN[hid]) return CITY_IN[hid];
    var c = (st || R.state).cities.list.filter(function (x) { return x.id === hid; })[0];
    return c ? 'в городе «' + c.name + '»' : 'дома';
  }
  function dotName(id) { return '<i class="dot" style="--c:' + optColor(id) + '"></i><b>' + h(oname(id)) + '</b>'; }
  function monthsText(m) {
    if (m >= 24) { var yy = Math.floor(m / 12 + 1e-9); return yy + ' ' + F.plural(yy, 'год', 'года', 'лет'); }
    if (m >= 2) { var r = Math.floor(m + 1e-9); return r + ' ' + F.monthsWord(r); }
    return num(Math.floor(m * 10) / 10, 1) + ' месяца';
  }

  /* ── модель главной карточки (общая для экрана и картинки «Поделиться») ── */
  function answerModel(Rx) {
    var b = Rx.best, sv = Rx.savings, m = { bestId: b.id, title: doText(b.id) };
    m.eyebrow = 'Лучший выбор · ' + F.PRIORITIES[Rx.state.priority].short.toLowerCase();
    var vsId, year;
    if (sv.same) {
      vsId = sv.nextId; m.val = Math.max(0, sv.nextMonthly); year = vsId ? Rx.options[vsId].year - b.year : 0;
      m.tone = m.val > 0.5 ? 'pos' : 'neutral'; m.label = 'Вы экономите';
    } else if (sv.monthly > 0.5) {
      vsId = sv.vs; m.tone = 'pos'; m.label = 'Вы экономите'; m.val = sv.monthly; year = sv.year;
    } else if (sv.monthly < -0.5) {
      vsId = sv.vs; m.tone = 'warn'; m.label = 'Вы доплачиваете'; m.val = -sv.monthly; year = -sv.year;
    } else {
      vsId = sv.vs; m.tone = 'neutral'; m.label = 'Разницы почти нет'; m.val = 0; year = 0;
    }
    m.year = year;
    m.yearText = money(year) + ' за год';
    m.sub = m.tone === 'warn' ? 'в месяц — за гибкость и комфорт' : m.tone === 'pos' ? 'в месяц · ' + m.yearText : 'в месяц';
    m.equiv = m.tone === 'pos' && b.avg > 0 && year / b.avg >= 1 ? 'Это как ' + monthsText(year / b.avg) + ' жилья бесплатно' : '';
    m.vs = vsId ? 'по сравнению с ' + vsText(vsId) : '';
    return m;
  }

  /* ── прокручивающиеся цифры ── */
  var odoPrev = null;
  function odoSet(el, text, mode) {
    if (!el) return;
    var chars = Array.from(text);
    var shape = chars.map(function (c) { return /\d/.test(c) ? 'd' : c; }).join('');
    var fresh = el.getAttribute('data-shape') !== shape;
    if (fresh) {
      el.setAttribute('data-shape', shape);
      el.innerHTML = chars.map(function (c) {
        return /\d/.test(c) ? '<span class="od"><span class="od-s">' + DIGITS + '</span></span>' : '<span class="od-x">' + (c === ' ' || c === ' ' ? '&nbsp;' : h(c)) + '</span>';
      }).join('');
    }
    var digits = chars.filter(function (c) { return /\d/.test(c); });
    var strips = el.querySelectorAll('.od-s');
    el.classList.toggle('live', mode === 'live');
    if (mode === 'static' || reduceMotion()) {
      strips.forEach(function (s, i) { s.style.transition = 'none'; s.style.transform = 'translateY(' + (-Number(digits[i]) * 10) + '%)'; });
      void el.offsetWidth;
      strips.forEach(function (s) { s.style.transition = ''; s.style.transitionDelay = '0ms'; });
      return;
    }
    if (fresh && mode !== 'live') {
      // новые разряды выкатываются от нуля, по очереди
      strips.forEach(function (s) { s.style.transition = 'none'; s.style.transform = 'translateY(0)'; });
      void el.offsetWidth;
      strips.forEach(function (s, i) { s.style.transition = ''; s.style.transitionDelay = (i * 45) + 'ms'; });
    } else {
      strips.forEach(function (s) { s.style.transitionDelay = '0ms'; });
    }
    strips.forEach(function (s, i) { s.style.transform = 'translateY(' + (-Number(digits[i]) * 10) + '%)'; });
  }
  function fitHero(card) {
    var box = card.querySelector('.answer-value'), odo = card.querySelector('.odo');
    if (!box || !odo) return;
    box.style.fontSize = '';
    var fs = parseFloat(getComputedStyle(box).fontSize), guard = 0;
    while (odo.scrollWidth > box.clientWidth + 1 && fs > 30 && guard++ < 40) { fs -= 2; box.style.fontSize = fs + 'px'; }
  }

  /* ── тактильный «щелчок», когда меняется ответ (Android — вибрация, iPhone — системный переключатель) ── */
  function haptic() {
    try {
      if (navigator.vibrate) { navigator.vibrate(14); return; }
      var lb = document.createElement('label');
      lb.setAttribute('aria-hidden', 'true');
      lb.style.display = 'none';
      var inp = document.createElement('input');
      inp.type = 'checkbox'; inp.setAttribute('switch', ''); inp.tabIndex = -1;
      lb.appendChild(inp);
      document.head.appendChild(lb);
      lb.click();
      document.head.removeChild(lb);
    } catch (e) {}
  }

  /* ── зоны решения на ползунках: где какой вариант лучший ── */
  var ZC = { duty: null, price: null };
  function bestFor(s) { return F.compute(s, { light: true }).bestId; }
  function keyWithout(st, kind) {
    var c = F.clone(st);
    if (kind === 'duty') c.schedule.dutyDays = null; else c.options.daily.price = null;
    c.ui = c.listings = c.compareIds = c.scenarioParams = c.cities = c.baselineId = null;
    return kind + JSON.stringify(c);
  }
  function segsFrom(values, best, refine) {
    var segs = [];
    for (var i = 0; i < values.length; i++) {
      if (!segs.length || best[i] !== segs[segs.length - 1].id) {
        var prev = segs[segs.length - 1];
        var lo = i ? values[i - 1] : values[0], hi = values[i];
        if (prev && refine) { var r = refine(lo, hi, prev.id); lo = r[0]; hi = r[1]; }
        if (prev) { prev.last = lo; prev.to = (lo + hi) / 2; }
        segs.push({ id: best[i], first: hi, from: prev ? (lo + hi) / 2 : values[0], to: values[values.length - 1], last: values[values.length - 1] });
      }
    }
    return segs;
  }
  function dutyZones(st) {
    var key = keyWithout(st, 'duty');
    if (ZC.duty && ZC.duty.key === key) return ZC.duty;
    var s = F.clone(st);
    var m0 = F.buildMonths(F.normalize(s).state.schedule, 1)[0];
    var days = m0.days, maxN = Math.max(0, days - Math.min(days, s.schedule.otherAwayDays || 0));
    var values = [], best = [];
    for (var n = 0; n <= maxN; n++) { s.schedule.dutyDays = maxN - n; values.push(n); best.push(bestFor(s)); }
    ZC.duty = { key: key, days: days, maxN: maxN, min: 0, max: days, segs: segsFrom(values, best, null) };
    return ZC.duty;
  }
  function priceZones(st, range) {
    var key = keyWithout(st, 'price') + '|' + range.min + '|' + range.max;
    if (ZC.price && ZC.price.key === key) return ZC.price;
    var s = F.clone(st);
    var values = [], best = [];
    for (var v = range.min; v <= range.max; v += PRICE_STEP) { s.options.daily.price = v; values.push(v); best.push(bestFor(s)); }
    var refine = function (lo, hi, leftId) {
      while (hi - lo > 1) { var mid = Math.floor((lo + hi) / 2); s.options.daily.price = mid; if (bestFor(s) === leftId) lo = mid; else hi = mid; }
      return [lo, hi];
    };
    ZC.price = { key: key, min: range.min, max: range.max, segs: segsFrom(values, best, refine) };
    return ZC.price;
  }
  function priceRange(p) { return { min: 100, max: Math.max(2000, Math.ceil((p || 0) * 1.5 / 500) * 500) }; }
  function zonesHtml(z, fmtLabel) {
    var span = (z.max - z.min) || 1, out = '', lastLabel = -1;
    z.segs.forEach(function (sg, i) {
      var f1 = (sg.from - z.min) / span, f2 = (sg.to - z.min) / span;
      out += '<i style="left:' + (f1 * 100) + '%;width:' + Math.max(0, (f2 - f1) * 100) + '%;background:' + optColor(sg.id) + '"></i>';
      if (i < z.segs.length - 1) {
        var fb = (sg.to - z.min) / span;
        if (lastLabel < 0 || fb - lastLabel > 0.18) {
          out += '<b style="left:' + (fb * 100) + '%" class="' + (fb < 0.12 ? 'l' : fb > 0.88 ? 'r' : '') + '">' + h(fmtLabel(sg.last)) + '</b>';
          lastLabel = fb;
        }
      }
    });
    return out;
  }
  function segAt(z, v) {
    for (var i = 0; i < z.segs.length; i++) if (v <= z.segs[i].to + 1e-9) return i;
    return z.segs.length - 1;
  }
  function dutyCaption(z, n) {
    var i = segAt(z, n), sg = z.segs[i], prev = z.segs[i - 1], next = z.segs[i + 1];
    if (!prev && !next) return dotName(sg.id) + ' — лучший выбор при любом числе ночей дома';
    var dR = next ? sg.last - n : Infinity, dL = prev ? n - sg.first : Infinity;
    if (dR <= dL) return dotName(sg.id) + ' — лучший выбор, пока дома не больше ' + sg.last + ' ' + F.nightsWord(sg.last) + '. Дальше — ' + dotName(next.id);
    return dotName(sg.id) + ' — лучший выбор, если дома от ' + sg.first + ' ' + F.nightsWord(sg.first) + '. Меньше — ' + dotName(prev.id);
  }
  function priceCaption(z, p, nightlyId) {
    var i = segAt(z, p), sg = z.segs[i], prev = z.segs[i - 1], next = z.segs[i + 1];
    if (!prev && !next) return dotName(sg.id) + ' — лучший выбор при любой цене ночи';
    var dR = next ? sg.last - p : Infinity, dL = prev ? p - sg.first : Infinity;
    if (next && (dR <= dL || sg.id === nightlyId)) {
      return dotName(sg.id) + ' — лучший выбор, пока ночь не дороже ' + money(sg.last) + '.' +
        (sg.id === nightlyId ? ' Запас ' + money(Math.max(0, sg.last - p)) + '.' : ' Дороже — ' + dotName(next.id));
    }
    return dotName(sg.id) + ' — лучший выбор, если ночь дороже ' + money(prev.last) + '. Дешевле — ' + dotName(prev.id);
  }

  /* ── разметка (собирается один раз) ── */
  function brandHead() {
    return '<header class="brand-head"><div class="brand"><span class="brand-mark" aria-hidden="true">' + I.mark + '</span>' +
      '<div><div class="brand-name">BASE</div><p class="brand-tag">Живи свободно. Плати разумно.</p></div></div>' +
      (R.best ? '<button type="button" class="icon-btn" data-act="share" aria-label="Поделиться решением">' + SHARE + '</button>' : '') + '</header>';
  }
  function emptyEnabled() {
    return '<div class="card empty"><h3>Нет вариантов для сравнения</h3><p>Включите хотя бы один вариант жилья — и BASE посчитает, какой выгоднее.</p><a class="btn btn-primary" href="#compare">Открыть варианты</a></div>';
  }
  var GIFT = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="8" width="17" height="4.5" rx="1"/><path d="M5 12.5v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/><path d="M12 8v12.5"/><path d="M12 8c-1.7-3.6-5.5-3.8-5.5-1.4C6.5 8 9 8 12 8Zm0 0c1.7-3.6 5.5-3.8 5.5-1.4C17.5 8 15 8 12 8Z"/></svg>';
  function answerShell() {
    return '<section class="card answer">' +
      '<button type="button" class="eyebrow-btn" data-act="priority"><span data-live="eyebrow"></span>' + CHEV + '</button>' +
      '<h1 class="answer-title"><i class="dot lg" data-live="dot"></i><span class="t" data-live="title"></span></h1>' +
      '<div class="answer-label" data-live="label"></div>' +
      '<div class="answer-value"><span class="odo" aria-hidden="true"></span><span class="sr-only" data-live="valueSr"></span></div>' +
      '<div class="answer-sub" data-live="sub"></div>' +
      '<div class="gift" data-live="equivBox">' + GIFT + '<span data-live="equiv"></span></div>' +
      '<button type="button" class="vs-btn" data-act="baseline"><span data-live="vs"></span>' + CHEV + '</button>' +
      '<span class="sr-only" aria-live="polite" data-live="announce"></span></section>';
  }
  function fitTitle(card) {
    var t = card.querySelector('.answer-title'), sp = t && t.querySelector('.t');
    if (!sp) return;
    t.style.fontSize = ''; t.classList.add('one');
    var fs = parseFloat(getComputedStyle(t).fontSize), g = 0;
    while (sp.scrollWidth > sp.clientWidth + 1 && fs > 19 && g++ < 12) { fs -= 1; t.style.fontSize = fs + 'px'; }
    if (sp.scrollWidth > sp.clientWidth + 1) t.classList.remove('one');
  }
  function sliderHtml(kind, label) {
    return '<div class="slider" data-slider="' + kind + '" role="slider" tabindex="0" aria-label="' + h(label) + '">' +
      '<span class="s-track"><i class="s-fill"></i><i class="s-other"></i></span><span class="s-zones"></span><span class="s-thumb"></span></div>';
  }
  function monthShell() {
    var d = R.state.options.daily;
    var presets = [7, 10, 14].map(function (x) {
      return '<button type="button" class="chip" data-set="schedule.dutyDays" data-type="num" data-value="' + x + '">' + x + ' дн.</button>';
    }).join('');
    return '<section class="section"><div class="section-head"><h2 class="section-title">Ваш месяц</h2>' +
      '<button type="button" class="link-btn" data-act="schedule" data-live="monthLink">Подробнее</button></div>' +
      '<div class="card month">' +
      '<div class="month-legend"><span><b class="num" data-live="nights"></b> <span data-live="nightsWord"></span></span>' +
      '<span class="muted"><b class="num" data-live="duty"></b> <span data-live="dutyWord"></span></span></div>' +
      sliderHtml('duty', 'Ночей дома в месяце') +
      '<p class="zone-cap" data-live="dutyCap"></p>' +
      '<div class="month-ctrl"><span class="muted small">Дежурство</span><div class="chips" role="group" aria-label="Дней в Краматорске">' + presets + '</div></div>' +
      '<p class="month-note" data-live="ovNote" hidden>В отдельных месяцах дни заданы вручную — <button type="button" class="link-btn" data-act="schedule">посмотреть</button></p>' +
      (d.enabled ? '<div class="price-block"><div class="price-head"><span class="control-label">Цена ночи</span>' +
        '<button type="button" class="price-val num" data-act="editOption" data-id="daily" data-live="price" aria-label="Точная цена ночи"></button></div>' +
        sliderHtml('price', 'Цена ночи посуточно') + '<p class="zone-cap" data-live="priceCap"></p></div>' : '') +
      '</div></section>';
  }
  function ladderShell() {
    return '<section class="section"><div class="section-head"><h2 class="section-title">Сколько стоит месяц</h2><a class="link-btn" href="#compare">Все графики</a></div>' +
      '<div class="card"><ul class="ladder"></ul><p class="ladder-note"><span data-live="hatchNote"><i class="hatch-key"></i>плата за дни, когда вас нет дома · </span>' +
      'в среднем за <span data-live="horizon"></span>, с комиссиями. Залог не расход — он вернётся.</p></div></section>';
  }
  function ladRowHtml(id) {
    return '<li data-id="' + id + '"><button type="button" class="lad" data-act="viewOption" data-id="' + id + '" style="--c:' + optColor(id) + '">' +
      '<span class="lad-name"><i class="dot"></i><span>' + h(oname(id)) + '</span></span><span class="lad-val num" data-l="val"></span>' +
      '<span class="lad-bar"><i class="lb-use"></i><i class="lb-idle"></i></span><span class="lad-tag" data-l="tag"></span>' + NEXT + '</button></li>';
  }

  var INSIGHT_ORDER = ['capped', 'upfront', 'stays', 'weeklyUnused', 'noComm', 'duty14', 'duty7', 'price100', 'opp', 'idle', 'priceBE'];
  function pickInsight() {
    var A = (R.advice || []).filter(function (a) { return a.id !== 'summary' && a.id !== 'reserve'; });
    for (var i = 0; i < INSIGHT_ORDER.length; i++) {
      var f = A.filter(function (a) { return a.id === INSIGHT_ORDER[i]; })[0];
      if (f) return f;
    }
    return A[0] || null;
  }
  var ICON_TONE = { positive: I.down, warning: I.alert, neutral: I.info };
  function adviceItem(a) {
    return '<li class="' + a.tone + '"><span class="advice-ico" aria-hidden="true">' + (ICON_TONE[a.tone] || I.info) + '</span><div><div class="advice-title">' + h(a.title) + '</div>' +
      '<div class="advice-text">' + h(a.text) + '</div><details><summary>Как посчитано</summary><div class="calc">' + h(a.calc) + '</div></details></div></li>';
  }
  function insightHtml() {
    var a = pickInsight();
    if (!a) return '';
    var n = (R.advice || []).length;
    return '<section class="section"><div class="section-head"><h2 class="section-title">Главное</h2>' +
      (n > 1 ? '<button type="button" class="link-btn" data-act="advice">Все советы · ' + n + '</button>' : '') + '</div>' +
      '<div class="card"><ul class="advice">' + adviceItem(a) + '</ul></div></section>';
  }
  function reserveMiniHtml() {
    var rs = R.reserve;
    if (!rs || rs.monthly <= 0.5 || rs.goal <= 0) return '';
    var prog = Math.max(0, Math.min(1, rs.points[3].saved / rs.goal));
    var C = 2 * Math.PI * 26;
    var text = rs.reachMonth
      ? 'Откладывайте <b>' + money(rs.monthly) + '</b> в месяц — резерв на ' + rs.goalMonths + ' ' + F.monthsWord(rs.goalMonths) + ' жилья соберётся за <b>' + rs.reachMonth + ' ' + F.monthsWord(rs.reachMonth) + '</b>.'
      : 'Откладывайте <b>' + money(rs.monthly) + '</b> в месяц — так экономия станет подушкой.';
    return '<section class="section"><button type="button" class="card reserve-mini" data-act="reserve">' +
      '<span class="ring sm" aria-hidden="true"><svg viewBox="0 0 64 64"><circle class="ring-track" cx="32" cy="32" r="26"/><circle class="ring-fill" cx="32" cy="32" r="26" stroke-dasharray="' + C + '" stroke-dashoffset="' + (C * (1 - prog)) + '"/></svg>' +
      '<span class="ring-center"><b>' + (rs.reachMonth || '—') + '</b>мес.</span></span>' +
      '<span class="reserve-mini-body"><span class="reserve-mini-title">Калькулятор свободы</span><span class="reserve-mini-text">' + text + '</span></span>' + NEXT + '</button></section>';
  }
  function warningsHtml() {
    var seen = {}, list = [];
    R.warnings.forEach(function (w) { if (!seen[w.message]) { seen[w.message] = 1; list.push(w); } });
    if (!list.length) return '';
    return '<div class="notice" role="status">' + I.alert + '<div><b>Проверьте данные · ' + list.length + '</b><ul>' +
      list.slice(0, 4).map(function (w) { return '<li>' + h(w.message) + '</li>'; }).join('') + (list.length > 4 ? '<li>…и ещё ' + (list.length - 4) + '</li>' : '') + '</ul></div></div>';
  }

  function homeShape(Rx) { return [Rx.best ? 1 : 0, Rx.state.options.daily.enabled ? 1 : 0].join('|'); }

  /* ── обновление на месте ── */
  var lastZoneT = 0;
  function setText(root, key, text) { var e = root.querySelector('[data-live="' + key + '"]'); if (e && e.textContent !== text) e.textContent = text; return e; }
  function setHtml(root, key, html) { var e = root.querySelector('[data-live="' + key + '"]'); if (e && e.innerHTML !== html) e.innerHTML = html; return e; }

  function updateAnswer(root, Rx, mode) {
    var card = root.querySelector('.answer');
    if (!card) return;
    var m = answerModel(Rx);
    card.classList.toggle('is-pos', m.tone === 'pos');
    card.classList.toggle('is-warn', m.tone === 'warn');
    card.classList.toggle('is-neutral', m.tone === 'neutral');
    setText(card, 'eyebrow', m.eyebrow);
    setText(card, 'label', m.label);
    setText(card, 'sub', m.sub);
    setText(card, 'valueSr', money(m.val) + ' ' + m.sub);
    setText(card, 'equiv', m.equiv);
    var eb = card.querySelector('[data-live="equivBox"]'); if (eb) eb.hidden = !m.equiv;
    var vs = setText(card, 'vs', m.vs); if (vs) vs.parentNode.hidden = !m.vs;
    if (mode !== 'live' && mode !== 'mount') setText(card, 'announce', m.title + '. ' + m.label + ' ' + money(m.val) + ' ' + m.sub + '.');
    var title = card.querySelector('[data-live="title"]'), dot = card.querySelector('[data-live="dot"]');
    var prevBest = card.getAttribute('data-best');
    if (prevBest !== m.bestId) {
      card.setAttribute('data-best', m.bestId);
      title.textContent = m.title;
      dot.style.setProperty('--c', optColor(m.bestId));
      fitTitle(card);
      if (prevBest) haptic();
      if (prevBest && !reduceMotion()) {
        title.classList.remove('flip-in'); dot.classList.remove('flip-in'); card.classList.remove('pulse');
        void card.offsetWidth;
        title.classList.add('flip-in'); dot.classList.add('flip-in'); card.classList.add('pulse');
      }
    }
    var odo = card.querySelector('.odo');
    var before = odo.getAttribute('data-shape');
    var text = money(m.val), om = mode;
    if (mode === 'mount' && odoPrev !== null) {
      // возвращение на главную: без «прокрута с нуля», только от прошлого значения
      if (odoPrev === text) om = 'static';
      else { odoSet(odo, odoPrev, 'static'); fitHero(card); before = odo.getAttribute('data-shape'); om = 'settle'; }
    }
    odoSet(odo, text, om);
    odoPrev = text;
    if (before !== odo.getAttribute('data-shape')) fitHero(card);
  }

  function paintSlider(sl, frac, otherFrac) {
    sl.style.setProperty('--p', Math.max(0, Math.min(1, frac)));
    if (otherFrac !== undefined) sl.style.setProperty('--o', Math.max(0, Math.min(1, otherFrac)));
  }

  function updateMonth(root, Rx, mode, dragging) {
    var S = Rx.state.schedule, m0 = Rx.monthsH[0];
    var days = m0.days, other = Math.min(days, S.otherAwayDays), maxN = days - other, n = m0.nights;
    setText(root, 'nights', String(n));
    setText(root, 'nightsWord', F.nightsWord(n) + ' ' + homeIn(Rx.state));
    setText(root, 'duty', String(maxN - n));
    setText(root, 'dutyWord', F.daysWord(maxN - n) + ' в Краматорске');
    setText(root, 'monthLink', S.monthMode === 'calendar' ? m0.labelLong : 'Подробнее');
    var noOv = Object.keys(S.dutyOverrides).length === 0;
    root.querySelectorAll('.month-ctrl .chip').forEach(function (c) { c.setAttribute('aria-pressed', String(noOv && S.dutyDays === +c.getAttribute('data-value'))); });
    var ov = root.querySelector('[data-live="ovNote"]'); if (ov) ov.hidden = noOv;

    root.querySelectorAll('[data-slider]').forEach(function (sl) { sl.style.setProperty('--tc', optColor(Rx.bestId)); });
    var ds = root.querySelector('[data-slider="duty"]');
    var zonesDue = mode !== 'live' || Date.now() - lastZoneT > 140;
    if (ds) {
      ds.setAttribute('data-days', days); ds.setAttribute('data-maxn', maxN);
      ds.setAttribute('aria-valuemin', 0); ds.setAttribute('aria-valuemax', maxN); ds.setAttribute('aria-valuenow', n);
      ds.setAttribute('aria-valuetext', n + ' ' + F.nightsWord(n) + ' дома, ' + (maxN - n) + ' ' + F.daysWord(maxN - n) + ' в Краматорске');
      if (dragging !== 'duty') paintSlider(ds, n / days, other / days);
      if (dragging !== 'duty' && (zonesDue || !ZC.duty)) {
        var dz = dutyZones(Rx.state);
        ds.querySelector('.s-zones').innerHTML = zonesHtml(dz, function (v) { return v + ' ноч.'; });
      }
      if (ZC.duty) setHtml(root, 'dutyCap', dutyCaption(ZC.duty, n));
    }
    var ps = root.querySelector('[data-slider="price"]');
    if (ps && Rx.state.options.daily.enabled) {
      var p = Rx.state.options.daily.price;
      setText(root, 'price', money(p));
      var range = dragging === 'price' ? { min: +ps.getAttribute('data-min'), max: +ps.getAttribute('data-max') } : priceRange(p);
      ps.setAttribute('data-min', range.min); ps.setAttribute('data-max', range.max);
      ps.setAttribute('aria-valuemin', range.min); ps.setAttribute('aria-valuemax', range.max); ps.setAttribute('aria-valuenow', p);
      ps.setAttribute('aria-valuetext', money(p) + ' за ночь');
      if (dragging !== 'price') paintSlider(ps, (p - range.min) / (range.max - range.min));
      if (dragging !== 'price' && (zonesDue || !ZC.price)) {
        var pz = priceZones(Rx.state, range);
        ps.querySelector('.s-zones').innerHTML = zonesHtml(pz, function (v) { return money(v); });
      }
      if (ZC.price) setHtml(root, 'priceCap', priceCaption(ZC.price, p, 'daily'));
    }
    if (zonesDue && mode === 'live') lastZoneT = Date.now();
  }

  function updateLadder(root, Rx, mode) {
    var ul = root.querySelector('.ladder');
    if (!ul) return;
    var ids = Rx.byCost;
    var max = Math.max.apply(null, ids.map(function (id) { return Rx.options[id].avg; }).concat([1]));
    var min = ids.length ? Rx.options[ids[0]].avg : 0;
    var anyIdle = false;
    ids.forEach(function (id, i) {
      var li = ul.querySelector('li[data-id="' + id + '"]');
      if (!li) { ul.insertAdjacentHTML('beforeend', ladRowHtml(id)); li = ul.lastElementChild; }
      var r = Rx.options[id];
      var idle = Math.min(r.avg, r.idleTotal / Rx.H);
      if (idle > 0.5) anyIdle = true;
      li.querySelector('[data-l="val"]').textContent = money(r.avg);
      li.querySelector('.lb-use').style.width = Math.max(1.5, (r.avg - idle) / max * 100) + '%';
      li.querySelector('.lb-idle').style.width = (idle / max * 100) + '%';
      var tag = id === Rx.bestId ? '<span class="badge good">выбор</span>' : (i === 0 ? '<span class="badge">дешевле всех</span>' : '<span class="lad-delta">+' + money(r.avg - min) + '</span>');
      var tg = li.querySelector('[data-l="tag"]'); if (tg.innerHTML !== tag) tg.innerHTML = tag;
    });
    ul.querySelectorAll('li').forEach(function (li) { if (ids.indexOf(li.getAttribute('data-id')) < 0) li.remove(); });
    var order = Array.prototype.map.call(ul.querySelectorAll('li'), function (li) { return li.getAttribute('data-id'); }).join(',');
    if (mode !== 'live' && order !== ids.join(',')) {
      var tops = {};
      ul.querySelectorAll('li').forEach(function (li) { tops[li.getAttribute('data-id')] = li.getBoundingClientRect().top; });
      ids.forEach(function (id) { ul.appendChild(ul.querySelector('li[data-id="' + id + '"]')); });
      if (!reduceMotion()) ul.querySelectorAll('li').forEach(function (li) {
        var d = tops[li.getAttribute('data-id')] - li.getBoundingClientRect().top;
        if (!isFinite(d) || Math.abs(d) < 1) return;
        li.style.transition = 'none'; li.style.transform = 'translateY(' + d + 'px)';
        void li.offsetWidth;
        li.style.transition = 'transform 0.55s var(--ease)'; li.style.transform = '';
      });
    }
    var hn = root.querySelector('[data-live="hatchNote"]'); if (hn) hn.hidden = !anyIdle;
    setText(root, 'horizon', Rx.H + ' ' + F.monthsWord(Rx.H));
  }

  function updateHome(Rx, mode, dragging) {
    var root = document.getElementById('view-home');
    if (!root || !root.querySelector('.answer')) return;
    updateAnswer(root, Rx, mode);
    updateMonth(root, Rx, mode, dragging);
    updateLadder(root, Rx, mode);
    if (mode !== 'live') {
      var w = root.querySelector('[data-slot="warn"]'), ins = root.querySelector('[data-slot="insight"]'), res = root.querySelector('[data-slot="reserve"]');
      var wh = warningsHtml(), ih = insightHtml(), rh = reserveMiniHtml();
      if (w && w.innerHTML !== wh) w.innerHTML = wh;
      if (ins && ins.getAttribute('data-h') !== ih) { ins.setAttribute('data-h', ih); ins.innerHTML = ih; }
      if (res && res.getAttribute('data-h') !== rh) { res.setAttribute('data-h', rh); res.innerHTML = rh; }
    }
  }

  /* ── ползунки: пересчёт прямо под пальцем ── */
  function bindSlider(sl, kind) {
    var dragging = false, pending = null, raf = 0;
    function valueAt(x) {
      var r = sl.getBoundingClientRect();
      var f = Math.max(0, Math.min(1, (x - r.left - 15) / Math.max(1, r.width - 30)));
      if (kind === 'duty') return Math.max(0, Math.min(+sl.getAttribute('data-maxn'), Math.round(f * +sl.getAttribute('data-days'))));
      var mn = +sl.getAttribute('data-min'), mx = +sl.getAttribute('data-max');
      return Math.max(mn, Math.min(mx, Math.round((mn + f * (mx - mn)) / PRICE_STEP) * PRICE_STEP));
    }
    function frac(v) {
      if (kind === 'duty') return v / +sl.getAttribute('data-days');
      var mn = +sl.getAttribute('data-min'), mx = +sl.getAttribute('data-max');
      return (v - mn) / (mx - mn);
    }
    function apply(s, v) {
      if (kind === 'duty') s.schedule.dutyDays = +sl.getAttribute('data-maxn') - v;
      else s.options.daily.price = v;
    }
    function run() {
      raf = 0;
      if (pending === null) return;
      var s = F.clone(state); apply(s, pending);
      updateHome(F.compute(s, { light: true }), 'live', kind);
    }
    function settle(v) {
      sl.classList.remove('drag');
      apply(state, v);
      commit();
    }
    sl.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return;
      dragging = true; sl.classList.add('drag');
      try { sl.setPointerCapture(e.pointerId); } catch (x) {}
      pending = valueAt(e.clientX); paintSlider(sl, frac(pending));
      if (!raf) raf = requestAnimationFrame(run);
    });
    sl.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var v = valueAt(e.clientX);
      if (v === pending) return;
      pending = v; paintSlider(sl, frac(v));
      if (!raf) raf = requestAnimationFrame(run);
    });
    sl.addEventListener('pointerup', function () { if (!dragging) return; dragging = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } settle(pending); });
    sl.addEventListener('pointercancel', function () { dragging = false; sl.classList.remove('drag'); if (raf) { cancelAnimationFrame(raf); raf = 0; } updateHome(R, 'settle'); });
    sl.addEventListener('keydown', function (e) {
      var cur = kind === 'duty' ? R.monthsH[0].nights : R.state.options.daily.price;
      var step = kind === 'duty' ? 1 : PRICE_STEP, d = 0;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') d = step;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') d = -step;
      if (!d) return;
      e.preventDefault();
      var v = kind === 'duty' ? Math.max(0, Math.min(+sl.getAttribute('data-maxn'), cur + d)) : Math.max(0, Math.round((cur + d) / step) * step);
      settle(v);
    });
  }

  var Home = {
    html: function () {
      if (!R.best) return brandHead() + emptyEnabled();
      return '<div class="' + (homeShown ? '' : 'stagger') + '">' + brandHead() + answerShell() + '<div data-slot="warn"></div>' + monthShell() + ladderShell() +
        '<div data-slot="insight"></div><div data-slot="reserve"></div></div>';
    },
    after: function (el) {
      el.setAttribute('data-shape', homeShape(R));
      if (!R.best) return;
      el.querySelectorAll('[data-slider]').forEach(function (sl) { bindSlider(sl, sl.getAttribute('data-slider')); });
      updateHome(R, 'mount');
      homeShown = true;
    },
    canUpdate: function (el) { return !!el.querySelector('.answer') && el.getAttribute('data-shape') === homeShape(R); },
    update: function () { updateHome(R, 'settle'); }
  };

  /* ── картинка решения: чтобы показать второму человеку ── */
  function shareDecision() {
    if (!R.best) return;
    var W = 1080, H = 1350, cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var x = cv.getContext('2d');
    var FONT = 'system-ui, -apple-system, "SF Pro Display", "Segoe UI", Roboto, Arial, sans-serif';
    function font(w, s) { x.font = w + ' ' + s + 'px ' + FONT; }
    function rr(px, py, w, hh, r) { x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + hh, r); x.arcTo(px + w, py + hh, px, py + hh, r); x.arcTo(px, py + hh, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); }
    var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1d1e23'); g.addColorStop(1, '#0b0c0e');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    var m = answerModel(R);
    var glow = x.createRadialGradient(140, 120, 0, 140, 120, 980);
    glow.addColorStop(0, m.tone === 'warn' ? 'rgba(255,179,64,0.20)' : 'rgba(52,199,89,0.22)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = glow; x.fillRect(0, 0, W, H);
    // знак и название
    rr(80, 80, 88, 88, 24); x.fillStyle = '#f4f4f6'; x.fill();
    x.save(); x.translate(80, 80); x.scale(88 / 24, 88 / 24); x.strokeStyle = '#0b0b0d'; x.lineWidth = 2.2; x.lineCap = 'round'; x.lineJoin = 'round';
    x.beginPath(); x.moveTo(6, 11.8); x.lineTo(12, 6.5); x.lineTo(18, 11.8); x.moveTo(8, 10.3); x.lineTo(8, 17.2); x.moveTo(16, 10.3); x.lineTo(16, 17.2); x.moveTo(5, 17.2); x.lineTo(19, 17.2); x.stroke(); x.restore();
    x.fillStyle = '#f4f4f6'; font('800', 56); x.fillText('BASE', 194, 136);
    x.fillStyle = '#8a8a92'; font('500', 28); x.fillText('Живи свободно. Плати разумно.', 196, 168);
    // ответ
    var y = 300;
    x.fillStyle = '#8a8a92'; font('700', 28); x.fillText('НАШ ВЫБОР', 80, y);
    x.fillStyle = '#f4f4f6'; font('700', 68);
    var words = m.title.split(' '), line = '', lines = [];
    words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (x.measureText(t).width > W - 160 && line) { lines.push(line); line = w; } else line = t; });
    lines.push(line);
    lines.forEach(function (l) { y += 82; x.fillText(l, 80, y); });
    y += 92; x.fillStyle = '#b0b0b8'; font('500', 38); x.fillText(m.label, 80, y);
    var big = money(m.val), bs = 210;
    font('800', bs); while (x.measureText(big).width > W - 160 && bs > 90) { bs -= 6; font('800', bs); }
    y += bs * 0.86 + 14; x.fillStyle = m.tone === 'warn' ? '#ffb340' : m.tone === 'pos' ? '#34c759' : '#f4f4f6'; x.fillText(big, 74, y);
    y += 66; x.fillStyle = '#f4f4f6'; font('600', 40); x.fillText(m.sub, 80, y);
    if (m.equiv) { y += 52; x.fillStyle = '#b0b0b8'; font('500', 34); x.fillText(m.equiv.charAt(0).toUpperCase() + m.equiv.slice(1), 80, y); }
    if (m.vs) { y += 48; x.fillStyle = '#8a8a92'; font('500', 32); x.fillText(m.vs.charAt(0).toUpperCase() + m.vs.slice(1), 80, y); }
    // лестница цен
    y += 70;
    x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(80, y - 30, W - 160, 2);
    var ids = R.byCost.slice(0, 4), maxA = Math.max.apply(null, ids.map(function (id) { return R.options[id].avg; }));
    var hatch = document.createElement('canvas'); hatch.width = hatch.height = 14;
    var hx = hatch.getContext('2d'); hx.strokeStyle = '#ffb340'; hx.lineWidth = 4; hx.beginPath(); hx.moveTo(-2, 16); hx.lineTo(16, -2); hx.stroke();
    var hpat = x.createPattern(hatch, 'repeat');
    var rowH = Math.min(96, Math.floor((H - 230 - y) / ids.length));
    ids.forEach(function (id) {
      var r = R.options[id], idle = Math.min(r.avg, r.idleTotal / R.H);
      y += rowH;
      x.fillStyle = '#f4f4f6'; font('600', 34); x.fillText(oname(id) + (id === R.bestId ? '  ✓' : ''), 80, y - 26);
      font('700', 34); var vt = money(r.avg) + ' / мес'; x.fillText(vt, W - 80 - x.measureText(vt).width, y - 26);
      var bw = W - 160, wUse = (r.avg - idle) / maxA * bw, wIdle = idle / maxA * bw;
      rr(80, y - 10, bw, 14, 7); x.fillStyle = 'rgba(255,255,255,0.08)'; x.fill();
      x.save(); rr(80, y - 10, Math.max(14, wUse + wIdle), 14, 7); x.clip();
      x.fillStyle = HEX_DARK[id] || '#8a8a92'; x.fillRect(80, y - 10, wUse, 14);
      if (wIdle > 1) { x.fillStyle = hpat; x.fillRect(80 + wUse, y - 10, wIdle, 14); }
      x.restore();
    });
    // легенда штриховки
    var anyIdle = ids.some(function (id) { return R.options[id].idleTotal > 0.5; });
    if (anyIdle) {
      y += 52;
      x.save(); rr(80, y - 16, 36, 14, 4); x.clip(); x.fillStyle = hpat; x.fillRect(80, y - 16, 36, 14); x.restore();
      x.fillStyle = '#8a8a92'; font('500', 26); x.fillText('— плата за дни, когда нас нет дома', 128, y - 3);
    }
    // подвал
    var S = R.state.schedule, m0 = R.monthsH[0];
    x.fillStyle = '#b0b0b8'; font('500', 30);
    x.fillText(m0.duty + ' ' + F.daysWord(m0.duty) + ' в Краматорске · ' + m0.nights + ' ' + F.nightsWord(m0.nights) + ' ' + homeIn() +
      (R.state.options.daily.enabled ? ' · ночь ' + money(R.state.options.daily.price) : ''), 80, H - 118);
    x.fillStyle = '#6e6e76'; font('500', 24);
    x.fillText('Посчитано в BASE · суммы — наши вводные, а не предложения рынка', 80, H - 74);
    // отдать системе «Поделиться» (синхронно — так требует Safari)
    var data = cv.toDataURL('image/png');
    var bin = atob(data.split(',')[1]), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    var blob = new Blob([bytes], { type: 'image/png' });
    var name = 'base-reshenie.png', file = null;
    try { file = new File([blob], name, { type: 'image/png' }); } catch (e) {}
    var text = m.title + '. ' + m.label + ' ' + money(m.val) + ' ' + m.sub + '.';
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: 'BASE — наше решение', text: text }).catch(function () {});
      return;
    }
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    toast('Картинка решения сохранена');
  }

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
    if (sheet.dynamic) {
      // лист без полей ввода — просто перерисовываем, сохраняя прокрутку и фокус
      var active = document.activeElement, fk = active && $body.contains(active) ? fkOf(active) : null, st = $body.scrollTop;
      $body.innerHTML = sheet.render();
      if (sheet.after) sheet.after($body);
      $body.scrollTop = st;
      if (fk) { var f = $body.querySelector(fk); if (f) try { f.focus({ preventScroll: true }); } catch (e) {} }
    }
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

  /* ── лист: вариант (просмотр) ── */
  function li(label, value, sub) {
    return '<div class="li"><span class="li-label">' + h(label) + (sub ? '<small>' + h(sub) + '</small>' : '') + '</span><span class="li-value num">' + value + '</span></div>';
  }
  function liBtn(label, value, attrs) {
    return '<button type="button" class="li li-btn" ' + attrs + '><span class="li-label">' + h(label) + '</span><span class="li-value num">' + value + NEXT + '</span></button>';
  }
  function optionViewSheet(id) {
    ui.flowMonth = 0;
    return {
      title: R.state.options[id].name,
      dynamic: true,
      render: function () {
        var r = R.options[id];
        if (ui.flowMonth >= R.H) ui.flowMonth = 0;
        var m = ui.flowMonth, row = r.rows[m], ml = R.months[m];
        var ico = { pay: I.out, prepay: I.clock, freeze: I.lock, refund: I.back, info: I.check };
        var events = row.events.length ? row.events.map(function (e) {
          var amt = e.kind === 'refund' ? '+' + money(e.amount) : e.kind === 'info' ? '—' : money(e.amount);
          return '<li class="' + e.kind + '"><span class="flow-ico" aria-hidden="true">' + (ico[e.kind] || I.out) + '</span><span>' + h(e.label) + '</span><span class="amt">' + amt + '</span>' +
            (e.note || e.kind === 'freeze' ? '<span class="note">' + h(e.note || 'временно заморожено') + '</span>' : '') + '</li>';
        }).join('') : '<li class="info"><span class="flow-ico">' + I.check + '</span><span>Платежей нет — весь месяц вне дома</span><span class="amt">0&nbsp;₴</span></li>';
        var moveSub = r.moveInParts.map(function (p) { return p.label.toLowerCase(); }).join(' + ');
        return '<div class="ov-head"><i class="dot lg" style="--c:' + optColor(id) + '"></i><span class="muted">' + typeLabel(r.type) + (id === R.bestId ? ' · лучший выбор' : '') + '</span></div>' +
          '<div class="ov-big num">' + money(r.avg) + '</div><div class="ov-sub">в месяц, в среднем за ' + R.H + ' ' + F.monthsWord(R.H) + '</div>' +
          '<div class="list">' + li('Первый месяц', money(r.first), r.commission ? 'с комиссией' : '') + li('За 12 месяцев', money(r.year)) +
          li('Нужно при заселении', money(r.moveIn), moveSub) +
          li('Вернётся при выезде', money(r.refundable), r.refundable ? 'залог — не расход' : '') +
          (r.sunk ? li('Не вернётся никогда', money(r.sunk), 'комиссия и сборы') : '') +
          li('Оплачено, но пустует', num(r.unusedPerMonth, 1) + ' ' + F.daysWord(r.unusedPerMonth) + '/мес', r.idleTotal ? money(r.idleTotal) + ' за ' + R.H + ' мес.' : 'платите только за свои ночи') + '</div>' +
          '<h3 class="group-title">Платежи по месяцам</h3><div class="list list-pad"><div data-chart="flow"></div>' +
          '<div class="flow-detail"><div class="row-between"><b>' + h(ml.labelLong) + '</b><span class="muted small">' + ml.nights + ' ' + F.nightsWord(ml.nights) + ' дома</span></div>' +
          '<ul class="flow-list">' + events + '</ul></div>' +
          '<div class="flow-sum">' + kpi('Заплатите', money(r.cashOutTotal)) + kpi('Вернётся', money(r.cashInTotal)) + kpi('Расход', money(r.total)) + '</div></div>' +
          '<h3 class="group-title">Оценка</h3><div class="list">' +
          liBtn('Финансовая гибкость', num(r.flex.score) + ' из 100', 'data-act="flex" data-id="' + id + '"') +
          liBtn('Комфорт и безопасность', num(r.comfort.score) + ' из 100', 'data-act="editOption" data-id="' + id + '" data-section="comfort"') + '</div>' +
          '<button type="button" class="btn btn-primary btn-block" style="margin-top:18px" data-act="editOption" data-id="' + id + '">' + I.edit + 'Изменить условия</button>';
      },
      after: function (body) {
        var fc = body.querySelector('[data-chart="flow"]');
        var r = R.options[id];
        if (fc) Ch.flow(fc, {
          labels: R.monthsH.map(function (m) { return m.label; }),
          values: r.rows.slice(0, R.H).map(function (x) { return x.cashOut; }),
          refunds: r.rows.slice(0, R.H).map(function (x) { return x.cashIn; }),
          selected: ui.flowMonth, color: optColor(id),
          onSelect: function (i) { ui.flowMonth = i; rebuildSheet(); var c = $body.querySelector('[data-chart="flow"]'); if (c) c.focus({ preventScroll: true }); }
        });
      }
    };
  }

  /* ── лист: все советы ── */
  function adviceSheet() {
    return {
      title: 'Советник',
      dynamic: true,
      render: function () {
        return '<p class="card-sub" style="margin:2px 2px 12px">Каждый совет посчитан по вашим цифрам — откройте «Как посчитано».</p>' +
          '<div class="list list-pad"><ul class="advice">' + (R.advice || []).map(adviceItem).join('') + '</ul></div>';
      }
    };
  }

  /* ── лист: калькулятор свободы ── */
  function reserveSheet() {
    return {
      title: 'Калькулятор свободы',
      dynamic: true,
      render: function () {
        var rs = R.reserve;
        if (!rs || (rs.monthly <= 0.5 && rs.points[3].saved <= 0.5)) {
          return '<p class="card-sub">Относительно варианта «' + h(R.baseline.short) + '» экономии нет. Выберите другую базу сравнения на главном экране.</p>';
        }
        var idx = [1, 3, 6, 12].indexOf(ui.reserveK); if (idx < 0) idx = 3;
        var p = rs.points[idx];
        var prog = rs.goal > 0 ? Math.max(0, Math.min(1, p.saved / rs.goal)) : 0;
        var C = 2 * Math.PI * 46;
        return '<div class="seg" role="group">' + [1, 3, 6, 12].map(function (k) {
          return '<button type="button" data-act="reserveK" data-k="' + k + '" aria-pressed="' + (k === ui.reserveK) + '">' + k + ' мес.</button>';
        }).join('') + '</div>' +
          '<div class="reserve-top"><div><div class="muted small">Останется у вас за ' + p.months + ' ' + F.monthsWord(p.months) + '</div>' +
          '<div class="reserve-big good num">' + money(p.saved) + '</div><div class="muted small" style="margin-top:6px">по сравнению с ' + h(vsText(R.baseline.id)) + '</div></div>' +
          '<div class="ring" role="img" aria-label="Цель резерва: ' + Math.round(prog * 100) + '%"><svg viewBox="0 0 104 104"><circle class="ring-track" cx="52" cy="52" r="46"/><circle class="ring-fill" cx="52" cy="52" r="46" stroke-dasharray="' + C + '" stroke-dashoffset="' + (C * (1 - prog)) + '"/></svg>' +
          '<div class="ring-center"><div><b>' + Math.round(prog * 100) + '%</b>цели</div></div></div></div>' +
          '<div class="list" style="margin-top:16px">' + li('Доля расходов на жильё', num(p.pct, 1) + '%') + li('Это месяцев проживания', num(p.monthsOfLiving, 1)) +
          li('Если держать на вкладе', money(p.withYield), 'ставка ' + num(rs.rate, 1) + '% — ваша оценка, не обещание') +
          li('Цель резерва', money(rs.goal), rs.goalMonths + ' ' + F.monthsWord(rs.goalMonths) + ' жилья · ' + (rs.reachMonth ? 'наберёте за ' + rs.reachMonth + ' ' + F.monthsWord(rs.reachMonth) : 'за 5 лет не набирается')) + '</div>' +
          '<h3 class="group-title">Как превратить экономию в резерв</h3><div class="list list-pad"><ol class="steps">' +
          '<li>В день оплаты жилья переводите <b>' + money(Math.max(0, rs.monthly)) + '</b> на отдельный накопительный счёт.</li>' +
          '<li>Не трогайте, пока не наберёте ' + money(rs.goal) + '.</li>' +
          '<li>Сверх цели — решайте сами: вклад, досрочные платежи или покупка без долгов.</li></ol></div>' +
          '<h3 class="group-title">Параметры</h3><div class="group">' +
          frow('Ставка вклада', stepper('finance.rate', 0.5, 0, 100, 'pct', 'Ставка вклада'), 'годовых') +
          frow('Цель резерва', stepper('finance.reserveGoalMonths', 1, 0, 36, 'months', 'Цель резерва'), 'месяцев жилья') + '</div>';
      }
    };
  }

  /* ── лист: что важнее ── */
  function prioritySheet() {
    return {
      title: 'Что для вас важнее',
      dynamic: true,
      render: function () {
        return '<p class="card-sub" style="margin:2px 2px 12px">От приоритета зависит, какой вариант BASE назовёт лучшим. Стоимость считается одинаково.</p>' +
          '<div class="list">' + F.PRIORITY_IDS.map(function (p) {
            var s = F.clone(state); s.priority = p;
            var r = F.compute(s, { light: true });
            var on = R.state.priority === p;
            return '<button type="button" class="li li-btn choice' + (on ? ' on' : '') + '" data-act="pick" data-path="priority" data-value="' + p + '" aria-pressed="' + on + '">' +
              '<span class="li-label">' + h(F.PRIORITIES[p].label) + '<small>' + h(PRIORITY_NOTE[p]) + '</small></span>' +
              '<span class="li-value">' + (r.best ? '<i class="dot" style="--c:' + optColor(r.best.id) + '"></i>' + h(r.best.short) : '—') + (on ? I.check : '') + '</span></button>';
          }).join('') + '</div>' +
          '<button type="button" class="link-btn" style="margin-top:12px" data-act="scoring">Как считается оценка</button>';
      }
    };
  }

  /* ── лист: с чем сравнивать ── */
  function baselineSheet() {
    return {
      title: 'С чем сравнивать',
      dynamic: true,
      render: function () {
        var ids = OPT.slice().sort(function (a, b) { return R.options[b].avg - R.options[a].avg; });
        var m = R.best ? answerModel(R) : null, b = R.best, base = R.baseline;
        var calc = '';
        if (m && b && base) {
          var vsR = R.savings.same && R.savings.nextId ? R.options[R.savings.nextId] : base;
          calc = '<div class="calc-hero"><div class="row-between"><span><i class="dot" style="--c:' + optColor(vsR.id) + '"></i> ' + h(vsR.short) + '</span><b class="num">' + money(vsR.avg) + '</b></div>' +
            '<div class="row-between"><span><i class="dot" style="--c:' + optColor(b.id) + '"></i> ' + h(b.short) + '</span><b class="num">− ' + money(b.avg) + '</b></div>' +
            '<div class="row-between total"><span>' + h(m.label) + '</span><b class="num">' + money(m.val) + '</b></div>' +
            '<p>Средний месяц за ' + R.H + ' ' + F.monthsWord(R.H) + ', с комиссиями и сборами. Возвратный залог не расход.</p></div>';
        }
        return calc + '<p class="card-sub" style="margin:2px 2px 12px">Экономия на главном экране считается относительно выбранного варианта.</p>' +
          '<div class="list">' + ids.map(function (id) {
            var on = R.state.baselineId === id, r = R.options[id];
            return '<button type="button" class="li li-btn choice' + (on ? ' on' : '') + '" data-act="pick" data-path="baselineId" data-value="' + id + '" aria-pressed="' + on + '">' +
              '<span class="li-label"><span class="row"><i class="dot" style="--c:' + optColor(id) + '"></i>' + h(r.name) + '</span><small>' + (R.state.options[id].enabled ? typeLabel(r.type) : 'выключен в сравнении') + '</small></span>' +
              '<span class="li-value num">' + money(r.avg) + (on ? I.check : '') + '</span></button>';
          }).join('') + '</div>';
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
    share: function () { shareDecision(); },
    viewOption: function (el) { openSheet(optionViewSheet(el.getAttribute('data-id'))); },
    advice: function () { openSheet(adviceSheet()); },
    reserve: function () { openSheet(reserveSheet()); },
    priority: function () { openSheet(prioritySheet()); },
    baseline: function () { openSheet(baselineSheet()); },
    pick: function (el) {
      setPath(state, el.getAttribute('data-path'), el.getAttribute('data-value'));
      commit();
      setTimeout(closeSheet, reduceMotion() ? 0 : 160);
    },
    reserveK: function (el) { ui.reserveK = +el.getAttribute('data-k'); if (sheet) refreshSheet(); else render(); },
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
    var s = String(str).replace(/[\s\u00a0\u202f]/g, '').replace(',', '.');
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
    rsT = setTimeout(function () { var hv = document.getElementById('view-home'); if (hv) hv.removeAttribute('data-shape'); render(); }, 120);
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
