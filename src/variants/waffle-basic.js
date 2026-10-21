  // Waffle - Basic: 100칸 가운데 몇 칸인지로 비중을 보여줍니다. 칸 수는 반올림 차이를 가장 큰 나머지부터 맞춰 늘 100칸이 됩니다.
  mount('waffle-basic', (card, d, f) => {
    shareCard(card, d, f, { items: d.items, sort: d.sort, draw: drawWaffle, fit: fitWaffle });
  });
