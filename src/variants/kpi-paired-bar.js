  // KPI - Paired Bar: 이번 기간과 비교 기간의 값을 0에서 시작하는 같은 축의 막대로 나란히 둡니다.
  // 두 값이 같은 기간(period)인지 제목 아래에 적고, 줄마다 이름 · 막대 · 값을 한 줄에 둡니다.
  mount('kpi-paired-bar', (card, d, f) => {
    const cur = d.current, cmp = d.compare;
    const meta = d.subtitle || !d.period ? d : { ...d, subtitle: `두 기간 모두 ${d.period}` };
    head(card, meta, f, cur.value, cmp, `${cmp.short || cmp.label} 대비`);
    const max = Math.max(cur.value, cmp.value) || 1;
    const foot = el('div', 'vzb-foot vzb-cp');   // 한 격자에 두 줄을 두어 두 막대의 길이 기준을 같게 합니다
    for (const [row, cls] of [[cur, 'is-cur'], [cmp, 'is-cmp']]) {
      const track = el('span', `vzb-cp-track ${cls}`);
      const bar = el('i', 'vzb-cp-bar');
      bar.style.width = `${(Math.max(0, row.value) / max) * 100}%`;
      track.append(bar);
      foot.append(el('span', `vzb-cp-label ${cls}`, row.label), track, el('span', `vzb-cp-val ${cls}`, show(f, row.value)));
    }
    card.append(foot);
  });
