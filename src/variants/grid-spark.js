  // Grid - Spark: 줄마다 기간 흐름을 작은 선으로 넣고, 마지막 값과 첫 값 대비 증감을 적습니다. 13개월이면 전년 동월 대비가 됩니다.
  // 선은 줄마다 자기 범위에 맞춰 그리므로 크기 비교는 숫자 열로 합니다.
  mount('grid-spark', (card, d, f) => {
    const L = d.labels || [];
    const pick = (v) => ({ values: v, last: v[v.length - 1], first: v[0] });
    const rows = (d.rows || []).map((r) => Object.assign({ name: r.name }, pick(r.values || [])));
    // 합계 줄: 모든 줄에 값이 있는 달만 더합니다. 빠진 줄이 있는 달은 비워 두어 합계가 꺾여 보이지 않게 합니다.
    const sum = () => pick(L.map((_, i) => (rows.every((r) => ok(r.values[i])) ? rows.reduce((a, r) => a + +r.values[i], 0) : null)));
    tableCard(card, d, f, {
      rows,
      total: d.total === false ? null : '합계',
      sortable: true,
      sortKey: 'last',
      sortDir: -1,
      money: f.usd ? [['last']] : null,
      columns: [
        { key: 'name', label: d.nameLabel || '이름' },
        { key: 'spark', label: L.length ? `${L[0]}–${L[L.length - 1]}` : '흐름', sort: false, cell: (r) => sparkEl(r.values), total: () => sparkEl(sum().values) },
        { key: 'last', label: d.valueLabel || L[L.length - 1] || '최근', unit: unitOf(d, f), total: () => sum().last },
        { key: 'chg', label: d.changeLabel || '처음 대비', value: (r) => (ok(r.first) && +r.first && ok(r.last) ? r.last / r.first - 1 : null), cell: (r) => changeBadge(r.last, r.first, d.better), total: () => { const t = sum(); return changeBadge(t.last, t.first, d.better); } },
      ],
    });
  });
