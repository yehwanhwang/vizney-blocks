  // Grid - Pivot: 행 × 열 교차표에 행 합계(오른쪽 끝 열)와 열 합계(맨 아래 줄)를 둡니다. 열이 네 개를 넘으면 큰 세 열만 두고
  // 나머지는 기타 열로 묶습니다. 칸에 마우스를 올리면 같은 행과 열을 함께 칠합니다.
  mount('grid-pivot', (card, d, f) => {
    const parts = d.columns || [], src = d.rows || [];
    const colSum = (j) => src.reduce((a, r) => a + (+(r.values || [])[j] || 0), 0);
    const add = (vals) => (vals.some(ok) ? vals.filter(ok).reduce((a, x) => a + +x, 0) : null);   // 빈 칸은 0이 아니라 빈 칸으로 둡니다
    let order = parts.map((_, j) => j);
    if (d.sort !== false) order = order.sort((a, b) => colSum(b) - colSum(a));
    const keep = parts.length > 4 ? order.slice(0, 3) : order, rest = parts.length > 4 ? order.slice(3) : [];
    const names = keep.map((j) => parts[j]).concat(rest.length ? ['기타'] : []);
    const rows = src.map((r) => {
      const v = r.values || [], out = { name: r.name };
      keep.forEach((j, k) => { out[`c${k}`] = ok(v[j]) ? +v[j] : null; });
      if (rest.length) out[`c${keep.length}`] = add(rest.map((j) => v[j]));
      out.total = add(parts.map((_, j) => v[j]));
      return out;
    });
    const { table } = tableCard(card, d, f, {
      rows,
      total: '합계',
      sortable: true,
      sortKey: 'total',
      sortDir: -1,
      money: f.usd ? [names.map((_, k) => `c${k}`).concat('total')] : null,
      moneyHead: 'name',
      columns: [{ key: 'name', label: d.nameLabel || '' }]
        .concat(names.map((n, k) => ({ key: `c${k}`, label: n, total: sumOf(`c${k}`) })))
        .concat([{ key: 'total', label: '합계', head: 'vzb-tb-sum', total: sumOf('total') }]),
    });
    table.classList.add('is-pivot');
    let col = -1;
    const mark = (k) => {
      if (k === col) return;
      col = k;
      table.querySelectorAll('tr').forEach((tr) => [...tr.children].forEach((c, j) => c.classList.toggle('is-col', k > 0 && j === k)));
    };
    table.addEventListener('pointerover', (e) => { const c = e.target.closest('td, th'); mark(c && table.contains(c) ? c.cellIndex : -1); });
    table.addEventListener('pointerleave', () => mark(-1));
    table.addEventListener('click', () => { const k = col; col = -1; mark(k); });   // 정렬로 줄이 새로 그려지면 열 강조를 다시 칠합니다
  });
