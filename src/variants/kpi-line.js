  // KPI - Line: 대표 수치 아래에 월별 흐름을 곡선으로 그립니다. 13개월이면 처음과 마지막이 같은 달이 됩니다.
  // y축은 값의 범위에 맞추고, 바닥 색은 아래로 갈수록 사라지게 칠합니다.
  // value를 생략하면 마지막 값을, compare를 생략하면 직전 시점을 씁니다.
  mount('kpi-line', (card, d, f) => {
    const vals = d.trend.values, labels = d.trend.labels, last = vals.length - 1;
    head(card, d, f, d.value != null ? d.value : vals[last], d.compare || (last > 0 ? { label: tx(d, '직전 시점'), value: vals[last - 1] } : null));
    const foot = el('div', 'vzb-foot vzb-fill');
    const plot = el('div', 'vzb-plot');
    plot.tabIndex = 0;
    plot.setAttribute('role', 'img');
    plot.setAttribute('aria-label', tx(d, '%s 추이: %s. 좌우 화살표로 시점을 옮깁니다.', d.title || '', labels.map((l, i) => `${l} ${show(f, vals[i])}`).join(', ')));
    const svg = svgEl('svg', { class: 'vzb-tr-svg', 'aria-hidden': 'true' });
    plot.append(svg);
    foot.append(plot);
    card.append(foot);

    const LAB = 24, PX = 6, PT = 10, PB = 10, gid = `vzb-g${Math.random().toString(36).slice(2, 8)}`;
    const min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
    const lo = min - span * 0.08, hi = max + span * 0.08;
    const step = Math.max(1, Math.ceil(vals.length / 5));   // 기간 이름은 다섯 개 안팎, 마지막은 항상
    let xs = [], ys = [], hover = null, PH = 0;
    onSize(plot, (w, h) => {
      PH = h - LAB;
      xs = vals.map((_, i) => PX + (i * (w - PX * 2)) / Math.max(1, last));
      ys = vals.map((v) => PT + ((hi - v) / (hi - lo)) * (PH - PT - PB));
      const line = linePath(xs.map((x, i) => ({ x, y: ys[i] })), d.curve);
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const grad = svgEl('linearGradient', { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 });
      grad.append(svgEl('stop', { offset: 0, class: 'vzb-tr-g1' }), svgEl('stop', { offset: 1, class: 'vzb-tr-g2' }));
      const defs = svgEl('defs', {});
      defs.append(grad);
      svg.replaceChildren(defs);
      for (let k = 0; k < 4; k++) {
        const y = 0.5 + Math.round(((PH - 1) * k) / 3);
        svg.append(svgEl('line', { x1: 0, x2: w, y1: y, y2: y, class: 'vzb-grid' }));
      }
      svg.append(
        svgEl('path', { d: `${line}L${xs[last].toFixed(2)},${PH}L${xs[0].toFixed(2)},${PH}Z`, fill: `url(#${gid})` }),
        svgEl('path', { d: line, class: 'vzb-tr-line' }),
      );
      hover = svgEl('g', {});
      svg.append(hover, svgEl('circle', { cx: xs[last], cy: ys[last], r: 5, class: 'vzb-tr-dot' }));
      labels.forEach((l, i) => {
        if ((last - i) % step !== 0) return;
        const anchor = i === 0 ? 'start' : i === last ? 'end' : 'middle';
        const t = svgEl('text', { x: i === 0 ? 0 : i === last ? w : xs[i], y: PH + 18, 'text-anchor': anchor, class: i === last ? 'vzb-axis is-last' : 'vzb-axis' });
        t.textContent = l;
        svg.append(t);
      });
    });
    interact(plot, vals.length,
      (cx) => {
        const x = cx - plot.getBoundingClientRect().left;
        let best = 0;
        xs.forEach((v, i) => { if (Math.abs(v - x) < Math.abs(xs[best] - x)) best = i; });
        return best;
      },
      (i) => {
        hover.replaceChildren(
          svgEl('line', { x1: xs[i], x2: xs[i], y1: 0, y2: PH, class: 'vzb-tr-cross' }),
          svgEl('circle', { cx: xs[i], cy: ys[i], r: 5, class: 'vzb-tr-dot' }),
        );
        const r = plot.getBoundingClientRect();
        return { x: r.left + xs[i], y: r.top + ys[i], label: labels[i], value: show(f, vals[i]) };
      },
      () => { if (hover) hover.replaceChildren(); });
  });
