  // Line - Multiple: 색이 다른 선 2–3개를 겹칩니다. 선 색은 주황 · 분홍빨강 · 파랑 순서이고, 넷째부터는 회색으로 묶습니다.
  // 범례를 두고 선 끝에는 마지막 값을 적습니다. 툴팁은 그 기간 값이 큰 순서로 보여줍니다.
  mount('line-multiple', (card, d, f) => {
    const list = d.series || [];
    const series = list.map((s, i) => ({ name: s.name, values: s.values || [], tone: i < 3 ? `t${i + 1}` : 'tx', end: i < 3, dot: i < 3 }));
    const legend = series.slice(0, 3).map((s) => ({ name: s.name, tone: s.tone }));
    if (list.length > 3) legend.push({ name: tx(d, '그 밖의 %s개', list.length - 3), tone: 'tx' });
    lineCard(card, d, f, { series, legend, sort: true });
  });
