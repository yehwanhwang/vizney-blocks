  // Waterfall - Basic: 기준 합계에서 요인별 증감을 쌓아 결과 합계에 이르는 과정을 보여줍니다. 합계는 주황, 늘린 요인은 초록,
  // 줄인 요인은 빨강(KPI 배지와 같은 색)이며, 낮을수록 좋은 지표("better": "down")는 증감 색을 뒤집습니다.
  mount('waterfall-basic', (card, d, f) => {
    const want = d.better === 'down' ? -1 : 1;
    waterfallCard(card, d, f, {
      toneOf: (r) => (r.total ? 'f1' : Math.sign(r.value) * want > 0 ? 'fg' : r.value === 0 ? 'f0' : 'fb'),
      totalNote: (r, first) => { const diff = r.value - first.value, sg = diff > 0 ? '+' : diff < 0 ? '−' : ''; return tx(d, '%s 대비 %s', first.name, `${sg}${show(f, Math.abs(diff))}${first.value ? ` (${sg}${num(Math.abs(diff / first.value) * 100, 1)}%)` : ''}`); },
      legend: [{ name: tx(d, '합계'), tone: 'f1', box: true }, { name: tx(d, want > 0 ? '늘린 요인' : '줄인 요인'), tone: 'fg', box: true }, { name: tx(d, want > 0 ? '줄인 요인' : '늘린 요인'), tone: 'fb', box: true }],
    });
  });
