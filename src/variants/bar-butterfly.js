  // Bar - Butterfly: 가운데에 항목 이름을 두고 두 집단(groups)의 막대를 좌우로 펼칩니다. 두 집단은 가장 큰 값 하나에 맞춘 같은 눈금을 씁니다.
  // 연령대처럼 순서가 있는 항목은 적은 순서를 지키고, "sort": true면 두 값의 합이 큰 순서로 둡니다. 값은 양쪽 끝 칸에 적습니다.
  mount('bar-butterfly', (card, d, f) => {
    const [ga, gb] = d.groups && d.groups.length === 2 ? d.groups : ['왼쪽', '오른쪽'];
    const pair = (it) => [0, 1].map((k) => (it.values && it.values[k] != null && isFinite(it.values[k]) ? +it.values[k] : null));
    const items = (d.items || []).filter((it) => it && it.name != null);
    const max = Math.max(0, ...items.flatMap((it) => pair(it).map((v) => v || 0)));
    const sum = (it) => pair(it).reduce((a, v) => a + (v || 0), 0);
    // 집단 이름: 왼쪽 집단은 왼쪽 끝, 오른쪽 집단은 오른쪽 끝에 색 표시와 함께 적습니다.
    const hd = el('div', 'vzb-bf-hd');
    const side = (name, tone) => { const s = el('span'); s.append(el('i', `vzb-key is-box vzb-${tone}`), name); return s; };
    hd.append(side(ga, 'f1'), side(gb, 'f2'));
    const bar = (v, tone, right) => {
      const box = el('div', `vzb-bf-bar${right ? ' is-right' : ''}`), fill = el('i', `vzb-bf-fill vzb-${tone}`);
      fill.style.width = share(v || 0, max);
      box.append(fill);
      return box;
    };
    const val = (v) => el('b', 'vzb-li-val', v == null ? '–' : show(f, v));
    listCard(card, d, f, {
      items,
      top: hd,
      max: 99,
      layout: 'column',
      sort: false,
      order: d.sort === true ? (x, y) => sum(y) - sum(x) : null,
      cols: 'auto minmax(0, 1fr) auto minmax(0, 1fr) auto',
      cells: (it) => {
        const [a, b] = pair(it);
        return [val(a), bar(a, 'f1'), el('span', 'vzb-bf-name', it.name), bar(b, 'f2', true), val(b)];
      },
      tip: (it) => {
        const [a, b] = pair(it), t = (a || 0) + (b || 0);
        return {
          rows: [{ tone: 'f1', name: ga, value: a == null ? '–' : show(f, a) }, { tone: 'f2', name: gb, value: b == null ? '–' : show(f, b) }],
          note: `합계 ${show(f, t)}${t ? ` · ${gb} ${num(((b || 0) / t) * 100, 1)}%` : ''}`,
        };
      },
    });
  });
