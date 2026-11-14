  // Sankey - Levels: 세 단 이상으로 이어지는 흐름에서 마지막 단의 한 노드(focus)를 짚습니다. focus와 focus로 가는 띠만 첫째 색(밝은 바탕 파랑,
  // 어두운 바탕 노랑)이고, 앞 단의 띠는 글자색(검정, 어두운 바탕은 흰색), 마지막 단의 나머지 노드로 가는 띠는 회색입니다.
  // 색을 하나만 써서(focus로 가는 띠는 한 단계 진하게) 들어온 양 가운데 얼마가 focus까지 남는지가 먼저 보이고, 앞 단과 색이 달라 앞 단의 특정 노드가 focus로 바로 흘러가는 것처럼 읽히지 않습니다.
  // focus를 비우면 모두 첫째 색입니다.
  mount('sankey-levels', (card, d, f) => {
    sankeyCard(card, d, f, {
      paint(nodes, links, cols) {
        const end = cols[cols.length - 1], focus = d.focus == null ? null : String(d.focus);
        nodes.forEach((n) => { n.tone = focus == null ? 'f1' : !end.includes(n) ? 'ti' : n.id === focus ? 'f1' : 'f0'; });
        links.forEach((l) => { l.tone = l.t.tone; l.strong = focus != null && l.t.id === focus; });
      },
    });
  });
