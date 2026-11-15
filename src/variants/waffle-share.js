  // Share Waffle: 와플 100칸(5줄 × 20칸)으로 비중을 그리고, 앞 기간에서 뒤 기간으로 바뀐 만큼의 칸을 한 칸씩 뒤집어 보여 줍니다.
  // 짚을 항목(focus, 비우면 첫 항목) 하나만 첫째 데이터 색이고, 나머지는 글자색을 옅게 깐 회색 단계입니다(적은 순서대로 진한 회색부터).
  // 칸은 짚을 항목부터 왼쪽 위에서 세로로 채웁니다(한 세로줄 5칸이 5%). 그래서 짚을 항목이 늘거나 줄면 그 덩어리의 끝에서 칸이 뒤집히고,
  // 뒤집힌 칸 아래에 괄호와 바뀐 %p를 적습니다. 위의 큰 숫자는 칸이 뒤집힐 때마다 1%씩 세어 가고, 다 뒤집히면 증감 배지와 '앞 기간 대비'가 붙습니다.
  // 칸은 기간마다 반올림한 합이 100이 되도록 나머지가 큰 항목부터 한 칸씩 더합니다. values의 원래 값(판매량 등)은 카드가 비중으로 바꾸고,
  // 툴팁과 표에는 원래 값과 소수 한 자리 비중을 함께 적습니다.
  // 움직임: 화면에 보이면 앞 기간의 칸이 놓여 있다가 바뀐 칸만 차례로 뒤집힙니다. 한 기간만 주면 뒤집지 않고 그 기간의 칸만 그립니다.
  // 다시 보기 단추로 되풀이하고, 동작 줄이기 설정이거나 데이터가 바뀌어 다시 그릴 때(data-vzb-live)는 마지막 장면을 바로 그립니다.
  // 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 끝에서 잠시 쉬고 되풀이합니다.
  mount('waffle-share', (card, d, f) => {
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
    const before = catsOf(0), after = catsOf(last);
    const flips = before.map((c, i) => (c !== after[i] ? i : -1)).filter((i) => i >= 0);   // 바뀐 칸(짚을 항목의 끝부터, 번호 순서)
    const pct = format({ format: 'pct', decimals: 0 }, d);
    const ppText = (v, k) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${tx(d, '%s%p', num(Math.abs(v), k))}`;
    const pctText = (v, k) => `${num(v, k)}%`;

    head(card, d, f, null);
    // 큰 숫자: 짚을 항목의 비중. 처음에는 앞 기간 값과 그 기간 이름, 뒤집는 동안은 세어 가는 숫자만, 다 뒤집히면 증감 배지와 '앞 기간 대비'.
    const fig = el('div', 'vzb-fig vzb-wf-fig'), numEl = figure(pct, focus.cells[0]), nowText = numEl.firstChild;
    const pl = el('span', 'vzb-vs vzb-wf-pl', periods[0]);
    fig.append(numEl, pl);
    let bd = null, vs = null;
    if (P > 1) {
      bd = badge(pct, focus.cells[last], focus.cells[0], d.better);
      vs = el('span', 'vzb-vs', tx(d, '%s 대비', periods[0]));
      bd.classList.add('vzb-wf-in');
      vs.classList.add('vzb-wf-in');
      fig.append(bd, vs);
    }
    card.append(fig);
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
    const ctl = el('div', 'vzb-wf-ctl'), btn = el('button', 'vzb-wf-btn'), legend = el('ul', 'vzb-wf-legend');
    btn.type = 'button';
    btn.setAttribute('aria-label', tx(d, '처음부터 다시'));
    const ic = svgEl('svg', { class: 'vzb-wf-ic', viewBox: '0 0 16 16', 'aria-hidden': 'true' });
    ic.append(svgEl('path', { d: 'M3.7 9a4.4 4.4 0 1 0 1.2-4.2' }), svgEl('path', { d: 'M4.6 2.6v2.6h2.6' }));
    btn.append(ic);
    legend.setAttribute('aria-hidden', 'true');
    items.forEach((it) => {
      it.li = el('li');
      it.val = el('b', null, pctText(it.cells[0], 0));
      it.li.append(el('i', `vzb-wf-key vzb-wf-c${it.k}`), el('span', null, it.name), it.val);
      legend.append(it.li);
    });
    ctl.append(btn, legend);
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
    sr.append(table);
    card.append(sr);

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
    // 시간표(밀리초): 앞 기간을 읽는 처음 · 칸 사이 간격(바뀐 칸이 많으면 짧게) · 한 칸이 뒤집히는 시간 · 괄호와 배지가 나오는 시간
    const T0 = 700, K = flips.length, STAG = Math.max(28, Math.min(110, 1100 / Math.max(1, K))), FLIP = 300, OUT = 260;
    const END = T0 + Math.max(0, K - 1) * STAG + (K ? FLIP : 0), TOTAL = P > 1 ? END + OUT + 240 : 0;
    const order = new Map(flips.map((i, j) => [i, j]));
    const easeIn = (k) => k * k, back = (k) => 1 + 2.2 * (k - 1) ** 3 + 1.2 * (k - 1) ** 2;
    let pitch = 0, cell = 0, W = 0, t = 0, stage = null;
    function layout(w) {
      W = w;
      pitch = Math.max(8, Math.min(18, w / COLS));
      const gap = pitch >= 14 ? 3 : 2;
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
        const tw = textW(braceText.textContent, 700, fam, 11) + 6, right = x2 + tw <= w;
        braceText.setAttribute('text-anchor', right ? 'start' : 'end');
        braceText.setAttribute('x', fx(right ? x2 + 6 : x1 - 6));
        braceText.setAttribute('y', fx(y + 4));
      }
      render();
    }
    // 단계: start(앞 기간을 읽는 처음) · flip(뒤집는 중) · end(뒤 기간). 범례의 비중과 큰 숫자 옆 글자를 바꾸고, 움직이는 중에만 흐려지며 바뀝니다.
    function phase(next, soft) {
      if (stage === next) return;
      stage = next;
      const end = next === 'end', p = end ? last : 0;
      items.forEach((it) => {
        const v = pctText(it.cells[p], 0);
        if (it.val.textContent === v) return;
        it.val.textContent = v;
        if (soft) { it.val.classList.remove('is-swap'); void it.val.offsetWidth; it.val.classList.add('is-swap'); }
      });
      pl.hidden = P > 1 && next !== 'start';
      if (bd) { bd.hidden = !end; vs.hidden = !end; }
    }
    function render() {
      if (!W) return;
      let shown = focus.cells[0];
      cells.forEach((r, i) => {
        const j = order.get(i);
        let cat = before[i], sx = 1;
        if (j != null && P > 1) {
          const k = clamp((t - T0 - j * STAG) / FLIP);
          if (k >= 0.4) cat = after[i];
          sx = k <= 0 || k >= 1 ? 1 : k < 0.4 ? 1 - easeIn(k / 0.4) : Math.max(0.02, back((k - 0.4) / 0.6));
          if (k >= 0.4 && (before[i] === 0 || after[i] === 0)) shown += after[i] === 0 ? 1 : -1;
        }
        if (r.cat !== cat) { r.classList.replace(`vzb-wf-c${r.cat}`, `vzb-wf-c${cat}`); r.cat = cat; }
        const cx = Math.floor(i / ROWS) * pitch + cell / 2;
        r.setAttribute('transform', sx === 1 ? '' : `matrix(${sx.toFixed(3)} 0 0 1 ${fx(cx * (1 - sx))} 0)`);
      });
      nowText.nodeValue = num(shown, 0);
      const k = P > 1 && diff ? clamp((t - END) / OUT) : 0;
      brace.setAttribute('stroke-dashoffset', fx((brace.len || 0) * (1 - k)));
      brace.style.opacity = k > 0 ? 1 : 0;
      braceText.style.opacity = diff && P > 1 ? fx(clamp((t - END - OUT * 0.5) / (OUT * 0.5))) : 0;
      phase(P < 2 || t >= END ? 'end' : t < T0 ? 'start' : 'flip', playing && !holds.size);
    }

    // 재생: 화면에 보이고(inView) 마우스 · 포커스로 잠시 멈추지 않았을 때(holds)만 움직입니다. 카드가 페이지에서 빠지면 멈춥니다.
    const still = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const live = card.hasAttribute('data-vzb-live');   // 데이터가 바뀌어 다시 그린 카드: 처음부터 재생하지 않습니다
    const loop = !!card.closest('[data-vzb-loop]');
    const holds = new Set();
    let playing = false, seen = false, inView = false, rest = 0, lastStamp = 0, raf = 0;
    const on = () => playing && inView && !holds.size && card.isConnected;
    function tick(stamp) {
      raf = 0;
      if (!on()) { lastStamp = 0; return; }
      const dt = lastStamp ? Math.min(100, stamp - lastStamp) : 16;
      lastStamp = stamp;
      if (rest > 0) { rest -= dt; if (rest <= 0) t = 0; }
      else {
        t = Math.min(TOTAL, t + dt);
        if (t >= TOTAL) { if (loop) rest = 2600; else playing = false; }
      }
      render();
      if (on()) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf && on()) raf = requestAnimationFrame(tick); }
    function play() { t = 0; rest = 0; lastStamp = 0; playing = true; render(); kick(); }
    btn.addEventListener('click', play);
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
        const cols = mine.map(([, i]) => Math.floor(i / ROWS)), mid = cols.length ? (Math.min(...cols) + Math.max(...cols) + 1) / 2 : 0;
        const note = [show(f, it.vals[last])];
        if (P > 1) note.push(`${ppText(it.share[last] - it.share[0], 1)} ${tx(d, '%s 대비', periods[0])}`);
        const tb = tipBody({ value: pctText(it.share[last], 1), note }, it.name);
        return { x: r.left + mid * pitch, y: r.top - 6, label: it.name, value: tb.node, text: tb.text };
      },
      () => { svg.classList.remove('is-hover'); legend.classList.remove('is-hover'); items.forEach((x) => x.li.classList.remove('is-on')); cells.forEach((c) => c.classList.remove('is-on')); },
      false, true);

    btn.hidden = still || P < 2;
    if (still || live || P < 2) t = 1e9;   // 마지막 장면에서 시작합니다
    onSize(plot, layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (W) layout(W); });
    // 화면에 처음 보일 때 움직입니다. 화면 밖에 있는 동안은 멈춰 둡니다.
    const start = () => { if (!seen) { seen = true; if (!still && !live && P > 1) play(); } };
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
