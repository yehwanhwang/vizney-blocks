  /* 라인 카드: 축 차트 공통 틀 위에 선을 그립니다. 선 모양(curve)은 곡선 · 직선 · 계단 가운데 고릅니다.
     series의 end는 마지막 기간 값을 선 끝에 적고, dot은 선의 마지막 점을 찍고, area는 선 아래를 옅게 칠합니다. */

  // 빈 기간(null)에서 선을 끊고, 이어진 구간마다 고른 모양으로 잇습니다.
  function pathOf(vals, c, curve) {
    let d = '', run = [];
    for (let i = 0; i <= c.n; i++) {
      const v = i < c.n ? vals[i] : null;
      if (v == null) { if (run.length) d += linePath(run, curve); run = []; continue; }
      run.push({ x: c.xs[i], y: c.y(v) });
    }
    return d;
  }
  // 선 아래 음영: 이어진 구간마다 선에서 그래프 바닥까지 칠하고, 위(선 색 22%)에서 아래(0%)로 옅어집니다. KPI - Line과 같은 음영입니다.
  function areaOf(vals, c, curve) {
    let d = '', run = [];
    const flush = () => {
      if (run.length > 1) d += `${linePath(run, curve)}L${run[run.length - 1].x.toFixed(2)},${c.bottom}L${run[0].x.toFixed(2)},${c.bottom}Z`;
      run = [];
    };
    for (let i = 0; i <= c.n; i++) {
      const v = i < c.n ? vals[i] : null;
      if (v == null) flush(); else run.push({ x: c.xs[i], y: c.y(v) });
    }
    return d;
  }
  const linePaint = {
    gutter: (S, c) => S.series.filter((s) => s.end && lastIdx(s.values, c.n) === c.n - 1).map((s) => show(S.f, s.values[c.n - 1])),
    draw(svg, c, S) {
      const series = S.series, n = c.n;
      const lines = series.map((s) => svgEl('path', { d: pathOf(s.values, c, S.curve), class: `vzb-ln-line vzb-${s.tone}` }));
      series.forEach((s) => {
        if (!s.area) return;
        const id = `vzb-ar${Math.random().toString(36).slice(2, 8)}`, defs = svgEl('defs', {});
        const g = svgEl('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1, class: `vzb-${s.tone}` });
        g.append(svgEl('stop', { offset: 0, class: 'vzb-ln-g1' }), svgEl('stop', { offset: 1, class: 'vzb-ln-g2' }));
        defs.append(g);
        svg.append(defs, svgEl('path', { d: areaOf(s.values, c, S.curve), fill: `url(#${id})`, class: 'vzb-ln-area' }));
      });
      // 그 밖의 회색 선, 비교 회색 선, 색 선 순서로 겹칩니다.
      ['tx', 't0'].forEach((tone) => series.forEach((s, k) => { if (s.tone === tone) svg.append(lines[k]); }));
      series.forEach((s, k) => { if (s.tone !== 'tx' && s.tone !== 't0') svg.append(lines[k]); });
      series.forEach((s) => {
        const i = lastIdx(s.values, n);
        if (s.dot && i >= 0) svg.append(svgEl('circle', { cx: c.xs[i], cy: c.y(s.values[i]), r: 4, class: `vzb-ln-dot vzb-${s.tone}` }));
      });
      // 선 끝 값은 앞 항목부터 적고, 이미 적은 값과 겹치면 생략합니다. 값은 툴팁과 표에 남습니다.
      const taken = [];
      series.forEach((s) => {
        if (!s.end || lastIdx(s.values, n) !== n - 1) return;
        const y = c.y(s.values[n - 1]);
        if (taken.some((ty) => Math.abs(ty - y) < 14)) return;
        taken.push(y);
        svg.append(svgText(c.xs[n - 1] + 10, y + 4, show(S.f, s.values[n - 1]), 'vzb-ax-end'));
      });
      return taken;
    },
    mark(i, c, S, back, front) {   // 기간을 찾는 세로선과 그 기간의 점
      front.append(svgEl('line', { x1: c.xs[i], x2: c.xs[i], y1: c.top, y2: c.bottom, class: 'vzb-ln-cross' }));
      S.series.forEach((s) => {
        const v = s.values[i];
        if (v != null) front.append(svgEl('circle', { cx: c.xs[i], cy: c.y(v), r: 4, class: `vzb-ln-dot vzb-${s.tone}` }));
      });
    },
  };
  function lineCard(card, d, f, cfg) {
    return axisCard(card, d, f, Object.assign({ paint: linePaint, kind: '선 차트', headroom: 0.15 }, cfg));
  }
