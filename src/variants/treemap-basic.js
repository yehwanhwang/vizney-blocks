  // Treemap - Basic: 묶음(groups) 안의 항목까지 면적으로 비중을 보여줍니다. 큰 세 묶음만 주황 · 분홍빨강 · 노랑을 한 단계 옅게 칠하고
  // (넓은 면이라 막대보다 옅은 색), 나머지 묶음은 회색 '기타' 한 칸으로 묶습니다. 칸 사이는 2px 띄우고, 칸이 충분히 크면 이름과 비중을 적습니다.
  // 툴팁에는 금액, 전체 중 비중, 묶음 안 비중을 적습니다.
  mount('treemap-basic', (card, d, f) => {
    let groups = (d.groups || []).map((g) => {
      const items = (g.items || []).filter((it) => +it.value > 0).sort((a, b) => b.value - a.value);
      return { name: g.name, items, value: items.reduce((a, it) => a + +it.value, 0) };
    }).filter((g) => g.value > 0).sort((a, b) => b.value - a.value);
    const rest = groups.slice(3);
    if (rest.length) {
      const name = rest.length === 1 ? rest[0].name : '기타', value = rest.reduce((a, g) => a + g.value, 0);
      groups = groups.slice(0, 3).concat([{ name, value, rest: true, note: rest.length > 1 ? rest.map((g) => g.name).join('·') : '', items: [{ name, value }] }]);
    }
    const total = groups.reduce((a, g) => a + g.value, 0);
    groups.forEach((g, i) => { g.tone = i < 3 ? `m${i + 1}` : 'mx'; });
    head(card, d, f, null);
    const legend = groups.map((g) => ({ name: g.name, tone: g.tone, box: true }));
    card.append(legendEl(legend));
    const foot = el('div', 'vzb-foot vzb-fill vzb-tm');
    const plot = el('div', 'vzb-plot vzb-tm-plot');
    plot.tabIndex = 0;
    plot.setAttribute('role', 'img');
    plot.setAttribute('aria-label', `${d.title || ''}: ${groups.map((g) => `${g.name} ${pctOf(g.value / total)}(${g.items.map((it) => `${it.name} ${pctOf(it.value / total)}`).join(', ')})`).join('; ')}. 좌우 화살표로 칸을 옮깁니다.`);
    foot.append(plot);
    card.append(foot);
    let tiles = [];
    onSize(plot, (w, h) => {
      plot.replaceChildren();
      tiles = [];
      const outer = squarify(groups.map((g) => g.value), 0, 0, w, h);
      groups.forEach((g, gi) => {
        const r = outer[gi], inner = squarify(g.items.map((it) => +it.value), r.x, r.y, r.w, r.h);
        g.items.forEach((it, k) => {
          const t = inner[k], tile = el('div', `vzb-tm-tile vzb-${g.tone}`);
          tile.style.cssText = `left:${(t.x + 1).toFixed(1)}px;top:${(t.y + 1).toFixed(1)}px;width:${Math.max(0, t.w - 2).toFixed(1)}px;height:${Math.max(0, t.h - 2).toFixed(1)}px`;
          if (t.w > 48 && t.h >= 46) tile.append(el('span', null, it.name), el('b', null, pctOf(it.value / total)));
          else if (t.w > 36 && t.h >= 30) tile.append(el('span', null, it.name));
          tile.dataset.i = tiles.length;
          plot.append(tile);
          tiles.push({ tile, it, g });
        });
      });
    });
    interact(plot, () => tiles.length,
      (cx, cy) => {
        const t = document.elementFromPoint(cx, cy), hit = t && t.closest('[data-i]');
        return hit && plot.contains(hit) ? +hit.dataset.i : -1;
      },
      (i) => {
        tiles.forEach((x, k) => x.tile.classList.toggle('is-dim', k !== i));
        const { tile, it, g } = tiles[i], r = tile.getBoundingClientRect();
        const label = g.rest ? `${g.name}${g.note ? ` (${g.note})` : ''}` : `${g.name} · ${it.name}`;
        const t = tipBody({ value: show(f, it.value), note: g.rest ? `전체의 ${pctOf(it.value / total)}` : `전체의 ${pctOf(it.value / total)} · ${g.name}의 ${pctOf(it.value / g.value)}` }, label);
        return { x: r.left + r.width / 2, y: r.top, label, value: t.node, text: t.text };
      },
      () => tiles.forEach((x) => x.tile.classList.remove('is-dim')));
  });

  // 면적이 값에 비례하는 직사각형으로 나눕니다(squarified). 값은 큰 순서로 받아, 칸의 가로세로 비율이 1에 가깝게 줄을 채웁니다.
  function squarify(values, x, y, w, h) {
    const sum = values.reduce((a, v) => a + v, 0), out = values.map(() => ({ x, y, w: 0, h: 0 }));
    if (!sum || w <= 0 || h <= 0) return out;
    const items = values.map((v, i) => ({ a: (v * w * h) / sum, i }));
    let rect = { x, y, w, h }, row = [], k = 0;
    const worst = (list, side) => {
      const s = list.reduce((a, r) => a + r.a, 0), hi = Math.max(...list.map((r) => r.a)), lo = Math.min(...list.map((r) => r.a));
      return Math.max((side * side * hi) / (s * s), (s * s) / (side * side * lo));
    };
    const place = (list) => {
      const s = list.reduce((a, r) => a + r.a, 0);
      if (rect.w >= rect.h) {
        const cw = s / rect.h;
        let yy = rect.y;
        list.forEach((r) => { out[r.i] = { x: rect.x, y: yy, w: cw, h: r.a / cw }; yy += r.a / cw; });
        rect = { x: rect.x + cw, y: rect.y, w: rect.w - cw, h: rect.h };
      } else {
        const rh = s / rect.w;
        let xx = rect.x;
        list.forEach((r) => { out[r.i] = { x: xx, y: rect.y, w: r.a / rh, h: rh }; xx += r.a / rh; });
        rect = { x: rect.x, y: rect.y + rh, w: rect.w, h: rect.h - rh };
      }
    };
    while (k < items.length) {
      const side = Math.min(rect.w, rect.h);
      if (!row.length || worst(row.concat(items[k]), side) <= worst(row, side)) { row.push(items[k]); k += 1; }
      else { place(row); row = []; }
    }
    if (row.length) place(row);
    return out;
  }
