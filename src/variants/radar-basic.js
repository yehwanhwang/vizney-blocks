  // Radar - Basic: 한 대상과 비교 기준(series에서 "base": true, 예: 전체 평균)을 겹쳐 그립니다. 기준은 옅은 회색 면에 회색 테두리로 아래에 깔고,
  // 대상은 옅은 주황 면에 주황 테두리로 그 위에 겹칩니다. 꼭짓점 점은 찍지 않습니다. 넓은 카드는 오른쪽 목록에 항목별 점수와 기준 대비 배지를, 좁은 카드는 꼭짓점 이름 옆에 점수를 적습니다.
  mount('radar-basic', (card, d, f) => {
    const list = (d.series || []).filter((s) => s && Array.isArray(s.values));
    const main = list.find((s) => !s.base) || list[0], base = list.find((s) => s.base && s !== main);
    const val = (s, i) => (s && fin(s.values[i]) ? +s.values[i] : null);
    radarCard(card, d, f, {
      tone: (s) => (s.base ? 't0' : 't1'),
      fill: (s) => (s.base ? 0.3 : 0.2),
      value: (i) => (val(main, i) == null ? '' : f.parts(val(main, i))[0]),
      note: (i) => (val(main, i) == null || val(base, i) == null ? '' : `${base.name} 대비 ${signed(f, val(main, i) - val(base, i))}`),
      panel(ul, ctx) {
        return ctx.axes.map((a, i) => {
          const li = el('li', 'is-axis'), v = val(main, i), b = val(base, i);
          li.dataset.i = i;
          li.append(el('span', null, a), el('b', null, v == null ? '–' : f.parts(v)[0]));
          if (v != null && b != null) {
            const diff = v - b, dl = delta(f, v, b, d.better), bd = el('span', `vzb-badge vzb-${dl.tone}`);
            if (dl.dir) bd.append(arrow(dl.dir));
            bd.append(show(f, Math.abs(diff)));
            li.append(bd);
          }
          ul.append(li);
          return li;
        });
      },
    });
  });
