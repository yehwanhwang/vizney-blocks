  // Donut - Basic: 가운데에 합계, 옆에 색 · 이름 · 비중 범례를 둔 도넛입니다. 큰 세 항목 밖은 회색 기타로 묶고, 금액은 툴팁에 둡니다.
  mount('donut-basic', (card, d, f) => {
    shareCard(card, d, f, { items: d.items, sort: d.sort, draw: drawDonut });
  });
