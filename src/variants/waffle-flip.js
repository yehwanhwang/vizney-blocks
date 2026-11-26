  // Waffle Flip: 와플 100칸(5줄 × 20칸)으로 비중을 그리고, 두 기간 사이에 바뀐 만큼의 칸을 한 칸씩 뒤집어 보여 줍니다.
  // 짚을 항목(focus, 비우면 첫 항목) 하나만 첫째 데이터 색이고, 나머지는 글자색을 옅게 깐 회색 단계입니다(적은 순서대로 진한 회색부터).
  // 칸은 짚을 항목부터 왼쪽 위에서 세로로 채웁니다(한 세로줄 5칸이 5%). 그래서 짚을 항목이 늘거나 줄면 그 덩어리의 끝에서 칸이 뒤집히고,
  // 뒤 기간을 보일 때 뒤집힌 칸 아래에 괄호와 바뀐 %p를 적습니다. 큰 숫자와 범례의 비중은 지금 보이는 칸 수를 그대로 세므로 칸이 뒤집힐 때마다 1%씩 바뀌고,
  // 뒤 기간이 다 그려지면 큰 숫자에 증감 배지와 '앞 기간 대비'가 붙습니다.
  // 칸은 기간마다 반올림한 합이 100이 되도록 나머지가 큰 항목부터 한 칸씩 더합니다. values의 원래 값(판매량 등)은 카드가 비중으로 바꾸고,
  // 툴팁과 표에는 원래 값과 소수 한 자리 비중을 함께 적습니다.
  // 기간 단추: 두 기간을 주면 머리 오른쪽 위에 두 기간을 오가는 단추를 둡니다. 누르거나 좌우 화살표로 고르면 바뀐 칸만 뒤집혀 그 기간이 됩니다.
  // 움직임: 화면에 보이면 앞 기간의 칸이 놓여 있다가 단추가 뒤 기간으로 옮겨 가며 바뀐 칸이 차례로 뒤집힙니다. 한 기간만 주면 단추 없이 그 기간의 칸만 그립니다.
  // 데이터가 바뀌어 다시 그릴 때(data-vzb-live)는 처음부터 재생하지 않고 고른 기간을 이어 가며, 화면에 있던 칸에서 달라진 칸만 차례로 뒤집혀 새 비중이 됩니다.
  // 큰 숫자와 범례는 뒤집히는 칸을 따라 1%씩 바뀌고, 증감 배지도 함께 바뀝니다. 가던 중에 값이 또 바뀌면 뒤집히던 칸은 하던 데서 이어 갑니다.
  // 항목의 이름이나 순서(짚을 항목)가 달라지면 칸의 색이 통째로 바뀌므로 뒤집지 않고 마지막 장면을 바로 그립니다.
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
    const cats = periods.map((_, p) => catsOf(p)), cats0 = cats[0], catsN = cats[last];
    const flips = cats0.map((c, i) => (c !== catsN[i] ? i : -1)).filter((i) => i >= 0);   // 바뀐 칸(짚을 항목의 끝부터, 번호 순서)
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
      bd.pp = focus.cells[last] - focus.cells[0];   // 배지가 적은 증감(옮겨 가는 동안 달라지면 다시 만듭니다)
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

    // 칸 100개와 괄호: 칸 하나는 가로 pw · 세로 ph의 자리에서 틈을 뺀 네모입니다(layout이 자리에 맞춰 정합니다).
    const cells = cats0.map((c, i) => {
      const r = svgEl('rect', { class: `vzb-wf-cell vzb-wf-c${c}` });
      r.cat = c;
      svg.append(r);
      return r;
    });
    const brace = svgEl('path', { class: 'vzb-wf-br' }), braceText = svgText(0, 0, ppText(diff, 0), 'vzb-wf-brt', 'start');
    svg.append(brace, braceText);
    let ROWS = 5, COLS = 20;   // 칸의 배열: 가로로 긴 20 × 5가 기본이고, 놓인 자리의 비율에 따라 layout이 고릅니다. 칸은 세로줄을 위에서 아래로 채웁니다
    const fx = (v) => v.toFixed(1), clamp = (v) => Math.max(0, Math.min(1, v));
    const fam = getComputedStyle(card).fontFamily;
    // 시간표(밀리초): 처음 앞 기간을 읽는 시간 · 칸 사이 간격(바뀐 칸이 많으면 짧게) · 한 칸이 뒤집히는 시간 · 괄호가 그어지는 시간
    const M = motion(card);   // 처음의 뜸(Lead) · 차례의 전체 시간(Seq) · 되풀이 전의 쉼(Rest)은 움직임 값에서 읽습니다
    const T0 = M.ms('lead'), K = flips.length, STAG = Math.max(28, Math.min(110, M.ms('seq') / Math.max(1, K))), FLIP = 300, OUT = 260;
    const order = new Map(flips.map((i, j) => [i, j]));
    const easeIn = (k) => k * k, spring = (k) => 1 + 2.2 * (k - 1) ** 3 + 1.2 * (k - 1) ** 2;
    // 지금 장면: from 기간에서 to 기간으로 가는 중(lead 동안은 from을 보이고, 그 뒤 바뀐 칸이 차례로 뒤집힘). 같으면 그 기간에 멈춰 있습니다.
    // 데이터가 바뀌어 다시 그린 카드는 카드 요소에 적어 둔 기간(data-vzb-period)을 이어 갑니다.
    const kept = periods.indexOf(card.getAttribute('data-vzb-period'));
    let from = kept >= 0 ? kept : last, to = from, lead = 0, t = 0;
    const endOf = () => lead + Math.max(0, K - 1) * STAG + (K ? FLIP : 0);
    const total = () => (from === to ? 0 : endOf() + (to === last && diff ? OUT + 240 : 160));
    const shownP = () => (from !== to && t < lead ? from : to);
    let pw = 0, ph = 0, cw = 0, W = 0;   // 칸 자리의 가로 · 세로, 칸의 폭
    // 옮겨 가기(데이터가 바뀌어 다시 그릴 때): 앞 카드가 넘긴 장면(칸마다 보이던 항목)에서 달라진 칸만 차례로 뒤집습니다. 칸마다 제 출발 시각(t0)을 가지며,
    // 가던 중에 값이 또 바뀌면 뒤집히던 칸은 하던 데서 이어 갑니다. 필터에 대한 답이라 차례의 시간은 짧게(모두 합쳐 0.45초 안) 둡니다.
    // 괄호(바뀐 %p)는 자리나 글자가 달라졌을 때만 칸이 다 뒤집힌 뒤 다시 긋고, 같으면 그대로 둡니다.
    let scene = before(card), moving = false, m0 = 0, mt = 0, mtEnd = 0, braceKeep = true, quiet = false, had = false, pp0 = null;
    // 증감 배지는 나타날 때 흐렸다 또렷해지는데, 이미 보이던 배지가 숫자만 바뀔 때는 그 등장 효과를 건너뜁니다(깜빡이지 않게).
    const calm = (n) => { if (n && n.getAnimations) n.getAnimations().forEach((a) => a.finish()); };
    const braceKey = (p) => (P > 1 && p === last && diff ? `${Math.min(focus.cells[0], focus.cells[last])}-${Math.max(focus.cells[0], focus.cells[last])}|${ppText(diff, 0)}` : '');
    function begin(prev) {
      if (!prev || !prev.inView || !Array.isArray(prev.cells) || prev.cells.length !== cells.length) return;
      if (!Array.isArray(prev.names) || prev.names.length !== items.length || prev.names.some((n, k) => n !== items[k].name)) return;
      // 시간은 실제 시계로 잽니다. 끄는 동안처럼 프레임마다 값이 바뀌면 카드가 그릴 틈 없이 갈아 끼워지는데, 그 사이 흐른 시간(lag)만큼 칸이 나아가 있어야 손을 따라옵니다.
      had = quiet = !!prev.badge;   // 배지가 보이고 있었는지: 아니었으면(처음 재생하던 중) 다 옮겨 간 뒤에 나타납니다
      pp0 = typeof prev.pp === 'number' ? prev.pp : null;
      const dst = cats[to], fresh = [], now = performance.now(), lag = Math.max(0, now - (prev.at || now));
      const fly = (r, src, D, k) => { r.mv = true; r.past = k >= 0.4; r.src = src; r.dst = D; r.t0 = -k * FLIP - lag; };
      cells.forEach((r, i) => {
        const q = prev.cells[i], D = dst[i], k = q.k;
        r.mv = false;
        if (k < 0.4) {
          if (D !== q.cat) fly(r, q.cat, D, k);          // 차례를 기다리거나 접히던 칸: 하던 데서 이어 새 항목으로 펴집니다
          else if (k > 0) fly(r, q.cat, D, k);           // 접히던 칸이 제 항목으로 돌아가야 하면: 마저 접혔다 같은 항목으로 펴집니다
        } else if (k < 1) {
          if (D === q.cat) fly(r, q.cat, D, k);          // 펴지던 칸: 그대로 마저 펴집니다
          else fly(r, q.cat, D, 0.4 * Math.sqrt(1 - Math.min(1, flipX(k))));   // 펴지던 칸이 또 바뀌면: 지금 폭에서 다시 접힙니다
        } else if (D !== q.cat) { r.mv = true; r.past = false; r.src = q.cat; r.dst = D; fresh.push(r); }   // 멈춰 있던 칸: 차례로 뒤집힙니다
      });
      const gap = Math.min(40, 450 / Math.max(1, fresh.length));
      fresh.forEach((r, j) => { r.t0 = j * gap; });
      const flying = cells.filter((r) => r.mv);
      braceKeep = prev.brace === braceKey(to);
      if (!flying.length && braceKeep) return;
      moving = true;
      m0 = now; mt = 0;
      mtEnd = flying.length ? Math.max(...flying.map((r) => r.t0)) + FLIP : 0;
      from = to; t = 0; playing = false; rest = 0;
    }
    const flipX = (k) => (k <= 0 || k >= 1 ? 1 : k < 0.4 ? 1 - easeIn(k / 0.4) : Math.max(0.02, spring((k - 0.4) / 0.6)));
    // 칸 크기: 놓인 자리를 다 채웁니다. 큰 숫자 아래 남은 폭과 높이를 칸 100개가 남김없이 나눠 쓰도록, 칸의 배열(25 × 4 · 20 × 5 · 10 × 10 · 5 × 20)과
    // 범례의 자리(칸 오른쪽에 세로로 · 칸 아래)를 고릅니다. 여덟 가지 가운데 칸이 정사각형에 가장 가깝고 빈자리가 적은 쪽입니다. 자리의 비율이 배열과 꼭 맞지 않으면
    // 칸은 조금 납작하거나 길쭉한 네모가 됩니다(정사각형만 쓰면 오른쪽이나 아래에 빈자리가 남습니다). 칸 하나가 1%인 것은 그대로입니다.
    function layout(fw) {
      if (per) hd.style.paddingRight = `${per.offsetWidth + 12}px`;   // 제목은 기간 단추 왼쪽까지
      // 놓인 자리가 주는 높이: 칸을 빼고(범례는 아래에 둔 채) 잰 카드 높이입니다. 단위 높이가 바닥이고, 자리가 더 높으면 그 높이입니다.
      foot.classList.remove('is-side');
      svg.setAttribute('width', 0);
      svg.setAttribute('height', 0);
      const cs = getComputedStyle(card), cr = card.getBoundingClientRect(), H = cr.height;
      const top = fig.getBoundingClientRect().bottom - cr.top;
      const pad = parseFloat(cs.paddingBottom) + parseFloat(cs.borderBottomWidth) + parseFloat(getComputedStyle(foot).paddingTop) + 22;   // 22: 괄호와 %p의 자리
      const sideW = Math.max(...items.map((it) => it.li.offsetWidth)) + 28, under = ctl.offsetHeight + 8;
      const room = (sd) => H - top - pad - (sd ? 0 : under) + 3;
      let best = null;
      for (const [r, c] of [[5, 20], [10, 10], [4, 25], [20, 5]]) for (const sd of [true, false]) {
        const w = (fw - (sd ? sideW : 0)) / c, h = room(sd) / r;
        if (w < 8 || h < 8) continue;
        // 정사각형에서 벗어난 정도에, 범례를 오른쪽에 둘 때 범례 아래로 비는 자리의 몫을 더해 견줍니다(빈자리가 크면 범례를 아래로 보냅니다).
        const off = Math.abs(Math.log(w / h)) + (sd ? (sideW * Math.max(0, room(true) - (items.length * 26 - 6))) / (fw * room(true)) : 0);
        if (!best || off < best.off - 0.02) best = { off, w, h, r, c, sd };
      }
      // 자리가 너무 낮아 어느 쪽도 들어가지 않으면(칸 8px 미만) 20 × 5를 폭에 맞춘 정사각형으로 두고 카드가 그만큼 길어집니다.
      if (!best) best = { w: fw / 20, h: Math.max(8, Math.min(fw / 20, room(false) / 5)), r: 5, c: 20, sd: false };
      const side = best.sd;
      ROWS = best.r; COLS = best.c; pw = best.w; ph = best.h;
      foot.classList.toggle('is-side', side);
      const gap = Math.min(pw, ph) >= 14 ? 3 : 2, w = side ? pw * COLS - gap : fw;
      W = w;
      cw = pw - gap;
      const h = ph * ROWS - gap + 22;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      // 칸의 모서리: --vzb-radius-mark(비우면 2px). 짧은 변의 1/4을 넘기지 않아, 큰 값을 적어도 칸이 점으로 읽히지 않습니다.
      const rc = Math.min(len(card, 'radius-mark', 2), Math.min(cw, ph - gap) / 4);
      cells.forEach((r, i) => {
        r.setAttribute('rx', rc);
        r.setAttribute('x', fx(Math.floor(i / ROWS) * pw));
        r.setAttribute('y', fx((i % ROWS) * ph));
        r.setAttribute('width', fx(cw));
        r.setAttribute('height', fx(ph - gap));
      });
      // 괄호: 짚을 항목에서 바뀐 칸이 든 세로줄들 아래. %p는 괄호 오른쪽, 자리가 모자라면 왼쪽에 적습니다.
      if (diff) {
        const a = Math.min(focus.cells[0], focus.cells[last]), b = Math.max(focus.cells[0], focus.cells[last]) - 1;
        const x1 = Math.floor(a / ROWS) * pw, x2 = Math.floor(b / ROWS) * pw + cw, y = ph * ROWS - gap + 7;
        brace.setAttribute('d', `M${fx(x1)},${fx(y - 4)}V${fx(y)}H${fx(x2)}V${fx(y - 4)}`);
        brace.len = (x2 - x1) + 8;
        brace.setAttribute('stroke-dasharray', fx(brace.len));
        const tw = textW(braceText.textContent, 700, fam, 14) + 6, right = x2 + tw <= w;
        braceText.setAttribute('text-anchor', right ? 'start' : 'end');
        braceText.setAttribute('x', fx(right ? x2 + 6 : x1 - 6));
        braceText.setAttribute('y', fx(y + 4));
      }
      placePill();
      if (scene) { begin(scene); scene = null; kick(); }
      render();
      if (quiet) { quiet = false; calm(bd); calm(vs); }
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
      if (moving) mt = performance.now() - m0;
      const turning = from !== to, src = cats[from], dst = cats[to], rev = to < from, cnt = items.map(() => 0);
      let due = 0, turned = 0;   // 옮겨 가기: 이번에 뒤집힐 칸 수와 그 가운데 이미 넘어간 칸 수
      cells.forEach((r, i) => {
        const j0 = order.get(i);
        let cat = dst[i], sx = 1;
        if (moving) {
          // 옮겨 가기: 달라진 칸만 제 출발 시각부터 뒤집힙니다.
          if (r.mv) { const k = clamp((mt - r.t0) / FLIP); cat = k >= 0.4 ? r.dst : r.src; sx = flipX(k); if (!r.past) { due++; if (k >= 0.4) turned++; } }
        } else if (turning && j0 != null) {
          // 앞으로 갈 때는 번호 순서, 되돌아갈 때는 거꾸로(마지막에 뒤집힌 칸부터) 뒤집습니다.
          const k = clamp((t - lead - (rev ? K - 1 - j0 : j0) * STAG) / FLIP);
          cat = k >= 0.4 ? dst[i] : src[i];
          sx = flipX(k);
        }
        cnt[cat]++;
        if (r.cat !== cat) { r.classList.replace(`vzb-wf-c${r.cat}`, `vzb-wf-c${cat}`); r.cat = cat; }
        const cx = Math.floor(i / ROWS) * pw + cw / 2;
        r.setAttribute('transform', sx === 1 ? '' : `matrix(${sx.toFixed(3)} 0 0 1 ${fx(cx * (1 - sx))} 0)`);
      });
      // 큰 숫자와 범례는 지금 보이는 칸 수 그대로입니다.
      nowText.nodeValue = num(cnt[0], 0);
      items.forEach((it) => { const v = pctText(cnt[it.k], 0); if (it.val.textContent !== v) it.val.textContent = v; });
      setPill(shownP());
      const atLast = P > 1 && to === last;
      // 옮겨 가는 동안: 괄호는 그대로 두거나(자리와 글자가 같을 때) 칸이 다 뒤집힌 뒤 다시 긋고, 증감 배지는 보이던 증감에서 새 증감으로, 칸이 뒤집힌 만큼 함께 갑니다.
      const end = moving ? mtEnd : endOf(), clock = moving ? mt : t, busy = moving ? !braceKeep : turning, done = moving || !turning || t >= end;
      const kb = atLast && diff ? (busy ? clamp((clock - end) / OUT) : 1) : 0;
      brace.setAttribute('stroke-dashoffset', fx((brace.len || 0) * (1 - kb)));
      brace.style.opacity = kb > 0 ? 1 : 0;
      braceText.style.opacity = atLast && diff ? (busy ? fx(clamp((clock - end - OUT * 0.5) / (OUT * 0.5))) : 1) : 0;
      if (bd) {
        const show = atLast && done && (!moving || had), full = focus.cells[last] - focus.cells[0];
        const pp = moving && pp0 != null && due ? Math.round(pp0 + (full - pp0) * (turned / due)) : full;
        if (bd.pp !== pp) { const nb = badge(pct, focus.cells[0] + pp, focus.cells[0], d.better); nb.classList.add('vzb-wf-in'); nb.pp = pp; bd.replaceWith(nb); bd = nb; if (moving) calm(nb); }
        bd.hidden = !show; vs.hidden = !show;
      }
    }
    // 지금 화면의 장면: 데이터가 바뀌어 카드를 갈아 끼울 때 새 카드에 넘깁니다(칸마다 보이는 항목과, 뒤집히는 중이면 어디까지 뒤집혔는지).
    keep(card, () => {
      if (!W) return scene;
      const c = moving ? performance.now() - m0 : 0;
      return {
        at: performance.now(), inView, badge: !!bd && !bd.hidden, pp: bd ? bd.pp : null, names: items.map((it) => it.name), brace: (moving && !braceKeep && c < mtEnd + OUT) || from !== to ? '' : braceKey(shownP()),   // 괄호가 아직 그어지지 않았으면 비워, 새 카드가 칸이 다 뒤집힌 뒤에 긋게 합니다
        cells: cells.map((r) => {
          if (!moving || !r.mv) return { cat: r.cat, k: 1 };
          const k = Math.min(1, (c - r.t0) / FLIP);   // 아직 차례가 오지 않은 칸은 0보다 작습니다
          return { cat: k >= 0.4 ? r.dst : r.src, k };
        }),
      };
    });

    // 재생: 화면에 보이고(inView) 마우스 · 포커스로 잠시 멈추지 않았을 때(holds)만 움직입니다. 카드가 페이지에서 빠지면 멈춥니다.
    const live = card.hasAttribute('data-vzb-live');   // 데이터가 바뀌어 다시 그린 카드: 처음부터 재생하지 않습니다
    const loop = !!card.closest('[data-vzb-loop]');
    const holds = new Set();
    let playing = false, seen = false, inView = false, rest = 0, lastStamp = 0, raf = 0, took = false;
    // 옮겨 가기는 데이터가 바뀐 데 대한 답이라, 마우스가 올라가 있어도 끝까지 갑니다.
    const on = () => card.isConnected && inView && (moving || (playing && !holds.size));
    function tick(stamp) {
      raf = 0;
      if (!on()) { lastStamp = 0; return; }
      const dt = lastStamp ? Math.min(100, stamp - lastStamp) : 16;
      lastStamp = stamp;
      if (moving) { mt = performance.now() - m0; if (mt >= mtEnd + (braceKeep ? 0 : OUT + 60)) moving = false; }
      else if (rest > 0) { rest -= dt; if (rest <= 0) go(to === last ? 0 : last, 0); }   // 갤러리: 잠시 쉬고 다른 기간으로
      else {
        t = Math.min(total(), t + dt);
        if (t >= total()) { from = to; t = 0; if (loop && !took) rest = M.ms('rest'); else playing = false; }
      }
      render();
      if (on()) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf && on()) raf = requestAnimationFrame(tick); }
    // 기간 p로 갑니다. 다른 기간으로 가는 중에 되돌리면, 이미 뒤집힌 칸부터 거꾸로 되짚습니다.
    function go(p, wait) {
      moving = false;   // 옮겨 가던 중에 기간을 바꾸면 새 값의 장면에서 기간을 넘깁니다
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
        const r = svg.getBoundingClientRect(), col = Math.floor((cx - r.left) / pw), row = Math.floor((cy - r.top) / ph);
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
        return { x: r.left + (leftHalf ? c1 * pw : c0 * pw), y: r.top + (ROWS * ph) / 2, side: leftHalf ? 'right' : 'left', label: it.name, value: tb.node, text: tb.text };
      },
      () => { svg.classList.remove('is-hover'); legend.classList.remove('is-hover'); items.forEach((x) => x.li.classList.remove('is-on')); cells.forEach((c) => c.classList.remove('is-on')); },
      false, true);

    // 처음 장면: 재생할 카드는 앞 기간에 멈춰 기다리고, 아니면(다시 그림 · 한 기간) 고른 기간 또는 뒤 기간입니다.
    const auto = !live && P > 1;
    if (auto) from = to = 0;
    if (scene) inView = !!scene.inView;   // 앞 카드가 화면에 보이고 있었으면 바로 움직입니다
    onSize(foot, layout);
    onSize(card, () => { if (foot.clientWidth) layout(foot.clientWidth); });   // 놓인 자리의 높이가 바뀌어도 칸을 다시 맞춥니다
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (W) layout(foot.clientWidth); });
    // 화면에 처음 보일 때 움직입니다. 화면 밖에 있는 동안은 멈춰 둡니다.
    const start = () => { if (!seen) { seen = true; if (auto && !took) go(last, T0); } };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => {
        if (!card.isConnected) { io.disconnect(); return; }
        inView = es[es.length - 1].isIntersecting;
        if (!inView && moving) { moving = false; render(); }   // 화면 밖에서는 다 옮겨 간 장면으로 둡니다
        if (inView) start();
        kick();
      }, { threshold: 0.3 });
      io.observe(card);
    } else { inView = true; start(); }
  });
