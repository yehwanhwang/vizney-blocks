  // Line - Reference: 선 하나에 목표나 평균 같은 기준선을 점선으로 긋고, 이름과 값을 기준선 오른쪽 끝에 적습니다.
  // reference.value에 "avg"를 쓰면 기간 평균을 긋습니다. 세로축 범위에는 기준선을 항상 넣습니다.
  mount('line-reference', (card, d, f) => {
    const vals = d.values || [], r = d.reference || {};
    const got = vals.filter((v) => v != null);
    const avg = r.value === 'avg';
    const ref = avg ? got.reduce((s, v) => s + v, 0) / (got.length || 1) : +r.value;
    if (!isFinite(ref)) throw new Error(tx(d, 'reference.value에 숫자나 "avg"를 적으세요.'));
    const name = r.label || tx(d, avg ? '평균' : '기준');
    lineCard(card, d, f, {
      series: [{ name: d.title || tx(d, '값'), values: vals, tone: 't1', end: true, dot: true, area: true }],
      extra: [ref],
      under: (svg, c) => {
        const y = Math.round(c.y(ref)) + 0.5;
        svg.append(svgEl('line', { x1: c.left - 4, x2: c.right, y1: y, y2: y, class: 'vzb-ax-ref' }));
      },
      side: [{ value: ref, lines: [name, show(f, ref)] }],
      tip: (i) => (vals[i] == null ? { value: '–' } : { value: show(f, vals[i]), note: tx(d, '%s 대비 %s', name, signed(f, vals[i] - ref)) }),
    });
  });
