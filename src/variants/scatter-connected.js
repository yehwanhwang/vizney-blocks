  // Scatter - Connected: 기간마다 찍은 점을 시간 순서대로 이어, 두 측정값이 함께 어느 쪽으로 움직였는지 봅니다.
  // 묶음(group, 예: 연도)이 있으면 최근 묶음부터 주황 · 분홍빨강 · 파랑으로 칠하고, 없으면 오래된 점일수록 옅게 찍습니다.
  // 마지막 점은 크게 찍고, 처음과 마지막 점에만 기간 이름을 적습니다. 키보드는 좌우 화살표로 시간 순서를 따라갑니다.
  mount('scatter-connected', (card, d, f) => {
    const list = (d.points || []).filter((p) => p && fin(p.x) && fin(p.y)), n = list.length;
    const grouped = list.some((p) => p.group != null);
    const lastAt = (name) => { for (let i = n - 1; i >= 0; i--) if (list[i].group === name) return i; return -1; };
    scatterCard(card, d, f, {
      path: true,
      rankGroups: (gs) => gs.slice().sort((a, b) => lastAt(b.name) - lastAt(a.name)),
      label: (p, i) => i === 0 || i === n - 1,
      radius: (p, i) => (i === n - 1 ? 5.5 : 4),
      fade: grouped ? null : (p, i) => (n > 1 ? 0.3 + (0.7 * i) / (n - 1) : 1),
    });
  });
