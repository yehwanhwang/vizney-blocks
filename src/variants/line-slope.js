  // Line - Slope: 두 기간의 비중을 양쪽 세로선에 찍고 선으로 잇습니다. 기울기로 비중이 늘었는지 줄었는지가 먼저 읽힙니다.
  // 최근 기간 비중이 큰 세 항목만 주황 · 분홍빨강 · 파랑(선 색 규칙), 나머지는 회색입니다. 툴팁에는 두 비중과 %p 차이를 적습니다.
  mount('line-slope', (card, d, f) => {
    const periods = d.periods || ['이전', '이후'];
    const raw = (d.items || []).filter((it) => it && Array.isArray(it.values));
    const sum = [0, 1].map((k) => raw.reduce((a, it) => a + (+it.values[k] || 0), 0));
    const items = raw.map((it) => ({ name: it.name, values: it.values, s: [0, 1].map((k) => (sum[k] ? (+it.values[k] || 0) / sum[k] * 100 : 0)) }))
      .sort((a, b) => b.s[1] - a.s[1]);
    items.forEach((it, i) => { it.tone = i < 3 ? `t${i + 1}` : 'tx'; });
    head(card, d, f, null);
    card.append(legendEl(items.slice(0, 3).map((it) => ({ name: it.name, tone: it.tone })).concat(items.length > 3 ? [{ name: `그 밖의 ${items.length - 3}개`, tone: 'tx' }] : [])));
    const foot = el('div', 'vzb-foot vzb-fill vzb-ax');
    const plot = el('div', 'vzb-plot');
    plot.tabIndex = 0;
    plot.setAttribute('role', 'img');
    plot.setAttribute('aria-label', `${d.title || ''}: ${items.map((it) => `${it.name} ${num(it.s[0], 1)}%에서 ${num(it.s[1], 1)}%`).join(', ')}. 위아래 화살표로 항목을 옮깁니다.`);
    const svg = svgEl('svg', { class: 'vzb-ax-svg', 'aria-hidden': 'true' });
    plot.append(svg);
    foot.append(plot);
    card.append(foot);
    const fam = getComputedStyle(card).fontFamily;
    let ys = [], lines = [], x0 = 0, x1 = 0;
    // 끝 이름은 값 높이에 두되, 겹치면 최소 간격만큼만 벌립니다.
    const spread = (pos, gap, lo, hi) => {
      const o = pos.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
      for (let k = 1; k < o.length; k++) o[k].y = Math.max(o[k].y, o[k - 1].y + gap);
      const over = o.length ? o[o.length - 1].y - hi : 0;
      if (over > 0) for (let k = o.length - 1; k >= 0; k--) o[k].y = Math.max(lo, k === o.length - 1 ? o[k].y - over : Math.min(o[k].y, o[k + 1].y - gap));
      const out = [];
      o.forEach((p) => { out[p.i] = p.y; });
      return out;
    };
    onSize(plot, (w, h) => {
      const top = 10, bottom = h - 26, all = items.flatMap((it) => it.s);
      const lo = Math.max(0, Math.floor(Math.min(...all) / 5) * 5 - 5), hi = Math.ceil(Math.max(...all) / 5) * 5 + 5;
      const y = (v) => bottom - ((v - lo) / (hi - lo || 1)) * (bottom - top);
      const leftW = Math.max(...items.map((it) => textW(`${num(it.s[0], 1)}%`, 500, fam)));
      const rightW = Math.max(...items.map((it) => textW(`${num(it.s[1], 1)}% ${it.name}`, 500, fam)));
      x0 = leftW + 14;
      x1 = w - rightW - 14;
      ys = items.map((it) => [y(it.s[0]), y(it.s[1])]);
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.replaceChildren();
      [x0, x1].forEach((x, k) => {
        svg.append(svgEl('line', { x1: x, x2: x, y1: top - 4, y2: bottom + 4, class: 'vzb-ax-zero' }), svgText(x, h - 6, periods[k] || '', 'vzb-ax-label is-last', 'middle'));
      });
      lines = items.map((it, i) => {
        const g = svgEl('g', { class: 'vzb-sl-item' });
        g.append(svgEl('line', { x1: x0, y1: ys[i][0], x2: x1, y2: ys[i][1], class: `vzb-ln-line vzb-${it.tone}` }));
        [x0, x1].forEach((x, k) => g.append(svgEl('circle', { cx: x, cy: ys[i][k], r: 4, class: `vzb-ln-dot vzb-${it.tone}` })));
        return g;
      });
      ['tx', 't3', 't2', 't1'].forEach((tone) => items.forEach((it, i) => { if (it.tone === tone) svg.append(lines[i]); }));
      const L = spread(ys.map((p) => p[0]), 14, top, bottom), R = spread(ys.map((p) => p[1]), 14, top, bottom);
      items.forEach((it, i) => {
        lines[i].append(svgText(x0 - 10, L[i] + 4, `${num(it.s[0], 1)}%`, 'vzb-ax-end', 'end'));
        const t = svgText(x1 + 10, R[i] + 4, `${num(it.s[1], 1)}% `, 'vzb-ax-end');
        const nm = svgEl('tspan', { class: 'vzb-ax-mute' });
        nm.textContent = it.name;
        t.append(nm);
        lines[i].append(t);
      });
    });
    interact(plot, items.length,
      (cx, cy) => {
        const r = plot.getBoundingClientRect(), px = Math.min(Math.max(cx - r.left, x0), x1), py = cy - r.top, k = (px - x0) / (x1 - x0 || 1);
        let best = 0, gap = Infinity;
        ys.forEach(([a, b], i) => { const dist = Math.abs(a + (b - a) * k - py); if (dist < gap) { gap = dist; best = i; } });
        return best;
      },
      (i) => {
        lines.forEach((g, k) => g.classList.toggle('is-dim', k !== i));
        const it = items[i], r = plot.getBoundingClientRect();
        const t = tipBody({
          rows: [0, 1].map((k) => ({ tone: k ? it.tone : 't0', name: periods[k], value: `${num(it.s[k], 1)}% · ${show(f, +it.values[k] || 0)}` })),
          note: `비중 ${it.s[1] >= it.s[0] ? '+' : '−'}${num(Math.abs(it.s[1] - it.s[0]), 1)}%p`,
        }, it.name);
        return { x: r.left + (x0 + x1) / 2, y: r.top + Math.min(ys[i][0], ys[i][1]), label: it.name, value: t.node, text: t.text };
      },
      () => lines.forEach((g) => g.classList.remove('is-dim')),
      true);
  });
