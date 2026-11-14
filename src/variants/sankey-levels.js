  // Sankey - Levels: 세 단 이상으로 이어지는 흐름에서 마지막 단의 한 노드(focus)를 짚습니다. focus와 focus로 가는 띠는 파랑,
  // 마지막 단의 나머지 노드로 가는 띠는 회색, 앞 단의 띠는 주황으로 칠해, 들어온 양 가운데 얼마가 focus까지 남는지 보이게 합니다.
  // 앞 단과 focus의 색을 달리해 앞 단의 특정 노드가 focus로 바로 흘러가는 것처럼 읽히지 않게 합니다. focus를 비우면 모두 주황입니다.
  mount('sankey-levels', (card, d, f) => {
    sankeyCard(card, d, f, {
      paint(nodes, links, cols) {
        const end = cols[cols.length - 1], focus = d.focus == null ? null : String(d.focus);
        nodes.forEach((n) => { n.tone = focus == null || !end.includes(n) ? 'f1' : n.id === focus ? 't3' : 'f0'; });
        links.forEach((l) => { l.tone = l.t.tone; });
      },
    });
  });
