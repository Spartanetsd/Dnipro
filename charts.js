/*!
 * BASE — charts.js
 * Собственные лёгкие графики на SVG/HTML без внешних библиотек:
 * линии (с перекрестием и подсказками по касанию), сгруппированные столбцы,
 * горизонтальные столбцы влияния, структура расходов и мини-лента платежей.
 * Цвета задаются CSS-переменными, поэтому тема меняется без перерисовки.
 */
(function (root) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function svgEl(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    return e;
  }
  function niceStep(range, count) {
    var raw = range / Math.max(1, count);
    var mag = Math.pow(10, Math.floor(Math.log10(raw || 1)));
    var n = raw / mag;
    var s = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return s * mag;
  }
  function ticks(min, max, count) {
    if (max - min < 1e-9) { max = min + 1; }
    var step = niceStep(max - min, count || 4);
    var lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
    var out = [];
    for (var v = lo; v <= hi + step / 2; v += step) out.push(Math.round(v * 1e6) / 1e6);
    return out;
  }
  function compact(n) {
    var a = Math.abs(n), sign = n < 0 ? '−' : '';
    if (a >= 1e6) return sign + (Math.round(a / 1e5) / 10).toString().replace('.', ',') + ' млн';
    if (a >= 1e4) return sign + Math.round(a / 1e3) + ' тыс';
    if (a >= 1e3) return sign + (Math.round(a / 100) / 10).toString().replace('.', ',') + ' тыс';
    return sign + Math.round(a);
  }

  /* Общая подсказка: div внутри контейнера графика. */
  function makeTip(el) {
    var tip = el.querySelector('.chart-tip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'chart-tip'; tip.setAttribute('aria-hidden', 'true'); el.appendChild(tip); }
    return {
      show: function (html, x, W, top) {
        tip.innerHTML = html;
        tip.classList.add('on');
        var w = tip.offsetWidth || 160;
        var left = Math.max(w / 2 + 2, Math.min(W - w / 2 - 2, x));
        tip.style.left = left + 'px';
        tip.style.top = (top || 0) + 'px';
      },
      hide: function () { tip.classList.remove('on'); }
    };
  }
  function tipRows(rows) {
    return rows.map(function (r) {
      return '<div class="tip-row"><span>' + (r.color ? '<i class="dot" style="--c:' + r.color + ';width:8px;height:8px"></i>' : '') + esc(r.label) + '</span><span>' + esc(r.value) + '</span></div>';
    }).join('');
  }

  /* Закрытие подсказок касанием вне графика (на телефоне нет «ухода» мыши). */
  var openTips = [];
  if (typeof document !== 'undefined') {
    document.addEventListener('pointerdown', function (e) {
      openTips = openTips.filter(function (t) {
        if (!t.el.isConnected) return false;
        if (!t.el.contains(e.target)) { t.hide(); return false; }
        return true;
      });
    }, true);
  }

  /* ─────────────── линейный график ─────────────── */
  function line(el, cfg) {
    el.innerHTML = '';
    el.classList.add('chart');
    var W = Math.max(260, el.clientWidth || 340);
    var H = cfg.height || 220;
    var series = cfg.series.filter(function (s) { return s.values && s.values.length; });
    var n = cfg.xValues ? cfg.xValues.length : (cfg.xLabels || []).length;
    if (!series.length || !n) { el.innerHTML = '<p class="muted small">Нет данных для графика.</p>'; return; }
    var endLabels = cfg.endLabels && series.length <= 4 && W >= 300;
    var pad = { l: 46, r: endLabels ? 64 : 14, t: cfg.vline ? 22 : 12, b: 28 };
    var pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
    var all = [];
    series.forEach(function (s) { s.values.forEach(function (v) { if (isFinite(v)) all.push(v); }); });
    (cfg.extraY || []).forEach(function (v) { all.push(v); });
    var ymin = cfg.zeroBased === false ? Math.min.apply(null, all) : Math.min(0, Math.min.apply(null, all));
    var ymax = Math.max.apply(null, all);
    var yt = ticks(ymin, ymax, 4);
    var y0 = yt[0], y1 = yt[yt.length - 1];
    var numeric = !!cfg.xValues;
    var xmin = numeric ? cfg.xValues[0] : 0, xmax = numeric ? cfg.xValues[n - 1] : n - 1;
    function X(i) {
      var v = numeric ? cfg.xValues[i] : i;
      return pad.l + (xmax === xmin ? pw / 2 : (v - xmin) / (xmax - xmin) * pw);
    }
    function XV(v) { return pad.l + (xmax === xmin ? pw / 2 : (v - xmin) / (xmax - xmin) * pw); }
    function Y(v) { return pad.t + ph - (v - y0) / (y1 - y0 || 1) * ph; }

    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'aria-label': cfg.ariaLabel || 'График' });
    // сетка и подписи оси Y
    yt.forEach(function (t) {
      svg.appendChild(svgEl('line', { x1: pad.l, x2: pad.l + pw, y1: Y(t), y2: Y(t), class: t === 0 ? 'axis' : 'grid' }));
      var tx = svgEl('text', { x: pad.l - 8, y: Y(t) + 4, 'text-anchor': 'end' });
      tx.textContent = (cfg.axisFmt || compact)(t);
      svg.appendChild(tx);
    });
    // подписи оси X
    if (numeric) {
      ticks(xmin, xmax, Math.max(2, Math.floor(pw / 70))).forEach(function (t) {
        if (t < xmin - 1e-9 || t > xmax + 1e-9) return;
        var tx = svgEl('text', { x: XV(t), y: H - 8, 'text-anchor': 'middle' });
        tx.textContent = (cfg.xFmt || compact)(t);
        svg.appendChild(tx);
      });
    } else {
      var maxLabels = Math.max(2, Math.floor(pw / 44));
      var step = Math.max(1, Math.ceil(n / maxLabels));
      for (var i = 0; i < n; i += step) {
        var tx = svgEl('text', { x: X(i), y: H - 8, 'text-anchor': n === 1 ? 'middle' : (i === 0 ? 'start' : 'middle') });
        tx.textContent = cfg.xLabels[i];
        svg.appendChild(tx);
      }
      if ((n - 1) % step !== 0 && n > 1) {
        var tl = svgEl('text', { x: X(n - 1), y: H - 8, 'text-anchor': 'end' });
        tl.textContent = cfg.xLabels[n - 1];
        svg.appendChild(tl);
      }
    }
    if (cfg.xTitle) {
      var xt = svgEl('text', { x: pad.l + pw, y: H - 8 - 14, 'text-anchor': 'end' });
      xt.textContent = cfg.xTitle;
      svg.appendChild(xt);
    }
    // вертикальная отметка (например, текущая цена)
    if (cfg.vline && isFinite(cfg.vline.x) && cfg.vline.x >= xmin && cfg.vline.x <= xmax) {
      var vx = XV(cfg.vline.x);
      svg.appendChild(svgEl('line', { x1: vx, x2: vx, y1: pad.t - 6, y2: pad.t + ph, class: 'guide' }));
      var vt = svgEl('text', { x: vx, y: pad.t - 10, 'text-anchor': vx > pad.l + pw * 0.75 ? 'end' : vx < pad.l + pw * 0.25 ? 'start' : 'middle', class: 't-ink-2' });
      vt.textContent = cfg.vline.label;
      svg.appendChild(vt);
    }
    // линии
    series.forEach(function (s) {
      var d = '';
      s.values.forEach(function (v, i) { d += (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); });
      if (n === 1) d += 'L' + (X(0) + 0.1) + ' ' + Y(s.values[0]);
      svg.appendChild(svgEl('path', { d: d, fill: 'none', style: 'stroke:' + s.color + ';stroke-width:2;stroke-linecap:round;stroke-linejoin:round' + (s.dashed ? ';stroke-dasharray:5 4' : '') }));
    });
    // концевые точки и подписи
    var ends = series.map(function (s) { return { s: s, y: Y(s.values[n - 1]) }; }).sort(function (a, b) { return a.y - b.y; });
    var collide = false;
    for (var k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 13) collide = true;
    series.forEach(function (s) {
      svg.appendChild(svgEl('circle', { cx: X(n - 1), cy: Y(s.values[n - 1]), r: 4, style: 'fill:' + s.color + ';stroke:var(--chart-surface);stroke-width:2' }));
    });
    if (endLabels && !collide) {
      ends.forEach(function (e) {
        var t = svgEl('text', { x: X(n - 1) + 8, y: e.y + 4, class: 't-ink-2' });
        t.textContent = compact(e.s.values[n - 1]);
        svg.appendChild(t);
      });
    }
    // маркеры (точки пересечения)
    (cfg.markers || []).forEach(function (m) {
      if (!isFinite(m.x) || !isFinite(m.y) || m.x < xmin || m.x > xmax) return;
      var mx = XV(m.x), my = Y(m.y);
      svg.appendChild(svgEl('circle', { cx: mx, cy: my, r: 5.5, style: 'fill:var(--chart-surface);stroke:' + (m.color || 'var(--ink)') + ';stroke-width:2.4' }));
      if (m.label) {
        var t = svgEl('text', { x: mx, y: my - 11, 'text-anchor': mx > pad.l + pw * 0.8 ? 'end' : mx < pad.l + pw * 0.2 ? 'start' : 'middle', class: 't-ink' });
        t.textContent = m.label;
        svg.appendChild(t);
      }
    });

    // слой взаимодействия
    var guide = svgEl('line', { y1: pad.t, y2: pad.t + ph, class: 'guide', visibility: 'hidden' });
    svg.appendChild(guide);
    var dots = series.map(function (s) {
      var c = svgEl('circle', { r: 4.5, visibility: 'hidden', style: 'fill:' + s.color + ';stroke:var(--chart-surface);stroke-width:2' });
      svg.appendChild(c);
      return c;
    });
    var hit = svgEl('rect', { x: pad.l - 10, y: 0, width: pw + 20, height: H, class: 'hit' });
    svg.appendChild(hit);
    el.appendChild(svg);
    el.tabIndex = 0;
    var tip = makeTip(el);
    var cur = -1;
    var tipCtl = { el: el, hide: hideAll };
    function nearest(px) {
      var best = 0, bd = Infinity;
      for (var i = 0; i < n; i++) { var d = Math.abs(X(i) - px); if (d < bd) { bd = d; best = i; } }
      return best;
    }
    function showAt(i) {
      cur = i;
      var x = X(i);
      guide.setAttribute('x1', x); guide.setAttribute('x2', x); guide.setAttribute('visibility', 'visible');
      series.forEach(function (s, j) { dots[j].setAttribute('cx', x); dots[j].setAttribute('cy', Y(s.values[i])); dots[j].setAttribute('visibility', 'visible'); });
      var title = cfg.tipTitle ? cfg.tipTitle(i) : (cfg.xLabels ? cfg.xLabels[i] : '');
      var rows = series.map(function (s) { return { label: s.name, value: (cfg.yFmt || compact)(s.values[i]), color: s.color, v: s.values[i] }; });
      if (cfg.sortTip !== false) rows.sort(function (a, b) { return a.v - b.v; });
      tip.show('<b>' + esc(title) + '</b>' + tipRows(rows), x, W, 0);
      if (openTips.indexOf(tipCtl) < 0) openTips.push(tipCtl);
    }
    function hideAll() {
      cur = -1; guide.setAttribute('visibility', 'hidden'); dots.forEach(function (d) { d.setAttribute('visibility', 'hidden'); }); tip.hide();
    }
    function pos(e) { var r = svg.getBoundingClientRect(); return (e.clientX - r.left) * (W / r.width); }
    hit.addEventListener('pointermove', function (e) { showAt(nearest(pos(e))); });
    hit.addEventListener('pointerdown', function (e) { showAt(nearest(pos(e))); });
    hit.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hideAll(); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        var i = cur < 0 ? (e.key === 'ArrowRight' ? 0 : n - 1) : Math.max(0, Math.min(n - 1, cur + (e.key === 'ArrowRight' ? 1 : -1)));
        showAt(i);
      } else if (e.key === 'Escape') hideAll();
    });
    el.addEventListener('blur', hideAll);
  }

  /* ─────────────── сгруппированные столбцы ─────────────── */
  function bars(el, cfg) {
    el.innerHTML = '';
    el.classList.add('chart');
    var W = Math.max(260, el.clientWidth || 340), H = cfg.height || 220;
    var G = cfg.groups.length, S = cfg.series.length;
    if (!G || !S) { el.innerHTML = '<p class="muted small">Нет данных для графика.</p>'; return; }
    var pad = { l: 46, r: 8, t: 12, b: 34 };
    var pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
    var all = [0];
    cfg.series.forEach(function (s) { s.values.forEach(function (v) { all.push(v); }); });
    var yt = ticks(0, Math.max.apply(null, all), 4);
    var y1 = yt[yt.length - 1];
    function Y(v) { return pad.t + ph - v / (y1 || 1) * ph; }
    var gw = pw / G;
    var bw = Math.min(24, Math.max(6, (gw * 0.78 - (S - 1) * 2) / S));
    var inner = S * bw + (S - 1) * 2;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'aria-label': cfg.ariaLabel || 'Столбчатая диаграмма' });
    yt.forEach(function (t) {
      svg.appendChild(svgEl('line', { x1: pad.l, x2: pad.l + pw, y1: Y(t), y2: Y(t), class: t === 0 ? 'axis' : 'grid' }));
      var tx = svgEl('text', { x: pad.l - 8, y: Y(t) + 4, 'text-anchor': 'end' });
      tx.textContent = compact(t);
      svg.appendChild(tx);
    });
    var hl = svgEl('rect', { y: pad.t - 4, height: ph + 4, rx: 10, style: 'fill:var(--card-2)', visibility: 'hidden' });
    svg.insertBefore(hl, svg.firstChild);
    cfg.groups.forEach(function (g, gi) {
      var gx = pad.l + gi * gw + (gw - inner) / 2;
      if (cfg.highlightGroup === gi) {
        svg.insertBefore(svgEl('rect', { x: pad.l + gi * gw + 3, y: pad.t - 4, width: gw - 6, height: ph + 4, rx: 10, style: 'fill:var(--card-2)' }), svg.firstChild);
      }
      cfg.series.forEach(function (s, si) {
        var v = s.values[gi];
        var x = gx + si * (bw + 2), y = Y(v), h = Math.max(0, pad.t + ph - y);
        var r = Math.min(4, h, bw / 2);
        var d = 'M' + x + ' ' + (pad.t + ph) + 'V' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'H' + (x + bw - r) + 'Q' + (x + bw) + ' ' + y + ' ' + (x + bw) + ' ' + (y + r) + 'V' + (pad.t + ph) + 'Z';
        if (h > 0.5) svg.appendChild(svgEl('path', { d: d, style: 'fill:' + s.color }));
      });
      var t = svgEl('text', { x: pad.l + gi * gw + gw / 2, y: H - 12, 'text-anchor': 'middle', class: cfg.highlightGroup === gi ? 't-ink' : '' });
      t.textContent = g;
      svg.appendChild(t);
    });
    var tip = makeTip(el);
    var tipCtl = { el: el, hide: function () { tip.hide(); hl.setAttribute('visibility', 'hidden'); } };
    cfg.groups.forEach(function (g, gi) {
      var hit = svgEl('rect', { x: pad.l + gi * gw, y: 0, width: gw, height: H, class: 'hit' });
      function show() {
        hl.setAttribute('x', pad.l + gi * gw + 3); hl.setAttribute('width', gw - 6); hl.setAttribute('visibility', 'visible');
        var rows = cfg.series.map(function (s) { return { label: s.name, value: (cfg.yFmt || compact)(s.values[gi]), color: s.color }; });
        tip.show('<b>' + esc(cfg.groupTitle ? cfg.groupTitle(gi) : g) + '</b>' + tipRows(rows), pad.l + gi * gw + gw / 2, W, 0);
        if (openTips.indexOf(tipCtl) < 0) openTips.push(tipCtl);
      }
      hit.addEventListener('pointerdown', show);
      hit.addEventListener('pointermove', show);
      hit.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') tipCtl.hide(); });
      svg.appendChild(hit);
    });
    el.appendChild(svg);
  }

  /* ─────────────── горизонтальные столбцы влияния (±) ─────────────── */
  function impact(el, cfg) {
    var rows = cfg.rows;
    var maxAbs = Math.max.apply(null, rows.map(function (r) { return Math.abs(r.value); }).concat([1]));
    el.innerHTML = '<div class="hb">' + rows.map(function (r) {
      var w = Math.abs(r.value) / maxAbs * 50;
      var left = r.value < 0 ? 50 - w : 50;
      var cls = r.value < -0.5 ? 'down' : r.value > 0.5 ? 'up' : 'zero';
      return '<button type="button" class="hb-row' + (r.highlight ? ' hl' : '') + (r.selected ? ' sel' : '') + '" data-sc="' + esc(r.id) + '">' +
        '<span class="hb-label">' + esc(r.label) + (r.highlight ? ' <em class="badge warn">сильнее всего</em>' : '') + (r.current ? ' <em class="badge">сейчас</em>' : '') + '</span>' +
        '<span class="hb-track"><i class="hb-zero"></i><i class="hb-bar ' + cls + '" style="left:' + left + '%;width:' + Math.max(w, cls === 'zero' ? 0 : 0.8) + '%"></i></span>' +
        '<span class="hb-val ' + cls + '">' + esc(cfg.fmt(r.value)) + '</span></button>';
    }).join('') + '</div>';
  }

  /* ─────────────── структура расходов (100% полосы) ─────────────── */
  function stack(el, cfg) {
    var maxTotal = Math.max.apply(null, cfg.rows.map(function (r) { return r.total; }).concat([1]));
    var html = '<div class="st">';
    cfg.rows.forEach(function (r, ri) {
      html += '<div class="st-row"><div class="st-head"><span>' + esc(r.name) + '</span><b>' + esc(cfg.fmt(r.total)) + '</b></div>' +
        '<div class="st-bar" style="width:' + Math.max(2, r.total / maxTotal * 100) + '%">';
      r.parts.forEach(function (p, pi) {
        if (p.value <= 0) return;
        html += '<button type="button" class="st-seg" data-r="' + ri + '" data-p="' + pi + '" style="flex:' + p.value + ' 1 0;background:' + p.color + '" aria-label="' + esc(r.name + ': ' + p.label + ' ' + cfg.fmt(p.value)) + '"></button>';
      });
      html += '</div></div>';
    });
    html += '</div><div class="st-read" aria-live="polite">' + esc(cfg.hint || 'Коснитесь части полосы, чтобы увидеть сумму') + '</div>';
    el.innerHTML = html;
    var read = el.querySelector('.st-read');
    el.querySelectorAll('.st-seg').forEach(function (b) {
      function show() {
        var r = cfg.rows[+b.dataset.r], p = r.parts[+b.dataset.p];
        el.querySelectorAll('.st-seg.on').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        read.innerHTML = '<i class="dot" style="--c:' + p.color + '"></i><span><b>' + esc(r.name) + '</b> · ' + esc(p.label) + ': ' + esc(cfg.fmt(p.value)) + ' в месяц (' + Math.round(p.value / (r.total || 1) * 100) + '%)</span>';
      }
      b.addEventListener('click', show);
      b.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') show(); });
    });
  }

  /* ─────────────── мини-лента платежей ─────────────── */
  function flow(el, cfg) {
    el.innerHTML = '';
    el.classList.add('chart');
    var W = Math.max(260, el.clientWidth || 340), H = cfg.height || 132;
    var n = cfg.values.length;
    var pad = { l: 4, r: 4, t: 18, b: 34 };
    var pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
    var max = Math.max.apply(null, cfg.values.concat([1]));
    var gw = pw / n, bw = Math.min(24, Math.max(5, gw - 4));
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'aria-label': 'Платежи по месяцам' });
    svg.appendChild(svgEl('line', { x1: pad.l, x2: pad.l + pw, y1: pad.t + ph, y2: pad.t + ph, class: 'axis' }));
    var labelStep = Math.max(1, Math.ceil(n / Math.floor(pw / 30)));
    cfg.values.forEach(function (v, i) {
      var x = pad.l + i * gw + (gw - bw) / 2;
      var h = v / max * ph, y = pad.t + ph - h;
      var r = Math.min(4, h, bw / 2);
      var sel = i === cfg.selected;
      if (h > 0.5) {
        var d = 'M' + x + ' ' + (pad.t + ph) + 'V' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'H' + (x + bw - r) + 'Q' + (x + bw) + ' ' + y + ' ' + (x + bw) + ' ' + (y + r) + 'V' + (pad.t + ph) + 'Z';
        svg.appendChild(svgEl('path', { d: d, style: 'fill:' + (sel ? cfg.color : 'var(--card-3)') + (sel ? '' : ';stroke:none') }));
      }
      if (sel && v > 0) {
        var vt = svgEl('text', { x: x + bw / 2, y: y - 6, 'text-anchor': i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle', class: 't-ink' });
        vt.textContent = compact(v);
        svg.appendChild(vt);
      }
      if (cfg.refunds && cfg.refunds[i] > 0) {
        var c = svgEl('path', { d: 'M' + (x + bw / 2 - 4) + ' ' + (pad.t + ph + 9) + 'l4 -4 4 4', style: 'fill:none;stroke:var(--ink-2);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round' });
        svg.appendChild(c);
      }
      if (i % labelStep === 0 || sel) {
        var t = svgEl('text', { x: x + bw / 2, y: H - 6, 'text-anchor': 'middle', class: sel ? 't-ink' : '' });
        t.textContent = cfg.labels[i];
        svg.appendChild(t);
      }
      var hit = svgEl('rect', { x: pad.l + i * gw, y: 0, width: gw, height: H, class: 'hit', role: 'button', 'aria-label': cfg.labels[i] });
      hit.addEventListener('click', function () { cfg.onSelect(i); });
      svg.appendChild(hit);
    });
    el.appendChild(svg);
    el.tabIndex = 0;
    el.onkeydown = function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); cfg.onSelect(Math.min(n - 1, cfg.selected + 1)); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); cfg.onSelect(Math.max(0, cfg.selected - 1)); }
    };
  }

  root.BaseCharts = { line: line, bars: bars, impact: impact, stack: stack, flow: flow, compact: compact, ticks: ticks };
})(typeof self !== 'undefined' ? self : this);
