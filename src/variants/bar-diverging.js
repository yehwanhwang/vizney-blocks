  // Bar - Diverging: 0선 위아래로 갈리는 값(목표 대비 차이, 증감)을 막대로 그립니다. 좋은 쪽은 초록, 나쁜 쪽은 빨강으로
  // KPI 배지와 같은 색을 쓰고, 낮을수록 좋은 지표("better": "down")는 색을 뒤집습니다. 값에는 부호를 붙이고, 마지막 값은 막대 끝 오른쪽에 적습니다.
  mount('bar-diverging', (card, d, f) => {
    const vals = d.values || [];
    const want = d.better === 'down' ? -1 : d.better === 'neutral' ? 0 : 1;
    const toneAt = (i) => {
      if (!want) return vals[i] >= 0 ? 'f1' : 'f0';
      const s = Math.sign(+vals[i] || 0) * want;
      return s > 0 ? 'fg' : s < 0 ? 'fb' : 'f0';
    };
    const sign = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${show(f, Math.abs(v))}`;
    const names = Array.isArray(d.legend) ? d.legend : null;
    barCard(card, d, f, {
      series: [{ name: d.title || '값', values: vals, tone: 'f0', toneAt }],
      legend: names && want ? [{ name: names[0], tone: 'fg', box: true }, { name: names[1], tone: 'fb', box: true }] : null,
      label: 'last',
      labelText: (v) => sign(v),
      padTop: 18,
      tip: (i) => ({ value: vals[i] == null ? '–' : sign(vals[i]) }),
    });
  });
