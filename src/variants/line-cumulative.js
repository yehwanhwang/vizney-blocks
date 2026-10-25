  // Line - Cumulative: 이번 기간의 날짜별 누계(주황, 마지막 날에서 멈춤)를 지난 기간의 누계(회색), 목표선과 겹칩니다.
  // values에 일별 값을 적으면 카드가 누계로 바꿉니다(이미 누계라면 "accumulate": false). 세로축은 0에서 시작합니다.
  mount('line-cumulative', (card, d, f) => {
    const sum = (vals) => { let s = 0; return vals.map((v) => (v == null ? null : (s += +v))); };
    const run = (vals) => (d.accumulate === false ? vals : sum(vals));
    const cur = d.current || {}, prev = d.previous, t = d.target || {};
    const goal = t.value != null && isFinite(t.value) ? +t.value : null;
    const series = [{ name: cur.name || tx(d, '이번 기간'), values: run(cur.values || []), tone: 't1', dot: true }];
    if (prev) series.push({ name: prev.name || tx(d, '지난 기간'), values: run(prev.values || []), tone: 't0' });
    lineCard(card, d, f, {
      series,
      legend: series.map((s) => ({ name: s.name, tone: s.tone })),
      extra: goal == null ? [0] : [0, goal],
      padTop: 18,
      under: goal == null ? null : (svg, c) => {
        const y = Math.round(c.y(goal)) + 0.5;
        svg.append(svgEl('line', { x1: c.left - 4, x2: c.right, y1: y, y2: y, class: 'vzb-ax-ref' }));
      },
      side: goal == null ? null : [{ value: goal, lines: [t.label || tx(d, '목표'), show(f, goal)] }],
      over: (svg, c) => {   // 이번 기간의 마지막 누계는 점 위에 적습니다
        const i = lastIdx(series[0].values, c.n);
        if (i < 0) return;
        const y = c.y(series[0].values[i]);
        svg.append(svgText(c.xs[i], y - 10 < 12 ? y + 20 : y - 10, show(f, series[0].values[i]), 'vzb-ax-note', 'middle'));
      },
      tip: (i) => {
        const a = series[0].values[i], b = series[1] ? series[1].values[i] : null, rows = [], notes = [];
        if (a != null) rows.push({ tone: 't1', name: series[0].name, value: show(f, a) });
        if (b != null) rows.push({ tone: 't0', name: series[1].name, value: show(f, b) });
        if (a != null && b != null) {
          const dl = delta(f, a, b, d.better);
          notes.push(tx(d, '%s 대비 %s', series[1].name, `${dl.dir > 0 ? '+' : dl.dir < 0 ? '−' : ''}${dl.text}`));
        }
        if (a != null && goal) notes.push(tx(d, '목표의 %s%', num((a / goal) * 100, 1)));
        return { rows, note: notes.join(' · ') };
      },
    });
  });
