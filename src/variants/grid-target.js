  // Grid - Target: 목표 · 실적 · 달성률을 한 줄에 적고, 달성률 칸에 목표까지 찬 막대를, 상태 칸에 달성 · 미달 배지를 둡니다.
  // 막대와 배지는 같은 색입니다(달성 초록 · 미달 빨강, KPI 배지와 같은 색). 막대 바탕은 같은 색의 옅은 단계입니다.
  // 바탕 끝은 가장 높은 달성률(100% 미만이면 100%), 세로 눈금은 목표(100%)라 목표를 넘은 줄끼리도 길이 차이가 보입니다.
  // 달성률이 높은 순서로 두고, 합계 줄의 달성률은 합계끼리 다시 계산합니다. 낮을수록 좋은 지표는 "better": "down"입니다.
  mount('grid-target', (card, d, f) => {
    const down = d.better === 'down', rows = d.rows || [], unit = unitOf(d, f);
    const rateOf = (v, t) => (ok(v) && ok(t) && +t ? (v / t) * 100 : null);   // 실적이나 목표가 비었거나 목표가 0이면 계산하지 않습니다
    const tv = (rs) => sumOf('value')(rs), tt = (rs) => sumOf('target')(rs);
    const top = Math.max(100, ...rows.map((r) => rateOf(r.value, r.target) || 0), rateOf(tv(rows), tt(rows)) || 0);
    const met = (v, t) => (down ? v <= t : v >= t);
    const rateCell = (v, t) => {
      const r = rateOf(v, t), box = el('span', `vzb-tb-rate${r == null ? '' : met(v, t) ? ' is-good' : ' is-bad'}`), track = el('i', 'vzb-tb-track');
      const fill = el('i');
      fill.style.width = `${Math.max(0, Math.min(100, ((r || 0) / top) * 100)).toFixed(1)}%`;
      const goal = el('i', 'vzb-tb-goal');
      goal.style.left = `${((100 / top) * 100).toFixed(1)}%`;
      track.append(fill, goal);
      box.append(track, el('span', null, r == null ? '–' : `${num(r, 1)}%`));
      return box;
    };
    const state = (v, t) => (rateOf(v, t) != null ? el('span', `vzb-badge vzb-tb-state vzb-${met(v, t) ? 'good' : 'bad'}`, tx(d, met(v, t) ? (down ? '이내' : '달성') : (down ? '초과' : '미달'))) : el('span', 'vzb-tb-none', '–'));
    tableCard(card, d, f, {
      rows,
      total: d.total === false || !f.rel ? null : tx(d, '합계'),   // 비율 지표(pct)는 목표와 실적을 더할 수 없어 합계 줄을 두지 않습니다
      sortable: true,
      sortKey: 'rate',
      sortDir: down ? 1 : -1,
      money: f.usd ? [['target', 'value']] : null,
      columns: [
        { key: 'name', label: d.nameLabel || tx(d, '이름') },
        { key: 'target', label: tx(d, '목표'), unit, total: tt },
        { key: 'value', label: tx(d, '실적'), unit, total: tv },
        { key: 'rate', label: tx(d, '달성률'), head: 'vzb-tb-wide', value: (r) => rateOf(r.value, r.target), cell: (r) => rateCell(r.value, r.target), total: (rs) => rateCell(tv(rs), tt(rs)) },
        { key: 'state', label: tx(d, '상태'), value: (r) => rateOf(r.value, r.target), cell: (r) => state(r.value, r.target), total: (rs) => state(tv(rs), tt(rs)) },
      ],
    });
  });
