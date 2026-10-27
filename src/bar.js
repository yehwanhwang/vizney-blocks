  /* 막대 카드: 축 차트 공통 틀 위에 0에서 자라는 막대를 그립니다. 기간마다 칸을 나누고 막대 굵기는 24px을 넘기지 않습니다.
     series가 여럿이면 나란히 붙이고, stack이면 쌓습니다. 막대 끝만 4px 둥글게, 바닥은 반듯하게 둡니다.
     series의 toneAt(순번)은 막대마다 색을, dim(순번)은 옅게 칠할 막대를 정합니다. label이 last면 마지막 막대에 값을 적습니다. */

  // 바닥 y0에서 끝 y1까지의 막대. round면 끝만 둥글게 합니다.
  function barPath(x, w, y0, y1, round) {
    const h = Math.abs(y1 - y0);
    if (h < 0.5 || w <= 0) return '';
    const R = (v) => +v.toFixed(2), r = round ? Math.min(4, w / 2, h) : 0, e = y1 < y0 ? y1 + r : y1 - r;
    return `M${R(x)},${R(y0)}V${R(e)}Q${R(x)},${R(y1)} ${R(x + r)},${R(y1)}H${R(x + w - r)}Q${R(x + w)},${R(y1)} ${R(x + w)},${R(e)}V${R(y0)}Z`;
  }
  // 마지막 막대(쌓은 막대는 합계)의 값과 끝 높이
  function lastLabel(S) {
    const i = S.latest, list = S.series;
    if (S.label !== 'last' || i < 0) return null;
    const v = S.stack ? list.reduce((a, s) => a + (+s.values[i] || 0), 0) : list[0].values[i];
    if (v == null) return null;
    const end = S.stack ? list.reduce((a, s) => a + Math.max(0, +s.values[i] || 0), 0) : v;
    return { i, v, end, text: S.labelText ? S.labelText(v, i) : show(S.f, v) };
  }
  const barPaint = {
    // 마지막 막대가 오른쪽 끝이면 값을 막대 오른쪽에 적어, 좁은 막대에서도 옆 막대와 겹치지 않게 합니다.
    gutter(S, c) {
      const L = lastLabel(S);
      return L && L.i === c.n - 1 ? [L.text] : [];
    },
    draw(svg, c, S) {
      const n = c.n, list = S.series, gap = 2, y0 = c.y(0);
      if (S.stack) {
        const bw = Math.min(24, c.step * 0.6);
        c.bw = bw;
        for (let i = 0; i < n; i++) {
          const segs = list.map((s) => ({ s, v: s.values[i] == null ? 0 : +s.values[i] })).filter((o) => o.v !== 0);
          const topPos = segs.map((o) => o.v > 0).lastIndexOf(true), topNeg = segs.map((o) => o.v < 0).lastIndexOf(true);
          let pos = 0, neg = 0;
          segs.forEach((o, k) => {
            const from = o.v > 0 ? pos : neg, to = from + o.v;
            if (o.v > 0) pos = to; else neg = to;
            const ya = c.y(from) + (from === 0 ? 0 : o.v > 0 ? -gap : gap);   // 조각 사이 2px
            svg.append(svgEl('path', { d: barPath(c.xs[i] - bw / 2, bw, ya, c.y(to), k === (o.v > 0 ? topPos : topNeg)), class: `vzb-bar vzb-${o.s.tone}` }));
          });
        }
      } else {
        const k = list.length;
        const bw = k > 1 ? Math.min(24, (c.step * 0.72 - gap * (k - 1)) / k) : Math.min(24, c.step * 0.6);
        const gw = bw * k + gap * (k - 1);
        c.bw = bw;
        list.forEach((s, j) => {
          for (let i = 0; i < n; i++) {
            const v = s.values[i];
            if (v == null) continue;
            const tone = s.toneAt ? s.toneAt(i) : s.tone;
            svg.append(svgEl('path', { d: barPath(c.xs[i] - gw / 2 + j * (bw + gap), bw, y0, c.y(v), true), class: `vzb-bar vzb-${tone}${s.dim && s.dim(i) ? ' is-dim' : ''}` }));
          }
        });
      }
      // 마지막 막대(쌓은 막대는 합계)의 값: 오른쪽 끝이면 막대 끝 높이에 맞춰 오른쪽에, 아니면 막대 끝 위에 적습니다.
      const L = lastLabel(S);
      if (L && L.i === n - 1) svg.append(svgText(c.xs[L.i] + c.bw / 2 + 6, c.y(L.end) + 4, L.text, 'vzb-ax-note'));
      else if (L) svg.append(svgText(c.xs[L.i], L.end >= 0 ? c.y(L.end) - 7 : c.y(L.end) + 17, L.text, 'vzb-ax-note', 'middle'));
      return [];
    },
    mark(i, c, S, back) {   // 고른 기간의 칸을 옅은 회색으로 칠합니다
      back.append(svgEl('rect', { x: c.xs[i] - c.step / 2 + 1, y: c.top - 6, width: Math.max(0, c.step - 2), height: c.bottom - c.top + 6, rx: 6, class: 'vzb-bar-hover' }));
    },
  };
  function barCard(card, d, f, cfg) {
    return axisCard(card, d, f, Object.assign({ paint: barPaint, band: true, zero: true, kind: tx(d, '막대 차트') }, cfg));
  }
