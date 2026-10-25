  // Funnel - Layers: 흐름을 구분(segments)별 띠로 나눠 가운데에 첫 구분을, 그 바깥 양쪽에 다음 구분을 반씩 쌓습니다.
  // 띠 색은 가운데부터 주황 · 옅은 주황 · 더 옅은 주황이고, 범례에는 구분마다 첫 단계에서 마지막 단계까지의 전환율을 적습니다.
  // 띠가 칸을 지나며 얼마나 가늘어지는지로 어느 구분이 끝까지 잘 남는지 견줍니다. 툴팁에는 그 단계의 구분별 값을 적습니다.
  mount('funnel-layers', (card, d, f) => {
    const segs = (d.segments || []).slice(0, 4);
    const steps = (d.steps || []).filter((s) => s && s.name != null).map((s) => {
      const values = segs.map((_, k) => (s.values && fin(s.values[k]) ? +s.values[k] : 0));
      return { name: s.name, values, value: values.reduce((a, v) => a + v, 0) };
    });
    const first = steps.length ? steps[0].value : 0, last = steps[steps.length - 1], max = Math.max(0, ...steps.map((s) => s.value));
    const top = legendEl(segs.map((name, k) => ({ name: `${name} ${steps.length > 1 ? fuPct(last.values[k], steps[0].values[k]) : ''}`.trim(), tone: `u${k}`, box: true })));
    funnelCard(card, d, f, {
      steps,
      top,
      labels: (i) => {
        const s = steps[i], c = el('div');
        c.append(el('div', 'vzb-fu-name', s.name), figure(f, s.value));
        c.lastChild.className = 'vzb-fu-num';
        return c;
      },
      paint(svg, G) {
        const mid = G.h / 2, sc = max > 0 ? (G.h * 0.94) / max : 0;
        G.cols.slice(1).forEach((c) => svg.append(svgEl('line', { x1: c.x + 0.5, x2: c.x + 0.5, y1: 0, y2: G.h, class: 'vzb-fu-div' })));
        // 가운데 띠(첫 구분)와 양쪽으로 반씩 쌓는 바깥 띠. 바깥 띠부터 그려 안쪽 띠가 위에 오게 합니다.
        const half = (s, k) => (k === 0 ? s.values[0] / 2 : s.values[0] / 2 + s.values.slice(1, k).reduce((a, v) => a + v / 2, 0));
        for (let k = segs.length - 1; k >= 1; k -= 1) {
          const inner = steps.map((s) => half(s, k) * sc), outer = steps.map((s, i) => inner[i] + (s.values[k] / 2) * sc);
          svg.append(svgEl('path', { d: flowBand(G.cols, outer.map((v) => mid - v), inner.map((v) => mid - v)), class: `vzb-fu-band vzb-u${k}`, fill: 'var(--vzb-c)' }));
          svg.append(svgEl('path', { d: flowBand(G.cols, inner.map((v) => mid + v), outer.map((v) => mid + v)), class: `vzb-fu-band vzb-u${k}`, fill: 'var(--vzb-c)' }));
        }
        const c0 = steps.map((s) => Math.max(2, s.values[0] * sc) / 2);
        svg.append(svgEl('path', { d: flowBand(G.cols, c0.map((v) => mid - v), c0.map((v) => mid + v)), class: 'vzb-fu-band vzb-u0', fill: 'var(--vzb-c)' }));
        const env = steps.map((s) => Math.max(4, s.value * sc) / 2);
        return [{ d: flowBand(G.cols, env.map((v) => mid - v), env.map((v) => mid + v)) }];
      },
      over(svg, G) { steps.forEach((s, i) => fuPill(svg, G.cols[i].c, G.h / 2, fuPct(s.value, first))); },
      tip(i) {
        const s = steps[i], p = steps[i - 1];
        return {
          rows: segs.map((name, k) => ({ tone: `u${k}`, name, value: show(f, s.values[k]) })),
          note: [tx(d, '합계 %s', show(f, s.value)), i ? tx(d, '앞 단계 대비 %s', fuPct(s.value, p.value)) : ''],
        };
      },
    });
  });
