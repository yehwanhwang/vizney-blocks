  // KPI - Number: 대표 수치와 증감. 비교 기준의 값까지 적어 무엇과 비교했는지 바로 보이게 합니다.
  mount('kpi-number', (card, d, f) => {
    const c = d.compare;
    head(card, d, f, d.value, c, c && c.value != null ? `${c.label} ${show(f, c.value)} 대비` : null);
  });
