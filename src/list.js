  /* 가로 막대 공통: 항목마다 한 줄. 큰 순서로 정렬하고(sort: false면 적은 순서), max를 넘는 항목은 '기타 n개' 한 줄로 묶습니다.
     이름을 막대 안에 얹는 줄(overlay)과 이름 · 막대 · 값을 칸으로 나눈 줄(column)이 있습니다.
     줄에 마우스를 올리거나, 목록에 포커스한 뒤 위아래 화살표를 누르면 툴팁으로 자세한 값을 보여줍니다. */

  // 막대 길이(0–100%)
  const share = (v, max) => `${(Math.max(0, Math.min(1, max > 0 ? v / max : 0)) * 100).toFixed(2)}%`;
  // 이름을 막대 안에 얹은 칸. mark가 있으면 그 자리(비교 값)에 세로 눈금을 긋습니다.
  function overlayBar(name, width, mark) {
    const bar = el('div', 'vzb-li-bar');
    const fill = el('i', 'vzb-li-fill');
    fill.style.width = width;
    bar.append(fill);
    if (mark != null) {
      const m = el('i', 'vzb-li-mark');
      m.style.left = mark;
      bar.append(m);
    }
    bar.append(el('span', 'vzb-li-name', name));
    return bar;
  }
  // 묶인 '기타' 줄의 이름 칸(막대 없음)
  const restName = (it) => el('span', 'vzb-li-name is-rest', it.name);
  // 묶을 항목들의 이름과 값의 합. keys에 적은 값도 함께 더합니다.
  function foldRest(rest, keys) {
    const it = { rest: true, name: `기타 ${rest.length}개`, note: rest.map((x) => x.name).join('·') };
    keys.forEach((k) => { it[k] = rest.reduce((a, x) => a + (+x[k] || 0), 0); });
    return it;
  }

  // cfg: items · layout(overlay | column) · cols(열 너비, CSS grid) · columns([이름 열 제목, 값 열 제목]) · legend · top
  //   max(보여줄 줄 수, 넘으면 기타로 묶음) · order(정렬 함수) · fold(rest) · prepare(shown) → ctx · cells(item, ctx) → 칸 요소들
  //   tip(item, ctx) → { value, note } 또는 { rows, note } · f(값 표기)
  // 돌려주는 show(cfg 일부)로 같은 카드에 다른 목록을 다시 그립니다(탭 카드).
  function listCard(card, d, f, cfg) {
    head(card, d, f, null);
    if (cfg.top) card.append(cfg.top);
    if (cfg.legend) card.append(legendEl(cfg.legend));
    const foot = el('div', 'vzb-foot vzb-li');
    const cols = el('div', 'vzb-li-cols');
    const list = el('div', 'vzb-li-list');
    list.tabIndex = 0;
    list.setAttribute('role', 'list');
    foot.append(cols, list);
    card.append(foot);
    let S, ctx, rows = [], shown = [];

    function use(next) {
      S = Object.assign({ f }, cfg, next);
      let items = (S.items || []).filter((it) => it && it.name != null);
      if (S.order) items = items.slice().sort(S.order);
      else if (S.sort !== false) items = items.slice().sort((a, b) => (+b.value || 0) - (+a.value || 0));
      const max = S.max || 5;
      shown = items.length > max + 1 && S.fold ? items.slice(0, max).concat([S.fold(items.slice(max))]) : items;
      cols.replaceChildren(...(S.columns || []).map((t) => el('span', null, t)));
      list.className = `vzb-li-list is-${S.layout || 'overlay'}`;
      list.style.gridTemplateColumns = S.cols || 'minmax(0, 1fr) auto';
      list.setAttribute('aria-label', `${S.name || d.title || ''} 목록, ${shown.length}줄. 위아래 화살표로 항목의 자세한 값을 봅니다.`);
      ctx = Object.assign({ f: S.f }, S.prepare ? S.prepare(shown) : {});
      rows = shown.map((it) => {
        const row = el('div', `vzb-li-row${it.rest ? ' is-rest' : ''}`);
        row.setAttribute('role', 'listitem');
        row.append(...S.cells(it, ctx));
        return row;
      });
      list.replaceChildren(...rows);
    }
    use({});

    const api = interact(list, () => rows.length,
      (cx, cy) => {
        let best = 0, gap = Infinity;
        rows.forEach((r, i) => {
          const b = r.getBoundingClientRect(), dist = cy < b.top ? b.top - cy : cy > b.bottom ? cy - b.bottom : 0;
          if (dist < gap) { gap = dist; best = i; }
        });
        return best;
      },
      (i) => {
        rows.forEach((r, k) => r.classList.toggle('is-on', k === i));
        const it = shown[i], t = tipBody(S.tip(it, ctx), it.rest && it.note ? `${it.name} (${it.note})` : it.name);
        const b = rows[i].getBoundingClientRect();
        return { x: b.left + b.width / 2, y: b.top, label: it.rest && it.note ? `${it.name} (${it.note})` : it.name, value: t.node, text: t.text };
      },
      () => rows.forEach((r) => r.classList.remove('is-on')),
      true);
    return {
      show(next) {
        api.end();
        use(next);
      },
    };
  }

  // Bar - Ranking: 이름을 막대 안에 얹고 값은 오른쪽에. 툴팁에 전체 중 비중을 적습니다.
  function basicList(card, d, f, cfg) {
    return listCard(card, d, f, Object.assign({
      layout: 'overlay',
      cols: 'minmax(0, 1fr) auto',
      fold: (rest) => foldRest(rest, ['value']),
      prepare: (shown) => ({
        max: Math.max(0, ...shown.filter((x) => !x.rest).map((x) => +x.value || 0)),
        total: shown.reduce((a, x) => a + (+x.value || 0), 0),
      }),
      cells: (it, c) => [it.rest ? restName(it) : overlayBar(it.name, share(it.value, c.max)), el('b', 'vzb-li-val', show(c.f, it.value))],
      tip: (it, c) => ({ value: show(c.f, it.value), note: c.total ? `전체의 ${num((it.value / c.total) * 100, 1)}%` : '' }),
    }, cfg));
  }
