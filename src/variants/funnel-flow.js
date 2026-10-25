  // Funnel - Flow: 단계 값만큼의 두께를 가운데 정렬한 흐름으로 그려, 단계마다 좁아지는 모양을 한눈에 보여줍니다.
  // 칸 위에는 단계 이름 · 값 · 지난 기간 대비 증감 배지(prev가 있을 때)를, 흐름 안에는 첫 단계 대비 비율을 흰 알약으로 적습니다.
  // 두께는 값에 비례하되 아무리 작아도 4px은 남깁니다. 툴팁에는 첫 단계 대비, 앞 단계 대비 비율과 이탈 수를 적습니다.
  mount('funnel-flow', (card, d, f) => {
    const steps = (d.steps || []).filter((s) => s && s.name != null && fin(s.value)).map((s) => ({ name: s.name, value: +s.value, prev: fin(s.prev) ? +s.prev : null }));
    const first = steps.length ? steps[0].value : 0, max = Math.max(0, ...steps.map((s) => s.value));
    funnelCard(card, d, f, {
      steps,
      labels: (i) => {
        const s = steps[i], c = el('div');
        c.append(el('div', 'vzb-fu-name', s.name), figure(f, s.value));
        c.lastChild.className = 'vzb-fu-num';
        if (s.prev != null) c.append(badge(f, s.value, s.prev, d.better));
        return c;
      },
      paint(svg, G) {
        const mid = G.h / 2, full = G.h * 0.94;
        const th = steps.map((s) => Math.max(4, max > 0 ? (s.value / max) * full : 4));
        G.cols.slice(1).forEach((c) => svg.append(svgEl('line', { x1: c.x + 0.5, x2: c.x + 0.5, y1: 0, y2: G.h, class: 'vzb-fu-div' })));
        const dd = flowBand(G.cols, th.map((t) => mid - t / 2), th.map((t) => mid + t / 2));
        svg.append(svgEl('path', { d: dd, class: 'vzb-fu-flow', fill: fuGradient(svg, [[0, 'vzb-fs1'], [1, 'vzb-fs2']]) }));
        return [{ d: dd }];
      },
      over(svg, G) { steps.forEach((s, i) => fuPill(svg, G.cols[i].c, G.h / 2, fuPct(s.value, first))); },
      tip(i) {
        const s = steps[i], p = steps[i - 1];
        const lines = i ? [tx(d, '%s 대비 %s|비율', steps[0].name, fuPct(s.value, first)), tx(d, '앞 단계에서 %s 이탈', show(f, Math.max(0, p.value - s.value)))] : [tx(d, '첫 단계')];
        if (s.prev != null) lines.push(tx(d, '지난 기간 %s', show(f, s.prev)));
        return { value: show(f, s.value), note: lines };
      },
    });
  });
