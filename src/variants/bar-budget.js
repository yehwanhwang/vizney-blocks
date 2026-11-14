  // Budget Bars: 항목마다 한도(limit, 예: 예산)를 세로 눈금으로 세워 두고, 지금까지 쓴 양(value)을 가로 막대로 채웁니다.
  // 눈금은 막대보다 길게 그려 막대 안에 들어가도 보이고, 첫 줄의 눈금 위에 이름(limitLabel, 비우면 한도)을 한 번 적습니다.
  // 한도 안은 회색, 한도를 넘긴 구간만 빨강(--vzb-bad)입니다. 값은 오른쪽 끝에 적고, 넘친 줄은 이름과 값을 굵게 적습니다.
  // 아래 줄에는 넘친 항목 수와 넘친 양의 합을 카드가 계산해 적습니다.
  // 움직임: 눈금이 먼저 서 있고, 막대가 위에서부터 하나씩 차오르며 값이 따라 올라갑니다. 마지막 막대가 다 차면 넘친 구간만
  // 세 번 깜빡이고 멈춥니다. 막대가 차기 전에는 막대 자리를 미리 그리지 않습니다.
  // 카드가 화면에 보이면 한 번 움직이고, 다시 보기 단추로 되풀이합니다. 동작 줄이기 설정이거나 데이터가 바뀌어 다시 그릴 때
  // (data-vzb-live)는 마지막 장면을 바로 그립니다. 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 끝에서 잠시 쉬고 되풀이합니다.
  // 항목은 받은 순서대로 max(비우면 6)개까지 그립니다. items가 빈 배열이면 '표시할 항목이 없습니다.'만 적습니다.
  mount('bar-budget', (card, d, f) => {
    // 걸러서 남은 항목이 없을 때(items가 빈 배열)는 오류가 아니라 빈 화면입니다.
    if (Array.isArray(d.items) && !d.items.length) {
      head(card, d, f, null);
      card.append(el('p', 'vzb-bb-none', tx(d, '표시할 항목이 없습니다.')));
      return;
    }
    const all = (d.items || []).filter((it) => it && it.name != null && fin(it.value) && fin(it.limit));
    if (!all.length) throw new Error(tx(d, 'items의 value와 limit을 확인하세요.'));
    const N = Math.max(1, Math.min(all.length, fin(d.max) && +d.max >= 1 ? Math.round(+d.max) : 6));
    const items = all.slice(0, N).map((it, i) => {
      const v = Math.max(0, +it.value), lim = Math.max(0, +it.limit);
      return { i, name: String(it.name), v, lim, over: Math.max(0, v - lim) };
    });
    const label = d.limitLabel || tx(d, '한도');
    const inText = f.lang === 'en' ? label.toLowerCase() : label;   // 문장 안의 영어 이름은 소문자로
    const spill = items.filter((it) => it.over > 0);
    const sum = spill.reduce((a, it) => a + it.over, 0);
    const top = Math.max(...items.map((it) => Math.max(it.v, it.lim))) || 1;
    const summary = !spill.length ? tx(d, '모두 %s 이내', inText)
      : f.rel ? tx(d, '%1개 중 %2개 %3 초과 · +%4', items.length, spill.length, inText, show(f, sum))
        : tx(d, '%1개 중 %2개 %3 초과', items.length, spill.length, inText);

    head(card, d, f, null);
    const foot = el('div', 'vzb-foot vzb-fill vzb-bb');
    const plot = el('div', 'vzb-plot');
    plot.tabIndex = 0;
    plot.setAttribute('role', 'img');
    plot.setAttribute('aria-label', tx(d, '%1. 항목 %2개 가운데 %3개가 %4 초과입니다. 위아래 화살표로 항목을 옮깁니다. 모든 값은 이어지는 표에 있습니다.', d.title || '', items.length, spill.length, inText));
    const svg = svgEl('svg', { class: 'vzb-bb-svg', 'aria-hidden': 'true' });
    plot.append(svg);
    const ctl = el('div', 'vzb-bb-ctl'), btn = el('button', 'vzb-bb-btn'), sumEl = el('p', 'vzb-bb-sum');
    btn.type = 'button';
    btn.setAttribute('aria-label', tx(d, '처음부터 다시'));
    const ic = svgEl('svg', { class: 'vzb-bb-ic', viewBox: '0 0 16 16', 'aria-hidden': 'true' });
    ic.append(svgEl('path', { d: 'M3.7 9a4.4 4.4 0 1 0 1.2-4.2' }), svgEl('path', { d: 'M4.6 2.6v2.6h2.6' }));
    btn.append(ic);
    if (spill.length) sumEl.append(el('i', 'vzb-bb-key'));
    sumEl.append(summary);
    ctl.append(btn, sumEl);
    foot.append(plot, ctl);
    card.append(foot);
    // 화면 낭독기용 표: 이름 · 값 · 한도 · 차이
    const sr = el('div', 'vzb-sr'), table = el('table'), hr = el('tr');
    hr.append(...[tx(d, '이름'), tx(d, '값'), label, tx(d, '차이')].map((k) => el('th', null, k)));
    table.append(el('caption', null, d.title || ''), hr);
    items.forEach((it) => { const tr = el('tr'); tr.append(el('th', null, it.name), el('td', null, show(f, it.v)), el('td', null, show(f, it.lim)), el('td', null, signed(f, it.v - it.lim))); table.append(tr); });
    sr.append(table);
    card.append(sr);

    // 값 글자는 숫자와 단위로 나눠 두고, 차오르는 동안 숫자만 같은 단위로 올립니다(5,800만으로 가는 길에 원 단위로 바뀌지 않게).
    items.forEach((it) => {
      const [text, unit] = f.parts(it.v), m = /^(\D*)([\d,]*\.?\d*)(.*)$/.exec(text);
      const end = parseFloat(m[2].replace(/,/g, '')) || 0, dec = (m[2].split('.')[1] || '').length;
      it.unitText = unit;
      it.count = (k) => (k >= 1 ? text : m[1] + num(end * k, dec) + m[3]);
    });
    // 줄: 회색 막대(한도 안) · 빨간 막대(넘친 구간) · 눈금(한도) · 이름(왼쪽) · 값(오른쪽 끝)
    const limText = svgText(0, 0, label, 'vzb-bb-lim', 'middle');
    items.forEach((it) => {
      it.g = svgEl('g', { class: 'vzb-bb-row' });
      it.fill = svgEl('path', { class: 'vzb-bb-fill' });
      it.red = svgEl('path', { class: 'vzb-bb-over' });
      it.tick = svgEl('rect', { class: 'vzb-bb-tick', width: 2, rx: 1 });
      it.nm = svgText(0, 0, it.name, 'vzb-bb-name', 'end');
      it.val = svgText(0, 0, '', 'vzb-bb-val', 'end');
      it.num = document.createTextNode('');
      it.val.append(it.num, Object.assign(svgEl('tspan', { class: 'vzb-bb-unit', dx: /^[A-Za-z]{2}/.test(it.unitText) ? 3 : 1 }), { textContent: it.unitText }));
      it.g.append(it.fill, it.red, it.tick, it.nm, it.val);
      svg.append(it.g);
    });
    svg.append(limText);
    const fam = getComputedStyle(card).fontFamily, fx = (v) => v.toFixed(1), clamp = (v) => Math.max(0, Math.min(1, v));
    // 가로 막대: round가 참이면 오른쪽 끝만 둥글게, 아니면 각지게(눈금에 닿는 끝)
    const bar = (x, y, w, h, round) => {
      if (w < 0.5) return '';
      const r = round ? Math.min(4, w, h / 2) : 0;
      return `M${fx(x)},${fx(y)}H${fx(x + w - r)}A${r},${r} 0 0 1 ${fx(x + w)},${fx(y + r)}V${fx(y + h - r)}A${r},${r} 0 0 1 ${fx(x + w - r)},${fx(y + h)}H${fx(x)}Z`;
    };
    // 시간표(밀리초): 눈금만 보이는 처음 · 줄 사이 간격 · 한 줄이 차는 시간 · 다 찬 뒤 쉬는 시간 · 깜빡임 한 번 · 깜빡이는 횟수
    const T0 = 320, STAG = 320, DUR = 520, WAIT = 260, BLINK = 440, TIMES = 3, GAP = 2, TOPPAD = 16;
    const easeOut = (k) => 1 - (1 - k) ** 3;
    let W = 0, H = 0, x0 = 0, s = 1, rowH = 0, bh = 0, t = 0, FULL = 0, TOTAL = 0;
    function layout(w, h) {
      W = w; H = h;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      x0 = Math.ceil(Math.max(...items.map((it) => textW(it.name, 700, fam)))) + 10;
      const vW = Math.ceil(Math.max(...items.map((it) => textW(show(f, it.v), 700, fam)))) + 4;
      s = Math.max(1, w - x0 - vW - 12) / top;
      rowH = Math.min(32, Math.max(14, (h - TOPPAD) / N));
      bh = Math.max(6, Math.min(16, Math.round(rowH * 0.5)));
      const th = Math.min(rowH - 2, bh + 8);   // 눈금은 막대보다 위아래로 4px씩 깁니다
      items.forEach((it) => {
        it.y = TOPPAD + it.i * rowH + (rowH - bh) / 2;
        it.yc = it.y + bh / 2;
        it.xl = x0 + it.lim * s;
        it.tick.setAttribute('x', fx(it.xl - 1));
        it.tick.setAttribute('y', fx(it.yc - th / 2));
        it.tick.setAttribute('height', fx(th));
        it.nm.setAttribute('x', x0 - 8);
        it.nm.setAttribute('y', fx(it.yc + 4));
        it.val.setAttribute('x', w);
        it.val.setAttribute('y', fx(it.yc + 4));
        it.start = T0 + it.i * STAG;
      });
      // 눈금 이름은 첫 줄의 눈금 위에 한 번만 적습니다. 그래프 밖으로 나가지 않게 당깁니다.
      const lw = textW(label, 400, fam, 11) / 2;
      limText.setAttribute('x', fx(Math.max(lw, Math.min(w - lw, items[0].xl))));
      limText.setAttribute('y', fx(items[0].yc - th / 2 - 5));
      FULL = T0 + (N - 1) * STAG + DUR;
      TOTAL = FULL + (spill.length ? WAIT + BLINK * TIMES : 240);
      render();
    }
    function render() {
      if (!W) return;
      // 깜빡임: 다 찬 뒤 넘친 구간만 옅어졌다 돌아오기를 되풀이하고, 진한 상태로 끝납니다.
      const b = (t - FULL - WAIT) / BLINK;
      const glow = b <= 0 || b >= TIMES || holds.size ? 1 : 1 - 0.84 * (0.5 - 0.5 * Math.cos(2 * Math.PI * b));   // 멈춰서 값을 읽는 동안은 진하게
      const alert = t >= FULL + WAIT;
      items.forEach((it) => {
        const k = clamp((t - it.start) / DUR), e = easeOut(k), xv = x0 + it.v * s * e;
        // 한도에 닿은 막대는 눈금 앞에서 각지게 끊고, 넘친 만큼은 눈금 뒤에서 빨강으로 잇습니다.
        const hit = it.v >= it.lim && xv >= it.xl - GAP;
        it.fill.setAttribute('d', bar(x0, it.y, (hit ? it.xl - GAP : xv) - x0, bh, !hit));
        it.red.setAttribute('d', it.over > 0 ? bar(it.xl + GAP, it.y, xv - it.xl - GAP, bh, true) : '');
        it.red.setAttribute('opacity', fx(glow));
        it.num.nodeValue = it.count(e);
        it.val.setAttribute('opacity', fx(clamp((t - it.start) / 140)));
        it.g.classList.toggle('is-over', it.over > 0 && alert);
      });
      sumEl.style.opacity = fx(clamp((t - (spill.length ? FULL + WAIT : FULL)) / 240));
    }

    // 재생: 화면에 보이고(inView) 마우스 · 포커스로 잠시 멈추지 않았을 때(holds)만 움직입니다. 카드가 페이지에서 빠지면 멈춥니다.
    const still = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const live = card.hasAttribute('data-vzb-live');   // 데이터가 바뀌어 다시 그린 카드: 처음부터 재생하지 않습니다
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
    // 툴팁: 줄을 짚으면 쓴 양, 한도, 넘치거나 남은 양과 한도 대비 비율을 보여 주고 그 줄만 진하게 남깁니다.
    interact(plot, items.length,
      (cx, cy) => {
        const i = Math.floor((cy - plot.getBoundingClientRect().top - TOPPAD) / rowH);
        return i >= 0 && i < items.length ? i : -1;
      },
      (k) => {
        const it = items[k], r = plot.getBoundingClientRect();
        svg.classList.add('is-hover');
        items.forEach((x) => x.g.classList.toggle('is-on', x === it));
        const gap = show(f, Math.abs(it.v - it.lim)), share = it.lim > 0 ? num((it.v / it.lim) * 100, 0) : null;
        const note = [`${label} ${show(f, it.lim)}`];
        if (share == null) note.push(tx(d, '%s 초과|한도', gap));
        else note.push(it.v > it.lim ? tx(d, '%1 초과 · %2의 %3%', gap, inText, share) : it.v < it.lim ? tx(d, '%1 남음 · %2의 %3%', gap, inText, share) : tx(d, '%1의 %2', inText, `${share}%`));
        const tb = tipBody({ value: show(f, it.v), note }, it.name);
        return { x: r.left + x0 + Math.max(it.v, it.lim) * s, y: r.top + it.y - 6, label: it.name, value: tb.node, text: tb.text, side: true };
      },
      () => { svg.classList.remove('is-hover'); items.forEach((x) => x.g.classList.remove('is-on')); },
      true, true);

    btn.hidden = still;
    if (still || live) t = 1e9;   // 마지막 장면에서 시작합니다
    onSize(plot, layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (W) layout(W, H); });
    // 화면에 처음 보일 때 움직입니다. 화면 밖에 있는 동안은 멈춰 둡니다.
    const start = () => { if (!seen) { seen = true; if (!still && !live) play(); } };
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
