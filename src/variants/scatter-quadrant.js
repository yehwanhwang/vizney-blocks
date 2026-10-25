  // Scatter - Quadrant: 가로는 평균, 세로는 0을 기준선으로 그어 네 구역으로 나누고 구역 이름을 네 모서리에 적습니다.
  // 기준선은 ref로 바꿀 수 있습니다({ "x": 값, "y": 값 }). 점 색은 묶음(group)을 따르고, 툴팁에는 부호를 붙인 증감률과 속한 구역을 적습니다.
  mount('scatter-quadrant', (card, d, f) => {
    const pts = (d.points || []).filter((p) => p && fin(p.x) && fin(p.y));
    const avg = pts.length ? pts.reduce((a, p) => a + +p.x, 0) / pts.length : 0;
    const ref = Object.assign({ x: avg, y: 0 }, d.ref || {});
    const fx = format(d.x || {}, d), fy = format(d.y || {}, d);
    const q = d.quadrants || ['', '', '', ''];
    const where = (p) => q[(p.y >= ref.y ? 0 : 2) + (p.x >= ref.x ? 1 : 0)];
    scatterCard(card, d, f, {
      ref: { x: ref.x, y: ref.y, xText: `${tx(d, d.ref && fin(d.ref.x) ? '기준' : '평균')} ${show(fx, ref.x)}` },
      quadrants: q,
      yText: (p) => `${p.y > 0 ? '+' : p.y < 0 ? '−' : ''}${show(fy, Math.abs(p.y))}`,
      note: (p) => where(p) || '',
    });
  });
