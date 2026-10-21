  // Radar - Compare: 두세 대상을 한 레이더에 겹쳐 항목별 강약을 견줍니다. 대상은 적은 순서대로 주황 · 분홍빨강 · 파랑(선의 색 규칙, 노랑은 가는
  // 테두리로 잘 보이지 않습니다)의 옅은 면에 같은 색 테두리를 겹쳐 그리고, 넷째 대상부터는 회색 선입니다. 넓은 카드는 오른쪽 목록에 대상별 항목 평균을 적고
  // (목록이 범례를 겸합니다), 줄에 마우스를 올리면 그 대상만 남기고 나머지는 옅게 둡니다.
  mount('radar-compare', (card, d, f) => {
    radarCard(card, d, f, {
      tone: (s, i) => ['t1', 't2', 't3'][i] || 't0',
      fill: (s, i) => (i < 3 ? 0.12 : 0),
      legendInPanel: true,
      panel(ul, ctx) {
        ul.append(el('li', 'is-cap', '항목 평균'));
        ctx.series.forEach((s, j) => {
          const vals = s.values.filter((v) => v != null), li = el('li', 'is-key');
          li.dataset.s = j;
          li.append(el('i', `vzb-key vzb-${s.tone}${s.fill > 0 ? ' is-box' : ''}`), el('span', null, s.name), el('b', null, vals.length ? show(f, +(vals.reduce((a, v) => a + v, 0) / vals.length).toFixed(1)) : '–'));
          const dim = (on) => {
            ctx.areas.forEach((g, k) => { if (g) g.classList.toggle('is-dim', on && k !== j); });
            ul.querySelectorAll('li.is-key').forEach((x) => x.classList.toggle('is-dim', on && x !== li));
          };
          li.addEventListener('pointerenter', () => dim(true));
          li.addEventListener('pointerleave', () => dim(false));
          ul.append(li);
        });
        return [];
      },
    });
  });
