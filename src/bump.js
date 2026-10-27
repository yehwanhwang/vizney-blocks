  /* 범프 공통: 기간마다 항목의 순위를 위(1위)에서 아래로 찍고, 기간 사이를 S자 곡선으로 잇습니다. 이름은 선의 양 끝에 적어 범례를 대신합니다.
     values를 주면 기간마다 큰 순서로 순위를 매기고(같은 값은 적은 순서), 값이 빈 기간은 선을 끊습니다.
     선에 마우스를 올리거나, 그래프에 포커스한 뒤 위아래 화살표를 누르면 그 항목을 강조 선 모양(굵은 선, 점 안에 순위)으로 다시 그리고
     나머지는 옅게 둡니다. 회색 항목은 짚는 동안 진한 회색으로 바꿔 바로 눈에 띄게 합니다. 점 안의 순위는 흰 글자입니다.
     cfg: toneOf(item, items) → 선 색(item.pos는 마지막 순위 기준 자리, 0부터) · focus(item) → 강조 선(점 안에 순위 숫자) */
  function bumpCard(card, d, f, cfg) {
    const labels = d.labels || [], n = labels.length;
    const items = (d.items || []).filter((it) => it && it.name != null).map((it) => ({ name: it.name, values: (it.values || []).slice(0, n) }));
    for (let t = 0; t < n; t++) {
      items.map((it, i) => i).filter((i) => fin(items[i].values[t]))
        .sort((a, b) => items[b].values[t] - items[a].values[t] || a - b)
        .forEach((i, r) => { items[i].ranks = items[i].ranks || []; items[i].ranks[t] = r + 1; });
    }
    items.forEach((it) => { it.ranks = it.ranks || []; });
    const N = Math.max(1, ...items.map((it) => Math.max(0, ...it.ranks.filter(Boolean))));
    const lastOf = (it) => { for (let t = n - 1; t >= 0; t--) if (it.ranks[t]) return t; return -1; };
    const firstOf = (it) => it.ranks.findIndex(Boolean);
    // 마지막 기간 순위대로 둡니다(키보드 순서, 그리는 순서).
    const order = items.map((_, i) => i).sort((a, b) => (items[a].ranks[lastOf(items[a])] || N + 1) - (items[b].ranks[lastOf(items[b])] || N + 1));
    order.forEach((i, k) => { items[i].pos = k; });
    items.forEach((it) => { it.tone = cfg.toneOf(it, items); it.focus = cfg.focus ? cfg.focus(it) : false; });
    head(card, d, f, null);
    if (cfg.top) card.append(cfg.top);
    const foot = el('div', 'vzb-foot vzb-fill vzb-ax vzb-bp');
    const plot = el('div', 'vzb-plot');
    plot.tabIndex = 0;
    plot.setAttribute('role', 'img');
    plot.setAttribute('aria-label', tx(d, '%s 순위 변화, %s–%s. 위아래 화살표로 항목을 옮깁니다. 모든 순위는 이어지는 표에 있습니다.', d.title || '', labels[0] || '', labels[n - 1] || ''));
    const svg = svgEl('svg', { class: 'vzb-ax-svg vzb-bp-svg', 'aria-hidden': 'true' });
    plot.append(svg);
    foot.append(plot);
    card.append(foot);
    const sr = el('div', 'vzb-sr'), table = el('table'), hr = el('tr');
    hr.append(el('th', null, tx(d, '항목')), ...labels.map((l) => el('th', null, l)));
    table.append(el('caption', null, tx(d, '%s 순위', d.title || '')), hr);
    order.forEach((i) => { const tr = el('tr'); tr.append(el('th', null, items[i].name), ...labels.map((_, t) => el('td', null, items[i].ranks[t] ? tx(d, '%s위', items[i].ranks[t]) : ''))); table.append(tr); });
    sr.append(table);
    card.append(sr);
    const fam = getComputedStyle(card).fontFamily;
    let xs = [], Y = null, groups = [], front = null, lastW = 0, lastH = 0;
    // 항목 하나: big이면 강조 선 모양(3px 선, 지름 18px 점 안에 순위, 이름은 점에서 16px)입니다.
    function paintItem(it, big, tone) {
      const g = svgEl('g', { class: `vzb-bp-item vzb-${tone || it.tone}${big ? ' is-focus' : ''}` });
      let dpath = '', prev = -1;
      it.ranks.forEach((r, t) => {
        if (!r) { prev = -1; return; }
        const x = xs[t], y = Y(r);
        if (prev < 0) dpath += `M${x.toFixed(1)},${y.toFixed(1)}`;
        else { const x0 = xs[prev], y0 = Y(it.ranks[prev]), mx = (x - x0) / 2; dpath += `C${(x0 + mx).toFixed(1)},${y0.toFixed(1)} ${(x - mx).toFixed(1)},${y.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`; }
        prev = t;
      });
      g.append(svgEl('path', { d: dpath, class: 'vzb-bp-line' }));
      it.ranks.forEach((r, t) => {
        if (!r) return;
        g.append(svgEl('circle', { cx: xs[t], cy: Y(r), r: big ? 9 : it.tone === 'tx' ? 3.5 : 4.5, class: 'vzb-bp-dot' }));
        if (big) g.append(svgText(xs[t], Y(r) + 4, String(r), 'vzb-bp-rank', 'middle'));
      });
      const a = firstOf(it), b = lastOf(it);
      if (a >= 0) g.append(svgText(xs[a] - (big ? 16 : 10), Y(it.ranks[a]) + 4, it.name, 'vzb-bp-name', 'end'));
      if (b >= 0) g.append(svgText(xs[b] + (big ? 16 : 10), Y(it.ranks[b]) + 4, it.name, 'vzb-bp-name', 'start'));
      return g;
    }
    function draw(w, h) {
      lastW = w; lastH = h;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.replaceChildren();
      groups = [];
      if (!n || !items.length) return;
      const nameW = Math.max(...items.map((it) => textW(it.name, 500, fam)));
      const left = nameW + 14, right = w - nameW - 14, top = 10, bottom = h - 26;
      xs = labels.map((_, t) => (n < 2 ? (left + right) / 2 : left + (t * (right - left)) / (n - 1)));
      Y = (r) => (N < 2 ? (top + bottom) / 2 : top + ((r - 1) * (bottom - top)) / (N - 1));
      // 기간 이름: 겹치지 않을 만큼 솎아 내되 마지막 기간은 남깁니다.
      const labW = Math.max(...labels.map((l) => textW(l, 400, fam)));
      const every = Math.max(1, Math.ceil((labW + 12) / Math.max(1, n < 2 ? labW + 12 : (right - left) / (n - 1))));
      labels.forEach((l, t) => { if ((n - 1 - t) % every === 0) svg.append(svgText(xs[t], bottom + 20, l, t === n - 1 ? 'vzb-ax-label is-last' : 'vzb-ax-label', 'middle')); });
      // 회색 선을 먼저, 색 선과 강조 선을 위에 그립니다.
      const drawOrder = order.slice().sort((a, b) => (items[a].tone === 'tx' ? 0 : items[a].focus ? 2 : 1) - (items[b].tone === 'tx' ? 0 : items[b].focus ? 2 : 1));
      drawOrder.forEach((i) => {
        const g = paintItem(items[i], items[i].focus);
        svg.append(g);
        groups[i] = g;
      });
      // 짚은 항목을 강조 선 모양으로 다시 그리는 자리
      front = svgEl('g', {});
      svg.append(front);
    }
    onSize(plot, draw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (lastW) draw(lastW, lastH); });
    const move = (it) => { const a = firstOf(it), b = lastOf(it); return a < 0 || b < 0 ? 0 : it.ranks[a] - it.ranks[b]; };
    interact(plot, () => order.length,
      (cx, cy) => {
        if (!Y || !xs.length) return -1;
        const r = plot.getBoundingClientRect(), x = cx - r.left, y = cy - r.top;
        let t = 0;
        xs.forEach((v, k) => { if (Math.abs(v - x) < Math.abs(xs[t] - x)) t = k; });
        let best = -1, bd = Infinity;
        order.forEach((i, k) => { const rk = items[i].ranks[t]; if (!rk) return; const dd = Math.abs(Y(rk) - y); if (dd < bd) { bd = dd; best = k; } });
        return best;
      },
      (k) => {
        const i = order[k], it = items[i], b = lastOf(it), a = firstOf(it), m = move(it);
        svg.classList.add('is-hover');
        // 강조 선이 아닌 항목은 원래 선을 감추고 강조 선 모양으로 앞에 다시 그립니다.
        groups.forEach((g, j) => { if (g) { g.classList.toggle('is-on', j === i && it.focus); g.classList.toggle('is-lift', j === i && !it.focus); } });
        front.replaceChildren();
        if (!it.focus) { const g = paintItem(it, true, it.tone === 'tx' ? 'tk' : it.tone); g.classList.add('is-on'); front.append(g); }
        const r = plot.getBoundingClientRect();
        const note = tx(d, '%1 %2위에서 %3', labels[a], it.ranks[a], m > 0 ? tx(d, '%s계단 오름', m) : m < 0 ? tx(d, '%s계단 내림', -m) : tx(d, '그대로')) + (fin(it.values[b]) ? ` · ${show(f, it.values[b])}` : '');
        const t = tipBody({ value: tx(d, '%s %s위', labels[b], it.ranks[b]), note }, it.name);
        return { x: r.left + xs[b], y: r.top + Y(it.ranks[b]) - 14, label: it.name, value: t.node, text: t.text };
      },
      () => { svg.classList.remove('is-hover'); groups.forEach((g) => { if (g) g.classList.remove('is-on', 'is-lift'); }); if (front) front.replaceChildren(); },
      true);
  }
