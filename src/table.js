  /* 표 카드 공통: 머리글은 가운데, 이름은 왼쪽, 숫자는 오른쪽 정렬과 같은 폭 숫자로 적고, 단위는 열 제목에 한 번만 적습니다.
     줄에 마우스를 올리면 그 줄을 옅게 칠합니다. sortable이면 열 제목을 눌러 정렬하고, 합계 줄(total)은 정렬과 상관없이 맨 아래에 둡니다. */

  // 칸 숫자: 단위 없이 적습니다(단위는 열 제목에). pct 열은 %를 붙입니다.
  function cellNum(v, c) {
    if (v == null || !isFinite(v)) return '–';
    const x = +v / (c.div || 1), dec = c.decimals != null ? c.decimals : Number.isInteger(x) ? 0 : 1;
    return `${num(x, dec).replace(/^-/, '−')}${c.pct ? '%' : ''}`;
  }
  // 증감 배지: 기준(base) 대비 증감률. KPI 카드의 배지와 같습니다.
  const relF = { parts: (v) => [num(v, 1), ''], rel: true };
  const changeBadge = (value, base, d) => (value == null || !base ? el('span', 'vzb-tb-none', '–') : badge(Object.assign({ lang: d.lang }, relF), +value, +base, d.better));
  // 합계 줄의 증감: 두 값이 모두 있는 줄만 더한 뒤 합계끼리 계산합니다.
  const ok = (v) => v != null && v !== '' && isFinite(v);
  function changeTotal(rows, of, base, d) {
    let a = 0, b = 0;
    rows.forEach((r) => { if (ok(r[of]) && ok(r[base])) { a += +r[of]; b += +r[base]; } });
    return changeBadge(a, b, d);
  }
  // 스파크라인: 72×20px 곡선과 마지막 점. 줄마다 자기 범위에 맞춰 그리되, 범위가 값의 10%보다 좁으면 10%로 넓혀
  // 거의 변하지 않은 줄이 크게 출렁여 보이지 않게 합니다(그 줄은 가운데 높이에서 거의 평평하게 그려집니다).
  function sparkEl(values) {
    const w = 72, h = 20, pad = 3, vals = (values || []).map((v) => (v == null ? null : +v));
    const got = vals.filter((v) => v != null), n = vals.length;
    let lo = Math.min(...got), hi = Math.max(...got);
    const span = Math.max(hi - lo, Math.max(Math.abs(lo), Math.abs(hi)) * 0.1);
    lo -= (span - (hi - lo)) / 2;
    hi = lo + span;
    const svg = svgEl('svg', { class: 'vzb-tb-spark', viewBox: `0 0 ${w} ${h}`, width: w, height: h, 'aria-hidden': 'true' });
    if (!got.length) return svg;
    const pts = [];
    vals.forEach((v, i) => { if (v != null) pts.push({ x: n < 2 ? w / 2 : pad + (i * (w - pad * 2)) / (n - 1), y: h - pad - ((v - lo) / (hi - lo || 1)) * (h - pad * 2) }); });
    const last = pts[pts.length - 1];
    svg.append(svgEl('path', { d: monotone(pts), class: 'vzb-tb-spark-line' }), svgEl('circle', { cx: last.x, cy: last.y, r: 2.5, class: 'vzb-tb-spark-dot' }));
    return svg;
  }

  // cfg: columns [{ key, label, unit, pct, decimals, align('txt' | 'num'), value(row), cell(row, ctx) → 요소, total(rows) → 값이나 요소, sort(false면 정렬 안 함), head(클래스) }]
  //   rows · total(합계 줄 이름) · sortable · sortKey · sortDir(1 오름 · -1 내림) · top(머리 아래 요소) · prepare(rows) → ctx · rowClass(row)
  function tableCard(card, d, f, cfg) {
    head(card, d, f, null);
    if (cfg.top) card.append(cfg.top);
    const foot = el('div', 'vzb-foot vzb-tb');
    const table = el('table', 'vzb-tb-table');
    const thead = el('thead'), tbody = el('tbody'), tfoot = el('tfoot');
    table.append(el('caption', 'vzb-sr', `${d.title || ''}${d.subtitle ? `, ${d.subtitle}` : ''}${cfg.sortable ? tx(d, '. 열 제목을 누르면 정렬합니다.') : ''}`), thead, tbody, tfoot);
    foot.append(table);
    card.append(foot);
    const cols = cfg.columns, rows = cfg.rows || [];
    const ctx = Object.assign({ f, rows }, cfg.prepare ? cfg.prepare(rows) : {});
    const val = (r, c) => (c.value ? c.value(r) : r[c.key]);
    const align = (c, j) => c.align || (j ? 'num' : 'txt');
    // 달러(usd) 금액 열: 묶음(cfg.money, format이 usd일 때만 넘깁니다)마다 가장 큰 값으로 K · M · B 하나를 골라 칸에는 나눈 값을, 열 제목에는 $K 같은 단위를 적습니다.
    if (cfg.money) cfg.money.forEach((keys) => {
      const cs = cols.filter((c) => keys.includes(c.key));
      const top = Math.max(0, ...cs.flatMap((c) => rows.map((r) => Math.abs(+val(r, c)) || 0)));
      const [div, u] = top >= 1e9 ? [1e9, 'B'] : top >= 1e6 ? [1e6, 'M'] : top >= 1e3 ? [1e3, 'K'] : [1, ''];
      cs.forEach((c) => Object.assign(c, { div, decimals: c.decimals != null ? c.decimals : d.decimals != null ? d.decimals : div > 1 ? 1 : 0 }, cfg.moneyHead ? {} : { unit: `$${u}` }));
      if (cfg.moneyHead) { const h = cols.find((c) => c.key === cfg.moneyHead); if (h) h.unit = `$${u}`; }
    });
    let sortKey = cfg.sortKey, dir = cfg.sortDir || -1;
    const hr = el('tr');
    const ths = cols.map((c, j) => {
      const th = el('th', `vzb-tb-${align(c, j)}${c.head ? ` ${c.head}` : ''}`);
      th.scope = 'col';
      const label = el('span', null, c.label || '');
      if (c.unit) label.append(el('small', null, `(${c.unit})`));
      if (cfg.sortable && c.sort !== false) {
        const btn = el('button', 'vzb-tb-sort');
        btn.type = 'button';
        btn.append(label, el('i', 'vzb-tb-arrow'));
        btn.addEventListener('click', () => {
          if (sortKey === c.key) dir = -dir;
          else { sortKey = c.key; dir = align(c, j) === 'txt' ? 1 : -1; }
          render();
        });
        th.append(btn);
      } else th.append(label);
      hr.append(th);
      return th;
    });
    thead.append(hr);
    const cellOf = (r, c, j) => {
      const td = el(j ? 'td' : 'th', `vzb-tb-${align(c, j)}`);
      if (!j) td.scope = 'row';
      const v = val(r, c), out = c.cell ? c.cell(r, ctx) : typeof v === 'string' ? v : cellNum(v, c);
      if (!j && typeof out === 'string') {   // 긴 이름은 말줄임표로 줄이고 전체 이름은 title에 둡니다.
        const name = el('span', 'vzb-tb-name', out);
        name.title = out;
        td.append(name);
      } else if (typeof out === 'string') td.textContent = out; else if (out) td.append(out);
      return td;
    };
    function render() {
      const list = rows.slice();
      const c = sortKey && cols.find((x) => x.key === sortKey);
      if (c) {
        list.sort((a, b) => {
          const x = val(a, c), y = val(b, c), nx = x == null || x === '' || (typeof x === 'number' && !isFinite(x)), ny = y == null || y === '' || (typeof y === 'number' && !isFinite(y));
          if (nx || ny) return nx === ny ? 0 : nx ? 1 : -1;   // 빈 값은 정렬 방향과 상관없이 맨 아래에 둡니다
          return (typeof x === 'string' || typeof y === 'string' ? String(x).localeCompare(String(y), 'ko', { numeric: true }) : x - y) * dir;
        });
      }
      if (!list.length) {
        const td = el('td', 'vzb-tb-empty', tx(d, '표시할 데이터가 없습니다.'));
        td.colSpan = cols.length;
        const tr = el('tr');
        tr.append(td);
        tbody.replaceChildren(tr);
        return;
      }
      tbody.replaceChildren(...list.map((r) => {
        const tr = el('tr', cfg.rowClass ? cfg.rowClass(r) : null);
        cols.forEach((c, j) => tr.append(cellOf(r, c, j)));
        return tr;
      }));
      ths.forEach((th, j) => th.setAttribute('aria-sort', cfg.sortable && cols[j].key === sortKey ? (dir > 0 ? 'ascending' : 'descending') : 'none'));
    }
    render();
    if (cfg.total && rows.length) {
      const tr = el('tr');
      cols.forEach((c, j) => {
        const td = el(j ? 'td' : 'th', `vzb-tb-${align(c, j)}`);
        if (!j) { td.scope = 'row'; td.textContent = cfg.total; }
        else if (c.total) {
          const out = c.total(rows, ctx);
          if (out == null) td.textContent = '';
          else if (typeof out === 'number') td.textContent = cellNum(out, c);
          else if (typeof out === 'string') td.textContent = out;
          else td.append(out);
        }
        tr.append(td);
      });
      tfoot.append(tr);
    }
    return { table, tbody, ctx };
  }
  const sumOf = (key) => (rows) => rows.reduce((a, r) => a + (+r[key] || 0), 0);
  // 값 열의 단위: unit을 적지 않으면 format의 단위(억 · 건 등)를 씁니다.
  const unitOf = (d, f) => d.unit || (f.usd ? '' : f.parts(0)[1]) || '';
