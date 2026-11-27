  // Donut Tick: 도넛으로 구성비를 그리고, 짚은 조각을 12시 자리로 돌려 놓습니다. 조각은 12시에서 시작할 때 크기를 읽기 가장 쉽고(시계의 분침처럼),
  // 고리 바깥의 눈금(5%마다, 25 · 50 · 75%는 길게)에 조각의 끝을 대어 읽습니다. 가운데 큰 숫자는 12시 표시에 걸린 조각의 비중입니다.
  // 짚은 조각만 첫째 데이터 색이고, 나머지는 글자색을 옅게 깐 회색 단계입니다(적은 순서대로 진한 회색부터). 색은 자리가 아니라 항목을 따라갑니다.
  // 짚기: 범례의 줄이나 조각을 누르면(키보드로도) 고리가 가까운 쪽으로 돌아 그 조각이 12시에 섭니다. 돌 때는 조각 하나씩 째깍째깍 넘어가고,
  // 조각이 넘어갈 때마다 12시의 표시가 톱니에 걸린 듯 살짝 튕깁니다. 지나가는 조각도 12시에 걸린 동안은 가운데 숫자와 색이 그 조각의 것입니다.
  // 움직임: 화면에 보이면 첫 항목에서 짚을 항목(focus)까지 한 번 돌고 멈춥니다. 조각의 크기는 값이라 돌아가는 동안에도 그대로이고, 도는 것은 고리의 자리뿐입니다.
  // 데이터가 바뀌어 다시 그릴 때(data-vzb-live)는 처음부터 돌지 않고 짚은 항목을 이어 가며, 조각이 있던 크기에서 새 크기로 옮겨 갑니다(같은 이름의 항목이 같은 순서일 때).
  // 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 잠시 쉬고 다른 조각으로 돕니다. 직접 짚으면 멈춥니다.
  mount('donut-tick', (card, d, f) => {
    // 걸러서 남은 항목이 없을 때(items가 빈 배열이거나 모든 값이 0)는 오류가 아니라 빈 화면입니다.
    const none = () => { head(card, d, f, null); card.append(el('p', 'vzb-dk-none', tx(d, '표시할 항목이 없습니다.'))); };
    if (Array.isArray(d.items) && (!d.items.length || d.items.every((it) => it && fin(it.value) && +it.value === 0))) { none(); return; }
    const list = Array.isArray(d.items) ? d.items.filter((it) => it && it.name != null && it.name !== '') : [];
    if (list.length < 2 || list.length > 6) throw new Error(tx(d, 'items에 항목을 2~6개 적으세요.'));
    if (list.some((it) => !fin(it.value) || +it.value < 0)) throw new Error(tx(d, 'items의 value에 0 이상의 값을 적으세요.'));
    const items = list.map((it, k) => ({ k, name: String(it.name), value: +it.value }));
    const N = items.length, total = items.reduce((s, it) => s + it.value, 0);
    items.forEach((it) => { it.share = it.value / total; });
    // 정수 퍼센트: 내림한 값에 나머지가 큰 항목부터 1씩 더해 합을 100으로 맞춥니다(범례와 가운데 숫자가 함께 씁니다).
    const whole = (shares) => {
      const exact = shares.map((s) => s * 100), n = exact.map(Math.floor);
      let left = 100 - n.reduce((a, b) => a + b, 0);
      exact.map((e, i) => [e - n[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { n[i]++; left--; } });
      return n;
    };
    const pct1 = (s) => `${num(s * 100, 1)}%`;
    const nameAt = (name) => items.findIndex((it) => it.name === String(name));

    head(card, d, f, null);
    const foot = el('div', 'vzb-foot vzb-dk');
    const plot = el('div', 'vzb-plot vzb-dk-plot');
    plot.tabIndex = 0;
    plot.setAttribute('role', 'img');
    const svg = svgEl('svg', { class: 'vzb-dk-svg', 'aria-hidden': 'true' });
    // 눈금: 5%마다 20개. 25 · 50 · 75%는 길고 진하게, 0%(12시) 자리에는 눈금 대신 표시를 둡니다.
    const ticks = [];
    for (let i = 1; i < 20; i++) { const t = svgEl('line', { class: `vzb-dk-tick${i % 5 ? '' : ' is-major'}` }); ticks.push(t); svg.append(t); }
    const arcs = items.map((it) => { const p = svgEl('path', { class: `vzb-dk-arc vzb-dk-c${it.k}` }); svg.append(p); return p; });
    const mark = svgEl('path', { class: 'vzb-dk-mark' });
    svg.append(mark);
    // 가운데: 12시에 걸린 조각의 비중(굴러가는 숫자)과 이름
    const mid = el('div', 'vzb-dk-mid'), numEl = el('div', 'vzb-dk-num'), numBox = el('span', 'vzb-rl'), midName = el('div', 'vzb-dk-name');
    mid.setAttribute('aria-hidden', 'true');
    numEl.append(numBox, el('span', 'vzb-unit', '%'));
    mid.append(numEl, midName);
    plot.append(svg, mid);
    // 범례: 항목마다 줄 하나(견본 · 이름 · 비중). 줄은 그 항목을 짚는 단추입니다(라디오 묶음: 화살표로 옮깁니다).
    const legend = el('div', 'vzb-dk-legend');
    legend.setAttribute('role', 'radiogroup');
    legend.setAttribute('aria-label', d.title || tx(d, '항목'));
    items.forEach((it) => {
      const b = el('button', 'vzb-dk-row');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      it.val = el('b');
      b.append(el('i', `vzb-dk-key vzb-dk-c${it.k}`), el('span', null, it.name), it.val);
      b.addEventListener('click', () => choose(it.k));
      it.row = b;
      legend.append(b);
    });
    legend.addEventListener('keydown', (e) => {
      const k = e.key, step = k === 'ArrowRight' || k === 'ArrowDown' ? 1 : k === 'ArrowLeft' || k === 'ArrowUp' ? -1 : 0;
      const to = k === 'Home' ? 0 : k === 'End' ? N - 1 : step ? (goal + step + N) % N : -1;
      if (to < 0) return;
      e.preventDefault();
      choose(to);
      items[to].row.focus();
    });
    foot.append(plot, legend);
    card.append(foot);
    // 화면 낭독기용 표: 항목 · 비중 · 값
    const sr = el('div', 'vzb-sr'), table = el('table'), hr = el('tr');
    hr.append(...[tx(d, '이름'), tx(d, '비중'), tx(d, '값')].map((k) => el('th', null, k)));
    table.append(el('caption', null, d.title || ''), hr);
    items.forEach((it) => { const tr = el('tr'); tr.append(el('th', null, it.name), el('td', null, pct1(it.share)), el('td', null, show(f, it.value))); table.append(tr); });
    const trT = el('tr');
    trT.append(el('th', null, tx(d, '합계')), el('td', null, '100%'), el('td', null, show(f, total)));
    table.append(trT);
    const say = el('div', 'vzb-sr');   // 짚은 항목을 읽어 줍니다
    say.setAttribute('aria-live', 'polite');
    sr.append(table);
    card.append(sr, say);

    // 움직임 값: 고리가 조각 하나를 넘어가는 자리 잡기(Settle), 표시가 튕기는 것(Pop), 조각의 크기가 새 값으로 가는 것(Move, 넘치지 않음).
    // 조각 사이의 박자(TICK)는 이 카드의 이야기 속도입니다.
    const M = motion(card), SET = M.pair('settle'), POP = M.pair('pop'), MOVE = M.pair('move'), TICK = 160, KICK = 430;
    const live = card.hasAttribute('data-vzb-live');   // 데이터가 바뀌어 다시 그린 카드: 처음부터 돌지 않습니다
    const loop = !!card.closest('[data-vzb-loop]');
    const want = Math.max(0, nameAt(d.focus)), kept = nameAt(card.getAttribute('data-vzb-pick'));
    // shown은 지금 12시에 걸린 조각, goal은 가려는 조각입니다. off는 고리가 제자리(shown이 12시에서 시작하는 자리)에서 벗어난 만큼(바퀴 수)이고, 0으로 잦아듭니다.
    let goal = kept >= 0 ? kept : want, shown = live || goal === 0 ? goal : 0, dir = 1, wait = 0;
    const off = { x: 0, v: 0 }, mk = { x: 0, v: 0 };
    const sz = items.map((it) => ({ x: it.share, v: 0 }));   // 조각의 크기(비중): 옮겨 갈 때만 움직입니다
    let moving = false, D = 0, R = 0, r0 = 0, C = 0;
    const startOf = (k, a) => { let s = 0; for (let i = 0; i < k; i++) s += a[i]; return s; };

    // 크기: 놓인 자리(foot)에서 도넛이 가장 커지는 쪽으로 범례의 자리(오른쪽 · 아래)를 고릅니다.
    function layout() {
      foot.classList.remove('is-stack');
      foot.style.minHeight = '';
      plot.style.width = plot.style.height = '0px';   // 범례의 제 폭과 높이를 재는 동안 도넛은 자리를 차지하지 않습니다
      legend.style.gridTemplateColumns = '';
      const top = parseFloat(getComputedStyle(foot).paddingTop), W = foot.clientWidth, H = foot.clientHeight - top;
      if (!(W > 0) || !(H > 0)) return;
      const lw = Math.ceil(legend.getBoundingClientRect().width) + 1, side = Math.min(H, W - lw - 12);   // 소수 폭을 올려 잡아 이름이 줄지 않게 합니다
      // 아래에 둘 때는 줄을 맞춘 격자입니다: 폭에 들어가는 한 칸 수를 많이(셋까지) 잡아 줄 수를 줄입니다.
      foot.classList.add('is-stack');
      let cols = Math.min(3, N);
      for (; cols > 1; cols--) { legend.style.gridTemplateColumns = `repeat(${cols}, max-content)`; if (legend.scrollWidth <= W + 0.5 && legend.getBoundingClientRect().width <= W + 0.5) break; }
      legend.style.gridTemplateColumns = `repeat(${cols}, ${cols > 1 ? 'max-content' : 'minmax(0, max-content)'})`;
      const lh = legend.offsetHeight, stack = Math.min(W, H - lh - 12), down = stack > side + 8;
      foot.classList.toggle('is-stack', down);
      if (!down) legend.style.gridTemplateColumns = '';
      D = Math.max(112, Math.floor(down ? stack : side));
      // 자리가 낮아 도넛이 가장 작은 크기(112px)로도 들어가지 않으면 카드가 그만큼 길어집니다.
      const need = down ? D + lh + 12 : D;
      if (need > H + 0.5) foot.style.minHeight = `${Math.ceil(need + top)}px`;
      C = D / 2; R = C - 13;
      const th = Math.max(14, Math.min(34, R * 0.3));
      r0 = R - th;
      plot.style.width = plot.style.height = `${D}px`;
      svg.setAttribute('width', D);
      svg.setAttribute('height', D);
      svg.setAttribute('viewBox', `0 0 ${D} ${D}`);
      ticks.forEach((t, j) => {
        const i = j + 1, u = i / 20, big = i % 5 === 0, a = R + 4, b = a + (big ? 7 : 4), sn = Math.sin(2 * Math.PI * u), cn = Math.cos(2 * Math.PI * u);
        t.setAttribute('x1', (C + a * sn).toFixed(1)); t.setAttribute('y1', (C - a * cn).toFixed(1));
        t.setAttribute('x2', (C + b * sn).toFixed(1)); t.setAttribute('y2', (C - b * cn).toFixed(1));
      });
      mark.setAttribute('d', `M${C - 5},${C - R - 12}H${C + 5}L${C},${C - R - 3}Z`);
      mid.classList.toggle('is-small', 2 * r0 < 88);
      midName.style.maxWidth = `${Math.max(40, Math.floor(2 * r0 - 20))}px`;
      render();
    }
    const pt = (rad, u) => `${(C + rad * Math.sin(2 * Math.PI * u)).toFixed(2)},${(C - rad * Math.cos(2 * Math.PI * u)).toFixed(2)}`;
    let lastNum = null, lastShown = -1, rotNow = 0, sizes = items.map((it) => it.share);
    function render() {
      if (!D) return;
      sizes = sz.map((s) => Math.max(0, s.x));
      const sum = sizes.reduce((a, b) => a + b, 0) || 1;
      sizes = sizes.map((s) => s / sum);
      rotNow = -startOf(shown, sizes) + off.x;
      let u = rotNow;
      arcs.forEach((p, k) => {
        const s = Math.min(0.9999, sizes[k]), u1 = u + s, big = s > 0.5 ? 1 : 0;
        p.setAttribute('d', s <= 0 ? '' : `M${pt(R, u)}A${R},${R} 0 ${big} 1 ${pt(R, u1)}L${pt(r0, u1)}A${r0},${r0} 0 ${big} 0 ${pt(r0, u)}Z`);
        u += sizes[k];
      });
      mark.setAttribute('transform', Math.abs(mk.x) < 0.05 ? '' : `rotate(${mk.x.toFixed(2)} ${C} ${C - R - 12})`);
      const ints = whole(sizes);
      if (lastNum !== ints[shown]) { lastNum = ints[shown]; roll(numBox, String(lastNum)); }
      items.forEach((it) => { const v = `${ints[it.k]}%`; if (it.val.textContent !== v) it.val.textContent = v; });
      if (lastShown !== shown) {
        lastShown = shown;
        midName.textContent = items[shown].name;
        arcs.forEach((p, k) => p.classList.toggle('is-pick', k === shown));
      }
      items.forEach((it) => { const on = it.k === goal; if (it.row.classList.contains('is-on') !== on) { it.row.classList.toggle('is-on', on); it.row.setAttribute('aria-checked', String(on)); it.row.tabIndex = on ? 0 : -1; } });
    }
    // 조각 하나를 넘어갑니다: 12시에 걸린 조각을 옆 조각으로 바꾸고, 고리는 그만큼 벗어난 자리에서 제자리로 돌아옵니다. 표시는 넘어가는 쪽으로 튕깁니다.
    function step() {
      const a = shown, n = (a + dir + N) % N;
      off.x += dir > 0 ? sizes[a] : -sizes[n];
      shown = n;
      mk.v -= dir * KICK;
      wait = TICK;
    }
    // k번 조각으로 갑니다: 조각 수가 적은 쪽으로 돕니다(같으면 시계 반대 방향으로 돌려 다음 조각을 부릅니다).
    function go(k) {
      goal = k;
      const fwd = (k - shown + N) % N, back = N - fwd;
      dir = fwd <= back ? 1 : -1;
      if (shown !== goal && wait <= 0) step();
      render();
      kick();
    }
    // 직접 짚은 조각: 갤러리의 되풀이를 멈추고, 다시 그려도 이어 가도록 카드에 적어 두고, 화면 낭독기에 알립니다.
    function choose(k) {
      took = true;
      rest = 0;
      card.setAttribute('data-vzb-pick', items[k].name);
      say.textContent = `${items[k].name}: ${pct1(items[k].share)} (${show(f, items[k].value)})`;
      if (k !== goal || k !== shown) go(k);
    }

    // 옮겨 가기(데이터가 바뀌어 다시 그릴 때): 앞 카드가 넘긴 조각의 크기와 고리의 자리에서 새 크기로 갑니다. 같은 이름의 항목이 같은 순서일 때만 잇습니다.
    let scene = before(card);
    function begin(prev) {
      if (!prev || !prev.inView || !Array.isArray(prev.names) || prev.names.length !== N || prev.names.some((n, k) => n !== items[k].name)) return;
      prev.sizes.forEach((x, k) => { sz[k].x = x; sz[k].v = prev.vel[k] || 0; });
      if (prev.shown >= 0 && prev.shown < N) { shown = prev.shown; off.x = prev.off; off.v = prev.offV; }
      moving = true;
      if (shown !== goal) go(goal);
    }
    keep(card, () => ({ inView, names: items.map((it) => it.name), sizes: sz.map((s) => s.x), vel: sz.map((s) => s.v), shown, off: off.x, offV: off.v }));

    // 재생: 화면에 보일 때만 움직입니다. 갤러리의 되풀이는 마우스 · 포커스로 잠시 멈춥니다.
    const holds = new Set();
    let seen = false, inView = false, took = false, lead = 0, rest = 0, lastStamp = 0, raf = 0, hop = 0;
    const still = (s, e) => Math.abs(s.x) < e && Math.abs(s.v) < e * 20;
    const busy = () => moving || shown !== goal || !still(off, 0.0004) || !still(mk, 0.05);
    const on = () => card.isConnected && inView && (busy() || lead > 0 || (rest > 0 && !holds.size));
    function tick(stamp) {
      raf = 0;
      if (!on()) { lastStamp = 0; return; }
      const dt = lastStamp ? Math.min(64, stamp - lastStamp) : 16;
      lastStamp = stamp;
      if (lead > 0) { lead -= dt; if (lead <= 0) go(goal); }
      else if (busy()) {
        if (wait > 0) wait -= dt;
        if (shown !== goal && wait <= 0) step();
        springTo(off, 0, SET[0], SET[1], dt);
        springTo(mk, 0, POP[0], POP[1], dt);
        if (still(off, 0.0004)) { off.x = 0; off.v = 0; }
        if (still(mk, 0.05)) { mk.x = 0; mk.v = 0; }
        if (moving) {
          let far = false;
          sz.forEach((s, k) => { springTo(s, items[k].share, MOVE[0], MOVE[1], dt); if (Math.abs(s.x - items[k].share) > 0.0005 || Math.abs(s.v) > 0.005) far = true; });
          if (!far) { moving = false; sz.forEach((s, k) => { s.x = items[k].share; s.v = 0; }); }
        }
        if (!busy() && loop && !took) rest = M.ms('rest');
      } else if (rest > 0) {
        rest -= dt;
        if (rest <= 0) { hop++; go((goal + Math.max(1, Math.min(Math.floor(N / 2), hop % 2 ? 2 : 3))) % N); }   // 갤러리: 두세 조각씩 건너 돕니다
      }
      render();
      if (on()) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf && on()) raf = requestAnimationFrame(tick); }
    plot.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') holds.add('hover'); });
    plot.addEventListener('pointerleave', () => { holds.delete('hover'); kick(); });
    foot.addEventListener('focusin', () => { if (foot.querySelector(':focus-visible')) holds.add('focus'); });
    foot.addEventListener('focusout', () => { holds.delete('focus'); kick(); });

    // 조각 찾기: 화면 좌표가 고리 위면 그 조각의 순번, 아니면 -1
    const hit = (cx, cy) => {
      const b = svg.getBoundingClientRect(), dx = cx - b.left - C, dy = cy - b.top - C, dist = Math.hypot(dx, dy);
      if (dist < r0 - 2 || dist > R + 2) return -1;
      let u = ((Math.atan2(dx, -dy) / (2 * Math.PI) - rotNow) % 1 + 1) % 1;
      for (let k = 0; k < N; k++) { if (u < sizes[k]) return k; u -= sizes[k]; }
      return N - 1;
    };
    // 툴팁: 조각을 짚으면 그 조각만 진하게 남기고, 값과 그 값이 합계의 몇 %인지(소수 한 자리) 적습니다. 고리 바깥, 조각이 있는 쪽 옆에 띄워 가운데 숫자를 덮지 않습니다.
    const tips = interact(plot, N, hit,
      (k) => {
        const it = items[k], b = svg.getBoundingClientRect(), um = rotNow + startOf(k, sizes) + sizes[k] / 2, sn = Math.sin(2 * Math.PI * um), cn = Math.cos(2 * Math.PI * um);
        svg.classList.add('is-hover');
        legend.classList.add('is-hover');
        arcs.forEach((p, j) => p.classList.toggle('is-on', j === k));
        items.forEach((x) => x.row.classList.toggle('is-hot', x === it));
        const tb = tipBody({ value: show(f, it.value), note: tx(d, '%1의 %2', show(f, total), pct1(it.share)) }, it.name);
        return { x: b.left + C + (R + 10) * sn, y: b.top + C - (R + 10) * cn, side: sn >= 0 ? 'right' : 'left', label: it.name, value: tb.node, text: tb.text };
      },
      () => { svg.classList.remove('is-hover'); legend.classList.remove('is-hover'); arcs.forEach((p) => p.classList.remove('is-on')); items.forEach((x) => x.row.classList.remove('is-hot')); },
      false, true);
    // 조각을 누르면 그 조각을 짚습니다. 키보드는 화살표로 조각을 옮겨 본 뒤 Enter나 스페이스로 짚습니다.
    plot.addEventListener('click', (e) => { const k = hit(e.clientX, e.clientY); if (k >= 0) choose(k); });
    plot.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && tips.at() >= 0) { e.preventDefault(); choose(tips.at()); } });
    plot.setAttribute('aria-label', tx(d, '%1. %2의 비중은 %3입니다. 좌우 화살표로 항목을 옮깁니다. 모든 값은 이어지는 표에 있습니다.', d.title || '', items[goal].name, pct1(items[goal].share)));

    if (scene) { inView = !!scene.inView; begin(scene); scene = null; }
    onSize(foot, layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (D) layout(); });
    // 화면에 처음 보일 때 움직입니다. 화면 밖에 있는 동안은 멈춰 둡니다.
    const start = () => { if (!seen) { seen = true; if (!live && shown !== goal) lead = M.ms('lead'); else if (loop && !took && !live) rest = M.ms('rest'); } };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => {
        if (!card.isConnected) { io.disconnect(); return; }
        inView = es[es.length - 1].isIntersecting;
        if (!inView && moving) { moving = false; sz.forEach((s, k) => { s.x = items[k].share; s.v = 0; }); render(); }   // 화면 밖에서는 다 옮겨 간 장면으로 둡니다
        if (inView) start();
        kick();
      }, { threshold: 0.3 });
      io.observe(card);
    } else { inView = true; start(); kick(); }
  });
