  // Grid - Basic: 숫자는 오른쪽 정렬, 단위는 열 제목에 적은 기본 표입니다. 열 제목을 누르면 그 열로 정렬하고, 합계 줄은 맨 아래에 둡니다.
  // 열의 total이 "sum"이면 합을 적고, "type": "change" 열은 of 값과 base 값의 증감률을 배지로 적되 합계 줄은 합계끼리 다시 계산합니다.
  mount('grid-basic', (card, d, f) => {
    const columns = (d.columns || []).map((c) => {
      const col = Object.assign({}, c, { total: null });
      if (c.type === 'change') {
        col.value = (r) => (+r[c.base] ? (r[c.of] / r[c.base] - 1) * 100 : null);
        col.cell = (r) => changeBadge(r[c.of], r[c.base], d.better);
        col.total = (rows) => changeTotal(rows, c.of, c.base, d.better);
      } else if (c.total === 'sum') col.total = sumOf(c.key);
      return col;
    });
    tableCard(card, d, f, {
      columns,
      rows: d.rows || [],
      total: d.total === false ? null : '합계',
      sortable: true,
      sortKey: d.sortKey || (columns[1] && columns[1].key),
      sortDir: -1,
    });
  });
