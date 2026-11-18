  // Waffle Flip: 와플 100칸(5줄 × 20칸)으로 비중을 그리고, 두 기간 사이에 바뀐 만큼의 칸을 한 칸씩 뒤집어 보여 줍니다.
  // 짚을 항목(focus, 비우면 첫 항목) 하나만 첫째 데이터 색이고, 나머지는 글자색을 옅게 깐 회색 단계입니다(적은 순서대로 진한 회색부터).
  // 칸은 짚을 항목부터 왼쪽 위에서 세로로 채웁니다(한 세로줄 5칸이 5%). 그래서 짚을 항목이 늘거나 줄면 그 덩어리의 끝에서 칸이 뒤집히고,
  // 뒤 기간을 보일 때 뒤집힌 칸 아래에 괄호와 바뀐 %p를 적습니다. 큰 숫자와 범례의 비중은 지금 보이는 칸 수를 그대로 세므로 칸이 뒤집힐 때마다 1%씩 바뀌고,
  // 뒤 기간이 다 그려지면 큰 숫자에 증감 배지와 '앞 기간 대비'가 붙습니다.
  // 칸은 기간마다 반올림한 합이 100이 되도록 나머지가 큰 항목부터 한 칸씩 더합니다. values의 원래 값(판매량 등)은 카드가 비중으로 바꾸고,
  // 툴팁과 표에는 원래 값과 소수 한 자리 비중을 함께 적습니다.
  // 기간 단추: 두 기간을 주면 머리 오른쪽 위에 두 기간을 오가는 단추를 둡니다. 누르거나 좌우 화살표로 고르면 바뀐 칸만 뒤집혀 그 기간이 됩니다.
  // 움직임: 화면에 보이면 앞 기간의 칸이 놓여 있다가 단추가 뒤 기간으로 옮겨 가며 바뀐 칸이 차례로 뒤집힙니다. 한 기간만 주면 단추 없이 그 기간의 칸만 그립니다.
  // 데이터가 바뀌어 다시 그릴 때(data-vzb-live)는 고른 기간의 멈춘 장면을 바로 그립니다.
  // 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 끝에서 잠시 쉬고 두 기간을 오갑니다. 단추를 직접 고르면 오가기를 멈춥니다.
  mount('waffle-flip', (card, d, f) => {
    // 걸러서 남은 항목이 없을 때(items가 빈 배열이거나 모든 값이 0)는 오류가 아니라 빈 화면입니다.
    const none = () => { head(card, d, f, null); card.append(el('p', 'vzb-wf-none', tx(d, '표시할 항목이 없습니다.'))); };
    if (Array.isArray(d.items) && (!d.items.length || d.items.every((it) => it && Array.isArray(it.values) && it.values.every((v) => fin(v) && +v === 0)))) { none(); return; }
    const list = Array.isArray(d.items) ? d.items.filter((it) => it && it.name != null && it.name !== '') : [];
    const periods = (Array.isArray(d.periods) && d.periods.length ? d.periods : ['']).map(String);
    const P = periods.length, last = P - 1;
    if (list.length < 2 || list.length > 4) throw new Error(tx(d, 'items에 항목을 2~4개 적으세요.'));
    if (P > 2 || list.some((it) => !Array.isArray(it.values) || it.values.length !== P || it.values.some((v) => !fin(v) || +v < 0))) throw new Error(tx(d, 'periods와 values를 확인하세요.'));
    // 짚을 항목을 맨 앞에 둡니다. 나머지는 적은 순서 그대로 진한 회색부터 옅은 회색까지입니다.
    const at = list.findIndex((it) => String(it.name) === String(d.focus));
    const items = [list[Math.max(0, at)], ...list.filter((_, i) => i !== Math.max(0, at))].map((it, k) => ({ k, name: String(it.name), vals: it.values.map(Number) }));
    const totals = periods.map((_, p) => items.reduce((s, it) => s + it.vals[p], 0));
    if (totals.some((t) => !(t > 0))) throw new Error(tx(d, 'periods와 values를 확인하세요.'));
    // 기간마다 100칸: 내림한 칸 수에 나머지가 큰 항목부터 한 칸씩 더해 합을 100으로 맞춥니다.
    const cellsOf = (p) => {
      const exact = items.map((it) => (it.vals[p] / totals[p]) * 100), n = exact.map(Math.floor);
      let left = 100 - n.reduce((a, b) => a + b, 0);
      exact.map((e, i) => [e - n[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { n[i]++; left--; } });
      return n;
    };
    const counts = periods.map((_, p) => cellsOf(p));
    items.forEach((it) => { it.share = periods.map((_, p) => (it.vals[p] / totals[p]) * 100); it.cells = counts.map((c) => c[it.k]); });
    const focus = items[0], diff = focus.cells[last] - focus.cells[0];
    const catsOf = (p) => counts[p].flatMap((n, k) => Array(n).fill(k));
    const cats = periods.map((_, p) => catsOf(p)), before = cats[0], after = cats[last];
    const flips = before.map((c, i) => (c !== after[i] ? i : -1)).filter((i) => i >= 0);   // 바뀐 칸(짚을 항목의 끝부터, 번호 순서)
    const pct = format({ format: 'pct', decimals: 0 }, d);
    const ppText = (v, k) => `${v > 0 ? '+' : v < 0 ? '-' : ''}${tx(d, '%s%p', num(Math.abs(v), k))}`;
    const pctText = (v, k) => `${num(v, k)}%`;

    head(card, d, f, null);
    const hd = card.querySelector('.vzb-hd');
    // 큰 숫자: 지금 보이는 칸 가운데 짚을 항목의 칸 수(%). 뒤 기간이 다 그려지면 증감 배지와 '앞 기간 대비'가 붙습니다. 한 기간이면 그 기간 이름을 붙입니다.
    const fig = el('div', 'vzb-fig vzb-wf-fig'), numEl = figure(pct, focus.cells[last]), nowText = numEl.firstChild;
    fig.append(numEl);
    let bd = null, vs = null;
    if (P > 1) {
      bd = badge(pct, focus.cells[last], focus.cells[0], d.better);
      vs = el('span', 'vzb-vs', tx(d, '%s 대비', periods[0]));
      bd.classList.add('vzb-wf-in');
      vs.classList.add('vzb-wf-in');
      fig.append(bd, vs);
    } else if (periods[0]) fig.append(el('span', 'vzb-vs vzb-wf-pl', periods[0]));
    card.append(fig);
    // 기간 단추: 두 기간 가운데 하나를 고르는 라디오 묶음입니다. 고른 기간에는 글자색 알약이 미끄러져 옮겨 갑니다.
    let per = null, pill = null, opts = [];
    if (P > 1) {
      per = el('div', 'vzb-wf-per');
      per.setAttribute('role', 'radiogroup');
      per.setAttribute('aria-label', tx(d, '기간'));
      pill = el('span', 'vzb-wf-pill');
      pill.setAttribute('aria-hidden', 'true');
      per.append(pill);
      opts = periods.map((name, p) => {
        const b = el('button', 'vzb-wf-opt', name);
        b.type = 'button';
        b.setAttribute('role', 'radio');
        b.addEventListener('click', () => pick(p));
        per.append(b);
        return b;
      });
      per.addEventListener('keydown', (e) => {
        const k = e.key, step = k === 'ArrowRight' || k === 'ArrowDown' ? 1 : k === 'ArrowLeft' || k === 'ArrowUp' ? -1 : 0;
        const p = k === 'Home' ? 0 : k === 'End' ? last : step ? (to + step + P) % P : -1;
        if (p < 0) return;
        e.preventDefault();
        pick(p);
        opts[p].focus();
      });
      hd.append(per);
    }
    const foot = el('div', 'vzb-foot vzb-wf');
    const plot = el('div', 'vzb-plot vzb-wf-plot');
    plot.tabIndex = 0;
    plot.setAttribute('role', 'img');
    const nowShare = pctText(focus.cells[last], 0);
    plot.setAttribute('aria-label', P > 1
      ? tx(d, '%1. %2의 비중은 %3로, %4 대비 %5입니다. 좌우 화살표로 항목을 옮깁니다. 모든 값은 이어지는 표에 있습니다.', d.title || '', focus.name, nowShare, periods[0], ppText(diff, 0))
      : tx(d, '%1. %2의 비중은 %3입니다. 좌우 화살표로 항목을 옮깁니다. 모든 값은 이어지는 표에 있습니다.', d.title || '', focus.name, nowShare));
    const svg = svgEl('svg', { class: 'vzb-wf-svg', 'aria-hidden': 'true' });
    plot.append(svg);
    const ctl = el('div', 'vzb-wf-ctl'), legend = el('ul', 'vzb-wf-legend');
    legend.setAttribute('aria-hidden', 'true');
    items.forEach((it) => {
      it.li = el('li');
      it.val = el('b', null, pctText(it.cells[last], 0));
      it.li.append(el('i', `vzb-wf-key vzb-wf-c${it.k}`), el('span', null, it.name), it.val);
      legend.append(it.li);
    });
    ctl.append(legend);
    foot.append(plot, ctl);
    card.append(foot);
    // 화면 낭독기용 표: 항목 · 기간마다 비중(원래 값) · 차이
    const sr = el('div', 'vzb-sr'), table = el('table'), hr = el('tr');
    hr.append(...[tx(d, '이름'), ...periods.map((p) => p || tx(d, '비중')), ...(P > 1 ? [tx(d, '차이')] : [])].map((k) => el('th', null, k)));
    table.append(el('caption', null, d.title || ''), hr);
    items.forEach((it) => {
      const tr = el('tr');
      tr.append(el('th', null, it.name), ...periods.map((_, p) => el('td', null, `${pctText(it.share[p], 1)} (${show(f, it.vals[p])})`)));
      if (P > 1) tr.append(el('td', null, ppText(it.share[last] - it.share[0], 1)));
      table.append(tr);
    });
    const say = el('div', 'vzb-sr');   // 기간을 고르면 그 기간의 짚을 항목 비중을 읽어 줍니다
    say.setAttribute('aria-live', 'polite');
    sr.append(table);
    card.append(sr, say);

    // 칸 100개와 괄호: 칸 하나는 한 변 pitch에서 틈을 뺀 정사각형입니다.
    const cells = before.map((c, i) => {
      const r = svgEl('rect', { class: `vzb-wf-cell vzb-wf-c${c}`, rx: 2 });
      r.cat = c;
      svg.append(r);
      return r;
    });
    const brace = svgEl('path', { class: 'vzb-wf-br' }), braceText = svgText(0, 0, ppText(diff, 0), 'vzb-wf-brt', 'start');
    svg.append(brace, braceText);
    const ROWS = 5, COLS = 20, fx = (v) => v.toFixed(1), clamp = (v) => Math.max(0, Math.min(1, v));
    const fam = getComputedStyle(card).fontFamily;
    // 시간표(밀리초): 처음 앞 기간을 읽는 시간 · 칸 사이 간격(바뀐 칸이 많으면 짧게) · 한 칸이 뒤집히는 시간 · 괄호가 그어지는 시간
    const T0 = 700, K = flips.length, STAG = Math.max(28, Math.min(110, 1100 / Math.max(1, K))), FLIP = 300, OUT = 260;
    const order = new Map(flips.map((i, j) => [i, j]));
    const easeIn = (k) => k * k, spring = (k) => 1 + 2.2 * (k - 1) ** 3 + 1.2 * (k - 1) ** 2;
    // 지금 장면: from 기간에서 to 기간으로 가는 중(lead 동안은 from을 보이고, 그 뒤 바뀐 칸이 차례로 뒤집힘). 같으면 그 기간에 멈춰 있습니다.
    // 데이터가 바뀌어 다시 그린 카드는 카드 요소에 적어 둔 기간(data-vzb-period)을 이어 갑니다.
    const kept = periods.indexOf(card.getAttribute('data-vzb-period'));
    let from = kept >= 0 ? kept : last, to = from, lead = 0, t = 0;
    const endOf = () => lead + Math.max(0, K - 1) * STAG + (K ? FLIP : 0);
    const total = () => (from === to ? 0 : endOf() + (to === last && diff ? OUT + 240 : 160));
    const shownP = () => (from !== to && t < lead ? from : to);
    let pitch = 0, cell = 0, W = 0;
    // 칸 크기: 카드 높이(2단위) 안에서 큰 숫자 아래 남은 높이와 폭에 맞춰 될 수 있는 만큼 키웁니다(한 변 30px까지).
    // 넓은 카드(520px 이상)는 범례를 칸 오른쪽에 세로로 두고, 좁으면 범례는 칸 아래입니다.
    function layout(fw) {
      const side = fw >= 520;
      foot.classList.toggle('is-side', side);
      if (per) hd.style.paddingRight = `${per.offsetWidth + 12}px`;   // 제목은 기간 단추 왼쪽까지
      const cs = getComputedStyle(card), H = parseFloat(cs.minHeight) || 336;
      const top = fig.getBoundingClientRect().bottom - card.getBoundingClientRect().top;
      const below = parseFloat(cs.paddingBottom) + parseFloat(cs.borderBottomWidth) + parseFloat(getComputedStyle(foot).paddingTop) + (side ? 0 : ctl.offsetHeight + 8) + 22;
      const byH = (H - top - below + 3) / ROWS, byW = (fw - (side ? Math.max(...items.map((it) => it.li.offsetWidth)) + 28 : 0)) / COLS;
      pitch = Math.max(8, Math.min(30, byW, byH));
      const gap = pitch >= 14 ? 3 : 2, w = side ? pitch * COLS - gap : fw;
      W = w;
      cell = pitch - gap;
      const h = pitch * ROWS - gap + 22;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      cells.forEach((r, i) => {
        r.setAttribute('x', fx(Math.floor(i / ROWS) * pitch));
        r.setAttribute('y', fx((i % ROWS) * pitch));
        r.setAttribute('width', fx(cell));
        r.setAttribute('height', fx(cell));
      });
      // 괄호: 짚을 항목에서 바뀐 칸이 든 세로줄들 아래. %p는 괄호 오른쪽, 자리가 모자라면 왼쪽에 적습니다.
      if (diff) {
        const a = Math.min(focus.cells[0], focus.cells[last]), b = Math.max(focus.cells[0], focus.cells[last]) - 1;
        const x1 = Math.floor(a / ROWS) * pitch, x2 = Math.floor(b / ROWS) * pitch + cell, y = pitch * ROWS - gap + 7;
        brace.setAttribute('d', `M${fx(x1)},${fx(y - 4)}V${fx(y)}H${fx(x2)}V${fx(y - 4)}`);
        brace.len = (x2 - x1) + 8;
        brace.setAttribute('stroke-dasharray', fx(brace.len));
        const tw = textW(braceText.textContent, 700, fam, 14) + 6, right = x2 + tw <= w;
        braceText.setAttribute('text-anchor', right ? 'start' : 'end');
        braceText.setAttribute('x', fx(right ? x2 + 6 : x1 - 6));
        braceText.setAttribute('y', fx(y + 4));
      }
      placePill();
      render();
    }
    // 기간 단추의 알약: 처음 자리는 움직이지 않고 놓은 뒤부터 미끄러집니다(is-ready).
    let pillAt = -1;
    function placePill() {
      if (!per || pillAt < 0) return;
      const b = opts[pillAt];
      pill.style.width = `${b.offsetWidth}px`;
      pill.style.transform = `translateX(${b.offsetLeft}px)`;
      if (!per.classList.contains('is-ready') && b.offsetWidth) requestAnimationFrame(() => per.classList.add('is-ready'));
    }
    function setPill(p) {
      if (!per || p === pillAt) return;
      pillAt = p;
      opts.forEach((b, q) => { b.setAttribute('aria-checked', String(q === p)); b.tabIndex = q === p ? 0 : -1; b.classList.toggle('is-on', q === p); });
      placePill();
    }
    function render() {
      if (!W) return;
      const moving = from !== to, src = cats[from], dst = cats[to], rev = to < from, cnt = items.map(() => 0);
      cells.forEach((r, i) => {
        const j0 = order.get(i);
        let cat = dst[i], sx = 1;
        if (moving && j0 != null) {
          // 앞으로 갈 때는 번호 순서, 되돌아갈 때는 거꾸로(마지막에 뒤집힌 칸부터) 뒤집습니다.
          const k = clamp((t - lead - (rev ? K - 1 - j0 : j0) * STAG) / FLIP);
          cat = k >= 0.4 ? dst[i] : src[i];
          sx = k <= 0 || k >= 1 ? 1 : k < 0.4 ? 1 - easeIn(k / 0.4) : Math.max(0.02, spring((k - 0.4) / 0.6));
        }
        cnt[cat]++;
        if (r.cat !== cat) { r.classList.replace(`vzb-wf-c${r.cat}`, `vzb-wf-c${cat}`); r.cat = cat; }
        const cx = Math.floor(i / ROWS) * pitch + cell / 2;
        r.setAttribute('transform', sx === 1 ? '' : `matrix(${sx.toFixed(3)} 0 0 1 ${fx(cx * (1 - sx))} 0)`);
      });
      // 큰 숫자와 범례는 지금 보이는 칸 수 그대로입니다.
      nowText.nodeValue = num(cnt[0], 0);
      items.forEach((it) => { const v = pctText(cnt[it.k], 0); if (it.val.textContent !== v) it.val.textContent = v; });
      setPill(shownP());
      const end = endOf(), done = !moving || t >= end, atLast = P > 1 && to === last;
      const kb = atLast && diff ? (moving ? clamp((t - end) / OUT) : 1) : 0;
      brace.setAttribute('stroke-dashoffset', fx((brace.len || 0) * (1 - kb)));
      brace.style.opacity = kb > 0 ? 1 : 0;
      braceText.style.opacity = atLast && diff ? (moving ? fx(clamp((t - end - OUT * 0.5) / (OUT * 0.5))) : 1) : 0;
      if (bd) { const show = atLast && done; bd.hidden = !show; vs.hidden = !show; }
    }

    // 재생: 화면에 보이고(inView) 마우스 · 포커스로 잠시 멈추지 않았을 때(holds)만 움직입니다. 카드가 페이지에서 빠지면 멈춥니다.
    const live = card.hasAttribute('data-vzb-live');   // 데이터가 바뀌어 다시 그린 카드: 처음부터 재생하지 않습니다
    const loop = !!card.closest('[data-vzb-loop]');
    const holds = new Set();
    let playing = false, seen = false, inView = false, rest = 0, lastStamp = 0, raf = 0, took = false;
    const on = () => playing && inView && !holds.size && card.isConnected;
    function tick(stamp) {
      raf = 0;
      if (!on()) { lastStamp = 0; return; }
      const dt = lastStamp ? Math.min(100, stamp - lastStamp) : 16;
      lastStamp = stamp;
      if (rest > 0) { rest -= dt; if (rest <= 0) go(to === last ? 0 : last, 0); }   // 갤러리: 잠시 쉬고 다른 기간으로
      else {
        t = Math.min(total(), t + dt);
        if (t >= total()) { from = to; t = 0; if (loop && !took) rest = 2600; else playing = false; }
      }
      render();
      if (on()) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf && on()) raf = requestAnimationFrame(tick); }
    // 기간 p로 갑니다. 다른 기간으로 가는 중에 되돌리면, 이미 뒤집힌 칸부터 거꾸로 되짚습니다.
    function go(p, wait) {
      if (from !== to && p === from) {
        const span = endOf() - lead, s = Math.max(0, Math.min(span, t - lead));
        from = to; to = p; lead = 0; t = span - s;
      } else if (p !== to) { from = to; to = p; lead = wait; t = 0; }
      else return;
      playing = true;
      lastStamp = 0;
      render();
      kick();
    }
    // 단추로 고른 기간: 갤러리의 오가기를 멈추고, 다시 그려도 이어 가도록 카드에 적어 두고, 화면 낭독기에 알립니다.
    function pick(p) {
      took = true;
      rest = 0;
      card.setAttribute('data-vzb-period', periods[p]);
      if (p === to) return;
      go(p, 0);
      say.textContent = `${periods[p]}: ${focus.name} ${pctText(focus.cells[p], 0)}${p === last && diff ? ` (${ppText(diff, 0)} ${tx(d, '%s 대비', periods[0])})` : ''}`;
    }
    plot.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { holds.add('hover'); render(); } });
    plot.addEventListener('pointerleave', () => { holds.delete('hover'); kick(); });
    plot.addEventListener('focus', () => { if (plot.matches(':focus-visible')) { holds.add('focus'); render(); } });   // 키보드로 들어왔을 때만 멈춥니다
    plot.addEventListener('blur', () => { holds.delete('focus'); kick(); });
    // 툴팁: 칸을 짚으면 그 항목의 칸만 진하게 남기고 비중(소수 한 자리) · 원래 값 · 앞 기간 대비 %p를 보여 줍니다.
    interact(plot, items.length,
      (cx, cy) => {
        const r = svg.getBoundingClientRect(), col = Math.floor((cx - r.left) / pitch), row = Math.floor((cy - r.top) / pitch);
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return -1;
        return cells[col * ROWS + row].cat;
      },
      (k) => {
        const it = items[k], r = svg.getBoundingClientRect();
        svg.classList.add('is-hover');
        legend.classList.add('is-hover');
        items.forEach((x) => x.li.classList.toggle('is-on', x === it));
        const mine = cells.map((c, i) => [c, i]).filter(([c]) => c.cat === k);
        mine.forEach(([c]) => c.classList.add('is-on'));
        cells.forEach((c) => { if (c.cat !== k) c.classList.remove('is-on'); });
        // 툴팁은 짚은 칸 묶음의 옆(묶음이 왼쪽 절반이면 오른쪽, 아니면 왼쪽)에 띄웁니다. 칸 위에 띄우면 머리의 대표 수치를 덮어 같은 숫자가 겹쳐 보이기 때문입니다.
        const cols = mine.map(([, i]) => Math.floor(i / ROWS)), c0 = cols.length ? Math.min(...cols) : 0, c1 = cols.length ? Math.max(...cols) + 1 : 0, leftHalf = (c0 + c1) / 2 < COLS / 2;
        const p = shownP(), note = [P > 1 ? `${periods[p]} · ${show(f, it.vals[p])}` : show(f, it.vals[p])];
        const want = d.better === 'down' ? -1 : d.better === 'neutral' ? 0 : 1, dv = it.share[last] - it.share[0];
        if (P > 1 && p === last) note.push({ text: `${ppText(dv, 1)} ${tx(d, '%s 대비', periods[0])}`, tone: want === 0 || Math.abs(dv) < 1e-9 ? null : Math.sign(dv) === want ? 'good' : 'bad' });
        const tb = tipBody({ value: pctText(it.share[p], 1), note }, it.name);
        return { x: r.left + (leftHalf ? c1 * pitch : c0 * pitch), y: r.top + (ROWS * pitch) / 2, side: leftHalf ? 'right' : 'left', label: it.name, value: tb.node, text: tb.text };
      },
      () => { svg.classList.remove('is-hover'); legend.classList.remove('is-hover'); items.forEach((x) => x.li.classList.remove('is-on')); cells.forEach((c) => c.classList.remove('is-on')); },
      false, true);

    // 처음 장면: 재생할 카드는 앞 기간에 멈춰 기다리고, 아니면(다시 그림 · 한 기간) 고른 기간 또는 뒤 기간입니다.
    const auto = !live && P > 1;
    if (auto) from = to = 0;
    onSize(foot, layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (W) layout(foot.clientWidth); });
    // 화면에 처음 보일 때 움직입니다. 화면 밖에 있는 동안은 멈춰 둡니다.
    const start = () => { if (!seen) { seen = true; if (auto && !took) go(last, T0); } };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => {
        if (!card.isConnected) { io.disconnect(); return; }
        inView = es[es.length - 1].isIntersecting;
        if (inView) start();
        kick();
      }, { threshold: 0.3 });
      io.observe(card);
    } else { inView = true; start(); }
  });
