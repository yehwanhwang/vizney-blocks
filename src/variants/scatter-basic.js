  // Scatter - Basic: 항목마다 두 측정값을 점 하나로 찍어 관계와 흩어짐을 봅니다. 묶음(group)이 있으면 점 수가 많은 세 묶음만
  // 주황 · 분홍빨강 · 파랑으로, 나머지는 회색 '기타'로 칠합니다. 이름은 "label": true로 고른 점(가장 큰 값, 눈에 띄게 벗어난 점)에만 적습니다.
  mount('scatter-basic', (card, d, f) => {
    scatterCard(card, d, f, {});
  });
