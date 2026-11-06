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
        const notes = [];
        rows.forEach((r, i) => {
          const x = c.xs[i] - bw / 2;
          if (i) {
            const y = Math.round(c.y(rows[i - 1].to)) + 0.5;
            svg.append(svgEl('line', { x1: c.xs[i - 1] + bw / 2, x2: x, y1: y, y2: y, class: 'vzb-wf-link' }));
          }
          svg.append(svgEl('path', { d: barPath(x, bw, c.y(r.from), c.y(r.to), true), class: `vzb-bar vzb-${cfg.toneOf(r)}` }));
          // 값은 바뀐 쪽 끝에 적습니다(늘면 위, 줄면 아래). 줄어든 막대가 바닥선에 붙어 아래에 적을 자리가 없으면
          // 가로축 이름과 겹치지 않게 막대 위에 적습니다(영업이익 236억에서 빼는 영업외손익 −21억처럼).
          const up = r.to >= r.from, below = c.y(r.to) + 17;
          const y = up ? c.y(r.to) - 8 : below + 4 <= c.bottom ? below : c.y(r.from) - 8;
          const t = svgText(c.xs[i], y, r.total ? total(r.value) : sign(r.value), 'vzb-ax-note', 'middle');
          svg.append(t);
          notes.push({ t, r });
        });
        // 폭이 좁아 값 글자끼리 닿으면 합계 · 소계 값을 먼저 남기고, 증감 값은 큰 것부터 닿지 않는 것만 남깁니다.
        // 숨긴 값은 툴팁과 화면 낭독기용 표에 그대로 있습니다(390px의 8항목 손익 구조처럼).
        requestAnimationFrame(() => {
          const kept = [], hit = (a, b) => a.x < b.x + b.width + 2 && b.x < a.x + a.width + 2 && a.y < b.y + b.height && b.y < a.y + a.height;
          notes.slice().sort((a, b) => (b.r.total - a.r.total) || Math.abs(b.r.value) - Math.abs(a.r.value)).forEach((n) => {
            const box = n.t.getBBox();
            if (kept.some((k) => hit(k, box))) n.t.setAttribute('visibility', 'hidden');
            else kept.push(box);
          });
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
