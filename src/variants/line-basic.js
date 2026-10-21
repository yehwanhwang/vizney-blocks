  // Line - Basic: 선 하나에 값 범위에 맞춘 세로축 눈금과 점선 격자를 둡니다. 선 아래는 옅게 칠하고, 마지막 값은 선 끝에 적습니다.
  mount('line-basic', (card, d, f) => {
    lineCard(card, d, f, { series: [{ name: d.title || '값', values: d.values || [], tone: 't1', end: true, dot: true, area: true }] });
  });
