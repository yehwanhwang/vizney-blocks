  // KPI - Stacked Bar: 합계를 이루는 부분의 비중을 간격 있는 둥근 조각으로 나눕니다. 조각은 네 개까지입니다.
  // 큰 세 항목은 주황 · 분홍빨강 · 노랑으로, 나머지(와 "other": true인 항목)는 회색 한 조각으로 묶습니다.
  // 범례는 두 줄 두 칸에 이름과 비중만 적고, 금액은 조각이나 범례에 마우스를 올리면 툴팁으로 보여줍니다.
  mount('kpi-stacked-bar', (card, d, f) => {
    const sum = (list) => list.reduce((s, p) => s + p.value, 0);
    let named = d.parts.filter((p) => !p.other);
    if (d.sort !== false) named = named.slice().sort((a, b) => b.value - a.value);
    const rest = named.slice(3).concat(d.parts.filter((p) => p.other));
    const segs = named.slice(0, 3).map((p, i) => ({ label: p.label, value: p.value, cls: `vzb-sp-c${i + 1}` }));
    if (rest.length === 1) segs.push({ label: rest[0].label, value: rest[0].value, cls: 'vzb-sp-co' });
    else if (rest.length) segs.push({ label: tx(d, '기타'), value: sum(rest), cls: 'vzb-sp-co', note: rest.map((p) => p.label).join('·') });
    const whole = sum(segs) || 1;
    const share = (v) => `${num((v / whole) * 100, 1)}%`;
    head(card, d, f, d.value != null ? d.value : sum(d.parts), d.compare);

    const foot = el('div', 'vzb-foot');
    const bar = el('div', 'vzb-plot vzb-sp-bar');
    bar.tabIndex = 0;
    bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', tx(d, '%s. 좌우 화살표로 항목을 옮깁니다.', segs.map((s) => `${s.label} ${share(s.value)}`).join(', ')));
    const legend = el('ul', 'vzb-sp-legend');
    const segEls = [], rowEls = [];
    const focus = (i) => {
      segEls.forEach((e, j) => e.classList.toggle('vzb-dim', i >= 0 && j !== i));
      rowEls.forEach((e, j) => e.classList.toggle('vzb-dim', i >= 0 && j !== i));
    };
    segs.forEach((s, i) => {
      const seg = el('i', `vzb-sp-seg ${s.cls}`);
      seg.style.flexGrow = Math.max(0, s.value);
      bar.append(seg);
      segEls.push(seg);
      const row = el('li');
      const name = el('span', 'vzb-sp-name', s.label);   // 기타에 든 항목은 툴팁에 적습니다
      row.append(el('i', `vzb-sp-key ${s.cls}`), name, el('b', null, share(s.value)));
      row.addEventListener('pointerenter', () => { const p = point(i); showTip(p.x, p.y, p.label, p.value); });
      row.addEventListener('pointerleave', () => { focus(-1); hideTip(); });
      legend.append(row);
      rowEls.push(row);
    });
    foot.append(bar, legend);
    card.append(foot);
    function point(i) {
      focus(i);
      const r = segEls[i].getBoundingClientRect(), s = segs[i];
      return { x: r.left + r.width / 2, y: r.top, label: s.note ? `${s.label} (${s.note})` : s.label, value: `${show(f, s.value)} · ${share(s.value)}` };
    }
    interact(bar, segs.length,
      (cx) => { const i = segEls.findIndex((e) => cx <= e.getBoundingClientRect().right + 1); return i < 0 ? segs.length - 1 : i; },
      point,
      () => focus(-1));
  });
