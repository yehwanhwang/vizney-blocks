  // Waterfall Walk: 시작 값(start)에서 출발해 요인(labels)마다의 증감(values)을 앞 막대가 끝난 높이에 이어 붙이고, 끝 값은 카드가 계산해 끝 막대로 세웁니다.
  // 시작과 끝 막대는 바닥(0)에서 서는 회색(--vzb-base)입니다. 요인 막대는 결과를 좋게 만든 쪽이 초록(--vzb-good), 나쁘게 만든 쪽이 빨강(--vzb-bad)이고
  // (better: up · down), neutral이면 모두 첫째 데이터 색입니다. 막대 사이는 이어지는 높이를 가는 선으로 잇습니다.
  // 요인 값은 늘린 막대 위 · 줄인 막대 아래에 부호와 함께 적고, 이웃 값과 겹치면 작은 값부터 생략합니다(툴팁과 표에는 남습니다).
  // 이름이 칸보다 길면 두 줄로 엇갈려 적고, 그래도 길면 줄여 적습니다. 큰 숫자는 끝 값, 증감 배지는 시작 값 대비입니다.
  // 움직임: 시작 막대와 큰 숫자가 놓여 있다가, 요인이 왼쪽부터 하나씩 이어진 선을 따라 걸어가 그 높이에서 오르내립니다. 큰 숫자는 보이는 높이를 그대로 셉니다.
  // 마지막 요인 뒤에는 도착한 높이가 끝 막대로 쏟아져 바닥까지 차고, 증감 배지가 붙은 뒤 멈춥니다.
  // 카드가 화면에 보이면 한 번 움직이고, 다시 보기 단추로 되풀이합니다. 데이터가 바뀌어 다시 그릴 때(data-vzb-live)는 마지막 장면을 바로 그립니다.
  // 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 끝에서 잠시 쉬고 되풀이합니다.
  mount('waterfall-walk', (card, d, f) => {
    // 걸러서 남은 요인이 없을 때(labels가 빈 배열)는 오류가 아니라 빈 화면입니다.
    if (Array.isArray(d.labels) && !d.labels.length) {
      head(card, d, f, null);
      card.append(el('p', 'vzb-ww-none', tx(d, '표시할 항목이 없습니다.')));
      return;
    }
    const labels = Array.isArray(d.labels) ? d.labels.map(String) : [], raw = Array.isArray(d.values) ? d.values : [];
    if (!labels.length || raw.length !== labels.length) throw new Error(tx(d, 'labels와 values를 확인하세요.'));
    if (!fin(d.start)) throw new Error(tx(d, 'start에 시작 값을 숫자로 적으세요.'));
    const v0 = +d.start, want = d.better === 'down' ? -1 : d.better === 'neutral' ? 0 : 1;
    const given = (s) => s != null && s !== '';
    const startName = given(d.startLabel) ? String(d.startLabel) : tx(d, '시작'), endName = given(d.endLabel) ? String(d.endLabel) : tx(d, '끝');
    // 막대: 시작 · 요인들 · 끝. 요인은 앞 막대가 끝난 높이(from)에서 출발해 증감만큼 오르내립니다(to). 값이 null인 요인은 높이를 그대로 넘깁니다.
    let level = v0;
    const steps = labels.map((name, i) => {
      const v = fin(raw[i]) ? +raw[i] : null, from = level;
      if (v != null) level += v;
      return { kind: 'step', name, v, from, to: level };
    });
    const v1 = level;
    const cols = [{ kind: 'start', name: startName, v: v0, from: 0, to: v0 }, ...steps, { kind: 'end', name: endName, v: v1, from: 0, to: v1 }];
    const N = cols.length, S = steps.length;
    cols.forEach((c, k) => {
      c.k = k;
      c.bar = c.v != null && c.v !== 0;
      c.tone = c.kind !== 'step' ? 'total' : !c.bar ? 'none' : want === 0 ? 'plain' : Math.sign(c.v) === want ? 'good' : 'bad';
    });

    const live = card.hasAttribute('data-vzb-live');   // 데이터가 바뀌어 다시 그린 카드: 처음부터 재생하지 않고 마지막 장면을 그립니다
    head(card, d, f, null);
    const hd = card.querySelector('.vzb-hd');
    // 큰 숫자: 끝 값. 움직이는 동안은 지금 보이는 높이를 그대로 세고, 끝 막대가 다 차면 증감 배지와 '시작 대비'가 붙습니다.
    // 시작 값이 0 이하이면 비율이 뜻을 잃으므로 배지에 차이를 적습니다.
    const fig = el('div', 'vzb-fig vzb-ww-fig'), numEl = figure(f, live ? v1 : v0), nowText = numEl.firstChild;
    let unitEl = numEl.querySelector('.vzb-unit');
    const bd = badge(f, v1, v0, d.better), vs = el('span', 'vzb-vs', tx(d, '%s 대비', startName));
    if (!(v0 > 0)) bd.lastChild.textContent = show(f, Math.abs(v1 - v0));
    bd.hidden = vs.hidden = !live;
    fig.append(numEl, bd, vs);
    card.append(fig);
    const btn = el('button', 'vzb-ww-btn');
    btn.type = 'button';
    btn.setAttribute('aria-label', tx(d, '처음부터 다시'));
    const ic = svgEl('svg', { class: 'vzb-ww-ic', viewBox: '0 0 16 16', 'aria-hidden': 'true' });
    ic.append(svgEl('path', { d: 'M3.7 9a4.4 4.4 0 1 0 1.2-4.2' }), svgEl('path', { d: 'M4.6 2.6v2.6h2.6' }));
    btn.append(ic);
    hd.append(btn);   // 다시 보기 단추는 머리의 오른쪽 위
    const foot = el('div', 'vzb-foot vzb-fill vzb-ww');
    const plot = el('div', 'vzb-plot');
    plot.tabIndex = 0;
    plot.setAttribute('role', 'img');
    plot.setAttribute('aria-label', tx(d, '%1. %2 %3 → %4 %5, %6. 좌우 화살표로 항목을 옮깁니다. 모든 값은 이어지는 표에 있습니다.', d.title || '', startName, show(f, v0), endName, show(f, v1), signed(f, v1 - v0)));
    const svg = svgEl('svg', { class: 'vzb-ww-svg', 'aria-hidden': 'true' });
    plot.append(svg);
    foot.append(plot);
    card.append(foot);
    // 화면 낭독기용 표: 이름 · 값(요인은 증감) · 누계
    const sr = el('div', 'vzb-sr'), table = el('table'), hr = el('tr');
    hr.append(...[tx(d, '이름'), tx(d, '값'), tx(d, '누계')].map((k) => el('th', null, k)));
    table.append(el('caption', null, d.title || ''), hr);
    const valText = (c) => (c.kind !== 'step' ? show(f, c.v) : c.v == null ? tx(d, '데이터 없음') : signed(f, c.v));
    cols.forEach((c) => { const tr = el('tr'); tr.append(el('th', null, c.name), el('td', null, valText(c)), el('td', null, show(f, c.to))); table.append(tr); });
    sr.append(table);
    card.append(sr);

    // 그림: 바닥선(0) · 잇는 선 · 막대 · 값 · 이름. 잇는 선은 막대 아래에 두어 막대 끝에서 자연스럽게 이어지게 합니다.
    const base = svgEl('line', { class: 'vzb-ww-base' }), connG = svgEl('g', { class: 'vzb-ww-conns' }), barsG = svgEl('g', {});
    cols.forEach((c) => {
      c.g = svgEl('g', { class: `vzb-ww-col is-${c.tone}` });
      c.path = svgEl('path', { class: 'vzb-ww-bar' });
      c.val = svgText(0, 0, valText(c), 'vzb-ww-val', 'middle');
      c.nm = svgText(0, 0, c.name, 'vzb-ww-name', 'middle');
      c.g.append(c.path, c.val, c.nm);
      barsG.append(c.g);
      if (c.k < N - 1) { c.conn = svgEl('line', { class: 'vzb-ww-conn' }); connG.append(c.conn); }
    });
    svg.append(base, connG, barsG);
    const fam = getComputedStyle(card).fontFamily, fx = (v) => v.toFixed(1), clamp = (v) => Math.max(0, Math.min(1, v));
    // 세로 막대: yA는 출발하는 끝(바닥이나 앞 막대의 높이, 각지게), yB는 도착하는 끝(4px 둥글게)입니다. 올라가면 위가, 내려가면 아래가 둥급니다.
    const barPath = (x, yA, yB, w) => {
      const h = Math.abs(yB - yA);
      if (h < 0.5) return '';
      const r = Math.min(4, w / 2, h), up = yB < yA;
      return up
        ? `M${fx(x)},${fx(yA)}V${fx(yB + r)}A${r},${r} 0 0 1 ${fx(x + r)},${fx(yB)}H${fx(x + w - r)}A${r},${r} 0 0 1 ${fx(x + w)},${fx(yB + r)}V${fx(yA)}Z`
        : `M${fx(x)},${fx(yA)}V${fx(yB - r)}A${r},${r} 0 0 0 ${fx(x + r)},${fx(yB)}H${fx(x + w - r)}A${r},${r} 0 0 0 ${fx(x + w)},${fx(yB - r)}V${fx(yA)}Z`;
    };
    // 이름을 maxW 안에 줄여 적습니다(끝에 …). 툴팁과 표에는 온전한 이름이 있습니다.
    const fit = (s, maxW) => {
      if (textW(s, 400, fam, 11) <= maxW) return s;
      let lo = 0, hi = s.length;
      while (lo < hi) { const m = (lo + hi + 1) >> 1; if (textW(`${s.slice(0, m)}…`, 400, fam, 11) <= maxW) lo = m; else hi = m - 1; }
      return `${s.slice(0, Math.max(1, lo))}…`;
    };
    // 시간표(밀리초): 시작 막대를 읽는 시간 · 요인 사이 간격 · 잇는 선이 다음 칸으로 걸어가는 시간 · 막대가 오르내리는 시간 · 끝 막대가 쏟아지는 시간 · 배지가 붙는 시간
    const T0 = 520, STEP = Math.max(260, Math.min(450, 2700 / Math.max(1, S))), CONN = 200, LAG = 160, GROW = 340, POUR = 560, BADGE = 240;
    const easeOut = (k) => 1 - (1 - k) ** 3, easeInOut = (k) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2);
    cols.forEach((c) => {
      c.at = c.kind === 'start' ? -1e9 : c.kind === 'step' ? T0 + (c.k - 1) * STEP : T0 + S * STEP + 60;   // 앞 칸에서 이 칸으로 걸어오기 시작하는 때
      c.dur = c.kind === 'end' ? POUR : GROW;
      c.done = c.at + LAG + c.dur;
    });
    const DONE = cols[N - 1].done, TOTAL = DONE + 60 + BADGE;
    let W = 0, H = 0, y = (v) => v, slot = 1, bw = 0, t = 0;
    function layout(w, h) {
      W = w; H = h;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      slot = w / N;
      bw = Math.max(4, Math.min(30, slot * 0.62));
      // 이름: 한 줄에 다 들어가면 한 줄, 아니면 두 줄로 엇갈려(이웃 칸까지 써서) 적고, 그래도 넘치면 줄여 적습니다.
      const nameW = Math.max(...cols.map((c) => textW(c.name, c.kind === 'step' ? 400 : 500, fam, 11))) + 6;
      const two = nameW > slot, NAMEH = two ? 36 : 22, room = (two ? 2 * slot : slot) - 6;
      // 높이: 0과 모든 막대의 높이가 들어가게 하고, 위아래에 값을 적을 자리를 남깁니다.
      const lvls = [0, ...cols.flatMap((c) => [c.from, c.to])], lo = Math.min(...lvls), hi = Math.max(...lvls), span = hi - lo || 1;
      // 아래쪽 자리는 내려간 막대의 값이나 0 아래의 합계가 이름 줄에 닿을 때만 남깁니다.
      const PADT = 16, yb = h - NAMEH, scale = (padb) => Math.max(1, yb - PADT - padb) / span;
      const s0 = scale(0), low = cols.some((c) => c.bar && c.to < c.from && PADT + (hi - c.to) * s0 + 17 > yb);
      const s = scale(low || lo < 0 ? 16 : 0);
      y = (v) => PADT + (hi - v) * s;
      const y0 = y(0);
      base.setAttribute('x1', 0);
      base.setAttribute('x2', w);
      base.setAttribute('y1', fx(Math.round(y0) + 0.5));
      base.setAttribute('y2', fx(Math.round(y0) + 0.5));
      cols.forEach((c) => {
        c.cx = slot * (c.k + 0.5);
        c.x = c.cx - bw / 2;
        c.yA = y(c.from);
        c.yB = y(c.to);
        c.nm.textContent = fit(c.name, room);
        c.nm.setAttribute('x', fx(c.cx));
        c.nm.setAttribute('y', fx(yb + 15 + (two && c.k % 2 ? 14 : 0)));
        // 값: 올라간 막대(와 바닥 위의 합계)는 위 끝 위에, 내려간 막대는 아래 끝 아래에 적습니다.
        const down = c.to < c.from, tw = textW(c.val.textContent, c.kind === 'step' ? 500 : 700, fam, 11) + 4;
        c.vy = down ? c.yB + 13 : c.yB - 5;
        c.vx = Math.max(tw / 2, Math.min(w - tw / 2, c.cx));
        c.box = [c.vx - tw / 2, c.vx + tw / 2, down ? c.yB + 2 : c.yB - 15, down ? c.yB + 15 : c.yB - 2];
        c.val.setAttribute('x', fx(c.vx));
        c.val.setAttribute('y', fx(c.vy));
      });
      // 겹치는 값은 합계부터, 그다음 큰 증감부터 자리를 차지하고 나머지는 생략합니다.
      const placed = [];
      [...cols].sort((a, b) => (a.kind === 'step') - (b.kind === 'step') || Math.abs(b.v || 0) - Math.abs(a.v || 0)).forEach((c) => {
        c.valOn = c.kind !== 'step' || c.v != null;
        if (!c.valOn) return;
        const [l, r, tp, bt] = c.box;
        if (placed.some(([l2, r2, t2, b2]) => l < r2 && r > l2 && tp < b2 && bt > t2)) { c.valOn = false; return; }
        placed.push(c.box);
      });
      // 잇는 선: 이 막대가 끝난 높이에서 다음 막대의 출발점까지. 다음 칸에 막대가 없으면(값이 0이거나 null) 그 칸을 지나 끝까지 잇습니다.
      cols.forEach((c) => {
        if (!c.conn) return;
        const nx = cols[c.k + 1];
        c.cx1 = c.x + bw;
        c.cx2 = nx.bar ? nx.x : nx.x + bw;
        c.cy = Math.round(c.yB) + 0.5;
      });
      render();
    }
    // 지금 보이는 높이(큰 숫자): 출발한 요인 가운데 마지막 요인이 지금 닿은 높이입니다. 끝 막대가 쏟아지는 동안은 도착한 높이 그대로입니다.
    function shown() {
      let v = v0;
      steps.forEach((c) => { if (c.v != null && t >= c.at + LAG) v = c.from + c.v * easeOut(clamp((t - c.at - LAG) / c.dur)); });
      return v;
    }
    let badgeOn = live;
    function render() {
      if (!W) return;
      cols.forEach((c) => {
        const g = c.kind === 'start' ? 1 : clamp((t - c.at - LAG) / c.dur), e = c.kind === 'end' ? easeInOut(g) : easeOut(g);
        // 끝 막대는 도착한 높이(위 끝)에 붙은 채 아래로 바닥까지 쏟아집니다. 요인 막대는 출발한 높이에서 도착하는 쪽으로 자랍니다.
        c.path.setAttribute('d', !c.bar ? '' : c.kind === 'end' ? barPath(c.x, c.yB + (c.yA - c.yB) * e, c.yB, bw) : barPath(c.x, c.yA, c.yA + (c.yB - c.yA) * e, bw));
        c.val.setAttribute('opacity', c.valOn ? fx(c.kind === 'start' ? 1 : clamp((t - c.done + 120) / 200)) : 0);
        if (c.conn) {
          const nx = cols[c.k + 1], p = easeOut(clamp((t - nx.at) / CONN));
          c.conn.setAttribute('x1', fx(c.cx1));
          c.conn.setAttribute('x2', fx(c.cx1 + (c.cx2 - c.cx1) * p));
          c.conn.setAttribute('y1', c.cy);
          c.conn.setAttribute('y2', c.cy);
          c.conn.setAttribute('opacity', p > 0 ? 1 : 0);
        }
      });
      const [txt, unit] = f.parts(t >= DONE ? v1 : shown());
      nowText.data = txt;
      if (unit && !unitEl) { unitEl = el('span', 'vzb-unit'); numEl.append(unitEl); }
      if (unitEl) unitEl.textContent = unit || '';
      const ready = t >= DONE + 60;
      if (ready !== badgeOn) {
        badgeOn = ready;
        bd.hidden = vs.hidden = !ready;
        bd.classList.toggle('vzb-ww-in', ready);
        vs.classList.toggle('vzb-ww-in', ready);
      }
    }

    // 재생: 화면에 보이고(inView) 마우스 · 포커스로 잠시 멈추지 않았을 때(holds)만 움직입니다. 카드가 페이지에서 빠지면 멈춥니다.
    const loop = !!card.closest('[data-vzb-loop]');
    const holds = new Set();
    let playing = false, seen = false, inView = false, rest = 0, last = 0, raf = 0;
    const on = () => playing && inView && !holds.size && card.isConnected;
    function tick(stamp) {
      raf = 0;
      if (!on()) { last = 0; return; }
      const dt = last ? Math.min(100, stamp - last) : 16;
      last = stamp;
      if (rest > 0) { rest -= dt; if (rest <= 0) t = 0; }
      else {
        t = Math.min(TOTAL, t + dt);
        if (t >= TOTAL) { if (loop) rest = 2600; else playing = false; }
      }
      render();
      if (on()) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf && on()) raf = requestAnimationFrame(tick); }
    function play() { t = 0; rest = 0; last = 0; playing = true; render(); kick(); }
    btn.addEventListener('click', play);
    plot.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { holds.add('hover'); render(); } });
    plot.addEventListener('pointerleave', () => { holds.delete('hover'); kick(); });
    plot.addEventListener('focus', () => { if (plot.matches(':focus-visible')) { holds.add('focus'); render(); } });   // 키보드로 들어왔을 때만 멈춥니다
    plot.addEventListener('blur', () => { holds.delete('focus'); kick(); });
    // 툴팁: 막대를 짚으면 값을, 요인은 증감과 누계(앞 → 뒤)를, 끝 막대는 시작 대비 증감을 보여 주고 그 막대만 진하게 남깁니다.
    interact(plot, N,
      (cx) => Math.max(0, Math.min(N - 1, Math.floor((cx - plot.getBoundingClientRect().left) / slot))),
      (k) => {
        const c = cols[k], r = plot.getBoundingClientRect();
        svg.classList.add('is-hover');
        cols.forEach((x) => x.g.classList.toggle('is-on', x === c));
        const note = c.kind === 'step' ? (c.v == null ? null : tx(d, '누계 %1 → %2', show(f, c.from), show(f, c.to)))
          : c.kind === 'end' ? `${signed(f, v1 - v0)} · ${tx(d, '%s 대비', startName)}` : null;
        const tb = tipBody({ value: valText(c), note }, c.name);
        return { x: r.left + c.cx, y: r.top + Math.min(c.yA, c.yB) - 6, label: c.name, value: tb.node, text: tb.text };
      },
      () => { svg.classList.remove('is-hover'); cols.forEach((x) => x.g.classList.remove('is-on')); },
      false, true);

    if (live) t = 1e9;   // 마지막 장면에서 시작합니다
    onSize(plot, layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (W) layout(W, H); });
    // 화면에 처음 보일 때 움직입니다. 화면 밖에 있는 동안은 멈춰 둡니다.
    const start = () => { if (!seen) { seen = true; if (!live) play(); } };
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
