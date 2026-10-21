  /* 레이더 공통: axes(항목 이름)마다 바퀴살을 긋고, series마다 항목 값을 이어 다각형을 그립니다. 첫 항목이 맨 위이고 나머지는 시계 방향입니다.
     눈금은 min(기본 0)에서 max까지이고, max를 비우면 값을 감싸는 끝수 없는 값(1 · 2 · 2.5 · 5 단위)입니다.
     격자는 바깥 테두리와 같은 모양의 옅은 실선 다각형 네 겹과 바퀴살이고, 항목 이름은 꼭짓점 바깥에 적습니다.
     카드 폭이 460px 이상이면 레이더 오른쪽에 요약 목록(panel)을 두고, 좁으면 목록 없이 레이더만 둡니다.
     항목 쪽으로 마우스를 올리거나 그래프에 포커스한 뒤 좌우 화살표를 누르면 그 바퀴살을 짚고 대상별 값을 보여줍니다.
     대상마다 옅은 면에 같은 색 1.5px 테두리를 두고, 꼭짓점에 점은 찍지 않습니다. 비교 기준(base)은 가장 아래에 깝니다.
     cfg: tone(대상, 순번) 색 이름 · fill(대상, 순번) 면 옅기(0이면 선만) · value(항목 순번) 좁을 때 이름 옆에 붙일 값
          note(항목 순번) 툴팁 덧붙임 · panel(목록, ctx) 요약 목록 채우기, 항목 줄([data-i])을 돌려주면 레이더와 함께 짚습니다 · legendInPanel 넓을 때 머리 범례 숨김 */
  function radarCard(card, d, f, cfg) {
    const axes = (d.axes || []).map((a) => String(a)), n = axes.length;
    const series = (d.series || []).filter((s) => s && Array.isArray(s.values))
      .map((s) => ({ name: s.name == null ? '' : String(s.name), base: !!s.base, values: axes.map((_, i) => (fin(s.values[i]) ? +s.values[i] : null)) }));
    series.forEach((s, i) => {
      s.tone = cfg.tone ? cfg.tone(s, i) : ['t1', 't2', 't3'][i] || 't0';
      s.fill = cfg.fill ? cfg.fill(s, i) : 0.15;
    });
    const lo = fin(d.min) ? +d.min : 0;
    const span = Math.max(lo, ...series.flatMap((s) => s.values.filter((v) => v != null))) - lo;
    const nice = (v) => { const e = Math.pow(10, Math.floor(Math.log10(v))); return [1, 2, 2.5, 5, 10].map((m) => m * e).find((x) => x >= v - 1e-9); };
    const hi = fin(d.max) ? +d.max : lo + (span > 0 ? nice(span) : 1);

    head(card, d, f, null);
    if (series.length > 1) {
      const lg = legendEl(series.map((s) => ({ name: s.name, tone: s.tone, box: s.fill > 0 })));
      if (cfg.legendInPanel) lg.classList.add('vzb-rd-narrow');
      card.append(lg);
    }
    const foot = el('div', 'vzb-foot vzb-fill vzb-rd');
    const body = el('div', 'vzb-rd-body');
    body.tabIndex = 0;
    body.setAttribute('role', 'img');
    body.setAttribute('aria-label', `${d.title || ''} 레이더 차트, 항목 ${n}개와 대상 ${series.length}개. 좌우 화살표로 항목을 옮깁니다. 모든 값은 이어지는 표에 있습니다.`);
    const plot = el('div', 'vzb-plot');
    const svg = svgEl('svg', { class: 'vzb-rd-svg', 'aria-hidden': 'true' });
    plot.append(svg);
    body.append(plot);
    const panel = cfg.panel ? el('ul', 'vzb-rd-list') : null;
    if (panel) { panel.setAttribute('aria-hidden', 'true'); body.append(panel); }
    foot.append(body);
    card.append(foot);
    // 화면 낭독기용 값 표: 줄은 항목, 칸은 대상
    const sr = el('div', 'vzb-sr'), table = el('table'), hr = el('tr');
    hr.append(el('th', null, '항목'));
    series.forEach((s) => hr.append(el('th', null, s.name)));
    table.append(el('caption', null, d.title || ''), hr);
    axes.forEach((a, i) => {
      const tr = el('tr');
      tr.append(el('th', null, a));
      series.forEach((s) => tr.append(el('td', null, s.values[i] == null ? '–' : show(f, s.values[i]))));
      table.append(tr);
    });
    sr.append(table);
    card.append(sr);

    const fam = getComputedStyle(card).fontFamily;
    const cos = axes.map((_, i) => Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / n));
    const sin = axes.map((_, i) => Math.sin(-Math.PI / 2 + (i * 2 * Math.PI) / n));
    const t01 = (v) => Math.max(0, Math.min(1, ((v == null ? lo : v) - lo) / (hi - lo || 1)));
    const areas = [];
    let G = null, front = null, names = [], lastW = 0, lastH = 0;
    const rows = panel ? cfg.panel(panel, { series, axes, areas, f }) || [] : [];
    function draw(w, h) {
      lastW = w; lastH = h;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.replaceChildren();
      G = null;
      if (n < 3 || !series.length) return;
      // 목록이 보이면 값은 목록에 있으니 꼭짓점에는 이름만 적습니다.
      const wide = panel && panel.offsetWidth > 0;
      const labs = axes.map((a, i) => { const v = cfg.value && !wide ? cfg.value(i) : ''; return { v, w: textW(a, 400, fam) + (v ? textW(v, 700, fam, 13) + 5 : 0) }; });
      // 반지름: 위아래 꼭짓점 이름 자리를 빼고 높이에 맞추되, 옆 꼭짓점 이름이 그래프 밖으로 나가지 않게 줄입니다.
      const GAP = 10, T = sin.some((s) => s < -0.9) ? 24 : 12, B = sin.some((s) => s > 0.9) ? 24 : 12;
      const ymin = Math.min(...sin), ymax = Math.max(...sin);
      let r = (h - T - B) / (ymax - ymin);
      cos.forEach((c, i) => {
        if (Math.abs(c) < 0.05) return;
        const room = Math.abs(c) > 0.3 ? w / 2 - labs[i].w - 4 : w / 2 - labs[i].w / 2 - 4;
        r = Math.min(r, room / Math.abs(c) - GAP);
      });
      r = Math.max(24, Math.min(r, 150));
      const cx = w / 2, cy = (h + T - B - r * (ymin + ymax)) / 2;
      const P = (i, t) => [cx + r * t * cos[i], cy + r * t * sin[i]];
      const poly = (ts) => `${ts.map((t, i) => { const [x, y] = P(i, t); return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`; }).join('')}Z`;
      for (let k = 1; k <= 4; k++) svg.append(svgEl('path', { d: poly(axes.map(() => k / 4)), class: 'vzb-rd-grid' }));
      axes.forEach((_, i) => { const [x, y] = P(i, 1); svg.append(svgEl('line', { x1: cx.toFixed(1), y1: cy.toFixed(1), x2: x.toFixed(1), y2: y.toFixed(1), class: 'vzb-rd-grid' })); });
      // 비교 기준(base)을 가장 아래에, 나머지는 뒤 순번부터 깔아 첫 대상이 맨 위에 옵니다.
      const order = series.map((_, i) => i).reverse();
      order.sort((a, b) => (series[b].base ? 1 : 0) - (series[a].base ? 1 : 0));
      areas.length = 0;
      order.forEach((j) => {
        const s = series[j], g = svgEl('g', { class: 'vzb-rd-set' });
        const path = svgEl('path', { d: poly(s.values.map(t01)), class: `vzb-rd-area vzb-${s.tone}` });
        if (s.fill > 0) path.style.setProperty('--vzb-rd-fill', s.fill);
        g.append(path);
        svg.append(g);
        areas[j] = g;
      });
      // 항목 이름: 오른쪽 꼭짓점은 왼쪽 맞춤, 왼쪽 꼭짓점은 오른쪽 맞춤, 맨 위와 맨 아래는 가운데 맞춤입니다.
      names = axes.map((a, i) => {
        const c = cos[i], s = sin[i], x = cx + (r + GAP) * c, y = cy + (r + GAP) * s;
        const anchor = c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle';
        const t = svgText(x.toFixed(1), (s < -0.9 ? y - 2 : s > 0.9 ? y + 11 : y + 4).toFixed(1), a, 'vzb-rd-name', anchor);
        if (labs[i].v) { const v = svgEl('tspan', { class: 'vzb-rd-val', dx: 5 }); v.textContent = labs[i].v; t.append(v); }
        svg.append(t);
        return t;
      });
      front = svgEl('g', {});
      svg.append(front);
      G = { cx, cy, r, P };
    }
    onSize(plot, draw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (lastW) draw(lastW, lastH); });
    interact(body, n,
      (px, py) => {
        const t = document.elementFromPoint(px, py), row = t && t.closest ? t.closest('[data-i]') : null;
        if (row && panel && panel.contains(row)) return +row.dataset.i;
        if (!G) return -1;
        const b = plot.getBoundingClientRect(), dx = px - b.left - G.cx, dy = py - b.top - G.cy;
        if (dx * dx + dy * dy > (G.r + 48) * (G.r + 48)) return -1;
        const step = (2 * Math.PI) / n;
        return ((Math.round((Math.atan2(dy, dx) + Math.PI / 2) / step) % n) + n) % n;
      },
      (i) => {
        front.replaceChildren();
        const [ex, ey] = G.P(i, 1);
        front.append(svgEl('line', { x1: G.cx.toFixed(1), y1: G.cy.toFixed(1), x2: ex.toFixed(1), y2: ey.toFixed(1), class: 'vzb-rd-spoke' }));
        // 꼭짓점에 점은 찍지 않고 바퀴살만 진하게 긋습니다. 툴팁은 그 항목에서 가장 바깥 꼭짓점 위에 띄웁니다.
        let tx = ex, ty = ey, far = -1;
        series.forEach((s) => {
          if (s.values[i] == null) return;
          const t = t01(s.values[i]), [x, y] = G.P(i, t);
          if (t > far) { far = t; tx = x; ty = y; }
        });
        names.forEach((t, j) => t.classList.toggle('is-on', j === i));
        rows.forEach((li, j) => li.classList.toggle('is-dim', j !== i));
        const list = series.map((s) => ({ tone: s.tone, value: s.values[i] == null ? '–' : show(f, s.values[i]), name: s.name }));
        const note = cfg.note ? cfg.note(i) : '';
        const tb = tipBody(series.length > 1 ? { rows: list, note } : { value: list[0].value, note }, axes[i]);
        const b = plot.getBoundingClientRect();
        return { x: b.left + tx, y: b.top + ty - 8, label: axes[i], value: tb.node, text: tb.text };
      },
      () => { if (front) front.replaceChildren(); names.forEach((t) => t.classList.remove('is-on')); rows.forEach((li) => li.classList.remove('is-dim')); },
      false, true);
  }
