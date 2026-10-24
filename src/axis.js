  /* 축 차트 공통(라인 · 막대): 머리와 범례, 세로축 눈금 3–4개(단위는 맨 위 눈금에만)와 옅은 실선 격자, 다섯 개 안팎으로 솎아 낸 기간 이름,
     오른쪽 끝 이름, 툴팁 내용, 화면 낭독기용 값 표. 선과 막대 모양은 각자의 그리기(paint)가 맡습니다. */

  // 세로축 눈금: 1 · 2 · 2.5 · 5 단위의 끝수 없는 값으로 범위를 감쌉니다(눈금이 3–4개뿐이라 2.5 단위를 더해 범위가 덜 헐거워지게 합니다).
  // 높이에 맞는 눈금 수(3개부터 most개까지) 가운데 값이 높이를 가장 많이 쓰는 간격을 고릅니다.
  function yTicks(min, max, most) {
    if (min === max) { const pad = Math.abs(min) * 0.1 || 1; min -= pad; max += pad; }
    let best = null;
    const e0 = Math.floor(Math.log10((max - min) / most)) - 1;
    for (let e = e0; e <= e0 + 3; e++) {
      for (const m of [1, 2, 2.5, 5]) {
        const step = m * Math.pow(10, e);
        const lo = Math.floor(min / step + 1e-9) * step, hi = Math.ceil(max / step - 1e-9) * step;
        const n = Math.round((hi - lo) / step) + 1;
        if (n < 3 || n > most) continue;
        const score = (max - min) / (hi - lo) - 0.04 * n;
        if (!best || score > best.score) best = { lo, hi, step, n, score };
      }
    }
    return best || { lo: min, hi: max, step: max - min, n: 2 };
  }
  // 눈금 간격에 필요한 소수 자릿수(2.5 단위는 한 자리 더)
  function stepDec(step) {
    for (let k = 0; k < 6; k++) { const v = step * Math.pow(10, k); if (Math.abs(v - Math.round(v)) < 1e-6) return k; }
    return 6;
  }
  // 눈금 글자: 단위를 붙이되 짧게 적습니다. 원 단위 값은 가장 큰 눈금에 맞춘 한 단위(조 · 억 · 만)로 통일하고, 음수는 빼기 기호(−)로 적습니다.
  function tickText(d, dec, step, top) {
    const t = tickRaw(d, dec, step, top);
    return (v) => t(v).replace(/^-/, '−');
  }
  function tickRaw(d, dec, step, top) {
    switch (d.format) {
      case 'eok': return (v) => `${num(v, dec)}억`;
      case 'krw': {
        const [div, u] = top >= 1e12 ? [1e12, '조'] : top >= 1e8 ? [1e8, '억'] : top >= 1e4 ? [1e4, '만'] : [1, '원'];
        const dd = Math.max(0, -Math.floor(Math.log10(step / div) + 1e-9));
        return (v) => `${num(v / div, dd)}${u}`;
      }
      case 'usd': {
        // 달러는 가장 큰 눈금에 맞춘 한 단위(B · M · K)로 통일합니다($150K).
        const [div, u] = top >= 1e9 ? [1e9, 'B'] : top >= 1e6 ? [1e6, 'M'] : top >= 1e3 ? [1e3, 'K'] : [1, ''];
        const dd = Math.max(0, -Math.floor(Math.log10(step / div) + 1e-9));
        return (v) => `${v < 0 ? '-' : ''}$${num(Math.abs(v) / div, dd)}${u}`;
      }
      case 'pct': return (v) => `${num(v, dec)}%`;
      case 'days': return (v) => `${num(v, dec)}일`;
      default: {
        // 개수는 unit을 붙이고, 10만이 넘으면 만 단위로 줄여 적습니다(150,000건 → 15만건).
        const u = d.unit || '';
        if (top < 1e5) return (v) => `${num(v, dec)}${u}`;
        const dd = stepDec(step / 1e4);
        return (v) => `${num(v / 1e4, dd)}만${u}`;
      }
    }
  }
  function lastIdx(vals, n) {
    for (let i = Math.min(vals.length, n) - 1; i >= 0; i--) if (vals[i] != null) return i;
    return -1;
  }

  // cfg: series [{ name, values, tone }] — tone은 색 이름(t1 · t2 · t3 선, f1 · f2 · f3 막대, t0 · f0 비교 회색 등)입니다.
  //   paint { gutter(S, c), draw(svg, c, S) → 선 끝 글자의 높이 목록, mark(i, c, S, back, front) } · band(기간마다 칸)
  //   legend(범례, legendEl 참고) · top(머리 아래 요소) · extra(세로축에 넣을 값) · zero(0을 축에 넣기)
  //   stack(쌓은 합으로 범위) · headroom(값 범위 위아래 여유, 범위에 대한 비율) · padTop · side [{ value, lines }](오른쪽 끝 이름) · under, over(svg, c) 덧그림
  //   tip(순번) → { value, note } 또는 { rows, note } · sort(툴팁을 값이 큰 순서로) · f, fmt(값과 눈금 표기)
  // 돌려주는 show(cfg 일부)로 같은 카드에 다른 지표를 다시 그립니다(탭 카드).
  function axisCard(card, d, f, cfg) {
    const labels = d.labels || [], n = labels.length;
    head(card, d, f, null);
    if (cfg.top) card.append(cfg.top);
    if (cfg.legend) card.append(legendEl(cfg.legend));
    const foot = el('div', 'vzb-foot vzb-fill vzb-ax');
    const plot = el('div', 'vzb-plot');
    plot.tabIndex = 0;
    plot.setAttribute('role', 'img');
    const svg = svgEl('svg', { class: 'vzb-ax-svg', 'aria-hidden': 'true' });
    plot.append(svg);
    foot.append(plot);
    card.append(foot);
    const sr = el('div', 'vzb-sr');
    card.append(sr);
    const fam = getComputedStyle(card).fontFamily;
    const c = { labels, n, fam };
    let S, back, front, lastW = 0, lastH = 0;

    // 그릴 지표를 정합니다. 값 범위, 마지막 기간, 화면 낭독기용 표를 다시 만듭니다.
    function use(next) {
      S = Object.assign({ f, fmt: d, curve: d.curve }, cfg, next);
      const vals = [];
      S.series.forEach((s) => s.values.slice(0, n).forEach((v) => { if (v != null && isFinite(v)) vals.push(+v); }));
      if (S.stack) {
        for (let i = 0; i < n; i++) {
          let pos = 0, neg = 0;
          S.series.forEach((s) => { const v = s.values[i]; if (v > 0) pos += +v; else if (v < 0) neg += +v; });
          vals.push(pos, neg);
        }
      }
      (S.extra || []).forEach((v) => { if (v != null && isFinite(v)) vals.push(+v); });
      if (S.zero) vals.push(0);
      if (!n || !vals.length) throw new Error('labels와 values(또는 series)를 확인하세요.');
      S.vmin = Math.min(...vals);
      S.vmax = Math.max(...vals);
      // 선 차트는 값 범위 위아래에 여유를 두어 선이 그래프 가운데에 머물게 합니다. 0 이상인 값은 0 아래로 내려가지 않습니다.
      if (S.headroom && S.vmax > S.vmin) {
        const pad = (S.vmax - S.vmin) * S.headroom, lo = S.vmin - pad;
        S.vmin = S.vmin >= 0 && lo < 0 ? 0 : lo;
        S.vmax += pad;
      }
      const first = S.series[0] ? lastIdx(S.series[0].values, n) : -1;   // 첫 선(현재)의 마지막 기간
      S.latest = first >= 0 ? first : Math.max(-1, ...S.series.map((s) => lastIdx(s.values, n)));
      plot.setAttribute('aria-label', `${S.name || d.title || ''} ${S.kind || '차트'}, ${labels[0] || ''}–${labels[n - 1] || ''}. 좌우 화살표로 기간을 옮깁니다. 모든 값은 이어지는 표에 있습니다.`);
      const table = el('table');
      const hr = el('tr');
      hr.append(el('th', null, '기간'));
      S.series.forEach((s) => hr.append(el('th', null, s.name)));
      table.append(el('caption', null, S.name || d.title || ''), hr);
      labels.forEach((l, i) => {
        const tr = el('tr');
        tr.append(el('th', null, l));
        S.series.forEach((s) => tr.append(el('td', null, s.values[i] == null ? '' : show(S.f, s.values[i]))));
        table.append(tr);
      });
      sr.replaceChildren(table);
    }
    use({});

    function draw(w, h) {
      lastW = w; lastH = h;
      const top = S.padTop || 8;
      const sides = (S.side || []).filter((m) => isFinite(m.value));
      const ends = S.paint.gutter(S, c);
      const endW = Math.max(0, ...ends.map((s) => textW(s, 500, fam)), ...sides.map((m) => Math.max(...m.lines.map((l) => textW(l, 500, fam)))));
      const labW = Math.max(...labels.map((l) => textW(l, 400, fam)));
      // 눈금과 가로 배치: 바닥(base)에 따라 눈금 수와 눈금 글자 폭이 바뀌므로 함께 계산합니다.
      const layout = (base) => {
        const t = yTicks(S.vmin, S.vmax, Math.max(3, Math.min(4, Math.floor((base - top) / 28) + 1)));
        const dec = stepDec(t.step), ticks = [];
        for (let k = 0; k < t.n; k++) ticks.push(+(t.lo + k * t.step).toFixed(dec));
        const tt = tickText(S.fmt, dec, t.step, Math.max(...ticks.map(Math.abs)));
        // 단위(억 · % · 만 · $ 등)는 맨 위 눈금에만 붙이고, 나머지 눈금은 숫자만 적습니다.
        const tickLabel = ticks.map((v, k) => (k === ticks.length - 1 ? tt(v) : tt(v).replace(/[^\d.,−]+$/, '').replace(/^(−?)\$/, '$1')));
        const gut = Math.ceil(Math.max(...tickLabel.map((s) => textW(s, 400, fam)))) + 10;
        const x0 = gut + 4, right = w - Math.max(endW ? endW + 14 : 0, S.band ? 4 : labW / 2 + 1, 8);
        const step = S.band ? (right - x0) / Math.max(1, n) : (right - x0) / Math.max(1, n - 1);
        return { base, t, ticks, tickLabel, gut, x0, right, step };
      };
      // 항목 축(categorical)의 이름이 한 줄에 다 들어가지 않으면 솎아 내지 않고 두 줄로 엇갈려 적습니다(바닥을 14px 올립니다).
      let L = layout(h - 24);
      const stagger = !!S.categorical && n > 1 && labW + 6 > L.step;
      if (stagger) L = layout(h - 38);
      const { base, t, ticks, tickLabel, gut, x0, right } = L, bottom = base;
      c.step = L.step;
      c.xs = labels.map((_, i) => (S.band ? x0 + c.step * (i + 0.5) : n < 2 ? (x0 + right) / 2 : x0 + i * c.step));
      c.y = (v) => bottom - ((v - t.lo) / (t.hi - t.lo)) * (bottom - top);
      Object.assign(c, { w, h, top, bottom, left: x0, right });
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.replaceChildren();
      ticks.forEach((v, k) => {
        const y = Math.round(c.y(v)) + 0.5;
        svg.append(svgEl('line', { x1: gut, x2: right, y1: y, y2: y, class: v === 0 ? 'vzb-ax-zero' : 'vzb-ax-grid' }), svgText(gut - 8, y + 4, tickLabel[k], 'vzb-ax-label', 'end'));
      });
      // 기간 이름은 겹치지 않고 다섯 개 안팎이 되도록 솎아 내되, 마지막 값이 있는 기간은 항상 남깁니다. 항목 축(categorical)은 모두 적고 굵게 하지 않습니다.
      const every = stagger ? 1 : Math.max(1, Math.ceil((labW + (S.categorical ? 6 : 16)) / Math.max(1, c.step)), S.categorical ? 1 : Math.ceil((n - 1) / 4));
      const anchor = S.categorical ? 0 : S.latest >= 0 ? S.latest : n - 1;
      labels.forEach((l, i) => {
        if ((((anchor - i) % every) + every) % every) return;
        svg.append(svgText(c.xs[i], base + 18 + (stagger && i % 2 ? 14 : 0), l, !S.categorical && i === anchor ? 'vzb-ax-label is-last' : 'vzb-ax-label', 'middle'));
      });
      if (S.under) S.under(svg, c);
      back = svgEl('g', {});
      svg.append(back);
      const taken = S.paint.draw(svg, c, S) || [];
      // 오른쪽 끝 이름은 선 높이를 가운데로 두고, 선 끝 값과 겹치면 그 값의 반대쪽으로 비켜 적습니다.
      sides.forEach((m) => {
        const y = c.y(m.value), lh = 14;
        let first = y + 4 - ((m.lines.length - 1) * lh) / 2;
        const span = () => [first - 11, first + (m.lines.length - 1) * lh + 3];
        taken.forEach((ty) => {
          const [a, b] = span();
          if (ty + 8 <= a || ty - 8 >= b) return;
          first += ty < y ? ty + 8 - a : ty - 8 - b;
        });
        m.lines.forEach((l, j) => svg.append(svgText(right + 10, first + j * lh, l, j ? 'vzb-ax-end vzb-ax-mute' : 'vzb-ax-end')));
      });
      if (S.over) S.over(svg, c);
      front = svgEl('g', {});
      svg.append(front);
    }
    onSize(plot, draw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (lastW) draw(lastW, lastH); });

    function defaultTip(i) {
      const series = S.series;
      if (series.length === 1) return { value: series[0].values[i] == null ? '–' : show(S.f, series[0].values[i]) };
      const rows = series.filter((s) => s.values[i] != null).map((s) => ({ tone: s.tone, name: s.name, value: show(S.f, s.values[i]), v: s.values[i] }));
      if (S.sort) rows.sort((a, b) => b.v - a.v);
      return { rows };
    }
    function point(i) {
      back.replaceChildren();
      front.replaceChildren();
      S.paint.mark(i, c, S, back, front);
      const t = tipBody(S.tip ? S.tip(i) : defaultTip(i), labels[i]);
      const r = plot.getBoundingClientRect();
      return { x: r.left + c.xs[i], y: r.top + c.top, label: labels[i], value: t.node, text: t.text, side: true };
    }
    interact(plot, n,
      (cx) => {
        const x = cx - plot.getBoundingClientRect().left;
        let best = 0;
        c.xs.forEach((v, i) => { if (Math.abs(v - x) < Math.abs(c.xs[best] - x)) best = i; });
        return best;
      },
      point,
      () => { if (back) back.replaceChildren(); if (front) front.replaceChildren(); });
    return {
      show(next) {
        use(next);
        if (back) back.replaceChildren();
        if (front) front.replaceChildren();
        hideTip();
        if (lastW) draw(lastW, lastH);
      },
    };
  }
