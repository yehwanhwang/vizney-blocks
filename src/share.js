  /* 구성비 공통: 큰 세 항목만 주황 · 분홍빨강 · 노랑으로 칠하고 나머지는 회색 기타 하나로 묶습니다(KPI - Stacked Bar와 같은 규칙).
     비중 카드는 비중을 적고 금액은 툴팁에 둡니다. 조각이나 범례 줄에 마우스를 올리면 그 조각만 진하게 남깁니다. */

  // 큰 세 항목과 기타. sort가 false면 적은 순서대로 둡니다. members는 묶인 원래 항목입니다.
  function foldParts(items, sort) {
    const ok = (p) => p && p.value != null && +p.value > 0;
    let named = (items || []).filter((p) => ok(p) && !p.other);
    if (sort !== false) named = named.slice().sort((a, b) => b.value - a.value);
    const rest = named.slice(3).concat((items || []).filter((p) => ok(p) && p.other));
    const parts = named.slice(0, 3).map((p, i) => ({ name: p.name, value: +p.value, tone: `f${i + 1}`, members: [p] }));
    if (rest.length === 1) parts.push({ name: rest[0].name, value: +rest[0].value, tone: 'fx', members: rest });
    else if (rest.length) parts.push({ name: '기타', value: rest.reduce((a, p) => a + +p.value, 0), tone: 'fx', note: rest.map((p) => p.name).join('·'), members: rest });
    const total = parts.reduce((a, p) => a + p.value, 0);
    parts.forEach((p) => { p.share = total ? p.value / total : 0; });
    return { parts, total };
  }
  const pctOf = (x) => `${num(x * 100, 1)}%`;

  // 도넛 · 와플 카드 틀: 왼쪽에 그림(draw), 오른쪽에 색 · 이름 · 비중 범례.
  // cfg: items · sort · draw(fig, P) → 조각마다 강조할 요소 목록 · fit(fig, legend, w, h) → 카드에 남은 자리에 그림 크기 맞추기.
  // 돌려주는 show(cfg 일부)로 다른 항목을 다시 그립니다(Donut - Tabs).
  function shareCard(card, d, f, cfg) {
    head(card, d, f, null);
    if (cfg.top) card.append(cfg.top);
    const foot = el('div', 'vzb-foot vzb-fill vzb-sh');
    const body = el('div', 'vzb-sh-body');
    body.tabIndex = 0;
    body.setAttribute('role', 'group');
    const fig = el('div', 'vzb-sh-fig');
    const leg = el('ul', 'vzb-sh-legend');
    body.append(fig, leg);
    foot.append(body);
    card.append(foot);
    let S, P, marks = [], rows = [];
    function use(next) {
      S = Object.assign({ f }, cfg, next);
      P = Object.assign(foldParts(S.items, S.sort), { f: S.f });
      fig.replaceChildren();
      marks = S.draw(fig, P);
      rows = P.parts.map((p, i) => {
        const li = el('li');
        li.dataset.i = i;
        li.append(el('i', `vzb-key is-box vzb-${p.tone}`), el('span', null, p.name), el('b', null, pctOf(p.share)));
        return li;
      });
      leg.replaceChildren(...rows);
      body.setAttribute('aria-label', `${S.name || d.title || ''}: ${P.parts.map((p) => `${p.name} ${pctOf(p.share)}`).join(', ')}, 합계 ${show(S.f, P.total)}. 좌우 화살표로 항목을 옮깁니다.`);
    }
    use({});
    let size = null;
    if (cfg.fit) onSize(foot, (w, h) => { size = [w, h]; cfg.fit(fig, leg, w, h); });
    const dim = (i) => P.parts.forEach((_, j) => {
      const off = i >= 0 && j !== i;
      (marks[j] || []).forEach((m) => m.classList.toggle('is-dim', off));
      if (rows[j]) rows[j].classList.toggle('is-dim', off);
    });
    const api = interact(body, () => P.parts.length,
      (cx, cy) => {
        const t = document.elementFromPoint(cx, cy), hit = t && t.closest('[data-i]');
        return hit && body.contains(hit) ? +hit.dataset.i : -1;
      },
      (i) => {
        dim(i);
        const p = P.parts[i], name = p.note ? `${p.name} (${p.note})` : p.name;
        const t = tipBody({ value: show(S.f, p.value), note: `전체의 ${pctOf(p.share)}` }, name);
        const r = (marks[i] && marks[i][0] ? marks[i][0] : rows[i]).getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top, label: name, value: t.node, text: t.text };
      },
      () => dim(-1));
    return { show(next) { api.end(); use(next); if (cfg.fit && size) cfg.fit(fig, leg, ...size); } };
  }

  // 도넛: 지름 140px, 굵기 16px, 조각 사이 2px. 가운데에 합계를 적습니다.
  function ringPath(c, r1, r0, s, e) {
    if (e - s >= Math.PI * 2 - 1e-6) return ringPath(c, r1, r0, s, s + Math.PI) + ringPath(c, r1, r0, s + Math.PI, s + Math.PI * 2 - 1e-4);
    const R = (v) => +v.toFixed(2), big = e - s > Math.PI ? 1 : 0;
    const pt = (r, a) => `${R(c + r * Math.cos(a))},${R(c + r * Math.sin(a))}`;
    return `M${pt(r1, s)}A${r1},${r1} 0 ${big} 1 ${pt(r1, e)}L${pt(r0, e)}A${r0},${r0} 0 ${big} 0 ${pt(r0, s)}Z`;
  }
  function drawDonut(fig, P) {
    const size = 140, r = 70, w = 16, svg = svgEl('svg', { viewBox: `0 0 ${size} ${size}`, class: 'vzb-sh-donut', 'aria-hidden': 'true' });
    const marks = [];
    let a = -Math.PI / 2;
    P.parts.forEach((p, i) => {
      const ang = p.share * Math.PI * 2, pad = P.parts.length > 1 ? Math.min(ang * 0.4, 2 / (r - w / 2)) : 0;
      const path = svgEl('path', { d: ringPath(size / 2, r, r - w, a + pad / 2, a + ang - pad / 2), class: `vzb-sh-slice vzb-${p.tone}` });
      path.dataset.i = i;
      svg.append(path);
      marks.push([path]);
      a += ang;
    });
    const center = el('div', 'vzb-sh-center');
    center.append(figure(P.f, P.total), el('span', 'vzb-sh-cap', '합계'));
    fig.append(svg, center);
    return marks;
  }
  // 와플: 10×10칸. 칸 수는 가장 큰 나머지부터 올려 100칸에 맞추고, 큰 항목부터 왼쪽 위에서 채웁니다. 칸 크기는 fitWaffle이 정합니다.
  function drawWaffle(fig, P) {
    const raw = P.parts.map((p) => p.share * 100), cnt = raw.map(Math.floor);
    let left = P.total ? 100 - cnt.reduce((a, b) => a + b, 0) : 0;
    raw.map((v, i) => [v - cnt[i], i]).sort((x, y) => y[0] - x[0]).forEach(([, i]) => { if (left > 0) { cnt[i] += 1; left -= 1; } });
    const grid = el('div', 'vzb-sh-waffle');
    const marks = P.parts.map(() => []);
    P.parts.forEach((p, i) => {
      for (let k = 0; k < cnt[i]; k++) {
        const cell = el('i', `vzb-${p.tone}`);
        cell.dataset.i = i;
        grid.append(cell);
        marks[i].push(cell);
      }
    });
    fig.append(grid, el('p', 'vzb-sh-cap', `한 칸 1% · 합계 ${show(P.f, P.total)}`));
    return marks;
  }
  // 와플 칸 크기: 범례가 제 폭(카드 폭의 절반까지)을 쓰고 남은 폭과, 카드에 남은 높이 가운데 작은 쪽에 맞춰 10–24px로 정합니다.
  function fitWaffle(fig, leg, w, h) {
    const grid = fig.querySelector('.vzb-sh-waffle'), cap = fig.querySelector('.vzb-sh-cap');
    if (!grid) return;
    const was = leg.style.width;
    leg.style.width = 'max-content';
    const lw = Math.min(leg.getBoundingClientRect().width, 240, w / 2);
    leg.style.width = was;
    const byW = (w - lw - 32 - 18) / 10, byH = (h - (cap ? cap.offsetHeight + 10 : 0) - 18) / 10;
    grid.style.setProperty('--vzb-cell', `${Math.max(10, Math.min(24, Math.floor(Math.min(byW, byH))))}px`);
  }
