  /* 퍼널 공통: 단계마다 같은 폭의 칸을 두고, 칸 안에서는 단계 값만큼의 두께를 평평하게 유지하다가 칸 경계를 지나며 S자 곡선으로
     다음 단계의 두께로 바뀌는 흐름을 그립니다. 칸 위(labels)나 아래(cells)에 단계 이름과 값을 두고, 칸에 마우스를 올리거나
     카드에 포커스한 뒤 좌우 화살표를 누르면 나머지 칸의 흐름을 옅게 덮어 그 칸만 남기고 툴팁을 보여줍니다.
     cfg: steps [{ name }] · top(머리 아래 요소) · labels(i) / cells(i) → 칸 요소 · paint(svg, G) → 짚을 때 다시 칠할 모양 [{ d }]
          over(svg, G) 흐름 위 덧그림 · tip(i) → { value, note } 또는 { rows, note }, note는 글 또는 줄 배열 */
  function funnelCard(card, d, f, cfg) {
    const steps = cfg.steps, n = steps.length;
    head(card, d, f, null);
    if (cfg.top) card.append(cfg.top);
    const foot = el('div', 'vzb-foot vzb-fill vzb-fu');
    foot.style.setProperty('--vzb-fu-n', Math.max(1, n));
    foot.tabIndex = 0;
    foot.setAttribute('role', 'group');
    foot.setAttribute('aria-label', tx(d, '%s 퍼널, %s. 좌우 화살표로 단계를 옮깁니다.', d.title || '', steps.map((s) => s.name).join(' → ')));
    const row = (make, cls) => { const r = el('div', `vzb-fu-row ${cls}`); steps.forEach((s, i) => { const c = make(i); c.classList.add('vzb-fu-cell'); r.append(c); }); return r; };
    const headRow = cfg.labels ? row(cfg.labels, 'vzb-fu-head') : null;
    const plot = el('div', 'vzb-plot vzb-fu-plot');
    const svg = svgEl('svg', { class: 'vzb-fu-svg', 'aria-hidden': 'true' });
    plot.append(svg);
    const cellRow = cfg.cells ? row(cfg.cells, 'vzb-fu-cells') : null;
    if (headRow) foot.append(headRow);
    foot.append(plot);
    if (cellRow) foot.append(cellRow);
    card.append(foot);
    let G = null, shapes = [], front = null, lastW = 0, lastH = 0;
    function draw(w, h) {
      lastW = w; lastH = h;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.replaceChildren();
      if (!n) return;
      // 칸 i의 평평한 구간: 앞뒤 칸 경계에서 칸 폭의 25%씩 떨어진 곳까지(첫 칸은 왼쪽 끝부터, 마지막 칸은 오른쪽 끝까지)
      const cw = w / n;
      const cols = steps.map((_, i) => ({ x: i * cw, a: i ? i * cw + cw * 0.25 : 0, b: i < n - 1 ? (i + 1) * cw - cw * 0.25 : w, c: i * cw + cw / 2 }));
      G = { n, w, h, cw, cols };
      shapes = cfg.paint(svg, G) || [];
      front = svgEl('g', {});
      svg.append(front);
      if (cfg.over) cfg.over(svg, G);
    }
    onSize(plot, draw);
    const rows = [headRow, cellRow].filter(Boolean);
    interact(foot, n,
      (cx) => {
        const r = foot.getBoundingClientRect();
        return Math.max(0, Math.min(n - 1, Math.floor(((cx - r.left) / Math.max(1, r.width)) * n)));
      },
      (i) => {
        rows.forEach((r) => [...r.children].forEach((c, k) => c.classList.toggle('is-on', k === i)));
        if (front && G) {
          const id = `vzb-fc${Math.random().toString(36).slice(2, 8)}`, defs = svgEl('defs', {}), clip = svgEl('clipPath', { id });
          G.cols.forEach((c, k) => { if (k !== i) clip.append(svgEl('rect', { x: c.x, y: -2, width: G.cw, height: G.h + 4 })); });
          defs.append(clip);
          front.replaceChildren(defs, ...shapes.map((s) => svgEl('path', { d: s.d, class: 'vzb-fu-shade', 'clip-path': `url(#${id})` })));
        }
        // 툴팁은 짚은 칸 옆(마지막 칸은 왼쪽)에 두어 칸 위의 이름과 값을 가리지 않게 합니다.
        const t = tipBody(cfg.tip(i), steps[i].name);
        const pr = plot.getBoundingClientRect(), edge = G ? (i < n - 1 ? G.cols[i].x + G.cw : G.cols[i].x) : 0;
        return { x: pr.left + edge, y: pr.top + 6, label: steps[i].name, value: t.node, text: t.text, side: i < n - 1 ? true : 'left' };
      },
      () => { rows.forEach((r) => [...r.children].forEach((c) => c.classList.remove('is-on'))); if (front) front.replaceChildren(); });
  }
  // 단계마다의 위 · 아래 y로 띠를 만듭니다. 평평한 구간은 가로선, 칸 사이는 S자 곡선(양 끝 기울기 0)으로 잇습니다.
  function flowBand(cols, top, bot) {
    const R = (v) => +v.toFixed(2), n = cols.length;
    let p = `M${R(cols[0].a)},${R(top[0])}`;
    for (let i = 0; i < n; i++) {
      p += `H${R(cols[i].b)}`;
      if (i < n - 1) { const m = (cols[i].b + cols[i + 1].a) / 2; p += `C${R(m)},${R(top[i])} ${R(m)},${R(top[i + 1])} ${R(cols[i + 1].a)},${R(top[i + 1])}`; }
    }
    p += `V${R(bot[n - 1])}`;
    for (let i = n - 1; i >= 0; i--) {
      p += `H${R(cols[i].a)}`;
      if (i > 0) { const m = (cols[i - 1].b + cols[i].a) / 2; p += `C${R(m)},${R(bot[i])} ${R(m)},${R(bot[i - 1])} ${R(cols[i - 1].b)},${R(bot[i - 1])}`; }
    }
    return `${p}Z`;
  }
  // 흐름 안의 비율 알약: 흰 바탕에 굵은 글자, 옅은 그림자
  function fuPill(svg, x, y, text) {
    const w = String(text).length * 7.2 + 18, g = svgEl('g', { class: 'vzb-fu-pill' });
    g.append(svgEl('rect', { x: x - w / 2, y: y - 11, width: w, height: 22, rx: 11 }), fuText(x, y + 4, text, 'vzb-fu-pill-text', 'middle'));
    svg.append(g);
  }
  function fuGradient(svg, stops) {
    const id = `vzb-fg${Math.random().toString(36).slice(2, 8)}`, defs = svgEl('defs', {}), g = svgEl('linearGradient', { id, x1: 0, y1: 0, x2: 1, y2: 0 });
    stops.forEach(([off, cls]) => g.append(svgEl('stop', { offset: off, class: cls })));
    defs.append(g);
    svg.append(defs);
    return `url(#${id})`;
  }
  const fuPct = (a, b) => (!b ? '–' : a === b ? '100%' : `${num((a / b) * 100, 1)}%`);
  function fuText(x, y, s, cls, anchor) {
    const t = svgEl('text', { x, y, class: cls, 'text-anchor': anchor || 'start' });
    t.textContent = s;
    return t;
  }
