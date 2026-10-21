  // Donut - Tabs: 머리 아래 세 칸 탭으로 기준(채널 · 품목 · 지사 등)을 바꿔 보는 도넛입니다. 탭마다 items를 따로 적습니다.
  mount('donut-tabs', (card, d) => {
    tabsCard(card, d, shareCard, (t) => ({ items: t.items, sort: t.sort, draw: drawDonut }));
  });
