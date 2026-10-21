  // Heatmap - Basic: 행 × 열 칸을 값의 크기에 따라 주황 한 가지의 농도로 칠합니다. 칸에는 숫자를 적지 않아 색의 패턴이 먼저 보이고,
  // 값은 표 위 범례의 양 끝 값과 칸의 툴팁으로 읽습니다(화면 낭독기는 칸마다 숫자를 읽습니다). "scale": "row"면 행마다 따로 칠합니다.
  // 처음에는 적은 순서대로 두고, 열 제목을 누르면 그 열로 정렬합니다. 행 이름 열을 누르면 다시 처음 순서(숫자 순)가 됩니다.
  mount('heatmap-basic', (card, d, f) => {
    const heads = d.columns || [], rows = d.rows || [], byRow = d.scale === 'row';
    const range = (vals) => {
      const got = (vals || []).filter(ok).map(Number);
      return got.length ? [Math.min(...got), Math.max(...got)] : null;
    };
    const all = range(rows.flatMap((r) => r.values || []));
    const mix = (v, [lo, hi]) => 8 + (hi > lo ? (v - lo) / (hi - lo) : 0.5) * 72;   // 주황을 8–80% 섞습니다. 값이 모두 같으면 가운데 농도입니다
    const ramp = all && el('div', 'vzb-tb-ramp');
    if (ramp) ramp.append(el('span', null, byRow ? '행마다 작음' : show(f, all[0])), el('i'), el('span', null, byRow ? '큼' : show(f, all[1])));
    const { table } = tableCard(card, d, f, {
      rows,
      top: ramp,
      sortable: true,
      columns: [{ key: 'name', label: d.nameLabel || '' }].concat(heads.map((label, j) => ({
        key: `c${j}`, label, value: (r) => (r.values || [])[j],
        cell: (r) => {
          const v = (r.values || [])[j], s = el('span', `vzb-tb-heat${ok(v) ? '' : ' is-none'}`);
          s.append(el('span', 'vzb-sr', cellNum(v, {})));
          if (ok(v)) s.style.setProperty('--vzb-heat', `${mix(+v, byRow ? range(r.values) : all).toFixed(0)}%`);
          s.dataset.label = `${r.name} · ${label}`;
          s.dataset.value = ok(v) ? show(f, +v) : '–';
          return s;
        },
      }))),
    });
    table.classList.add('is-heat');
    // 칸에 마우스를 올리거나 탭하면 그 칸의 값을 툴팁으로 보여줍니다.
    table.addEventListener('pointerover', (e) => {
      const s = e.target.closest && e.target.closest('.vzb-tb-heat');
      if (!s) { hideTip(); return; }
      const b = s.getBoundingClientRect();
      showTip(b.left + b.width / 2, b.top, s.dataset.label, s.dataset.value);
    });
    table.addEventListener('pointerleave', hideTip);
  });
