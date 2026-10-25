  // Funnel - Area: 바닥에서 자라는 흐름이 단계마다 계단처럼 낮아지고, 단계 사이는 흰 틈으로 나눕니다. 흐름 아래 칸에는
  // 단계 값과 이름, 앞 단계에서 넘어온 비율(전환, note가 있으면 note)을 적고, 오른쪽 위에는 첫 단계에서 마지막 단계까지의 전체 전환율을 둡니다.
  // 칸에 마우스를 올리면 그 칸의 흐름을 진하게 짚고 칸 위에 주황 선을 긋습니다.
  mount('funnel-area', (card, d, f) => {
    const steps = (d.steps || []).filter((s) => s && s.name != null && fin(s.value)).map((s) => ({ name: s.name, value: +s.value, note: s.note }));
    const first = steps.length ? steps[0].value : 0, last = steps[steps.length - 1], max = Math.max(0, ...steps.map((s) => s.value));
    if (steps.length > 1) {
      const call = el('div', 'vzb-fu-call');
      const big = el('div', 'vzb-num', first ? num((last.value / first) * 100, 1) : '–');
      big.append(el('span', 'vzb-unit', '%'));
      call.append(big, el('p', null, d.rateLabel || tx(d, '전체 전환율')));
      card.append(call);
    }
    funnelCard(card, d, f, {
      steps,
      cells: (i) => {
        const s = steps[i], c = el('div');
        const fig = figure(f, s.value);
        fig.className = 'vzb-fu-num';
        c.append(fig, el('div', 'vzb-fu-name', s.name), el('div', 'vzb-fu-sub', s.note || (i ? tx(d, '전환 %s', fuPct(s.value, steps[i - 1].value)) : tx(d, '시작'))));
        return c;
      },
      paint(svg, G) {
        const base = G.h, full = G.h * 0.96;
        const th = steps.map((s) => Math.max(3, max > 0 ? (s.value / max) * full : 3));
        const dd = flowBand(G.cols, th.map((t) => base - t), th.map(() => base));
        svg.append(svgEl('path', { d: dd, class: 'vzb-fu-flow', fill: fuGradient(svg, [[0, 'vzb-fs1'], [0.6, 'vzb-fs2'], [1, 'vzb-fs3']]) }));
        G.cols.slice(1).forEach((c) => svg.append(svgEl('line', { x1: c.x, x2: c.x, y1: 0, y2: base, class: 'vzb-fu-gap' })));
        return [{ d: dd }];
      },
      tip(i) {
        const s = steps[i], p = steps[i - 1];
        return { value: show(f, s.value), note: i ? [tx(d, '%s 대비 %s|비율', steps[0].name, fuPct(s.value, first)), tx(d, '앞 단계에서 %s 빠짐', show(f, Math.max(0, p.value - s.value)))] : tx(d, '첫 단계') };
      },
    });
  });
