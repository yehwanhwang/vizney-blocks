  // 단조 보간 곡선(Fritsch–Carlson): 부드럽게 잇되 실제 값보다 위아래로 튀어나가지 않습니다.
  function monotone(pts) {
    const n = pts.length, r = (v) => +v.toFixed(2);
    if (n < 2) return n ? `M${r(pts[0].x)},${r(pts[0].y)}` : '';
    const dx = [], m = [], t = [];
    for (let i = 0; i < n - 1; i++) {
      dx[i] = pts[i + 1].x - pts[i].x;
      m[i] = (pts[i + 1].y - pts[i].y) / (dx[i] || 1e-9);
    }
    t[0] = m[0];
    t[n - 1] = m[n - 2];
    for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
      const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
      if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
    }
    let path = `M${r(pts[0].x)},${r(pts[0].y)}`;
    for (let i = 0; i < n - 1; i++) {
      const h = dx[i] / 3;
      path += `C${r(pts[i].x + h)},${r(pts[i].y + t[i] * h)} ${r(pts[i + 1].x - h)},${r(pts[i + 1].y - t[i + 1] * h)} ${r(pts[i + 1].x)},${r(pts[i + 1].y)}`;
    }
    return path;
  }
  // 선 모양(curve): smooth(기본, 단조 곡선) · linear(직선) · step(계단: 값이 다음 기간까지 그대로 유지)
  function linePath(pts, curve) {
    if (curve !== 'linear' && curve !== 'step') return monotone(pts);
    const r = (v) => +v.toFixed(2);
    return pts.map((p, i) => (!i ? `M${r(p.x)},${r(p.y)}` : curve === 'step' ? `H${r(p.x)}V${r(p.y)}` : `L${r(p.x)},${r(p.y)}`)).join('');
  }
