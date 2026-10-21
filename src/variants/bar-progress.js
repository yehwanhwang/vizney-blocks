  // Bar - Progress: 항목마다 달성률만큼 막대를 채우고 오른쪽에 달성률을 적습니다. 바탕 끝은 가장 높은 달성률(100% 미만이면 100%),
  // 세로 눈금은 목표(100%)라, 목표를 넘은 항목끼리도 길이 차이가 보입니다. 목표에 못 미친 항목은 옅게 칠하고 달성률이 높은 순서로 둡니다.
  // 낮을수록 좋은 지표("better": "down")는 반대로 둡니다.
  mount('bar-progress', (card, d, f) => {
    const down = d.better === 'down';
    const rate = (it) => (+it.target ? (+it.value || 0) / +it.target : 0);
    const miss = (it) => it.target != null && (down ? +it.value > +it.target : +it.value < +it.target);
    const all = (d.items || []).filter((it) => it && it.name != null);
    const top = Math.max(1, ...all.map(rate));
    listCard(card, d, f, {
      items: all,
      max: d.max || 8,
      layout: 'column',
      cols: 'max-content minmax(0, 1fr) auto',
      order: (a, b) => (down ? rate(a) - rate(b) : rate(b) - rate(a)),
      legend: [{ name: down ? '목표 이내' : '목표 달성', tone: 'f1', box: true }, { name: down ? '목표 초과' : '목표 미달', tone: 'f1', box: true, dim: true }, { name: '목표(100%)', tone: 'ti', tick: true }],
      fold: (rest) => foldRest(rest, ['value', 'target']),
      cells: (it) => {
        const track = el('div', 'vzb-li-track');
        const fill = el('i', `vzb-li-fill${miss(it) ? ' is-dim' : ''}`);
        fill.style.width = share(rate(it), top);
        const goal = el('i', 'vzb-li-mark');
        goal.style.left = share(1, top);
        track.append(fill, goal);
        return [el('span', 'vzb-li-label', it.name), track, el('b', 'vzb-li-val', `${num(rate(it) * 100, 1)}%`)];
      },
      tip: (it) => ({ value: show(f, it.value), note: `목표 ${show(f, it.target)} · 달성률 ${num(rate(it) * 100, 1)}%` }),
    });
  });
