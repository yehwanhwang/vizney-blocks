  // Bar - Compare: 이름을 얹은 막대 위에 비교 값(prev)을 세로 눈금으로 긋고, 오른쪽에 값과 KPI와 같은 증감 배지를 둡니다.
  // 묶인 기타 줄도 합계끼리 비교한 증감을 적습니다.
  mount('bar-compare', (card, d, f) => {
    const now = d.currentLabel || '이번 기간', base = d.compareLabel || '비교 기간';
    listCard(card, d, f, {
      items: d.items || [],
      max: d.max,
      sort: d.sort,
      layout: 'overlay',
      cols: 'minmax(0, 1fr) auto auto',
      legend: [{ name: now, tone: 'fs', box: true }, { name: base, tone: 'ti', tick: true }],
      fold: (rest) => foldRest(rest, ['value', 'prev']),
      prepare: (shown) => ({ max: Math.max(0, ...shown.filter((x) => !x.rest).map((x) => Math.max(+x.value || 0, +x.prev || 0))) }),
      cells: (it, c) => {
        const b = it.prev != null ? badge(f, it.value, it.prev, d.better) : el('span');
        b.classList.add('vzb-li-badge');
        const bar = it.rest ? restName(it) : overlayBar(it.name, share(it.value, c.max), it.prev == null ? null : share(it.prev, c.max));
        return [bar, el('b', 'vzb-li-val', show(f, it.value)), b];
      },
      tip: (it) => {
        const rows = [{ tone: 'fs', name: now, value: show(f, it.value) }];
        if (it.prev == null) return { rows };
        rows.push({ tone: 'f0', name: base, value: show(f, it.prev) });
        const dl = delta(f, it.value, it.prev, d.better);
        return { rows, note: `${base} 대비 ${dl.dir > 0 ? '+' : dl.dir < 0 ? '−' : ''}${dl.text}` };
      },
    });
  });
