  // Line - Compare: 올해 선(주황)과 작년 선(회색)을 같은 월 축에 겹칩니다. 올해 선은 끝난 달에서 멈추고,
  // 남은 달은 작년 선으로 앞으로의 계절 흐름을 보여줍니다. 툴팁에는 두 해의 값과 증감을 함께 적습니다.
  mount('line-compare', (card, d, f) => {
    const cur = d.current || {}, prev = d.previous || {};
    const series = [
      { name: cur.name || '올해', values: cur.values || [], tone: 't1', dot: true },
      { name: prev.name || '작년', values: prev.values || [], tone: 't0' },
    ];
    lineCard(card, d, f, {
      series,
      legend: series.map((s) => ({ name: s.name, tone: s.tone })),
      padTop: 18,
      over: (svg, c) => {   // 올해의 마지막 값은 점 위에 적습니다
        const i = lastIdx(series[0].values, c.n);
        if (i < 0) return;
        const y = c.y(series[0].values[i]);
        svg.append(svgText(c.xs[i], y - 10 < 12 ? y + 20 : y - 10, show(f, series[0].values[i]), 'vzb-ax-note', 'middle'));
      },
      tip: (i) => {
        const a = series[0].values[i], b = series[1].values[i], rows = [];
        if (a != null) rows.push({ tone: 't1', name: series[0].name, value: show(f, a) });
        if (b != null) rows.push({ tone: 't0', name: series[1].name, value: show(f, b) });
        if (a == null || b == null) return { rows };
        const dl = delta(f, a, b, d.better);
        return { rows, note: `${series[1].name} 대비 ${dl.dir > 0 ? '+' : dl.dir < 0 ? '−' : ''}${dl.text}` };
      },
    });
  });
