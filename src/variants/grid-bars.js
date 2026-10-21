  // Grid - Bars: 숫자 칸 뒤에 값에 비례한 옅은 막대를 깔아, 숫자를 읽으면서 크기도 견주게 합니다.
  // 막대 길이는 표에서 가장 큰 값을 칸 폭으로 맞추고, 비중 열은 합계 대비, 증감 열은 prev 대비입니다.
  mount('grid-bars', (card, d, f) => {
    const rows = d.rows || [];
    const max = Math.max(0, ...rows.map((r) => +r.value || 0)), total = sumOf('value')(rows);
    const columns = [
      { key: 'name', label: d.nameLabel || '이름' },
      {
        key: 'value', label: d.valueLabel || '값', unit: unitOf(d, f), head: 'vzb-tb-wide', total: () => total,
        cell: (r) => {
          const box = el('span', 'vzb-tb-bar'), bar = el('i');
          bar.style.width = `${(Math.max(0, Math.min(1, max ? r.value / max : 0)) * 100).toFixed(1)}%`;
          box.append(bar, el('span', null, cellNum(r.value, {})));
          return box;
        },
      },
      { key: 'share', label: '비중', pct: true, decimals: 1, value: (r) => (total ? (r.value / total) * 100 : null), total: () => (total ? 100 : null) },
    ];
    if (rows.some((r) => r.prev != null)) {
      columns.push({
        key: 'chg', label: d.changeLabel || '이전 대비',
        value: (r) => (+r.prev ? r.value / r.prev - 1 : null),
        cell: (r) => changeBadge(r.value, r.prev, d.better),
        total: () => changeTotal(rows, 'value', 'prev', d.better),
      });
    }
    tableCard(card, d, f, { rows, columns, total: '합계', sortable: true, sortKey: 'value', sortDir: -1 });
  });
