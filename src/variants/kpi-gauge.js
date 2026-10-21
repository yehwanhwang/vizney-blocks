  // KPI - Gauge: 달성률을 반원 게이지로 채우고, 가운데에 현재 값과 목표 대비 비율을 적습니다.
  // 기준이 섞이지 않게 전월 대비 증감은 넣지 않습니다. better가 down이면 예산·한도로 읽어 사용률을 적습니다.
  mount('kpi-gauge', (card, d, f) => {
    head(card, d, f, null);
    const t = d.target || {};
    const limit = d.better === 'down';
    const rate = t.value ? d.value / t.value : 0;
    const share = `${t.label || '목표'} ${show(f, t.value)}의 ${num(rate * 100, 1)}%${limit ? ' 사용' : ''}`;
    const foot = el('div', 'vzb-foot');
    const gauge = el('div', 'vzb-gg');
    const svg = svgEl('svg', { class: 'vzb-gg-svg', viewBox: '0 0 260 136', role: 'img', 'aria-label': `${show(f, d.value)}, ${share}` });
    const cx = 130, cy = 126, r = 116, p = Math.min(1, Math.max(0, rate));
    const ex = +(cx + r * Math.cos(Math.PI * (1 - p))).toFixed(2), ey = +(cy - r * Math.sin(Math.PI * (1 - p))).toFixed(2);
    svg.append(svgEl('path', { d: `M${cx - r},${cy}A${r},${r} 0 0 1 ${cx + r},${cy}`, class: 'vzb-gg-track' }));
    if (p > 0) svg.append(svgEl('path', { d: `M${cx - r},${cy}A${r},${r} 0 0 1 ${ex},${ey}`, class: 'vzb-gg-arc' }));
    svg.append(svgEl('circle', { cx: ex, cy: ey, r: 8, class: 'vzb-gg-knob' }));
    const center = el('div', 'vzb-gg-center');
    center.append(figure(f, d.value), el('div', limit && rate > 1 ? 'vzb-gg-cap vzb-bad' : 'vzb-gg-cap', share));
    gauge.append(svg, center);
    foot.append(gauge);
    card.append(foot);
  });
