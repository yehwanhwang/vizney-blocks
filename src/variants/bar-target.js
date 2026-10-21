  // Bar - Target: 막대마다 목표를 짧은 가로선으로 긋고, 목표에 못 미친 막대는 옅게 칠합니다.
  // 낮을수록 좋은 지표("better": "down")는 목표를 넘은 막대를 옅게 칠합니다. 툴팁에는 목표와 달성률을 적습니다.
  mount('bar-target', (card, d, f) => {
    const vals = d.values || [], goals = d.targets || [], down = d.better === 'down';
    const miss = (i) => vals[i] != null && goals[i] != null && (down ? vals[i] > goals[i] : vals[i] < goals[i]);
    const name = d.targetLabel || '목표', value = d.valueLabel || '실적';
    barCard(card, d, f, {
      series: [{ name: value, values: vals, tone: 'f1', dim: miss }],
      extra: goals,
      legend: [
        { name: value, tone: 'f1', box: true },
        { name, tone: 'ti' },
        { name: `${name} ${down ? '초과' : '미달'}`, tone: 'f1', box: true, dim: true },
      ],
      over: (svg, c) => goals.forEach((g, i) => {
        if (g == null || i >= c.n) return;
        const y = Math.round(c.y(g)) + 0.5, half = c.bw / 2 + 4;
        svg.append(svgEl('line', { x1: c.xs[i] - half, x2: c.xs[i] + half, y1: y, y2: y, class: 'vzb-bar-goal' }));
      }),
      tip: (i) => (vals[i] == null ? { value: '–' } : {
        value: show(f, vals[i]),
        note: goals[i] == null ? '' : `${name} ${show(f, goals[i])} · 달성률 ${num((vals[i] / goals[i]) * 100, 1)}%`,
      }),
    });
  });
