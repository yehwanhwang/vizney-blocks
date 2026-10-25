  // Bar - Basic: 0에서 시작하는 세로 막대입니다. 값은 마지막 막대에만, 막대 끝 오른쪽에 적습니다.
  mount('bar-basic', (card, d, f) => {
    barCard(card, d, f, { series: [{ name: d.title || tx(d, '값'), values: d.values || [], tone: 'f1' }], label: 'last', padTop: 18 });
  });
