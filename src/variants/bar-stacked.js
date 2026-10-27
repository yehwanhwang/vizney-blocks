  // Bar - Stacked: 막대 하나를 항목별 조각으로 쌓습니다. 기간 전체 합이 큰 세 항목만 주황 · 분홍빨강 · 노랑으로 칠하고
  // 나머지는 회색 기타 하나로 묶습니다(KPI - Stacked Bar와 같은 규칙). 가장 큰 항목을 바닥에, 합계는 마지막 막대 오른쪽에 적습니다.
  mount('bar-stacked', (card, d, f) => {
    const n = (d.labels || []).length;
    const total = (s) => (s.values || []).reduce((a, v) => a + (+v || 0), 0);
    let named = (d.series || []).filter((s) => !s.other);
    if (d.sort !== false) named = named.slice().sort((a, b) => total(b) - total(a));
    const rest = named.slice(3).concat((d.series || []).filter((s) => s.other));
    const series = named.slice(0, 3).map((s, i) => ({ name: s.name, values: s.values || [], tone: `f${i + 1}` }));
    if (rest.length === 1) series.push({ name: rest[0].name, values: rest[0].values || [], tone: 'fx' });
    else if (rest.length) {
      series.push({
        name: tx(d, '기타'), note: rest.map((s) => s.name).join('·'), tone: 'fx',
        values: Array.from({ length: n }, (_, i) => (rest.every((s) => (s.values || [])[i] == null) ? null : rest.reduce((a, s) => a + (+(s.values || [])[i] || 0), 0))),
      });
    }
    const sum = (i) => series.reduce((a, s) => a + (+s.values[i] || 0), 0);
    barCard(card, d, f, {
      series,
      stack: true,
      label: 'last',
      padTop: 18,
      legend: series.map((s) => ({ name: s.name, tone: s.tone, box: true })),
      tip: (i) => ({
        rows: series.filter((s) => s.values[i] != null).map((s) => ({ tone: s.tone, name: s.note ? `${s.name}(${s.note})` : s.name, value: show(f, s.values[i]) })),
        note: tx(d, '합계 %s', show(f, sum(i))),
      }),
    });
  });
