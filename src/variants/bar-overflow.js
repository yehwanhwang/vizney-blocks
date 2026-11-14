  // Bar - Overflow: 항목마다 한도(limit)를 테두리 칸으로 그리고 쓴 양(value)으로 채웁니다. 한도를 넘긴 만큼은 칸 밖으로 삐져나왔다가
  // 떨어져 나가 바닥에 쌓입니다(글자 수를 넘기면 넘친 글자가 떨어지는 입력 칸처럼). 떨어진 조각의 길이가 넘친 양입니다.
  // 넘친 조각만 첫째 색, 나머지는 회색입니다. 오른쪽 끝에 한도와의 차이(넘치면 +, 남으면 −)를, 아래 줄에 넘친 항목 수와 넘친 양의 합을 카드가 계산해 적습니다.
  // 움직임: 줄마다 0.14초 간격으로 채우고(0.7초), 넘친 조각은 잠깐 버티다 금이 가며 떨리고, 한도 끝을 경첩 삼아 기운 뒤 떨어져 바닥이나
  // 먼저 떨어진 조각 위에 내려앉습니다(닿을 때 살짝 눌렸다가 튑니다). 약 2.5초 뒤 쌓인 장면에서 멈춥니다.
  // 카드가 화면에 보이면 한 번 움직이고, 다시 보기 단추로 되풀이합니다. 동작 줄이기 설정에서는 쌓인 장면을 바로 그립니다.
  // 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 끝에서 잠시 쉬고 되풀이합니다. 항목은 받은 순서대로 max(비우면 6)개까지 그립니다.
  mount('bar-overflow', (card, d, f) => {
    const all = (d.items || []).filter((it) => it && it.name != null && fin(it.value) && fin(it.limit));
    if (!all.length) throw new Error(tx(d, 'items의 value와 limit을 확인하세요.'));
    const N = Math.max(1, Math.min(all.length, fin(d.max) && +d.max >= 1 ? Math.round(+d.max) : 6));
    const items = all.slice(0, N).map((it, i) => {
      const v = Math.max(0, +it.value), lim = Math.max(0, +it.limit);
      return { i, name: String(it.name), v, lim, over: Math.max(0, v - lim) };
    });
    const spill = items.filter((it) => it.over > 0);
    const sum = spill.reduce((a, it) => a + it.over, 0);
    const top = Math.max(...items.map((it) => Math.max(it.v, it.lim))) || 1;
    const summary = !spill.length ? tx(d, '모두 한도 안입니다')
      : f.rel ? tx(d, '%1개 중 %2개가 넘쳤습니다 · 넘친 양 %3', items.length, spill.length, show(f, sum))
        : tx(d, '%1개 중 %2개가 넘쳤습니다', items.length, spill.length);

    head(card, d, f, null);
    const foot = el('div', 'vzb-foot vzb-fill vzb-of');
    const plot = el('div', 'vzb-plot');
    plot.tabIndex = 0;
    plot.setAttribute('role', 'img');
    plot.setAttribute('aria-label', tx(d, '%s. 항목 %s개 가운데 %s개가 한도를 넘었습니다. 위아래 화살표로 항목을 옮깁니다. 모든 값은 이어지는 표에 있습니다.', d.title || '', items.length, spill.length));
    const svg = svgEl('svg', { class: 'vzb-of-svg', 'aria-hidden': 'true' });
    plot.append(svg);
    const ctl = el('div', 'vzb-of-ctl'), btn = el('button', 'vzb-of-btn'), sumEl = el('p', 'vzb-of-sum');
    btn.type = 'button';
    btn.setAttribute('aria-label', tx(d, '처음부터 다시'));
    const ic = svgEl('svg', { class: 'vzb-of-ic', viewBox: '0 0 16 16', 'aria-hidden': 'true' });
    ic.append(svgEl('path', { d: 'M3.7 9a4.4 4.4 0 1 0 1.2-4.2' }), svgEl('path', { d: 'M4.6 2.6v2.6h2.6' }));
    btn.append(ic);
    if (spill.length) sumEl.append(el('i', 'vzb-of-key vzb-f1'));
    sumEl.append(summary);
    ctl.append(btn, sumEl);
    foot.append(plot, ctl);
    card.append(foot);
    // 화면 낭독기용 표: 이름 · 값 · 한도 · 차이
    const sr = el('div', 'vzb-sr'), table = el('table'), hr = el('tr');
    hr.append(...[tx(d, '이름'), tx(d, '값'), tx(d, '한도'), tx(d, '차이')].map((k) => el('th', null, k)));
    table.append(el('caption', null, d.title || ''), hr);
    items.forEach((it) => { const tr = el('tr'); tr.append(el('th', null, it.name), el('td', null, show(f, it.v)), el('td', null, show(f, it.lim)), el('td', null, signed(f, it.v - it.lim))); table.append(tr); });
    sr.append(table);
    card.append(sr);

    // 줄: 테두리 칸(한도) · 회색 막대(칸 안의 쓴 양) · 이름(왼쪽 칸) · 차이(오른쪽 끝) · 금 간 자리 표시(한도 끝의 짧은 세로선)
    // 조각은 줄 위의 다른 층에 그려, 떨어지는 동안 아래 줄들 앞을 지나갑니다.
    const floor = svgEl('line', { class: 'vzb-of-floor' }), rowsG = svgEl('g', {}), piecesG = svgEl('g', {});
    items.forEach((it) => {
      it.g = svgEl('g', { class: 'vzb-of-row' });
      it.fill = svgEl('path', { class: 'vzb-of-fill' });
      it.box = svgEl('path', { class: 'vzb-of-box' });
      it.tick = svgEl('line', { class: 'vzb-of-tick' });
      it.nm = svgText(0, 0, it.name, 'vzb-of-name', 'end');
      it.df = svgText(0, 0, signed(f, it.v - it.lim), 'vzb-of-diff', 'end');
      it.g.append(it.fill, it.box, it.tick, it.nm, it.df);
      rowsG.append(it.g);
      if (it.over > 0) {
        it.pg = svgEl('g', { class: 'vzb-of-pc' });
        it.piece = svgEl('path', { class: 'vzb-of-piece' });
        it.pg.append(it.piece);
        piecesG.append(it.pg);
      }
    });
    svg.append(floor, rowsG, piecesG);
    const fam = getComputedStyle(card).fontFamily, fx = (v) => v.toFixed(1), clamp = (v) => Math.max(0, Math.min(1, v));
    // 끝만 둥근 막대(왼쪽 끝은 각지게)
    const bar = (x, y, w, h) => {
      if (w < 0.5) return '';
      const r = Math.min(4, w, h / 2);
      return `M${fx(x)},${fx(y)}H${fx(x + w - r)}A${r},${r} 0 0 1 ${fx(x + w)},${fx(y + r)}V${fx(y + h - r)}A${r},${r} 0 0 1 ${fx(x + w - r)},${fx(y + h)}H${fx(x)}Z`;
    };
    // 시간표(밀리초)와 떨어지는 힘: 채우기 · 버티기 · 금 가기 · 기울기 · 닿은 뒤 눌림과 튐. G는 1초에 px/s²
    const STAG = 140, TG = 700, HOLD = 220, CR = 140, HG = 200, SQ = 70, BN = 300, G = 2400, TILT = 22, GAP = 2, DRIFT = 3;
    const easeOut = (k) => 1 - (1 - k) ** 3, smooth = (k) => k * k * (3 - 2 * k);
    let W = 0, H = 0, x0 = 0, s = 1, rowH = 0, bh = 0, t = 0, TOTAL = 0;
    function layout(w, h) {
      W = w; H = h;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      x0 = Math.ceil(Math.max(...items.map((it) => textW(it.name, 700, fam)))) + 10;
      const dW = Math.ceil(Math.max(...items.map((it) => textW(it.df.textContent, 700, fam)))) + 10;
      s = Math.max(1, w - x0 - dW - 4) / top;
      // 조각이 쌓일 층을 먼저 셉니다. 먼저 떨어진 조각과 가로로 겹치면 그 위 층에 놓입니다(위 줄이 먼저 떨어집니다).
      // 줄 높이는 그 층들이 바닥 위, 마지막 줄 아래에 들어가게 정합니다.
      let levels = 0, right = x0 + top * s;
      const landed = [];
      spill.forEach((it) => {
        it.pw = it.over * s;
        it.x1 = x0 + it.lim * s + GAP + DRIFT;
        it.lv = landed.reduce((lv, o) => (it.x1 < o.x2 - 1 && o.x1 < it.x1 + it.pw - 1 ? Math.max(lv, o.lv + 1) : lv), 0);
        landed.push({ x1: it.x1, x2: it.x1 + it.pw, lv: it.lv });
        levels = Math.max(levels, it.lv + 1);
        right = Math.max(right, it.x1 + it.pw);
      });
      rowH = Math.min(30, Math.max(14, (h - 12) / (N + 0.62 * levels)));
      bh = Math.max(6, Math.min(18, Math.round(rowH * 0.62)));
      const floorY = h - 0.5;
      floor.setAttribute('x1', x0);
      floor.setAttribute('x2', fx(right));
      floor.setAttribute('y1', floorY);
      floor.setAttribute('y2', floorY);
      floor.setAttribute('opacity', spill.length ? 1 : 0);   // 넘친 항목이 없으면 바닥도 그리지 않습니다
      items.forEach((it) => {
        it.y = it.i * rowH + (rowH - bh) / 2;
        it.yc = it.y + bh / 2;
        const xl = x0 + it.lim * s;
        it.box.setAttribute('d', bar(x0 + 0.5, it.y + 0.5, Math.max(0, it.lim * s - 1), bh - 1));
        it.tick.setAttribute('x1', fx(xl));
        it.tick.setAttribute('x2', fx(xl));
        it.tick.setAttribute('y1', fx(it.y - 3));
        it.tick.setAttribute('y2', fx(it.y + bh + 3));
        it.nm.setAttribute('x', x0 - 8);
        it.nm.setAttribute('y', fx(it.yc + 4));
        it.df.setAttribute('x', w);
        it.df.setAttribute('y', fx(it.yc + 4));
        it.start = 120 + it.i * STAG;
        it.end = it.start + TG + 200;   // 차이 글자가 다 보일 때까지
        it.tick.setAttribute('opacity', 0);
        if (!it.pg) return;
        // 내려앉을 자리(조각 가운데의 높이): 바닥에서 층 수만큼 위입니다. 층 사이는 1px 띄웁니다.
        it.ly = floorY - 0.5 - it.lv * (bh + 1) - bh / 2;
        it.tf = Math.sqrt((2 * Math.max(1, it.ly - it.yc)) / G) * 1000;
        it.hb = Math.min(7, Math.max(2, (it.ly - it.yc) * 0.05));
        it.end = it.start + TG + HOLD + CR + HG + it.tf + BN;
      });
      TOTAL = Math.max(...items.map((it) => it.end));
      render();
    }
    function render() {
      if (!W) return;
      items.forEach((it) => {
        const k = t - it.start, now = it.v * easeOut(clamp(k / TG)), inBox = Math.min(now, it.lim) * s;
        it.fill.setAttribute('d', bar(x0, it.y, inBox, bh));
        if (!it.pg) {
          it.df.setAttribute('opacity', fx(clamp((k - TG) / 200)));
          return;
        }
        const tb = k - TG - HOLD;   // 금 가기 시작한 뒤
        let pw = it.pw, px = x0 + it.lim * s + GAP, py = it.yc, rot = 0, pivot = 0, sx = 1, sy = 1, landedFor = -1;
        if (tb < 0) { pw = Math.max(0, now - it.lim) * s; px = x0 + it.lim * s; }
        else if (tb < CR) { const q = tb / CR; px = x0 + it.lim * s + GAP * Math.min(1, tb / 60); rot = 2.5 * Math.sin((tb / 70) * Math.PI * 2) * (1 - q); pivot = pw / 2; }
        else if (tb < CR + HG) { const q = (tb - CR) / HG; rot = TILT * q * q; }
        else {
          const tf = tb - CR - HG;
          if (tf < it.tf) {
            const u = tf / it.tf, sec = tf / 1000;
            px += DRIFT * u;
            py = it.yc + 0.5 * G * sec * sec;
            rot = TILT * (1 - smooth(u));
          } else {
            landedFor = tf - it.tf;
            px += DRIFT;
            py = it.ly;
            if (landedFor < SQ) { const q = 1 - landedFor / SQ; sy = 1 - 0.28 * q; sx = 1 + 0.08 * q; }
            else if (landedFor < BN) { const b = (landedFor - SQ) / (BN - SQ); py = it.ly - it.hb * 4 * b * (1 - b); }
          }
        }
        it.piece.setAttribute('d', bar(0, -bh / 2, pw, bh));
        it.pg.setAttribute('transform', `translate(${fx(px)},${fx(py)}) rotate(${fx(rot)},${fx(pivot)},0)${sx !== 1 ? ` translate(${fx(pw / 2)},${fx(bh / 2)}) scale(${sx.toFixed(3)},${sy.toFixed(3)}) translate(${fx(-pw / 2)},${fx(-bh / 2)})` : ''}`);
        it.tick.setAttribute('opacity', tb >= 0 ? 1 : 0);
        it.g.classList.toggle('is-over', tb >= 0);
        it.df.setAttribute('opacity', fx(landedFor < 0 ? 0 : clamp(landedFor / 200)));
      });
      sumEl.style.opacity = fx(clamp((t - TOTAL + 250) / 250));
    }

    // 재생: 화면에 보이고(inView) 마우스 · 포커스로 잠시 멈추지 않았을 때(holds)만 움직입니다. 카드가 페이지에서 빠지면 멈춥니다.
    const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const loop = !!card.closest('[data-vzb-loop]');
    const holds = new Set();
    let playing = false, seen = false, inView = false, rest = 0, last = 0, raf = 0;
    const live = () => playing && inView && !holds.size && card.isConnected;
    function tick(stamp) {
      raf = 0;
      if (!live()) { last = 0; return; }
      const dt = last ? Math.min(100, stamp - last) : 16;
      last = stamp;
      if (rest > 0) { rest -= dt; if (rest <= 0) t = 0; }
      else {
        t = Math.min(TOTAL, t + dt);
        if (t >= TOTAL) { if (loop) rest = 2600; else playing = false; }
      }
      render();
      if (live()) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf && live()) raf = requestAnimationFrame(tick); }
    function play() { t = 0; rest = 0; last = 0; playing = true; render(); kick(); }
    btn.addEventListener('click', play);
    plot.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') holds.add('hover'); });
    plot.addEventListener('pointerleave', () => { holds.delete('hover'); kick(); });
    plot.addEventListener('focus', () => { if (plot.matches(':focus-visible')) holds.add('focus'); });   // 키보드로 들어왔을 때만 멈춥니다
    plot.addEventListener('blur', () => { holds.delete('focus'); kick(); });
    // 툴팁: 줄이나 바닥의 조각을 짚으면 그 항목의 쓴 양 · 한도 · 차이를 보여 주고, 줄과 조각을 함께 밝힙니다.
    interact(plot, items.length,
      (cx, cy) => {
        const r = plot.getBoundingClientRect(), x = cx - r.left, y = cy - r.top;
        if (y < items.length * rowH) return Math.max(0, Math.min(items.length - 1, Math.floor(y / rowH)));
        const hit = spill.find((it) => x >= it.x1 - 2 && x <= it.x1 + it.pw + 2 && Math.abs(y - it.ly) <= bh);
        return hit ? hit.i : -1;
      },
      (k) => {
        const it = items[k], r = plot.getBoundingClientRect();
        svg.classList.add('is-hover');
        items.forEach((x) => { x.g.classList.toggle('is-on', x === it); if (x.pg) x.pg.classList.toggle('is-on', x === it); });
        const gap = signed(f, it.v - it.lim).replace(/^[+−]/, '');
        const note = [tx(d, '한도 %s', show(f, it.lim)), it.v > it.lim ? tx(d, '%s 넘침', gap) : it.v < it.lim ? tx(d, '%s 남음', gap) : tx(d, '한도와 같음')];
        const tb = tipBody({ value: show(f, it.v), note }, it.name);
        return { x: r.left + x0 + Math.min(it.v, it.lim) * s, y: r.top + it.y, label: it.name, value: tb.node, text: tb.text, side: true };
      },
      () => { svg.classList.remove('is-hover'); items.forEach((x) => { x.g.classList.remove('is-on'); if (x.pg) x.pg.classList.remove('is-on'); }); },
      true, true);

    btn.hidden = reduce;
    onSize(plot, (w, h) => { layout(w, h); if (reduce || !seen) { t = reduce ? TOTAL : 0; render(); } });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (W) layout(W, H); });
    // 화면에 처음 보일 때 움직입니다. 화면 밖에 있는 동안은 멈춰 둡니다.
    const start = () => { if (!seen) { seen = true; if (!reduce) play(); } };
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
