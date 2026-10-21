  // Sankey - Basic: 왼쪽 단에서 오른쪽 단으로 가는 흐름을 띠 두께로 보여줍니다. 왼쪽 노드는 값이 큰 순서로 주황 · 분홍빨강 · 노랑,
  // 넷째부터 회색으로 칠하고, 띠는 출발 노드의 색을 따릅니다. 오른쪽 노드는 검정 막대로 둡니다.
  mount('sankey-basic', (card, d, f) => {
    sankeyCard(card, d, f, {
      paint(nodes, links, cols) {
        cols[0].slice().sort((a, b) => b.value - a.value).forEach((n, i) => { n.tone = ['f1', 'f2', 'f3'][i] || 'f0'; });
        nodes.forEach((n) => { if (n.col > 0) n.tone = 'ti'; });
        links.forEach((l) => { l.tone = l.s.col === 0 ? l.s.tone : 'f0'; });
      },
    });
  });
