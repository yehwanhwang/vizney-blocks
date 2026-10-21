  // Bar - Grouped: 항목마다 막대 2–3개를 붙여 세웁니다. 비교 기준("base": true)은 회색, 나머지는 주황 · 분홍빨강 · 노랑입니다.
  // 툴팁에는 묶음의 값을 모두 적고, 기준과 비교 대상이 하나씩이면 기준 대비 증감을 함께 적습니다.
  mount('bar-grouped', (card, d, f) => {
    let k = 0;
    const series = (d.series || []).slice(0, 3).map((s) => ({ name: s.name, values: s.values || [], base: !!s.base, tone: s.base ? 'f0' : `f${++k}` }));
    const base = series.filter((s) => s.base), main = series.filter((s) => !s.base);
    barCard(card, d, f, {
      series,
      categorical: d.categorical !== false,
      legend: series.map((s) => ({ name: s.name, tone: s.tone, box: true })),
      tip: (i) => {
        const rows = series.filter((s) => s.values[i] != null).map((s) => ({ tone: s.tone, name: s.name, value: show(f, s.values[i]) }));
        if (base.length !== 1 || main.length !== 1 || main[0].values[i] == null || base[0].values[i] == null) return { rows };
        const dl = delta(f, main[0].values[i], base[0].values[i], d.better);
        return { rows, note: `${base[0].name} 대비 ${dl.dir > 0 ? '+' : dl.dir < 0 ? '−' : ''}${dl.text}` };
      },
    });
  });
