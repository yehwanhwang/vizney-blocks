  // Bump - Basic: 기간마다 순위를 찍고 S자 곡선으로 이어 순위가 바뀐 흐름을 봅니다. 마지막 기간의 상위 세 항목만
  // 주황 · 분홍빨강 · 파랑(라인 차트의 선 색 규칙)으로, 나머지는 회색으로 그립니다. 이름은 선의 양 끝에 적습니다.
  mount('bump-basic', (card, d, f) => {
    bumpCard(card, d, f, {
      toneOf: (it) => (it.pos < 3 ? `t${it.pos + 1}` : 'tx'),
    });
  });
