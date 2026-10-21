  /* 생키 공통: links [{ from, to, value }]만으로 노드와 단을 만듭니다. 들어오는 흐름이 없는 노드에서 시작해 흐름마다 한 단씩 오른쪽으로 놓고,
     나가는 흐름이 없는 노드는 마지막 단에 모읍니다. 노드 순서는 links에 처음 나온 순서이고, 노드 높이는 들어온 양과 나간 양 중 큰 쪽입니다.
     모든 단이 같은 비율(1px당 값)을 써서 띠 두께를 단끼리 견줄 수 있고, 단마다 세로 가운데에 모읍니다. 노드 사이는 높이의 12%(16–32px)만큼 띄웁니다.
     이름과 값은 첫 단은 노드 왼쪽, 나머지 단은 노드 오른쪽에 두 줄로 적고, 겹치면 위아래로 밀어 냅니다.
     띠나 노드(이름 포함)에 마우스를 올리거나, 그래프에 포커스한 뒤 좌우 화살표를 누르면(노드 다음 흐름 순서) 나머지를 옅게 하고 툴팁을 띄웁니다.
     cfg: paint(nodes, links, cols) 노드와 띠의 tone(색 이름)을 정합니다. 띠는 정하지 않으면 출발 노드의 색입니다. */
  function sankeyCard(card, d, f, cfg) {
    const nodes = [], byId = new Map();
    const node = (id) => {
      const key = String(id);
      let n = byId.get(key);
      if (!n) { n = { id: key, name: key, ins: [], outs: [] }; byId.set(key, n); nodes.push(n); }
      return n;
    };
    const links = (d.links || []).filter((l) => l && l.from != null && l.to != null && String(l.from) !== String(l.to) && fin(l.value) && +l.value > 0)
      .map((l) => ({ s: node(l.from), t: node(l.to), value: +l.value }));
    links.forEach((l) => { l.s.outs.push(l); l.t.ins.push(l); });
    const total = (list) => list.reduce((a, x) => a + x.value, 0);
    nodes.forEach((n) => { n.value = Math.max(total(n.ins), total(n.outs)); n.depth = 0; });
    // 단: 출발 노드에서 가장 먼 거리. 흐름이 되돌아오는 고리가 있어도 노드 수만큼만 돌고 멈춥니다.
    for (let r = 0; r < nodes.length; r++) {
      let moved = false;
      links.forEach((l) => { if (l.t.depth < l.s.depth + 1) { l.t.depth = l.s.depth + 1; moved = true; } });
      if (!moved) break;
    }
    const deepest = nodes.length ? Math.max(...nodes.map((n) => n.depth)) : 0;
    const cols = Array.from({ length: deepest + 1 }, (_, c) => nodes.filter((n) => (n.outs.length ? n.depth : deepest) === c)).filter((c) => c.length);
    cols.forEach((c, i) => c.forEach((n) => { n.col = i; }));
    const L = cols.length - 1;
    if (cfg.paint) cfg.paint(nodes, links, cols);
    nodes.forEach((n) => { n.tone = n.tone || 'f1'; });
    links.forEach((l) => { l.tone = l.tone || l.s.tone; });
    // 짚는 순서: 노드(단 순서, 위에서 아래로), 이어서 흐름(출발 노드, 도착 노드 순서)
    const order = [];
    cols.forEach((c) => c.forEach((n) => { n.k = order.length; order.push({ node: n }); }));
    const at = (n) => n.col * 1e4 + cols[n.col].indexOf(n);
    links.slice().sort((a, b) => at(a.s) - at(b.s) || at(a.t) - at(b.t)).forEach((l) => { l.k = order.length; order.push({ link: l }); });

    head(card, d, f, null);
    const foot = el('div', 'vzb-foot vzb-fill vzb-sk');
    const plot = el('div', 'vzb-plot');
    plot.tabIndex = 0;
    plot.setAttribute('role', 'img');
    plot.setAttribute('aria-label', `${d.title || ''} 생키 차트, 노드 ${nodes.length}개와 흐름 ${links.length}개. 좌우 화살표로 노드와 흐름을 차례로 짚습니다. 모든 흐름은 이어지는 표에 있습니다.`);
    const svg = svgEl('svg', { class: 'vzb-sk-svg', 'aria-hidden': 'true' });
    plot.append(svg);
    foot.append(plot);
    card.append(foot);
    // 화면 낭독기용 흐름 표
    const sr = el('div', 'vzb-sr'), table = el('table'), hr = el('tr');
    hr.append(el('th', null, '출발'), el('th', null, '도착'), el('th', null, '값'));
    table.append(el('caption', null, d.title || ''), hr);
    links.forEach((l) => { const tr = el('tr'); tr.append(el('td', null, l.s.name), el('td', null, l.t.name), el('td', null, show(f, l.value))); table.append(tr); });
    sr.append(table);
    card.append(sr);

    const fam = getComputedStyle(card).fontFamily;
    const NW = 8, LH = 32;   // 노드 폭, 이름표(이름 · 값 두 줄) 높이
    const fx = (v) => v.toFixed(1);
    const pct = (a, b) => `${num(b ? (a / b) * 100 : 0, 1)}%`;
    let lastW = 0, lastH = 0;
    function draw(w, h) {
      lastW = w; lastH = h;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.replaceChildren();
      if (!links.length) return;
      // 이름표 폭: 이름(12px)과 값(13px 굵게, 단위 11px) 중 넓은 쪽
      nodes.forEach((n) => {
        const [t, u] = f.parts(n.value);
        n.num = t; n.unit = u;
        n.lw = Math.max(textW(n.name, 400, fam), textW(t, 700, fam, 13) + (u ? textW(u, 400, fam, 11) + 2 : 0));
      });
      const leftW = Math.ceil(Math.max(...cols[0].map((n) => n.lw))) + 10;
      const rightW = L ? Math.ceil(Math.max(...cols[L].map((n) => n.lw))) + 10 : 0;
      const xa = leftW, xb = Math.max(xa, w - rightW - NW);
      const gap = Math.round(Math.max(16, Math.min(32, h * 0.12)));
      const ky = Math.min(...cols.map((c) => (h - (c.length - 1) * gap) / Math.max(1e-9, total(c))));
      cols.forEach((c, ci) => {
        const tall = c.reduce((a, n) => a + Math.max(1, n.value * ky), 0) + (c.length - 1) * gap;
        let y = (h - tall) / 2;
        c.forEach((n) => { n.x = L ? xa + (ci / L) * (xb - xa) : xa; n.y0 = y; n.h = Math.max(1, n.value * ky); n.y1 = y + n.h; y = n.y1 + gap; });
      });
      // 노드 안에서 띠는 맞은편 노드가 위에 있는 순서로 쌓아 엇갈림을 줄입니다.
      nodes.forEach((n) => {
        n.outs.sort((a, b) => a.t.y0 - b.t.y0);
        n.ins.sort((a, b) => a.s.y0 - b.s.y0);
        let y = n.y0;
        n.outs.forEach((l) => { l.w = l.value * ky; l.sy = y; y += l.w; });
        y = n.y0;
        n.ins.forEach((l) => { l.ty = y; y += l.value * ky; });
      });
      const ribbon = (l) => {
        const x0 = l.s.x + NW, x1 = l.t.x, xm = (x0 + x1) / 2, a = l.sy, b = l.ty, lw = l.w;
        return `M${fx(x0)},${fx(a)}C${fx(xm)},${fx(a)} ${fx(xm)},${fx(b)} ${fx(x1)},${fx(b)}V${fx(b + lw)}C${fx(xm)},${fx(b + lw)} ${fx(xm)},${fx(a + lw)} ${fx(x0)},${fx(a + lw)}Z`;
      };
      const linkG = svgEl('g', {}), nodeG = svgEl('g', {}), labG = svgEl('g', {});
      // 굵은 띠를 먼저 그려 가는 띠가 위에 오게 합니다(가는 띠도 짚을 수 있게).
      links.slice().sort((a, b) => b.value - a.value).forEach((l) => {
        l.el = svgEl('path', { d: ribbon(l), class: `vzb-sk-link vzb-${l.tone}`, 'data-k': l.k });
        linkG.append(l.el);
      });
      nodes.forEach((n) => {
        n.el = svgEl('rect', { x: fx(n.x), y: fx(n.y0), width: NW, height: fx(n.h), rx: 2, class: `vzb-sk-node vzb-${n.tone}`, 'data-k': n.k });
        nodeG.append(n.el);
      });
      // 이름표: 노드 가운데에 맞추고, 같은 단에서 겹치면 위에서 아래로, 바닥을 넘으면 아래에서 위로 밀어 냅니다.
      cols.forEach((c) => {
        c.forEach((n, i) => { n.ly = Math.max((n.y0 + n.y1) / 2, LH / 2, i ? c[i - 1].ly + LH : -Infinity); });
        for (let i = c.length - 1; i >= 0; i--) c[i].ly = Math.min(c[i].ly, h - LH / 2, i < c.length - 1 ? c[i + 1].ly - LH : Infinity);
      });
      nodes.forEach((n) => {
        const left = n.col === 0 && L > 0, x = left ? n.x - 8 : n.x + NW + 8, anchor = left ? 'end' : 'start';
        const g = svgEl('g', { class: `vzb-sk-lab${n.col > 0 && n.col < L ? ' is-over' : ''}`, 'data-k': n.k });
        const v = svgText(x, n.ly + 13, n.num, 'vzb-sk-val', anchor);
        if (n.unit) { const u = svgEl('tspan', { class: 'vzb-sk-unit', dx: 2 }); u.textContent = n.unit; v.append(u); }
        g.append(svgText(x, n.ly - 3, n.name, 'vzb-sk-name', anchor), v);
        labG.append(g);
        n.lab = g;
      });
      svg.append(linkG, nodeG, labG);
    }
    onSize(plot, draw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (lastW) draw(lastW, lastH); });
    interact(plot, order.length,
      (cx, cy) => {
        const e = document.elementFromPoint(cx, cy), hit = e && e.closest ? e.closest('[data-k]') : null;
        return hit && svg.contains(hit) ? +hit.getAttribute('data-k') : -1;
      },
      (k) => {
        const it = order[k], onN = new Set(), onL = new Set();
        if (it.node) { onN.add(it.node); it.node.ins.concat(it.node.outs).forEach((l) => { onL.add(l); onN.add(l.s); onN.add(l.t); }); }
        else { onL.add(it.link); onN.add(it.link.s); onN.add(it.link.t); }
        svg.classList.add('is-hover');
        nodes.forEach((n) => { if (n.el) { n.el.classList.toggle('is-on', onN.has(n)); n.lab.classList.toggle('is-on', onN.has(n)); } });
        links.forEach((l) => { if (l.el) l.el.classList.toggle('is-on', onL.has(l)); });
        const r = plot.getBoundingClientRect();
        if (it.link) {
          const l = it.link, notes = [];
          if (l.value < l.s.value) notes.push(`${l.s.name}의 ${pct(l.value, l.s.value)}`);
          if (l.value < l.t.value) notes.push(`${l.t.name}의 ${pct(l.value, l.t.value)}`);
          const label = `${l.s.name} → ${l.t.name}`, t = tipBody({ value: show(f, l.value), note: notes }, label);
          return { x: r.left + (l.s.x + NW + l.t.x) / 2, y: r.top + (l.sy + l.ty) / 2 - 4, label, value: t.node, text: t.text };
        }
        // 노드: 마지막 단은 어디서 왔는지, 나머지 단은 어디로 가는지를 큰 순서로 다섯 줄까지 적습니다.
        const n = it.node, end = L > 0 && n.col === L;
        const list = (end ? n.ins : n.outs).slice().sort((a, b) => b.value - a.value);
        const notes = [], colSum = total(cols[n.col]);
        if (list.length > 5) notes.push(`외 ${list.length - 5}곳 ${show(f, total(list.slice(5)))}`);
        if (list.length > 1) notes.push(`합계 ${show(f, n.value)}`);
        if (end && n.ins.length === 1) { if (n.value < n.ins[0].s.value) notes.push(`${n.ins[0].s.name}의 ${pct(n.value, n.ins[0].s.value)}`); }
        else if (n.value < colSum) notes.push(`전체의 ${pct(n.value, colSum)}`);
        const spec = list.length > 1
          ? { rows: list.slice(0, 5).map((l) => ({ tone: l.tone, value: show(f, l.value), name: end ? l.s.name : l.t.name })), note: notes }
          : { value: show(f, n.value), note: notes };
        const t = tipBody(spec, n.name);
        return { x: r.left + (end ? n.x : n.x + NW), y: r.top + Math.max(0, n.y0), label: n.name, value: t.node, text: t.text, side: end ? 'left' : true };
      },
      () => { svg.classList.remove('is-hover'); svg.querySelectorAll('.is-on').forEach((x) => x.classList.remove('is-on')); },
      false, true);
  }
