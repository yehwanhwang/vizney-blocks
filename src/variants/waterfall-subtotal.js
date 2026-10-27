  // Waterfall - Subtotal: 매출에서 비용을 차례로 빼며 소계(매출총이익, 영업이익)를 세우는 손익 구조입니다. 합계와 소계는 주황,
  // 빼는 항목은 회색, 더하는 항목은 옅은 주황으로 칠해 좋고 나쁨이 아니라 구조를 읽게 합니다. 값을 적지 않은 합계는 그때까지의 누계입니다.
  mount('waterfall-subtotal', (card, d, f) => {
    waterfallCard(card, d, f, {
      toneOf: (r) => (r.total ? 'f1' : r.value >= 0 ? 'fs' : 'f0'),
      totalNote: (r, first) => (first.value ? tx(d, '%1의 %2', first.name, `${num((r.value / first.value) * 100, 1)}%`) : ''),
      legend: [{ name: tx(d, '합계 · 소계'), tone: 'f1', box: true }, { name: tx(d, '빼는 항목'), tone: 'f0', box: true }],
    });
  });
