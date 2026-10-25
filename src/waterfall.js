  /* 워터폴 공통: 시작 합계에서 항목별 증감을 차례로 쌓아 끝 합계에 이릅니다. 합계(type: "total")는 0에서 자라는 막대이고,
     값을 적지 않은 합계는 그때까지의 누계(소계)입니다. 증감은 앞 누계에서 떠 있는 막대로, 바뀐 쪽 끝만 둥글게 그립니다.
     막대 사이는 누계 높이의 가는 실선으로 잇고, 값은 막대마다 적습니다(증감은 부호와 함께). 색은 변형이 toneOf로 정합니다. */
  function waterfallCard(card, d, f, cfg) {
    let run = 0;
    const rows = (d.items || []).filter((it) => it && it.name != null).map((it) => {
      if (it.type === 'total') {
        if (fin(it.value)) run = +it.value;
        return { name: it.name, total: true, from: 0, to: run, value: run };
      }
      const v = fin(it.value) ? +it.value : 0, from = run;
      run += v;
      return { name: it.name, total: false, from, to: run, value: v };
    });
    const sign = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${show(f, Math.abs(v))}`;
    const total = (v) => `${v < 0 ? '−' : ''}${show(f, Math.abs(v))}`;   // 음수 합계도 빼기 기호(−)로 적습니다
    const paint = {
      gutter: () => [],
      draw(svg, c) {
        const bw = Math.min(24, c.step * 0.6);
        c.bw = bw;
        rows.forEach((r, i) => {
          const x = c.xs[i] - bw / 2;
          if (i) {
            const y = Math.round(c.y(rows[i - 1].to)) + 0.5;
            svg.append(svgEl('line', { x1: c.xs[i - 1] + bw / 2, x2: x, y1: y, y2: y, class: 'vzb-wf-link' }));
          }
          svg.append(svgEl('path', { d: barPath(x, bw, c.y(r.from), c.y(r.to), true), class: `vzb-bar vzb-${cfg.toneOf(r)}` }));
          const up = r.to >= r.from;
          svg.append(svgText(c.xs[i], up ? c.y(r.to) - 8 : c.y(r.to) + 17, r.total ? total(r.value) : sign(r.value), 'vzb-ax-note', 'middle'));
        });
        return [];
      },
      mark: barPaint.mark,
    };
    return axisCard(card, Object.assign({}, d, { labels: rows.map((r) => r.name) }), f, {
      paint,
      band: true,
      zero: true,
      categorical: true,
      padTop: 22,
      kind: tx(d, '워터폴 차트'),
      series: [{ name: tx(d, '누계'), values: rows.map((r) => r.to), tone: 'f1' }],   // 세로축 범위와 화면 낭독기용 표는 누계로 잡습니다
      extra: rows.flatMap((r) => [r.from, r.to]),
      legend: cfg.legend,
      tip: (i) => {
        const r = rows[i];
        if (!r.total) return { value: sign(r.value), note: tx(d, '반영 후 누계 %s', show(f, r.to)) };
        return { value: total(r.value), note: i && cfg.totalNote ? cfg.totalNote(r, rows[0]) : '' };
      },
    });
  }
