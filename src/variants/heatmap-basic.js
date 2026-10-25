  // Heatmap - Basic: 행 × 열 칸을 값의 크기에 따라 주황 한 가지의 농도로 칠합니다. 값이 0을 사이에 두고 갈리면(이익률 · 증감률)
  // 0을 경계로 좋은 쪽은 초록, 나쁜 쪽은 빨강으로 칠합니다(KPI 배지와 같은 색, better로 뒤집음). 두 쪽은 절댓값이 큰 쪽에 맞춘 같은 눈금입니다.
  // 열이 넉넉하면(칸 폭 48px 이상) 칸에 숫자를 적고, 좁으면 적지 않아 색의 패턴이 먼저 보이게 합니다. 값은 범례와 툴팁으로도 읽고,
  // 화면 낭독기는 칸마다 숫자를 읽고, 키보드는 표에 포커스한 뒤 화살표 키로 칸을 옮깁니다. "scale": "row"면 행마다 따로 칠합니다. 데이터 열은 같은 폭입니다.
  // 처음에는 적은 순서대로 두고, 열 제목을 누르면 그 열로 정렬합니다. 행 이름 열을 누르면 다시 처음 순서(숫자 순)가 됩니다.
  mount('heatmap-basic', (card, d, f) => {
    const heads = d.columns || [], rows = d.rows || [], byRow = d.scale === 'row';
    const range = (vals) => {
      const got = (vals || []).filter(ok).map(Number);
      return got.length ? [Math.min(...got), Math.max(...got)] : null;
    };
    const all = range(rows.flatMap((r) => r.values || []));
    // 칸 숫자의 소수 자릿수는 표 전체에서 맞춥니다(19.8 옆에 20이 아니라 20.0).
    const dec = d.decimals != null ? d.decimals : rows.flatMap((r) => r.values || []).filter(ok).every((v) => Number.isInteger(+v)) ? 0 : 1;
    const mix = (v, [lo, hi]) => 8 + (hi > lo ? (v - lo) / (hi - lo) : 0.5) * 72;   // 주황을 8–80% 섞습니다. 값이 모두 같으면 가운데 농도입니다
    // 0을 사이에 둔 값: 0에서 멀수록 진하게(16–80%), 두 쪽 모두 절댓값이 큰 쪽에 맞춥니다. 작은 적자도 색이 갈려 보입니다.
    const signed = !byRow && all && all[0] < 0 && all[1] > 0;
    const far = signed ? Math.max(-all[0], all[1]) : 0, good = d.better === 'down' ? -1 : 1;
    const deep = (v) => (v ? 16 + (Math.abs(v) / far) * 64 : 0);
    const side = (v) => (Math.sign(v) === good ? 'good' : 'bad');
    const ramp = all && el('div', `vzb-tb-ramp${signed ? ' is-signed' : ''}`);
    if (ramp) {
      const bar = el('i');
      if (signed) {
        // 범례도 같은 눈금: 왼쪽 끝은 가장 작은 값의 색, 0에서 색이 바뀌고, 오른쪽 끝은 가장 큰 값의 색입니다.
        const z = ((-all[0] / (all[1] - all[0])) * 100).toFixed(1), c = (t, m) => `color-mix(in srgb, var(--vzb-${t}) ${m.toFixed(0)}%, var(--vzb-card))`;
        bar.style.background = `linear-gradient(90deg, ${c(side(-1), deep(all[0]))} 0%, ${c(side(-1), 16)} ${z}%, ${c(side(1), 16)} ${z}%, ${c(side(1), deep(all[1]))} 100%)`;
      }
      ramp.append(el('span', null, byRow ? tx(d, '행마다 작음') : show(f, all[0])), bar, el('span', null, byRow ? tx(d, '큼') : show(f, all[1])));
    }
    const { table } = tableCard(card, d, f, {
      rows,
      top: ramp,
      sortable: true,
      columns: [{ key: 'name', label: d.nameLabel || '' }].concat(heads.map((label, j) => ({
        key: `c${j}`, label, value: (r) => (r.values || [])[j],
        cell: (r) => {
          const v = (r.values || [])[j], s = el('span', `vzb-tb-heat${ok(v) ? '' : ' is-none'}`);
          s.append(el('span', 'vzb-sr', cellNum(v, { decimals: dec })));
          const n = el('span', 'vzb-tb-heat-n', cellNum(v, { decimals: dec }));
          n.setAttribute('aria-hidden', 'true');
          s.append(n);
          if (ok(v) && signed) {
            const m = deep(+v);
            if (+v) s.classList.add(`is-${side(+v)}`);
            if (m > 50) s.classList.add('is-deep');
            s.style.setProperty('--vzb-heat', `${m.toFixed(0)}%`);
          } else if (ok(v)) s.style.setProperty('--vzb-heat', `${mix(+v, byRow ? range(r.values) : all).toFixed(0)}%`);
          s.dataset.label = `${r.name} · ${label}`;
          s.dataset.value = ok(v) ? show(f, +v) : '–';
          return s;
        },
      }))),
    });
    table.classList.add('is-heat');
    table.style.setProperty('--vzb-heat-cols', Math.max(1, heads.length));
    // 칸이 48px 이상이면 칸에 숫자를 적습니다. 폭이 바뀌면 다시 판단합니다.
    onSize(table, (w) => {
      const name = table.querySelector('thead th');
      table.classList.toggle('has-nums', heads.length > 0 && (w - (name ? name.getBoundingClientRect().width : 0)) / heads.length >= 48);
    });
    // 칸의 값은 마우스를 올리거나 탭하면 툴팁으로 보이고, 표에 포커스한 뒤 화살표 키로 칸을 옮겨도 같은 값을 보여줍니다.
    // 좌우는 읽는 순서(줄 끝에서 다음 줄로), 위아래는 같은 열의 다른 행입니다. 정렬로 줄이 바뀌어도 그때의 표 순서를 따릅니다.
    const cells = () => [...table.querySelectorAll('tbody .vzb-tb-heat')];
    table.classList.add('vzb-plot');
    table.tabIndex = 0;
    table.querySelector('caption').append(tx(d, ' 표에 포커스한 뒤 화살표 키로 칸을 옮기면 그 칸의 값을 읽습니다.'));
    let on = null;
    const mark = (s) => { if (on) on.classList.remove('is-on'); on = s; if (on) on.classList.add('is-on'); };
    const keys = interact(table, () => cells().length,
      (cx, cy) => { const t = document.elementFromPoint(cx, cy), s = t && t.closest && t.closest('.vzb-tb-heat'); return s ? cells().indexOf(s) : -1; },
      (i) => { const s = cells()[i], b = s.getBoundingClientRect(); mark(s); return { x: b.left + b.width / 2, y: b.top, label: s.dataset.label, value: s.dataset.value }; },
      () => mark(null), false, true);
    table.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      const n = Math.max(1, heads.length), i = keys.at(), j = i < 0 ? 0 : i + (e.key === 'ArrowDown' ? n : -n);
      if (j >= 0 && j < cells().length) keys.show(j);
    });
  });
