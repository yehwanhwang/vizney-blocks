  // Line - Tabs: 머리 아래 세 칸 탭에 지표 이름과 대표 수치를 두고, 고른 지표의 선만 그립니다.
  mount('line-tabs', (card, d) => {
    tabsCard(card, d, lineCard, (t) => ({ series: [{ name: t.name, values: t.values || [], tone: 't1', end: true, dot: true, area: true }] }));
  });
