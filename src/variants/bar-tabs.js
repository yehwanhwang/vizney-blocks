  // Bar - Tabs: 머리 아래 세 칸 탭으로 지표를 바꿔 막대로 그립니다. 탭에는 더해서 의미가 있는 양(금액, 건수, 수량)을 둡니다.
  mount('bar-tabs', (card, d) => {
    tabsCard(card, d, barCard, (t) => ({ series: [{ name: t.name, values: t.values || [], tone: 'f1' }], label: 'last', padTop: 18 }));
  });
