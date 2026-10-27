  // Bar - Stacked 100%: 기간마다 100%로 맞춘 누적 막대로 구성비의 변화를 봅니다. 기간 전체 합이 큰 세 항목만 색을 주고 나머지는 회색 기타로 묶습니다.
  // 세로축은 0–100%이고, 툴팁에는 비중과 금액을 함께 적습니다.
  mount('bar-stacked-100', (card, d, f) => {
    const n = (d.labels || []).length, src = d.series || [];
    const totals = src.map((s) => ({ name: s.name, other: s.other, value: (s.values || []).reduce((a, v) => a + (+v || 0), 0), s }));
    const { parts } = foldParts(d, totals, d.sort);
    const raw = parts.map((p) => ({ name: p.name, note: p.note, tone: p.tone, values: Array.from({ length: n }, (_, i) => p.members.reduce((a, m) => a + (+(m.s.values || [])[i] || 0), 0)) }));
    const sums = Array.from({ length: n }, (_, i) => raw.reduce((a, s) => a + s.values[i], 0));
    const series = raw.map((s) => ({ name: s.name, tone: s.tone, values: s.values.map((v, i) => (sums[i] ? (v / sums[i]) * 100 : null)) }));
    const pf = format({ format: 'pct' }, d);
    barCard(card, d, pf, {
      series,
      stack: true,
      fmt: { format: 'pct' },
      extra: [100],
      legend: series.map((s) => ({ name: s.name, tone: s.tone, box: true })),
      tip: (i) => ({
        rows: raw.map((s, k) => ({ tone: s.tone, name: s.note ? `${s.name}(${s.note})` : s.name, value: `${num(series[k].values[i] || 0, 1)}% · ${show(f, s.values[i])}` })),
        note: tx(d, '합계 %s', show(f, sums[i])),
      }),
    });
  });
